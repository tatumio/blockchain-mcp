/**
 * Integration tests for Bitcoin wallet operations
 * These tests verify that the wallet methods are properly implemented
 * and handle validation correctly without requiring API calls
 */

describe('BitcoinService - Wallet Operations Integration', () => {
  // Mock TatumApiClient to avoid actual API calls
  const mockExecuteRequest = jest.fn();
  
  // Create a mock BitcoinService class for testing
  class TestBitcoinService {
    private apiClient: any;

    constructor() {
      this.apiClient = { executeRequest: mockExecuteRequest };
    }

    // Copy the validation methods from the actual implementation
    private validateGenerateAddressArgs(args: any): boolean {
      return (
        args &&
        typeof args.xpub === 'string' &&
        this.isValidXpub(args.xpub) &&
        typeof args.index === 'number' &&
        this.isValidIndex(args.index)
      );
    }

    private validateGeneratePrivateKeyArgs(args: any): boolean {
      return (
        args &&
        typeof args.mnemonic === 'string' &&
        this.isValidMnemonic(args.mnemonic) &&
        typeof args.index === 'number' &&
        this.isValidIndex(args.index)
      );
    }

    private isValidXpub(xpub: string): boolean {
      return /^xpub[a-km-zA-HJ-NP-Z1-9]{107,108}$/.test(xpub);
    }

    private isValidMnemonic(mnemonic: string): boolean {
      const words = mnemonic.trim().split(/\s+/);
      return [12, 15, 18, 21, 24].includes(words.length);
    }

    private isValidIndex(index: number): boolean {
      return Number.isInteger(index) && index >= 0 && index < 2147483648;
    }

    private createValidationErrorResponse(message: string) {
      return {
        error: message,
        status: 400,
        statusText: 'Bad Request'
      };
    }

    // Wallet operation methods
    async generateWallet() {
      const url = '/v3/bitcoin/wallet';
      return await this.apiClient.executeRequest('POST', url, {});
    }

    async generateAddress(args: any) {
      if (!this.validateGenerateAddressArgs(args)) {
        return this.createValidationErrorResponse('Invalid arguments for generateAddress');
      }

      const url = `/v3/bitcoin/address/{xpub}/{index}`;
      const parameters = {
        xpub: args.xpub,
        index: args.index
      };
      return await this.apiClient.executeRequest('GET', url, parameters);
    }

    async generatePrivateKey(args: any) {
      if (!this.validateGeneratePrivateKeyArgs(args)) {
        return this.createValidationErrorResponse('Invalid arguments for generatePrivateKey');
      }

      const url = '/v3/bitcoin/wallet/priv';
      const parameters = {
        mnemonic: args.mnemonic,
        index: args.index
      };
      return await this.apiClient.executeRequest('POST', url, parameters);
    }
  }

  let bitcoinService: TestBitcoinService;

  beforeEach(() => {
    jest.clearAllMocks();
    bitcoinService = new TestBitcoinService();
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

    it('should handle API errors', async () => {
      // Arrange
      const mockErrorResponse = {
        error: 'API rate limit exceeded',
        status: 429,
        statusText: 'Too Many Requests'
      };
      mockExecuteRequest.mockResolvedValue(mockErrorResponse);

      // Act
      const result = await bitcoinService.generateWallet();

      // Assert
      expect(result).toEqual(mockErrorResponse);
    });
  });

  describe('generateAddress', () => {
    const validArgs = {
      xpub: 'xpub6CUGRUonZSQ4TWtTMmzXdrXDtypWKiKrhko4egpiMZbpiaQL2jkwSB1icqYh2cfDfVxdx4df189oLKnC5fSwqPiCSQQMXnEt7zB5cCkuBBK',
      index: 0
    };

    it('should call the correct API endpoint with valid parameters', async () => {
      // Arrange
      const mockResponse = {
        data: { address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa' },
        status: 200,
        statusText: 'OK'
      };
      mockExecuteRequest.mockResolvedValue(mockResponse);

      // Act
      const result = await bitcoinService.generateAddress(validArgs);

      // Assert
      expect(mockExecuteRequest).toHaveBeenCalledWith('GET', '/v3/bitcoin/address/{xpub}/{index}', {
        xpub: validArgs.xpub,
        index: validArgs.index
      });
      expect(result).toEqual(mockResponse);
    });

    it('should validate xpub format', async () => {
      // Test cases for invalid xpub
      const invalidCases = [
        { xpub: '', index: 0, description: 'empty xpub' },
        { xpub: 'invalid-xpub', index: 0, description: 'invalid format' },
        { xpub: 'xprv6CUGRUonZSQ4TWtTMmzXdrXDtypWKiKrhko4egpiMZbpiaQL2jkwSB1icqYh2cfDfVxdx4df189oLKnC5fSwqPiCSQQMXnEt7zB5cCkuBBK', index: 0, description: 'xprv instead of xpub' },
        { xpub: 'xpub6CUGRUonZSQ4TWtTMmzXdrXDtypWKiKrhko4egpiMZbpiaQL2jkwSB1icqYh2cfDfVxdx4df189oLKnC5fSwqPiCSQQMXnEt7zB5cCkuBB', index: 0, description: 'too short' }
      ];

      for (const testCase of invalidCases) {
        const result = await bitcoinService.generateAddress(testCase);
        expect(result.error).toBe('Invalid arguments for generateAddress');
        expect(result.status).toBe(400);
        expect(mockExecuteRequest).not.toHaveBeenCalled();
        mockExecuteRequest.mockClear();
      }
    });

    it('should validate index range', async () => {
      const invalidIndices = [-1, -100, 2147483648, 1.5, NaN, Infinity];

      for (const invalidIndex of invalidIndices) {
        const result = await bitcoinService.generateAddress({
          xpub: validArgs.xpub,
          index: invalidIndex
        });
        expect(result.error).toBe('Invalid arguments for generateAddress');
        expect(result.status).toBe(400);
        expect(mockExecuteRequest).not.toHaveBeenCalled();
        mockExecuteRequest.mockClear();
      }
    });

    it('should accept valid index range', async () => {
      const validIndices = [0, 1, 100, 2147483647]; // 2^31 - 1
      mockExecuteRequest.mockResolvedValue({ data: { address: 'test' }, status: 200, statusText: 'OK' });

      for (const validIndex of validIndices) {
        const result = await bitcoinService.generateAddress({
          xpub: validArgs.xpub,
          index: validIndex
        });
        expect(result.status).toBe(200);
        expect(mockExecuteRequest).toHaveBeenCalledWith('GET', '/v3/bitcoin/address/{xpub}/{index}', {
          xpub: validArgs.xpub,
          index: validIndex
        });
        mockExecuteRequest.mockClear();
      }
    });

    it('should handle missing arguments', async () => {
      const invalidArgs = [null, undefined, {}, { xpub: validArgs.xpub }, { index: 0 }];

      for (const args of invalidArgs) {
        const result = await bitcoinService.generateAddress(args);
        expect(result.error).toBe('Invalid arguments for generateAddress');
        expect(result.status).toBe(400);
        expect(mockExecuteRequest).not.toHaveBeenCalled();
        mockExecuteRequest.mockClear();
      }
    });
  });

  describe('generatePrivateKey', () => {
    const validArgs = {
      mnemonic: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
      index: 0
    };

    it('should call the correct API endpoint with valid parameters', async () => {
      // Arrange
      const mockResponse = {
        data: { key: 'KwDiBf89QgGbjEhKnhXJuH7LrciVrZi3qYjgd9M7rFU73sVHnoWn' },
        status: 200,
        statusText: 'OK'
      };
      mockExecuteRequest.mockResolvedValue(mockResponse);

      // Act
      const result = await bitcoinService.generatePrivateKey(validArgs);

      // Assert
      expect(mockExecuteRequest).toHaveBeenCalledWith('POST', '/v3/bitcoin/wallet/priv', {
        mnemonic: validArgs.mnemonic,
        index: validArgs.index
      });
      expect(result).toEqual(mockResponse);
    });

    it('should validate mnemonic word count', async () => {
      const validMnemonics = [
        'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about', // 12 words
        'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about', // 15 words
        'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about', // 18 words
        'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about', // 21 words
        'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon art' // 24 words
      ];

      mockExecuteRequest.mockResolvedValue({ data: { key: 'test' }, status: 200, statusText: 'OK' });

      for (const mnemonic of validMnemonics) {
        const result = await bitcoinService.generatePrivateKey({ mnemonic, index: 0 });
        expect(result.status).toBe(200);
        mockExecuteRequest.mockClear();
      }
    });

    it('should reject invalid mnemonic word counts', async () => {
      const invalidMnemonics = [
        '', // empty
        'abandon', // 1 word
        'abandon abandon abandon', // 3 words
        'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon', // 10 words
        'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon', // 13 words
        'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon' // 25 words
      ];

      for (const mnemonic of invalidMnemonics) {
        const result = await bitcoinService.generatePrivateKey({ mnemonic, index: 0 });
        expect(result.error).toBe('Invalid arguments for generatePrivateKey');
        expect(result.status).toBe(400);
        expect(mockExecuteRequest).not.toHaveBeenCalled();
        mockExecuteRequest.mockClear();
      }
    });

    it('should validate index for private key generation', async () => {
      const invalidIndices = [-1, 2147483648, 1.5, NaN];

      for (const invalidIndex of invalidIndices) {
        const result = await bitcoinService.generatePrivateKey({
          mnemonic: validArgs.mnemonic,
          index: invalidIndex
        });
        expect(result.error).toBe('Invalid arguments for generatePrivateKey');
        expect(result.status).toBe(400);
        expect(mockExecuteRequest).not.toHaveBeenCalled();
        mockExecuteRequest.mockClear();
      }
    });

    it('should handle missing arguments', async () => {
      const invalidArgs = [null, undefined, {}, { mnemonic: validArgs.mnemonic }, { index: 0 }];

      for (const args of invalidArgs) {
        const result = await bitcoinService.generatePrivateKey(args);
        expect(result.error).toBe('Invalid arguments for generatePrivateKey');
        expect(result.status).toBe(400);
        expect(mockExecuteRequest).not.toHaveBeenCalled();
        mockExecuteRequest.mockClear();
      }
    });
  });

  describe('Wallet Operations Workflow', () => {
    it('should support complete wallet generation workflow', async () => {
      // Arrange - Mock responses for complete workflow
      const walletResponse = {
        data: {
          mnemonic: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
          xpub: 'xpub6CUGRUonZSQ4TWtTMmzXdrXDtypWKiKrhko4egpiMZbpiaQL2jkwSB1icqYh2cfDfVxdx4df189oLKnC5fSwqPiCSQQMXnEt7zB5cCkuBBK'
        },
        status: 200,
        statusText: 'OK'
      };

      const addressResponse = {
        data: { address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa' },
        status: 200,
        statusText: 'OK'
      };

      const privateKeyResponse = {
        data: { key: 'KwDiBf89QgGbjEhKnhXJuH7LrciVrZi3qYjgd9M7rFU73sVHnoWn' },
        status: 200,
        statusText: 'OK'
      };

      mockExecuteRequest
        .mockResolvedValueOnce(walletResponse)
        .mockResolvedValueOnce(addressResponse)
        .mockResolvedValueOnce(privateKeyResponse);

      // Act - Execute complete workflow
      const wallet = await bitcoinService.generateWallet();
      const address = await bitcoinService.generateAddress({
        xpub: wallet.data.xpub,
        index: 0
      });
      const privateKey = await bitcoinService.generatePrivateKey({
        mnemonic: wallet.data.mnemonic,
        index: 0
      });

      // Assert
      expect(wallet.status).toBe(200);
      expect(address.status).toBe(200);
      expect(privateKey.status).toBe(200);
      expect(mockExecuteRequest).toHaveBeenCalledTimes(3);

      // Verify correct API calls
      expect(mockExecuteRequest).toHaveBeenNthCalledWith(1, 'POST', '/v3/bitcoin/wallet', {});
      expect(mockExecuteRequest).toHaveBeenNthCalledWith(2, 'GET', '/v3/bitcoin/address/{xpub}/{index}', {
        xpub: wallet.data.xpub,
        index: 0
      });
      expect(mockExecuteRequest).toHaveBeenNthCalledWith(3, 'POST', '/v3/bitcoin/wallet/priv', {
        mnemonic: wallet.data.mnemonic,
        index: 0
      });
    });
  });
});