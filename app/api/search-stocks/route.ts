import { NextResponse } from 'next/server';
import { searchStocks } from '@/lib/actions/finnhub.actions';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const q = (url.searchParams.get('q') || '').trim();
    if (!q) {
      // Return popular/default stocks when no query provided (keeps UI populated)
      const items = await searchStocks();
      return NextResponse.json(items ?? []);
    }
    const items = await searchStocks(q);
    return NextResponse.json(items ?? []);
  } catch (err) {
    console.error('GET /api/search-stocks error', err);
    return NextResponse.json([], { status: 200 });
  }
}
