export interface CommercialActionState {
  status: "idle" | "success" | "error";
  code?: string;
  entityId?: string;
  licenseCode?: string;
}
