import "server-only";
import { usesLaravel, backendIdentity } from "@/shared/api/laravel/server";
import { cache } from "react";
import { getCurrentUser } from "./current-user";
import { getPrivilegedLicensingClient } from "@/shared/api/supabase/privileged-client";
import { isAdminRole, type AuthorizationResult } from "../model/rbac";

/**
 * Verifies identity from signed JWT claims, then authorizes that exact user
 * against licensing.admin_users through the server-only privileged client.
 * Every lookup failure and every unrecognized database value fails closed.
 * React request memoization prevents duplicate lookups when both a layout and
 * its server-side data loader enforce the same boundary.
 */
export const requireAdminAccess = cache(
  async function requireAdminAccess(): Promise<AuthorizationResult> {
    if (usesLaravel()) {
      try {
        const user = await backendIdentity();
        if (!user) return { authorized: false, reason: "unauthenticated" };
        if (!user.is_active || !isAdminRole(user.role)) return { authorized: false, reason: "not_authorized" };
        return { authorized: true, context: { userId: user.id, email: user.email, role: user.role } };
      } catch { return { authorized: false, reason: "authorization_unavailable" }; }
    }
    let claims;
    try {
      claims = await getCurrentUser();
    } catch {
      return { authorized: false, reason: "unauthenticated" };
    }

    const userId = claims?.sub;
    if (!userId) {
      return { authorized: false, reason: "unauthenticated" };
    }

    try {
      const supabase = getPrivilegedLicensingClient();
      const { data, error } = await supabase
        .from("admin_users")
        .select("role,status")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        return { authorized: false, reason: "authorization_unavailable" };
      }

      if (!data || data.status !== "active" || !isAdminRole(data.role)) {
        return { authorized: false, reason: "not_authorized" };
      }

      return {
        authorized: true,
        context: {
          userId,
          email: typeof claims?.email === "string" ? claims.email : null,
          role: data.role,
        },
      };
    } catch {
      return { authorized: false, reason: "authorization_unavailable" };
    }
  },
);
