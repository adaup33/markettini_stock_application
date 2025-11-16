export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { addSymbolToWatchlist, removeSymbolFromWatchlist, getWatchlistByEmail } from '@/lib/actions/watchlist.actions';
import { auth } from '@/lib/better-auth/auth';
import { getQuotes } from '@/lib/actions/finnhub.actions';

function formatNumber(n: number | null | undefined): string {
    if (n == null || isNaN(n as any)) return '-';
    return String(n);
}

function formatPeRatio(n: number | null | undefined): string {
    if (n == null || !isFinite(n)) return '-';
    const s = (Math.round(n * 100) / 100).toFixed(2);
    return s.replace(/\.00$/, '').replace(/(\.\d*[1-9])0$/, '$1');
}

function formatMarketCapFromBillions(billions: number | null | undefined): string {
    if (billions == null || !isFinite(billions)) return '-';
    const n = billions;
    if (n >= 1000) return `${(n / 1000).toFixed(2)}T`;
    if (n >= 1) return `${n.toFixed(2)}B`;
    if (n >= 0.001) return `${(n * 1000).toFixed(2)}M`;
    return `${(n * 1_000_000).toFixed(2)}K`;
}

function formatPriceUSD(n: number | null | undefined): string {
    if (n == null || !isFinite(n)) return '-';
    return `$${Number(n).toFixed(2)}`;
}

function parseNumberMaybe(v: unknown): number | null {
    if (v == null) return null;
    if (typeof v === 'number') return isFinite(v) ? v : null;
    if (typeof v === 'string') {
        const trimmed = v.trim();
        if (!trimmed) return null;
        const n = Number(trimmed);
        return isFinite(n) ? n : null;
    }
    return null;
}

function parseMarketCapToBillions(v: unknown): number | null {
    if (v == null) return null;
    if (typeof v === 'number') return isFinite(v) ? v : null; // already billions
    if (typeof v !== 'string') return null;
    const s = v.trim().toUpperCase();
    if (!s) return null;
    const m = s.match(/^([0-9]+(?:\.[0-9]+)?)\s*([TMBK])?$/);
    if (!m) {
        // plain number string assumed billions
        const n = Number(s);
        return isFinite(n) ? n : null;
    }
    const num = Number(m[1]);
    if (!isFinite(num)) return null;
    const suffix = m[2];
    switch (suffix) {
        case 'T': return num * 1000;
        case 'B': return num;
        case 'M': return num / 1000;
        case 'K': return num / 1_000_000;
        default: return num; // treat as billions
    }
}

async function deriveEmailFromAuth(req: Request): Promise<string | undefined> {
    try {
        if (!auth) return undefined;
        const session = await auth.api.getSession({ headers: req.headers });
        const email = session?.user?.email;
        return typeof email === 'string' ? email : undefined;
    } catch (err) {
        console.error('deriveEmailFromAuth error', err);
    }
    return undefined;
}

function nodemailerFallbackAllowed(): boolean {
    return process.env.WATCHLIST_ALLOW_SMTP_EMAIL === '1' || process.env.NODE_ENV !== 'production';
}

function resolveEmailFromRequest(req: Request, hint?: { bodyEmail?: string; queryEmail?: string; headersEmail?: string }): { email?: string; source: 'body' | 'query' | 'header' | 'auth' | 'nodemailer_env' | 'dev_fallback' | 'none'; detail?: string } {
    // 1) request-provided
    if (hint?.bodyEmail && typeof hint.bodyEmail === 'string') {
        return { email: hint.bodyEmail, source: 'body' };
    }
    if (hint?.queryEmail && typeof hint.queryEmail === 'string') {
        return { email: hint.queryEmail, source: 'query' };
    }
    if (hint?.headersEmail && typeof hint.headersEmail === 'string') {
        return { email: hint.headersEmail, source: 'header' };
    }
    // 2) auth-derived (async caller will supplement)
    // We cannot await here; caller will fill when available.
    return { email: undefined, source: 'none' };
}

