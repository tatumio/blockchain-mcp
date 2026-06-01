export interface OpenApiOperation {
  /** Stable id, e.g. blockchain-data-1::GET::/v4/data/metadata */
  operationId: string;
  specFile: string;
  specTitle: string;
  method: string;
  path: string;
  baseUrl: string;
  summary: string;
  description: string;
  tags: string[];
  inputSchema: Record<string, unknown>;
}

export interface OperationIndexStats {
  specFiles: string[];
  totalOperations: number;
  bySpec: Record<string, number>;
}

export type OpenApiDataMode = 'live' | 'cached';

export interface OpenApiStatus {
  mode: OpenApiDataMode;
  bundleGeneratedAt: string | null;
  totalOperations: number;
  specFiles: string[];
  bySpec: Record<string, number>;
  specCache: Array<{ specFile: string; fetchedAt: string; source: 'bundle' | 'network' }>;
  backgroundRefreshInProgress: boolean;
}
