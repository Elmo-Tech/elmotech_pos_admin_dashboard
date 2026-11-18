export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type Table<Row> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};

/**
 * The read surface used by this dashboard, derived from the authoritative
 * licensing migrations in the sibling elmotech_pos repository. Keep this
 * deliberately narrow until generated types are available for Staging.
 */
export interface Database {
  licensing: {
    Tables: {
      admin_users: Table<{
        user_id: string;
        role: string;
        status: string;
        created_at: string;
        updated_at: string;
        created_by: string | null;
        updated_by: string | null;
      }>;
      customers: Table<{
        id: string;
        customer_code: string;
        business_name: string;
        owner_name: string;
        email: string | null;
        phone: string;
        address: string | null;
        tax_id: string | null;
        notes: string | null;
        status: string;
        archived_at: string | null;
        archived_by: string | null;
        created_at: string;
        updated_at: string;
      }>;
      plans: Table<{
        id: string;
        code: string;
        name: string;
        duration_value: number | null;
        duration_unit: string | null;
        is_trial: boolean;
        is_lifetime: boolean;
        price: number | null;
        currency: string | null;
        notes: string | null;
        is_enabled: boolean;
        created_by: string | null;
        updated_by: string | null;
        created_at: string;
        updated_at: string;
      }>;
      subscriptions: Table<{
        id: string;
        customer_id: string;
        plan_id: string;
        status: string;
        starts_at: string;
        expires_at: string | null;
        is_lifetime: boolean;
        plan_name_snapshot: string;
        duration_value_snapshot: number | null;
        duration_unit_snapshot: string | null;
        price_snapshot: number | null;
        currency_snapshot: string | null;
        external_reference: string | null;
        notes: string | null;
        created_by: string | null;
        updated_by: string | null;
        created_at: string;
        updated_at: string;
      }>;
      licenses: Table<{
        id: string;
        license_key_hash: string;
        customer_id: string;
        subscription_id: string;
        status: string;
        max_active_devices: number;
        highest_issued_revision: number;
        notes: string | null;
        created_by: string | null;
        updated_by: string | null;
        created_at: string;
        updated_at: string;
      }>;
      activation_requests: Table<{
        request_id: string;
        license_id: string;
        device_activation_id: string | null;
        request_sha256: string;
        device_fingerprint_hash: string;
        device_public_key_hash: string;
        received_at: string;
        consumed_at: string | null;
        status: string;
        app_version: string;
        protocol_version: number;
        created_by: string | null;
        updated_at: string;
      }>;
      device_activations: Table<{
        id: string;
        license_id: string;
        device_fingerprint_hash: string;
        device_public_key: string;
        device_public_key_hash: string;
        first_request_id: string;
        activated_at: string | null;
        last_issued_at: string | null;
        status: string;
        activation_type: string;
        notes: string | null;
        created_at: string;
        updated_at: string;
      }>;
      license_issuances: Table<{
        id: string;
        license_id: string;
        subscription_id: string;
        activation_id: string;
        revision: number;
        request_id: string | null;
        format_version: number;
        key_id: string;
        algorithm: string;
        issued_at: string;
        expires_at: string | null;
        is_lifetime: boolean;
        payload_sha256: string;
        signature_sha256: string;
        license_document_sha256: string;
        license_document: string;
        reason: string;
        renewal_operation_id: string | null;
        created_by: string | null;
        created_at: string;
      }>;
      audit_logs: Table<{
        id: string;
        actor_user_id: string | null;
        action: string;
        customer_id: string | null;
        subscription_id: string | null;
        license_id: string | null;
        activation_id: string | null;
        issuance_id: string | null;
        metadata: Json;
        created_at: string;
      }>;
    };
    Views: Record<string, never>;
    Functions: {
      create_plan: {
        Args: {
          p_name: string;
          p_duration_value: number | null;
          p_duration_unit: string | null;
          p_is_lifetime: boolean;
          p_price: number | null;
          p_currency: string | null;
          p_is_enabled: boolean;
          p_notes: string | null;
          p_actor_user_id: string;
        };
        Returns: Json;
      };
      update_plan: {
        Args: {
          p_plan_id: string;
          p_name: string;
          p_duration_value: number | null;
          p_duration_unit: string | null;
          p_is_lifetime: boolean;
          p_price: number | null;
          p_currency: string | null;
          p_is_enabled: boolean;
          p_notes: string | null;
          p_actor_user_id: string;
        };
        Returns: Json;
      };
      create_customer: {
        Args: {
          p_business_name: string;
          p_owner_name: string;
          p_phone: string;
          p_email: string | null;
          p_address: string | null;
          p_tax_id: string | null;
          p_notes: string | null;
          p_status: string;
          p_actor_user_id: string;
        };
        Returns: Json;
      };
      provision_initial_subscription: {
        Args: {
          p_customer_id: string;
          p_plan_id: string;
          p_starts_at: string;
          p_license_key_hash: string;
          p_actor_user_id: string;
        };
        Returns: Json;
      };
      rotate_unused_license_key_hash: {
        Args: {
          p_license_id: string;
          p_new_license_key_hash: string;
          p_actor_user_id: string;
        };
        Returns: Json;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
