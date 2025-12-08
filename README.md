# Stock Valuation Website

A production-ready stock valuation website that analyzes stocks using EV/EBITDA and cash flow multiples to determine if they are undervalued, overvalued, or fairly valued.

## Features

- **Stock Analysis**: Enter any stock ticker to get comprehensive valuation analysis
- **Multiple Metrics**: Uses EV/EBITDA ratio and cash flow-based valuation
- **Real-time Data**: Fetches live financial data from Alpha Vantage and Finnhub APIs
- **Responsive UI**: Clean, professional interface built with Next.js and Tailwind CSS
- **Error Handling**: Graceful error messages for invalid tickers or API failures

## Tech Stack

- **Frontend**: Next.js 14 with React
- **Styling**: Tailwind CSS
- **Backend**: Next.js API Routes
- **APIs**: Alpha Vantage (financial statements), Finnhub (market data)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd stock-valuation-website
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:

Create a `.env.local` file in the root directory and add your API keys:

```env
# Get your free Alpha Vantage API key from: https://www.alphavantage.co/support/#api-key
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_api_key_here

# Get your free Finnhub API key from: https://finnhub.io/
FINNHUB_API_KEY=your_finnhub_api_key_here
```

### Running the Application

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## API Endpoints

### GET /api/valuation?ticker={ticker}

Returns valuation analysis for the specified stock ticker.

**Response:**
```json
{
  "ticker": "AAPL",
  "companyName": "Apple Inc",
  "sector": "Technology",
  "rawData": {
    "ev": 2500000000000,
    "ebitda": 120000000000,
    "operatingCashFlow": 100000000000,
    "marketCap": 2400000000000
  },
  "calculations": {
    "evEbitda": 20.83,
    "cashFlowLower": 3000000000000,
    "cashFlowUpper": 3500000000000
  },
  "verdicts": {
    "evVerdict": "overvalued",
    "cfVerdict": "undervalued",
    "overall": "fairly valued"
  },
  "interpretation": "EV/EBITDA suggests the stock is overvalued, and the cash flow valuation range indicates undervalued. Overall, this stock appears fairly valued based on these metrics."
}
```

## Valuation Methodology

### POST /api/valuation

Accepts JSON body with either `{ "ticker": "AAPL" }` or raw numeric inputs:

```json
{
  "ev": 2500000000000,
  "ebitda": 120000000000,
  "operatingCashFlow": 100000000000,
  "marketCap": 2400000000000
}
```

Example `curl`:

```bash
curl -X POST http://localhost:3000/api/valuation \
  -H "Content-Type: application/json" \
  -d '{"ev":2500000000000,"ebitda":120000000000,"operatingCashFlow":100000000000,"marketCap":2400000000000}'
```

The response JSON matches the GET response format and includes an `interpretation` string that combines the EV/EBITDA and cash-flow multiple results.


### EV/EBITDA Analysis
- **Formula**: EV / EBITDA
- **Undervalued**: EV/EBITDA < 20
- **Overvalued**: EV/EBITDA > 20

### Cash Flow Valuation
- **Range**: Operating Cash Flow × (30 to 35)
- **Undervalued**: Market Cap < Lower Range
- **Overvalued**: Market Cap > Upper Range
- **Fairly Valued**: Market Cap within range

## Project Structure

```
stock-valuation-website/
├── app/
│   ├── api/
│   │   └── valuation/
│   │       └── route.js          # API endpoint for stock valuation
│   ├── globals.css               # Global styles
│   ├── layout.js                 # Root layout
│   └── page.js                   # Main page component
├── .env.local                    # Environment variables (API keys)
├── package.json                  # Dependencies and scripts
└── README.md                     # This file
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Other Platforms

The app can be deployed to any platform supporting Next.js:
- Netlify
- Railway
- Heroku
- DigitalOcean App Platform

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Disclaimer

This tool is for educational and informational purposes only. It is not financial advice. Always do your own research and consult with financial professionals before making investment decisions.
