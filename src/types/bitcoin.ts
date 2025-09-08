// Bitcoin Service Type Definitions
// Based on Tatum Bitcoin API and design specifications

// ============================================================================
// Request Interfaces
// ============================================================================

// Wallet Operations
export interface GenerateAddressArgs {
  xpub: string;
  index: number;
}

export interface GeneratePrivateKeyArgs {
  mnemonic: string;
  index: number;
}

// Blockchain Information
export interface GetBlockHashArgs {
  height: number;
}

export interface GetBlockArgs {
  hash?: string;
  height?: number;
}

// Balance Operations
export interface GetBalanceArgs {
  address: string;
}

export interface GetMultipleBalancesArgs {
  addresses: string[];
}

// Transaction Operations
export interface GetTransactionsArgs {
  address: string;
  pageSize?: number;
  offset?: number;
}

export interface GetTransactionsBatchArgs {
  addresses: string[];
  pageSize?: number;
  offset?: number;
}

export interface GetTransactionArgs {
  hash: string;
}

export interface SendTransactionArgs {
  fromAddress: string[];
  to: TransactionOutput[];
  fee?: string;
  changeAddress?: string;
}

export interface BroadcastTransactionArgs {
  txData: string;
}

// UTXO and Mempool Operations
export interface GetUtxoArgs {
  hash: string;
  index: number;
}

export interface ConnectRpcArgs {
  nodeUrl: string;
  username?: string;
  password?: string;
}

// ============================================================================
// Response Interfaces
// ============================================================================

// Wallet Response Types
export interface BitcoinWallet {
  mnemonic: string;
  xpub: string;
}

export interface BitcoinAddress {
  address: string;
}

export interface BitcoinPrivateKey {
  key: string;
}

// Blockchain Information Response Types
export interface BitcoinBlockchainInfo {
  chain: string;
  blocks: number;
  headers: number;
  bestblockhash: string;
  difficulty: number;
  mediantime: number;
  verificationprogress: number;
  initialblockdownload: boolean;
  chainwork: string;
  size_on_disk: number;
  pruned: boolean;
}

export interface BitcoinBlockHash {
  hash: string;
}

export interface BitcoinBlock {
  hash: string;
  confirmations: number;
  size: number;
  height: number;
  version: number;
  versionHex: string;
  merkleroot: string;
  tx: string[];
  time: number;
  mediantime: number;
  nonce: number;
  bits: string;
  difficulty: number;
  chainwork: string;
  nTx: number;
  previousblockhash?: string;
  nextblockhash?: string;
}

// Balance Response Types
export interface BitcoinBalance {
  incoming: string;
  outgoing: string;
  balance: string;
}

export interface BitcoinMultipleBalances {
  [address: string]: BitcoinBalance;
}

// Transaction Response Types
export interface TransactionInput {
  prevout: {
    hash: string;
    index: number;
  };
  scriptSig: {
    asm: string;
    hex: string;
  };
  sequence: number;
  witness?: string[];
}

export interface TransactionOutput {
  address: string;
  value: number;
  scriptPubKey?: {
    asm: string;
    hex: string;
    type: string;
    addresses?: string[];
  };
}

export interface BitcoinTransaction {
  hash: string;
  height: number;
  timestamp: number;
  inputs: TransactionInput[];
  outputs: TransactionOutput[];
  fee: string;
  size: number;
  vsize?: number;
  weight?: number;
  locktime: number;
  version: number;
  confirmations: number;
}

export interface BitcoinTransactionHistory {
  transactions: BitcoinTransaction[];
  total: number;
  pageSize: number;
  offset: number;
}

export interface BitcoinTransactionDetails extends BitcoinTransaction {
  hex: string;
  blockhash?: string;
  blocktime?: number;
}

export interface BitcoinTransactionBroadcast {
  txId: string;
  completed: boolean;
}

// UTXO Response Types
export interface BitcoinUtxo {
  hash: string;
  index: number;
  value: string;
  height: number;
  confirmations: number;
  coinbase: boolean;
  scriptPubKey: {
    asm: string;
    hex: string;
    type: string;
    addresses?: string[];
  };
}

export interface BitcoinMempoolTransaction {
  hash: string;
  fee: string;
  vsize: number;
  weight: number;
  time: number;
  height: number;
  descendantcount: number;
  descendantsize: number;
  descendantfees: string;
  ancestorcount: number;
  ancestorsize: number;
  ancestorfees: string;
}

export interface BitcoinMempoolInfo {
  transactions: BitcoinMempoolTransaction[];
  count: number;
  bytes: number;
  usage: number;
  maxmempool: number;
  mempoolminfee: string;
  minrelaytxfee: string;
}

