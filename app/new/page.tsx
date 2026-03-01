import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getSnippetsByUserId, getFoldersByUserId } from "@/lib/db";
import { createSnippet } from "@/app/actions/snippetActions";
import { DashboardLayout } from "@/components/dashboard-layout";
import { NewSnippetForm } from "@/components/new-snippet-form";

interface NewSnippetPageProps {
    searchParams: Promise<{ error?: string; created?: string }>;
}

export default async function NewSnippetPage({ searchParams }: NewSnippetPageProps) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/auth/login");
    }

    const params = await searchParams;
    const error = params.error;
    const created = params.created;

    const [{ snippets }, folders] = await Promise.all([
        getSnippetsByUserId(user.id, 200, 0),
        getFoldersByUserId(user.id),
    ]);

    async function handleSubmit(formData: FormData) {
        "use server";
        const result = await createSnippet(formData);
        if (result.success) {
            redirect(`/snippet/${result.snippetId}`);
        } else {
            redirect("/new?error=" + encodeURIComponent(result.error || "Failed to create snippet"));
        }
    }

    return (
        <DashboardLayout snippets={snippets} user={user}>
            <div className="w-full">
                <div className="mb-6 sm:mb-8">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight mb-2">
                        Create New Snippet
                    </h1>
                    <p className="text-sm sm:text-base" style={{ color: "#666666" }}>
                        Share your code snippets with the community or keep them private.
                    </p>
                </div>

                <NewSnippetForm
                    folders={folders}
                    submitAction={handleSubmit}
                    error={error}
                    created={created}
                />
            </div>
        </DashboardLayout>
    );
}
