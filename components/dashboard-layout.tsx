'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Sidebar } from '@/components/sidebar';
import { UserNav } from '@/components/auth/user-nav';
import { LuHouse, LuPlus, LuMessageCircle, LuCompass } from 'react-icons/lu';
import type { SnippetWithLatestVersion } from '@/types/database';
import type { User } from '@supabase/supabase-js';

interface DashboardLayoutProps {
    snippets: SnippetWithLatestVersion[];
    user: User | null;
    children: React.ReactNode;
}

export function DashboardLayout({ snippets, user, children }: DashboardLayoutProps) {
    const pathname = usePathname();

    return (
        <div className="min-h-screen bg-white">
            {/* Sidebar - fixed on desktop */}
            <div className="hidden lg:block">
                <Sidebar snippets={snippets} user={user} />
            </div>

            {/* Main Content Area - pb for mobile nav clearance */}
            <main className="lg:ml-72 min-h-screen flex justify-center pb-24 lg:pb-0">
                <div className={`w-full max-w-5xl px-4 sm:px-6 lg:px-8 py-6 lg:py-8 ${pathname === '/chat' ? 'flex flex-col min-h-0 h-[calc(100vh-5rem)] lg:h-[calc(100vh-4rem)]' : ''}`}>
                    {children}
                </div>
            </main>

            {/* Mobile bottom nav - fixed at bottom, does not scroll */}
            <nav className="lg:hidden fixed inset-x-0 bottom-0 bg-white border-t border-gray-200 z-50 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))]">
                <div className="flex items-center justify-around px-4 max-w-lg mx-auto">
                    <Link
                        href="/"
                        className={`flex flex-col items-center gap-1 py-2 px-4 rounded-lg transition-colors ${pathname === '/' ? 'text-orange-500' : 'text-gray-600'}`}
                    >
                        <LuHouse className="w-5 h-5" />
                        <span className="text-xs font-medium">Home</span>
                    </Link>
                    <Link
                        href="/new"
                        className={`flex flex-col items-center gap-1 py-2 px-4 rounded-lg transition-colors ${pathname === '/new' ? 'text-orange-500' : 'text-gray-600'}`}
                    >
                        <LuPlus className="w-5 h-5" />
                        <span className="text-xs font-medium">New</span>
                    </Link>
                    <Link
                        href="/discover"
                        className={`flex flex-col items-center gap-1 py-2 px-4 rounded-lg transition-colors ${pathname === '/discover' ? 'text-orange-500' : 'text-gray-600'}`}
                    >
                        <LuCompass className="w-5 h-5" />
                        <span className="text-xs font-medium">Discover</span>
                    </Link>
                    <Link
                        href="/chat"
                        className={`flex flex-col items-center gap-1 py-2 px-4 rounded-lg transition-colors ${pathname === '/chat' ? 'text-orange-500' : 'text-gray-600'}`}
                    >
                        <LuMessageCircle className="w-5 h-5" />
                        <span className="text-xs font-medium">Chat</span>
                    </Link>
                    {user && (
                        <div className="flex flex-col items-center py-2 px-2">
                            <UserNav user={user} compact />
                        </div>
                    )}
                </div>
            </nav>
        </div>
    );
}
