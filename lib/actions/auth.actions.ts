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
        console.error('Sign up failed', e)
        
        // Provide more specific error messages
        if (e instanceof Error) {
            const errorMessage = e.message.toLowerCase();
            if (errorMessage.includes('email')) {
                return { success: false, error: 'This email is already registered. Please use a different email or sign in.' }
            }
            if (errorMessage.includes('password')) {
                return { success: false, error: 'Password does not meet requirements. Please use at least 8 characters.' }
            }
        }
        
        return { success: false, error: 'Sign up failed. Please try again.' }
    }
}

export const signInWithEmail = async ({ email, password }: SignInFormData) => {
    try {
        const auth = await getAuth();
        const response = await auth.api.signInEmail({ body: { email, password } })

        return { success: true, data: response }
    } catch (e) {
        console.error('Sign in failed', e)
        
        // Provide more specific error message
        if (e instanceof Error) {
            const errorMessage = e.message.toLowerCase();
            if (errorMessage.includes('invalid') || errorMessage.includes('credentials')) {
                return { success: false, error: 'Invalid email or password. Please try again.' }
            }
        }
        
        return { success: false, error: 'Sign in failed. Please try again.' }
    }
}

export const signOut = async () => {
    try {
        const auth = await getAuth();
        await auth.api.signOut({ headers: await headers() });
    } catch (e) {
        console.error('Sign out failed', e)
        return { success: false, error: 'Sign out failed. Please try again.' }
    }
}