'use client';

import { FaArrowUp } from "react-icons/fa";
import { useState, useRef, useEffect } from 'react';
import { MarkdownContent } from '@/components/markdown-content';

interface SnippetHelpBarProps {
    snippetTitle: string;
    snippetCode: string;
    snippetLanguage?: string | null;
}

export function SnippetHelpBar({ snippetTitle, snippetCode, snippetLanguage }: SnippetHelpBarProps) {
    const [message, setMessage] = useState('');
    const [response, setResponse] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = Math.min(el.scrollHeight, 150) + 'px';
    }, [message]);

    const handleSend = async () => {
        if (!message.trim() || isLoading) return;

        const question = message.trim();
        setMessage('');
        setResponse(null);
        setIsLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/ai/ask-snippet', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question,
                    snippetTitle,
                    code: snippetCode,
                    language: snippetLanguage || 'unknown',
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to get response');
            }

            setResponse(data.text);
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

    return (
        <div className="fixed left-0 right-0 lg:left-72 bg-white border-t border-gray-200 p-4 z-30 bottom-20 lg:bottom-0">
            <div className="max-w-5xl mx-auto px-0 sm:px-4">
                {response !== null && (
                    <div className="mb-4 max-h-[40vh] overflow-y-auto p-4 pr-3 bg-gray-50 border border-gray-200 rounded-xl relative">
                        <button
                            type="button"
                            onClick={() => setResponse(null)}
                            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-sm"
                            aria-label="Hide response"
                        >
                            ×
                        </button>
                        <div className="pr-6">
                            <MarkdownContent content={response} />
                        </div>
                    </div>
                )}
                {error && (
                    <p className="mb-2 text-sm text-red-500">{error}</p>
                )}
                <div className="flex items-end gap-2 sm:gap-3 bg-gray-50 border border-gray-200 rounded-2xl px-4 sm:px-5 py-2.5 sm:py-3 focus-within:ring-2 focus-within:ring-orange-400 focus-within:border-transparent focus-within:bg-white transition-all duration-200">
                    <textarea
                        ref={textareaRef}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask about this code..."
                        rows={1}
                        disabled={isLoading}
                        className="flex-1 min-w-0 bg-transparent border-none outline-none text-gray-900 placeholder:text-gray-400 text-sm sm:text-base resize-none overflow-y-auto max-h-[150px] py-1 disabled:opacity-70"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!message.trim() || isLoading}
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-200 disabled:cursor-not-allowed flex items-center justify-center flex-shrink-0 transition-colors duration-200"
                    >
                        {isLoading ? (
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <FaArrowUp className="w-4 h-4 text-white" />
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
