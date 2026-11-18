import { CustomersPage } from "@/fsd/pages/customers";

export default function CustomersPageRoute({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <CustomersPage searchParams={searchParams} />;
}
