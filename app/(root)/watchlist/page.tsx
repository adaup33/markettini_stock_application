import WatchlistTable from "@/components/WatchlistTable";

const WatchlistPage = () => {
    return (
        <div className="flex min-h-screen flex-col p-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-100">Watchlist</h1>
                <p className="text-gray-400 mt-2">Track your favorite stocks</p>
            </div>
            <WatchlistTable />
        </div>
    );
};

export default WatchlistPage;
