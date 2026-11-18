import "server-only";
import { backendIdentity } from "@/shared/api/laravel/server";
import { cache } from "react";
import { isAdminRole, type AuthorizationResult } from "../model/rbac";

/** Laravel verifies the token, current active status and role on every request. */
export const requireAdminAccess = cache(
  async function requireAdminAccess(): Promise<AuthorizationResult> {
    try {
      const user = await backendIdentity();
      if (!user) return { authorized: false, reason: "unauthenticated" };
      if (!user.is_active || !isAdminRole(user.role)) {
        return { authorized: false, reason: "not_authorized" };
      }
      return {
        authorized: true,
        context: { userId: user.id, email: user.email, role: user.role },
      };
    } catch {
      return { authorized: false, reason: "authorization_unavailable" };
    }
  },
);
