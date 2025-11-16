import { auth } from '@/lib/better-auth/auth';
import { connectToDb } from '@/database/mongoose';

export async function deriveEmailFromAuth(req: Request): Promise<string | undefined> {
  try {
    if (!auth) return undefined;
    if (typeof (auth as any).handler === 'function') {
      const maybe = await (auth as any).handler(req);
      const email = maybe?.user?.email || maybe?.session?.user?.email || maybe?.data?.user?.email || maybe?.user?.primaryEmail || undefined;
      return typeof email === 'string' ? email : undefined;
    }
  } catch (err) {
    console.error('deriveEmailFromAuth error', err);
  }
  return undefined;
}

export function nodemailerFallbackAllowed(): boolean {
  return process.env.WATCHLIST_ALLOW_SMTP_EMAIL === '1' || process.env.NODE_ENV !== 'production';
}

export function resolveEmailFromRequest(req: Request, hint?: { bodyEmail?: string; queryEmail?: string; headersEmail?: string }): { email?: string; source: 'body' | 'query' | 'header' | 'auth' | 'nodemailer_env' | 'dev_fallback' | 'none'; detail?: string } {
  if (hint?.bodyEmail && typeof hint.bodyEmail === 'string') return { email: hint.bodyEmail, source: 'body' };
  if (hint?.queryEmail && typeof hint.queryEmail === 'string') return { email: hint.queryEmail, source: 'query' };
  if (hint?.headersEmail && typeof hint.headersEmail === 'string') return { email: hint.headersEmail, source: 'header' };
  return { email: undefined, source: 'none' };
}

export async function resolveUserIdByEmail(email?: string): Promise<string | null> {
  if (!email) return null;
  const mongoose = await connectToDb();
  const db = mongoose.connection.db;
  if (!db) return null;
  const user = await db.collection('user').findOne<{ _id?: unknown; id?: string; email?: string }>({ email });
  if (!user) return null;
  const userId = (user.id as string) || String(user._id || '');
  return userId || null;
}

export async function resolveEmailForRequest(req: Request, hint?: { bodyEmail?: string; queryEmail?: string; headersEmail?: string }): Promise<{ email?: string; emailSource: string; emailDetail?: string }> {
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
