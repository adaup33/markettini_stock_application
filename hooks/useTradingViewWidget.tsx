'use client';
import { useEffect, useRef, useMemo } from "react";

const useTradingViewWidget = (
    scriptUrl: string,
    config: Record<string, unknown>,
    height = 600
) => {
    const containerRef = useRef<HTMLDivElement | null>(null);

    // Stabilize config to prevent unnecessary re-renders
    const stableConfig = useMemo(
        () => JSON.stringify(config),
        [config]
    );

    useEffect(() => {
        // ✅ FIX: Capture ref at effect start to avoid stale closure
        const container = containerRef.current;

        if (!container) return;
        if (container.dataset.loaded) return;

        // Create widget container
        container.innerHTML = `<div class="tradingview-widget-container__widget" style="width: 100%; height: ${height}px;"></div>`;

        // Create script
        const script = document.createElement("script");
        script.src = scriptUrl;
        script.async = true;
        script.textContent = stableConfig;  // ✅ FIX: Use textContent instead of innerHTML

        container.appendChild(script);
        container.dataset.loaded = 'true';

        // ✅ FIX: Use captured container reference in cleanup
        return () => {
            if (container) {
                container.innerHTML = '';
                delete container.dataset.loaded;
            }
        }
    }, [scriptUrl, stableConfig, height]);  // ✅ FIX: Use stableConfig instead of config

    return containerRef;
}

export default useTradingViewWidget;
