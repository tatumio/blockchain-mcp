import { z } from 'zod';

type JsonSchema = Record<string, unknown>;

/**
 * Converts MCP-style JSON Schema tool inputSchema to a Zod raw shape
 * for @modelcontextprotocol/sdk registerTool (v1.x).
 */
export function jsonSchemaToZodShape(
  schema: JsonSchema
): Record<string, z.ZodTypeAny> {
  if (schema.type !== 'object') {
    return {};
  }

  const properties = (schema.properties ?? {}) as Record<string, JsonSchema>;
  const required = new Set((schema.required as string[] | undefined) ?? []);
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const [key, prop] of Object.entries(properties)) {
    let field = jsonPropertyToZod(prop);
    if (!required.has(key)) {
      field = field.optional();
    }
    shape[key] = field;
  }

  return shape;
}

function jsonPropertyToZod(prop: JsonSchema): z.ZodTypeAny {
  if (prop.enum && Array.isArray(prop.enum)) {
    const values = prop.enum as [string, ...string[]];
    if (values.every((v) => typeof v === 'string')) {
      return z.enum(values);
    }
  }

  const type = prop.type as string | undefined;

  switch (type) {
    case 'string':
      return z.string();
    case 'number':
    case 'integer':
      return z.number();
    case 'boolean':
      return z.boolean();
    case 'array':
      return z.array(z.unknown());
    case 'object':
      if (prop.properties) {
        return z.object(jsonSchemaToZodShape(prop));
      }
      return z.record(z.unknown());
    default:
      return z.unknown();
  }
}
