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
import { BadgeCheck, ShieldCheck } from "lucide-react";

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
    <main className="grid min-h-dvh flex-1 lg:grid-cols-[minmax(320px,0.8fr)_1.2fr]">
      <section className="hidden flex-col justify-between bg-[var(--side-bg)] p-12 text-white lg:flex">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-[10px] bg-[var(--primary)]"><BadgeCheck aria-hidden="true" size={24} /></span>
          <div><p className="text-lg font-semibold">Elmo POS</p><p className="text-sm text-[var(--side-muted)]">{messages.licenseOperations}</p></div>
        </div>
        <div className="max-w-md">
          <ShieldCheck aria-hidden="true" size={40} className="text-orange-300" strokeWidth={1.5} />
          <h2 className="mt-6 text-3xl font-semibold leading-tight">{messages.appName}</h2>
          <p className="mt-3 text-sm leading-7 text-slate-400">{messages.loginDescription}</p>
        </div>
        <p className="text-xs text-[var(--side-muted)]">Elmotech · Secure licensing operations</p>
      </section>

      <section className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center justify-between lg:hidden">
            <div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-[10px] bg-[var(--primary)] text-white"><BadgeCheck aria-hidden="true" size={21} /></span><span className="font-semibold">Elmo POS</span></div>
            <EnvironmentBadge environment={environment} locale={locale} />
          </div>
          <div className="mb-6 hidden justify-end lg:flex"><EnvironmentBadge environment={environment} locale={locale} /></div>
          <div className="surface-card p-6 sm:p-8">
          <h1 className="text-2xl font-bold text-[var(--text)]">{messages.adminSignIn}</h1>
          <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
            {messages.loginDescription}
          </p>

          <div className="mt-6">
            {authConfigured ? <LoginForm next={next} locale={locale} /> : <AuthNotConfigured locale={locale} />}
          </div>
          </div>
        </div>
      </section>
    </main>
  );
}
