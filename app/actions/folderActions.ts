"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function createFolder(name: string): Promise<
    { success: true; folderId: string } | { success: false; error: string }
> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: "You must be signed in to create a folder" };
    }

    if (!name?.trim()) return { success: false, error: "Folder name is required" };

    const { data: folder, error } = await supabase
        .from("snippet_folders")
        .insert({ user_id: user.id, name: name.trim() })
        .select("id")
        .single();

    if (error || !folder) {
        return { success: false, error: error?.message ?? "Failed to create folder" };
    }

    revalidatePath("/");
    revalidatePath("/new");
    return { success: true, folderId: folder.id };
}
