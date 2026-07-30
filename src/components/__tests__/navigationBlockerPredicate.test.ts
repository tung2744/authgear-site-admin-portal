import { shouldBlockNavigation } from "../navigationBlockerPredicate";

/**
 * Pins the blocker predicate's rules: a dirty draft blocks any attempted
 * navigation -- including hash-only changes such as a tab switch -- unless
 * the dialog is already showing, and a clean draft never blocks.
 */

test("blocks any attempted navigation when dirty and the dialog isn't already shown", () => {
  expect(
    shouldBlockNavigation({
      isDirty: true,
      dialogVisible: false,
    })
  ).toBe(true);
});

test("does not block when not dirty", () => {
  expect(
    shouldBlockNavigation({
      isDirty: false,
      dialogVisible: false,
    })
  ).toBe(false);
});

test("does not re-block while the dialog is already visible", () => {
  expect(
    shouldBlockNavigation({
      isDirty: true,
      dialogVisible: true,
    })
  ).toBe(false);
});
