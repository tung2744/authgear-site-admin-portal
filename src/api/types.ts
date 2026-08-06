// TypeScript types generated from the Site Admin API spec:
// https://raw.githubusercontent.com/authgear/authgear-server/refs/heads/main/docs/api/siteadmin-api.yaml

export interface APIErrorDetail {
  name: string;
  reason: string;
  message: string;
  code: number;
  tracking_id?: string;
  info?: Record<string, unknown>;
}

export interface ErrorEnvelope {
  error: APIErrorDetail;
}

// ─── App ──────────────────────────────────────────────────────────────────────

export interface App {
  id: string;
  owner_email: string;
  plan: string;
  created_at: string; // RFC 3339
  last_month_mau: number;
}

export interface AppDetail extends App {
  user_count: number;
}

export interface AppsListResponse {
  apps: App[];
  total_count: number;
  page: number;
  page_size: number;
  owner_search_truncated: boolean;
}

// ─── Collaborators ────────────────────────────────────────────────────────────

export type CollaboratorRole = "owner" | "editor";

export interface Collaborator {
  id: string;
  app_id: string;
  user_id: string;
  user_email: string;
  role: CollaboratorRole;
  created_at: string; // RFC 3339
}

export interface CollaboratorsListResponse {
  collaborators: Collaborator[];
}

export interface AddCollaboratorRequest {
  user_email: string;
}

// ─── Usage ────────────────────────────────────────────────────────────────────

export interface MessagingUsage {
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  sms_north_america_count: number;
  sms_other_regions_count: number;
  whatsapp_north_america_count: number;
  whatsapp_other_regions_count: number;
}

export interface MonthlyActiveUsersCount {
  year: number;
  month: number; // 1–12
  count: number;
}

export interface MonthlyActiveUsersUsage {
  counts: MonthlyActiveUsersCount[];
}

// ─── Plans ────────────────────────────────────────────────────────────────────

export interface Plan {
  name: string;
}

export interface PlansListResponse {
  plans: Plan[];
}

export interface ChangeAppPlanRequest {
  plan_name: string;
}

// ─── Site Admin Audit Logs ────────────────────────────────────────────────────

export interface SiteAdminAuditLog {
  id: string;
  created_at: string; // RFC 3339
  activity_type: string;
  ip_address?: string;
  user_agent?: string;
  actor_user_id?: string;
  affected_app_id?: string;
}

export interface SiteAdminAuditLogsListResponse {
  audit_logs: SiteAdminAuditLog[];
  total_count: number;
  page: number;
  page_size: number;
}

export interface SiteAdminAuditLogDetail extends SiteAdminAuditLog {
  data: Record<string, unknown>;
}

// ─── Feature Config ───────────────────────────────────────────────────────────

/**
 * The JSON form of an app's `authgear.features.yaml`. The authoritative
 * schema lives server-side (`config.FeatureConfig` / `FeatureConfigSchema` in
 * pkg/lib/config) — this is intentionally a loose type since the UI only
 * reads a curated set of known paths defensively via JSON pointers (see
 * `src/pages/featureConfig/fieldRegistry.ts`); fields outside that list still
 * round-trip safely through the YAML editor without needing a type here.
 */
export type FeatureConfig = Record<string, unknown>;

export interface ValidationErrorCause {
  location: string; // RFC 6901 JSON pointer, "" means the document root
  kind: string;
  details?: Record<string, unknown>;
}

export interface AppFeatureConfigResponse {
  plan_name: string;
  effective_plan_feature_config: FeatureConfig;
  app_feature_config_yaml: string;
  effective_app_feature_config: FeatureConfig;
}

export interface UpdateAppFeatureConfigRequest {
  app_feature_config_yaml: string;
}

export interface PreviewAppFeatureConfigRequest {
  app_feature_config_yaml: string;
}
