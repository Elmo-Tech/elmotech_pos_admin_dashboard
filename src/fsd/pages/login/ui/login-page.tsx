import "server-only";
import { redirect } from "next/navigation";
import { getServerEnvironment } from "@/shared/config/server";
import { getCurrentUser } from "@/entities/session/server";
import { sanitizeRedirectTarget } from "@/shared/lib/redirect-target";
import { EnvironmentBadge } from "@/shared/ui/environment-badge";
import { LoginForm } from "@/features/sign-in";
import { AuthNotConfigured } from "./auth-not-configured";
import { getLocale } from "@/shared/i18n/server";
import { getMessages } from "@/shared/i18n";
import { ShieldCheck, Check } from "lucide-react";
import Image from "next/image";
import { LoginLanguage } from "./login-language";

export async function LoginPage(props: PageProps<"/login">) {
  const environment = getServerEnvironment();
  const locale = await getLocale();
  const messages = getMessages(locale, environment);

  const searchParams = await props.searchParams;
  const rawNext = searchParams.next;
  const next = sanitizeRedirectTarget(Array.isArray(rawNext) ? rawNext[0] : rawNext);

  let authConfigured = true;
  let currentUser = null;
  try {
    currentUser = await getCurrentUser();
  } catch {
    authConfigured = false;
  }

  if (currentUser) {
    redirect(next);
  }

  return (
    <main className="login-workspace grid min-h-dvh flex-1 lg:grid-cols-[minmax(320px,1fr)_1fr]">
      <section className="login-story hidden flex-col justify-between gap-12 p-12 text-white lg:flex xl:p-16">
        <div><Image src="/brand/elmodeer-on-ink.png" width={150} height={61} alt={locale === "ar" ? "المدير" : "Elmodeer"} priority /><p className="mt-4 text-xs text-indigo-200">{messages.licenseOperations}</p></div>
        <div className="max-w-md">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-indigo-100"><ShieldCheck size={15} aria-hidden="true" />{locale === "ar" ? "مساحة عمل الفريق" : "YOUR TEAM WORKSPACE"}</span>
          <h2>{locale === "ar" ? <>كل عملية،<br />تحت سيطرتك.</> : <>Every operation.<br />Under control.</>}</h2>
          <p className="mt-5 max-w-sm text-sm leading-7 text-indigo-100/75">{locale === "ar" ? "إدارة العملاء والاشتراكات والتراخيص، من أول تفعيل لآخر تجديد." : "Customers, subscriptions, and licenses. From the first activation to the next renewal."}</p>
          <div className="mt-8 space-y-3">{(locale === "ar" ? ["رؤية واضحة لعملياتك", "صلاحيات تناسب دورك", "كل نشاط موثّق في مكان واحد"] : ["A clear view of operations", "Access tailored to your role", "A traceable activity history"]).map(text => <p key={text} className="flex items-center gap-3 text-xs text-indigo-100"><Check size={15} aria-hidden="true" className="text-[#8bddb1]" />{text}</p>)}</div>
        </div>
        <p className="text-xs text-[var(--side-muted)]">Elmotech · Secure licensing operations</p>
      </section>

      <section className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-6 flex items-center justify-between gap-3"><Image src="/brand/elmodeer-color.png" width={100} height={41} alt={locale === "ar" ? "المدير" : "Elmodeer"} className="lg:invisible" /><LoginLanguage locale={locale} /></div>
          <div className="surface-card p-6 sm:p-8">
          <div className="mb-5"><EnvironmentBadge environment={environment} locale={locale} /></div>
          <h1 className="text-2xl font-bold text-[var(--text)]">{messages.adminSignIn}</h1>
          <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
            {messages.loginDescription}
          </p>

          <div className="mt-6">
            {authConfigured ? <LoginForm next={next} locale={locale} /> : <AuthNotConfigured locale={locale} />}
          </div>
          </div>
          <p className="mt-6 text-center text-[11px] leading-6 text-[var(--text-muted)]">{locale === "ar" ? "دخول آمن للمستخدمين المصرّح لهم فقط." : "Secure access for authorized team members only."}</p>
        </div>
      </section>
    </main>
  );
}