// Consolidated email resolution helper to reduce code duplication
async function resolveEmailWithFallbacks(req: Request, hint?: { bodyEmail?: string; queryEmail?: string; headersEmail?: string }): Promise<{ email: string | undefined; emailSource: string; emailDetail: string | undefined }> {
    const resolved1 = resolveEmailFromRequest(req, hint);
    let email = resolved1.email;
    let emailSource = resolved1.source;
    let emailDetail = resolved1.detail;

    if (!email) {
        const derived = await deriveEmailFromAuth(req);
        if (derived) {
            email = derived;
            emailSource = 'auth';
        }
    }
    if (!email && nodemailerFallbackAllowed() && process.env.NODEMAILER_EMAIL) {
        email = process.env.NODEMAILER_EMAIL;
        emailSource = 'nodemailer_env';
        emailDetail = 'NODEMAILER_EMAIL';
    }
    if (!email && process.env.NODE_ENV !== 'production') {
        const dev = process.env.DEV_WATCHLIST_EMAIL || process.env.NEXT_PUBLIC_DEV_EMAIL;
        if (dev) {
            email = dev;
            emailSource = 'dev_fallback';
            emailDetail = process.env.DEV_WATCHLIST_EMAIL ? 'DEV_WATCHLIST_EMAIL' : (process.env.NEXT_PUBLIC_DEV_EMAIL ? 'NEXT_PUBLIC_DEV_EMAIL' : undefined);
        }
    }

    return { email, emailSource, emailDetail };
}

