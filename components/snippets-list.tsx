import Link from "next/link";
import type { SnippetWithLatestVersion } from "@/types/database";

interface SnippetsListProps {
    snippets: SnippetWithLatestVersion[];
    currentPage: number;
    totalPages: number;
    total: number;
}

export function SnippetsList({ snippets, currentPage, totalPages, total }: SnippetsListProps) {
    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                {snippets.map((snippet) => (
                    <Link
                        key={snippet.id}
                        href={`/snippet/${snippet.id}`}
                        className="app-card hover:shadow-lg transition-shadow duration-300 block"
                    >
                        <div className="flex items-start justify-between mb-3">
                            <h3 className="text-lg sm:text-xl font-semibold line-clamp-2 flex-1">
                                {snippet.title}
                            </h3>
                            {snippet.is_public === 1 && (
                                <span className="ml-2 px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full flex-shrink-0">
                                    Public
                                </span>
                            )}
                        </div>
                        {snippet.language && (
                            <span className="inline-block px-2 py-1 text-xs font-medium bg-gray-200 text-gray-700 rounded mb-3">
                                {snippet.language}
                            </span>
                        )}
                        <pre
                            className="text-xs sm:text-sm font-mono bg-gray-50 p-3 rounded-lg overflow-hidden line-clamp-4 mb-3"
                            style={{ color: "#666666" }}
                        >
                            {snippet.latest_code}
                        </pre>
                        <div
                            className="flex items-center justify-between text-xs"
                            style={{ color: "#777777" }}
                        >
                            <span>v{snippet.latest_version}</span>
                            <span>{new Date(snippet.updated_at).toLocaleDateString()}</span>
                        </div>
                    </Link>
                ))}
            </div>

            {totalPages > 1 && (
                <nav className="mt-8 flex items-center justify-center gap-2" aria-label="Pagination">
                    {currentPage > 1 ? (
                        <Link
                            href={currentPage === 2 ? "/" : `/?page=${currentPage - 1}`}
                            className="px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-sm font-medium transition-colors"
                        >
                            Previous
                        </Link>
                    ) : (
                        <span className="px-4 py-2 rounded-lg border border-gray-100 text-gray-400 text-sm font-medium cursor-not-allowed">
                            Previous
                        </span>
                    )}
                    <span className="px-4 py-2 text-sm text-gray-600">
                        Page {currentPage} of {totalPages}
                    </span>
                    {currentPage < totalPages ? (
                        <Link
                            href={`/?page=${currentPage + 1}`}
                            className="px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-sm font-medium transition-colors"
                        >
                            Next
                        </Link>
                    ) : (
                        <span className="px-4 py-2 rounded-lg border border-gray-100 text-gray-400 text-sm font-medium cursor-not-allowed">
                            Next
                        </span>
                    )}
                </nav>
            )}
        </>
    );
}
