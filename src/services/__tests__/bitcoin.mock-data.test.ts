/**
 * Mock data definitions and tests for Bitcoin operations
 * This file contains comprehensive mock data for all Bitcoin service responses
 */

import { BitcoinService } from '../bitcoin';
import { TatumApiClient } from '../../api-client';
import {
  BitcoinWallet,
  BitcoinAddress,
  BitcoinPrivateKey,
  BitcoinBlockchainInfo,
  BitcoinBlock,
  BitcoinBalance,
  BitcoinTransaction,
  BitcoinTransactionHistory,
  BitcoinUtxo,
  BitcoinMempoolInfo,
  BitcoinRpcConnection
} from '../../types/bitcoin';

// Mock the TatumApiClient
jest.mock('../../api-client');
const MockedTatumApiClient = TatumApiClient as jest.MockedClass<typeof TatumApiClient>;

// ============================================================================
// Mock Data Definitions
// ============================================================================

export const MOCK_BITCOIN_DATA = {
  // Wallet mock data
  wallet: {
    mnemonic: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
    xpub: 'xpub6CUGRUonZSQ4TWtTMmzXdrXDtypWKiKrhko4egpiMZbpiaQL2jkwSB1icqYh2cfDfVxdx4df189oLKnC5fSwqPfgyP3hooxujYzAu3fDVmz'
  } as BitcoinWallet,

  address: {
    address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'
  } as BitcoinAddress,

  privateKey: {
    key: 'KwDiBf89QgGbjEhKnhXJuH7LrciVrZi3qYjgd9M7rFU73sVHnoWn'
  } as BitcoinPrivateKey,

  // Blockchain info mock data
  blockchainInfo: {
    chain: 'main',
    blocks: 800000,
    headers: 800000,
    bestblockhash: '00000000000000000002a7c4c1e48d76c5a37902165a270156b7a8d72728a054',
    difficulty: 57119871304635.31,
    mediantime: 1690000000,
    verificationprogress: 0.9999,
    initialblockdownload: false,
    chainwork: '00000000000000000000000000000000000000005a4b3b8e7b5f8e7b5f8e7b5f',
    size_on_disk: 500000000000,
    pruned: false
  } as BitcoinBlockchainInfo,

  blockHash: {
    hash: '000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f'
  },

  block: {
    hash: '000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f',
    confirmations: 800000,
    size: 285,
    height: 0,
    version: 1,
    versionHex: '00000001',
    merkleroot: '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b',
    tx: ['4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b'],
    time: 1231006505,
    mediantime: 1231006505,
    nonce: 2083236893,
    bits: '1d00ffff',
    difficulty: 1,
    chainwork: '0000000000000000000000000000000000000000000000000000000100010001',
    nTx: 1,
    nextblockhash: '00000000839a8e6886ab5951d76f411475428afc90947ee320161bbf18eb6048'
  } as BitcoinBlock,

  // Balance mock data
  balance: {
    incoming: '50.00000000',
    outgoing: '0.00000000',
    balance: '50.00000000'
  } as BitcoinBalance,

  multipleBalances: {
    '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa': {
      incoming: '50.00000000',
      outgoing: '0.00000000',
      balance: '50.00000000'
    },
    '12c6DSiU4Rq3P4ZxziKxzrL5LmMBrzjrJX': {
      incoming: '25.50000000',
      outgoing: '10.25000000',
      balance: '15.25000000'
    }
  },

  // Transaction mock data
  transaction: {
    hash: '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b',
    height: 0,
    timestamp: 1231006505,
    inputs: [],
    outputs: [
      {
        address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        value: 50,
        scriptPubKey: {
          asm: '04678afdb0fe5548271967f1a67130b7105cd6a828e03909a67962e0ea1f61deb649f6bc3f4cef38c4f35504e51ec112de5c384df7ba0b8d578a4c702b6bf11d5f OP_CHECKSIG',
          hex: '4104678afdb0fe5548271967f1a67130b7105cd6a828e03909a67962e0ea1f61deb649f6bc3f4cef38c4f35504e51ec112de5c384df7ba0b8d578a4c702b6bf11d5fac',
          type: 'pubkey',
          addresses: ['1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa']
        }
      }
    ],
    fee: '0.00000000',
    size: 204,
    vsize: 204,
    weight: 816,
    locktime: 0,
    version: 1,
    confirmations: 800000
  } as BitcoinTransaction,

  transactionHistory: {
    transactions: [
      {
        hash: '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b',
        height: 0,
        timestamp: 1231006505,
        inputs: [],
        outputs: [
          {
            address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
            value: 50
          }
        ],
        fee: '0.00000000',
        size: 204,
        locktime: 0,
        version: 1,
        confirmations: 800000
      }
    ],
    total: 1,
    pageSize: 50,
    offset: 0
  } as BitcoinTransactionHistory,

  // UTXO mock data
  utxo: {
    hash: '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b',
    index: 0,
    value: '50.00000000',
    height: 0,
    confirmations: 800000,
    coinbase: true,
    scriptPubKey: {
      asm: '04678afdb0fe5548271967f1a67130b7105cd6a828e03909a67962e0ea1f61deb649f6bc3f4cef38c4f35504e51ec112de5c384df7ba0b8d578a4c702b6bf11d5f OP_CHECKSIG',
      hex: '4104678afdb0fe5548271967f1a67130b7105cd6a828e03909a67962e0ea1f61deb649f6bc3f4cef38c4f35504e51ec112de5c384df7ba0b8d578a4c702b6bf11d5fac',
      type: 'pubkey',
      addresses: ['1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa']
    }
  } as BitcoinUtxo,

  // Mempool mock data
  mempoolInfo: {
    transactions: [
      {
        hash: 'abc123def456789012345678901234567890123456789012345678901234567890',
        fee: '0.00001000',
        vsize: 250,
        weight: 1000,
        time: 1690000000,
        height: 800001,
        descendantcount: 1,
        descendantsize: 250,
        descendantfees: '0.00001000',
        ancestorcount: 1,
        ancestorsize: 250,
        ancestorfees: '0.00001000'
      }
    ],
    count: 1,
    bytes: 250,
    usage: 1000,
    maxmempool: 300000000,
    mempoolminfee: '0.00001000',
    minrelaytxfee: '0.00001000'
  } as BitcoinMempoolInfo,

  // RPC connection mock data
  rpcConnection: {
    connected: true,
    nodeUrl: 'http://localhost:8332',
    blockHeight: 800000,
    networkInfo: {
      version: 250000,
      subversion: '/Satoshi:25.0.0/',
      protocolversion: 70016,
      connections: 8
    }
  } as BitcoinRpcConnection,

  // Transaction broadcast mock data
  transactionBroadcast: {
    txId: 'abc123def456789012345678901234567890123456789012345678901234567890',
    completed: true
  },

  // Error responses
  errors: {
    validation: {
      error: 'Invalid Bitcoin address format',
      status: 400,
      statusText: 'Bad Request',
      data: {
        errorCode: 'VALIDATION_ERROR',
        details: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid Bitcoin address format',
          field: 'address',
          value: 'invalid-address',
          constraint: 'validation_failed'
        }
      }
    },
    notFound: {
      error: 'Transaction not found',
      status: 404,
      statusText: 'Not Found',
      data: {
        errorCode: 'TRANSACTION_NOT_FOUND',
        details: {}
      }
    },
    rateLimit: {
      error: 'Rate limit exceeded',
      status: 429,
      statusText: 'Too Many Requests',
      data: {
        errorCode: 'RATE_LIMIT_EXCEEDED',
        details: {
          retryAfter: 60
        }
      }
    },
    serverError: {
      error: 'Internal server error',
      status: 500,
      statusText: 'Internal Server Error',
      data: {
        errorCode: 'NETWORK_ERROR',
        details: {}
      }
    },
    timeout: {
      error: 'Request timeout',
      status: 408,
      statusText: 'Request Timeout',
      data: {
        errorCode: 'TIMEOUT',
        details: {}
      }
    }
  }
};