export interface BitcoinRpcConnection {
  connected: boolean;
  nodeUrl: string;
  blockHeight?: number;
  networkInfo?: {
    version: number;
    subversion: string;
    protocolversion: number;
    connections: number;
  };
}

// ============================================================================
// Error Types
// ============================================================================

export interface BitcoinError {
  code: string;
  message: string;
  details?: any;
}

export interface BitcoinValidationError extends BitcoinError {
  field: string;
  value: any;
  constraint: string;
}

// Common Bitcoin error codes
export enum BitcoinErrorCode {
  INVALID_ADDRESS = 'INVALID_ADDRESS',
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  INVALID_TRANSACTION = 'INVALID_TRANSACTION',
  NETWORK_ERROR = 'NETWORK_ERROR',
  RPC_ERROR = 'RPC_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  BROADCAST_FAILED = 'BROADCAST_FAILED',
  BLOCK_NOT_FOUND = 'BLOCK_NOT_FOUND',
  TRANSACTION_NOT_FOUND = 'TRANSACTION_NOT_FOUND',
  UTXO_NOT_FOUND = 'UTXO_NOT_FOUND',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  API_KEY_INVALID = 'API_KEY_INVALID',
  TIMEOUT = 'TIMEOUT'
}

// ============================================================================
// Validation Schemas
// ============================================================================

// Bitcoin address validation regex patterns
export const BITCOIN_ADDRESS_PATTERNS = {
  // Legacy P2PKH addresses (start with 1)
  P2PKH: /^[1][a-km-zA-HJ-NP-Z1-9]{25,34}$/,
  // Legacy P2SH addresses (start with 3)
  P2SH: /^[3][a-km-zA-HJ-NP-Z1-9]{25,34}$/,
  // Bech32 addresses (start with bc1)
  BECH32: /^bc1[a-z0-9]{39,59}$/,
  // Testnet addresses
  TESTNET_P2PKH: /^[mn][a-km-zA-HJ-NP-Z1-9]{25,34}$/,
  TESTNET_P2SH: /^[2][a-km-zA-HJ-NP-Z1-9]{25,34}$/,
  TESTNET_BECH32: /^tb1[a-z0-9]{39,59}$/
};

// Validation functions
export const BitcoinValidation = {
  isValidAddress: (address: string, testnet = false): boolean => {
    if (!address || typeof address !== 'string') {
      return false;
    }

    if (testnet) {
      return (
        BITCOIN_ADDRESS_PATTERNS.TESTNET_P2PKH.test(address) ||
        BITCOIN_ADDRESS_PATTERNS.TESTNET_P2SH.test(address) ||
        BITCOIN_ADDRESS_PATTERNS.TESTNET_BECH32.test(address)
      );
    }

    return (
      BITCOIN_ADDRESS_PATTERNS.P2PKH.test(address) ||
      BITCOIN_ADDRESS_PATTERNS.P2SH.test(address) ||
      BITCOIN_ADDRESS_PATTERNS.BECH32.test(address)
    );
  },

  isValidTransactionHash: (hash: string): boolean => {
    return /^[a-fA-F0-9]{64}$/.test(hash);
  },

  isValidBlockHeight: (height: number): boolean => {
    return Number.isInteger(height) && height >= 0;
  },

  isValidAmount: (amount: string | number): boolean => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return !isNaN(num) && num >= 0 && num <= 21000000; // Max Bitcoin supply
  },

  isValidIndex: (index: number): boolean => {
    return Number.isInteger(index) && index >= 0 && index < 2147483648; // 2^31
  },

  isValidXpub: (xpub: string): boolean => {
    return /^xpub[a-km-zA-HJ-NP-Z1-9]{107,108}$/.test(xpub);
  },

  isValidMnemonic: (mnemonic: string): boolean => {
    const words = mnemonic.trim().split(/\s+/);
    return [12, 15, 18, 21, 24].includes(words.length);
  }
};

// ============================================================================
// Tool Input Schemas for MCP Integration
// ============================================================================

