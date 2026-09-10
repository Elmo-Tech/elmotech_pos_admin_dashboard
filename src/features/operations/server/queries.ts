import "server-only";
import { getAuthorizedLicensingClient } from "@/server/data/authorized-licensing-client";
import { isUuid, pageRange, requireQuery } from "@/features/shared/server/query-helpers";

async function loadLicenseCustomerMaps(
  supabase: Awaited<ReturnType<typeof getAuthorizedLicensingClient>>,
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

export async function getActivationRequestContext(requestId: string) {
  if (!isUuid(requestId)) return null;
  const supabase = await getAuthorizedLicensingClient();
  const requestResult = await supabase
    .from("activation_requests")
    .select("request_id,license_id,device_activation_id,status,received_at,app_version")
    .eq("request_id", requestId)
    .maybeSingle();
  requireQuery(requestResult.error, "Activation request context");
  const request = requestResult.data;
  if (!request) return null;

  const licenseResult = await supabase
    .from("licenses")
    .select("id,customer_id,status")
    .eq("id", request.license_id)
    .maybeSingle();
  requireQuery(licenseResult.error, "Activation request license");
  const license = licenseResult.data;
  if (!license) return null;

  const [customerResult, deviceResult] = await Promise.all([
    supabase
      .from("customers")
      .select("id,business_name,customer_code,status")
      .eq("id", license.customer_id)
      .maybeSingle(),
    request.device_activation_id
      ? supabase
          .from("device_activations")
          .select("id,status,activation_type,activated_at")
          .eq("id", request.device_activation_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);
  requireQuery(customerResult.error, "Activation request customer");
  requireQuery(deviceResult.error, "Activation request device");

  return { request, license, customer: customerResult.data, device: deviceResult.data };
}
