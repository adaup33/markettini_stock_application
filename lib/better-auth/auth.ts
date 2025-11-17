import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { connectToDb } from "@/database/mongoose";
import { nextCookies } from "better-auth/next-js";
import type { Db } from "mongodb";

let authInstance: ReturnType<typeof betterAuth> | null = null;

export const getAuth = async () => {
    if (authInstance) return authInstance;

    const mongoose = await connectToDb();
    const rawDb = mongoose.connection.db;

    if (!rawDb) throw new Error("MongoDB connection not found");

    // Mongoose's `connection.db` is the native MongoDB driver's `Db` instance.
    // We narrow the type for TypeScript without using `any` (disallowed by lint)
    // or `never` (overly broad and confusing). This keeps adapter types intact.
    const db: Db = rawDb as unknown as Db;

    authInstance = betterAuth({
        database: mongodbAdapter(db),
        secret: process.env.BETTER_AUTH_SECRET,
        baseURL: process.env.BETTER_AUTH_URL,
        emailAndPassword: {
            enabled: true,
            disableSignUp: false,
            requireEmailVerification: false,
            minPasswordLength: 8,
            maxPasswordLength: 128,
            autoSignIn: true,
        },
        plugins: [nextCookies()],
    });

    return authInstance;
}