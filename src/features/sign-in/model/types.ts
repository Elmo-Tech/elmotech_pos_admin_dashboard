export interface SignInState {
  error: "missing_credentials" | "not_configured" | "invalid_credentials" | "backend_unavailable" | "rate_limited" | null;
}
