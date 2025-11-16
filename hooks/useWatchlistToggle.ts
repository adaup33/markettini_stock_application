'use client';

import { useState, useCallback } from 'react';
import { toggleWatchlist } from '@/lib/actions/watchlist-client.actions';

/**
 * Hook for managing watchlist toggle state and optimistic updates
 * @param symbol Stock symbol
 * @param initialState Initial watchlist state
 * @param company Company name (optional)
 * @returns State and toggle function
 */
export function useWatchlistToggle(
    symbol: string,
    initialState: boolean,
    company?: string
) {
    const [isInWatchlist, setIsInWatchlist] = useState(initialState);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const toggle = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        
        // Optimistic update
        const previousState = isInWatchlist;
        setIsInWatchlist(!previousState);

        try {
            const result = await toggleWatchlist(symbol, previousState, company);
            
            if (!result.success) {
                // Revert on failure
                setIsInWatchlist(previousState);
                setError(result.error || 'Failed to update watchlist');
                return false;
            }
            
            // Update to authoritative state from server
            setIsInWatchlist(result.newState);
            return true;
        } catch (err) {
            // Revert on error
            setIsInWatchlist(previousState);
            setError('Network error');
            console.error('Watchlist toggle error:', err);
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [symbol, isInWatchlist, company]);

    return {
        isInWatchlist,
        isLoading,
        error,
        toggle,
    };
}
