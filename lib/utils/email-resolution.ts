/**
 * Email resolution utilities for API routes
 * These are helper functions that don't require 'use server' directive
 */

import {auth} from "@/lib/better-auth/auth";

export type EmailSource = 'body' | 'query' | 'header' | 'auth' | 'nodemailer_env' | 'dev_fallback' | 'none';

export interface EmailResolutionResult {
    email?: string;
    source: EmailSource;
    detail?: string;
}

export interface EmailResolutionHints {
    bodyEmail?: string;
    queryEmail?: string;
    headersEmail?: string;
}

/**
 * Derive email from authentication session
 */
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

/**
 * Check if nodemailer fallback is allowed
 */
export function nodemailerFallbackAllowed(): boolean {
    return process.env.WATCHLIST_ALLOW_SMTP_EMAIL === '1' || process.env.NODE_ENV !== 'production';
}

/**
 * Resolve email from request hints (body, query, headers)
 */
export function resolveEmailFromRequest(req: Request, hint?: EmailResolutionHints): EmailResolutionResult {
    if (hint?.bodyEmail && typeof hint.bodyEmail === 'string') {
        return { email: hint.bodyEmail, source: 'body' };
    }
    if (hint?.queryEmail && typeof hint.queryEmail === 'string') {
        return { email: hint.queryEmail, source: 'query' };
    }
    if (hint?.headersEmail && typeof hint.headersEmail === 'string') {
        return { email: hint.headersEmail, source: 'header' };
    }
    return { email: undefined, source: 'none' };
}

/**
 * Resolve email with all fallback strategies
 * Tries in order: request hints, auth session, nodemailer env, dev env
 */
export async function resolveEmailWithFallbacks(req: Request, hints?: EmailResolutionHints): Promise<EmailResolutionResult> {
    // Try request-provided email first
    const resolved = resolveEmailFromRequest(req, hints);
    if (resolved.email) return resolved;

    // Try auth-derived email
    const derived = await deriveEmailFromAuth(req);
    if (derived) {
        return { email: derived, source: 'auth' };
    }

    // Try nodemailer env fallback
    if (nodemailerFallbackAllowed() && process.env.NODEMAILER_EMAIL) {
        return { email: process.env.NODEMAILER_EMAIL, source: 'nodemailer_env', detail: 'NODEMAILER_EMAIL' };
    }

    // Try dev fallback in non-production
    if (process.env.NODE_ENV !== 'production') {
        const dev = process.env.DEV_WATCHLIST_EMAIL || process.env.NEXT_PUBLIC_DEV_EMAIL;
        if (dev) {
            return {
                email: dev,
                source: 'dev_fallback',
                detail: process.env.DEV_WATCHLIST_EMAIL ? 'DEV_WATCHLIST_EMAIL' : 'NEXT_PUBLIC_DEV_EMAIL'
            };
        }
    }

    return { email: undefined, source: 'none' };
}
