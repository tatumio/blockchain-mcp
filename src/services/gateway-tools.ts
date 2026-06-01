import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import type { ToolDefinition, ToolRegistry } from '../registry/tool-registry.js';
import { GatewayService } from './gateway.js';

export async function createGatewayService(apiKey: string): Promise<GatewayService> {
  const gatewayService = new GatewayService(apiKey);
  await gatewayService.initialize();
  return gatewayService;
}

export function registerGatewayTools(
  registry: ToolRegistry,
  gatewayService: GatewayService
): void {
  const defs: ToolDefinition[] = [
    {
      name: 'gateway_discover',
      description:
        'Discover Tatum RPC gateways. Without `chain`, returns all supported network ids. With `chain`, returns available RPC/REST methods for that network (e.g. ethereum-mainnet, tron-mainnet).',
      group: 'gateway',
      inputSchema: {
        type: 'object',
        properties: {
          chain: {
            type: 'string',
            description:
              'Optional network id. If set, returns methods for this chain; if omitted, lists all supported chains.',
          },
        },
      },
      handler: async (args) => {
        const chain = args.chain ? String(args.chain) : undefined;
        if (!chain) {
          const chains = await gatewayService.getSupportedChains();
          return {
            success: true,
            data: { chains, count: chains.length },
            error: null,
            status: 200,
          };
        }
        const url = await gatewayService.getGatewayUrl(chain);
        if (!url) {
          throw new McpError(ErrorCode.InvalidParams, `Gateway URL not found for chain: ${chain}`);
        }
        const methods = await gatewayService.getAvailableMethods(url);
        return {
          success: true,
          data: { chain, gatewayUrl: url, methods },
          error: null,
          status: 200,
        };
      },
    },
    {
      name: 'gateway_execute_rpc',
      description:
        "Execute blockchain RPC or REST calls through Tatum's gateway. Use gateway_discover to list chains and methods. JSON-RPC: method names like eth_getBalance. REST: HTTP method + path like POST /getnowblock.",
      group: 'gateway',
      inputSchema: {
        type: 'object',
        properties: {
          chain: {
            type: 'string',
            description: 'Network id e.g. ethereum-mainnet, bitcoin-mainnet, tron-mainnet',
          },
          method: {
            type: 'string',
            description: "RPC method or REST endpoint (e.g. eth_blockNumber or POST /wallet/getnowblock)",
          },
          params: {
            type: 'array',
            description: 'Method parameters (array for JSON-RPC; object in array for REST query/body)',
            items: {},
            default: [],
          },
        },
        required: ['chain', 'method'],
      },
      handler: async (args) => {
        if (!args.chain || !args.method) {
          throw new McpError(ErrorCode.InvalidParams, 'Missing required parameters: chain, method');
        }
        const result = await gatewayService.executeChainRequest({
          chainName: String(args.chain),
          method: String(args.method),
          params: (args.params as unknown[]) ?? [],
        });
        return {
          success: !result.error,
          data: result.data ?? null,
          error: result.error ?? null,
          status: result.status,
        };
      },
    },
  ];

  registry.registerMany(defs);
}
