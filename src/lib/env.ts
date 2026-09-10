export interface PublicEnv {
  supabaseUrl: string;
  supabasePublishableKey: string;
}

/**
 * Browser-safe Supabase connection config. Throws with a clear message if
 * unset rather than silently connecting to nothing — call this only at the
 * point an actual Supabase client is created, never at module load time,
 * so pages that don't need Supabase yet keep working without env vars.
 *
 * Deliberately does not carry an "environment" field. Which Supabase
 * project this points at is exactly what it looks like from the browser's
 * side; which *environment* (staging/production) the app is authorized to
 * treat that as is a server-owned decision — see `src/server/env.ts` — so
 * there is exactly one trusted source for that, not two.
 */
export function getPublicEnv(): PublicEnv {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error(
      "Missing Supabase browser configuration. Set NEXT_PUBLIC_SUPABASE_URL and " +
        "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (see .env.example) and restart the dev server.",
    );
  }

  return { supabaseUrl, supabasePublishableKey };
}
