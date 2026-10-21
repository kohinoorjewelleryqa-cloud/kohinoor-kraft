import "server-only";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseConfigured = Boolean(url && anon && !url.includes("YOUR-PROJECT"));

/** Read-only public client (respects Row Level Security). */
export function publicClient() {
  return createClient(url!, anon!, { auth: { persistSession: false } });
}

/** Full-access client for trusted server code only (placing orders, verifying admins). */
export function serviceClient() {
  if (!service) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  return createClient(url!, service, { auth: { persistSession: false } });
}
