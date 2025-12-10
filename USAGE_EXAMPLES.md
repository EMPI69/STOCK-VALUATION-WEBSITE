#!/usr/bin/env node

/**
 * Usage Examples for Automatic Ticker Resolution
 * 
 * This file demonstrates real-world usage patterns
 * Run sections individually or source into Node.js
 */

console.log(`
╔════════════════════════════════════════════════════════════╗
║   Automatic Ticker Resolution - Usage Examples             ║
║   Stock Valuation Website                                  ║
╚════════════════════════════════════════════════════════════╝
`);

// ============================================================================
// EXAMPLE 1: Basic Ticker Resolution
// ============================================================================

console.log(`
═══════════════════════════════════════════════════════════════
EXAMPLE 1: Basic Ticker Resolution
═══════════════════════════════════════════════════════════════

The system automatically resolves company names to ticker symbols.
`);

const examples1 = [
  { input: 'NVDA', expected: 'NVDA' },
  { input: 'NVIDIA', expected: 'NVDA' },
  { input: 'Nvidia Corporation', expected: 'NVDA' },
  { input: 'nvidia', expected: 'NVDA' },
  { input: 'N V D A', expected: 'NVDA' },
];

console.log('Test Cases:');
examples1.forEach((ex, i) => {
  console.log(`  ${i + 1}. Input: "${ex.input}" → Expected: "${ex.expected}"`);
});

console.log(`
curl Examples:
  # Company name
  curl "http://localhost:3000/api/valuation?ticker=nvidia"
  
  # Ticker symbol
  curl "http://localhost:3000/api/valuation?ticker=NVDA"
  
  # With punctuation
  curl "http://localhost:3000/api/valuation?ticker=Nvidia,%20Inc."
`);

// ============================================================================
// EXAMPLE 2: Supported Companies
// ============================================================================

console.log(`
═══════════════════════════════════════════════════════════════
EXAMPLE 2: Pre-loaded Company Database
═══════════════════════════════════════════════════════════════

The system includes a pre-loaded database of popular companies.
Additional companies can be found via external APIs or fuzzy matching.
`);

const companies = [
  { name: 'Apple', ticker: 'AAPL', exchange: 'NASDAQ' },
  { name: 'Microsoft', ticker: 'MSFT', exchange: 'NASDAQ' },
  { name: 'NVIDIA', ticker: 'NVDA', exchange: 'NASDAQ' },
  { name: 'Google/Alphabet', ticker: 'GOOGL', exchange: 'NASDAQ' },
  { name: 'Tesla', ticker: 'TSLA', exchange: 'NASDAQ' },
  { name: 'Amazon', ticker: 'AMZN', exchange: 'NASDAQ' },
  { name: 'Meta (Facebook)', ticker: 'META', exchange: 'NASDAQ' },
  { name: 'JPMorgan Chase', ticker: 'JPM', exchange: 'NYSE' },
  { name: 'Berkshire Hathaway', ticker: 'BRK.B', exchange: 'NYSE' },
  { name: 'Visa', ticker: 'V', exchange: 'NYSE' },
];

console.log('Supported Companies:');
companies.forEach((c, i) => {
  console.log(`  ${i + 1}. ${c.name.padEnd(25)} ${c.ticker.padEnd(10)} ${c.exchange}`);
});

console.log(`
Test all:
  for company in Apple Microsoft NVIDIA Google Tesla Amazon Meta JPMorgan Berkshire Visa; do
    curl "http://localhost:3000/api/ticker-resolution?query=$company"
  done
`);

// ============================================================================
// EXAMPLE 3: API Response Structure
// ============================================================================

console.log(`
═══════════════════════════════════════════════════════════════
EXAMPLE 3: Understanding API Responses
═══════════════════════════════════════════════════════════════

Each response includes resolution metadata along with valuation data.
`);

const responseExample = {
  ticker: 'NVDA',
  companyName: 'NVIDIA',
  resolution: {
    input: 'NVIDIA',
    resolvedTicker: 'NVDA',
    resolvedFrom: 'local_cache',
    confidence: 0.99,
    exchange: 'NASDAQ'
  },
  telemetry: {
    type: 'symbol_resolved',
    ticker: 'NVDA',
    confidence: 0.99,
    resolvedFrom: 'local_cache',
    timestamp: '2025-12-08T10:30:45.123Z'
  },
  'metrics': '{ /* valuation metrics */ }',
  'overall': '{ verdict, confidence, reasoning }'
};

console.log(JSON.stringify(responseExample, null, 2));

// ============================================================================
// EXAMPLE 4: Error Handling
// ============================================================================

console.log(`
═══════════════════════════════════════════════════════════════
EXAMPLE 4: Error Handling & Edge Cases
═══════════════════════════════════════════════════════════════

The system gracefully handles various error scenarios.
`);

