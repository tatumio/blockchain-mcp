import { GatewayFeature, Gateway, GatewayChain } from '../types.js';
import fs from 'fs';
import path from 'path';

export class GatewayService {
  private readonly gatewayFeature: GatewayFeature;

  constructor() {
    // Find gateway.json using robust path resolution
    const gatewayPath = this.findGatewayPath();
    this.gatewayFeature = JSON.parse(fs.readFileSync(gatewayPath, 'utf8'));
  }

  private findGatewayPath(): string {
    // Try multiple possible locations for gateway.json
    const possiblePaths = [
      // Current working directory (when run from project root)
      path.join(process.cwd(), 'generated-features', 'gateway.json'),
      // Relative to the dist directory (when running compiled code)
      path.join(process.cwd(), 'Documents', 'Technical', 'TatumMCP', 'generated-features', 'gateway.json'),
      // Absolute path as fallback
      '/Users/productshiv/Documents/Technical/TatumMCP/generated-features/gateway.json'
    ];

    for (const gatewayPath of possiblePaths) {
      if (fs.existsSync(gatewayPath)) {
        return gatewayPath;
      }
    }

    // If none found, throw a clear error
    const formattedPaths = possiblePaths.map(p => `  - ${p}`).join('\n');
    throw new Error(`Could not find gateway.json. Tried paths:\n${formattedPaths}`);
  }

  public getGatewayByChain(chainName: string): { gateway: Gateway; chain: GatewayChain } | undefined {
    for (const gateway of this.gatewayFeature.gateways) {
      const chain = gateway.chains.find(c => c.chain === chainName || c.gatewayName === chainName);
      if (chain) {
        return { gateway, chain };
      }
    }
    return undefined;
  }

  public getGatewayUrl(chainName: string): string | undefined {
    const result = this.getGatewayByChain(chainName);
    return result?.chain.gatewayUrl;
  }

  public getSupportedChains(): string[] {
    const chains: string[] = [];
    for (const gateway of this.gatewayFeature.gateways) {
      for (const chain of gateway.chains) {
        chains.push(chain.gatewayName);
      }
    }
    return chains;
  }
}