/** @deprecated Supabase runtime configuration is disabled. No keys are read. */
export function getPublicEnv(): never {
  throw new Error("Supabase connections are disabled. Configure LARAVEL_API_URL on the server.");
}
