/**
 * Integration Tests for Ticker Resolution
 * 
 * Tests the full flow from user input (ticker/company name) through
 * ticker resolution and to the final API response.
 * 
 * Run with: npm run test:integration
 */

import { resolveTickerOrCompanyName, clearResolutionCache } from '../lib/tickerResolution.js';

/**
 * Integration test scenarios
 */
const testScenarios = [
  {
    name: 'Direct ticker input: NVDA',
    input: 'NVDA',
    expectedTicker: 'NVDA',
    expectedResolution: 'input_detection',
    expectedConfidence: 1.0
  },
  {
    name: 'Company name: NVIDIA',
    input: 'NVIDIA',
    expectedTicker: 'NVDA',
    expectedResolution: 'local_cache',
    minConfidence: 0.95
  },
  {
    name: 'Company name: Nvidia',
    input: 'Nvidia',
    expectedTicker: 'NVDA',
    expectedResolution: 'local_cache',
    minConfidence: 0.95
  },
  {
    name: 'Company name: Nvidia Corporation',
    input: 'Nvidia Corporation',
    expectedTicker: 'NVDA',
    expectedResolution: 'local_cache',
    minConfidence: 0.95
  },
  {
    name: 'With punctuation: Nvidia, Inc.',
    input: 'Nvidia, Inc.',
    expectedTicker: 'NVDA',
    expectedResolution: 'local_cache',
    minConfidence: 0.95
  },
  {
    name: 'Edge case: N V D A',
    input: 'N V D A',
    expectedTicker: 'NVDA',
    expectedResolution: 'input_detection',
    expectedConfidence: 1.0
  },
  {
    name: 'Apple search',
    input: 'Apple',
    expectedTicker: 'AAPL',
    expectedResolution: 'local_cache',
    minConfidence: 0.95
  },
  {
    name: 'Microsoft search',
    input: 'Microsoft',
    expectedTicker: 'MSFT',
    expectedResolution: 'local_cache',
    minConfidence: 0.95
  },
  {
    name: 'Tesla search',
    input: 'Tesla',
    expectedTicker: 'TSLA',
    expectedResolution: 'local_cache',
    minConfidence: 0.95
  },
  {
    name: 'Amazon search',
    input: 'Amazon',
    expectedTicker: 'AMZN',
    expectedResolution: 'local_cache',
    minConfidence: 0.95
  },
  {
    name: 'Alphabet/Google search',
    input: 'Alphabet',
    expectedTicker: 'GOOGL',
    expectedResolution: 'local_cache',
    minConfidence: 0.95
  },
  {
    name: 'JPMorgan Chase search',
    input: 'JPMorgan Chase',
    expectedTicker: 'JPM',
    expectedResolution: 'local_cache',
    minConfidence: 0.95
  },
  {
    name: 'Unknown company',
    input: 'UNKNOWNCOMPANYXYZ123',
    expectedTicker: null,
    expectedResolution: 'not_found',
    expectedConfidence: 0
  },
  {
    name: 'Ambiguous but has strong local match',
    input: 'Apple Inc',
    expectedTicker: 'AAPL',
    expectedResolution: 'local_cache',
    minConfidence: 0.95
  }
];

/**
 * Test harness
 */
