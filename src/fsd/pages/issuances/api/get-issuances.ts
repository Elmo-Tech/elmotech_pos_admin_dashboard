import "server-only";
import { getAuthorizedLicensingClient } from "@/entities/session/server";
import { pageRange, requireQuery } from "@/shared/lib/query-helpers";

export async function getIssuances(input: { page: number; reason: string }) {
  const supabase = await getAuthorizedLicensingClient();
  const { from, to } = pageRange(input.page);
  let query = supabase
    .from("license_issuances")
    .select("id,license_id,activation_id,request_id,revision,format_version,key_id,algorithm,issued_at,expires_at,is_lifetime,license_document_sha256,reason", { count: "exact" })
    .order("issued_at", { ascending: false })
    .range(from, to);
  if (["activation", "renewal", "replacement", "administrative"].includes(input.reason)) {
    query = query.eq("reason", input.reason);
  }
  const result = await query;
  requireQuery(result.error, "Issuances");
  const rows = result.data ?? [];
  const licenseIds = Array.from(new Set(rows.map((row) => row.license_id)));
  const licensesResult = licenseIds.length
    ? await supabase.from("licenses").select("id,customer_id,status").in("id", licenseIds)
    : { data: [], error: null };
  requireQuery(licensesResult.error, "Issuance licenses");
  const customerIds = Array.from(new Set((licensesResult.data ?? []).map((row) => row.customer_id)));
  const customersResult = customerIds.length
    ? await supabase.from("customers").select("id,business_name,customer_code").in("id", customerIds)
    : { data: [], error: null };
  requireQuery(customersResult.error, "Issuance customers");
  const licenses = new Map((licensesResult.data ?? []).map((row) => [row.id, row]));
  const customers = new Map((customersResult.data ?? []).map((row) => [row.id, row]));
  return {
    total: result.count ?? 0,
    rows: rows.map((row) => {
      const license = licenses.get(row.license_id) ?? null;
      return {
        ...row,
        customer: license ? customers.get(license.customer_id) ?? null : null,
      };
    }),
  };
}
