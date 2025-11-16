import { NextResponse } from 'next/server';
import { connectToDb } from '@/database/mongoose';
import { Alert } from '@/database/models/alert.model';
import { resolveEmailForRequest, nodemailerFallbackAllowed, resolveUserIdByEmail } from '@/lib/utils/auth-helpers';
import { parseOperator, parseNumber } from '@/lib/utils/parse-helpers';

export async function GET(req: Request) {
  try {
    const mongoose = await connectToDb();
    const url = new URL(req.url);
    const queryEmail = url.searchParams.get('email') || undefined;
    const headerEmail = req.headers.get('x-user-email') || req.headers.get('x-useremail') || undefined;
    
    const { email, emailSource, emailDetail } = await resolveEmailForRequest(req, { queryEmail, headersEmail: headerEmail });

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
    
    const { email, emailSource, emailDetail } = await resolveEmailForRequest(req, { bodyEmail, queryEmail, headersEmail: headerEmail });

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
