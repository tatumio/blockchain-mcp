import { TatumApiClient } from '../api-client.js';
import { TatumApiResponse } from '../types.js';
import {
  GenerateAddressArgs,
  GeneratePrivateKeyArgs,
  GetBlockHashArgs,
  GetBlockArgs,
  GetBalanceArgs,
  GetMultipleBalancesArgs,
  GetTransactionsArgs,
  GetTransactionsBatchArgs,
  GetTransactionArgs,
  SendTransactionArgs,
  BroadcastTransactionArgs,
  GetUtxoArgs,
  ConnectRpcArgs,
  BitcoinValidation,
  BitcoinToolSchemas,
  BitcoinErrorCode,
  BitcoinValidationError
} from '../types/bitcoin.js';

// Bitcoin MCP Tools Definition
export const BITCOIN_TOOLS = [
  {
    name: 'bitcoin_generate_wallet',
    description: 'Generate a new Bitcoin wallet with extended public key and mnemonic',
    inputSchema: BitcoinToolSchemas.generateWallet
  },
  {
    name: 'bitcoin_generate_address',
    description: 'Generate a Bitcoin address from wallet extended public key',
    inputSchema: BitcoinToolSchemas.generateAddress
  },
  {
    name: 'bitcoin_generate_private_key',
    description: 'Generate a private key for a Bitcoin address from mnemonic',
    inputSchema: BitcoinToolSchemas.generatePrivateKey
  },
  {
    name: 'bitcoin_get_blockchain_info',
    description: 'Get current Bitcoin blockchain information and network statistics',
    inputSchema: BitcoinToolSchemas.getBlockchainInfo
  },
  {
    name: 'bitcoin_get_block_hash',
    description: 'Get Bitcoin block hash by block height',
    inputSchema: BitcoinToolSchemas.getBlockHash
  },
  {
    name: 'bitcoin_get_block',
    description: 'Get Bitcoin block data by hash or height',
    inputSchema: BitcoinToolSchemas.getBlock
  },
  {
    name: 'bitcoin_get_balance',
    description: 'Get Bitcoin balance for a single address',
    inputSchema: BitcoinToolSchemas.getBalance
  },
  {
    name: 'bitcoin_get_multiple_balances',
    description: 'Get Bitcoin balances for multiple addresses in batch',
    inputSchema: BitcoinToolSchemas.getMultipleBalances
  },
  {
    name: 'bitcoin_get_transactions',
    description: 'Get transaction history for a Bitcoin address with pagination',
    inputSchema: BitcoinToolSchemas.getTransactions
  },
  {
    name: 'bitcoin_get_transactions_batch',
    description: 'Get transaction history for multiple Bitcoin addresses',
    inputSchema: BitcoinToolSchemas.getTransactionsBatch
  },
  {
    name: 'bitcoin_get_transaction',
    description: 'Get detailed information for a specific Bitcoin transaction',
    inputSchema: BitcoinToolSchemas.getTransaction
  },
  {
    name: 'bitcoin_send_transaction',
    description: 'Create and broadcast a Bitcoin transaction',
    inputSchema: BitcoinToolSchemas.sendTransaction
  },
  {
    name: 'bitcoin_broadcast_transaction',
    description: 'Broadcast a signed Bitcoin transaction to the network',
    inputSchema: BitcoinToolSchemas.broadcastTransaction
  },
  {
    name: 'bitcoin_get_utxo',
    description: 'Get unspent transaction output (UTXO) information',
    inputSchema: BitcoinToolSchemas.getUtxo
  },
  {
    name: 'bitcoin_get_mempool_transactions',
    description: 'Get all pending transactions in the Bitcoin mempool',
    inputSchema: BitcoinToolSchemas.getMempoolTransactions
  },
  {
    name: 'bitcoin_connect_rpc_driver',
    description: 'Connect to a Bitcoin node via RPC for direct blockchain access',
    inputSchema: BitcoinToolSchemas.connectRpcDriver
  }
];

