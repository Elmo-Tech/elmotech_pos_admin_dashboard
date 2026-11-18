import "server-only";
import type { AppEnvironment } from "@/shared/model/environment";

/**
 * Thrown for a configuration state this app refuses to run with. Never
 * caught and downgraded to a "safer-looking" value — that would defeat
 * the point. The only acceptable responses are: fix the environment, or
 * let this surface as a hard failure.
 */
export class EnvironmentConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EnvironmentConfigurationError";
  }
}

interface KnownProject {
  environment: AppEnvironment;
  ref: string;
}

/**
 * The only two Supabase projects this application is allowed to talk to.
 * Adding a third environment means adding it here deliberately, not
 * inferring it from whatever URL happens to be configured.
 */
const KNOWN_PROJECTS: readonly KnownProject[] = [
  { environment: "staging", ref: "sweezvyqlmerlcxjkair" },
  { environment: "production", ref: "lhfvlczfqltvwydfaeod" },
];

function extractProjectRef(supabaseUrl: string): string | null {
  const match = /^https:\/\/([a-z0-9]+)\.supabase\.co\/?$/i.exec(supabaseUrl.trim());
  return match ? match[1].toLowerCase() : null;
}

function readDeclaredEnvironment(): AppEnvironment {
  const raw = process.env.APP_ENV;

  if (raw === "production") return "production";
  if (raw === "staging" || raw === undefined || raw === "") return "staging";

  throw new EnvironmentConfigurationError(
    `Invalid APP_ENV "${raw}". Expected "staging" or "production" (unset defaults to "staging").`,
  );
}

/**
 * The authoritative, server-determined environment identity. Never derive
 * this from a NEXT_PUBLIC_* variable in application code — see
 * docs/ENVIRONMENT_SECURITY.md for why. Fails closed (throws) rather than
 * silently normalizing to a "safer" value whenever:
 *
 *  - APP_ENV=production while NODE_ENV is not "production" (blocks
 *    `next dev` from ever targeting Production), or
 *  - a configured NEXT_PUBLIC_SUPABASE_URL's project ref doesn't match
 *    the declared APP_ENV (catches a copy-pasted wrong URL either way).
 *
 * If no Supabase URL is configured yet, the ref check is skipped — that
 * "not configured at all" state is handled separately (see
 * `getPublicEnv()` / the login page), not treated as a mismatch.
 */
export function getServerEnvironment(): AppEnvironment {
  const environment = readDeclaredEnvironment();

  if (environment === "production" && process.env.NODE_ENV !== "production") {
    throw new EnvironmentConfigurationError(
      'APP_ENV=production is not allowed while NODE_ENV is not "production" (e.g. under ' +
        "`next dev`). Local development must never target Production.",
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl) {
    const ref = extractProjectRef(supabaseUrl);
    const matchByRef = ref ? KNOWN_PROJECTS.find((project) => project.ref === ref) : undefined;

    if (!ref || !matchByRef) {
      throw new EnvironmentConfigurationError(
        `NEXT_PUBLIC_SUPABASE_URL "${supabaseUrl}" does not match a known Elmo POS licensing ` +
          "project ref (staging or production). Refusing to start rather than guess.",
      );
    }

    if (matchByRef.environment !== environment) {
      throw new EnvironmentConfigurationError(
        `APP_ENV is "${environment}" but NEXT_PUBLIC_SUPABASE_URL points at the ` +
          `${matchByRef.environment} project (ref ${ref}). Refusing to start with a mismatched ` +
          "environment/project pairing.",
      );
    }
  }

  return environment;
}

/**
 * Returns the required Supabase URL only after the declared application
 * environment, Node runtime mode, and exact project ref have been validated.
 * The privileged client uses this instead of interpreting public config on
 * its own, keeping one fail-closed environment boundary for both projects.
 */
export function getRequiredSupabaseUrl(): string {
  const environment = getServerEnvironment();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const expectedProject = KNOWN_PROJECTS.find(
    (project) => project.environment === environment,
  );

  if (
    !supabaseUrl ||
    !expectedProject ||
    extractProjectRef(supabaseUrl) !== expectedProject.ref
  ) {
    throw new EnvironmentConfigurationError(
      `A valid ${environment} NEXT_PUBLIC_SUPABASE_URL is required for privileged licensing access.`,
    );
  }

  return supabaseUrl;
}
