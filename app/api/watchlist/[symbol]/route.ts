export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { updateWatchlistFields } from '@/lib/actions/watchlist.actions';
import { auth } from '@/lib/better-auth/auth';

function nodemailerFallbackAllowed(): boolean {
  return process.env.WATCHLIST_ALLOW_SMTP_EMAIL === '1' || process.env.NODE_ENV !== 'production';
}

async function deriveEmailFromAuth(req: Request): Promise<string | undefined> {
  try {
    if (!auth) return undefined;
    if (typeof (auth as any).handler === 'function') {
      const maybe = await (auth as any).handler(req);
      const email = maybe?.user?.email || maybe?.session?.user?.email || maybe?.data?.user?.email || maybe?.user?.primaryEmail || undefined;
      return typeof email === 'string' ? email : undefined;
    }
  } catch (err) {
    console.error('alerts deriveEmailFromAuth error', err);
  }
  return undefined;
}

function resolveEmailFromRequest(req: Request, hint?: { bodyEmail?: string; queryEmail?: string; headersEmail?: string }): { email?: string; source: 'body' | 'query' | 'header' | 'auth' | 'nodemailer_env' | 'dev_fallback' | 'none'; detail?: string } {
  if (hint?.bodyEmail && typeof hint.bodyEmail === 'string') return { email: hint.bodyEmail, source: 'body' };
  if (hint?.queryEmail && typeof hint.queryEmail === 'string') return { email: hint.queryEmail, source: 'query' };
  if (hint?.headersEmail && typeof hint.headersEmail === 'string') return { email: hint.headersEmail, source: 'header' };
  return { email: undefined, source: 'none' };
}

function parseNumber(v: unknown): number | null {
  if (v == null) return null;
  if (typeof v === 'number') return isFinite(v) ? v : null;
  if (typeof v === 'string') {
    const n = Number(v.trim());
    return isFinite(n) ? n : null;
  }
  return null;
}

export async function PATCH(req: Request, ctx: { params: { symbol: string } }) {
  try {
    const url = new URL(req.url);
    const body = await req.json().catch(() => ({} as any));
    const bodyEmail = (body?.email as string | undefined) || undefined;
    const headersEmail = req.headers.get('x-user-email') || req.headers.get('x-useremail') || undefined;
    const queryEmail = url.searchParams.get('email') || undefined;

    const resolved1 = resolveEmailFromRequest(req, { bodyEmail, queryEmail, headersEmail });
    let email = resolved1.email;
    let emailSource = resolved1.source;
    let emailDetail = resolved1.detail;

    if (!email) {
      const derived = await deriveEmailFromAuth(req);
      if (derived) {
        email = derived; emailSource = 'auth';
      }
    }
    if (!email && nodemailerFallbackAllowed() && process.env.NODEMAILER_EMAIL) {
      email = process.env.NODEMAILER_EMAIL; emailSource = 'nodemailer_env'; emailDetail = 'NODEMAILER_EMAIL';
    }
    if (!email && process.env.NODE_ENV !== 'production') {
      const dev = process.env.DEV_WATCHLIST_EMAIL || process.env.NEXT_PUBLIC_DEV_EMAIL;
      if (dev) { email = dev; emailSource = 'dev_fallback'; emailDetail = process.env.DEV_WATCHLIST_EMAIL ? 'DEV_WATCHLIST_EMAIL' : (process.env.NEXT_PUBLIC_DEV_EMAIL ? 'NEXT_PUBLIC_DEV_EMAIL' : undefined); }
    }

    const symbol = ctx?.params?.symbol;
    if (!email) {
      return NextResponse.json({ success: false, error: 'Missing email', meta: { email: null, emailSource: emailSource ?? 'none', emailDetail: emailDetail ?? null } }, { status: 400 });
    }
    if (!symbol) {
      return NextResponse.json({ success: false, error: 'Missing symbol', meta: { email: email ?? null, emailSource: emailSource ?? 'none', emailDetail: emailDetail ?? null } }, { status: 400 });
    }

    const marketCapB = parseNumber((body as any)?.marketCapB ?? (body as any)?.marketCap);
    const peRatio = parseNumber((body as any)?.peRatio);
    const alertPrice = parseNumber((body as any)?.alertPrice ?? (body as any)?.alert);

    const result = await updateWatchlistFields(email, symbol, {
      marketCapB: marketCapB,
      peRatio: peRatio,
      alertPrice: alertPrice,
    });

    // Broadcast update
    if (result?.success) {
      try {
        const wsHost = process.env.WS_BROADCAST_URL ?? `http://localhost:${process.env.WS_PORT ?? 4001}/broadcast`;
        await fetch(wsHost, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'watchlist:update', payload: { email, symbol, action: 'update' } }) });
      } catch (e) {
        console.error('watchlist PATCH broadcast failed', e);
      }
    }

    return NextResponse.json({ ...result, meta: { email: email ?? null, emailSource, emailDetail } }, { status: result?.success ? 200 : 400 });
  } catch (err) {
    console.error('watchlist PATCH error', err);
    return NextResponse.json({ success: false, error: 'failed' }, { status: 500 });
  }
}
