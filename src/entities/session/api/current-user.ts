import "server-only";
import { cache } from "react";
import { getSupabaseServerClient } from "@/shared/api/supabase/server";

/**
 * Resolves the currently authenticated identity, if any, as verified JWT
 * claims. This is an identity lookup only — it says who is signed in, not
 * what they are allowed to do. See `require-user.ts` for the enforcement
 * helper built on top of this, and `require-admin-access.ts` for why
 * authorization is not implemented yet.
 *
 * Uses `supabase.auth.getClaims()`, per current Supabase SSR guidance for
 * protecting pages — never `getSession()`, whose embedded user object is
 * not re-validated and must not be trusted for authorization. `getClaims()`
 * cryptographically verifies the JWT signature (locally, against the
 * cached JWKS, for the common asymmetric-key case) before returning its
 * claims, so — unlike a raw session/cookie read — it cannot be satisfied
 * by a merely-present, unverified cookie. `getUser()` remains available
 * for call sites that genuinely need a fresh user record from the Auth
 * server (a network call every time); this route-protection check does
 * not, so it doesn't use it merely because older examples did.
 *
 * Throws if Supabase isn't configured (see `getPublicEnv()`). Callers
 * that need a soft "not signed in" result even when Supabase is
 * unconfigured (e.g. `requireUser()`) must catch that themselves —
 * this function does not paper over the distinction.
 */
export const getCurrentUser = cache(async function getCurrentUser() {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data) {
    return null;
  }

  return data.claims;
});
