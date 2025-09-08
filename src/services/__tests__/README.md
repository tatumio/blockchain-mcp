# Bitcoin Service Comprehensive Test Suite

This directory contains a comprehensive test suite for the Bitcoin service implementation, covering all aspects of functionality, performance, and error handling as specified in task 12 of the implementation plan.

## Test Suite Overview

The test suite is organized into multiple specialized test files, each focusing on different aspects of the Bitcoin service:

### 1. Unit Tests (`bitcoin.*.unit.test.ts`)
- **Purpose**: Test individual methods and functions in isolation
- **Coverage**: All Bitcoin service methods with mocked dependencies
- **Focus**: Method behavior, parameter validation, return values
- **Files**: 
  - `bitcoin.wallet.unit.test.ts` - Wallet operations
  - `bitcoin.blockchain.unit.test.ts` - Blockchain information
  - `bitcoin.balance.unit.test.ts` - Balance operations
  - `bitcoin.transaction.unit.test.ts` - Transaction operations
  - `bitcoin.utxo.unit.test.ts` - UTXO and mempool operations

### 2. Integration Tests (`bitcoin.integration.test.ts`)
- **Purpose**: Test against Tatum API sandbox environment
- **Coverage**: Real API interactions with sandbox data
- **Focus**: API compatibility, response handling, network behavior
- **Environment**: Requires `INTEGRATION_TESTS=true` and valid API key
- **Timeout**: 120 seconds per test

### 3. Mock Data Tests (`bitcoin.mock-data.test.ts`)
- **Purpose**: Validate mock data structure and provide reusable test data
- **Coverage**: All Bitcoin operation response types
- **Focus**: Data structure validation, mock data consistency
- **Exports**: `MOCK_BITCOIN_DATA` for use in other tests

### 4. Performance Tests (`bitcoin.performance.test.ts`)
- **Purpose**: Test batch operations and performance characteristics
- **Coverage**: Batch operations, concurrent requests, memory usage
- **Focus**: Throughput, latency, resource utilization
- **Timeout**: 60 seconds per test

### 5. End-to-End Tests (`bitcoin.e2e.test.ts`)
- **Purpose**: Test complete Bitcoin workflows
- **Coverage**: Multi-step operations, workflow integration
- **Focus**: Real-world usage scenarios, workflow validation
- **Examples**: Wallet creation → Address generation → Balance checking

### 6. Error Handling Tests (`bitcoin.error-handling.test.ts`)
- **Purpose**: Test comprehensive error handling and validation
- **Coverage**: Input validation, retry logic, error transformation
- **Focus**: Error scenarios, validation rules, recovery mechanisms

### 7. API Error Tests (`bitcoin.api-errors.test.ts`)
- **Purpose**: Test handling of real API error responses
- **Coverage**: All possible API error scenarios
- **Focus**: Error response parsing, error code mapping, user-friendly messages

### 8. Validation Tests (`bitcoin.validation.test.ts`)
- **Purpose**: Test input validation and parameter checking
- **Coverage**: All input validation rules
- **Focus**: Address formats, parameter ranges, data types

## Running Tests

### Quick Start
```bash
# Run all tests (excluding integration)
npm run test:bitcoin:all

# Run specific test suite
npm run test:bitcoin:suite unit
npm run test:bitcoin:suite performance

# Run with coverage
npm run test:bitcoin:coverage

# Run in watch mode
npm run test:bitcoin:watch
```

### Available Commands

| Command | Description |
|---------|-------------|
| `npm run test:bitcoin` | Show help and available commands |
| `npm run test:bitcoin:all` | Run all test suites (skip integration) |
| `npm run test:bitcoin:all --include-integration` | Run all test suites including integration |
| `npm run test:bitcoin:suite <name>` | Run specific test suite |
| `npm run test:bitcoin:coverage` | Run tests with coverage report |
| `npm run test:bitcoin:watch` | Run tests in watch mode |
| `npm run test:bitcoin:list` | List all available test suites |
| `npm run test:bitcoin:validate` | Validate all test files exist |
| `npm run test:bitcoin:integration` | Run integration tests only |
| `npm run test:bitcoin:performance` | Run performance tests only |

