import React, { useCallback, useMemo } from "react";
import {
  ColumnActionsMode,
  DetailsList,
  DetailsListLayoutMode,
  DetailsRow,
  Icon,
  IColumn,
  IDetailsRowProps,
  SelectionMode,
  TooltipHost,
} from "@fluentui/react";
import cn from "classnames";
import type { Document } from "yaml";
import type { FeatureConfig, ValidationErrorCause } from "../../api/types";
import { getAtPointer, parseJsonPointer } from "../../utils/jsonPointer";
import { FIELD_REGISTRY, FieldDef } from "./fieldRegistry";
import BooleanFieldControl from "./BooleanFieldControl";
import NumberFieldControl from "./NumberFieldControl";
import CountryListFieldControl from "./CountryListFieldControl";
import styles from "./FeatureConfigTableView.module.css";

const COLUMN_WIDTHS = {
  field: 300,
  planConfig: 200,
  appConfig: 340,
} as const;

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
        const currentValue = doc.getIn(path);
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

    const columns: IColumn[] = useMemo(
      () => [
        {
          key: "field",
          name: "Field",
          minWidth: COLUMN_WIDTHS.field,
          maxWidth: COLUMN_WIDTHS.field,
          columnActionsMode: ColumnActionsMode.disabled,
          onRender: (field: FieldDef) => {
            const errors = fieldErrors.get(field.jsonPointer);
            return (
              <div className={styles.fieldCell}>
                <span>{field.label}</span>
                {errors && errors.length > 0 && (
                  <TooltipHost
                    content={errors
                      .map(
                        (e) =>
                          e.kind +
                          (e.details ? ` (${JSON.stringify(e.details)})` : "")
                      )
                      .join("; ")}
                  >
                    <Icon iconName="ErrorBadge" className={styles.errorIcon} />
                  </TooltipHost>
                )}
              </div>
            );
          },
        },
        {
          key: "planConfig",
          name: "Plan Config",
          minWidth: COLUMN_WIDTHS.planConfig,
          maxWidth: COLUMN_WIDTHS.planConfig,
          columnActionsMode: ColumnActionsMode.disabled,
          onRender: (field: FieldDef) => (
            <span className={styles.readOnlyValue}>
              {formatDisplayValue(
                getAtPointer(planFeatureConfig, field.jsonPointer)
              )}
            </span>
          ),
        },
        {
          key: "appConfig",
          name: "App Config",
          minWidth: COLUMN_WIDTHS.appConfig,
          columnActionsMode: ColumnActionsMode.disabled,
          onRender: renderAppConfigCell,
        },
      ],
      [fieldErrors, planFeatureConfig, renderAppConfigCell]
    );

    const onRenderRow = useCallback(
      (props?: IDetailsRowProps) => {
        if (props == null) return null;
        const field = props.item as FieldDef;
        const hasError = fieldErrors.has(field.jsonPointer);
        return (
          <DetailsRow
            {...props}
            className={cn(props.className, hasError && styles.rowError)}
          />
        );
      },
      [fieldErrors]
    );

    return (
      <DetailsList
        className={styles.list}
        items={FIELD_REGISTRY}
        columns={columns}
        layoutMode={DetailsListLayoutMode.fixedColumns}
        selectionMode={SelectionMode.none}
        onShouldVirtualize={() => false}
        onRenderRow={onRenderRow}
        getKey={(item: FieldDef) => item.jsonPointer}
      />
    );
  };

export default FeatureConfigTableView;
