import { NextRequest } from "next/server";
import { Liveblocks } from "@liveblocks/node";
import { createClient } from "@/utils/supabase/server";
import { validateCollabToken } from "@/lib/db";

const liveblocks = new Liveblocks({
    secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

const COLLAB_COLORS = [
    "#ef4444", "#f97316", "#eab308", "#22c55e",
    "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899"
];

function pickColor(key: string): string {
    let hash = 0;
    for (let i = 0; i < key.length; i++) hash = key.charCodeAt(i) + ((hash << 5) - hash);
    return COLLAB_COLORS[Math.abs(hash) % COLLAB_COLORS.length];
}

export async function POST(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const body = await request.json().catch(() => ({}));
    const room = typeof body.room === "string" ? body.room : null;
    const token = request.nextUrl.searchParams.get("token");

    if (!room) {
        return new Response(JSON.stringify({ error: "Room is required" }), {
            status: 400,
        });
    }

    const { data: snippet } = await supabase
        .from("snippets")
        .select("user_id, is_public")
        .eq("id", room)
        .single();

    if (!snippet || snippet.is_public !== 1) {
        return new Response(JSON.stringify({ error: "Room not found or not public" }), {
            status: 403,
        });
    }

    let userId: string;
    let userName: string;
    let hasWriteAccess = false;

    if (user) {
        userId = user.id;
        userName = user.user_metadata?.full_name || user.email || "Anonymous";
        hasWriteAccess = snippet.user_id === user.id;
    } else {
        userId = `guest-${crypto.randomUUID()}`;
        userName = "Anonymous";
    }

    if (!hasWriteAccess && token) {
        hasWriteAccess = await validateCollabToken(room, token);
    }

    const color = pickColor(userId);

    const session = liveblocks.prepareSession(userId, {
        userInfo: {
            name: userName,
            color,
        },
    });

    if (hasWriteAccess) {
        session.allow(room, session.FULL_ACCESS);
    } else {
        session.allow(room, session.READ_ACCESS);
    }

    const { body: responseBody, status } = await session.authorize();
    return new Response(responseBody, { status });
}
