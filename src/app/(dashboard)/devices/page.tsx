import { DevicesPage } from "@/fsd/pages/devices";

export default function DevicesPageRoute({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <DevicesPage searchParams={searchParams} />;
}
