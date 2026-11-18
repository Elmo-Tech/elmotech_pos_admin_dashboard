"use server";
import { backendSignIn } from "@/shared/api/laravel/server";
import { redirect } from "next/navigation";
import { sanitizeRedirectTarget } from "@/shared/lib/redirect-target";
import type { SignInState } from "../model/types";

export async function signInAction(_prevState: SignInState, formData: FormData): Promise<SignInState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = sanitizeRedirectTarget(String(formData.get("next") ?? ""));

  if (!email || !password) {
    return { error: "missing_credentials" };
  }

  try {
    if (!await backendSignIn(email, password)) return { error: "invalid_credentials" };
  } catch {
    return { error: "not_configured" };
  }
  redirect(next);
}
