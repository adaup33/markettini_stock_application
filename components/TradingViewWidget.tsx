'use client';

import React, { memo, useMemo, useState } from 'react';
import useTradingViewWidget from "@/hooks/useTradingViewWidget";
import { cn } from "@/lib/utils";

interface TradingViewWidgetProps {
    title?: string;
    scriptUrl: string;
    config: Record<string, unknown>;
    height?: number;
    className?: string;
}

function TradingViewWidget({
                               title,
                               scriptUrl,
                               config,
                               height = 400,
                               className
                           }: TradingViewWidgetProps) {
    const [isLoaded, setIsLoaded] = useState(false);
    
    // ✅ OPTIONAL: Memoize config to prevent re-renders (if not already a constant)
    const stableConfig = useMemo(() => config, [config]);

    const containerRef = useTradingViewWidget(scriptUrl, stableConfig, height, () => {
        // Callback when widget is loaded
        setIsLoaded(true);
    });

    return (
        <div className="w-full">
            {title && (
                <h3 className="font-semibold text-2xl text-gray-100 mb-5">
                    {title}
                </h3>
            )}
            <div
                className={cn('tradingview-widget-container relative', className)}
                ref={containerRef}
            >
                {/* Loading skeleton */}
                {!isLoaded && (
                    <div 
                        className="absolute inset-0 bg-gray-900/60 border border-gray-800 rounded-lg flex items-center justify-center animate-pulse"
                        style={{ height, width: "100%" }}
                    >
                        <div className="flex flex-col items-center gap-3">
                            <div className="h-8 w-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-sm text-gray-400">Loading widget...</span>
                        </div>
                    </div>
                )}
                {/* This inner div is created by the hook, but keeping it here for SSR */}
                <div
                    className={cn("tradingview-widget-container__widget transition-opacity duration-300", isLoaded ? "opacity-100" : "opacity-0")}
                    style={{ height, width: "100%" }}
                />
            </div>
        </div>
    );
}

export default memo(TradingViewWidget);
