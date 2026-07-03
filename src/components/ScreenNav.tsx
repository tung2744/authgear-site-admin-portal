import React, { useMemo, useCallback, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Nav,
  INavLinkGroup,
  INavLink,
  SearchBox,
  Spinner,
  SpinnerSize,
} from "@fluentui/react";
import { listApps } from "../api/siteadmin";
import type { App } from "../api/types";
import styles from "./ScreenNav.module.css";

const PAGE_SIZE = 10;

const ScreenNav: React.VFC = function ScreenNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [apps, setApps] = useState<App[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  /* Debounce search input by 300 ms */
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery.trim()), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  /* Reset to page 1 when search changes */
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedQuery]);

  /* Fetch from API */
  useEffect(() => {
    setLoading(true);
    const params: Parameters<typeof listApps>[0] = {
      page: currentPage,
      page_size: PAGE_SIZE,
    };
    if (debouncedQuery) {
      if (debouncedQuery.includes("@")) {
        params.collaborator_search = debouncedQuery;
      } else {
        params.app_id = debouncedQuery;
      }
    }
    listApps(params)
      .then((res) => {
        setApps(res.apps);
        setTotalCount(res.total_count);
      })
      .catch(() => {
        setApps([]);
        setTotalCount(0);
      })
      .finally(() => setLoading(false));
  }, [currentPage, debouncedQuery]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  /* Derive selectedKey from URL */
  const selectedKey = (() => {
    if (pathname === "/") return undefined;
    const segments = pathname.split("/");
    if (segments[1] === "project" && segments[2])
      return `project-${segments[2]}`;
    return undefined;
  })();

  const navGroups: INavLinkGroup[] = useMemo(
    () => [
      {
        links: apps.map((app) => ({
          key: `project-${app.id}`,
          name: app.id,
          url: `/project/${app.id}`,
          projectId: app.id,
          ownerEmail: app.owner_email,
        })),
      },
    ],
    [apps]
  );

  const onLinkClick = useCallback(
    (ev?: React.MouseEvent<HTMLElement>, item?: { url?: string }) => {
      if (item?.url) {
        ev?.preventDefault();
        navigate(item.url);
      }
    },
    [navigate]
  );

  const onRenderLink = useCallback(
    (
      link?: INavLink & { projectId?: string; ownerEmail?: string },
      defaultRender?: (l?: INavLink) => React.ReactNode
    ): React.ReactElement | null => {
      if (!link) return null;
      if (link.projectId != null) {
        const isSelected =
          link.key === selectedKey ||
          (link.url != null &&
            (pathname === link.url || pathname.startsWith(link.url + "/")));
        return (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              textAlign: "left",
              width: "100%",
              margin: "6px 0",
            }}
          >
            <span
              style={{
                fontSize: 14,
                fontWeight: isSelected ? 600 : 400,
                lineHeight: 1.2,
              }}
            >
              {link.projectId}
            </span>
            <span style={{ fontSize: 12, color: "#605e5c", lineHeight: 1.2 }}>
              {link.ownerEmail}
            </span>
          </div>
        );
      }
      const rendered = defaultRender ? defaultRender(link) : null;
      return (
        rendered != null &&
        typeof rendered === "object" &&
        "type" in rendered ? (
          rendered
        ) : (
          <span>{link.name}</span>
        )
      ) as React.ReactElement;
    },
    [selectedKey, pathname]
  );

  const noAnimation = { transition: "none", animation: "none" };

  return (
    <div className={styles.sidebarWrap}>
      <div className={styles.sidebarSearch}>
        <SearchBox
          className={styles.sidebarSearchBox}
          placeholder="Search by project ID or email"
          value={searchQuery}
          onChange={(_, value) => setSearchQuery(value ?? "")}
          underlined
        />
      </div>

      <div className={styles.sidebarNavScroll}>
        {loading ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "20px 0",
            }}
          >
            <Spinner size={SpinnerSize.medium} />
          </div>
        ) : apps.length === 0 ? (
          <p
            style={{
              fontSize: 13,
              color: "#797775",
              padding: "12px 16px",
              margin: 0,
            }}
          >
            No projects found.
          </p>
        ) : (
          <Nav
            key={`${currentPage}-${debouncedQuery}`}
            groups={navGroups}
            selectedKey={selectedKey}
            onLinkClick={onLinkClick}
            onRenderLink={onRenderLink}
            styles={(props) => ({
              root: noAnimation,
              linkText: noAnimation,
              chevronButton: noAnimation,
              chevronIcon: noAnimation,
              navItems: noAnimation,
              navItem: { marginBottom: 8, ...noAnimation },
              group: noAnimation,
              groupContent: noAnimation,
              compositeLink: [noAnimation],
              link: [
                noAnimation,
                props.isSelected &&
                  props.theme && {
                    backgroundColor:
                      props.theme.semanticColors.bodyBackgroundChecked,
                    fontWeight: 600,
                    color: props.theme.semanticColors.bodyTextChecked,
                    selectors: {
                      "&::after": {
                        borderLeft: `2px solid ${props.theme.palette.themePrimary}`,
                        content: '""',
                        position: "absolute",
                        top: 0,
                        right: 0,
                        bottom: 0,
                        left: 0,
                        pointerEvents: "none",
                      },
                    },
                  },
              ],
            })}
          />
        )}
      </div>

      {totalPages > 1 && (
        <div className={styles.sidebarPagination}>
          <button
            type="button"
            className={styles.sidebarPageBtn}
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => p - 1)}
            aria-label="Previous page"
          >
            ‹
          </button>
          <span className={styles.sidebarPageLabel}>
            {currentPage} / {totalPages}
          </span>
          <button
            type="button"
            className={styles.sidebarPageBtn}
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
            aria-label="Next page"
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
};

export default ScreenNav;
