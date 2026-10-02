/**
 * Regression coverage for RM-LIVE2 D2 (issue constructorfabric/gears-frontx#638
 * ledger, row "LIVE2", found by the live browser run): a second entry into
 * Widgets Host within the same page (back/forward, or a fresh in-app Back
 * after leaving) must mount widget DOM again, not leave the widget content
 * area permanently blank.
 *
 * `lifecycle-widgets-host.test.tsx`'s own `FakeRegistry` cannot exercise
 * this: its mocked `ExtensionDomainSlot` never calls anything resembling
 * `mounter.detach()` on cleanup at all (no `return () => {...}` in its
 * effect), so the real release path this test proves — a real
 * `ExtensionDomainSlot` unmount running `mfes`'s own
 * `DefaultExtensionMounter.detach()`, which mass-releases every mounted
 * extension through the SAME shared releaser a strategy's own `unmount()`
 * uses and clears `getMountedExtensions()` for each one — has nothing to
 * interact with there (the same class of gap the RM-LIVE1 regression test's
 * own doc comment calls out for that fake's stub `typeSystem`). This file
 * instead drives the REAL nested app the way production code does: the REAL
 * `bootstrapWidgetsRuntime` against a REAL `createFrontX().use(microfrontends(...))`
 * app (real `MfeRegistry`, real `DefaultExtensionMounter`, real
 * `ConcurrentMountStrategy`), the REAL `ExtensionDomainSlot` react binding,
 * and the REAL `WidgetsDomainImpl` (`holder.impl`, reached only through
 * `bootstrapWidgetsRuntime`'s exported surface — the class itself is not
 * exported, matching production's own encapsulation) — so the real
 * attach/detach/mounted-set bookkeeping this regression covers is actually
 * exercised, not stubbed around.
 *
 * Deliberately stops one level below `DemoMfeWidgetsHostLifecycle.mount()`/
 * `unmount()` themselves: driving those needs `WidgetsHostScreen` rendered,
 * which in this exact combination (real `microfrontends()` registry + real
 * `ExtensionDomainSlot`, as opposed to every other lifecycle test's `FakeRegistry`
 * + mocked slot) never committed a first render in this vitest/jsdom
 * environment for reasons independent of D2 — confirmed by isolating
 * `bootstrapWidgetsRuntime` (resolves immediately on its own, see
 * `lifecycle-widgets-host.gts-order.test.ts`) and a standalone real
 * `ExtensionDomainSlot` (attaches immediately on its own) as two working
 * halves that do not compose here. Dispatching a real `mount_ext` chain and
 * unmounting a real `ExtensionDomainSlot` are the exact two operations
 * `WidgetsHostScreen`'s own `handleAttached` (auto-mount) and
 * `DemoMfeWidgetsHostLifecycle.unmount()` (via `super.unmount()`) drive —
 * exercising them directly against the real registry/slot is a faithful
 * proxy for "mount host -> unmount host -> mount host again" without that
 * unrelated render path.
 *
 * The one piece left unreal is `MfeHandlerMF`'s own module-federation network
 * load (fetching a remote's `remoteEntry.js` and evaluating a blob module):
 * infeasible under jsdom without a real dev server, and orthogonal to this
 * regression — D2 lives entirely in the mounter/registry bookkeeping ABOVE
 * that load, never inside it. `TestMfeHandlerMF` below subclasses the REAL
 * `MfeHandlerMF` (same `handledBaseTypeId`, same real `bridgeFactory`, so
 * handler resolution and bridge creation stay real) and overrides only
 * `load()` to resolve immediately to a small lifecycle that stamps a
 * `data-widget-mounted` marker element into its container — the "the
 * widgets are rendered" half of this test's assertion.
 */
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createFrontX,
  effects,
  microfrontends,
  queryCacheShared,
  mock as mockPlugin,
  gtsPlugin,
  ExtensionDomainSlot,
  MfeHandlerMF,
  FRONTX_ACTION_MOUNT_EXT,
  type ChildMfeBridge,
  type MfeEntryLifecycle,
  type MfeEntryMF,
  type MfManifest,
  type MfeRegistry,
} from '@gears-frontx/react';
import { bootstrapWidgetsRuntime, type WidgetsRoutingHolder } from './lifecycle-widgets-host';

const FRONTX_MFE_ENTRY_MF = 'gts.frontx.mfes.mfe.entry.v1~frontx.mfes.mfe.entry_mf.v1~';
const WIDGETS_DOMAIN_ID = 'gts.frontx.mfes.ext.domain.v1~frontx.widgets.area.main.v1';