### Test Suite Names

| Suite Name | File Pattern | Description |
|------------|--------------|-------------|
| `unit` | `bitcoin.*.unit.test.ts` | Unit tests for all methods |
| `validation` | `bitcoin.validation.test.ts` | Input validation tests |
| `error-handling` | `bitcoin.error-handling.test.ts` | Error handling tests |
| `mock-data` | `bitcoin.mock-data.test.ts` | Mock data validation |
| `performance` | `bitcoin.performance.test.ts` | Performance and batch tests |
| `api-errors` | `bitcoin.api-errors.test.ts` | API error handling |
| `e2e` | `bitcoin.e2e.test.ts` | End-to-end workflows |
| `integration` | `bitcoin.integration.test.ts` | Sandbox integration tests |

## Test Configuration

### Environment Variables

- `INTEGRATION_TESTS=true` - Enable integration tests
- `TATUM_API_KEY=<key>` - API key for integration tests (optional, uses test key by default)

### Timeouts

- Unit tests: 30 seconds
- Validation tests: 10 seconds
- Performance tests: 60 seconds
- Integration tests: 120 seconds
- E2E tests: 45 seconds

## Test Data and Mocking

### Mock Data Structure
The `MOCK_BITCOIN_DATA` object in `bitcoin.mock-data.test.ts` provides comprehensive mock data for all Bitcoin operations:

```typescript
export const MOCK_BITCOIN_DATA = {
  wallet: { mnemonic: '...', xpub: '...' },
  address: { address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa' },
  balance: { incoming: '50.00000000', outgoing: '0.00000000', balance: '50.00000000' },
  transaction: { hash: '...', inputs: [...], outputs: [...] },
  // ... more mock data
};
```

### API Client Mocking
All tests use Jest mocks for the `TatumApiClient`:

```typescript
jest.mock('../../api-client');
const MockedTatumApiClient = TatumApiClient as jest.MockedClass<typeof TatumApiClient>;
```

## Coverage Requirements

The test suite aims for comprehensive coverage:

- **Line Coverage**: >95%
- **Branch Coverage**: >90%
- **Function Coverage**: 100%
- **Statement Coverage**: >95%

### Coverage Reports
Coverage reports are generated in multiple formats:
- Console output (text)
- HTML report (`coverage/bitcoin/index.html`)
- LCOV format for CI integration

## Performance Benchmarks

### Expected Performance Metrics

| Operation | Expected Time | Batch Size | Throughput |
|-----------|---------------|------------|------------|
| Single balance check | <100ms | N/A | >100 ops/sec |
| Batch balance check | <1000ms | 100 addresses | >10 batches/sec |
| Transaction history | <500ms | 50 transactions | >20 ops/sec |
| Block information | <200ms | N/A | >50 ops/sec |

### Memory Usage
- Single operation: <1MB additional heap
- Batch operations: <10MB additional heap
- No memory leaks over 100+ operations

## Error Scenarios Tested

### Validation Errors
- Invalid Bitcoin addresses
- Out-of-range parameters
- Missing required fields
- Invalid data types

### Network Errors
- Connection timeouts
- DNS resolution failures
- SSL/TLS errors
- Connection refused

### API Errors
- Authentication failures
- Rate limiting
- Server errors (5xx)
- Resource not found (404)
- Malformed responses

### Bitcoin Network Errors
- Insufficient funds
- Transaction broadcast failures
- UTXO not found
- RPC connection errors

## Integration Test Setup

### Prerequisites
1. Valid Tatum API key (optional, uses test key by default)
2. Network connectivity to Tatum API
3. Set `INTEGRATION_TESTS=true` environment variable

