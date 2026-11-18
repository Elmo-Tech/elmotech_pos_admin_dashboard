/** Laravel is the only supported runtime backend. Supabase cannot be enabled. */
export function resolveDataProvider(value: string | undefined): "laravel" {
  if (value === undefined || value === "" || value === "laravel") return "laravel";
  throw new Error(`Invalid DATA_PROVIDER "${value}". Only Laravel is supported; Supabase connections are disabled.`);
}
