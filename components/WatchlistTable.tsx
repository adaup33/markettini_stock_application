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
import WatchlistButton from "./WatchlistButton";

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

    // Sample data fallback
    const sampleData: WatchlistRow[] = [
        {
            company: "Apple Inc.",
            symbol: "AAPL",
            price: "$178.72",
            change: "+2.45%",
            marketCap: "$2.78T",
            peRatio: "29.3",
            alert: "Active",
            action: "View",
        },
        {
            company: "Microsoft Corporation",
            symbol: "MSFT",
            price: "$378.91",
            change: "+1.23%",
            marketCap: "$2.81T",
            peRatio: "35.2",
            alert: "Active",
            action: "View",
        },
        {
            company: "Tesla, Inc.",
            symbol: "TSLA",
            price: "$242.84",
            change: "-0.89%",
            marketCap: "$771B",
            peRatio: "67.8",
            alert: "None",
            action: "View",
        },
    ];

    useEffect(() => {
        let mounted = true;

        async function load() {
            setLoading(true);
            try {
                const url = `/api/watchlist${
                    email ? `?email=${encodeURIComponent(email)}` : ""
                }`;
                const res = await fetch(url);

                if (!res.ok) throw new Error("Failed to fetch watchlist");

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
                        isStarred: true,
                    }));
                    setRows(mapped.length ? mapped : sampleData);
                } else {
                    setRows(sampleData);
                }
            } catch (err) {
                console.error("load watchlist error", err);
                setRows(sampleData);
            } finally {
                if (mounted) setLoading(false);
            }
        }

        load();

        return () => {
            mounted = false;
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

            // Update local state
            setRows((prev) =>
                prev.map((r) => (r.symbol === symbol ? { ...r, isStarred: next } : r))
            );
        } catch (err) {
            console.error("watchlist toggle error", err);
        }
    };

    const dataToRender = rows.length ? rows : sampleData;

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
                    {dataToRender.map((row) => (
                        <TableRow key={row.symbol}>
                            <TableCell className="text-left flex items-center gap-2">
                                <WatchlistButton
                                    symbol={row.symbol}
                                    isInWatchlist={!!row.isStarred}
                                    type="icon"
                                    onWatchlistChange={handleWatchlistChange} company={""}                                />
                                <span>{row.company}</span>
                            </TableCell>
                            <TableCell className="text-left">{row.symbol}</TableCell>
                            <TableCell className="text-left">{row.price}</TableCell>
                            <TableCell className="text-left">{row.change}</TableCell>
                            <TableCell className="text-left">{row.marketCap}</TableCell>
                            <TableCell className="text-left">{row.peRatio}</TableCell>
                            <TableCell className="text-left">{row.alert}</TableCell>
                            <TableCell className="text-left">{row.action}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};

export default WatchlistTable;
