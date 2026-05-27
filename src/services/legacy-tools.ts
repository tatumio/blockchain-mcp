import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { TatumApiClient } from '../api-client.js';
import type { ToolDefinition, ToolRegistry } from '../registry/tool-registry.js';
import { GatewayService, GATEWAY_TOOLS } from './gateway.js';
import { DataService, DATA_TOOLS } from './data.js';
import type { ToolExecutionContext } from '../types.js';

export interface LegacyServices {
  apiClient: TatumApiClient;
  gatewayService: GatewayService;
  dataService: DataService;
}

export async function createLegacyServices(apiKey: string): Promise<LegacyServices> {
  const context: ToolExecutionContext = {
    apiKey,
    baseUrl: 'https://api.tatum.io',
    timeout: 30000,
    retryAttempts: 3,
  };
  const apiClient = new TatumApiClient(context);
  const gatewayService = new GatewayService(apiKey);
  await gatewayService.initialize();
  const dataService = new DataService(apiClient);
  return { apiClient, gatewayService, dataService };
}

function formatApiResult(result: { data?: unknown; error?: string; status: number }) {
  return {
    success: !result.error,
    data: result.data ?? null,
    error: result.error ?? null,
    status: result.status,
    endpoint: null,
  };
}

export function registerLegacyTools(registry: ToolRegistry, services: LegacyServices): void {
  const gatewayDefs: ToolDefinition[] = GATEWAY_TOOLS.map((tool) => ({
    name: tool.name,
    description: tool.description ?? tool.name,
    inputSchema: tool.inputSchema as Record<string, unknown>,
    group: 'gateway' as const,
    handler: async (args) => executeGatewayTool(services.gatewayService, tool.name, args),
  }));

  const dataDefs: ToolDefinition[] = DATA_TOOLS.map((tool) => ({
    name: tool.name,
    description: tool.description ?? tool.name,
    inputSchema: tool.inputSchema as Record<string, unknown>,
    group: 'data' as const,
    handler: async (args) => executeDataTool(services.dataService, tool.name, args),
  }));

  registry.registerMany([...gatewayDefs, ...dataDefs]);
}

async function executeGatewayTool(
  gatewayService: GatewayService,
  name: string,
  args: Record<string, unknown>
): Promise<unknown> {
  switch (name) {
    case 'gateway_get_supported_chains':
      return { success: true, data: await gatewayService.getSupportedChains(), error: null, status: 200 };

    case 'gateway_get_supported_methods': {
      if (!args.chain) throw new McpError(ErrorCode.InvalidParams, 'Missing required parameter: chain');
      const url = await gatewayService.getGatewayUrl(String(args.chain));
      if (!url) throw new McpError(ErrorCode.InvalidParams, `Gateway URL not found for chain: ${args.chain}`);
      return { success: true, data: await gatewayService.getAvailableMethods(url), error: null, status: 200 };
    }

    case 'gateway_execute_rpc': {
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
    }

    default:
      throw new McpError(ErrorCode.MethodNotFound, `Unknown gateway tool: ${name}`);
  }
}

async function executeDataTool(
  dataService: DataService,
  name: string,
  args: Record<string, unknown>
): Promise<unknown> {
  let result;
  switch (name) {
    case 'get_metadata':
      if (!args.chain || !args.tokenAddress || !args.tokenIds) {
        throw new McpError(ErrorCode.InvalidParams, 'Missing required parameters: chain, tokenAddress, tokenIds');
      }
      result = await dataService.getMetadata(args);
      break;
    case 'get_wallet_balance_by_time':
      if (!args.chain || !args.addresses) {
        throw new McpError(ErrorCode.InvalidParams, 'Missing required parameters: chain, addresses');
      }
      result = await dataService.getWalletBalanceByTime(args);
      break;
    case 'get_wallet_portfolio':
      if (!args.chain || !args.addresses || !args.tokenTypes) {
        throw new McpError(ErrorCode.InvalidParams, 'Missing required parameters: chain, addresses, tokenTypes');
      }
      result = await dataService.getWalletPortfolio(args);
      break;
    case 'get_owners':
      if (!args.chain || !args.tokenAddress) {
        throw new McpError(ErrorCode.InvalidParams, 'Missing required parameters: chain, tokenAddress');
      }
      result = await dataService.getOwners(args);
      break;
    case 'check_owner':
      if (!args.chain || !args.address || !args.tokenAddress) {
        throw new McpError(ErrorCode.InvalidParams, 'Missing required parameters: chain, address, tokenAddress');
      }
      result = await dataService.checkOwner(args);
      break;
    case 'get_transaction_history':
      if (!args.chain) throw new McpError(ErrorCode.InvalidParams, 'Missing required parameter: chain');
      result = await dataService.getTransactionHistory(args);
      break;
    case 'get_block_by_time':
      if (!args.chain) throw new McpError(ErrorCode.InvalidParams, 'Missing required parameter: chain');
      result = await dataService.getBlockByTime(args);
      break;
    case 'get_tokens':
      if (!args.chain || !args.tokenAddress) {
        throw new McpError(ErrorCode.InvalidParams, 'Missing required parameters: chain, tokenAddress');
      }
      result = await dataService.getTokens(args);
      break;
    case 'check_malicious_address':
      if (!args.address) throw new McpError(ErrorCode.InvalidParams, 'Missing required parameter: address');
      result = await dataService.checkMaliciousAddress(args);
      break;
    case 'get_exchange_rate':
      if (!args.symbol || !args.basePair) {
        throw new McpError(ErrorCode.InvalidParams, 'Missing required parameters: symbol, basePair');
      }
      result = await dataService.getExchangeRate(args);
      break;
    default:
      throw new McpError(ErrorCode.MethodNotFound, `Unknown data tool: ${name}`);
  }
  return formatApiResult(result);
}
