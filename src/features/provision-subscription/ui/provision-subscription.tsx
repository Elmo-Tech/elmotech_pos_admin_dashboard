"use client";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { ActionDialog, DialogCloseButton } from "@/shared/ui/action-dialog";
import { OneTimeLicenseCodePanel } from "@/entities/license";
import type { Locale } from "@/shared/i18n";
import { provisionSubscriptionAction } from "../api/actions";
import type { CommercialActionState } from "../model/types";

const copy = {
  en: {
    days: "Days",
    months: "Months",
    lifetime: "Lifetime plan",
    created: "Created successfully.",
    updated: "Updated successfully.",
    invalidInput: "Review the entered values and try again.",
    forbidden: "Only an Owner or Admin can make this change.",
    unavailable: "The licensing operation could not be completed.",
    addSubscription: "Add subscription and initial license",
    choosePlan: "Choose an enabled plan",
    startDate: "Start date",
    provision: "Create subscription and license",
    provisioning: "Creating…",
    subscriptionExists: "This customer already has a current subscription.",
    customerInactive: "The customer must be active before assigning a subscription.",
    planDisabled: "That plan is no longer enabled.",
    notEligible: "This license has already entered activation and its code can no longer be replaced.",
    subscriptionDialogDescription: "Choose the plan and start date. A first license code will be created and shown once.",
  },
  ar: {
    days: "أيام",
    months: "أشهر",
    lifetime: "خطة دائمة",
    created: "تم الإنشاء بنجاح.",
    updated: "تم التحديث بنجاح.",
    invalidInput: "راجع القيم المدخلة ثم حاول مرة أخرى.",
    forbidden: "يمكن للمالك أو المسؤول فقط تنفيذ هذا التغيير.",
    unavailable: "تعذر إكمال عملية التراخيص.",
    addSubscription: "إضافة اشتراك وترخيص أولي",
    choosePlan: "اختر خطة متاحة",
    startDate: "تاريخ البداية",
    provision: "إنشاء الاشتراك والترخيص",
    provisioning: "جارٍ الإنشاء…",
    subscriptionExists: "يوجد لهذا العميل اشتراك حالي بالفعل.",
    customerInactive: "يجب أن يكون العميل نشطاً قبل إسناد اشتراك.",
    planDisabled: "هذه الخطة لم تعد متاحة.",
    notEligible: "بدأ استخدام هذا الترخيص للتفعيل، لذلك لا يمكن استبدال الكود.",
    subscriptionDialogDescription: "اختر الخطة وتاريخ البداية. سيتم إنشاء كود الترخيص الأول وعرضه مرة واحدة.",
  },
} as const;


const inputClass = "mt-1.5 w-full px-3 py-2 text-sm text-[var(--text)]";
const labelClass = "text-[13px] font-medium text-[var(--text)]";
const INITIAL_COMMERCIAL_ACTION_STATE: CommercialActionState = { status: "idle" };

function SubmitButton({ idle, pending }: { idle: string; pending: string }) {
  const status = useFormStatus();
  return (
    <button
      type="submit"
      disabled={status.pending}
      className="primary-button disabled:cursor-not-allowed disabled:opacity-60"
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
  return <p role="status" className={`rounded-lg px-3 py-2 text-sm font-medium ${status === "success" ? "bg-[var(--success-soft)] text-[var(--success)]" : "bg-[var(--danger-soft)] text-[var(--danger)]"}`}>{text}</p>;
}

export function AddSubscriptionForm({
  locale,
  customerId,
  plans,
  canProvision,
  embedded = false,
}: {
  locale: Locale;
  customerId: string;
  plans: readonly { id: string; name: string; is_lifetime: boolean; duration_value: number | null; duration_unit: string | null }[];
  canProvision: boolean;
  embedded?: boolean;
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
      {!embedded ? <h3 className="text-base font-semibold text-[var(--text)]">{t.addSubscription}</h3> : null}
      <form action={action} className={`${embedded ? "grid" : "surface-card grid p-5"} gap-5 sm:grid-cols-2`}>
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
        <div className="form-footer sm:col-span-2">
          {embedded ? <DialogCloseButton>{locale === "ar" ? "إلغاء" : "Cancel"}</DialogCloseButton> : null}
          <SubmitButton idle={t.provision} pending={t.provisioning} />
          <Feedback locale={locale} status={state.status} code={state.code} />
        </div>
      </form>

    </div>
  );
}

export function AddSubscriptionDialog({
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
  return (
    <ActionDialog
      triggerLabel={t.addSubscription}
      hideTrigger={!canProvision}
      title={t.addSubscription}
      description={t.subscriptionDialogDescription}
      size="lg"
      closeLabel={locale === "ar" ? "إغلاق" : "Close"}
    >
      <AddSubscriptionForm locale={locale} customerId={customerId} plans={plans} canProvision embedded />
    </ActionDialog>
  );
}
