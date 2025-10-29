'use client';

import React, { memo, useMemo } from 'react';
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
    // ✅ OPTIONAL: Memoize config to prevent re-renders (if not already a constant)
    const stableConfig = useMemo(() => config, [config]);

    const containerRef = useTradingViewWidget(scriptUrl, stableConfig, height);

    return (
        <div className="w-full">
            {title && (
                <h3 className="font-semibold text-2xl text-gray-100 mb-5">
                    {title}
                </h3>
            )}
            <div
                className={cn('tradingview-widget-container', className)}
                ref={containerRef}
            >
                {/* This inner div is created by the hook, but keeping it here for SSR */}
                <div
                    className="tradingview-widget-container__widget"
                    style={{ height, width: "100%" }}
                />
            </div>
        </div>
    );
}

export default memo(TradingViewWidget);
