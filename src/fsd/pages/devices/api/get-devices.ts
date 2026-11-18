import "server-only";
import { getAuthorizedLicensingClient } from "@/entities/session/server";
import { pageRange, requireQuery } from "@/shared/lib/query-helpers";
import { loadLicenseCustomerMaps } from "@/entities/license/server";

export async function getDevices(input: { page: number; status: string }) {
  const supabase = await getAuthorizedLicensingClient();
  const { from, to } = pageRange(input.page);
  let query = supabase
    .from("device_activations")
    .select("id,license_id,first_request_id,status,activation_type,activated_at,last_issued_at,created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);
  if (["pending", "active", "replaced", "deactivated", "revoked"].includes(input.status)) {
    query = query.eq("status", input.status);
  }
  const result = await query;
  requireQuery(result.error, "Devices");
  const rows = result.data ?? [];
  const maps = await loadLicenseCustomerMaps(supabase, rows.map((row) => row.license_id));
  return {
    total: result.count ?? 0,
    rows: rows.map((row) => {
      const license = maps.licenses.get(row.license_id) ?? null;
      return {
        ...row,
        license,
        customer: license ? maps.customers.get(license.customer_id) ?? null : null,
      };
    }),
  };
}
