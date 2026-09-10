import { cookies } from "next/headers";
import { isLocale, LOCALE_COOKIE } from "@/i18n/messages";

export async function POST(request: Request): Promise<Response> {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return Response.json({ error: "invalid_origin" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_request" }, { status: 400 });
  }

  const locale =
    body && typeof body === "object" && "locale" in body
      ? (body as { locale: unknown }).locale
      : null;
  if (!isLocale(locale)) {
    return Response.json({ error: "invalid_locale" }, { status: 400 });
  }

  (await cookies()).set(LOCALE_COOKIE, locale, {
    httpOnly: true,
    sameSite: "lax",
    secure: new URL(request.url).protocol === "https:",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  return Response.json({ ok: true }, { headers: { "cache-control": "no-store" } });
}
