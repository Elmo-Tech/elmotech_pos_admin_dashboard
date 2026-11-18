import "server-only";
import type { getPrivilegedLicensingClient } from "@/shared/api/supabase/privileged-client";
import { requireQuery } from "@/shared/lib/query-helpers";

export async function loadLicenseCustomerMaps(
  supabase: ReturnType<typeof getPrivilegedLicensingClient>,
  licenseIds: string[],
) {
  const licensesResult = licenseIds.length
    ? await supabase.from("licenses").select("id,customer_id,status").in("id", licenseIds)
    : { data: [], error: null };
  requireQuery(licensesResult.error, "Related licenses");
  const customerIds = Array.from(new Set((licensesResult.data ?? []).map((row) => row.customer_id)));
  const customersResult = customerIds.length
    ? await supabase.from("customers").select("id,business_name,customer_code").in("id", customerIds)
    : { data: [], error: null };
  requireQuery(customersResult.error, "Related customers");
  return {
    licenses: new Map((licensesResult.data ?? []).map((row) => [row.id, row])),
    customers: new Map((customersResult.data ?? []).map((row) => [row.id, row])),
  };
}