export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const queryEmail = url.searchParams.get('email') || undefined;
        const headerEmail = req.headers.get('x-user-email') || req.headers.get('x-useremail') || undefined;
        
        const { email, emailSource, emailDetail } = await resolveEmailWithFallbacks(req, { queryEmail, headersEmail: headerEmail });

        const items = await getWatchlistByEmail(email);

        // Attach live quotes when possible
        const symbols = items.map((it) => it.symbol).filter(Boolean);
        let quotes: Record<string, { price: string; change: string; percent: string }> = {};
        let metrics: Record<string, { marketCapB: number | null; peRatio: number | null }> = {};
        try {
            if (symbols.length > 0) {
                // Fetch quotes and metrics in parallel
                const [quotesData, metricsData] = await Promise.all([
                    getQuotes(symbols),
                    import('@/lib/actions/finnhub.actions').then(m => m.getCompanyMetrics(symbols))
                ]);
                quotes = quotesData;
                metrics = metricsData;
            }
        } catch (e) {
            console.error('Error fetching quotes or metrics', e);
            quotes = {};
            metrics = {};
        }

        const enriched = items.map((it) => {
            const marketCapB = (it as any).marketCapB ?? metrics[it.symbol]?.marketCapB ?? null;
            const pe = (it as any).peRatio ?? metrics[it.symbol]?.peRatio ?? null;
            const alertPrice = (it as any).alertPrice ?? null;
            const addedPrice = (it as any).addedPrice ?? null;
            return {
                ...it,
                // formatted display fields expected by the UI table
                marketCap: formatMarketCapFromBillions(marketCapB),
                peRatio: formatPeRatio(pe),
                alert: formatPriceUSD(alertPrice),
                // raw numeric fields for type-safe consumers
                marketCapB: marketCapB,
                peRatioRaw: pe,
                alertPriceRaw: alertPrice,
                addedPrice: addedPrice, // price when added
                // live quotes
                price: quotes[it.symbol]?.price ?? '-',
                change: quotes[it.symbol]?.percent ?? quotes[it.symbol]?.change ?? '-',
            };
        });

        return NextResponse.json({ success: true, data: enriched, meta: { email: email ?? null, emailSource: emailSource ?? 'none', emailDetail: emailDetail ?? null, nodemailerAllowed: nodemailerFallbackAllowed(), nodemailerEnvSet: !!process.env.NODEMAILER_EMAIL } });
    } catch (err: any) {
        console.error('watchlist GET error', err);
        const errorMessage = err?.message || 'Failed to fetch watchlist';
        return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const url = new URL(req.url);
        const body = await req.json().catch(() => ({} as any));
        const bodyEmail = (body?.email as string | undefined) || undefined;
        const symbol = (body?.symbol as string | undefined) || undefined;
        const company = (body?.company as string | undefined) || undefined;

        const queryEmail = url.searchParams.get('email') || undefined;
        const headerEmail = req.headers.get('x-user-email') || req.headers.get('x-useremail') || undefined;
        
        const { email, emailSource, emailDetail } = await resolveEmailWithFallbacks(req, { bodyEmail, queryEmail, headersEmail: headerEmail });

        // Validate required fields
        if (!email) {
            return NextResponse.json({ success: false, error: 'Missing email', meta: { email: null, emailSource: emailSource ?? 'none', emailDetail: emailDetail ?? null } }, { status: 400 });
        }
        if (!symbol) {
            return NextResponse.json({ success: false, error: 'Missing symbol', meta: { email: email, emailSource: emailSource ?? 'none', emailDetail: emailDetail ?? null } }, { status: 400 });
        }

        // Parse optional numeric inputs
        const marketCapB = parseMarketCapToBillions((body as any)?.marketCapB ?? (body as any)?.marketCap);
        const peRatio = parseNumberMaybe((body as any)?.peRatio);
        const alertPrice = parseNumberMaybe((body as any)?.alertPrice ?? (body as any)?.alert);
        const addedPrice = parseNumberMaybe((body as any)?.addedPrice);

        // If no addedPrice provided, try to fetch current price from Finnhub
        let finalAddedPrice = addedPrice;
        if (finalAddedPrice == null && symbol) {
            try {
                const quotes = await getQuotes([symbol]);
                const priceStr = quotes[symbol]?.price;
                if (priceStr) {
                    const match = priceStr.match(/[\d.]+/);
                    if (match) {
                        finalAddedPrice = parseFloat(match[0]);
                    }
                }
            } catch (e) {
                console.error('Failed to fetch current price for addedPrice', e);
            }
        }

        const result = await addSymbolToWatchlist(email, symbol as string, company as string, {
            marketCapB: marketCapB,
            peRatio: peRatio,
            alertPrice: alertPrice,
            addedPrice: finalAddedPrice,
        });

        // Broadcast only on success
        if (result?.success) {
            try {
                const wsHost = process.env.WS_BROADCAST_URL ?? `http://localhost:${process.env.WS_PORT ?? 4001}/broadcast`;
                await fetch(wsHost, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: 'watchlist:update', payload: { email, symbol, action: 'add' } }),
                });
            } catch (e) {
                // Non-fatal — log and continue
                console.error('watchlist POST broadcast failed', e);
            }
        }

        const status = result?.success ? 200 : 400;
        const errorMessage = result?.error || (result?.success ? undefined : 'Failed to add to watchlist');
        return NextResponse.json(
            { 
                success: result?.success, 
                error: errorMessage,
                meta: { email: email ?? null, emailSource: emailSource ?? 'none', emailDetail: emailDetail ?? null, nodemailerAllowed: nodemailerFallbackAllowed(), nodemailerEnvSet: !!process.env.NODEMAILER_EMAIL } 
            }, 
            { status }
        );
    } catch (err: any) {
        console.error('watchlist POST error', err);
        const errorMessage = err?.message || 'Failed to add to watchlist';
        return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const url = new URL(req.url);
        const queryEmail = url.searchParams.get('email') || undefined;
        const headerEmail = req.headers.get('x-user-email') || req.headers.get('x-useremail') || undefined;
        const symbol = url.searchParams.get('symbol') || undefined;
        
        const { email, emailSource, emailDetail } = await resolveEmailWithFallbacks(req, { queryEmail, headersEmail: headerEmail });

        if (!email) {
            return NextResponse.json({ success: false, error: 'Missing email', meta: { email: null, emailSource: emailSource ?? 'none', emailDetail: emailDetail ?? null, nodemailerAllowed: nodemailerFallbackAllowed(), nodemailerEnvSet: !!process.env.NODEMAILER_EMAIL } }, { status: 400 });
        }
        if (!symbol) {
            return NextResponse.json({ success: false, error: 'Missing symbol', meta: { email: email ?? null, emailSource: emailSource ?? 'none', emailDetail: emailDetail ?? null, nodemailerAllowed: nodemailerFallbackAllowed(), nodemailerEnvSet: !!process.env.NODEMAILER_EMAIL } }, { status: 400 });
        }
        const result = await removeSymbolFromWatchlist(email, symbol);

        // Broadcast only on success
        if (result?.success) {
            try {
                const wsHost = process.env.WS_BROADCAST_URL ?? `http://localhost:${process.env.WS_PORT ?? 4001}/broadcast`;
                await fetch(wsHost, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: 'watchlist:update', payload: { email, symbol, action: 'remove' } }),
                });
            } catch (e) {
                console.error('watchlist DELETE broadcast failed', e);
            }
        }

        const status = result?.success ? 200 : 400;
        const errorMessage = result?.error || (result?.success ? undefined : 'Failed to remove from watchlist');
        return NextResponse.json(
            { 
                success: result?.success, 
                error: errorMessage,
                meta: { email: email ?? null, emailSource: emailSource ?? 'none', emailDetail: emailDetail ?? null, nodemailerAllowed: nodemailerFallbackAllowed(), nodemailerEnvSet: !!process.env.NODEMAILER_EMAIL } 
            }, 
            { status }
        );
    } catch (err: any) {
        console.error('watchlist DELETE error', err);
        const errorMessage = err?.message || 'Failed to remove from watchlist';
        return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
    }
}
