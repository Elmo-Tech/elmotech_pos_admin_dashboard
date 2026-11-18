import { CustomerDetailPage } from "@/fsd/pages/customer-details";

export default function CustomerDetailPageRoute({ params }: { params: Promise<{ customerId: string }> }) {
  return <CustomerDetailPage params={params} />;
}
