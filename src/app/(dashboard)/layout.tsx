import type { ReactNode } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { AccessDenied } from "@/components/auth/access-denied";
import { getServerEnvironment } from "@/server/env";
import { requireUser } from "@/server/auth/require-user";
import { requireAdminAccess } from "@/server/auth/require-admin-access";
import { getLocale } from "@/server/i18n/get-locale";
import { getMessages } from "@/i18n/messages";

/** Server-side enforcement point for verified identity plus admin RBAC. */
export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const environment = getServerEnvironment();
  const locale = await getLocale();
  const messages = getMessages(locale, environment);
  const access = await requireAdminAccess();

  if (!access.authorized) {
    if (access.reason === "unauthenticated") {
      await requireUser();
    }

    return <AccessDenied environment={environment} locale={locale} />;
  }

  return (
    <DashboardShell
      environment={environment}
      userEmail={access.context.email}
      userRole={{
        owner: messages.roleOwner,
        admin: messages.roleAdmin,
        support: messages.roleSupport,
        viewer: messages.roleViewer,
      }[access.context.role]}
      locale={locale}
    >
      {children}
    </DashboardShell>
  );
}
