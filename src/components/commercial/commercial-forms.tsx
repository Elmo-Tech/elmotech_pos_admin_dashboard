"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  createCustomerAction,
  provisionSubscriptionAction,
  rotateLicenseCodeAction,
  savePlanAction,
  type CommercialActionState,
} from "@/features/commercial/server/actions";
import type { Locale } from "@/i18n/messages";

const copy = {
  en: {
    createPlan: "Create plan",
    editPlan: "Edit plan",
    planName: "Plan name",
    durationValue: "Duration value",
    durationUnit: "Duration unit",
    days: "Days",
    months: "Months",
    lifetime: "Lifetime plan",
    price: "Price",
    currency: "Currency",
    enabled: "Enabled for new subscriptions",
    notes: "Notes",
    save: "Save",
    saving: "Saving…",
    created: "Created successfully.",
    updated: "Updated successfully.",
    invalidInput: "Review the entered values and try again.",
    forbidden: "Only an Owner or Admin can make this change.",
    unavailable: "The licensing operation could not be completed.",
    createCustomer: "Create customer",
    businessName: "Business name",
    ownerName: "Owner name",
    phone: "Phone",
    email: "Email",
    address: "Address",
    taxId: "Tax ID",
    status: "Status",
    active: "Active",
    suspended: "Suspended",
    openCustomer: "Open Customer 360",
    addSubscription: "Add subscription and initial license",
    choosePlan: "Choose an enabled plan",
    startDate: "Start date",
    provision: "Create subscription and license",
    provisioning: "Creating…",
    subscriptionExists: "This customer already has a current subscription.",
    customerInactive: "The customer must be active before assigning a subscription.",
    planDisabled: "That plan is no longer enabled.",
    oneTimeTitle: "One-time License Code",
    oneTimeGenerated: "License Code Generated",
    provisioningGenerated: "Subscription and License Code created successfully",
    licenseCodeLabel: "License Code:",
    oneTimeWarning: "Save or send this code to the customer now. The original code cannot be shown again after you leave this screen.",
    copyCode: "Copy License Code",
    copied: "Copied",
    activationNext: "Give the code to the customer. In Elmo POS, enter it exactly as shown, then export the .elmoreq Activation Request File. Return to Activation here to upload and process that file.",
    lifetimeExplanation: "This plan does not expire.",
    generateNewCode: "Generate New License Code",
    rotationConfirmTitle: "Replace the current License Code?",
    rotationConfirm: "The previous code will stop working immediately. The new code will be displayed once only.",
    confirmRotation: "Generate and replace code",
    cancel: "Cancel",
    notEligible: "This license has already entered activation and its code can no longer be replaced.",
  },
  ar: {
    createPlan: "إنشاء خطة",
    editPlan: "تعديل الخطة",
    planName: "اسم الخطة",
    durationValue: "قيمة المدة",
    durationUnit: "وحدة المدة",
    days: "أيام",
    months: "أشهر",
    lifetime: "خطة دائمة",
    price: "السعر",
    currency: "العملة",
    enabled: "متاحة للاشتراكات الجديدة",
    notes: "ملاحظات",
    save: "حفظ",
    saving: "جارٍ الحفظ…",
    created: "تم الإنشاء بنجاح.",
    updated: "تم التحديث بنجاح.",
    invalidInput: "راجع القيم المدخلة ثم حاول مرة أخرى.",
    forbidden: "يمكن للمالك أو المسؤول فقط تنفيذ هذا التغيير.",
    unavailable: "تعذر إكمال عملية التراخيص.",
    createCustomer: "إنشاء عميل",
    businessName: "اسم النشاط",
    ownerName: "اسم المالك",
    phone: "الهاتف",
    email: "البريد الإلكتروني",
    address: "العنوان",
    taxId: "الرقم الضريبي",
    status: "الحالة",
    active: "نشط",
    suspended: "موقوف",
    openCustomer: "فتح ملف العميل 360",
    addSubscription: "إضافة اشتراك وترخيص أولي",
    choosePlan: "اختر خطة متاحة",
    startDate: "تاريخ البداية",
    provision: "إنشاء الاشتراك والترخيص",
    provisioning: "جارٍ الإنشاء…",
    subscriptionExists: "يوجد لهذا العميل اشتراك حالي بالفعل.",
    customerInactive: "يجب أن يكون العميل نشطاً قبل إسناد اشتراك.",
    planDisabled: "هذه الخطة لم تعد متاحة.",
    oneTimeTitle: "كود الترخيص — عرض لمرة واحدة",
    oneTimeGenerated: "تم إنشاء كود الترخيص",
    provisioningGenerated: "تم إنشاء الاشتراك وكود الترخيص بنجاح",
    licenseCodeLabel: "كود الترخيص:",
    oneTimeWarning: "احفظ أو أرسل هذا الكود للعميل الآن. لن يمكن عرض الكود الأصلي مرة أخرى بعد مغادرة هذه الشاشة.",
    copyCode: "نسخ كود الترخيص",
    copied: "تم النسخ",
    activationNext: "سلّم الكود للعميل. داخل Elmo POS يُدخل الكود كما هو تماماً، ثم يُصدّر ملف طلب التفعيل .elmoreq. بعد ذلك ارجع إلى قسم التفعيل هنا لرفع الملف ومعالجته.",
    lifetimeExplanation: "هذه الخطة لا تنتهي.",
    generateNewCode: "إنشاء كود ترخيص جديد",
    rotationConfirmTitle: "استبدال كود الترخيص الحالي؟",
    rotationConfirm: "سيتوقف الكود السابق عن العمل فوراً، وسيُعرض الكود الجديد مرة واحدة فقط.",
    confirmRotation: "إنشاء الكود واستبداله",
    cancel: "إلغاء",
    notEligible: "بدأ استخدام هذا الترخيص للتفعيل، لذلك لا يمكن استبدال الكود.",
  },
} as const;

