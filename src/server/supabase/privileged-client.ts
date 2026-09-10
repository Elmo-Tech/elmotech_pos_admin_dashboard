import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getRequiredStagingSupabaseUrl } from "@/server/env";
import type { Database } from "@/types/database";

/**
 * Creates a stateless, server-only client scoped to the private licensing
 * schema. Callers must establish verified identity and admin authorization
 * before using it for any domain-data query. No session is persisted and no
 * cookie storage is configured, so the secret cannot enter browser state.
 */
export function getPrivilegedLicensingClient() {
  const supabaseUrl = getRequiredStagingSupabaseUrl();
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!secretKey) {
    throw new Error(
      "Missing server-only Supabase configuration. Set SUPABASE_SECRET_KEY in .env.local.",
    );
  }

  return createClient<Database, "licensing">(supabaseUrl, secretKey, {
    db: { schema: "licensing" },
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}