export class BitcoinService {
  private readonly maxRetries = 3;
  private readonly baseRetryDelay = 1000; // 1 second

  constructor(private apiClient: TatumApiClient) {}

  // ============================================================================
  // Wallet Operations
  // ============================================================================

  async generateWallet(): Promise<TatumApiResponse> {
    return await this.executeWithRetry(async () => {
      const url = '/v3/bitcoin/wallet';
      return await this.apiClient.executeRequest('POST', url, {});
    }, 'generateWallet');
  }

  async generateAddress(args: GenerateAddressArgs): Promise<TatumApiResponse> {
    const validationError = this.validateGenerateAddressArgs(args);
    if (validationError) {
      return validationError;
    }

    return await this.executeWithRetry(async () => {
      const url = `/v3/bitcoin/address/{xpub}/{index}`;
      const parameters = {
        xpub: args.xpub,
        index: args.index
      };
      return await this.apiClient.executeRequest('GET', url, parameters);
    }, 'generateAddress');
  }

  async generatePrivateKey(args: GeneratePrivateKeyArgs): Promise<TatumApiResponse> {
    const validationError = this.validateGeneratePrivateKeyArgs(args);
    if (validationError) {
      return validationError;
    }

    return await this.executeWithRetry(async () => {
      const url = '/v3/bitcoin/wallet/priv';
      const parameters = {
        mnemonic: args.mnemonic,
        index: args.index
      };
      return await this.apiClient.executeRequest('POST', url, parameters);
    }, 'generatePrivateKey');
  }

  // ============================================================================
  // Blockchain Information
  // ============================================================================

  async getBlockchainInfo(): Promise<TatumApiResponse> {
    return await this.executeWithRetry(async () => {
      const url = '/v3/bitcoin/info';
      return await this.apiClient.executeRequest('GET', url, {});
    }, 'getBlockchainInfo');
  }

  async getBlockHash(args: GetBlockHashArgs): Promise<TatumApiResponse> {
    const validationError = this.validateGetBlockHashArgs(args);
    if (validationError) {
      return validationError;
    }

    return await this.executeWithRetry(async () => {
      const url = `/v3/bitcoin/block/hash/{height}`;
      const parameters = {
        height: args.height
      };
      return await this.apiClient.executeRequest('GET', url, parameters);
    }, 'getBlockHash');
  }

  async getBlock(args: GetBlockArgs): Promise<TatumApiResponse> {
    const validationError = this.validateGetBlockArgs(args);
    if (validationError) {
      return validationError;
    }

    return await this.executeWithRetry(async () => {
      if (args.hash) {
        const url = `/v3/bitcoin/block/{hash}`;
        const parameters = { hash: args.hash };
        return await this.apiClient.executeRequest('GET', url, parameters);
      } else if (args.height !== undefined) {
        const url = `/v3/bitcoin/block/{height}`;
        const parameters = { height: args.height };
        return await this.apiClient.executeRequest('GET', url, parameters);
      }

      return this.createValidationErrorResponse('Either hash or height must be provided');
    }, 'getBlock');
  }

  // ============================================================================
  // Balance Operations
  // ============================================================================

  async getBalance(args: GetBalanceArgs): Promise<TatumApiResponse> {
    const validationError = this.validateGetBalanceArgs(args);
    if (validationError) {
      return validationError;
    }

    return await this.executeWithRetry(async () => {
      const url = `/v3/bitcoin/address/balance/{address}`;
      const parameters = {
        address: args.address
      };
      return await this.apiClient.executeRequest('GET', url, parameters);
    }, 'getBalance');
  }

  async getMultipleBalances(args: GetMultipleBalancesArgs): Promise<TatumApiResponse> {
    const validationError = this.validateGetMultipleBalancesArgs(args);
    if (validationError) {
      return validationError;
    }

    return await this.executeWithRetry(async () => {
      const url = '/v3/bitcoin/address/balance/batch';
      const parameters = {
        addresses: args.addresses
      };
      return await this.apiClient.executeRequest('POST', url, parameters);
    }, 'getMultipleBalances');
  }

