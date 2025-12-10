'use client';

import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Home() {
  const [ticker, setTicker] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [darkMode, setDarkMode] = useState(false);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const response = await fetch(`/api/valuation?ticker=${encodeURIComponent(ticker)}`);
      const result = await response.json();
      
      if (response.ok) {
        setData(result);
      } else {
        // Handle ambiguous matches
        if (result.error === 'ambiguous_ticker' && result.candidates) {
          const candidateList = result.candidates
            .map(c => `${c.ticker} (${c.exchange})`)
            .join(', ');
          setError(`Multiple matches found: ${candidateList}. Please be more specific.`);
        } else if (result.error === 'ticker_not_found') {
          setError(result.message || 'Could not resolve the company or ticker symbol. Try a different search term.');
        } else {
          setError(result.error || 'An error occurred');
        }
      }
    } catch (err) {
      setError('Failed to fetch data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-gradient-to-b from-slate-900 to-slate-800' : 'bg-gradient-to-b from-slate-50 to-slate-100'}`}>
      {/* Navigation Bar */}
      <nav className={`${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} border-b shadow-sm sticky top-0 z-50 transition-colors duration-300`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-10">
              <h1 className="text-2xl font-bold text-blue-600">Stock Analyzer</h1>
              <div className="hidden md:flex gap-8 text-sm font-medium">
                <button onClick={() => scrollToSection('hero')} className={`${darkMode ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'} transition-colors cursor-pointer`}>Home</button>
                <button onClick={() => scrollToSection('metrics')} className={`${darkMode ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'} transition-colors cursor-pointer`}>Valuation Metrics</button>
                <button onClick={() => scrollToSection('overview')} className={`${darkMode ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'} transition-colors cursor-pointer`}>Financial Overview</button>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* Dark Mode Toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  darkMode
                    ? 'bg-slate-700 text-yellow-400 hover:bg-slate-600'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
                title="Toggle dark mode"
              >
                {darkMode ? '☀️ Light' : '🌙 Dark'}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero Section */}
        <div id="hero" className="text-center mb-16">
          <h2 className={`text-5xl md:text-6xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Stock Valuation Analyzer</h2>
          <p className={`text-xl mb-10 max-w-2xl mx-auto ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Get comprehensive valuation insights using multiple financial metrics and multi-factor analysis.</p>
        </div>

        {/* Search Section */}
        <form onSubmit={handleSubmit} className="mb-16">
          <div className="flex flex-col gap-4 max-w-3xl mx-auto">
            <div className="relative shadow-lg">
              <input
                type="text"
                value={ticker}
                onChange={(e) => setTicker(e.target.value)}
                placeholder="Search for companies and stocks to analyse"
                className={`w-full px-6 py-4 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium transition-colors ${
                  darkMode
                    ? 'bg-slate-700 text-white border-slate-600 placeholder-slate-400'
                    : 'bg-white text-slate-700 border-slate-300 placeholder-slate-500'
                }`}
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-8 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 font-semibold transition-all"
              >
                {loading ? 'Analyzing...' : 'Search'}
              </button>
            </div>
          </div>
        </form>

        {error && (
          <div className={`border-2 px-6 py-4 rounded-lg mb-8 shadow-sm ${
            darkMode
              ? 'bg-red-900 border-red-700 text-red-200'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <p className={`font-bold ${darkMode ? 'text-red-100' : 'text-red-900'}`}>Error</p>
            <p className="mt-1">{error}</p>
          </div>
        )}

        {data && (
          <div className="space-y-8">
            {/* Real-Time Data Notice */}
            <div className={`border-2 px-6 py-4 rounded-lg shadow-sm ${
              darkMode
                ? 'bg-green-900 border-green-700 text-green-200'
                : 'bg-green-50 border-green-300 text-green-900'
            }`}>
              <p className={`font-semibold ${darkMode ? 'text-green-100' : ''}`}>✓ Real-Time Data</p>
              <p className="mt-1 text-sm">Stock prices and financial data are fetched from live market feeds.</p>
            </div>

            {/* Company Header Card - Horizontal Layout */}
            <div className={`rounded-lg shadow-md border p-10 transition-colors ${
              darkMode
                ? 'bg-slate-700 border-slate-600'
                : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center gap-12 mb-8">
                <div>
                  <h3 className="text-6xl font-bold text-blue-600">{data.ticker}</h3>
                </div>
                <div className={`flex-1 border-l-2 pl-10 ${darkMode ? 'border-slate-600' : 'border-slate-200'}`}>
                  <p className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>{data.companyName}</p>
                  <p className="text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      darkMode
                        ? 'bg-blue-900 text-blue-200'
                        : 'bg-blue-100 text-blue-800'
                    }`}>{data.sector}</span>
                  </p>
                </div>
              </div>

              {/* Stock Price Chart */}
              {data.priceHistory && data.priceHistory.length > 0 && (
                <div className={`mt-10 pt-10 border-t ${darkMode ? 'border-slate-600' : 'border-slate-200'}`}>
                  <h4 className={`text-lg font-semibold mb-6 ${darkMode ? 'text-white' : 'text-slate-900'}`}>7-Day Price History</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={data.priceHistory}>
                      <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#475569' : '#e2e8f0'} />
                      <XAxis 
                        dataKey="displayDate" 
                        stroke={darkMode ? '#cbd5e1' : '#64748b'}
                        style={{ fontSize: '12px' }}
                      />
                      <YAxis 
                        stroke={darkMode ? '#cbd5e1' : '#64748b'}
                        style={{ fontSize: '12px' }}
                        domain={['dataMin - 5', 'dataMax + 5']}
                        label={{ value: 'Price ($)', angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: darkMode ? '#1e293b' : '#fff',
                          border: darkMode ? '1px solid #475569' : '1px solid #e2e8f0',
                          borderRadius: '8px',
                          color: darkMode ? '#e2e8f0' : '#1e293b'
                        }}
                        formatter={(value) => `$${value.toFixed(2)}`}
                        labelStyle={{ color: darkMode ? '#e2e8f0' : '#1e293b' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="price" 
                        stroke="#2563eb" 
                        strokeWidth={3}
                        dot={{ fill: '#2563eb', r: 5 }}
                        activeDot={{ r: 7 }}
                        isAnimationActive={true}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Verdict Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className={`rounded-lg p-8 shadow-md border-2 font-medium transition-colors ${
                darkMode ? 'border-slate-600' : 'border-slate-200'
              } ${
                data.overall.verdict === 'undervalued' 
                  ? darkMode ? 'bg-green-900 border-green-700' : 'bg-green-50 border-green-300'
                  : data.overall.verdict === 'overvalued'
                  ? darkMode ? 'bg-red-900 border-red-700' : 'bg-red-50 border-red-300'
                  : darkMode ? 'bg-yellow-900 border-yellow-700' : 'bg-yellow-50 border-yellow-300'
              }`}>
                <p className={`text-sm font-semibold mb-3 uppercase tracking-wide ${
                  darkMode ? 'text-slate-400' : 'text-slate-600'
                }`}>Valuation Status</p>
                <p className={`text-4xl font-bold mb-4 ${
                  data.overall.verdict === 'undervalued' ? (darkMode ? 'text-green-300' : 'text-green-700') : 
                  data.overall.verdict === 'overvalued' ? (darkMode ? 'text-red-300' : 'text-red-700') : 
                  (darkMode ? 'text-yellow-300' : 'text-yellow-700')
                }`}>
                  {data.overall.verdict.toUpperCase()}
                </p>
                <p className={`text-lg font-bold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{data.overall.confidence}% Confidence</p>
              </div>

              <div className={`rounded-lg p-8 shadow-md border-2 col-span-1 md:col-span-2 transition-colors ${
                darkMode
                  ? 'bg-blue-900 border-blue-700 text-blue-200'
                  : 'bg-blue-50 border-blue-300'
              }`}>
                <p className={`text-sm font-semibold mb-3 uppercase tracking-wide ${
                  darkMode ? 'text-blue-300' : 'text-slate-600'
                }`}>Analysis Summary</p>
                <p className={`font-semibold text-lg ${darkMode ? 'text-blue-100' : 'text-slate-800'}`}>{data.interpretation}</p>
              </div>
            </div>

            {/* Key Metrics Grid */}
            <div id="metrics" className={`rounded-lg shadow-md border p-10 transition-colors ${
              darkMode
                ? 'bg-slate-700 border-slate-600'
                : 'bg-white border-slate-200'
            }`}>
              <h3 className={`text-2xl font-bold mb-8 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Valuation Metrics</h3>
              <div className="space-y-3">
                {data.verdicts && data.verdicts.map((metric, idx) => (
                  <div key={idx} className={`flex items-center justify-between p-5 rounded-lg border hover:shadow-md transition-shadow ${
                    darkMode
                      ? 'bg-slate-600 border-slate-500'
                      : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div>
                      <p className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-slate-800'}`}>{metric.metric}</p>
                      <p className={`text-sm mt-1 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Value: <span className={`font-semibold ${darkMode ? 'text-white' : 'text-slate-800'}`}>{metric.value}</span></p>
                    </div>
                    <div>
                      <span className={`px-4 py-2 rounded-full text-sm font-bold ${
                        metric.verdict === 'undervalued' 
                          ? darkMode ? 'bg-green-900 text-green-300' : 'bg-green-200 text-green-800'
                          : metric.verdict === 'overvalued'
                          ? darkMode ? 'bg-red-900 text-red-300' : 'bg-red-200 text-red-800'
                          : darkMode ? 'bg-yellow-900 text-yellow-300' : 'bg-yellow-200 text-yellow-800'
                      }`}>
                        {metric.verdict.charAt(0).toUpperCase() + metric.verdict.slice(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Valuation Range */}
            <div id="overview" className={`rounded-lg shadow-md border p-10 transition-colors ${
              darkMode
                ? 'bg-slate-700 border-slate-600'
                : 'bg-white border-slate-200'
            }`}>
              <h3 className={`text-2xl font-bold mb-8 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Financial Overview</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className={`p-6 rounded-lg border transition-colors ${
                  darkMode
                    ? 'bg-gradient-to-br from-blue-900 to-blue-800 border-blue-700'
                    : 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200'
                }`}>
                  <p className={`text-sm mb-2 font-semibold uppercase tracking-wide ${
                    darkMode ? 'text-blue-300' : 'text-slate-700'
                  }`}>Market Capitalization</p>
                  <p className={`text-3xl font-bold ${darkMode ? 'text-blue-100' : 'text-slate-900'}`}>${(data.rawData.marketCap / 1e9).toFixed(2)}B</p>
                </div>
                <div className={`p-6 rounded-lg border transition-colors ${
                  darkMode
                    ? 'bg-gradient-to-br from-purple-900 to-purple-800 border-purple-700'
                    : 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200'
                }`}>
                  <p className={`text-sm mb-2 font-semibold uppercase tracking-wide ${
                    darkMode ? 'text-purple-300' : 'text-slate-700'
                  }`}>Enterprise Value</p>
                  <p className={`text-3xl font-bold ${darkMode ? 'text-purple-100' : 'text-slate-900'}`}>${(data.rawData.enterpriseValue / 1e9).toFixed(2)}B</p>
                </div>
                <div className={`p-6 rounded-lg border transition-colors ${
                  darkMode
                    ? 'bg-gradient-to-br from-green-900 to-green-800 border-green-700'
                    : 'bg-gradient-to-br from-green-50 to-green-100 border-green-200'
                }`}>
                  <p className={`text-sm mb-2 font-semibold uppercase tracking-wide ${
                    darkMode ? 'text-green-300' : 'text-slate-700'
                  }`}>Net Income</p>
                  <p className={`text-3xl font-bold ${darkMode ? 'text-green-100' : 'text-slate-900'}`}>${(data.rawData.netIncome / 1e9).toFixed(2)}B</p>
                </div>
                <div className={`p-6 rounded-lg border transition-colors ${
                  darkMode
                    ? 'bg-gradient-to-br from-orange-900 to-orange-800 border-orange-700'
                    : 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200'
                }`}>
                  <p className={`text-sm mb-2 font-semibold uppercase tracking-wide ${
                    darkMode ? 'text-orange-300' : 'text-slate-700'
                  }`}>Revenue</p>
                  <p className={`text-3xl font-bold ${darkMode ? 'text-orange-100' : 'text-slate-900'}`}>${(data.rawData.revenue / 1e9).toFixed(2)}B</p>
                </div>
                <div className={`p-6 rounded-lg border transition-colors ${
                  darkMode
                    ? 'bg-gradient-to-br from-cyan-900 to-cyan-800 border-cyan-700'
                    : 'bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-200'
                }`}>
                  <p className={`text-sm mb-2 font-semibold uppercase tracking-wide ${
                    darkMode ? 'text-cyan-300' : 'text-slate-700'
                  }`}>Operating Cash Flow</p>
                  <p className={`text-3xl font-bold ${darkMode ? 'text-cyan-100' : 'text-slate-900'}`}>${(data.rawData.operatingCashFlow / 1e9).toFixed(2)}B</p>
                </div>
                <div className={`p-6 rounded-lg border transition-colors ${
                  darkMode
                    ? 'bg-gradient-to-br from-pink-900 to-pink-800 border-pink-700'
                    : 'bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200'
                }`}>
                  <p className={`text-sm mb-2 font-semibold uppercase tracking-wide ${
                    darkMode ? 'text-pink-300' : 'text-slate-700'
                  }`}>Total Assets</p>
                  <p className={`text-3xl font-bold ${darkMode ? 'text-pink-100' : 'text-slate-900'}`}>${(data.rawData.totalAssets / 1e9).toFixed(2)}B</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className={`border-t transition-colors duration-300 ${
        darkMode
          ? 'bg-slate-800 border-slate-700'
          : 'bg-white border-slate-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className={`text-sm font-medium ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              © 2025 Stock Valuation Website. All rights reserved.
            </p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <a
                href="https://github.com/roosteram25"
                target="_blank"
                rel="noopener noreferrer"
                className={`text-sm font-medium hover:text-blue-600 transition-colors ${
                  darkMode ? 'text-slate-400 hover:text-blue-400' : 'text-slate-600 hover:text-blue-600'
                }`}
              >
                GitHub: roosteram25
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className={`text-sm font-medium hover:text-blue-600 transition-colors ${
                  darkMode ? 'text-slate-400 hover:text-blue-400' : 'text-slate-600 hover:text-blue-600'
                }`}
              >
                GitHub: Your Profile
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
