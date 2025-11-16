export default function Loading() {
    return (
        <div className="flex min-h-screen items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="relative">
                    <div className="h-16 w-16 rounded-full border-4 border-gray-800"></div>
                    <div className="absolute top-0 left-0 h-16 w-16 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"></div>
                </div>
                <p className="text-gray-400 text-sm animate-pulse">Loading...</p>
            </div>
        </div>
    );
}
