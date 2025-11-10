"use client"

import { useCallback, useEffect, useState } from "react"
import { CommandDialog, CommandEmpty, CommandInput, CommandList } from "@/components/ui/command"
import {Button} from "@/components/ui/button";
import {Loader2,  TrendingUp} from "lucide-react";
import Link from "next/link";
import {useDebounce} from "@/hooks/useDebounce";
import WatchlistButton from "@/components/WatchlistButton";

export default function SearchCommand({ renderAs = 'button', label = 'Add stock', initialStocks }: SearchCommandProps) {
    const [open, setOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")
    const [loading, setLoading] = useState(false)
    const [stocks, setStocks] = useState<StockWithWatchlistStatus[]>(initialStocks ?? []);

    const isSearchMode = !!searchTerm.trim();
    const displayStocks = isSearchMode ? stocks : stocks?.slice(0, 10);

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
                e.preventDefault()
                setOpen(v => !v)
            }
        }
        window.addEventListener("keydown", onKeyDown)
        return () => window.removeEventListener("keydown", onKeyDown)
    }, [])

    // Keep local stocks in sync when the initialStocks prop changes (avoid stale initial state)
    useEffect(() => {
        // Only update when not actively searching so we don't clobber user input
        if (!isSearchMode) {
            setStocks(initialStocks ?? []);
        }
    }, [initialStocks, isSearchMode]);

    const handleSearch = useCallback(async () => {
        if(!isSearchMode) {
            setStocks(initialStocks ?? []);
            return;
        }

        setLoading(true)
        try {
            const trimmed = searchTerm.trim();
            if (!trimmed) {
                setStocks(initialStocks ?? []);
                return;
            }

            const res = await fetch(`/api/search-stocks?q=${encodeURIComponent(trimmed)}`);
            if (res.ok) {
                const data = await res.json();
                setStocks(Array.isArray(data) ? data : []);
            } else {
                setStocks([]);
            }
        } catch (err) {
            console.error('search-stocks error:', err);
            setStocks([])
        } finally {
            setLoading(false)
        }
    }, [isSearchMode, searchTerm, initialStocks]); // include all external values used inside

    // create a stable debounced function; useDebounce now keeps callback latest via ref
    const debouncedSearch = useDebounce(handleSearch, 300);

    useEffect(() => {
        // Run debounced search when searchTerm changes. debouncedSearch is stable across renders.
        debouncedSearch();
    }, [searchTerm, debouncedSearch]);

    const handleSelectStock = () => {
        setOpen(false);
        setSearchTerm("");
        setStocks(initialStocks ?? []);
    }

    return (
        <>
            {renderAs === 'text' ? (
                <span onClick={() => setOpen(true)} className="search-text">
            {label}
          </span>
            ): (
                <Button onClick={() => setOpen(true)} className="search-btn">
                    {label}
                </Button>
            )}
            <CommandDialog open={open} onOpenChange={setOpen} className="search-dialog">
                <div className="search-field">
                    <CommandInput value={searchTerm} onValueChange={setSearchTerm} placeholder="Search stocks..." className="search-input" />
                    {loading && <Loader2 className="search-loader" />}
                </div>
                <CommandList className="search-list">
                    {loading ? (
                        <CommandEmpty className="search-list-empty">Loading stocks...</CommandEmpty>
                    ) : displayStocks?.length === 0 ? (
                        <div className="search-list-indicator">
                            {isSearchMode ? 'No results found' : 'No stocks available'}
                        </div>
                    ) : (
                        <ul>
                            <div className="search-count">
                                {isSearchMode ? 'Search results' : 'Popular stocks'}
                                {` `}({displayStocks?.length || 0})
                            </div>
                            {displayStocks?.map((stock) => (
                                <li key={stock.symbol} className="search-item">
                                    <Link
                                        href={`/stocks/${stock.symbol}`}
                                        onClick={handleSelectStock}
                                        className="search-item-link"
                                    >
                                        <TrendingUp className="h-4 w-4 text-gray-500" />
                                        <div  className="flex-1">
                                            <div className="search-item-name">
                                                {stock.name}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {stock.symbol} | {stock.exchange } | {stock.type}
                                            </div>
                                        </div>
                                    </Link>
                                    {/* Star control to add/remove directly from search results */}
                                    <div className="ml-2">
                                        <WatchlistButton
                                            symbol={stock.symbol}
                                            company={stock.name || stock.symbol}
                                            isInWatchlist={!!stock.isInWatchlist}
                                            type="icon"
                                            onWatchlistChange={async (symbol, isAdded) => {
                                                // Optimistic update: update UI first
                                                setStocks((prev) => prev.map((s) => s.symbol === symbol ? { ...s, isInWatchlist: isAdded } : s));
                                                try {
                                                    if (isAdded) {
                                                        const res = await fetch('/api/watchlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ symbol }) });
                                                        if (!res.ok) throw new Error('Failed to add');
                                                    } else {
                                                        const res = await fetch(`/api/watchlist?symbol=${encodeURIComponent(symbol)}`, { method: 'DELETE' });
                                                        if (!res.ok) throw new Error('Failed to remove');
                                                    }
                                                } catch (err) {
                                                    console.error('watchlist toggle from search error', err);
                                                    // Revert optimistic update on failure
                                                    setStocks((prev) => prev.map((s) => s.symbol === symbol ? { ...s, isInWatchlist: !isAdded } : s));
                                                }
                                            }}
                                        />
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )
                    }
                </CommandList>
            </CommandDialog>
        </>
    )
}