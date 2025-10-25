/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
    // ============================================
    // FORM DATA TYPES
    // ============================================

    type SignInFormData = {
        email: string;
        password: string;
    };

    type SignUpFormData = {
        fullName: string;
        email: string;
        password: string;
        country: string;
        investmentGoals: string;
        riskTolerance: string;
        preferredIndustry: string;
    };

    // ============================================
    // EMAIL TYPES
    // ============================================

    type WelcomeEmailData = {
        email: string;
        name: string;
        intro: string;
    };

    // ============================================
    // USER TYPES
    // ============================================

    type User = {
        id: string;
        name: string;
        email: string;
    };

    type UserForNewsEmail = {
        id: string;
        email: string;
        name: string;
        country: string;
        investmentGoals?: string;
        riskTolerance?: string;
        preferredIndustry?: string;
    };

    // ============================================
    // STOCK DATA TYPES - FIX FOR FINNHUB.ACTIONS.TS
    // ============================================

    type StockData = {
        symbol: string;
        company: string;
        price: string;
        change: string;
        marketCap: string;
        peRatio: string;
        eps: string;
        sentiment: string;
    };

    type Stock = {
        symbol: string;
        name: string; // This fixes the 'name' error in finnhub.actions.ts
        description?: string; // Alternative name field
        exchange: string;
        type: string;
        ticker?: string; // Some APIs use 'ticker' instead of 'symbol'
        displaySymbol?: string;
    };

    type StockWithWatchlistStatus = Stock & {
        isInWatchlist: boolean;
    };

    type StockWithData = {
        _id?: string;
        userId: string;
        symbol: string;
        company: string;
        name?: string; // Alternative to company
        addedAt: Date;
        currentPrice?: number;
        changePercent?: number;
        changeAmount?: number;
        priceFormatted?: string;
        changeFormatted?: string;
        changeAmountFormatted?: string;
        marketCap?: string;
        peRatio?: string;
        tradingViewSymbol?: string;
    };

    type StockDetailsData = {
        symbol: string;
        company: string;
        exchange: string;
        currency: string;
        country: string;
        currentPrice: number;
        previousClose: number;
        dayHigh: number;
        dayLow: number;
        openPrice: number;
        changeAmount: number;
        changePercent: number;
        priceFormatted: string;
        changeFormatted: string;
        changeAmountFormatted: string;
        marketCap: number;
        marketCapFormatted: string;
        sharesOutstanding: number;
        industry: string;
        website: string;
        logo: string;
        ipo: string;
        phone: string;
        peRatio: string;
        eps: string;
        sentiment: string;
        lastUpdated: string;
    };

    type SelectedStock = {
        symbol: string;
        company: string;
        currentPrice?: number;
    };

    // ============================================
    // FINNHUB API TYPES - FIX MISSING PROPERTIES
    // ============================================

    type FinnhubSearchResult = {
        symbol: string;
        description: string;
        displaySymbol?: string;
        type: string;
        name?: string; // Add this for compatibility
        exchange?: string; // Add this for compatibility
    };

    type FinnhubSearchResponse = {
        count: number;
        result: FinnhubSearchResult[];
    };

    type FinnhubQuoteResponse = {
        c?: number; // Current price
        d?: number; // Change
        dp?: number; // Percent change
        h?: number; // High
        l?: number; // Low
        o?: number; // Open
        pc?: number; // Previous close
        t?: number; // Timestamp
        ticker?: string; // Add ticker field
        exchange?: string; // Add exchange field
    };

    // ============================================
    // PAGINATION TYPES
    // ============================================

    type PaginationInfo = {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        itemsPerPage: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    };

    type StocksResponse = {
        data: StockData[];
        pagination: PaginationInfo;
    };

    // ============================================
    // NEWS TYPES
    // ============================================

    type MarketNewsArticle = {
        id: number;
        headline: string;
        summary: string;
        source: string;
        url: string;
        datetime: number;
        category: string;
        related: string;
        image?: string;
    };

    type RawNewsArticle = {
        id: number;
        headline?: string;
        summary?: string;
        source?: string;
        url?: string;
        datetime?: number;
        image?: string;
        category?: string;
        related?: string;
    };

    type WatchlistNewsProps = {
        watchlistSymbols?: string[];
        watchlistStocks?: StockWithData[];
        articlesPerStock?: number;
        initialNews?: MarketNewsArticle[];
        news?: MarketNewsArticle[];
    };

    // ============================================
    // ALERT TYPES
    // ============================================

    type AlertFormData = {
        alertName: string;
        alertType: 'price' | 'volume';
        condition: 'greater' | 'less';
        threshold: string;
    };

    type AlertData = {
        alertName: string;
        symbol: string;
        company?: string;
        alertType: 'price' | 'volume' | 'upper' | 'lower';
        condition?: 'greater' | 'less';
        threshold: number | string;
    };

    type Alert = {
        id: string;
        symbol: string;
        company: string;
        alertName: string;
        currentPrice: number;
        alertType: 'upper' | 'lower' | 'volume';
        threshold: number;
        changePercent?: number;
        frequency?: string;
    };

    type AlertModalProps = {
        isOpen?: boolean;
        onClose?: () => void;
        open?: boolean;
        setOpenAction?: (open: boolean) => void;
        symbol?: string;
        company?: string;
        currentPrice?: number;
        alertId?: string;
        alertData?: AlertData;
        onCreateAlert?: (alertData: AlertData) => Promise<void>;
        initialValues?: {
            alertName?: string;
            alertType?: 'price' | 'volume';
            condition?: 'greater' | 'less';
            threshold?: number;
        };
        action?: string;
    };

    type AlertsListProps = {
        alertData: Alert[] | undefined;
    };

    // ============================================
    // SEARCH & COMMAND TYPES - FIX SETOPEN & SETSTATEACTION
    // ============================================

    type SearchCommandProps = {
        open?: boolean;
        setOpenAction?: (open: boolean) => void; // Standard function signature
        renderAs?: 'button' | 'text';
        buttonLabel?: string;
        label?: string;
        buttonVariant?: 'primary' | 'secondary';
        className?: string;
        initialStocks?: StockWithWatchlistStatus[];
    };

    // FIX: Add SetStateAction type compatibility
    type SetStateAction<T> = T | ((prevState: T) => T);

    // ============================================
    // COMPONENT PROPS TYPES
    // ============================================

    type FormInputProps = {
        name: string;
        label: string;
        placeholder: string;
        type?: string;
        register: UseFormRegister<any>;
        error?: FieldError;
        validation?: RegisterOptions;
        disabled?: boolean;
        value?: string;
    };

    type Option = {
        value: string;
        label: string;
    };

    type SelectFieldProps = {
        name: string;
        label: string;
        placeholder: string;
        options: readonly Option[];
        control: Control<any>;
        error?: FieldError;
        required?: boolean;
    };

    type CountrySelectProps = {
        name: string;
        label: string;
        control: Control<any>;
        error?: FieldError;
        required?: boolean;
    };

    type FooterLinkProps = {
        text: string;
        linkText: string;
        href: string;
    };

    type StockDetailsProps = {
        symbol: string | null;
        onClose: () => void;
        open: boolean;
    };

    type StockDetailsPageProps = {
        params: Promise<{
            symbol: string;
        }>;
    };

    type WatchlistButtonProps = {
        symbol: string;
        company: string;
        isInWatchlist: boolean;
        showTrashIcon?: boolean;
        type?: 'button' | 'icon';
        onWatchlistChange?: (symbol: string, isAdded: boolean) => void;
    };

    type WatchlistTableProps = {
        watchlist: StockWithData[];
    };

    // ============================================
    // FINANCIAL DATA TYPES
    // ============================================

    type QuoteData = {
        c?: number;
        dp?: number;
        d?: number;
        h?: number;
        l?: number;
        o?: number;
        pc?: number;
        t?: number;
    };

    type ProfileData = {
        name?: string;
        marketCapitalization?: number;
        ticker?: string;
        exchange?: string;
        currency?: string;
        country?: string;
        industry?: string;
        logo?: string;
        weburl?: string;
        phone?: string;
        ipo?: string;
        shareOutstanding?: number;
    };

    type FinancialsData = {
        metric?: { [key: string]: number };
    };

    type RecommendationData = {
        strongBuy: number;
        buy: number;
        hold: number;
        sell: number;
        strongSell: number;
        period: string;
        symbol: string;
    };
}

export {};
