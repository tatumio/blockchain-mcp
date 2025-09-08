import { BitcoinService } from '../bitcoin';
import { TatumApiClient } from '../../api-client';
import { ToolExecutionContext } from '../../types';

// Create a mock for TatumApiClient
const mockExecuteRequest = jest.fn();
jest.mock('../../api-client', () => {
  return {
    TatumApiClient: jest.fn().mockImplementation(() => ({
      executeRequest: mockExecuteRequest
    }))
  };
});

describe('BitcoinService - Blockchain Information Unit Tests', () => {
  let bitcoinService: BitcoinService;
  let mockContext: ToolExecutionContext;

  beforeEach(() => {
    jest.clearAllMocks();
    mockContext = {
      apiKey: 'test-api-key',
      baseUrl: 'https://api.tatum.io',
      timeout: 30000,
      retryAttempts: 3
    };
    const mockApiClient = new TatumApiClient(mockContext);
    bitcoinService = new BitcoinService(mockApiClient);
  });

  describe('getBlockchainInfo', () => {
    it('should call the correct API endpoint', async () => {
      // Arrange
      const mockResponse = {
        data: {
          chain: 'main',
          blocks: 800000,
          headers: 800000,
          bestblockhash: '00000000000000000002a7c4c1e48d76c5a37902165a270156b7a8d72728a054',
          difficulty: 48712405953118.43,
          mediantime: 1684567890,
          verificationprogress: 0.9999999,
          initialblockdownload: false,
          chainwork: '00000000000000000000000000000000000000004a59c2b4c8e1c5e1c5e1c5e1',
          size_on_disk: 500000000000,
          pruned: false
        },
        status: 200,
        statusText: 'OK'
      };
      mockExecuteRequest.mockResolvedValue(mockResponse);

      // Act
      const result = await bitcoinService.getBlockchainInfo();

      // Assert
      expect(mockExecuteRequest).toHaveBeenCalledWith('GET', '/v3/bitcoin/info', {});
      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors gracefully', async () => {
      // Arrange
      const mockErrorResponse = {
        error: 'Network error',
        status: 500,
        statusText: 'Internal Server Error'
      };
      mockExecuteRequest.mockResolvedValue(mockErrorResponse);

      // Act
      const result = await bitcoinService.getBlockchainInfo();

      // Assert
      expect(mockExecuteRequest).toHaveBeenCalledWith('GET', '/v3/bitcoin/info', {});
      expect(result).toEqual(mockErrorResponse);
    });
  });

  describe('getBlockHash', () => {
    it('should call the correct API endpoint with valid height', async () => {
      // Arrange
      const args = { height: 800000 };
      const mockResponse = {
        data: {
          hash: '00000000000000000002a7c4c1e48d76c5a37902165a270156b7a8d72728a054'
        },
        status: 200,
        statusText: 'OK'
      };
      mockExecuteRequest.mockResolvedValue(mockResponse);

      // Act
      const result = await bitcoinService.getBlockHash(args);

      // Assert
      expect(mockExecuteRequest).toHaveBeenCalledWith('GET', '/v3/bitcoin/block/hash/{height}', {
        height: args.height
      });
      expect(result).toEqual(mockResponse);
    });

    it('should return validation error for negative height', async () => {
      // Arrange
      const args = { height: -1 };

      // Act
      const result = await bitcoinService.getBlockHash(args);

      // Assert
      expect(mockExecuteRequest).not.toHaveBeenCalled();
      expect(result.error).toBe('Invalid arguments for getBlockHash');
      expect(result.status).toBe(400);
      expect(result.statusText).toBe('Bad Request');
    });

    it('should return validation error for invalid height type', async () => {
      // Arrange
      const args = { height: 'invalid' as any };

      // Act
      const result = await bitcoinService.getBlockHash(args);

      // Assert
      expect(mockExecuteRequest).not.toHaveBeenCalled();
      expect(result.error).toBe('Invalid arguments for getBlockHash');
      expect(result.status).toBe(400);
    });

    it('should return validation error for missing arguments', async () => {
      // Act
      const result = await bitcoinService.getBlockHash(null as any);

      // Assert
      expect(mockExecuteRequest).not.toHaveBeenCalled();
      expect(result.error).toBe('Invalid arguments for getBlockHash');
      expect(result.status).toBe(400);
    });

    it('should accept genesis block height (0)', async () => {
      // Arrange
      const args = { height: 0 };
      const mockResponse = {
        data: {
          hash: '000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f'
        },
        status: 200,
        statusText: 'OK'
      };
      mockExecuteRequest.mockResolvedValue(mockResponse);

      // Act
      const result = await bitcoinService.getBlockHash(args);

      // Assert
      expect(mockExecuteRequest).toHaveBeenCalledWith('GET', '/v3/bitcoin/block/hash/{height}', {
        height: 0
      });
      expect(result).toEqual(mockResponse);
    });

    it('should accept large block heights', async () => {
      // Arrange
      const args = { height: 999999 };
      const mockResponse = {
        data: {
          hash: '00000000000000000002a7c4c1e48d76c5a37902165a270156b7a8d72728a054'
        },
        status: 200,
        statusText: 'OK'
      };
      mockExecuteRequest.mockResolvedValue(mockResponse);

      // Act
      const result = await bitcoinService.getBlockHash(args);

      // Assert
      expect(mockExecuteRequest).toHaveBeenCalledWith('GET', '/v3/bitcoin/block/hash/{height}', {
        height: 999999
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getBlock', () => {
    const mockBlockData = {
      hash: '00000000000000000002a7c4c1e48d76c5a37902165a270156b7a8d72728a054',
      confirmations: 100,
      size: 1234567,
      strippedsize: 1234000,
      weight: 4936000,
      height: 800000,
      version: 536870912,
      versionHex: '20000000',
      merkleroot: 'a7c4c1e48d76c5a37902165a270156b7a8d72728a054000000000000000002',
      tx: [
        '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
      ],
      time: 1684567890,
      mediantime: 1684567800,
      nonce: 123456789,
      bits: '170b3ce9',
      difficulty: 48712405953118.43,
      chainwork: '00000000000000000000000000000000000000004a59c2b4c8e1c5e1c5e1c5e1',
      nTx: 2500,
      previousblockhash: '00000000000000000001a7c4c1e48d76c5a37902165a270156b7a8d72728a054',
      nextblockhash: '00000000000000000003a7c4c1e48d76c5a37902165a270156b7a8d72728a054'
    };

    it('should call the correct API endpoint with valid hash', async () => {
      // Arrange
      const args = { hash: '00000000000000000002a7c4c1e48d76c5a37902165a270156b7a8d72728a054' };
      const mockResponse = {
        data: mockBlockData,
        status: 200,
        statusText: 'OK'
      };
      mockExecuteRequest.mockResolvedValue(mockResponse);

      // Act
      const result = await bitcoinService.getBlock(args);

      // Assert
      expect(mockExecuteRequest).toHaveBeenCalledWith('GET', '/v3/bitcoin/block/{hash}', {
        hash: args.hash
      });
      expect(result).toEqual(mockResponse);
    });

    it('should call the correct API endpoint with valid height', async () => {
      // Arrange
      const args = { height: 800000 };
      const mockResponse = {
        data: mockBlockData,
        status: 200,
        statusText: 'OK'
      };
      mockExecuteRequest.mockResolvedValue(mockResponse);

      // Act
      const result = await bitcoinService.getBlock(args);

      // Assert
      expect(mockExecuteRequest).toHaveBeenCalledWith('GET', '/v3/bitcoin/block/{height}', {
        height: args.height
      });
      expect(result).toEqual(mockResponse);
    });

    it('should prioritize hash over height when both are provided', async () => {
      // Arrange
      const args = { 
        hash: '00000000000000000002a7c4c1e48d76c5a37902165a270156b7a8d72728a054',
        height: 800000 
      };
      const mockResponse = {
        data: mockBlockData,
        status: 200,
        statusText: 'OK'
      };
      mockExecuteRequest.mockResolvedValue(mockResponse);

      // Act
      const result = await bitcoinService.getBlock(args);

      // Assert
      expect(mockExecuteRequest).toHaveBeenCalledWith('GET', '/v3/bitcoin/block/{hash}', {
        hash: args.hash
      });
      expect(result).toEqual(mockResponse);
    });

    it('should return validation error when neither hash nor height is provided', async () => {
      // Arrange
      const args = {};

      // Act
      const result = await bitcoinService.getBlock(args);

      // Assert
      expect(mockExecuteRequest).not.toHaveBeenCalled();
      expect(result.error).toBe('Invalid arguments for getBlock');
      expect(result.status).toBe(400);
    });

    it('should return validation error for invalid hash format', async () => {
      // Arrange
      const args = { hash: 'invalid-hash' };

      // Act
      const result = await bitcoinService.getBlock(args);

      // Assert
      expect(mockExecuteRequest).not.toHaveBeenCalled();
      expect(result.error).toBe('Invalid arguments for getBlock');
      expect(result.status).toBe(400);
    });

    it('should return validation error for invalid height', async () => {
      // Arrange
      const args = { height: -1 };

      // Act
      const result = await bitcoinService.getBlock(args);

      // Assert
      expect(mockExecuteRequest).not.toHaveBeenCalled();
      expect(result.error).toBe('Invalid arguments for getBlock');
      expect(result.status).toBe(400);
    });

    it('should return validation error for missing arguments', async () => {
      // Act
      const result = await bitcoinService.getBlock(null as any);

      // Assert
      expect(mockExecuteRequest).not.toHaveBeenCalled();
      expect(result.error).toBe('Invalid arguments for getBlock');
      expect(result.status).toBe(400);
    });

    it('should accept genesis block hash', async () => {
      // Arrange
      const args = { hash: '000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f' };
      const mockResponse = {
        data: { ...mockBlockData, height: 0 },
        status: 200,
        statusText: 'OK'
      };
      mockExecuteRequest.mockResolvedValue(mockResponse);

      // Act
      const result = await bitcoinService.getBlock(args);

      // Assert
      expect(mockExecuteRequest).toHaveBeenCalledWith('GET', '/v3/bitcoin/block/{hash}', {
        hash: args.hash
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors for non-existent block', async () => {
      // Arrange
      const args = { hash: '0000000000000000000000000000000000000000000000000000000000000000' };
      const mockErrorResponse = {
        error: 'Block not found',
        status: 404,
        statusText: 'Not Found'
      };
      mockExecuteRequest.mockResolvedValue(mockErrorResponse);

      // Act
      const result = await bitcoinService.getBlock(args);

      // Assert
      expect(mockExecuteRequest).toHaveBeenCalledWith('GET', '/v3/bitcoin/block/{hash}', {
        hash: args.hash
      });
      expect(result).toEqual(mockErrorResponse);
    });
  });

  describe('Blockchain Information Validation', () => {
    it('should validate block height range correctly', async () => {
      const validHeights = [0, 1, 100, 800000, 999999];
      const invalidHeights = [-1, -100, 1.5, NaN, Infinity, -Infinity];

      // Valid heights should work for getBlockHash
      mockExecuteRequest.mockResolvedValue({ data: { hash: 'test' }, status: 200, statusText: 'OK' });
      for (const validHeight of validHeights) {
        const validResult = await bitcoinService.getBlockHash({ height: validHeight });
        expect(validResult.status).toBe(200);
      }

      // Invalid heights should fail validation for getBlockHash
      for (const invalidHeight of invalidHeights) {
        const invalidResult = await bitcoinService.getBlockHash({ height: invalidHeight });
        expect(invalidResult.status).toBe(400);
        expect(invalidResult.error).toBe('Invalid arguments for getBlockHash');
      }

      // Valid heights should work for getBlock
      for (const validHeight of validHeights) {
        const validResult = await bitcoinService.getBlock({ height: validHeight });
        expect(validResult.status).toBe(200);
      }

      // Invalid heights should fail validation for getBlock
      for (const invalidHeight of invalidHeights) {
        const invalidResult = await bitcoinService.getBlock({ height: invalidHeight });
        expect(invalidResult.status).toBe(400);
        expect(invalidResult.error).toBe('Invalid arguments for getBlock');
      }
    });

    it('should validate block hash format correctly', async () => {
      const validHashes = [
        '000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f', // Genesis block
        '00000000000000000002a7c4c1e48d76c5a37902165a270156b7a8d72728a054', // Regular block
        'ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890' // Uppercase hex
      ];

      const invalidHashes = [
        '',
        'invalid-hash',
        '123', // Too short
        '00000000000000000002a7c4c1e48d76c5a37902165a270156b7a8d72728a054G', // Invalid character
        '00000000000000000002a7c4c1e48d76c5a37902165a270156b7a8d72728a0541' // Too long
      ];

      // Valid hashes should work
      mockExecuteRequest.mockResolvedValue({ data: { block: 'test' }, status: 200, statusText: 'OK' });
      for (const validHash of validHashes) {
        const validResult = await bitcoinService.getBlock({ hash: validHash });
        expect(validResult.status).toBe(200);
      }

      // Invalid hashes should fail validation
      for (const invalidHash of invalidHashes) {
        const invalidResult = await bitcoinService.getBlock({ hash: invalidHash });
        expect(invalidResult.status).toBe(400);
        expect(invalidResult.error).toBe('Invalid arguments for getBlock');
      }
    });

    it('should handle edge cases for block operations', async () => {
      // Test with undefined arguments
      expect((await bitcoinService.getBlockHash(undefined as any)).status).toBe(400);
      expect((await bitcoinService.getBlock(undefined as any)).status).toBe(400);

      // Test with empty objects
      expect((await bitcoinService.getBlock({})).error).toBe('Invalid arguments for getBlock');

      // Test with null values
      expect((await bitcoinService.getBlock({ hash: null as any })).status).toBe(400);
      expect((await bitcoinService.getBlock({ height: null as any })).status).toBe(400);
    });
  });
});