import "server-only";
import { requireAdminAccess } from "@/server/auth/require-admin-access";
import { getPrivilegedLicensingClient } from "@/server/supabase/privileged-client";

/** Every feature read starts here, preserving the authorization boundary. */
export async function getAuthorizedLicensingClient() {
  const access = await requireAdminAccess();
  if (!access.authorized) {
    throw new Error("Admin authorization is required for licensing data.");
  }
  return getPrivilegedLicensingClient();
}
