import React, { useCallback, useMemo } from "react";
import { Icon, TooltipHost } from "@fluentui/react";
import cn from "classnames";
import { isCollection, type Document } from "yaml";
import type { FeatureConfig, ValidationErrorCause } from "../../api/types";
import { getAtPointer, parseJsonPointer } from "../../utils/jsonPointer";
import { FIELD_REGISTRY, FieldDef } from "./fieldRegistry";
import BooleanFieldControl from "./BooleanFieldControl";
import NumberFieldControl from "./NumberFieldControl";
import CountryListFieldControl from "./CountryListFieldControl";
import styles from "./FeatureConfigTableView.module.css";

export interface FeatureConfigTableViewProps {
  /** The parsed app-override YAML document — the single source of truth. */
  doc: Document;
  /** Called with a cloned, mutated document whenever a row edits a value. */
  onDocChange: (doc: Document) => void;
  planFeatureConfig: FeatureConfig;
  /** Validation causes from the last PUT/preview, keyed by field jsonPointer. */
  fieldErrors: Map<string, ValidationErrorCause[]>;
  disabled?: boolean;
}

interface FieldSectionGroup {
  section: string;
  fields: FieldDef[];
}

const UNSECTIONED = "Other";

/** Groups the registry by `section`, preserving first-seen order — pure display grouping. */
function groupBySection(fields: FieldDef[]): FieldSectionGroup[] {
  const groups: FieldSectionGroup[] = [];
  const bySection = new Map<string, FieldSectionGroup>();
  for (const field of fields) {
    const section = field.section ?? UNSECTIONED;
    let group = bySection.get(section);
    if (!group) {
      group = { section, fields: [] };
      bySection.set(section, group);
      groups.push(group);
    }
    group.fields.push(field);
  }
  return groups;
}

/**
 * `Document#getIn` unwraps scalars but returns collections (arrays/maps) as
 * their raw YAML nodes — convert those to plain JS so controls can treat
 * `getIn` results the same as `effective_*_feature_config` JSON values.
 */
function unwrapNode(v: unknown): unknown {
  return isCollection(v) ? v.toJSON() : v;
}

function formatDisplayValue(v: unknown): string {
  if (v === undefined || v === null) return "—";
  if (Array.isArray(v)) {
    return v.length === 0 ? "All countries" : v.join(", ");
  }
  if (typeof v === "boolean") return v ? "Enabled" : "Disabled";
  return String(v);
}

const FeatureConfigTableView: React.VFC<FeatureConfigTableViewProps> =
  function FeatureConfigTableView({
    doc,
    onDocChange,
    planFeatureConfig,
    fieldErrors,
    disabled,
  }) {
    const commit = useCallback(
      (field: FieldDef, value: unknown) => {
        const path = parseJsonPointer(field.jsonPointer);
        const next = doc.clone();
        if (value === undefined) {
          next.deleteIn(path);
        } else {
          next.setIn(path, value);
        }
        onDocChange(next);
      },
      [doc, onDocChange]
    );

    const renderAppConfigCell = useCallback(
      (field: FieldDef) => {
        const path = parseJsonPointer(field.jsonPointer);
        const currentValue = unwrapNode(doc.getIn(path));
        const planValue = getAtPointer(planFeatureConfig, field.jsonPointer);

        switch (field.control) {
          case "boolean":
            return (
              <BooleanFieldControl
                value={
                  currentValue === undefined ? undefined : Boolean(currentValue)
                }
                planValue={planValue}
                disabled={disabled}
                onChange={(v) => commit(field, v)}
              />
            );
          case "number":
            return (
              <NumberFieldControl
                value={
                  currentValue === undefined ? undefined : Number(currentValue)
                }
                planValue={planValue}
                disabled={disabled}
                onChange={(v) => commit(field, v)}
              />
            );
          case "countryList":
            return (
              <CountryListFieldControl
                value={
                  currentValue === undefined
                    ? undefined
                    : (currentValue as string[])
                }
                disabled={disabled}
                onChange={(v) => commit(field, v)}
              />
            );
          default:
            return null;
        }
      },
      [doc, planFeatureConfig, disabled, commit]
    );

    const groups = useMemo(() => groupBySection(FIELD_REGISTRY), []);

    return (
      <table className={styles.cmpTable}>
        <thead>
          <tr>
            <th className={styles.tableColSetting}>Setting</th>
            <th className={styles.tableColPlan}>📋 Plan Config</th>
            <th>✏️ App Config</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((group) => (
            <React.Fragment key={group.section}>
              <tr>
                <td colSpan={3} className={styles.sectionHeaderRow}>
                  {group.section}
                </td>
              </tr>
              {group.fields.map((field) => {
                const errors = fieldErrors.get(field.jsonPointer);
                const hasError = errors != null && errors.length > 0;
                return (
                  <tr
                    key={field.jsonPointer}
                    className={cn(hasError && styles.rowError)}
                  >
                    <td className={cn(styles.tableCell, styles.tableCellLabel)}>
                      <div className={styles.fieldLabelRow}>
                        <span>{field.label}</span>
                        {hasError && (
                          <TooltipHost
                            content={errors
                              .map(
                                (e) =>
                                  e.kind +
                                  (e.details
                                    ? ` (${JSON.stringify(e.details)})`
                                    : "")
                              )
                              .join("; ")}
                          >
                            <Icon
                              iconName="ErrorBadge"
                              className={styles.errorIcon}
                            />
                          </TooltipHost>
                        )}
                      </div>
                      <div className={styles.jsonPath}>{field.jsonPointer}</div>
                    </td>
                    <td className={styles.tableCell}>
                      <span className={styles.planValue}>
                        {formatDisplayValue(
                          getAtPointer(planFeatureConfig, field.jsonPointer)
                        )}
                      </span>
                    </td>
                    <td className={styles.tableCell}>
                      {renderAppConfigCell(field)}
                    </td>
                  </tr>
                );
              })}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    );
  };

export default FeatureConfigTableView;
