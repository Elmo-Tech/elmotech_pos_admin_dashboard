import { LicensesPage } from "@/fsd/pages/licenses";

export default function LicensesPageRoute({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <LicensesPage searchParams={searchParams} />;
}
