import React, { useState, useCallback, useEffect } from "react";
import { useParams, Link, useLocation, useNavigate } from "react-router-dom";
import {
  Icon,
  Text,
  Pivot,
  PivotItem,
  PrimaryButton,
  DefaultButton,
  ProgressIndicator,
  Spinner,
  SpinnerSize,
} from "@fluentui/react";
import { getApp, getAppMonthlyActiveUsers } from "../api/siteadmin";
import type { AppDetail } from "../api/types";
import UsageContent, { MAU_CAP } from "./UsageContent";
import PlanContent from "./PlanContent";
import PortalAdminContent from "./PortalAdminContent";
import AuditLogContent from "./AuditLogContent";
import FeatureConfigContent from "./FeatureConfigContent";
import styles from "./ProjectDetailsPage.module.css";

type TabKey =
  | "overview"
  | "usage"
  | "plan"
  | "portalAdmin"
  | "auditLog"
  | "featureConfig";

/** URL hash segment for each tab */
const TAB_KEY_TO_HASH: Record<TabKey, string> = {
  overview: "overview",
  usage: "usage",
  plan: "plan",
  portalAdmin: "portal-admin",
  auditLog: "audit-log",
  featureConfig: "feature-config",
};

const HASH_TO_TAB_KEY: Record<string, TabKey> = {
  overview: "overview",
  usage: "usage",
  plan: "plan",
  "portal-admin": "portalAdmin",
  "audit-log": "auditLog",
  "feature-config": "featureConfig",
};

