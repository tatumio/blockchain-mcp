#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import * as dotenv from 'dotenv';

import { ToolRegistry } from './registry/tool-registry.js';
import {
  bootstrapOperationIndex,
  resolvePlatformPacksFromEnv,
} from './openapi/loader.js';
import { createLegacyServices, registerLegacyTools } from './services/legacy-tools.js';
import {
  loadPlatformPacks,
  registerOpenApiMetaTools,
  type OpenApiMetaContext,
} from './services/openapi-meta-tools.js';

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
  private openApiCtx?: OpenApiMetaContext;

  constructor() {
    this.mcp = new McpServer(
      {
        name: '@tatumio/blockchain-mcp',
        version: '1.1.0',
      },
      {
        capabilities: {
          tools: {
            listChanged: true,
          },
        },
      }
    );
    this.registry = new ToolRegistry(this.mcp);
  }

  private onOpenApiIndexUpdated(): void {
    this.registry.notifyListChanged();
  }

  public async initialize(): Promise<void> {
    const apiKey = process.env.TATUM_API_KEY!;

    console.error('Initializing legacy gateway + data tools...');
    const legacy = await createLegacyServices(apiKey);
    registerLegacyTools(this.registry, legacy);

    console.error('Loading OpenAPI operation index (Tier 1 core)...');
    const platformPacks = resolvePlatformPacksFromEnv();
    const { index, allowlist } = await bootstrapOperationIndex({ platformPacks });

    this.openApiCtx = {
      index,
      allowlist,
      apiClient: legacy.apiClient,
    };

    registerOpenApiMetaTools(this.registry, this.openApiCtx, () =>
      this.onOpenApiIndexUpdated()
    );

    if (platformPacks.length > 0) {
      console.error(`Platform packs enabled: ${platformPacks.join(', ')}`);
    }

    const stats = index.getStats();
    console.error(
      `OpenAPI index: ${stats.totalOperations} operations from ${stats.specFiles.length} spec(s)`
    );
    console.error(`MCP tools registered: ${this.registry.getToolNames().length}`);
  }

  public async start(): Promise<void> {
    console.error('Starting Tatum MCP Server...');
    await this.initialize();

    const transport = new StdioServerTransport();
    await this.mcp.connect(transport);
    console.error('Tatum MCP Server ready (dynamic tool discovery enabled)');
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