const errorScenarios = [
  {
    case: 'Unknown company',
    input: 'UNKNOWNCOMPANYXYZ',
    response: 'ticker_not_found',
    action: 'Suggest alternatives or request clarification'
  },
  {
    case: 'Ambiguous match',
    input: 'Apple (could be AAPL or other)',
    response: 'ambiguous_ticker with candidates list',
    action: 'Show list of options, ask for clarification'
  },
  {
    case: 'API rate limit',
    input: 'Any (external API limit reached)',
    response: 'Falls back to local cache',
    action: 'Uses cached data, no user impact'
  },
  {
    case: 'Special characters',
    input: 'Nvidia!!!@##$$',
    response: 'Normalized and resolved',
    action: 'Special characters removed, resolution proceeds'
  }
];

console.log('Error Scenarios:');
errorScenarios.forEach((s, i) => {
  console.log(`\n  ${i + 1}. ${s.case}`);
  console.log(`     Input: ${s.input}`);
  console.log(`     Response: ${s.response}`);
  console.log(`     Action: ${s.action}`);
});

// ============================================================================
// EXAMPLE 5: Advanced Usage
// ============================================================================

console.log(`
═══════════════════════════════════════════════════════════════
EXAMPLE 5: Advanced Usage Options
═══════════════════════════════════════════════════════════════

The API supports several optional parameters for fine-tuning.
`);

const advancedExamples = [
  {
    title: 'Filter by Exchange',
    url: '/api/valuation?ticker=apple&exchange=NASDAQ',
    purpose: 'Prefer specific exchange when multiple exist'
  },
  {
    title: 'Force Cache Refresh',
    url: '/api/valuation?ticker=nvidia&refresh=true',
    purpose: 'Bypass cache and get fresh data'
  },
  {
    title: 'Include AI Analysis',
    url: '/api/valuation?ticker=tesla&includeAI=true',
    purpose: 'Add OpenAI-powered valuation insights (if configured)'
  },
  {
    title: 'View Cache Stats',
    url: '/api/ticker-resolution?stats=true',
    purpose: 'Debug cache performance and contents'
  },
  {
    title: 'Combination',
    url: '/api/valuation?ticker=microsoft&exchange=NASDAQ&includeAI=true&refresh=false',
    purpose: 'All options together'
  }
];

console.log('Advanced Parameters:');
advancedExamples.forEach((ex, i) => {
  console.log(`\n  ${i + 1}. ${ex.title}`);
  console.log(`     URL: ${ex.url}`);
  console.log(`     Purpose: ${ex.purpose}`);
});

// ============================================================================
// EXAMPLE 6: Caching & Performance
// ============================================================================

console.log(`
═══════════════════════════════════════════════════════════════
EXAMPLE 6: Caching & Performance
═══════════════════════════════════════════════════════════════

The system uses intelligent caching to improve performance.
`);

const cacheExamples = [
  {
    step: 1,
    action: 'First search for "NVIDIA"',
    time: '~150ms',
    source: 'Local mapping + API (if needed)',
    notes: 'Cached after resolution'
  },
  {
    step: 2,
    action: 'Second search for "NVIDIA"',
    time: '~5ms',
    source: 'Memory cache',
    notes: '30x faster! Cache hit'
  },
  {
    step: 3,
    action: 'Search for "Nvidia Corporation"',
    time: '~5ms',
    source: 'Memory cache',
    notes: 'Normalized to same key'
  },
  {
    step: 4,
    action: 'Force refresh with ?refresh=true',
    time: '~150ms',
    source: 'Skips cache',
    notes: 'Fresh lookup, updates cache'
  }
];

console.log('Performance Timeline:');
cacheExamples.forEach((ex) => {
  console.log(`
  Step ${ex.step}: ${ex.action}
    Time: ${ex.time}
    Source: ${ex.source}
    Notes: ${ex.notes}`);
});

console.log(`
Cache Management:
  # View cache stats
  curl "http://localhost:3000/api/ticker-resolution?stats=true"
  
  # Clear specific entry
  curl -X DELETE "http://localhost:3000/api/ticker-resolution?query=nvidia"
  
  # Clear entire cache
  curl -X DELETE "http://localhost:3000/api/ticker-resolution"
`);

// ============================================================================
// EXAMPLE 7: Frontend Integration
// ============================================================================

console.log(`
═══════════════════════════════════════════════════════════════
EXAMPLE 7: Frontend Integration
═══════════════════════════════════════════════════════════════

How to integrate in your React components.
`);

const frontendCode = `
// React Component Example
import { useState } from 'react';

export function StockSearch() {
  const [search, setSearch] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(\`/api/valuation?ticker=\${encodeURIComponent(search)}\`);
      const data = await response.json();

      if (response.ok) {
        setResult(data);
        // Display resolution info
        console.log(\`Resolved: \${data.resolution.input} → \${data.resolution.resolvedTicker}\`);
      } else {
        setError(data.message || 'Error resolving ticker');
      }
    } catch (err) {
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSearch}>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by company name or ticker"
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Searching...' : 'Search'}
      </button>
      
      {result && (
        <div>
          <p>Resolved: {result.resolution.input} → {result.resolution.resolvedTicker}</p>
          <p>Company: {result.companyName}</p>
          <p>Valuation: {result.overall.verdict}</p>
        </div>
      )}
      
      {error && <div style={{color: 'red'}}>{error}</div>}
    </form>
  );
}
`;

console.log(frontendCode);

