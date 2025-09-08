/**
 * Performance tests for Bitcoin service batch operations
 * These tests verify that batch operations perform efficiently and handle load appropriately
 */

import { BitcoinService } from '../bitcoin';
import { TatumApiClient } from '../../api-client';
import { MOCK_BITCOIN_DATA } from './bitcoin.mock-data.test';

// Mock the TatumApiClient
jest.mock('../../api-client');
const MockedTatumApiClient = TatumApiClient as jest.MockedClass<typeof TatumApiClient>;

describe('BitcoinService Performance Tests', () => {
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

  describe('Batch Balance Operations Performance', () => {
    it('should handle maximum batch size efficiently', async () => {
      // Create 100 valid Bitcoin addresses (maximum allowed)
      const baseAddresses = [
        '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        '12c6DSiU4Rq3P4ZxziKxzrL5LmMBrzjrJX',
        '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2',
        '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy'
      ];
      const addresses = Array(100).fill(null).map((_, i) => 
        baseAddresses[i % baseAddresses.length]
      );

      // Mock response with all addresses
      const mockBalances: any = {};
      addresses.forEach(address => {
        mockBalances[address] = {
          incoming: '1.00000000',
          outgoing: '0.50000000',
          balance: '0.50000000'
        };
      });

      mockApiClient.executeRequest.mockResolvedValue({
        status: 200,
        statusText: 'OK',
        data: mockBalances
      });

      const startTime = performance.now();
      const result = await bitcoinService.getMultipleBalances({ addresses });
      const endTime = performance.now();
      const executionTime = endTime - startTime;

      expect(result.status).toBe(200);
      expect(Object.keys(result.data)).toHaveLength(100);
      expect(executionTime).toBeLessThan(1000); // Should complete within 1 second
      expect(mockApiClient.executeRequest).toHaveBeenCalledTimes(1);
    });

    it('should handle concurrent balance requests efficiently', async () => {
      const addresses = [
        '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        '12c6DSiU4Rq3P4ZxziKxzrL5LmMBrzjrJX',
        '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2'
      ];

      mockApiClient.executeRequest.mockResolvedValue({
        status: 200,
        statusText: 'OK',
        data: MOCK_BITCOIN_DATA.balance
      });

      const startTime = performance.now();
      
      // Execute 10 concurrent single balance requests
      const promises = Array(10).fill(null).map(() =>
        bitcoinService.getBalance({ address: addresses[0] })
      );

      const results = await Promise.all(promises);
      const endTime = performance.now();
      const executionTime = endTime - startTime;

      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result.status).toBe(200);
      });
      expect(executionTime).toBeLessThan(2000); // Should complete within 2 seconds
    });

    it('should prefer batch operations over individual requests', async () => {
      const addresses = [
        '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        '12c6DSiU4Rq3P4ZxziKxzrL5LmMBrzjrJX',
        '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2'
      ];

      // Mock batch response
      const mockBatchBalances: any = {};
      addresses.forEach(address => {
        mockBatchBalances[address] = MOCK_BITCOIN_DATA.balance;
      });

      mockApiClient.executeRequest
        .mockResolvedValueOnce({
          status: 200,
          statusText: 'OK',
          data: mockBatchBalances
        })
        .mockResolvedValue({
          status: 200,
          statusText: 'OK',
          data: MOCK_BITCOIN_DATA.balance
        });

      // Time batch request
      const batchStartTime = performance.now();
      const batchResult = await bitcoinService.getMultipleBalances({ addresses });
      const batchEndTime = performance.now();
      const batchTime = batchEndTime - batchStartTime;

      // Time individual requests
      const individualStartTime = performance.now();
      const individualPromises = addresses.map(address =>
        bitcoinService.getBalance({ address })
      );
      const individualResults = await Promise.all(individualPromises);
      const individualEndTime = performance.now();
      const individualTime = individualEndTime - individualStartTime;

      expect(batchResult.status).toBe(200);
      expect(Object.keys(batchResult.data)).toHaveLength(3);
      expect(individualResults).toHaveLength(3);
      
      // Batch should be more efficient (fewer API calls)
      expect(mockApiClient.executeRequest).toHaveBeenCalledTimes(4); // 1 batch + 3 individual
      
      // Note: In real scenarios, batch would be faster, but in mocked tests
      // we're mainly verifying the API call efficiency
    });
  });

  describe('Batch Transaction Operations Performance', () => {
    it('should handle maximum batch transaction requests', async () => {
      const baseAddresses = [
        '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        '12c6DSiU4Rq3P4ZxziKxzrL5LmMBrzjrJX',
        '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2'
      ];
      const addresses = Array(10).fill(null).map((_, i) => 
        baseAddresses[i % baseAddresses.length]
      );

      mockApiClient.executeRequest.mockResolvedValue({
        status: 200,
        statusText: 'OK',
        data: {
          transactions: MOCK_BITCOIN_DATA.transactionHistory.transactions,
          total: 1,
          pageSize: 50,
          offset: 0
        }
      });

      const startTime = performance.now();
      const result = await bitcoinService.getTransactionsBatch({
        addresses,
        pageSize: 50
      });
      const endTime = performance.now();
      const executionTime = endTime - startTime;

      expect(result.status).toBe(200);
      expect(executionTime).toBeLessThan(1000);
      expect(mockApiClient.executeRequest).toHaveBeenCalledTimes(1);
    });

    it('should handle large page sizes efficiently', async () => {
      const address = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa';
      
      // Create mock data with 100 transactions
      const mockTransactions = Array(100).fill(null).map((_, i) => ({
        ...MOCK_BITCOIN_DATA.transaction,
        hash: `${i.toString().padStart(64, '0')}`
      }));

      mockApiClient.executeRequest.mockResolvedValue({
        status: 200,
        statusText: 'OK',
        data: {
          transactions: mockTransactions,
          total: 100,
          pageSize: 100,
          offset: 0
        }
      });

      const startTime = performance.now();
      const result = await bitcoinService.getTransactions({
        address,
        pageSize: 100,
        offset: 0
      });
      const endTime = performance.now();
      const executionTime = endTime - startTime;

      expect(result.status).toBe(200);
      expect(result.data.transactions).toHaveLength(100);
      expect(executionTime).toBeLessThan(1000);
    });

    it('should handle pagination efficiently', async () => {
      const address = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa';
      
      mockApiClient.executeRequest.mockResolvedValue({
        status: 200,
        statusText: 'OK',
        data: MOCK_BITCOIN_DATA.transactionHistory
      });

      const startTime = performance.now();
      
      // Simulate fetching multiple pages
      const pagePromises = Array(5).fill(null).map((_, i) =>
        bitcoinService.getTransactions({
          address,
          pageSize: 20,
          offset: i * 20
        })
      );

      const results = await Promise.all(pagePromises);
      const endTime = performance.now();
      const executionTime = endTime - startTime;

      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result.status).toBe(200);
      });
      expect(executionTime).toBeLessThan(2000);
      expect(mockApiClient.executeRequest).toHaveBeenCalledTimes(5);
    });
  });

  describe('Memory Usage and Resource Management', () => {
    it('should handle large response payloads efficiently', async () => {
      // Create a large mock response (simulate 1000 transactions)
      const largeTransactionList = Array(1000).fill(null).map((_, i) => ({
        ...MOCK_BITCOIN_DATA.transaction,
        hash: `${i.toString().padStart(64, '0')}`,
        outputs: Array(10).fill(MOCK_BITCOIN_DATA.transaction.outputs[0])
      }));

      mockApiClient.executeRequest.mockResolvedValue({
        status: 200,
        statusText: 'OK',
        data: {
          transactions: largeTransactionList,
          total: 1000,
          pageSize: 1000,
          offset: 0
        }
      });

      const initialMemory = process.memoryUsage().heapUsed;
      const startTime = performance.now();
      
      const result = await bitcoinService.getTransactions({
        address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        pageSize: 1000
      });
      
      const endTime = performance.now();
      const finalMemory = process.memoryUsage().heapUsed;
      const executionTime = endTime - startTime;
      const memoryIncrease = finalMemory - initialMemory;

      expect(result.status).toBe(200);
      expect(result.data.transactions).toHaveLength(1000);
      expect(executionTime).toBeLessThan(2000);
      
      // Memory increase should be reasonable (less than 50MB for this test)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });

    it('should not leak memory with repeated operations', async () => {
      mockApiClient.executeRequest.mockResolvedValue({
        status: 200,
        statusText: 'OK',
        data: MOCK_BITCOIN_DATA.balance
      });

      const initialMemory = process.memoryUsage().heapUsed;
      
      // Perform 100 operations
      for (let i = 0; i < 100; i++) {
        await bitcoinService.getBalance({
          address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'
        });
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be minimal (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });
  });

  describe('Concurrent Request Handling', () => {
    it('should handle high concurrency without degradation', async () => {
      mockApiClient.executeRequest.mockResolvedValue({
        status: 200,
        statusText: 'OK',
        data: MOCK_BITCOIN_DATA.blockchainInfo
      });

      const concurrencyLevel = 50;
      const startTime = performance.now();
      
      const promises = Array(concurrencyLevel).fill(null).map(() =>
        bitcoinService.getBlockchainInfo()
      );

      const results = await Promise.all(promises);
      const endTime = performance.now();
      const executionTime = endTime - startTime;

      expect(results).toHaveLength(concurrencyLevel);
      results.forEach(result => {
        expect(result.status).toBe(200);
      });
      
      // Should complete within reasonable time even with high concurrency
      expect(executionTime).toBeLessThan(5000);
      expect(mockApiClient.executeRequest).toHaveBeenCalledTimes(concurrencyLevel);
    });

    it('should handle mixed operation types concurrently', async () => {
      // Mock different responses for different operations
      mockApiClient.executeRequest
        .mockResolvedValueOnce({
          status: 200,
          statusText: 'OK',
          data: MOCK_BITCOIN_DATA.blockchainInfo
        })
        .mockResolvedValueOnce({
          status: 200,
          statusText: 'OK',
          data: MOCK_BITCOIN_DATA.balance
        })
        .mockResolvedValueOnce({
          status: 200,
          statusText: 'OK',
          data: MOCK_BITCOIN_DATA.transactionHistory
        })
        .mockResolvedValueOnce({
          status: 200,
          statusText: 'OK',
          data: MOCK_BITCOIN_DATA.block
        });

      const startTime = performance.now();
      
      const [blockchainInfo, balance, transactions, block] = await Promise.all([
        bitcoinService.getBlockchainInfo(),
        bitcoinService.getBalance({ address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa' }),
        bitcoinService.getTransactions({ address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa' }),
        bitcoinService.getBlock({ height: 0 })
      ]);
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;

      expect(blockchainInfo.status).toBe(200);
      expect(balance.status).toBe(200);
      expect(transactions.status).toBe(200);
      expect(block.status).toBe(200);
      expect(executionTime).toBeLessThan(1000);
    });
  });

  describe('Error Handling Performance', () => {
    it('should handle validation errors efficiently', async () => {
      const startTime = performance.now();
      
      // Test multiple validation errors
      const promises = Array(100).fill(null).map(() =>
        bitcoinService.getBalance({ address: 'invalid-address' })
      );

      const results = await Promise.all(promises);
      const endTime = performance.now();
      const executionTime = endTime - startTime;

      expect(results).toHaveLength(100);
      results.forEach(result => {
        expect(result.status).toBe(400);
        expect(result.error).toContain('Invalid Bitcoin address format');
      });
      
      // Validation should be very fast
      expect(executionTime).toBeLessThan(100);
      // No API calls should be made for validation errors
      expect(mockApiClient.executeRequest).not.toHaveBeenCalled();
    });

    it('should handle retry logic efficiently', async () => {
      // Mock rate limiting followed by success
      mockApiClient.executeRequest
        .mockResolvedValueOnce({ status: 429, statusText: 'Too Many Requests', error: 'Rate limited' })
        .mockResolvedValueOnce({ status: 429, statusText: 'Too Many Requests', error: 'Rate limited' })
        .mockResolvedValueOnce({
          status: 200,
          statusText: 'OK',
          data: MOCK_BITCOIN_DATA.balance
        });

      const startTime = performance.now();
      const result = await bitcoinService.getBalance({
        address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'
      });
      const endTime = performance.now();
      const executionTime = endTime - startTime;

      expect(result.status).toBe(200);
      expect(mockApiClient.executeRequest).toHaveBeenCalledTimes(3);
      
      // Should include retry delays but still complete reasonably quickly
      expect(executionTime).toBeGreaterThan(1000); // At least 1 second due to retries
      expect(executionTime).toBeLessThan(10000); // But less than 10 seconds
    });
  });

  describe('Throughput Benchmarks', () => {
    it('should maintain throughput under sustained load', async () => {
      mockApiClient.executeRequest.mockResolvedValue({
        status: 200,
        statusText: 'OK',
        data: MOCK_BITCOIN_DATA.balance
      });

      const operationsPerSecond: number[] = [];
      const testDuration = 3000; // 3 seconds
      const batchSize = 10;
      
      const startTime = Date.now();
      let totalOperations = 0;

      while (Date.now() - startTime < testDuration) {
        const batchStartTime = Date.now();
        
        const promises = Array(batchSize).fill(null).map(() =>
          bitcoinService.getBalance({ address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa' })
        );
        
        await Promise.all(promises);
        
        const batchEndTime = Date.now();
        const batchDuration = batchEndTime - batchStartTime;
        const opsPerSecond = (batchSize / batchDuration) * 1000;
        
        operationsPerSecond.push(opsPerSecond);
        totalOperations += batchSize;
      }

      const averageOpsPerSecond = operationsPerSecond.length > 0 
        ? operationsPerSecond.reduce((a, b) => a + b, 0) / operationsPerSecond.length 
        : 0;
      
      expect(totalOperations).toBeGreaterThan(0);
      expect(averageOpsPerSecond).toBeGreaterThan(10); // At least 10 ops/second
      
      // Throughput should be relatively consistent (coefficient of variation < 50%)
      if (operationsPerSecond.length > 1 && averageOpsPerSecond > 0) {
        const stdDev = Math.sqrt(
          operationsPerSecond.reduce((sum, ops) => sum + Math.pow(ops - averageOpsPerSecond, 2), 0) / operationsPerSecond.length
        );
        const coefficientOfVariation = stdDev / averageOpsPerSecond;
        expect(coefficientOfVariation).toBeLessThan(0.5);
      }
    });
  });
});