const inputClass = "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
const labelClass = "text-sm font-medium text-slate-700";
const INITIAL_COMMERCIAL_ACTION_STATE: CommercialActionState = { status: "idle" };

function SubmitButton({ idle, pending }: { idle: string; pending: string }) {
  const status = useFormStatus();
  return (
    <button
      type="submit"
      disabled={status.pending}
      className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {status.pending ? pending : idle}
    </button>
  );
}

function Feedback({ locale, status, code }: { locale: Locale; status?: string; code?: string }) {
  if (!status || status === "idle") return null;
  const t = copy[locale];
  const text = status === "success"
    ? code === "updated" ? t.updated : t.created
    : code === "invalidInput" ? t.invalidInput
      : code === "forbidden" ? t.forbidden
        : code === "subscriptionExists" ? t.subscriptionExists
          : code === "customerInactive" ? t.customerInactive
            : code === "planDisabled" ? t.planDisabled
              : code === "notEligible" ? t.notEligible
              : t.unavailable;
  return <p role="status" className={`text-sm font-medium ${status === "success" ? "text-emerald-700" : "text-red-700"}`}>{text}</p>;
}

export interface PlanFormValue {
  id: string;
  name: string;
  duration_value: number | null;
  duration_unit: string | null;
  is_lifetime: boolean;
  price: number | null;
  currency: string | null;
  notes: string | null;
  is_enabled: boolean;
}

