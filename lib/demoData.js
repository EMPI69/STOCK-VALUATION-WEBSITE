/**
 * Demo/test data for development and testing
 * Used when external APIs are unavailable or rate-limited
 */

// Helper function to generate 7-day price history
function generate7DayHistory(basePrice, ticker) {
  const data = [];
  const today = new Date();
  
  // Generate data for last 7 days
  const priceVariation = {
    NVDA: [0.98, 1.02, 0.99, 1.05, 1.01, 0.97, 1.00],
    AAPL: [0.99, 1.01, 1.00, 1.02, 0.98, 0.96, 1.00],
    MSFT: [1.00, 0.99, 1.03, 0.98, 1.02, 0.99, 1.01],
    TSLA: [0.97, 1.04, 0.96, 1.05, 0.99, 1.02, 0.98],
    AMZN: [1.01, 0.98, 1.02, 0.99, 1.03, 0.97, 1.00],
    GOOGL: [0.99, 1.02, 0.98, 1.01, 1.00, 0.99, 1.02]
  };
  
  const variations = priceVariation[ticker] || [0.99, 1.00, 1.01, 0.99, 1.02, 0.98, 1.00];
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dayOfWeek = date.getDay();
    
    // Skip weekends in chart
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      data.push({
        date: date.toISOString().split('T')[0],
        displayDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        price: Math.round(basePrice * variations[6 - i] * 100) / 100,
        dayOfWeek
      });
    }
  }
  
  return data.filter(d => d.dayOfWeek !== 0 && d.dayOfWeek !== 6).slice(-5); // Last 5 trading days
}

