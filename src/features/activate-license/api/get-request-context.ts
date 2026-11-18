import "server-only";
import { getAuthorizedLicensingClient } from "@/entities/session/server";
import { isUuid, requireQuery } from "@/shared/lib/query-helpers";

export async function getActivationRequestContext(requestId: string) {
  if (!isUuid(requestId)) return null;
  const supabase = await getAuthorizedLicensingClient();
  const requestResult = await supabase
    .from("activation_requests")
    .select("request_id,license_id,device_activation_id,status,received_at,app_version")
    .eq("request_id", requestId)
    .maybeSingle();
  requireQuery(requestResult.error, "Activation request context");
  const request = requestResult.data;
  if (!request) return null;

  const licenseResult = await supabase
    .from("licenses")
    .select("id,customer_id,status")
    .eq("id", request.license_id)
    .maybeSingle();
  requireQuery(licenseResult.error, "Activation request license");
  const license = licenseResult.data;
  if (!license) return null;

  const [customerResult, deviceResult] = await Promise.all([
    supabase
      .from("customers")
      .select("id,business_name,customer_code,status")
      .eq("id", license.customer_id)
      .maybeSingle(),
    request.device_activation_id
      ? supabase
          .from("device_activations")
          .select("id,status,activation_type,activated_at")
          .eq("id", request.device_activation_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);
  requireQuery(customerResult.error, "Activation request customer");
  requireQuery(deviceResult.error, "Activation request device");

  return { request, license, customer: customerResult.data, device: deviceResult.data };
}
