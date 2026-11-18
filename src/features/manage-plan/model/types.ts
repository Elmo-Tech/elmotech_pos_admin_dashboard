export interface PlanActionState {
  status: "idle" | "success" | "error";
  code?: string;
  entityId?: string;
}

export interface PlanFormValue {
  id: string;
  name: string;
  duration_value: number | null;
  duration_unit: string | null;
  is_lifetime: boolean;
  price: number | null;
  currency: string | null;
  notes: string | null;
  is_enabled: boolean;
}
