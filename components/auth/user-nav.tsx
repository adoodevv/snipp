'use client';

import { createClient } from '@/utils/supabase/client';
import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import { LuChevronsUpDown, LuLogOut } from 'react-icons/lu';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';

interface UserNavProps {
    user: User | null;
    compact?: boolean;
}

export function UserNav({ user, compact = false }: UserNavProps) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    if (!user) {
        return null;
    }

    const userInitial = user.user_metadata?.full_name?.[0]?.toUpperCase()
        || user.email?.[0]?.toUpperCase()
        || 'U';
    const displayName = user.user_metadata?.full_name || user.email || 'User';
    const avatarUrl = user.user_metadata?.avatar_url;

    const handleSignOut = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push('/auth/login');
        router.refresh();
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-3 rounded-lg transition-colors duration-300 ${compact ? 'p-1.5 hover:bg-gray-100' : 'w-full px-3 py-2 bg-gray-50 hover:bg-gray-100'}`}
            >
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-300 text-gray-700 flex-shrink-0 font-medium text-sm overflow-hidden">
                    {avatarUrl ? (
                        <Image
                            src={avatarUrl}
                            alt={displayName}
                            width={32}
                            height={32}
                            className="h-8 w-8 rounded-full object-cover"
                        />
                    ) : (
                        userInitial
                    )}
                </div>
                {!compact && (
                    <>
                        <div className="flex flex-col items-start min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate w-full">
                                {displayName}
                            </p>
                            <p className="text-xs text-gray-600 truncate w-full">{user.email}</p>
                        </div>
                        <LuChevronsUpDown className="text-gray-700 flex-shrink-0" />
                    </>
                )}
            </button>

            {isOpen && (
                <div className={`absolute bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-[60] ${compact ? 'right-0 bottom-full mb-2 w-56' : 'left-3/4 bottom-full mb-2 w-64'}`}>
                    <div className="flex items-center gap-3 px-4 py-3">
                        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-300 text-gray-700 flex-shrink-0 font-medium text-sm overflow-hidden">
                            {avatarUrl ? (
                                <Image
                                    src={avatarUrl}
                                    alt={displayName}
                                    width={32}
                                    height={32}
                                    className="h-8 w-8 rounded-full object-cover"
                                />
                            ) : (
                                userInitial
                            )}
                        </div>
                        <div className="flex flex-col items-start min-w-0 flex-1 overflow-hidden">
                            <p className="text-sm font-medium text-gray-900 truncate w-full">
                                {displayName}
                            </p>
                            <p className="text-xs text-gray-600 truncate w-full">{user.email}</p>
                        </div>
                    </div>

                    <div className="border-t border-gray-200"></div>

                    <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-900 hover:bg-gray-50 transition-colors"
                    >
                        <LuLogOut className="text-gray-700" />
                        <span>Log out</span>
                    </button>
                </div>
            )}
        </div>
    );
}
