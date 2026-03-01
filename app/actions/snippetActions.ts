"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function createSnippet(formData: FormData): Promise<
    { success: true; snippetId: string } | { success: false; error: string }
> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: "You must be signed in to create a snippet" };
    }

    const title = formData.get("title") as string;
    const language = formData.get("language") as string;
    const code = formData.get("code") as string;
    const isPublic = formData.get("isPublic") === "on" ? 1 : 0;
    const tagsRaw = formData.get("tags") as string | null;
    const folderId = formData.get("folderId") as string | null;
    const newFolderName = formData.get("newFolderName") as string | null;

    const tags = tagsRaw
        ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean)
        : [];
    let folderIdOrNull = folderId?.trim() || null;
    if (!folderIdOrNull && newFolderName?.trim()) {
        const { data: folder } = await supabase
            .from("snippet_folders")
            .insert({ user_id: user.id, name: newFolderName.trim() })
            .select("id")
            .single();
        if (folder) folderIdOrNull = folder.id;
    }

    if (!title?.trim()) return { success: false, error: "Title is required" };
    if (!code?.trim()) return { success: false, error: "Code is required" };

    const { data: snippet, error: snippetError } = await supabase
        .from("snippets")
        .insert({
            user_id: user.id,
            title: title.trim(),
            language: language || null,
            is_public: isPublic,
            tags: tags.length ? tags : null,
            folder_id: folderIdOrNull,
        })
        .select("id")
        .single();

    if (snippetError || !snippet) {
        console.error("createSnippet error:", snippetError);
        return { success: false, error: snippetError?.message ?? "Failed to create snippet" };
    }

    const { error: versionError } = await supabase
        .from("snippet_versions")
        .insert({
            snippet_id: snippet.id,
            version: 1,
            code: code.trim(),
        });

    if (versionError) {
        await supabase.from("snippets").delete().eq("id", snippet.id);
        return { success: false, error: versionError.message };
    }

    revalidatePath("/");
    revalidatePath("/new");
    return { success: true, snippetId: snippet.id };
}

export async function updateSnippetAction(formData: FormData): Promise<
    { success: true } | { success: false; error: string }
> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: "You must be signed in to update a snippet" };
    }

    const snippetId = formData.get("snippetId") as string;
    const title = formData.get("title") as string;
    const language = formData.get("language") as string;
    const code = formData.get("code") as string;
    const changeDescription = formData.get("changeDescription") as string | null;
    const isPublic = formData.get("isPublic") === "on" ? 1 : 0;
    const tagsRaw = formData.get("tags") as string | null;
    const folderId = formData.get("folderId") as string | null;

    const tags = tagsRaw
        ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean)
        : [];
    const folderIdOrNull = folderId?.trim() || null;

    if (!snippetId) return { success: false, error: "Snippet ID is required" };
    if (!title?.trim()) return { success: false, error: "Title is required" };
    if (!code?.trim()) return { success: false, error: "Code is required" };

    const { data: existing } = await supabase
        .from("snippets")
        .select("user_id")
        .eq("id", snippetId)
        .single();

    if (!existing || existing.user_id !== user.id) {
        return { success: false, error: "Snippet not found or access denied" };
    }

    const { data: maxVersion } = await supabase
        .from("snippet_versions")
        .select("version")
        .eq("snippet_id", snippetId)
        .order("version", { ascending: false })
        .limit(1)
        .single();

    const nextVersion = (maxVersion?.version ?? 0) + 1;

    const { error: versionError } = await supabase
        .from("snippet_versions")
        .insert({
            snippet_id: snippetId,
            version: nextVersion,
            code: code.trim(),
            change_description: changeDescription?.trim() || null,
        });

    if (versionError) {
        return { success: false, error: versionError.message };
    }

    const { error: updateError } = await supabase
        .from("snippets")
        .update({
            title: title.trim(),
            language: language || null,
            is_public: isPublic,
            tags: tags.length ? tags : null,
            folder_id: folderIdOrNull,
            updated_at: new Date().toISOString(),
        })
        .eq("id", snippetId);

    if (updateError) {
        return { success: false, error: updateError.message };
    }

    revalidatePath("/");
    revalidatePath(`/snippet/${snippetId}`);
    revalidatePath(`/snippet/${snippetId}/edit`);
    return { success: true };
}
