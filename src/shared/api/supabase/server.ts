import "server-only";

/** @deprecated Disabled. Authentication uses the Laravel server transport. */
export async function getSupabaseServerClient(): Promise<never> {
  throw new Error("Supabase connections are disabled. Use Laravel authentication.");
}