// ============================================================================
// Mock Data Tests
// ============================================================================

describe('BitcoinService Mock Data Tests', () => {
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

  describe('Wallet Operations Mock Data', () => {
    it('should return mock wallet data', async () => {
      mockApiClient.executeRequest.mockResolvedValue({
        status: 200,
        statusText: 'OK',
        data: MOCK_BITCOIN_DATA.wallet
      });

      const result = await bitcoinService.generateWallet();

      expect(result.status).toBe(200);
      expect(result.data).toEqual(MOCK_BITCOIN_DATA.wallet);
      expect(mockApiClient.executeRequest).toHaveBeenCalledWith('POST', '/v3/bitcoin/wallet', {});
    });

    it('should return mock address data', async () => {
      mockApiClient.executeRequest.mockResolvedValue({
        status: 200,
        statusText: 'OK',
        data: MOCK_BITCOIN_DATA.address
      });

      const result = await bitcoinService.generateAddress({
        xpub: MOCK_BITCOIN_DATA.wallet.xpub,
        index: 0
      });

      expect(result.status).toBe(200);
      expect(result.data).toEqual(MOCK_BITCOIN_DATA.address);
    });

    it('should return mock private key data', async () => {
      mockApiClient.executeRequest.mockResolvedValue({
        status: 200,
        statusText: 'OK',
        data: MOCK_BITCOIN_DATA.privateKey
      });

      const result = await bitcoinService.generatePrivateKey({
        mnemonic: MOCK_BITCOIN_DATA.wallet.mnemonic,
        index: 0
      });

      expect(result.status).toBe(200);
      expect(result.data).toEqual(MOCK_BITCOIN_DATA.privateKey);
    });
  });

  describe('Blockchain Information Mock Data', () => {
    it('should return mock blockchain info', async () => {
      mockApiClient.executeRequest.mockResolvedValue({
        status: 200,
        statusText: 'OK',
        data: MOCK_BITCOIN_DATA.blockchainInfo
      });

      const result = await bitcoinService.getBlockchainInfo();

      expect(result.status).toBe(200);
      expect(result.data).toEqual(MOCK_BITCOIN_DATA.blockchainInfo);
    });

    it('should return mock block hash', async () => {
      mockApiClient.executeRequest.mockResolvedValue({
        status: 200,
        statusText: 'OK',
        data: MOCK_BITCOIN_DATA.blockHash
      });

      const result = await bitcoinService.getBlockHash({ height: 0 });

      expect(result.status).toBe(200);
      expect(result.data).toEqual(MOCK_BITCOIN_DATA.blockHash);
    });

    it('should return mock block data', async () => {
      mockApiClient.executeRequest.mockResolvedValue({
        status: 200,
        statusText: 'OK',
        data: MOCK_BITCOIN_DATA.block
      });

      const result = await bitcoinService.getBlock({ height: 0 });

      expect(result.status).toBe(200);
      expect(result.data).toEqual(MOCK_BITCOIN_DATA.block);
    });
  });

  describe('Balance Operations Mock Data', () => {
    it('should return mock balance data', async () => {
      mockApiClient.executeRequest.mockResolvedValue({
        status: 200,
        statusText: 'OK',
        data: MOCK_BITCOIN_DATA.balance
      });

      const result = await bitcoinService.getBalance({
        address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'
      });

      expect(result.status).toBe(200);
      expect(result.data).toEqual(MOCK_BITCOIN_DATA.balance);
    });

    it('should return mock multiple balances data', async () => {
      mockApiClient.executeRequest.mockResolvedValue({
        status: 200,
        statusText: 'OK',
        data: MOCK_BITCOIN_DATA.multipleBalances
      });

      const result = await bitcoinService.getMultipleBalances({
        addresses: Object.keys(MOCK_BITCOIN_DATA.multipleBalances)
      });

      expect(result.status).toBe(200);
      expect(result.data).toEqual(MOCK_BITCOIN_DATA.multipleBalances);
    });
  });

  describe('Transaction Operations Mock Data', () => {
    it('should return mock transaction history', async () => {
      mockApiClient.executeRequest.mockResolvedValue({
        status: 200,
        statusText: 'OK',
        data: MOCK_BITCOIN_DATA.transactionHistory
      });

      const result = await bitcoinService.getTransactions({
        address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'
      });

      expect(result.status).toBe(200);
      expect(result.data).toEqual(MOCK_BITCOIN_DATA.transactionHistory);
    });

    it('should return mock transaction details', async () => {
      mockApiClient.executeRequest.mockResolvedValue({
        status: 200,
        statusText: 'OK',
        data: MOCK_BITCOIN_DATA.transaction
      });

      const result = await bitcoinService.getTransaction({
        hash: '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b'
      });

      expect(result.status).toBe(200);
      expect(result.data).toEqual(MOCK_BITCOIN_DATA.transaction);
    });

    it('should return mock transaction broadcast result', async () => {
      mockApiClient.executeRequest.mockResolvedValue({
        status: 200,
        statusText: 'OK',
        data: MOCK_BITCOIN_DATA.transactionBroadcast
      });

      const result = await bitcoinService.broadcastTransaction({
        txData: '0100000001a15d57094aa7a21a28cb2b068d52b0cc25d48906e231c2b4d8a720dc3ade1c5000000000'
      });

      expect(result.status).toBe(200);
      expect(result.data).toEqual(MOCK_BITCOIN_DATA.transactionBroadcast);
    });
  });

  describe('UTXO and Mempool Mock Data', () => {
    it('should return mock UTXO data', async () => {
      mockApiClient.executeRequest.mockResolvedValue({
        status: 200,
        statusText: 'OK',
        data: MOCK_BITCOIN_DATA.utxo
      });

      const result = await bitcoinService.getUtxo({
        hash: '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b',
        index: 0
      });

      expect(result.status).toBe(200);
      expect(result.data).toEqual(MOCK_BITCOIN_DATA.utxo);
    });

    it('should return mock mempool data', async () => {
      mockApiClient.executeRequest.mockResolvedValue({
        status: 200,
        statusText: 'OK',
        data: MOCK_BITCOIN_DATA.mempoolInfo
      });

      const result = await bitcoinService.getMempoolTransactions();

      expect(result.status).toBe(200);
      expect(result.data).toEqual(MOCK_BITCOIN_DATA.mempoolInfo);
    });

    it('should return mock RPC connection data', async () => {
      mockApiClient.executeRequest.mockResolvedValue({
        status: 200,
        statusText: 'OK',
        data: MOCK_BITCOIN_DATA.rpcConnection
      });

      const result = await bitcoinService.connectRpcDriver({
        nodeUrl: 'http://localhost:8332'
      });

      expect(result.status).toBe(200);
      expect(result.data).toEqual(MOCK_BITCOIN_DATA.rpcConnection);
    });
  });

  describe('Error Response Mock Data', () => {
    it('should return mock validation error', async () => {
      const result = await bitcoinService.getBalance({
        address: 'invalid-address'
      });

      expect(result.status).toBe(400);
      expect(result.error).toContain('Invalid Bitcoin address format');
      expect(result.data?.errorCode).toBe('VALIDATION_ERROR');
    });

    it('should return mock rate limit error', async () => {
      mockApiClient.executeRequest.mockResolvedValue(MOCK_BITCOIN_DATA.errors.rateLimit);

      const result = await bitcoinService.getBlockchainInfo();

      expect(result.status).toBe(429);
      expect(result.error).toContain('Rate limit exceeded');
      expect(result.data?.errorCode).toBe('RATE_LIMIT_EXCEEDED');
    });

    it('should return mock server error', async () => {
      mockApiClient.executeRequest.mockResolvedValue(MOCK_BITCOIN_DATA.errors.serverError);

      const result = await bitcoinService.getBlockchainInfo();

      expect(result.status).toBe(500);
      expect(result.error).toContain('Server error occurred');
      expect(result.data?.errorCode).toBe('NETWORK_ERROR');
    });
  });

  describe('Mock Data Validation', () => {
    it('should validate mock wallet data structure', () => {
      const wallet = MOCK_BITCOIN_DATA.wallet;
      
      expect(wallet).toHaveProperty('mnemonic');
      expect(wallet).toHaveProperty('xpub');
      expect(typeof wallet.mnemonic).toBe('string');
      expect(typeof wallet.xpub).toBe('string');
      expect(wallet.xpub).toMatch(/^xpub[a-km-zA-HJ-NP-Z1-9]{107,108}$/);
      
      // Validate mnemonic word count
      const words = wallet.mnemonic.split(' ');
      expect([12, 15, 18, 21, 24]).toContain(words.length);
    });

    it('should validate mock transaction data structure', () => {
      const transaction = MOCK_BITCOIN_DATA.transaction;
      
      expect(transaction).toHaveProperty('hash');
      expect(transaction).toHaveProperty('inputs');
      expect(transaction).toHaveProperty('outputs');
      expect(transaction).toHaveProperty('fee');
      expect(transaction.hash).toMatch(/^[a-fA-F0-9]{64}$/);
      expect(Array.isArray(transaction.inputs)).toBe(true);
      expect(Array.isArray(transaction.outputs)).toBe(true);
      expect(typeof transaction.fee).toBe('string');
    });

    it('should validate mock balance data structure', () => {
      const balance = MOCK_BITCOIN_DATA.balance;
      
      expect(balance).toHaveProperty('incoming');
      expect(balance).toHaveProperty('outgoing');
      expect(balance).toHaveProperty('balance');
      expect(typeof balance.incoming).toBe('string');
      expect(typeof balance.outgoing).toBe('string');
      expect(typeof balance.balance).toBe('string');
      
      // Validate numeric format
      expect(parseFloat(balance.incoming)).not.toBeNaN();
      expect(parseFloat(balance.outgoing)).not.toBeNaN();
      expect(parseFloat(balance.balance)).not.toBeNaN();
    });

    it('should validate mock block data structure', () => {
      const block = MOCK_BITCOIN_DATA.block;
      
      expect(block).toHaveProperty('hash');
      expect(block).toHaveProperty('height');
      expect(block).toHaveProperty('tx');
      expect(block.hash).toMatch(/^[a-fA-F0-9]{64}$/);
      expect(typeof block.height).toBe('number');
      expect(Array.isArray(block.tx)).toBe(true);
      expect(block.height).toBeGreaterThanOrEqual(0);
    });
  });
});