const ALPHA_ID = 'gts.frontx.mfes.ext.extension.v1~frontx.widgets.fixture_a.widget_alpha.v1';
const BETA_ID = 'gts.frontx.mfes.ext.extension.v1~frontx.widgets.fixture_a.widget_beta.v1';
const GAMMA_ID = 'gts.frontx.mfes.ext.extension.v1~frontx.widgets.fixture_b.widget.v1';
const WIDGET_IDS = [ALPHA_ID, BETA_ID, GAMMA_ID];

/** Every extension id whose test lifecycle's own `mount()` actually ran, in call order — the assertion that matters: the real `ConcurrentMountStrategy.mount()` reaching all the way down to a real per-extension mount, not short-circuited by `WidgetsDomainImpl`'s "already mounted" guard. */
let mountCalls: string[] = [];
/**
 * The exact container/`ShadowRoot` each mount call received, by extension id
 * (overwritten on a remount) — `DefaultMountManager` wraps the container
 * `ConcurrentMountStrategy.mount()` created in a `ShadowRoot` before handing
 * it to the lifecycle (see `MfeEntryLifecycle.mount()`'s own doc comment:
 * "With the default handler (MfeHandlerMF), the container parameter will be
 * a ShadowRoot"), so the marker this test stamps lives behind a shadow
 * boundary `querySelectorAll` from an ancestor of the shadow HOST cannot
 * pierce. Asserting against this captured reference, rather than the outer
 * slot container, is what makes the marker visible to the test at all.
 */
let mountedRoots = new Map<string, Element | ShadowRoot>();

/**
 * Resolved by the test lifecycle's own `mount()` below, the instant the real
 * mount pipeline reaches it — the deterministic settlement signal this test
 * needs, since dispatching a mount is fire-and-forget and `WidgetsDomainImpl`
 * exposes nothing to await, so the helper awaits the lifecycle mount callback.
 * `awaitMount` must be called BEFORE
 * `dispatchMountAndAwait`'s own dispatch, so the resolver is already
 * registered when the synchronous prologue inside the mediator's dispatch
 * reaches this lifecycle's `mount()` — no sleep, no poll.
 */
const mountResolvers = new Map<string, () => void>();

function awaitMount(extensionId: string): Promise<void> {
  // `ExtensionDomainSlot` starts this domain's own router observer itself on
  // attach (ADR 0036, D10/D11) — on the SECOND `attachRealSlot` below, that
  // observer's own initial diff restores every extension the (still-live —
  // `mfes`'s own mass-release on detach dispatches no `unmount_ext` action,
  // so the router never reports a departure for it; `ExtensionMounter.detach()`'s
  // own doc comment) URL already names, through the SAME real mount
  // pipeline this helper awaits, in the same synchronous
  // window `attachRealSlot`'s own `root.render` runs in — strictly BEFORE
  // this helper's caller gets to register its own resolver. `mountedRoots`
  // already carrying this id is that restoration having already landed, so
  // there is nothing further to await.
  if (mountedRoots.has(extensionId)) return Promise.resolve();
  return new Promise((resolve) => mountResolvers.set(extensionId, resolve));
}

/** Dispatches a real `mount_ext` for `extensionId` and resolves once this test's own lifecycle `mount()` ran for it (or had already, per `awaitMount`'s own doc comment). */
function dispatchMountAndAwait(registry: MfeRegistry, extensionId: string): Promise<void> {
  const settled = awaitMount(extensionId);
  try {
    registry.executeActionsChain({
      action: { type: FRONTX_ACTION_MOUNT_EXT, target: WIDGETS_DOMAIN_ID, payload: { subject: extensionId } },
    });
  } catch (error) {
    console.error(`mount ${extensionId} refused`, error);
  }
  return settled;
}

/**
 * Subclasses the REAL `MfeHandlerMF` (real `handledBaseTypeId`, real
 * `bridgeFactory` inherited unmodified via `super()`) and overrides only the
 * module-federation network `load()` — see this file's own doc comment.
 */
class TestMfeHandlerMF extends MfeHandlerMF {
  async load(_entry: MfeEntryMF, extensionId: string): Promise<MfeEntryLifecycle<ChildMfeBridge>> {
    return {
      mount(container: Element | ShadowRoot) {
        mountCalls.push(extensionId);
        mountedRoots.set(extensionId, container);
        const marker = document.createElement('div');
        marker.setAttribute('data-widget-mounted', extensionId);
        container.appendChild(marker);
        mountResolvers.get(extensionId)?.();
        mountResolvers.delete(extensionId);
      },
      unmount(_container: Element | ShadowRoot) {
        // no-op: this test asserts on `mountCalls` and real DOM markers only.
      },
    };
  }
}

