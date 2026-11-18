"use server";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/shared/api/supabase/server";
import { sanitizeRedirectTarget } from "@/shared/lib/redirect-target";
import type { SignInState } from "../model/types";

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
