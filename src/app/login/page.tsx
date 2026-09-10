import { redirect } from "next/navigation";
import { getServerEnvironment } from "@/server/env";
import { getCurrentUser } from "@/server/auth/current-user";
import { sanitizeRedirectTarget } from "@/lib/redirect-target";
import { EnvironmentBadge } from "@/components/layout/environment-badge";
import { LoginForm } from "@/components/auth/login-form";
import { AuthNotConfigured } from "@/components/auth/auth-not-configured";
import { getLocale } from "@/server/i18n/get-locale";
import { getMessages } from "@/i18n/messages";

export default async function LoginPage(props: PageProps<"/login">) {
  const environment = getServerEnvironment();
  const locale = await getLocale();
  const messages = getMessages(locale);

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
    <div className="flex min-h-full flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <span className="text-sm font-semibold tracking-tight text-slate-900">
            {messages.appName}
          </span>
          <EnvironmentBadge environment={environment} locale={locale} />
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold text-slate-900">{messages.adminSignIn}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {messages.loginDescription}
          </p>

          <div className="mt-6">
            {authConfigured ? <LoginForm next={next} locale={locale} /> : <AuthNotConfigured locale={locale} />}
          </div>
        </div>
      </div>
    </div>
  );
}
