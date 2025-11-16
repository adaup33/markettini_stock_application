'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    fetchAlerts,
    createAlert,
    updateAlert,
    deleteAlert,
    toggleAlertActive,
    AlertItem,
    CreateAlertPayload,
    UpdateAlertPayload,
} from '@/lib/actions/alert-client.actions';

/**
 * Hook for managing alerts list and operations
 * Provides CRUD operations with loading states and error handling
 */
export function useAlerts(options?: { symbol?: string; autoLoad?: boolean }) {
    const [items, setItems] = useState<AlertItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await fetchAlerts(options);
            if (result.success && Array.isArray(result.data)) {
                setItems(result.data as AlertItem[]);
            } else {
                setItems([]);
                setError(result.error || 'Failed to load alerts');
            }
        } catch (err: any) {
            console.error('useAlerts load error:', err);
            setError(err?.message || 'Failed to load alerts');
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, [options]);

    // Auto-load on mount if enabled
    useEffect(() => {
        if (options?.autoLoad !== false) {
            load();
        }
    }, [load, options?.autoLoad]);

    const create = useCallback(async (payload: CreateAlertPayload) => {
        setSaving(true);
        setError(null);
        try {
            const result = await createAlert(payload);
            if (result.success) {
                // Reload to get fresh data
                await load();
                return true;
            } else {
                setError(result.error || 'Failed to create alert');
                return false;
            }
        } catch (err: any) {
            console.error('useAlerts create error:', err);
            setError(err?.message || 'Failed to create alert');
            return false;
        } finally {
            setSaving(false);
        }
    }, [load]);

    const update = useCallback(async (id: string, payload: UpdateAlertPayload) => {
        setError(null);
        try {
            const result = await updateAlert(id, payload);
            if (result.success) {
                // Update local state
                setItems((prev) =>
                    prev.map((item) =>
                        item._id === id ? { ...item, ...payload } : item
                    )
                );
                return true;
            } else {
                setError(result.error || 'Failed to update alert');
                return false;
            }
        } catch (err: any) {
            console.error('useAlerts update error:', err);
            setError(err?.message || 'Failed to update alert');
            return false;
        }
    }, []);

    const remove = useCallback(async (id: string) => {
        setError(null);
        const previousItems = items;
        
        // Optimistic update
        setItems((prev) => prev.filter((item) => item._id !== id));

        try {
            const result = await deleteAlert(id);
            if (!result.success) {
                // Revert on failure
                setItems(previousItems);
                setError(result.error || 'Failed to delete alert');
                return false;
            }
            return true;
        } catch (err: any) {
            // Revert on error
            setItems(previousItems);
            console.error('useAlerts remove error:', err);
            setError(err?.message || 'Failed to delete alert');
            return false;
        }
    }, [items]);

    const toggleActive = useCallback(async (id: string, currentState: boolean) => {
        setError(null);
        
        // Optimistic update
        setItems((prev) =>
            prev.map((item) =>
                item._id === id ? { ...item, active: !currentState } : item
            )
        );

        try {
            const result = await toggleAlertActive(id, currentState);
            if (!result.success) {
                // Revert on failure
                setItems((prev) =>
                    prev.map((item) =>
                        item._id === id ? { ...item, active: currentState } : item
                    )
                );
                setError(result.error || 'Failed to toggle alert');
                return false;
            }
            return true;
        } catch (err: any) {
            // Revert on error
            setItems((prev) =>
                prev.map((item) =>
                    item._id === id ? { ...item, active: currentState } : item
                )
            );
            console.error('useAlerts toggleActive error:', err);
            setError(err?.message || 'Failed to toggle alert');
            return false;
        }
    }, []);

    return {
        items,
        loading,
        error,
        saving,
        load,
        create,
        update,
        remove,
        toggleActive,
        setError, // Allow manual error clearing
    };
}
