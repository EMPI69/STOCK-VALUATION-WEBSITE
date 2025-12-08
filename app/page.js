'use client';

import { useState } from 'react';

export default function Home() {
  const [ticker, setTicker] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const response = await fetch(`/api/valuation?ticker=${ticker}`);
      const result = await response.json();
      if (response.ok) {
        setData(result);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to fetch data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">AI Stock Valuation Analyzer</h1>
          <p className="text-lg text-gray-600">
            Check if a stock is undervalued, overvalued, or fairly valued using EV/EBITDA and cash flow multiples.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              value={ticker}
              onChange={(e) => setTicker(e.target.value)}
              placeholder="Enter Stock Name or Ticker (e.g. AAPL, TSLA, RELIANCE.NS)"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Analyzing...' : 'Search / Analyze'}
            </button>
          </div>
        </form>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-8">
            {error}
          </div>
        )}

        {data && (
          <div className="space-y-6">
            {/* Company Overview */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-semibold mb-4">Company Overview</h2>
              <p><strong>Ticker:</strong> {data.ticker}</p>
              <p><strong>Company Name:</strong> {data.companyName}</p>
              <p><strong>Sector:</strong> {data.sector}</p>
            </div>

            {/* Key Raw Numbers */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-semibold mb-4">Key Raw Numbers</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 rounded">
                  <p className="text-sm text-gray-600">Enterprise Value (EV)</p>
                  <p className="text-lg font-semibold">${data.rawData.ev.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded">
                  <p className="text-sm text-gray-600">EBITDA</p>
                  <p className="text-lg font-semibold">${data.rawData.ebitda.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded">
                  <p className="text-sm text-gray-600">EV/EBITDA</p>
                  <p className="text-lg font-semibold">{data.calculations.evEbitda.toFixed(2)}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded">
                  <p className="text-sm text-gray-600">Operating Cash Flow (OCF)</p>
                  <p className="text-lg font-semibold">${data.rawData.operatingCashFlow.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded">
                  <p className="text-sm text-gray-600">Market Capitalization</p>
                  <p className="text-lg font-semibold">${data.rawData.marketCap.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded">
                  <p className="text-sm text-gray-600">Lower Range (OCF × 30)</p>
                  <p className="text-lg font-semibold">${data.calculations.cashFlowLower.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded">
                  <p className="text-sm text-gray-600">Upper Range (OCF × 35)</p>
                  <p className="text-lg font-semibold">${data.calculations.cashFlowUpper.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Interpretation Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-2">EV/EBITDA Verdict</h3>
                <p className={`text-lg font-bold ${data.verdicts.evVerdict === 'undervalued' ? 'text-green-600' : data.verdicts.evVerdict === 'overvalued' ? 'text-red-600' : 'text-yellow-600'}`}>
                  {data.verdicts.evVerdict.toUpperCase()}
                </p>
                <p>EV/EBITDA = {data.calculations.evEbitda.toFixed(2)} ({data.calculations.evEbitda < 20 ? '< 20' : '> 20'})</p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-2">Cash Flow Valuation Verdict</h3>
                <p className={`text-lg font-bold ${data.verdicts.cfVerdict === 'undervalued' ? 'text-green-600' : data.verdicts.cfVerdict === 'overvalued' ? 'text-red-600' : 'text-yellow-600'}`}>
                  {data.verdicts.cfVerdict.toUpperCase()}
                </p>
                <p>Market Cap: ${data.rawData.marketCap.toLocaleString()}</p>
                <p>Range: ${data.calculations.cashFlowLower.toLocaleString()} - ${data.calculations.cashFlowUpper.toLocaleString()}</p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-2">Overall Conclusion</h3>
                <p className={`text-lg font-bold ${data.verdicts.overall === 'undervalued' ? 'text-green-600' : data.verdicts.overall === 'overvalued' ? 'text-red-600' : 'text-yellow-600'}`}>
                  {data.verdicts.overall.toUpperCase()}
                </p>
                <p className="text-sm text-gray-600">{data.interpretation}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
