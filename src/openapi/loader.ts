import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseOpenApiSpec } from './parser.js';
import { OperationIndex } from './operation-index.js';
import type { OpenApiOperation } from './types.js';

export interface AllowlistConfig {
  version: string;
  openapiBaseUrl: string;
  tiers: {
    core: { files: string[] };
    platform: { files: string[]; defaultEnabled?: string[] };
    chainGatewayRest: { chainToSpec: Record<string, string> };
  };
}

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function loadAllowlistConfig(): Promise<AllowlistConfig> {
  const configPath = join(__dirname, '../../config/openapi-allowlist.json');
  const raw = await readFile(configPath, 'utf-8');
  return JSON.parse(raw) as AllowlistConfig;
}

async function fetchSpec(baseUrl: string, fileName: string): Promise<Record<string, unknown>> {
  const url = `${baseUrl.replace(/\/$/, '')}/${fileName}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: HTTP ${response.status}`);
  }
  return (await response.json()) as Record<string, unknown>;
}

async function loadBundledIndex(): Promise<OpenApiOperation[] | null> {
  try {
    const bundledPath = join(__dirname, '../../generated/openapi-operations.json');
    const raw = await readFile(bundledPath, 'utf-8');
    const data = JSON.parse(raw) as { operations?: OpenApiOperation[] };
    return data.operations ?? null;
  } catch {
    return null;
  }
}

export async function loadSpecsIntoIndex(
  index: OperationIndex,
  specFiles: string[],
  allowlist: AllowlistConfig
): Promise<void> {
  const toLoad = specFiles.filter((f) => !index.hasSpec(f));
  if (toLoad.length === 0) return;

  for (const file of toLoad) {
    console.error(`Loading OpenAPI spec: ${file}...`);
    const doc = await fetchSpec(allowlist.openapiBaseUrl, file);
    const operations = parseOpenApiSpec(file, doc);
    index.addOperations(operations, file);
    console.error(`  → ${operations.length} operations indexed`);
  }
}

export async function bootstrapOperationIndex(
  options: {
    platformPacks?: string[];
    chainSpecs?: string[];
  } = {}
): Promise<{ index: OperationIndex; allowlist: AllowlistConfig }> {
  const allowlist = await loadAllowlistConfig();
  const index = new OperationIndex();

  const bundled = await loadBundledIndex();
  if (bundled?.length) {
    const byFile = new Map<string, OpenApiOperation[]>();
    for (const op of bundled) {
      if (!byFile.has(op.specFile)) byFile.set(op.specFile, []);
      byFile.get(op.specFile)!.push(op);
    }
    for (const [file, ops] of byFile) {
      index.addOperations(ops, file);
    }
    console.error(`Loaded ${bundled.length} operations from bundled index`);
  }

  const coreFiles = allowlist.tiers.core.files;
  await loadSpecsIntoIndex(index, coreFiles, allowlist);

  const platformFiles = new Set<string>([
    ...(allowlist.tiers.platform.defaultEnabled ?? []),
    ...(options.platformPacks ?? []),
  ]);
  if (platformFiles.size > 0) {
    await loadSpecsIntoIndex(index, [...platformFiles], allowlist);
  }

  if (options.chainSpecs?.length) {
    const unique = [...new Set(options.chainSpecs)];
    await loadSpecsIntoIndex(index, unique, allowlist);
  }

  return { index, allowlist };
}

export function resolvePlatformPacksFromEnv(): string[] {
  const raw = process.env.TATUM_MCP_PLATFORM_PACKS?.trim();
  if (!raw) return [];
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
}

export function resolveChainSpec(
  allowlist: AllowlistConfig,
  chain: string
): string | undefined {
  return allowlist.tiers.chainGatewayRest.chainToSpec[chain];
}
