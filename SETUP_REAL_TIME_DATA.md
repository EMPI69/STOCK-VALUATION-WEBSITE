# Real-Time Stock Data Setup Guide

This application can display **real-time stock prices** when you configure API keys. Without them, it falls back to demo data.

## Current Status

- **Without API Keys**: Demo data (sample historical prices)
- **With API Keys**: Real-time market data

## Setting Up Real-Time Data

### Step 1: Get API Keys

#### Alpha Vantage (Required for stock prices and financial data)
1. Visit https://www.alphavantage.co/api/
2. Click "GET FREE API KEY"
3. Fill in your email and confirm
4. Copy your API key

#### Finnhub (Optional, for company information)
1. Visit https://finnhub.io/register?plan=free
2. Create an account
3. Copy your API key from the dashboard

### Step 2: Configure Environment Variables

1. Copy the example file:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` and add your API keys:
   ```
   NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY=your_api_key_here
   NEXT_PUBLIC_FINNHUB_API_KEY=your_api_key_here
   ```

3. Save the file

### Step 3: Restart the Development Server

```bash
npm run dev
```

The app will now fetch real-time data from Alpha Vantage.

## API Rate Limits

- **Alpha Vantage (Free Tier)**: 5 API calls per minute, 500 per day
  - The app caches results to minimize API usage
  - If rate limited, it automatically falls back to demo data
  
- **Finnhub (Free Tier)**: 60 API calls per minute

## What Each API Provides

### Alpha Vantage
- Real-time stock quotes
- 7-day price history
- Financial statements (income, balance sheet, cash flow)
- EBITDA, revenue, net income, etc.

### Finnhub  
- Company name and description
- Market capitalization
- Industry/sector information

## Troubleshooting

### "Using demo data" notice appears
- Check that `.env.local` file exists with your API keys
- Verify API keys are correct
- Check if you've exceeded Alpha Vantage's rate limit (5 calls/min)
- Wait a minute and try again

### "Build error: Module not found: Can't resolve 'recharts'"
- Run `npm install` to install dependencies
- The recharts library is required for price charts

### Real-time data still not working
- Open browser console (F12) and check for errors
- Verify API keys are set in `.env.local`
- Try the debug endpoint: `/api/debug?ticker=NVDA`

## Security Notes

- **DO NOT** commit `.env.local` to version control (it's in `.gitignore`)
- API keys in `.env.local` are safe for development
- For production, use environment variables from your hosting platform
- The `NEXT_PUBLIC_` prefix means these values are sent to the browser (safe for public APIs)
