"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Languages } from "lucide-react";
import type { Locale } from "@/shared/i18n";

export function LoginLanguage({ locale }: { locale: Locale }) {
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const router = useRouter();
  async function change() {
    setBusy(true); setFailed(false);
    try {
      const response = await fetch("/api/locale", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ locale: locale === "ar" ? "en" : "ar" }) });
      if (!response.ok) throw new Error("Locale unavailable");
      router.refresh();
    } catch { setFailed(true); }
    finally { setBusy(false); }
  }
  return <div><button type="button" onClick={change} disabled={busy} className="ghost-button min-h-10 text-xs"><Languages size={16} aria-hidden="true" />{locale === "ar" ? "English" : "العربية"}</button>{failed ? <p role="alert" className="text-xs text-[var(--danger)]">{locale === "ar" ? "تعذر تغيير اللغة." : "Language change failed."}</p> : null}</div>;
}
