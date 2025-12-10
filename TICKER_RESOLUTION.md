# Automatic Ticker Resolution & OpenAI Integration

## Overview

This feature enables the stock valuation system to automatically resolve company names to ticker symbols and integrate with OpenAI for enhanced search capabilities. Users can search by company name (e.g., "NVIDIA", "Nvidia Corporation") or ticker (e.g., "NVDA") and get identical results.

## Architecture

### Core Components

#### 1. **Ticker Resolution Service** (`lib/tickerResolution.js`)
Multi-strategy lookup with priority order:

1. **Input Detection** - Identifies if input is already a ticker symbol (1-5 alpha characters)
2. **Local Cache** - Fast in-memory cache with 24-hour TTL
3. **Local Mapping** - Pre-populated company name → ticker database
4. **Financial APIs** - Configurable providers (Finnhub, IEX Cloud, Alpha Vantage)
5. **Fuzzy Matching** - Levenshtein distance-based fallback for similar names

#### 2. **String Utilities** (`lib/stringUtils.js`)
- Levenshtein distance calculation for fuzzy matching
- String normalization (trim, lowercase, punctuation handling)
- Ticker format validation
- Partial string matching

#### 3. **OpenAI Service** (`lib/openaiService.js`)
- Enhance queries with resolved ticker context
- Generate AI-powered valuation analysis
- Fallback search when ticker isn't found
- Rate limiting and error handling

#### 4. **Updated API Route** (`app/api/valuation/route.js`)
- Automatically resolves ticker/company name input
- Returns resolution metadata along with valuation data
- Supports AI analysis with `?includeAI=true` parameter

#### 5. **Ticker Resolution Endpoint** (`app/api/ticker-resolution/route.js`)
- Dedicated endpoint for testing and debugging
- Cache management via DELETE requests
- Statistics viewing

## Usage

### Basic Usage (Frontend)

```javascript
// Search by company name
const response = await fetch('/api/valuation?ticker=NVIDIA');

// Search by ticker (same result)
const response = await fetch('/api/valuation?ticker=NVDA');

// Both return identical valuation data plus resolution info
```

### API Response Format

```json
{
  "ticker": "NVDA",
  "companyName": "NVIDIA",
  "sector": "Semiconductors",
  "resolution": {
    "input": "NVIDIA",
    "resolvedTicker": "NVDA",
    "resolvedFrom": "local_cache",
    "confidence": 0.99,
    "exchange": "NASDAQ"
  },
  "rawData": { /* financial data */ },
  "metrics": { /* valuation metrics */ },
  "verdicts": [ /* metric verdicts */ ],
  "overall": {
    "verdict": "undervalued",
    "confidence": 85,
    "reasoning": "..."
  },
  "telemetry": {
    "type": "symbol_resolved",
    "ticker": "NVDA",
    "confidence": 0.99,
    "resolvedFrom": "local_cache",
    "timestamp": "2025-12-08T..."
  }
}
```

### Advanced Parameters

```
GET /api/valuation?ticker=nvidia&exchange=NASDAQ&provider=auto&refresh=false&includeAI=true

Parameters:
- ticker: Required. Company name or ticker symbol
- exchange: Optional. Prefer specific exchange (NASDAQ, NYSE, etc.)
- provider: Optional. API provider preference (finnhub, iex, auto)
- refresh: Optional. Force bypass cache (true/false, default: false)
- includeAI: Optional. Include AI-powered analysis (true/false, default: false)
```

## Features

### Case-Insensitive Matching

```javascript
// All resolve to NVDA
await resolveTickerOrCompanyName('NVIDIA');      // → NVDA
await resolveTickerOrCompanyName('nvidia');      // → NVDA
await resolveTickerOrCompanyName('Nvidia');      // → NVDA
await resolveTickerOrCompanyName('NVIDIA, Inc'); // → NVDA
```

### Edge Case Handling

```javascript
// Handles spaces, punctuation, abbreviations
await resolveTickerOrCompanyName('N V D A');           // → NVDA
await resolveTickerOrCompanyName('Nvidia, Inc.');      // → NVDA
await resolveTickerOrCompanyName('Nvidia Corporation'); // → NVDA
await resolveTickerOrCompanyName('nvidia inc');        // → NVDA
```

### Ambiguous Match Handling

When multiple matches exist with similar confidence:

```json
{
  "error": "ambiguous_ticker",
  "message": "Multiple matches found for your search",
  "candidates": [
    { "ticker": "AAPL", "name": "Apple", "exchange": "NASDAQ", "confidence": 0.95 },
    { "ticker": "APPL", "name": "Other", "exchange": "OTC", "confidence": 0.75 }
  ]
}
```

### Caching Strategy

- **TTL**: 24 hours per entry
- **Size**: Unlimited (memory-based)
- **Manual Clear**: Via DELETE request or `clearResolutionCache()`
- **Force Refresh**: Via `forceRefresh: true` option

### Telemetry Events

1. **ticker_resolution_detected_ticker**
   - Input recognized as ticker symbol
   - High confidence (1.0)

2. **symbol_resolved**
   - Successfully resolved via cache, API, or fuzzy matching
   - Includes confidence score and source

3. **symbol_ambiguous**
   - Multiple matches found
   - Includes candidate list and confidence scores

4. **symbol_not_found**
   - No matches found in any strategy
   - Logged for analytics

5. **ticker_resolution_cache_hit**
   - Result retrieved from cache
   - Indicates fast resolution

