import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadAllowlistConfig, type AllowlistConfig } from './loader.js';
import { parseOpenApiSpec } from './parser.js';
import { OperationIndex } from './operation-index.js';
import { resolveSpecsForQuery, operationIdToSpecFile } from './spec-router.js';
import type { OpenApiDataMode, OpenApiOperation, OpenApiStatus } from './types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

interface SpecCacheEntry {
  fetchedAt: number;
  source: 'bundle' | 'network';
}

export class OpenApiService {
  readonly index = new OperationIndex();
  allowlist!: AllowlistConfig;
  private bundleGeneratedAt: string | null = null;
  private mode: OpenApiDataMode = 'cached';
  private readonly specCache = new Map<string, SpecCacheEntry>();
  private backgroundRefreshInProgress = false;
  private lastNetworkError: string | null = null;

  async initialize(): Promise<void> {
    this.allowlist = await loadAllowlistConfig();
    const loaded = await this.loadFromBundle();
    if (loaded) {
      console.error(
        `OpenAPI: loaded ${this.index.getStats().totalOperations} operations from bundled index`
      );
    } else {
      console.error('OpenAPI: no bundled index found — will populate on first refresh or search');
    }
  }

  getStatus(): OpenApiStatus {
    const stats = this.index.getStats();
    return {
      mode: this.mode,
      bundleGeneratedAt: this.bundleGeneratedAt,
      totalOperations: stats.totalOperations,
      specFiles: stats.specFiles,
      bySpec: stats.bySpec,
      specCache: [...this.specCache.entries()].map(([specFile, entry]) => ({
        specFile,
        fetchedAt: new Date(entry.fetchedAt).toISOString(),
        source: entry.source,
      })),
      backgroundRefreshInProgress: this.backgroundRefreshInProgress,
    };
  }

  getDataMode(): OpenApiDataMode {
    return this.mode;
  }

  getLastNetworkError(): string | null {
    return this.lastNetworkError;
  }

  /** Spec files included in offline bundle refresh (core + default platform). */
  getDefaultBundleFiles(): string[] {
    const core = this.allowlist.tiers.core.files;
    const platform = new Set([
      ...(this.allowlist.tiers.platform.defaultEnabled ?? []),
      ...resolvePlatformPacksFromEnv(),
    ]);
    return [...new Set([...core, ...platform])];
  }

  async ensureSpecsForQuery(query: string): Promise<void> {
    const specs = resolveSpecsForQuery(this.allowlist, query);
    await this.loadSpecs(specs, { reason: 'search' });
  }

  async ensureSpecForOperation(operationId: string): Promise<void> {
    const spec = operationIdToSpecFile(operationId, this.getAllKnownSpecFiles());
    if (spec && !this.index.hasSpec(spec)) {
      await this.loadSpecs([spec], { reason: 'invoke' });
    }
  }

  private getAllKnownSpecFiles(): string[] {
    return [
      ...this.allowlist.tiers.core.files,
      ...this.allowlist.tiers.platform.files,
      ...Object.values(this.allowlist.tiers.chainGatewayRest.chainToSpec),
    ];
  }

  async loadSpecs(
    specFiles: string[],
    options: { reason: string; forceNetwork?: boolean } = { reason: 'manual' }
  ): Promise<{ loaded: string[]; failed: string[] }> {
    const ttl = this.allowlist.specCacheTtlMs ?? 86_400_000;
    const loaded: string[] = [];
    const failed: string[] = [];

    for (const file of specFiles) {
      if (!file) continue;
      const cached = this.specCache.get(file);
      const stale =
        !cached || options.forceNetwork || Date.now() - cached.fetchedAt > ttl;

      if (this.index.hasSpec(file) && !stale && !options.forceNetwork) {
        continue;
      }

      try {
        const doc = await this.fetchSpec(file);
        const operations = parseOpenApiSpec(file, doc);
        if (this.index.hasSpec(file)) {
          this.index.replaceOperationsForSpec(operations, file);
        } else {
          this.index.addOperations(operations, file);
        }
        this.specCache.set(file, { fetchedAt: Date.now(), source: 'network' });
        this.mode = 'live';
        this.lastNetworkError = null;
        loaded.push(file);
        console.error(
          `OpenAPI [${options.reason}]: loaded ${file} (${operations.length} operations)`
        );
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        this.lastNetworkError = msg;
        if (!this.index.hasSpec(file)) {
          failed.push(file);
          console.error(`OpenAPI: failed to fetch ${file}: ${msg}`);
        }
      }
    }

    if (failed.length > 0 && loaded.length === 0) {
      this.mode = 'cached';
    }

    return { loaded, failed };
  }

