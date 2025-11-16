export default function SearchLoading() {
    return (
        <div className="flex min-h-[70vh] flex-col gap-6 animate-fade-in">
            <div>
                <div className="h-9 w-32 bg-gray-800 rounded animate-pulse mb-2"></div>
                <div className="h-5 w-80 bg-gray-800 rounded animate-pulse"></div>
            </div>

            <div className="flex w-full items-center gap-3">
                <div className="h-10 flex-1 bg-gray-800 rounded animate-pulse"></div>
                <div className="h-10 w-24 bg-gray-800 rounded animate-pulse"></div>
            </div>

            <div className="rounded-lg border border-gray-800 bg-gray-900/40 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-800">
                    <div className="h-5 w-48 bg-gray-800 rounded animate-pulse"></div>
                </div>
                <div className="divide-y divide-gray-800">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <div key={i} className="px-4 py-3 flex items-center gap-3">
                            <div className="h-4 w-4 bg-gray-800 rounded animate-pulse"></div>
                            <div className="flex-1 space-y-2">
                                <div className="h-5 w-48 bg-gray-800 rounded animate-pulse"></div>
                                <div className="h-4 w-64 bg-gray-800 rounded animate-pulse"></div>
                            </div>
                            <div className="h-4 w-4 bg-gray-800 rounded-full animate-pulse"></div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
