#!/usr/bin/env node
/**
 * Downloads allowlisted OpenAPI specs (core + platform) and writes generated/openapi-operations.json
 * Run: npm run generate:openapi-index
 */
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const HTTP_METHODS = new Set(['get', 'post', 'put', 'patch', 'delete']);

function sanitizeForId(value) {
  return value.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '');
}

function buildInputSchema(parameters, requestBody) {
  const properties = {};
  const required = [];
  for (const param of parameters ?? []) {
    const name = param.name;
    const loc = param.in;
    if (!name || !loc) continue;
    const key = loc === 'path' ? name : `${loc}_${name}`;
    properties[key] = { ...(param.schema ?? { type: 'string' }), description: param.description };
    if (param.required) required.push(key);
  }
  if (requestBody?.content?.['application/json']?.schema) {
    properties.body = requestBody.content['application/json'].schema;
    if (requestBody.required) required.push('body');
  }
  return { type: 'object', properties, ...(required.length ? { required } : {}) };
}

function parseSpec(specFile, doc) {
  const specTitle = doc.info?.title ?? specFile;
  const baseUrl = (doc.servers?.[0]?.url ?? 'https://api.tatum.io').replace(/\/$/, '');
  const ops = [];
  for (const [path, methods] of Object.entries(doc.paths ?? {})) {
    for (const [method, operation] of Object.entries(methods)) {
      if (!HTTP_METHODS.has(method)) continue;
      const methodUpper = method.toUpperCase();
      ops.push({
        operationId: `${sanitizeForId(specFile)}__${methodUpper}__${sanitizeForId(path)}`,
        specFile,
        specTitle,
        method: methodUpper,
        path,
        baseUrl,
        summary: operation.summary ?? `${methodUpper} ${path}`,
        description: operation.description ?? '',
        tags: operation.tags ?? [],
        inputSchema: buildInputSchema(operation.parameters, operation.requestBody),
      });
    }
  }
  return ops;
}

async function main() {
  const allowlist = JSON.parse(
    await readFile(join(root, 'config/openapi-allowlist.json'), 'utf-8')
  );
  const core = allowlist.tiers.core.files;
  const platform = allowlist.tiers.platform.defaultEnabled ?? allowlist.tiers.platform.files;
  const files = [...new Set([...core, ...platform])];
  const base = allowlist.openapiBaseUrl;
  const all = [];

  for (const file of files) {
    const url = `${base.replace(/\/$/, '')}/${file}`;
    console.log('Fetching', url);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    const doc = await res.json();
    const ops = parseSpec(file, doc);
    console.log(`  ${ops.length} operations`);
    all.push(...ops);
  }

  const outDir = join(root, 'generated');
  await mkdir(outDir, { recursive: true });
  const outPath = join(outDir, 'openapi-operations.json');
  const generatedAt = new Date().toISOString();
  await writeFile(
    outPath,
    JSON.stringify({ generatedAt, operations: all, specFiles: files }, null, 2)
  );
  console.log(`Wrote ${all.length} operations from ${files.length} specs to ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
