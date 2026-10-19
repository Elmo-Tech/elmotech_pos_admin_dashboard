import "server-only";
import { getAuthorizedLicensingClient } from "@/server/data/authorized-licensing-client";
import { pageRange, requireQuery } from "@/features/shared/server/query-helpers";

export async function getPlans(input: { page: number; enabled: string; lifetime: string }) {
  const supabase = await getAuthorizedLicensingClient();
  const { from, to } = pageRange(input.page);
  const [allCount, enabledCount, lifetimeCount, subscriptionCount] = await Promise.all([
    supabase.from("plans").select("id", { count: "exact", head: true }),
    supabase.from("plans").select("id", { count: "exact", head: true }).eq("is_enabled", true),
    supabase.from("plans").select("id", { count: "exact", head: true }).eq("is_lifetime", true),
    supabase.from("subscriptions").select("id", { count: "exact", head: true }),
  ]);
  requireQuery(allCount.error, "Plan total");
  requireQuery(enabledCount.error, "Enabled plan total");
  requireQuery(lifetimeCount.error, "Lifetime plan total");
  requireQuery(subscriptionCount.error, "Plan subscription total");

  let query = supabase
    .from("plans")
    .select("id,name,code,duration_value,duration_unit,is_trial,is_lifetime,price,currency,notes,is_enabled,created_at", { count: "exact" })
    .order("name", { ascending: true })
    .range(from, to);
  if (input.enabled === "true" || input.enabled === "false") {
    query = query.eq("is_enabled", input.enabled === "true");
  }
  if (input.lifetime === "true" || input.lifetime === "false") {
    query = query.eq("is_lifetime", input.lifetime === "true");
  }
  const result = await query;
  requireQuery(result.error, "Plans");
  const rows = result.data ?? [];
  const planIds = rows.map((row) => row.id);
  const subscriptionsResult = planIds.length
    ? await supabase.from("subscriptions").select("plan_id").in("plan_id", planIds)
    : { data: [], error: null };
  requireQuery(subscriptionsResult.error, "Plan subscription counts");
  const counts = new Map<string, number>();
  for (const subscription of subscriptionsResult.data ?? []) {
    counts.set(subscription.plan_id, (counts.get(subscription.plan_id) ?? 0) + 1);
  }
  return {
    total: result.count ?? 0,
    summary: {
      all: allCount.count ?? 0,
      enabled: enabledCount.count ?? 0,
      lifetime: lifetimeCount.count ?? 0,
      subscriptions: subscriptionCount.count ?? 0,
    },
    rows: rows.map((row) => ({ ...row, subscriptionCount: counts.get(row.id) ?? 0 })),
  };
}
