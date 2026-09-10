import { signOutAction } from "@/server/auth/actions";
import { EnvironmentBadge } from "@/components/layout/environment-badge";
import type { AppEnvironment } from "@/types/environment";
import { getMessages, type Locale } from "@/i18n/messages";

export function AccessDenied({ environment, locale }: { environment: AppEnvironment; locale: Locale }) {
  const messages = getMessages(locale);
  return (
    <main className="flex min-h-full flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-lg border border-amber-200 bg-white p-8 text-center shadow-sm">
        <div className="flex justify-center">
          <EnvironmentBadge environment={environment} locale={locale} />
        </div>
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 text-lg text-amber-700">
          !
        </div>
        <h1 className="mt-4 text-lg font-semibold text-slate-900">{messages.accessDenied}</h1>
        <p className="mt-2 text-sm text-slate-600">
          {messages.accessDeniedDescription}
        </p>
        <form action={signOutAction} className="mt-6">
          <button
            type="submit"
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            {messages.signOut}
          </button>
        </form>
      </div>
    </main>
  );
}
