import React, { useMemo, useState, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ShimmeredDetailsList,
  DetailsListLayoutMode,
  SelectionMode,
  IColumn,
  IDetailsRowProps,
  DetailsRow,
  ColumnActionsMode,
  Dropdown,
  IDropdownOption,
  SearchBox,
  CommandButton,
  Text,
  Icon,
  IconButton,
  IListProps,
  MessageBar,
  MessageBarType,
} from "@fluentui/react";
import ScreenTitle from "../components/ScreenTitle";
import { listApps, listPlans, type ListAppsParams } from "../api/siteadmin";
import { SiteAdminAPIError } from "../api/client";
import type { App } from "../api/types";

import styles from "./ProjectsScreen.module.css";

function onShouldVirtualize(_: IListProps): boolean {
  return false;
}

/* Single source of truth for column widths - header and content must match (equal width) */
const COLUMN_WIDTH = 200;
const COLUMN_WIDTHS = {
  projectName: COLUMN_WIDTH,
  ownerEmail: COLUMN_WIDTH,
  plan: COLUMN_WIDTH,
  lastMonthMau: 160,
  createdAt: COLUMN_WIDTH,
} as const;

const PAGE_SIZE = 10;

type PageItem = number | "ellipsis";

/** Returns pagination items: first, last, current ± 2, with ellipses where there are gaps. */
function getPageItems(current: number, total: number): PageItem[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const delta = 2;
  const keep = new Set<number>([1, total]);
  for (let i = current - delta; i <= current + delta; i++) {
    if (i >= 1 && i <= total) keep.add(i);
  }
  const sorted = Array.from(keep).sort((a, b) => a - b);
  const result: PageItem[] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push("ellipsis");
    result.push(sorted[i]);
  }
  return result;
}

const SEARCH_BY_OPTIONS: IDropdownOption[] = [
  { key: "projectId", text: "Project ID" },
  { key: "collaboratorEmail", text: "Collaborator" },
];

const ALL_PLANS_KEY = "__all__";

type SortKey = "created_at" | "mau";
type SortOrder = "asc" | "desc";

interface ProjectNameCellProps {
  item: App;
}

const ProjectNameCell: React.VFC<ProjectNameCellProps> = ({ item }) => {
  return (
    <div className={styles.projectNameCell}>
      <Text className={styles.projectName}>{item.id}</Text>
    </div>
  );
};

