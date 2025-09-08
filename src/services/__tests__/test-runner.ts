/**
 * Test runner utility for Bitcoin service comprehensive test suite
 * This script provides utilities for running different types of tests
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';

interface TestSuiteConfig {
  name: string;
  pattern: string;
  description: string;
  environment?: Record<string, string>;
  timeout?: number;
}

const TEST_SUITES: TestSuiteConfig[] = [
  {
    name: 'unit',
    pattern: 'src/services/__tests__/bitcoin.*.unit.test.ts',
    description: 'Unit tests for Bitcoin service methods',
    timeout: 30000
  },
  {
    name: 'validation',
    pattern: 'src/services/__tests__/bitcoin.validation.test.ts',
    description: 'Input validation and error handling tests',
    timeout: 10000
  },
  {
    name: 'error-handling',
    pattern: 'src/services/__tests__/bitcoin.error-handling.test.ts',
    description: 'Comprehensive error handling tests',
    timeout: 30000
  },
  {
    name: 'mock-data',
    pattern: 'src/services/__tests__/bitcoin.mock-data.test.ts',
    description: 'Mock data validation and structure tests',
    timeout: 15000
  },
  {
    name: 'performance',
    pattern: 'src/services/__tests__/bitcoin.performance.test.ts',
    description: 'Performance and batch operation tests',
    timeout: 60000
  },
  {
    name: 'api-errors',
    pattern: 'src/services/__tests__/bitcoin.api-errors.test.ts',
    description: 'Real API error response handling tests',
    timeout: 30000
  },
  {
    name: 'e2e',
    pattern: 'src/services/__tests__/bitcoin.e2e.test.ts',
    description: 'End-to-end workflow tests',
    timeout: 45000
  },
  {
    name: 'integration',
    pattern: 'src/services/__tests__/bitcoin.integration.test.ts',
    description: 'Integration tests against Tatum API sandbox',
    environment: { INTEGRATION_TESTS: 'true' },
    timeout: 120000
  }
];

class TestRunner {
  private projectRoot: string;

  constructor() {
    this.projectRoot = this.findProjectRoot();
  }

  private findProjectRoot(): string {
    let currentDir = __dirname;
    while (currentDir !== path.dirname(currentDir)) {
      if (existsSync(path.join(currentDir, 'package.json'))) {
        return currentDir;
      }
      currentDir = path.dirname(currentDir);
    }
    throw new Error('Could not find project root (package.json not found)');
  }

  private runCommand(command: string, env?: Record<string, string>): void {
    const fullEnv = { ...process.env, ...env };
    
    console.log(`\n🚀 Running: ${command}`);
    if (env) {
      console.log(`📝 Environment: ${JSON.stringify(env)}`);
    }
    
    try {
      execSync(command, {
        cwd: this.projectRoot,
        stdio: 'inherit',
        env: fullEnv
      });
      console.log('✅ Command completed successfully');
    } catch (error) {
      console.error('❌ Command failed');
      throw error;
    }
  }

  public runSuite(suiteName: string): void {
    const suite = TEST_SUITES.find(s => s.name === suiteName);
    if (!suite) {
      throw new Error(`Test suite '${suiteName}' not found. Available suites: ${TEST_SUITES.map(s => s.name).join(', ')}`);
    }

    console.log(`\n📋 Running ${suite.name} test suite`);
    console.log(`📄 Description: ${suite.description}`);
    console.log(`⏱️  Timeout: ${suite.timeout}ms`);

    const command = `npx jest "${suite.pattern}" --testTimeout=${suite.timeout} --verbose`;
    this.runCommand(command, suite.environment);
  }

  public runAllSuites(skipIntegration = true): void {
    console.log('\n🎯 Running all Bitcoin service test suites');
    
    const suitesToRun = skipIntegration 
      ? TEST_SUITES.filter(s => s.name !== 'integration')
      : TEST_SUITES;

    if (skipIntegration) {
      console.log('⚠️  Skipping integration tests (use --include-integration to run them)');
    }

    let passed = 0;
    let failed = 0;

    for (const suite of suitesToRun) {
      try {
        this.runSuite(suite.name);
        passed++;
      } catch (error) {
        console.error(`❌ Test suite '${suite.name}' failed`);
        failed++;
      }
    }

    console.log('\n📊 Test Suite Summary:');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Total: ${passed + failed}`);

    if (failed > 0) {
      process.exit(1);
    }
  }

  public runCoverage(): void {
    console.log('\n📊 Running test coverage analysis');
    
    const command = `npx jest src/services/__tests__/bitcoin.*.test.ts --coverage --coverageDirectory=coverage/bitcoin --coverageReporters=text --coverageReporters=html --coverageReporters=lcov`;
    this.runCommand(command);
  }

  public runWatch(): void {
    console.log('\n👀 Running tests in watch mode');
    
    const command = `npx jest src/services/__tests__/bitcoin.*.test.ts --watch --verbose`;
    this.runCommand(command);
  }

  public listSuites(): void {
    console.log('\n📋 Available test suites:');
    TEST_SUITES.forEach(suite => {
      console.log(`\n🔹 ${suite.name}`);
      console.log(`   📄 ${suite.description}`);
      console.log(`   📁 ${suite.pattern}`);
      console.log(`   ⏱️  Timeout: ${suite.timeout}ms`);
      if (suite.environment) {
        console.log(`   🌍 Environment: ${JSON.stringify(suite.environment)}`);
      }
    });
  }

  public validateTestFiles(): void {
    console.log('\n🔍 Validating test files exist...');
    
    let allExist = true;
    
    for (const suite of TEST_SUITES) {
      // Convert glob pattern to actual file path for validation
      const filePath = suite.pattern.replace('src/services/__tests__/', '').replace('.ts', '.ts');
      const fullPath = path.join(this.projectRoot, 'src/services/__tests__', filePath);
      
      if (suite.pattern.includes('*')) {
        // For glob patterns, just check if the directory exists
        const dir = path.dirname(fullPath);
        if (existsSync(dir)) {
          console.log(`✅ Directory exists: ${dir}`);
        } else {
          console.log(`❌ Directory missing: ${dir}`);
          allExist = false;
        }
      } else {
        if (existsSync(fullPath)) {
          console.log(`✅ File exists: ${filePath}`);
        } else {
          console.log(`❌ File missing: ${filePath}`);
          allExist = false;
        }
      }
    }
    
    if (allExist) {
      console.log('\n✅ All test files are present');
    } else {
      console.log('\n❌ Some test files are missing');
      process.exit(1);
    }
  }
}

// CLI interface
if (require.main === module) {
  const runner = new TestRunner();
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    switch (command) {
      case 'suite':
        if (!args[1]) {
          console.error('❌ Please specify a test suite name');
          runner.listSuites();
          process.exit(1);
        }
        runner.runSuite(args[1]);
        break;

      case 'all':
        const includeIntegration = args.includes('--include-integration');
        runner.runAllSuites(!includeIntegration);
        break;

      case 'coverage':
        runner.runCoverage();
        break;

      case 'watch':
        runner.runWatch();
        break;

      case 'list':
        runner.listSuites();
        break;

      case 'validate':
        runner.validateTestFiles();
        break;

      default:
        console.log('\n🧪 Bitcoin Service Test Runner');
        console.log('\nUsage:');
        console.log('  npm run test:bitcoin:suite <suite-name>  - Run specific test suite');
        console.log('  npm run test:bitcoin:all                 - Run all test suites (skip integration)');
        console.log('  npm run test:bitcoin:all --include-integration - Run all test suites including integration');
        console.log('  npm run test:bitcoin:coverage           - Run tests with coverage');
        console.log('  npm run test:bitcoin:watch              - Run tests in watch mode');
        console.log('  npm run test:bitcoin:list               - List available test suites');
        console.log('  npm run test:bitcoin:validate           - Validate test files exist');
        console.log('\nAvailable test suites:');
        TEST_SUITES.forEach(suite => {
          console.log(`  - ${suite.name}: ${suite.description}`);
        });
        break;
    }
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

export { TestRunner, TEST_SUITES };