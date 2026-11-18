"use server";
import { revalidatePath } from "next/cache";
import { getAuthorizedLicensingClient, requireAdminAccess } from "@/entities/session/server";
import { canManageCommercialRecords } from "@/entities/session";
import type { CommercialActionState } from "../model/types";

function stringValue(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function nullableString(formData: FormData, key: string): string | null {
  return stringValue(formData, key) || null;
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
