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

describe('BitcoinService - Wallet Operations Unit Tests', () => {
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

  describe('generateWallet', () => {
    it('should call the correct API endpoint', async () => {
      // Arrange
      const mockResponse = {
        data: {
          mnemonic: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
          xpub: 'xpub6CUGRUonZSQ4TWtTMmzXdrXDtypWKiKrhko4egpiMZbpiaQL2jkwSB1icqYh2cfDfVxdx4df189oLKnC5fSwqPiCSQQMXnEt7zB5cCkuBBK'
        },
        status: 200,
        statusText: 'OK'
      };
      mockExecuteRequest.mockResolvedValue(mockResponse);

      // Act
      const result = await bitcoinService.generateWallet();

      // Assert
      expect(mockExecuteRequest).toHaveBeenCalledWith('POST', '/v3/bitcoin/wallet', {});
      expect(result).toEqual(mockResponse);
    });
  });

  describe('generateAddress', () => {
    it('should call the correct API endpoint with valid parameters', async () => {
      // Arrange
      const args = {
        xpub: 'xpub6CUGRUonZSQ4TWtTMmzXdrXDtypWKiKrhko4egpiMZbpiaQL2jkwSB1icqYh2cfDfVxdx4df189oLKnC5fSwqPiCSQQMXnEt7zB5cCkuBBK',
        index: 0
      };
      const mockResponse = {
        data: { address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa' },
        status: 200,
        statusText: 'OK'
      };
      mockExecuteRequest.mockResolvedValue(mockResponse);

      // Act
      const result = await bitcoinService.generateAddress(args);

      // Assert
      expect(mockExecuteRequest).toHaveBeenCalledWith('GET', '/v3/bitcoin/address/{xpub}/{index}', {
        xpub: args.xpub,
        index: args.index
      });
      expect(result).toEqual(mockResponse);
    });

    it('should return validation error for invalid xpub', async () => {
      // Arrange
      const args = {
        xpub: 'invalid-xpub',
        index: 0
      };

      // Act
      const result = await bitcoinService.generateAddress(args);

      // Assert
      expect(mockExecuteRequest).not.toHaveBeenCalled();
      expect(result.error).toBe('Invalid arguments for generateAddress');
      expect(result.status).toBe(400);
      expect(result.statusText).toBe('Bad Request');
    });

    it('should return validation error for invalid index', async () => {
      // Arrange
      const args = {
        xpub: 'xpub6CUGRUonZSQ4TWtTMmzXdrXDtypWKiKrhko4egpiMZbpiaQL2jkwSB1icqYh2cfDfVxdx4df189oLKnC5fSwqPiCSQQMXnEt7zB5cCkuBBK',
        index: -1
      };

      // Act
      const result = await bitcoinService.generateAddress(args);

      // Assert
      expect(mockExecuteRequest).not.toHaveBeenCalled();
      expect(result.error).toBe('Invalid arguments for generateAddress');
      expect(result.status).toBe(400);
    });

    it('should return validation error for missing arguments', async () => {
      // Act
      const result = await bitcoinService.generateAddress(null as any);

      // Assert
      expect(mockExecuteRequest).not.toHaveBeenCalled();
      expect(result.error).toBe('Invalid arguments for generateAddress');
      expect(result.status).toBe(400);
    });
  });

  describe('generatePrivateKey', () => {
    it('should call the correct API endpoint with valid parameters', async () => {
      // Arrange
      const args = {
        mnemonic: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
        index: 0
      };
      const mockResponse = {
        data: { key: 'KwDiBf89QgGbjEhKnhXJuH7LrciVrZi3qYjgd9M7rFU73sVHnoWn' },
        status: 200,
        statusText: 'OK'
      };
      mockExecuteRequest.mockResolvedValue(mockResponse);

      // Act
      const result = await bitcoinService.generatePrivateKey(args);

      // Assert
      expect(mockExecuteRequest).toHaveBeenCalledWith('POST', '/v3/bitcoin/wallet/priv', {
        mnemonic: args.mnemonic,
        index: args.index
      });
      expect(result).toEqual(mockResponse);
    });

    it('should return validation error for invalid mnemonic', async () => {
      // Arrange
      const args = {
        mnemonic: 'invalid mnemonic',
        index: 0
      };

      // Act
      const result = await bitcoinService.generatePrivateKey(args);

      // Assert
      expect(mockExecuteRequest).not.toHaveBeenCalled();
      expect(result.error).toBe('Invalid arguments for generatePrivateKey');
      expect(result.status).toBe(400);
    });

    it('should return validation error for invalid index', async () => {
      // Arrange
      const args = {
        mnemonic: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
        index: 2147483648 // Exceeds maximum
      };

      // Act
      const result = await bitcoinService.generatePrivateKey(args);

      // Assert
      expect(mockExecuteRequest).not.toHaveBeenCalled();
      expect(result.error).toBe('Invalid arguments for generatePrivateKey');
      expect(result.status).toBe(400);
    });

    it('should accept 24-word mnemonic', async () => {
      // Arrange
      const args = {
        mnemonic: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon art',
        index: 0
      };
      const mockResponse = {
        data: { key: 'test-key' },
        status: 200,
        statusText: 'OK'
      };
      mockExecuteRequest.mockResolvedValue(mockResponse);

      // Act
      const result = await bitcoinService.generatePrivateKey(args);

      // Assert
      expect(mockExecuteRequest).toHaveBeenCalledWith('POST', '/v3/bitcoin/wallet/priv', {
        mnemonic: args.mnemonic,
        index: args.index
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Wallet Operations Validation', () => {
    it('should validate xpub format correctly', async () => {
      const validXpub = 'xpub6CUGRUonZSQ4TWtTMmzXdrXDtypWKiKrhko4egpiMZbpiaQL2jkwSB1icqYh2cfDfVxdx4df189oLKnC5fSwqPiCSQQMXnEt7zB5cCkuBBK';
      const invalidXpubs = [
        '',
        'invalid',
        'xprv6CUGRUonZSQ4TWtTMmzXdrXDtypWKiKrhko4egpiMZbpiaQL2jkwSB1icqYh2cfDfVxdx4df189oLKnC5fSwqPiCSQQMXnEt7zB5cCkuBBK',
        'xpub6CUGRUonZSQ4TWtTMmzXdrXDtypWKiKrhko4egpiMZbpiaQL2jkwSB1icqYh2cfDfVxdx4df189oLKnC5fSwqPiCSQQMXnEt7zB5cCkuBB' // Too short
      ];

      // Valid xpub should work
      mockExecuteRequest.mockResolvedValue({ data: { address: 'test' }, status: 200, statusText: 'OK' });
      const validResult = await bitcoinService.generateAddress({ xpub: validXpub, index: 0 });
      expect(validResult.status).toBe(200);

      // Invalid xpubs should fail validation
      for (const invalidXpub of invalidXpubs) {
        const invalidResult = await bitcoinService.generateAddress({ xpub: invalidXpub, index: 0 });
        expect(invalidResult.status).toBe(400);
        expect(invalidResult.error).toBe('Invalid arguments for generateAddress');
      }
    });

    it('should validate mnemonic format correctly', async () => {
      const validMnemonics = [
        'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about', // 12 words
        'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about', // 15 words
        'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about', // 18 words
        'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about', // 21 words
        'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon art' // 24 words
      ];

      const invalidMnemonics = [
        '',
        'abandon',
        'abandon abandon abandon', // 3 words
        'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon' // 10 words
      ];

      // Valid mnemonics should work
      mockExecuteRequest.mockResolvedValue({ data: { key: 'test' }, status: 200, statusText: 'OK' });
      for (const validMnemonic of validMnemonics) {
        const validResult = await bitcoinService.generatePrivateKey({ mnemonic: validMnemonic, index: 0 });
        expect(validResult.status).toBe(200);
      }

      // Invalid mnemonics should fail validation
      for (const invalidMnemonic of invalidMnemonics) {
        const invalidResult = await bitcoinService.generatePrivateKey({ mnemonic: invalidMnemonic, index: 0 });
        expect(invalidResult.status).toBe(400);
        expect(invalidResult.error).toBe('Invalid arguments for generatePrivateKey');
      }
    });

    it('should validate index range correctly', async () => {
      const validIndices = [0, 1, 100, 2147483647]; // 2^31 - 1
      const invalidIndices = [-1, -100, 2147483648, 1.5, NaN]; // 2^31

      const validArgs = {
        xpub: 'xpub6CUGRUonZSQ4TWtTMmzXdrXDtypWKiKrhko4egpiMZbpiaQL2jkwSB1icqYh2cfDfVxdx4df189oLKnC5fSwqPiCSQQMXnEt7zB5cCkuBBK'
      };

      // Valid indices should work
      mockExecuteRequest.mockResolvedValue({ data: { address: 'test' }, status: 200, statusText: 'OK' });
      for (const validIndex of validIndices) {
        const validResult = await bitcoinService.generateAddress({ ...validArgs, index: validIndex });
        expect(validResult.status).toBe(200);
      }

      // Invalid indices should fail validation
      for (const invalidIndex of invalidIndices) {
        const invalidResult = await bitcoinService.generateAddress({ ...validArgs, index: invalidIndex });
        expect(invalidResult.status).toBe(400);
        expect(invalidResult.error).toBe('Invalid arguments for generateAddress');
      }
    });
  });
});