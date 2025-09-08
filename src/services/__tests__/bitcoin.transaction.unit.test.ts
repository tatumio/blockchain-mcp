import { BitcoinService } from '../bitcoin';
import { TatumApiClient } from '../../api-client';
import { ToolExecutionContext } from '../../types';
import {
  GetTransactionsArgs,
  GetTransactionsBatchArgs,
  GetTransactionArgs,
  SendTransactionArgs,
  BroadcastTransactionArgs
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

describe('BitcoinService - Transaction Operations', () => {
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

  describe('getTransactions', () => {
    const validAddress = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa';
    
    it('should retrieve transaction history for a valid address', async () => {
      const mockResponse = {
        data: [
          {
            hash: '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b',
            height: 0,
            timestamp: 1231006505,
            inputs: [],
            outputs: [
              {
                address: validAddress,
                value: 5000000000
              }
            ],
            fee: '0'
          }
        ],
        status: 200,
        statusText: 'OK'
      };

      mockExecuteRequest.mockResolvedValue(mockResponse);

      const args: GetTransactionsArgs = {
        address: validAddress
      };

      const result = await bitcoinService.getTransactions(args);

      expect(mockExecuteRequest).toHaveBeenCalledWith(
        'GET',
        '/v3/bitcoin/transaction/address/{address}',
        { address: validAddress }
      );
      expect(result).toEqual(mockResponse);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].hash).toBe('4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b');
    });

    it('should retrieve transaction history with pagination parameters', async () => {
      const mockResponse = {
        data: [
          {
            hash: '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b',
            height: 0,
            timestamp: 1231006505,
            inputs: [],
            outputs: [{ address: validAddress, value: 5000000000 }],
            fee: '0'
          }
        ],
        status: 200,
        statusText: 'OK'
      };

      mockExecuteRequest.mockResolvedValue(mockResponse);

      const args: GetTransactionsArgs = {
        address: validAddress,
        pageSize: 10,
        offset: 20
      };

      const result = await bitcoinService.getTransactions(args);

      expect(mockExecuteRequest).toHaveBeenCalledWith(
        'GET',
        '/v3/bitcoin/transaction/address/{address}',
        { 
          address: validAddress,
          pageSize: 10,
          offset: 20
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle pagination with maximum page size', async () => {
      const mockResponse = {
        data: [],
        status: 200,
        statusText: 'OK'
      };

      mockExecuteRequest.mockResolvedValue(mockResponse);

      const args: GetTransactionsArgs = {
        address: validAddress,
        pageSize: 100,
        offset: 0
      };

      const result = await bitcoinService.getTransactions(args);

      expect(mockExecuteRequest).toHaveBeenCalledWith(
        'GET',
        '/v3/bitcoin/transaction/address/{address}',
        { 
          address: validAddress,
          pageSize: 100,
          offset: 0
        }
      );
      expect(result.status).toBe(200);
    });

    it('should return validation error for invalid address', async () => {
      const args: GetTransactionsArgs = {
        address: 'invalid-address'
      };

      const result = await bitcoinService.getTransactions(args);

      expect(mockExecuteRequest).not.toHaveBeenCalled();
      expect(result.error).toBe('Invalid arguments for getTransactions');
      expect(result.status).toBe(400);
    });

    it('should return validation error for invalid page size', async () => {
      const args: GetTransactionsArgs = {
        address: validAddress,
        pageSize: 101 // exceeds maximum
      };

      const result = await bitcoinService.getTransactions(args);

      expect(mockExecuteRequest).not.toHaveBeenCalled();
      expect(result.error).toBe('Invalid arguments for getTransactions');
      expect(result.status).toBe(400);
    });

    it('should return validation error for negative offset', async () => {
      const args: GetTransactionsArgs = {
        address: validAddress,
        offset: -1
      };

      const result = await bitcoinService.getTransactions(args);

      expect(mockExecuteRequest).not.toHaveBeenCalled();
      expect(result.error).toBe('Invalid arguments for getTransactions');
      expect(result.status).toBe(400);
    });

    it('should handle API errors gracefully', async () => {
      const mockErrorResponse = {
        error: 'Address not found',
        status: 404,
        statusText: 'Not Found'
      };

      mockExecuteRequest.mockResolvedValue(mockErrorResponse);

      const args: GetTransactionsArgs = {
        address: validAddress
      };

      const result = await bitcoinService.getTransactions(args);

      expect(result).toEqual(mockErrorResponse);
      expect(result.error).toBe('Address not found');
      expect(result.status).toBe(404);
    });

    it('should handle empty transaction history', async () => {
      const mockResponse = {
        data: [],
        status: 200,
        statusText: 'OK'
      };

      mockExecuteRequest.mockResolvedValue(mockResponse);

      const args: GetTransactionsArgs = {
        address: validAddress
      };

      const result = await bitcoinService.getTransactions(args);

      expect(result.data).toEqual([]);
      expect(result.status).toBe(200);
    });
  });

  describe('getTransactionsBatch', () => {
    const validAddresses = [
      '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
      '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2'
    ];

    it('should retrieve transaction history for multiple addresses', async () => {
      const mockResponse = {
        data: {
          '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa': [
            {
              hash: '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b',
              height: 0,
              timestamp: 1231006505,
              inputs: [],
              outputs: [{ address: validAddresses[0], value: 5000000000 }],
              fee: '0'
            }
          ],
          '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2': []
        },
        status: 200,
        statusText: 'OK'
      };

      mockExecuteRequest.mockResolvedValue(mockResponse);

      const args: GetTransactionsBatchArgs = {
        addresses: validAddresses
      };

      const result = await bitcoinService.getTransactionsBatch(args);

      expect(mockExecuteRequest).toHaveBeenCalledWith(
        'POST',
        '/v3/bitcoin/transaction/address/batch',
        { addresses: validAddresses }
      );
      expect(result).toEqual(mockResponse);
      expect(result.data[validAddresses[0]]).toHaveLength(1);
      expect(result.data[validAddresses[1]]).toHaveLength(0);
    });

    it('should retrieve batch transactions with pagination', async () => {
      const mockResponse = {
        data: {
          '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa': [],
          '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2': []
        },
        status: 200,
        statusText: 'OK'
      };

      mockExecuteRequest.mockResolvedValue(mockResponse);

      const args: GetTransactionsBatchArgs = {
        addresses: validAddresses,
        pageSize: 50,
        offset: 10
      };

      const result = await bitcoinService.getTransactionsBatch(args);

      expect(mockExecuteRequest).toHaveBeenCalledWith(
        'POST',
        '/v3/bitcoin/transaction/address/batch',
        { 
          addresses: validAddresses,
          pageSize: 50,
          offset: 10
        }
      );
      expect(result.status).toBe(200);
    });

    it('should return validation error for empty address array', async () => {
      const args: GetTransactionsBatchArgs = {
        addresses: []
      };

      const result = await bitcoinService.getTransactionsBatch(args);

      expect(mockExecuteRequest).not.toHaveBeenCalled();
      expect(result.error).toBe('Invalid arguments for getTransactionsBatch');
      expect(result.status).toBe(400);
    });

    it('should return validation error for too many addresses', async () => {
      const tooManyAddresses = Array(11).fill('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa');
      
      const args: GetTransactionsBatchArgs = {
        addresses: tooManyAddresses
      };

      const result = await bitcoinService.getTransactionsBatch(args);

      expect(mockExecuteRequest).not.toHaveBeenCalled();
      expect(result.error).toBe('Invalid arguments for getTransactionsBatch');
      expect(result.status).toBe(400);
    });

    it('should return validation error for invalid address in batch', async () => {
      const args: GetTransactionsBatchArgs = {
        addresses: [validAddresses[0], 'invalid-address']
      };

      const result = await bitcoinService.getTransactionsBatch(args);

      expect(mockExecuteRequest).not.toHaveBeenCalled();
      expect(result.error).toBe('Invalid arguments for getTransactionsBatch');
      expect(result.status).toBe(400);
    });

    it('should handle API errors for batch requests', async () => {
      const mockErrorResponse = {
        error: 'Rate limit exceeded',
        status: 429,
        statusText: 'Too Many Requests'
      };

      mockExecuteRequest.mockResolvedValue(mockErrorResponse);

      const args: GetTransactionsBatchArgs = {
        addresses: validAddresses
      };

      const result = await bitcoinService.getTransactionsBatch(args);

      expect(result).toEqual(mockErrorResponse);
      expect(result.error).toBe('Rate limit exceeded');
      expect(result.status).toBe(429);
    });
  });

  describe('getTransaction', () => {
    const validTxHash = '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b';

    it('should retrieve specific transaction details by hash', async () => {
      const mockResponse = {
        data: {
          hash: validTxHash,
          height: 0,
          timestamp: 1231006505,
          inputs: [],
          outputs: [
            {
              address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
              value: 5000000000
            }
          ],
          fee: '0',
          size: 285,
          confirmations: 800000
        },
        status: 200,
        statusText: 'OK'
      };

      mockExecuteRequest.mockResolvedValue(mockResponse);

      const args: GetTransactionArgs = {
        hash: validTxHash
      };

      const result = await bitcoinService.getTransaction(args);

      expect(mockExecuteRequest).toHaveBeenCalledWith(
        'GET',
        '/v3/bitcoin/transaction/{hash}',
        { hash: validTxHash }
      );
      expect(result).toEqual(mockResponse);
      expect(result.data.hash).toBe(validTxHash);
      expect(result.data.confirmations).toBe(800000);
    });

    it('should return validation error for invalid transaction hash', async () => {
      const args: GetTransactionArgs = {
        hash: 'invalid-hash'
      };

      const result = await bitcoinService.getTransaction(args);

      expect(mockExecuteRequest).not.toHaveBeenCalled();
      expect(result.error).toBe('Invalid arguments for getTransaction');
      expect(result.status).toBe(400);
    });

    it('should return validation error for empty hash', async () => {
      const args: GetTransactionArgs = {
        hash: ''
      };

      const result = await bitcoinService.getTransaction(args);

      expect(mockExecuteRequest).not.toHaveBeenCalled();
      expect(result.error).toBe('Invalid arguments for getTransaction');
      expect(result.status).toBe(400);
    });

    it('should handle transaction not found error', async () => {
      const mockErrorResponse = {
        error: 'Transaction not found',
        status: 404,
        statusText: 'Not Found'
      };

      mockExecuteRequest.mockResolvedValue(mockErrorResponse);

      const args: GetTransactionArgs = {
        hash: validTxHash
      };

      const result = await bitcoinService.getTransaction(args);

      expect(result).toEqual(mockErrorResponse);
      expect(result.error).toBe('Transaction not found');
      expect(result.status).toBe(404);
    });

    it('should handle network errors gracefully', async () => {
      const mockErrorResponse = {
        error: 'Network timeout',
        status: 500,
        statusText: 'Internal Server Error'
      };

      mockExecuteRequest.mockResolvedValue(mockErrorResponse);

      const args: GetTransactionArgs = {
        hash: validTxHash
      };

      const result = await bitcoinService.getTransaction(args);

      expect(result).toEqual(mockErrorResponse);
      expect(result.error).toBe('Network timeout');
      expect(result.status).toBe(500);
    });

    it('should handle malformed transaction hash format', async () => {
      const malformedHashes = [
        '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33', // too short
        '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33bb', // too long
        '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33g' // invalid character
      ];

      for (const hash of malformedHashes) {
        const args: GetTransactionArgs = { hash };
        const result = await bitcoinService.getTransaction(args);

        expect(mockExecuteRequest).not.toHaveBeenCalled();
        expect(result.error).toBe('Invalid arguments for getTransaction');
        expect(result.status).toBe(400);
      }
    });
  });

  describe('sendTransaction', () => {
    const validFromAddresses = ['1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'];
    const validToOutputs = [
      {
        address: '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2',
        value: 0.001
      }
    ];

    it('should create and broadcast a Bitcoin transaction successfully', async () => {
      const mockResponse = {
        data: {
          txId: '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b',
          completed: true
        },
        status: 200,
        statusText: 'OK'
      };

      mockExecuteRequest.mockResolvedValue(mockResponse);

      const args: SendTransactionArgs = {
        fromAddress: validFromAddresses,
        to: validToOutputs
      };

      const result = await bitcoinService.sendTransaction(args);

      expect(mockExecuteRequest).toHaveBeenCalledWith(
        'POST',
        '/v3/bitcoin/transaction',
        {
          fromAddress: validFromAddresses,
          to: validToOutputs
        }
      );
      expect(result).toEqual(mockResponse);
      expect(result.data.txId).toBe('4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b');
      expect(result.data.completed).toBe(true);
    });

    it('should send transaction with custom fee and change address', async () => {
      const mockResponse = {
        data: {
          txId: '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b',
          completed: true
        },
        status: 200,
        statusText: 'OK'
      };

      mockExecuteRequest.mockResolvedValue(mockResponse);

      const args: SendTransactionArgs = {
        fromAddress: validFromAddresses,
        to: validToOutputs,
        fee: '0.0001',
        changeAddress: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'
      };

      const result = await bitcoinService.sendTransaction(args);

      expect(mockExecuteRequest).toHaveBeenCalledWith(
        'POST',
        '/v3/bitcoin/transaction',
        {
          fromAddress: validFromAddresses,
          to: validToOutputs,
          fee: '0.0001',
          changeAddress: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'
        }
      );
      expect(result.status).toBe(200);
    });

    it('should send transaction with multiple outputs', async () => {
      const multipleOutputs = [
        {
          address: '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2',
          value: 0.001
        },
        {
          address: '1C4CrWFXr2AaGd4VDVGnFk7qd4fkCr2AaG',
          value: 0.002
        }
      ];

      const mockResponse = {
        data: {
          txId: '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b',
          completed: true
        },
        status: 200,
        statusText: 'OK'
      };

      mockExecuteRequest.mockResolvedValue(mockResponse);

      const args: SendTransactionArgs = {
        fromAddress: validFromAddresses,
        to: multipleOutputs
      };

      const result = await bitcoinService.sendTransaction(args);

      expect(mockExecuteRequest).toHaveBeenCalledWith(
        'POST',
        '/v3/bitcoin/transaction',
        {
          fromAddress: validFromAddresses,
          to: multipleOutputs
        }
      );
      expect(result.status).toBe(200);
    });

    it('should return validation error for empty fromAddress array', async () => {
      const args: SendTransactionArgs = {
        fromAddress: [],
        to: validToOutputs
      };

      const result = await bitcoinService.sendTransaction(args);

      expect(mockExecuteRequest).not.toHaveBeenCalled();
      expect(result.error).toBe('Invalid arguments for sendTransaction');
      expect(result.status).toBe(400);
    });

    it('should return validation error for invalid from address', async () => {
      const args: SendTransactionArgs = {
        fromAddress: ['invalid-address'],
        to: validToOutputs
      };

      const result = await bitcoinService.sendTransaction(args);

      expect(mockExecuteRequest).not.toHaveBeenCalled();
      expect(result.error).toBe('Invalid arguments for sendTransaction');
      expect(result.status).toBe(400);
    });

    it('should return validation error for empty to array', async () => {
      const args: SendTransactionArgs = {
        fromAddress: validFromAddresses,
        to: []
      };

      const result = await bitcoinService.sendTransaction(args);

      expect(mockExecuteRequest).not.toHaveBeenCalled();
      expect(result.error).toBe('Invalid arguments for sendTransaction');
      expect(result.status).toBe(400);
    });

    it('should return validation error for invalid recipient address', async () => {
      const invalidOutputs = [
        {
          address: 'invalid-address',
          value: 0.001
        }
      ];

      const args: SendTransactionArgs = {
        fromAddress: validFromAddresses,
        to: invalidOutputs
      };

      const result = await bitcoinService.sendTransaction(args);

      expect(mockExecuteRequest).not.toHaveBeenCalled();
      expect(result.error).toBe('Invalid arguments for sendTransaction');
      expect(result.status).toBe(400);
    });

    it('should return validation error for invalid amount', async () => {
      const invalidOutputs = [
        {
          address: '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2',
          value: -0.001 // negative amount
        }
      ];

      const args: SendTransactionArgs = {
        fromAddress: validFromAddresses,
        to: invalidOutputs
      };

      const result = await bitcoinService.sendTransaction(args);

      expect(mockExecuteRequest).not.toHaveBeenCalled();
      expect(result.error).toBe('Invalid arguments for sendTransaction');
      expect(result.status).toBe(400);
    });

    it('should return validation error for amount exceeding Bitcoin supply', async () => {
      const invalidOutputs = [
        {
          address: '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2',
          value: 25000000 // exceeds max Bitcoin supply
        }
      ];

      const args: SendTransactionArgs = {
        fromAddress: validFromAddresses,
        to: invalidOutputs
      };

      const result = await bitcoinService.sendTransaction(args);

      expect(mockExecuteRequest).not.toHaveBeenCalled();
      expect(result.error).toBe('Invalid arguments for sendTransaction');
      expect(result.status).toBe(400);
    });

    it('should return validation error for invalid fee format', async () => {
      const args: SendTransactionArgs = {
        fromAddress: validFromAddresses,
        to: validToOutputs,
        fee: 'invalid-fee'
      };

      const result = await bitcoinService.sendTransaction(args);

      expect(mockExecuteRequest).not.toHaveBeenCalled();
      expect(result.error).toBe('Invalid arguments for sendTransaction');
      expect(result.status).toBe(400);
    });

    it('should return validation error for invalid change address', async () => {
      const args: SendTransactionArgs = {
        fromAddress: validFromAddresses,
        to: validToOutputs,
        changeAddress: 'invalid-change-address'
      };

      const result = await bitcoinService.sendTransaction(args);

      expect(mockExecuteRequest).not.toHaveBeenCalled();
      expect(result.error).toBe('Invalid arguments for sendTransaction');
      expect(result.status).toBe(400);
    });

    it('should handle insufficient funds error', async () => {
      const mockErrorResponse = {
        error: 'Insufficient funds',
        status: 400,
        statusText: 'Bad Request'
      };

      mockExecuteRequest.mockResolvedValue(mockErrorResponse);

      const args: SendTransactionArgs = {
        fromAddress: validFromAddresses,
        to: validToOutputs
      };

      const result = await bitcoinService.sendTransaction(args);

      expect(result).toEqual(mockErrorResponse);
      expect(result.error).toBe('Insufficient funds');
      expect(result.status).toBe(400);
    });

    it('should handle network broadcast failure', async () => {
      const mockErrorResponse = {
        error: 'Transaction broadcast failed',
        status: 500,
        statusText: 'Internal Server Error'
      };

      mockExecuteRequest.mockResolvedValue(mockErrorResponse);

      const args: SendTransactionArgs = {
        fromAddress: validFromAddresses,
        to: validToOutputs
      };

      const result = await bitcoinService.sendTransaction(args);

      expect(result).toEqual(mockErrorResponse);
      expect(result.error).toBe('Transaction broadcast failed');
      expect(result.status).toBe(500);
    });

    it('should handle rate limit errors', async () => {
      const mockErrorResponse = {
        error: 'Rate limit exceeded',
        status: 429,
        statusText: 'Too Many Requests'
      };

      mockExecuteRequest.mockResolvedValue(mockErrorResponse);

      const args: SendTransactionArgs = {
        fromAddress: validFromAddresses,
        to: validToOutputs
      };

      const result = await bitcoinService.sendTransaction(args);

      expect(result).toEqual(mockErrorResponse);
      expect(result.error).toBe('Rate limit exceeded');
      expect(result.status).toBe(429);
    });
  });

  describe('broadcastTransaction', () => {
    const validTxData = '0100000001a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890000000006a47304402203e4516da7253cf068effec6b95c41221c0cf3a8e6ccb8cbf1725b562e9afde2c022054e1c258c2981cdfba5df64e841288f76c5c8e8e8e8e8e8e8e8e8e8e8e8e8e8e0121038282263212c609d9ea2a6e3e172de238d8c39cabd5ac1ca10646e23fd5f51508ffffffff01809698000000000017a914389ffce9cd9ae88dcc0631e88a821ffdbe9bfe2687000000';

    it('should broadcast a signed transaction successfully', async () => {
      const mockResponse = {
        data: {
          txId: '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b',
          completed: true
        },
        status: 200,
        statusText: 'OK'
      };

      mockExecuteRequest.mockResolvedValue(mockResponse);

      const args: BroadcastTransactionArgs = {
        txData: validTxData
      };

      const result = await bitcoinService.broadcastTransaction(args);

      expect(mockExecuteRequest).toHaveBeenCalledWith(
        'POST',
        '/v3/bitcoin/broadcast',
        {
          txData: validTxData
        }
      );
      expect(result).toEqual(mockResponse);
      expect(result.data.txId).toBe('4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b');
      expect(result.data.completed).toBe(true);
    });

    it('should return validation error for empty transaction data', async () => {
      const args: BroadcastTransactionArgs = {
        txData: ''
      };

      const result = await bitcoinService.broadcastTransaction(args);

      expect(mockExecuteRequest).not.toHaveBeenCalled();
      expect(result.error).toBe('Invalid arguments for broadcastTransaction');
      expect(result.status).toBe(400);
    });

    it('should return validation error for invalid hex format', async () => {
      const args: BroadcastTransactionArgs = {
        txData: 'invalid-hex-data-with-non-hex-characters'
      };

      const result = await bitcoinService.broadcastTransaction(args);

      expect(mockExecuteRequest).not.toHaveBeenCalled();
      expect(result.error).toBe('Invalid arguments for broadcastTransaction');
      expect(result.status).toBe(400);
    });

    it('should return validation error for transaction data with spaces', async () => {
      const args: BroadcastTransactionArgs = {
        txData: '0100000001 a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890'
      };

      const result = await bitcoinService.broadcastTransaction(args);

      expect(mockExecuteRequest).not.toHaveBeenCalled();
      expect(result.error).toBe('Invalid arguments for broadcastTransaction');
      expect(result.status).toBe(400);
    });

    it('should handle malformed transaction error', async () => {
      const mockErrorResponse = {
        error: 'Transaction decode failed',
        status: 400,
        statusText: 'Bad Request'
      };

      mockExecuteRequest.mockResolvedValue(mockErrorResponse);

      const args: BroadcastTransactionArgs = {
        txData: validTxData
      };

      const result = await bitcoinService.broadcastTransaction(args);

      expect(result).toEqual(mockErrorResponse);
      expect(result.error).toBe('Transaction decode failed');
      expect(result.status).toBe(400);
    });

    it('should handle double spending error', async () => {
      const mockErrorResponse = {
        error: 'Transaction already exists in mempool',
        status: 409,
        statusText: 'Conflict'
      };

      mockExecuteRequest.mockResolvedValue(mockErrorResponse);

      const args: BroadcastTransactionArgs = {
        txData: validTxData
      };

      const result = await bitcoinService.broadcastTransaction(args);

      expect(result).toEqual(mockErrorResponse);
      expect(result.error).toBe('Transaction already exists in mempool');
      expect(result.status).toBe(409);
    });

    it('should handle network connectivity errors', async () => {
      const mockErrorResponse = {
        error: 'Network timeout',
        status: 500,
        statusText: 'Internal Server Error'
      };

      mockExecuteRequest.mockResolvedValue(mockErrorResponse);

      const args: BroadcastTransactionArgs = {
        txData: validTxData
      };

      const result = await bitcoinService.broadcastTransaction(args);

      expect(result).toEqual(mockErrorResponse);
      expect(result.error).toBe('Network timeout');
      expect(result.status).toBe(500);
    });

    it('should handle invalid transaction signature error', async () => {
      const mockErrorResponse = {
        error: 'Invalid transaction signature',
        status: 400,
        statusText: 'Bad Request'
      };

      mockExecuteRequest.mockResolvedValue(mockErrorResponse);

      const args: BroadcastTransactionArgs = {
        txData: validTxData
      };

      const result = await bitcoinService.broadcastTransaction(args);

      expect(result).toEqual(mockErrorResponse);
      expect(result.error).toBe('Invalid transaction signature');
      expect(result.status).toBe(400);
    });

    it('should handle fee too low error', async () => {
      const mockErrorResponse = {
        error: 'Fee too low for network acceptance',
        status: 400,
        statusText: 'Bad Request'
      };

      mockExecuteRequest.mockResolvedValue(mockErrorResponse);

      const args: BroadcastTransactionArgs = {
        txData: validTxData
      };

      const result = await bitcoinService.broadcastTransaction(args);

      expect(result).toEqual(mockErrorResponse);
      expect(result.error).toBe('Fee too low for network acceptance');
      expect(result.status).toBe(400);
    });
  });

  describe('Transaction Sending Edge Cases', () => {
    it('should handle minimum valid transaction amount', async () => {
      const minAmountOutputs = [
        {
          address: '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2',
          value: 0.00000001 // 1 satoshi
        }
      ];

      const mockResponse = {
        data: {
          txId: '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b',
          completed: true
        },
        status: 200,
        statusText: 'OK'
      };

      mockExecuteRequest.mockResolvedValue(mockResponse);

      const args: SendTransactionArgs = {
        fromAddress: ['1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'],
        to: minAmountOutputs
      };

      const result = await bitcoinService.sendTransaction(args);

      expect(mockExecuteRequest).toHaveBeenCalledWith(
        'POST',
        '/v3/bitcoin/transaction',
        {
          fromAddress: ['1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'],
          to: minAmountOutputs
        }
      );
      expect(result.status).toBe(200);
    });

    it('should handle maximum valid transaction amount', async () => {
      const maxAmountOutputs = [
        {
          address: '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2',
          value: 21000000 // Max Bitcoin supply
        }
      ];

      const mockResponse = {
        data: {
          txId: '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b',
          completed: true
        },
        status: 200,
        statusText: 'OK'
      };

      mockExecuteRequest.mockResolvedValue(mockResponse);

      const args: SendTransactionArgs = {
        fromAddress: ['1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'],
        to: maxAmountOutputs
      };

      const result = await bitcoinService.sendTransaction(args);

      expect(result.status).toBe(200);
    });

    it('should validate different Bitcoin address formats', async () => {
      const addressFormats = [
        '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', // P2PKH
        '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy', // P2SH
        'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4' // Bech32
      ];

      for (const address of addressFormats) {
        const mockResponse = {
          data: {
            txId: '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b',
            completed: true
          },
          status: 200,
          statusText: 'OK'
        };

        mockExecuteRequest.mockResolvedValue(mockResponse);

        const args: SendTransactionArgs = {
          fromAddress: [address],
          to: [{ address: '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2', value: 0.001 }]
        };

        const result = await bitcoinService.sendTransaction(args);
        expect(result.status).toBe(200);
      }
    });
  });

  describe('Pagination Edge Cases', () => {
    const validAddress = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa';

    it('should handle zero page size validation', async () => {
      const args: GetTransactionsArgs = {
        address: validAddress,
        pageSize: 0
      };

      const result = await bitcoinService.getTransactions(args);

      expect(result.error).toBe('Invalid arguments for getTransactions');
      expect(result.status).toBe(400);
    });

    it('should handle minimum valid pagination parameters', async () => {
      const mockResponse = {
        data: [],
        status: 200,
        statusText: 'OK'
      };

      mockExecuteRequest.mockResolvedValue(mockResponse);

      const args: GetTransactionsArgs = {
        address: validAddress,
        pageSize: 1,
        offset: 0
      };

      const result = await bitcoinService.getTransactions(args);

      expect(mockExecuteRequest).toHaveBeenCalledWith(
        'GET',
        '/v3/bitcoin/transaction/address/{address}',
        { 
          address: validAddress,
          pageSize: 1,
          offset: 0
        }
      );
      expect(result.status).toBe(200);
    });

    it('should handle large offset values', async () => {
      const mockResponse = {
        data: [],
        status: 200,
        statusText: 'OK'
      };

      mockExecuteRequest.mockResolvedValue(mockResponse);

      const args: GetTransactionsArgs = {
        address: validAddress,
        pageSize: 50,
        offset: 999999
      };

      const result = await bitcoinService.getTransactions(args);

      expect(mockExecuteRequest).toHaveBeenCalledWith(
        'GET',
        '/v3/bitcoin/transaction/address/{address}',
        { 
          address: validAddress,
          pageSize: 50,
          offset: 999999
        }
      );
      expect(result.status).toBe(200);
    });
  });
});