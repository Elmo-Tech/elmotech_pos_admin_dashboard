import "server-only";

/** Safe failure category; never contains credentials or backend response bodies. */
export class BackendSignInError extends Error {
  constructor(
    public readonly reason: "backend_unavailable" | "rate_limited",
    public readonly status?: number,
  ) {
    super(reason);
    this.name = "BackendSignInError";
  }
}
