'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sidebar } from '@/components/sidebar';
import { ChatPanel } from '@/components/chat-panel';
import { UserNav } from '@/components/auth/user-nav';
import { LuHouse, LuPlus, LuMessageCircle } from 'react-icons/lu';
import type { SnippetWithLatestVersion } from '@/types/database';
import type { User } from '@supabase/supabase-js';

interface DashboardLayoutProps {
    snippets: SnippetWithLatestVersion[];
    user: User | null;
    children: React.ReactNode;
}

export function DashboardLayout({ snippets, user, children }: DashboardLayoutProps) {
    const pathname = usePathname();
    const router = useRouter();

    // Determine if a snippet is currently selected based on the URL
    const isSnippetSelected = pathname.startsWith('/snippet/');
    const isNewSnippetPage = pathname === '/new';
    const isHomePage = pathname === '/';

    // Chat is open by default when on the home page (not viewing a snippet or creating new)
    const [isChatOpen, setIsChatOpen] = useState(isHomePage);

    // Update chat state when pathname changes
    useEffect(() => {
        if (isSnippetSelected || isNewSnippetPage) {
            setIsChatOpen(false);
        } else if (isHomePage) {
            // When navigating back to home, show chat
            setIsChatOpen(true);
        }
    }, [pathname, isSnippetSelected, isNewSnippetPage, isHomePage]);

    const handleChatToggle = () => {
        // If we're on a snippet or new page, navigate to home (which shows chat)
        if (isSnippetSelected || isNewSnippetPage) {
            router.push('/');
        } else {
            // On home page, toggle chat
            setIsChatOpen(!isChatOpen);
        }
    };

    // Determine what to show in the main content area
    const showChat = isChatOpen && isHomePage;

    return (
        <div className="min-h-screen bg-white">
            {/* Sidebar - fixed on desktop */}
            <div className="hidden lg:block">
                <Sidebar
                    snippets={snippets}
                    user={user}
                    onChatOpen={handleChatToggle}
                    isChatOpen={showChat}
                />
            </div>

            {/* Main Content Area */}
            <main className="lg:ml-72 min-h-screen flex justify-center pb-20 lg:pb-0">
                <div className="w-full max-w-5xl px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
                    {showChat ? (
                        <ChatPanel isFullView />
                    ) : (
                        children
                    )}
                </div>
            </main>

            {/* Mobile bottom nav - when sidebar is hidden */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))]">
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
                    <button
                        type="button"
                        onClick={handleChatToggle}
                        className={`flex flex-col items-center gap-1 py-2 px-4 rounded-lg transition-colors ${showChat ? 'text-orange-500' : 'text-gray-600'}`}
                    >
                        <LuMessageCircle className="w-5 h-5" />
                        <span className="text-xs font-medium">Chat</span>
                    </button>
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
