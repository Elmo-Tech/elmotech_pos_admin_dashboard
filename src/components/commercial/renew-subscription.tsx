"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/i18n/messages";
import { formatDate, formatMoney } from "@/lib/format";

interface RenewalPlan {
  id: string;
  name: string;
  is_lifetime: boolean;
  duration_value: number | null;
  duration_unit: string | null;
  price: number | null;
  currency: string | null;
}

interface RenewalSubscription {
  plan_name_snapshot: string;
  expires_at: string | null;
  is_lifetime: boolean;
}

const COPY = {
  en: {
    action: "Renew Subscription",
    title: "Renew Subscription",
    currentPlan: "Current plan",
    newPlan: "New plan",
    choosePlan: "Choose an enabled finite plan",
    newStart: "New period starts",
    newExpiry: "New expiry date",
    price: "Price",
    confirm: "Confirm renewal",
    confirming: "Renewing and issuing file…",
    close: "Close",
    success: "Subscription renewed successfully",
    issued: "The new License File was issued",
    download: "Download License File",
    delivery: "Send this .elmolic file to the customer for import into the existing Elmo POS installation.",
    genericError: "Renewal could not be completed. No second request was sent automatically.",
    unavailableNoDevice: "Simple renewal is available after this license is activated on one device.",
    unavailableReplacement: "Same-device renewal is unavailable. Device replacement is not supported in V1 yet.",
    lifetime: "Lifetime subscriptions do not require renewal.",
  },
  ar: {
    action: "تجديد الاشتراك",
    title: "تجديد الاشتراك",
    currentPlan: "الخطة الحالية",
    newPlan: "الخطة الجديدة",
    choosePlan: "اختر خطة محددة المدة ومفعّلة",
    newStart: "بداية الفترة الجديدة",
    newExpiry: "تاريخ الانتهاء الجديد",
    price: "السعر",
    confirm: "تأكيد التجديد",
    confirming: "جارٍ التجديد وإصدار الملف…",
    close: "إغلاق",
    success: "تم التجديد بنجاح",
    issued: "تم إصدار ملف الترخيص الجديد",
    download: "تحميل ملف الترخيص",
    delivery: "أرسل ملف .elmolic إلى العميل ليستورده في نسخة Elmo POS المفعّلة على الجهاز نفسه.",
    genericError: "تعذر إتمام التجديد. لم يتم إرسال طلب ثانٍ تلقائيًا.",
    unavailableNoDevice: "يتاح التجديد المبسط بعد تفعيل هذا الترخيص على جهاز واحد.",
    unavailableReplacement: "التجديد على الجهاز نفسه غير متاح. استبدال الجهاز غير مدعوم في V1 حاليًا.",
    lifetime: "الاشتراكات الدائمة لا تحتاج إلى تجديد.",
  },
} as const;

