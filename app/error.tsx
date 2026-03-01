'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
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
        <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
            <div className="max-w-md w-full text-center">
                <h1 className="text-2xl font-semibold mb-2">Something went wrong</h1>
                <p className="text-gray-600 mb-6">
                    An unexpected error occurred. Please try again.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                        onClick={reset}
                        className="app-button-primary"
                    >
                        Try again
                    </button>
                    <Link
                        href="/"
                        className="inline-flex justify-center items-center rounded-full border border-gray-300 px-5 py-3 text-sm font-medium hover:bg-gray-50 transition-colors"
                    >
                        Go home
                    </Link>
                </div>
            </div>
        </div>
    );
}
