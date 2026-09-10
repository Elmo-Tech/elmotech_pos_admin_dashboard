import "server-only";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { getPrivilegedLicensingClient } from "@/server/supabase/privileged-client";
import { requireAdminAccess } from "@/server/auth/require-admin-access";
import { canOperateLicenses } from "@/types/rbac";

export const ELMOREQ_MAX_BYTES = 64 * 1024;

interface VerificationResponse {
  outcome?: string;
  requestId?: string;
}

export async function verifyActivationRequest(exactBytes: Uint8Array): Promise<VerificationResponse> {
  await requireLicenseOperator();
  const supabase = getPrivilegedLicensingClient();
  const body = exactBytes.buffer.slice(
    exactBytes.byteOffset,
    exactBytes.byteOffset + exactBytes.byteLength,
  ) as ArrayBuffer;
  const { data, error } = await supabase.functions.invoke<VerificationResponse>(
    "verify-activation-request",
    { body, headers: { "content-type": "application/octet-stream" } },
  );
  if (!error) return data ?? { outcome: "storageFailure" };
  if (error instanceof FunctionsHttpError) {
    try {
      return await error.context.json() as VerificationResponse;
    } catch {
      return { outcome: "verificationUnavailable" };
    }
  }
  return { outcome: "verificationUnavailable" };
}

export async function issueInitialLicense(requestId: string): Promise<
  | { ok: true; bytes: ArrayBuffer; filename: string }
  | { ok: false; outcome: string }
> {
  await requireLicenseOperator();
  const supabase = getPrivilegedLicensingClient();
  const { data, error, response } = await supabase.functions.invoke<Blob>(
    "issue-initial-license",
    { body: { requestId } },
  );
  if (!error && data instanceof Blob) {
    const disposition = response?.headers.get("content-disposition") ?? "";
    const filename = /filename="?([^";]+)"?/i.exec(disposition)?.[1] ?? "elmo-license.elmolic";
    return { ok: true, bytes: await data.arrayBuffer(), filename };
  }
  if (error instanceof FunctionsHttpError) {
    try {
      const body = await error.context.json() as { outcome?: unknown };
      return { ok: false, outcome: typeof body.outcome === "string" ? body.outcome : "issuanceUnavailable" };
    } catch {
      return { ok: false, outcome: "issuanceUnavailable" };
    }
  }
  return { ok: false, outcome: "issuanceUnavailable" };
}

async function requireLicenseOperator(): Promise<void> {
  const access = await requireAdminAccess();
  if (!access.authorized || !canOperateLicenses(access.context.role)) {
    throw new Error("License operator authorization is required.");
  }
}
