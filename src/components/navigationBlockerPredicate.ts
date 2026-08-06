export interface ShouldBlockNavigationParams {
  isDirty: boolean;
  dialogVisible: boolean;
}

/**
 * Pure predicate extracted from NavigationBlockerDialog's useBlocker
 * callback so it can be unit tested without a router or DOM. Blocks any
 * attempted navigation while dirty -- including hash-only changes such as
 * switching tabs within the same project -- except when the dialog is
 * already showing, so a second navigation attempt doesn't re-trigger it.
 */
export function shouldBlockNavigation({
  isDirty,
  dialogVisible,
}: ShouldBlockNavigationParams): boolean {
  return isDirty && !dialogVisible;
}
