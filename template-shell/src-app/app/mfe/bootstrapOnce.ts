import type { FrontXApp } from '@gears-frontx/react';
import { bootstrapMFE } from './bootstrap';

/**
 * The in-flight/settled `bootstrapMFE` call, hoisted to module scope rather
 * than component-instance state (a ref or `useState`). A REAL remount — a
 * component unmounting and a later, distinct instance mounting, as opposed to
 * a re-render, which reuses the same instance — starts with fresh instance
 * state every time, so a guard living there would not see that bootstrap
 * already ran and would re-invoke `bootstrapMFE`, re-registering every domain
 * and extension a second time on the same `mfeRegistry`. Every reader of the
 * bootstrap outcome (the screen container, the menu) shares this one promise.
 *
 * Deliberately never cleared on rejection: a `bootstrapMFE` failure can
 * leave some domains/extensions registered and others not (it is not
 * transactional), so retrying from that partial state would not be a safe
 * repeat of the first attempt — there is no isolated "nothing happened yet"
 * state to roll back to.
 *
 * Also never keyed on `app`: a change of `app` across a re-render still
 * resolves against whatever registry the first call bootstrapped.
 */
let bootstrapPromise: ReturnType<typeof bootstrapMFE> | undefined;

export function bootstrapOnce(app: FrontXApp): ReturnType<typeof bootstrapMFE> {
  bootstrapPromise ??= bootstrapMFE(app);
  return bootstrapPromise;
}
