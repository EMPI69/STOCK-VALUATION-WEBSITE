/**
 * Ticker Resolution Service
 * 
 * Resolves company names to ticker symbols with multi-strategy lookup:
 * 1. Local cache/mapping table (fast)
 * 2. Financial API providers (IEX Cloud, Alpha Vantage, Finnhub)
 * 3. Fuzzy-match fallback with Levenshtein distance
 * 
 * Returns: { ticker, exchange, name, confidence, resolvedFrom }
 */

import { levenshteinDistance, normalizeString } from './stringUtils.js';

// In-memory cache for ticker resolutions with TTL
const resolutionCache = new Map();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Local comprehensive company name to ticker mapping
 * Can be extended or loaded from database
 */
const localTickerMapping = {
  // Apple
  'apple': { ticker: 'AAPL', exchange: 'NASDAQ', confidence: 0.99 },
  'apple inc': { ticker: 'AAPL', exchange: 'NASDAQ', confidence: 0.99 },
  'apple corporation': { ticker: 'AAPL', exchange: 'NASDAQ', confidence: 0.99 },

  // Microsoft
  'microsoft': { ticker: 'MSFT', exchange: 'NASDAQ', confidence: 0.99 },
  'microsoft corporation': { ticker: 'MSFT', exchange: 'NASDAQ', confidence: 0.99 },
  'msft': { ticker: 'MSFT', exchange: 'NASDAQ', confidence: 0.99 },

  // NVIDIA
  'nvidia': { ticker: 'NVDA', exchange: 'NASDAQ', confidence: 0.99 },
  'nvidia corporation': { ticker: 'NVDA', exchange: 'NASDAQ', confidence: 0.99 },
  'nvda': { ticker: 'NVDA', exchange: 'NASDAQ', confidence: 0.99 },

  // Google/Alphabet
  'google': { ticker: 'GOOGL', exchange: 'NASDAQ', confidence: 0.95 },
  'alphabet': { ticker: 'GOOGL', exchange: 'NASDAQ', confidence: 0.99 },
  'alphabet inc': { ticker: 'GOOGL', exchange: 'NASDAQ', confidence: 0.99 },
  'googl': { ticker: 'GOOGL', exchange: 'NASDAQ', confidence: 0.99 },

  // Tesla
  'tesla': { ticker: 'TSLA', exchange: 'NASDAQ', confidence: 0.99 },
  'tesla inc': { ticker: 'TSLA', exchange: 'NASDAQ', confidence: 0.99 },
  'tsla': { ticker: 'TSLA', exchange: 'NASDAQ', confidence: 0.99 },

  // Amazon
  'amazon': { ticker: 'AMZN', exchange: 'NASDAQ', confidence: 0.99 },
  'amazon.com': { ticker: 'AMZN', exchange: 'NASDAQ', confidence: 0.99 },
  'amzn': { ticker: 'AMZN', exchange: 'NASDAQ', confidence: 0.99 },

  // Meta/Facebook
  'facebook': { ticker: 'META', exchange: 'NASDAQ', confidence: 0.95 },
  'meta': { ticker: 'META', exchange: 'NASDAQ', confidence: 0.99 },
  'meta platforms': { ticker: 'META', exchange: 'NASDAQ', confidence: 0.99 },

  // JPMorgan Chase
  'jpmorgan': { ticker: 'JPM', exchange: 'NYSE', confidence: 0.95 },
  'jpmorgan chase': { ticker: 'JPM', exchange: 'NYSE', confidence: 0.99 },
  'jpm': { ticker: 'JPM', exchange: 'NYSE', confidence: 0.99 },

  // Berkshire Hathaway
  'berkshire': { ticker: 'BRK.B', exchange: 'NYSE', confidence: 0.95 },
  'berkshire hathaway': { ticker: 'BRK.B', exchange: 'NYSE', confidence: 0.99 },
  'brk': { ticker: 'BRK.B', exchange: 'NYSE', confidence: 0.95 },

  // Visa
  'visa': { ticker: 'V', exchange: 'NYSE', confidence: 0.99 },

  // Netflix
  'netflix': { ticker: 'NFLX', exchange: 'NASDAQ', confidence: 0.99 },
  'netflix inc': { ticker: 'NFLX', exchange: 'NASDAQ', confidence: 0.99 },
  'nflx': { ticker: 'NFLX', exchange: 'NASDAQ', confidence: 0.99 },

  // Nvidia
  'nvidia': { ticker: 'NVDA', exchange: 'NASDAQ', confidence: 0.99 },
  'nvidia corporation': { ticker: 'NVDA', exchange: 'NASDAQ', confidence: 0.99 },
  'nvda': { ticker: 'NVDA', exchange: 'NASDAQ', confidence: 0.99 },

  // Intel
  'intel': { ticker: 'INTC', exchange: 'NASDAQ', confidence: 0.99 },
  'intel corporation': { ticker: 'INTC', exchange: 'NASDAQ', confidence: 0.99 },
  'intc': { ticker: 'INTC', exchange: 'NASDAQ', confidence: 0.99 },

  // AMD
  'amd': { ticker: 'AMD', exchange: 'NASDAQ', confidence: 0.99 },
  'advanced micro devices': { ticker: 'AMD', exchange: 'NASDAQ', confidence: 0.99 },

  // Oracle
  'oracle': { ticker: 'ORCL', exchange: 'NYSE', confidence: 0.99 },
  'oracle corporation': { ticker: 'ORCL', exchange: 'NYSE', confidence: 0.99 },
  'orcl': { ticker: 'ORCL', exchange: 'NYSE', confidence: 0.99 },

  // Salesforce
  'salesforce': { ticker: 'CRM', exchange: 'NYSE', confidence: 0.99 },
  'salesforce inc': { ticker: 'CRM', exchange: 'NYSE', confidence: 0.99 },
  'crm': { ticker: 'CRM', exchange: 'NYSE', confidence: 0.99 },

  // Adobe
  'adobe': { ticker: 'ADBE', exchange: 'NASDAQ', confidence: 0.99 },
  'adobe systems': { ticker: 'ADBE', exchange: 'NASDAQ', confidence: 0.99 },
  'adbe': { ticker: 'ADBE', exchange: 'NASDAQ', confidence: 0.99 },

  // Accenture
  'accenture': { ticker: 'ACN', exchange: 'NYSE', confidence: 0.99 },
  'acn': { ticker: 'ACN', exchange: 'NYSE', confidence: 0.99 },

  // ServiceNow
  'servicenow': { ticker: 'NOW', exchange: 'NYSE', confidence: 0.99 },
  'now': { ticker: 'NOW', exchange: 'NYSE', confidence: 0.99 },

  // Datadog
  'datadog': { ticker: 'DDOG', exchange: 'NASDAQ', confidence: 0.99 },
  'ddog': { ticker: 'DDOG', exchange: 'NASDAQ', confidence: 0.99 },

  // Crowdstrike
  'crowdstrike': { ticker: 'CRWD', exchange: 'NASDAQ', confidence: 0.99 },
  'crwd': { ticker: 'CRWD', exchange: 'NASDAQ', confidence: 0.99 },

  // Snowflake
  'snowflake': { ticker: 'SNOW', exchange: 'NYSE', confidence: 0.99 },
  'snow': { ticker: 'SNOW', exchange: 'NYSE', confidence: 0.99 },

  // Stripe (private, but adding for completeness)
  // 'stripe': { ticker: 'STRIPE', exchange: 'PRIVATE', confidence: 0.80 },

  // PayPal
  'paypal': { ticker: 'PYPL', exchange: 'NASDAQ', confidence: 0.99 },
  'pypl': { ticker: 'PYPL', exchange: 'NASDAQ', confidence: 0.99 },

  // Square / Block
  'square': { ticker: 'SQ', exchange: 'NYSE', confidence: 0.95 },
  'block inc': { ticker: 'SQ', exchange: 'NYSE', confidence: 0.99 },
  'sq': { ticker: 'SQ', exchange: 'NYSE', confidence: 0.99 },

  // Uber
  'uber': { ticker: 'UBER', exchange: 'NYSE', confidence: 0.99 },
  'uber technologies': { ticker: 'UBER', exchange: 'NYSE', confidence: 0.99 },

  // Lyft
  'lyft': { ticker: 'LYFT', exchange: 'NASDAQ', confidence: 0.99 },

  // Airbnb
  'airbnb': { ticker: 'ABNB', exchange: 'NASDAQ', confidence: 0.99 },
  'abnb': { ticker: 'ABNB', exchange: 'NASDAQ', confidence: 0.99 },

  // DoorDash
  'doordash': { ticker: 'DASH', exchange: 'NYSE', confidence: 0.99 },
  'dash': { ticker: 'DASH', exchange: 'NYSE', confidence: 0.99 },

  // Shopify
  'shopify': { ticker: 'SHOP', exchange: 'NYSE', confidence: 0.99 },
  'shop': { ticker: 'SHOP', exchange: 'NYSE', confidence: 0.99 },

  // Spotify
  'spotify': { ticker: 'SPOT', exchange: 'NYSE', confidence: 0.99 },
  'spot': { ticker: 'SPOT', exchange: 'NYSE', confidence: 0.99 },
};

