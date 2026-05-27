import type { AllowlistConfig } from '../openapi/loader.js';
import { loadSpecsIntoIndex, resolveChainSpec } from '../openapi/loader.js';
import { invokeOpenApiOperation } from '../openapi/invoke.js';
import type { OperationIndex } from '../openapi/operation-index.js';
import type { ToolDefinition, ToolRegistry } from '../registry/tool-registry.js';
import type { TatumApiClient } from '../api-client.js';

export interface OpenApiMetaContext {
  index: OperationIndex;
  allowlist: AllowlistConfig;
  apiClient: TatumApiClient;
}

export function registerOpenApiMetaTools(
  registry: ToolRegistry,
  ctx: OpenApiMetaContext,
  onIndexUpdated?: () => void
): void {
  const defs: ToolDefinition[] = [
    {
      name: 'tatum_list_api_catalog',
      description:
        'List loaded OpenAPI spec files and operation counts. Use before search to see which API packs are available.',
      group: 'openapi',
      inputSchema: { type: 'object', properties: {} },
      handler: async () => ({
        success: true,
        data: ctx.index.getStats(),
        error: null,
        status: 200,
      }),
    },
    {
      name: 'tatum_search_operations',
      description:
        'Search the Tatum OpenAPI operation index by keyword (path, summary, tags). Returns operationIds for tatum_invoke_operation. Example queries: "subscription", "portfolio", "nft mint", "gateway endpoint".',
      group: 'openapi',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search text' },
          limit: { type: 'number', description: 'Max results (default 20)' },
          specFile: {
            type: 'string',
            description: 'Optional: filter to one spec file e.g. notifications-1.json',
          },
        },
        required: ['query'],
      },
      handler: async (args) => {
        const query = String(args.query ?? '');
        const limit = typeof args.limit === 'number' ? args.limit : 20;
        const specFiles = args.specFile ? [String(args.specFile)] : undefined;
        const results = ctx.index.search(query, limit, specFiles);
        return {
          success: true,
          data: results.map((op) => ({
            operationId: op.operationId,
            method: op.method,
            path: op.path,
            summary: op.summary,
            specFile: op.specFile,
            tags: op.tags,
            inputSchema: op.inputSchema,
          })),
          error: null,
          status: 200,
        };
      },
    },
    {
      name: 'tatum_invoke_operation',
      description:
        'Invoke any indexed Tatum REST operation by operationId (from tatum_search_operations). Pass path/query/body fields as flat args. For gateway REST specs, include "chain" (e.g. tron-mainnet).',
      group: 'openapi',
      inputSchema: {
        type: 'object',
        properties: {
          operationId: { type: 'string', description: 'Stable operation id from search results' },
          chain: {
            type: 'string',
            description: 'Required for templated gateway hosts (tron-mainnet, stellar-mainnet, etc.)',
          },
        },
        required: ['operationId'],
        additionalProperties: true,
      },
      handler: async (args) => {
        const operationId = String(args.operationId);
        const op = ctx.index.get(operationId);
        if (!op) {
          return {
            success: false,
            data: null,
            error: `Unknown operationId: ${operationId}. Run tatum_search_operations first.`,
            status: 404,
          };
        }
        const { operationId: _id, ...invokeArgs } = args;
        const result = await invokeOpenApiOperation(ctx.apiClient, op, invokeArgs);
        return {
          success: !result.error,
          data: result.data ?? null,
          error: result.error ?? null,
          status: result.status,
          endpoint: `${op.method} ${op.path}`,
        };
      },
    },
    {
      name: 'gateway_enable_chain_api',
      description:
        'Dynamically load REST API operations for a chain (Tron HTTP, Stellar Horizon, TON, Cardano Rosetta, etc.) into the searchable catalog. Sends tools/list_changed to the client.',
      group: 'openapi',
      inputSchema: {
        type: 'object',
        properties: {
          chain: {
            type: 'string',
            description: 'Chain id e.g. tron-mainnet, stellar-mainnet, ton-mainnet',
          },
        },
        required: ['chain'],
      },
      handler: async (args) => {
        const chain = String(args.chain);
        const specFile = resolveChainSpec(ctx.allowlist, chain);
        if (!specFile) {
          return {
            success: false,
            data: null,
            error: `No REST API pack for chain: ${chain}. Use gateway_execute_rpc for JSON-RPC chains.`,
            status: 404,
          };
        }
        if (ctx.index.hasSpec(specFile)) {
          return {
            success: true,
            data: { message: `Already loaded: ${specFile}`, specFile, chain },
            error: null,
            status: 200,
          };
        }
        await loadSpecsIntoIndex(ctx.index, [specFile], ctx.allowlist);
        onIndexUpdated?.();
        return {
          success: true,
          data: {
            message: `Loaded REST API pack for ${chain}`,
            specFile,
            operationsAdded: ctx.index.getStats().bySpec[specFile] ?? 0,
          },
          error: null,
          status: 200,
        };
      },
    },
  ];

  registry.registerMany(defs);
}

export async function loadPlatformPacks(
  ctx: OpenApiMetaContext,
  packFiles: string[],
  onIndexUpdated?: () => void
): Promise<string[]> {
  const toLoad = packFiles.filter((f) => !ctx.index.hasSpec(f));
  if (toLoad.length === 0) return [];
  await loadSpecsIntoIndex(ctx.index, toLoad, ctx.allowlist);
  onIndexUpdated?.();
  return toLoad;
}
