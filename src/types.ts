export interface TatumFeature {
  feature: {
    name: string;
    description: string;
    category: string;
    version: string;
    authentication: {
      required: boolean;
      type: string;
      header: string;
    };
    supportedBlockchains: string[];
  };
  tools: TatumTool[];
  metadata: {
    generated: string;
    source_files: string[];
    endpoint_count: number;
    tool_count: number;
  };
}

export interface TatumEndpoint {
  id: string;
  method: string;
  path: string;
  description: string;
  credits: number;
  supportedChains: string[];
  parameters: TatumParameter[];
}

export interface TatumParameter {
  name: string;
  type: string;
  required: boolean;
  description: string;
  in: string;
}

export interface TatumTool {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
}

export interface TatumIndex {
  tatumMCP: {
    name: string;
    description: string;
    version: string;
    baseUrl: string;
    documentation: string;
    supportedProtocols: string[];
    authentication: {
      type: string;
      header: string;
      required: boolean;
      documentation: string;
    };
  };
  features: FeatureInfo[];
  statistics: {
    totalTools: number;
    totalEndpoints: number;
    totalBlockchains: number;
    totalFeatures: number;
    lastUpdated: string;
    generatedFrom: string;
  };
  configuration: {
    defaultTimeout: number;
    retryAttempts: number;
    rateLimit: {
      requestsPerSecond: number;
      burstLimit: number;
    };
  };
}

export interface FeatureInfo {
  id: string;
  file: string;
  name: string;
  category: string;
  description: string;
  toolCount: number;
  endpointCount: number;
  supportedBlockchains: number;
  enabled: boolean;
  credits: {
    min: number;
    max: number;
  };
}

export interface TatumApiResponse {
  data?: any;
  error?: string;
  status: number;
  statusText: string;
}

export interface ToolExecutionContext {
  apiKey: string;
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
}

export interface GatewayChain {
  chain: string;
  gatewayName: string;
  gatewayUrl: string;
}

export interface Gateway {
  name: string;
  docs: string;
  chains: GatewayChain[];
}

export interface GatewayFeature {
  feature: {
    name: string;
    description: string;
    category: string;
    version: string;
    authentication: {
      required: boolean;
      type: string;
      header: string;
    };
  };
  tools: TatumTool[];
  gateways: Gateway[];
  metadata: {
    generated: string;
    source_url: string;
    gateway_count: number;
  };
}