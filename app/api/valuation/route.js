import { NextResponse } from 'next/server';
import { resolveTickerOrCompanyName, clearResolutionCache, getCacheStats } from '../../../lib/tickerResolution.js';
import { enhanceQueryWithTicker, generateValuationAnalysis, isOpenAIConfigured } from '../../../lib/openaiService.js';
import { getDemoData, hasDemoData } from '../../../lib/demoData.js';

// Alpha Vantage API key
const API_KEY = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY || process.env.ALPHA_VANTAGE_API_KEY;
const BASE_URL = 'https://www.alphavantage.co/query';

// Function to fetch real-time price and 7-day history
async function fetchPriceHistory(ticker) {
  try {
    if (!API_KEY) {
      console.warn('Alpha Vantage API key not configured, returning null for price history');
      return null;
    }

    // Fetch daily time series data
    const response = await fetch(
      `${BASE_URL}?function=TIME_SERIES_DAILY&symbol=${ticker}&apikey=${API_KEY}&outputsize=compact`
    );
    const data = await response.json();

    if (data.Note || data.Error) {
      console.warn(`Price history API error: ${data.Note || data.Error}`);
      return null;
    }

    if (!data['Time Series (Daily)']) {
      console.warn(`No time series data for ${ticker}`);
      return null;
    }

    // Get last 7 trading days (5 business days in the week)
    const timeSeries = data['Time Series (Daily)'];
    const dates = Object.keys(timeSeries).slice(0, 7); // Get last 7 days
    
    const priceHistory = dates.map((date) => {
      const dayData = timeSeries[date];
      const price = parseFloat(dayData['4. close']);
      const dateObj = new Date(date);
      const displayDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const dayOfWeek = dateObj.getDay();
      
      return { date, displayDate, price, dayOfWeek };
    }).reverse(); // Reverse to show oldest to newest

    return priceHistory.length > 0 ? priceHistory : null;
  } catch (error) {
    console.error('Error fetching price history:', error);
    return null;
  }
}

