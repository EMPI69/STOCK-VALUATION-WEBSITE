# Quick Reference Card - Ticker Resolution

## 🚀 Quick Start

```bash
# 1. Setup
npm install
# Add to .env.local:
ALPHA_VANTAGE_API_KEY=key
FINNHUB_API_KEY=key
OPENAI_API_KEY=key  # optional

# 2. Test
npm run test

# 3. Run
npm run dev

# 4. Use
curl "http://localhost:3000/api/valuation?ticker=nvidia"
```

## 📡 API Endpoints

### Main Valuation Endpoint
```
GET /api/valuation?ticker=NVIDIA[&exchange=NASDAQ][&includeAI=true][&refresh=false]
```

### Resolution Testing
```
GET /api/ticker-resolution?query=nvidia[&stats=true]
POST /api/ticker-resolution
DELETE /api/ticker-resolution[?query=nvidia]
```

## 🎯 Supported Searches

| Input | Output | Path | Time |
|-------|--------|------|------|
| `NVDA` | NVDA | Ticker detection | <1ms |
| `NVIDIA` | NVDA | Local cache | ~5ms |
| `nvidia` | NVDA | Normalized cache | ~5ms |
| `Nvidia, Inc.` | NVDA | Punctuation handled | ~10ms |
| `N V D A` | NVDA | Spaces removed | ~15ms |
| `Apple` | AAPL | Mapping lookup | ~10ms |

## 📊 Response Format

```json
{
  "ticker": "NVDA",
  "resolution": {
    "input": "NVIDIA",
    "resolvedTicker": "NVDA",
    "resolvedFrom": "local_cache",
    "confidence": 0.99
  },
  "metrics": { },
  "overall": { },
  "telemetry": { }
}
```

## 🔍 Key Functions

### Resolve Ticker/Company
```javascript
import { resolveTickerOrCompanyName } from '@/lib/tickerResolution';

const result = await resolveTickerOrCompanyName('nvidia', {
  exchange: 'NASDAQ',
  provider: 'auto'
});
// → { ticker: 'NVDA', confidence: 0.99, ... }
```

### String Utilities
```javascript
import { levenshteinDistance, normalizeString } from '@/lib/stringUtils';

levenshteinDistance('hello', 'hallo')     // → 1
normalizeString('  NVIDIA, Inc.  ')       // → 'nvidiainc'
```

### OpenAI Integration
```javascript
import { enhanceQueryWithTicker } from '@/lib/openaiService';

const response = await enhanceQueryWithTicker(
  'earnings', 'NVDA', 'NVIDIA'
);
```

## ⚙️ Configuration

### Cache TTL
```javascript
// In lib/tickerResolution.js
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;  // 24 hours
```

### Fuzzy Match Threshold
```javascript
const fuzzyMatches = fuzzyMatchLocalTickers(input, 0.65);  // 65%
```

### Add Custom Mapping
```javascript
import { addLocalMapping } from '@/lib/tickerResolution';
addLocalMapping('Tesla', 'TSLA', 'NASDAQ', 0.99);
```

## 🧪 Testing

```bash
# All tests
npm run test

# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# Manual test
curl "http://localhost:3000/api/ticker-resolution?query=apple"
curl "http://localhost:3000/api/valuation?ticker=microsoft"
```

## 📈 Telemetry Events

| Event | Trigger | Example |
|-------|---------|---------|
| `ticker_resolution_detected_ticker` | Input is ticker | NVDA → NVDA |
| `symbol_resolved` | Found match | NVIDIA → NVDA |
| `ticker_resolution_cache_hit` | From cache | Cached result |
| `symbol_ambiguous` | Multiple matches | Multiple options |
| `symbol_not_found` | No matches | Unknown company |

## 🛠️ Debug

```bash
# View cache stats
curl "http://localhost:3000/api/ticker-resolution?stats=true"

# Clear specific entry
curl -X DELETE "http://localhost:3000/api/ticker-resolution?query=nvidia"

# Clear all cache
curl -X DELETE "http://localhost:3000/api/ticker-resolution"

# Force refresh (bypass cache)
curl "http://localhost:3000/api/valuation?ticker=nvidia&refresh=true"
```

## 🚨 Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| `ticker_not_found` | Company unknown | Use ticker or try different name |
| `ambiguous_ticker` | Multiple matches | Use exchange filter or ticker |
| API timeout | External API slow | Retries with backoff, uses cache |
| Rate limit | API quota exceeded | Falls back to local cache |

## 📊 Performance Tips

```javascript
// ✅ Good: Leverages cache
fetch('/api/valuation?ticker=nvidia')

// ⚠️ Slower: Bypasses cache
fetch('/api/valuation?ticker=nvidia&refresh=true')

// ✅ Good: Direct ticker (fastest)
fetch('/api/valuation?ticker=NVDA')

// 💡 Better: With AI analysis
fetch('/api/valuation?ticker=nvidia&includeAI=true')
```

## 📚 Documentation

| Doc | Purpose |
|-----|---------|
| `TICKER_RESOLUTION.md` | Complete guide |
| `IMPLEMENTATION_GUIDE.md` | Setup & config |
| `USAGE_EXAMPLES.md` | Code examples |
| `COMPLETION_SUMMARY.md` | What was built |

## 🔐 Security Checklist

- [x] API keys in `.env.local`
- [x] Never commit `.env.local`
- [x] Input validation on all endpoints
- [x] Rate limiting enabled
- [x] Error messages don't leak data
- [x] Cache entries auto-expire

## 📝 Common Tasks

### Add New Company Mapping
```javascript
addLocalMapping('CompanyName', 'TICK', 'NASDAQ', 0.99);
```

### Check Resolution
```bash
curl "http://localhost:3000/api/ticker-resolution?query=companyname"
```

### Verify AI Integration
```bash
curl "http://localhost:3000/api/valuation?ticker=nvidia&includeAI=true"
```

### Monitor Cache
```bash
curl "http://localhost:3000/api/ticker-resolution?stats=true"
```

## 📞 Quick Troubleshooting

**Company not found?**
→ Try ticker symbol, check spelling

**Ambiguous results?**
→ Use `&exchange=NASDAQ` filter

**Slow response?**
→ Cache should be working, check logs

**Stale data?**
→ Use `&refresh=true` parameter

## 🎓 Examples

### Frontend React
```javascript
const [ticker, setTicker] = useState('');
const response = await fetch(`/api/valuation?ticker=${ticker}`);
const data = await response.json();
console.log(`Resolved: ${data.resolution.input} → ${data.resolution.resolvedTicker}`);
```

### Node.js Backend
```javascript
const { resolveTickerOrCompanyName } = require('@/lib/tickerResolution');
const result = await resolveTickerOrCompanyName('nvidia');
if (result.ticker) {
  // Use result.ticker for further processing
}
```

### cURL Testing
```bash
# Company name
curl "http://localhost:3000/api/valuation?ticker=nvidia"

# Ticker
curl "http://localhost:3000/api/valuation?ticker=NVDA"

# With AI
curl "http://localhost:3000/api/valuation?ticker=tesla&includeAI=true"
```

---

**Version**: 1.0.0  
**Last Updated**: December 8, 2025  
**Status**: Production Ready ✅

For full documentation, see `TICKER_RESOLUTION.md`
