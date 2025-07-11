import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { TatumFeature, TatumIndex, FeatureInfo } from './types.js';
import { GatewayService } from './services/gateway.js';

export class TatumConfig {
  private static instance: TatumConfig;
  private readonly features: Map<string, TatumFeature> = new Map();
  private readonly gatewayService: GatewayService;
  private index!: TatumIndex;
  private readonly featuresPath: string;
  private readonly byoRpcUrls: Map<string, string> = new Map();

  private constructor() {
    // Determine features path - try multiple locations for robustness
    this.featuresPath = this.findFeaturesPath();
    this.loadByoRpcConfig();
    this.gatewayService = new GatewayService();
    this.loadFeatures();
  }

  private findFeaturesPath(): string {
    // Get the directory of the current module
    const currentDir = path.dirname(fileURLToPath(import.meta.url));
    
    // Try multiple possible locations for features directory
    const possiblePaths = [
      // Current working directory (when run from project root)
      path.join(process.cwd(), 'features'),
      // Relative to the current module location (handles both src and dist)
      path.join(currentDir, '..', 'features'),
      // Relative to dist directory (when running compiled version)
      path.join(currentDir, '..', '..', 'features')
    ];

    for (const featuresPath of possiblePaths) {
      if (fs.existsSync(path.join(featuresPath, 'index.json'))) {
        console.error(`Found features directory at: ${featuresPath}`);
        return featuresPath;
      }
    }

    // If none found, use the first option and let it fail with a clear error
    console.error(`Warning: Could not find features directory. Tried paths:`);
    possiblePaths.forEach(p => console.error(`  - ${p}`));
    return possiblePaths[0];
  }

  public static getInstance(): TatumConfig {
    if (!TatumConfig.instance) {
      TatumConfig.instance = new TatumConfig();
    }
    return TatumConfig.instance;
  }

  private loadByoRpcConfig(): void {
    const byoRpcEnv = process.env.BYO_RPC_CONFIG;
    if (byoRpcEnv) {
      try {
        const pairs = byoRpcEnv.split(';').map(pair => pair.trim()).filter(pair => pair.length > 0);
        
        for (const pair of pairs) {
          const [chain, url] = pair.split(',').map(part => part.trim());
          if (chain && url) {
            this.byoRpcUrls.set(chain, url);
            console.error(`Loaded custom RPC URL for ${chain}: ${url}`);
          }
        }
      } catch (error) {
        console.error('Error parsing BYO_RPC_CONFIG:', error);
      }
    }
  }

  private loadFeatures(): void {
    try {
      const indexPath = path.join(this.featuresPath, 'index.json');
      const indexData = fs.readFileSync(indexPath, 'utf-8');
      this.index = JSON.parse(indexData);

      const enabledFeatures: string[] = [];
      let loadedTools = 0;
      
      for (const featureInfo of this.index.features) {
        if (featureInfo.enabled) {
          const featurePath = path.join(this.featuresPath, featureInfo.file);
          if (fs.existsSync(featurePath)) {
            const featureData = fs.readFileSync(featurePath, 'utf-8');
            const feature: TatumFeature = JSON.parse(featureData);
            this.features.set(featureInfo.id, feature);
            loadedTools += feature.tools.length;
            enabledFeatures.push(featureInfo.id);
          }
        }
      }
      
      if (this.isFeatureEnabled('gateway')) {
        console.error(`Gateway feature enabled - RPC gateway tools available`);
      }

      console.error(`Loaded ${this.features.size} features with ${loadedTools} tools`);
      console.error(`Enabled features: ${enabledFeatures.join(', ')}`);
    } catch (error) {
      console.error('Error loading features:', error);
      throw new Error('Failed to load Tatum features');
    }
  }

  public getFeature(featureId: string): TatumFeature | undefined {
    return this.features.get(featureId);
  }

  public getAllFeatures(): Map<string, TatumFeature> {
    return this.features;
  }

  public getIndex(): TatumIndex {
    return this.index;
  }

  public getFeatureInfo(featureId: string): FeatureInfo | undefined {
    return this.index.features.find(f => f.id === featureId);
  }

  public getAllTools(): Array<{ featureId: string; tool: any }> {
    const allTools: Array<{ featureId: string; tool: any }> = [];
    
    for (const [featureId, feature] of this.features) {
      for (const tool of feature.tools) {
        allTools.push({ featureId, tool });
      }
    }
    
    return allTools;
  }

  public findToolByName(toolName: string): { featureId: string; tool: any } | undefined {
    for (const [featureId, feature] of this.features) {
      const tool = feature.tools.find(t => t.name === toolName);
      if (tool) {
        return { featureId, tool };
      }
    }
    return undefined;
  }

  public getApiConfig() {
    return {
      baseUrl: this.index.tatumMCP.baseUrl,
      timeout: this.index.configuration.defaultTimeout,
      retryAttempts: this.index.configuration.retryAttempts,
      rateLimit: this.index.configuration.rateLimit
    };
  }

  public getGatewayService(): GatewayService {
    return this.gatewayService;
  }

  public getGatewayUrl(chain: string): string | undefined {
    const customUrl = this.byoRpcUrls.get(chain);
    if (customUrl) {
      return customUrl;
    }
    return this.gatewayService.getGatewayUrl(chain);
  }

  public getCustomRpcUrl(chain: string): string | undefined {
    return this.byoRpcUrls.get(chain);
  }

  public hasCustomRpcUrl(chain: string): boolean {
    return this.byoRpcUrls.has(chain);
  }

  public getCustomRpcChains(): string[] {
    return Array.from(this.byoRpcUrls.keys());
  }



  public isFeatureEnabled(featureId: string): boolean {
    const featureInfo = this.index.features.find(f => f.id === featureId);
    return featureInfo?.enabled === true;
  }

  public getEnabledFeatures(): string[] {
    return this.index.features
      .filter(f => f.enabled)
      .map(f => f.id);
  }
}