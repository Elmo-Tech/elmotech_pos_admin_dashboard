import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import { resolveDataProvider } from "@/shared/config/backend";

const TOKEN_COOKIE = "elmotech_backend_session";
export const usesLaravel = () => resolveDataProvider(process.env.DATA_PROVIDER) === "laravel";

export async function backendRequest(path: string, init: RequestInit = {}) {
  const configured = process.env.LARAVEL_API_URL;
  if (!configured) throw new Error("LARAVEL_API_URL is required for Laravel mode.");
  const url = new URL(configured);
  if (url.protocol !== "https:" && !(url.protocol === "http:" && ["127.0.0.1", "localhost"].includes(url.hostname))) {
    throw new Error("Laravel API requires HTTPS outside localhost.");
  }
  const token = (await cookies()).get(TOKEN_COOKIE)?.value;
  const headers = new Headers(init.headers);
  headers.set("accept", "application/json");
  if (token) headers.set("authorization", `Bearer ${token}`);
  return fetch(`${configured.replace(/\/$/, "")}/${path}`, { ...init, headers, cache: "no-store", signal: AbortSignal.timeout(15000) });
}

export interface BackendIdentity { id: string; email: string; role: string; is_active: boolean }
export const backendIdentity = cache(async (): Promise<BackendIdentity | null> => {
  if (!(await cookies()).has(TOKEN_COOKIE)) return null;
  const response = await backendRequest("auth/me");
  if (response.status === 401 || response.status === 403) return null;
  if (!response.ok) throw new Error("Backend identity unavailable.");
  const payload = await response.json() as { user: BackendIdentity };
  return payload.user;
});

export async function backendSignIn(email: string, password: string): Promise<boolean> {
  const response = await backendRequest("auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, password }) });
  if (!response.ok) return false;
  const data = await response.json() as { token: string };
  if (typeof data.token !== "string" || !data.token) throw new Error("Invalid login response.");
  (await cookies()).set(TOKEN_COOKIE, data.token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 8 * 60 * 60 });
  return true;
}

export async function backendSignOut() {
  const response = await backendRequest("auth/logout", { method: "POST" });
  if (!response.ok && response.status !== 401) throw new Error("Backend logout unavailable.");
  (await cookies()).delete(TOKEN_COOKIE);
}
