'use server';

import {getAuth} from "@/lib/better-auth/auth";
import {inngest} from "@/lib/inngest/client";
import {headers} from "next/headers";

export const signUpWithEmail = async ({ email, password, fullName, country, investmentGoals, riskTolerance, preferredIndustry }: SignUpFormData) => {
    try {
        const auth = await getAuth();
        const response = await auth.api.signUpEmail({ body: { email, password, name: fullName } })

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
        
        // Return a more descriptive error
        return { 
            success: false, 
            error: errorMessage.includes('email') ? errorMessage : 'Failed to create account. Please try again.' 
        }
    }
}

export const signInWithEmail = async ({ email, password }: SignInFormData) => {
    try {
        const auth = await getAuth();
        const response = await auth.api.signInEmail({ body: { email, password } })

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