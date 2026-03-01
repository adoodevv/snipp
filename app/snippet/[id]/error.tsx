'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function SnippetError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center px-4">
            <div className="max-w-md w-full text-center">
                <h2 className="text-xl font-semibold mb-2">Failed to load snippet</h2>
                <p className="text-gray-600 mb-6">
                    We couldn&apos;t load this snippet. It may have been deleted or you may not have access.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                        onClick={reset}
                        className="px-4 py-2 rounded-full bg-orange-500 text-white font-medium hover:bg-orange-600 transition-colors"
                    >
                        Try again
                    </button>
                    <Link
                        href="/"
                        className="inline-flex justify-center items-center rounded-full border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
                    >
                        Back to snippets
                    </Link>
                </div>
            </div>
        </div>
    );
}
