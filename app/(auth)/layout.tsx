import Link from "next/link";
import Image from "next/image";
import {getAuth} from "@/lib/better-auth/auth";
import {headers} from "next/headers";
import {redirect} from "next/navigation";

const Layout = async ({ children }: { children : React.ReactNode }) => {
    const auth = await getAuth();
    const session = await auth.api.getSession({ headers: await headers() })

    if(session?.user) redirect('/')

    return (
        <main className="auth-layout">
            <section className="auth-left-section scrollbar-hide-default">
                <Link href="/" className="auth-logo">
                    <div className="h-8 flex items-center">
                        <span className="text-2xl font-extrabold tracking-tight text-emerald-500">Marketimi</span>
                    </div>
                </Link>

                <div className="pb-6 lg:pb-8 flex-1">{children}</div>
            </section>

            <section className="auth-right-section">

                <div className="flex-1 relative">
                    <Image src="/assets/images/dashboard.png" alt="Dashboard Preview" width={1440} height={1150} className="auth-dashboard-preview absolute top-0" />
                </div>
            </section>
        </main>
    )
}
export default Layout