import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { NextResponse } from "next/server";
import { rateLimitSave } from "@/lib/rate-limit";

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { allowed, retryAfter } = rateLimitSave(request);
    if (!allowed) {
        return NextResponse.json(
            { error: "Too many save requests. Please try again later." },
            { status: 429, headers: { "Retry-After": String(retryAfter ?? 60) } }
        );
    }

    const { id } = await params;

    const url = new URL(request.url);
    const token = url.searchParams.get("token");

    const body = await request.json().catch(() => ({}));
    const code = typeof body.code === "string" ? body.code.trim() : null;

    if (!code) {
        return NextResponse.json({ error: "Code is required" }, { status: 400 });
    }

    const supabase = await createClient();

    // Use admin client for DB ops - bypasses RLS after we validate access (supports collaborators with token)
    let admin;
    try {
        admin = createAdminClient();
    } catch {
        return NextResponse.json(
            { error: "Server misconfigured: SUPABASE_SERVICE_ROLE_KEY required" },
            { status: 500 }
        );
    }

    const { data: snippet } = await admin
        .from("snippets")
        .select("id, user_id, collab_token")
        .eq("id", id)
        .single();

    if (!snippet) {
        return NextResponse.json({ error: "Snippet not found" }, { status: 404 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    const isOwner = user?.id === snippet.user_id;
    const hasTokenAccess = token && snippet.collab_token === token;

    if (!isOwner && !hasTokenAccess) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { data: maxVersion } = await admin
        .from("snippet_versions")
        .select("version")
        .eq("snippet_id", id)
        .order("version", { ascending: false })
        .limit(1)
        .single();

    const nextVersion = (maxVersion?.version ?? 0) + 1;

    const { error: versionError } = await admin
        .from("snippet_versions")
        .insert({
            snippet_id: id,
            version: nextVersion,
            code,
            change_description: "Collaborative edit",
        });

    if (versionError) {
        return NextResponse.json({ error: versionError.message }, { status: 500 });
    }

    await admin
        .from("snippets")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", id);

    return NextResponse.json({ success: true });
}
