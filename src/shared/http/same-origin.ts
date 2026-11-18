import "server-only";

export function hasValidSameOrigin(request: Request): boolean {
  const origin = parseHttpOrigin(request.headers.get("origin"));
  if (!origin) return false;

  const requestUrl = new URL(request.url);
  if (origin === requestUrl.origin) return true;

  // Behind a reverse proxy, Next.js can receive an internal request URL such
  // as http://127.0.0.1:3000 while the browser correctly sends the public
  // HTTPS Origin. Validate that public host as well, preferring the standard
  // forwarded host and falling back to Host. The browser controls Origin but
  // not Host, so a request from another site still fails this comparison.
  const publicHost = firstHeaderValue(request.headers.get("x-forwarded-host"))
    ?? firstHeaderValue(request.headers.get("host"));
  if (!publicHost) return false;

  return parseHttpOrigin(`${new URL(origin).protocol}//${publicHost}`) === origin;
}

function firstHeaderValue(value: string | null): string | null {
  const first = value?.split(",", 1)[0]?.trim();
  return first || null;
}

function parseHttpOrigin(value: string | null): string | null {
  if (!value) return null;

  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (url.username || url.password || url.pathname !== "/" || url.search || url.hash) return null;
    return url.origin;
  } catch {
    return null;
  }
}
