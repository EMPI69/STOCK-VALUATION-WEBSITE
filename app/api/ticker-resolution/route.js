import { NextResponse } from 'next/server';
import { resolveTickerOrCompanyName, clearResolutionCache, getCacheStats } from '../../../lib/tickerResolution.js';

/**
 * API endpoint for testing and managing ticker resolution
 * 
 * GET /api/ticker-resolution - Resolve a ticker or company name
 *   ?query=nvidia&exchange=NASDAQ&provider=auto
 * 
 * POST /api/ticker-resolution - Same as GET but with request body
 * 
 * DELETE /api/ticker-resolution - Clear cache (with optional query filter)
 *   ?query=nvidia (clear specific entry)
 */

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');
  const exchange = searchParams.get('exchange');
  const provider = searchParams.get('provider') || 'auto';
  const forceRefresh = searchParams.get('refresh') === 'true';
  const includeStats = searchParams.get('stats') === 'true';

  if (!query) {
    if (includeStats) {
      return NextResponse.json({
        cacheStats: getCacheStats()
      });
    }
    return NextResponse.json({
      error: 'query parameter is required'
    }, { status: 400 });
  }

  try {
    const resolution = await resolveTickerOrCompanyName(query, {
      exchange,
      provider,
      forceRefresh
    });

    const response = {
      query,
      resolution,
      timestamp: new Date().toISOString()
    };

    if (includeStats) {
      response.cacheStats = getCacheStats();
    }

    // Return appropriate status code
    if (!resolution.ticker && resolution.confidence !== 'ambiguous') {
      return NextResponse.json(response, { status: 404 });
    }

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json({
      error: error.message
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { query, exchange, provider = 'auto', forceRefresh = false } = body;

    if (!query) {
      return NextResponse.json({
        error: 'query field is required'
      }, { status: 400 });
    }

    const resolution = await resolveTickerOrCompanyName(query, {
      exchange,
      provider,
      forceRefresh
    });

    return NextResponse.json({
      query,
      resolution,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      error: error.message
    }, { status: 500 });
  }
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  try {
    clearResolutionCache(query || null);

    return NextResponse.json({
      message: query ? `Cleared cache for: ${query}` : 'Cleared entire resolution cache',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      error: error.message
    }, { status: 500 });
  }
}
