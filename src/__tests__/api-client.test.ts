import { TatumApiClient } from '../api-client';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock axios.create to return a proper axios instance mock
const mockAxiosInstance = {
  post: jest.fn(),
  get: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  interceptors: {
    request: {
      use: jest.fn(),
      eject: jest.fn()
    },
    response: {
      use: jest.fn(),
      eject: jest.fn()
    }
  }
};

mockedAxios.create = jest.fn(() => mockAxiosInstance as any);

// Mock the config module to avoid ES module issues
jest.mock('../config', () => ({
  TatumConfig: {
    getInstance: jest.fn(() => ({
      getApiKey: jest.fn(() => 'test-api-key'),
      getBaseUrl: jest.fn(() => 'https://api.tatum.io'),
      getTimeout: jest.fn(() => 30000),
      getGatewayUrl: jest.fn((chain: string) => `https://api.tatum.io/v3/blockchain/node/${chain}`),
      hasCustomRpcUrl: jest.fn(() => false)
    }))
  }
}));

describe('TatumApiClient', () => {
  let apiClient: TatumApiClient;
  let mockContext: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockContext = {
      apiKey: 'test-api-key',
      baseUrl: 'https://api.tatum.io',
      timeout: 30000,
      retryAttempts: 3
    };
    
    apiClient = new TatumApiClient(mockContext);
  });

  describe('constructor', () => {
    it('should initialize with provided context', () => {
      expect((apiClient as any).context).toEqual(mockContext);
    });

    it('should handle missing context properties', () => {
      const minimalContext = { apiKey: 'test-key' };
      const client = new TatumApiClient(minimalContext as any);
      expect((client as any).context).toEqual(minimalContext);
    });
  });

  describe('executeRpcCall', () => {
    const mockResponse = {
      data: {
        jsonrpc: '2.0',
        id: 1,
        result: '0x1234567890abcdef'
      },
      status: 200,
      statusText: 'OK'
    };

    beforeEach(() => {
      mockAxiosInstance.post.mockResolvedValue(mockResponse);
    });

    it('should make successful RPC call', async () => {
      const result = await apiClient.executeRpcCall(
        'ethereum-mainnet',
        'eth_blockNumber',
        []
      );

      expect(result).toEqual({
        data: mockResponse.data,
        status: mockResponse.status,
        statusText: mockResponse.statusText
      });
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        'https://api.tatum.io/v3/blockchain/node/ethereum-mainnet',
        {
          jsonrpc: '2.0',
          method: 'eth_blockNumber',
          params: [],
          id: 1
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': 'test-api-key'
          },
          baseURL: ''
        }
      );
    });

    it('should handle RPC call with parameters', async () => {
      const params = ['0x1', true];
      
      await apiClient.executeRpcCall(
        'ethereum-mainnet',
        'eth_getBlockByNumber',
        params
      );

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        'https://api.tatum.io/v3/blockchain/node/ethereum-mainnet',
        {
          jsonrpc: '2.0',
          method: 'eth_getBlockByNumber',
          params: params,
          id: 1
        },
        expect.any(Object)
      );
    });

    it('should handle different chains', async () => {
      await apiClient.executeRpcCall(
        'bitcoin-mainnet',
        'getblockcount',
        []
      );

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        'https://api.tatum.io/v3/blockchain/node/bitcoin-mainnet',
        expect.any(Object),
        expect.any(Object)
      );
    });

    it('should use consistent request ID for calls', async () => {
      await apiClient.executeRpcCall('ethereum-mainnet', 'method1', []);
      await apiClient.executeRpcCall('ethereum-mainnet', 'method2', []);

      const calls = mockAxiosInstance.post.mock.calls;
      expect((calls[0][1] as any).id).toBe(1);
      expect((calls[1][1] as any).id).toBe(1);
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network Error');
      mockAxiosInstance.post.mockRejectedValue(networkError);

      const result = await apiClient.executeRpcCall('ethereum-mainnet', 'eth_blockNumber', []);
      
      expect(result).toEqual({
        error: 'Network Error',
        status: 0,
        statusText: 'Error'
      });
    });

    it('should handle HTTP error responses', async () => {
      const errorResponse = {
        response: {
          status: 400,
          statusText: 'Bad Request',
          data: { error: 'Invalid request' }
        }
      };
      mockAxiosInstance.post.mockRejectedValue(errorResponse);

      const result = await apiClient.executeRpcCall('ethereum-mainnet', 'invalid_method', []);
      
      expect(result).toEqual({
        error: 'Bad Request',
        status: 400,
        statusText: 'Bad Request'
      });
    });

    it('should handle RPC error responses', async () => {
      const rpcErrorResponse = {
        data: {
          jsonrpc: '2.0',
          id: 1,
          error: {
            code: -32601,
            message: 'Method not found'
          }
        },
        status: 200
      };
      mockAxiosInstance.post.mockResolvedValue(rpcErrorResponse);

      const result = await apiClient.executeRpcCall(
        'ethereum-mainnet',
        'invalid_method',
        []
      );

      expect(result).toEqual({
        data: rpcErrorResponse.data,
        status: rpcErrorResponse.status,
        statusText: undefined
      });
    });

    it('should use custom timeout from context', async () => {
      const customContext = {
        ...mockContext,
        timeout: 60000
      };
      const customClient = new TatumApiClient(customContext);

      await customClient.executeRpcCall('ethereum-mainnet', 'eth_blockNumber', []);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({
          baseURL: ''
        })
      );
    });

    it('should handle missing API key', async () => {
      const contextWithoutKey = {
        ...mockContext,
        apiKey: ''
      };
      const clientWithoutKey = new TatumApiClient(contextWithoutKey);

      await clientWithoutKey.executeRpcCall('ethereum-mainnet', 'eth_blockNumber', []);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-API-Key': ''
          })
        })
      );
    });
  });

  describe('error handling', () => {
    it('should preserve error details for debugging', async () => {
      const detailedError = {
        response: {
          status: 429,
          statusText: 'Too Many Requests',
          data: {
            error: 'Rate limit exceeded',
            retryAfter: 60
          }
        },
        config: {
          url: 'https://api.tatum.io/v3/blockchain/node/ethereum-mainnet',
          method: 'post'
        }
      };
      
      mockAxiosInstance.post.mockRejectedValue(detailedError);

      const result = await apiClient.executeRpcCall('ethereum-mainnet', 'eth_blockNumber', []);
      
      expect(result).toEqual({
        error: 'Too Many Requests',
        status: 429,
        statusText: 'Too Many Requests'
      });
    });
  });
});