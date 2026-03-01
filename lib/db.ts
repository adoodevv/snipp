import { createClient } from "@/utils/supabase/server";
import type { SnippetWithLatestVersion, SnippetWithVersions, AiConversation, AiConversationWithMessages, SnippetFolder } from "@/types/database";

export async function getFoldersByUserId(userId: string): Promise<SnippetFolder[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("snippet_folders")
        .select("id, user_id, name, created_at")
        .eq("user_id", userId)
        .order("name", { ascending: true });
    if (error) {
        console.error("getFoldersByUserId error:", error);
        return [];
    }
    return (data || []) as SnippetFolder[];
}

export async function getPublicSnippets(limit = 24, offset = 0): Promise<{ snippets: SnippetWithLatestVersion[]; total: number }> {
    const supabase = await createClient();

    const { count, error: countError } = await supabase
        .from("snippets")
        .select("*", { count: "exact", head: true })
        .eq("is_public", 1);

    if (countError) {
        console.error("getPublicSnippets count error:", countError);
        return { snippets: [], total: 0 };
    }

    const { data: snippets, error } = await supabase
        .from("snippets")
        .select(`
            id,
            user_id,
            title,
            language,
            is_public,
            collab_token,
            tags,
            folder_id,
            created_at,
            updated_at
        `)
        .eq("is_public", 1)
        .order("updated_at", { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) {
        console.error("getPublicSnippets error:", error);
        return { snippets: [], total: count ?? 0 };
    }

    const snippetList = snippets || [];
    if (snippetList.length === 0) return { snippets: [], total: count ?? 0 };

    const snippetIds = snippetList.map((s) => s.id);
    const { data: versions } = await supabase
        .from("snippet_versions")
        .select("snippet_id, version, code")
        .in("snippet_id", snippetIds)
        .order("version", { ascending: false });

    const latestBySnippet = new Map<string, { version: number; code: string }>();
    for (const v of versions || []) {
        if (!latestBySnippet.has(v.snippet_id)) {
            latestBySnippet.set(v.snippet_id, { version: v.version, code: v.code ?? "" });
        }
    }

    const result = snippetList.map((s) => {
        const latest = latestBySnippet.get(s.id);
        return {
            ...s,
            latest_code: latest?.code ?? "",
            latest_version: latest?.version ?? 0,
        };
    });

    return { snippets: result, total: count ?? 0 };
}

export const SNIPPETS_PAGE_SIZE = 12;

export async function getSnippetsByUserId(userId: string, limit = SNIPPETS_PAGE_SIZE, offset = 0): Promise<{ snippets: SnippetWithLatestVersion[]; total: number }> {
    const supabase = await createClient();

    const { count, error: countError } = await supabase
        .from("snippets")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);

    if (countError) {
        console.error("getSnippetsByUserId count error:", countError);
        return { snippets: [], total: 0 };
    }

    const { data: snippets, error } = await supabase
        .from("snippets")
        .select(`
            id,
            user_id,
            title,
            language,
            is_public,
            collab_token,
            tags,
            folder_id,
            created_at,
            updated_at
        `)
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) {
        console.error("getSnippetsByUserId error:", error);
        return { snippets: [], total: count ?? 0 };
    }

    const snippetList = snippets || [];
    if (snippetList.length === 0) return { snippets: [], total: count ?? 0 };

    const snippetIds = snippetList.map((s) => s.id);
    const { data: versions } = await supabase
        .from("snippet_versions")
        .select("snippet_id, version, code")
        .in("snippet_id", snippetIds)
        .order("version", { ascending: false });

    const latestBySnippet = new Map<string, { version: number; code: string }>();
    for (const v of versions || []) {
        if (!latestBySnippet.has(v.snippet_id)) {
            latestBySnippet.set(v.snippet_id, { version: v.version, code: v.code ?? "" });
        }
    }

    const result = snippetList.map((s) => {
        const latest = latestBySnippet.get(s.id);
        return {
            ...s,
            latest_code: latest?.code ?? "",
            latest_version: latest?.version ?? 0,
        };
    });

    return { snippets: result, total: count ?? 0 };
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

export async function getConversationsByUserId(userId: string): Promise<AiConversation[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("ai_conversations")
        .select("id, user_id, title, created_at, updated_at")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false });

    if (error) {
        console.error("getConversationsByUserId error:", error);
        return [];
    }

    return (data || []) as AiConversation[];
}

export async function getConversationWithMessages(id: string): Promise<AiConversationWithMessages | null> {
    const supabase = await createClient();

    const { data: conv, error: convError } = await supabase
        .from("ai_conversations")
        .select("id, user_id, title, created_at, updated_at")
        .eq("id", id)
        .single();

    if (convError || !conv) return null;

    const { data: messages } = await supabase
        .from("ai_messages")
        .select("id, conversation_id, role, content, created_at")
        .eq("conversation_id", id)
        .order("created_at", { ascending: true });

    return {
        ...conv,
        messages: (messages || []).map((m) => ({
            id: m.id,
            conversation_id: m.conversation_id,
            role: m.role as 'user' | 'model',
            content: m.content,
            created_at: m.created_at,
        })),
    } as AiConversationWithMessages;
}

export async function createConversation(userId: string, title: string, messages: { role: string; content: string }[]): Promise<AiConversation | null> {
    const supabase = await createClient();

    const { data: conv, error: convError } = await supabase
        .from("ai_conversations")
        .insert({ user_id: userId, title })
        .select("id, user_id, title, created_at, updated_at")
        .single();

    if (convError || !conv) return null;

    if (messages.length > 0) {
        await supabase.from("ai_messages").insert(
            messages.map((m) => ({
                conversation_id: conv.id,
                role: m.role,
                content: m.content,
            }))
        );
    }

    return conv as AiConversation;
}

export async function appendMessagesToConversation(conversationId: string, messages: { role: string; content: string }[]): Promise<boolean> {
    const supabase = await createClient();

    const { error } = await supabase.from("ai_messages").insert(
        messages.map((m) => ({
            conversation_id: conversationId,
            role: m.role,
            content: m.content,
        }))
    );

    if (error) return false;

    await supabase
        .from("ai_conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", conversationId);

    return true;
}

export async function updateConversationTitle(id: string, title: string): Promise<boolean> {
    const supabase = await createClient();

    const { error } = await supabase
        .from("ai_conversations")
        .update({ title, updated_at: new Date().toISOString() })
        .eq("id", id);

    return !error;
}

export async function replaceMessagesInConversation(conversationId: string, messages: { role: string; content: string }[]): Promise<boolean> {
    const supabase = await createClient();

    const { error: deleteError } = await supabase
        .from("ai_messages")
        .delete()
        .eq("conversation_id", conversationId);

    if (deleteError) return false;

    if (messages.length > 0) {
        const { error: insertError } = await supabase.from("ai_messages").insert(
            messages.map((m) => ({
                conversation_id: conversationId,
                role: m.role,
                content: m.content,
            }))
        );
        if (insertError) return false;
    }

    await supabase
        .from("ai_conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", conversationId);

    return true;
}

export async function deleteConversation(id: string): Promise<boolean> {
    const supabase = await createClient();

    const { error } = await supabase.from("ai_conversations").delete().eq("id", id);

    return !error;
}
