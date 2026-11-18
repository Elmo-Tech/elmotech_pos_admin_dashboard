import { LicenseDetailPage } from "@/fsd/pages/license-details";

export default function LicenseDetailPageRoute({ params }: { params: Promise<{ licenseId: string }> }) {
  return <LicenseDetailPage params={params} />;
}
