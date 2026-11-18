"use client";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { OneTimeLicenseCodePanel } from "@/entities/license";
import type { Locale } from "@/shared/i18n";
import { rotateLicenseCodeAction } from "../api/actions";
import type { CommercialActionState } from "../model/types";

const copy = {
  en: {
    created: "Created successfully.",
    updated: "Updated successfully.",
    invalidInput: "Review the entered values and try again.",
    forbidden: "Only an Owner or Admin can make this change.",
    unavailable: "The licensing operation could not be completed.",
    provisioning: "Creating…",
    subscriptionExists: "This customer already has a current subscription.",
    customerInactive: "The customer must be active before assigning a subscription.",
    planDisabled: "That plan is no longer enabled.",
    generateNewCode: "Generate New License Code",
    rotationConfirmTitle: "Replace the current License Code?",
    rotationConfirm: "The previous code will stop working immediately. The new code will be displayed once only.",
    confirmRotation: "Generate and replace code",
    cancel: "Cancel",
    notEligible: "This license has already entered activation and its code can no longer be replaced.",
  },
  ar: {
    created: "تم الإنشاء بنجاح.",
    updated: "تم التحديث بنجاح.",
    invalidInput: "راجع القيم المدخلة ثم حاول مرة أخرى.",
    forbidden: "يمكن للمالك أو المسؤول فقط تنفيذ هذا التغيير.",
    unavailable: "تعذر إكمال عملية التراخيص.",
    provisioning: "جارٍ الإنشاء…",
    subscriptionExists: "يوجد لهذا العميل اشتراك حالي بالفعل.",
    customerInactive: "يجب أن يكون العميل نشطاً قبل إسناد اشتراك.",
    planDisabled: "هذه الخطة لم تعد متاحة.",
    generateNewCode: "إنشاء كود ترخيص جديد",
    rotationConfirmTitle: "استبدال كود الترخيص الحالي؟",
    rotationConfirm: "سيتوقف الكود السابق عن العمل فوراً، وسيُعرض الكود الجديد مرة واحدة فقط.",
    confirmRotation: "إنشاء الكود واستبداله",
    cancel: "إلغاء",
    notEligible: "بدأ استخدام هذا الترخيص للتفعيل، لذلك لا يمكن استبدال الكود.",
  },
} as const;


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

export function RotateLicenseCodeForm({ locale, licenseId }: { locale: Locale; licenseId: string }) {
  const t = copy[locale];
  const [confirming, setConfirming] = useState(false);
  const [copied, setCopied] = useState(false);
  const [state, action] = useActionState(rotateLicenseCodeAction, INITIAL_COMMERCIAL_ACTION_STATE);

  if (state.status === "success" && state.licenseCode) {
    return <OneTimeLicenseCodePanel locale={locale} licenseCode={state.licenseCode} copied={copied} onCopied={() => setCopied(true)} />;
  }

  if (!confirming) {
    return <button type="button" onClick={() => setConfirming(true)} className="primary-button">{t.generateNewCode}</button>;
  }

  return (
    <form action={action} className="rounded-[14px] border border-amber-300 bg-[var(--warning-soft)]/50 p-5">
      <input type="hidden" name="licenseId" value={licenseId} />
      <h3 className="font-bold text-amber-950">{t.rotationConfirmTitle}</h3>
      <p className="mt-1 text-sm leading-6 text-amber-900">{t.rotationConfirm}</p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <SubmitButton idle={t.confirmRotation} pending={t.provisioning} />
        <button type="button" onClick={() => setConfirming(false)} className="secondary-button">{t.cancel}</button>
        <Feedback locale={locale} status={state.status} code={state.code} />
      </div>
    </form>
  );
}
