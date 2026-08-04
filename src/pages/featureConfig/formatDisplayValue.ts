import type { FieldDef } from "./fieldRegistry";

/**
 * Formats a field's plan value for the table's read-only "Plan Config"
 * column. Extracted from FeatureConfigTableView.tsx (a plain function,
 * not a component) so it can be unit tested without the
 * react-refresh/only-export-components lint rule flagging a non-component
 * export alongside the table view component.
 */
export function formatDisplayValue(
  control: FieldDef["control"],
  v: unknown
): string {
  if (control === "countryList") {
    // nil (the section/field was never set at all) and an explicit empty
    // list are equivalent here -- both mean "no restriction, all countries
    // allowed" (see IntersectAllowlist), matching CountryListFieldControl's
    // own "Allow all countries" mode label for the same value. Checked
    // before the generic null/undefined case below, which would otherwise
    // show a meaningless "—" for a value that actually has a clear meaning.
    if (v == null) return "Allow all countries";
    if (Array.isArray(v)) {
      return v.length === 0 ? "Allow all countries" : v.join(", ");
    }
  }
  if (v === undefined || v === null) return "—";
  if (typeof v === "boolean") return v ? "Enabled" : "Disabled";
  return String(v);
}
