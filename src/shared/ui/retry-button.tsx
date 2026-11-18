"use client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { RefreshCw } from "lucide-react";
import type { Locale } from "@/shared/i18n";

export function RetryButton({ locale }: { locale: Locale }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return <button type="button" disabled={pending} onClick={() => startTransition(() => router.refresh())} className="secondary-button"><RefreshCw size={15} aria-hidden="true" className={pending ? "animate-spin" : ""} />{locale === "ar" ? (pending ? "جارٍ المحاولة…" : "إعادة المحاولة") : (pending ? "Retrying…" : "Try again")}</button>;
}
