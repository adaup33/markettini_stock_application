import { getAuth } from "@/lib/better-auth/auth";
import { NextRequest } from "next/server";

// Force Node.js runtime for MongoDB and better-auth compatibility
export const runtime = 'nodejs';

/**
 * Better Auth API Route Handler
 * 
 * This catch-all route handles all authentication requests including:
 * - Sign up: POST /api/auth/sign-up/email
 * - Sign in: POST /api/auth/sign-in/email
 * - Sign out: POST /api/auth/sign-out
 * - Session management
 * - Other authentication operations
 * 
 * Better Auth uses its own internal routing to handle these endpoints.
 */
export async function GET(request: NextRequest) {
    const auth = await getAuth();
    return auth.handler(request);
}

export async function POST(request: NextRequest) {
    const auth = await getAuth();
    return auth.handler(request);
}