## Configuration

### Environment Variables

```env
# Required for financial data
ALPHA_VANTAGE_API_KEY=your_key_here
FINNHUB_API_KEY=your_key_here

# Optional for AI features
OPENAI_API_KEY=your_key_here

# Optional for ticker resolution APIs
IEX_CLOUD_API_KEY=your_key_here
```

### Adding Custom Mappings

```javascript
import { addLocalMapping } from '@/lib/tickerResolution';

// Add custom company → ticker mapping
addLocalMapping('Tesla', 'TSLA', 'NASDAQ', 0.99);
addLocalMapping('My Company', 'MYC', 'NYSE', 0.90);
```

## Testing

### Run Unit Tests

```bash
node tests/unit.test.js
```

Tests include:
- String normalization and fuzzy matching
- Ticker detection and validation
- Local mapping resolution
- Cache behavior
- Telemetry event emission

### Run Integration Tests

```bash
node tests/integration.test.js
```

Tests cover:
- Real-world search scenarios (NVDA, NVIDIA, Nvidia, etc.)
- Cache consistency across variations
- Telemetry event verification
- Edge cases (unknown companies, special characters)

### Manual Testing

#### Test ticker resolution endpoint:

```bash
# Resolve by company name
curl "http://localhost:3000/api/ticker-resolution?query=nvidia"

# Resolve with specific exchange
curl "http://localhost:3000/api/ticker-resolution?query=apple&exchange=NASDAQ"

# View cache statistics
curl "http://localhost:3000/api/ticker-resolution?stats=true"

# Clear specific cache entry
curl -X DELETE "http://localhost:3000/api/ticker-resolution?query=nvidia"

# Clear entire cache
curl -X DELETE "http://localhost:3000/api/ticker-resolution"
```

#### Test valuation with resolution:

```bash
# Company name input
curl "http://localhost:3000/api/valuation?ticker=nvidia"

# Ticker input (same result)
curl "http://localhost:3000/api/valuation?ticker=nvda"

# With AI analysis
curl "http://localhost:3000/api/valuation?ticker=nvidia&includeAI=true"
```

## Security Considerations

### API Keys
- All external API keys stored in environment variables
- Never committed to version control
- Validated on startup

### Rate Limiting
- Built-in rate limiter in OpenAI service
- Prevents API quota exhaustion
- Configurable per-endpoint

### Data Privacy
- No personal data collected in telemetry
- Only resolution metadata stored in cache
- Cache entries expire automatically

## Error Handling

### Graceful Degradation

```javascript
// If financial API fails → uses cached data or alternative source
// If OpenAI unavailable → returns standard valuation without AI analysis
// If ticker not found → suggests alternatives or falls back to company name search
```

### User-Facing Error Messages

| Scenario | Message | Action |
|----------|---------|--------|
| Not found | "Could not resolve 'X' to a ticker symbol" | Suggest format |
| Ambiguous | "Multiple matches found: X, Y, Z" | Request clarification |
| API Error | "Failed to fetch data. Please try again." | Retry with backoff |

## Performance Metrics

- **Direct ticker detection**: < 1ms
- **Local cache lookup**: < 5ms
- **Fuzzy matching**: 10-50ms (depending on database size)
- **API lookup**: 100-500ms (depends on provider)
- **Overall resolution**: ~50-150ms (cached), ~200-600ms (uncached)

## Supported Companies

Pre-loaded company mappings include:

- Apple, Microsoft, NVIDIA, Google/Alphabet
- Tesla, Amazon, Meta, JPMorgan Chase
- Berkshire Hathaway, Visa, and 50+ more

Extends automatically via:
- Financial APIs (Finnhub, IEX Cloud)
- Custom mappings
- User contributions

## API Contract for AI Search

When passing resolved ticker to AI:

```javascript
{
  query: "<original user query>",
  ticker: "NVDA",
  resolvedFrom: "local_cache|api|fuzzy_match|input_detection",
  confidence: 0.95,
  exchange: "NASDAQ"
}
```

## Troubleshooting

### Company not found
1. Verify spelling
2. Use ticker symbol instead
3. Try full company name with Inc./Corp.
4. Check if company is publicly traded

### Cache not updating
1. Use `?refresh=true` parameter
2. Or DELETE cache endpoint: `curl -X DELETE /api/ticker-resolution?query=name`
3. Wait 24 hours for automatic expiry

### Ambiguous results
1. Specify exchange preference: `?exchange=NASDAQ`
2. Use ticker symbol for unambiguous results
3. Try alternative company names

### API errors
1. Check environment variables are set
2. Verify API keys have quota remaining
3. Check network connectivity
4. Review rate limiting

## Future Enhancements

- [ ] Database persistence for cache (Redis/PostgreSQL)
- [ ] Machine learning for better disambiguation
- [ ] User preferences for exchange/region
- [ ] Historical resolution tracking
- [ ] Bulk resolution endpoint
- [ ] Webhook notifications for new companies
- [ ] Real-time market data integration

## Contributing

To add new company mappings:

```javascript
// In lib/tickerResolution.js localTickerMapping object
'companyname': { 
  ticker: 'TICK', 
  exchange: 'NASDAQ', 
  confidence: 0.99 
}
```

Or programmatically:
```javascript
import { addLocalMapping } from '@/lib/tickerResolution';
addLocalMapping('Company Name', 'TICK', 'NASDAQ', 0.99);
```

## License

Part of Stock Valuation Website project.
