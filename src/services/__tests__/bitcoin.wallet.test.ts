import { BitcoinService } from '../bitcoin';
import { TatumApiClient } from '../../api-client';
import { TatumApiResponse, ToolExecutionContext } from '../../types';
import { GenerateAddressArgs, GeneratePrivateKeyArgs } from '../../types/bitcoin';

// Mock the TatumApiClient
jest.mock('../../api-client');

describe('BitcoinService - Wallet Operations', () => {
  let bitcoinService: BitcoinService;
  let mockApiClient: jest.Mocked<TatumApiClient>;
  let mockContext: ToolExecutionContext;

  beforeEach(() => {
    mockContext = {
      apiKey: 'test-api-key',
      baseUrl: 'https://api.tatum.io',
      timeout: 30000,
      retryAttempts: 3
    };
    mockApiClient = new TatumApiClient(mockContext) as jest.Mocked<TatumApiClient>;
    bitcoinService = new BitcoinService(mockApiClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateWallet', () => {
    it('should generate a valid Bitcoin wallet', async () => {
      // Arrange
      const mockResponse: TatumApiResponse = {
        data: {
          mnemonic: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
          xpub: 'xpub6CUGRUonZSQ4TWtTMmzXdrXDtypWKiKrhko4egpiMZbpiaQL2jkwSB1icqYh2cfDfVxdx4df189oLKnC5fSwqPiCSQQMXnEt7zB5cCkuBBK'
        },
        status: 200,
        statusText: 'OK'
      };
      mockApiClient.executeRequest.mockResolvedValue(mockResponse);

      // Act
      const result = await bitcoinService.generateWallet();

      // Assert
      expect(mockApiClient.executeRequest).toHaveBeenCalledWith('POST', '/v3/bitcoin/wallet', {});
      expect(result).toEqual(mockResponse);
      expect(result.data.mnemonic).toBeDefined();
      expect(result.data.xpub).toBeDefined();
      expect(result.data.xpub).toMatch(/^xpub[a-km-zA-HJ-NP-Z1-9]{107,108}$/);
    });

    it('should handle API errors gracefully', async () => {
      // Arrange
      const mockErrorResponse: TatumApiResponse = {
        error: 'API rate limit exceeded',
        status: 429,
        statusText: 'Too Many Requests'
      };
      mockApiClient.executeRequest.mockResolvedValue(mockErrorResponse);

      // Act
      const result = await bitcoinService.generateWallet();

      // Assert
      expect(mockApiClient.executeRequest).toHaveBeenCalledWith('POST', '/v3/bitcoin/wallet', {});
      expect(result).toEqual(mockErrorResponse);
      expect(result.error).toBe('API rate limit exceeded');
      expect(result.status).toBe(429);
    });

    it('should handle network errors', async () => {
      // Arrange
      const networkError = new Error('Network timeout');
      mockApiClient.executeRequest.mockRejectedValue(networkError);

      // Act & Assert
      await expect(bitcoinService.generateWallet()).rejects.toThrow('Network timeout');
      expect(mockApiClient.executeRequest).toHaveBeenCalledWith('POST', '/v3/bitcoin/wallet', {});
    });
  });

  describe('generateAddress', () => {
    const validArgs: GenerateAddressArgs = {
      xpub: 'xpub6CUGRUonZSQ4TWtTMmzXdrXDtypWKiKrhko4egpiMZbpiaQL2jkwSB1icqYh2cfDfVxdx4df189oLKnC5fSwqPiCSQQMXnEt7zB5cCkuBBK',
      index: 0
    };

    it('should generate a valid Bitcoin address from xpub', async () => {
      // Arrange
      const mockResponse: TatumApiResponse = {
        data: {
          address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'
        },
        status: 200,
        statusText: 'OK'
      };
      mockApiClient.executeRequest.mockResolvedValue(mockResponse);

      // Act
      const result = await bitcoinService.generateAddress(validArgs);

      // Assert
      expect(mockApiClient.executeRequest).toHaveBeenCalledWith('GET', '/v3/bitcoin/address/{xpub}/{index}', {
        xpub: validArgs.xpub,
        index: validArgs.index
      });
      expect(result).toEqual(mockResponse);
      expect(result.data.address).toBeDefined();
      expect(result.data.address).toMatch(/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/);
    });

    it('should validate xpub format', async () => {
      // Arrange
      const invalidArgs: GenerateAddressArgs = {
        xpub: 'invalid-xpub',
        index: 0
      };

      // Act
      const result = await bitcoinService.generateAddress(invalidArgs);

      // Assert
      expect(mockApiClient.executeRequest).not.toHaveBeenCalled();
      expect(result.error).toBe('Invalid arguments for generateAddress');
      expect(result.status).toBe(400);
      expect(result.statusText).toBe('Bad Request');
    });

    it('should validate index range', async () => {
      // Arrange
      const invalidArgs: GenerateAddressArgs = {
        xpub: validArgs.xpub,
        index: -1
      };

      // Act
      const result = await bitcoinService.generateAddress(invalidArgs);

      // Assert
      expect(mockApiClient.executeRequest).not.toHaveBeenCalled();
      expect(result.error).toBe('Invalid arguments for generateAddress');
      expect(result.status).toBe(400);
    });

    it('should validate index upper bound', async () => {
      // Arrange
      const invalidArgs: GenerateAddressArgs = {
        xpub: validArgs.xpub,
        index: 2147483648 // 2^31, exceeds maximum
      };

      // Act
      const result = await bitcoinService.generateAddress(invalidArgs);

      // Assert
      expect(mockApiClient.executeRequest).not.toHaveBeenCalled();
      expect(result.error).toBe('Invalid arguments for generateAddress');
      expect(result.status).toBe(400);
    });

    it('should handle missing arguments', async () => {
      // Act
      const result = await bitcoinService.generateAddress(null as any);

      // Assert
      expect(mockApiClient.executeRequest).not.toHaveBeenCalled();
      expect(result.error).toBe('Invalid arguments for generateAddress');
      expect(result.status).toBe(400);
    });

    it('should handle API errors for address generation', async () => {
      // Arrange
      const mockErrorResponse: TatumApiResponse = {
        error: 'Invalid extended public key',
        status: 400,
        statusText: 'Bad Request'
      };
      mockApiClient.executeRequest.mockResolvedValue(mockErrorResponse);

      // Act
      const result = await bitcoinService.generateAddress(validArgs);

      // Assert
      expect(result).toEqual(mockErrorResponse);
      expect(result.error).toBe('Invalid extended public key');
    });
  });

  describe('generatePrivateKey', () => {
    const validArgs: GeneratePrivateKeyArgs = {
      mnemonic: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
      index: 0
    };

    it('should generate a valid private key from mnemonic', async () => {
      // Arrange
      const mockResponse: TatumApiResponse = {
        data: {
          key: 'KwDiBf89QgGbjEhKnhXJuH7LrciVrZi3qYjgd9M7rFU73sVHnoWn'
        },
        status: 200,
        statusText: 'OK'
      };
      mockApiClient.executeRequest.mockResolvedValue(mockResponse);

      // Act
      const result = await bitcoinService.generatePrivateKey(validArgs);

      // Assert
      expect(mockApiClient.executeRequest).toHaveBeenCalledWith('POST', '/v3/bitcoin/wallet/priv', {
        mnemonic: validArgs.mnemonic,
        index: validArgs.index
      });
      expect(result).toEqual(mockResponse);
      expect(result.data.key).toBeDefined();
      expect(typeof result.data.key).toBe('string');
    });

    it('should validate mnemonic format - 12 words', async () => {
      // Arrange
      const validTwelveWordArgs: GeneratePrivateKeyArgs = {
        mnemonic: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
        index: 0
      };
      const mockResponse: TatumApiResponse = {
        data: { key: 'test-key' },
        status: 200,
        statusText: 'OK'
      };
      mockApiClient.executeRequest.mockResolvedValue(mockResponse);

      // Act
      const result = await bitcoinService.generatePrivateKey(validTwelveWordArgs);

      // Assert
      expect(mockApiClient.executeRequest).toHaveBeenCalled();
      expect(result.status).toBe(200);
    });

    it('should validate mnemonic format - 24 words', async () => {
      // Arrange
      const validTwentyFourWordArgs: GeneratePrivateKeyArgs = {
        mnemonic: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon art',
        index: 0
      };
      const mockResponse: TatumApiResponse = {
        data: { key: 'test-key' },
        status: 200,
        statusText: 'OK'
      };
      mockApiClient.executeRequest.mockResolvedValue(mockResponse);

      // Act
      const result = await bitcoinService.generatePrivateKey(validTwentyFourWordArgs);

      // Assert
      expect(mockApiClient.executeRequest).toHaveBeenCalled();
      expect(result.status).toBe(200);
    });

    it('should reject invalid mnemonic word count', async () => {
      // Arrange
      const invalidArgs: GeneratePrivateKeyArgs = {
        mnemonic: 'abandon abandon abandon', // Only 3 words
        index: 0
      };

      // Act
      const result = await bitcoinService.generatePrivateKey(invalidArgs);

      // Assert
      expect(mockApiClient.executeRequest).not.toHaveBeenCalled();
      expect(result.error).toBe('Invalid arguments for generatePrivateKey');
      expect(result.status).toBe(400);
    });

    it('should reject empty mnemonic', async () => {
      // Arrange
      const invalidArgs: GeneratePrivateKeyArgs = {
        mnemonic: '',
        index: 0
      };

      // Act
      const result = await bitcoinService.generatePrivateKey(invalidArgs);

      // Assert
      expect(mockApiClient.executeRequest).not.toHaveBeenCalled();
      expect(result.error).toBe('Invalid arguments for generatePrivateKey');
      expect(result.status).toBe(400);
    });

    it('should validate index range for private key generation', async () => {
      // Arrange
      const invalidArgs: GeneratePrivateKeyArgs = {
        mnemonic: validArgs.mnemonic,
        index: -5
      };

      // Act
      const result = await bitcoinService.generatePrivateKey(invalidArgs);

      // Assert
      expect(mockApiClient.executeRequest).not.toHaveBeenCalled();
      expect(result.error).toBe('Invalid arguments for generatePrivateKey');
      expect(result.status).toBe(400);
    });

    it('should handle missing arguments for private key generation', async () => {
      // Act
      const result = await bitcoinService.generatePrivateKey(undefined as any);

      // Assert
      expect(mockApiClient.executeRequest).not.toHaveBeenCalled();
      expect(result.error).toBe('Invalid arguments for generatePrivateKey');
      expect(result.status).toBe(400);
    });

    it('should handle API errors for private key generation', async () => {
      // Arrange
      const mockErrorResponse: TatumApiResponse = {
        error: 'Invalid mnemonic phrase',
        status: 400,
        statusText: 'Bad Request'
      };
      mockApiClient.executeRequest.mockResolvedValue(mockErrorResponse);

      // Act
      const result = await bitcoinService.generatePrivateKey(validArgs);

      // Assert
      expect(result).toEqual(mockErrorResponse);
      expect(result.error).toBe('Invalid mnemonic phrase');
    });
  });

  describe('Wallet Operations Integration', () => {
    it('should support complete wallet workflow', async () => {
      // Arrange - Mock wallet generation
      const walletResponse: TatumApiResponse = {
        data: {
          mnemonic: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
          xpub: 'xpub6CUGRUonZSQ4TWtTMmzXdrXDtypWKiKrhko4egpiMZbpiaQL2jkwSB1icqYh2cfDfVxdx4df189oLKnC5fSwqPiCSQQMXnEt7zB5cCkuBBK'
        },
        status: 200,
        statusText: 'OK'
      };

      const addressResponse: TatumApiResponse = {
        data: {
          address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'
        },
        status: 200,
        statusText: 'OK'
      };

      const privateKeyResponse: TatumApiResponse = {
        data: {
          key: 'KwDiBf89QgGbjEhKnhXJuH7LrciVrZi3qYjgd9M7rFU73sVHnoWn'
        },
        status: 200,
        statusText: 'OK'
      };

      mockApiClient.executeRequest
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
      expect(mockApiClient.executeRequest).toHaveBeenCalledTimes(3);
    });
  });
});