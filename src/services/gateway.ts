import { Gateway, GatewayChain, ExternalBlockchain, TatumApiResponse } from '../types.js';

// Gateway tool definitions - these belong with the gateway service
export const GATEWAY_TOOLS = [
  {
    name: 'gateway_get_supported_chains',
    description: "Get a list of all supported blockchain networks available through Tatum's RPC gateways",
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'gateway_get_supported_methods',
    description: 'Get supported RPC methods for a specific blockchain chain',
    inputSchema: {
      type: 'object',
      properties: {
        gatewayUrl: {
          type: 'string',
          description: 'The gateway URL to get methods for'
        }
      },
      required: ['gatewayUrl']
    }
  },
  {
    name: 'gateway_execute_rpc',
    description: "Execute blockchain RPC calls through Tatum's gateway infrastructure. Supports both JSON-RPC and REST API calls depending on the blockchain. For JSON-RPC methods, use simple method names like 'getblockcount' or 'eth_getBalance'. For REST calls, use full HTTP method and path like 'POST /getnowblock'. Parameters should be provided as an array for JSON-RPC or object for REST calls.",
    inputSchema: {
      type: 'object',
      properties: {
        chain: {
          type: 'string',
          description: "The blockchain network identifier. Examples: 'bitcoin-mainnet', 'ethereum-mainnet', 'litecoin-mainnet', 'polygon-mainnet', 'tron-mainnet', 'bsc-mainnet'. Use gateway_get_supported_chains to see all available networks.",
          examples: ['bitcoin-mainnet', 'ethereum-mainnet', 'litecoin-mainnet', 'polygon-mainnet']
        },
        method: {
          type: 'string',
          description: "The RPC method or REST endpoint to call. For JSON-RPC: use method names like 'getblockcount', 'getbestblockhash', 'eth_getBalance', 'eth_blockNumber'. For REST: use HTTP method + path like 'POST /getnowblock', 'GET /getinfo'. The gateway will automatically detect the protocol based on the format. Use gateway_get_supported_methods to see all available methods.",
          examples: ['getblockcount', 'getbestblockhash', 'eth_getBalance', 'POST /getnowblock']
        },
        params: {
          type: 'array',
          description: "Parameters for the RPC method. For JSON-RPC: provide as array (e.g., ['0x742d35Cc6074C4532895c05b22629ce5b3c28da4', 'latest'] for eth_getBalance). For REST: provide as array with single object element. Leave empty array [] if no parameters needed.",
          items: {},
          default: []
        }
      },
      required: ['chain', 'method']
    }
  }
];

