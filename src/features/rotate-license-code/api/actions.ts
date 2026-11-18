"use server";
import { revalidatePath } from "next/cache";
import { getAuthorizedLicensingClient, requireAdminAccess } from "@/entities/session/server";
import { canManageCommercialRecords } from "@/entities/session";
import type { CommercialActionState } from "../model/types";
import { generateLicenseCode, sha256 } from "@/entities/license/server";

function stringValue(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function rpcRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

async function requireCommercialManager() {
  const access = await requireAdminAccess();
  if (!access.authorized || !canManageCommercialRecords(access.context.role)) {
    return null;
  }
  return access.context;
}

export async function rotateLicenseCodeAction(
  _previousState: CommercialActionState,
  formData: FormData,
): Promise<CommercialActionState> {
  const actor = await requireCommercialManager();
  if (!actor) return { status: "error", code: "forbidden" };

  const licenseId = stringValue(formData, "licenseId");
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(licenseId)) {
    return { status: "error", code: "invalidInput" };
  }

  try {
    const supabase = await getAuthorizedLicensingClient();
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const licenseCode = generateLicenseCode();
      const { data, error } = await supabase.rpc("rotate_unused_license_key_hash", {
        p_license_id: licenseId,
        p_new_license_key_hash: sha256(licenseCode),
        p_actor_user_id: actor.userId,
      });
      if (error) return { status: "error", code: "unavailable" };

      const response = rpcRecord(data);
      const outcome = typeof response?.outcome === "string" ? response.outcome : "unavailable";
      if (outcome === "licenseCodeConflict") continue;
      if (outcome !== "rotated") return { status: "error", code: outcome };

      revalidatePath(`/licenses/${licenseId}`);
      revalidatePath("/licenses");
      return { status: "success", code: "rotated", entityId: licenseId, licenseCode };
    }
    return { status: "error", code: "unavailable" };
  } catch {
    return { status: "error", code: "unavailable" };
  }
}
