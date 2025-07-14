import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { TatumFeature } from './types.js';

export class TatumConfig {
  private readonly allTools: Array<{ featureId: string; tool: any }> = [];

  constructor() {
    this.loadTools();
  }

  private loadTools(): void {
    // Load blockchain data tools  
    const blockchainFeature = this.loadJson('blockchain_data.json');
    for (const tool of blockchainFeature.tools) {
      this.allTools.push({ featureId: 'blockchain_data', tool });
    }
  }

  private loadJson(filename: string): TatumFeature {
    // Get the directory of this script file
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    // Go up one directory from src/ to project root, then into features/
    const filePath = path.join(__dirname, '..', 'features', filename);
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  }

  public getAllTools(): Array<{ featureId: string; tool: any }> {
    return this.allTools;
  }

  public findToolByName(toolName: string): { featureId: string; tool: any } | undefined {
    return this.allTools.find(({ tool }) => tool.name === toolName);
  }
}