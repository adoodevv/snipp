import Hero from "@/components/hero";
import { createClient } from "@/utils/supabase/server";
import { getSnippetsByUserId, SNIPPETS_PAGE_SIZE } from "@/lib/db";
import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard-layout";
import { SnippetsList } from "@/components/snippets-list";

interface HomeProps {
    searchParams: Promise<{ page?: string }>;
}

export default async function Home({ searchParams }: HomeProps) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return <Hero user={null} />;
    }

    const { page } = await searchParams;
    const currentPage = Math.max(1, parseInt(String(page), 10) || 1);
    const offset = (currentPage - 1) * SNIPPETS_PAGE_SIZE;

    const { snippets, total } = await getSnippetsByUserId(user.id, SNIPPETS_PAGE_SIZE, offset);
    const totalPages = Math.ceil(total / SNIPPETS_PAGE_SIZE) || 1;

    const { snippets: sidebarSnippets } = await getSnippetsByUserId(user.id, 200, 0);

    return (
        <DashboardLayout snippets={sidebarSnippets} user={user}>
            <div className="w-full">
                <header className="lg:hidden mb-6 flex justify-between items-center">
                    <h1 className="text-xl font-semibold">My Snippets</h1>
                </header>

                <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <p className="text-sm sm:text-base">
                        {total === 0
                            ? "You don't have any snippets yet"
                            : `${total} ${total === 1 ? "snippet" : "snippets"}`}
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
                    <SnippetsList
                        snippets={snippets}
                        currentPage={currentPage}
                        totalPages={totalPages}
                        total={total}
                    />
                )}
            </div>
        </DashboardLayout>
    );
}
