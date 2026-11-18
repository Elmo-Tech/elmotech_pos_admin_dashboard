"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type DragEvent, type ReactNode } from "react";
import {
  BadgeCheck,
  Check,
  CheckCircle2,
  Download,
  FileCheck2,
  FileSearch,
  FileUp,
  KeyRound,
  LoaderCircle,
  MonitorCheck,
  RefreshCw,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";
import { StatusBadge } from "@/shared/ui/status-badge";
import { getMessages, type Locale } from "@/shared/i18n";
import { localizeTerm, statusTone } from "@/shared/lib/format";
import type { AppEnvironment } from "@/shared/model/environment";

interface VerifiedContext {
  request: {
    request_id: string;
    status: string;
    received_at: string;
    app_version: string;
  };
  license: { id: string; status: string };
  customer: { id: string; business_name: string; customer_code: string; status: string } | null;
  device: { id: string; status: string; activation_type: string; activated_at: string | null } | null;
}

const COPY = {
  ar: {
    title: "معالجة طلب تفعيل جديد",
    description: "ارفع ملف العميل، راجع البيانات التي تم التحقق منها، ثم أصدر ملف الترخيص الجاهز للتسليم.",
    steps: ["رفع الطلب", "مراجعة البيانات", "إصدار الملف"],
    ready: "جاهز لاستقبال ملف جديد",
    verifying: "جارٍ التحقق الآمن من الملف…",
    verified: "تم التحقق — راجع قبل الإصدار",
    issued: "تم إصدار ملف الترخيص",
    dropTitle: "اسحب ملف .elmoreq هنا",
    dropAlternative: "أو اضغط لاختيار الملف من جهازك",
    fileRules: "ملف .elmoreq واحد فقط • الحد الأقصى 64 كيلوبايت",
    selectedFile: "الملف المختار",
    removeFile: "إزالة الملف",
    verifyHint: "لن يتم إصدار أي ترخيص في هذه الخطوة؛ سنعرض البيانات أولًا لتراجعها.",
    reviewTitle: "راجع بيانات العميل والجهاز",
    reviewDescription: "تأكد أن النشاط والترخيص والجهاز يخصون طلب العميل قبل الإصدار.",
    customer: "العميل",
    noCustomer: "عميل غير مرتبط",
    requestStatus: "حالة الطلب",
    licenseStatus: "حالة الترخيص",
    deviceStatus: "حالة الجهاز",
    notLinked: "غير مرتبط بعد",
    appVersion: "إصدار Elmo POS",
    openCustomer: "فتح ملف العميل",
    openLicense: "فتح الترخيص",
    issueHint: "بعد الإصدار سيُنزّل ملف .elmolic تلقائيًا. أرسله للعميل ليستورده داخل Elmo POS.",
    technicalDetails: "المعرّفات التقنية",
    requestId: "معرّف الطلب",
    licenseId: "معرّف الترخيص",
    deviceId: "معرّف الجهاز",
    successTitle: "ملف الترخيص جاهز للتسليم",
    successDescription: "تم تنزيل الملف تلقائيًا. أرسله للعميل عبر القناة المعتادة، ثم يختار استيراد الترخيص داخل Elmo POS.",
    downloadAgain: "تنزيل الملف مرة أخرى",
    processAnother: "معالجة طلب آخر",
  },
  en: {
    title: "Process a new activation request",
    description: "Upload the customer's file, review the verified context, then issue a license file ready for delivery.",
    steps: ["Upload request", "Review details", "Issue file"],
    ready: "Ready for a new request file",
    verifying: "Securely verifying the file…",
    verified: "Verified — review before issuing",
    issued: "License file issued",
    dropTitle: "Drop the .elmoreq file here",
    dropAlternative: "or click to choose it from your computer",
    fileRules: "One .elmoreq file only • 64 KiB maximum",
    selectedFile: "Selected file",
    removeFile: "Remove file",
    verifyHint: "No license is issued at this step. The verified details will be shown for review first.",
    reviewTitle: "Review customer and device details",
    reviewDescription: "Confirm the business, license, and device belong to the customer's request before issuing.",
    customer: "Customer",
    noCustomer: "Unlinked customer",
    requestStatus: "Request status",
    licenseStatus: "License status",
    deviceStatus: "Device status",
    notLinked: "Not linked yet",
    appVersion: "Elmo POS version",
    openCustomer: "Open customer profile",
    openLicense: "Open license",
    issueHint: "After issuing, an .elmolic file downloads automatically. Send it to the customer for import into Elmo POS.",
    technicalDetails: "Technical identifiers",
    requestId: "Request ID",
    licenseId: "License ID",
    deviceId: "Device ID",
    successTitle: "The license file is ready to deliver",
    successDescription: "The file downloaded automatically. Send it through your normal channel, then ask the customer to import it in Elmo POS.",
    downloadAgain: "Download file again",
    processAnother: "Process another request",
  },
} as const;

export function ActivationWorkflow({
  locale,
  environment,
}: {
  locale: Locale;
  environment: AppEnvironment;
}) {
  const messages = getMessages(locale, environment);
  const t = COPY[locale];
  const fileInput = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [context, setContext] = useState<VerifiedContext | null>(null);
  const [phase, setPhase] = useState<"idle" | "verifying" | "verified" | "issuing" | "issued">("idle");
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [download, setDownload] = useState<{ url: string; filename: string } | null>(null);

  useEffect(() => () => {
    if (download) URL.revokeObjectURL(download.url);
  }, [download]);

  function selectFile(nextFile: File | null) {
    setFile(nextFile);
    setContext(null);
    if (download) URL.revokeObjectURL(download.url);
    setDownload(null);
    setPhase("idle");
    setError(null);
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(false);
    if (phase === "verifying" || phase === "issuing") return;
    selectFile(event.dataTransfer.files.item(0));
  }

  function resetWorkflow() {
    selectFile(null);
    if (fileInput.current) fileInput.current.value = "";
  }

  async function verify() {
    if (!file) {
      setError(messages.selectFileFirst);
      return;
    }
    if (!file.name.toLowerCase().endsWith(".elmoreq") || file.size === 0 || file.size > 64 * 1024) {
      setError(messages.invalidFile);
      return;
    }
    setError(null);
    setContext(null);
    setPhase("verifying");
    const body = new FormData();
    body.set("file", file);
    try {
      const response = await fetch("/api/activation/verify", { method: "POST", body });
      const result = await response.json() as { context?: VerifiedContext; outcome?: string; error?: string };
      if (!response.ok || !result.context) {
        setError(result.error === "invalid_file" ? messages.invalidFile : messages.verificationFailed);
        setPhase("idle");
        return;
      }
      setContext(result.context);
      setPhase("verified");
    } catch {
      setError(messages.verificationFailed);
      setPhase("idle");
    }
  }

  async function issue() {
    if (!context) return;
    setError(null);
    setPhase("issuing");
    try {
      const response = await fetch("/api/activation/issue", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ requestId: context.request.request_id }),
      });
      if (!response.ok) {
        setError(messages.issuanceFailed);
        setPhase("verified");
        return;
      }
      const blob = await response.blob();
      const disposition = response.headers.get("content-disposition") ?? "";
      const filename = /filename="?([^";]+)"?/i.exec(disposition)?.[1] ?? "elmo-license.elmolic";
      const nextDownload = { url: URL.createObjectURL(blob), filename };
      setDownload(nextDownload);
      setPhase("issued");
      triggerDownload(nextDownload);
    } catch {
      setError(messages.issuanceFailed);
      setPhase("verified");
    }
  }

  function triggerDownload(target: { url: string; filename: string }) {
    const anchor = document.createElement("a");
    anchor.href = target.url;
    anchor.download = target.filename;
    anchor.click();
  }

  const currentStep = phase === "issued" ? 3 : context ? 2 : 1;
  const phaseLabel = phase === "verifying" ? t.verifying : phase === "verified" || phase === "issuing" ? t.verified : phase === "issued" ? t.issued : t.ready;

  return (
    <section className="surface-card overflow-hidden border-white/80 shadow-[var(--sh-lg)]">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--border)] bg-[linear-gradient(135deg,#fff_0%,#f4f7ff_100%)] px-5 py-5 sm:px-7 sm:py-6">
        <div className="flex items-start gap-3.5">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--primary)] text-white shadow-[var(--sh-primary)]"><ShieldCheck aria-hidden="true" size={21} /></span>
          <div>
            <h2 className="text-lg font-bold text-[var(--text)]">{t.title}</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--text-muted)]">{t.description}</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-3 py-1.5 text-xs font-bold text-[var(--primary)] shadow-sm">
          {phase === "verifying" || phase === "issuing" ? <LoaderCircle aria-hidden="true" className="animate-spin" size={14} /> : <span className="size-2 rounded-full bg-[var(--primary)]" />}
          {phaseLabel}
        </span>
      </div>

      <div className="border-b border-[var(--border)] px-4 py-4 sm:px-7 sm:py-5">
        <ol className="grid grid-cols-3" aria-label={locale === "ar" ? "خطوات معالجة طلب التفعيل" : "Activation request steps"}>
          {t.steps.map((step, index) => {
            const stepNumber = index + 1;
            const complete = stepNumber < currentStep;
            const active = stepNumber === currentStep;
            return (
              <li key={step} className="flex min-w-0 flex-col items-center" aria-current={active ? "step" : undefined}>
                <div className="flex w-full items-center" aria-hidden="true">
                  <span className={`h-px flex-1 ${index === 0 ? "bg-transparent" : complete || active ? "bg-[var(--primary)]/35" : "bg-[var(--border)]"}`} />
                  <span className={`relative z-10 mx-2 flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold sm:size-9 ${complete ? "border-[var(--success)] bg-[var(--success)] text-white" : active ? "border-[var(--primary)] bg-[var(--primary)] text-white shadow-[0_0_0_5px_rgb(0_82_255/.10)]" : "border-[var(--border)] bg-white text-[var(--text-muted)]"}`}>
                    {complete ? <Check aria-hidden="true" size={15} /> : stepNumber}
                  </span>
                  <span className={`h-px flex-1 ${index === t.steps.length - 1 ? "bg-transparent" : complete ? "bg-[var(--success)]/35" : "bg-[var(--border)]"}`} />
                </div>
                <span className={`mt-2.5 px-1 text-center text-[11px] font-bold leading-5 sm:text-sm ${active || complete ? "text-[var(--text)]" : "text-[var(--text-muted)]"}`}>{step}</span>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="p-5 sm:p-7">
        {phase !== "issued" ? (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,.65fr)]">
            <div>
              {!context ? (
                <label
                  onDragEnter={() => setIsDragging(true)}
                  onDragLeave={() => setIsDragging(false)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={handleDrop}
                  className={`group flex min-h-56 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-8 text-center transition-all ${isDragging ? "border-[var(--primary)] bg-[var(--primary-soft)] shadow-[0_0_0_5px_rgb(0_82_255/.08)]" : file ? "border-blue-200 bg-blue-50/45" : "border-slate-300 bg-slate-50/70 hover:border-[var(--primary)] hover:bg-[var(--primary-soft)]/35"}`}
                >
                  <input
                    ref={fileInput}
                    type="file"
                    disabled={phase === "verifying" || phase === "issuing"}
                    accept=".elmoreq,application/octet-stream,application/json"
                    className="sr-only"
                    onChange={(event) => selectFile(event.target.files?.[0] ?? null)}
                  />
                  {file ? (
                    <>
                      <span className="flex size-14 items-center justify-center rounded-2xl bg-white text-[var(--success)] shadow-[var(--sh-md)]"><FileCheck2 aria-hidden="true" size={27} /></span>
                      <p className="mt-4 text-xs font-bold uppercase tracking-wide text-[var(--success)] rtl:tracking-normal">{t.selectedFile}</p>
                      <bdi className="mt-1 max-w-full truncate text-base font-bold text-[var(--text)]">{file.name}</bdi>
                      <p className="mt-1 text-xs text-[var(--text-muted)]">{formatFileSize(file.size, locale)}</p>
                    </>
                  ) : (
                    <>
                      <span className="flex size-14 items-center justify-center rounded-2xl bg-white text-[var(--primary)] shadow-[var(--sh-md)] transition-transform group-hover:-translate-y-1"><FileUp aria-hidden="true" size={27} /></span>
                      <p className="mt-4 text-base font-bold text-[var(--text)]">{t.dropTitle}</p>
                      <p className="mt-1 text-sm text-[var(--text-muted)]">{t.dropAlternative}</p>
                      <p className="mt-4 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-slate-500 shadow-sm">{t.fileRules}</p>
                    </>
                  )}
                </label>
              ) : (
                <VerifiedReview context={context} locale={locale} />
              )}

              {error ? <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-[var(--danger-soft)] px-4 py-3 text-sm font-semibold text-[var(--danger)]">{error}</p> : null}
            </div>

            <aside className="flex flex-col rounded-2xl border border-[var(--border)] bg-slate-50/70 p-5">
              {!context ? (
                <>
                  <span className="flex size-10 items-center justify-center rounded-xl bg-[var(--primary-soft)] text-[var(--primary)]"><FileSearch aria-hidden="true" size={19} /></span>
                  <h3 className="mt-4 font-bold text-[var(--text)]">{messages.verifyRequest}</h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{t.verifyHint}</p>
                  <div className="mt-auto pt-6">
                    {file ? <button type="button" onClick={resetWorkflow} disabled={phase === "verifying"} className="ghost-button mb-2 w-full"><X aria-hidden="true" size={16} />{t.removeFile}</button> : null}
                    <button type="button" onClick={verify} disabled={!file || phase === "verifying"} className="primary-button w-full disabled:cursor-not-allowed disabled:opacity-50">
                      {phase === "verifying" ? <><LoaderCircle aria-hidden="true" className="animate-spin" size={17} />{messages.verifying}</> : <><ShieldCheck aria-hidden="true" size={17} />{messages.verifyRequest}</>}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <span className="flex size-10 items-center justify-center rounded-xl bg-[var(--success-soft)] text-[var(--success)]"><BadgeCheck aria-hidden="true" size={20} /></span>
                  <h3 className="mt-4 font-bold text-[var(--text)]">{messages.issueLicenseFile}</h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{t.issueHint}</p>
                  <div className="mt-auto pt-6">
                    <button type="button" onClick={issue} disabled={phase === "issuing"} className="primary-button w-full disabled:cursor-not-allowed disabled:opacity-60">
                      {phase === "issuing" ? <><LoaderCircle aria-hidden="true" className="animate-spin" size={17} />{messages.issuing}</> : <><KeyRound aria-hidden="true" size={17} />{messages.issueLicenseFile}</>}
                    </button>
                    <button type="button" onClick={resetWorkflow} disabled={phase === "issuing"} className="ghost-button mt-2 w-full">{t.processAnother}</button>
                  </div>
                </>
              )}
            </aside>
          </div>
        ) : download ? (
          <div className="mx-auto flex max-w-2xl flex-col items-center py-5 text-center">
            <span className="flex size-16 items-center justify-center rounded-full bg-[var(--success-soft)] text-[var(--success)] shadow-[0_0_0_10px_rgb(21_128_61/.07)]"><CheckCircle2 aria-hidden="true" size={32} /></span>
            <h3 className="mt-6 text-2xl font-bold text-[var(--text)]">{t.successTitle}</h3>
            <p className="mt-2 max-w-xl text-sm leading-7 text-[var(--text-muted)]">{t.successDescription}</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button type="button" onClick={() => triggerDownload(download)} className="primary-button"><Download aria-hidden="true" size={17} />{t.downloadAgain}</button>
              <button type="button" onClick={resetWorkflow} className="secondary-button"><RefreshCw aria-hidden="true" size={16} />{t.processAnother}</button>
            </div>
            <bdi className="technical-value mt-4 rounded-lg bg-[var(--muted)] px-3 py-2 font-mono text-xs text-[var(--text-muted)]">{download.filename}</bdi>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function VerifiedReview({ context, locale }: { context: VerifiedContext; locale: Locale }) {
  const t = COPY[locale];
  return (
    <div className="overflow-hidden rounded-2xl border border-green-200 bg-white">
      <div className="flex items-start gap-3 border-b border-green-100 bg-green-50/70 p-5">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-[var(--success)] shadow-sm"><BadgeCheck aria-hidden="true" size={21} /></span>
        <div><h3 className="font-bold text-[var(--text)]">{t.reviewTitle}</h3><p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">{t.reviewDescription}</p></div>
      </div>
      <div className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-[var(--text)] p-4 text-white">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/10"><UserRound aria-hidden="true" size={19} /></span>
            <div className="min-w-0"><p className="text-xs text-slate-300">{t.customer}</p><p className="truncate font-bold">{context.customer?.business_name ?? t.noCustomer}</p>{context.customer ? <p className="technical-value mt-0.5 font-mono text-[11px] text-slate-400">{context.customer.customer_code}</p> : null}</div>
          </div>
          {context.customer ? <Link href={`/customers/${context.customer.id}`} className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-bold text-white hover:bg-white/15">{t.openCustomer}</Link> : null}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <ReviewValue icon={<ShieldCheck size={17} />} label={t.requestStatus} value={<StatusBadge label={localizeTerm(context.request.status, locale)} tone={statusTone(context.request.status)} />} />
          <ReviewValue icon={<KeyRound size={17} />} label={t.licenseStatus} value={<StatusBadge label={localizeTerm(context.license.status, locale)} tone={statusTone(context.license.status)} />} />
          <ReviewValue icon={<MonitorCheck size={17} />} label={t.deviceStatus} value={context.device ? <StatusBadge label={localizeTerm(context.device.status, locale)} tone={statusTone(context.device.status)} /> : t.notLinked} />
          <ReviewValue icon={<FileCheck2 size={17} />} label={t.appVersion} value={<span className="technical-value font-semibold">{context.request.app_version}</span>} />
        </div>

        <div className="mt-4 flex justify-end">
          <Link href={`/licenses/${context.license.id}`} className="secondary-button min-h-10 px-3 py-2 text-xs">{t.openLicense}</Link>
        </div>

        <details className="mt-4 rounded-xl border border-[var(--border)] bg-slate-50/70">
          <summary className="cursor-pointer px-4 py-3 text-sm font-bold text-[var(--text)]">{t.technicalDetails}</summary>
          <div className="grid gap-3 border-t border-[var(--border)] p-4 sm:grid-cols-2">
            <TechnicalValue label={t.requestId} value={context.request.request_id} />
            <TechnicalValue label={t.licenseId} value={context.license.id} />
            {context.device ? <TechnicalValue label={t.deviceId} value={context.device.id} /> : null}
          </div>
        </details>
      </div>
    </div>
  );
}

function ReviewValue({ icon, label, value }: { icon: ReactNode; label: string; value: ReactNode }) {
  return <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-slate-50/65 p-3.5"><span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white text-[var(--primary)] shadow-sm">{icon}</span><div className="min-w-0"><p className="text-xs font-semibold text-[var(--text-muted)]">{label}</p><div className="mt-1 text-sm font-bold text-[var(--text)]">{value}</div></div></div>;
}

function TechnicalValue({ label, value }: { label: string; value: string }) {
  return <div><p className="text-xs font-semibold text-[var(--text-muted)]">{label}</p><p className="technical-value mt-1 overflow-hidden text-ellipsis font-mono text-xs text-[var(--text)]">{value}</p></div>;
}

function formatFileSize(bytes: number, locale: Locale) {
  if (bytes < 1024) return `${bytes} B`;
  return `${new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-GB", { maximumFractionDigits: 1, numberingSystem: "latn" }).format(bytes / 1024)} KB`;
}
