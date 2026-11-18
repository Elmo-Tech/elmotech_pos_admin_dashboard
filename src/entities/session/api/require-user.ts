import "server-only";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getCurrentUser } from "./current-user";
import { sanitizeRedirectTarget } from "@/shared/lib/redirect-target";

/**
 * Server-side gate for the dashboard route group. Call this from a Server
 * Component (the `(dashboard)` layout) — never rely on a Client Component
 * redirect for this, and never treat a cookie's mere presence as proof of
 * identity (see `getCurrentUser()`).
 *
 * If Supabase itself isn't configured, that's treated the same as "not
 * signed in": redirected to /login, which explains the configuration gap
 * rather than the dashboard crashing.
 *
 * Preserves the originally requested path as `?next=` so a signed-in user
 * lands where they meant to go, via `src/proxy.ts` forwarding the request
 * pathname in an `x-pathname` header (proxy does not itself decide
 * whether to redirect — this is the only enforcement point).
 */
export async function requireUser() {
  let user;
  try {
    user = await getCurrentUser();
  } catch {
    user = null;
  }

  if (user) return user;

  const headerList = await headers();
  const intendedPath = headerList.get("x-pathname");
  const next = sanitizeRedirectTarget(intendedPath);

  redirect(next === "/dashboard" ? "/login" : `/login?next=${encodeURIComponent(next)}`);
}
