import Link from "next/link";
import { UserNav } from "@/components/auth/user-nav";
import type { User } from "@supabase/supabase-js";

export default function Hero({ user }: { user: User | null }) {
    return (
        <div className="relative min-h-screen bg-white overflow-hidden flex flex-col">
            <div
                className="absolute inset-0 opacity-30"
                style={{
                    backgroundImage: 'url(/grid.svg)',
                    backgroundSize: '32px 32px',
                    backgroundRepeat: 'repeat',
                }}
            />

            <header className="relative w-full flex justify-between items-start p-4 sm:p-8 z-10 gap-4">
                <h1 className="text-2xl sm:text-4xl font-bold shrink-0">
                    Sni
                    <span className="text-orange-500 text-2xl sm:text-4xl font-bold">pp</span>
                </h1>
                <div className="flex flex-col items-end gap-0.5 min-w-0">
                    <Link
                        href="/"
                        className="text-2xl sm:text-4xl font-semibold hover:-translate-y-1 transition-all duration-300"
                    >
                        App
                    </Link>
                    <Link
                        href="/discover"
                        className="text-2xl sm:text-4xl font-semibold hover:-translate-y-1 transition-all duration-300"
                    >
                        Discover
                    </Link>
                    <Link
                        href="https://github.com/adoodevv/snipp#readme"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-2xl sm:text-4xl font-semibold hover:-translate-y-1 transition-all duration-300"
                    >
                        Docs
                    </Link>
                    <Link
                        href="https://github.com/adoodevv/snipp"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-2xl sm:text-4xl font-semibold hover:-translate-y-1 transition-all duration-300"
                    >
                        Collaborate
                    </Link>
                    {user ? (
                        <div className="w-full min-w-0 max-w-[180px] sm:max-w-[220px]">
                            <UserNav user={user} />
                        </div>
                    ) : null}
                </div>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center px-4 text-center z-10">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight mb-4">
                    Welcome to Snipp
                </h1>
                <p className="text-base sm:text-lg mb-8 max-w-xl" style={{ color: '#666666' }}>
                    Real-time collaborative code snippets with AI-powered search
                </p>
                {!user && (
                    <div className="flex gap-4 flex-col sm:flex-row items-center justify-center">
                        <Link
                            href="/auth/login"
                            className="bg-orange-500 text-white flex items-center justify-center py-3 px-6 rounded-full hover:bg-orange-400 transition-colors duration-300 font-semibold text-sm sm:text-base whitespace-nowrap"
                        >
                            Sign In
                        </Link>
                        <Link
                            href="/auth/signup"
                            className="flex items-center justify-center py-3 px-6 border rounded-full border-gray-400 hover:bg-gray-100 transition-colors duration-300 font-semibold text-sm sm:text-base whitespace-nowrap"
                            style={{ color: '#2c2c2c' }}
                        >
                            Sign Up
                        </Link>
                    </div>
                )}
            </main>
        </div>
    );
}
