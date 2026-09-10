"use server";

import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/server/supabase/server";
import { sanitizeRedirectTarget } from "@/lib/redirect-target";

export interface SignInState {
  error: "missing_credentials" | "not_configured" | "invalid_credentials" | null;
}

/**
 * Signs a staff member in with email/password via the server Supabase
 * client, so the resulting session cookie is set before any redirect —
 * no client-side sign-in-then-hope-the-cookie-arrives race. Intentionally
 * does not support sign-up, social login, or password reset in this
 * slice; there is no public "create account" path.
 */
export async function signInAction(_prevState: SignInState, formData: FormData): Promise<SignInState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = sanitizeRedirectTarget(String(formData.get("next") ?? ""));

  if (!email || !password) {
    return { error: "missing_credentials" };
  }

  let supabase;
  try {
    supabase = await getSupabaseServerClient();
  } catch {
    return { error: "not_configured" };
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "invalid_credentials" };
  }

  redirect(next);
}

/** Signs the current session out and returns to /login. */
export async function signOutAction(): Promise<void> {
  const supabase = await getSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