export const BitcoinToolSchemas = {
  generateWallet: {
    type: 'object',
    properties: {},
    required: [],
    description: 'Generate a new Bitcoin wallet with extended public key and mnemonic phrase',
    examples: [
      {
        description: 'Generate a new Bitcoin wallet',
        input: {}
      }
    ]
  },

  generateAddress: {
    type: 'object',
    properties: {
      xpub: {
        type: 'string',
        description: 'Extended public key from Bitcoin wallet',
        pattern: '^xpub[a-km-zA-HJ-NP-Z1-9]{107,108}$'
      },
      index: {
        type: 'number',
        description: 'Address derivation index (0-2147483647)',
        minimum: 0,
        maximum: 2147483647
      }
    },
    required: ['xpub', 'index'],
    description: 'Generate a Bitcoin address from wallet extended public key',
    examples: [
      {
        description: 'Generate address at index 0',
        input: {
          xpub: 'xpub6CUGRUonZSQ4TWtTMmzXdrXDtypWKiKrhko4egpiMZbpiaQL2jkwSB1icqYh2cfDfVxdx4df189oLKnC5fSwqPfgyP3hooxujYzAu3fDVmz',
          index: 0
        }
      }
    ]
  },

  generatePrivateKey: {
    type: 'object',
    properties: {
      mnemonic: {
        type: 'string',
        description: 'BIP39 mnemonic phrase (12, 15, 18, 21, or 24 words)'
      },
      index: {
        type: 'number',
        description: 'Private key derivation index (0-2147483647)',
        minimum: 0,
        maximum: 2147483647
      }
    },
    required: ['mnemonic', 'index'],
    description: 'Generate a private key for a Bitcoin address from mnemonic',
    examples: [
      {
        description: 'Generate private key for address at index 0',
        input: {
          mnemonic: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
          index: 0
        }
      }
    ]
  },

  getBlockchainInfo: {
    type: 'object',
    properties: {},
    required: [],
    description: 'Get current Bitcoin blockchain information and network statistics',
    examples: [
      {
        description: 'Get current blockchain info',
        input: {}
      }
    ]
  },

  getBlockHash: {
    type: 'object',
    properties: {
      height: {
        type: 'number',
        description: 'Block height (0 or greater)',
        minimum: 0
      }
    },
    required: ['height'],
    description: 'Get Bitcoin block hash by block height',
    examples: [
      {
        description: 'Get hash for genesis block',
        input: { height: 0 }
      },
      {
        description: 'Get hash for block 100000',
        input: { height: 100000 }
      }
    ]
  },

  getBlock: {
    type: 'object',
    properties: {
      hash: {
        type: 'string',
        description: 'Block hash (64-character hex string)',
        pattern: '^[a-fA-F0-9]{64}$'
      },
      height: {
        type: 'number',
        description: 'Block height (0 or greater)',
        minimum: 0
      }
    },
    anyOf: [
      { required: ['hash'] },
      { required: ['height'] }
    ],
    description: 'Get Bitcoin block data by hash or height',
    examples: [
      {
        description: 'Get block by hash',
        input: {
          hash: '000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f'
        }
      },
      {
        description: 'Get block by height',
        input: { height: 0 }
      }
    ]
  },

  getBalance: {
    type: 'object',
    properties: {
      address: {
        type: 'string',
        description: 'Bitcoin address to check balance for'
      }
    },
    required: ['address'],
    description: 'Get Bitcoin balance for a single address',
    examples: [
      {
        description: 'Get balance for a Bitcoin address',
        input: {
          address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'
        }
      }
    ]
  },

  getMultipleBalances: {
    type: 'object',
    properties: {
      addresses: {
        type: 'array',
        description: 'Array of Bitcoin addresses to check balances for',
        items: {
          type: 'string'
        },
        minItems: 1,
        maxItems: 100
      }
    },
    required: ['addresses'],
    description: 'Get Bitcoin balances for multiple addresses in batch',
    examples: [
      {
        description: 'Get balances for multiple addresses',
        input: {
          addresses: [
            '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
            '12c6DSiU4Rq3P4ZxziKxzrL5LmMBrzjrJX'
          ]
        }
      }
    ]
  },

  getTransactions: {
    type: 'object',
    properties: {
      address: {
        type: 'string',
        description: 'Bitcoin address to get transaction history for'
      },
      pageSize: {
        type: 'number',
        description: 'Number of transactions per page (1-100)',
        minimum: 1,
        maximum: 100,
        default: 50
      },
      offset: {
        type: 'number',
        description: 'Number of transactions to skip',
        minimum: 0,
        default: 0
      }
    },
    required: ['address'],
    description: 'Get transaction history for a Bitcoin address with pagination',
    examples: [
      {
        description: 'Get first 10 transactions for an address',
        input: {
          address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
          pageSize: 10,
          offset: 0
        }
      }
    ]
  },

  getTransactionsBatch: {
    type: 'object',
    properties: {
      addresses: {
        type: 'array',
        description: 'Array of Bitcoin addresses to get transactions for',
        items: {
          type: 'string'
        },
        minItems: 1,
        maxItems: 10
      },
      pageSize: {
        type: 'number',
        description: 'Number of transactions per page (1-100)',
        minimum: 1,
        maximum: 100,
        default: 50
      },
      offset: {
        type: 'number',
        description: 'Number of transactions to skip',
        minimum: 0,
        default: 0
      }
    },
    required: ['addresses'],
    description: 'Get transaction history for multiple Bitcoin addresses',
    examples: [
      {
        description: 'Get transactions for multiple addresses',
        input: {
          addresses: [
            '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
            '12c6DSiU4Rq3P4ZxziKxzrL5LmMBrzjrJX'
          ],
          pageSize: 20
        }
      }
    ]
  },

  getTransaction: {
    type: 'object',
    properties: {
      hash: {
        type: 'string',
        description: 'Transaction hash (64-character hex string)',
        pattern: '^[a-fA-F0-9]{64}$'
      }
    },
    required: ['hash'],
    description: 'Get detailed information for a specific Bitcoin transaction',
    examples: [
      {
        description: 'Get transaction details by hash',
        input: {
          hash: '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b'
        }
      }
    ]
  },

  sendTransaction: {
    type: 'object',
    properties: {
      fromAddress: {
        type: 'array',
        description: 'Array of source Bitcoin addresses',
        items: {
          type: 'string'
        },
        minItems: 1
      },
      to: {
        type: 'array',
        description: 'Array of transaction outputs',
        items: {
          type: 'object',
          properties: {
            address: {
              type: 'string',
              description: 'Recipient Bitcoin address'
            },
            value: {
              type: 'number',
              description: 'Amount to send in BTC',
              minimum: 0.00000001
            }
          },
          required: ['address', 'value']
        },
        minItems: 1
      },
      fee: {
        type: 'string',
        description: 'Transaction fee in BTC (optional, auto-calculated if not provided)'
      },
      changeAddress: {
        type: 'string',
        description: 'Address to send change to (optional)'
      }
    },
    required: ['fromAddress', 'to'],
    description: 'Create and broadcast a Bitcoin transaction',
    examples: [
      {
        description: 'Send 0.001 BTC to an address',
        input: {
          fromAddress: ['1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'],
          to: [
            {
              address: '12c6DSiU4Rq3P4ZxziKxzrL5LmMBrzjrJX',
              value: 0.001
            }
          ],
          fee: '0.00001'
        }
      }
    ]
  },

  broadcastTransaction: {
    type: 'object',
    properties: {
      txData: {
        type: 'string',
        description: 'Signed transaction data in hex format',
        pattern: '^[a-fA-F0-9]+$'
      }
    },
    required: ['txData'],
    description: 'Broadcast a signed Bitcoin transaction to the network',
    examples: [
      {
        description: 'Broadcast a signed transaction',
        input: {
          txData: '0100000001...'
        }
      }
    ]
  },

  getUtxo: {
    type: 'object',
    properties: {
      hash: {
        type: 'string',
        description: 'Transaction hash (64-character hex string)',
        pattern: '^[a-fA-F0-9]{64}$'
      },
      index: {
        type: 'number',
        description: 'Output index (0 or greater)',
        minimum: 0
      }
    },
    required: ['hash', 'index'],
    description: 'Get unspent transaction output (UTXO) information',
    examples: [
      {
        description: 'Get UTXO for transaction output',
        input: {
          hash: '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b',
          index: 0
        }
      }
    ]
  },

  getMempoolTransactions: {
    type: 'object',
    properties: {},
    required: [],
    description: 'Get all pending transactions in the Bitcoin mempool',
    examples: [
      {
        description: 'Get current mempool transactions',
        input: {}
      }
    ]
  },

  connectRpcDriver: {
    type: 'object',
    properties: {
      nodeUrl: {
        type: 'string',
        description: 'Bitcoin node RPC URL',
        format: 'uri'
      },
      username: {
        type: 'string',
        description: 'RPC username (optional)'
      },
      password: {
        type: 'string',
        description: 'RPC password (optional)'
      }
    },
    required: ['nodeUrl'],
    description: 'Connect to a Bitcoin node via RPC for direct blockchain access',
    examples: [
      {
        description: 'Connect to local Bitcoin node',
        input: {
          nodeUrl: 'http://localhost:8332',
          username: 'bitcoinrpc',
          password: 'password123'
        }
      },
      {
        description: 'Connect to remote Bitcoin node without auth',
        input: {
          nodeUrl: 'https://bitcoin-node.example.com:8332'
        }
      }
    ]
  }
};