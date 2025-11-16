'use client';

/**
 * Client-side watchlist operations
 * Centralized API calls for watchlist features to avoid duplication
 */

export interface WatchlistApiResponse {
    success: boolean;
    data?: any[];
    error?: string;
    meta?: {
        email: string | null;
        emailSource?: string;
        emailDetail?: string;
    };
}

/**
 * Fetch user's watchlist from the API
 * @param email Optional email to fetch watchlist for (mainly for testing/admin)
 * @returns Watchlist items with quotes and metadata
 */
export async function fetchWatchlist(email?: string): Promise<WatchlistApiResponse> {
    try {
        const url = `/api/watchlist${email ? `?email=${encodeURIComponent(email)}` : ''}`;
        const res = await fetch(url);
        
        if (!res.ok) {
            console.error('Failed to fetch watchlist, status:', res.status);
            return { success: false, error: 'Failed to fetch watchlist', data: [] };
        }
        
        return await res.json();
    } catch (err) {
        console.error('fetchWatchlist error:', err);
        return { success: false, error: 'Network error', data: [] };
    }
}

/**
 * Add a symbol to user's watchlist
 * @param symbol Stock symbol to add
 * @param company Company name (optional)
 * @param email Optional email (for testing/admin)
 * @returns Success status and metadata
 */
export async function addToWatchlist(
    symbol: string, 
    company?: string, 
    email?: string
): Promise<WatchlistApiResponse> {
    try {
        const devEmail = process.env.NEXT_PUBLIC_DEV_EMAIL;
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (devEmail) headers['x-user-email'] = devEmail;
        
        const payload: any = { symbol };
        if (company) payload.company = company;
        if (email || devEmail) payload.email = email || devEmail;
        
        const res = await fetch('/api/watchlist', {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
        });
        
        if (!res.ok) {
            const json = await res.json().catch(() => ({ error: 'Failed to add to watchlist' }));
            return { success: false, error: json.error || 'Failed to add to watchlist' };
        }
        
        return await res.json();
    } catch (err) {
        console.error('addToWatchlist error:', err);
        return { success: false, error: 'Network error' };
    }
}

/**
 * Remove a symbol from user's watchlist
 * @param symbol Stock symbol to remove
 * @param email Optional email (for testing/admin)
 * @returns Success status and metadata
 */
export async function removeFromWatchlist(
    symbol: string,
    email?: string
): Promise<WatchlistApiResponse> {
    try {
        const devEmail = process.env.NEXT_PUBLIC_DEV_EMAIL;
        const headers: Record<string, string> = {};
        if (devEmail) headers['x-user-email'] = devEmail;
        
        const urlEmail = email || devEmail;
        const url = `/api/watchlist?symbol=${encodeURIComponent(symbol)}${urlEmail ? `&email=${encodeURIComponent(urlEmail)}` : ''}`;
        
        const res = await fetch(url, {
            method: 'DELETE',
            headers,
        });
        
        if (!res.ok) {
            const json = await res.json().catch(() => ({ error: 'Failed to remove from watchlist' }));
            return { success: false, error: json.error || 'Failed to remove from watchlist' };
        }
        
        return await res.json();
    } catch (err) {
        console.error('removeFromWatchlist error:', err);
        return { success: false, error: 'Network error' };
    }
}

/**
 * Toggle a symbol in the watchlist (add if not present, remove if present)
 * @param symbol Stock symbol to toggle
 * @param isCurrentlyInWatchlist Current state
 * @param company Company name (optional, for adding)
 * @param email Optional email (for testing/admin)
 * @returns New state and metadata
 */
export async function toggleWatchlist(
    symbol: string,
    isCurrentlyInWatchlist: boolean,
    company?: string,
    email?: string
): Promise<{ success: boolean; newState: boolean; error?: string }> {
    const result = isCurrentlyInWatchlist
        ? await removeFromWatchlist(symbol, email)
        : await addToWatchlist(symbol, company, email);
    
    return {
        success: result.success,
        newState: !isCurrentlyInWatchlist,
        error: result.error,
    };
}
