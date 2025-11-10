import { NextResponse } from 'next/server';
import { connectToDb } from '@/database/mongoose';
import { Alert } from '@/database/models/alert.model';
import { auth } from '@/lib/better-auth/auth';

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

function nodemailerFallbackAllowed(): boolean {
  return process.env.WATCHLIST_ALLOW_SMTP_EMAIL === '1' || process.env.NODE_ENV !== 'production';
}

function resolveEmailFromRequest(req: Request, hint?: { bodyEmail?: string; queryEmail?: string; headersEmail?: string }): { email?: string; source: 'body' | 'query' | 'header' | 'auth' | 'nodemailer_env' | 'dev_fallback' | 'none'; detail?: string } {
  if (hint?.bodyEmail && typeof hint.bodyEmail === 'string') return { email: hint.bodyEmail, source: 'body' };
  if (hint?.queryEmail && typeof hint.queryEmail === 'string') return { email: hint.queryEmail, source: 'query' };
  if (hint?.headersEmail && typeof hint.headersEmail === 'string') return { email: hint.headersEmail, source: 'header' };
  return { email: undefined, source: 'none' };
}

async function resolveUserIdByEmail(email?: string): Promise<string | null> {
  if (!email) return null;
  const mongoose = await connectToDb();
  const db = mongoose.connection.db;
  if (!db) return null;
  const user = await db.collection('user').findOne<{ _id?: unknown; id?: string; email?: string }>({ email });
  if (!user) return null;
  const userId = (user.id as string) || String(user._id || '');
  return userId || null;
}

function parseOperator(op: unknown): '>' | '<' | '>=' | '<=' | '==' | null {
  const allowed = new Set(['>', '<', '>=', '<=', '==']);
  if (typeof op === 'string' && allowed.has(op)) return op as any;
  return null;
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

export async function GET(req: Request) {
  try {
    const mongoose = await connectToDb();
    const url = new URL(req.url);
    const queryEmail = url.searchParams.get('email') || undefined;
    const headerEmail = req.headers.get('x-user-email') || req.headers.get('x-useremail') || undefined;
    const resolved1 = resolveEmailFromRequest(req, { queryEmail, headersEmail: headerEmail });
    let email = resolved1.email;
    let emailSource = resolved1.source;
    let emailDetail = resolved1.detail;

    if (!email) {
      const derived = await deriveEmailFromAuth(req);
      if (derived) { email = derived; emailSource = 'auth'; }
    }
    if (!email && nodemailerFallbackAllowed() && process.env.NODEMAILER_EMAIL) { email = process.env.NODEMAILER_EMAIL; emailSource = 'nodemailer_env'; emailDetail = 'NODEMAILER_EMAIL'; }
    if (!email && process.env.NODE_ENV !== 'production') {
      const dev = process.env.DEV_WATCHLIST_EMAIL || process.env.NEXT_PUBLIC_DEV_EMAIL;
      if (dev) { email = dev; emailSource = 'dev_fallback'; emailDetail = process.env.DEV_WATCHLIST_EMAIL ? 'DEV_WATCHLIST_EMAIL' : (process.env.NEXT_PUBLIC_DEV_EMAIL ? 'NEXT_PUBLIC_DEV_EMAIL' : undefined); }
    }

    const userId = await resolveUserIdByEmail(email);
    if (!userId) return NextResponse.json({ success: true, data: [], meta: { email: email ?? null } });

    const symbol = url.searchParams.get('symbol') || undefined;
    const page = Math.max(1, Number(url.searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') || '50')));

    const filter: any = { userId };
    if (symbol) filter.symbol = String(symbol).toUpperCase();

    const alertsCollection = mongoose.connection.db!.collection('alerts');
    const total = await alertsCollection.countDocuments(filter);
    const items = await Alert.find(filter).skip((page - 1) * limit).limit(limit).sort({ createdAt: -1 }).lean();

    return NextResponse.json({ success: true, data: items, meta: { email: email ?? null, page, limit, total } });
  } catch (err) {
    console.error('alerts GET error', err);
    return NextResponse.json({ success: false, error: 'failed' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectToDb();
    const url = new URL(req.url);
    const body = await req.json().catch(() => ({} as any));
    const bodyEmail = (body?.email as string | undefined) || undefined;
    const queryEmail = url.searchParams.get('email') || undefined;
    const headerEmail = req.headers.get('x-user-email') || req.headers.get('x-useremail') || undefined;
    const resolved1 = resolveEmailFromRequest(req, { bodyEmail, queryEmail, headersEmail: headerEmail });
    let email = resolved1.email;
    let emailSource = resolved1.source;
    let emailDetail = resolved1.detail;

    if (!email) { const derived = await deriveEmailFromAuth(req); if (derived) { email = derived; emailSource = 'auth'; } }
    if (!email && nodemailerFallbackAllowed() && process.env.NODEMAILER_EMAIL) { email = process.env.NODEMAILER_EMAIL; emailSource = 'nodemailer_env'; emailDetail = 'NODEMAILER_EMAIL'; }
    if (!email && process.env.NODE_ENV !== 'production') { const dev = process.env.DEV_WATCHLIST_EMAIL || process.env.NEXT_PUBLIC_DEV_EMAIL; if (dev) { email = dev; emailSource = 'dev_fallback'; emailDetail = process.env.DEV_WATCHLIST_EMAIL ? 'DEV_WATCHLIST_EMAIL' : (process.env.NEXT_PUBLIC_DEV_EMAIL ? 'NEXT_PUBLIC_DEV_EMAIL' : undefined); } }

    const userId = await resolveUserIdByEmail(email);
    if (!userId) return NextResponse.json({ success: false, error: 'user not found', meta: { email: email ?? null } }, { status: 400 });

    const symbol = (body?.symbol as string | undefined)?.toUpperCase() || undefined;
    const operator = parseOperator(body?.operator);
    const threshold = parseNumber(body?.threshold);
    const note = typeof body?.note === 'string' ? body.note : undefined;
    const active = typeof body?.active === 'boolean' ? body.active : true;

    if (!symbol || !operator || threshold == null) {
      return NextResponse.json({ success: false, error: 'Invalid payload', meta: { email: email ?? null } }, { status: 400 });
    }

    const created = await Alert.create({ userId, symbol, operator, threshold, active, note, createdAt: new Date() });

    // Optional broadcast
    try {
      const wsHost = process.env.WS_BROADCAST_URL ?? `http://localhost:${process.env.WS_PORT ?? 4001}/broadcast`;
      await fetch(wsHost, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'alerts:update', payload: { email, symbol, action: 'create' } }) });
    } catch (e) { console.error('alerts POST broadcast failed', e); }

    return NextResponse.json({ success: true, data: created, meta: { email: email ?? null, emailSource, emailDetail } }, { status: 201 });
  } catch (err) {
    console.error('alerts POST error', err);
    return NextResponse.json({ success: false, error: 'failed' }, { status: 500 });
  }
}
