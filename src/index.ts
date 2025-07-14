#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import * as dotenv from 'dotenv';

import { TatumConfig } from './config.js';
import { TatumApiClient } from './api-client.js';
import { ToolExecutionContext } from './types.js';
import { GatewayService, GATEWAY_TOOLS } from './services/gateway.js';

// Inline environment validation functions
function validateEnvironment(): void {
  const missing = ['TATUM_API_KEY'].filter(env => !process.env[env]);
  
  if (missing.length > 0) {
    console.error([
      'Missing required environment variables:',
      ...missing.map(env => `   - ${env}`),
      '',
      'Get your API key at: https://dashboard.tatum.io',
      'Set it using: export TATUM_API_KEY="your-api-key"',
      'Or use CLI: npx @tatum/blockchain-mcp --api-key your-api-key'
    ].join('\n'));
    process.exit(1);
  }
}

class TatumMCPServer {
  private readonly server: Server;
  private config?: TatumConfig;
  private apiClient?: TatumApiClient;
  private gatewayService?: GatewayService;

  constructor() {
    this.server = new Server(
      {
        name: '@tatum/blockchain-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  private buildResponse(responseObj: any) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(responseObj, null, 2)
        }
      ]
    };
  }

  private async executeGatewayTool(name: string, args: any): Promise<any> {
    // Initialize gateway service if needed
    if (!this.gatewayService) {
      const apiKey = process.env.TATUM_API_KEY;
      this.gatewayService = new GatewayService(apiKey);
      await this.gatewayService.initialize();
    }

    switch (name) {
      case 'gateway_get_supported_chains':
        return await this.gatewayService.getSupportedChains();
      
      case 'gateway_get_supported_methods':
        if (!args.gatewayUrl) {
          throw new McpError(ErrorCode.InvalidParams, 'Missing required parameter: gatewayUrl');
        }
        return await this.gatewayService.getAvailableMethods(args.gatewayUrl);
      
      case 'gateway_execute_rpc':
        if (!args.chain || !args.method) {
          throw new McpError(ErrorCode.InvalidParams, 'Missing required parameters: chain, method');
        }
        const gatewayUrl = await this.gatewayService.getGatewayUrl(args.chain);
        if (!gatewayUrl) {
          throw new McpError(ErrorCode.InvalidParams, `Gateway URL not found for chain: ${args.chain}`);
        }
        return await this.gatewayService.executeRequest({
          gatewayUrl,
          method: args.method,
          body: args.params || []
        });
      
      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown gateway tool: ${name}`);
    }
  }

  private async executeRegularTool(name: string, args: any) {
    const toolInfo = this.config!.findToolByName(name);
    if (!toolInfo) {
      throw new McpError(ErrorCode.InvalidRequest, `Tool ${name} not found`);
    }

    const endpoint = toolInfo.tool.endpoint;
    if (!endpoint) {
      throw new McpError(ErrorCode.InvalidRequest, `No endpoint info found for tool ${name}`);
    }

    try {
      const response = await this.apiClient!.executeRequest(
        endpoint.method,
        endpoint.path,
        args ?? {}
      );

      const formattedData = this.formatResponseData(response.data);

      return this.buildResponse({
        success: !response.error,
        data: formattedData,
        error: response.error,
        status: response.status,
        endpoint: {
          method: endpoint.method,
          path: endpoint.path,
          supportedChains: endpoint.supportedChains
        }
      });
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Tool execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private formatResponseData(data: any): string | null {
    if (!data) {
      return null;
    }
    return typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  }

  private setupHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      // Combine regular tools from config with gateway tools
      const regularTools = this.config!.getAllTools();
      const allTools = [
        ...regularTools.map(({ featureId, tool }) => ({
          name: tool.name,
          description: `[${featureId}] ${tool.description}`,
          inputSchema: tool.parameters
        })),
        ...GATEWAY_TOOLS.map(tool => ({
          name: tool.name,
          description: `[gateway] ${tool.description}`,
          inputSchema: tool.inputSchema
        }))
      ];
      
      return { tools: allTools };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        let result;
        
        if (name.startsWith('gateway_')) {
          // Handle gateway tools
          result = await this.executeGatewayTool(name, args);
          return this.buildResponse({
            success: true,
            data: this.formatResponseData(result),
            error: null,
            status: 200,
            endpoint: null
          });
        } else {
          // Handle regular tools
          this.apiClient ??= await this.initializeApiClient();
          return await this.executeRegularTool(name, args);
        }
      } catch (error) {
        return this.buildResponse({
          success: false,
          data: null,
          error: error instanceof Error ? error.message : 'Unknown error',
          status: 500
        });
      }
    });
  }

  private async initializeApiClient(): Promise<TatumApiClient> {
    const apiKey = process.env.TATUM_API_KEY;
    
    if (!apiKey) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        'TATUM_API_KEY environment variable is required'
      );
    }

    const context: ToolExecutionContext = {
      apiKey,
      baseUrl: 'https://api.tatum.io',
      timeout: 30000,
      retryAttempts: 3
    };

    const client = new TatumApiClient(context);
    
    return client;
  }

  public async start(): Promise<void> {
    // Initialize config
    console.error('Starting Tatum MCP Server...');
    
    this.config = new TatumConfig();
    
    const transport = new StdioServerTransport();
    
    const regularToolCount = this.config.getAllTools().length;
    const totalToolCount = regularToolCount + GATEWAY_TOOLS.length;
    console.error(`Loaded ${totalToolCount} tools (${regularToolCount} regular + ${GATEWAY_TOOLS.length} gateway)`);
    
    await this.server.connect(transport);
    console.error('Tatum MCP Server ready');
  }
}

async function main(): Promise<void> {
  // Load environment variables first
  dotenv.config();
  
  // Validate environment before starting server
  validateEnvironment();
  
  try {
    const server = new TatumMCPServer();
    await server.start();
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

process.on('SIGINT', () => {
  console.error('Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.error('Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}