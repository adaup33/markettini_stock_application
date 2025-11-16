import { NextResponse } from 'next/server';
import { connectToDb } from '@/database/mongoose';
import { Alert } from '@/database/models/alert.model';
import { Types } from 'mongoose';
import { resolveEmailForRequest, nodemailerFallbackAllowed, resolveUserIdByEmail } from '@/lib/utils/auth-helpers';
import { parseOperator, parseNumber } from '@/lib/utils/parse-helpers';

export async function PATCH(req: Request, ctx: { params: { id: string } }) {
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

    const id = ctx?.params?.id;
    if (!id || !Types.ObjectId.isValid(id)) return NextResponse.json({ success: false, error: 'invalid id' }, { status: 400 });

    const updates: any = {};
    const op = parseOperator(body?.operator);
    if (op) updates.operator = op;
    const thr = parseNumber(body?.threshold);
    if (thr != null) updates.threshold = thr;
    if (typeof body?.active === 'boolean') updates.active = body.active;
    if (typeof body?.note === 'string') updates.note = body.note;

    if (Object.keys(updates).length === 0) return NextResponse.json({ success: true, data: null, meta: { email: email ?? null } });

    const updated = await Alert.findOneAndUpdate({ _id: id, userId }, { $set: updates }, { new: true }).lean();
    if (!updated) return NextResponse.json({ success: false, error: 'not found' }, { status: 404 });

    try {
      const wsHost = process.env.WS_BROADCAST_URL ?? `http://localhost:${process.env.WS_PORT ?? 4001}/broadcast`;
      await fetch(wsHost, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'alerts:update', payload: { email, alertId: id, action: 'update' } }) });
    } catch (e) { console.error('alerts PATCH broadcast failed', e); }

    return NextResponse.json({ success: true, data: updated, meta: { email: email ?? null, emailSource, emailDetail } });
  } catch (err) {
    console.error('alerts:id PATCH error', err);
    return NextResponse.json({ success: false, error: 'failed' }, { status: 500 });
  }
}

export async function DELETE(req: Request, ctx: { params: { id: string } }) {
  try {
    await connectToDb();
    const url = new URL(req.url);
    const queryEmail = url.searchParams.get('email') || undefined;
    const headerEmail = req.headers.get('x-user-email') || req.headers.get('x-useremail') || undefined;
    
    const { email, emailSource, emailDetail } = await resolveEmailForRequest(req, { queryEmail, headersEmail: headerEmail });

    const userId = await resolveUserIdByEmail(email);
    if (!userId) return NextResponse.json({ success: false, error: 'user not found', meta: { email: email ?? null } }, { status: 400 });

    const id = ctx?.params?.id;
    if (!id || !Types.ObjectId.isValid(id)) return NextResponse.json({ success: false, error: 'invalid id' }, { status: 400 });

    const res = await Alert.deleteOne({ _id: id, userId });
    const success = res?.deletedCount === 1;

    try {
      if (success) {
        const wsHost = process.env.WS_BROADCAST_URL ?? `http://localhost:${process.env.WS_PORT ?? 4001}/broadcast`;
        await fetch(wsHost, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'alerts:update', payload: { email, alertId: id, action: 'delete' } }) });
      }
    } catch (e) { console.error('alerts DELETE broadcast failed', e); }

    return NextResponse.json({ success, meta: { email: email ?? null, emailSource, emailDetail } }, { status: success ? 200 : 404 });
  } catch (err) {
    console.error('alerts:id DELETE error', err);
    return NextResponse.json({ success: false, error: 'failed' }, { status: 500 });
  }
}
