/**
 * Integration tests for Bitcoin service against Tatum API sandbox environment
 * These tests verify the service works correctly with real API responses
 */

import { BitcoinService } from '../bitcoin';
import { TatumApiClient } from '../../api-client';
import { BitcoinErrorCode } from '../../types/bitcoin';

// Skip integration tests by default unless INTEGRATION_TESTS=true
const runIntegrationTests = process.env.INTEGRATION_TESTS === 'true';

describe('BitcoinService Integration Tests', () => {
  let bitcoinService: BitcoinService;
  let apiClient: TatumApiClient;

  beforeAll(() => {
    if (!runIntegrationTests) {
      console.log('Skipping integration tests. Set INTEGRATION_TESTS=true to run.');
      return;
    }

    // Use sandbox API key for testing
    const apiKey = process.env.TATUM_API_KEY || 'test-api-key';
    apiClient = new TatumApiClient({
      baseUrl: 'https://api.tatum.io',
      apiKey,
      timeout: 30000,
      retryAttempts: 3
    });
    bitcoinService = new BitcoinService(apiClient);
  });

  // Skip all tests if integration tests are disabled
  beforeEach(() => {
    if (!runIntegrationTests) {
      pending('Integration tests disabled');
    }
  });

  describe('Wallet Operations Integration', () => {
    let generatedWallet: any;
    let generatedAddress: string;

    it('should generate a new Bitcoin wallet', async () => {
      const result = await bitcoinService.generateWallet();
      
      expect(result.status).toBe(200);
      expect(result.data).toBeDefined();
      expect(result.data.mnemonic).toBeDefined();
      expect(result.data.xpub).toBeDefined();
      expect(typeof result.data.mnemonic).toBe('string');
      expect(typeof result.data.xpub).toBe('string');
      expect(result.data.xpub).toMatch(/^xpub[a-km-zA-HJ-NP-Z1-9]{107,108}$/);
      
      generatedWallet = result.data;
    }, 10000);

    it('should generate address from wallet xpub', async () => {
      if (!generatedWallet) {
        // Generate wallet first if not available
        const walletResult = await bitcoinService.generateWallet();
        generatedWallet = walletResult.data;
      }

      const result = await bitcoinService.generateAddress({
        xpub: generatedWallet.xpub,
        index: 0
      });

      expect(result.status).toBe(200);
      expect(result.data).toBeDefined();
      expect(result.data.address).toBeDefined();
      expect(typeof result.data.address).toBe('string');
      
      // Verify it's a valid Bitcoin address format
      const address = result.data.address;
      const isValidFormat = /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address) || 
                           /^bc1[a-z0-9]{39,59}$/.test(address);
      expect(isValidFormat).toBe(true);
      
      generatedAddress = address;
    }, 10000);

    it('should generate private key from mnemonic', async () => {
      if (!generatedWallet) {
        const walletResult = await bitcoinService.generateWallet();
        generatedWallet = walletResult.data;
      }

      const result = await bitcoinService.generatePrivateKey({
        mnemonic: generatedWallet.mnemonic,
        index: 0
      });

      expect(result.status).toBe(200);
      expect(result.data).toBeDefined();
      expect(result.data.key).toBeDefined();
      expect(typeof result.data.key).toBe('string');
      expect(result.data.key.length).toBeGreaterThan(50); // Private keys are typically 51-52 chars in WIF format
    }, 10000);
  });

  describe('Blockchain Information Integration', () => {
    it('should get current blockchain info', async () => {
      const result = await bitcoinService.getBlockchainInfo();
      
      expect(result.status).toBe(200);
      expect(result.data).toBeDefined();
      expect(result.data.chain).toBeDefined();
      expect(result.data.blocks).toBeDefined();
      expect(result.data.bestblockhash).toBeDefined();
      expect(typeof result.data.blocks).toBe('number');
      expect(result.data.blocks).toBeGreaterThan(0);
    }, 10000);

    it('should get block hash by height', async () => {
      const result = await bitcoinService.getBlockHash({ height: 0 });
      
      expect(result.status).toBe(200);
      expect(result.data).toBeDefined();
      expect(result.data.hash).toBeDefined();
      expect(typeof result.data.hash).toBe('string');
      expect(result.data.hash).toMatch(/^[a-fA-F0-9]{64}$/);
      // Genesis block hash
      expect(result.data.hash).toBe('000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f');
    }, 10000);

    it('should get block data by hash', async () => {
      const genesisHash = '000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f';
      const result = await bitcoinService.getBlock({ hash: genesisHash });
      
      expect(result.status).toBe(200);
      expect(result.data).toBeDefined();
      expect(result.data.hash).toBe(genesisHash);
      expect(result.data.height).toBe(0);
      expect(result.data.tx).toBeDefined();
      expect(Array.isArray(result.data.tx)).toBe(true);
    }, 10000);

    it('should get block data by height', async () => {
      const result = await bitcoinService.getBlock({ height: 0 });
      
      expect(result.status).toBe(200);
      expect(result.data).toBeDefined();
      expect(result.data.height).toBe(0);
      expect(result.data.hash).toBe('000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f');
    }, 10000);
  });

  describe('Balance Operations Integration', () => {
    const testAddress = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'; // Genesis block coinbase address

    it('should get balance for single address', async () => {
      const result = await bitcoinService.getBalance({ address: testAddress });
      
      expect(result.status).toBe(200);
      expect(result.data).toBeDefined();
      expect(result.data.balance).toBeDefined();
      expect(result.data.incoming).toBeDefined();
      expect(result.data.outgoing).toBeDefined();
      expect(typeof result.data.balance).toBe('string');
    }, 10000);

    it('should get balances for multiple addresses', async () => {
      const addresses = [
        '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        '12c6DSiU4Rq3P4ZxziKxzrL5LmMBrzjrJX'
      ];
      
      const result = await bitcoinService.getMultipleBalances({ addresses });
      
      expect(result.status).toBe(200);
      expect(result.data).toBeDefined();
      expect(typeof result.data).toBe('object');
      
      // Check that we have balance data for each address
      addresses.forEach(address => {
        expect(result.data[address]).toBeDefined();
        expect(result.data[address].balance).toBeDefined();
        expect(typeof result.data[address].balance).toBe('string');
      });
    }, 10000);
  });

  describe('Transaction Operations Integration', () => {
    const testAddress = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa';
    const genesisTransactionHash = '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b';

    it('should get transactions for address', async () => {
      const result = await bitcoinService.getTransactions({
        address: testAddress,
        pageSize: 10,
        offset: 0
      });
      
      expect(result.status).toBe(200);
      expect(result.data).toBeDefined();
      expect(result.data.transactions).toBeDefined();
      expect(Array.isArray(result.data.transactions)).toBe(true);
      expect(result.data.total).toBeDefined();
      expect(typeof result.data.total).toBe('number');
    }, 10000);

    it('should get transactions for multiple addresses', async () => {
      const addresses = [testAddress];
      
      const result = await bitcoinService.getTransactionsBatch({
        addresses,
        pageSize: 5
      });
      
      expect(result.status).toBe(200);
      expect(result.data).toBeDefined();
      expect(typeof result.data).toBe('object');
    }, 10000);

    it('should get specific transaction details', async () => {
      const result = await bitcoinService.getTransaction({
        hash: genesisTransactionHash
      });
      
      expect(result.status).toBe(200);
      expect(result.data).toBeDefined();
      expect(result.data.hash).toBe(genesisTransactionHash);
      expect(result.data.inputs).toBeDefined();
      expect(result.data.outputs).toBeDefined();
      expect(Array.isArray(result.data.inputs)).toBe(true);
      expect(Array.isArray(result.data.outputs)).toBe(true);
    }, 10000);
  });

  describe('UTXO and Mempool Integration', () => {
    it('should get mempool transactions', async () => {
      const result = await bitcoinService.getMempoolTransactions();
      
      expect(result.status).toBe(200);
      expect(result.data).toBeDefined();
      expect(result.data.transactions).toBeDefined();
      expect(Array.isArray(result.data.transactions)).toBe(true);
      expect(result.data.count).toBeDefined();
      expect(typeof result.data.count).toBe('number');
    }, 10000);

    it('should handle UTXO lookup for spent output', async () => {
      // This will likely return 404 for spent UTXO, which is expected
      const result = await bitcoinService.getUtxo({
        hash: '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b',
        index: 0
      });
      
      // Either success (200) if unspent or not found (404) if spent
      expect([200, 404]).toContain(result.status);
      
      if (result.status === 200) {
        expect(result.data).toBeDefined();
        expect(result.data.hash).toBeDefined();
        expect(result.data.index).toBeDefined();
        expect(result.data.value).toBeDefined();
      }
    }, 10000);
  });

  describe('Error Handling Integration', () => {
    it('should handle invalid address gracefully', async () => {
      const result = await bitcoinService.getBalance({
        address: 'invalid-address'
      });
      
      expect(result.status).toBe(400);
      expect(result.error).toBeDefined();
      expect(result.data?.errorCode).toBe(BitcoinErrorCode.VALIDATION_ERROR);
    });

    it('should handle non-existent transaction', async () => {
      const result = await bitcoinService.getTransaction({
        hash: '0000000000000000000000000000000000000000000000000000000000000000'
      });
      
      expect([404, 400]).toContain(result.status);
      expect(result.error).toBeDefined();
    }, 10000);

    it('should handle invalid block height', async () => {
      const result = await bitcoinService.getBlockHash({
        height: -1
      });
      
      expect(result.status).toBe(400);
      expect(result.error).toBeDefined();
      expect(result.data?.errorCode).toBe(BitcoinErrorCode.VALIDATION_ERROR);
    });

    it('should handle rate limiting gracefully', async () => {
      // Make multiple rapid requests to potentially trigger rate limiting
      const promises = Array(5).fill(null).map(() => 
        bitcoinService.getBlockchainInfo()
      );
      
      const results = await Promise.all(promises);
      
      // At least some should succeed, and any failures should be handled gracefully
      const successCount = results.filter(r => r.status === 200).length;
      const rateLimitCount = results.filter(r => r.status === 429).length;
      
      expect(successCount + rateLimitCount).toBe(results.length);
      
      // If rate limited, should have proper error structure
      results.forEach(result => {
        if (result.status === 429) {
          expect(result.data?.errorCode).toBe(BitcoinErrorCode.RATE_LIMIT_EXCEEDED);
        }
      });
    }, 15000);
  });

  describe('Performance Integration', () => {
    it('should handle batch balance requests efficiently', async () => {
      const addresses = [
        '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        '12c6DSiU4Rq3P4ZxziKxzrL5LmMBrzjrJX',
        '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2',
        '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy'
      ];
      
      const startTime = Date.now();
      const result = await bitcoinService.getMultipleBalances({ addresses });
      const endTime = Date.now();
      
      expect(result.status).toBe(200);
      expect(endTime - startTime).toBeLessThan(10000); // Should complete within 10 seconds
      
      // Verify all addresses have balance data
      addresses.forEach(address => {
        expect(result.data[address]).toBeDefined();
      });
    }, 15000);

    it('should handle paginated transaction requests', async () => {
      const address = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa';
      
      const startTime = Date.now();
      const result = await bitcoinService.getTransactions({
        address,
        pageSize: 50,
        offset: 0
      });
      const endTime = Date.now();
      
      expect(result.status).toBe(200);
      expect(endTime - startTime).toBeLessThan(10000);
      expect(result.data.transactions).toBeDefined();
      expect(Array.isArray(result.data.transactions)).toBe(true);
    }, 15000);
  });
});