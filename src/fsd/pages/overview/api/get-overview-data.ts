import "server-only";
import { cache } from "react";
import { requireAdminAccess } from "@/entities/session/server";
import { getPrivilegedLicensingClient } from "@/shared/api/supabase/privileged-client";

export interface OverviewActivationRequest {
  requestId: string;
  licenseId: string;
  status: string;
  receivedAt: string;
  appVersion: string;
  customer: { id: string; businessName: string; customerCode: string } | null;
}

export interface OverviewData {
  metrics: {
    customers: number;
    activeSubscriptions: number;
    expiringSoonSubscriptions: number;
    activationRequestsRequiringAttention: number;
    expiredSubscriptions: number;
    totalSubscriptions: number;
    activeLicenses: number;
    activeDevices: number;
  };
  customerGrowth: { month: string; count: number }[];
  recentCustomers: {
    id: string;
    businessName: string;
    customerCode: string;
    status: string;
    createdAt: string;
  }[];
  recentActivationRequests: OverviewActivationRequest[];
}

type CountResult = {
  count: number | null;
  error: { message: string } | null;
};

function requireCount(result: CountResult): number {
  if (result.error || result.count === null) {
    throw new Error("An overview count could not be loaded from the configured environment.");
  }
  return result.count;
}

/**
 * Loads live overview data from the validated environment. Authorization is enforced here as well as
 * in the dashboard layout so this function remains safe if reused elsewhere.
 */
export const getOverviewData = cache(async function getOverviewData(): Promise<OverviewData> {
  const access = await requireAdminAccess();
  if (!access.authorized) {
    throw new Error("Admin authorization is required to load the overview.");
  }

  const supabase = getPrivilegedLicensingClient();
  const nowDate = new Date();
  const now = nowDate.toISOString();
  const expiringBefore = new Date(nowDate.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const growthStart = new Date(Date.UTC(nowDate.getUTCFullYear(), nowDate.getUTCMonth() - 5, 1));

  const [
    customersResult,
    activeSubscriptionsResult,
    expiringSoonResult,
    attentionRequestsResult,
    expiredSubscriptionsResult,
    totalSubscriptionsResult,
    activeLicensesResult,
    activeDevicesResult,
    customerGrowthResult,
    recentCustomersResult,
    requestsResult,
  ] = await Promise.all([
    supabase.from("customers").select("id", { count: "exact", head: true }),
    supabase
      .from("subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("status", "active")
      .lte("starts_at", now)
      .or(`is_lifetime.eq.true,expires_at.gt.${now}`),
    supabase
      .from("subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("status", "active")
      .eq("is_lifetime", false)
      .gte("expires_at", now)
      .lte("expires_at", expiringBefore),
    supabase
      .from("activation_requests")
      .select("request_id", { count: "exact", head: true })
      .in("status", ["pending", "validated"]),
    supabase
      .from("subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("status", "expired"),
    supabase.from("subscriptions").select("id", { count: "exact", head: true }),
    supabase.from("licenses").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("device_activations").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("customers").select("created_at").gte("created_at", growthStart.toISOString()),
    supabase
      .from("customers")
      .select("id,business_name,customer_code,status,created_at")
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("activation_requests")
      .select("request_id,license_id,status,received_at,app_version")
      .order("received_at", { ascending: false })
      .limit(8),
  ]);

  if (recentCustomersResult.error || requestsResult.error || customerGrowthResult.error) {
    throw new Error("Recent activity could not be loaded from the configured environment.");
  }

  const requestRows = requestsResult.data ?? [];
  const licenseIds = Array.from(
    new Set(requestRows.map((row) => row.license_id)),
  );

  const licensesResult = licenseIds.length
    ? await supabase.from("licenses").select("id,customer_id").in("id", licenseIds)
    : { data: [], error: null };

  if (licensesResult.error) {
    throw new Error("Overview license relationships could not be loaded.");
  }

  const licensesById = new Map((licensesResult.data ?? []).map((row) => [row.id, row]));
  const customerIds = Array.from(
    new Set([
      ...(licensesResult.data ?? []).map((row) => row.customer_id),
    ]),
  );
  const customersById = new Map<string, { id: string; business_name: string; customer_code: string }>();

  if (customerIds.length) {
    const customers = await supabase
      .from("customers")
      .select("id,business_name,customer_code")
      .in("id", customerIds);
    if (customers.error) {
      throw new Error("Overview customer relationships could not be loaded.");
    }
    for (const customer of customers.data ?? []) {
      customersById.set(customer.id, customer);
    }
  }

  return {
    metrics: {
      customers: requireCount(customersResult),
      activeSubscriptions: requireCount(activeSubscriptionsResult),
      expiringSoonSubscriptions: requireCount(expiringSoonResult),
      activationRequestsRequiringAttention: requireCount(attentionRequestsResult),
      expiredSubscriptions: requireCount(expiredSubscriptionsResult),
      totalSubscriptions: requireCount(totalSubscriptionsResult),
      activeLicenses: requireCount(activeLicensesResult),
      activeDevices: requireCount(activeDevicesResult),
    },
    customerGrowth: buildMonthlyGrowth(nowDate, customerGrowthResult.data ?? []),
    recentCustomers: (recentCustomersResult.data ?? []).map((row) => ({
      id: row.id,
      businessName: row.business_name,
      customerCode: row.customer_code,
      status: row.status,
      createdAt: row.created_at,
    })),
    recentActivationRequests: requestRows.map((row) => {
      const license = licensesById.get(row.license_id);
      const customer = license ? customersById.get(license.customer_id) : null;
      return {
        requestId: row.request_id,
        licenseId: row.license_id,
        status: row.status,
        receivedAt: row.received_at,
        appVersion: row.app_version,
        customer: customer
          ? {
              id: customer.id,
              businessName: customer.business_name,
              customerCode: customer.customer_code,
            }
          : null,
      };
    }),
  };
});

function buildMonthlyGrowth(now: Date, rows: readonly { created_at: string }[]) {
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (5 - index), 1));
    return {
      month: date.toISOString(),
      key: `${date.getUTCFullYear()}-${date.getUTCMonth()}`,
      count: 0,
    };
  });
  const byKey = new Map(months.map((month) => [month.key, month]));

  for (const row of rows) {
    const createdAt = new Date(row.created_at);
    const key = `${createdAt.getUTCFullYear()}-${createdAt.getUTCMonth()}`;
    const month = byKey.get(key);
    if (month) month.count += 1;
  }

  return months.map(({ month, count }) => ({ month, count }));
}
