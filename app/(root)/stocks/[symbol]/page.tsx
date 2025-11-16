import TradingViewWidget from "@/components/TradingViewWidget";
import WatchlistButton from "@/components/WatchlistButton";
import {
    SYMBOL_INFO_WIDGET_CONFIG,
    CANDLE_CHART_WIDGET_CONFIG,
    BASELINE_WIDGET_CONFIG,
    TECHNICAL_ANALYSIS_WIDGET_CONFIG,
    COMPANY_PROFILE_WIDGET_CONFIG,
    COMPANY_FINANCIALS_WIDGET_CONFIG,
} from "@/lib/constants";
import { auth } from "@/lib/better-auth/auth";
import { getWatchlistSymbolsByEmail } from "@/lib/actions/watchlist.actions";

export default async function StockDetails({ params }: StockDetailsPageProps) {
    const { symbol } = await params;
    const scriptUrl = `https://s3.tradingview.com/external-embedding/embed-widget-`;
    
    // Check if symbol is in user's watchlist
    let isInWatchlist = false;
    try {
        const session = await auth.api.getSession();
        if (session?.user?.email) {
            const watchlistSymbols = await getWatchlistSymbolsByEmail(session.user.email);
            isInWatchlist = watchlistSymbols.includes(symbol.toUpperCase());
        }
    } catch (err) {
        console.error('Failed to fetch watchlist status', err);
    }

    return (
        <div className="flex min-h-screen p-4 md:p-6 lg:p-8 animate-fade-in">
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 w-full">
                {/* Left column */}
                <div className="flex flex-col gap-6">
                    <div className="flex items-center justify-between animate-slide-in-left mb-2">
                        <div className="flex-1"></div>
                        <WatchlistButton 
                            symbol={symbol.toUpperCase()} 
                            company={symbol.toUpperCase()} 
                            isInWatchlist={isInWatchlist}
                            showTrashIcon={false}
                        />
                    </div>
                    
                    <div className="animate-slide-in-left">
                        <TradingViewWidget
                            scriptUrl={`${scriptUrl}symbol-info.js`}
                            config={SYMBOL_INFO_WIDGET_CONFIG(symbol)}
                            height={170}
                        />
                    </div>

                    <div className="animate-slide-in-left animation-delay-100">
                        <TradingViewWidget
                            scriptUrl={`${scriptUrl}advanced-chart.js`}
                            config={CANDLE_CHART_WIDGET_CONFIG(symbol)}
                            className="custom-chart"
                            height={600}
                        />
                    </div>

                    <div className="animate-slide-in-left animation-delay-200">
                        <TradingViewWidget
                            scriptUrl={`${scriptUrl}advanced-chart.js`}
                            config={BASELINE_WIDGET_CONFIG(symbol)}
                            className="custom-chart"
                            height={600}
                        />
                    </div>
                </div>

                {/* Right column */}
                <div className="flex flex-col gap-6">
                    <div className="animate-slide-in-right animation-delay-100">
                        <TradingViewWidget
                            scriptUrl={`${scriptUrl}technical-analysis.js`}
                            config={TECHNICAL_ANALYSIS_WIDGET_CONFIG(symbol)}
                            height={400}
                        />
                    </div>

                    <div className="animate-slide-in-right animation-delay-200">
                        <TradingViewWidget
                            scriptUrl={`${scriptUrl}company-profile.js`}
                            config={COMPANY_PROFILE_WIDGET_CONFIG(symbol)}
                            height={440}
                        />
                    </div>

                    <div className="animate-slide-in-right animation-delay-300">
                        <TradingViewWidget
                            scriptUrl={`${scriptUrl}financials.js`}
                            config={COMPANY_FINANCIALS_WIDGET_CONFIG(symbol)}
                            height={464}
                        />
                    </div>
                </div>
            </section>
        </div>
    );
}