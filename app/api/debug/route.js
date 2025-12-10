import { NextResponse } from 'next/server';

/**
 * Debug endpoint to test ticker resolution and API calls
 * GET /api/debug?ticker=NVIDIA
 */

const API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
const BASE_URL = 'https://www.alphavantage.co/query';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const ticker = searchParams.get('ticker');

  if (!ticker) {
    return NextResponse.json({
      error: 'ticker parameter required',
      example: '/api/debug?ticker=NVDA'
    });
  }

  try {
    const results = {
      ticker: ticker.toUpperCase(),
      timestamp: new Date().toISOString(),
      tests: {}
    };

    // Test 1: Alpha Vantage Quote
    results.tests.quote = {
      url: `${BASE_URL}?function=GLOBAL_QUOTE&symbol=${ticker}&apikey=***`,
      status: 'testing...'
    };
    
    const quoteResponse = await fetch(
      `${BASE_URL}?function=GLOBAL_QUOTE&symbol=${ticker}&apikey=${API_KEY}`
    );
    const quoteData = await quoteResponse.json();
    results.tests.quote = {
      ...results.tests.quote,
      status: quoteResponse.status,
      hasGlobalQuote: !!quoteData['Global Quote'],
      hasNote: !!quoteData.Note,
      hasInformation: !!quoteData.Information,
      data: quoteData
    };

    // Test 2: Alpha Vantage Income Statement
    results.tests.income = {
      url: `${BASE_URL}?function=INCOME_STATEMENT&symbol=${ticker}&apikey=***`,
      status: 'testing...'
    };
    
    const incomeResponse = await fetch(
      `${BASE_URL}?function=INCOME_STATEMENT&symbol=${ticker}&apikey=${API_KEY}`
    );
    const incomeData = await incomeResponse.json();
    results.tests.income = {
      ...results.tests.income,
      status: incomeResponse.status,
      hasAnnualReports: !!incomeData.annualReports,
      hasNote: !!incomeData.Note,
      reportsCount: incomeData.annualReports?.length || 0,
      message: incomeData.Note || incomeData.Information || 'OK'
    };

    // Test 3: Finnhub
    const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
    results.tests.finnhub = {
      url: `https://finnhub.io/api/v1/stock/profile2?symbol=${ticker}&token=***`,
      status: 'testing...'
    };

    const finnhubResponse = await fetch(
      `https://finnhub.io/api/v1/stock/profile2?symbol=${ticker}&token=${FINNHUB_API_KEY}`
    );
    const finnhubData = await finnhubResponse.json();
    results.tests.finnhub = {
      ...results.tests.finnhub,
      status: finnhubResponse.status,
      hasMarketCap: !!finnhubData.marketCapitalization,
      hasName: !!finnhubData.name,
      data: finnhubData
    };

    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json({
      error: error.message,
      ticker: ticker.toUpperCase(),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
