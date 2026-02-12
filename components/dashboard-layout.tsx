'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/sidebar';
import { ChatPanel } from '@/components/chat-panel';
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
            <main className="lg:ml-72 min-h-screen flex justify-center">
                <div className="w-full max-w-5xl px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
                    {showChat ? (
                        <ChatPanel isFullView />
                    ) : (
                        children
                    )}
                </div>
            </main>
        </div>
    );
}
