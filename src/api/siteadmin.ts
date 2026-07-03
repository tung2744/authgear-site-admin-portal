/**
 * Typed API functions for the Site Admin API.
 * Each function maps 1-to-1 with an operation in the OpenAPI spec:
 * https://raw.githubusercontent.com/authgear/authgear-server/refs/heads/main/docs/api/siteadmin-api.yaml
 */
import { apiRequest } from "./client";
import type {
  App,
  AppDetail,
  AppsListResponse,
  Collaborator,
  CollaboratorsListResponse,
  MessagingUsage,
  MonthlyActiveUsersUsage,
  PlansListResponse,
  SiteAdminAuditLogsListResponse,
  SiteAdminAuditLogDetail,
} from "./types";

// ─── Apps ─────────────────────────────────────────────────────────────────────

export interface ListAppsParams {
  page?: number;
  page_size?: number;
  app_id?: string;
  collaborator_search?: string;
  plan?: string;
  sort?: "created_at" | "mau" | "relevance";
  order?: "asc" | "desc";
}

export function listApps(params?: ListAppsParams): Promise<AppsListResponse> {
  const qs = new URLSearchParams();
  if (params?.page != null) qs.set("page", String(params.page));
  if (params?.page_size != null) qs.set("page_size", String(params.page_size));
  if (params?.app_id) qs.set("app_id", params.app_id);
  if (params?.collaborator_search)
    qs.set("collaborator_search", params.collaborator_search);
  if (params?.plan) qs.set("plan", params.plan);
  if (params?.sort) qs.set("sort", params.sort);
  if (params?.order) qs.set("order", params.order);
  const query = qs.toString();
  return apiRequest(`/api/v1/apps${query ? `?${query}` : ""}`);
}

export function getApp(appId: string): Promise<AppDetail> {
  return apiRequest(`/api/v1/apps/${encodeURIComponent(appId)}`);
}

// ─── Collaborators ────────────────────────────────────────────────────────────

export function listAppCollaborators(
  appId: string
): Promise<CollaboratorsListResponse> {
  return apiRequest(`/api/v1/apps/${encodeURIComponent(appId)}/collaborators`);
}

export function addAppCollaborator(
  appId: string,
  userEmail: string
): Promise<Collaborator> {
  return apiRequest(`/api/v1/apps/${encodeURIComponent(appId)}/collaborators`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_email: userEmail }),
  });
}

export function removeAppCollaborator(
  appId: string,
  collaboratorId: string
): Promise<Record<string, never>> {
  return apiRequest(
    `/api/v1/apps/${encodeURIComponent(appId)}/collaborators/${encodeURIComponent(collaboratorId)}`,
    { method: "DELETE" }
  );
}

export function promoteAppCollaborator(
  appId: string,
  collaboratorId: string
): Promise<Collaborator> {
  return apiRequest(
    `/api/v1/apps/${encodeURIComponent(appId)}/collaborators/${encodeURIComponent(collaboratorId)}/promote`,
    { method: "POST" }
  );
}

// ─── Usage ────────────────────────────────────────────────────────────────────

export function getAppMessagingUsage(
  appId: string,
  startDate: string,
  endDate: string
): Promise<MessagingUsage> {
  const qs = new URLSearchParams({ start_date: startDate, end_date: endDate });
  return apiRequest(
    `/api/v1/apps/${encodeURIComponent(appId)}/usage/messaging?${qs}`
  );
}

export function getAppMonthlyActiveUsers(
  appId: string,
  startYear: number,
  startMonth: number,
  endYear: number,
  endMonth: number
): Promise<MonthlyActiveUsersUsage> {
  const qs = new URLSearchParams({
    start_year: String(startYear),
    start_month: String(startMonth),
    end_year: String(endYear),
    end_month: String(endMonth),
  });
  return apiRequest(
    `/api/v1/apps/${encodeURIComponent(appId)}/usage/monthly-active-users?${qs}`
  );
}

// ─── Audit Logs ───────────────────────────────────────────────────────────────

export interface ListAuditLogsParams {
  page?: number;
  page_size?: number;
  affected_app_id?: string;
  order?: "asc" | "desc";
}

export function listAuditLogs(
  params?: ListAuditLogsParams
): Promise<SiteAdminAuditLogsListResponse> {
  const qs = new URLSearchParams();
  if (params?.page != null) qs.set("page", String(params.page));
  if (params?.page_size != null) qs.set("page_size", String(params.page_size));
  if (params?.affected_app_id)
    qs.set("affected_app_id", params.affected_app_id);
  if (params?.order) qs.set("order", params.order);
  const query = qs.toString();
  return apiRequest(`/api/v1/audit-logs${query ? `?${query}` : ""}`);
}

export function getAuditLog(id: string): Promise<SiteAdminAuditLogDetail> {
  return apiRequest(`/api/v1/audit-logs/${encodeURIComponent(id)}`);
}

// ─── Plans ────────────────────────────────────────────────────────────────────

export function listPlans(): Promise<PlansListResponse> {
  return apiRequest(`/api/v1/plans`);
}

export function changeAppPlan(appId: string, planName: string): Promise<App> {
  return apiRequest(`/api/v1/apps/${encodeURIComponent(appId)}/plan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ plan_name: planName }),
  });
}
