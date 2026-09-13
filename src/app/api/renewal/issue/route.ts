import { renewSameDeviceLicense } from "@/features/activation/server/edge-functions";
import { isUuid } from "@/features/shared/server/query-helpers";
import { requireAdminAccess } from "@/server/auth/require-admin-access";
import { hasValidSameOrigin } from "@/server/http/same-origin";
import { canManageCommercialRecords } from "@/types/rbac";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  if (!hasValidSameOrigin(request)) return json({ error: "invalid_origin" }, 403);
  if (request.headers.get("content-type")?.split(";", 1)[0] !== "application/json") {
    return json({ error: "invalid_request" }, 400);
  }

  const access = await requireAdminAccess();
  if (!access.authorized) return json({ error: "not_authorized" }, 403);
  if (!canManageCommercialRecords(access.context.role)) {
    return json({ error: "not_permitted" }, 403);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid_request" }, 400);
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return json({ error: "invalid_request" }, 400);
  }
  const record = body as Record<string, unknown>;
  if (
    Object.keys(record).length !== 3 ||
    typeof record.licenseId !== "string" || !isUuid(record.licenseId) ||
    typeof record.planId !== "string" || !isUuid(record.planId) ||
    typeof record.operationId !== "string" || !isUuid(record.operationId)
  ) {
    return json({ error: "invalid_request" }, 400);
  }

  const result = await renewSameDeviceLicense({
    licenseId: record.licenseId,
    planId: record.planId,
    operationId: record.operationId,
    actorUserId: access.context.userId,
  });
  if (!result.ok) {
    return json({ error: "renewal_failed", outcome: result.outcome }, 422);
  }

  const filename = result.filename.toLowerCase().endsWith(".elmolic")
    ? result.filename.replace(/[^A-Za-z0-9._-]/g, "-")
    : "elmo-license-renewal.elmolic";
  const headers: Record<string, string> = {
    "content-type": "application/octet-stream",
    "content-disposition": `attachment; filename="${filename}"`,
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
  };
  if (result.expiresAt) headers["x-license-expires-at"] = result.expiresAt;
  return new Response(result.bytes, { status: 200, headers });
}

function json(body: unknown, status: number): Response {
  return Response.json(body, { status, headers: { "cache-control": "no-store" } });
}
