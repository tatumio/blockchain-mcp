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
import { GatewayTools } from './tools/gateway-tools.js';


// Load environment variables
dotenv.config();

class TatumMCPServer {
  private readonly server: Server;
  private readonly config: TatumConfig;
  private apiClient?: TatumApiClient;
  private gatewayTools?: GatewayTools;

  constructor() {
    this.config = TatumConfig.getInstance();
    // Gateway tools will be initialized when API client is ready
    this.server = new Server(
      {
        name: '@tatum/blockchain-mcp"',
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

  private async handleGatewayTool(name: string, args: any) {
    try {
      this.gatewayTools ??= new GatewayTools();
      
      const result = await this.executeGatewayTool(name, args);
      
      const formattedResult = this.formatResponseData(result);
      
      return this.buildResponse({
        success: true,
        data: formattedResult,
        error: null,
        status: 200,
        endpoint: null
      });
    } catch (error) {
      return this.buildResponse({
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        status: 500
      });
    }
  }

  private async executeGatewayTool(name: string, args: any): Promise<any> {
    switch (name) {
      case 'gateway_get_supported_chains':
        return await this.gatewayTools!.getSupportedChains();

      case 'gateway_get_url':
        if (!args?.chain) {
          throw new Error('Chain parameter is required');
        }
        return await this.gatewayTools!.getGatewayUrl(args.chain as string);

      case 'gateway_get_supported_methods':
        if (!args?.chain) {
          throw new Error('Chain parameter is required');
        }
        return await this.gatewayTools!.getSupportedMethods(args.chain as string);

      case 'gateway_execute_rpc':
        if (!args?.chain || !args?.method) {
          throw new Error('Chain and method parameters are required');
        }
        return await this.gatewayTools!.executeRpcCall(
          args.chain as string,
          args.method as string,
          (args.params as any[]) ?? []
        );

      default:
        throw new Error(`Unknown gateway tool: ${name}`);
    }
  }

  private async handleRegularTool(name: string, args: any) {
    const toolInfo = this.config.findToolByName(name);
    if (!toolInfo) {
      throw new McpError(ErrorCode.InvalidRequest, `Tool ${name} not found`);
    }

    const feature = this.config.getFeature(toolInfo.featureId);
    if (!feature) {
      throw new McpError(ErrorCode.InternalError, `Feature ${toolInfo.featureId} not found`);
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
      const allTools = this.config.getAllTools();
      
      return {
        tools: allTools.map(({ featureId, tool }) => ({
          name: tool.name,
          description: `[${featureId}] ${tool.description}`,
          inputSchema: tool.parameters
        }))
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      this.apiClient ??= await this.initializeApiClient();

      if (name.startsWith('gateway_')) {
        return this.handleGatewayTool(name, args);
      }

      return this.handleRegularTool(name, args);
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

    const apiConfig = this.config.getApiConfig();
    const context: ToolExecutionContext = {
      apiKey,
      baseUrl: apiConfig.baseUrl,
      timeout: apiConfig.timeout,
      retryAttempts: apiConfig.retryAttempts
    };

    const client = new TatumApiClient(context);
    
    const isConnected = await client.testConnection();
    if (!isConnected) {
      console.warn('Warning: API connection test failed. Tools may not work properly.');
    }

    this.gatewayTools ??= new GatewayTools();
    return client;
  }

  public async start(): Promise<void> {
    const transport = new StdioServerTransport();
    
    console.error('Starting Tatum MCP Server...');
    console.error(`Loaded ${this.config.getAllTools().length} tools from ${this.config.getAllFeatures().size} features`);
    
    await this.server.connect(transport);
    console.error('Tatum MCP Server started successfully');
  }
}

async function main(): Promise<void> {
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