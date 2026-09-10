"use server";

import { createHash, randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { getAuthorizedLicensingClient } from "@/server/data/authorized-licensing-client";
import { requireAdminAccess } from "@/server/auth/require-admin-access";
import { canManageCommercialRecords } from "@/types/rbac";

export interface CommercialActionState {
  status: "idle" | "success" | "error";
  code?: string;
  entityId?: string;
  licenseCode?: string;
}

const CROCKFORD_BASE32 = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

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

function encodeCrockford(bytes: Uint8Array): string {
  let bits = 0;
  let buffer = 0;
  let result = "";

  for (const byte of bytes) {
    buffer = (buffer << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      result += CROCKFORD_BASE32[(buffer >>> bits) & 31];
      buffer &= (1 << bits) - 1;
    }
  }

  if (bits > 0) result += CROCKFORD_BASE32[(buffer << (5 - bits)) & 31];
  return result;
}

function generateLicenseCode(): string {
  const encoded = encodeCrockford(randomBytes(20));
  return `ELMO-${encoded.match(/.{1,4}/g)?.join("-") ?? encoded}`;
}

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export async function savePlanAction(
  _previousState: CommercialActionState,
  formData: FormData,
): Promise<CommercialActionState> {
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

export async function createCustomerAction(
  _previousState: CommercialActionState,
  formData: FormData,
): Promise<CommercialActionState> {
  const actor = await requireCommercialManager();
  if (!actor) return { status: "error", code: "forbidden" };

  const businessName = stringValue(formData, "businessName");
  const ownerName = stringValue(formData, "ownerName");
  const phone = stringValue(formData, "phone");
  const email = nullableString(formData, "email");
  const address = nullableString(formData, "address");
  const taxId = nullableString(formData, "taxId");
  const notes = nullableString(formData, "notes");
  const status = stringValue(formData, "status");

  if (
    !businessName || businessName.length > 160 ||
    !ownerName || ownerName.length > 160 ||
    !phone || phone.length > 50 ||
    (email !== null && (email.length > 254 || !/^\S+@\S+\.\S+$/.test(email))) ||
    (address?.length ?? 0) > 500 ||
    (taxId?.length ?? 0) > 100 ||
    (notes?.length ?? 0) > 2000 ||
    !["active", "suspended"].includes(status)
  ) {
    return { status: "error", code: "invalidInput" };
  }

  try {
    const supabase = await getAuthorizedLicensingClient();
    const { data, error } = await supabase.rpc("create_customer", {
      p_business_name: businessName,
      p_owner_name: ownerName,
      p_phone: phone,
      p_email: email,
      p_address: address,
      p_tax_id: taxId,
      p_notes: notes,
      p_status: status,
      p_actor_user_id: actor.userId,
    });
    if (error) return { status: "error", code: "unavailable" };

    const response = rpcRecord(data);
    const outcome = typeof response?.outcome === "string" ? response.outcome : "unavailable";
    if (outcome !== "created") return { status: "error", code: outcome };
    const customerId = typeof response?.customerId === "string" ? response.customerId : undefined;

    revalidatePath("/customers");
    revalidatePath("/dashboard");
    return { status: "success", code: "created", entityId: customerId };
  } catch {
    return { status: "error", code: "unavailable" };
  }
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
