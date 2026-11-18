"use server";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/shared/api/supabase/server";

export async function signOutAction(): Promise<void> {
  const supabase = await getSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
