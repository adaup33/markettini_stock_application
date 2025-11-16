'use client';

import React, { memo, useMemo, useState, Suspense } from 'react';
import useTradingViewWidget from "@/hooks/useTradingViewWidget";
import { cn } from "@/lib/utils";

interface TradingViewWidgetProps {
    title?: string;
    scriptUrl: string;
    config: Record<string, unknown>;
    height?: number;
    className?: string;
}

// Loading skeleton component
const WidgetSkeleton = ({ height }: { height: number }) => (
    <div 
        className="bg-gray-900/60 border border-gray-800 rounded-lg flex items-center justify-center animate-pulse"
        style={{ height, width: "100%" }}
    >
        <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm text-gray-400">Loading widget...</span>
        </div>
    </div>
);

function TradingViewWidget({
                               title,
                               scriptUrl,
                               config,
                               height = 400,
                               className
                           }: TradingViewWidgetProps) {
    const [isLoaded, setIsLoaded] = useState(false);
    
    // ✅ Memoize config to prevent re-renders
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
            <Suspense fallback={<WidgetSkeleton height={height} />}>
                <div
                    className={cn('tradingview-widget-container relative', className)}
                    ref={containerRef}
                >
                    {/* Loading skeleton */}
                    {!isLoaded && <WidgetSkeleton height={height} />}
                    {/* This inner div is created by the hook */}
                    <div
                        className={cn("tradingview-widget-container__widget transition-opacity duration-300", isLoaded ? "opacity-100" : "opacity-0")}
                        style={{ height, width: "100%" }}
                    />
                </div>
            </Suspense>
        </div>
    );
}

export default memo(TradingViewWidget);