function buildManifest(id: string, name: string): MfManifest {
  return {
    id,
    name,
    metaData: {
      name,
      type: 'module',
      buildInfo: { buildVersion: '0.0.0-test', buildName: name },
      remoteEntry: { name, path: `/assets/${name}/remoteEntry.js`, type: 'module' },
      publicPath: `http://localhost:0/${name}/assets/`,
    },
    shared: [],
  } as unknown as MfManifest;
}

const DEMO_MANIFEST = buildManifest(
  'gts.frontx.mfes.mfe.mf_manifest.v1~frontx.demo.mfe.manifest.v1',
  'demo-mfe',
);
const FIXTURE_A_MANIFEST = buildManifest(
  'gts.frontx.mfes.mfe.mf_manifest.v1~frontx.widgets.fixture_a.manifest.v1',
  'widgets-fixture-a',
);
const FIXTURE_B_MANIFEST = buildManifest(
  'gts.frontx.mfes.mfe.mf_manifest.v1~frontx.widgets.fixture_b.manifest.v1',
  'widgets-fixture-b',
);

const EXPOSE_ASSETS = { js: { sync: ['assets/lifecycle.js'], async: [] }, css: { sync: [], async: [] } };

/** Copied verbatim (field-for-field) from `demo-mfe/mfe.json`'s own `domains[0]` — the same real fixture `lifecycle-widgets-host.gts-order.test.ts` uses, for the same reason. */
const WIDGETS_DOMAIN = {
  id: WIDGETS_DOMAIN_ID,
  route: 'widgets',
  sharedProperties: [],
  actions: [
    'gts.frontx.mfes.comm.action.v1~frontx.mfes.ext.load_ext.v1~',
    'gts.frontx.mfes.comm.action.v1~frontx.mfes.ext.mount_ext.v1~',
    'gts.frontx.mfes.comm.action.v1~frontx.mfes.ext.unmount_ext.v1~',
  ],
  extensionsActions: [],
  defaultActionTimeout: 5000,
  lifecycleStages: [
    'gts.frontx.mfes.lifecycle.stage.v1~frontx.mfes.lifecycle.init.v1',
    'gts.frontx.mfes.lifecycle.stage.v1~frontx.mfes.lifecycle.activated.v1',
    'gts.frontx.mfes.lifecycle.stage.v1~frontx.mfes.lifecycle.deactivated.v1',
    'gts.frontx.mfes.lifecycle.stage.v1~frontx.mfes.lifecycle.destroyed.v1',
  ],
  extensionsLifecycleStages: [
    'gts.frontx.mfes.lifecycle.stage.v1~frontx.mfes.lifecycle.init.v1',
    'gts.frontx.mfes.lifecycle.stage.v1~frontx.mfes.lifecycle.activated.v1',
    'gts.frontx.mfes.lifecycle.stage.v1~frontx.mfes.lifecycle.deactivated.v1',
    'gts.frontx.mfes.lifecycle.stage.v1~frontx.mfes.lifecycle.destroyed.v1',
  ],
} as unknown as import('@gears-frontx/react').ExtensionDomain;

/** Copied field-for-field from `widgets-fixture-a/mfe.json`, enriched with the `exposeAssets` field `scripts/generate-mfe-manifests.ts` adds before publishing (this file stands in for that generated output, the same way `bootstrapWidgetsRuntime`'s own regression test fixture does). */
const FIXTURE_A_ENTRY = {
  id: 'gts.frontx.mfes.mfe.entry.v1~frontx.mfes.mfe.entry_mf.v1~frontx.widgets.fixture_a.entry.v1',
  requiredProperties: [],
  actions: [],
  domainActions: [
    'gts.frontx.mfes.comm.action.v1~frontx.mfes.ext.mount_ext.v1~',
    'gts.frontx.mfes.comm.action.v1~frontx.mfes.ext.unmount_ext.v1~',
  ],
  manifest: FIXTURE_A_MANIFEST.id,
  exposedModule: './lifecycle',
  exposeAssets: EXPOSE_ASSETS,
} as unknown as MfeEntryMF;

const FIXTURE_B_ENTRY = {
  ...FIXTURE_A_ENTRY,
  id: 'gts.frontx.mfes.mfe.entry.v1~frontx.mfes.mfe.entry_mf.v1~frontx.widgets.fixture_b.entry.v1',
  manifest: FIXTURE_B_MANIFEST.id,
} as unknown as MfeEntryMF;

