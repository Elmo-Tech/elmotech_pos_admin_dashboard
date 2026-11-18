import { SubscriptionsPage } from "@/fsd/pages/subscriptions";

export default function SubscriptionsPageRoute({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <SubscriptionsPage searchParams={searchParams} />;
}
