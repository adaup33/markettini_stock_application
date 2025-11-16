"use client";
import React, { useEffect } from "react";
import { useWatchlistToggle } from "@/hooks/useWatchlistToggle";

const WatchlistButton = ({
                             symbol,
                             company,
                             isInWatchlist,
                             showTrashIcon = false,
                             type = "button",
                             onWatchlistChange,
                         }: WatchlistButtonProps) => {
    const { isInWatchlist: added, toggle, isLoading } = useWatchlistToggle(symbol, isInWatchlist, company);

    // Sync external changes back to parent if callback provided
    useEffect(() => {
        if (onWatchlistChange && added !== isInWatchlist) {
            onWatchlistChange(symbol, added);
        }
    }, [added, symbol, isInWatchlist, onWatchlistChange]);

    const label = React.useMemo(() => {
        if (type === "icon") return added ? "" : "";
        return added ? "Remove from Watchlist" : "Add to Watchlist";
    }, [added, type]);

    const handleClick = async (e: React.MouseEvent) => {
        e.stopPropagation();
        
        if (onWatchlistChange) {
            // Let parent handle if callback provided
            const next = !added;
            onWatchlistChange(symbol, next);
            return;
        }

        // Otherwise use the hook's toggle
        await toggle();
    };

    if (type === "icon") {
        return (
            <button
                title={added ? `Remove ${symbol} from watchlist` : `Add ${symbol} to watchlist`}
                aria-label={added ? `Remove ${symbol} from watchlist` : `Add ${symbol} to watchlist`}
                className={`watchlist-icon-btn ${added ? "watchlist-icon-added" : ""} focus:outline-none inline-flex items-center justify-center p-1 rounded`}
                onClick={handleClick}
                disabled={isLoading}
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill={added ? "#F59E0B" : "none"}
                    stroke={added ? "#DD6B20" : "#9CA3AF"}
                    strokeWidth="1.5"
                    className="watchlist-star h-4 w-4"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.385a.563.563 0 00-.182-.557L3.04 10.385a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345l2.125-5.111z"
                    />
                </svg>
            </button>
        );
    }

    return (
        <button 
            className={`watchlist-btn ${added ? "watchlist-remove" : ""}`} 
            onClick={handleClick}
            disabled={isLoading}
        >
            {showTrashIcon && added ? (
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5 mr-2"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 7h12M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m-7 4v6m4-6v6m4-6v6" />
                </svg>
            ) : null}
            <span>{isLoading ? "..." : label}</span>
        </button>
    );
};

export default WatchlistButton;