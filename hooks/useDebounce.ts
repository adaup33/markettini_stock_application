'use client';

import { useCallback, useEffect, useRef } from 'react';

export function useDebounce(callback: () => void, delay: number) {
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const latestCallbackRef = useRef(callback);

    // Keep the latest callback in a ref so the debounced function doesn't need to
    // include `callback` in its dependency array (prevents identity churn).
    useEffect(() => {
        latestCallbackRef.current = callback;
    }, [callback]);

    const debounced = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            // call the latest callback reference
            latestCallbackRef.current();
        }, delay);
    }, [delay]);

    // Clear timeout on unmount or when delay changes
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [delay]);

    return debounced;
}