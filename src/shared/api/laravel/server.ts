import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import { resolveDataProvider } from "@/shared/config/backend";
import { BackendSignInError } from "./auth-error";

const TOKEN_COOKIE = "elmotech_backend_session";
export const usesLaravel = () => resolveDataProvider(process.env.DATA_PROVIDER) === "laravel";

export async function backendRequest(path: string, init: RequestInit = {}) {
  usesLaravel();
  const configured = process.env.LARAVEL_API_URL;
  if (!configured) throw new Error("LARAVEL_API_URL is required for Laravel mode.");
  const url = new URL(configured);
  if (url.protocol !== "https:" && !(url.protocol === "http:" && ["127.0.0.1", "localhost"].includes(url.hostname))) {
    throw new Error("Laravel API requires HTTPS outside localhost.");
  }
  if (["supabase.co", "supabase.com", "supabase.in"].some(domain => url.hostname === domain || url.hostname.endsWith(`.${domain}`))) {
    throw new Error("Supabase connections are disabled. LARAVEL_API_URL must point to Laravel.");
  }
  const token = (await cookies()).get(TOKEN_COOKIE)?.value;
  const headers = new Headers(init.headers);
  headers.set("accept", "application/json");
  if (token) headers.set("authorization", `Bearer ${token}`);
  return fetch(`${configured.replace(/\/$/, "")}/${path}`, { ...init, headers, cache: "no-store", redirect: "error", signal: AbortSignal.timeout(15000) });
}

export interface BackendIdentity { id: string; email: string; role: string; is_active: boolean }
export const backendIdentity = cache(async (): Promise<BackendIdentity | null> => {
  usesLaravel();
  if (!(await cookies()).has(TOKEN_COOKIE)) return null;
  const response = await backendRequest("auth/me");
  if (response.status === 401 || response.status === 403) return null;
  if (!response.ok) throw new Error("Backend identity unavailable.");
  const payload = await response.json() as { user: BackendIdentity };
  return payload.user;
});

export async function backendSignIn(email: string, password: string): Promise<boolean> {
  if (!process.env.LARAVEL_API_URL) throw new Error("LARAVEL_API_URL is required for Laravel mode.");
  let response: Response;
  try {
    response = await backendRequest("auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, password }) });
  } catch {
    throw new BackendSignInError("backend_unavailable");
  }
  if (response.status === 422) {
    const rejected = await response.json().catch(() => null) as { errors?: { email?: unknown; password?: unknown } } | null;
    const fieldErrors = [rejected?.errors?.email, rejected?.errors?.password];
    if (fieldErrors.some(value => Array.isArray(value) && value.length > 0 && value.every(item => typeof item === "string"))) return false;
    throw new BackendSignInError("backend_unavailable", 422);
  }
  if (response.status === 429) throw new BackendSignInError("rate_limited", 429);
  if (!response.ok) throw new BackendSignInError("backend_unavailable", response.status);
  let data: { token?: unknown };
  try {
    data = await response.json();
  } catch {
    throw new BackendSignInError("backend_unavailable", response.status);
  }
  if (typeof data?.token !== "string" || !data.token) throw new BackendSignInError("backend_unavailable", response.status);
  (await cookies()).set(TOKEN_COOKIE, data.token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 8 * 60 * 60 });
  return true;
}

export async function backendSignOut() {
  const response = await backendRequest("auth/logout", { method: "POST" });
  if (!response.ok && response.status !== 401) throw new Error("Backend logout unavailable.");
  (await cookies()).delete(TOKEN_COOKIE);
}