  // ============================================================================
  // Transaction Operations
  // ============================================================================

  async getTransactions(args: GetTransactionsArgs): Promise<TatumApiResponse> {
    const validationError = this.validateGetTransactionsArgs(args);
    if (validationError) {
      return validationError;
    }

    return await this.executeWithRetry(async () => {
      const url = `/v3/bitcoin/transaction/address/{address}`;
      const parameters: any = {
        address: args.address
      };
      
      if (args.pageSize !== undefined) parameters.pageSize = args.pageSize;
      if (args.offset !== undefined) parameters.offset = args.offset;

      return await this.apiClient.executeRequest('GET', url, parameters);
    }, 'getTransactions');
  }

  async getTransactionsBatch(args: GetTransactionsBatchArgs): Promise<TatumApiResponse> {
    const validationError = this.validateGetTransactionsBatchArgs(args);
    if (validationError) {
      return validationError;
    }

    return await this.executeWithRetry(async () => {
      const url = '/v3/bitcoin/transaction/address/batch';
      const parameters: any = {
        addresses: args.addresses
      };
      
      if (args.pageSize !== undefined) parameters.pageSize = args.pageSize;
      if (args.offset !== undefined) parameters.offset = args.offset;

      return await this.apiClient.executeRequest('POST', url, parameters);
    }, 'getTransactionsBatch');
  }

  async getTransaction(args: GetTransactionArgs): Promise<TatumApiResponse> {
    const validationError = this.validateGetTransactionArgs(args);
    if (validationError) {
      return validationError;
    }

    return await this.executeWithRetry(async () => {
      const url = `/v3/bitcoin/transaction/{hash}`;
      const parameters = {
        hash: args.hash
      };
      return await this.apiClient.executeRequest('GET', url, parameters);
    }, 'getTransaction');
  }

  async sendTransaction(args: SendTransactionArgs): Promise<TatumApiResponse> {
    const validationError = this.validateSendTransactionArgs(args);
    if (validationError) {
      return validationError;
    }

    return await this.executeWithRetry(async () => {
      const url = '/v3/bitcoin/transaction';
      const parameters: any = {
        fromAddress: args.fromAddress,
        to: args.to
      };
      
      if (args.fee !== undefined) parameters.fee = args.fee;
      if (args.changeAddress !== undefined) parameters.changeAddress = args.changeAddress;

      return await this.apiClient.executeRequest('POST', url, parameters);
    }, 'sendTransaction');
  }

  async broadcastTransaction(args: BroadcastTransactionArgs): Promise<TatumApiResponse> {
    const validationError = this.validateBroadcastTransactionArgs(args);
    if (validationError) {
      return validationError;
    }

    return await this.executeWithRetry(async () => {
      const url = '/v3/bitcoin/broadcast';
      const parameters = {
        txData: args.txData
      };
      return await this.apiClient.executeRequest('POST', url, parameters);
    }, 'broadcastTransaction');
  }

  // ============================================================================
  // UTXO and Mempool Operations
  // ============================================================================

  async getUtxo(args: GetUtxoArgs): Promise<TatumApiResponse> {
    const validationError = this.validateGetUtxoArgs(args);
    if (validationError) {
      return validationError;
    }

    return await this.executeWithRetry(async () => {
      const url = `/v3/bitcoin/utxo/{hash}/{index}`;
      const parameters = {
        hash: args.hash,
        index: args.index
      };
      return await this.apiClient.executeRequest('GET', url, parameters);
    }, 'getUtxo');
  }

  async getMempoolTransactions(): Promise<TatumApiResponse> {
    return await this.executeWithRetry(async () => {
      const url = '/v3/bitcoin/mempool';
      return await this.apiClient.executeRequest('GET', url, {});
    }, 'getMempoolTransactions');
  }

