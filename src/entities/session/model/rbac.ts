export const ADMIN_ROLES = ["owner", "admin", "support", "viewer"] as const;

export type Role = (typeof ADMIN_ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  owner: "Owner",
  admin: "Admin",
  support: "Support",
  viewer: "Viewer",
};

export interface AdminContext {
  userId: string;
  email: string | null;
  role: Role;
}

export type AuthorizationResult =
  | { authorized: true; context: AdminContext }
  | {
      authorized: false;
      reason: "unauthenticated" | "not_authorized" | "authorization_unavailable";
    };

export function isAdminRole(value: unknown): value is Role {
  return typeof value === "string" && ADMIN_ROLES.some((role) => role === value);
}

/** Operational mutations are never available to the read-only viewer role. */
export function canOperateLicenses(role: Role): boolean {
  return role === "owner" || role === "admin" || role === "support";
}

/** Commercial records are writable only by an Owner or Admin. */
export function canManageCommercialRecords(role: Role): boolean {
  return role === "owner" || role === "admin";
}
