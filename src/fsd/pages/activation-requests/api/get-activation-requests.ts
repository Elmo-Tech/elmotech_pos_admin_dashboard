import "server-only";
import { getAuthorizedLicensingClient } from "@/entities/session/server";
import { pageRange, requireQuery } from "@/shared/lib/query-helpers";
import { loadLicenseCustomerMaps } from "@/entities/license/server";

export async function getActivationRequests(input: { page: number; status: string }) {
  const supabase = await getAuthorizedLicensingClient();
  const { from, to } = pageRange(input.page);
  let query = supabase
    .from("activation_requests")
    .select("request_id,license_id,device_activation_id,status,received_at,consumed_at,app_version,protocol_version", { count: "exact" })
    .order("received_at", { ascending: false })
    .range(from, to);
  if (["pending", "validated", "consumed", "rejected", "expired"].includes(input.status)) {
    query = query.eq("status", input.status);
  }
  const result = await query;
  requireQuery(result.error, "Activation requests");
  const rows = result.data ?? [];
  const maps = await loadLicenseCustomerMaps(supabase, rows.map((row) => row.license_id));
  const activationIds = Array.from(
    new Set(rows.flatMap((row) => (row.device_activation_id ? [row.device_activation_id] : []))),
  );
  const devicesResult = activationIds.length
    ? await supabase.from("device_activations").select("id,status,activated_at").in("id", activationIds)
    : { data: [], error: null };
  requireQuery(devicesResult.error, "Request device context");
  const devices = new Map((devicesResult.data ?? []).map((row) => [row.id, row]));
  return {
    total: result.count ?? 0,
    rows: rows.map((row) => {
      const license = maps.licenses.get(row.license_id) ?? null;
      return {
        ...row,
        license,
        customer: license ? maps.customers.get(license.customer_id) ?? null : null,
        device: row.device_activation_id ? devices.get(row.device_activation_id) ?? null : null,
      };
    }),
  };
}
