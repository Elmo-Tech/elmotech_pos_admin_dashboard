import "server-only";
import { getAuthorizedLicensingClient } from "@/entities/session/server";
import { pageRange, requireQuery, safeSearch } from "@/shared/lib/query-helpers";

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
