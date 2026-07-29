import { parseDocument } from "yaml";
import { deleteAndPruneIn, documentToYamlText } from "../yamlDocumentEdits";

test("checking then unchecking a boolean override returns to the exact original text", () => {
  const original = "";
  const doc = parseDocument(original).clone();
  const path = ["oauth", "client", "custom_ui_enabled"];

  doc.setIn(path, true);
  expect(documentToYamlText(doc)).toBe(
    "oauth:\n  client:\n    custom_ui_enabled: true\n"
  );

  deleteAndPruneIn(doc, path);
  expect(documentToYamlText(doc)).toBe(original);
});

test("unchecking preserves a sibling override under the same parent", () => {
  const doc = parseDocument("").clone();
  doc.setIn(["oauth", "client", "maximum"], 5);
  doc.setIn(["oauth", "client", "custom_ui_enabled"], true);

  deleteAndPruneIn(doc, ["oauth", "client", "custom_ui_enabled"]);

  expect(documentToYamlText(doc)).toBe("oauth:\n  client:\n    maximum: 5\n");
});

test("unchecking preserves unrelated existing top-level content", () => {
  const doc = parseDocument("collaborator:\n  maximum: 3\n").clone();
  doc.setIn(["oauth", "client", "custom_ui_enabled"], true);

  deleteAndPruneIn(doc, ["oauth", "client", "custom_ui_enabled"]);

  expect(documentToYamlText(doc)).toBe("collaborator:\n  maximum: 3\n");
});

test("documentToYamlText returns the empty string once contents are fully pruned, not yaml's literal null", () => {
  const doc = parseDocument("").clone();
  doc.contents = null;
  expect(doc.toString()).toBe("null\n");
  expect(documentToYamlText(doc)).toBe("");
});