/**
 * Check if input is a ticker symbol (1-5 uppercase alpha characters, optional dot)
 */
function isTickerSymbol(input) {
  const tickerPattern = /^[A-Z]{1,5}(\.?[A-Z]{1,2})?$/;
  return tickerPattern.test(input);
}

/**
 * Get cached resolution or null if expired
 */
function getCachedResolution(normalizedInput) {
  const cached = resolutionCache.get(normalizedInput);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }
  if (cached) {
    resolutionCache.delete(normalizedInput);
  }
  return null;
}

/**
 * Store resolution in cache with timestamp
 */
function setCacheResolution(normalizedInput, resolution) {
  resolutionCache.set(normalizedInput, {
    data: resolution,
    timestamp: Date.now()
  });
}

/**
 * Try local mapping table lookup
 */
function tryLocalMapping(normalizedInput, exchange = null) {
  console.log(`[tickerResolution] Trying local mapping for: "${normalizedInput}"`);
  console.log(`[tickerResolution] Available keys sample:`, Object.keys(localTickerMapping).slice(0, 10));
  
  if (localTickerMapping[normalizedInput]) {
    const result = localTickerMapping[normalizedInput];
    console.log(`[tickerResolution] Found in local mapping: "${normalizedInput}" -> "${result.ticker}"`);
    
    // Filter by exchange if specified
    if (exchange && result.exchange !== exchange) {
      console.log(`[tickerResolution] Exchange mismatch: required ${exchange}, got ${result.exchange}`);
      return null;
    }
    
    return {
      ticker: result.ticker,
      exchange: result.exchange,
      name: normalizedInput,
      confidence: result.confidence,
      resolvedFrom: 'local_cache'
    };
  }
  console.log(`[tickerResolution] Not found in local mapping: "${normalizedInput}"`);
  return null;
}

