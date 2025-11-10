/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom'; // Import to extend Jest matchers
import WatchlistTable from '@/components/WatchlistTable';

describe('WatchlistTable', () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('shows empty state when API returns empty list', async () => {
        (global as any).fetch = jest.fn().mockResolvedValueOnce({ ok: true, json: async () => ({ success: true, data: [] }) });

        render(<WatchlistTable email={"test@example.com"} />);

        await waitFor(() => expect((global as any).fetch).toHaveBeenCalled());
        // Wait for loading to finish and empty state to appear
        await waitFor(() => expect(screen.queryByText(/Loading watchlist.../i)).not.toBeInTheDocument());
        expect(screen.getByText(/Your watchlist is empty/i)).toBeInTheDocument();
    });

    it('calls API without email if not provided', async () => {
        (global as any).fetch = jest.fn().mockResolvedValueOnce({ ok: true, json: async () => ({ success: true, data: [] }) });

        render(<WatchlistTable />);

        await waitFor(() => expect((global as any).fetch).toHaveBeenCalled());
        // called with /api/watchlist (no query)
        expect((global as any).fetch).toHaveBeenCalledWith('/api/watchlist');
    });
});
