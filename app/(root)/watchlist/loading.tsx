export default function WatchlistLoading() {
    return (
        <div className="flex flex-col gap-6 animate-fade-in">
            <div>
                <div className="h-9 w-48 bg-gray-800 rounded animate-pulse mb-2"></div>
                <div className="h-5 w-64 bg-gray-800 rounded animate-pulse"></div>
            </div>
            
            <div className="rounded-lg border border-gray-800 bg-gray-900/40 p-4">
                {/* Search skeleton */}
                <div className="h-10 bg-gray-800 rounded mb-4 animate-pulse"></div>
                
                {/* Table skeleton */}
                <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="h-16 bg-gray-800 rounded animate-pulse"></div>
                    ))}
                </div>
            </div>
        </div>
    );
}
