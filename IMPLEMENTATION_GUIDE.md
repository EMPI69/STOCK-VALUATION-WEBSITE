# Implementation Guide: Automatic Ticker Resolution

## Quick Start

### 1. Install Dependencies (if needed)

```bash
npm install
```

The implementation uses only built-in Node.js/Next.js APIs - no external dependencies required for core functionality.

### 2. Configure Environment Variables

Create or update `.env.local`:

```env
# Required for financial data
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key
FINNHUB_API_KEY=your_finnhub_key

# Optional but recommended for enhanced features
OPENAI_API_KEY=your_openai_key
IEX_CLOUD_API_KEY=your_iex_cloud_key
```

### 3. Test the Implementation

#### Run all tests:
```bash
npm run test
# or individual test suites:
node tests/unit.test.js
node tests/integration.test.js
```

#### Test via API:
```bash
# Start development server
npm run dev

# In another terminal, test ticker resolution
curl "http://localhost:3000/api/ticker-resolution?query=nvidia"
curl "http://localhost:3000/api/valuation?ticker=nvidia"
```

### 4. Frontend Integration

The frontend (`app/page.js`) is already updated to:
- Accept both ticker and company name input
- Display resolution information
- Handle ambiguous matches
- Show error messages clearly

No additional frontend changes required.

## Architecture Overview

```
User Input (e.g., "NVIDIA")
    ↓
[Normalize Input]
    ↓
[Is it a ticker?] → YES → Return immediately (confidence: 1.0)
    ↓ NO
[Check Local Cache] → FOUND → Return from cache
    ↓ NOT FOUND
[Try Local Mapping] → FOUND → Cache and return
    ↓ NOT FOUND
[Try Financial APIs] → FOUND → Cache and return
- Finnhub API
- IEX Cloud API
    ↓ NOT FOUND
[Fuzzy Match] → FOUND → Return matches
    ↓ NOT FOUND
[Not Found] → Log event and suggest alternatives
```

## File Structure

```
lib/
├── tickerResolution.js      # Main resolution service
├── stringUtils.js           # String utilities (Levenshtein, normalize, etc.)
└── openaiService.js         # OpenAI integration

app/api/
├── valuation/
│   └── route.js             # Updated with resolution
└── ticker-resolution/
    └── route.js             # New resolution endpoint

app/
└── page.js                  # Frontend updated to show resolution

tests/
├── unit.test.js             # String & resolution logic tests
└── integration.test.js      # End-to-end scenarios

TICKER_RESOLUTION.md         # User documentation
IMPLEMENTATION_GUIDE.md      # This file
```

## Key Functions

### Resolution Service

```javascript
import { resolveTickerOrCompanyName, clearResolutionCache } from '@/lib/tickerResolution';

// Main resolution function
const result = await resolveTickerOrCompanyName(input, options);
// Returns: { ticker, exchange, name, confidence, resolvedFrom, telemetry }

// Options:
// - exchange: 'NASDAQ' | 'NYSE' | null
// - provider: 'finnhub' | 'iex' | 'auto'
// - forceRefresh: true | false
```

### String Utilities

```javascript
import { 
  levenshteinDistance, 
  normalizeString, 
  stripSpacesAndPunctuation,
  isValidTickerFormat 
} from '@/lib/stringUtils';

levenshteinDistance('hello', 'hallo')    // → 1
normalizeString('  NVIDIA, Inc.  ')      // → 'nvidiainc'
stripSpacesAndPunctuation('N V D A')     // → 'NVDA'
isValidTickerFormat('NVDA')              // → true
```

### OpenAI Service

```javascript
import { 
  enhanceQueryWithTicker, 
  generateValuationAnalysis,
  isOpenAIConfigured 
} from '@/lib/openaiService';

// Enhance query with ticker context
const response = await enhanceQueryWithTicker(
  userQuery,
  resolvedTicker,
  companyName
);

// Generate AI analysis
const analysis = await generateValuationAnalysis(
  ticker,
  companyName,
  valuationData
);
```

## Integration with Existing Code

The implementation integrates seamlessly with the existing codebase:

### 1. **Backward Compatible**
- Existing ticker-only searches still work
- No breaking changes to API contract
- Optional AI features don't affect standard flows

### 2. **Enhanced API Route**
```javascript
// Old: GET /api/valuation?ticker=NVDA
// New: GET /api/valuation?ticker=NVIDIA (also works!)

// Optional parameters added:
// - exchange: Filter by exchange
// - provider: Choose API provider
// - refresh: Force cache bypass
// - includeAI: Include AI analysis
```

### 3. **Frontend Display Updates**
- New resolution info card shows search → resolved ticker
- Confidence score displayed
- Resolution source shown for debugging

## Configuration Options

### 1. Change Default Provider

Edit `lib/tickerResolution.js`:
```javascript
// Default priority:
provider = 'auto'  // Tries Finnhub then IEX

// Or specify:
provider = 'finnhub'  // Only Finnhub
provider = 'iex'      // Only IEX Cloud
```

