import { ActivationRequestsPage } from "@/fsd/pages/activation-requests";

export default function ActivationRequestsPageRoute({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <ActivationRequestsPage searchParams={searchParams} />;
}
