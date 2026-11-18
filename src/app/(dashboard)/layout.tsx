import type { ReactNode } from "react";
import { DashboardShell } from "@/widgets/dashboard-shell";
import { AccessDenied } from "@/app/_ui/access-denied";
import { getServerEnvironment } from "@/shared/config/server";
import { requireUser } from "@/entities/session/server";
import { requireAdminAccess } from "@/entities/session/server";
import { getLocale } from "@/shared/i18n/server";
import { getMessages } from "@/shared/i18n";

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
