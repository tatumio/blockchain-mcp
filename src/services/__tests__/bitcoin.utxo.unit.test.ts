import { BitcoinService } from '../bitcoin';
import { TatumApiClient } from '../../api-client';
import { TatumApiResponse, ToolExecutionContext } from '../../types';
import {
  GetUtxoArgs,
  ConnectRpcArgs,
  BitcoinUtxo,
  BitcoinMempoolInfo,
  BitcoinRpcConnection
} from '../../types/bitcoin';

// Create a mock for TatumApiClient
const mockExecuteRequest = jest.fn();
jest.mock('../../api-client', () => {
  return {
    TatumApiClient: jest.fn().mockImplementation(() => ({
      executeRequest: mockExecuteRequest
    }))
  };
});

describe('BitcoinService - UTXO and Mempool Operations', () => {
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

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================================
  // getUtxo Tests
  // ============================================================================

  describe('getUtxo', () => {
    const validUtxoArgs: GetUtxoArgs = {
      hash: 'a1b2c3d4e5f67890123456789012345678901234567890123456789012345678',
      index: 0
    };

    const mockUtxoResponse: BitcoinUtxo = {
      hash: 'a1b2c3d4e5f67890123456789012345678901234567890123456789012345678',
      index: 0,
      value: '0.001',
      height: 750000,
      confirmations: 100,
      coinbase: false,
      scriptPubKey: {
        asm: 'OP_DUP OP_HASH160 abc123 OP_EQUALVERIFY OP_CHECKSIG',
        hex: '76a914abc12388ac',
        type: 'pubkeyhash',
        addresses: ['1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa']
      }
    };

    it('should successfully retrieve UTXO information', async () => {
      const expectedResponse: TatumApiResponse = {
        data: mockUtxoResponse,
        status: 200,
        statusText: 'OK'
      };

      mockExecuteRequest.mockResolvedValue(expectedResponse);

      const result = await bitcoinService.getUtxo(validUtxoArgs);

      expect(mockExecuteRequest).toHaveBeenCalledWith(
        'GET',
        '/v3/bitcoin/utxo/{hash}/{index}',
        {
          hash: validUtxoArgs.hash,
          index: validUtxoArgs.index
        }
      );
      expect(result).toEqual(expectedResponse);
    });

    it('should handle UTXO not found error', async () => {
      const errorResponse: TatumApiResponse = {
        error: 'UTXO not found',
        status: 404,
        statusText: 'Not Found'
      };

      mockExecuteRequest.mockResolvedValue(errorResponse);

      const result = await bitcoinService.getUtxo(validUtxoArgs);

      expect(result).toEqual(errorResponse);
    });

    it('should validate arguments and return error for invalid hash', async () => {
      const invalidArgs: GetUtxoArgs = {
        hash: 'invalid-hash',
        index: 0
      };

      const result = await bitcoinService.getUtxo(invalidArgs);

      expect(result.error).toBe('Invalid arguments for getUtxo');
      expect(result.status).toBe(400);
      expect(mockExecuteRequest).not.toHaveBeenCalled();
    });

    it('should validate arguments and return error for invalid index', async () => {
      const invalidArgs: GetUtxoArgs = {
        hash: 'a1b2c3d4e5f67890123456789012345678901234567890123456789012345678',
        index: -1
      };

      const result = await bitcoinService.getUtxo(invalidArgs);

      expect(result.error).toBe('Invalid arguments for getUtxo');
      expect(result.status).toBe(400);
      expect(mockExecuteRequest).not.toHaveBeenCalled();
    });

    it('should validate arguments and return error for missing hash', async () => {
      const invalidArgs = {
        index: 0
      } as GetUtxoArgs;

      const result = await bitcoinService.getUtxo(invalidArgs);

      expect(result.error).toBe('Invalid arguments for getUtxo');
      expect(result.status).toBe(400);
      expect(mockExecuteRequest).not.toHaveBeenCalled();
    });

    it('should validate arguments and return error for missing index', async () => {
      const invalidArgs = {
        hash: 'a1b2c3d4e5f67890123456789012345678901234567890123456789012345678'
      } as GetUtxoArgs;

      const result = await bitcoinService.getUtxo(invalidArgs);

      expect(result.error).toBe('Invalid arguments for getUtxo');
      expect(result.status).toBe(400);
      expect(mockExecuteRequest).not.toHaveBeenCalled();
    });

    it('should handle network errors gracefully', async () => {
      const networkError: TatumApiResponse = {
        error: 'Network timeout',
        status: 500,
        statusText: 'Internal Server Error'
      };

      mockExecuteRequest.mockResolvedValue(networkError);

      const result = await bitcoinService.getUtxo(validUtxoArgs);

      expect(result).toEqual(networkError);
    });
  });

  // ============================================================================
  // getMempoolTransactions Tests
  // ============================================================================

  describe('getMempoolTransactions', () => {
    const mockMempoolResponse: BitcoinMempoolInfo = {
      transactions: [
        {
          hash: 'a1b2c3d4e5f67890123456789012345678901234567890123456789012345678',
          fee: '0.0001',
          vsize: 250,
          weight: 1000,
          time: 1640995200,
          height: 750000,
          descendantcount: 1,
          descendantsize: 250,
          descendantfees: '0.0001',
          ancestorcount: 1,
          ancestorsize: 250,
          ancestorfees: '0.0001'
        },
        {
          hash: 'b2c3d4e5f678901234567890123456789012345678901234567890123456789a',
          fee: '0.0002',
          vsize: 300,
          weight: 1200,
          time: 1640995300,
          height: 750001,
          descendantcount: 2,
          descendantsize: 550,
          descendantfees: '0.0003',
          ancestorcount: 1,
          ancestorsize: 300,
          ancestorfees: '0.0002'
        }
      ],
      count: 2,
      bytes: 550,
      usage: 1024,
      maxmempool: 300000000,
      mempoolminfee: '0.00001',
      minrelaytxfee: '0.00001'
    };

    it('should successfully retrieve mempool transactions', async () => {
      const expectedResponse: TatumApiResponse = {
        data: mockMempoolResponse,
        status: 200,
        statusText: 'OK'
      };

      mockExecuteRequest.mockResolvedValue(expectedResponse);

      const result = await bitcoinService.getMempoolTransactions();

      expect(mockExecuteRequest).toHaveBeenCalledWith(
        'GET',
        '/v3/bitcoin/mempool',
        {}
      );
      expect(result).toEqual(expectedResponse);
    });

    it('should handle empty mempool', async () => {
      const emptyMempoolResponse: BitcoinMempoolInfo = {
        transactions: [],
        count: 0,
        bytes: 0,
        usage: 0,
        maxmempool: 300000000,
        mempoolminfee: '0.00001',
        minrelaytxfee: '0.00001'
      };

      const expectedResponse: TatumApiResponse = {
        data: emptyMempoolResponse,
        status: 200,
        statusText: 'OK'
      };

      mockExecuteRequest.mockResolvedValue(expectedResponse);

      const result = await bitcoinService.getMempoolTransactions();

      expect(result).toEqual(expectedResponse);
    });

    it('should handle API errors gracefully', async () => {
      const errorResponse: TatumApiResponse = {
        error: 'Service temporarily unavailable',
        status: 503,
        statusText: 'Service Unavailable'
      };

      mockExecuteRequest.mockResolvedValue(errorResponse);

      const result = await bitcoinService.getMempoolTransactions();

      expect(result).toEqual(errorResponse);
    });

    it('should handle network timeout errors', async () => {
      const timeoutError: TatumApiResponse = {
        error: 'Request timeout',
        status: 408,
        statusText: 'Request Timeout'
      };

      mockExecuteRequest.mockResolvedValue(timeoutError);

      const result = await bitcoinService.getMempoolTransactions();

      expect(result).toEqual(timeoutError);
    });
  });

  // ============================================================================
  // connectRpcDriver Tests
  // ============================================================================

  describe('connectRpcDriver', () => {
    const validRpcArgs: ConnectRpcArgs = {
      nodeUrl: 'http://localhost:8332',
      username: 'bitcoinrpc',
      password: 'password123'
    };

    const mockRpcResponse: BitcoinRpcConnection = {
      connected: true,
      nodeUrl: 'http://localhost:8332',
      blockHeight: 750000,
      networkInfo: {
        version: 220000,
        subversion: '/Satoshi:22.0.0/',
        protocolversion: 70016,
        connections: 8
      }
    };

    it('should successfully connect to Bitcoin RPC node', async () => {
      const expectedResponse: TatumApiResponse = {
        data: mockRpcResponse,
        status: 200,
        statusText: 'OK'
      };

      mockExecuteRequest.mockResolvedValue(expectedResponse);

      const result = await bitcoinService.connectRpcDriver(validRpcArgs);

      expect(mockExecuteRequest).toHaveBeenCalledWith(
        'POST',
        '/v3/bitcoin/node/{xApiKey}',
        {
          nodeUrl: validRpcArgs.nodeUrl,
          username: validRpcArgs.username,
          password: validRpcArgs.password
        }
      );
      expect(result).toEqual(expectedResponse);
    });

    it('should connect without username and password', async () => {
      const argsWithoutAuth: ConnectRpcArgs = {
        nodeUrl: 'http://localhost:8332'
      };

      const expectedResponse: TatumApiResponse = {
        data: { ...mockRpcResponse, connected: true },
        status: 200,
        statusText: 'OK'
      };

      mockExecuteRequest.mockResolvedValue(expectedResponse);

      const result = await bitcoinService.connectRpcDriver(argsWithoutAuth);

      expect(mockExecuteRequest).toHaveBeenCalledWith(
        'POST',
        '/v3/bitcoin/node/{xApiKey}',
        {
          nodeUrl: argsWithoutAuth.nodeUrl
        }
      );
      expect(result).toEqual(expectedResponse);
    });

    it('should handle connection failure', async () => {
      const connectionError: TatumApiResponse = {
        error: 'Failed to connect to Bitcoin node',
        status: 502,
        statusText: 'Bad Gateway'
      };

      mockExecuteRequest.mockResolvedValue(connectionError);

      const result = await bitcoinService.connectRpcDriver(validRpcArgs);

      expect(result).toEqual(connectionError);
    });

    it('should validate arguments and return error for missing nodeUrl', async () => {
      const invalidArgs = {
        username: 'bitcoinrpc',
        password: 'password123'
      } as ConnectRpcArgs;

      const result = await bitcoinService.connectRpcDriver(invalidArgs);

      expect(result.error).toBe('Invalid arguments for connectRpcDriver');
      expect(result.status).toBe(400);
      expect(mockExecuteRequest).not.toHaveBeenCalled();
    });

    it('should validate arguments and return error for empty nodeUrl', async () => {
      const invalidArgs: ConnectRpcArgs = {
        nodeUrl: '',
        username: 'bitcoinrpc',
        password: 'password123'
      };

      const result = await bitcoinService.connectRpcDriver(invalidArgs);

      expect(result.error).toBe('Invalid arguments for connectRpcDriver');
      expect(result.status).toBe(400);
      expect(mockExecuteRequest).not.toHaveBeenCalled();
    });

    it('should handle authentication errors', async () => {
      const authError: TatumApiResponse = {
        error: 'Authentication failed',
        status: 401,
        statusText: 'Unauthorized'
      };

      mockExecuteRequest.mockResolvedValue(authError);

      const result = await bitcoinService.connectRpcDriver(validRpcArgs);

      expect(result).toEqual(authError);
    });

    it('should handle invalid node URL format', async () => {
      const invalidUrlArgs: ConnectRpcArgs = {
        nodeUrl: 'invalid-url-format'
      };

      // The service should still make the request and let the API handle URL validation
      const urlError: TatumApiResponse = {
        error: 'Invalid node URL format',
        status: 400,
        statusText: 'Bad Request'
      };

      mockExecuteRequest.mockResolvedValue(urlError);

      const result = await bitcoinService.connectRpcDriver(invalidUrlArgs);

      expect(result).toEqual(urlError);
    });
  });

  // ============================================================================
  // Integration Tests for UTXO and Mempool Operations
  // ============================================================================

  describe('Integration scenarios', () => {
    it('should handle rate limiting across all UTXO/mempool operations', async () => {
      const rateLimitError: TatumApiResponse = {
        error: 'Rate limit exceeded',
        status: 429,
        statusText: 'Too Many Requests'
      };

      mockExecuteRequest.mockResolvedValue(rateLimitError);

      const utxoArgs: GetUtxoArgs = {
        hash: 'a1b2c3d4e5f67890123456789012345678901234567890123456789012345678',
        index: 0
      };

      const rpcArgs: ConnectRpcArgs = {
        nodeUrl: 'http://localhost:8332'
      };

      const utxoResult = await bitcoinService.getUtxo(utxoArgs);
      const mempoolResult = await bitcoinService.getMempoolTransactions();
      const rpcResult = await bitcoinService.connectRpcDriver(rpcArgs);

      expect(utxoResult).toEqual(rateLimitError);
      expect(mempoolResult).toEqual(rateLimitError);
      expect(rpcResult).toEqual(rateLimitError);
    });

    it('should handle API key validation errors', async () => {
      const apiKeyError: TatumApiResponse = {
        error: 'Invalid API key',
        status: 403,
        statusText: 'Forbidden'
      };

      mockExecuteRequest.mockResolvedValue(apiKeyError);

      const utxoArgs: GetUtxoArgs = {
        hash: 'a1b2c3d4e5f67890123456789012345678901234567890123456789012345678',
        index: 0
      };

      const result = await bitcoinService.getUtxo(utxoArgs);

      expect(result).toEqual(apiKeyError);
    });
  });
});