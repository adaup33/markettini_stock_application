'use client'

import {NAV_ITEMS} from "@/lib/constants";
import Link from "next/link";
import {usePathname} from "next/navigation";

const NavItems = ({initialStocks}: { initialStocks: StockWithWatchlistStatus[]}) => {
    const pathname = usePathname()

    const isActive = (path: string) => {
        if (path === '/') return pathname === '/';

        return pathname.startsWith(path);
    }

    return (
        <ul className="flex flex-col sm:flex-row p-2 gap-3 sm:gap-10 font-medium">
            {NAV_ITEMS.map(({ href, label }) => {
                const active = isActive(href);

                return (
                    <li key={href}>
                        <Link href={href} className={`transition-colors px-1 py-0.5 rounded-sm ${
                            active ? 'text-yellow-400 font-semibold' : 'text-gray-300 hover:text-yellow-400 hover:bg-gray-800'
                        }`}>
                            {label}
                        </Link>
                    </li>
                )
            })}
        </ul>
    )
}
export default NavItems