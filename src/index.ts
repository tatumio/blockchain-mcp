#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import * as dotenv from 'dotenv';

import { OpenApiService } from './openapi/openapi-service.js';
import { ToolRegistry } from './registry/tool-registry.js';
import { createGatewayService, registerGatewayTools } from './services/gateway-tools.js';
import { createApiClient, registerTatumTools } from './services/tatum-tools.js';

function validateEnvironment(): void {
  const missing = ['TATUM_API_KEY'].filter((env) => !process.env[env]);

  if (missing.length > 0) {
    console.error(
      [
        'Missing required environment variables:',
        ...missing.map((env) => `   - ${env}`),
        '',
        'Get your API key at: https://dashboard.tatum.io',
        'Set it using: export TATUM_API_KEY="your-api-key"',
        'Or use CLI: npx @tatumio/blockchain-mcp --api-key your-api-key',
      ].join('\n')
    );
    process.exit(1);
  }
}

class TatumMCPServer {
  private readonly mcp: McpServer;
  private readonly registry: ToolRegistry;
  private readonly openApi = new OpenApiService();

  constructor() {
    this.mcp = new McpServer(
      {
        name: '@tatumio/blockchain-mcp',
        version: '1.2.0',
      },
      {
        capabilities: {
          tools: {
            listChanged: false,
          },
        },
      }
    );
    this.registry = new ToolRegistry(this.mcp);
  }

  public async initialize(): Promise<void> {
    const apiKey = process.env.TATUM_API_KEY!;

    console.error('Loading OpenAPI index (bundled-first)...');
    await this.openApi.initialize();

    const apiClient = createApiClient(apiKey);
    registerTatumTools(this.registry, { openApi: this.openApi, apiClient });

    console.error('Initializing RPC gateway...');
    const gatewayService = await createGatewayService(apiKey);
    registerGatewayTools(this.registry, gatewayService);

    const stats = this.openApi.index.getStats();
    console.error(
      `OpenAPI index ready: ${stats.totalOperations} operations, mode=${this.openApi.getDataMode()}`
    );
    console.error(`MCP tools registered: ${this.registry.getToolNames().join(', ')}`);
  }

  public async start(): Promise<void> {
    console.error('Starting Tatum MCP Server v1.2.0...');
    await this.initialize();

    const transport = new StdioServerTransport();
    await this.mcp.connect(transport);
    console.error('Tatum MCP Server ready');

    this.openApi.startBackgroundBundleRefresh();
  }
}

async function main(): Promise<void> {
  dotenv.config();
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
