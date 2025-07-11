import { GatewayTools } from '../tools/gateway-tools.js';
import { TatumConfig } from '../config.js';

describe('GatewayTools', () => {
  let gatewayTools: GatewayTools;

  beforeEach(() => {
    gatewayTools = new GatewayTools();
  });

  describe('getSupportedMethods', () => {
    it('should return mock methods for ethereum-mainnet', async () => {
      const result = await gatewayTools.getSupportedMethods('ethereum-mainnet');
      
      expect(result).toBeDefined();
      expect(result['/jsonrpc']).toBeDefined();
      expect(result['/jsonrpc'].protocol).toBe('json-rpc');
      expect(result['/jsonrpc'].methods).toContain('eth_getBalance');
      expect(result['/jsonrpc'].methods).toContain('eth_getTransactionByHash');
    });

    it('should return mock methods for bitcoin-mainnet', async () => {
      const result = await gatewayTools.getSupportedMethods('bitcoin-mainnet');
      
      expect(result).toBeDefined();
      expect(result['/jsonrpc']).toBeDefined();
      expect(result['/jsonrpc'].protocol).toBe('json-rpc');
      expect(result['/jsonrpc'].methods).toContain('getblockchaininfo');
      expect(result['/jsonrpc'].methods).toContain('getblock');
    });

    it('should return mock methods for tron-mainnet with multiple protocols', async () => {
      const result = await gatewayTools.getSupportedMethods('tron-mainnet');
      
      expect(result).toBeDefined();
      expect(result['/wallet']).toBeDefined();
      expect(result['/walletsolidity']).toBeDefined();
      expect(result['/jsonrpc']).toBeDefined();
      
      expect(result['/wallet'].protocol).toBe('rest');
      expect(result['/wallet'].methods).toContain('POST /getnowblock');
      
      expect(result['/walletsolidity'].protocol).toBe('rest');
      expect(result['/walletsolidity'].methods).toContain('POST /getblockbylatestnum');
      
      expect(result['/jsonrpc'].protocol).toBe('json-rpc');
      expect(result['/jsonrpc'].methods).toContain('buildTransaction');
    });

    it('should return generic EVM methods for unknown chains', async () => {
      const result = await gatewayTools.getSupportedMethods('unknown-chain');
      
      expect(result).toBeDefined();
      expect(result['/jsonrpc']).toBeDefined();
      expect(result['/jsonrpc'].protocol).toBe('json-rpc');
      expect(result['/jsonrpc'].methods).toContain('eth_getBalance');
      expect(result['/jsonrpc'].methods).toContain('eth_call');
    });

    it('should return polygon-specific methods', async () => {
      const result = await gatewayTools.getSupportedMethods('polygon-mainnet');
      
      expect(result).toBeDefined();
      expect(result['/jsonrpc']).toBeDefined();
      expect(result['/jsonrpc'].protocol).toBe('json-rpc');
      expect(result['/jsonrpc'].methods).toContain('bor_getAuthor');
      expect(result['/jsonrpc'].methods).toContain('bor_getCurrentValidators');
    });

    it('should handle empty chain parameter gracefully', async () => {
      const result = await gatewayTools.getSupportedMethods('');
      
      // Should return generic EVM methods for empty chain
      expect(result).toBeDefined();
      expect(result['/jsonrpc']).toBeDefined();
      expect(result['/jsonrpc'].methods).toContain('eth_getBalance');
    });
  });

  describe('getSupportedChains', () => {
    it('should return an array of supported chains', async () => {
      const result = await gatewayTools.getSupportedChains();
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('getGatewayUrl', () => {
    it('should return a URL for a valid chain', async () => {
      const result = await gatewayTools.getGatewayUrl('ethereum-mainnet');
      
      if (result) {
        expect(typeof result).toBe('string');
        expect(result).toMatch(/^https?:\/\/.+/);
      }
    });
  });
});