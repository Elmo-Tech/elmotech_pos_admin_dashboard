import { PlansPage } from "@/fsd/pages/plans";

export default function PlansRoute({ searchParams }: PageProps<"/plans">) {
  return <PlansPage searchParams={searchParams} />;
}
