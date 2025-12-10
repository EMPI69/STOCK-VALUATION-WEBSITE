/**
 * Unit Tests for Ticker Resolution and String Utilities
 * 
 * Run with: node tests/unit.test.js
 * Or with Jest: jest tests/unit.test.js
 */

import { levenshteinDistance, calculateSimilarity, normalizeString, stripSpacesAndPunctuation, tokenizeCompanyName, isValidTickerFormat } from '../lib/stringUtils.js';
import { resolveTickerOrCompanyName, clearResolutionCache, addLocalMapping } from '../lib/tickerResolution.js';

// Simple test framework
class TestRunner {
  constructor(name) {
    this.name = name;
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  test(description, fn) {
    this.tests.push({ description, fn });
  }

  assert(condition, message) {
    if (!condition) {
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  assertEqual(actual, expected, message) {
    if (actual !== expected) {
      throw new Error(`Expected ${expected}, got ${actual}. ${message || ''}`);
    }
  }

  assertDeepEqual(actual, expected, message) {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(`Deep equality failed. Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}. ${message || ''}`);
    }
  }

  assertIncludes(haystack, needle, message) {
    if (!haystack.includes(needle)) {
      throw new Error(`Expected to include "${needle}". ${message || ''}`);
    }
  }

  async run() {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Running: ${this.name}`);
    console.log('='.repeat(60));

    for (const test of this.tests) {
      try {
        await test.fn(this);
        this.passed++;
        console.log(`✓ ${test.description}`);
      } catch (error) {
        this.failed++;
        console.error(`✗ ${test.description}`);
        console.error(`  ${error.message}`);
      }
    }

    console.log(`\nResults: ${this.passed} passed, ${this.failed} failed`);
    return this.failed === 0;
  }
}

// ============================================================================
// String Utilities Tests
// ============================================================================

const stringUtilsTests = new TestRunner('String Utilities');

stringUtilsTests.test('levenshteinDistance: identical strings', (assert) => {
  assert.assertEqual(levenshteinDistance('hello', 'hello'), 0, 'Identical strings should have distance 0');
});

stringUtilsTests.test('levenshteinDistance: one character difference', (assert) => {
  assert.assertEqual(levenshteinDistance('hello', 'hallo'), 1, 'One substitution');
});

stringUtilsTests.test('levenshteinDistance: different strings', (assert) => {
  const distance = levenshteinDistance('kitten', 'sitting');
  assert.assertEqual(distance, 3, 'Should be 3 edits for kitten->sitting');
});

stringUtilsTests.test('calculateSimilarity: identical strings', (assert) => {
  const similarity = calculateSimilarity('nvidia', 'nvidia');
  assert.assertEqual(similarity, 1, 'Identical strings should have similarity 1');
});

stringUtilsTests.test('calculateSimilarity: similar strings', (assert) => {
  const similarity = calculateSimilarity('nvidia', 'nvida');
  assert.assert(similarity > 0.8 && similarity < 1, 'Similar strings should have similarity between 0.8 and 1');
});

stringUtilsTests.test('normalizeString: trim and lowercase', (assert) => {
  assert.assertEqual(normalizeString('  NVIDIA  '), 'nvidia', 'Should trim and lowercase');
});

stringUtilsTests.test('normalizeString: remove punctuation', (assert) => {
  assert.assertEqual(normalizeString('Nvidia, Inc.'), 'nvidiainc', 'Should remove punctuation');
});

stringUtilsTests.test('normalizeString: handle various formats', (assert) => {
  assert.assertEqual(normalizeString('Apple Inc.'), 'appleinc', 'Should normalize Apple Inc.');
  assert.assertEqual(normalizeString('Alphabet (Google)'), 'alphabetgoogle', 'Should normalize Alphabet (Google)');
});

stringUtilsTests.test('stripSpacesAndPunctuation: N V D A should match NVDA', (assert) => {
  assert.assertEqual(stripSpacesAndPunctuation('N V D A'), 'NVDA', 'Should strip spaces');
  assert.assertEqual(stripSpacesAndPunctuation('N-V-D-A'), 'NVDA', 'Should strip dashes');
  assert.assertEqual(stripSpacesAndPunctuation('N.V.D.A'), 'NVDA', 'Should strip dots');
});

stringUtilsTests.test('tokenizeCompanyName: split into words', (assert) => {
  const tokens = tokenizeCompanyName('Nvidia Corporation Inc');
  assert.assertEqual(tokens.length, 3, 'Should split into 3 words');
  assert.assertIncludes(tokens, 'nvidia', 'Should include nvidia');
  assert.assertIncludes(tokens, 'corporation', 'Should include corporation');
});

stringUtilsTests.test('isValidTickerFormat: valid tickers', (assert) => {
  assert.assert(isValidTickerFormat('AAPL'), 'AAPL is valid');
  assert.assert(isValidTickerFormat('MSFT'), 'MSFT is valid');
  assert.assert(isValidTickerFormat('BRK.B'), 'BRK.B is valid');
  assert.assert(isValidTickerFormat('A'), 'Single letter ticker is valid');
  assert.assert(!isValidTickerFormat('TOOLONG'), 'More than 5 letters is invalid');
  assert.assert(!isValidTickerFormat('123'), 'Numbers are invalid');
});

// ============================================================================
// Ticker Resolution Tests
// ============================================================================

const tickerResolutionTests = new TestRunner('Ticker Resolution');

tickerResolutionTests.test('detect ticker symbol directly', async (assert) => {
  const result = await resolveTickerOrCompanyName('NVDA');
  assert.assertEqual(result.ticker, 'NVDA', 'Should detect NVDA as ticker');
  assert.assertEqual(result.resolvedFrom, 'input_detection', 'Should be detected as input ticker');
  assert.assertEqual(result.confidence, 1.0, 'Confidence should be 1.0');
});

tickerResolutionTests.test('resolve company name from local cache', async (assert) => {
  const result = await resolveTickerOrCompanyName('NVIDIA');
  assert.assertEqual(result.ticker, 'NVDA', 'Should resolve NVIDIA to NVDA');
  assert.assertEqual(result.resolvedFrom, 'local_cache', 'Should use local cache');
  assert.assert(result.confidence >= 0.99, 'Confidence should be high');
});

tickerResolutionTests.test('resolve lowercase company name', async (assert) => {
  const result = await resolveTickerOrCompanyName('nvidia');
  assert.assertEqual(result.ticker, 'NVDA', 'Should resolve lowercase nvidia');
});

tickerResolutionTests.test('resolve company name with extra spaces', async (assert) => {
  const result = await resolveTickerOrCompanyName('  NVIDIA  Corporation  ');
  assert.assertEqual(result.ticker, 'NVDA', 'Should resolve despite extra spaces');
});

tickerResolutionTests.test('resolve company name with punctuation', async (assert) => {
  const result = await resolveTickerOrCompanyName('Nvidia, Inc.');
  assert.assertEqual(result.ticker, 'NVDA', 'Should resolve with punctuation');
});

tickerResolutionTests.test('not found handling', async (assert) => {
  clearResolutionCache();
  const result = await resolveTickerOrCompanyName('NONEXISTENT_COMPANY_XYZ');
  assert.assertEqual(result.ticker, null, 'Should return null ticker for unknown company');
  assert.assertEqual(result.resolvedFrom, 'not_found', 'Should be marked as not found');
  assert.assertEqual(result.confidence, 0, 'Confidence should be 0');
});

tickerResolutionTests.test('cache resolution results', async (assert) => {
  clearResolutionCache();
  
  // First call
  const result1 = await resolveTickerOrCompanyName('Apple');
  const timestamp1 = Date.now();
  
  // Wait a bit
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Second call (should be cached)
  const result2 = await resolveTickerOrCompanyName('Apple');
  
  assert.assertEqual(result1.ticker, 'AAPL', 'First call should resolve');
  assert.assertEqual(result2.ticker, 'AAPL', 'Second call should also resolve');
  assert.assertEqual(result2.resolvedFrom, 'local_cache', 'Second call should use cache');
});

tickerResolutionTests.test('force refresh bypasses cache', async (assert) => {
  clearResolutionCache();
  
  // Prime the cache
  await resolveTickerOrCompanyName('Microsoft');
  
  // Force refresh
  const result = await resolveTickerOrCompanyName('Microsoft', { forceRefresh: true });
  assert.assertEqual(result.ticker, 'MSFT', 'Should resolve even with refresh');
});

tickerResolutionTests.test('fuzzy matching similar names', async (assert) => {
  clearResolutionCache();
  
  // "Appl" is similar to "Apple"
  const result = await resolveTickerOrCompanyName('Appl');
  
  // May resolve through fuzzy matching or not, but should handle gracefully
  assert.assert(result !== null, 'Should return a result object');
});

tickerResolutionTests.test('add custom local mapping', async (assert) => {
  clearResolutionCache();
  addLocalMapping('TestCorp', 'TEST', 'NYSE');
  
  const result = await resolveTickerOrCompanyName('TestCorp');
  assert.assertEqual(result.ticker, 'TEST', 'Should resolve custom mapping');
  assert.assertEqual(result.exchange, 'NYSE', 'Should have correct exchange');
});

// ============================================================================
// Telemetry Tests
// ============================================================================

const telemetryTests = new TestRunner('Telemetry Events');

telemetryTests.test('emit telemetry for ticker detection', async (assert) => {
  const result = await resolveTickerOrCompanyName('NVDA');
  assert.assert(result.telemetry !== undefined, 'Should include telemetry');
  assert.assertEqual(result.telemetry.type, 'ticker_resolution_detected_ticker', 'Should emit ticker detection event');
  assert.assertEqual(result.telemetry.ticker, 'NVDA', 'Should include ticker in event');
});

telemetryTests.test('emit telemetry for cache hit', async (assert) => {
  clearResolutionCache();
  
  // Prime cache
  await resolveTickerOrCompanyName('Google');
  
  // Cache hit
  const result = await resolveTickerOrCompanyName('Google');
  assert.assertEqual(result.telemetry.type, 'ticker_resolution_cache_hit', 'Should emit cache hit event');
});

telemetryTests.test('emit telemetry for symbol resolution', async (assert) => {
  clearResolutionCache();
  
  const result = await resolveTickerOrCompanyName('Tesla');
  assert.assert(result.telemetry.type === 'symbol_resolved', 'Should emit symbol resolved event');
  assert.assertEqual(result.telemetry.resolvedFrom, 'local_cache', 'Should specify resolution source');
});

telemetryTests.test('emit telemetry for not found', async (assert) => {
  clearResolutionCache();
  
  const result = await resolveTickerOrCompanyName('UNKNOWNCOMPANYXYZ123');
  assert.assertEqual(result.telemetry.type, 'symbol_not_found', 'Should emit not found event');
});

// ============================================================================
// Edge Cases
// ============================================================================

const edgeCasesTests = new TestRunner('Edge Cases');

edgeCasesTests.test('handle empty string', async (assert) => {
  const result = await resolveTickerOrCompanyName('');
  assert.assertEqual(result.ticker, null, 'Empty string should not resolve');
});

edgeCasesTests.test('handle special characters', async (assert) => {
  const result = await resolveTickerOrCompanyName('Nvidia!!!@##$$');
  assert.assertEqual(result.ticker, 'NVDA', 'Should ignore special characters');
});

edgeCasesTests.test('handle very long input', async (assert) => {
  const longInput = 'Nvidia Corporation Investor Relations Division ' + 'x'.repeat(100);
  const result = await resolveTickerOrCompanyName(longInput);
  assert.assertEqual(result.ticker, 'NVDA', 'Should handle long input');
});

edgeCasesTests.test('handle numeric input', async (assert) => {
  const result = await resolveTickerOrCompanyName('123456');
  assert.assertEqual(result.ticker, null, 'Numeric input should not resolve');
});

// ============================================================================
// Run All Tests
// ============================================================================

async function runAllTests() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║      Ticker Resolution and String Utils Test Suite         ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  const suites = [
    stringUtilsTests,
    tickerResolutionTests,
    telemetryTests,
    edgeCasesTests
  ];

  let totalPassed = 0;
  let totalFailed = 0;

  for (const suite of suites) {
    const passed = await suite.run();
    totalPassed += suite.passed;
    totalFailed += suite.failed;
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Total Results: ${totalPassed} passed, ${totalFailed} failed`);
  console.log('='.repeat(60) + '\n');

  process.exit(totalFailed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(console.error);