export function PlanForm({ locale, plan }: { locale: Locale; plan?: PlanFormValue }) {
  const t = copy[locale];
  const [state, action] = useActionState(savePlanAction, INITIAL_COMMERCIAL_ACTION_STATE);
  const [isLifetime, setIsLifetime] = useState(plan?.is_lifetime ?? false);
  const [durationValue, setDurationValue] = useState(plan?.duration_value?.toString() ?? "");
  return (
    <form action={action} className="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-2 lg:grid-cols-4">
      {plan ? <input type="hidden" name="planId" value={plan.id} /> : null}
      <label className={`${labelClass} sm:col-span-2`}>
        {t.planName}
        <input className={inputClass} name="name" defaultValue={plan?.name} maxLength={120} required />
      </label>
      <label className={labelClass}>
        {t.durationValue}
        <input className={inputClass} name="durationValue" type="number" min="1" step="1" value={durationValue} onChange={(event) => setDurationValue(event.target.value)} disabled={isLifetime} required={!isLifetime} />
      </label>
      <label className={labelClass}>
        {t.durationUnit}
        <select className={inputClass} name="durationUnit" defaultValue={plan?.duration_unit ?? "months"} disabled={isLifetime} required={!isLifetime}>
          <option value="days">{t.days}</option>
          <option value="months">{t.months}</option>
        </select>
      </label>
      <label className={labelClass}>
        {t.price}
        <input className={inputClass} name="price" type="number" min="0" step="0.01" defaultValue={plan?.price ?? ""} />
      </label>
      <label className={labelClass}>
        {t.currency}
        <input className={`${inputClass} uppercase`} name="currency" defaultValue={plan?.currency ?? "EGP"} minLength={3} maxLength={3} />
      </label>
      <label className="flex items-center gap-2 self-end pb-2 text-sm font-medium text-slate-700">
        <input name="isLifetime" type="checkbox" checked={isLifetime} onChange={(event) => { setIsLifetime(event.target.checked); if (event.target.checked) setDurationValue(""); }} /> {t.lifetime}
      </label>
      {isLifetime ? <p className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-800 sm:col-span-2 lg:col-span-4">{t.lifetimeExplanation}</p> : null}
      <label className="flex items-center gap-2 self-end pb-2 text-sm font-medium text-slate-700">
        <input name="isEnabled" type="checkbox" defaultChecked={plan?.is_enabled ?? true} /> {t.enabled}
      </label>
      <label className={`${labelClass} sm:col-span-2 lg:col-span-4`}>
        {t.notes}
        <textarea className={inputClass} name="notes" defaultValue={plan?.notes ?? ""} maxLength={2000} rows={2} />
      </label>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2 lg:col-span-4">
        <SubmitButton idle={t.save} pending={t.saving} />
        <Feedback locale={locale} status={state.status} code={state.code} />
      </div>
    </form>
  );
}

export function CreateCustomerForm({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const [state, action] = useActionState(createCustomerAction, INITIAL_COMMERCIAL_ACTION_STATE);
  return (
    <form action={action} className="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-2 lg:grid-cols-3">
      <label className={labelClass}>{t.businessName}<input className={inputClass} name="businessName" maxLength={160} required /></label>
      <label className={labelClass}>{t.ownerName}<input className={inputClass} name="ownerName" maxLength={160} required /></label>
      <label className={labelClass}>{t.phone}<input className={inputClass} name="phone" maxLength={50} required /></label>
      <label className={labelClass}>{t.email}<input className={inputClass} name="email" type="email" maxLength={254} /></label>
      <label className={labelClass}>{t.address}<input className={inputClass} name="address" maxLength={500} /></label>
      <label className={labelClass}>{t.taxId}<input className={inputClass} name="taxId" maxLength={100} /></label>
      <label className={labelClass}>{t.status}<select className={inputClass} name="status" defaultValue="active"><option value="active">{t.active}</option><option value="suspended">{t.suspended}</option></select></label>
      <label className={`${labelClass} sm:col-span-2`}>
        {t.notes}<textarea className={inputClass} name="notes" maxLength={2000} rows={2} />
      </label>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2 lg:col-span-3">
        <SubmitButton idle={t.createCustomer} pending={t.saving} />
        <Feedback locale={locale} status={state.status} code={state.code} />
        {state.status === "success" && state.entityId ? <Link href={`/customers/${state.entityId}`} className="text-sm font-semibold text-blue-700 hover:underline">{t.openCustomer}</Link> : null}
      </div>
    </form>
  );
}

export function AddSubscriptionForm({
  locale,
  customerId,
  plans,
  canProvision,
}: {
  locale: Locale;
  customerId: string;
  plans: readonly { id: string; name: string; is_lifetime: boolean; duration_value: number | null; duration_unit: string | null }[];
  canProvision: boolean;
}) {
  const t = copy[locale];
  const [state, action] = useActionState(provisionSubscriptionAction, INITIAL_COMMERCIAL_ACTION_STATE);
  const [copied, setCopied] = useState(false);
  const today = new Date().toISOString().slice(0, 10);

  if (state.status === "success" && state.licenseCode) {
    return <OneTimeLicenseCodePanel locale={locale} licenseCode={state.licenseCode} copied={copied} onCopied={() => setCopied(true)} successKind="provisioning" />;
  }

  if (!canProvision) return null;

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-sm font-semibold text-slate-900">{t.addSubscription}</h3>
      <form action={action} className="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-2">
        <input type="hidden" name="customerId" value={customerId} />
        <label className={labelClass}>
          {t.choosePlan}
          <select className={inputClass} name="planId" defaultValue="" required>
            <option value="" disabled>{t.choosePlan}</option>
            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.name} · {plan.is_lifetime ? t.lifetime : `${plan.duration_value} ${plan.duration_unit === "days" ? t.days : t.months}`}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClass}>{t.startDate}<input className={inputClass} name="startDate" type="date" defaultValue={today} required /></label>
        <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
          <SubmitButton idle={t.provision} pending={t.provisioning} />
          <Feedback locale={locale} status={state.status} code={state.code} />
        </div>
      </form>

    </div>
  );
}

