import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getConversationWithMessages, appendMessagesToConversation, replaceMessagesInConversation } from "@/lib/db";

export async function POST(
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
        const { messages } = body as { messages: Array<{ role: string; content: string }> };

        if (!Array.isArray(messages) || messages.length === 0) {
            return NextResponse.json({ error: "Messages array is required" }, { status: 400 });
        }

        const ok = await appendMessagesToConversation(id, messages);
        if (!ok) {
            return NextResponse.json({ error: "Failed to append messages" }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Append messages error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to append messages" },
            { status: 500 }
        );
    }
}

export async function PUT(
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
        const { messages = [] } = body as { messages?: Array<{ role: string; content: string }> };

        if (!Array.isArray(messages)) {
            return NextResponse.json({ error: "Messages must be an array" }, { status: 400 });
        }

        const ok = await replaceMessagesInConversation(id, messages);
        if (!ok) {
            return NextResponse.json({ error: "Failed to replace messages" }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Replace messages error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to replace messages" },
            { status: 500 }
        );
    }
}