export class GatewayService {
  private cachedGateways: Gateway[] = [];
  private cachedChains: string[] = [];
  private methodsCache: Map<string, any> = new Map();
  private dataFetched = false;
  private readonly BLOCKCHAINS_URL = 'https://blockchains.tatum.io/blockchains.json';
  private readonly apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.TATUM_API_KEY || '';
  }

  /**
   * Initialize the service by fetching blockchain data from external API
   */
  public async initialize(): Promise<void> {
    if (this.dataFetched) {
      return;
    }

    try {
      console.error('Fetching blockchain data from Tatum API...');
      const response = await fetch(this.BLOCKCHAINS_URL);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const externalBlockchains: ExternalBlockchain[] = await response.json();
      
      // Transform external data to internal format
      this.cachedGateways = this.transformToGateways(externalBlockchains);
      this.cachedChains = this.extractChainNames(externalBlockchains);
      
      this.dataFetched = true;
      console.error(`Loaded ${this.cachedChains.length} networks from ${this.cachedGateways.length} blockchains`);
    } catch (error) {
      console.error('Failed to fetch blockchain data:', error instanceof Error ? error.message : 'Unknown error');
      
      // Fallback to empty data
      this.cachedGateways = [];
      this.cachedChains = [];
      this.dataFetched = true;
      
      throw new Error(`Failed to initialize GatewayService: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all available blockchain networks
   */
  public async getAvailableChains(): Promise<Gateway[]> {
    await this.ensureDataLoaded();
    return [...this.cachedGateways]; // Return a copy to prevent mutation
  }

  /**
   * Get supported chains as string array
   */
  public async getSupportedChains(): Promise<string[]> {
    await this.ensureDataLoaded();
    return [...this.cachedChains]; // Return a copy to prevent mutation
  }

  /**
   * Get gateway URL for a specific chain
   */
  public async getGatewayUrl(chainName: string): Promise<string | undefined> {
    await this.ensureDataLoaded();
    
    for (const gateway of this.cachedGateways) {
      const chain = gateway.chains.find(c => c.chain === chainName || c.gatewayName === chainName);
      if (chain) {
        return chain.gatewayUrl;
      }
    }
    return undefined;
  }

  /**
   * Get available methods for a specific gateway
   */
  public async getAvailableMethods(gatewayUrl: string): Promise<any> {
    // Check cache first
    if (this.methodsCache.has(gatewayUrl)) {
      return this.methodsCache.get(gatewayUrl);
    }

    try {
      const response = await fetch(`${gatewayUrl}/_methods`, {
        headers: {
          'X-API-Key': this.apiKey,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Methods endpoint not available: ${response.status}`);
      }

      const methods = await response.json();
      this.methodsCache.set(gatewayUrl, methods);
      return methods;
    } catch (error) {
      throw new Error(`Failed to fetch methods: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Execute RPC or REST request to gateway
   */
  public async executeRequest({
    gatewayUrl,
    method,
    body
  }: {
    gatewayUrl: string;
    method: string;
    body?: any;
  }): Promise<TatumApiResponse> {
    try {
      // Simple check: if method contains a space, assume it's a REST call (e.g., "POST /path").
      // Otherwise, assume it's a JSON-RPC call.
      if (method.includes(' ')) {
        return await this.executeRestRequest(gatewayUrl, method, body);
      } else {
        return await this.executeJsonRpcRequest(gatewayUrl, method, body);
      }
    } catch (error: any) {
      return {
        error: error.message || 'Request failed',
        status: error.status || 500,
        statusText: error.statusText || 'Error'
      };
    }
  }

  /**
   * Execute JSON-RPC request
   */
  private async executeJsonRpcRequest(url: string, method: string, params: any[] = []): Promise<TatumApiResponse> {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method,
        params
      })
    });

    const data = await response.json();
    return {
      data,
      status: response.status,
      statusText: response.statusText
    };
  }

  /**
   * Execute REST request
   */
  private async executeRestRequest(baseUrl: string, methodPath: string, body?: any): Promise<TatumApiResponse> {
    const [httpMethod, restPath] = methodPath.includes(' ') 
      ? methodPath.split(' ') 
      : ['POST', methodPath];

    const url = `${baseUrl}${restPath}`;
    
    const response = await fetch(url, {
      method: httpMethod.toUpperCase(),
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey
      },
      body: httpMethod.toUpperCase() === 'POST' ? JSON.stringify(body) : undefined
    });

    const data = await response.json();
    return {
      data,
      status: response.status,
      statusText: response.statusText
    };
  }

  /**
   * Transform external blockchain data to internal Gateway format
   */
  private transformToGateways(externalBlockchains: ExternalBlockchain[]): Gateway[] {
    return externalBlockchains.map(blockchain => ({
      name: blockchain.name,
      docs: blockchain.docs,
      chains: blockchain.chains.map(chain => ({
        chain: chain.chain,
        gatewayName: chain.gatewayName,
        gatewayUrl: chain.gatewayUrl
      }))
    }));
  }

  /**
   * Extract all chain names from external blockchain data
   */
  private extractChainNames(externalBlockchains: ExternalBlockchain[]): string[] {
    const chains: string[] = [];
    for (const blockchain of externalBlockchains) {
      for (const chain of blockchain.chains) {
        chains.push(chain.gatewayName);
      }
    }
    return chains;
  }

  /**
   * Ensure data is loaded before operations
   */
  private async ensureDataLoaded(): Promise<void> {
    if (!this.dataFetched) {
      await this.initialize();
    }
  }


}