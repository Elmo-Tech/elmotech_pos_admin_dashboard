import { issueInitialLicense } from "@/features/activation/server/edge-functions";
import { isUuid } from "@/features/shared/server/query-helpers";
import { requireAdminAccess } from "@/server/auth/require-admin-access";
import { hasValidSameOrigin } from "@/server/http/same-origin";
import { canOperateLicenses } from "@/types/rbac";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  if (!hasValidSameOrigin(request)) return json({ error: "invalid_origin" }, 403);
  if (request.headers.get("content-type")?.split(";", 1)[0] !== "application/json") {
    return json({ error: "invalid_request" }, 400);
  }

  const access = await requireAdminAccess();
  if (!access.authorized) return json({ error: "not_authorized" }, 403);
  if (!canOperateLicenses(access.context.role)) return json({ error: "not_permitted" }, 403);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid_request" }, 400);
  }
  const requestId = body && typeof body === "object" && "requestId" in body
    ? (body as { requestId: unknown }).requestId
    : null;
  if (typeof requestId !== "string" || !isUuid(requestId)) {
    return json({ error: "invalid_request" }, 400);
  }

  const result = await issueInitialLicense(requestId);
  if (!result.ok) return json({ error: "issuance_failed", outcome: result.outcome }, 422);
  const filename = result.filename.toLowerCase().endsWith(".elmolic")
    ? result.filename.replace(/[^A-Za-z0-9._-]/g, "-")
    : "elmo-license.elmolic";

  return new Response(result.bytes, {
    status: 200,
    headers: {
      "content-type": "application/octet-stream",
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
}

function json(body: unknown, status: number): Response {
  return Response.json(body, { status, headers: { "cache-control": "no-store" } });
}