function extension(id: string, entryId: string, route: string) {
  return { id, domain: WIDGETS_DOMAIN_ID, entry: entryId, route };
}

function fakeManifestResponse() {
  return {
    ok: true,
    json: async () => [
      { manifest: DEMO_MANIFEST, domains: [WIDGETS_DOMAIN], entries: [], extensions: [], schemas: [] },
      {
        manifest: FIXTURE_A_MANIFEST,
        domains: [],
        entries: [FIXTURE_A_ENTRY],
        extensions: [
          extension(ALPHA_ID, FIXTURE_A_ENTRY.id, 'widget-alpha'),
          extension(BETA_ID, FIXTURE_A_ENTRY.id, 'widget-beta'),
        ],
        schemas: [],
      },
      {
        manifest: FIXTURE_B_MANIFEST,
        domains: [],
        entries: [FIXTURE_B_ENTRY],
        extensions: [extension(GAMMA_ID, FIXTURE_B_ENTRY.id, 'widget-b')],
        schemas: [],
      },
    ],
  };
}

/** Renders a fresh, real `ExtensionDomainSlot` bound to `registry` into a fresh container and resolves once its real `mounter.attach(root)` has run — mirrors `WidgetsHostScreen`'s own slot, without the rest of `WidgetsHostScreen` around it (see this file's doc comment). */
async function attachRealSlot(registry: unknown): Promise<{ root: Root; container: HTMLDivElement }> {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  await new Promise<void>((resolve) => {
    root.render(
      <ExtensionDomainSlot
        registry={registry as never}
        domainId={WIDGETS_DOMAIN_ID}
        onAttached={() => resolve()}
      />,
    );
  });
  return { root, container };
}

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.innerHTML = '';
  mountResolvers.clear();
});

describe('WidgetsDomainImpl — real registry remount (RM-LIVE2 D2)', () => {
  it('mounts real widget DOM again on a second entry, after the real domain slot\'s own unmount released the prior occupants', async () => {
    mountCalls = [];
    mountedRoots = new Map();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(fakeManifestResponse()));

    const app = createFrontX()
      .use(effects())
      .use(microfrontends({ typeSystem: gtsPlugin, mfeHandlers: [new TestMfeHandlerMF(FRONTX_MFE_ENTRY_MF)] }))
      .use(queryCacheShared())
      .use(mockPlugin())
      .build();
    const registry = app.mfeRegistry!;
    const holder: WidgetsRoutingHolder = { impl: undefined };
    await bootstrapWidgetsRuntime(app, holder);

    // --- First entry into Widgets Host: real slot attaches, auto-mount pass runs ---------
    const first = await attachRealSlot(registry);
    await Promise.allSettled(WIDGET_IDS.map((id) => dispatchMountAndAwait(registry, id)));

    expect(new Set(mountCalls)).toEqual(new Set(WIDGET_IDS));
    expect(mountCalls).toHaveLength(3);
    for (const id of WIDGET_IDS) {
      expect(mountedRoots.get(id)!.querySelectorAll(`[data-widget-mounted="${id}"]`)).toHaveLength(1);
    }

    // --- Leave Widgets Host: the real slot's own cleanup effect releases every occupant ---
    // `ExtensionDomainSlot`'s own cleanup calls the real per-domain mounter's
    // `detach()` (`mfes`), which mass-releases every currently-mounted
    // extension through the SAME shared releaser a strategy's own
    // `unmount()` uses — clearing `getMountedExtensions()` for each one, so
    // the NEXT mount's auto-mount pass does not find them already "mounted".
    // No release step of this host's own is needed or exercised here.
    first.root.unmount();

    // --- Second entry into Widgets Host (back/forward within the same page) -------------
    const second = await attachRealSlot(registry);
    await Promise.allSettled(WIDGET_IDS.map((id) => dispatchMountAndAwait(registry, id)));

    // Were `getMountedExtensions()` left stale by the first entry's own
    // teardown, `mfes`'s own mount-ext prologue would early-return every one
    // of these three mounts as "already mounted": `mountCalls` would stay at
    // 3 (not 6) and no marker would ever land in `second.container` — the
    // permanent blank the live run found. `ExtensionDomainSlot`'s real
    // `detach()` above is what prevents that.
    expect(mountCalls).toHaveLength(6);
    for (const id of WIDGET_IDS) {
      expect(mountedRoots.get(id)!.querySelectorAll(`[data-widget-mounted="${id}"]`)).toHaveLength(1);
    }

    second.root.unmount();
  });
});
