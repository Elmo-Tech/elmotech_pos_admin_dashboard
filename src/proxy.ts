import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getPublicEnv } from "@/lib/env";

/**
 * Network-boundary plumbing only — refreshes the Supabase session cookie
 * on every request, and forwards the requested pathname so a Server
 * Component can build a post-login redirect (see
 * `src/server/auth/require-user.ts`). It does not decide who is allowed
 * where: that authorization decision is made server-side in the
 * `(dashboard)` layout and in /login, from a cryptographically verified
 * `supabase.auth.getClaims()` call, not from anything this proxy computes.
 *
 * Calls `getClaims()` (current Supabase SSR guidance) rather than
 * `getUser()` purely to trigger the same on-demand session refresh —
 * `getClaims()` reads the session, refreshing it first if it's about to
 * expire, then verifies the JWT signature locally against the cached
 * JWKS (or via a server round-trip for symmetric-key projects). Its
 * result is discarded here; this call exists only for the refreshed
 * cookie side effect, propagated below via `setAll`.
 *
 * If Supabase isn't configured (no env vars set), this passes the
 * request through untouched rather than failing every request in this
 * phase.
 */
export async function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);

  let env;
  try {
    env = getPublicEnv();
  } catch {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  let response = NextResponse.next({ request: { headers: requestHeaders } });

  const supabase = createServerClient(env.supabaseUrl, env.supabasePublishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request: { headers: requestHeaders } });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  await supabase.auth.getClaims();

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
