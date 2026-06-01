import type { AllowlistConfig } from './loader.js';

/**
 * Resolve which OpenAPI spec files to fetch for a search query (max N from allowlist).
 */
export function resolveSpecsForQuery(allowlist: AllowlistConfig, query: string): string[] {
  const router = allowlist.specRouter;
  const max = router?.maxSpecsPerQuery ?? 2;
  const q = query.toLowerCase();
  const matched = new Set<string>();

  for (const route of router?.routes ?? []) {
    const hit = route.keywords.some((kw) => q.includes(kw.toLowerCase()));
    if (hit) {
      for (const spec of route.specs) {
        matched.add(spec);
      }
    }
  }

  // Chain id in query (e.g. tron-mainnet)
  const chainMap = allowlist.tiers.chainGatewayRest.chainToSpec;
  for (const [chain, spec] of Object.entries(chainMap)) {
    if (q.includes(chain) || q.includes(chain.replace(/-mainnet$/, '').replace(/-testnet$/, ''))) {
      matched.add(spec);
    }
  }

  if (matched.size === 0) {
    for (const spec of router?.defaultSpecs ?? allowlist.tiers.core.files.slice(0, 2)) {
      matched.add(spec);
    }
  }

  return [...matched].slice(0, max);
}

/** Map sanitized operationId prefix back to spec filename. */
export function operationIdToSpecFile(operationId: string, loadedSpecs: string[]): string | undefined {
  const direct = loadedSpecs.find((f) => operationId.startsWith(f.replace(/[.-]/g, '_').replace(/\.json$/, '')));
  if (direct) return direct;

  const parts = operationId.split('__');
  if (parts.length < 2) return undefined;
  const prefix = parts[0];

  return loadedSpecs.find((spec) => {
    const sanitized = spec.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '');
    return sanitized === prefix;
  });
}
