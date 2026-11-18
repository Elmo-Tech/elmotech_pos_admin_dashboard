"use client";
import type { Locale } from "@/shared/i18n";

const copy = {
  en: {
    oneTimeTitle: "One-time License Code",
    oneTimeGenerated: "License Code Generated",
    provisioningGenerated: "Subscription and License Code created successfully",
    licenseCodeLabel: "License Code:",
    oneTimeWarning: "Save or send this code to the customer now. The original code cannot be shown again after you leave this screen.",
    copyCode: "Copy License Code",
    copied: "Copied",
    activationNext: "Give the code to the customer. In Elmo POS, enter it exactly as shown, then export the .elmoreq Activation Request File. Return to Activation here to upload and process that file.",
  },
  ar: {
    oneTimeTitle: "كود الترخيص — عرض لمرة واحدة",
    oneTimeGenerated: "تم إنشاء كود الترخيص",
    provisioningGenerated: "تم إنشاء الاشتراك وكود الترخيص بنجاح",
    licenseCodeLabel: "كود الترخيص:",
    oneTimeWarning: "احفظ أو أرسل هذا الكود للعميل الآن. لن يمكن عرض الكود الأصلي مرة أخرى بعد مغادرة هذه الشاشة.",
    copyCode: "نسخ كود الترخيص",
    copied: "تم النسخ",
    activationNext: "سلّم الكود للعميل. داخل Elmo POS يُدخل الكود كما هو تماماً، ثم يُصدّر ملف طلب التفعيل .elmoreq. بعد ذلك ارجع إلى قسم التفعيل هنا لرفع الملف ومعالجته.",
  },
} as const;


export function OneTimeLicenseCodePanel({ locale, licenseCode, copied, onCopied, successKind = "replacement" }: { locale: Locale; licenseCode: string; copied: boolean; onCopied: () => void; successKind?: "provisioning" | "replacement" }) {
  const t = copy[locale];
  return (
    <section className="rounded-[14px] border border-amber-300 border-s-4 border-s-[var(--warning)] bg-[var(--warning-soft)]/50 p-6 shadow-[var(--sh-sm)]" aria-live="polite">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--warning)] rtl:tracking-normal">{t.oneTimeTitle}</p>
      <h3 className="mt-1 text-xl font-bold text-[var(--text)]">{successKind === "provisioning" ? t.provisioningGenerated : t.oneTimeGenerated}</h3>
      <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-amber-900">{t.oneTimeWarning}</p>
      <div className="mt-5">
        <p className="text-sm font-bold text-amber-950">{t.licenseCodeLabel}</p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <code className="technical-value select-all rounded-lg border border-amber-300 bg-white px-4 py-3 font-mono text-base font-bold tracking-wide text-[var(--text)]">{licenseCode}</code>
          <button type="button" onClick={async () => { await navigator.clipboard.writeText(licenseCode); onCopied(); }} className="secondary-button">
            {copied ? t.copied : t.copyCode}
          </button>
        </div>
      </div>
      <p className="mt-5 border-t border-amber-200 pt-4 text-sm leading-6 text-slate-700">{t.activationNext}</p>
    </section>
  );
}
