import "server-only";
import { backendIdentity } from "@/shared/api/laravel/server";
import { cache } from "react";

/** Identity is revalidated by Laravel; the cookie alone is never trusted. */
export const getCurrentUser = cache(async function getCurrentUser() {
  const user = await backendIdentity();
  return user ? { sub: user.id, email: user.email } : null;
});
