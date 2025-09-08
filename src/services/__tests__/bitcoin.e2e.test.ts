/**
 * End-to-end tests for complete Bitcoin workflows
 * These tests verify that complete Bitcoin operations work together correctly
 */

import { BitcoinService } from '../bitcoin';
import { TatumApiClient } from '../../api-client';
import { MOCK_BITCOIN_DATA } from './bitcoin.mock-data.test';

// Mock the TatumApiClient
jest.mock('../../api-client');
const MockedTatumApiClient = TatumApiClient as jest.MockedClass<typeof TatumApiClient>;

describe('BitcoinService End-to-End Tests', () => {
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

  describe('Complete Wallet Creation and Management Workflow', () => {
    it('should complete full wallet creation and address generation workflow', async () => {
      // Step 1: Generate wallet
      mockApiClient.executeRequest.mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        data: MOCK_BITCOIN_DATA.wallet
      });

      const walletResult = await bitcoinService.generateWallet();
      expect(walletResult.status).toBe(200);
      expect(walletResult.data.mnemonic).toBeDefined();
      expect(walletResult.data.xpub).toBeDefined();

      // Step 2: Generate multiple addresses from the wallet
      mockApiClient.executeRequest
        .mockResolvedValueOnce({
          status: 200,
          statusText: 'OK',
          data: { address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa' }
        })
        .mockResolvedValueOnce({
          status: 200,
          statusText: 'OK',
          data: { address: '12c6DSiU4Rq3P4ZxziKxzrL5LmMBrzjrJX' }
        })
        .mockResolvedValueOnce({
          status: 200,
          statusText: 'OK',
          data: { address: '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2' }
        });

      const addresses = [];
      for (let i = 0; i < 3; i++) {
        const addressResult = await bitcoinService.generateAddress({
          xpub: walletResult.data.xpub,
          index: i
        });
        expect(addressResult.status).toBe(200);
        addresses.push(addressResult.data.address);
      }

      expect(addresses).toHaveLength(3);

      // Step 3: Generate private keys for the addresses
      mockApiClient.executeRequest
        .mockResolvedValueOnce({
          status: 200,
          statusText: 'OK',
          data: { key: 'KwDiBf89QgGbjEhKnhXJuH7LrciVrZi3qYjgd9M7rFU73sVHnoWn' }
        })
        .mockResolvedValueOnce({
          status: 200,
          statusText: 'OK',
          data: { key: 'L1aW4aubDFB7yfras2S1mN3bqg9nwySY8nkoLmJebSLD5BWv3ENZ' }
        });

      const privateKeys = [];
      for (let i = 0; i < 2; i++) {
        const privateKeyResult = await bitcoinService.generatePrivateKey({
          mnemonic: walletResult.data.mnemonic,
          index: i
        });
        expect(privateKeyResult.status).toBe(200);
        privateKeys.push(privateKeyResult.data.key);
      }

      expect(privateKeys).toHaveLength(2);

      // Verify the complete workflow
      expect(mockApiClient.executeRequest).toHaveBeenCalledTimes(6); // 1 wallet + 3 addresses + 2 private keys
    });

    it('should handle wallet creation with error recovery', async () => {
      // Step 1: First wallet generation fails
      mockApiClient.executeRequest.mockResolvedValueOnce({
        status: 500,
        statusText: 'Internal Server Error',
        error: 'Server error'
      });

      const firstAttempt = await bitcoinService.generateWallet();
      expect(firstAttempt.status).toBe(500);

      // Step 2: Retry wallet generation succeeds
      mockApiClient.executeRequest.mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        data: MOCK_BITCOIN_DATA.wallet
      });

      const secondAttempt = await bitcoinService.generateWallet();
      expect(secondAttempt.status).toBe(200);
      expect(secondAttempt.data.mnemonic).toBeDefined();
    });
  });

  describe('Complete Transaction Analysis Workflow', () => {
    it('should complete full transaction analysis workflow', async () => {
      const testAddress = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa';
      const transactionHash = '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b';

      // Step 1: Get address balance
      mockApiClient.executeRequest.mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        data: MOCK_BITCOIN_DATA.balance
      });

      const balanceResult = await bitcoinService.getBalance({ address: testAddress });
      expect(balanceResult.status).toBe(200);
      expect(balanceResult.data.balance).toBeDefined();

      // Step 2: Get transaction history
      mockApiClient.executeRequest.mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        data: MOCK_BITCOIN_DATA.transactionHistory
      });

      const transactionsResult = await bitcoinService.getTransactions({
        address: testAddress,
        pageSize: 10
      });
      expect(transactionsResult.status).toBe(200);
      expect(transactionsResult.data.transactions).toBeDefined();

      // Step 3: Get detailed transaction information
      mockApiClient.executeRequest.mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        data: MOCK_BITCOIN_DATA.transaction
      });

      const transactionResult = await bitcoinService.getTransaction({
        hash: transactionHash
      });
      expect(transactionResult.status).toBe(200);
      expect(transactionResult.data.hash).toBe(transactionHash);

      // Step 4: Check UTXO status
      mockApiClient.executeRequest.mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        data: MOCK_BITCOIN_DATA.utxo
      });

      const utxoResult = await bitcoinService.getUtxo({
        hash: transactionHash,
        index: 0
      });
      expect(utxoResult.status).toBe(200);
      expect(utxoResult.data.hash).toBe(transactionHash);

      // Verify complete workflow
      expect(mockApiClient.executeRequest).toHaveBeenCalledTimes(4);
    });

    it('should handle multi-address transaction analysis', async () => {
      const addresses = [
        '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        '12c6DSiU4Rq3P4ZxziKxzrL5LmMBrzjrJX',
        '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2'
      ];

      // Step 1: Get balances for all addresses
      mockApiClient.executeRequest.mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        data: MOCK_BITCOIN_DATA.multipleBalances
      });

      const balancesResult = await bitcoinService.getMultipleBalances({ addresses });
      expect(balancesResult.status).toBe(200);
      expect(Object.keys(balancesResult.data)).toHaveLength(2); // Mock data has 2 addresses

      // Step 2: Get transaction history for all addresses
      mockApiClient.executeRequest.mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        data: {
          '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa': MOCK_BITCOIN_DATA.transactionHistory,
          '12c6DSiU4Rq3P4ZxziKxzrL5LmMBrzjrJX': MOCK_BITCOIN_DATA.transactionHistory,
          '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2': MOCK_BITCOIN_DATA.transactionHistory
        }
      });

      const transactionsBatchResult = await bitcoinService.getTransactionsBatch({
        addresses,
        pageSize: 20
      });
      expect(transactionsBatchResult.status).toBe(200);

      // Verify batch operations were used
      expect(mockApiClient.executeRequest).toHaveBeenCalledTimes(2);
    });
  });

  describe('Complete Transaction Creation Workflow', () => {
    it('should complete transaction creation and broadcasting workflow', async () => {
      const fromAddresses = ['1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'];
      const toOutputs = [
        {
          address: '12c6DSiU4Rq3P4ZxziKxzrL5LmMBrzjrJX',
          value: 0.001
        }
      ];

      // Step 1: Create transaction
      mockApiClient.executeRequest.mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        data: {
          txId: 'abc123def456789012345678901234567890123456789012345678901234567890',
          completed: false,
          rawTransaction: '0100000001...'
        }
      });

      const sendResult = await bitcoinService.sendTransaction({
        fromAddress: fromAddresses,
        to: toOutputs,
        fee: '0.00001'
      });
      expect(sendResult.status).toBe(200);
      expect(sendResult.data.txId).toBeDefined();

      // Step 2: Broadcast transaction
      mockApiClient.executeRequest.mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        data: MOCK_BITCOIN_DATA.transactionBroadcast
      });

      const broadcastResult = await bitcoinService.broadcastTransaction({
        txData: '0100000001...'
      });
      expect(broadcastResult.status).toBe(200);
      expect(broadcastResult.data.completed).toBe(true);

      // Verify complete workflow
      expect(mockApiClient.executeRequest).toHaveBeenCalledTimes(2);
    });

    it('should handle transaction creation with insufficient funds', async () => {
      const fromAddresses = ['1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'];
      const toOutputs = [
        {
          address: '12c6DSiU4Rq3P4ZxziKxzrL5LmMBrzjrJX',
          value: 100 // More than available
        }
      ];

      // Mock insufficient funds error
      mockApiClient.executeRequest.mockResolvedValueOnce({
        status: 400,
        statusText: 'Bad Request',
        error: 'Insufficient funds',
        data: {
          errorCode: 'INSUFFICIENT_FUNDS',
          details: {
            required: '100.00000000',
            available: '50.00000000'
          }
        }
      });

      const sendResult = await bitcoinService.sendTransaction({
        fromAddress: fromAddresses,
        to: toOutputs
      });

      expect(sendResult.status).toBe(400);
      expect(sendResult.error).toContain('Insufficient funds');
      expect(sendResult.data?.errorCode).toBe('INSUFFICIENT_FUNDS');
    });
  });

  describe('Complete Blockchain Monitoring Workflow', () => {
    it('should complete blockchain monitoring workflow', async () => {
      // Step 1: Get current blockchain info
      mockApiClient.executeRequest.mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        data: MOCK_BITCOIN_DATA.blockchainInfo
      });

      const blockchainInfoResult = await bitcoinService.getBlockchainInfo();
      expect(blockchainInfoResult.status).toBe(200);
      const currentHeight = blockchainInfoResult.data.blocks;

      // Step 2: Get latest block hash
      mockApiClient.executeRequest.mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        data: { hash: '00000000000000000002a7c4c1e48d76c5a37902165a270156b7a8d72728a054' }
      });

      const latestBlockHashResult = await bitcoinService.getBlockHash({
        height: currentHeight
      });
      expect(latestBlockHashResult.status).toBe(200);

      // Step 3: Get latest block details
      mockApiClient.executeRequest.mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        data: {
          ...MOCK_BITCOIN_DATA.block,
          height: currentHeight,
          hash: latestBlockHashResult.data.hash
        }
      });

      const latestBlockResult = await bitcoinService.getBlock({
        hash: latestBlockHashResult.data.hash
      });
      expect(latestBlockResult.status).toBe(200);
      expect(latestBlockResult.data.height).toBe(currentHeight);

      // Step 4: Get mempool status
      mockApiClient.executeRequest.mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        data: MOCK_BITCOIN_DATA.mempoolInfo
      });

      const mempoolResult = await bitcoinService.getMempoolTransactions();
      expect(mempoolResult.status).toBe(200);
      expect(mempoolResult.data.transactions).toBeDefined();

      // Verify complete monitoring workflow
      expect(mockApiClient.executeRequest).toHaveBeenCalledTimes(4);
    });

    it('should handle block reorganization scenario', async () => {
      const originalHeight = 800000;
      const reorgHeight = 799999;

      // Step 1: Get block at original height
      mockApiClient.executeRequest.mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        data: {
          ...MOCK_BITCOIN_DATA.block,
          height: originalHeight,
          hash: 'original_block_hash'
        }
      });

      const originalBlockResult = await bitcoinService.getBlock({
        height: originalHeight
      });
      expect(originalBlockResult.status).toBe(200);

      // Step 2: Later, the same height returns a different block (reorg)
      mockApiClient.executeRequest.mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        data: {
          ...MOCK_BITCOIN_DATA.block,
          height: originalHeight,
          hash: 'new_block_hash_after_reorg'
        }
      });

      const reorgBlockResult = await bitcoinService.getBlock({
        height: originalHeight
      });
      expect(reorgBlockResult.status).toBe(200);
      expect(reorgBlockResult.data.hash).not.toBe(originalBlockResult.data.hash);

      // Step 3: Verify the reorganization by checking previous blocks
      mockApiClient.executeRequest.mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        data: {
          ...MOCK_BITCOIN_DATA.block,
          height: reorgHeight,
          hash: 'common_ancestor_hash'
        }
      });

      const ancestorBlockResult = await bitcoinService.getBlock({
        height: reorgHeight
      });
      expect(ancestorBlockResult.status).toBe(200);
    });
  });

  describe('Complete RPC Integration Workflow', () => {
    it('should complete RPC connection and usage workflow', async () => {
      const nodeUrl = 'http://localhost:8332';
      const username = 'bitcoinrpc';
      const password = 'password123';

      // Step 1: Connect to RPC node
      mockApiClient.executeRequest.mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        data: MOCK_BITCOIN_DATA.rpcConnection
      });

      const connectionResult = await bitcoinService.connectRpcDriver({
        nodeUrl,
        username,
        password
      });
      expect(connectionResult.status).toBe(200);
      expect(connectionResult.data.connected).toBe(true);

      // Step 2: Use RPC connection to get blockchain info
      mockApiClient.executeRequest.mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        data: MOCK_BITCOIN_DATA.blockchainInfo
      });

      const rpcBlockchainInfoResult = await bitcoinService.getBlockchainInfo();
      expect(rpcBlockchainInfoResult.status).toBe(200);

      // Verify RPC workflow
      expect(mockApiClient.executeRequest).toHaveBeenCalledTimes(2);
    });

    it('should handle RPC connection failures gracefully', async () => {
      const nodeUrl = 'http://unreachable-node:8332';

      // Mock connection failure
      mockApiClient.executeRequest.mockResolvedValueOnce({
        status: 500,
        statusText: 'Internal Server Error',
        error: 'Connection refused',
        data: {
          errorCode: 'RPC_ERROR',
          details: {
            nodeUrl,
            error: 'ECONNREFUSED'
          }
        }
      });

      const connectionResult = await bitcoinService.connectRpcDriver({
        nodeUrl
      });

      expect(connectionResult.status).toBe(500);
      expect(connectionResult.error).toContain('Connection refused');
      expect(connectionResult.data?.errorCode).toBe('RPC_ERROR');
    });
  });

  describe('Error Recovery and Resilience Workflows', () => {
    it('should handle network interruption and recovery', async () => {
      const testAddress = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa';

      // Simulate network interruption with retries
      mockApiClient.executeRequest
        .mockResolvedValueOnce({ status: 500, statusText: 'Internal Server Error', error: 'Network error' })
        .mockResolvedValueOnce({ status: 500, statusText: 'Internal Server Error', error: 'Network error' })
        .mockResolvedValueOnce({
          status: 200,
          statusText: 'OK',
          data: MOCK_BITCOIN_DATA.balance
        });

      const result = await bitcoinService.getBalance({ address: testAddress });

      expect(result.status).toBe(200);
      expect(result.data).toEqual(MOCK_BITCOIN_DATA.balance);
      expect(mockApiClient.executeRequest).toHaveBeenCalledTimes(3);
    });

    it('should handle rate limiting across multiple operations', async () => {
      const addresses = [
        '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        '12c6DSiU4Rq3P4ZxziKxzrL5LmMBrzjrJX'
      ];

      // First operation hits rate limit, second succeeds
      mockApiClient.executeRequest
        .mockResolvedValueOnce({ status: 429, statusText: 'Too Many Requests', error: 'Rate limited' })
        .mockResolvedValueOnce({
          status: 200,
          statusText: 'OK',
          data: MOCK_BITCOIN_DATA.balance
        })
        .mockResolvedValueOnce({
          status: 200,
          statusText: 'OK',
          data: MOCK_BITCOIN_DATA.balance
        });

      const results = await Promise.all([
        bitcoinService.getBalance({ address: addresses[0] }),
        bitcoinService.getBalance({ address: addresses[1] })
      ]);

      // First request should eventually succeed after retry
      expect(results[0].status).toBe(200);
      expect(results[1].status).toBe(200);
    });

    it('should handle partial failures in batch operations', async () => {
      const addresses = [
        '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        'invalid-address',
        '12c6DSiU4Rq3P4ZxziKxzrL5LmMBrzjrJX'
      ];

      // Validation should catch invalid address before API call
      const result = await bitcoinService.getMultipleBalances({ addresses });

      expect(result.status).toBe(400);
      expect(result.error).toContain('Invalid Bitcoin address format at index 1');
      expect(mockApiClient.executeRequest).not.toHaveBeenCalled();
    });
  });

  describe('Performance and Scalability Workflows', () => {
    it('should handle large-scale address monitoring', async () => {
      // Generate 50 valid Bitcoin addresses
      const baseAddresses = [
        '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        '12c6DSiU4Rq3P4ZxziKxzrL5LmMBrzjrJX',
        '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2',
        '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy'
      ];
      const addresses = Array(50).fill(null).map((_, i) => 
        baseAddresses[i % baseAddresses.length]
      );

      // Mock batch balance response
      const mockBalances: any = {};
      addresses.forEach(address => {
        mockBalances[address] = MOCK_BITCOIN_DATA.balance;
      });

      mockApiClient.executeRequest.mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        data: mockBalances
      });

      const startTime = Date.now();
      const result = await bitcoinService.getMultipleBalances({ addresses });
      const endTime = Date.now();

      expect(result.status).toBe(200);
      expect(Object.keys(result.data)).toHaveLength(50);
      expect(endTime - startTime).toBeLessThan(2000); // Should complete within 2 seconds
      expect(mockApiClient.executeRequest).toHaveBeenCalledTimes(1); // Single batch call
    });

    it('should handle high-frequency transaction monitoring', async () => {
      const testAddress = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa';

      // Mock responses for rapid polling
      mockApiClient.executeRequest.mockResolvedValue({
        status: 200,
        statusText: 'OK',
        data: MOCK_BITCOIN_DATA.transactionHistory
      });

      const startTime = Date.now();
      const pollPromises = Array(20).fill(null).map(() =>
        bitcoinService.getTransactions({
          address: testAddress,
          pageSize: 10
        })
      );

      const results = await Promise.all(pollPromises);
      const endTime = Date.now();

      expect(results).toHaveLength(20);
      results.forEach(result => {
        expect(result.status).toBe(200);
      });
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });
});