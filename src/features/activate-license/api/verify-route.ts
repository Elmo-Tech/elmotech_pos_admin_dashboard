import { getActivationRequestContext } from "./get-request-context";
import { ELMOREQ_MAX_BYTES, verifyActivationRequest } from "./edge-functions";
import { requireAdminAccess } from "@/entities/session/server";
import { hasValidSameOrigin } from "@/shared/http/same-origin";
import { canOperateLicenses } from "@/entities/session";

const ACCEPTED_TYPES = new Set(["", "application/octet-stream", "application/json"]);
const SUCCESS_OUTCOMES = new Set(["verifiedAndRecorded", "alreadyRecorded", "alreadyActivated"]);

export async function POST(request: Request): Promise<Response> {
  if (!hasValidSameOrigin(request)) return json({ error: "invalid_origin" }, 403);
  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (!Number.isSafeInteger(declaredLength) || declaredLength > 128 * 1024) {
    return json({ error: "invalid_file" }, 400);
  }

  const access = await requireAdminAccess();
  if (!access.authorized) return json({ error: "not_authorized" }, 403);
  if (!canOperateLicenses(access.context.role)) return json({ error: "not_permitted" }, 403);

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return json({ error: "invalid_file" }, 400);
  }
  const file = formData.get("file");
  if (
    !(file instanceof File) ||
    file.size === 0 ||
    file.size > ELMOREQ_MAX_BYTES ||
    !file.name.toLowerCase().endsWith(".elmoreq") ||
    !ACCEPTED_TYPES.has(file.type.toLowerCase())
  ) {
    return json({ error: "invalid_file" }, 400);
  }

  const exactBytes = new Uint8Array(await file.arrayBuffer());
  if (!looksLikeElmoreq(exactBytes)) return json({ error: "invalid_file" }, 400);

  const verification = await verifyActivationRequest(exactBytes);
  if (
    !verification.outcome ||
    !SUCCESS_OUTCOMES.has(verification.outcome) ||
    typeof verification.requestId !== "string"
  ) {
    return json({ error: "verification_failed", outcome: verification.outcome ?? "invalidRequest" }, 422);
  }

  const context = await getActivationRequestContext(verification.requestId);
  if (!context) return json({ error: "context_unavailable" }, 502);

  return json({ ok: true, outcome: verification.outcome, context }, 200);
}

function looksLikeElmoreq(bytes: Uint8Array): boolean {
  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return /^\s*\{/.test(text) && /"format"\s*:\s*"ELMOREQ"/.test(text);
  } catch {
    return false;
  }
}

function json(body: unknown, status: number): Response {
  return Response.json(body, { status, headers: { "cache-control": "no-store" } });
}
