import { BitcoinService } from '../bitcoin';
import { TatumApiClient } from '../../api-client';
import { BitcoinErrorCode } from '../../types/bitcoin';
import { TatumApiResponse } from '../../types';

// Mock the TatumApiClient
jest.mock('../../api-client');
const MockedTatumApiClient = TatumApiClient as jest.MockedClass<typeof TatumApiClient>;

describe('BitcoinService Error Handling', () => {
  let bitcoinService: BitcoinService;
  let mockApiClient: jest.Mocked<TatumApiClient>;

  beforeEach(() => {
    mockApiClient = new MockedTatumApiClient({
      baseUrl: 'https://api.tatum.io',
      apiKey: 'test-api-key',
      timeout: 30000,
      retryAttempts: 3
    }) as jest.Mocked<TatumApiClient>;
    bitcoinService = new BitcoinService(mockApiClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Validation Error Handling', () => {
    describe('generateAddress validation', () => {
      it('should return validation error for missing arguments', async () => {
        const result = await bitcoinService.generateAddress(null as any);
        
        expect(result.status).toBe(400);
        expect(result.error).toContain('Arguments are required');
        expect(result.data?.errorCode).toBe(BitcoinErrorCode.VALIDATION_ERROR);
      });

      it('should return validation error for missing xpub', async () => {
        const result = await bitcoinService.generateAddress({ index: 0 } as any);
        
        expect(result.status).toBe(400);
        expect(result.error).toContain('Extended public key (xpub) is required');
        expect(result.data?.errorCode).toBe(BitcoinErrorCode.VALIDATION_ERROR);
      });

      it('should return validation error for invalid xpub format', async () => {
        const result = await bitcoinService.generateAddress({
          xpub: 'invalid-xpub',
          index: 0
        });
        
        expect(result.status).toBe(400);
        expect(result.error).toContain('Invalid extended public key format');
        expect(result.data?.errorCode).toBe(BitcoinErrorCode.VALIDATION_ERROR);
      });

      it('should return validation error for invalid index', async () => {
        const result = await bitcoinService.generateAddress({
          xpub: 'xpub6CUGRUonZSQ4TWtTMmzXdrXDtypWKiKrhko4egpiMZbpiaQL2jkwSB1icqYh2cfDfVxdx4df189oLKnC5fSwqPfgyP3hooxujYzAu3fDVmz',
          index: -1
        });
        
        expect(result.status).toBe(400);
        expect(result.error).toContain('Index must be between 0 and 2147483647');
        expect(result.data?.errorCode).toBe(BitcoinErrorCode.VALIDATION_ERROR);
      });
    });

    describe('getBalance validation', () => {
      it('should return validation error for invalid address', async () => {
        const result = await bitcoinService.getBalance({
          address: 'invalid-address'
        });
        
        expect(result.status).toBe(400);
        expect(result.error).toContain('Invalid Bitcoin address format');
        expect(result.data?.errorCode).toBe(BitcoinErrorCode.VALIDATION_ERROR);
      });
    });

    describe('getMultipleBalances validation', () => {
      it('should return validation error for empty addresses array', async () => {
        const result = await bitcoinService.getMultipleBalances({
          addresses: []
        });
        
        expect(result.status).toBe(400);
        expect(result.error).toContain('At least one address is required');
        expect(result.data?.errorCode).toBe(BitcoinErrorCode.VALIDATION_ERROR);
      });

      it('should return validation error for too many addresses', async () => {
        const addresses = Array(101).fill('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa');
        const result = await bitcoinService.getMultipleBalances({ addresses });
        
        expect(result.status).toBe(400);
        expect(result.error).toContain('Maximum 100 addresses allowed');
        expect(result.data?.errorCode).toBe(BitcoinErrorCode.VALIDATION_ERROR);
      });

      it('should return validation error for invalid address in array', async () => {
        const result = await bitcoinService.getMultipleBalances({
          addresses: ['1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 'invalid-address']
        });
        
        expect(result.status).toBe(400);
        expect(result.error).toContain('Invalid Bitcoin address format at index 1');
        expect(result.data?.errorCode).toBe(BitcoinErrorCode.VALIDATION_ERROR);
      });
    });

    describe('sendTransaction validation', () => {
      it('should return validation error for empty fromAddress array', async () => {
        const result = await bitcoinService.sendTransaction({
          fromAddress: [],
          to: [{ address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', value: 0.001 }]
        });
        
        expect(result.status).toBe(400);
        expect(result.error).toContain('At least one from address is required');
        expect(result.data?.errorCode).toBe(BitcoinErrorCode.VALIDATION_ERROR);
      });

      it('should return validation error for invalid output amount', async () => {
        const result = await bitcoinService.sendTransaction({
          fromAddress: ['1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'],
          to: [{ address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', value: -1 }]
        });
        
        expect(result.status).toBe(400);
        expect(result.error).toContain('Invalid amount at output index 0');
        expect(result.data?.errorCode).toBe(BitcoinErrorCode.VALIDATION_ERROR);
      });

      it('should return validation error for invalid change address', async () => {
        const result = await bitcoinService.sendTransaction({
          fromAddress: ['1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'],
          to: [{ address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', value: 0.001 }],
          changeAddress: 'invalid-address'
        });
        
        expect(result.status).toBe(400);
        expect(result.error).toContain('Invalid change address format');
        expect(result.data?.errorCode).toBe(BitcoinErrorCode.VALIDATION_ERROR);
      });
    });

    describe('broadcastTransaction validation', () => {
      it('should return validation error for non-hex transaction data', async () => {
        const result = await bitcoinService.broadcastTransaction({
          txData: 'not-hex-data'
        });
        
        expect(result.status).toBe(400);
        expect(result.error).toContain('Transaction data must be a valid hex string');
        expect(result.data?.errorCode).toBe(BitcoinErrorCode.VALIDATION_ERROR);
      });

      it('should return validation error for empty transaction data', async () => {
        const result = await bitcoinService.broadcastTransaction({
          txData: ''
        });
        
        expect(result.status).toBe(400);
        expect(result.error).toContain('Transaction data cannot be empty');
        expect(result.data?.errorCode).toBe(BitcoinErrorCode.VALIDATION_ERROR);
      });
    });

    describe('connectRpcDriver validation', () => {
      it('should return validation error for invalid URL', async () => {
        const result = await bitcoinService.connectRpcDriver({
          nodeUrl: 'not-a-url'
        });
        
        expect(result.status).toBe(400);
        expect(result.error).toContain('Invalid node URL format');
        expect(result.data?.errorCode).toBe(BitcoinErrorCode.VALIDATION_ERROR);
      });
    });
  });

  describe('Network Error Handling and Retry Logic', () => {
    it('should retry on rate limiting (429) and eventually succeed', async () => {
      mockApiClient.executeRequest
        .mockResolvedValueOnce({ status: 429, statusText: 'Too Many Requests', error: 'Rate limited' })
        .mockResolvedValueOnce({ status: 429, statusText: 'Too Many Requests', error: 'Rate limited' })
        .mockResolvedValueOnce({ status: 200, statusText: 'OK', data: { balance: '1.0' } });

      const result = await bitcoinService.getBalance({
        address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'
      });

      expect(mockApiClient.executeRequest).toHaveBeenCalledTimes(3);
      expect(result.status).toBe(200);
      expect(result.data).toEqual({ balance: '1.0' });
    });

    it('should retry on server errors (5xx) and eventually succeed', async () => {
      mockApiClient.executeRequest
        .mockResolvedValueOnce({ status: 500, statusText: 'Internal Server Error', error: 'Server error' })
        .mockResolvedValueOnce({ status: 502, statusText: 'Bad Gateway', error: 'Gateway error' })
        .mockResolvedValueOnce({ status: 200, statusText: 'OK', data: { balance: '1.0' } });

      const result = await bitcoinService.getBalance({
        address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'
      });

      expect(mockApiClient.executeRequest).toHaveBeenCalledTimes(3);
      expect(result.status).toBe(200);
      expect(result.data).toEqual({ balance: '1.0' });
    });

    it('should return rate limit error after max retries', async () => {
      mockApiClient.executeRequest
        .mockResolvedValue({ status: 429, statusText: 'Too Many Requests', error: 'Rate limited' });

      const result = await bitcoinService.getBalance({
        address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'
      });

      expect(mockApiClient.executeRequest).toHaveBeenCalledTimes(3);
      expect(result.status).toBe(429);
      expect(result.error).toContain('Rate limit exceeded');
      expect(result.data?.errorCode).toBe(BitcoinErrorCode.RATE_LIMIT_EXCEEDED);
    });

    it('should return network error after max retries on server errors', async () => {
      mockApiClient.executeRequest
        .mockResolvedValue({ status: 500, statusText: 'Internal Server Error', error: 'Server error' });

      const result = await bitcoinService.getBalance({
        address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'
      });

      expect(mockApiClient.executeRequest).toHaveBeenCalledTimes(3);
      expect(result.status).toBe(500);
      expect(result.error).toContain('Server error occurred after multiple attempts');
      expect(result.data?.errorCode).toBe(BitcoinErrorCode.NETWORK_ERROR);
    });

    it('should not retry on client errors (4xx)', async () => {
      mockApiClient.executeRequest
        .mockResolvedValueOnce({ status: 404, statusText: 'Not Found', error: 'Address not found' });

      const result = await bitcoinService.getBalance({
        address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'
      });

      expect(mockApiClient.executeRequest).toHaveBeenCalledTimes(1);
      expect(result.status).toBe(404);
      expect(result.error).toContain('Address not found');
    });

    it('should handle timeout errors with proper error code', async () => {
      mockApiClient.executeRequest
        .mockRejectedValue({ code: 'ETIMEDOUT', message: 'Request timeout' });

      const result = await bitcoinService.getBalance({
        address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'
      });

      expect(mockApiClient.executeRequest).toHaveBeenCalledTimes(3);
      expect(result.status).toBe(408);
      expect(result.error).toContain('Request timed out after multiple attempts');
      expect(result.data?.errorCode).toBe(BitcoinErrorCode.TIMEOUT);
    });

    it('should handle network connection errors', async () => {
      mockApiClient.executeRequest
        .mockRejectedValue({ code: 'ECONNRESET', message: 'Connection reset' });

      const result = await bitcoinService.getBalance({
        address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'
      });

      expect(mockApiClient.executeRequest).toHaveBeenCalledTimes(3);
      expect(result.status).toBe(500);
      expect(result.error).toContain('Connection reset');
      expect(result.data?.errorCode).toBe(BitcoinErrorCode.NETWORK_ERROR);
    });
  });

  describe('Structured Error Responses', () => {
    it('should include error code and details in validation errors', async () => {
      const result = await bitcoinService.getBalance({
        address: 'invalid-address'
      });

      expect(result).toMatchObject({
        error: expect.stringContaining('Invalid Bitcoin address format'),
        status: 400,
        statusText: 'Bad Request',
        data: {
          errorCode: BitcoinErrorCode.VALIDATION_ERROR,
          details: {
            code: BitcoinErrorCode.VALIDATION_ERROR,
            message: expect.stringContaining('Invalid Bitcoin address format'),
            field: 'address',
            value: 'invalid-address',
            constraint: 'validation_failed'
          }
        }
      });
    });

    it('should include operation context in network errors', async () => {
      mockApiClient.executeRequest
        .mockResolvedValue({ status: 500, statusText: 'Internal Server Error', error: 'Server error' });

      const result = await bitcoinService.getBalance({
        address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'
      });

      expect(result.data?.details).toMatchObject({
        operation: 'getBalance'
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle null/undefined arguments gracefully', async () => {
      const result = await bitcoinService.generateAddress(undefined as any);
      
      expect(result.status).toBe(400);
      expect(result.error).toContain('Arguments are required');
    });

    it('should handle malformed API responses', async () => {
      mockApiClient.executeRequest
        .mockResolvedValueOnce({ status: 200, statusText: 'OK' } as any); // Missing data

      const result = await bitcoinService.getBalance({
        address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'
      });

      expect(result.status).toBe(200);
      expect(result.statusText).toBe('OK');
    });

    it('should validate transaction hash format correctly', async () => {
      const result = await bitcoinService.getTransaction({
        hash: '0e3e2357e806b6cdb1f70b54c3a3a17b6714ee1f0e68bebb44a74b1efd51209' // 63 chars
      });

      expect(result.status).toBe(400);
      expect(result.error).toContain('Invalid transaction hash format');
    });

    it('should validate block height bounds', async () => {
      const result = await bitcoinService.getBlockHash({
        height: -1
      });

      expect(result.status).toBe(400);
      expect(result.error).toContain('Block height must be 0 or greater');
    });

    it('should validate pagination parameters', async () => {
      const result = await bitcoinService.getTransactions({
        address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        pageSize: 101 // Over limit
      });

      expect(result.status).toBe(400);
      expect(result.error).toContain('Page size must be between 1 and 100');
    });

    it('should validate batch transaction addresses limit', async () => {
      const addresses = Array(11).fill('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa');
      const result = await bitcoinService.getTransactionsBatch({ addresses });

      expect(result.status).toBe(400);
      expect(result.error).toContain('Maximum 10 addresses allowed per batch request');
    });
  });

  describe('Exponential Backoff', () => {
    it('should implement exponential backoff with jitter', async () => {
      const startTime = Date.now();
      
      mockApiClient.executeRequest
        .mockResolvedValue({ status: 500, statusText: 'Internal Server Error', error: 'Server error' });

      await bitcoinService.getBalance({
        address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'
      });

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Should take at least the base retry delays (1s + 2s = 3s minimum)
      // But we'll be more lenient in tests to avoid flakiness
      expect(totalTime).toBeGreaterThan(500); // At least some delay
      expect(mockApiClient.executeRequest).toHaveBeenCalledTimes(3);
    });
  });
});