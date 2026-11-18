import "server-only";
import { getAuthorizedLicensingClient } from "@/entities/session/server";
import { isUuid, requireQuery } from "@/shared/lib/query-helpers";

export async function getLicenseDetail(licenseId: string) {
  if (!isUuid(licenseId)) return null;
  const supabase = await getAuthorizedLicensingClient();
  const licenseResult = await supabase
    .from("licenses")
    .select("id,customer_id,subscription_id,status,max_active_devices,highest_issued_revision,created_at,updated_at")
    .eq("id", licenseId)
    .maybeSingle();
  requireQuery(licenseResult.error, "License");
  if (!licenseResult.data) return null;
  const license = licenseResult.data;

  const [customerResult, subscriptionResult, devicesResult, requestsResult, issuancesResult, auditResult] =
    await Promise.all([
      supabase
        .from("customers")
        .select("id,business_name,customer_code,status")
        .eq("id", license.customer_id)
        .maybeSingle(),
      supabase
        .from("subscriptions")
        .select("id,plan_id,status,starts_at,expires_at,is_lifetime,plan_name_snapshot")
        .eq("id", license.subscription_id)
        .maybeSingle(),
      supabase
        .from("device_activations")
        .select("id,status,activated_at,last_issued_at,created_at")
        .eq("license_id", licenseId)
        .order("created_at", { ascending: false }),
      supabase
        .from("activation_requests")
        .select("request_id,device_activation_id,status,received_at,app_version")
        .eq("license_id", licenseId)
        .order("received_at", { ascending: false }),
      supabase
        .from("license_issuances")
        .select("id,activation_id,request_id,revision,format_version,key_id,algorithm,issued_at,expires_at,is_lifetime,license_document_sha256,reason")
        .eq("license_id", licenseId)
        .order("revision", { ascending: false }),
      supabase
        .from("audit_logs")
        .select("id,action,activation_id,issuance_id,metadata,created_at")
        .eq("license_id", licenseId)
        .order("created_at", { ascending: false })
        .limit(30),
    ]);
  requireQuery(customerResult.error, "License customer");
  requireQuery(subscriptionResult.error, "License subscription");
  requireQuery(devicesResult.error, "License devices");
  requireQuery(requestsResult.error, "License requests");
  requireQuery(issuancesResult.error, "License issuances");
  requireQuery(auditResult.error, "License audit history");
  const subscription = subscriptionResult.data;
  const planResult = subscription
    ? await supabase.from("plans").select("id,name,code").eq("id", subscription.plan_id).maybeSingle()
    : { data: null, error: null };
  requireQuery(planResult.error, "License plan");

  return {
    license,
    customer: customerResult.data,
    subscription,
    plan: planResult.data,
    devices: devicesResult.data ?? [],
    requests: requestsResult.data ?? [],
    issuances: issuancesResult.data ?? [],
    audit: auditResult.data ?? [],
  };
}