const demoData = {
  NVDA: {
    companyName: 'NVIDIA Corporation',
    sector: 'Semiconductors',
    currentPrice: 137.59,
    priceHistory: generate7DayHistory(137.59, 'NVDA'),
    rawData: {
      marketCap: 3400000000000,
      enterpriseValue: 3350000000000,
      netIncome: 60000000000,
      revenue: 608400000000,
      operatingCashFlow: 89000000000,
      totalAssets: 690000000000,
      totalLiabilities: 240000000000
    }
  },
  AAPL: {
    companyName: 'Apple Inc.',
    sector: 'Technology',
    currentPrice: 241.84,
    priceHistory: generate7DayHistory(241.84, 'AAPL'),
    rawData: {
      marketCap: 3200000000000,
      enterpriseValue: 3100000000000,
      netIncome: 93700000000,
      revenue: 383285000000,
      operatingCashFlow: 110000000000,
      totalAssets: 346814000000,
      totalLiabilities: 120000000000
    }
  },
  MSFT: {
    companyName: 'Microsoft Corporation',
    sector: 'Technology',
    currentPrice: 442.80,
    priceHistory: generate7DayHistory(442.80, 'MSFT'),
    rawData: {
      marketCap: 3100000000000,
      enterpriseValue: 3050000000000,
      netIncome: 88100000000,
      revenue: 245122000000,
      operatingCashFlow: 108000000000,
      totalAssets: 422849000000,
      totalLiabilities: 189000000000
    }
  },
  TSLA: {
    companyName: 'Tesla Inc.',
    sector: 'Automotive',
    currentPrice: 308.95,
    priceHistory: generate7DayHistory(308.95, 'TSLA'),
    rawData: {
      marketCap: 1100000000000,
      enterpriseValue: 1050000000000,
      netIncome: 13000000000,
      revenue: 81462000000,
      operatingCashFlow: 17000000000,
      totalAssets: 279724000000,
      totalLiabilities: 65000000000
    }
  },
  AMZN: {
    companyName: 'Amazon.com Inc.',
    sector: 'E-commerce',
    currentPrice: 196.50,
    priceHistory: generate7DayHistory(196.50, 'AMZN'),
    rawData: {
      marketCap: 2100000000000,
      enterpriseValue: 2050000000000,
      netIncome: 30100000000,
      revenue: 575000000000,
      operatingCashFlow: 55000000000,
      totalAssets: 448000000000,
      totalLiabilities: 180000000000
    }
  },
  GOOGL: {
    companyName: 'Alphabet Inc.',
    sector: 'Technology',
    currentPrice: 209.98,
    priceHistory: generate7DayHistory(209.98, 'GOOGL'),
    rawData: {
      marketCap: 2000000000000,
      enterpriseValue: 1950000000000,
      netIncome: 59750000000,
      revenue: 307394000000,
      operatingCashFlow: 93000000000,
      totalAssets: 436000000000,
      totalLiabilities: 95000000000
    }
  },
  NFLX: {
    companyName: 'Netflix Inc.',
    sector: 'Media & Entertainment',
    currentPrice: 285.45,
    priceHistory: generate7DayHistory(285.45, 'NFLX'),
    rawData: {
      marketCap: 130000000000,
      enterpriseValue: 128000000000,
      netIncome: 7000000000,
      revenue: 38000000000,
      operatingCashFlow: 8500000000,
      totalAssets: 45000000000,
      totalLiabilities: 12000000000
    }
  },
  INTC: {
    companyName: 'Intel Corporation',
    sector: 'Semiconductors',
    currentPrice: 23.50,
    priceHistory: generate7DayHistory(23.50, 'INTC'),
    rawData: {
      marketCap: 95000000000,
      enterpriseValue: 90000000000,
      netIncome: 1900000000,
      revenue: 60100000000,
      operatingCashFlow: 11000000000,
      totalAssets: 165000000000,
      totalLiabilities: 45000000000
    }
  },
  AMD: {
    companyName: 'Advanced Micro Devices',
    sector: 'Semiconductors',
    currentPrice: 185.20,
    priceHistory: generate7DayHistory(185.20, 'AMD'),
    rawData: {
      marketCap: 300000000000,
      enterpriseValue: 295000000000,
      netIncome: 2600000000,
      revenue: 22700000000,
      operatingCashFlow: 4500000000,
      totalAssets: 38000000000,
      totalLiabilities: 8000000000
    }
  },
  ORCL: {
    companyName: 'Oracle Corporation',
    sector: 'Software',
    currentPrice: 145.80,
    priceHistory: generate7DayHistory(145.80, 'ORCL'),
    rawData: {
      marketCap: 520000000000,
      enterpriseValue: 510000000000,
      netIncome: 12900000000,
      revenue: 48100000000,
      operatingCashFlow: 18500000000,
      totalAssets: 138000000000,
      totalLiabilities: 42000000000
    }
  },
  CRM: {
    companyName: 'Salesforce Inc.',
    sector: 'Software',
    currentPrice: 370.55,
    priceHistory: generate7DayHistory(370.55, 'CRM'),
    rawData: {
      marketCap: 370000000000,
      enterpriseValue: 365000000000,
      netIncome: 500000000,
      revenue: 35400000000,
      operatingCashFlow: 6000000000,
      totalAssets: 45000000000,
      totalLiabilities: 12000000000
    }
  },
  SPOT: {
    companyName: 'Spotify Technology S.A.',
    sector: 'Media & Entertainment',
    currentPrice: 535.00,
    priceHistory: generate7DayHistory(535.00, 'SPOT'),
    rawData: {
      marketCap: 115000000000,
      enterpriseValue: 110000000000,
      netIncome: 1200000000,
      revenue: 14850000000,
      operatingCashFlow: 2500000000,
      totalAssets: 12000000000,
      totalLiabilities: 4000000000
    }
  },
  UBER: {
    companyName: 'Uber Technologies Inc.',
    sector: 'Transportation',
    currentPrice: 92.35,
    priceHistory: generate7DayHistory(92.35, 'UBER'),
    rawData: {
      marketCap: 190000000000,
      enterpriseValue: 185000000000,
      netIncome: 3700000000,
      revenue: 37200000000,
      operatingCashFlow: 2800000000,
      totalAssets: 35000000000,
      totalLiabilities: 18000000000
    }
  },
  ABNB: {
    companyName: 'Airbnb Inc.',
    sector: 'Travel & Hospitality',
    currentPrice: 280.45,
    priceHistory: generate7DayHistory(280.45, 'ABNB'),
    rawData: {
      marketCap: 145000000000,
      enterpriseValue: 140000000000,
      netIncome: 6100000000,
      revenue: 9700000000,
      operatingCashFlow: 3500000000,
      totalAssets: 18000000000,
      totalLiabilities: 5000000000
    }
  },
  ADBE: {
    companyName: 'Adobe Inc.',
    sector: 'Software',
    currentPrice: 560.00,
    priceHistory: generate7DayHistory(560.00, 'ADBE'),
    rawData: {
      marketCap: 260000000000,
      enterpriseValue: 255000000000,
      netIncome: 4500000000,
      revenue: 20400000000,
      operatingCashFlow: 6500000000,
      totalAssets: 32000000000,
      totalLiabilities: 8000000000
    }
  }
};

/**
 * Get demo data for a ticker
 * Used when external APIs fail or are rate-limited
 */
export function getDemoData(ticker) {
  const upperTicker = ticker.toUpperCase();
  if (demoData[upperTicker]) {
    return demoData[upperTicker];
  }
  return null;
}

/**
 * Check if demo data is available for ticker
 */
export function hasDemoData(ticker) {
  return !!demoData[ticker.toUpperCase()];
}

/**
 * Get all available demo tickers
 */
export function getAvaileDemoTickers() {
  return Object.keys(demoData);
}
