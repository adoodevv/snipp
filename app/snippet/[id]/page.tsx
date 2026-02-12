import { redirect, notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import {
    getSnippetWithVersions,
    getSnippetsByUserId,
    ensureCollabToken,
    validateCollabToken,
} from "@/lib/db";
import { DashboardLayout } from "@/components/dashboard-layout";
import { SnippetContent } from "@/components/snippet-content";

interface SnippetPageProps {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ token?: string }>;
}

export default async function SnippetPage({ params, searchParams }: SnippetPageProps) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { id } = await params;
    const { token } = await searchParams;

    const snippet = await getSnippetWithVersions(id);
    if (!snippet) {
        notFound();
    }

    const isOwner = user?.id === snippet.user_id;
    if (!isOwner && snippet.is_public === 0) {
        redirect("/");
    }

    const latestVersion = snippet.versions[0];
    if (!latestVersion) {
        notFound();
    }

    let hasEditAccess = false;
    let collabToken = "";

    if (snippet.is_public === 1) {
        collabToken = await ensureCollabToken(id);
        if (token) {
            hasEditAccess = await validateCollabToken(id, token);
        }
    }

    const snippets = user?.id ? await getSnippetsByUserId(user.id) : [];

    const userName =
        user?.user_metadata?.full_name ||
        user?.email ||
        "Anonymous";

    return (
        <DashboardLayout snippets={snippets} user={user}>
            <SnippetContent
                snippet={{ ...snippet, collab_token: collabToken }}
                isOwner={isOwner}
                hasEditAccess={hasEditAccess}
                collabToken={collabToken}
                userName={userName}
            />
        </DashboardLayout>
    );
}
