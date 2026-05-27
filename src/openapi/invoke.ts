import { TatumApiClient } from '../api-client.js';
import type { OpenApiOperation } from './types.js';

function substitutePath(path: string, pathParams: Record<string, string>): string {
  let result = path;
  for (const [key, value] of Object.entries(pathParams)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), encodeURIComponent(value));
  }
  return result;
}

function extractPathParams(
  op: OpenApiOperation,
  args: Record<string, unknown>
): { pathParams: Record<string, string>; rest: Record<string, unknown> } {
  const pathParams: Record<string, string> = {};
  const rest = { ...args };

  const pathParamNames = [...op.path.matchAll(/\{([^}]+)\}/g)].map((m) => m[1]);

  for (const name of pathParamNames) {
    if (rest[name] !== undefined && rest[name] !== null) {
      pathParams[name] = String(rest[name]);
      delete rest[name];
    }
  }

  // Also accept path_* keys from schema
  for (const key of Object.keys(rest)) {
    if (key.startsWith('path_')) {
      const paramName = key.slice(5);
      if (pathParamNames.includes(paramName)) {
        pathParams[paramName] = String(rest[key]);
        delete rest[key];
      }
    }
  }

  return { pathParams, rest };
}

function resolveInvokeUrl(op: OpenApiOperation, chain?: string): string {
  if (!op.baseUrl.includes('{')) {
    return op.baseUrl;
  }
  if (!chain) {
    throw new Error(
      `Operation ${op.operationId} requires a gateway host. Pass "chain" (e.g. tron-mainnet) or use gateway_execute_rpc.`
    );
  }
  // e.g. https://{network-tron}.gateway.tatum.io → tron-mainnet → tron
  const networkKey = op.baseUrl.match(/\{network-([^}]+)\}/)?.[1];
  if (networkKey) {
    const slug = chain.replace(/-mainnet$/, '').replace(/-testnet$/, '');
    return op.baseUrl.replace(/\{network-[^}]+\}/, slug);
  }
  return op.baseUrl;
}

export async function invokeOpenApiOperation(
  apiClient: TatumApiClient,
  op: OpenApiOperation,
  args: Record<string, unknown>
): Promise<ReturnType<TatumApiClient['executeRequest']>> {
  const chain = args.chain as string | undefined;
  delete args.chain;

  const { pathParams, rest } = extractPathParams(op, args);

  let urlPath = substitutePath(op.path, pathParams);

  const queryParams: Record<string, unknown> = {};
  let body: Record<string, unknown> | undefined;

  for (const [key, value] of Object.entries(rest)) {
    if (key === 'body') {
      body = value as Record<string, unknown>;
    } else if (key.startsWith('query_')) {
      queryParams[key.slice(6)] = value;
    } else if (!key.startsWith('header_')) {
      queryParams[key] = value;
    }
  }

  const baseUrl = resolveInvokeUrl(op, chain);
  const isApiTatum = baseUrl.startsWith('https://api.tatum.io');

  if (isApiTatum) {
    if (baseUrl.includes('/v4/manage')) {
      const managePrefix = '/v4/manage';
      if (!urlPath.startsWith(managePrefix)) {
        urlPath = `${managePrefix}${urlPath.startsWith('/') ? urlPath : `/${urlPath}`}`;
      }
    }
    // TatumApiClient uses baseURL https://api.tatum.io — pass path only
    const fullPath =
      queryParams && Object.keys(queryParams).length > 0
        ? { ...queryParams }
        : {};
    if (body !== undefined) {
      return apiClient.executeRequest(op.method, urlPath, { ...body, ...fullPath });
    }
    return apiClient.executeRequest(op.method, urlPath, fullPath);
  }

  // Custom base (gateway REST or /v4/manage): full URL fetch
  let url = `${baseUrl.replace(/\/$/, '')}${urlPath.startsWith('/') ? urlPath : `/${urlPath}`}`;
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(queryParams)) {
    if (v !== undefined && v !== null) qs.append(k, String(v));
  }
  if (qs.toString()) {
    url += (url.includes('?') ? '&' : '?') + qs.toString();
  }

  const apiKey = process.env.TATUM_API_KEY ?? '';
  const init: RequestInit = {
    method: op.method,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
    },
  };
  if (body && ['POST', 'PUT', 'PATCH'].includes(op.method)) {
    init.body = JSON.stringify(body);
  }

  const response = await fetch(url, init);
  const text = await response.text();
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  return {
    data,
    status: response.status,
    statusText: response.statusText,
    ...(response.ok ? {} : { error: typeof data === 'object' && data && 'message' in data ? String((data as { message: string }).message) : response.statusText }),
  };
}
