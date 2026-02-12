'use client';

import { FaArrowUp } from "react-icons/fa";
import { useState } from 'react';

interface ChatPanelProps {
    onClose?: () => void;
    isFullView?: boolean;
}

export function ChatPanel({ onClose, isFullView = false }: ChatPanelProps) {
    const [message, setMessage] = useState('');

    const containerClasses = isFullView
        ? 'flex flex-col h-full bg-white'
        : 'flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-100';

    const handleSend = () => {
        if (message.trim()) {
            // Placeholder - actual AI functionality to be implemented
            console.log('Sending message:', message);
            setMessage('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className={containerClasses}>
            {/* Optional header with close button */}
            {onClose && (
                <div className="flex items-center justify-end px-4 pt-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        Close
                    </button>
                </div>
            )}
            {/* Main Content - Centered Search Interface */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 sm:py-12">
                {/* Logo/Title Section */}
                <div className="mb-8 text-center">
                    <h1 className="text-3xl sm:text-4xl font-semibold text-gray-900 mb-2">
                        Snipp AI
                    </h1>
                    <p className="text-gray-500 text-sm sm:text-base">
                        Search your snippets with AI
                    </p>
                </div>

                {/* Search Input Container */}
                <div className="w-full max-w-2xl">
                    <div className="relative">
                        <div className="flex items-center bg-gray-50 border border-gray-200 rounded-full px-5 py-3 focus-within:ring-2 focus-within:ring-orange-400 focus-within:border-transparent focus-within:bg-white transition-all duration-200">
                            <input
                                type="text"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="What do you want to know?"
                                className="flex-1 bg-transparent border-none outline-none text-gray-900 placeholder:text-gray-400 text-base"
                            />
                            <button
                                onClick={handleSend}
                                disabled={!message.trim()}
                                className="ml-3 w-10 h-10 rounded-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-200 disabled:cursor-not-allowed flex items-center justify-center transition-colors duration-200"
                            >
                                <FaArrowUp className="w-4 h-4 text-white" />
                            </button>
                        </div>
                    </div>

                    {/* Quick Action Chips */}
                    <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
                        <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-full hover:bg-gray-50 hover:border-gray-300 transition-colors duration-200 flex items-center gap-2">
                            Find snippets
                        </button>
                        <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-full hover:bg-gray-50 hover:border-gray-300 transition-colors duration-200">
                            Explain code
                        </button>
                        <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-full hover:bg-gray-50 hover:border-gray-300 transition-colors duration-200">
                            Generate snippet
                        </button>
                    </div>

                    {/* Subtle hint */}
                    <p className="text-center text-xs text-gray-400 mt-8">
                        AI-powered search coming soon
                    </p>
                </div>
            </div>
        </div>
    );
}