### 2. Adjust Cache TTL

Edit `lib/tickerResolution.js`:
```javascript
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;  // 24 hours (change as needed)
```

### 3. Add Custom Company Mappings

```javascript
// In your code:
import { addLocalMapping } from '@/lib/tickerResolution';

addLocalMapping('Tesla', 'TSLA', 'NASDAQ', 0.99);
addLocalMapping('Apple', 'AAPL', 'NASDAQ', 0.99);

// Or directly edit localTickerMapping in tickerResolution.js
```

### 4. Configure Fuzzy Matching Threshold

Edit `lib/tickerResolution.js`:
```javascript
// Adjust similarity threshold (0.65 = 65% match required)
const fuzzyMatches = fuzzyMatchLocalTickers(normalizedInput, 0.65);
```

## Monitoring & Analytics

### Check Cache Statistics

```bash
curl "http://localhost:3000/api/ticker-resolution?stats=true"
```

Response:
```json
{
  "cacheStats": {
    "size": 15,
    "entries": [
      { "input": "nvidia", "ticker": "NVDA", "age": 120000 },
      { "input": "apple", "ticker": "AAPL", "age": 450000 }
    ]
  }
}
```

### View Telemetry Events

Each API response includes telemetry:
```json
{
  "telemetry": {
    "type": "symbol_resolved",
    "ticker": "NVDA",
    "confidence": 0.99,
    "resolvedFrom": "local_cache",
    "timestamp": "2025-12-08T..."
  }
}
```

Capture these events for analytics:
- Track resolution success rate
- Identify common search patterns
- Monitor API provider performance
- Detect ambiguous queries requiring UX improvement

## Deployment Checklist

- [ ] Environment variables configured in production
- [ ] API keys validated and have sufficient quota
- [ ] Tests pass locally (`npm run test`)
- [ ] Load test with expected traffic volume
- [ ] Monitor cache growth over time
- [ ] Set up alerts for API failures
- [ ] Document any custom company mappings added
- [ ] Update API documentation for users
- [ ] Plan cache invalidation strategy (24h TTL default)
- [ ] Consider database for persistent cache (future enhancement)

## Performance Optimization

### For High-Traffic Scenarios

1. **Increase Cache TTL** (in production)
   ```javascript
   const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;  // 7 days
   ```

2. **Pre-warm Cache**
   ```javascript
   // On server start, load popular companies
   import { resolveTickerOrCompanyName } from '@/lib/tickerResolution';
   
   const popular = ['Apple', 'Microsoft', 'NVIDIA', 'Amazon', 'Google'];
   for (const company of popular) {
     await resolveTickerOrCompanyName(company);
   }
   ```

3. **Use Redis for Distributed Cache** (future)
   ```javascript
   // Current: In-memory, single instance
   // Future: Redis for multi-instance deployment
   ```

4. **Database Persistence** (future)
   ```javascript
   // Consider Supabase, Firebase, or PostgreSQL
   // for persistent resolution history
   ```

## Troubleshooting

### Issue: Company not resolving

**Solution:**
1. Check spelling and formatting
2. Try ticker symbol instead
3. Check if company is publicly traded
4. Verify API keys if using external APIs

### Issue: Ambiguous matches

**Solution:**
1. Use `?exchange=NASDAQ` to filter
2. Use full company name
3. Use ticker symbol directly

### Issue: Slow responses

**Solution:**
1. Enable caching: `?refresh=false` (default)
2. Check API provider response time
3. Monitor network latency
4. Consider increasing cache TTL

### Issue: Cache stale data

**Solution:**
1. Force refresh: `?refresh=true`
2. Clear cache: `curl -X DELETE /api/ticker-resolution?query=company`
3. Wait for TTL expiry (24 hours default)

## Security Best Practices

1. **API Keys**
   - Store in `.env.local` (never commit)
   - Use `.env.local.example` for documentation
   - Rotate keys periodically

2. **Rate Limiting**
   - Built-in per `openaiService.js`
   - Monitor external API usage
   - Set up billing alerts

3. **Data Privacy**
   - No personal data in telemetry
   - Cache entries auto-expire
   - Comply with data retention policies

4. **Input Validation**
   - All inputs sanitized
   - Ticker format validated
   - Special characters handled

## Support & Questions

For issues:
1. Check `TICKER_RESOLUTION.md` documentation
2. Run tests: `node tests/unit.test.js`
3. Enable debug logging (coming soon)
4. Check environment variables
5. Review GitHub issues

## Next Steps

1. ✅ Core implementation complete
2. ✅ Tests comprehensive
3. ⏳ Deploy to staging
4. ⏳ Load testing
5. ⏳ Monitor production metrics
6. 📋 Future: Database persistence
7. 📋 Future: Historical tracking
8. 📋 Future: Machine learning disambiguation

## Related Documentation

- `TICKER_RESOLUTION.md` - User documentation
- `tests/unit.test.js` - Unit test code
- `tests/integration.test.js` - Integration test code
- `lib/tickerResolution.js` - Full source code with comments
