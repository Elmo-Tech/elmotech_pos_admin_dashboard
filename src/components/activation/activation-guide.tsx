import type { Locale } from "@/i18n/messages";

const guide = {
  ar: {
    title: "طريقة التفعيل",
    summary: "دليل التفعيل دون اتصال بالإنترنت",
    intro: "عملية التفعيل يدوية بين Elmotech والعميل. لا يرسل Elmo POS أي ملف تلقائيًا عبر الإنترنت.",
    requestFile: ".elmoreq = ملف طلب التفعيل الذي ينشئه جهاز العميل.",
    licenseFile: ".elmolic = ملف الترخيص الذي تصدره Elmotech.",
    phases: [
      { title: "ELMOTECH — إعداد الترخيص", start: 1, steps: ["إضافة العميل.", "اختيار الخطة.", "إنشاء الاشتراك.", "إنشاء كود الترخيص.", "إرسال كود الترخيص للعميل يدويًا."] },
      { title: "CUSTOMER — إنشاء الطلب", start: 6, steps: ["فتح Elmo POS على الجهاز المطلوب تفعيله.", "فتح شاشة طلب التفعيل.", "إدخال كود الترخيص.", "إنشاء ملف طلب التفعيل .elmoreq.", "إرسال ملف .elmoreq إلى Elmotech يدويًا."] },
      { title: "ELMOTECH — إصدار الترخيص", start: 11, steps: ["رفع .elmoreq من صفحة التفعيل.", "التحقق من الطلب.", "إصدار ملف الترخيص.", "تنزيل ملف .elmolic.", "إرسال .elmolic للعميل يدويًا."] },
      { title: "CUSTOMER — إكمال التفعيل", start: 16, steps: ["استيراد .elmolic داخل Elmo POS.", "يتم التحقق محليًا والتفعيل."] },
    ],
  },
  en: {
    title: "Activation Guide",
    summary: "Offline activation operating guide",
    intro: "Activation is a manual exchange between Elmotech and the customer. Elmo POS does not automatically send any file over the internet.",
    requestFile: ".elmoreq = the Activation Request File created by the customer’s device.",
    licenseFile: ".elmolic = the License File issued by Elmotech.",
    phases: [
      { title: "ELMOTECH — Prepare the license", start: 1, steps: ["Add the customer.", "Choose the plan.", "Create the subscription.", "Generate the License Code.", "Send the License Code to the customer manually."] },
      { title: "CUSTOMER — Create the request", start: 6, steps: ["Open Elmo POS on the device to activate.", "Open the Activation Request screen.", "Enter the License Code.", "Create the .elmoreq Activation Request File.", "Send the .elmoreq file to Elmotech manually."] },
      { title: "ELMOTECH — Issue the license", start: 11, steps: ["Upload .elmoreq on the Activation page.", "Verify the request.", "Issue the License File.", "Download the .elmolic file.", "Send .elmolic to the customer manually."] },
      { title: "CUSTOMER — Complete activation", start: 16, steps: ["Import .elmolic into Elmo POS.", "Elmo POS verifies it locally and activates the device."] },
    ],
  },
} as const;

export function ActivationGuide({ locale }: { locale: Locale }) {
  const content = guide[locale];
  return (
    <details className="group rounded-xl border border-blue-200 bg-white shadow-sm">
      <summary className="cursor-pointer list-none px-5 py-4 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-950">{content.title}</h2>
            <p className="mt-1 text-sm text-slate-600">{content.summary}</p>
          </div>
          <span aria-hidden="true" className="text-xl font-bold text-blue-700 group-open:rotate-45">+</span>
        </div>
      </summary>
      <div className="border-t border-blue-100 px-5 py-5 sm:px-6">
        <p className="max-w-4xl rounded-lg bg-blue-50 px-4 py-3 text-sm font-medium leading-6 text-blue-950">{content.intro}</p>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {content.phases.map((phase) => (
            <section key={phase.start} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-sm font-extrabold tracking-wide text-slate-900">{phase.title}</h3>
              <ol start={phase.start} className="mt-3 list-decimal space-y-2 ps-5 text-sm leading-6 text-slate-700">
                {phase.steps.map((step) => <li key={step}>{step}</li>)}
              </ol>
            </section>
          ))}
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <p className="rounded-lg border border-slate-200 px-4 py-3 text-sm text-slate-700"><bdi className="font-mono font-bold text-slate-950">.elmoreq</bdi><span className="mx-2">—</span>{content.requestFile.replace(/^\.elmoreq\s*=\s*/, "")}</p>
          <p className="rounded-lg border border-slate-200 px-4 py-3 text-sm text-slate-700"><bdi className="font-mono font-bold text-slate-950">.elmolic</bdi><span className="mx-2">—</span>{content.licenseFile.replace(/^\.elmolic\s*=\s*/, "")}</p>
        </div>
      </div>
    </details>
  );
}