function tabKeyFromHash(hash: string): TabKey {
  const segment = hash.replace(/^#/, "").toLowerCase() || "overview";
  return HASH_TO_TAB_KEY[segment] ?? "overview";
}

interface OverviewUsageCardsProps {
  userCount: number;
  mauCurrent: number | null;
  mauLoading: boolean;
}

function OverviewUsageCards({
  userCount,
  mauCurrent,
  mauLoading,
}: OverviewUsageCardsProps) {
  const mauPercent =
    mauCurrent != null ? Math.min(100, (mauCurrent / MAU_CAP) * 100) : 0;
  const mauDisplay = mauLoading
    ? "—"
    : mauCurrent != null && mauCurrent > 0
      ? `${mauCurrent.toLocaleString()} / ${MAU_CAP.toLocaleString()}`
      : "—";

  return (
    <div className={styles.usageGrid}>
      <div className={styles.usageCard}>
        <p className={styles.usageCardLabel}>Total number of users</p>
        <p className={styles.usageCardValue}>{userCount.toLocaleString()}</p>
      </div>
      <div className={styles.usageCard}>
        <p className={styles.usageCardLabel}>Monthly Active User</p>
        <div className={styles.usageCardProgressRow}>
          <div className={styles.usageCardProgressBar}>
            <ProgressIndicator
              percentComplete={
                !mauLoading && mauCurrent != null ? mauPercent / 100 : 0
              }
              barHeight={4}
              styles={{
                root: { margin: 0 },
                progressTrack: { backgroundColor: "#edebe9" },
                progressBar: { backgroundColor: "#176df3" },
              }}
            />
          </div>
          <span className={styles.usageCardProgressValue}>{mauDisplay}</span>
        </div>
      </div>
    </div>
  );
}

const ProjectDetailsPage: React.VFC = function ProjectDetailsPage() {
  const { projectId } = useParams<"projectId">();
  const navigate = useNavigate();
  const location = useLocation();

  const [selectedTab, setSelectedTab] = useState<TabKey>(() =>
    tabKeyFromHash(location.hash)
  );
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [copyEmailFeedback, setCopyEmailFeedback] = useState(false);

  const [appDetail, setAppDetail] = useState<AppDetail | null>(null);
  const [appLoading, setAppLoading] = useState(true);
  const [appErrorMessage, setAppErrorMessage] = useState<string | null>(null);

  const [mauCurrent, setMauCurrent] = useState<number | null>(null);
  const [mauLoading, setMauLoading] = useState(false);

  useEffect(() => {
    const tab = tabKeyFromHash(location.hash);
    setSelectedTab(tab);
  }, [location.hash]);

  useEffect(() => {
    if (projectId && !location.hash) {
      navigate(`/project/${projectId}#overview`, { replace: true });
    }
  }, [projectId, location.hash, navigate]);

  useEffect(() => {
    if (!projectId) return;
    setAppLoading(true);
    setAppDetail(null);
    setAppErrorMessage(null);
    getApp(projectId)
      .then(setAppDetail)
      .catch((e: unknown) => {
        const msg =
          e instanceof Error ? e.message : "Failed to load project details.";
        setAppErrorMessage(msg);
      })
      .finally(() => setAppLoading(false));
  }, [projectId]);

  useEffect(() => {
    if (!projectId || !appDetail) return;
    setMauLoading(true);
    const now = new Date();
    getAppMonthlyActiveUsers(
      projectId,
      now.getFullYear(),
      now.getMonth() + 1,
      now.getFullYear(),
      now.getMonth() + 1
    )
      .then((res) => setMauCurrent(res.counts[0]?.count ?? 0))
      .catch(() => setMauCurrent(null))
      .finally(() => setMauLoading(false));
  }, [projectId, appDetail]);

  const onLinkClick = useCallback(
    (item?: PivotItem) => {
      const key = item?.props.itemKey as TabKey | undefined;
      if (key && projectId) {
        const hash = TAB_KEY_TO_HASH[key];
        // selectedTab is derived from location.hash by the effect above, not
        // set here directly -- if a tab holds an unsaved-changes blocker
        // (e.g. Feature Config), that blocker only gets a chance to
        // intercept because navigate() hasn't actually committed yet when
        // this fires. Setting selectedTab eagerly here would switch tabs
        // (unmounting the blocking component) regardless of whether the
        // navigation was blocked.
        navigate(`/project/${projectId}#${hash}`, { replace: true });
      }
    },
    [navigate, projectId]
  );

  const copyProjectId = useCallback(() => {
    if (!appDetail?.id) return;
    void navigator.clipboard.writeText(appDetail.id);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 1500);
  }, [appDetail?.id]);

  const copyEmail = useCallback(() => {
    if (!appDetail?.owner_email) return;
    void navigator.clipboard.writeText(appDetail.owner_email);
    setCopyEmailFeedback(true);
    setTimeout(() => setCopyEmailFeedback(false), 1500);
  }, [appDetail?.owner_email]);

  if (appLoading) {
    return (
      <div
        className={styles.root}
        style={{ alignItems: "center", justifyContent: "center" }}
      >
        <Spinner size={SpinnerSize.large} />
      </div>
    );
  }

  if (appErrorMessage != null || !appDetail) {
    return (
      <div className={styles.root}>
        <div className={styles.breadcrumbRow}>
          <Text as="h1" variant="xxLarge" block className={styles.breadcrumb}>
            <Link to="/" className={styles.breadcrumbLink}>
              Projects
            </Link>
            <Icon
              iconName="ChevronRight"
              className={styles.breadcrumbSepIcon}
            />
            <span className={styles.breadcrumbCurrent}>Project Details</span>
          </Text>
        </div>
        <div className={styles.notFoundContainer}>
          <Icon iconName="SearchIssue" className={styles.notFoundIcon} />
          <h2 className={styles.notFoundHeading}>Project not found</h2>
          <p className={styles.notFoundDescription}>
            {appErrorMessage ??
              "The project you\u2019re looking for doesn\u2019t exist or may have been removed."}
          </p>
          <PrimaryButton
            text="Back to Projects"
            onClick={() => navigate("/")}
            styles={{
              root: { backgroundColor: "#176df3", borderColor: "#176df3" },
              rootHovered: {
                backgroundColor: "#1562db",
                borderColor: "#1562db",
              },
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <div className={styles.breadcrumbRow}>
        <Text as="h1" variant="xxLarge" block className={styles.breadcrumb}>
          <Link to="/" className={styles.breadcrumbLink}>
            Projects
          </Link>
          <Icon iconName="ChevronRight" className={styles.breadcrumbSepIcon} />
          <span className={styles.breadcrumbCurrent}>Project Details</span>
        </Text>
      </div>

      <div className={styles.projectHeader}>
        <div className={styles.projectInfo}>
          <div className={styles.projectIdRow}>
            <span className={styles.projectIdText}>{appDetail.id}</span>
            <button
              type="button"
              onClick={copyProjectId}
              aria-label="Copy project ID"
              style={{
                background: "none",
                border: "none",
                padding: 0,
                cursor: "pointer",
                color: "#605e5c",
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              <Icon iconName={copyFeedback ? "CheckMark" : "Copy"} />
            </button>
          </div>
          <div className={styles.projectMeta}>
            {appDetail.owner_email ? (
              <button
                type="button"
                onClick={copyEmail}
                aria-label="Copy owner email"
                className={styles.copyEmailBtn}
              >
                <span className={styles.metaText}>{appDetail.owner_email}</span>
                <Icon
                  iconName={copyEmailFeedback ? "CheckMark" : "Copy"}
                  className={styles.copyEmailIcon}
                />
              </button>
            ) : (
              <span className={styles.metaText} style={{ fontStyle: "italic" }}>
                No owner
              </span>
            )}
            <span className={styles.metaText}>
              Created at{" "}
              {new Date(appDetail.created_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
        </div>
      </div>

      <div className={styles.tabsSection}>
        <Pivot
          className={styles.pivotTabs}
          selectedKey={selectedTab}
          onLinkClick={onLinkClick}
          linkSize="normal"
          linkFormat="links"
        >
          <PivotItem headerText="Overview" itemKey="overview" />
          <PivotItem headerText="Usage" itemKey="usage" />
          <PivotItem headerText="Plan" itemKey="plan" />
          <PivotItem headerText="Portal Admin" itemKey="portalAdmin" />
          <PivotItem headerText="Feature Config" itemKey="featureConfig" />
          <PivotItem headerText="Site Admin Log" itemKey="auditLog" />
        </Pivot>

        <div
          className={
            selectedTab === "auditLog" || selectedTab === "featureConfig"
              ? styles.tabContentFullWidth
              : styles.tabContent
          }
        >
          {selectedTab === "overview" && (
            <>
              <h3 className={styles.sectionHeading}>Usage</h3>
              <OverviewUsageCards
                userCount={appDetail.user_count}
                mauCurrent={mauCurrent}
                mauLoading={mauLoading}
              />

              <div className={styles.sectionDivider} aria-hidden />

              <h3 className={styles.sectionHeading}>Project Status</h3>
              <div className={styles.projectStatusSection}>
                <div className={styles.projectStatusRow}>
                  <div className={styles.projectStatusContent}>
                    <h4 className={styles.projectStatusHeading}>
                      Disable Project
                    </h4>
                    <p className={styles.projectStatusDescription}>
                      Temporarily disables this project. Authgear services will
                      stop functioning for this project until it is re-enabled.
                      No data will be removed.
                    </p>
                  </div>
                  <div className={styles.projectStatusAction}>
                    <DefaultButton
                      text="Disable project"
                      iconProps={{ iconName: "Blocked" }}
                      disabled
                    />
                    <p
                      style={{
                        margin: "4px 0 0",
                        fontSize: 12,
                        color: "#797775",
                      }}
                    >
                      This feature is not yet available.
                    </p>
                  </div>
                </div>
                <div className={styles.projectStatusDivider} />
                <div className={styles.projectStatusRow}>
                  <div className={styles.projectStatusContent}>
                    <h4 className={styles.projectStatusHeading}>
                      Delete Project
                    </h4>
                    <p className={styles.projectStatusDescription}>
                      Permanently deletes this project and all associated data.
                      This action cannot be undone.
                    </p>
                  </div>
                  <div className={styles.projectStatusAction}>
                    <DefaultButton
                      text="Delete Project"
                      iconProps={{ iconName: "Delete" }}
                      disabled
                    />
                    <p
                      style={{
                        margin: "4px 0 0",
                        fontSize: 12,
                        color: "#797775",
                      }}
                    >
                      This feature is not yet available.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
          {selectedTab === "usage" && <UsageContent appId={appDetail.id} />}
          {selectedTab === "plan" && (
            <PlanContent
              appId={appDetail.id}
              currentPlan={appDetail.plan}
              onPlanChanged={(planName) =>
                setAppDetail((prev) =>
                  prev ? { ...prev, plan: planName } : prev
                )
              }
            />
          )}
          {selectedTab === "portalAdmin" && (
            <PortalAdminContent appId={appDetail.id} />
          )}
          {selectedTab === "featureConfig" && (
            <FeatureConfigContent appId={appDetail.id} />
          )}
          {selectedTab === "auditLog" && (
            <AuditLogContent appId={appDetail.id} />
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailsPage;
