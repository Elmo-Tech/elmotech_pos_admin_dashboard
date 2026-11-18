import "server-only";
import { FunctionsHttpError, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/shared/api/supabase/schema";
import { backendRequest, usesLaravel } from "./server";

type QueryResult = { data: unknown; count: number | null; error: { message: string } | null };
type Filter = { column: string; operator: string; value: unknown };
class ReadQuery implements PromiseLike<QueryResult> {
  private input: { columns: string; filters: Filter[]; orders: { column: string; ascending: boolean }[]; or: string[]; offset: number; limit: number; head: boolean } = { columns: "id", filters: [], orders: [], or: [], offset: 0, limit: 1000, head: false };
  constructor(private readonly resource: string) {}
  select(columns: string, options?: { head?: boolean }) { this.input.columns = columns; this.input.head = options?.head ?? false; return this; }
  eq(column: string, value: unknown) { return this.filter(column, "eq", value); }
  in(column: string, value: unknown) { return this.filter(column, "in", value); }
  gt(column: string, value: unknown) { return this.filter(column, "gt", value); }
  gte(column: string, value: unknown) { return this.filter(column, "gte", value); }
  lte(column: string, value: unknown) { return this.filter(column, "lte", value); }
  ilike(column: string, value: unknown) { return this.filter(column, "ilike", value); }
  private filter(column: string, operator: string, value: unknown) { this.input.filters.push({ column, operator, value }); return this; }
  order(column: string, options?: { ascending?: boolean }) { this.input.orders.push({ column, ascending: options?.ascending ?? true }); return this; }
  or(value: string) { this.input.or.push(value); return this; }
  range(from: number, to: number) { this.input.offset = from; this.input.limit = to - from + 1; return this; }
  limit(value: number) { this.input.limit = value; return this; }
  async maybeSingle(): Promise<QueryResult> {
    const result = await this.execute();
    if (result.error) return result;
    const rows = result.data as unknown[];
    return rows.length > 1 ? { data: null, count: null, error: { message: "Multiple rows." } } : { ...result, data: rows[0] ?? null };
  }
  then<TResult1 = QueryResult, TResult2 = never>(fulfilled?: ((value: QueryResult) => TResult1 | PromiseLike<TResult1>) | null, rejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null): PromiseLike<TResult1 | TResult2> { return this.execute().then(fulfilled, rejected); }
  private async execute(): Promise<QueryResult> {
    try {
      const response = await backendRequest(`data/${encodeURIComponent(this.resource)}/query`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(this.input) });
      if (!response.ok) return { data: null, count: null, error: { message: `Read failed (${response.status}).` } };
      const result = await response.json() as { data: unknown[]; count: number };
      return { ...result, error: null };
    } catch { return { data: null, count: null, error: { message: "Backend unavailable." } }; }
  }
}

export function getLaravelLicensingClient(): SupabaseClient<Database, "licensing"> {
  usesLaravel();
  const client = {
    from(resource: string) { return new ReadQuery(resource); },
    async rpc(name: string, args: Record<string, unknown>) {
      const body: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(args)) if (key !== "p_actor_user_id") body[key.replace(/^p_/, "")] = value;
      const routes: Record<string, [string, string]> = {
        create_plan: ["POST", "plans"], update_plan: ["PATCH", `plans/${body.plan_id}`], create_customer: ["POST", "customers"],
        provision_initial_subscription: ["POST", "subscriptions/provision"], rotate_unused_license_key_hash: ["POST", `licenses/${body.license_id}/rotate-code`],
      };
      if (name === "rotate_unused_license_key_hash") body.license_key_hash = body.new_license_key_hash;
      delete body.plan_id; if (name === "provision_initial_subscription") body.plan_id = args.p_plan_id;
      delete body.license_id; delete body.new_license_key_hash;
      const route = routes[name];
      if (!route) throw new Error("Unsupported commercial operation.");
      const response = await backendRequest(route[1], { method: route[0], headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      return response.ok ? { data: await response.json(), error: null } : { data: null, error: { message: `Operation failed (${response.status}).` } };
    },
    functions: {
      async invoke(name: string, options: { body: unknown; headers?: Record<string, string> }) {
        const routes: Record<string, string> = { "verify-activation-request": "activation/verify", "issue-initial-license": "activation/issue", "renew-same-device-license": "renewal/issue" };
        if (!routes[name]) throw new Error("Unsupported licensing operation.");
        const binary = options.body instanceof ArrayBuffer;
        const response = await backendRequest(routes[name], { method: "POST", headers: { "content-type": binary ? "application/octet-stream" : "application/json" }, body: binary ? options.body as ArrayBuffer : JSON.stringify(options.body) });
        if (!response.ok) return { data: null, error: new FunctionsHttpError(response), response };
        return { data: response.headers.get("content-type")?.includes("application/json") ? await response.json() : await response.blob(), error: null, response };
      },
    },
  };
  // One compatibility boundary keeps existing typed loaders and UI unchanged.
  // This adapter implements only the read/RPC/function subset used by the dashboard.
  return client as unknown as SupabaseClient<Database, "licensing">;
}
