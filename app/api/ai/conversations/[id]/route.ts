import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getConversationWithMessages, updateConversationTitle, deleteConversation } from "@/lib/db";

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const conversation = await getConversationWithMessages(id);

    if (!conversation || conversation.user_id !== user.id) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(conversation);
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const conversation = await getConversationWithMessages(id);

    if (!conversation || conversation.user_id !== user.id) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    try {
        const body = await request.json();
        const { title } = body as { title?: string };

        if (!title?.trim()) {
            return NextResponse.json({ error: "Title is required" }, { status: 400 });
        }

        const ok = await updateConversationTitle(id, title.trim());
        if (!ok) {
            return NextResponse.json({ error: "Failed to update" }, { status: 500 });
        }

        return NextResponse.json({ ...conversation, title: title.trim() });
    } catch (error) {
        console.error("Update conversation error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to update" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const conversation = await getConversationWithMessages(id);

    if (!conversation || conversation.user_id !== user.id) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const ok = await deleteConversation(id);
    if (!ok) {
        return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
