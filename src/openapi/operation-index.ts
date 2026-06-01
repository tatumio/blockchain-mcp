import type { OpenApiOperation, OperationIndexStats } from './types.js';

export class OperationIndex {
  private readonly byId = new Map<string, OpenApiOperation>();
  private readonly all: OpenApiOperation[] = [];
  private loadedSpecs = new Set<string>();

  addOperations(operations: OpenApiOperation[], specFile: string): void {
    this.loadedSpecs.add(specFile);
    for (const op of operations) {
      this.byId.set(op.operationId, op);
      this.all.push(op);
    }
  }

  /** Replace all operations for a spec (used when refreshing from network). */
  replaceOperationsForSpec(operations: OpenApiOperation[], specFile: string): void {
    const filtered = this.all.filter((op) => op.specFile !== specFile);
    for (const id of [...this.byId.keys()]) {
      if (this.byId.get(id)?.specFile === specFile) {
        this.byId.delete(id);
      }
    }
    this.all.length = 0;
    this.all.push(...filtered);
    this.loadedSpecs.delete(specFile);
    this.addOperations(operations, specFile);
  }

  hasSpec(specFile: string): boolean {
    return this.loadedSpecs.has(specFile);
  }

  getLoadedSpecs(): string[] {
    return [...this.loadedSpecs].sort();
  }

  get(operationId: string): OpenApiOperation | undefined {
    return this.byId.get(operationId);
  }

  search(query: string, limit = 20, specFiles?: string[]): OpenApiOperation[] {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const tokens = q.split(/\s+/).filter(Boolean);
    const specSet = specFiles?.length ? new Set(specFiles) : undefined;
    const scored: Array<{ op: OpenApiOperation; score: number }> = [];

    for (const op of this.all) {
      if (specSet && !specSet.has(op.specFile)) continue;

      const haystack = [
        op.operationId,
        op.path,
        op.method,
        op.summary,
        op.description,
        op.specFile,
        op.specTitle,
        ...op.tags,
      ]
        .join(' ')
        .toLowerCase();

      const matches =
        tokens.length <= 1
          ? haystack.includes(q)
          : tokens.every((token) => haystack.includes(token));
      if (!matches) continue;

      let score = 0;
      if (op.operationId.toLowerCase().includes(q)) score += 10;
      if (op.path.toLowerCase().includes(q)) score += 8;
      if (op.summary.toLowerCase().includes(q)) score += 5;
      if (op.tags.some((t) => t.toLowerCase().includes(q))) score += 3;

      scored.push({ op, score });
    }

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((s) => s.op);
  }

  getAllOperations(): readonly OpenApiOperation[] {
    return this.all;
  }

  getStats(): OperationIndexStats {
    const bySpec: Record<string, number> = {};
    for (const op of this.all) {
      bySpec[op.specFile] = (bySpec[op.specFile] ?? 0) + 1;
    }
    return {
      specFiles: this.getLoadedSpecs(),
      totalOperations: this.all.length,
      bySpec,
    };
  }
}
