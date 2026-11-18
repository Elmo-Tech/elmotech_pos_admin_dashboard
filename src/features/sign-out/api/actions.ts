"use server";
import { backendSignOut } from "@/shared/api/laravel/server";
import { redirect } from "next/navigation";

export async function signOutAction(): Promise<void> {
  await backendSignOut();
  redirect("/login");
}