const ProjectsScreen: React.VFC = function ProjectsScreen() {
  const [apps, setApps] = useState<App[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<SiteAdminAPIError | null>(null);
  const [searchBy, setSearchBy] = useState<string>("projectId");
  const [searchText, setSearchText] = useState<string>("");
  const [planFilter, setPlanFilter] = useState<string>(ALL_PLANS_KEY);
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [sortExplicit, setSortExplicit] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [planOptions, setPlanOptions] = useState<IDropdownOption[]>([
    { key: ALL_PLANS_KEY, text: "All plans" },
  ]);

  useEffect(() => {
    listPlans()
      .then((res) => {
        setPlanOptions([
          { key: ALL_PLANS_KEY, text: "All plans" },
          ...res.plans.map((p) => ({ key: p.name, text: p.name })),
        ]);
      })
      .catch(() => {
        // Keep default "All plans" option only.
      });
  }, []);

  const collaboratorSearch =
    searchBy === "collaboratorEmail" ? searchText.trim() : undefined;
  // When collaborator_search is active without an explicit sort choice, the
  // server defaults to relevance — we omit sort/order to let that happen.
  const sendSort = !collaboratorSearch || sortExplicit;

  useEffect(() => {
    setLoading(true);
    setError(null);
    const params: ListAppsParams = { page: currentPage, page_size: PAGE_SIZE };
    if (collaboratorSearch) params.collaborator_search = collaboratorSearch;
    if (searchText.trim() && searchBy === "projectId")
      params.app_id = searchText.trim();
    if (sendSort) {
      params.sort = sortKey;
      params.order = sortOrder;
    }
    if (planFilter !== ALL_PLANS_KEY) {
      params.plan = planFilter;
    }
    listApps(params)
      .then((res) => {
        setApps(res.apps);
        setTotalCount(res.total_count);
      })
      .catch((err: SiteAdminAPIError) => setError(err))
      .finally(() => setLoading(false));
  }, [
    currentPage,
    searchBy,
    searchText,
    planFilter,
    sortKey,
    sortOrder,
    collaboratorSearch,
    sendSort,
  ]);

  const columns: IColumn[] = useMemo(
    () => [
      {
        key: "projectName",
        fieldName: "id",
        name: "Project ID",
        minWidth: COLUMN_WIDTHS.projectName,
        maxWidth: COLUMN_WIDTHS.projectName,
        columnActionsMode: ColumnActionsMode.disabled,
      },
      {
        key: "ownerEmail",
        fieldName: "owner_email",
        name: "Owner Email",
        minWidth: COLUMN_WIDTHS.ownerEmail,
        maxWidth: COLUMN_WIDTHS.ownerEmail,
        columnActionsMode: ColumnActionsMode.disabled,
        cellClassName: styles.cellAlignLeft,
      },
      {
        key: "plan",
        fieldName: "plan",
        name: "Plan",
        minWidth: COLUMN_WIDTHS.plan,
        maxWidth: COLUMN_WIDTHS.plan,
        columnActionsMode: ColumnActionsMode.disabled,
        cellClassName: styles.cellAlignLeft,
      },
      {
        key: "lastMonthMau",
        fieldName: "last_month_mau",
        name: "Last Month MAU",
        minWidth: COLUMN_WIDTHS.lastMonthMau,
        maxWidth: COLUMN_WIDTHS.lastMonthMau,
        columnActionsMode: ColumnActionsMode.disabled,
        cellClassName: styles.cellAlignLeft,
      },
      {
        key: "createdAt",
        fieldName: "created_at",
        name: "Created at",
        minWidth: COLUMN_WIDTHS.createdAt,
        maxWidth: COLUMN_WIDTHS.createdAt,
        columnActionsMode: ColumnActionsMode.disabled,
      },
    ],
    []
  );

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  const onFirstPage = useCallback(() => setCurrentPage(1), []);
  const onPrevPage = useCallback(() => {
    setCurrentPage((p) => Math.max(1, p - 1));
  }, []);
  const onNextPage = useCallback(() => {
    setCurrentPage((p) => Math.min(totalPages, p + 1));
  }, [totalPages]);
  const onLastPage = useCallback(
    () => setCurrentPage(totalPages),
    [totalPages]
  );
  const onPageClick = useCallback((page: number) => setCurrentPage(page), []);

  const onRenderRow = useCallback((props?: IDetailsRowProps) => {
    if (props == null) return null;
    const item = props.item as App;
    return (
      <Link to={`/project/${item.id}`} className={styles.rowLink}>
        <DetailsRow {...props} />
      </Link>
    );
  }, []);

  const onRenderItemColumn = useCallback(
    (item: App, _index?: number, column?: IColumn) => {
      switch (column?.key) {
        case "projectName":
          return <ProjectNameCell item={item} />;
        case "ownerEmail":
          return (
            <div className={styles.cellContentLeft}>
              {item.owner_email ? (
                <Text className={styles.cellText}>{item.owner_email}</Text>
              ) : (
                <Text
                  className={styles.cellText}
                  style={{ fontStyle: "italic" }}
                >
                  No owner
                </Text>
              )}
            </div>
          );
        case "plan":
          return (
            <div className={styles.cellContentLeft}>
              <Text className={styles.cellText}>{item.plan}</Text>
            </div>
          );
        case "lastMonthMau":
          return (
            <div className={styles.cellContentLeft}>
              <Text className={styles.cellText}>
                {item.last_month_mau.toLocaleString()}
              </Text>
            </div>
          );
        case "createdAt":
          return (
            <Text className={styles.cellText}>
              {new Date(item.created_at).toLocaleString()}
            </Text>
          );
        default:
          return null;
      }
    },
    []
  );

  const onPlanFilterChange = useCallback(
    (_event: React.FormEvent<HTMLDivElement>, option?: IDropdownOption) => {
      if (option) {
        setPlanFilter(option.key as string);
        setCurrentPage(1);
      }
    },
    []
  );

  const onToggleSort = useCallback(
    (key: SortKey) => {
      setCurrentPage(1);
      setSortExplicit(true);
      setSortKey((prevKey) => {
        if (prevKey === key) return prevKey;
        return key;
      });
      setSortOrder((prevOrder) => {
        // If switching to a different key, reset to desc; otherwise toggle.
        return sortKey === key
          ? prevOrder === "asc"
            ? "desc"
            : "asc"
          : "desc";
      });
    },
    [sortKey]
  );

  const onSearchByChange = useCallback(
    (_event: React.FormEvent<HTMLDivElement>, option?: IDropdownOption) => {
      if (option) {
        setSearchBy(option.key as string);
        setSortExplicit(false);
        setCurrentPage(1);
      }
    },
    []
  );

  const onSearchChange = useCallback(
    (_event?: React.ChangeEvent<HTMLInputElement>, newValue?: string) => {
      setSearchText(newValue || "");
      setSortExplicit(false);
      setCurrentPage(1);
    },
    []
  );

  const onClearFilters = useCallback(() => {
    setSearchText("");
    setPlanFilter(ALL_PLANS_KEY);
    setSortKey("created_at");
    setSortOrder("desc");
    setSortExplicit(false);
    setCurrentPage(1);
  }, []);

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <ScreenTitle>Projects</ScreenTitle>
      </div>
      <div className={styles.content}>
        {error && (
          <MessageBar messageBarType={MessageBarType.error} isMultiline={false}>
            {error.message}
          </MessageBar>
        )}
        <div className={styles.toolbar}>
          <Text className={styles.searchByLabel}>Search By</Text>
          <Dropdown
            className={styles.searchByDropdown}
            options={SEARCH_BY_OPTIONS}
            selectedKey={searchBy}
            onChange={onSearchByChange}
          />
          <SearchBox
            className={styles.searchBox}
            placeholder="Search"
            value={searchText}
            onChange={onSearchChange}
          />
          <Text className={styles.searchByLabel}>Plan</Text>
          <Dropdown
            className={styles.searchByDropdown}
            options={planOptions}
            selectedKey={planFilter}
            onChange={onPlanFilterChange}
          />
          <CommandButton
            className={styles.clearButton}
            text="Clear all filters"
            onClick={onClearFilters}
          />
        </div>
        <div className={styles.listContainer}>
          {/* Custom header - widths from COLUMN_WIDTHS so they match content columns */}
          <div className={styles.tableHeader}>
            <div
              className={styles.tableHeaderCell}
              style={{ width: COLUMN_WIDTHS.projectName }}
            >
              Project ID
            </div>
            <div
              className={styles.tableHeaderCell}
              style={{ width: COLUMN_WIDTHS.ownerEmail }}
            >
              Owner Email
            </div>
            <div
              className={styles.tableHeaderCell}
              style={{ width: COLUMN_WIDTHS.plan }}
            >
              Plan
            </div>
            <button
              type="button"
              className={`${styles.tableHeaderCell} ${styles.tableHeaderSortable}`}
              style={{ width: COLUMN_WIDTHS.lastMonthMau }}
              onClick={() => onToggleSort("mau")}
              aria-label="Sort by Last Month MAU"
            >
              Last Month MAU
              {sendSort && sortKey === "mau" && (
                <Icon
                  iconName={sortOrder === "asc" ? "SortUp" : "SortDown"}
                  className={styles.sortIcon}
                  style={{ marginLeft: 4 }}
                />
              )}
            </button>
            <button
              type="button"
              className={`${styles.tableHeaderCell} ${styles.tableHeaderSortable}`}
              style={{ width: COLUMN_WIDTHS.createdAt }}
              onClick={() => onToggleSort("created_at")}
              aria-label="Sort by Created at"
            >
              Created at
              {sendSort && sortKey === "created_at" && (
                <Icon
                  iconName={sortOrder === "asc" ? "SortUp" : "SortDown"}
                  className={styles.sortIcon}
                  style={{ marginLeft: 4 }}
                />
              )}
            </button>
          </div>
          <ShimmeredDetailsList
            className={styles.list}
            enableShimmer={loading}
            enableUpdateAnimations={false}
            onRenderRow={onRenderRow}
            onRenderItemColumn={onRenderItemColumn}
            selectionMode={SelectionMode.none}
            layoutMode={DetailsListLayoutMode.fixedColumns}
            columns={columns}
            items={apps}
            onShouldVirtualize={onShouldVirtualize}
          />
        </div>
        {totalPages > 1 && (
          <div className={styles.pagination}>
            <IconButton
              iconProps={{ iconName: "DoubleChevronLeft" }}
              title="First page"
              ariaLabel="First page"
              disabled={safePage === 1}
              onClick={onFirstPage}
              styles={{
                root: { width: 24, height: 24, color: "#176df3" },
                rootDisabled: {
                  backgroundColor: "transparent",
                  color: "#C8C6C4",
                },
                icon: { fontSize: 14, fontWeight: 600, color: "#176df3" },
                iconDisabled: { color: "#C8C6C4" },
              }}
            />
            <IconButton
              iconProps={{ iconName: "ChevronLeft" }}
              title="Previous page"
              ariaLabel="Previous page"
              disabled={safePage === 1}
              onClick={onPrevPage}
              styles={{
                root: { width: 24, height: 24, color: "#176df3" },
                rootDisabled: {
                  backgroundColor: "transparent",
                  color: "#C8C6C4",
                },
                icon: { fontSize: 14, fontWeight: 600, color: "#176df3" },
                iconDisabled: { color: "#C8C6C4" },
              }}
            />
            <div className={styles.paginationPages}>
              {getPageItems(safePage, totalPages).map((item, idx) =>
                item === "ellipsis" ? (
                  <span
                    key={`ellipsis-${idx}`}
                    className={styles.paginationEllipsis}
                    aria-hidden
                  >
                    …
                  </span>
                ) : (
                  <button
                    key={item}
                    type="button"
                    className={
                      item === safePage
                        ? `${styles.paginationPageBtn} ${styles.paginationCurrent}`
                        : styles.paginationPageBtn
                    }
                    onClick={() => onPageClick(item)}
                    aria-label={`Page ${item}`}
                    aria-current={item === safePage ? "page" : undefined}
                  >
                    {item}
                  </button>
                )
              )}
            </div>
            <IconButton
              iconProps={{ iconName: "ChevronRight" }}
              title="Next page"
              ariaLabel="Next page"
              disabled={safePage === totalPages}
              onClick={onNextPage}
              styles={{
                root: { width: 24, height: 24, color: "#176df3" },
                rootDisabled: {
                  backgroundColor: "transparent",
                  color: "#C8C6C4",
                },
                icon: { fontSize: 14, fontWeight: 600, color: "#176df3" },
                iconDisabled: { color: "#C8C6C4" },
              }}
            />
            <IconButton
              iconProps={{ iconName: "DoubleChevronRight" }}
              title="Last page"
              ariaLabel="Last page"
              disabled={safePage === totalPages}
              onClick={onLastPage}
              styles={{
                root: { width: 24, height: 24, color: "#176df3" },
                rootDisabled: {
                  backgroundColor: "transparent",
                  color: "#C8C6C4",
                },
                icon: { fontSize: 14, fontWeight: 600, color: "#176df3" },
                iconDisabled: { color: "#C8C6C4" },
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectsScreen;
