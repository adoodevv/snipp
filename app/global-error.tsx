'use client';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <html lang="en">
            <body className="min-h-screen bg-white flex flex-col items-center justify-center px-4 font-sans">
                <div className="max-w-md w-full text-center">
                    <h1 className="text-2xl font-semibold mb-2">Something went wrong</h1>
                    <p className="text-gray-600 mb-6">
                        A critical error occurred. Please refresh the page.
                    </p>
                    <button
                        onClick={reset}
                        className="inline-flex justify-center items-center rounded-full bg-orange-500 text-white font-semibold px-5 py-3 hover:bg-orange-600 transition-colors"
                    >
                        Try again
                    </button>
                </div>
            </body>
        </html>
    );
}
