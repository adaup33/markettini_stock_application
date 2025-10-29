'use server';

import { connectToDb } from '@/database/mongoose';
import { Watchlist } from '@/database/models/watchlist.model';

export async function getWatchlistSymbolsByEmail(email: string): Promise<string[]> {
    if (!email) return [];

    try {
        const mongoose = await connectToDb();
        const db = mongoose.connection.db;
        if (!db) {
            console.error('MongoDB connection not found');
            return [];
        }

        // Better Auth stores users in the "user" collection
        const user = await db.collection('user').findOne<{ _id?: unknown; id?: string; email?: string }>({ email });

        if (!user) return [];

        const userId = (user.id as string) || String(user._id || '');
        if (!userId) return [];

        const items = await Watchlist.find({ userId }, { symbol: 1 }).lean();
        return items.map((i) => String(i.symbol));
    } catch (err) {
        console.error('getWatchlistSymbolsByEmail error:', err);
        return [];
    }
}

// New helpers
export interface WatchlistRow {
    userId: string;
    symbol: string;
    company: string;
    addedAt: Date;
}

async function resolveUserIdByEmail(email?: string): Promise<string | null> {
    if (!email) return null;
    const mongoose = await connectToDb();
    const db = mongoose.connection.db;
    if (!db) {
        console.error('MongoDB connection not found');
        return null;
    }

    const user = await db.collection('user').findOne<{ _id?: unknown; id?: string; email?: string }>({ email });
    if (!user) return null;
    const userId = (user.id as string) || String(user._id || '');
    return userId || null;
}

export async function getWatchlistByEmail(email?: string): Promise<WatchlistRow[]> {
    try {
        const userId = await resolveUserIdByEmail(email);
        if (!userId) return [];

        const items = await Watchlist.find({ userId }).lean();
        return items.map((it) => ({
            userId: String(it.userId),
            symbol: String(it.symbol),
            company: String(it.company),
            addedAt: it.addedAt || (it as any).createdAt || new Date(),
        }));
    } catch (err) {
        console.error('getWatchlistByEmail error:', err);
        return [];
    }
}

export async function addSymbolToWatchlist(email: string | undefined, symbol: string, company = ''): Promise<{ success: boolean; error?: string }> {
    if (!email || !symbol) return { success: false, error: 'Missing email or symbol' };
    try {
        const userId = await resolveUserIdByEmail(email);
        if (!userId) return { success: false, error: 'User not found' };

        const normalized = String(symbol).trim().toUpperCase();
        const doc = { userId, symbol: normalized, company: company || normalized, addedAt: new Date() };

        // Upsert to avoid duplicate error
        await Watchlist.updateOne({ userId, symbol: normalized }, { $setOnInsert: doc }, { upsert: true });
        return { success: true };
    } catch (err: any) {
        console.error('addSymbolToWatchlist error:', err);
        return { success: false, error: err?.message || 'Failed to add' };
    }
}

export async function removeSymbolFromWatchlist(email: string | undefined, symbol: string): Promise<{ success: boolean; error?: string }> {
    if (!email || !symbol) return { success: false, error: 'Missing email or symbol' };
    try {
        const userId = await resolveUserIdByEmail(email);
        if (!userId) return { success: false, error: 'User not found' };

        const normalized = String(symbol).trim().toUpperCase();
        await Watchlist.deleteOne({ userId, symbol: normalized });
        return { success: true };
    } catch (err: any) {
        console.error('removeSymbolFromWatchlist error:', err);
        return { success: false, error: err?.message || 'Failed to remove' };
    }
}

// Removed no-op statements and exported `__watchlist_exports` to satisfy `"use server"` constraints
