# Design Document

## Overview

The Bitcoin service will integrate with Tatum's Bitcoin RPC API to provide comprehensive Bitcoin blockchain functionality. The service follows the existing architectural patterns established in the codebase, utilizing the TatumApiClient for HTTP requests and implementing a service class with tool definitions for MCP integration.

The service will support both direct Bitcoin RPC calls through the gateway service and higher-level Bitcoin-specific operations through dedicated API endpoints. This dual approach provides flexibility for both low-level blockchain operations and user-friendly Bitcoin transactions.

## Architecture

### Service Structure
The Bitcoin service follows the established pattern with three main components:

1. **BitcoinService Class**: Core service implementation handling Bitcoin operations
2. **BITCOIN_TOOLS**: Tool definitions for MCP integration
3. **Type Definitions**: Bitcoin-specific interfaces and types

### Integration Points
- **TatumApiClient**: For HTTP requests to Tatum API endpoints
- **GatewayService**: For direct Bitcoin RPC calls when needed
- **Existing Type System**: Extends current TatumApiResponse and error handling patterns

## Components and Interfaces

### BitcoinService Class

```typescript
export class BitcoinService {
  constructor(private apiClient: TatumApiClient) {}
  
  // Wallet Operations
  async generateWallet(): Promise<TatumApiResponse>
  async generateAddress(args: GenerateAddressArgs): Promise<TatumApiResponse>
  async generatePrivateKey(args: GeneratePrivateKeyArgs): Promise<TatumApiResponse>
  
  // Blockchain Information
  async getBlockchainInfo(): Promise<TatumApiResponse>
  async getBlockHash(args: GetBlockHashArgs): Promise<TatumApiResponse>
  async getBlock(args: GetBlockArgs): Promise<TatumApiResponse>
  
  // Balance Operations
  async getBalance(args: GetBalanceArgs): Promise<TatumApiResponse>
  async getMultipleBalances(args: GetMultipleBalancesArgs): Promise<TatumApiResponse>
  
  // Transaction Operations
  async getTransactions(args: GetTransactionsArgs): Promise<TatumApiResponse>
  async getTransactionsBatch(args: GetTransactionsBatchArgs): Promise<TatumApiResponse>
  async getTransaction(args: GetTransactionArgs): Promise<TatumApiResponse>
  async sendTransaction(args: SendTransactionArgs): Promise<TatumApiResponse>
  async broadcastTransaction(args: BroadcastTransactionArgs): Promise<TatumApiResponse>
  
  // UTXO and Mempool
  async getUtxo(args: GetUtxoArgs): Promise<TatumApiResponse>
  async getMempoolTransactions(): Promise<TatumApiResponse>
  async connectRpcDriver(args: ConnectRpcArgs): Promise<TatumApiResponse>
}
```

### Tool Definitions

The BITCOIN_TOOLS array will define MCP tools for each Bitcoin operation:

```typescript
export const BITCOIN_TOOLS = [
  {
    name: 'bitcoin_generate_wallet',
    description: 'Generate a new Bitcoin wallet with extended public key',
    inputSchema: { type: 'object', properties: {}, required: [] }
  },
  {
    name: 'bitcoin_generate_address',
    description: 'Generate a Bitcoin address from wallet extended public key',
    inputSchema: {
      type: 'object',
      properties: {
        xpub: { type: 'string', description: 'Extended public key' },
        index: { type: 'number', description: 'Address derivation index' }
      },
      required: ['xpub', 'index']
    }
  },
  // ... additional tools for each operation
];
```

## Data Models

### Request/Response Interfaces

```typescript
// Wallet Operations
interface GenerateAddressArgs {
  xpub: string;
  index: number;
}

interface GeneratePrivateKeyArgs {
  mnemonic: string;
  index: number;
}

// Blockchain Information
interface GetBlockHashArgs {
  height: number;
}

interface GetBlockArgs {
  hash?: string;
  height?: number;
}

// Balance Operations
interface GetBalanceArgs {
  address: string;
}

interface GetMultipleBalancesArgs {
  addresses: string[];
}

// Transaction Operations
interface GetTransactionsArgs {
  address: string;
  pageSize?: number;
  offset?: number;
}

interface SendTransactionArgs {
  fromAddress: string[];
  to: TransactionOutput[];
  fee?: string;
  changeAddress?: string;
}

interface TransactionOutput {
  address: string;
  value: number;
}

// Response Types
interface BitcoinWallet {
  mnemonic: string;
  xpub: string;
}

interface BitcoinAddress {
  address: string;
}

interface BitcoinBalance {
  incoming: string;
  outgoing: string;
  balance: string;
}

interface BitcoinTransaction {
  hash: string;
  height: number;
  timestamp: number;
  inputs: TransactionInput[];
  outputs: TransactionOutput[];
  fee: string;
}
```

