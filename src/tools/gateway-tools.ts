import { TatumConfig } from '../config.js';
import { TatumApiClient } from '../api-client.js';
import { GatewayService } from '../services/gateway.js';

export class GatewayTools {
  private readonly config: TatumConfig;
  private readonly gatewayService: GatewayService;
  private apiClient?: TatumApiClient;

  constructor(config?: TatumConfig, apiClient?: TatumApiClient) {
    this.config = config || TatumConfig.getInstance();
    this.gatewayService = this.config.getGatewayService();
    this.apiClient = apiClient;
  }

  /**
   * Get all supported chains
   */
  public async getSupportedChains(): Promise<string[]> {
    const officialChains = this.gatewayService.getSupportedChains();
    const customChains = this.config.getCustomRpcChains();
    return [...new Set([...officialChains, ...customChains])];
  }

  /**
   * Get the gateway URL for a specific chain
   */
  public async getGatewayUrl(chain: string): Promise<string | undefined> {
    return this.config.getGatewayUrl(chain);
  }

  /**
   * Execute RPC call for a specific chain
   */
  public async executeRpcCall(chain: string, method: string, params: any[] = []): Promise<any> {
    if (!this.apiClient) {
      const apiKey = process.env.TATUM_API_KEY ?? '';
      const context = {
        apiKey,
        baseUrl: this.config.getApiConfig().baseUrl,
        timeout: this.config.getApiConfig().timeout,
        retryAttempts: this.config.getApiConfig().retryAttempts
      };

      this.apiClient = new TatumApiClient(context);
    }

    const response = await this.apiClient.executeRpcCall(chain, method, params);
    return response;
  }

  /**
   * Get supported RPC methods for a specific chain (MOCK IMPLEMENTATION)
   * This is a mock implementation that will be replaced when the actual API is available
   * Future API endpoint: GET https://{chain}.gateway.tatum.io/_methods
   */
  public async getSupportedMethods(chain: string): Promise<any> {
    // Mock implementation - replace with actual API call when available
    const mockResponses: Record<string, any> = {
      'ethereum-mainnet': {
        '/jsonrpc': {
          protocol: 'json-rpc',
          methods: [
            'eth_getBalance',
            'eth_getTransactionByHash',
            'eth_getBlockByNumber',
            'eth_call',
            'eth_sendRawTransaction',
            'eth_gasPrice',
            'eth_estimateGas',
            'debug_traceTransaction'
          ]
        }
      },
      'bitcoin-mainnet': {
        '/jsonrpc': {
          protocol: 'json-rpc',
          methods: [
            'getblockchaininfo',
            'getblock',
            'gettransaction',
            'getrawmempool',
            'sendrawtransaction',
            'estimatesmartfee'
          ]
        }
      },
      'tron-mainnet': {
        '/wallet': {
          protocol: 'rest',
          methods: [
            'POST /getnowblock',
            'POST /getblockbynum',
            'POST /getaccount',
            'POST /gettransactionbyid'
          ]
        },
        '/walletsolidity': {
          protocol: 'rest',
          methods: [
            'POST /getblockbylatestnum',
            'POST /getaccountbyid'
          ]
        },
        '/jsonrpc': {
          protocol: 'json-rpc',
          methods: [
            'buildTransaction',
            'debug_storageRangeAt'
          ]
        }
      },
      'polygon-mainnet': {
        '/jsonrpc': {
          protocol: 'json-rpc',
          methods: [
            'eth_getBalance',
            'eth_getTransactionByHash',
            'eth_getBlockByNumber',
            'eth_call',
            'eth_sendRawTransaction',
            'bor_getAuthor',
            'bor_getCurrentValidators'
          ]
        }
      }
    };

    // Return mock data for known chains, or a generic response for unknown chains
    if (mockResponses[chain]) {
      return mockResponses[chain];
    }

    // Generic response for unknown chains (EVM-compatible by default)
    return {
      '/jsonrpc': {
        protocol: 'json-rpc',
        methods: [
          'eth_getBalance',
          'eth_getTransactionByHash',
          'eth_getBlockByNumber',
          'eth_call',
          'eth_sendRawTransaction',
          'eth_gasPrice',
          'eth_estimateGas'
        ]
      }
    };

    // TODO: Replace with actual API call when available:
    // const gatewayUrl = await this.getGatewayUrl(chain);
    // if (!gatewayUrl) {
    //   throw new Error(`Gateway URL not found for chain: ${chain}`);
    // }
    // const methodsUrl = `${gatewayUrl}/_methods`;
    // const response = await fetch(methodsUrl);
    // return await response.json();
  }
}