import { Document, isMap, isSeq } from "yaml";

/**
 * `Document#deleteIn` only removes the leaf key — it leaves now-empty parent
 * maps behind (e.g. unchecking the only override under `oauth.client` leaves
 * `oauth: { client: {} }` instead of removing `oauth` entirely). Left alone,
 * a check-then-uncheck round trip never returns to the original YAML text,
 * which makes dirty-checking (a plain string comparison against the saved
 * baseline) incorrectly stay dirty forever. Prune upward from the deleted
 * leaf, removing every now-empty ancestor map/sequence, all the way to the
 * document root if needed.
 */
export function deleteAndPruneIn(doc: Document, path: string[]): void {
  doc.deleteIn(path);
  for (let i = path.length - 1; i > 0; i--) {
    const ancestorPath = path.slice(0, i);
    const node = doc.getIn(ancestorPath, true);
    if ((isMap(node) || isSeq(node)) && node.items.length === 0) {
      doc.deleteIn(ancestorPath);
    } else {
      return;
    }
  }
  if (
    (isMap(doc.contents) || isSeq(doc.contents)) &&
    doc.contents.items.length === 0
  ) {
    doc.contents = null;
  }
}

/**
 * `parseDocument("").toString()` is `"null\n"`, not `""` — so once
 * `deleteAndPruneIn` clears a document back to nothing, serialize it back to
 * the empty string explicitly rather than via `Document#toString()`, to
 * match what "no override" actually looks like on the wire
 * (`app_feature_config_yaml: ""`).
 */
export function documentToYamlText(doc: Document): string {
  return doc.contents == null ? "" : doc.toString();
}
