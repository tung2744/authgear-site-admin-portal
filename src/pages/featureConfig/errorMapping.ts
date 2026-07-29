import type { ValidationErrorCause } from "../../api/types";
import type { FieldDef } from "./fieldRegistry";

/**
 * Maps validation causes (400 `info.causes`, keyed by RFC 6901 `location`) to
 * field-registry rows, so the table view can highlight the offending row
 * instead of only showing a generic banner.
 *
 * A cause matches a field when `location` is exactly that field's
 * `jsonPointer`, or is an ancestor of it (the failure is on a containing
 * object, e.g. a `required` failure on `/oauth/client` should still flag
 * every known leaf field under it). The empty-string location (failure on
 * the document root) never matches a specific row — it's left for the
 * generic banner.
 */
export function mapCausesToFields(
  causes: ValidationErrorCause[],
  registry: FieldDef[]
): Map<string, ValidationErrorCause[]> {
  const result = new Map<string, ValidationErrorCause[]>();

  for (const cause of causes) {
    if (!cause.location) continue;

    const matches = registry.filter(
      (field) =>
        field.jsonPointer === cause.location ||
        field.jsonPointer.startsWith(`${cause.location}/`)
    );

    for (const field of matches) {
      const existing = result.get(field.jsonPointer);
      if (existing) {
        existing.push(cause);
      } else {
        result.set(field.jsonPointer, [cause]);
      }
    }
  }

  return result;
}
