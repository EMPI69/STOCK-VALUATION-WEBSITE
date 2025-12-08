import { NextResponse } from 'next/server';

// Alpha Vantage API key - put your key here
const API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
const BASE_URL = 'https://www.alphavantage.co/query';

// Function to fetch financial data
async function fetchFinancialData(ticker) {
  try {
    // Fetch income statement
    const incomeResponse = await fetch(`${BASE_URL}?function=INCOME_STATEMENT&symbol=${ticker}&apikey=${API_KEY}`);
    const incomeData = await incomeResponse.json();

    // Fetch balance sheet
    const balanceResponse = await fetch(`${BASE_URL}?function=BALANCE_SHEET&symbol=${ticker}&apikey=${API_KEY}`);
    const balanceData = await balanceResponse.json();

    // Fetch cash flow
    const cashFlowResponse = await fetch(`${BASE_URL}?function=CASH_FLOW&symbol=${ticker}&apikey=${API_KEY}`);
    const cashFlowData = await cashFlowResponse.json();

    // Fetch quote for market cap (need shares outstanding and price)
    const quoteResponse = await fetch(`${BASE_URL}?function=GLOBAL_QUOTE&symbol=${ticker}&apikey=${API_KEY}`);
    const quoteData = await quoteResponse.json();

    if (!incomeData.annualReports || !balanceData.annualReports || !cashFlowData.annualReports || !quoteData['Global Quote']) {
      throw new Error('Invalid data received from API');
    }

    // Get latest annual data
    const latestIncome = incomeData.annualReports[0];
    const latestBalance = balanceData.annualReports[0];
    const latestCashFlow = cashFlowData.annualReports[0];
    const quote = quoteData['Global Quote'];

    // Calculate values
    const ebitda = parseFloat(latestIncome.ebitda);
    const operatingCashFlow = parseFloat(latestCashFlow.operatingCashFlow);
    const totalDebt = parseFloat(latestBalance.totalLiabilities) - parseFloat(latestBalance.totalCurrentLiabilities) + parseFloat(latestBalance.longTermDebt);
    const cashAndEquivalents = parseFloat(latestBalance.cashAndCashEquivalentsAtCarryingValue);
    const marketCap = parseFloat(quote['05. price']) * parseFloat(quote['06. volume']); // Approximate, better to get shares outstanding

    // Actually, Alpha Vantage doesn't provide shares outstanding directly. For simplicity, use market cap from quote if available, but it's not.
    // Alpha Vantage GLOBAL_QUOTE gives price and volume, but volume is daily volume, not shares outstanding.
    // This is a problem. Alpha Vantage doesn't have market cap directly.

    // For demo, I'll assume we have market cap. In real app, might need another API or calculate differently.

    // Let's use Finnhub or another API that has market cap.

    // To fix, I'll change to Finnhub, which has free tier and market cap.

    // Finnhub API
    const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
    const finnhubResponse = await fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${ticker}&token=${FINNHUB_API_KEY}`);
    const finnhubData = await finnhubResponse.json();

    const marketCap = finnhubData.marketCapitalization * 1000000; // in millions

    const ev = marketCap + totalDebt - cashAndEquivalents;

    return {
      ev,
      ebitda,
      operatingCashFlow,
      marketCap,
      companyName: finnhubData.name,
      sector: finnhubData.finnhubIndustry
    };
  } catch (error) {
    throw new Error('Failed to fetch financial data: ' + error.message);
  }
}

// Calculation functions
function calculateEvToEbitda(ev, ebitda) {
  return ev / ebitda;
}

function calculateCashFlowRange(ocf) {
  return {
    lower: ocf * 30,
    upper: ocf * 35
  };
}

function interpretEvToEbitda(ratio) {
  if (ratio < 20) return 'undervalued';
  if (ratio > 20) return 'overvalued';
  return 'fairly valued';
}

function interpretCashFlowRange(lower, upper, marketCap) {
  if (marketCap < lower) return 'undervalued';
  if (marketCap > upper) return 'overvalued';
  return 'fairly valued';
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const ticker = searchParams.get('ticker');

  if (!ticker) {
    return NextResponse.json({ error: 'Ticker is required' }, { status: 400 });
  }

  try {
    const data = await fetchFinancialData(ticker);
    const evEbitda = calculateEvToEbitda(data.ev, data.ebitda);
    const cashFlowRange = calculateCashFlowRange(data.operatingCashFlow);
    const evVerdict = interpretEvToEbitda(evEbitda);
    const cfVerdict = interpretCashFlowRange(cashFlowRange.lower, cashFlowRange.upper, data.marketCap);

    let overall;
    if (evVerdict === 'undervalued' && cfVerdict === 'undervalued') {
      overall = 'undervalued';
    } else if (evVerdict === 'overvalued' && cfVerdict === 'overvalued') {
      overall = 'overvalued';
    } else {
      overall = 'fairly valued';
    }

    const response = {
      ticker: ticker.toUpperCase(),
      companyName: data.companyName,
      sector: data.sector,
      rawData: {
        ev: data.ev,
        ebitda: data.ebitda,
        operatingCashFlow: data.operatingCashFlow,
        marketCap: data.marketCap
      },
      calculations: {
        evEbitda,
        cashFlowLower: cashFlowRange.lower,
        cashFlowUpper: cashFlowRange.upper
      },
      verdicts: {
        evVerdict,
        cfVerdict,
        overall
      },
      interpretation: `EV/EBITDA suggests the stock is ${evVerdict}, and the cash flow valuation range indicates ${cfVerdict}. Overall, this stock appears ${overall} based on these metrics.`
    };

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}