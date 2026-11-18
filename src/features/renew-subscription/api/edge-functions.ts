import "server-only";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { getPrivilegedLicensingClient } from "@/shared/api/supabase/privileged-client";
import { requireAdminAccess } from "@/entities/session/server";

export async function renewSameDeviceLicense(input: {
  licenseId: string;
  planId: string;
  actorUserId: string;
  operationId: string;
}): Promise<
  | { ok: true; bytes: ArrayBuffer; filename: string; expiresAt: string | null }
  | { ok: false; outcome: string }
> {
  await requireCommercialRenewalManager(input.actorUserId);
  const supabase = getPrivilegedLicensingClient();
  const { data, error, response } = await supabase.functions.invoke<Blob>(
    "renew-same-device-license",
    { body: input },
  );
  if (!error && data instanceof Blob) {
    const disposition = response?.headers.get("content-disposition") ?? "";
    const filename = /filename="?([^";]+)"?/i.exec(disposition)?.[1]
      ?? "elmo-license-renewal.elmolic";
    return {
      ok: true,
      bytes: await data.arrayBuffer(),
      filename,
      expiresAt: response?.headers.get("x-license-expires-at") ?? null,
    };
  }
  if (error instanceof FunctionsHttpError) {
    try {
      const body = await error.context.json() as { outcome?: unknown };
      return {
        ok: false,
        outcome: typeof body.outcome === "string"
          ? body.outcome
          : "renewalUnavailable",
      };
    } catch {
      return { ok: false, outcome: "renewalUnavailable" };
    }
  }
  return { ok: false, outcome: "renewalUnavailable" };
}

async function requireCommercialRenewalManager(actorUserId: string): Promise<void> {
  const access = await requireAdminAccess();
  if (
    !access.authorized ||
    access.context.userId !== actorUserId ||
    !["owner", "admin"].includes(access.context.role)
  ) {
    throw new Error("Commercial renewal authorization is required.");
  }
}
