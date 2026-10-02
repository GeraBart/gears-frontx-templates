import React from 'react';
import { createRootRoute } from '@gears-frontx/routing-tanstack';
import { createFrontX, microfrontends, gtsPlugin, ExtensionRouter, type ChildMfeBridge } from '@gears-frontx/react';

/**
 * One screen in its own router: composed over the entry this call's own
 * occupant value addresses (or standalone when none), reached only through
 * `<ExtensionRouter>` (`@gears-frontx/react`) — this screen's own code never
 * imports `createProviderRouter`/`adaptProviderHistory`/`EngineProvider`
 * directly, nor reads an entry address or a raw bridge property for this
 * (ADR 0036, D5). A screen declares no routes of its own, so an undeclared
 * `route=` inside its entry reaches this router's own not-found.
 *
 * Builds its own throwaway `microfrontends()`-bearing app on every call,
 * synchronously — this function is always invoked from a lifecycle's own
 * `renderContent(bridge)`, itself called synchronously inside that
 * lifecycle's own `mount()` override, so this call lands strictly inside the
 * ambient mounting-bridge rendezvous window `DefaultMountManager` opens
 * around that call (mirroring `lifecycle-widgets-host.tsx`'s own
 * `createWidgetsHostApp()` — see its doc comment for why a registry wanting
 * to adopt an inbound bridge must be built freshly inside the mount window
 * rather than once at module-evaluation time). The factory-with-cache
 * pattern (`cpt-frontx-dod-mfe-registry-router-configuration`) still returns
 * this copy's one shared registry and router across every such call, so this
 * costs nothing beyond the one adoption/`supplyNavigation` round each mount
 * needs — it never builds a second, independent registry. The screen's own
 * content tree keeps using `mfeApp` (`init.ts`) for theme/query-cache
 * context; this throwaway app exists only to reach this mount's own
 * occupant value.
 */
export function routedScreen(content: React.ReactNode, _bridge: ChildMfeBridge): React.ReactElement {
  const routingApp = createFrontX().use(microfrontends({ typeSystem: gtsPlugin })).build();
  const routeTree = createRootRoute({
    component: () => <>{content}</>,
    notFoundComponent: () => <p data-testid="screen-not-found">This screen has no such page.</p>,
  });
  return <ExtensionRouter registry={routingApp.mfeRegistry!} routeTree={routeTree} />;
}
