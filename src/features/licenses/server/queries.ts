import "server-only";
import { getAuthorizedLicensingClient } from "@/server/data/authorized-licensing-client";
import {
  isUuid,
  pageRange,
  requireQuery,
  safeSearch,
} from "@/features/shared/server/query-helpers";

export async function getLicenses(input: { page: number; search: string; status: string }) {
  const supabase = await getAuthorizedLicensingClient();
  const { from, to } = pageRange(input.page);
  const search = safeSearch(input.search);
  let matchedCustomerIds: string[] | null = null;
  if (search) {
    const matches = await supabase
      .from("customers")
      .select("id")
      .or(`business_name.ilike.%${search}%,customer_code.ilike.%${search}%`)
      .limit(200);
    requireQuery(matches.error, "License customer search");
    matchedCustomerIds = (matches.data ?? []).map((row) => row.id);
    if (!matchedCustomerIds.length) return { rows: [], total: 0 };
  }

  let query = supabase
    .from("licenses")
    .select("id,customer_id,subscription_id,status,max_active_devices,highest_issued_revision,created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);
  if (matchedCustomerIds) query = query.in("customer_id", matchedCustomerIds);
  if (["draft", "active", "suspended", "expired", "revoked", "replaced"].includes(input.status)) {
    query = query.eq("status", input.status);
  }

  const result = await query;
  requireQuery(result.error, "Licenses");
  const rows = result.data ?? [];
  const customerIds = Array.from(new Set(rows.map((row) => row.customer_id)));
  const subscriptionIds = Array.from(new Set(rows.map((row) => row.subscription_id)));
  const licenseIds = rows.map((row) => row.id);
  const [customersResult, subscriptionsResult, devicesResult] = await Promise.all([
    customerIds.length
      ? supabase.from("customers").select("id,business_name,customer_code").in("id", customerIds)
      : Promise.resolve({ data: [], error: null }),
    subscriptionIds.length
      ? supabase
          .from("subscriptions")
          .select("id,plan_id,status,expires_at,is_lifetime,plan_name_snapshot")
          .in("id", subscriptionIds)
      : Promise.resolve({ data: [], error: null }),
    licenseIds.length
      ? supabase
          .from("device_activations")
          .select("license_id")
          .in("license_id", licenseIds)
          .eq("status", "active")
      : Promise.resolve({ data: [], error: null }),
  ]);
  requireQuery(customersResult.error, "License customers");
  requireQuery(subscriptionsResult.error, "License subscriptions");
  requireQuery(devicesResult.error, "License devices");
  const planIds = Array.from(new Set((subscriptionsResult.data ?? []).map((row) => row.plan_id)));
  const plansResult = planIds.length
    ? await supabase.from("plans").select("id,name,code").in("id", planIds)
    : { data: [], error: null };
  requireQuery(plansResult.error, "License plans");

  const customers = new Map((customersResult.data ?? []).map((row) => [row.id, row]));
  const subscriptions = new Map((subscriptionsResult.data ?? []).map((row) => [row.id, row]));
  const plans = new Map((plansResult.data ?? []).map((row) => [row.id, row]));
  const activeDevices = new Map<string, number>();
  for (const device of devicesResult.data ?? []) {
    activeDevices.set(device.license_id, (activeDevices.get(device.license_id) ?? 0) + 1);
  }

  return {
    total: result.count ?? 0,
    rows: rows.map((row) => {
      const subscription = subscriptions.get(row.subscription_id) ?? null;
      return {
        ...row,
        customer: customers.get(row.customer_id) ?? null,
        subscription,
        plan: subscription ? plans.get(subscription.plan_id) ?? null : null,
        activeDeviceCount: activeDevices.get(row.id) ?? 0,
      };
    }),
  };
}

export async function getLicenseDetail(licenseId: string) {
  if (!isUuid(licenseId)) return null;
  const supabase = await getAuthorizedLicensingClient();
  const licenseResult = await supabase
    .from("licenses")
    .select("id,customer_id,subscription_id,status,max_active_devices,highest_issued_revision,created_at,updated_at")
    .eq("id", licenseId)
    .maybeSingle();
  requireQuery(licenseResult.error, "License");
  if (!licenseResult.data) return null;
  const license = licenseResult.data;

  const [customerResult, subscriptionResult, devicesResult, requestsResult, issuancesResult, auditResult] =
    await Promise.all([
      supabase
        .from("customers")
        .select("id,business_name,customer_code,status")
        .eq("id", license.customer_id)
        .maybeSingle(),
      supabase
        .from("subscriptions")
        .select("id,plan_id,status,starts_at,expires_at,is_lifetime,plan_name_snapshot")
        .eq("id", license.subscription_id)
        .maybeSingle(),
      supabase
        .from("device_activations")
        .select("id,status,activated_at,last_issued_at,created_at")
        .eq("license_id", licenseId)
        .order("created_at", { ascending: false }),
      supabase
        .from("activation_requests")
        .select("request_id,device_activation_id,status,received_at,app_version")
        .eq("license_id", licenseId)
        .order("received_at", { ascending: false }),
      supabase
        .from("license_issuances")
        .select("id,activation_id,request_id,revision,format_version,key_id,algorithm,issued_at,expires_at,is_lifetime,license_document_sha256,reason")
        .eq("license_id", licenseId)
        .order("revision", { ascending: false }),
      supabase
        .from("audit_logs")
        .select("id,action,activation_id,issuance_id,metadata,created_at")
        .eq("license_id", licenseId)
        .order("created_at", { ascending: false })
        .limit(30),
    ]);
  requireQuery(customerResult.error, "License customer");
  requireQuery(subscriptionResult.error, "License subscription");
  requireQuery(devicesResult.error, "License devices");
  requireQuery(requestsResult.error, "License requests");
  requireQuery(issuancesResult.error, "License issuances");
  requireQuery(auditResult.error, "License audit history");
  const subscription = subscriptionResult.data;
  const planResult = subscription
    ? await supabase.from("plans").select("id,name,code").eq("id", subscription.plan_id).maybeSingle()
    : { data: null, error: null };
  requireQuery(planResult.error, "License plan");

  return {
    license,
    customer: customerResult.data,
    subscription,
    plan: planResult.data,
    devices: devicesResult.data ?? [],
    requests: requestsResult.data ?? [],
    issuances: issuancesResult.data ?? [],
    audit: auditResult.data ?? [],
  };
}
