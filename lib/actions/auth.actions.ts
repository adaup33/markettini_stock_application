'use server';

import {auth} from "@/lib/better-auth/auth";
import {inngest} from "@/lib/inngest/client";
import {headers} from "next/headers";

export const signUpWithEmail = async ({ email, password, fullName, country, investmentGoals, riskTolerance, preferredIndustry }: SignUpFormData) => {
    try {
        const response = await auth.api.signUpEmail({ body: { email, password, name: fullName } })

        if(response) {
            await inngest.send({
                name: 'app/user.created',
                data: { email, name: fullName, country, investmentGoals, riskTolerance, preferredIndustry }
            })
        }

        return { success: true, data: response }
    } catch (e) {
        console.log('Sign up failed', e)
        return { success: false, error: 'Sign up failed' }
    }
}

export const signInWithEmail = async ({ email, password }: SignInFormData) => {
    try {
        const response = await auth.api.signInEmail({ body: { email, password } })

        return { success: true, data: response }
    } catch (e) {
        console.log('Sign in failed', e)
        return { success: false, error: 'Sign in failed' }
    }
}

export const signOut = async () => {
    try {
        await auth.api.signOut({ headers: await headers() });
    } catch (e) {
        console.log('Sign out failed', e)
        return { success: false, error: 'Sign out failed' }
    }
}

// Shared email resolution utilities for API routes
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