export function RenewSubscription({
  locale,
  subscription,
  licenseId,
  plans,
  referenceNow,
  unavailableReason,
}: {
  locale: Locale;
  subscription: RenewalSubscription;
  licenseId: string;
  plans: RenewalPlan[];
  referenceNow: string;
  unavailableReason: "none" | "noDevice" | "replacement" | "notEligible";
}) {
  const t = COPY[locale];
  const router = useRouter();
  const finitePlans = useMemo(
    () => plans.filter((plan) => !plan.is_lifetime && plan.duration_value && ["days", "months"].includes(plan.duration_unit ?? "")),
    [plans],
  );
  const [open, setOpen] = useState(false);
  const [planId, setPlanId] = useState(finitePlans[0]?.id ?? "");
  const [phase, setPhase] = useState<"ready" | "pending" | "error" | "success">("ready");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [filename, setFilename] = useState("elmo-license-renewal.elmolic");
  const [actualExpiry, setActualExpiry] = useState<string | null>(null);
  const operationId = useRef<string | null>(null);

  useEffect(() => () => {
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
  }, [downloadUrl]);

  const plan = finitePlans.find((candidate) => candidate.id === planId) ?? null;
  const projected = plan ? projectRenewal(subscription.expires_at, referenceNow, plan) : null;

  if (subscription.is_lifetime) {
    return <p className="mt-4 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">{t.lifetime}</p>;
  }
  if (unavailableReason !== "none") {
    const message = unavailableReason === "replacement"
      ? t.unavailableReplacement
      : unavailableReason === "noDevice"
        ? t.unavailableNoDevice
        : null;
    return message
      ? <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">{message}</p>
      : null;
  }
  if (!plan || !projected) return null;

  async function renew() {
    if (phase === "pending" || !plan) return;
    setPhase("pending");
    operationId.current ??= crypto.randomUUID();
    try {
      const response = await fetch("/api/renewal/issue", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          licenseId,
          planId: plan.id,
          operationId: operationId.current,
        }),
      });
      if (!response.ok) {
        setPhase("error");
        return;
      }
      const blob = await response.blob();
      const disposition = response.headers.get("content-disposition") ?? "";
      const responseFilename = /filename="?([^";]+)"?/i.exec(disposition)?.[1];
      const url = URL.createObjectURL(blob);
      setDownloadUrl((previous) => {
        if (previous) URL.revokeObjectURL(previous);
        return url;
      });
      setFilename(responseFilename ?? "elmo-license-renewal.elmolic");
      setActualExpiry(response.headers.get("x-license-expires-at"));
      setPhase("success");
      router.refresh();
    } catch {
      setPhase("error");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-blue-800"
      >
        {t.action}
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && phase !== "pending") setOpen(false); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="renewal-title" className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <h2 id="renewal-title" className="text-xl font-bold text-slate-950">{t.title}</h2>
              <button type="button" disabled={phase === "pending"} onClick={() => setOpen(false)} className="text-sm font-semibold text-slate-500 hover:text-slate-900">{t.close}</button>
            </div>

            {phase === "success" && downloadUrl ? (
              <div className="mt-6 rounded-xl border border-emerald-300 bg-emerald-50 p-5">
                <p className="text-lg font-bold text-emerald-950">{t.success}</p>
                <p className="mt-1 font-semibold text-emerald-900">{t.issued}</p>
                <p className="mt-3 text-sm text-emerald-900">{t.newExpiry}: {formatDate(actualExpiry ?? projected.expiresAt, locale)}</p>
                <a href={downloadUrl} download={filename} className="mt-5 inline-flex rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-800">{t.download}</a>
                <p className="mt-4 text-sm text-emerald-900">{t.delivery}</p>
              </div>
            ) : (
              <div className="mt-6 flex flex-col gap-4">
                <Info label={t.currentPlan} value={subscription.plan_name_snapshot} />
                <label className="text-sm font-semibold text-slate-700">
                  {t.newPlan}
                  <select
                    value={planId}
                    disabled={phase === "pending" || phase === "error"}
                    onChange={(event) => setPlanId(event.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-950"
                  >
                    <option value="" disabled>{t.choosePlan}</option>
                    {finitePlans.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.name}</option>)}
                  </select>
                </label>
                <div className="grid gap-3 sm:grid-cols-3">
                  <Info label={t.newStart} value={formatDate(projected.startsAt, locale)} />
                  <Info label={t.newExpiry} value={formatDate(projected.expiresAt, locale)} />
                  <Info label={t.price} value={formatMoney(plan.price, plan.currency, locale)} />
                </div>
                {phase === "error" ? <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">{t.genericError}</p> : null}
                <button type="button" disabled={phase === "pending"} onClick={renew} className="rounded-lg bg-blue-700 px-4 py-3 text-sm font-bold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60">
                  {phase === "pending" ? t.confirming : t.confirm}
                </button>
              </div>
            )}
          </section>
        </div>
      ) : null}
    </>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg bg-slate-50 px-4 py-3"><p className="text-xs font-semibold text-slate-500">{label}</p><p className="mt-1 font-semibold text-slate-950">{value}</p></div>;
}

function projectRenewal(oldExpiry: string | null, referenceNow: string, plan: RenewalPlan) {
  const now = new Date(referenceNow);
  const expiry = oldExpiry ? new Date(oldExpiry) : now;
  const startsAt = expiry.getTime() > now.getTime() ? expiry : now;
  const expiresAt = new Date(startsAt);
  if (plan.duration_unit === "days") {
    expiresAt.setUTCDate(expiresAt.getUTCDate() + (plan.duration_value ?? 0));
  } else {
    const day = expiresAt.getUTCDate();
    expiresAt.setUTCDate(1);
    expiresAt.setUTCMonth(expiresAt.getUTCMonth() + (plan.duration_value ?? 0));
    const lastDay = new Date(Date.UTC(expiresAt.getUTCFullYear(), expiresAt.getUTCMonth() + 1, 0)).getUTCDate();
    expiresAt.setUTCDate(Math.min(day, lastDay));
  }
  return { startsAt: startsAt.toISOString(), expiresAt: expiresAt.toISOString() };
}
