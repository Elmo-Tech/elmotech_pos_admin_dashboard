import "server-only";
import { getAuthorizedLicensingClient } from "@/entities/session/server";
import { pageRange, requireQuery, safeSearch } from "@/shared/lib/query-helpers";

export async function getAuditLogs(input: { page: number; action: string }) {
  const supabase = await getAuthorizedLicensingClient();
  const { from, to } = pageRange(input.page);
  let query = supabase
    .from("audit_logs")
    .select("id,actor_user_id,action,customer_id,subscription_id,license_id,activation_id,issuance_id,metadata,created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);
  const action = safeSearch(input.action).replace(/\s/g, "_");
  if (action) query = query.ilike("action", `%${action}%`);
  const result = await query;
  requireQuery(result.error, "Audit logs");
  const rows = result.data ?? [];
  const directCustomerIds = rows.flatMap((row) => (row.customer_id ? [row.customer_id] : []));
  const licenseIds = Array.from(new Set(rows.flatMap((row) => (row.license_id ? [row.license_id] : []))));
  const licensesResult = licenseIds.length
    ? await supabase.from("licenses").select("id,customer_id").in("id", licenseIds)
    : { data: [], error: null };
  requireQuery(licensesResult.error, "Audit licenses");
  const customerIds = Array.from(
    new Set([...directCustomerIds, ...(licensesResult.data ?? []).map((row) => row.customer_id)]),
  );
  const customersResult = customerIds.length
    ? await supabase.from("customers").select("id,business_name,customer_code").in("id", customerIds)
    : { data: [], error: null };
  requireQuery(customersResult.error, "Audit customers");
  const licenses = new Map((licensesResult.data ?? []).map((row) => [row.id, row]));
  const customers = new Map((customersResult.data ?? []).map((row) => [row.id, row]));
  return {
    total: result.count ?? 0,
    rows: rows.map((row) => {
      const customerId = row.customer_id ?? (row.license_id ? licenses.get(row.license_id)?.customer_id : null);
      return { ...row, customer: customerId ? customers.get(customerId) ?? null : null };
    }),
  };
}
