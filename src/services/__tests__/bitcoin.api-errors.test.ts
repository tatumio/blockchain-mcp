/**
 * Tests for Bitcoin service error handling with real API error responses
 * These tests verify that the service handles various API error scenarios correctly
 */

import { BitcoinService } from '../bitcoin';
import { TatumApiClient } from '../../api-client';
import { BitcoinErrorCode } from '../../types/bitcoin';

// Mock the TatumApiClient
jest.mock('../../api-client');
const MockedTatumApiClient = TatumApiClient as jest.MockedClass<typeof TatumApiClient>;

describe('BitcoinService API Error Handling Tests', () => {
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

  describe('Authentication and Authorization Errors', () => {
    it('should handle invalid API key error', async () => {
      mockApiClient.executeRequest.mockResolvedValue({
        status: 401,
        statusText: 'Unauthorized',
        error: 'Invalid API key provided',
        data: {
          errorCode: 'API_KEY_INVALID',
          message: 'The provided API key is invalid or expired'
        }
      });

      const result = await bitcoinService.getBlockchainInfo();

      expect(result.status).toBe(401);
      expect(result.error).toContain('Invalid API key');
      expect(result.data?.errorCode).toBe('API_KEY_INVALID');
    });

    it('should handle API key quota exceeded', async () => {
      mockApiClient.executeRequest.mockResolvedValue({
        status: 402,
        statusText: 'Payment Required',
        error: 'API key quota exceeded',
        data: {
          errorCode: 'QUOTA_EXCEEDED',
          message: 'Monthly API call limit reached',
          details: {
            limit: 10000,
            used: 10000,
            resetDate: '2024-02-01T00:00:00Z'
          }
        }
      });

      const result = await bitcoinService.getBalance({
        address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'
      });

      expect(result.status).toBe(402);
      expect(result.error).toContain('quota exceeded');
      expect(result.data?.details?.limit).toBe(10000);
    });

    it('should handle insufficient permissions', async () => {
      mockApiClient.executeRequest.mockResolvedValue({
        status: 403,
        statusText: 'Forbidden',
        error: 'Insufficient permissions for this operation',
        data: {
          errorCode: 'INSUFFICIENT_PERMISSIONS',
          message: 'Your API key does not have permission to access Bitcoin RPC operations',
          requiredPermission: 'bitcoin:rpc'
        }
      });

      const result = await bitcoinService.connectRpcDriver({
        nodeUrl: 'http://localhost:8332'
      });

      expect(result.status).toBe(403);
      expect(result.error).toContain('Insufficient permissions');
      expect(result.data?.requiredPermission).toBe('bitcoin:rpc');
    });
  });

  describe('Resource Not Found Errors', () => {
    it('should handle transaction not found', async () => {
      mockApiClient.executeRequest.mockResolvedValue({
        status: 404,
        statusText: 'Not Found',
        error: 'Transaction not found',
        data: {
          errorCode: 'TRANSACTION_NOT_FOUND',
          message: 'No transaction found with the specified hash',
          hash: '0000000000000000000000000000000000000000000000000000000000000000'
        }
      });

      const result = await bitcoinService.getTransaction({
        hash: '0000000000000000000000000000000000000000000000000000000000000000'
      });

      expect(result.status).toBe(404);
      expect(result.error).toContain('Transaction not found');
      expect(result.data?.errorCode).toBe('TRANSACTION_NOT_FOUND');
    });

    it('should handle block not found', async () => {
      mockApiClient.executeRequest.mockResolvedValue({
        status: 404,
        statusText: 'Not Found',
        error: 'Block not found',
        data: {
          errorCode: 'BLOCK_NOT_FOUND',
          message: 'No block found at the specified height',
          height: 999999999
        }
      });

      const result = await bitcoinService.getBlockHash({
        height: 999999999
      });

      expect(result.status).toBe(404);
      expect(result.error).toContain('Block not found');
      expect(result.data?.errorCode).toBe('BLOCK_NOT_FOUND');
    });

    it('should handle UTXO not found (spent)', async () => {
      mockApiClient.executeRequest.mockResolvedValue({
        status: 404,
        statusText: 'Not Found',
        error: 'UTXO not found or already spent',
        data: {
          errorCode: 'UTXO_NOT_FOUND',
          message: 'The specified UTXO has been spent or does not exist',
          hash: '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b',
          index: 0
        }
      });

      const result = await bitcoinService.getUtxo({
        hash: '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b',
        index: 0
      });

      expect(result.status).toBe(404);
      expect(result.error).toContain('UTXO not found');
      expect(result.data?.errorCode).toBe('UTXO_NOT_FOUND');
    });

    it('should handle address with no transactions', async () => {
      mockApiClient.executeRequest.mockResolvedValue({
        status: 200,
        statusText: 'OK',
        data: {
          transactions: [],
          total: 0,
          pageSize: 50,
          offset: 0
        }
      });

      const result = await bitcoinService.getTransactions({
        address: '1NewAddressWithNoTransactions123456789'
      });

      expect(result.status).toBe(200);
      expect(result.data.transactions).toHaveLength(0);
      expect(result.data.total).toBe(0);
    });
  });

  describe('Rate Limiting and Throttling Errors', () => {
    it('should handle rate limit exceeded with retry-after header', async () => {
      mockApiClient.executeRequest.mockResolvedValue({
        status: 429,
        statusText: 'Too Many Requests',
        error: 'Rate limit exceeded',
        data: {
          errorCode: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests. Please try again later.',
          retryAfter: 60
        }
      });

      const result = await bitcoinService.getBlockchainInfo();

      expect(result.status).toBe(429);
      expect(result.error).toContain('Rate limit exceeded');
      expect(result.data?.retryAfter).toBe(60);
    });

    it('should handle concurrent request limit', async () => {
      mockApiClient.executeRequest.mockResolvedValue({
        status: 429,
        statusText: 'Too Many Requests',
        error: 'Too many concurrent requests',
        data: {
          errorCode: 'CONCURRENT_LIMIT_EXCEEDED',
          message: 'Maximum number of concurrent requests exceeded',
          maxConcurrent: 10,
          current: 15
        }
      });

      const result = await bitcoinService.getBalance({
        address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'
      });

      expect(result.status).toBe(429);
      expect(result.error).toContain('concurrent requests');
      expect(result.data?.maxConcurrent).toBe(10);
    });

    it('should handle daily request limit exceeded', async () => {
      mockApiClient.executeRequest.mockResolvedValue({
        status: 429,
        statusText: 'Too Many Requests',
        error: 'Daily request limit exceeded',
        data: {
          errorCode: 'DAILY_LIMIT_EXCEEDED',
          message: 'Daily API request limit has been exceeded',
          limit: 1000,
          used: 1000,
          resetTime: '2024-01-02T00:00:00Z'
        }
      });

      const result = await bitcoinService.getTransactions({
        address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'
      });

      expect(result.status).toBe(429);
      expect(result.error).toContain('Daily request limit');
      expect(result.data?.limit).toBe(1000);
    });
  });

  describe('Server and Network Errors', () => {
    it('should handle internal server error', async () => {
      mockApiClient.executeRequest.mockResolvedValue({
        status: 500,
        statusText: 'Internal Server Error',
        error: 'Internal server error occurred',
        data: {
          errorCode: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred on the server',
          requestId: 'req_123456789'
        }
      });

      const result = await bitcoinService.getBlockchainInfo();

      expect(result.status).toBe(500);
      expect(result.error).toContain('Internal server error');
      expect(result.data?.requestId).toBe('req_123456789');
    });

    it('should handle bad gateway error', async () => {
      mockApiClient.executeRequest.mockResolvedValue({
        status: 502,
        statusText: 'Bad Gateway',
        error: 'Bad gateway - upstream server error',
        data: {
          errorCode: 'BAD_GATEWAY',
          message: 'The upstream Bitcoin node is not responding',
          upstreamError: 'Connection timeout'
        }
      });

      const result = await bitcoinService.getBalance({
        address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'
      });

      expect(result.status).toBe(502);
      expect(result.error).toContain('Bad gateway');
      expect(result.data?.upstreamError).toBe('Connection timeout');
    });

    it('should handle service unavailable', async () => {
      mockApiClient.executeRequest.mockResolvedValue({
        status: 503,
        statusText: 'Service Unavailable',
        error: 'Service temporarily unavailable',
        data: {
          errorCode: 'SERVICE_UNAVAILABLE',
          message: 'Bitcoin service is temporarily unavailable for maintenance',
          estimatedRecovery: '2024-01-01T12:00:00Z'
        }
      });

      const result = await bitcoinService.getMempoolTransactions();

      expect(result.status).toBe(503);
      expect(result.error).toContain('Service temporarily unavailable');
      expect(result.data?.estimatedRecovery).toBeDefined();
    });

    it('should handle gateway timeout', async () => {
      mockApiClient.executeRequest.mockResolvedValue({
        status: 504,
        statusText: 'Gateway Timeout',
        error: 'Gateway timeout',
        data: {
          errorCode: 'GATEWAY_TIMEOUT',
          message: 'The request to the Bitcoin node timed out',
          timeout: 30000
        }
      });

      const result = await bitcoinService.getBlock({
        height: 800000
      });

      expect(result.status).toBe(504);
      expect(result.error).toContain('Gateway timeout');
      expect(result.data?.timeout).toBe(30000);
    });
  });

  describe('Bitcoin Network Specific Errors', () => {
    it('should handle insufficient funds for transaction', async () => {
      mockApiClient.executeRequest.mockResolvedValue({
        status: 400,
        statusText: 'Bad Request',
        error: 'Insufficient funds',
        data: {
          errorCode: 'INSUFFICIENT_FUNDS',
          message: 'Not enough Bitcoin to complete the transaction',
          required: '1.00000000',
          available: '0.50000000',
          fee: '0.00001000'
        }
      });

      const result = await bitcoinService.sendTransaction({
        fromAddress: ['1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'],
        to: [{ address: '12c6DSiU4Rq3P4ZxziKxzrL5LmMBrzjrJX', value: 1.0 }]
      });

      expect(result.status).toBe(400);
      expect(result.error).toContain('Insufficient funds');
      expect(result.data?.errorCode).toBe('INSUFFICIENT_FUNDS');
      expect(result.data?.required).toBe('1.00000000');
    });

    it('should handle transaction broadcast failure', async () => {
      mockApiClient.executeRequest.mockResolvedValue({
        status: 400,
        statusText: 'Bad Request',
        error: 'Transaction broadcast failed',
        data: {
          errorCode: 'BROADCAST_FAILED',
          message: 'Transaction was rejected by the network',
          reason: 'bad-txns-inputs-missingorspent',
          txData: '0100000001...'
        }
      });

      const result = await bitcoinService.broadcastTransaction({
        txData: '0100000001...'
      });

      expect(result.status).toBe(400);
      expect(result.error).toContain('Transaction broadcast failed');
      expect(result.data?.errorCode).toBe('BROADCAST_FAILED');
      expect(result.data?.reason).toBe('bad-txns-inputs-missingorspent');
    });

    it('should handle invalid transaction format', async () => {
      mockApiClient.executeRequest.mockResolvedValue({
        status: 400,
        statusText: 'Bad Request',
        error: 'Invalid transaction format',
        data: {
          errorCode: 'INVALID_TRANSACTION',
          message: 'The transaction data is malformed or invalid',
          details: 'Invalid hex encoding'
        }
      });

      const result = await bitcoinService.broadcastTransaction({
        txData: 'invalid-hex-data'
      });

      expect(result.status).toBe(400);
      expect(result.error).toContain('Invalid transaction format');
      expect(result.data?.errorCode).toBe('INVALID_TRANSACTION');
    });

    it('should handle RPC connection errors', async () => {
      mockApiClient.executeRequest.mockResolvedValue({
        status: 500,
        statusText: 'Internal Server Error',
        error: 'RPC connection failed',
        data: {
          errorCode: 'RPC_ERROR',
          message: 'Failed to connect to Bitcoin RPC node',
          nodeUrl: 'http://localhost:8332',
          rpcError: 'ECONNREFUSED'
        }
      });

      const result = await bitcoinService.connectRpcDriver({
        nodeUrl: 'http://localhost:8332'
      });

      expect(result.status).toBe(500);
      expect(result.error).toContain('RPC connection failed');
      expect(result.data?.errorCode).toBe('RPC_ERROR');
      expect(result.data?.rpcError).toBe('ECONNREFUSED');
    });
  });

  describe('Malformed Response Handling', () => {
    it('should handle malformed JSON response', async () => {
      mockApiClient.executeRequest.mockResolvedValue({
        status: 200,
        statusText: 'OK',
        data: null, // Malformed response
        error: 'Invalid JSON in response'
      });

      const result = await bitcoinService.getBlockchainInfo();

      expect(result.status).toBe(200);
      expect(result.data).toBeNull();
      expect(result.error).toContain('Invalid JSON');
    });

    it('should handle unexpected response structure', async () => {
      mockApiClient.executeRequest.mockResolvedValue({
        status: 200,
        statusText: 'OK',
        data: {
          // Missing expected fields
          unexpectedField: 'value'
        }
      });

      const result = await bitcoinService.getBalance({
        address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'
      });

      expect(result.status).toBe(200);
      expect(result.data.unexpectedField).toBe('value');
      // Service should handle missing fields gracefully
    });

    it('should handle empty response body', async () => {
      mockApiClient.executeRequest.mockResolvedValue({
        status: 200,
        statusText: 'OK',
        data: undefined
      });

      const result = await bitcoinService.getBlockchainInfo();

      expect(result.status).toBe(200);
      expect(result.data).toBeUndefined();
    });
  });

  describe('Network Connectivity Errors', () => {
    it('should handle connection timeout', async () => {
      mockApiClient.executeRequest.mockRejectedValue({
        code: 'ETIMEDOUT',
        message: 'Request timeout',
        timeout: 30000
      });

      const result = await bitcoinService.getBlockchainInfo();

      expect(result.status).toBe(408);
      expect(result.error).toContain('Request timed out');
      expect(result.data?.errorCode).toBe(BitcoinErrorCode.TIMEOUT);
    });

    it('should handle connection refused', async () => {
      mockApiClient.executeRequest.mockRejectedValue({
        code: 'ECONNREFUSED',
        message: 'Connection refused',
        address: '127.0.0.1',
        port: 443
      });

      const result = await bitcoinService.getBalance({
        address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'
      });

      expect(result.status).toBe(500);
      expect(result.error).toContain('Connection refused');
      expect(result.data?.errorCode).toBe(BitcoinErrorCode.NETWORK_ERROR);
    });

    it('should handle DNS resolution failure', async () => {
      mockApiClient.executeRequest.mockRejectedValue({
        code: 'ENOTFOUND',
        message: 'getaddrinfo ENOTFOUND api.tatum.io',
        hostname: 'api.tatum.io'
      });

      const result = await bitcoinService.getTransactions({
        address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'
      });

      expect(result.status).toBe(500);
      expect(result.error).toContain('ENOTFOUND');
      expect(result.data?.errorCode).toBe(BitcoinErrorCode.NETWORK_ERROR);
    });

    it('should handle SSL/TLS errors', async () => {
      mockApiClient.executeRequest.mockRejectedValue({
        code: 'CERT_UNTRUSTED',
        message: 'certificate not trusted'
      });

      const result = await bitcoinService.getMempoolTransactions();

      expect(result.status).toBe(500);
      expect(result.error).toContain('certificate not trusted');
      expect(result.data?.errorCode).toBe(BitcoinErrorCode.NETWORK_ERROR);
    });
  });

  describe('Error Recovery and Retry Scenarios', () => {
    it('should retry on transient server errors and eventually succeed', async () => {
      mockApiClient.executeRequest
        .mockResolvedValueOnce({
          status: 500,
          statusText: 'Internal Server Error',
          error: 'Temporary server error'
        })
        .mockResolvedValueOnce({
          status: 502,
          statusText: 'Bad Gateway',
          error: 'Gateway error'
        })
        .mockResolvedValueOnce({
          status: 200,
          statusText: 'OK',
          data: {
            chain: 'main',
            blocks: 800000,
            bestblockhash: '00000000000000000002a7c4c1e48d76c5a37902165a270156b7a8d72728a054'
          }
        });

      const result = await bitcoinService.getBlockchainInfo();

      expect(result.status).toBe(200);
      expect(result.data.blocks).toBe(800000);
      expect(mockApiClient.executeRequest).toHaveBeenCalledTimes(3);
    });

    it('should not retry on client errors', async () => {
      mockApiClient.executeRequest.mockResolvedValue({
        status: 400,
        statusText: 'Bad Request',
        error: 'Invalid request parameters'
      });

      const result = await bitcoinService.getTransaction({
        hash: 'invalid-hash'
      });

      expect(result.status).toBe(400);
      expect(mockApiClient.executeRequest).toHaveBeenCalledTimes(1); // No retries
    });

    it('should handle mixed success and failure in concurrent requests', async () => {
      mockApiClient.executeRequest
        .mockResolvedValueOnce({
          status: 200,
          statusText: 'OK',
          data: { balance: '1.00000000', incoming: '1.00000000', outgoing: '0.00000000' }
        })
        .mockResolvedValueOnce({
          status: 429,
          statusText: 'Too Many Requests',
          error: 'Rate limited'
        })
        .mockResolvedValueOnce({
          status: 500,
          statusText: 'Internal Server Error',
          error: 'Server error'
        });

      const addresses = [
        '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        '12c6DSiU4Rq3P4ZxziKxzrL5LmMBrzjrJX',
        '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2'
      ];

      const results = await Promise.all(
        addresses.map(address => bitcoinService.getBalance({ address }))
      );

      expect(results[0].status).toBe(200);
      expect(results[1].status).toBe(429);
      expect(results[2].status).toBe(500);
    });
  });
});