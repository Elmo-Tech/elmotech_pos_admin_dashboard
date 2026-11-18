"use server";

import { revalidatePath } from "next/cache";
import { getAuthorizedLicensingClient } from "@/entities/session/server";
import { requireAdminAccess } from "@/entities/session/server";
import { canManageCommercialRecords } from "@/entities/session";
import type { PlanActionState } from "../model/types";

function stringValue(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function nullableString(formData: FormData, key: string): string | null {
  return stringValue(formData, key) || null;
}

function numberValue(value: string): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
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

export async function savePlanAction(
  _previousState: PlanActionState,
  formData: FormData,
): Promise<PlanActionState> {
  const actor = await requireCommercialManager();
  if (!actor) return { status: "error", code: "forbidden" };

  const planId = stringValue(formData, "planId");
  const name = stringValue(formData, "name");
  const isLifetime = formData.get("isLifetime") === "on";
  const isEnabled = formData.get("isEnabled") === "on";
  const rawDurationValue = stringValue(formData, "durationValue");
  const rawDurationUnit = stringValue(formData, "durationUnit");
  const durationValue = isLifetime ? null : numberValue(rawDurationValue);
  const durationUnit = isLifetime ? null : rawDurationUnit;
  const price = numberValue(stringValue(formData, "price"));
  const currency = price === null ? null : stringValue(formData, "currency").toUpperCase();
  const notes = nullableString(formData, "notes");

  if (
    !name ||
    name.length > 120 ||
    (isLifetime && (rawDurationValue !== "" || rawDurationUnit !== "")) ||
    (!isLifetime && (!Number.isInteger(durationValue) || (durationValue ?? 0) <= 0)) ||
    (!isLifetime && !["days", "months"].includes(durationUnit ?? "")) ||
    (price !== null && price < 0) ||
    (price !== null && !/^[A-Z]{3}$/.test(currency ?? "")) ||
    (notes?.length ?? 0) > 2000
  ) {
    return { status: "error", code: "invalidInput" };
  }

  try {
    const supabase = await getAuthorizedLicensingClient();
    const result = planId
      ? await supabase.rpc("update_plan", {
          p_plan_id: planId,
          p_name: name,
          p_duration_value: durationValue,
          p_duration_unit: durationUnit,
          p_is_lifetime: isLifetime,
          p_price: price,
          p_currency: currency,
          p_is_enabled: isEnabled,
          p_notes: notes,
          p_actor_user_id: actor.userId,
        })
      : await supabase.rpc("create_plan", {
          p_name: name,
          p_duration_value: durationValue,
          p_duration_unit: durationUnit,
          p_is_lifetime: isLifetime,
          p_price: price,
          p_currency: currency,
          p_is_enabled: isEnabled,
          p_notes: notes,
          p_actor_user_id: actor.userId,
        });

    if (result.error) return { status: "error", code: "unavailable" };
    const response = rpcRecord(result.data);
    const outcome = typeof response?.outcome === "string" ? response.outcome : "unavailable";
    if (outcome !== "created" && outcome !== "updated") {
      return { status: "error", code: outcome };
    }

    revalidatePath("/plans");
    revalidatePath("/customers");
    return {
      status: "success",
      code: outcome,
      entityId: typeof response?.planId === "string" ? response.planId : planId,
    };
  } catch {
    return { status: "error", code: "unavailable" };
  }
}
