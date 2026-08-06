import { parseDocument } from "yaml";
import { parseJsonPointer } from "../../../utils/jsonPointer";

/**
 * Pins the YAML serialization style produced by the table view's commit
 * path (parseJsonPointer -> Document#setIn -> Document#toString, see
 * FeatureConfigTableView.tsx's `commit`): nested objects must use
 * indentation, lists must use hyphens — never flow style (`{ }` / `[ ]`).
 * This is `yaml`'s default behavior for `setIn`, not anything this repo
 * configures explicitly, so this test exists to catch a regression from a
 * `yaml` version bump or an accidental change to how nodes are created.
 */
function setAtPointer(
  yamlText: string,
  jsonPointer: string,
  value: unknown
): string {
  const doc = parseDocument(yamlText).clone();
  doc.setIn(parseJsonPointer(jsonPointer), value);
  return doc.toString();
}

test("creating a new nested object via the table view uses indentation, not flow style", () => {
  const result = setAtPointer("", "/oauth/client/maximum", 5);
  expect(result).toBe("oauth:\n  client:\n    maximum: 5\n");
  expect(result).not.toContain("{");
});

test("creating a new list via the table view uses hyphens, not flow style", () => {
  const result = setAtPointer("", "/ui/phone_input/allowlist", ["US", "GB"]);
  expect(result).toBe(
    "ui:\n  phone_input:\n    allowlist:\n      - US\n      - GB\n"
  );
  expect(result).not.toContain("[");
});

test("setting a field alongside existing content keeps block style throughout", () => {
  const withFirstField = setAtPointer(
    "collaborator:\n  maximum: 3\n",
    "/oauth/client/maximum",
    5
  );
  const result = setAtPointer(
    withFirstField,
    "/identity/oauth/providers/google/disabled",
    true
  );
  expect(result).toBe(
    "collaborator:\n  maximum: 3\noauth:\n  client:\n    maximum: 5\nidentity:\n  oauth:\n    providers:\n      google:\n        disabled: true\n"
  );
});

test("an explicit empty list still serializes as [] — this is intentional (allow-all), not flow style creeping back in", () => {
  const result = setAtPointer("", "/ui/phone_input/allowlist", []);
  expect(result).toBe("ui:\n  phone_input:\n    allowlist: []\n");
});
