/**
 * OpenAI Integration Service
 * 
 * Provides AI-powered search and query enhancement for stock analysis
 * Integrates resolved ticker symbols with OpenAI API
 */

/**
 * Use OpenAI to resolve a company name to a ticker symbol
 * Called when local mapping fails
 * 
 * @param {string} companyName - Company name to resolve (e.g., "Netflix")
 * @returns {object} { ticker, companyName, confidence } or null if unable to resolve
 */
export async function resolveTickerWithOpenAI(companyName) {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    console.log('[OpenAI] API key not configured, skipping AI ticker resolution');
    return null;
  }

  try {
    console.log(`[OpenAI] Attempting to resolve "${companyName}" to ticker using AI`);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a financial expert. Your task is to identify the stock ticker symbol for a given company name. Respond ONLY with a JSON object in this format: {"ticker": "SYMBOL", "companyName": "Full Company Name", "confidence": 0.95}. If you cannot identify the company or ticker, respond with {"ticker": null, "confidence": 0}. Do not include any other text.'
          },
          {
            role: 'user',
            content: `What is the ticker symbol for: ${companyName}? Respond only with JSON.`
          }
        ],
        temperature: 0,
        max_tokens: 100
      })
    });

    if (!response.ok) {
      console.error(`[OpenAI] API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('[OpenAI] Unexpected response format');
      return null;
    }

    const content = data.choices[0].message.content.trim();
    console.log(`[OpenAI] Response: ${content}`);
    
    const result = JSON.parse(content);
    
    if (result.ticker && result.ticker !== 'null' && result.ticker !== null) {
      console.log(`[OpenAI] Successfully resolved "${companyName}" to "${result.ticker}"`);
      return {
        ticker: result.ticker.toUpperCase(),
        companyName: result.companyName || companyName,
        confidence: result.confidence || 0.85,
        resolvedFrom: 'openai'
      };
    } else {
      console.log(`[OpenAI] Could not resolve "${companyName}"`);
      return null;
    }
  } catch (error) {
    console.error('[OpenAI] Error during ticker resolution:', error.message);
    return null;
  }
}

/**
 * Call OpenAI API with resolved ticker information
 * 
 * @param {string} userQuery - Original user query (e.g., "nvidia earnings")
 * @param {string} ticker - Resolved ticker symbol (e.g., "NVDA")
 * @param {string} companyName - Company name from resolution
 * @param {object} options - Additional options
 * @returns {object} AI response with enriched analysis
 */
export async function enhanceQueryWithTicker(userQuery, ticker, companyName = null, options = {}) {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is required');
  }

  const {
    model = 'gpt-3.5-turbo',
    temperature = 0.7,
    maxTokens = 500,
    systemPrompt = null
  } = options;

  // Construct enhanced query with ticker context
  const enrichedQuery = constructEnrichedQuery(userQuery, ticker, companyName);
  
  const systemMessage = systemPrompt || getDefaultSystemPrompt(ticker);

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: enrichedQuery }
        ],
        temperature,
        max_tokens: maxTokens
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    
    return {
      success: true,
      query: userQuery,
      ticker,
      companyName,
      aiResponse: data.choices[0]?.message?.content || '',
      usage: {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0
      },
      model: data.model,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('OpenAI API call failed:', error.message);
    throw error;
  }
}

/**
 * Construct enriched query that includes ticker context
 */
function constructEnrichedQuery(userQuery, ticker, companyName) {
  let enriched = userQuery;
  
  // Add ticker reference if not already in query
  if (!enriched.toUpperCase().includes(ticker.toUpperCase())) {
    enriched = `${enriched} (Ticker: ${ticker})`;
  }
  
  // Add company name reference if available and not already in query
  if (companyName && !enriched.toLowerCase().includes(companyName.toLowerCase())) {
    enriched = `${enriched} - ${companyName}`;
  }
  
  return enriched;
}

/**
 * Get default system prompt for stock analysis
 */
function getDefaultSystemPrompt(ticker) {
  return `You are a financial analyst AI assistant specializing in stock analysis and valuation.
You have been asked about ${ticker}.
Provide accurate, balanced analysis based on publicly available information.
Include relevant metrics, trends, and considerations when available.
Always disclaimer that this is for informational purposes and not financial advice.`;
}

/**
 * Generate analysis request to OpenAI with valuation data
 */
export async function generateValuationAnalysis(ticker, companyName, valuationData, userQuery = null) {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is required');
  }

  const analysisContext = constructValuationContext(ticker, companyName, valuationData);
  const userMessage = userQuery || `Provide a comprehensive valuation analysis for ${ticker} (${companyName})`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are a financial analyst. Analyze the following valuation metrics and provide insights:
${analysisContext}

Provide balanced analysis with consideration for market conditions and company fundamentals.`
          },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.7,
        max_tokens: 800
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    
    return {
      success: true,
      ticker,
      companyName,
      analysis: data.choices[0]?.message?.content || '',
      usage: {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0
      },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('OpenAI valuation analysis failed:', error.message);
    throw error;
  }
}

