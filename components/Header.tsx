import Link from "next/link";
import NavItems from "@/components/NavItems";
import UserDropdown from "@/components/UserDropdown";
import {searchStocks} from "@/lib/actions/finnhub.actions";

const Header = async ({ user }: { user: User }) => {
    // Resolve initial stocks server-side and pass down to client components as props.
    const initialStocks = await searchStocks();
    return (
        <header className="sticky top-0 header">
            <div className="container header-wrapper">
                <Link href="/">
                    <div className="h-8 flex items-center cursor-pointer">
                        <span className="text-2xl font-extrabold tracking-tight text-emerald-500">Marketimi</span>
                    </div>
                </Link>
                <nav className="hidden sm:block">
                    <NavItems initialStocks={initialStocks} />
                </nav>

                <UserDropdown user={user} initialStocks={initialStocks} />
            </div>
        </header>
    )
}
export default Header