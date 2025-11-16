'use client';

/**
 * Client-side alert operations
 * Centralized API calls for alert features to avoid duplication
 */

export type AlertOperator = '>' | '<' | '>=' | '<=' | '==';

export interface AlertItem {
    _id: string;
    userId: string;
    symbol: string;
    operator: AlertOperator;
    threshold: number;
    active: boolean;
    note?: string;
    createdAt: string;
    lastTriggeredAt?: string;
}

export interface AlertApiResponse {
    success: boolean;
    data?: AlertItem | AlertItem[];
    error?: string;
    meta?: {
        email: string | null;
        emailSource?: string;
        emailDetail?: string;
        page?: number;
        limit?: number;
        total?: number;
    };
}

export interface CreateAlertPayload {
    symbol: string;
    operator: AlertOperator;
    threshold: number;
    note?: string;
    active?: boolean;
}

export interface UpdateAlertPayload {
    threshold?: number;
    operator?: AlertOperator;
    note?: string;
    active?: boolean;
}

/**
 * Fetch user's alerts from the API
 * @param options Optional filters and pagination
 * @returns Alert items with metadata
 */
export async function fetchAlerts(options?: {
    symbol?: string;
    page?: number;
    limit?: number;
    email?: string;
}): Promise<AlertApiResponse> {
    try {
        const params = new URLSearchParams();
        if (options?.symbol) params.append('symbol', options.symbol);
        if (options?.page) params.append('page', String(options.page));
        if (options?.limit) params.append('limit', String(options.limit));
        if (options?.email) params.append('email', options.email);

        const url = `/api/alerts${params.toString() ? `?${params.toString()}` : ''}`;
        const res = await fetch(url);

        if (!res.ok) {
            console.error('Failed to fetch alerts, status:', res.status);
            return { success: false, error: 'Failed to fetch alerts', data: [] };
        }

        return await res.json();
    } catch (err) {
        console.error('fetchAlerts error:', err);
        return { success: false, error: 'Network error', data: [] };
    }
}

/**
 * Create a new alert
 * @param payload Alert configuration
 * @param email Optional email (for testing/admin)
 * @returns Created alert and metadata
 */
export async function createAlert(
    payload: CreateAlertPayload,
    email?: string
): Promise<AlertApiResponse> {
    try {
        const body: any = { ...payload };
        if (email) body.email = email;

        const res = await fetch('/api/alerts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        if (!res.ok) {
            const json = await res.json().catch(() => ({ error: 'Failed to create alert' }));
            return { success: false, error: json.error || 'Failed to create alert' };
        }

        return await res.json();
    } catch (err) {
        console.error('createAlert error:', err);
        return { success: false, error: 'Network error' };
    }
}

/**
 * Update an existing alert
 * @param id Alert ID
 * @param payload Fields to update
 * @returns Updated alert and metadata
 */
export async function updateAlert(
    id: string,
    payload: UpdateAlertPayload
): Promise<AlertApiResponse> {
    try {
        const res = await fetch(`/api/alerts/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            const json = await res.json().catch(() => ({ error: 'Failed to update alert' }));
            return { success: false, error: json.error || 'Failed to update alert' };
        }

        return await res.json();
    } catch (err) {
        console.error('updateAlert error:', err);
        return { success: false, error: 'Network error' };
    }
}

/**
 * Delete an alert
 * @param id Alert ID
 * @returns Success status and metadata
 */
export async function deleteAlert(id: string): Promise<AlertApiResponse> {
    try {
        const res = await fetch(`/api/alerts/${id}`, {
            method: 'DELETE',
        });

        if (!res.ok) {
            const json = await res.json().catch(() => ({ error: 'Failed to delete alert' }));
            return { success: false, error: json.error || 'Failed to delete alert' };
        }

        return await res.json();
    } catch (err) {
        console.error('deleteAlert error:', err);
        return { success: false, error: 'Network error' };
    }
}

/**
 * Toggle alert active status
 * @param id Alert ID
 * @param currentState Current active state
 * @returns New state and metadata
 */
export async function toggleAlertActive(
    id: string,
    currentState: boolean
): Promise<{ success: boolean; newState: boolean; error?: string }> {
    const result = await updateAlert(id, { active: !currentState });
    return {
        success: result.success,
        newState: !currentState,
        error: result.error,
    };
}
