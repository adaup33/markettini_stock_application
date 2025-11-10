'use client';

import { useCallback, useEffect, useRef } from 'react';

// Keep the debounced function identity stable by storing the latest callback in a ref.
// The returned debounced function only depends on `delay` so it won't be recreated when
// `callback` changes (avoids stale scheduled callbacks and repeated recreations).
export function useDebounce<T extends (...args: any[]) => any>(callback: T, delay: number) {
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const latestCallbackRef = useRef<T>(callback);

    // Always keep the latest callback in a ref so the debounced function can call it.
    useEffect(() => {
        latestCallbackRef.current = callback;
    }, [callback]);

    // Clear timeout on unmount (and when delay changes we'll clear in the returned function)
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return useCallback((...args: Parameters<T>) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            try {
                latestCallbackRef.current(...args);
            } catch (e) {
                // Swallow to avoid unhandled exceptions inside setTimeout
                // Caller code should handle its own errors.
                // eslint-disable-next-line no-console
                console.error('debounced callback error', e);
            }
        }, delay);
    }, [delay]);
}