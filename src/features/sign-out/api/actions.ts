"use server";
import { usesLaravel, backendSignOut } from "@/shared/api/laravel/server";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/shared/api/supabase/server";

export async function signOutAction(): Promise<void> {
  if (usesLaravel()) { await backendSignOut(); redirect("/login"); }
  const supabase = await getSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
