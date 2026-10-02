/**
 * C1: coordinates focus-on-navigation between `App` (which only knows *when* a real navigation
 * happened — a `hashchange`, never a `replaceRoute` filter/page update) and each screen's
 * `PageTitle` heading (which only knows *when* it has actually rendered — screens show a
 * `LoadingCard` with no heading first, so App cannot just query the DOM for an `h2` on hash change).
 * A single App instance makes a module-level flag simpler and more robust than threading this
 * through every container's props.
 */
let pending = false;

/** Flags that the next `PageTitle` to mount should move focus to itself. */
export function requestPageFocus(): void {
  pending = true;
}

/** Consumes the flag (if set) so only the first `PageTitle` to mount after a navigation reacts. */
export function consumePageFocus(): boolean {
  if (!pending) return false;
  pending = false;
  return true;
}
