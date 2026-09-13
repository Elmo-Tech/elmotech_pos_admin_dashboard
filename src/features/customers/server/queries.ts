import "server-only";
import { getAuthorizedLicensingClient } from "@/server/data/authorized-licensing-client";
import {
  isUuid,
  pageRange,
  requireQuery,
  safeSearch,
} from "@/features/shared/server/query-helpers";

export interface CustomerListRow {
  id: string;
  businessName: string;
  customerCode: string;
  status: string;
  ownerName: string;
  email: string | null;
  createdAt: string;
  subscriptionStatus: string | null;
  subscriptionExpiresAt: string | null;
  subscriptionIsLifetime: boolean;
}

export async function getCustomers(input: { page: number; search: string; status: string }) {
  const supabase = await getAuthorizedLicensingClient();
  const { from, to } = pageRange(input.page);
  let query = supabase
    .from("customers")
    .select("id,business_name,customer_code,status,owner_name,email,created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  const search = safeSearch(input.search);
  if (search) {
    query = query.or(
      `business_name.ilike.%${search}%,customer_code.ilike.%${search}%,owner_name.ilike.%${search}%,email.ilike.%${search}%`,
    );
  }
  if (["active", "suspended", "archived"].includes(input.status)) {
    query = query.eq("status", input.status);
  }

  const result = await query;
  requireQuery(result.error, "Customers");
  const customers = result.data ?? [];
  const customerIds = customers.map((row) => row.id);
  if (!customerIds.length) return { rows: [] as CustomerListRow[], total: result.count ?? 0 };

  const subscriptions = await supabase
    .from("subscriptions")
    .select("customer_id,status,starts_at,expires_at,is_lifetime")
    .in("customer_id", customerIds)
    .order("starts_at", { ascending: false });
  requireQuery(subscriptions.error, "Customer subscriptions");

  type SubscriptionSummary = NonNullable<typeof subscriptions.data>[number];
  const subscriptionByCustomer = new Map<string, SubscriptionSummary>();
  for (const subscription of subscriptions.data ?? []) {
    if (!subscriptionByCustomer.has(subscription.customer_id)) {
      subscriptionByCustomer.set(subscription.customer_id, subscription);
    }
    if (subscription.status === "active") {
      subscriptionByCustomer.set(subscription.customer_id, subscription);
    }
  }

  return {
    total: result.count ?? 0,
    rows: customers.map((customer) => {
      const subscription = subscriptionByCustomer.get(customer.id);
      return {
        id: customer.id,
        businessName: customer.business_name,
        customerCode: customer.customer_code,
        status: customer.status,
        ownerName: customer.owner_name,
        email: customer.email,
        createdAt: customer.created_at,
        subscriptionStatus: subscription?.status ?? null,
        subscriptionExpiresAt: subscription?.expires_at ?? null,
        subscriptionIsLifetime: subscription?.is_lifetime ?? false,
      };
    }),
  };
}

export async function getCustomerDetail(customerId: string) {
  if (!isUuid(customerId)) return null;
  const supabase = await getAuthorizedLicensingClient();
  const customerResult = await supabase
    .from("customers")
    .select("id,business_name,customer_code,owner_name,email,phone,address,tax_id,notes,status,created_at")
    .eq("id", customerId)
    .maybeSingle();
  requireQuery(customerResult.error, "Customer");
  if (!customerResult.data) return null;

  const [subscriptionsResult, licensesResult, auditResult, enabledPlansResult] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("id,plan_id,status,starts_at,expires_at,is_lifetime,plan_name_snapshot,duration_value_snapshot,duration_unit_snapshot,price_snapshot,currency_snapshot,external_reference,created_at")
      .eq("customer_id", customerId)
      .order("starts_at", { ascending: false }),
    supabase
      .from("licenses")
      .select("id,subscription_id,status,max_active_devices,highest_issued_revision,created_at")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false }),
    supabase
      .from("audit_logs")
      .select("id,action,license_id,activation_id,issuance_id,metadata,created_at")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("plans")
      .select("id,name,is_lifetime,duration_value,duration_unit,price,currency")
      .eq("is_enabled", true)
      .order("name", { ascending: true }),
  ]);
  requireQuery(subscriptionsResult.error, "Customer subscriptions");
  requireQuery(licensesResult.error, "Customer licenses");
  requireQuery(auditResult.error, "Customer audit history");
  requireQuery(enabledPlansResult.error, "Enabled plans");

  const subscriptions = subscriptionsResult.data ?? [];
  const licenses = licensesResult.data ?? [];
  const licenseIds = licenses.map((row) => row.id);
  const planIds = Array.from(new Set(subscriptions.map((row) => row.plan_id)));
  const [plansResult, devicesResult, requestsResult, issuancesResult] = await Promise.all([
    planIds.length
      ? supabase.from("plans").select("id,name,code").in("id", planIds)
      : Promise.resolve({ data: [], error: null }),
    licenseIds.length
      ? supabase
          .from("device_activations")
          .select("id,license_id,status,activated_at,last_issued_at,created_at")
          .in("license_id", licenseIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    licenseIds.length
      ? supabase
          .from("activation_requests")
          .select("request_id,license_id,device_activation_id,status,received_at,app_version")
          .in("license_id", licenseIds)
          .order("received_at", { ascending: false })
          .limit(30)
      : Promise.resolve({ data: [], error: null }),
    licenseIds.length
      ? supabase
          .from("license_issuances")
          .select("id,license_id,revision,reason,key_id,issued_at,expires_at,is_lifetime")
          .in("license_id", licenseIds)
          .order("issued_at", { ascending: false })
          .limit(30)
      : Promise.resolve({ data: [], error: null }),
  ]);
  requireQuery(plansResult.error, "Customer plans");
  requireQuery(devicesResult.error, "Customer devices");
  requireQuery(requestsResult.error, "Customer activation requests");
  requireQuery(issuancesResult.error, "Customer issuances");

  const plansById = new Map((plansResult.data ?? []).map((row) => [row.id, row]));
  return {
    referenceNow: new Date().toISOString(),
    customer: customerResult.data,
    subscriptions: subscriptions.map((row) => ({ ...row, plan: plansById.get(row.plan_id) ?? null })),
    licenses,
    devices: devicesResult.data ?? [],
    requests: requestsResult.data ?? [],
    issuances: issuancesResult.data ?? [],
    audit: auditResult.data ?? [],
    enabledPlans: enabledPlansResult.data ?? [],
  };
}
