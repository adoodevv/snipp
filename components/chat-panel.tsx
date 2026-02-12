'use client';

import { FaArrowUp } from "react-icons/fa";
import { useState, useRef, useEffect } from 'react';
import { LuPlus, LuSave, LuChevronDown, LuMessageSquare, LuTrash2 } from "react-icons/lu";
import { MarkdownContent } from '@/components/markdown-content';
import type { SnippetWithLatestVersion } from '@/types/database';
import type { AiConversation } from '@/types/database';

interface ChatPanelProps {
    onClose?: () => void;
    isFullView?: boolean;
    snippets?: SnippetWithLatestVersion[];
}

interface Message {
    role: 'user' | 'model';
    content: string;
}

export function ChatPanel({ onClose, isFullView = false, snippets = [] }: ChatPanelProps) {
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [conversations, setConversations] = useState<AiConversation[]>([]);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [conversationTitle, setConversationTitle] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [saveTitle, setSaveTitle] = useState('');
    const [showConvDropdown, setShowConvDropdown] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const fetchConversations = async () => {
        try {
            const res = await fetch('/api/ai/conversations');
            if (res.ok) {
                const data = await res.json();
                setConversations(data);
            }
        } catch {
            // User may not be logged in
        }
    };

    useEffect(() => {
        fetchConversations();
    }, []);

    useEffect(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = Math.min(el.scrollHeight, 200) + 'px';
    }, [message]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setShowConvDropdown(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSend = async () => {
        if (!message.trim() || isLoading) return;

        const userMessage = message.trim();
        setMessage('');
        setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
        setIsLoading(true);
        setError(null);

        try {
            const snippetsForApi = snippets.map((s) => ({
                title: s.title,
                language: s.language || undefined,
                code: s.latest_code,
            }));

            const history = messages.map((m) => ({ role: m.role, content: m.content }));

            const res = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMessage,
                    history,
                    snippets: snippetsForApi,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to get response');
            }

            const modelContent = data.text;
            setMessages((prev) => [...prev, { role: 'model', content: modelContent }]);

            if (conversationId) {
                await fetch(`/api/ai/conversations/${conversationId}/messages`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        messages: [
                            { role: 'user', content: userMessage },
                            { role: 'model', content: modelContent },
                        ],
                    }),
                });
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong');
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleQuickAction = (action: string) => {
        const prompts: Record<string, string> = {
            'Find snippets': 'Find snippets in my collection that match: ',
            'Explain code': 'Explain this code to me: ',
            'Generate snippet': 'Generate a code snippet for: ',
        };
        setMessage((prev) => (prev ? prev + ' ' : '') + (prompts[action] || action));
    };

    const handleNewConversation = () => {
        setConversationId(null);
        setConversationTitle(null);
        setMessages([]);
        setShowConvDropdown(false);
    };

    const handleLoadConversation = async (conv: AiConversation) => {
        setShowConvDropdown(false);
        try {
            const res = await fetch(`/api/ai/conversations/${conv.id}`);
            if (!res.ok) throw new Error('Failed to load');
            const data = await res.json();
            setConversationId(data.id);
            setConversationTitle(data.title);
            setMessages(
                data.messages.map((m: { role: string; content: string }) => ({
                    role: m.role as 'user' | 'model',
                    content: m.content,
                }))
            );
        } catch {
            setError('Failed to load conversation');
        }
    };

    const handleSave = () => {
        const title = messages.length > 0
            ? messages.find((m) => m.role === 'user')?.content.slice(0, 50) || 'New conversation'
            : 'New conversation';
        setSaveTitle(title);
        setShowSaveModal(true);
    };

    const handleSaveSubmit = async () => {
        const title = saveTitle.trim() || 'Untitled';
        setIsSaving(true);
        try {
            const res = await fetch('/api/ai/conversations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, messages }),
            });
            if (!res.ok) throw new Error('Failed to save');
            const conv = await res.json();
            setConversationId(conv.id);
            setConversationTitle(conv.title);
            setShowSaveModal(false);
            await fetchConversations();
        } catch {
            setError('Failed to save conversation');
        } finally {
            setIsSaving(false);
        }
    };

    const containerClasses = isFullView
        ? 'flex flex-col h-full bg-white'
        : 'flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-100';

    const hasMessages = messages.length > 0;

    return (
        <div className={containerClasses}>
            {/* Top bar: conversations + new + save */}
            <div className="flex-shrink-0 flex items-center justify-between gap-2 px-3 sm:px-4 py-2.5 sm:py-3 border-b border-gray-200">
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0" ref={dropdownRef}>
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setShowConvDropdown(!showConvDropdown)}
                            className="flex items-center gap-2 px-2.5 sm:px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs sm:text-sm font-medium max-w-[200px] sm:max-w-[280px] truncate"
                        >
                            <LuMessageSquare className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">
                                {conversationTitle || 'New conversation'}
                            </span>
                            <LuChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform ${showConvDropdown ? 'rotate-180' : ''}`} />
                        </button>
                        {showConvDropdown && (
                            <div className="absolute left-0 top-full mt-1 w-full min-w-[200px] sm:w-64 max-w-[calc(100vw-2rem)] max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-2">
                                <button
                                    type="button"
                                    onClick={handleNewConversation}
                                    className="w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-gray-50 text-gray-700"
                                >
                                    <LuPlus className="w-4 h-4" />
                                    New conversation
                                </button>
                                {conversations.length > 0 && (
                                    <>
                                        <div className="border-t border-gray-100 my-2" />
                                        {conversations.map((c) => (
                                            <div
                                                key={c.id}
                                                className={`group flex items-center gap-1 ${conversationId === c.id ? 'bg-orange-50' : ''
                                                    }`}
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() => handleLoadConversation(c)}
                                                    className={`flex-1 min-w-0 px-4 py-2.5 text-left text-sm truncate hover:bg-gray-50 ${conversationId === c.id ? 'text-orange-700' : 'text-gray-700'
                                                        }`}
                                                >
                                                    {c.title}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={async (e) => {
                                                        e.stopPropagation();
                                                        if (!confirm('Delete this conversation?')) return;
                                                        try {
                                                            await fetch(`/api/ai/conversations/${c.id}`, { method: 'DELETE' });
                                                            if (conversationId === c.id) handleNewConversation();
                                                            await fetchConversations();
                                                        } catch {
                                                            setError('Failed to delete');
                                                        }
                                                    }}
                                                    className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    title="Delete"
                                                >
                                                    <LuTrash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        ))}
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={handleNewConversation}
                        className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 flex-shrink-0"
                        title="New conversation"
                    >
                        <LuPlus className="w-4 h-4" />
                    </button>
                </div>
                {hasMessages && (
                    <button
                        type="button"
                        onClick={handleSave}
                        className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs sm:text-sm font-medium flex-shrink-0"
                    >
                        <LuSave className="w-4 h-4" />
                        Save
                    </button>
                )}
            </div>

            {onClose && (
                <div className="flex justify-end px-4 pt-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        Close
                    </button>
                </div>
            )}

            <div className={isFullView ? 'flex-1 flex flex-col min-h-0' : 'flex-1 flex flex-col min-h-[400px]'}>
                {hasMessages ? (
                    <>
                        <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 sm:py-6 space-y-3 sm:space-y-4">
                            {messages.map((m, i) => (
                                <div
                                    key={i}
                                    className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[90%] sm:max-w-[85%] rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 ${m.role === 'user'
                                                ? 'bg-orange-500 text-white'
                                                : 'bg-gray-100 text-gray-900'
                                            }`}
                                    >
                                        {m.role === 'user' ? (
                                            <p className="text-xs sm:text-sm md:text-base text-white whitespace-pre-wrap break-words">
                                                {m.content}
                                            </p>
                                        ) : (
                                            <div className="text-xs sm:text-sm md:text-base [&_*]:last:mb-0">
                                                <MarkdownContent content={m.content} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-gray-100 rounded-2xl px-4 py-3">
                                        <span className="inline-block w-2 h-2 bg-gray-400 rounded-full animate-pulse" />
                                        <span className="inline-block w-2 h-2 bg-gray-400 rounded-full animate-pulse ml-1" />
                                        <span className="inline-block w-2 h-2 bg-gray-400 rounded-full animate-pulse ml-1" />
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-6 sm:py-12">
                        <div className="mb-6 sm:mb-8 text-center">
                            <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-gray-900 mb-2">
                                Sni<span className="text-orange-500 text-2xl sm:text-3xl md:text-4xl font-semibold">pp</span> AI
                            </h1>
                            <p className="text-gray-500 text-xs sm:text-sm md:text-base">
                                Search your snippets with AI
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center justify-center gap-2 mb-6 sm:mb-8">
                            <button
                                onClick={() => handleQuickAction('Find snippets')}
                                className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-full hover:bg-gray-50 hover:border-gray-300 transition-colors duration-200"
                            >
                                Find snippets
                            </button>
                            <button
                                onClick={() => handleQuickAction('Explain code')}
                                className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-full hover:bg-gray-50 hover:border-gray-300 transition-colors duration-200"
                            >
                                Explain code
                            </button>
                            <button
                                onClick={() => handleQuickAction('Generate snippet')}
                                className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-full hover:bg-gray-50 hover:border-gray-300 transition-colors duration-200"
                            >
                                Generate snippet
                            </button>
                        </div>
                    </div>
                )}

                <div className="flex-shrink-0 px-3 sm:px-4 pb-6">
                    <div className="w-full max-w-2xl mx-auto">
                        {error && (
                            <p className="text-xs sm:text-sm text-red-500 mb-2">{error}</p>
                        )}
                        <div className="flex items-end gap-2 sm:gap-3 bg-gray-50 border border-gray-200 rounded-xl sm:rounded-2xl px-3 sm:px-5 py-2.5 sm:py-3 focus-within:ring-2 focus-within:ring-orange-400 focus-within:border-transparent focus-within:bg-white transition-all duration-200">
                            <textarea
                                ref={textareaRef}
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="What do you want to know?"
                                rows={1}
                                disabled={isLoading}
                                className="flex-1 min-w-0 bg-transparent border-none outline-none text-gray-900 placeholder:text-gray-400 text-sm sm:text-base resize-none overflow-y-auto max-h-[150px] sm:max-h-[200px] py-1 disabled:opacity-70"
                            />
                            <button
                                onClick={handleSend}
                                disabled={!message.trim() || isLoading}
                                className="flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-200 disabled:cursor-not-allowed flex items-center justify-center transition-colors duration-200"
                            >
                                <FaArrowUp className="w-4 h-4 text-white" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Save modal */}
            {showSaveModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Save conversation</h3>
                        <p className="text-sm text-gray-500 mb-4">Give this conversation a label to find it later.</p>
                        <input
                            type="text"
                            value={saveTitle}
                            onChange={(e) => setSaveTitle(e.target.value)}
                            placeholder="e.g. Number of islands, twoSum help"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none text-gray-900"
                            autoFocus
                        />
                        <div className="flex gap-2 mt-4">
                            <button
                                type="button"
                                onClick={() => setShowSaveModal(false)}
                                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveSubmit}
                                disabled={isSaving || !saveTitle.trim()}
                                className="flex-1 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSaving ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
