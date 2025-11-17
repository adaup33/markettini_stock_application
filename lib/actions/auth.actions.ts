'use server';

import {getAuth} from "@/lib/better-auth/auth";
import {inngest} from "@/lib/inngest/client";
import {headers} from "next/headers";

export const signUpWithEmail = async ({ email, password, fullName, country, investmentGoals, riskTolerance, preferredIndustry }: SignUpFormData) => {
    try {
        const auth = await getAuth();
        // Create user without auto-sign-in (autoSignIn is disabled)
        // We'll handle sign-in from the client side
        const response = await auth.api.signUpEmail({ 
            body: { email, password, name: fullName },
            headers: await headers()
        })

        // Send welcome email event
        if(response) {
            await inngest.send({
                name: 'app/user.created',
                data: { email, name: fullName, country, investmentGoals, riskTolerance, preferredIndustry }
            })
        }

        return { success: true, data: response }
    } catch (e) {
        console.error('Sign up error:', e)
        
        // Extract error message from Better Auth error
        const errorMessage = e instanceof Error ? e.message : 'Sign up failed';
        
        // Check if this is a "user already exists" error
        if (errorMessage.toLowerCase().includes('user') && 
            (errorMessage.toLowerCase().includes('exists') || errorMessage.toLowerCase().includes('already'))) {
            return { 
                success: false, 
                error: 'An account with this email already exists. Please sign in instead.' 
            }
        }
        
        // Check for email-related errors
        if (errorMessage.toLowerCase().includes('email')) {
            return {
                success: false,
                error: errorMessage
            }
        }
        
        // Generic error
        return { 
            success: false, 
            error: 'Failed to create account. Please try again.' 
        }
    }
}

export const signInWithEmail = async ({ email, password }: SignInFormData) => {
    try {
        const auth = await getAuth();
        // Pass headers to allow Better Auth to set cookies properly
        const response = await auth.api.signInEmail({ 
            body: { email, password },
            headers: await headers()
        })

        return { success: true, data: response }
    } catch (e) {
        console.log('Sign in failed', e)
        return { success: false, error: 'Sign in failed' }
    }
}

export const signOut = async () => {
    try {
        const auth = await getAuth();
        await auth.api.signOut({ headers: await headers() });
    } catch (e) {
        console.log('Sign out failed', e)
        return { success: false, error: 'Sign out failed' }
    }
}