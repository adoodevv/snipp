import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Admin client with service role - bypasses RLS.
 * Use only for trusted server operations (e.g. save by collaborator with valid token).
 */
export const createAdminClient = () => {
    if (!supabaseUrl || !serviceRoleKey) {
        throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY for admin operations");
    }
    return createClient(supabaseUrl, serviceRoleKey);
};
