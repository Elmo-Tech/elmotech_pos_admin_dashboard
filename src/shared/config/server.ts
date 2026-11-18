import "server-only";
import { resolveDataProvider } from "@/shared/config/backend";
import type { AppEnvironment } from "@/shared/model/environment";

export class EnvironmentConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EnvironmentConfigurationError";
  }
}

function readDeclaredEnvironment(): AppEnvironment {
  const raw = process.env.APP_ENV;
  if (raw === "production") return "production";
  if (raw === "staging" || raw === undefined || raw === "") return "staging";
  throw new EnvironmentConfigurationError(
    `Invalid APP_ENV "${raw}". Expected "staging" or "production" (unset defaults to "staging").`,
  );
}

/** Server-owned environment identity. Backend selection fails closed. */
export function getServerEnvironment(): AppEnvironment {
  const environment = readDeclaredEnvironment();
  if (environment === "production" && process.env.NODE_ENV !== "production") {
    throw new EnvironmentConfigurationError(
      'APP_ENV=production is not allowed while NODE_ENV is not "production" (e.g. under ' +
      "`next dev`). Local development must never target Production.",
    );
  }
  resolveDataProvider(process.env.DATA_PROVIDER);
  return environment;
}

/** @deprecated Disabled. Kept to fail clearly for stale callers. */
export function getRequiredSupabaseUrl(): never {
  throw new EnvironmentConfigurationError("Supabase connections are disabled. Use LARAVEL_API_URL.");
}
