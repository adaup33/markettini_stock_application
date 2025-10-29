import { NextResponse } from 'next/server';
import { addSymbolToWatchlist, removeSymbolFromWatchlist, getWatchlistByEmail } from '@/lib/actions/watchlist.actions';
import { auth } from '@/lib/better-auth/auth';
import { getQuotes } from '@/lib/actions/finnhub.actions';

async function deriveEmailFromAuth(req: Request): Promise<string | undefined> {
    try {
        if (!auth) return undefined;
        // `auth.handler` is provided by better-auth integration; call it with the Request
        if (typeof (auth as any).handler === 'function') {
            const maybe = await (auth as any).handler(req);
            // try a few possible shapes for the returned object to find an email
            const email = maybe?.user?.email || maybe?.session?.user?.email || maybe?.data?.user?.email || maybe?.user?.primaryEmail || undefined;
            return typeof email === 'string' ? email : undefined;
        }
    } catch (err) {
        console.error('deriveEmailFromAuth error', err);
    }
    return undefined;
}

export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        let email = url.searchParams.get('email') || undefined;

        if (!email) {
            const derived = await deriveEmailFromAuth(req);
            if (derived) email = derived;
        }

        const items = await getWatchlistByEmail(email);

        // Attach live quotes when possible
        const symbols = items.map((it) => it.symbol).filter(Boolean);
        let quotes: Record<string, { price: string; change: string; percent: string }> = {};
        try {
            if (symbols.length > 0) {
                quotes = await getQuotes(symbols);
            }
        } catch (e) {
            console.error('Error fetching quotes', e);
            quotes = {};
        }

        const enriched = items.map((it) => ({
            ...it,
            price: quotes[it.symbol]?.price ?? '-',
            change: quotes[it.symbol]?.percent ?? quotes[it.symbol]?.change ?? '-',
        }));

        return NextResponse.json({ success: true, data: enriched });
    } catch (err) {
        console.error('watchlist GET error', err);
        return NextResponse.json({ success: false, error: 'failed' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        let { email, symbol, company } = body || {};

        if (!email) {
            const derived = await deriveEmailFromAuth(req);
            if (derived) email = derived;
        }

        const res = await addSymbolToWatchlist(email, symbol, company);
        return NextResponse.json(res);
    } catch (err) {
        console.error('watchlist POST error', err);
        return NextResponse.json({ success: false, error: 'failed' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const url = new URL(req.url);
        let email = url.searchParams.get('email') || undefined;
        const symbol = url.searchParams.get('symbol') || undefined;

        if (!email) {
            const derived = await deriveEmailFromAuth(req);
            if (derived) email = derived;
        }

        if (!symbol) return NextResponse.json({ success: false, error: 'missing symbol' }, { status: 400 });
        const res = await removeSymbolFromWatchlist(email, symbol);
        return NextResponse.json(res);
    } catch (err) {
        console.error('watchlist DELETE error', err);
        return NextResponse.json({ success: false, error: 'failed' }, { status: 500 });
    }
}
