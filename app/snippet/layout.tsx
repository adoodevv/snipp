import { createClient } from "@/utils/supabase/server";
import { getSnippetsByUserId } from "@/lib/db";
import { DashboardLayout } from "@/components/dashboard-layout";

export default async function SnippetLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const sidebarSnippets = user?.id
        ? (await getSnippetsByUserId(user.id, 200, 0)).snippets
        : [];

    return (
        <DashboardLayout snippets={sidebarSnippets} user={user}>
            {children}
        </DashboardLayout>
    );
}
