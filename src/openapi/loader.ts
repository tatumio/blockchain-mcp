import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export interface SpecRouterRoute {
  keywords: string[];
  specs: string[];
}

export interface AllowlistConfig {
  version: string;
  openapiBaseUrl: string;
  specCacheTtlMs?: number;
  tiers: {
    core: { files: string[] };
    platform: { files: string[]; defaultEnabled?: string[] };
    chainGatewayRest: { chainToSpec: Record<string, string> };
  };
  specRouter?: {
    maxSpecsPerQuery?: number;
    routes?: SpecRouterRoute[];
    defaultSpecs?: string[];
  };
  excludePatterns?: string[];
}

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function loadAllowlistConfig(): Promise<AllowlistConfig> {
  const configPath = join(__dirname, '../../config/openapi-allowlist.json');
  const raw = await readFile(configPath, 'utf-8');
  return JSON.parse(raw) as AllowlistConfig;
}

export function resolveChainSpec(
  allowlist: AllowlistConfig,
  chain: string
): string | undefined {
  return allowlist.tiers.chainGatewayRest.chainToSpec[chain];
}
