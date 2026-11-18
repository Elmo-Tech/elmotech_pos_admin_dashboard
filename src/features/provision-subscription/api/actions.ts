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

export async function provisionSubscriptionAction(
  _previousState: CommercialActionState,
  formData: FormData,
): Promise<CommercialActionState> {
  const actor = await requireCommercialManager();
  if (!actor) return { status: "error", code: "forbidden" };

  const customerId = stringValue(formData, "customerId");
  const planId = stringValue(formData, "planId");
  const startDate = stringValue(formData, "startDate");
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(customerId) ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(planId) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(startDate)
  ) {
    return { status: "error", code: "invalidInput" };
  }

  const startsAt = new Date(`${startDate}T00:00:00.000Z`);
  if (Number.isNaN(startsAt.getTime()) || startsAt.toISOString().slice(0, 10) !== startDate) {
    return { status: "error", code: "invalidInput" };
  }

  try {
    const supabase = await getAuthorizedLicensingClient();
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const licenseCode = generateLicenseCode();
      const { data, error } = await supabase.rpc("provision_initial_subscription", {
        p_customer_id: customerId,
        p_plan_id: planId,
        p_starts_at: startsAt.toISOString(),
        p_license_key_hash: sha256(licenseCode),
        p_actor_user_id: actor.userId,
      });
      if (error) return { status: "error", code: "unavailable" };

      const response = rpcRecord(data);
      const outcome = typeof response?.outcome === "string" ? response.outcome : "unavailable";
      if (outcome === "licenseCodeConflict") continue;
      if (outcome !== "provisioned") return { status: "error", code: outcome };

      revalidatePath(`/customers/${customerId}`);
      revalidatePath("/customers");
      revalidatePath("/subscriptions");
      revalidatePath("/dashboard");
      return {
        status: "success",
        code: "provisioned",
        entityId: typeof response?.subscriptionId === "string" ? response.subscriptionId : undefined,
        licenseCode,
      };
    }

    return { status: "error", code: "unavailable" };
  } catch {
    return { status: "error", code: "unavailable" };
  }
}
