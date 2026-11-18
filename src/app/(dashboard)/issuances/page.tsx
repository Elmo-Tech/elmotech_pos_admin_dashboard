import { IssuancesPage } from "@/fsd/pages/issuances";

export default function IssuancesPageRoute({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <IssuancesPage searchParams={searchParams} />;
}
