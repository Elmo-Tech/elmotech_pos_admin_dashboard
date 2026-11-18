import { createBrowserClient } from "@supabase/ssr";
import { getPublicEnv } from "@/shared/config/public";

/**
 * Browser Supabase client. Scope: Supabase Auth operations from Client
 * Components (sign-in/out, session listeners) and other browser-safe
 * calls only. Holds the publishable (anon) key, which is safe to ship to
 * the browser — but `anon` has no access to the licensing schema at all
 * (RLS + FORCE RLS, no permissive policies), so this client is not a
 * licensing data path and must never become one. It must never be given
 * a secret/service-role key.
 */
export function getSupabaseBrowserClient() {
  const env = getPublicEnv();
  return createBrowserClient(env.supabaseUrl, env.supabasePublishableKey);
}
