"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Search as SearchIcon, TrendingUp } from "lucide-react";
import WatchlistButton from "@/components/WatchlistButton";
import { useDebounce } from "@/hooks/useDebounce";

export default function SearchPage() {
  const [term, setTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [stocks, setStocks] = useState<StockWithWatchlistStatus[]>([]);

  const placeholder = "Search stocks (AAPL, TSLA, MSFT, ... )";
  const trimmed = term.trim();
  const isSearching = trimmed.length > 0;

  const handleSearch = async () => {
    setLoading(true);
    try {
      const url = `/api/search-stocks${isSearching ? `?q=${encodeURIComponent(trimmed)}` : ""}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setStocks(Array.isArray(data) ? data : []);
      } else {
        setStocks([]);
      }
    } catch (e) {
      console.error("/search-stocks error", e);
      setStocks([]);
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearch = useDebounce(handleSearch, 300);

  useEffect(() => {
    debouncedSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trimmed]);

  useEffect(() => {
    // initial load: get popular/default stocks
    if (!isSearching && stocks.length === 0) {
      handleSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const display = useMemo(() => {
    if (loading) return [] as StockWithWatchlistStatus[];
    return stocks;
  }, [stocks, loading]);

  return (
    <div className="flex min-h-[70vh] flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-100">Search</h1>
        <p className="text-gray-400 mt-2">Find stocks and add them to your watchlist</p>
      </div>

      <div className="flex w-full items-center gap-3">
        <div className="relative w-full">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder={placeholder}
            className="pl-9 bg-gray-900/60 border-gray-800 focus:border-emerald-500 transition-colors"
          />
          {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-500" />}
        </div>
        <Button onClick={handleSearch} variant="default" className="bg-emerald-600 hover:bg-emerald-500 transition-colors">
          Search
        </Button>
      </div>

      <div className="rounded-lg border border-gray-800 bg-gray-900/40 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
          <div className="text-sm text-gray-400">
            {isSearching ? "Search results" : "Popular stocks"}{" "}
            <span className="text-gray-500">({loading ? 0 : display.length})</span>
          </div>
        </div>
        <ul className="divide-y divide-gray-800">
          {loading ? (
            <li className="px-4 py-8 text-center text-gray-500">
              <div className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading stocks...</span>
              </div>
            </li>
          ) : display.length === 0 ? (
            <li className="px-4 py-8 text-center text-gray-500">No stocks found</li>
          ) : (
            display.map((s) => (
              <li key={s.symbol} className="group hover:bg-gray-900/60 transition-colors">
                <Link 
                  href={`/stocks/${s.symbol}`}
                  className="px-4 py-3 flex items-center gap-3 w-full"
                >
                  <TrendingUp className="h-4 w-4 text-gray-500 group-hover:text-emerald-500 transition-colors" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-100 truncate group-hover:text-emerald-400 transition-colors">{s.name || s.symbol}</div>
                    <div className="text-xs text-gray-500 truncate">
                      {s.symbol} | {s.exchange} | {s.type}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-500 hover:text-emerald-400 text-sm font-medium transition-colors">
                      View
                    </span>
                    <div onClick={(e) => e.preventDefault()}>
                      <WatchlistButton
                        symbol={s.symbol}
                        company={s.name || s.symbol}
                        isInWatchlist={!!s.isInWatchlist}
                        type="icon"
                        onWatchlistChange={async (symbol, isAdded) => {
                          // Optimistic update
                          setStocks((prev) => prev.map((x) => (x.symbol === symbol ? { ...x, isInWatchlist: isAdded } : x)));
                          try {
                            if (isAdded) {
                              const res = await fetch("/api/watchlist", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ symbol }),
                              });
                              if (!res.ok) throw new Error("Failed to add");
                            } else {
                              const res = await fetch(`/api/watchlist?symbol=${encodeURIComponent(symbol)}`, { method: "DELETE" });
                              if (!res.ok) throw new Error("Failed to remove");
                            }
                          } catch (err) {
                            console.error("watchlist toggle from /search error", err);
                            // revert
                            setStocks((prev) => prev.map((x) => (x.symbol === symbol ? { ...x, isInWatchlist: !isAdded } : x)));
                          }
                        }}
                      />
                    </div>
                  </div>
                </Link>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
