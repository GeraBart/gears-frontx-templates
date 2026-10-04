// @cpt-flow:cpt-frontx-flow-request-lifecycle-query-client-lifecycle:p2

/**
 * MFE Screen Container Component
 *
 * Bootstraps MFE domains and extensions on first mount, then renders the
 * per-domain `<ExtensionDomainSlot>` for the screen domain. `ExtensionDomainSlot`
 * itself starts/stops the screen domain's own URL observer from its own
 * attach/detach (ADR 0036, D10/D11) — this container builds no routing
 * wiring of its own; it only reads that domain's own status (via the
 * shell-scoped `useDomainRouteStatus` hook) to show a fallback when every
 * URL entry for this domain fails to resolve. Mount/unmount actions are
 * dispatched by other components (e.g., the menu) through
 * `registry.executeActionsChain`.
 */

import { useEffect, useState } from 'react';
import {
  useFrontX,
  useMountedExtensions,
  useDomainRouteStatus,
  ExtensionDomainSlot,
  screenDomain,
  FRONTX_SCREEN_DOMAIN,
} from '@gears-frontx/react';
import { bootstrapOnce } from './bootstrapOnce';

export function MfeScreenContainer() {
  const app = useFrontX();
  const [bootstrapped, setBootstrapped] = useState(false);
  const mountedScreens = useMountedExtensions(FRONTX_SCREEN_DOMAIN);
  const status = useDomainRouteStatus(bootstrapped ? app.mfeRegistry : undefined, FRONTX_SCREEN_DOMAIN);

  useEffect(() => {
    let cancelled = false;
    bootstrapOnce(app)
      .then(() => {
        if (!cancelled) setBootstrapped(true);
      })
      .catch((error) => {
        if (!cancelled) console.error('[MFE Bootstrap] Failed to bootstrap MFE:', error);
      });
    return () => {
      cancelled = true;
    };
  }, [app]);

  // Every URL entry for this domain failed to resolve to a mounted screen —
  // an unknown token in the address bar, not a moment mid-mount (which still
  // has zero entries or a resolved one already mounting).
  const unresolvedOnly = status.entries > 0 && status.unresolved === status.entries && mountedScreens.length === 0;

  return (
    <div className="flex-1 overflow-auto" data-mfe-screen-container>
      {bootstrapped && app.mfeRegistry ? (
        <ExtensionDomainSlot
          registry={app.mfeRegistry}
          domainId={screenDomain.id}
          className="h-full"
        />
      ) : null}
      {unresolvedOnly ? (
        <div data-testid="screen-route-fallback" role="status" className="p-6 text-sm text-muted-foreground">
          No screen matches this address.
        </div>
      ) : null}
    </div>
  );
}
