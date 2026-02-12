'use client';

import { useState } from 'react';
import { HiOutlineLink, HiOutlineClipboard, HiOutlineCheck, HiOutlineX, HiOutlineRefresh } from 'react-icons/hi';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    snippetId: string;
    snippetTitle: string;
    collabToken: string;
    isOwner: boolean;
    onTokenRegenerated?: (newToken: string) => void;
}

export function ShareModal({
    isOpen,
    onClose,
    snippetId,
    snippetTitle,
    collabToken,
    isOwner,
    onTokenRegenerated
}: ShareModalProps) {
    const [copied, setCopied] = useState(false);
    const [isRegenerating, setIsRegenerating] = useState(false);

    if (!isOpen) return null;

    const shareUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/snippet/${snippetId}?token=${collabToken}`
        : '';

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const handleRegenerate = async () => {
        if (!isOwner) return;

        setIsRegenerating(true);
        try {
            const response = await fetch(`/api/snippet/${snippetId}/regenerate-token`, {
                method: 'POST',
            });

            if (response.ok) {
                const data = await response.json() as { token: string };
                onTokenRegenerated?.(data.token);
            }
        } catch (err) {
            console.error('Failed to regenerate token:', err);
        } finally {
            setIsRegenerating(false);
        }
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={handleBackdropClick}
        >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                            <HiOutlineLink className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">Share Snippet</h2>
                            <p className="text-sm text-gray-500">Collaborate in real-time</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <HiOutlineX className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-6">
                    <p className="text-sm text-gray-600 mb-4">
                        Share this link to collaborate on <span className="font-medium text-gray-900">&quot;{snippetTitle}&quot;</span>
                    </p>

                    {/* Link input with copy button */}
                    <div className="flex flex-col sm:flex-row gap-2">
                        <div className="flex-1 flex items-center bg-gray-50 border border-gray-200 rounded-lg overflow-hidden min-w-0">
                            <input
                                type="text"
                                readOnly
                                value={shareUrl}
                                className="flex-1 px-4 py-3 bg-transparent text-sm text-gray-700 outline-none min-w-0"
                            />
                        </div>
                        <button
                            onClick={handleCopy}
                            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200 flex-shrink-0 ${copied
                                ? 'bg-green-500 text-white'
                                : 'bg-orange-500 hover:bg-orange-600 text-white'
                                }`}
                        >
                            {copied ? (
                                <>
                                    <HiOutlineCheck className="w-4 h-4" />
                                    Copied!
                                </>
                            ) : (
                                <>
                                    <HiOutlineClipboard className="w-4 h-4" />
                                    Copy
                                </>
                            )}
                        </button>
                    </div>

                    {/* Regenerate button for owners */}
                    {isOwner && (
                        <button
                            onClick={handleRegenerate}
                            disabled={isRegenerating}
                            className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                        >
                            <HiOutlineRefresh className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
                            {isRegenerating ? 'Regenerating...' : 'Regenerate Link (Revokes Access)'}
                        </button>
                    )}

                    {/* Collaboration info */}
                    <div className="mt-6 p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-100">
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                                <span className="text-lg">🔐</span>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-900 mb-1">Secure collaboration</p>
                                <p className="text-xs text-gray-600">
                                    Only people with this link can edit. Regenerate the link to revoke access for all current collaborators.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
