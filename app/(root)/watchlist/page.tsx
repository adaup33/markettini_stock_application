import WatchlistTable from "@/components/WatchlistTable";

const WatchlistPage = () => {
    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-100">Watchlist</h1>
                <p className="text-gray-400 mt-2">Track your favorite stocks</p>
            </div>
            <div className="rounded-lg border border-gray-800 bg-gray-900/40 p-2 sm:p-4">
                <WatchlistTable />
            </div>
        </div>
    );
};

export default WatchlistPage;
