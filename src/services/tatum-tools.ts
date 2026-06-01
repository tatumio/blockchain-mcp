import { TatumApiClient } from '../api-client.js';
import { invokeOpenApiOperation } from '../openapi/invoke.js';
import type { OpenApiService } from '../openapi/openapi-service.js';
import type { ToolDefinition, ToolRegistry } from '../registry/tool-registry.js';
import type { ToolExecutionContext } from '../types.js';

export interface TatumToolsContext {
  openApi: OpenApiService;
  apiClient: TatumApiClient;
}

export function createApiClient(apiKey: string): TatumApiClient {
  const context: ToolExecutionContext = {
    apiKey,
    baseUrl: 'https://api.tatum.io',
    timeout: 30000,
    retryAttempts: 3,
  };
  return new TatumApiClient(context);
}

export function registerTatumTools(registry: ToolRegistry, ctx: TatumToolsContext): void {
  const defs: ToolDefinition[] = [
    {
      name: 'tatum_search_operations',
      description:
        'Search Tatum REST APIs by keyword (path, summary, tags). Loads relevant OpenAPI specs automatically (notifications, NFT, portfolio, Tron, etc.). Returns operationIds for tatum_invoke_operation.',
      group: 'openapi',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search text e.g. subscription, portfolio, nft mint' },
          limit: { type: 'number', description: 'Max results (default 20)' },
          specFile: {
            type: 'string',
            description: 'Optional: restrict to one spec file e.g. notifications-1.json',
          },
        },
        required: ['query'],
      },
      handler: async (args) => {
        const query = String(args.query ?? '');
        const limit = typeof args.limit === 'number' ? args.limit : 20;
        const specFileFilter = args.specFile ? String(args.specFile) : undefined;

        if (!specFileFilter) {
          await ctx.openApi.ensureSpecsForQuery(query);
        } else {
          await ctx.openApi.loadSpecs([specFileFilter], { reason: 'search-filter' });
        }

        const specFiles = specFileFilter ? [specFileFilter] : undefined;
        const results = ctx.openApi.index.search(query, limit, specFiles);
        const status = ctx.openApi.getStatus();

        return {
          success: true,
          data: {
            mode: status.mode,
            results: results.map((op) => ({
              operationId: op.operationId,
              method: op.method,
              path: op.path,
              summary: op.summary,
              specFile: op.specFile,
              tags: op.tags,
              inputSchema: op.inputSchema,
            })),
          },
          error: status.mode === 'cached' && ctx.openApi.getLastNetworkError()
            ? `Using cached OpenAPI index (${status.bundleGeneratedAt ?? 'unknown date'}). Live fetch failed: ${ctx.openApi.getLastNetworkError()}`
            : null,
          status: 200,
        };
      },
    },
    {
      name: 'tatum_invoke_operation',
      description:
        'Invoke a Tatum REST operation by operationId from tatum_search_operations. Pass path/query/body fields as flat args. For gateway REST specs, include chain (e.g. tron-mainnet).',
      group: 'openapi',
      inputSchema: {
        type: 'object',
        properties: {
          operationId: { type: 'string', description: 'operationId from search results' },
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
        let op = ctx.openApi.index.get(operationId);

        if (!op) {
          await ctx.openApi.ensureSpecForOperation(operationId);
          op = ctx.openApi.index.get(operationId);
        }

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
      name: 'tatum_openapi_status',
      description:
        'OpenAPI index status: live vs cached mode, bundle age, loaded specs, operation counts, and in-memory spec cache.',
      group: 'openapi',
      inputSchema: { type: 'object', properties: {} },
      handler: async () => ({
        success: true,
        data: ctx.openApi.getStatus(),
        error: ctx.openApi.getLastNetworkError(),
        status: 200,
      }),
    },
    {
      name: 'tatum_refresh_openapi_cache',
      description:
        'Refresh the OpenAPI index from docs.tatum.io (core + platform specs) and update the offline bundle. Use when you need the latest API definitions.',
      group: 'openapi',
      inputSchema: {
        type: 'object',
        properties: {
          wait: {
            type: 'boolean',
            description: 'If true, wait for refresh to finish (default false — returns immediately if background already running)',
          },
        },
      },
      handler: async (args) => {
        if (args.wait === true) {
          const result = await ctx.openApi.refreshBundleFromNetwork();
          return {
            success: true,
            data: {
              ...result,
              status: ctx.openApi.getStatus(),
            },
            error: null,
            status: 200,
          };
        }

        if (ctx.openApi.getStatus().backgroundRefreshInProgress) {
          return {
            success: true,
            data: { message: 'Background refresh already in progress', status: ctx.openApi.getStatus() },
            error: null,
            status: 200,
          };
        }

        ctx.openApi.startBackgroundBundleRefresh();
        return {
          success: true,
          data: {
            message: 'Background OpenAPI refresh started',
            status: ctx.openApi.getStatus(),
          },
          error: null,
          status: 200,
        };
      },
    },
  ];

  registry.registerMany(defs);
}
