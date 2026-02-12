import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getConversationsByUserId, createConversation } from "@/lib/db";

export async function GET() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const conversations = await getConversationsByUserId(user.id);
    return NextResponse.json(conversations);
}

export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { title, messages = [] } = body as { title: string; messages?: Array<{ role: string; content: string }> };

        if (!title?.trim()) {
            return NextResponse.json({ error: "Title is required" }, { status: 400 });
        }

        const conversation = await createConversation(user.id, title.trim(), messages);

        if (!conversation) {
            return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 });
        }

        return NextResponse.json(conversation);
    } catch (error) {
        console.error("Create conversation error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to create conversation" },
            { status: 500 }
        );
    }
}
