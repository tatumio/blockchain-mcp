import { BitcoinService } from '../bitcoin';
import { TatumApiClient } from '../../api-client';
import { ToolExecutionContext } from '../../types';

// Create a mock for TatumApiClient
const mockExecuteRequest = jest.fn();
jest.mock('../../api-client', () => {
  return {
    TatumApiClient: jest.fn().mockImplementation(() => ({
      executeRequest: mockExecuteRequest
    }))
  };
});

describe('BitcoinService - Balance Operations Unit Tests', () => {
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

  describe('getBalance', () => {
    it('should call the correct API endpoint with valid address', async () => {
      // Arrange
      const args = {
        address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'
      };
      const mockResponse = {
        data: {
          incoming: '0.00000000',
          outgoing: '0.00000000',
          balance: '0.00000000'
        },
        status: 200,
        statusText: 'OK'
      };
      mockExecuteRequest.mockResolvedValue(mockResponse);

      // Act
      const result = await bitcoinService.getBalance(args);

      // Assert
      expect(mockExecuteRequest).toHaveBeenCalledWith('GET', '/v3/bitcoin/address/balance/{address}', {
        address: args.address
      });
      expect(result).toEqual(mockResponse);
    });  
  it('should return validation error for invalid address format', async () => {
      // Arrange
      const args = {
        address: 'invalid-address'
      };

      // Act
      const result = await bitcoinService.getBalance(args);

      // Assert
      expect(mockExecuteRequest).not.toHaveBeenCalled();
      expect(result.error).toBe('Invalid arguments for getBalance');
      expect(result.status).toBe(400);
      expect(result.statusText).toBe('Bad Request');
    });

    it('should return validation error for empty address', async () => {
      // Arrange
      const args = {
        address: ''
      };

      // Act
      const result = await bitcoinService.getBalance(args);

      // Assert
      expect(mockExecuteRequest).not.toHaveBeenCalled();
      expect(result.error).toBe('Invalid arguments for getBalance');
      expect(result.status).toBe(400);
    });

    it('should return validation error for null arguments', async () => {
      // Act
      const result = await bitcoinService.getBalance(null as any);

      // Assert
      expect(mockExecuteRequest).not.toHaveBeenCalled();
      expect(result.error).toBe('Invalid arguments for getBalance');
      expect(result.status).toBe(400);
    });

    it('should handle P2SH addresses correctly', async () => {
      // Arrange
      const args = {
        address: '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy'
      };
      const mockResponse = {
        data: {
          incoming: '1.50000000',
          outgoing: '0.75000000',
          balance: '0.75000000'
        },
        status: 200,
        statusText: 'OK'
      };
      mockExecuteRequest.mockResolvedValue(mockResponse);

      // Act
      const result = await bitcoinService.getBalance(args);

      // Assert
      expect(mockExecuteRequest).toHaveBeenCalledWith('GET', '/v3/bitcoin/address/balance/{address}', {
        address: args.address
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle Bech32 addresses correctly', async () => {
      // Arrange
      const args = {
        address: 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4'
      };
      const mockResponse = {
        data: {
          incoming: '2.00000000',
          outgoing: '1.00000000',
          balance: '1.00000000'
        },
        status: 200,
        statusText: 'OK'
      };
      mockExecuteRequest.mockResolvedValue(mockResponse);

      // Act
      const result = await bitcoinService.getBalance(args);

      // Assert
      expect(mockExecuteRequest).toHaveBeenCalledWith('GET', '/v3/bitcoin/address/balance/{address}', {
        address: args.address
      });
      expect(result).toEqual(mockResponse);
    });
  }); 
 describe('getMultipleBalances', () => {
    it('should call the correct API endpoint with valid addresses', async () => {
      // Arrange
      const args = {
        addresses: [
          '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
          '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy',
          'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4'
        ]
      };
      const mockResponse = {
        data: {
          '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa': {
            incoming: '0.00000000',
            outgoing: '0.00000000',
            balance: '0.00000000'
          },
          '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy': {
            incoming: '1.50000000',
            outgoing: '0.75000000',
            balance: '0.75000000'
          },
          'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4': {
            incoming: '2.00000000',
            outgoing: '1.00000000',
            balance: '1.00000000'
          }
        },
        status: 200,
        statusText: 'OK'
      };
      mockExecuteRequest.mockResolvedValue(mockResponse);

      // Act
      const result = await bitcoinService.getMultipleBalances(args);

      // Assert
      expect(mockExecuteRequest).toHaveBeenCalledWith('POST', '/v3/bitcoin/address/balance/batch', {
        addresses: args.addresses
      });
      expect(result).toEqual(mockResponse);
    });

    it('should return validation error for empty addresses array', async () => {
      // Arrange
      const args = {
        addresses: []
      };

      // Act
      const result = await bitcoinService.getMultipleBalances(args);

      // Assert
      expect(mockExecuteRequest).not.toHaveBeenCalled();
      expect(result.error).toBe('Invalid arguments for getMultipleBalances');
      expect(result.status).toBe(400);
    });

    it('should return validation error for too many addresses', async () => {
      // Arrange - Create array with 101 addresses (exceeds limit of 100)
      const addresses = Array(101).fill('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa');
      const args = { addresses };

      // Act
      const result = await bitcoinService.getMultipleBalances(args);

      // Assert
      expect(mockExecuteRequest).not.toHaveBeenCalled();
      expect(result.error).toBe('Invalid arguments for getMultipleBalances');
      expect(result.status).toBe(400);
    });

    it('should return validation error for invalid address in array', async () => {
      // Arrange
      const args = {
        addresses: [
          '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
          'invalid-address',
          'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4'
        ]
      };

      // Act
      const result = await bitcoinService.getMultipleBalances(args);

      // Assert
      expect(mockExecuteRequest).not.toHaveBeenCalled();
      expect(result.error).toBe('Invalid arguments for getMultipleBalances');
      expect(result.status).toBe(400);
    });

    it('should return validation error for null arguments', async () => {
      // Act
      const result = await bitcoinService.getMultipleBalances(null as any);

      // Assert
      expect(mockExecuteRequest).not.toHaveBeenCalled();
      expect(result.error).toBe('Invalid arguments for getMultipleBalances');
      expect(result.status).toBe(400);
    });

    it('should handle single address in array', async () => {
      // Arrange
      const args = {
        addresses: ['1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa']
      };
      const mockResponse = {
        data: {
          '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa': {
            incoming: '5.00000000',
            outgoing: '2.50000000',
            balance: '2.50000000'
          }
        },
        status: 200,
        statusText: 'OK'
      };
      mockExecuteRequest.mockResolvedValue(mockResponse);

      // Act
      const result = await bitcoinService.getMultipleBalances(args);

      // Assert
      expect(mockExecuteRequest).toHaveBeenCalledWith('POST', '/v3/bitcoin/address/balance/batch', {
        addresses: args.addresses
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle maximum allowed addresses (100)', async () => {
      // Arrange - Create array with exactly 100 valid addresses
      const addresses = Array(100).fill('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa');
      const args = { addresses };
      const mockResponse = {
        data: {},
        status: 200,
        statusText: 'OK'
      };
      mockExecuteRequest.mockResolvedValue(mockResponse);

      // Act
      const result = await bitcoinService.getMultipleBalances(args);

      // Assert
      expect(mockExecuteRequest).toHaveBeenCalledWith('POST', '/v3/bitcoin/address/balance/batch', {
        addresses: args.addresses
      });
      expect(result).toEqual(mockResponse);
    });
  }); 
 describe('Balance Operations Error Scenarios', () => {
    it('should handle API errors gracefully for getBalance', async () => {
      // Arrange
      const args = {
        address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'
      };
      const mockErrorResponse = {
        error: 'Address not found',
        status: 404,
        statusText: 'Not Found'
      };
      mockExecuteRequest.mockResolvedValue(mockErrorResponse);

      // Act
      const result = await bitcoinService.getBalance(args);

      // Assert
      expect(mockExecuteRequest).toHaveBeenCalledWith('GET', '/v3/bitcoin/address/balance/{address}', {
        address: args.address
      });
      expect(result).toEqual(mockErrorResponse);
    });

    it('should handle API errors gracefully for getMultipleBalances', async () => {
      // Arrange
      const args = {
        addresses: ['1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa']
      };
      const mockErrorResponse = {
        error: 'Rate limit exceeded',
        status: 429,
        statusText: 'Too Many Requests'
      };
      mockExecuteRequest.mockResolvedValue(mockErrorResponse);

      // Act
      const result = await bitcoinService.getMultipleBalances(args);

      // Assert
      expect(mockExecuteRequest).toHaveBeenCalledWith('POST', '/v3/bitcoin/address/balance/batch', {
        addresses: args.addresses
      });
      expect(result).toEqual(mockErrorResponse);
    });

    it('should handle network timeout errors', async () => {
      // Arrange
      const args = {
        address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'
      };
      const mockTimeoutResponse = {
        error: 'Request timeout',
        status: 408,
        statusText: 'Request Timeout'
      };
      mockExecuteRequest.mockResolvedValue(mockTimeoutResponse);

      // Act
      const result = await bitcoinService.getBalance(args);

      // Assert
      expect(result).toEqual(mockTimeoutResponse);
    });

    it('should handle server errors', async () => {
      // Arrange
      const args = {
        addresses: ['1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa']
      };
      const mockServerErrorResponse = {
        error: 'Internal server error',
        status: 500,
        statusText: 'Internal Server Error'
      };
      mockExecuteRequest.mockResolvedValue(mockServerErrorResponse);

      // Act
      const result = await bitcoinService.getMultipleBalances(args);

      // Assert
      expect(result).toEqual(mockServerErrorResponse);
    });
  });

  describe('Address Format Validation', () => {
    const testCases = [
      {
        description: 'P2PKH addresses',
        validAddresses: [
          '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
          '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2'
        ]
      },
      {
        description: 'P2SH addresses',
        validAddresses: [
          '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy',
          '3QJmV3qfvL9SuYo34YihAf3sRCW3qSinyC'
        ]
      },
      {
        description: 'Bech32 addresses',
        validAddresses: [
          'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
          'bc1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3qccfmv3'
        ]
      }
    ];

    testCases.forEach(({ description, validAddresses }) => {
      it(`should accept valid ${description}`, async () => {
        mockExecuteRequest.mockResolvedValue({
          data: { balance: '0.00000000' },
          status: 200,
          statusText: 'OK'
        });

        for (const address of validAddresses) {
          const result = await bitcoinService.getBalance({ address });
          expect(result.status).toBe(200);
        }
      });
    });

    // Note: Individual validation tests are covered in other test cases above
    // The validation logic is tested in bitcoin.validation.test.ts
  });
});