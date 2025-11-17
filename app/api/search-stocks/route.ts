import { NextResponse } from 'next/server';
import { searchStocks } from '@/lib/actions/finnhub.actions';
import { getWatchlistSymbolsByEmail } from '@/lib/actions/watchlist.actions';
import { getAuth } from '@/lib/better-auth/auth';

async function getUserEmail(req: Request): Promise<string | undefined> {
  try {
    const auth = await getAuth();
    if (!auth) return undefined;
    const session = await auth.api.getSession({ headers: req.headers });
    return session?.user?.email || undefined;
  } catch (err) {
    console.error('search-stocks getUserEmail error', err);
    return undefined;
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const q = (url.searchParams.get('q') || '').trim();
    
    // Get search results
    const items = !q ? await searchStocks() : await searchStocks(q);
    
    // Get user's watchlist to enrich results
    const email = await getUserEmail(req);
    let watchlistSymbols: string[] = [];
    if (email) {
      watchlistSymbols = await getWatchlistSymbolsByEmail(email);
    }
    
    // Enrich results with watchlist status
    const enrichedItems = (items ?? []).map(item => ({
      ...item,
      isInWatchlist: watchlistSymbols.includes(item.symbol.toUpperCase()),
    }));
    
    return NextResponse.json(enrichedItems);
  } catch (err) {
    console.error('GET /api/search-stocks error', err);
    return NextResponse.json([], { status: 200 });
  }
}
