import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { getPublicEnv } from "@/shared/config/public";

/**
 * Server-side Supabase client for Server Components, Server Actions, and
 * Route Handlers. Scope: session validation and Auth user identity via
 * cookie-based SSR. Still uses only the publishable (anon) key and is
 * subject to RLS — `anon`/`authenticated` have no access to the
 * licensing schema at all, so this is not a licensing data path either.
 * See `src/server/supabase/privileged-client.ts` for the separate
 * privileged licensing client. The `server-only` import above
 * enforces that this file can never be imported from a Client Component.
 */
export async function getSupabaseServerClient() {
  const cookieStore = await cookies();
  const env = getPublicEnv();

  return createServerClient(env.supabaseUrl, env.supabasePublishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Called from a Server Component with no ability to set cookies;
          // safe to ignore as long as middleware refreshes the session.
        }
      },
    },
  });
}
