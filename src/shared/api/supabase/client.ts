/** @deprecated Disabled. Browser requests must use the Next.js Laravel-backed entry points. */
export function getSupabaseBrowserClient(): never {
  throw new Error("Supabase connections are disabled. Use the Laravel-backed dashboard API.");
}
