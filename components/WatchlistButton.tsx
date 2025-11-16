"use client";

import React, { useMemo, useState } from "react";
import { toast } from "sonner";

const WatchlistButton = ({
                             symbol,
                             company,
                             isInWatchlist,
                             showTrashIcon = false,
                             type = "button",
                             onWatchlistChange,
                         }: WatchlistButtonProps) => {
    const [added, setAdded] = useState<boolean>(isInWatchlist);
    const [isAnimating, setIsAnimating] = useState(false);

    const label = useMemo(() => {
        if (type === "icon") return added ? "" : "";
        return added ? "Remove from Watchlist" : "Add to Watchlist";
    }, [added, type]);

    const handleClick = async (e: React.MouseEvent) => {
        e.stopPropagation();
        const next = !added;
        
        // Trigger animation
        setIsAnimating(true);
        setTimeout(() => setIsAnimating(false), 300);
        
        setAdded(next);

        if (onWatchlistChange) {
            onWatchlistChange(symbol, next);
            return;
        }

        // Default behavior: call API optimistically
        try {
            if (next) {
                const devEmail = process.env.NEXT_PUBLIC_DEV_EMAIL as string | undefined;
                const headers: Record<string, string> = { 'Content-Type': 'application/json' };
                if (devEmail) headers['x-user-email'] = devEmail;
                const res = await fetch('/api/watchlist', {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(devEmail ? { symbol, company, email: devEmail } : { symbol, company }),
                });
                if (!res.ok) {
                    const data = await res.json().catch(() => ({ error: 'Failed to add to watchlist' }));
                    throw new Error(data.error || 'Failed to add to watchlist');
                }
                toast.success(`${symbol} added to watchlist`, {
                    icon: '⭐',
                    duration: 2000,
                });
            } else {
                const devEmail = process.env.NEXT_PUBLIC_DEV_EMAIL as string | undefined;
                const headers: Record<string, string> = {};
                if (devEmail) headers['x-user-email'] = devEmail;
                const url = `/api/watchlist?symbol=${encodeURIComponent(symbol)}${devEmail ? `&email=${encodeURIComponent(devEmail)}` : ''}`;
                const res = await fetch(url, { method: 'DELETE', headers });
                if (!res.ok) {
                    const data = await res.json().catch(() => ({ error: 'Failed to remove from watchlist' }));
                    throw new Error(data.error || 'Failed to remove from watchlist');
                }
                toast.success(`${symbol} removed from watchlist`, {
                    icon: '🗑️',
                    duration: 2000,
                });
            }
        } catch (err) {
            console.error('watchlist toggle error', err);
            // Show error toast
            const errorMessage = err instanceof Error ? err.message : 'Failed to update watchlist';
            toast.error(errorMessage);
            // Revert optimistic update on failure
            setAdded(!next);
        }
    };

    if (type === "icon") {
        return (
            <button
                title={added ? `Remove ${symbol} from watchlist` : `Add ${symbol} to watchlist`}
                aria-label={added ? `Remove ${symbol} from watchlist` : `Add ${symbol} to watchlist`}
                className={`watchlist-icon-btn ${added ? "watchlist-icon-added" : ""} focus:outline-none inline-flex items-center justify-center p-1 rounded transition-all duration-200 hover:scale-110 ${isAnimating ? 'scale-125' : ''}`}
                onClick={handleClick}
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill={added ? "#F59E0B" : "none"}
                    stroke={added ? "#DD6B20" : "#9CA3AF"}
                    strokeWidth="1.5"
                    className={`watchlist-star h-4 w-4 transition-all duration-300 ${isAnimating ? 'rotate-180' : ''}`}
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
        <button className={`watchlist-btn ${added ? "watchlist-remove" : ""} transition-all duration-200 hover:scale-105`} onClick={handleClick}>
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
            <span>{label}</span>
        </button>
    );
};

export default WatchlistButton;