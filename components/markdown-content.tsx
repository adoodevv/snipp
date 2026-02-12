'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownContentProps {
    content: string;
    className?: string;
}

export function MarkdownContent({ content, className = '' }: MarkdownContentProps) {
    return (
        <div className={`markdown-content text-gray-800 text-sm sm:text-base ${className}`}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                    code: ({ className, children, ...props }) => {
                        const isInline = !className;
                        if (isInline) {
                            return (
                                <code
                                    className="px-1.5 py-0.5 rounded bg-gray-200 text-gray-900 font-mono text-[0.9em]"
                                    {...props}
                                >
                                    {children}
                                </code>
                            );
                        }
                        return (
                            <code
                                className="block text-gray-100 font-mono text-sm overflow-x-auto whitespace-pre"
                                {...props}
                            >
                                {children}
                            </code>
                        );
                    },
                    pre: ({ children }) => (
                        <pre className="my-2 overflow-x-auto rounded-lg bg-gray-900 p-3">{children}</pre>
                    ),
                    ul: ({ children }) => <ul className="list-disc pl-5 mb-2 space-y-1">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal pl-5 mb-2 space-y-1">{children}</ol>,
                    li: ({ children }) => <li className="mb-0.5">{children}</li>,
                    a: ({ href, children }) => (
                        <a href={href} target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:underline">
                            {children}
                        </a>
                    ),
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}
