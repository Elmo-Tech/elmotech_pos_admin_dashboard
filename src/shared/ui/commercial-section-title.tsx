import type { Locale } from "@/shared/i18n";

const copy = {
  en: {
    createPlan: "Create plan",
    createCustomer: "Create customer",
    addSubscription: "Add subscription and initial license",
  },
  ar: {
    createPlan: "إنشاء خطة",
    createCustomer: "إنشاء عميل",
    addSubscription: "إضافة اشتراك وترخيص أولي",
  },
} as const;


export function CommercialSectionTitle({ locale, kind }: { locale: Locale; kind: "plan" | "customer" | "subscription" }) {
  const t = copy[locale];
  return <>{kind === "plan" ? t.createPlan : kind === "customer" ? t.createCustomer : t.addSubscription}</>;
}
