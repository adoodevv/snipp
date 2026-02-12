import Hero from "@/components/hero";
import { createClient } from "@/utils/supabase/server";
import { getSnippetsByUserId } from "@/lib/db";
import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard-layout";

export default async function Home() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return <Hero user={null} />;
    }

    const snippets = await getSnippetsByUserId(user.id);

    return (
        <DashboardLayout snippets={snippets} user={user}>
            <div className="w-full">
                <header className="lg:hidden mb-6 flex justify-between items-center">
                    <h1 className="text-xl font-semibold">My Snippets</h1>
                </header>

                <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <p className="text-sm sm:text-base">
                        {snippets.length === 0
                            ? "You don't have any snippets yet"
                            : `${snippets.length} ${snippets.length === 1 ? "snippet" : "snippets"}`}
                    </p>
                    <Link
                        href="/new"
                        className="app-button-primary w-full sm:w-auto lg:hidden"
                    >
                        Create New Snippet
                    </Link>
                </div>

                {snippets.length === 0 ? (
                    <div className="app-card text-center py-12">
                        <p className="text-base sm:text-lg mb-6">
                            Get started by creating your first code snippet
                        </p>
                        <Link href="/new" className="app-button-primary inline-block lg:hidden">
                            Create Your First Snippet
                        </Link>
                        <p className="hidden lg:block text-sm text-gray-500">
                            Use the sidebar to create a new snippet
                        </p>
                    </div>
                ) : (
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
                )}
            </div>
        </DashboardLayout>
    );
}
