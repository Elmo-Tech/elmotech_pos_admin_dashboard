import "server-only";
import { usesLaravel } from "@/shared/api/laravel/server";
import { getLaravelLicensingClient } from "@/shared/api/laravel/licensing-client";
import { createClient } from "@supabase/supabase-js";
import { getRequiredSupabaseUrl } from "@/shared/config/server";
import type { Database } from "@/shared/api/supabase/schema";

/**
 * Compatibility facade: Laravel is the default; the Supabase branch is deprecated.
 * Creates a stateless, server-only client scoped to the private licensing
 * schema. Callers must establish verified identity and admin authorization
 * before using it for any domain-data query. No session is persisted and no
 * cookie storage is configured, so the secret cannot enter browser state.
 */
export function getPrivilegedLicensingClient() {
  if (usesLaravel()) return getLaravelLicensingClient();
  const supabaseUrl = getRequiredSupabaseUrl();
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
