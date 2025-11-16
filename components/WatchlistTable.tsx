"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search as SearchIcon, TrendingUp, TrendingDown } from "lucide-react";
import WatchlistButton from "@/components/WatchlistButton";

const WATCHLIST_TABLE_HEADER = [
    "Company",
    "Symbol",
    "Current Price",
    "Change",
    "Price Added",
    "Gain/Loss",
    "Market Cap",
    "P/E Ratio",
    "Actions",
];

interface WatchlistRow {
    company: string;
    symbol: string;
    price: string;
    priceNum: number | null;
    change: string;
    changePercent: string;
    marketCap: string;
    peRatio: string;
    alert: string;
    action: string;
    isStarred?: boolean;
    addedPrice?: number | null;
    addedAt?: string;
}

interface WatchlistTableProps {
    email?: string;
}

const WatchlistTable = ({ email }: WatchlistTableProps) => {
    const [rows, setRows] = useState<WatchlistRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const router = useRouter();

    // Filter rows based on search term
    const filteredRows = useMemo(() => {
        if (!searchTerm.trim()) return rows;
        const lower = searchTerm.toLowerCase();
        return rows.filter(
            (row) =>
                row.company.toLowerCase().includes(lower) ||
                row.symbol.toLowerCase().includes(lower)
        );
    }, [rows, searchTerm]);

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
                    const mapped = json.data.map((d: any) => {
                        // Parse current price
                        const priceStr = d.price || "-";
                        const priceMatch = priceStr.match(/[\d.]+/);
                        const priceNum = priceMatch ? parseFloat(priceMatch[0]) : null;

                        // Parse added price (when stock was added to watchlist)
                        const addedPrice = d.addedPrice || null;

                        // Calculate gain/loss
                        let gainLoss = "-";
                        let gainLossPercent = 0;
                        if (priceNum !== null && addedPrice !== null && addedPrice > 0) {
                            const diff = priceNum - addedPrice;
                            gainLossPercent = (diff / addedPrice) * 100;
                            const sign = diff >= 0 ? "+" : "";
                            gainLoss = `${sign}$${diff.toFixed(2)} (${sign}${gainLossPercent.toFixed(2)}%)`;
                        }

                        return {
                            company: d.company || d.symbol,
                            symbol: d.symbol,
                            price: priceStr,
                            priceNum: priceNum,
                            change: d.change || "-",
                            changePercent: d.change || "-",
                            marketCap: d.marketCap || "-",
                            peRatio: d.peRatio || "-",
                            alert: d.alert || "-",
                            action: "View",
                            addedPrice: addedPrice,
                            addedAt: d.addedAt || "",
                            gainLoss: gainLoss,
                            gainLossPercent: gainLossPercent,
                        };
                    });
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

         // Poll every 30 seconds for live updates (reduced from 15s to minimize server load)
         const interval = setInterval(() => {
             load();
         }, 30000);

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
                    const mapped = json.data.map((d: any) => {
                        const priceStr = d.price || "-";
                        const priceMatch = priceStr.match(/[\d.]+/);
                        const priceNum = priceMatch ? parseFloat(priceMatch[0]) : null;
                        const addedPrice = d.addedPrice || null;
                        let gainLoss = "-";
                        let gainLossPercent = 0;
                        if (priceNum !== null && addedPrice !== null && addedPrice > 0) {
                            const diff = priceNum - addedPrice;
                            gainLossPercent = (diff / addedPrice) * 100;
                            const sign = diff >= 0 ? "+" : "";
                            gainLoss = `${sign}$${diff.toFixed(2)} (${sign}${gainLossPercent.toFixed(2)}%)`;
                        }
                        return {
                            company: d.company || d.symbol,
                            symbol: d.symbol,
                            price: priceStr,
                            priceNum: priceNum,
                            change: d.change || "-",
                            changePercent: d.change || "-",
                            marketCap: d.marketCap || "-",
                            peRatio: d.peRatio || "-",
                            alert: d.alert || "-",
                            action: "View",
                            addedPrice: addedPrice,
                            addedAt: d.addedAt || "",
                            gainLoss: gainLoss,
                            gainLossPercent: gainLossPercent,
                        };
                    });
                    setRows(mapped);
                }
            }
        } catch (err) {
            console.error("watchlist toggle error", err);
        }
    };

    const dataToRender = filteredRows;

    const handleRowClick = (symbol: string) => {
        router.push(`/stocks/${symbol}`);
    };

    // Memoize table headers to avoid recreation on every render
    const tableHeaders = useMemo(() => WATCHLIST_TABLE_HEADER, []);

    if (loading) {
        return (
            <div className="w-full p-4 text-center">
                <div className="inline-flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent"></div>
                    <span className="text-gray-400">Loading watchlist...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full">
            <Table>
                <TableHeader>
                    <TableRow>
                        {tableHeaders.map((header) => (
                            <TableHead key={header} className="text-left">
                                {header}
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                        {dataToRender.length === 0 ? (
                            <TableRow className="hover:bg-transparent">
                                <TableCell colSpan={9} className="text-center py-8 text-sm text-gray-400">
                                    {searchTerm ? "No stocks found matching your search." : "Your watchlist is empty — add stocks from Search or a Stock page."}
                                </TableCell>
                            </TableRow>
                        ) : (
                            dataToRender.map((row: any) => (
                                <TableRow 
                                    key={row.symbol}
                                    className="border-gray-800 hover:bg-gray-900/60 cursor-pointer transition-colors"
                                    onClick={() => handleRowClick(row.symbol)}
                                >
                                    <TableCell className="text-left font-medium text-gray-100">{row.company}</TableCell>
                                    <TableCell className="text-left text-emerald-400 font-semibold">{row.symbol}</TableCell>
                                    <TableCell className="text-left text-gray-200">{row.price}</TableCell>
                                    <TableCell className="text-left">
                                        <span className={`inline-flex items-center gap-1 ${
                                            row.changePercent.includes('+') ? 'text-green-500' : 
                                            row.changePercent.includes('-') ? 'text-red-500' : 
                                            'text-gray-400'
                                        }`}>
                                            {row.changePercent.includes('+') ? <TrendingUp className="h-3 w-3" /> : 
                                             row.changePercent.includes('-') ? <TrendingDown className="h-3 w-3" /> : null}
                                            {row.change}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-left text-gray-400">
                                        {row.addedPrice ? `$${row.addedPrice.toFixed(2)}` : '-'}
                                    </TableCell>
                                    <TableCell className="text-left">
                                        <span className={`font-medium ${
                                            row.gainLossPercent > 0 ? 'text-green-500' : 
                                            row.gainLossPercent < 0 ? 'text-red-500' : 
                                            'text-gray-400'
                                        }`}>
                                            {row.gainLoss || '-'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-left text-gray-400">{row.marketCap}</TableCell>
                                    <TableCell className="text-left text-gray-400">{row.peRatio}</TableCell>
                                    <TableCell className="text-left" onClick={(e) => e.stopPropagation()}>
                                        <WatchlistButton
                                            symbol={row.symbol}
                                            company={row.company}
                                            isInWatchlist={true}
                                            type="icon"
                                            onWatchlistChange={async (symbol, isAdded) => {
                                                // Optimistically remove from UI
                                                if (!isAdded) {
                                                    setRows((prev) => prev.filter((r) => r.symbol !== symbol));
                                                }
                                                
                                                // Call API to remove from watchlist
                                                try {
                                                    const url = `/api/watchlist?symbol=${encodeURIComponent(symbol)}${email ? `&email=${encodeURIComponent(email)}` : ''}`;
                                                    const res = await fetch(url, { method: 'DELETE' });
                                                    if (!res.ok) {
                                                        throw new Error('Failed to remove from watchlist');
                                                    }
                                                } catch (err) {
                                                    console.error('Failed to remove from watchlist', err);
                                                    // Reload the list on error to get the correct state
                                                    const url = `/api/watchlist${email ? `?email=${encodeURIComponent(email)}` : ""}`;
                                                    const res = await fetch(url);
                                                    if (res.ok) {
                                                        const json = await res.json();
                                                        if (Array.isArray(json.data)) {
                                                            const mapped = json.data.map((d: any) => {
                                                                const priceStr = d.price || "-";
                                                                const priceMatch = priceStr.match(/[\d.]+/);
                                                                const priceNum = priceMatch ? parseFloat(priceMatch[0]) : null;
                                                                const addedPrice = d.addedPrice || null;
                                                                let gainLoss = "-";
                                                                let gainLossPercent = 0;
                                                                if (priceNum !== null && addedPrice !== null && addedPrice > 0) {
                                                                    const diff = priceNum - addedPrice;
                                                                    gainLossPercent = (diff / addedPrice) * 100;
                                                                    const sign = diff >= 0 ? "+" : "";
                                                                    gainLoss = `${sign}$${diff.toFixed(2)} (${sign}${gainLossPercent.toFixed(2)}%)`;
                                                                }
                                                                return {
                                                                    company: d.company || d.symbol,
                                                                    symbol: d.symbol,
                                                                    price: priceStr,
                                                                    priceNum: priceNum,
                                                                    change: d.change || "-",
                                                                    changePercent: d.change || "-",
                                                                    marketCap: d.marketCap || "-",
                                                                    peRatio: d.peRatio || "-",
                                                                    alert: d.alert || "-",
                                                                    action: "View",
                                                                    addedPrice: addedPrice,
                                                                    addedAt: d.addedAt || "",
                                                                    gainLoss: gainLoss,
                                                                    gainLossPercent: gainLossPercent,
                                                                };
                                                            });
                                                            setRows(mapped);
                                                        }
                                                    }
                                                }
                                            }}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>

            {/* Mobile View */}
            <div className="md:hidden space-y-3">
                {dataToRender.length === 0 ? (
                    <div className="text-center py-8 text-sm text-gray-400">
                        {searchTerm ? "No stocks found matching your search." : "Your watchlist is empty — add stocks from Search or a Stock page."}
                    </div>
                ) : (
                    dataToRender.map((row: any) => (
                        <div
                            key={row.symbol}
                            className="bg-gray-900/40 border border-gray-800 rounded-lg p-4 hover:bg-gray-900/60 transition-colors cursor-pointer"
                            onClick={() => handleRowClick(row.symbol)}
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-gray-100 truncate">{row.company}</h3>
                                    <p className="text-sm text-emerald-400 font-medium">{row.symbol}</p>
                                </div>
                                <div onClick={(e) => e.stopPropagation()}>
                                    <WatchlistButton
                                        symbol={row.symbol}
                                        company={row.company}
                                        isInWatchlist={true}
                                        type="icon"
                                        onWatchlistChange={async (symbol, isAdded) => {
                                            // Optimistically remove from UI
                                            if (!isAdded) {
                                                setRows((prev) => prev.filter((r) => r.symbol !== symbol));
                                            }
                                            
                                            // Call API to remove from watchlist
                                            try {
                                                const url = `/api/watchlist?symbol=${encodeURIComponent(symbol)}${email ? `&email=${encodeURIComponent(email)}` : ''}`;
                                                const res = await fetch(url, { method: 'DELETE' });
                                                if (!res.ok) {
                                                    throw new Error('Failed to remove from watchlist');
                                                }
                                            } catch (err) {
                                                console.error('Failed to remove from watchlist', err);
                                                // Reload the list on error to get the correct state
                                                const url = `/api/watchlist${email ? `?email=${encodeURIComponent(email)}` : ""}`;
                                                const res = await fetch(url);
                                                if (res.ok) {
                                                    const json = await res.json();
                                                    if (Array.isArray(json.data)) {
                                                        const mapped = json.data.map((d: any) => {
                                                            const priceStr = d.price || "-";
                                                            const priceMatch = priceStr.match(/[\d.]+/);
                                                            const priceNum = priceMatch ? parseFloat(priceMatch[0]) : null;
                                                            const addedPrice = d.addedPrice || null;
                                                            let gainLoss = "-";
                                                            let gainLossPercent = 0;
                                                            if (priceNum !== null && addedPrice !== null && addedPrice > 0) {
                                                                const diff = priceNum - addedPrice;
                                                                gainLossPercent = (diff / addedPrice) * 100;
                                                                const sign = diff >= 0 ? "+" : "";
                                                                gainLoss = `${sign}$${diff.toFixed(2)} (${sign}${gainLossPercent.toFixed(2)}%)`;
                                                            }
                                                            return {
                                                                company: d.company || d.symbol,
                                                                symbol: d.symbol,
                                                                price: priceStr,
                                                                priceNum: priceNum,
                                                                change: d.change || "-",
                                                                changePercent: d.change || "-",
                                                                marketCap: d.marketCap || "-",
                                                                peRatio: d.peRatio || "-",
                                                                alert: d.alert || "-",
                                                                action: "View",
                                                                addedPrice: addedPrice,
                                                                addedAt: d.addedAt || "",
                                                                gainLoss: gainLoss,
                                                                gainLossPercent: gainLossPercent,
                                                            };
                                                        });
                                                        setRows(mapped);
                                                    }
                                                }
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <span className="text-gray-500">Current Price</span>
                                    <p className="text-gray-200 font-medium">{row.price}</p>
                                </div>
                                <div>
                                    <span className="text-gray-500">Change</span>
                                    <p className={`font-medium ${
                                        row.changePercent.includes('+') ? 'text-green-500' : 
                                        row.changePercent.includes('-') ? 'text-red-500' : 
                                        'text-gray-400'
                                    }`}>
                                        {row.change}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-gray-500">Price Added</span>
                                    <p className="text-gray-400">{row.addedPrice ? `$${row.addedPrice.toFixed(2)}` : '-'}</p>
                                </div>
                                <div>
                                    <span className="text-gray-500">Gain/Loss</span>
                                    <p className={`font-medium ${
                                        row.gainLossPercent > 0 ? 'text-green-500' : 
                                        row.gainLossPercent < 0 ? 'text-red-500' : 
                                        'text-gray-400'
                                    }`}>
                                        {row.gainLoss || '-'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

 export default WatchlistTable;
