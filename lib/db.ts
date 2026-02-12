import { createClient } from "@/utils/supabase/server";
import type { SnippetWithLatestVersion, SnippetWithVersions } from "@/types/database";

export async function getSnippetsByUserId(userId: string): Promise<SnippetWithLatestVersion[]> {
    const supabase = await createClient();

    const { data: snippets, error } = await supabase
        .from("snippets")
        .select(`
            id,
            user_id,
            title,
            language,
            is_public,
            collab_token,
            created_at,
            updated_at
        `)
        .eq("user_id", userId)
        .order("updated_at", { ascending: false });

    if (error) {
        console.error("getSnippetsByUserId error:", error);
        return [];
    }

    const result: SnippetWithLatestVersion[] = [];

    for (const s of snippets || []) {
        const { data: latest } = await supabase
            .from("snippet_versions")
            .select("version, code")
            .eq("snippet_id", s.id)
            .order("version", { ascending: false })
            .limit(1)
            .single();

        result.push({
            ...s,
            latest_code: latest?.code ?? "",
            latest_version: latest?.version ?? 0,
        });
    }

    return result;
}

export async function getSnippetWithVersions(id: string): Promise<SnippetWithVersions | null> {
    const supabase = await createClient();

    const { data: snippet, error } = await supabase
        .from("snippets")
        .select("*")
        .eq("id", id)
        .single();

    if (error || !snippet) return null;

    const { data: versions } = await supabase
        .from("snippet_versions")
        .select("*")
        .eq("snippet_id", id)
        .order("version", { ascending: false });

    return {
        ...snippet,
        versions: (versions || []).map((v) => ({
            id: v.id,
            version: v.version,
            code: v.code,
            change_description: v.change_description,
            created_at: v.created_at,
        })),
    };
}

export async function ensureCollabToken(snippetId: string): Promise<string> {
    const supabase = await createClient();

    const { data: snippet } = await supabase
        .from("snippets")
        .select("collab_token")
        .eq("id", snippetId)
        .single();

    if (snippet?.collab_token) return snippet.collab_token;

    const token = crypto.randomUUID();
    await supabase
        .from("snippets")
        .update({ collab_token: token })
        .eq("id", snippetId);

    return token;
}

export async function validateCollabToken(snippetId: string, token: string): Promise<boolean> {
    const supabase = await createClient();

    const { data } = await supabase
        .from("snippets")
        .select("collab_token")
        .eq("id", snippetId)
        .single();

    return data?.collab_token === token;
}
