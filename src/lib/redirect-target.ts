const DEFAULT_REDIRECT_TARGET = "/dashboard";

/**
 * Narrows an arbitrary string (typically a `next` query param or a
 * proxy-forwarded pathname) down to a same-origin application path, or
 * falls back to a safe default. Rejects anything that could act as an
 * open redirect (protocol-relative `//host`, absolute `scheme://host`
 * URLs) and anything pointing back at `/login` itself, which would
 * otherwise create a post-login redirect loop.
 */
export function sanitizeRedirectTarget(
  path: string | null | undefined,
  fallback: string = DEFAULT_REDIRECT_TARGET,
): string {
  if (!path) return fallback;
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("://")) return fallback;
  if (path === "/login" || path.startsWith("/login?") || path.startsWith("/login/")) return fallback;
  return path;
}
