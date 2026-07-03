import * as siteadmin from "../siteadmin";
import { apiRequest } from "../client";

jest.mock("../../config", () => ({
  SITEADMIN_API_URL: "https://api.example.com",
}));
jest.mock("@authgear/web");
jest.mock("../client");

const mockApiRequest = apiRequest as jest.MockedFunction<typeof apiRequest>;

describe("siteadmin API functions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("listApps", () => {
    it("should call apiRequest with correct path when no params", async () => {
      mockApiRequest.mockResolvedValue({
        apps: [],
        total_count: 0,
        page: 1,
        page_size: 20,
        owner_search_truncated: false,
      });

      await siteadmin.listApps();

      expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/apps");
    });

    it("should include pagination parameters in query string", async () => {
      mockApiRequest.mockResolvedValue({
        apps: [],
        total_count: 0,
        page: 2,
        page_size: 50,
        owner_search_truncated: false,
      });

      await siteadmin.listApps({ page: 2, page_size: 50 });

      expect(mockApiRequest).toHaveBeenCalledWith(
        "/api/v1/apps?page=2&page_size=50"
      );
    });

    it("should include filter parameters", async () => {
      mockApiRequest.mockResolvedValue({
        apps: [],
        total_count: 0,
        page: 1,
        page_size: 20,
        owner_search_truncated: false,
      });

      await siteadmin.listApps({
        app_id: "my-app",
        collaborator_search: "user@example.com",
        plan: "pro",
      });

      expect(mockApiRequest).toHaveBeenCalledWith(
        "/api/v1/apps?app_id=my-app&collaborator_search=user%40example.com&plan=pro"
      );
    });

    it("should include sort and order parameters", async () => {
      mockApiRequest.mockResolvedValue({
        apps: [],
        total_count: 0,
        page: 1,
        page_size: 20,
        owner_search_truncated: false,
      });

      await siteadmin.listApps({ sort: "mau", order: "desc" });

      expect(mockApiRequest).toHaveBeenCalledWith(
        "/api/v1/apps?sort=mau&order=desc"
      );
    });

    it("should support relevance sort with collaborator_search", async () => {
      mockApiRequest.mockResolvedValue({
        apps: [],
        total_count: 0,
        page: 1,
        page_size: 20,
        owner_search_truncated: false,
      });

      await siteadmin.listApps({
        collaborator_search: "alice",
        sort: "relevance",
      });

      expect(mockApiRequest).toHaveBeenCalledWith(
        "/api/v1/apps?collaborator_search=alice&sort=relevance"
      );
    });

    it("should return apps list response", async () => {
      const mockResponse = {
        apps: [
          {
            id: "app1",
            owner_email: "owner@example.com",
            plan: "basic",
            created_at: "2024-01-01T00:00:00Z",
            last_month_mau: 100,
          },
        ],
        total_count: 1,
        page: 1,
        page_size: 20,
        owner_search_truncated: false,
      };
      mockApiRequest.mockResolvedValue(mockResponse);

      const result = await siteadmin.listApps();

      expect(result).toEqual(mockResponse);
    });
  });

  describe("getApp", () => {
    it("should call apiRequest with encoded app ID", async () => {
      const mockResponse = {
        id: "app-123",
        owner_email: "owner@example.com",
        plan: "pro",
        created_at: "2024-01-01T00:00:00Z",
        last_month_mau: 1000,
        user_count: 5000,
      };
      mockApiRequest.mockResolvedValue(mockResponse);

      await siteadmin.getApp("app-123");

      expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/apps/app-123");
    });

    it("should URL-encode app ID with special characters", async () => {
      mockApiRequest.mockResolvedValue({
        id: "app/with/slashes",
        owner_email: "owner@example.com",
        plan: "basic",
        created_at: "2024-01-01T00:00:00Z",
        last_month_mau: 50,
        user_count: 200,
      });

      await siteadmin.getApp("app/with/slashes");

      expect(mockApiRequest).toHaveBeenCalledWith(
        "/api/v1/apps/app%2Fwith%2Fslashes"
      );
    });

    it("should return app detail", async () => {
      const mockResponse = {
        id: "app1",
        owner_email: "owner@example.com",
        plan: "pro",
        created_at: "2024-01-01T00:00:00Z",
        last_month_mau: 500,
        user_count: 2000,
      };
      mockApiRequest.mockResolvedValue(mockResponse);

      const result = await siteadmin.getApp("app1");

      expect(result).toEqual(mockResponse);
    });
  });

  describe("listAppCollaborators", () => {
    it("should call apiRequest with correct path", async () => {
      mockApiRequest.mockResolvedValue({ collaborators: [] });

      await siteadmin.listAppCollaborators("app1");

      expect(mockApiRequest).toHaveBeenCalledWith(
        "/api/v1/apps/app1/collaborators"
      );
    });

    it("should encode app ID in URL", async () => {
      mockApiRequest.mockResolvedValue({ collaborators: [] });

      await siteadmin.listAppCollaborators("app:with:colons");

      expect(mockApiRequest).toHaveBeenCalledWith(
        "/api/v1/apps/app%3Awith%3Acolons/collaborators"
      );
    });

    it("should return collaborators list", async () => {
      const mockResponse = {
        collaborators: [
          {
            id: "collab1",
            app_id: "app1",
            user_id: "user1",
            user_email: "collab@example.com",
            role: "editor" as const,
            created_at: "2024-01-01T00:00:00Z",
          },
        ],
      };
      mockApiRequest.mockResolvedValue(mockResponse);

      const result = await siteadmin.listAppCollaborators("app1");

      expect(result).toEqual(mockResponse);
    });
  });

  describe("addAppCollaborator", () => {
    it("should POST with correct body", async () => {
      mockApiRequest.mockResolvedValue({
        id: "collab1",
        app_id: "app1",
        user_id: "user1",
        user_email: "newuser@example.com",
        role: "editor",
        created_at: "2024-01-01T00:00:00Z",
      });

      await siteadmin.addAppCollaborator("app1", "newuser@example.com");

      expect(mockApiRequest).toHaveBeenCalledWith(
        "/api/v1/apps/app1/collaborators",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_email: "newuser@example.com" }),
        }
      );
    });

    it("should encode app ID in URL", async () => {
      mockApiRequest.mockResolvedValue({
        id: "collab1",
        app_id: "app/with/slashes",
        user_id: "user1",
        user_email: "newuser@example.com",
        role: "editor",
        created_at: "2024-01-01T00:00:00Z",
      });

      await siteadmin.addAppCollaborator("app/with/slashes", "new@example.com");

      expect(mockApiRequest).toHaveBeenCalledWith(
        "/api/v1/apps/app%2Fwith%2Fslashes/collaborators",
        expect.objectContaining({ method: "POST" })
      );
    });

    it("should return collaborator object", async () => {
      const mockResponse = {
        id: "collab1",
        app_id: "app1",
        user_id: "user1",
        user_email: "newuser@example.com",
        role: "editor" as const,
        created_at: "2024-01-01T00:00:00Z",
      };
      mockApiRequest.mockResolvedValue(mockResponse);

      const result = await siteadmin.addAppCollaborator(
        "app1",
        "new@example.com"
      );

      expect(result).toEqual(mockResponse);
    });
  });

  describe("removeAppCollaborator", () => {
    it("should DELETE with correct path", async () => {
      mockApiRequest.mockResolvedValue({});

      await siteadmin.removeAppCollaborator("app1", "collab1");

      expect(mockApiRequest).toHaveBeenCalledWith(
        "/api/v1/apps/app1/collaborators/collab1",
        { method: "DELETE" }
      );
    });

    it("should encode both app ID and collaborator ID", async () => {
      mockApiRequest.mockResolvedValue({});

      await siteadmin.removeAppCollaborator("app/1", "collab/1");

      expect(mockApiRequest).toHaveBeenCalledWith(
        "/api/v1/apps/app%2F1/collaborators/collab%2F1",
        { method: "DELETE" }
      );
    });
  });

  describe("promoteAppCollaborator", () => {
    it("should POST to the promote endpoint with the correct path", async () => {
      const mockResponse = {
        id: "collab1",
        user_email: "new-owner@example.com",
        role: "owner",
        invited_at: "2024-01-01T00:00:00Z",
      };
      mockApiRequest.mockResolvedValue(mockResponse);

      const result = await siteadmin.promoteAppCollaborator("app1", "collab1");

      expect(mockApiRequest).toHaveBeenCalledWith(
        "/api/v1/apps/app1/collaborators/collab1/promote",
        { method: "POST" }
      );
      expect(result).toEqual(mockResponse);
    });

    it("should encode both app ID and collaborator ID", async () => {
      mockApiRequest.mockResolvedValue({});

      await siteadmin.promoteAppCollaborator("app/1", "collab/1");

      expect(mockApiRequest).toHaveBeenCalledWith(
        "/api/v1/apps/app%2F1/collaborators/collab%2F1/promote",
        { method: "POST" }
      );
    });
  });

  describe("getAppMessagingUsage", () => {
    it("should call apiRequest with date range parameters", async () => {
      mockApiRequest.mockResolvedValue({
        start_date: "2024-01-01",
        end_date: "2024-01-31",
        sms_north_america_count: 100,
        sms_other_regions_count: 50,
        whatsapp_north_america_count: 30,
        whatsapp_other_regions_count: 20,
      });

      await siteadmin.getAppMessagingUsage("app1", "2024-01-01", "2024-01-31");

      expect(mockApiRequest).toHaveBeenCalledWith(
        "/api/v1/apps/app1/usage/messaging?start_date=2024-01-01&end_date=2024-01-31"
      );
    });

    it("should return messaging usage data", async () => {
      const mockResponse = {
        start_date: "2024-01-01",
        end_date: "2024-01-31",
        sms_north_america_count: 100,
        sms_other_regions_count: 50,
        whatsapp_north_america_count: 30,
        whatsapp_other_regions_count: 20,
      };
      mockApiRequest.mockResolvedValue(mockResponse);

      const result = await siteadmin.getAppMessagingUsage(
        "app1",
        "2024-01-01",
        "2024-01-31"
      );

      expect(result).toEqual(mockResponse);
    });
  });

  describe("getAppMonthlyActiveUsers", () => {
    it("should call apiRequest with year and month parameters", async () => {
      mockApiRequest.mockResolvedValue({ counts: [] });

      await siteadmin.getAppMonthlyActiveUsers("app1", 2024, 1, 2024, 3);

      expect(mockApiRequest).toHaveBeenCalledWith(
        "/api/v1/apps/app1/usage/monthly-active-users?start_year=2024&start_month=1&end_year=2024&end_month=3"
      );
    });

    it("should return monthly active users data", async () => {
      const mockResponse = {
        counts: [
          { year: 2024, month: 1, count: 100 },
          { year: 2024, month: 2, count: 150 },
          { year: 2024, month: 3, count: 200 },
        ],
      };
      mockApiRequest.mockResolvedValue(mockResponse);

      const result = await siteadmin.getAppMonthlyActiveUsers(
        "app1",
        2024,
        1,
        2024,
        3
      );

      expect(result).toEqual(mockResponse);
    });
  });

  describe("listPlans", () => {
    it("should call apiRequest with correct path", async () => {
      mockApiRequest.mockResolvedValue({ plans: [] });

      await siteadmin.listPlans();

      expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/plans");
    });

    it("should return plans list", async () => {
      const mockResponse = {
        plans: [
          { name: "basic", display_name: "Basic", price: 0 },
          { name: "pro", display_name: "Pro", price: 99 },
        ],
      };
      mockApiRequest.mockResolvedValue(mockResponse);

      const result = await siteadmin.listPlans();

      expect(result).toEqual(mockResponse);
    });
  });

  describe("listAuditLogs", () => {
    it("should call apiRequest with no query string when no params", async () => {
      mockApiRequest.mockResolvedValue({
        audit_logs: [],
        total_count: 0,
        page: 1,
        page_size: 20,
      });

      await siteadmin.listAuditLogs();

      expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/audit-logs");
    });

    it("should include pagination parameters", async () => {
      mockApiRequest.mockResolvedValue({
        audit_logs: [],
        total_count: 0,
        page: 2,
        page_size: 20,
      });

      await siteadmin.listAuditLogs({ page: 2, page_size: 20 });

      expect(mockApiRequest).toHaveBeenCalledWith(
        "/api/v1/audit-logs?page=2&page_size=20"
      );
    });

    it("should include affected_app_id filter", async () => {
      mockApiRequest.mockResolvedValue({
        audit_logs: [],
        total_count: 0,
        page: 1,
        page_size: 20,
      });

      await siteadmin.listAuditLogs({ affected_app_id: "my-app" });

      expect(mockApiRequest).toHaveBeenCalledWith(
        "/api/v1/audit-logs?affected_app_id=my-app"
      );
    });

    it("should include order parameter", async () => {
      mockApiRequest.mockResolvedValue({
        audit_logs: [],
        total_count: 0,
        page: 1,
        page_size: 20,
      });

      await siteadmin.listAuditLogs({ order: "asc" });

      expect(mockApiRequest).toHaveBeenCalledWith(
        "/api/v1/audit-logs?order=asc"
      );
    });

    it("should combine all params", async () => {
      mockApiRequest.mockResolvedValue({
        audit_logs: [],
        total_count: 0,
        page: 1,
        page_size: 20,
      });

      await siteadmin.listAuditLogs({
        page: 1,
        page_size: 20,
        affected_app_id: "my-app",
        order: "desc",
      });

      expect(mockApiRequest).toHaveBeenCalledWith(
        "/api/v1/audit-logs?page=1&page_size=20&affected_app_id=my-app&order=desc"
      );
    });

    it("should return audit logs list response", async () => {
      const mockResponse = {
        audit_logs: [
          {
            id: "0000000000000001",
            created_at: "2024-01-01T00:00:00Z",
            activity_type: "site_admin.app.plan.updated",
            affected_app_id: "my-app",
          },
        ],
        total_count: 1,
        page: 1,
        page_size: 20,
      };
      mockApiRequest.mockResolvedValue(mockResponse);

      const result = await siteadmin.listAuditLogs({
        affected_app_id: "my-app",
      });

      expect(result).toEqual(mockResponse);
    });
  });

  describe("getAuditLog", () => {
    it("should call apiRequest with encoded log ID", async () => {
      mockApiRequest.mockResolvedValue({
        id: "0000000000000001",
        created_at: "2024-01-01T00:00:00Z",
        activity_type: "site_admin.app.plan.updated",
        data: {},
      });

      await siteadmin.getAuditLog("0000000000000001");

      expect(mockApiRequest).toHaveBeenCalledWith(
        "/api/v1/audit-logs/0000000000000001"
      );
    });

    it("should URL-encode log ID with special characters", async () => {
      mockApiRequest.mockResolvedValue({
        id: "id/with/slashes",
        created_at: "2024-01-01T00:00:00Z",
        activity_type: "site_admin.app.plan.updated",
        data: {},
      });

      await siteadmin.getAuditLog("id/with/slashes");

      expect(mockApiRequest).toHaveBeenCalledWith(
        "/api/v1/audit-logs/id%2Fwith%2Fslashes"
      );
    });

    it("should return audit log detail with data", async () => {
      const mockResponse = {
        id: "0000000000000001",
        created_at: "2024-01-01T00:00:00Z",
        activity_type: "site_admin.app.plan.updated",
        actor_user_id: "user-123",
        ip_address: "1.2.3.4",
        user_agent: "Mozilla/5.0",
        affected_app_id: "my-app",
        data: {
          context: { client_id: "abc123" },
          payload: { app_id: "my-app", plan: "pro" },
        },
      };
      mockApiRequest.mockResolvedValue(mockResponse);

      const result = await siteadmin.getAuditLog("0000000000000001");

      expect(result).toEqual(mockResponse);
    });
  });

  describe("changeAppPlan", () => {
    it("should POST with plan name in body", async () => {
      mockApiRequest.mockResolvedValue({
        id: "app1",
        owner_email: "owner@example.com",
        plan: "pro",
        created_at: "2024-01-01T00:00:00Z",
        last_month_mau: 500,
      });

      await siteadmin.changeAppPlan("app1", "pro");

      expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/apps/app1/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan_name: "pro" }),
      });
    });

    it("should encode app ID in URL", async () => {
      mockApiRequest.mockResolvedValue({
        id: "app/1",
        owner_email: "owner@example.com",
        plan: "basic",
        created_at: "2024-01-01T00:00:00Z",
        last_month_mau: 100,
      });

      await siteadmin.changeAppPlan("app/1", "basic");

      expect(mockApiRequest).toHaveBeenCalledWith(
        "/api/v1/apps/app%2F1/plan",
        expect.objectContaining({ method: "POST" })
      );
    });

    it("should return updated app object", async () => {
      const mockResponse = {
        id: "app1",
        owner_email: "owner@example.com",
        plan: "pro",
        created_at: "2024-01-01T00:00:00Z",
        last_month_mau: 500,
      };
      mockApiRequest.mockResolvedValue(mockResponse);

      const result = await siteadmin.changeAppPlan("app1", "pro");

      expect(result).toEqual(mockResponse);
    });
  });
});