function OneTimeLicenseCodePanel({ locale, licenseCode, copied, onCopied, successKind = "replacement" }: { locale: Locale; licenseCode: string; copied: boolean; onCopied: () => void; successKind?: "provisioning" | "replacement" }) {
  const t = copy[locale];
  return (
    <section className="rounded-xl border-2 border-amber-400 bg-amber-50 p-6 shadow-sm" aria-live="polite">
      <p className="text-xs font-bold uppercase tracking-wide text-amber-800">{t.oneTimeTitle}</p>
      <h3 className="mt-1 text-xl font-bold text-amber-950">{successKind === "provisioning" ? t.provisioningGenerated : t.oneTimeGenerated}</h3>
      <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-amber-900">{t.oneTimeWarning}</p>
      <div className="mt-5">
        <p className="text-sm font-bold text-amber-950">{t.licenseCodeLabel}</p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <code className="technical-value select-all rounded-lg border border-amber-400 bg-white px-4 py-3 font-mono text-base font-bold tracking-wide text-slate-950">{licenseCode}</code>
          <button type="button" onClick={async () => { await navigator.clipboard.writeText(licenseCode); onCopied(); }} className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white">
            {copied ? t.copied : t.copyCode}
          </button>
        </div>
      </div>
      <p className="mt-5 border-t border-amber-200 pt-4 text-sm leading-6 text-slate-700">{t.activationNext}</p>
    </section>
  );
}

export function RotateLicenseCodeForm({ locale, licenseId }: { locale: Locale; licenseId: string }) {
  const t = copy[locale];
  const [confirming, setConfirming] = useState(false);
  const [copied, setCopied] = useState(false);
  const [state, action] = useActionState(rotateLicenseCodeAction, INITIAL_COMMERCIAL_ACTION_STATE);

  if (state.status === "success" && state.licenseCode) {
    return <OneTimeLicenseCodePanel locale={locale} licenseCode={state.licenseCode} copied={copied} onCopied={() => setCopied(true)} />;
  }

  if (!confirming) {
    return <button type="button" onClick={() => setConfirming(true)} className="rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-amber-700">{t.generateNewCode}</button>;
  }

  return (
    <form action={action} className="rounded-xl border border-amber-300 bg-amber-50 p-5">
      <input type="hidden" name="licenseId" value={licenseId} />
      <h3 className="font-bold text-amber-950">{t.rotationConfirmTitle}</h3>
      <p className="mt-1 text-sm leading-6 text-amber-900">{t.rotationConfirm}</p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <SubmitButton idle={t.confirmRotation} pending={t.provisioning} />
        <button type="button" onClick={() => setConfirming(false)} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700">{t.cancel}</button>
        <Feedback locale={locale} status={state.status} code={state.code} />
      </div>
    </form>
  );
}

export function CommercialSectionTitle({ locale, kind }: { locale: Locale; kind: "plan" | "customer" | "subscription" }) {
  const t = copy[locale];
  return <>{kind === "plan" ? t.createPlan : kind === "customer" ? t.createCustomer : t.addSubscription}</>;
}
