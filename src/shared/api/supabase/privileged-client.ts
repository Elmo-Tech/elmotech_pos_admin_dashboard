import "server-only";
import { getLaravelLicensingClient } from "@/shared/api/laravel/licensing-client";

/** @deprecated Compatibility name only. This always returns the Laravel transport. */
export function getPrivilegedLicensingClient() {
  return getLaravelLicensingClient();
}
