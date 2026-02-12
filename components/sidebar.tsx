'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';
import { LuSearch, LuMessageCircle, LuPlus } from 'react-icons/lu';
import { UserNav } from '@/components/auth/user-nav';
import type { SnippetWithLatestVersion } from '@/types/database';
import type { User } from '@supabase/supabase-js';

interface SidebarProps {
    snippets: SnippetWithLatestVersion[];
    user: User | null;
    onChatOpen?: () => void;
    isChatOpen?: boolean;
}

export function Sidebar({ snippets, user, onChatOpen, isChatOpen }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');

    // Get current snippet ID from URL
    const currentSnippetId = useMemo(() => {
        const match = pathname.match(/\/snippet\/([^/]+)/);
        return match ? match[1] : null;
    }, [pathname]);

    // Filter snippets based on search query
    const filteredSnippets = useMemo(() => {
        if (!searchQuery.trim()) return snippets;
        const query = searchQuery.toLowerCase();
        return snippets.filter(
            (snippet) =>
                snippet.title.toLowerCase().includes(query) ||
                snippet.language?.toLowerCase().includes(query)
        );
    }, [snippets, searchQuery]);

    const handleSnippetClick = (snippetId: string) => {
        router.push(`/snippet/${snippetId}`);
    };

    return (
        <aside className="app-sidebar">
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
                <h1 className="text-xl font-semibold text-gray-900">Sni<span className="text-orange-600 text-xl font-semibold">pp</span></h1>
            </div>

            {/* Search Box */}
            <div className="p-4 space-y-3">
                <div className="relative">
                    <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search snippets..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="app-search-input"
                    />
                </div>

                {/* Chat Button */}
                <button
                    onClick={onChatOpen}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors duration-200 ${isChatOpen
                            ? 'bg-orange-100 text-orange-700 border border-orange-200'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                        }`}
                >
                    <LuMessageCircle className="w-4 h-4" />
                    Chat
                </button>

                {/* Create New Snippet Button */}
                <Link
                    href="/new"
                    className="app-button-primary w-full flex items-center justify-center gap-2"
                >
                    <LuPlus className="w-4 h-4" />
                    Create New Snippet
                </Link>
            </div>

            {/* Snippet List */}
            <div className="flex-1 overflow-y-auto border-t border-gray-200">
                {filteredSnippets.length === 0 ? (
                    <div className="p-4 text-center text-sm text-gray-500">
                        {snippets.length === 0
                            ? 'No snippets yet'
                            : 'No snippets match your search'}
                    </div>
                ) : (
                    <ul className="py-2">
                        {filteredSnippets.map((snippet) => (
                            <li key={snippet.id}>
                                <button
                                    onClick={() => handleSnippetClick(snippet.id)}
                                    className={`app-sidebar-item ${currentSnippetId === snippet.id ? 'active' : ''
                                        }`}
                                >
                                    <span className="flex-1 text-left truncate font-medium">
                                        {snippet.title}
                                    </span>
                                    {snippet.language && (
                                        <span className="px-2 py-0.5 text-xs font-medium bg-gray-200 text-gray-600 rounded-full flex-shrink-0">
                                            {snippet.language}
                                        </span>
                                    )}
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* User Menu at Bottom */}
            <div className="mt-auto border-t border-gray-200 p-4">
                <UserNav user={user} />
            </div>
        </aside>
    );
}
