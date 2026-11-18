"use client";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { ActionDialog } from "@/shared/ui/action-dialog";
import type { Locale } from "@/shared/i18n";
import { createCustomerAction } from "../api/actions";
import type { CommercialActionState } from "../model/types";

const copy = {
  en: {
    notes: "Notes",
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
    subscriptionExists: "This customer already has a current subscription.",
    customerInactive: "The customer must be active before assigning a subscription.",
    planDisabled: "That plan is no longer enabled.",
    notEligible: "This license has already entered activation and its code can no longer be replaced.",
    customerDialogDescription: "Add the essential customer details now. Subscription and licensing can be configured from the customer profile afterwards.",
  },
  ar: {
    notes: "ملاحظات",
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
    subscriptionExists: "يوجد لهذا العميل اشتراك حالي بالفعل.",
    customerInactive: "يجب أن يكون العميل نشطاً قبل إسناد اشتراك.",
    planDisabled: "هذه الخطة لم تعد متاحة.",
    notEligible: "بدأ استخدام هذا الترخيص للتفعيل، لذلك لا يمكن استبدال الكود.",
    customerDialogDescription: "أضف بيانات العميل الأساسية الآن، ثم أدر الاشتراك والترخيص من ملف العميل بعد الإنشاء.",
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

export function CreateCustomerForm({ locale, embedded = false }: { locale: Locale; embedded?: boolean }) {
  const t = copy[locale];
  const [state, action] = useActionState(createCustomerAction, INITIAL_COMMERCIAL_ACTION_STATE);
  return (
    <form action={action} className={`${embedded ? "grid" : "surface-card grid p-5"} gap-5 sm:grid-cols-2 lg:grid-cols-3`}>
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
        {state.status === "success" && state.entityId ? <Link href={`/customers/${state.entityId}`} className="text-sm font-semibold text-[var(--primary)] hover:underline">{t.openCustomer}</Link> : null}
      </div>
    </form>
  );
}

export function CreateCustomerDialog({ locale }: { locale: Locale }) {
  const t = copy[locale];
  return (
    <ActionDialog
      triggerLabel={t.createCustomer}
      title={t.createCustomer}
      description={t.customerDialogDescription}
      size="xl"
    >
      <CreateCustomerForm locale={locale} embedded />
    </ActionDialog>
  );
}