### Error Handling

The service will utilize the existing TatumApiResponse pattern for consistent error handling:

```typescript
interface TatumApiResponse {
  data?: any;
  error?: string;
  status: number;
  statusText: string;
}
```

Common Bitcoin-specific errors:
- Invalid address format
- Insufficient funds
- Network connectivity issues
- Invalid transaction parameters
- RPC node unavailable

## API Endpoints Mapping

### Tatum Bitcoin API Endpoints

1. **Wallet Operations**
   - `POST /v3/bitcoin/wallet` - Generate wallet
   - `GET /v3/bitcoin/address/{xpub}/{index}` - Generate address
   - `POST /v3/bitcoin/wallet/priv` - Generate private key

2. **Blockchain Information**
   - `GET /v3/bitcoin/info` - Get blockchain info
   - `GET /v3/bitcoin/block/hash/{height}` - Get block hash
   - `GET /v3/bitcoin/block/{hash}` - Get block by hash

3. **Balance Operations**
   - `GET /v3/bitcoin/address/balance/{address}` - Get balance
   - `POST /v3/bitcoin/address/balance/batch` - Get multiple balances

4. **Transaction Operations**
   - `GET /v3/bitcoin/transaction/address/{address}` - Get transactions
   - `POST /v3/bitcoin/transaction/address/batch` - Get transactions batch
   - `GET /v3/bitcoin/transaction/{hash}` - Get transaction
   - `POST /v3/bitcoin/transaction` - Send transaction
   - `POST /v3/bitcoin/broadcast` - Broadcast transaction

5. **UTXO and Mempool**
   - `GET /v3/bitcoin/utxo/{hash}/{index}` - Get UTXO
   - `GET /v3/bitcoin/mempool` - Get mempool transactions
   - `POST /v3/bitcoin/node/{xApiKey}` - Connect RPC driver

## Testing Strategy

### Unit Tests
- Test each service method with valid inputs
- Test error handling for invalid inputs
- Mock TatumApiClient responses
- Validate request parameter construction
- Test type safety and interface compliance

### Integration Tests
- Test against Tatum API sandbox environment
- Validate actual Bitcoin network responses
- Test error scenarios with real API
- Performance testing for batch operations

### Test Structure
```typescript
describe('BitcoinService', () => {
  describe('generateWallet', () => {
    it('should generate a valid Bitcoin wallet');
    it('should handle API errors gracefully');
  });
  
  describe('getBalance', () => {
    it('should return balance for valid address');
    it('should handle invalid address format');
  });
  
  // ... additional test suites
});
```

### Mock Data
- Sample Bitcoin addresses and transactions
- Mock wallet generation responses
- Error response scenarios
- Network timeout simulations

## Security Considerations

### API Key Management
- Utilize existing TatumApiClient authentication
- Ensure API keys are not logged or exposed
- Implement proper error messages without sensitive data

### Input Validation
- Validate Bitcoin address formats
- Sanitize transaction parameters
- Prevent injection attacks in RPC calls
- Validate numeric inputs for amounts and indices

### Rate Limiting
- Respect Tatum API rate limits
- Implement exponential backoff for retries
- Handle rate limit errors gracefully

## Performance Optimization

### Caching Strategy
- Cache blockchain information for short periods
- Implement request deduplication for identical calls
- Cache UTXO data temporarily

### Batch Operations
- Utilize batch endpoints for multiple address operations
- Optimize transaction history retrieval
- Implement pagination for large result sets

### Connection Management
- Reuse HTTP connections through TatumApiClient
- Implement connection pooling for RPC operations
- Handle connection timeouts appropriately