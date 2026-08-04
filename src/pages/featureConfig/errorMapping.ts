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

/**
 * Renders a single validation cause as a plain-English message, e.g.
 * "Invalid input at /authentication/lockout/password/enabled: type".
 * Mirrors the portal's `errors.validation.unknown` fallback format
 * (portal/src/locale-data/en.json), since this app has no i18n layer to
 * source a per-kind dictionary from.
 */
function formatValidationCause(cause: ValidationErrorCause): string {
  const location = cause.location === "" ? "the document" : cause.location;
  return `Invalid input at ${location}: ${cause.kind}`;
}

/**
 * Renders every cause for the generic error banner, so a multi-field
 * validation failure surfaces all of them at once instead of only the
 * first (or a generic "invalid feature config" with no specifics) --
 * mirrors how the portal's ErrorRenderer joins multiple parsed errors.
 */
export function formatValidationCauses(causes: ValidationErrorCause[]): string {
  return causes.map(formatValidationCause).join("; ");
}