/**
 * Construct context string from valuation data for AI analysis
 */
function constructValuationContext(ticker, companyName, valuationData) {
  let context = `Company: ${companyName} (${ticker})\n\n`;
  context += 'Valuation Metrics:\n';
  
  if (valuationData.metrics) {
    const { metrics } = valuationData;
    
    if (metrics.evEbitda) context += `- EV/EBITDA: ${metrics.evEbitda.toFixed(2)}\n`;
    if (metrics.pe) context += `- P/E Ratio: ${metrics.pe.toFixed(2)}\n`;
    if (metrics.pb) context += `- P/B Ratio: ${metrics.pb.toFixed(2)}\n`;
    if (metrics.evRevenue) context += `- EV/Revenue: ${metrics.evRevenue.toFixed(2)}\n`;
    if (metrics.fcfYield) context += `- FCF Yield: ${metrics.fcfYield.toFixed(2)}%\n`;
    if (metrics.debtToEquity) context += `- Debt/Equity: ${metrics.debtToEquity.toFixed(2)}\n`;
  }
  
  if (valuationData.rawData) {
    const { rawData } = valuationData;
    context += '\nFinancial Data (Latest Annual):\n';
    context += `- Market Cap: $${formatLargeNumber(rawData.marketCap)}\n`;
    context += `- Enterprise Value: $${formatLargeNumber(rawData.enterpriseValue)}\n`;
    context += `- Revenue: $${formatLargeNumber(rawData.revenue)}\n`;
    context += `- Operating Cash Flow: $${formatLargeNumber(rawData.operatingCashFlow)}\n`;
  }
  
  if (valuationData.overall) {
    context += `\nOverall Valuation: ${valuationData.overall.verdict}`;
    context += ` (${valuationData.overall.confidence}% confidence)\n`;
    context += `Reasoning: ${valuationData.overall.reasoning}\n`;
  }
  
  return context;
}

/**
 * Format large numbers for readability (e.g., 1000000 → 1M)
 */
function formatLargeNumber(num) {
  if (!num) return '0';
  
  if (num >= 1e9) {
    return (num / 1e9).toFixed(2) + 'B';
  } else if (num >= 1e6) {
    return (num / 1e6).toFixed(2) + 'M';
  } else if (num >= 1e3) {
    return (num / 1e3).toFixed(2) + 'K';
  }
  
  return num.toFixed(2);
}

/**
 * Search for company or market information using OpenAI
 * Falls back to AI search when ticker is not found
 */
export async function searchCompanyInformation(query, resolvedTicker = null) {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is required');
  }

  const tickerContext = resolvedTicker 
    ? `\nNote: This query is related to ticker symbol ${resolvedTicker}`
    : '\nNote: No ticker symbol could be resolved for this query.';

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are a financial research assistant. Provide accurate information about companies and stocks based on publicly available information. ${tickerContext}`
          },
          {
            role: 'user',
            content: query
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    
    return {
      success: true,
      query,
      ticker: resolvedTicker || null,
      response: data.choices[0]?.message?.content || '',
      usage: {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0
      },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Company information search failed:', error.message);
    throw error;
  }
}

/**
 * Check if OpenAI API key is configured
 */
export function isOpenAIConfigured() {
  return !!process.env.OPENAI_API_KEY;
}

/**
 * Rate limit helper - track API calls per minute
 */
const apiCallTracker = new Map();

export function checkRateLimit(identifier, maxCallsPerMinute = 60) {
  const now = Date.now();
  const oneMinuteAgo = now - 60000;
  
  if (!apiCallTracker.has(identifier)) {
    apiCallTracker.set(identifier, []);
  }
  
  const calls = apiCallTracker.get(identifier);
  const recentCalls = calls.filter(timestamp => timestamp > oneMinuteAgo);
  
  if (recentCalls.length >= maxCallsPerMinute) {
    return {
      allowed: false,
      retryAfter: Math.ceil((recentCalls[0] + 60000 - now) / 1000)
    };
  }
  
  recentCalls.push(now);
  apiCallTracker.set(identifier, recentCalls);
  
  return {
    allowed: true,
    callsRemaining: maxCallsPerMinute - recentCalls.length
  };
}
