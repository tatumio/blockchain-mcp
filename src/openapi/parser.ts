import type { OpenApiOperation } from './types.js';

const HTTP_METHODS = new Set(['get', 'post', 'put', 'patch', 'delete']);

function sanitizeForId(value: string): string {
  return value.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '');
}

function resolveBaseUrl(servers: Array<{ url?: string }> | undefined): string {
  const raw = servers?.[0]?.url ?? 'https://api.tatum.io';
  // Product specs use fixed hosts; templated gateway hosts are resolved at invoke time.
  if (raw.includes('{')) {
    return raw;
  }
  return raw.replace(/\/$/, '');
}

function buildInputSchema(
  parameters: Array<Record<string, unknown>> | undefined,
  requestBody: Record<string, unknown> | undefined
): Record<string, unknown> {
  const properties: Record<string, unknown> = {};
  const required: string[] = [];

  for (const param of parameters ?? []) {
    const name = param.name as string;
    const loc = param.in as string;
    if (!name || !loc) continue;

    const key = loc === 'path' ? name : `${loc}_${name}`;
    const schema = (param.schema as Record<string, unknown>) ?? { type: 'string' };
    properties[key] = {
      ...schema,
      description: [
        param.description as string | undefined,
        loc === 'path' ? '(path parameter)' : loc === 'query' ? '(query parameter)' : `(${loc})`,
      ]
        .filter(Boolean)
        .join(' '),
    };
    if (param.required) {
      required.push(key);
    }
  }

  if (requestBody) {
    const content = requestBody.content as Record<string, { schema?: Record<string, unknown> }> | undefined;
    const jsonSchema = content?.['application/json']?.schema;
    if (jsonSchema) {
      properties.body = {
        ...jsonSchema,
        description: 'Request body (JSON)',
      };
      if (requestBody.required) {
        required.push('body');
      }
    }
  }

  return {
    type: 'object',
    properties,
    ...(required.length > 0 ? { required } : {}),
  };
}

export function parseOpenApiSpec(
  specFile: string,
  doc: Record<string, unknown>
): OpenApiOperation[] {
  const info = doc.info as { title?: string } | undefined;
  const specTitle = info?.title ?? specFile;
  const baseUrl = resolveBaseUrl(doc.servers as Array<{ url?: string }> | undefined);
  const paths = (doc.paths ?? {}) as Record<string, Record<string, Record<string, unknown>>>;
  const operations: OpenApiOperation[] = [];

  for (const [path, methods] of Object.entries(paths)) {
    for (const [method, operation] of Object.entries(methods)) {
      if (!HTTP_METHODS.has(method.toLowerCase())) continue;

      const op = operation as Record<string, unknown>;
      const methodUpper = method.toUpperCase();
      const operationId =
        (op.operationId as string | undefined) ??
        `${specFile}::${methodUpper}::${path}`;

      const stableId = `${sanitizeForId(specFile)}__${methodUpper}__${sanitizeForId(path)}`;

      operations.push({
        operationId: stableId,
        specFile,
        specTitle,
        method: methodUpper,
        path,
        baseUrl,
        summary: (op.summary as string) ?? `${methodUpper} ${path}`,
        description: (op.description as string) ?? '',
        tags: (op.tags as string[]) ?? [],
        inputSchema: buildInputSchema(
          op.parameters as Array<Record<string, unknown>> | undefined,
          op.requestBody as Record<string, unknown> | undefined
        ),
      });
    }
  }

  return operations;
}