// Function to fetch financial data
async function fetchFinancialData(ticker) {
  try {
    console.log(`Fetching financial data for ticker: ${ticker}`);
    
    // Fetch income statement
    const incomeResponse = await fetch(`${BASE_URL}?function=INCOME_STATEMENT&symbol=${ticker}&apikey=${API_KEY}`);
    const incomeData = await incomeResponse.json();
    console.log(`Income statement response:`, { hasAnnualReports: !!incomeData.annualReports, hasNote: !!incomeData.Note });

    // Fetch balance sheet
    const balanceResponse = await fetch(`${BASE_URL}?function=BALANCE_SHEET&symbol=${ticker}&apikey=${API_KEY}`);
    const balanceData = await balanceResponse.json();

    // Fetch cash flow
    const cashFlowResponse = await fetch(`${BASE_URL}?function=CASH_FLOW&symbol=${ticker}&apikey=${API_KEY}`);
    const cashFlowData = await cashFlowResponse.json();

    // Fetch quote for market cap (need shares outstanding and price)
    const quoteResponse = await fetch(`${BASE_URL}?function=GLOBAL_QUOTE&symbol=${ticker}&apikey=${API_KEY}`);
    const quoteData = await quoteResponse.json();

    // Check for API rate limit or error messages
    if (incomeData.Note || balanceData.Note || cashFlowData.Note || quoteData.Note) {
      const message = incomeData.Note || balanceData.Note || cashFlowData.Note || quoteData.Note;
      console.error(`API rate limit or error: ${message}`);
      throw new Error('Alpha Vantage API: ' + message);
    }

    if (incomeData.Information || balanceData.Information || cashFlowData.Information || quoteData.Information) {
      const message = incomeData.Information || balanceData.Information || cashFlowData.Information || quoteData.Information;
      console.error(`API information message: ${message}`);
      throw new Error('API error: ' + message);
    }

    if (!incomeData.annualReports || !balanceData.annualReports || !cashFlowData.annualReports || !quoteData['Global Quote']) {
      const missingData = [];
      if (!incomeData.annualReports) {
        missingData.push('income statement');
        console.log('Income data:', { keys: Object.keys(incomeData).slice(0, 5) });
      }
      if (!balanceData.annualReports) {
        missingData.push('balance sheet');
        console.log('Balance data:', { keys: Object.keys(balanceData).slice(0, 5) });
      }
      if (!cashFlowData.annualReports) {
        missingData.push('cash flow');
        console.log('Cash flow data:', { keys: Object.keys(cashFlowData).slice(0, 5) });
      }
      if (!quoteData['Global Quote']) {
        missingData.push('quote data');
        console.log('Quote data:', { keys: Object.keys(quoteData).slice(0, 5) });
      }
      throw new Error(`Could not fetch: ${missingData.join(', ')}. Could not retrieve financial data for ticker "${ticker}". This may indicate the ticker is invalid, data is unavailable, or the Alpha Vantage API is rate limited.`);
    }

    // Get latest annual data
    const latestIncome = incomeData.annualReports[0];
    const latestBalance = balanceData.annualReports[0];
    const latestCashFlow = cashFlowData.annualReports[0];
    const quote = quoteData['Global Quote'];

    // Calculate values
    const ebitda = parseFloat(latestIncome.ebitda) || 0;
    const netIncome = parseFloat(latestIncome.netIncome) || 0;
    const totalRevenue = parseFloat(latestIncome.totalRevenue) || 0;
    const operatingCashFlow = parseFloat(latestCashFlow.operatingCashFlow) || 0;
    const totalDebt = parseFloat(latestBalance.totalLiabilities) - parseFloat(latestBalance.totalCurrentLiabilities) + parseFloat(latestBalance.longTermDebt);
    const cashAndEquivalents = parseFloat(latestBalance.cashAndCashEquivalentsAtCarryingValue) || 0;
    const totalAssets = parseFloat(latestBalance.totalAssets) || 0;
    const totalLiabilities = parseFloat(latestBalance.totalLiabilities) || 0;

    // Finnhub API for market cap
    const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
    const finnhubResponse = await fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${ticker}&token=${FINNHUB_API_KEY}`);
    const finnhubData = await finnhubResponse.json();

    // Check if Finnhub returned valid data
    if (!finnhubData || !finnhubData.marketCapitalization) {
      console.warn(`Finnhub data incomplete for ${ticker}, using fallback calculation`);
    }

    const marketCap = finnhubData.marketCapitalization ? finnhubData.marketCapitalization * 1000000 : 0; // in millions
    const ev = marketCap + totalDebt - cashAndEquivalents;

    return {
      ev,
      ebitda,
      netIncome,
      totalRevenue,
      operatingCashFlow,
      marketCap,
      totalAssets,
      totalLiabilities,
      companyName: finnhubData.name,
      sector: finnhubData.finnhubIndustry
    };
  } catch (error) {
    throw new Error('Failed to fetch financial data: ' + error.message);
  }
}

// Comprehensive Valuation Calculation Functions
function calculateValuationMetrics(data) {
  const { ev, ebitda, operatingCashFlow, netIncome, marketCap, totalAssets, totalLiabilities } = data;
  
  const metrics = {};
  let verdictScores = [];

  // 1. EV/EBITDA Analysis (user-specified rule: threshold 20)
  if (ebitda && ebitda > 0) {
    metrics.evEbitda = ev / ebitda;
    let evEbitdaVerdict = 'fairly valued';
    if (metrics.evEbitda < 20) evEbitdaVerdict = 'undervalued';
    else if (metrics.evEbitda > 20) evEbitdaVerdict = 'overvalued';
    verdictScores.push({ metric: 'EV/EBITDA', value: metrics.evEbitda.toFixed(2), verdict: evEbitdaVerdict, weight: 1 });
    metrics.evEbitdaExplanation = 'EV/EBITDA is a popular valuation multiple used to compare a company’s value to its operational profitability, independent of capital structure and non-cash expenses.';
  }

  // 2. Price to Earnings (P/E) Analysis via Market Cap to Net Income
  if (netIncome && netIncome > 0) {
    metrics.pe = marketCap / netIncome;
    const peVerdict = metrics.pe < 15 ? 'undervalued' : metrics.pe > 25 ? 'overvalued' : 'fairly valued';
    verdictScores.push({ metric: 'P/E Ratio', value: metrics.pe.toFixed(2), verdict: peVerdict, weight: 1 });
  }

  // 3. Price to Book (P/B) Analysis
  if (totalAssets && totalLiabilities) {
    const bookValue = totalAssets - totalLiabilities;
    if (bookValue > 0) {
      metrics.pb = marketCap / bookValue;
      const pbVerdict = metrics.pb < 1.5 ? 'undervalued' : metrics.pb > 3 ? 'overvalued' : 'fairly valued';
      verdictScores.push({ metric: 'P/B Ratio', value: metrics.pb.toFixed(2), verdict: pbVerdict, weight: 0.8 });
    }
  }

  // 4. EV/Revenue Analysis
  if (data.totalRevenue && data.totalRevenue > 0) {
    metrics.evRevenue = ev / data.totalRevenue;
    const evRevenueVerdict = metrics.evRevenue < 2 ? 'undervalued' : metrics.evRevenue > 5 ? 'overvalued' : 'fairly valued';
    verdictScores.push({ metric: 'EV/Revenue', value: metrics.evRevenue.toFixed(2), verdict: evRevenueVerdict, weight: 0.8 });
  }

  // 5. Dividend Yield / Free Cash Flow Yield
  if (operatingCashFlow && operatingCashFlow > 0) {
    metrics.fcfYield = (operatingCashFlow / marketCap) * 100;
    const fcfYieldVerdict = metrics.fcfYield > 5 ? 'undervalued' : metrics.fcfYield < 2 ? 'overvalued' : 'fairly valued';
    verdictScores.push({ metric: 'FCF Yield', value: metrics.fcfYield.toFixed(2) + '%', verdict: fcfYieldVerdict, weight: 1 });
  }

  // 7. Cash Flow Based Valuation Range (OCF * 30 to 35)
  if (operatingCashFlow && operatingCashFlow > 0) {
    metrics.cashFlowLower = operatingCashFlow * 30;
    metrics.cashFlowUpper = operatingCashFlow * 35;
    let cfVerdict = 'fairly valued';
    if (marketCap >= metrics.cashFlowLower && marketCap <= metrics.cashFlowUpper) cfVerdict = 'fairly valued';
    else if (marketCap < metrics.cashFlowLower) cfVerdict = 'undervalued';
    else if (marketCap > metrics.cashFlowUpper) cfVerdict = 'overvalued';
    verdictScores.push({ metric: 'CashFlowMultiple', value: `${metrics.cashFlowLower.toFixed(0)} - ${metrics.cashFlowUpper.toFixed(0)}`, verdict: cfVerdict, weight: 1 });
    metrics.cashFlowExplanation = 'This is a simplified cash flow multiple valuation. High-quality companies often trade at 30–35× operating cash flow.';
  }

  // 6. Debt to Equity Ratio
  if (totalAssets && totalLiabilities) {
    const bookValue = totalAssets - totalLiabilities;
    if (bookValue > 0) {
      metrics.debtToEquity = totalLiabilities / bookValue;
      const debtVerdict = metrics.debtToEquity < 1 ? 'undervalued' : metrics.debtToEquity > 2 ? 'overvalued' : 'fairly valued';
      verdictScores.push({ metric: 'Debt/Equity', value: metrics.debtToEquity.toFixed(2), verdict: debtVerdict, weight: 0.6 });
    }
  }

  return { metrics, verdictScores };
}

function calculateOverallValuation(verdictScores) {
  if (verdictScores.length === 0) {
    return { verdict: 'insufficient data', confidence: 0, reasoning: 'Not enough data to determine valuation' };
  }

  // Weight each verdict
  let undervaluedScore = 0;
  let overvaluedScore = 0;
  let fairlyValuedScore = 0;
  let totalWeight = 0;

  verdictScores.forEach(score => {
    const weight = score.weight || 1;
    totalWeight += weight;
    
    if (score.verdict === 'undervalued') {
      undervaluedScore += weight;
    } else if (score.verdict === 'overvalued') {
      overvaluedScore += weight;
    } else {
      fairlyValuedScore += weight;
    }
  });

  // Normalize scores
  undervaluedScore /= totalWeight;
  overvaluedScore /= totalWeight;
  fairlyValuedScore /= totalWeight;

  // Determine overall verdict
  let verdict = 'fairly valued';
  let confidence = 0;
  let reasoning = '';

  if (undervaluedScore > 0.5) {
    verdict = 'undervalued';
    confidence = Math.round(undervaluedScore * 100);
    reasoning = `${confidence}% of valuation metrics suggest the stock is undervalued`;
  } else if (overvaluedScore > 0.5) {
    verdict = 'overvalued';
    confidence = Math.round(overvaluedScore * 100);
    reasoning = `${confidence}% of valuation metrics suggest the stock is overvalued`;
  } else {
    verdict = 'fairly valued';
    confidence = Math.round(fairlyValuedScore * 100);
    reasoning = `Valuation metrics are mixed, suggesting the stock is fairly valued`;
  }

  return { verdict, confidence, reasoning };
}

// Generate combined interpretation string using EV/EBITDA and Cash Flow verdicts
function generateCombinedSummary(metrics, verdicts) {
  const evVerdictObj = verdicts.find(v => v.metric === 'EV/EBITDA');
  const cfVerdictObj = verdicts.find(v => v.metric === 'CashFlowMultiple');

  const evText = evVerdictObj ? evVerdictObj.verdict : 'insufficient data for EV/EBITDA';
  const cfText = cfVerdictObj ? cfVerdictObj.verdict : 'insufficient data for cash flow multiple';

  let summary = `EV/EBITDA suggests the stock is ${evText}, and the cash flow valuation range indicates it is ${cfText}.`;

  // Make the final phrasing nicer when both agree
  if (evVerdictObj && cfVerdictObj && evVerdictObj.verdict === cfVerdictObj.verdict) {
    summary = `Both EV/EBITDA and the cash flow valuation range indicate the stock is ${evVerdictObj.verdict}. Overall, this stock appears ${evVerdictObj.verdict} based on these metrics.`;
  }

  return summary;
}

// POST handler: accepts JSON body with either { ticker } OR raw numbers { ev, ebitda, operatingCashFlow, marketCap }
export async function POST(request) {
  try {
    const body = await request.json();

    let ticker = body.ticker;
    let data;

    // If ticker input is provided, resolve it first
    if (ticker && typeof ticker === 'string') {
      const resolution = await resolveTickerOrCompanyName(ticker, {
        exchange: body.exchange || null,
        provider: body.provider || 'auto'
      });

      if (!resolution.ticker) {
        return NextResponse.json({
          error: 'ticker_not_found',
          message: `Could not resolve "${ticker}" to a ticker symbol`
        }, { status: 404 });
      }

      ticker = resolution.ticker;
      data = await fetchFinancialData(ticker);
    } else if (body.ticker) {
      // Direct ticker provided
      data = await fetchFinancialData(body.ticker.toUpperCase());
      ticker = body.ticker.toUpperCase();
    } else {
      // Validate raw inputs
      const required = ['ev', 'ebitda', 'operatingCashFlow', 'marketCap'];
      for (const key of required) {
        if (body[key] === undefined || body[key] === null || isNaN(Number(body[key]))) {
          return NextResponse.json({ error: `Missing or invalid field: ${key}` }, { status: 400 });
        }
      }

      data = {
        ev: Number(body.ev),
        ebitda: Number(body.ebitda),
        operatingCashFlow: Number(body.operatingCashFlow),
        marketCap: Number(body.marketCap),
        totalAssets: Number(body.totalAssets) || 0,
        totalLiabilities: Number(body.totalLiabilities) || 0,
        netIncome: Number(body.netIncome) || 0,
        totalRevenue: Number(body.totalRevenue) || 0,
        companyName: body.companyName || null,
        sector: body.sector || null
      };
    }

    const { metrics, verdictScores } = calculateValuationMetrics(data);
    const overallValuation = calculateOverallValuation(verdictScores);
    const combinedSummary = generateCombinedSummary(metrics, verdictScores);

    const response = {
      ticker: ticker || null,
      companyName: data.companyName || null,
      sector: data.sector || null,
      rawData: {
        marketCap: data.marketCap,
        enterpriseValue: data.ev,
        netIncome: data.netIncome,
        revenue: data.totalRevenue,
        operatingCashFlow: data.operatingCashFlow,
        totalAssets: data.totalAssets,
        totalLiabilities: data.totalLiabilities
      },
      metrics,
      verdicts: verdictScores,
      overall: {
        verdict: overallValuation.verdict,
        confidence: overallValuation.confidence,
        reasoning: overallValuation.reasoning
      },
      interpretation: combinedSummary
    };

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  let input = searchParams.get('ticker');
  const includeAIAnalysis = searchParams.get('includeAI') === 'true';

  if (!input) {
    return NextResponse.json({ error: 'Ticker or company name is required' }, { status: 400 });
  }

  try {
    // Step 1: Resolve ticker or company name
    const resolution = await resolveTickerOrCompanyName(input, {
      exchange: searchParams.get('exchange') || null,
      provider: searchParams.get('provider') || 'auto',
      forceRefresh: searchParams.get('refresh') === 'true'
    });

    // Handle ambiguous matches
    if (resolution.confidence === 'ambiguous') {
      return NextResponse.json({
        error: 'ambiguous_ticker',
        message: 'Multiple matches found for your search',
        candidates: resolution.matches.map(m => ({
          ticker: m.ticker,
          name: m.name,
          exchange: m.exchange,
          confidence: m.confidence
        })),
        telemetry: resolution.telemetry
      }, { status: 400 });
    }

    // Handle not found
    if (!resolution.ticker) {
      // Log analytics event
      console.log('Symbol not found:', { input, timestamp: new Date().toISOString() });
      
      return NextResponse.json({
        error: 'ticker_not_found',
        message: `Could not resolve "${input}" to a ticker symbol`,
        suggestion: 'Try searching with a company ticker symbol (e.g., AAPL, NVDA) or a more specific company name',
        telemetry: resolution.telemetry
      }, { status: 404 });
    }

    const resolvedTicker = resolution.ticker;

    // Debug: Log what we resolved
    console.log(`Resolved "${input}" to ticker: "${resolvedTicker}"`, {
      resolvedFrom: resolution.resolvedFrom,
      confidence: resolution.confidence
    });

    // Step 2: Fetch financial data using resolved ticker
    let data;
    let priceHistory = null;
    
    data = await fetchFinancialData(resolvedTicker);
    // Try to fetch real-time price history if API is configured
    if (API_KEY) {
      const realPriceHistory = await fetchPriceHistory(resolvedTicker);
      if (realPriceHistory) {
        priceHistory = realPriceHistory;
      }
    }
    
    // If using demo data and don't have price history yet, get it
    if (!priceHistory && hasDemoData(resolvedTicker)) {
      priceHistory = getDemoData(resolvedTicker).priceHistory;
    }
    
    const { metrics, verdictScores } = calculateValuationMetrics(data);
    const overallValuation = calculateOverallValuation(verdictScores);
    const combinedSummary = generateCombinedSummary(metrics, verdictScores);

    const response = {
      ticker: resolvedTicker,
      companyName: data.companyName,
      sector: data.sector,
      priceHistory: priceHistory || [],
      rawData: {
        marketCap: data.marketCap,
        enterpriseValue: data.ev,
        netIncome: data.netIncome,
        revenue: data.totalRevenue,
        operatingCashFlow: data.operatingCashFlow,
        totalAssets: data.totalAssets,
        totalLiabilities: data.totalLiabilities
      },
      metrics,
      verdicts: verdictScores,
      overall: {
        verdict: overallValuation.verdict,
        confidence: overallValuation.confidence,
        reasoning: overallValuation.reasoning
      },
      interpretation: combinedSummary,
      telemetry: resolution.telemetry
    };

    // Step 3: Add AI analysis if requested and OpenAI is configured
    if (includeAIAnalysis && isOpenAIConfigured()) {
      try {
        const aiAnalysis = await generateValuationAnalysis(
          resolvedTicker,
          data.companyName,
          response
        );
        response.aiAnalysis = aiAnalysis;
      } catch (aiError) {
        console.error('AI analysis failed:', aiError.message);
        response.aiAnalysisError = aiError.message;
      }
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Valuation lookup error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