/**
 * Try Finnhub API for symbol lookup
 * Requires: FINNHUB_API_KEY env var
 */
async function tryFinnhubLookup(input) {
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) {
    console.log(`[tickerResolution] Finnhub API key not configured`);
    return null;
  }

  try {
    console.log(`[tickerResolution] Calling Finnhub API for input: "${input}"`);
    const response = await fetch(
      `https://finnhub.io/api/v1/search/symbol?q=${encodeURIComponent(input)}&token=${apiKey}`
    );
    
    if (!response.ok) {
      console.log(`[tickerResolution] Finnhub API returned status ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    if (data.result && data.result.length > 0) {
      const results = data.result.map(item => ({
        ticker: item.symbol,
        exchange: item.type === 'Common Stock' ? (item.mic || 'NASDAQ') : item.mic,
        name: item.description || item.symbol,
        confidence: 0.85,
        resolvedFrom: 'finnhub_api'
      }));
      console.log(`[tickerResolution] Finnhub found results:`, results.slice(0, 2).map(r => r.ticker));
      return results;
    }
    console.log(`[tickerResolution] Finnhub returned no results`);
  } catch (error) {
    console.error('[tickerResolution] Finnhub lookup error:', error.message);
  }
  
  return null;
}

/**
 * Try IEX Cloud API for symbol lookup
 * Requires: IEX_CLOUD_API_KEY env var
 */
async function tryIexCloudLookup(input) {
  const apiKey = process.env.IEX_CLOUD_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch(
      `https://cloud.iexapis.com/stable/search/${encodeURIComponent(input)}?token=${apiKey}`
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    
    if (Array.isArray(data) && data.length > 0) {
      return data.map(item => ({
        ticker: item.symbol,
        exchange: item.exchange || 'UNKNOWN',
        name: item.name || item.symbol,
        confidence: 0.88,
        resolvedFrom: 'iex_cloud_api'
      }));
    }
  } catch (error) {
    console.error('IEX Cloud lookup error:', error.message);
  }
  
  return null;
}

/**
 * Fuzzy match against known tickers in local mapping
 */
function fuzzyMatchLocalTickers(normalizedInput, threshold = 0.7) {
  const matches = [];
  
  for (const [company, tickerInfo] of Object.entries(localTickerMapping)) {
    const distance = levenshteinDistance(normalizedInput, company);
    const maxLen = Math.max(normalizedInput.length, company.length);
    const similarity = 1 - (distance / maxLen);
    
    if (similarity >= threshold) {
      matches.push({
        ticker: tickerInfo.ticker,
        exchange: tickerInfo.exchange,
        name: company,
        confidence: Math.round(similarity * 100) / 100,
        resolvedFrom: 'fuzzy_match'
      });
    }
  }
  
  // Sort by confidence descending
  return matches.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Main resolution function with multi-strategy lookup
 * 
 * Strategy priority:
 * 1. Check if it's already a ticker symbol
 * 2. Check resolution cache
 * 3. Try local mapping table
 * 4. Try financial APIs (Finnhub, IEX Cloud)
 * 5. Fall back to fuzzy matching
 * 
 * @param {string} input - Company name or ticker to resolve
 * @param {object} options - Configuration options
 * @param {string} options.exchange - Preferred exchange (e.g., 'NASDAQ', 'NYSE')
 * @param {string} options.provider - Preferred provider ('finnhub', 'iex', 'auto')
 * @param {boolean} options.forceRefresh - Bypass cache
 * 
 * @returns {object|array} Single resolution or array of ambiguous matches
 */
export async function resolveTickerOrCompanyName(input, options = {}) {
  const {
    exchange = null,
    provider = 'auto',
    forceRefresh = false
  } = options;

  // Normalize input
  const normalizedInput = normalizeString(input);
  const trimmedInput = input.trim();

  console.log(`[tickerResolution] Resolving input: "${input}"`, {
    normalized: normalizedInput,
    trimmed: trimmedInput
  });

  // Telemetry event
  const telemetryEvent = {
    type: 'ticker_resolution_attempt',
    input: trimmedInput,
    timestamp: new Date().toISOString()
  };

  // Check if it's already a ticker
  if (isTickerSymbol(trimmedInput.toUpperCase())) {
    telemetryEvent.type = 'ticker_resolution_detected_ticker';
    telemetryEvent.ticker = trimmedInput.toUpperCase();
    telemetryEvent.resolvedFrom = 'input_detection';
    return {
      ticker: trimmedInput.toUpperCase(),
      exchange: exchange || 'UNKNOWN',
      name: null,
      confidence: 1.0,
      resolvedFrom: 'input_detection',
      telemetry: telemetryEvent
    };
  }

  // Check cache
  if (!forceRefresh) {
    const cached = getCachedResolution(normalizedInput);
    if (cached) {
      telemetryEvent.type = 'ticker_resolution_cache_hit';
      telemetryEvent.ticker = cached.ticker;
      cached.telemetry = telemetryEvent;
      return cached;
    }
  }

  // Try local mapping
  const localMatch = tryLocalMapping(normalizedInput, exchange);
  if (localMatch) {
    console.log(`[tickerResolution] Local mapping found: "${normalizedInput}" -> "${localMatch.ticker}"`);
    setCacheResolution(normalizedInput, localMatch);
    telemetryEvent.type = 'symbol_resolved';
    telemetryEvent.ticker = localMatch.ticker;
    telemetryEvent.confidence = localMatch.confidence;
    telemetryEvent.resolvedFrom = 'local_cache';
    localMatch.telemetry = telemetryEvent;
    return localMatch;
  }
  console.log(`[tickerResolution] No local mapping found for "${normalizedInput}", trying APIs...`);

  // Try financial APIs
  let apiResults = [];
  
  if (provider === 'auto' || provider === 'finnhub') {
    const finnhubResults = await tryFinnhubLookup(trimmedInput);
    if (finnhubResults) apiResults = finnhubResults;
  }
  
  if (apiResults.length === 0 && (provider === 'auto' || provider === 'iex')) {
    const iexResults = await tryIexCloudLookup(trimmedInput);
    if (iexResults) apiResults = iexResults;
  }

  // Filter by exchange if specified
  if (exchange && apiResults.length > 0) {
    const filtered = apiResults.filter(r => r.exchange === exchange);
    if (filtered.length > 0) apiResults = filtered;
  }

  if (apiResults.length > 0) {
    // Sort by confidence
    apiResults.sort((a, b) => b.confidence - a.confidence);
    
    const topResult = apiResults[0];
    setCacheResolution(normalizedInput, topResult);
    
    if (apiResults.length === 1) {
      telemetryEvent.type = 'symbol_resolved';
      telemetryEvent.ticker = topResult.ticker;
      telemetryEvent.confidence = topResult.confidence;
      telemetryEvent.resolvedFrom = topResult.resolvedFrom;
      topResult.telemetry = telemetryEvent;
      return topResult;
    } else {
      // Ambiguous - multiple matches
      telemetryEvent.type = 'symbol_ambiguous';
      telemetryEvent.matches = apiResults.length;
      telemetryEvent.candidates = apiResults.slice(0, 3).map(r => ({
        ticker: r.ticker,
        confidence: r.confidence
      }));
      
      return {
        matches: apiResults,
        confidence: 'ambiguous',
        resolvedFrom: 'api_search',
        telemetry: telemetryEvent
      };
    }
  }

  // Fall back to fuzzy matching
  const fuzzyMatches = fuzzyMatchLocalTickers(normalizedInput, 0.65);
  
  if (fuzzyMatches.length > 0) {
    if (fuzzyMatches.length === 1 && fuzzyMatches[0].confidence > 0.85) {
      // High confidence single match
      const result = fuzzyMatches[0];
      setCacheResolution(normalizedInput, result);
      
      telemetryEvent.type = 'symbol_resolved';
      telemetryEvent.ticker = result.ticker;
      telemetryEvent.confidence = result.confidence;
      telemetryEvent.resolvedFrom = 'fuzzy_match';
      result.telemetry = telemetryEvent;
      return result;
    } else {
      // Ambiguous fuzzy matches
      telemetryEvent.type = 'symbol_ambiguous';
      telemetryEvent.matches = fuzzyMatches.length;
      telemetryEvent.candidates = fuzzyMatches.slice(0, 3).map(r => ({
        ticker: r.ticker,
        confidence: r.confidence
      }));
      
      return {
        matches: fuzzyMatches,
        confidence: 'ambiguous',
        resolvedFrom: 'fuzzy_match',
        telemetry: telemetryEvent
      };
    }
  }

  // Try OpenAI as last resort
  console.log(`[tickerResolution] Trying OpenAI to resolve: "${trimmedInput}"`);
  try {
    const { resolveTickerWithOpenAI } = await import('./openaiService.js');
    const aiResult = await resolveTickerWithOpenAI(trimmedInput);
    
    if (aiResult && aiResult.ticker) {
      console.log(`[tickerResolution] OpenAI resolved: "${trimmedInput}" -> "${aiResult.ticker}"`);
      setCacheResolution(normalizedInput, aiResult);
      
      telemetryEvent.type = 'symbol_resolved';
      telemetryEvent.ticker = aiResult.ticker;
      telemetryEvent.confidence = aiResult.confidence;
      telemetryEvent.resolvedFrom = 'openai';
      aiResult.telemetry = telemetryEvent;
      return aiResult;
    }
  } catch (error) {
    console.error('[tickerResolution] OpenAI resolution error:', error.message);
  }

  // Not found
  telemetryEvent.type = 'symbol_not_found';
  
  return {
    ticker: null,
    exchange: null,
    name: trimmedInput,
    confidence: 0,
    resolvedFrom: 'not_found',
    telemetry: telemetryEvent
  };
}

/**
 * Clear resolution cache or specific entry
 */
export function clearResolutionCache(normalizedInput = null) {
  if (normalizedInput === null) {
    resolutionCache.clear();
  } else {
    resolutionCache.delete(normalizedInput);
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return {
    size: resolutionCache.size,
    entries: Array.from(resolutionCache.entries()).map(([key, value]) => ({
      input: key,
      ticker: value.data.ticker,
      age: Date.now() - value.timestamp
    }))
  };
}

/**
 * Extend local ticker mapping with additional entries
 */
export function addLocalMapping(companyName, ticker, exchange = 'NASDAQ', confidence = 0.99) {
  const normalized = normalizeString(companyName);
  localTickerMapping[normalized] = { ticker, exchange, confidence };
}
