/**
 * Minimal RFC 6901 JSON Pointer helpers.
 *
 * Used to map a feature-config field's declarative `jsonPointer` (see
 * `src/pages/featureConfig/fieldRegistry.ts`) onto a plain JSON object (the
 * `effective_plan_feature_config`/`effective_app_feature_config` response
 * values) and onto validation error `location`s. YAML override documents are
 * read/written directly via the `yaml` package's own `getIn`/`setIn` (which
 * take a path array, not a pointer string) — `parseJsonPointer` produces that
 * same path array so both call sites agree on segment parsing.
 */

/** Splits a JSON pointer (e.g. "/oauth/client/maximum") into path segments. */
export function parseJsonPointer(pointer: string): string[] {
  if (pointer === "") return [];
  if (!pointer.startsWith("/")) {
    throw new Error(`Invalid JSON pointer: ${pointer}`);
  }
  return pointer
    .split("/")
    .slice(1)
    .map((segment) => segment.replace(/~1/g, "/").replace(/~0/g, "~"));
}

/** Reads the value at `pointer` from a plain JSON-like object. */
export function getAtPointer(value: unknown, pointer: string): unknown {
  let current = value;
  for (const key of parseJsonPointer(pointer)) {
    if (current == null || typeof current !== "object") {
      return undefined;
    }
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}