// ============================================================================
// EXAMPLE 8: Backend Integration
// ============================================================================

console.log(`
═══════════════════════════════════════════════════════════════
EXAMPLE 8: Backend Integration (Node.js)
═══════════════════════════════════════════════════════════════

How to use ticker resolution in backend code.
`);

const backendCode = `
// Backend Example
import { resolveTickerOrCompanyName } from '@/lib/tickerResolution';
import { generateValuationAnalysis } from '@/lib/openaiService';

export async function searchStock(userInput) {
  // Step 1: Resolve ticker/company name
  const resolution = await resolveTickerOrCompanyName(userInput, {
    exchange: 'NASDAQ',
    provider: 'auto'
  });

  if (!resolution.ticker) {
    return {
      success: false,
      error: 'Could not resolve company'
    };
  }

  // Step 2: Fetch valuation data using resolved ticker
  const response = await fetch(\`/api/valuation?ticker=\${resolution.ticker}\`);
  const valuation = await response.json();

  // Step 3: Generate AI analysis (optional)
  const analysis = await generateValuationAnalysis(
    resolution.ticker,
    valuation.companyName,
    valuation
  );

  return {
    success: true,
    resolution,
    valuation,
    analysis
  };
}

// Usage
const result = await searchStock('nvidia');
console.log(result);
`;

console.log(backendCode);

// ============================================================================
// EXAMPLE 9: Testing
// ============================================================================

console.log(`
═══════════════════════════════════════════════════════════════
EXAMPLE 9: Testing
═══════════════════════════════════════════════════════════════

How to test ticker resolution functionality.
`);

const testingGuide = `
# Run all tests
npm run test

# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Manual testing
curl "http://localhost:3000/api/ticker-resolution?query=nvidia"
curl "http://localhost:3000/api/valuation?ticker=apple"
curl "http://localhost:3000/api/ticker-resolution?stats=true"

# Test edge cases
curl "http://localhost:3000/api/ticker-resolution?query=N%20V%20D%20A"
curl "http://localhost:3000/api/ticker-resolution?query=Nvidia,%20Inc."
curl "http://localhost:3000/api/ticker-resolution?query=unknowncompanyxyz"
`;

console.log(testingGuide);

// ============================================================================
// EXAMPLE 10: Telemetry & Monitoring
// ============================================================================

console.log(`
═══════════════════════════════════════════════════════════════
EXAMPLE 10: Telemetry & Monitoring
═══════════════════════════════════════════════════════════════

Every resolution generates telemetry events for monitoring.
`);

const telemetryEvents = [
  {
    type: 'ticker_resolution_detected_ticker',
    trigger: 'Input recognized as ticker symbol',
    confidence: 1.0,
    example: 'Input: "NVDA" → Detected as ticker'
  },
  {
    type: 'symbol_resolved',
    trigger: 'Successfully resolved from any source',
    confidence: '0.65-1.0',
    example: 'Input: "NVIDIA" → Resolved to NVDA'
  },
  {
    type: 'ticker_resolution_cache_hit',
    trigger: 'Result retrieved from cache',
    confidence: 'Inherited',
    example: 'Cached result returned in ~5ms'
  },
  {
    type: 'symbol_ambiguous',
    trigger: 'Multiple matches found',
    confidence: 'Multiple options',
    example: 'Could be AAPL or APP (less common)'
  },
  {
    type: 'symbol_not_found',
    trigger: 'No matches found',
    confidence: 0,
    example: 'Input: "UNKNOWNXYZ" → Not found'
  }
];

console.log('Telemetry Events:');
telemetryEvents.forEach((event, i) => {
  console.log(`
  ${i + 1}. ${event.type}
     Trigger: ${event.trigger}
     Confidence: ${event.confidence}
     Example: ${event.example}`);
});

console.log(`
Analytics Implementation:
  // Capture telemetry events
  response.telemetry.forEach(event => {
    analytics.track(event.type, {
      ticker: event.ticker,
      confidence: event.confidence,
      source: event.resolvedFrom,
      timestamp: event.timestamp
    });
  });
`);

// ============================================================================
// Summary
// ============================================================================

console.log(`
═══════════════════════════════════════════════════════════════
SUMMARY
═══════════════════════════════════════════════════════════════

✓ Automatic company name to ticker resolution
✓ Case-insensitive and whitespace-tolerant matching
✓ Multi-strategy lookup (cache → API → fuzzy matching)
✓ Intelligent caching with 24-hour TTL
✓ Ambiguous match handling with confidence scores
✓ Optional OpenAI integration for AI analysis
✓ Comprehensive telemetry for monitoring
✓ Full test coverage (unit + integration)

Quick Start:
  1. Add environment variables to .env.local
  2. Run: npm run test
  3. Start server: npm run dev
  4. Test: curl "http://localhost:3000/api/valuation?ticker=nvidia"

For full documentation, see:
  - TICKER_RESOLUTION.md - User guide
  - IMPLEMENTATION_GUIDE.md - Developer guide
  - tests/unit.test.js - Unit tests
  - tests/integration.test.js - Integration tests

═══════════════════════════════════════════════════════════════
`);

process.exit(0);