  /** Non-blocking: refresh default bundle specs from network and write bundle file. */
  startBackgroundBundleRefresh(): void {
    if (this.backgroundRefreshInProgress) return;
    this.backgroundRefreshInProgress = true;

    void this.refreshBundleFromNetwork()
      .catch((err) => {
        console.error(
          'OpenAPI background refresh failed:',
          err instanceof Error ? err.message : err
        );
      })
      .finally(() => {
        this.backgroundRefreshInProgress = false;
      });
  }

  async refreshBundleFromNetwork(): Promise<{
    operations: number;
    specs: string[];
    written: boolean;
  }> {
    const files = this.getDefaultBundleFiles();
    const { loaded } = await this.loadSpecs(files, { reason: 'refresh', forceNetwork: true });

    let written = false;
    if (loaded.length > 0) {
      written = await this.writeBundle();
    }

    return {
      operations: this.index.getStats().totalOperations,
      specs: loaded,
      written,
    };
  }

  private async loadFromBundle(): Promise<boolean> {
    try {
      const bundledPath = join(__dirname, '../../generated/openapi-operations.json');
      const raw = await readFile(bundledPath, 'utf-8');
      const data = JSON.parse(raw) as {
        generatedAt?: string;
        operations?: OpenApiOperation[];
      };
      const operations = data.operations ?? [];
      if (operations.length === 0) return false;

      this.bundleGeneratedAt = data.generatedAt ?? null;
      const byFile = new Map<string, OpenApiOperation[]>();
      for (const op of operations) {
        if (!byFile.has(op.specFile)) byFile.set(op.specFile, []);
        byFile.get(op.specFile)!.push(op);
      }
      for (const [file, ops] of byFile) {
        this.index.addOperations(ops, file);
        this.specCache.set(file, { fetchedAt: Date.now(), source: 'bundle' });
      }
      this.mode = 'cached';
      return true;
    } catch {
      return false;
    }
  }

  private async writeBundle(): Promise<boolean> {
    const stats = this.index.getStats();
    const bundleSpecs = new Set(this.getDefaultBundleFiles());
    const operations: OpenApiOperation[] = [];

    for (const op of this.index.getAllOperations()) {
      if (bundleSpecs.has(op.specFile)) {
        operations.push(op);
      }
    }

    if (operations.length === 0) {
      return false;
    }

    const outDir = join(__dirname, '../../generated');
    await mkdir(outDir, { recursive: true });
    const generatedAt = new Date().toISOString();
    const outPath = join(outDir, 'openapi-operations.json');
    await writeFile(
      outPath,
      JSON.stringify({ generatedAt, operations, specFiles: stats.specFiles }, null, 2)
    );
    this.bundleGeneratedAt = generatedAt;
    console.error(`OpenAPI: wrote ${operations.length} operations to bundled index`);
    return true;
  }

  private async fetchSpec(fileName: string): Promise<Record<string, unknown>> {
    const baseUrl = this.allowlist.openapiBaseUrl;
    const url = `${baseUrl.replace(/\/$/, '')}/${fileName}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} for ${url}`);
    }
    return (await response.json()) as Record<string, unknown>;
  }
}

export function resolvePlatformPacksFromEnv(): string[] {
  const raw = process.env.TATUM_MCP_PLATFORM_PACKS?.trim();
  if (!raw) return [];
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
}
