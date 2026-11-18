import { AuditLogsPage } from "@/fsd/pages/audit-logs";

export default function AuditLogsPageRoute({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <AuditLogsPage searchParams={searchParams} />;
}
