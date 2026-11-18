import type { Locale } from "@/shared/i18n";
import { ChevronDown, CircleHelp, FileDown, FileUp, KeyRound, MonitorCheck } from "lucide-react";

const guide = {
  ar: {
    title: "هل تحتاج مساعدة؟",
    summary: "افتح الدليل المختصر لدورة التفعيل دون اتصال بالإنترنت",
    note: "التفعيل تبادل يدوي وآمن بين Elmotech والعميل. Elmo POS لا يرسل أي ملف تلقائيًا عبر الإنترنت.",
    phases: [
      { title: "1. سلّم كود الترخيص", description: "أنشئ العميل والاشتراك ثم أرسل كود الترخيص للعميل.", owner: "Elmotech", icon: KeyRound },
      { title: "2. استلم ملف الطلب", description: "العميل يُدخل الكود ويصدّر ملف .elmoreq من الجهاز المطلوب تفعيله.", owner: "العميل", icon: FileUp },
      { title: "3. تحقق وأصدر الملف", description: "ارفع .elmoreq هنا، راجع البيانات، ثم نزّل ملف .elmolic.", owner: "Elmotech", icon: FileDown },
      { title: "4. يكتمل التفعيل", description: "يرفع العميل .elmolic داخل Elmo POS ليتم التحقق والتفعيل محليًا.", owner: "العميل", icon: MonitorCheck },
    ],
    requestFile: "طلب التفعيل الصادر من جهاز العميل",
    licenseFile: "ملف الترخيص الذي ترسله للعميل",
  },
  en: {
    title: "Need help?",
    summary: "Open the short guide for the offline activation cycle",
    note: "Activation is a secure manual exchange between Elmotech and the customer. Elmo POS never sends files automatically over the internet.",
    phases: [
      { title: "1. Deliver the license code", description: "Create the customer and subscription, then send the license code to the customer.", owner: "Elmotech", icon: KeyRound },
      { title: "2. Receive the request file", description: "The customer enters the code and exports .elmoreq from the device to activate.", owner: "Customer", icon: FileUp },
      { title: "3. Verify and issue", description: "Upload .elmoreq here, review the details, then download .elmolic.", owner: "Elmotech", icon: FileDown },
      { title: "4. Complete activation", description: "The customer imports .elmolic into Elmo POS for local verification and activation.", owner: "Customer", icon: MonitorCheck },
    ],
    requestFile: "activation request exported by the customer's device",
    licenseFile: "license file you deliver to the customer",
  },
} as const;

export function ActivationGuide({ locale }: { locale: Locale }) {
  const content = guide[locale];
  return (
    <details className="group surface-card overflow-hidden border-white/80">
      <summary className="cursor-pointer list-none px-5 py-4 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--info-soft)] text-[var(--info)]"><CircleHelp aria-hidden="true" size={20} /></span>
            <div><h2 className="font-bold text-[var(--text)]">{content.title}</h2><p className="mt-0.5 text-sm text-[var(--text-muted)]">{content.summary}</p></div>
          </div>
          <ChevronDown aria-hidden="true" size={19} className="shrink-0 text-[var(--text-muted)] transition-transform group-open:rotate-180" />
        </div>
      </summary>
      <div className="border-t border-[var(--border)] bg-slate-50/55 p-5 sm:p-6">
        <p className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm font-medium leading-6 text-blue-950">{content.note}</p>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {content.phases.map((phase) => {
            const Icon = phase.icon;
            return (
              <section key={phase.title} className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <span className="flex size-9 items-center justify-center rounded-xl bg-[var(--primary-soft)] text-[var(--primary)]"><Icon aria-hidden="true" size={17} /></span>
                  <span className="rounded-full bg-[var(--muted)] px-2.5 py-1 text-[10px] font-bold text-[var(--text-muted)]">{phase.owner}</span>
                </div>
                <h3 className="mt-4 text-sm font-bold text-[var(--text)]">{phase.title}</h3>
                <p className="mt-1.5 text-xs leading-5 text-[var(--text-muted)]">{phase.description}</p>
              </section>
            );
          })}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <FileDefinition extension=".elmoreq" description={content.requestFile} />
          <FileDefinition extension=".elmolic" description={content.licenseFile} />
        </div>
      </div>
    </details>
  );
}

function FileDefinition({ extension, description }: { extension: string; description: string }) {
  return <p className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--text-muted)]"><bdi className="font-mono font-bold text-[var(--text)]">{extension}</bdi><span className="mx-2">—</span>{description}</p>;
}
