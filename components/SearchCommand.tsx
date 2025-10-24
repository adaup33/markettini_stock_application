"use client"

import { useCallback, useEffect, useState } from "react"
import { CommandDialog, CommandEmpty, CommandInput, CommandList } from "@/components/ui/command"
import {Button} from "@/components/ui/button";
import {Loader2,  TrendingUp} from "lucide-react";
import Link from "next/link";
import {useDebounce} from "@/hooks/useDebounce";

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
        if(!isSearchMode) return setStocks(initialStocks ?? []);

        setLoading(true)
        try {
            // Try a client-side fetch fallback to an API route if available. This keeps the client
            // component decoupled from server-only actions. If no API exists the fetch will fail
            // gracefully and we'll show no results.
            const trimmed = searchTerm.trim();
            if (!trimmed) {
                setStocks(initialStocks ?? []);
                return;
            }

            // Attempt to call a client API endpoint (optional - implement server route if desired)
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
    }, [isSearchMode, searchTerm, initialStocks]);

    const debouncedSearch = useDebounce(handleSearch, 300);

    useEffect(() => {
        // Include debouncedSearch in deps to satisfy exhaustive-deps and to ensure stability
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
                                        {/*<Star />*/}
                                    </Link>
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