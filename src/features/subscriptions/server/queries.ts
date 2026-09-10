import "server-only";
import { getAuthorizedLicensingClient } from "@/server/data/authorized-licensing-client";
import { isUuid, pageRange, requireQuery } from "@/features/shared/server/query-helpers";

export async function getSubscriptions(input: {
  page: number;
  status: string;
  planId: string;
}) {
  const supabase = await getAuthorizedLicensingClient();
  const { from, to } = pageRange(input.page);
  const plansResult = await supabase
    .from("plans")
    .select("id,name,code")
    .order("name", { ascending: true });
  requireQuery(plansResult.error, "Plan filters");

  let query = supabase
    .from("subscriptions")
    .select("id,customer_id,plan_id,status,starts_at,expires_at,is_lifetime,plan_name_snapshot,external_reference,created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);
  const nowDate = new Date();
  const now = nowDate.toISOString();
  const soon = new Date(nowDate.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
  if (input.status === "active") {
    query = query.eq("status", "active").lte("starts_at", now).or(`is_lifetime.eq.true,expires_at.gt.${now}`);
  } else if (input.status === "expiring") {
    query = query.eq("status", "active").eq("is_lifetime", false).gte("expires_at", now).lte("expires_at", soon);
  } else if (input.status === "lifetime") {
    query = query.eq("is_lifetime", true);
  } else if (["expired", "suspended", "cancelled", "replaced", "draft"].includes(input.status)) {
    query = query.eq("status", input.status);
  }
  if (isUuid(input.planId)) query = query.eq("plan_id", input.planId);

  const result = await query;
  requireQuery(result.error, "Subscriptions");
  const rows = result.data ?? [];
  const customerIds = Array.from(new Set(rows.map((row) => row.customer_id)));
  const customersResult = customerIds.length
    ? await supabase.from("customers").select("id,business_name,customer_code").in("id", customerIds)
    : { data: [], error: null };
  requireQuery(customersResult.error, "Subscription customers");

  const customersById = new Map((customersResult.data ?? []).map((row) => [row.id, row]));
  const plansById = new Map((plansResult.data ?? []).map((row) => [row.id, row]));
  return {
    total: result.count ?? 0,
    plans: plansResult.data ?? [],
    rows: rows.map((row) => ({
      ...row,
      customer: customersById.get(row.customer_id) ?? null,
      plan: plansById.get(row.plan_id) ?? null,
    })),
  };
}
