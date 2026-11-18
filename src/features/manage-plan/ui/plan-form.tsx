"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { ActionDialog, DialogCloseButton } from "@/shared/ui/action-dialog";
import type { Locale } from "@/shared/i18n";
import { savePlanAction } from "../api/save-plan";
import type { PlanActionState, PlanFormValue } from "../model/types";

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
    subscriptionExists: "This customer already has a current subscription.",
    customerInactive: "The customer must be active before assigning a subscription.",
    planDisabled: "That plan is no longer enabled.",
    lifetimeExplanation: "This plan does not expire.",
    cancel: "Cancel",
    notEligible: "This license has already entered activation and its code can no longer be replaced.",
    planDialogDescription: "Define a reusable commercial plan without leaving the plans workspace.",
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
    subscriptionExists: "يوجد لهذا العميل اشتراك حالي بالفعل.",
    customerInactive: "يجب أن يكون العميل نشطاً قبل إسناد اشتراك.",
    planDisabled: "هذه الخطة لم تعد متاحة.",
    lifetimeExplanation: "هذه الخطة لا تنتهي.",
    cancel: "إلغاء",
    notEligible: "بدأ استخدام هذا الترخيص للتفعيل، لذلك لا يمكن استبدال الكود.",
    planDialogDescription: "أنشئ خطة تجارية قابلة لإعادة الاستخدام دون مغادرة شاشة الخطط.",
  },
} as const;


const inputClass = "mt-1.5 w-full px-3 py-2 text-sm text-[var(--text)]";
const labelClass = "text-[13px] font-medium text-[var(--text)]";
const INITIAL_PLAN_ACTION_STATE: PlanActionState = { status: "idle" };

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

export function PlanForm({ locale, plan, embedded = false }: { locale: Locale; plan?: PlanFormValue; embedded?: boolean }) {
  const t = copy[locale];
  const [state, action] = useActionState(savePlanAction, INITIAL_PLAN_ACTION_STATE);
  const [isLifetime, setIsLifetime] = useState(plan?.is_lifetime ?? false);
  const [durationValue, setDurationValue] = useState(plan?.duration_value?.toString() ?? "");
  return (
    <form action={action} className={embedded ? "plan-form" : "surface-card plan-form p-5"}>
      {plan ? <input type="hidden" name="planId" value={plan.id} /> : null}
      <div className="form-fields">
      <fieldset className="form-section">
        <legend>{locale === "ar" ? "01 / بيانات الخطة" : "01 / Plan details"}</legend>
        <label className={`${labelClass} sm:col-span-2`}>{t.planName} <span aria-hidden="true" className="text-[var(--primary)]">*</span><input className={inputClass} name="name" defaultValue={plan?.name} maxLength={120} required /></label>
        <label className={labelClass}>{t.price}<input className={inputClass} name="price" type="number" min="0" step="0.01" defaultValue={plan?.price ?? ""} /></label>
        <label className={labelClass}>{t.currency}<input className={`${inputClass} uppercase`} name="currency" defaultValue={plan?.currency ?? "EGP"} minLength={3} maxLength={3} /></label>
      </fieldset>
      <fieldset className="form-section">
        <legend>{locale === "ar" ? "02 / مدة الصلاحية" : "02 / Validity"}</legend>
        <label className="choice-card sm:col-span-2"><input name="isLifetime" type="checkbox" checked={isLifetime} onChange={event => { setIsLifetime(event.target.checked); if (event.target.checked) setDurationValue(""); }} /><span><span className="block font-semibold">{t.lifetime}</span><span className="mt-1 block text-xs text-[var(--text-muted)]">{locale === "ar" ? "فعّلها لخطة لا ترتبط بتاريخ انتهاء." : "Enable for a plan with no expiration date."}</span></span></label>
        <div className={`contents ${isLifetime ? "[&>label]:opacity-50" : ""}`}>
          <label className={labelClass}>{t.durationValue} <span aria-hidden="true" className="text-[var(--primary)]">*</span><input className={inputClass} name="durationValue" type="number" min="1" step="1" value={durationValue} onChange={event => setDurationValue(event.target.value)} disabled={isLifetime} required={!isLifetime} /></label>
          <label className={labelClass}>{t.durationUnit}<select className={inputClass} name="durationUnit" defaultValue={plan?.duration_unit ?? "months"} disabled={isLifetime} required={!isLifetime}><option value="days">{t.days}</option><option value="months">{t.months}</option></select></label>
        </div>
        {isLifetime ? <p role="status" className="rounded-lg bg-[var(--info-soft)] px-3 py-2 text-xs text-[var(--info)] sm:col-span-2">{t.lifetimeExplanation}</p> : null}
      </fieldset>
      <fieldset className="form-section border-b-0 pb-0">
        <legend>{locale === "ar" ? "03 / الإتاحة والملاحظات" : "03 / Availability & notes"}</legend>
        <label className="choice-card sm:col-span-2"><input name="isEnabled" type="checkbox" defaultChecked={plan?.is_enabled ?? true} /><span>{t.enabled}</span></label>
        <label className={`${labelClass} sm:col-span-2`}>{t.notes}<textarea className={inputClass} name="notes" defaultValue={plan?.notes ?? ""} maxLength={2000} rows={2} /></label>
      </fieldset>
      </div>
      <div className="form-footer">
        <div className="form-feedback"><Feedback locale={locale} status={state.status} code={state.code} /></div>
        {embedded ? <DialogCloseButton>{t.cancel}</DialogCloseButton> : null}
        <SubmitButton idle={t.save} pending={t.saving} />
      </div>
    </form>
  );
}

export function PlanDialog({ locale, plan }: { locale: Locale; plan?: PlanFormValue }) {
  const t = copy[locale];
  return (
    <ActionDialog
      triggerLabel={plan ? t.editPlan : t.createPlan}
      title={plan ? t.editPlan : t.createPlan}
      description={t.planDialogDescription}
      kind={plan ? "edit" : "create"}
      size="xl"
      closeLabel={locale === "ar" ? "إغلاق" : "Close"}
      triggerClassName={plan ? "min-h-9 px-3 py-1.5 text-xs" : undefined}
    >
      <PlanForm locale={locale} plan={plan} embedded />
    </ActionDialog>
  );
}