### Sandbox Environment
Integration tests use Tatum's sandbox environment:
- Base URL: `https://api.tatum.io`
- Test data: Uses well-known Bitcoin addresses and transactions
- Rate limits: Respects sandbox rate limits

### Test Data
Integration tests use real Bitcoin blockchain data:
- Genesis block (height 0)
- Well-known addresses with transaction history
- Real transaction hashes and block hashes

## Continuous Integration

### CI Configuration
```yaml
# Example GitHub Actions configuration
- name: Run Bitcoin Tests
  run: |
    npm run test:bitcoin:validate
    npm run test:bitcoin:all
    npm run test:bitcoin:coverage

- name: Run Integration Tests
  env:
    INTEGRATION_TESTS: true
    TATUM_API_KEY: ${{ secrets.TATUM_API_KEY }}
  run: npm run test:bitcoin:integration
```

### Test Artifacts
- Coverage reports
- Performance metrics
- Test results (JUnit XML)
- Error logs

## Troubleshooting

### Common Issues

1. **Integration tests failing**
   - Check `INTEGRATION_TESTS=true` is set
   - Verify network connectivity
   - Check API key validity

2. **Performance tests timing out**
   - Increase timeout with `--testTimeout=<ms>`
   - Check system resources
   - Run with `--runInBand` for sequential execution

3. **Mock data validation errors**
   - Update mock data to match current API responses
   - Check data structure consistency
   - Verify type definitions

### Debug Mode
```bash
# Run with verbose output
npm run test:bitcoin:suite unit -- --verbose

# Run single test file
npx jest src/services/__tests__/bitcoin.unit.test.ts --verbose

# Debug specific test
npx jest src/services/__tests__/bitcoin.unit.test.ts -t "should generate wallet"
```

## Contributing

### Adding New Tests
1. Follow existing naming conventions
2. Use appropriate test suite file
3. Include comprehensive error scenarios
4. Add performance considerations
5. Update mock data if needed

### Test Structure
```typescript
describe('Feature Group', () => {
  describe('Specific Functionality', () => {
    it('should handle normal case', () => {
      // Test implementation
    });

    it('should handle error case', () => {
      // Error test implementation
    });

    it('should validate input parameters', () => {
      // Validation test implementation
    });
  });
});
```

### Best Practices
- Use descriptive test names
- Test both success and failure paths
- Include edge cases and boundary conditions
- Mock external dependencies
- Use realistic test data
- Verify error messages and codes
- Test async operations properly
- Clean up resources in `afterEach`

## Requirements Mapping

This test suite fulfills the requirements specified in task 12:

### ✅ Write integration tests against Tatum API sandbox environment
- `bitcoin.integration.test.ts` - Full integration test suite
- Real API calls with sandbox environment
- Comprehensive workflow testing

### ✅ Create mock data for all Bitcoin operations and responses
- `bitcoin.mock-data.test.ts` - Complete mock data definitions
- Structured mock data for all operations
- Data validation and consistency checks

### ✅ Implement performance tests for batch operations
- `bitcoin.performance.test.ts` - Comprehensive performance testing
- Batch operation benchmarks
- Memory usage and throughput testing
- Concurrent request handling

### ✅ Add end-to-end tests for complete Bitcoin workflows
- `bitcoin.e2e.test.ts` - Complete workflow testing
- Multi-step operation validation
- Real-world usage scenarios

### ✅ Test error handling with real API error responses
- `bitcoin.api-errors.test.ts` - Real API error scenarios
- `bitcoin.error-handling.test.ts` - Comprehensive error handling
- All error codes and scenarios covered

### ✅ Requirements 7.1, 7.2, 7.3, 7.4 Coverage
- **7.1**: Structured error responses with HTTP status codes ✅
- **7.2**: Input validation and validation errors ✅
- **7.3**: Network timeout handling with retry logic ✅
- **7.4**: Rate limit error handling with retry information ✅