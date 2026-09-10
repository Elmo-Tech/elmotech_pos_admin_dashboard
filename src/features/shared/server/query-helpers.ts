import "server-only";

export const PAGE_SIZE = 20;

export function parsePage(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(raw ?? "1", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export function readParam(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

/** Removes PostgREST OR-grammar punctuation before interpolating search text. */
export function safeSearch(value: string): string {
  return value.replace(/[,%()"\\]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
}

export function pageRange(page: number): { from: number; to: number } {
  const from = (page - 1) * PAGE_SIZE;
  return { from, to: from + PAGE_SIZE - 1 };
}

export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export function shortId(value: string): string {
  return value.slice(0, 8);
}

export function requireQuery(error: { message: string } | null, label: string): void {
  if (error) throw new Error(`${label} could not be loaded from Staging.`);
}
