import type { StatusTone } from "@/components/ui/status-badge";
import type { Locale } from "@/i18n/messages";

export function formatDate(value: string | null, locale: Locale = "en"): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-GB", {
    dateStyle: "medium",
    timeZone: "Africa/Cairo",
  }).format(new Date(value));
}

export function formatDateTime(value: string | null, locale: Locale = "en"): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Cairo",
  }).format(new Date(value));
}

export function humanize(value: string): string {
  return value
    .split(/[._]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

const ARABIC_TERMS: Record<string, string> = {
  active: "نشط",
  pending: "معلّق",
  validated: "تم التحقق",
  consumed: "مُستخدم",
  rejected: "مرفوض",
  expired: "منتهي",
  suspended: "موقوف",
  archived: "مؤرشف",
  draft: "مسودة",
  cancelled: "ملغي",
  replaced: "مستبدل",
  revoked: "ملغي الصلاحية",
  deactivated: "غير نشط",
  enabled: "متاح",
  disabled: "غير متاح",
  issued: "تم الإصدار",
  activation: "تفعيل",
  renewal: "تجديد",
  replacement: "استبدال",
  administrative: "إداري",
  initial: "أولي",
  none: "لا يوجد",
  day: "يوم",
  days: "أيام",
  month: "شهر",
  months: "أشهر",
  year: "سنة",
  years: "سنوات",
  customer_created: "إنشاء عميل",
  subscription_created: "إنشاء اشتراك",
  license_created: "إنشاء ترخيص",
  activation_request_recorded: "تسجيل طلب تفعيل",
  license_issued: "إصدار ملف ترخيص",
  device_activated: "تفعيل جهاز",
  "activation.request_validated": "التحقق من طلب تفعيل",
  "license.issued": "إصدار ملف ترخيص",
  "plan.created": "إنشاء خطة",
  "plan.updated": "تعديل خطة",
  "customer.created": "إنشاء عميل",
  "subscription.created": "إنشاء اشتراك",
  "license.created": "إنشاء ترخيص",
  "license.code_rotated": "استبدال كود الترخيص",
};

export function localizeTerm(value: string, locale: Locale): string {
  return locale === "ar" ? ARABIC_TERMS[value.toLowerCase()] ?? value : humanize(value);
}

export function statusTone(status: string): StatusTone {
  if (["active", "consumed", "enabled", "issued"].includes(status)) return "success";
  if (["pending", "validated", "draft", "suspended"].includes(status)) return "warning";
  if (["rejected", "expired", "revoked", "disabled", "cancelled"].includes(status)) {
    return "danger";
  }
  return "neutral";
}

export function formatMoney(
  value: number | null,
  currency: string | null,
  locale: Locale = "en",
): string {
  if (value === null || !currency) return "—";
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-GB", {
    style: "currency",
    currency,
  }).format(value);
}

export function formatNumber(value: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-GB").format(value);
}
