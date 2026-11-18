/** Laravel is the default. Supabase is a deprecated, explicit legacy opt-in. */
export function resolveDataProvider(value: string | undefined): "laravel" | "supabase" {
  if (value === undefined || value === "" || value === "laravel") return "laravel";
  if (value === "supabase") return "supabase";
  throw new Error(`Invalid DATA_PROVIDER "${value}". Expected "laravel" or deprecated "supabase".`);
}
