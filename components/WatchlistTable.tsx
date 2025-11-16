"use client";

import { useEffect, useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { fetchWatchlist } from "@/lib/actions/watchlist-client.actions";

const WATCHLIST_TABLE_HEADER = [
    "Company",
    "Symbol",
    "Price",
    "Change",
    "Market Cap",
    "P/E Ratio",
    "Alert",
    "Action",
];

interface WatchlistRow {
    company: string;
    symbol: string;
    price: string;
    change: string;
    marketCap: string;
    peRatio: string;
    alert: string;
    action: string;
    isStarred?: boolean;
}

interface WatchlistTableProps {
    email?: string;
}

const WatchlistTable = ({ email }: WatchlistTableProps) => {
    const [rows, setRows] = useState<WatchlistRow[]>([]);
    const [loading, setLoading] = useState(false);

    // No sample fallback — show empty state when no rows

    useEffect(() => {
        let mounted = true;

        async function load() {
            setLoading(true);
            try {
                const result = await fetchWatchlist(email);

                if (mounted && result.success && Array.isArray(result.data)) {
                    const mapped = result.data.map((d: any) => ({
                        company: d.company || d.symbol,
                        symbol: d.symbol,
                        price: d.price || "-",
                        change: d.change || "-",
                        marketCap: d.marketCap || "-",
                        peRatio: d.peRatio || "-",
                        alert: d.alert || "-",
                        action: "View",
                    }));
                    setRows(mapped);
                } else {
                    // no data
                    setRows([]);
                }
            } catch (err) {
                console.error("load watchlist error", err);
                if (mounted) setRows([]);
            } finally {
                if (mounted) setLoading(false);
            }
        }

        load();

        // WebSocket connection to receive live updates (preferred). Don't open WS during tests.
        let ws: WebSocket | null = null;
        if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'test') {
            try {
                const wsUrl = (process.env.NEXT_PUBLIC_WS_URL) ? process.env.NEXT_PUBLIC_WS_URL : `ws://${window.location.hostname}:${process.env.NEXT_PUBLIC_WS_PORT ?? 4001}`;
                ws = new WebSocket(wsUrl);
                ws.addEventListener('message', (ev) => {
                    try {
                        const msg = JSON.parse(ev.data);
                        if (msg?.type === 'watchlist:update') {
                            // If email is present in the payload and matches current user (or payload email undefined), refresh
                            const payloadEmail = msg.payload?.email;
                            if (!payloadEmail || !email || payloadEmail === email) {
                                load();
                            }
                        }
                    } catch (e) {
                        console.error('ws message parse error', e);
                    }
                });
            } catch (e) {
                // WS connection failed — we'll keep polling as a fallback
                console.warn('WS connection failed, falling back to polling', e);
                ws = null;
            }
        }

         // Poll every 15 seconds for live updates
         const interval = setInterval(() => {
             load();
         }, 15000);

         // Refresh on window focus or when document becomes visible
         const onVisibility = () => {
             if (document.visibilityState === 'visible') load();
         };
         window.addEventListener('focus', load);
         document.addEventListener('visibilitychange', onVisibility);

         return () => {
             mounted = false;
             clearInterval(interval);
             window.removeEventListener('focus', load);
             document.removeEventListener('visibilitychange', onVisibility);
             if (ws && ws.readyState === WebSocket.OPEN) ws.close();
         };
    }, [email]);

    const dataToRender = rows;

    if (loading) {
        return <div className="w-full p-4 text-center">Loading watchlist...</div>;
    }

    return (
        <div className="w-full">
            <Table>
                <TableHeader>
                    <TableRow>
                        {WATCHLIST_TABLE_HEADER.map((header) => (
                            <TableHead key={header} className="text-left">
                                {header}
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {dataToRender.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={8} className="text-center py-6 text-sm text-gray-400">
                                Your watchlist is empty — add stocks from Search or a Stock page.
                            </TableCell>
                        </TableRow>
                    ) : (
                        dataToRender.map((row) => (
                            <TableRow key={row.symbol}>
                                <TableCell className="text-left">{row.company}</TableCell>
                                <TableCell className="text-left">{row.symbol}</TableCell>
                                <TableCell className="text-left">{row.price}</TableCell>
                                <TableCell className="text-left">{row.change}</TableCell>
                                <TableCell className="text-left">{row.marketCap}</TableCell>
                                <TableCell className="text-left">{row.peRatio}</TableCell>
                                <TableCell className="text-left">{row.alert}</TableCell>
                                <TableCell className="text-left">{row.action}</TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
             </Table>
         </div>
     );
 };

 export default WatchlistTable;
