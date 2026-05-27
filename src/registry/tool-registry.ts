import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { RegisteredTool } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { jsonSchemaToZodShape } from './json-schema-to-zod.js';

export type ToolHandler = (args: Record<string, unknown>) => Promise<unknown>;

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  handler: ToolHandler;
  /** MCP tool group for logging */
  group?: 'gateway' | 'data' | 'openapi' | 'legacy';
}

export class ToolRegistry {
  private readonly mcp: McpServer;
  private readonly registered = new Map<string, RegisteredTool>();

  constructor(mcp: McpServer) {
    this.mcp = mcp;
  }

  register(def: ToolDefinition): RegisteredTool {
    if (this.registered.has(def.name)) {
      throw new Error(`Tool already registered: ${def.name}`);
    }

    const prefix = def.group ? `[${def.group}] ` : '';
    const zodShape = jsonSchemaToZodShape(def.inputSchema);
    const inputSchema =
      def.inputSchema.additionalProperties === true
        ? z.object(zodShape).passthrough()
        : zodShape;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tool = (this.mcp.registerTool as any)(
      def.name,
      {
        description: `${prefix}${def.description}`,
        inputSchema,
      },
      async (args: Record<string, unknown>) => {
        try {
          const result = await def.handler(args);
          return formatToolResult(result);
        } catch (error) {
          return formatToolError(error);
        }
      }
    ) as RegisteredTool;

    this.registered.set(def.name, tool);
    return tool;
  }

  registerMany(defs: ToolDefinition[]): void {
    for (const def of defs) {
      this.register(def);
    }
  }

  notifyListChanged(): void {
    if (this.mcp.isConnected()) {
      this.mcp.sendToolListChanged();
    }
  }

  getToolNames(): string[] {
    return [...this.registered.keys()].sort();
  }
}

export function formatToolResult(result: unknown) {
  const payload =
    result !== null &&
    typeof result === 'object' &&
    'success' in (result as object)
      ? result
      : {
          success: true,
          data: typeof result === 'string' ? result : result,
          error: null,
          status: 200,
        };

  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(payload, null, 2),
      },
    ],
  };
}

export function formatToolError(error: unknown) {
  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(
          {
            success: false,
            data: null,
            error: error instanceof Error ? error.message : 'Unknown error',
            status: 500,
          },
          null,
          2
        ),
      },
    ],
    isError: true,
  };
}
