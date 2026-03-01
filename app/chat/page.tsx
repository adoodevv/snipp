import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getSnippetsByUserId } from "@/lib/db";
import { DashboardLayout } from "@/components/dashboard-layout";
import { ChatPanel } from "@/components/chat-panel";

export default async function ChatPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/auth/login");
    }

    const { snippets } = await getSnippetsByUserId(user.id, 200, 0);

    return (
        <DashboardLayout snippets={snippets} user={user}>
            <div className="w-full h-full flex flex-col min-h-0">
                <header className="lg:hidden mb-4">
                    <h1 className="text-xl font-semibold">AI Chat</h1>
                    <p className="text-sm text-gray-500">Search your snippets with AI</p>
                </header>
                <ChatPanel isFullView snippets={snippets} />
            </div>
        </DashboardLayout>
    );
}
