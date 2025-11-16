import { NextResponse } from 'next/server';
import { connectToDb } from '@/database/mongoose';
import { Alert } from '@/database/models/alert.model';
import { auth } from '@/lib/better-auth/auth';
import { Types } from 'mongoose';

async function deriveEmailFromAuth(req: Request): Promise<string | undefined> {
  try {
    if (!auth) return undefined;
    if (typeof (auth as any).handler === 'function') {
      const maybe = await (auth as any).handler(req);
      const email = maybe?.user?.email || maybe?.session?.user?.email || maybe?.data?.user?.email || maybe?.user?.primaryEmail || undefined;
      return typeof email === 'string' ? email : undefined;
    }
  } catch (err) {
    console.error('alerts:id deriveEmailFromAuth error', err);
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

export async function PATCH(req: Request, ctx: { params: { id: string } }) {
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
    if (!userId) return NextResponse.json({ success: false, error: 'User not found', meta: { email: email ?? null } }, { status: 400 });

    const id = ctx?.params?.id;
    if (!id || !Types.ObjectId.isValid(id)) return NextResponse.json({ success: false, error: 'Invalid alert ID' }, { status: 400 });

    const updates: any = {};
    const op = parseOperator(body?.operator);
    if (op) updates.operator = op;
    const thr = parseNumber(body?.threshold);
    if (thr != null) updates.threshold = thr;
    if (typeof body?.active === 'boolean') updates.active = body.active;
    if (typeof body?.note === 'string') updates.note = body.note;

    if (Object.keys(updates).length === 0) return NextResponse.json({ success: true, data: null, meta: { email: email ?? null } });

    const updated = await Alert.findOneAndUpdate({ _id: id, userId }, { $set: updates }, { new: true }).lean();
    if (!updated) return NextResponse.json({ success: false, error: 'Alert not found' }, { status: 404 });

    try {
      const wsHost = process.env.WS_BROADCAST_URL ?? `http://localhost:${process.env.WS_PORT ?? 4001}/broadcast`;
      await fetch(wsHost, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'alerts:update', payload: { email, alertId: id, action: 'update' } }) });
    } catch (e) { console.error('alerts PATCH broadcast failed', e); }

    return NextResponse.json({ success: true, data: updated, meta: { email: email ?? null, emailSource, emailDetail } });
  } catch (err: any) {
    console.error('alerts:id PATCH error', err);
    const errorMessage = err?.message || 'Failed to update alert';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(req: Request, ctx: { params: { id: string } }) {
  try {
    await connectToDb();
    const url = new URL(req.url);
    const queryEmail = url.searchParams.get('email') || undefined;
    const headerEmail = req.headers.get('x-user-email') || req.headers.get('x-useremail') || undefined;
    const resolved1 = resolveEmailFromRequest(req, { queryEmail, headersEmail: headerEmail });
    let email = resolved1.email;
    let emailSource = resolved1.source;
    let emailDetail = resolved1.detail;

    if (!email) { const derived = await deriveEmailFromAuth(req); if (derived) { email = derived; emailSource = 'auth'; } }
    if (!email && nodemailerFallbackAllowed() && process.env.NODEMAILER_EMAIL) { email = process.env.NODEMAILER_EMAIL; emailSource = 'nodemailer_env'; emailDetail = 'NODEMAILER_EMAIL'; }
    if (!email && process.env.NODE_ENV !== 'production') { const dev = process.env.DEV_WATCHLIST_EMAIL || process.env.NEXT_PUBLIC_DEV_EMAIL; if (dev) { email = dev; emailSource = 'dev_fallback'; emailDetail = process.env.DEV_WATCHLIST_EMAIL ? 'DEV_WATCHLIST_EMAIL' : (process.env.NEXT_PUBLIC_DEV_EMAIL ? 'NEXT_PUBLIC_DEV_EMAIL' : undefined); } }

    const userId = await resolveUserIdByEmail(email);
    if (!userId) return NextResponse.json({ success: false, error: 'User not found', meta: { email: email ?? null } }, { status: 400 });

    const id = ctx?.params?.id;
    if (!id || !Types.ObjectId.isValid(id)) return NextResponse.json({ success: false, error: 'Invalid alert ID' }, { status: 400 });

    const res = await Alert.deleteOne({ _id: id, userId });
    const success = res?.deletedCount === 1;

    try {
      if (success) {
        const wsHost = process.env.WS_BROADCAST_URL ?? `http://localhost:${process.env.WS_PORT ?? 4001}/broadcast`;
        await fetch(wsHost, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'alerts:update', payload: { email, alertId: id, action: 'delete' } }) });
      }
    } catch (e) { console.error('alerts DELETE broadcast failed', e); }

    return NextResponse.json({ success, error: success ? undefined : 'Alert not found', meta: { email: email ?? null, emailSource, emailDetail } }, { status: success ? 200 : 404 });
  } catch (err: any) {
    console.error('alerts:id DELETE error', err);
    const errorMessage = err?.message || 'Failed to delete alert';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
