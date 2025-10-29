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
                const url = `/api/watchlist${
                    email ? `?email=${encodeURIComponent(email)}` : ""
                }`;
                const res = await fetch(url);

                if (!res.ok) {
                    console.error('Failed to fetch watchlist, status:', res.status);
                    if (mounted) setRows([]);
                    return;
                }

                const json = await res.json();

                if (mounted && json?.success && Array.isArray(json.data)) {
                    const mapped = json.data.map((d: any) => ({
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
        };
    }, [email]);

    const handleWatchlistChange = async (symbol: string, next: boolean) => {
        try {
            if (next) {
                /* Add to watchlist*/
                await fetch("/api/watchlist", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, symbol }),
                });
            } else {
                // Remove from watchlist
                await fetch(
                    `/api/watchlist?email=${encodeURIComponent(
                        email || ""
                    )}&symbol=${encodeURIComponent(symbol)}`,
                    { method: "DELETE" }
                );
            }

            // After change, refetch immediately to reflect authoritative state
            const url = `/api/watchlist${email ? `?email=${encodeURIComponent(email)}` : ""}`;
            const res = await fetch(url);
            if (res.ok) {
                const json = await res.json();
                if (Array.isArray(json.data)) {
                    const mapped = json.data.map((d: any) => ({
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
                }
            }
        } catch (err) {
            console.error("watchlist toggle error", err);
        }
    };

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
