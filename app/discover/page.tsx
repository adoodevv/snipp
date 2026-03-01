import { createClient } from "@/utils/supabase/server";
import { getPublicSnippets } from "@/lib/db";
import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard-layout";
import { getSnippetsByUserId } from "@/lib/db";

interface DiscoverPageProps {
    searchParams: Promise<{ page?: string }>;
}

export default async function DiscoverPage({ searchParams }: DiscoverPageProps) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { page } = await searchParams;
    const currentPage = Math.max(1, parseInt(String(page), 10) || 1);
    const limit = 24;
    const offset = (currentPage - 1) * limit;

    const { snippets, total } = await getPublicSnippets(limit, offset);
    const totalPages = Math.ceil(total / limit) || 1;

    const sidebarSnippets = user?.id ? (await getSnippetsByUserId(user.id, 200, 0)).snippets : [];

    const content = (
        <div className="w-full">
            <header className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-semibold">Discover Public Snippets</h1>
                <p className="mt-2 text-sm sm:text-base" style={{ color: "#666666" }}>
                    Browse and explore code shared by the community
                </p>
            </header>

            {snippets.length === 0 ? (
                <div className="app-card text-center py-12">
                    <p className="text-base sm:text-lg mb-6">
                        No public snippets yet. Be the first to share!
                    </p>
                    {user ? (
                        <Link href="/new" className="app-button-primary inline-block">
                            Create a Snippet
                        </Link>
                    ) : (
                        <Link href="/auth/signup" className="app-button-primary inline-block">
                            Sign up to share
                        </Link>
                    )}
                </div>
            ) : (
                <>
                    <p className="mb-6 text-sm" style={{ color: "#666666" }}>
                        {total} {total === 1 ? "snippet" : "snippets"} to explore
                    </p>
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
                                    <span className="ml-2 px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full flex-shrink-0">
                                        Public
                                    </span>
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
                                    href={currentPage === 2 ? "/discover" : `/discover?page=${currentPage - 1}`}
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
                                    href={`/discover?page=${currentPage + 1}`}
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
            )}
        </div>
    );

    if (user) {
        return (
            <DashboardLayout snippets={sidebarSnippets} user={user}>
                {content}
            </DashboardLayout>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            <header className="border-b border-gray-200 p-4 sm:p-6">
                <div className="max-w-5xl mx-auto flex justify-between items-center">
                    <Link href="/" className="text-xl sm:text-2xl font-bold">
                        Sni<span className="text-orange-500">pp</span>
                    </Link>
                    <div className="flex gap-4">
                        <Link href="/auth/login" className="text-sm font-medium hover:text-orange-500 transition-colors">
                            Sign In
                        </Link>
                        <Link href="/auth/signup" className="app-button-primary py-2 px-4 text-sm">
                            Sign Up
                        </Link>
                    </div>
                </div>
            </header>
            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
                {content}
            </main>
        </div>
    );
}