  async connectRpcDriver(args: ConnectRpcArgs): Promise<TatumApiResponse> {
    const validationError = this.validateConnectRpcArgs(args);
    if (validationError) {
      return validationError;
    }

    return await this.executeWithRetry(async () => {
      const url = '/v3/bitcoin/node/{xApiKey}';
      const parameters: any = {
        nodeUrl: args.nodeUrl
      };
      
      if (args.username !== undefined) parameters.username = args.username;
      if (args.password !== undefined) parameters.password = args.password;

      return await this.apiClient.executeRequest('POST', url, parameters);
    }, 'connectRpcDriver');
  }

  // ============================================================================
  // Private Helper Methods for Error Handling and Validation
  // ============================================================================

  private createValidationErrorResponse(message: string, field?: string, value?: any): TatumApiResponse {
    const error: BitcoinValidationError = {
      code: BitcoinErrorCode.VALIDATION_ERROR,
      message,
      field: field || 'unknown',
      value,
      constraint: 'validation_failed'
    };

    return {
      error: error.message,
      status: 400,
      statusText: 'Bad Request',
      data: { errorCode: error.code, details: error }
    };
  }

  private createErrorResponse(
    errorCode: BitcoinErrorCode,
    message: string,
    status: number = 500,
    statusText: string = 'Internal Server Error',
    details?: any
  ): TatumApiResponse {
    return {
      error: message,
      status,
      statusText,
      data: {
        errorCode,
        details: details || {}
      }
    };
  }

  private async executeWithRetry<T>(
    operation: () => Promise<TatumApiResponse>,
    operationName: string
  ): Promise<TatumApiResponse> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const result = await operation();
        
        // Check if this is a retryable error type (regardless of attempt count)
        if (this.isRetryableResponse(result)) {
          lastError = result;
          if (attempt < this.maxRetries) {
            await this.delay(this.calculateRetryDelay(attempt));
            continue;
          }
          // If this was the last attempt, transform the error
          return this.handleFinalError(result, operationName);
        }
        
