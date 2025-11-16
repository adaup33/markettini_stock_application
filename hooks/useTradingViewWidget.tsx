'use client';
import { useEffect, useRef, useMemo } from "react";

const useTradingViewWidget = (
    scriptUrl: string,
    config: Record<string, unknown>,
    height = 600,
    onLoad?: () => void
) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const onLoadRef = useRef(onLoad);

    // Update ref when callback changes
    useEffect(() => {
        onLoadRef.current = onLoad;
    }, [onLoad]);

    // Stabilize config to prevent unnecessary re-renders
    const stableConfig = useMemo(
        () => JSON.stringify(config),
        [config]
    );

    useEffect(() => {
        const container = containerRef.current;

        if (!container) return;
        if (container.dataset.loaded) return;

        // Mark as loading to prevent duplicate initialization
        container.dataset.loaded = 'true';

        // Create script
        const script = document.createElement("script");
        script.src = scriptUrl;
        script.async = true;
        script.textContent = stableConfig;

        // Set timeout to mark as loaded even if script fails
        const timeoutId = setTimeout(() => {
            if (onLoadRef.current) {
                onLoadRef.current();
            }
        }, 10000); // 10 second timeout

        // Add load event listener
        script.onload = () => {
            clearTimeout(timeoutId);
            // Give the widget a moment to render
            setTimeout(() => {
                if (onLoadRef.current) {
                    onLoadRef.current();
                }
            }, 500);
        };

        // Add error event listener
        script.onerror = () => {
            clearTimeout(timeoutId);
            console.error('Failed to load TradingView widget:', scriptUrl);
            // Still call onLoad to hide skeleton
            if (onLoadRef.current) {
                onLoadRef.current();
            }
        };

        container.appendChild(script);

        return () => {
            clearTimeout(timeoutId);
            if (container) {
                // Only clear the container content, don't remove the div that React rendered
                while (container.firstChild) {
                    container.removeChild(container.firstChild);
                }
                delete container.dataset.loaded;
            }
        }
    }, [scriptUrl, stableConfig, height]);

    return containerRef;
}

export default useTradingViewWidget;
