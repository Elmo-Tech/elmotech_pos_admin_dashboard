/**
 * Server-determined environment identity. This type has no runtime
 * dependency on any NEXT_PUBLIC_* variable — see `src/server/env.ts` for
 * the authoritative resolver. Client components may import this *type*
 * (erased at compile time) to accept a validated value as a prop; they
 * must never re-derive it themselves.
 */
export type AppEnvironment = "staging" | "production";