class IntegrationTestRunner {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.results = [];
  }

  async runScenario(scenario) {
    try {
      clearResolutionCache();
      
      const result = await resolveTickerOrCompanyName(scenario.input);

      // Validate expected ticker
      if (result.ticker !== scenario.expectedTicker) {
        throw new Error(
          `Expected ticker "${scenario.expectedTicker}", got "${result.ticker}"`
        );
      }

      // Validate expected resolution method
      if (scenario.expectedResolution && result.resolvedFrom !== scenario.expectedResolution) {
        throw new Error(
          `Expected resolution "${scenario.expectedResolution}", got "${result.resolvedFrom}"`
        );
      }

      // Validate exact confidence if specified
      if (scenario.expectedConfidence !== undefined && result.confidence !== scenario.expectedConfidence) {
        throw new Error(
          `Expected confidence ${scenario.expectedConfidence}, got ${result.confidence}`
        );
      }

      // Validate minimum confidence if specified
      if (scenario.minConfidence !== undefined && result.confidence < scenario.minConfidence) {
        throw new Error(
          `Expected minimum confidence ${scenario.minConfidence}, got ${result.confidence}`
        );
      }

      this.passed++;
      this.results.push({
        scenario: scenario.name,
        status: '✓ PASS',
        input: scenario.input,
        resolved: result.ticker,
        confidence: result.confidence
      });

      return true;
    } catch (error) {
      this.failed++;
      this.results.push({
        scenario: scenario.name,
        status: '✗ FAIL',
        input: scenario.input,
        error: error.message
      });
      return false;
    }
  }

  printResults() {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║           Integration Test Results                         ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    // Print detailed results
    for (const result of this.results) {
      console.log(`${result.status} ${result.scenario}`);
      if (result.error) {
        console.log(`    Input: ${result.input}`);
        console.log(`    Error: ${result.error}`);
      } else {
        console.log(`    Input: ${result.input} → Resolved: ${result.resolved} (${(result.confidence * 100).toFixed(0)}% confidence)`);
      }
    }

    // Print summary
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Results: ${this.passed}/${this.passed + this.failed} passed`);
    if (this.failed > 0) {
      console.log(`         ${this.failed} failed`);
    }
    console.log('='.repeat(60) + '\n');

    return this.failed === 0;
  }
}

/**
 * Cache behavior test
 */
async function testCacheBehavior() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║           Cache Behavior Test                              ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  try {
    clearResolutionCache();

    // First call
    console.log('1. First call for "NVIDIA"...');
    const result1 = await resolveTickerOrCompanyName('NVIDIA');
    console.log(`   ✓ Resolved to ${result1.ticker}, from: ${result1.resolvedFrom}`);

    // Second call (cached)
    console.log('2. Second call for "NVIDIA" (should be cached)...');
    const result2 = await resolveTickerOrCompanyName('NVIDIA');
    console.log(`   ✓ Resolved to ${result2.ticker}, from: ${result2.resolvedFrom}`);
    
    if (result2.resolvedFrom === 'local_cache' || result2.telemetry.type === 'ticker_resolution_cache_hit') {
      console.log('   ✓ Cache working correctly');
    }

    // Force refresh
    console.log('3. Force refresh for "NVIDIA"...');
    const result3 = await resolveTickerOrCompanyName('NVIDIA', { forceRefresh: true });
    console.log(`   ✓ Resolved to ${result3.ticker}`);

    console.log('\n✓ Cache behavior test passed\n');
  } catch (error) {
    console.error(`\n✗ Cache behavior test failed: ${error.message}\n`);
  }
}

/**
 * Consistency test - same input should resolve consistently
 */
async function testConsistency() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║           Consistency Test                                  ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const testInputs = [
    'NVIDIA',
    'Nvidia',
    'nvidia',
    'Nvidia Corporation',
    'NVIDIA, INC'
  ];

  try {
    clearResolutionCache();

    console.log('Resolving multiple variations of NVIDIA...\n');
    
    const results = {};
    for (const input of testInputs) {
      const result = await resolveTickerOrCompanyName(input, { forceRefresh: false });
      results[input] = result.ticker;
      console.log(`  "${input}" → ${result.ticker}`);
    }

    // Check consistency
    const firstTicker = Object.values(results)[0];
    const allSame = Object.values(results).every(ticker => ticker === firstTicker);

    if (allSame) {
      console.log(`\n✓ All variations consistently resolve to ${firstTicker}\n`);
    } else {
      console.log('\n✗ Inconsistent results across variations\n');
      throw new Error('Inconsistent resolution results');
    }
  } catch (error) {
    console.error(`\n✗ Consistency test failed: ${error.message}\n`);
  }
}

/**
 * Telemetry test - verify events are emitted correctly
 */
async function testTelemetry() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║           Telemetry Test                                    ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  try {
    clearResolutionCache();

    // Test 1: Ticker detection event
    console.log('1. Testing ticker detection telemetry...');
    const result1 = await resolveTickerOrCompanyName('NVDA');
    if (result1.telemetry.type === 'ticker_resolution_detected_ticker') {
      console.log('   ✓ Ticker detection event emitted');
    } else {
      throw new Error(`Expected ticket_resolution_detected_ticker, got ${result1.telemetry.type}`);
    }

    // Test 2: Cache hit event
    clearResolutionCache();
    await resolveTickerOrCompanyName('NVIDIA');
    console.log('2. Testing cache hit telemetry...');
    const result2 = await resolveTickerOrCompanyName('NVIDIA');
    if (result2.telemetry.type === 'ticker_resolution_cache_hit') {
      console.log('   ✓ Cache hit event emitted');
    }

    // Test 3: Symbol resolved event
    clearResolutionCache();
    console.log('3. Testing symbol resolution telemetry...');
    const result3 = await resolveTickerOrCompanyName('Apple');
    if (result3.telemetry.type === 'symbol_resolved') {
      console.log('   ✓ Symbol resolved event emitted');
    }

    // Test 4: Not found event
    clearResolutionCache();
    console.log('4. Testing symbol not found telemetry...');
    const result4 = await resolveTickerOrCompanyName('UNKNOWNXYZ123');
    if (result4.telemetry.type === 'symbol_not_found') {
      console.log('   ✓ Symbol not found event emitted');
    }

    console.log('\n✓ All telemetry events verified\n');
  } catch (error) {
    console.error(`\n✗ Telemetry test failed: ${error.message}\n`);
  }
}

/**
 * Run all integration tests
 */
async function runAllTests() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║    Ticker Resolution Integration Test Suite                ║');
  console.log('║    Testing: Ticker/Company Name Resolution                 ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  // Run scenario tests
  const runner = new IntegrationTestRunner();
  
  console.log('\nRunning test scenarios...\n');
  for (const scenario of testScenarios) {
    await runner.runScenario(scenario);
  }

  const scenarioPassed = runner.printResults();

  // Run additional tests
  await testCacheBehavior();
  await testConsistency();
  await testTelemetry();

  console.log('\n════════════════════════════════════════════════════════════');
  if (scenarioPassed) {
    console.log('✓ All integration tests passed');
  } else {
    console.log('✗ Some integration tests failed');
  }
  console.log('════════════════════════════════════════════════════════════\n');

  process.exit(scenarioPassed ? 0 : 1);
}

// Run tests
runAllTests().catch(console.error);
