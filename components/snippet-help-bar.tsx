'use client';

import { FaArrowUp } from "react-icons/fa";
import { useState } from 'react';

interface SnippetHelpBarProps {
    snippetTitle: string;
}

export function SnippetHelpBar({ snippetTitle }: SnippetHelpBarProps) {
    const [message, setMessage] = useState('');

    const handleSend = () => {
        if (message.trim()) {
            // Placeholder - actual AI functionality to be implemented
            console.log('Asking about snippet:', snippetTitle, 'Question:', message);
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
        <div className="fixed bottom-0 left-0 right-0 lg:left-72 bg-white border-t border-gray-200 p-4 z-30">
            <div className="max-w-5xl mx-auto">
                <div className="flex items-center bg-gray-50 border border-gray-200 rounded-full px-5 py-3 focus-within:ring-2 focus-within:ring-orange-400 focus-within:border-transparent focus-within:bg-white transition-all duration-200">
                    <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask about this code..."
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
        </div>
    );
}