        return result;
      } catch (error: any) {
        lastError = error;
        
        // Don't retry on validation errors or client errors (4xx)
        if (error.status >= 400 && error.status < 500) {
          return this.createErrorResponse(
            BitcoinErrorCode.VALIDATION_ERROR,
            error.message || 'Client error',
            error.status || 400,
            error.statusText || 'Bad Request'
          );
        }
        
        // Retry on network errors and server errors (5xx)
        if (attempt < this.maxRetries && this.isRetryableError(error)) {
          await this.delay(this.calculateRetryDelay(attempt));
          continue;
        }
        
        // If this was the last attempt, transform the error
        return this.handleFinalError(error, operationName);
      }
    }
    
    // This should never be reached, but just in case
    return this.handleFinalError(lastError, operationName);
  }

  private isRetryableResponse(response: TatumApiResponse): boolean {
    // Retry on rate limiting
    if (response.status === 429) {
      return true;
    }

    // Retry on server errors
    if (response.status >= 500) {
      return true;
    }

    // Retry on timeout
    if (response.status === 0 && response.error?.includes('timeout')) {
      return true;
    }

    return false;
  }

  private shouldRetry(response: TatumApiResponse, attempt: number): boolean {
    if (attempt >= this.maxRetries) {
      return false;
    }

    return this.isRetryableResponse(response);
  }

  private isRetryableError(error: any): boolean {
    // Network errors
    if (error.code === 'ECONNRESET' || error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
      return true;
    }

    // Server errors (5xx)
    if (error.status >= 500) {
      return true;
    }

    // Rate limiting
    if (error.status === 429) {
      return true;
    }

    return false;
  }

  private calculateRetryDelay(attempt: number): number {
    // Exponential backoff with jitter
    const exponentialDelay = this.baseRetryDelay * Math.pow(2, attempt - 1);
    const jitter = Math.random() * 0.1 * exponentialDelay;
    return Math.min(exponentialDelay + jitter, 30000); // Max 30 seconds
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private handleFinalError(error: any, operationName: string): TatumApiResponse {
    // Handle TatumApiResponse objects (from API calls)
    if (error && typeof error === 'object' && 'status' in error) {
      if (error.status === 429) {
        return this.createErrorResponse(
          BitcoinErrorCode.RATE_LIMIT_EXCEEDED,
          'Rate limit exceeded. Please try again later.',
          429,
          'Too Many Requests',
          { operation: operationName, retryAfter: error.headers?.['retry-after'] }
        );
      }

      if (error.status >= 500) {
        return this.createErrorResponse(
          BitcoinErrorCode.NETWORK_ERROR,
          'Server error occurred after multiple attempts',
          error.status,
          error.statusText || 'Internal Server Error',
          { operation: operationName }
        );
      }

      // For other status codes, return the original error but with operation context
      return {
        ...error,
        data: {
          ...error.data,
          errorCode: BitcoinErrorCode.NETWORK_ERROR,
          details: { operation: operationName }
        }
      };
    }

    // Handle Error objects (from network issues)
    if (error?.code === 'ETIMEDOUT' || error?.error?.includes('timeout')) {
      return this.createErrorResponse(
        BitcoinErrorCode.TIMEOUT,
        'Request timed out after multiple attempts',
        408,
        'Request Timeout',
        { operation: operationName }
      );
    }

    return this.createErrorResponse(
      BitcoinErrorCode.NETWORK_ERROR,
      error?.message || error?.error || 'Unknown error occurred',
      error?.status || 500,
      error?.statusText || 'Internal Server Error',
      { operation: operationName }
    );
  }

  // Enhanced validation methods with detailed error messages
  private validateGenerateAddressArgs(args: GenerateAddressArgs): TatumApiResponse | null {
    if (!args) {
      return this.createValidationErrorResponse('Arguments are required', 'args', args);
    }

    if (!args.xpub || typeof args.xpub !== 'string') {
      return this.createValidationErrorResponse('Extended public key (xpub) is required and must be a string', 'xpub', args.xpub);
    }

    if (!BitcoinValidation.isValidXpub(args.xpub)) {
      return this.createValidationErrorResponse('Invalid extended public key format', 'xpub', args.xpub);
    }

    if (typeof args.index !== 'number') {
      return this.createValidationErrorResponse('Index must be a number', 'index', args.index);
    }

    if (!BitcoinValidation.isValidIndex(args.index)) {
      return this.createValidationErrorResponse('Index must be between 0 and 2147483647', 'index', args.index);
    }

    return null;
  }

  private validateGeneratePrivateKeyArgs(args: GeneratePrivateKeyArgs): TatumApiResponse | null {
    if (!args) {
      return this.createValidationErrorResponse('Arguments are required', 'args', args);
    }

    if (!args.mnemonic || typeof args.mnemonic !== 'string') {
      return this.createValidationErrorResponse('Mnemonic phrase is required and must be a string', 'mnemonic', args.mnemonic);
    }

    if (!BitcoinValidation.isValidMnemonic(args.mnemonic)) {
      return this.createValidationErrorResponse('Invalid mnemonic phrase format (must be 12, 15, 18, 21, or 24 words)', 'mnemonic', args.mnemonic);
    }

    if (typeof args.index !== 'number') {
      return this.createValidationErrorResponse('Index must be a number', 'index', args.index);
    }

    if (!BitcoinValidation.isValidIndex(args.index)) {
      return this.createValidationErrorResponse('Index must be between 0 and 2147483647', 'index', args.index);
    }

    return null;
  }

  private validateGetBlockHashArgs(args: GetBlockHashArgs): TatumApiResponse | null {
    if (!args) {
      return this.createValidationErrorResponse('Arguments are required', 'args', args);
    }

    if (typeof args.height !== 'number') {
      return this.createValidationErrorResponse('Block height must be a number', 'height', args.height);
    }

    if (!BitcoinValidation.isValidBlockHeight(args.height)) {
      return this.createValidationErrorResponse('Block height must be 0 or greater', 'height', args.height);
    }

    return null;
  }

  private validateGetBlockArgs(args: GetBlockArgs): TatumApiResponse | null {
    if (!args) {
      return this.createValidationErrorResponse('Arguments are required', 'args', args);
    }

    const hasHash = args.hash && typeof args.hash === 'string';
    const hasHeight = args.height !== undefined && typeof args.height === 'number';

    if (!hasHash && !hasHeight) {
      return this.createValidationErrorResponse('Either hash or height must be provided', 'hash|height', { hash: args.hash, height: args.height });
    }

    if (hasHash && !BitcoinValidation.isValidTransactionHash(args.hash!)) {
      return this.createValidationErrorResponse('Invalid block hash format (must be 64-character hex string)', 'hash', args.hash);
    }

    if (hasHeight && !BitcoinValidation.isValidBlockHeight(args.height!)) {
      return this.createValidationErrorResponse('Block height must be 0 or greater', 'height', args.height);
    }

    return null;
  }

  private validateGetBalanceArgs(args: GetBalanceArgs): TatumApiResponse | null {
    if (!args) {
      return this.createValidationErrorResponse('Arguments are required', 'args', args);
    }

    if (!args.address || typeof args.address !== 'string') {
      return this.createValidationErrorResponse('Bitcoin address is required and must be a string', 'address', args.address);
    }

    if (!BitcoinValidation.isValidAddress(args.address)) {
      return this.createValidationErrorResponse('Invalid Bitcoin address format', 'address', args.address);
    }

    return null;
  }

  private validateGetMultipleBalancesArgs(args: GetMultipleBalancesArgs): TatumApiResponse | null {
    if (!args) {
      return this.createValidationErrorResponse('Arguments are required', 'args', args);
    }

    if (!Array.isArray(args.addresses)) {
      return this.createValidationErrorResponse('Addresses must be an array', 'addresses', args.addresses);
    }

    if (args.addresses.length === 0) {
      return this.createValidationErrorResponse('At least one address is required', 'addresses', args.addresses);
    }

    if (args.addresses.length > 100) {
      return this.createValidationErrorResponse('Maximum 100 addresses allowed per request', 'addresses', args.addresses.length);
    }

    for (let i = 0; i < args.addresses.length; i++) {
      const address = args.addresses[i];
      if (typeof address !== 'string') {
        return this.createValidationErrorResponse(`Address at index ${i} must be a string`, `addresses[${i}]`, address);
      }
      if (!BitcoinValidation.isValidAddress(address)) {
        return this.createValidationErrorResponse(`Invalid Bitcoin address format at index ${i}`, `addresses[${i}]`, address);
      }
    }

    return null;
  }

  private validateGetTransactionsArgs(args: GetTransactionsArgs): TatumApiResponse | null {
    if (!args) {
      return this.createValidationErrorResponse('Arguments are required', 'args', args);
    }

    if (!args.address || typeof args.address !== 'string') {
      return this.createValidationErrorResponse('Bitcoin address is required and must be a string', 'address', args.address);
    }

    if (!BitcoinValidation.isValidAddress(args.address)) {
      return this.createValidationErrorResponse('Invalid Bitcoin address format', 'address', args.address);
    }

    if (args.pageSize !== undefined) {
      if (typeof args.pageSize !== 'number' || args.pageSize < 1 || args.pageSize > 100) {
        return this.createValidationErrorResponse('Page size must be between 1 and 100', 'pageSize', args.pageSize);
      }
    }

    if (args.offset !== undefined) {
      if (typeof args.offset !== 'number' || args.offset < 0) {
        return this.createValidationErrorResponse('Offset must be 0 or greater', 'offset', args.offset);
      }
    }

    return null;
  }

  private validateGetTransactionsBatchArgs(args: GetTransactionsBatchArgs): TatumApiResponse | null {
    if (!args) {
      return this.createValidationErrorResponse('Arguments are required', 'args', args);
    }

    if (!Array.isArray(args.addresses)) {
      return this.createValidationErrorResponse('Addresses must be an array', 'addresses', args.addresses);
    }

    if (args.addresses.length === 0) {
      return this.createValidationErrorResponse('At least one address is required', 'addresses', args.addresses);
    }

    if (args.addresses.length > 10) {
      return this.createValidationErrorResponse('Maximum 10 addresses allowed per batch request', 'addresses', args.addresses.length);
    }

    for (let i = 0; i < args.addresses.length; i++) {
      const address = args.addresses[i];
      if (typeof address !== 'string') {
        return this.createValidationErrorResponse(`Address at index ${i} must be a string`, `addresses[${i}]`, address);
      }
      if (!BitcoinValidation.isValidAddress(address)) {
        return this.createValidationErrorResponse(`Invalid Bitcoin address format at index ${i}`, `addresses[${i}]`, address);
      }
    }

    if (args.pageSize !== undefined) {
      if (typeof args.pageSize !== 'number' || args.pageSize < 1 || args.pageSize > 100) {
        return this.createValidationErrorResponse('Page size must be between 1 and 100', 'pageSize', args.pageSize);
      }
    }

    if (args.offset !== undefined) {
      if (typeof args.offset !== 'number' || args.offset < 0) {
        return this.createValidationErrorResponse('Offset must be 0 or greater', 'offset', args.offset);
      }
    }

    return null;
  }

  private validateGetTransactionArgs(args: GetTransactionArgs): TatumApiResponse | null {
    if (!args) {
      return this.createValidationErrorResponse('Arguments are required', 'args', args);
    }

    if (!args.hash || typeof args.hash !== 'string') {
      return this.createValidationErrorResponse('Transaction hash is required and must be a string', 'hash', args.hash);
    }

    if (!BitcoinValidation.isValidTransactionHash(args.hash)) {
      return this.createValidationErrorResponse('Invalid transaction hash format (must be 64-character hex string)', 'hash', args.hash);
    }

    return null;
  }

  private validateSendTransactionArgs(args: SendTransactionArgs): TatumApiResponse | null {
    if (!args) {
      return this.createValidationErrorResponse('Arguments are required', 'args', args);
    }

    if (!Array.isArray(args.fromAddress)) {
      return this.createValidationErrorResponse('From addresses must be an array', 'fromAddress', args.fromAddress);
    }

    if (args.fromAddress.length === 0) {
      return this.createValidationErrorResponse('At least one from address is required', 'fromAddress', args.fromAddress);
    }

    for (let i = 0; i < args.fromAddress.length; i++) {
      const address = args.fromAddress[i];
      if (typeof address !== 'string') {
        return this.createValidationErrorResponse(`From address at index ${i} must be a string`, `fromAddress[${i}]`, address);
      }
      if (!BitcoinValidation.isValidAddress(address)) {
        return this.createValidationErrorResponse(`Invalid Bitcoin address format at index ${i}`, `fromAddress[${i}]`, address);
      }
    }

    if (!Array.isArray(args.to)) {
      return this.createValidationErrorResponse('To outputs must be an array', 'to', args.to);
    }

    if (args.to.length === 0) {
      return this.createValidationErrorResponse('At least one output is required', 'to', args.to);
    }

    for (let i = 0; i < args.to.length; i++) {
      const output = args.to[i];
      if (!output || typeof output !== 'object') {
        return this.createValidationErrorResponse(`Output at index ${i} must be an object`, `to[${i}]`, output);
      }

      if (!output.address || typeof output.address !== 'string') {
        return this.createValidationErrorResponse(`Output address at index ${i} is required and must be a string`, `to[${i}].address`, output.address);
      }

      if (!BitcoinValidation.isValidAddress(output.address)) {
        return this.createValidationErrorResponse(`Invalid Bitcoin address format at output index ${i}`, `to[${i}].address`, output.address);
      }

      if (typeof output.value !== 'number') {
        return this.createValidationErrorResponse(`Output value at index ${i} must be a number`, `to[${i}].value`, output.value);
      }

      if (!BitcoinValidation.isValidAmount(output.value)) {
        return this.createValidationErrorResponse(`Invalid amount at output index ${i} (must be between 0 and 21000000)`, `to[${i}].value`, output.value);
      }
    }

    if (args.fee !== undefined) {
      if (typeof args.fee !== 'string') {
        return this.createValidationErrorResponse('Fee must be a string', 'fee', args.fee);
      }
      if (!BitcoinValidation.isValidAmount(args.fee)) {
        return this.createValidationErrorResponse('Invalid fee amount', 'fee', args.fee);
      }
    }

    if (args.changeAddress !== undefined) {
      if (typeof args.changeAddress !== 'string') {
        return this.createValidationErrorResponse('Change address must be a string', 'changeAddress', args.changeAddress);
      }
      if (!BitcoinValidation.isValidAddress(args.changeAddress)) {
        return this.createValidationErrorResponse('Invalid change address format', 'changeAddress', args.changeAddress);
      }
    }

    return null;
  }

  private validateBroadcastTransactionArgs(args: BroadcastTransactionArgs): TatumApiResponse | null {
    if (!args) {
      return this.createValidationErrorResponse('Arguments are required', 'args', args);
    }

    if (!args.txData || typeof args.txData !== 'string' || args.txData.length === 0) {
      return this.createValidationErrorResponse('Transaction data cannot be empty', 'txData', args.txData);
    }

    if (!/^[a-fA-F0-9]+$/.test(args.txData)) {
      return this.createValidationErrorResponse('Transaction data must be a valid hex string', 'txData', args.txData);
    }

    return null;
  }

  private validateGetUtxoArgs(args: GetUtxoArgs): TatumApiResponse | null {
    if (!args) {
      return this.createValidationErrorResponse('Arguments are required', 'args', args);
    }

    if (!args.hash || typeof args.hash !== 'string') {
      return this.createValidationErrorResponse('Transaction hash is required and must be a string', 'hash', args.hash);
    }

    if (!BitcoinValidation.isValidTransactionHash(args.hash)) {
      return this.createValidationErrorResponse('Invalid transaction hash format (must be 64-character hex string)', 'hash', args.hash);
    }

    if (typeof args.index !== 'number') {
      return this.createValidationErrorResponse('Output index must be a number', 'index', args.index);
    }

    if (args.index < 0) {
      return this.createValidationErrorResponse('Output index must be 0 or greater', 'index', args.index);
    }

    return null;
  }

  private validateConnectRpcArgs(args: ConnectRpcArgs): TatumApiResponse | null {
    if (!args) {
      return this.createValidationErrorResponse('Arguments are required', 'args', args);
    }

    if (!args.nodeUrl || typeof args.nodeUrl !== 'string') {
      return this.createValidationErrorResponse('Node URL is required and must be a string', 'nodeUrl', args.nodeUrl);
    }

    if (args.nodeUrl.length === 0) {
      return this.createValidationErrorResponse('Node URL cannot be empty', 'nodeUrl', args.nodeUrl);
    }

    // Basic URL validation
    try {
      new URL(args.nodeUrl);
    } catch {
      return this.createValidationErrorResponse('Invalid node URL format', 'nodeUrl', args.nodeUrl);
    }

    if (args.username !== undefined && typeof args.username !== 'string') {
      return this.createValidationErrorResponse('Username must be a string', 'username', args.username);
    }

    if (args.password !== undefined && typeof args.password !== 'string') {
      return this.createValidationErrorResponse('Password must be a string', 'password', args.password);
    }

    return null;
  }
}