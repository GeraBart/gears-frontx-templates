import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createMfeBridgeFixture } from '../../../__test-utils__/createMfeBridgeFixture';
import { KitThemedLifecycle } from './shared/KitThemedLifecycle';

type BridgeFixture = ReturnType<typeof createMfeBridgeFixture>;
type TestBridge = BridgeFixture['bridge'];
type TestApp = { id: string };
type ActionPayload = Record<string, string | number | boolean | null>;

// `@gears-frontx/routing-tanstack` ships pre-built ESM: its named exports are
// non-configurable, so `vi.spyOn` on the real module throws "Cannot redefine
// property". Wrapping the real implementation in `vi.fn` here is the
// fallback the plan calls for — every call still runs the real
// `adaptProviderHistory`, so every other test in this file (which never
// inspects the spy) behaves exactly as it would unmocked.
vi.mock('@gears-frontx/routing-tanstack', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@gears-frontx/routing-tanstack')>();
  return { ...actual, adaptProviderHistory: vi.fn(actual.adaptProviderHistory) };
});

/** A bridge for an extension with no host-supplied occupant value (ADR 0036) — the fake router's `adaptProviderHistory` call below receives `undefined` for it, matching a standalone mount with no host. */
function bridgeWithoutProperties(): TestBridge {
  return createMfeBridgeFixture({ extDomainId: 'demo-domain', extensionId: 'hello-instance' }).bridge;
}

/**
 * Mounts Hello World's lifecycle content and waits for the routed screen to
 * actually paint: `EngineProvider`'s initial route match resolves after a
 * microtask the synchronous `render()` call does not wait out on its own —
 * asserting on the DOM immediately after `render()` sees the empty shell
 * `RouterProvider` renders before that match settles, not the mocked screen.
 */
async function mountHelloWorld(bridge: TestBridge): Promise<object> {
  const module = await import('./lifecycle-helloworld');
  const lifecycle: object = module.default;
  const renderContent = Reflect.get(lifecycle, 'renderContent') as (bridge: TestBridge) => React.ReactNode;
  render(<>{renderContent(bridge)}</>);
  await screen.findByTestId('hello-screen');
  return lifecycle;
}

const superMountSpy = vi.fn();
const fetchUserSpy = vi.fn();

// `routedScreen.tsx` builds its own throwaway `createFrontX().use(microfrontends(...)).build()`
// per call now (ADR 0036) to reach its own `FrameworkRouter` — these tests
// call `renderContent(bridge)` directly, bypassing the real `mfes` mount
// pipeline entirely, so there is no real ambient bridge for that router to
// adopt. The fake below gives every call a router whose `adaptHistory()`
// behaves exactly as the real one does with no occupant value: standalone,
// scoped to the page's own address — matching what every one of these
// screens' own tests already expects (no host, no entry address).
vi.mock('@gears-frontx/react', async () => {
  const { adaptProviderHistory, EngineProvider } =
    await import('@gears-frontx/routing-tanstack') as typeof import('@gears-frontx/routing-tanstack');
  // A minimal `NavigationHistory` reading/writing the real `window.location`
  // directly — this package does not depend on `@gears-frontx/routing`
  // itself (MFE packages keep `routing-tanstack` only), and these tests
  // never need more than the browser's own address to drive a standalone
  // `adaptProviderHistory` the way these screens would see with no host.
  const windowHistory = {
    get location() {
      return { path: window.location.pathname, search: window.location.search, hash: window.location.hash, position: 0 };
    },
    subscribe: () => () => {},
    push: (path: string) => window.history.pushState(null, '', path),
    replace: (path: string) => window.history.replaceState(null, '', path),
    go: (delta: number) => window.history.go(delta),
  };
  const fakeFrameworkRouter = {
    navigation: () => ({ navigate: () => {}, replace: () => {} }),
  };
  // `mfeRegistry` is an opaque token here, never read for its own shape —
  // `ExtensionRouter` is faked below rather than exercised for real, so
  // nothing ever calls `buildExtensionHistory` against it.
  const fakeMfeRegistry = {};
  const fakeAppBuilder = {
    use: () => fakeAppBuilder,
    build: () => ({ mfeRegistry: fakeMfeRegistry, mfeRouter: fakeFrameworkRouter }),
  };
  return {
    ActionHandler: class ActionHandler {
      static {
        void 0;
      }
    },
    ThemeAwareReactLifecycle: class ThemeAwareReactLifecycle {
      constructor(public readonly app: TestApp) {}

      mount(container: Element | ShadowRoot, bridge: TestBridge): void {
        superMountSpy(container, bridge);
      }
    },
    createFrontX: () => fakeAppBuilder,
    microfrontends: () => ({}),
    gtsPlugin: {},
    // Real `ExtensionRouter` reaches a real `FrameworkRouter` through
    // `buildExtensionHistory` (framework-internal) — standing in for it
    // here, scoped to `routeTree`/`history` alone: the same
    // `adaptProviderHistory(windowHistory, undefined)` the real router
    // would hand back for a standalone mount (no host, no entry address),
    // which is what every one of these screens' own tests already expect.
    ExtensionRouter: ({ routeTree }: { routeTree: import('@gears-frontx/routing-tanstack').AnyRoute }) => (
      <EngineProvider routeTree={routeTree} history={adaptProviderHistory(windowHistory, undefined)} />
    ),
  };
});

vi.mock('./init', () => ({
  mfeApp: { id: 'demo-mfe-app' },
}));

vi.mock('./actions/profileActions', () => ({
  fetchUser: fetchUserSpy,
}));

vi.mock('./screens/helloworld/HelloWorldScreen', () => ({
  HelloWorldScreen: ({ bridge }: { bridge: { extensionId: string } }) => (
    <div data-testid="hello-screen">{bridge.extensionId}</div>
  ),
}));

vi.mock('./screens/profile/ProfileScreen', () => ({
  ProfileScreen: ({ bridge }: { bridge: { extDomainId: string } }) => (
    <div data-testid="profile-screen">{bridge.extDomainId}</div>
  ),
}));

vi.mock('./screens/theme/CurrentThemeScreen', () => ({
  CurrentThemeScreen: ({ bridge }: { bridge: { extensionId: string } }) => (
    <div data-testid="theme-screen">{bridge.extensionId}</div>
  ),
}));

vi.mock('./screens/uikit/UIKitElementsScreen', () => ({
  UIKitElementsScreen: ({ bridge }: { bridge: { extensionId: string } }) => (
    <div data-testid="uikit-screen">{bridge.extensionId}</div>
  ),
}));

describe('demo-mfe lifecycles', () => {
  it('renders the hello world lifecycle content', async () => {
    const { bridge } = createMfeBridgeFixture({
      extDomainId: 'demo-domain',
      extensionId: 'hello-instance',
    });

    const lifecycle = await mountHelloWorld(bridge);

    expect(Reflect.get(lifecycle, 'app')).toEqual({ id: 'demo-mfe-app' } satisfies TestApp);
    expect(screen.getByTestId('hello-screen').textContent).toContain('hello-instance');
  });

  // `adaptProviderHistory` is the one seam a screen has no host to consult
  // through: no bridge property, no entry address, no back-projection — this
  // pins that a screen still runs, matching the real URL directly, rather
  // than throwing or rendering nothing.
  it('runs a screen provider in standalone mode when the host broadcast no entry address', async () => {
    const tanstack = await import('@gears-frontx/routing-tanstack');
    const adapt = vi.mocked(tanstack.adaptProviderHistory);
    adapt.mockClear();
    window.history.replaceState(null, '', '/standalone-probe?x=1');

    await mountHelloWorld(bridgeWithoutProperties());

    expect(adapt).toHaveBeenCalledTimes(1);
    expect(adapt.mock.calls[0][1]).toBeUndefined();
    expect(adapt.mock.results[0].value.location.pathname).toBe('/standalone-probe');
  });

  it('renders the theme lifecycle content', async () => {
    const module = await import('./lifecycle-theme');
    const lifecycle = module.default;
    const renderContent = Reflect.get(lifecycle, 'renderContent') as (
      bridge: TestBridge,
    ) => React.ReactNode;
    const { bridge } = createMfeBridgeFixture({
      extDomainId: 'demo-domain',
      extensionId: 'theme-instance',
    });

    expect(Reflect.get(lifecycle, 'app')).toEqual({ id: 'demo-mfe-app' } satisfies TestApp);
    render(<>{renderContent(bridge)}</>);

    expect(await screen.findByTestId('theme-screen')).toHaveProperty(
      'textContent',
      expect.stringContaining('theme-instance'),
    );
  });

  it('renders the uikit lifecycle content', async () => {
    const module = await import('./lifecycle-uikit');
    const lifecycle = module.default;
    const renderContent = Reflect.get(lifecycle, 'renderContent') as (
      bridge: TestBridge,
    ) => React.ReactNode;
    const { bridge } = createMfeBridgeFixture({
      extDomainId: 'demo-domain',
      extensionId: 'uikit-instance',
    });

    expect(Reflect.get(lifecycle, 'app')).toEqual({ id: 'demo-mfe-app' } satisfies TestApp);
    render(<>{renderContent(bridge)}</>);

    expect((await screen.findByTestId('uikit-screen')).textContent).toContain('uikit-instance');
  });

  /*
   * Which base class an entry extends is the whole of whether its screen gets
   * the kit's tokens, and getting it wrong is invisible from inside the entry:
   * `ThemeAwareReactLifecycle` mounts and themes the screen either way, and the
   * kit components simply paint from unresolved `var()` references.
   *
   * The theme screen is the negative case rather than an omission: it paints
   * from the shell's Tailwind colour utilities alone and renders no kit
   * component, so it needs no kit CSS inside its shadow root.
   */
  it('builds the three kit screens on the lifecycle that carries the kit tokens', async () => {
    const kitEntries = await Promise.all([
      import('./lifecycle-helloworld'),
      import('./lifecycle-profile'),
      import('./lifecycle-uikit'),
    ]);

    for (const { default: lifecycle } of kitEntries) {
      expect(lifecycle).toBeInstanceOf(KitThemedLifecycle);
    }

    const { default: themeLifecycle } = await import('./lifecycle-theme');

    expect(themeLifecycle).not.toBeInstanceOf(KitThemedLifecycle);
  });

  // `:root` matches no node in a shadow tree, so the kit's tokens only reach its
  // components once every selector position naming it names the host instead.
  it('re-anchors the ui-kit design tokens onto the shadow host it renders into', async () => {
    const module = await import('./lifecycle-uikit');
    const initializeStyles = Reflect.get(module.default, 'initializeStyles') as (
      container: ShadowRoot
    ) => void;
    const shadowRoot = document.createElement('div').attachShadow({ mode: 'open' });

    initializeStyles.call(module.default, shadowRoot);

    const injectedCss = shadowRoot.querySelector('style')?.textContent ?? '';

    expect(injectedCss).toContain(':host {');
    // Not "no `:root` starts a line": a survivor mid-line matches nothing in a
    // shadow tree just as silently, so nothing named `:root` may remain at all.
    expect(injectedCss).not.toContain(':root');
    // And the dark block has to keep matching the host, which the functional
    // form is the only way to do: a featureless host matches `:host(...)` and
    // not a `:host:not(...)` compound.
    expect(injectedCss).toContain(":host(:not([data-theme='light']))");
  });

  it('registers the refresh handler after profile mount and delegates to fetchUser', async () => {
    const module = await import('./lifecycle-profile');
    const lifecycle = module.default as {
      mount: (container: Element, bridge: TestBridge) => void;
    };
    const renderContent = Reflect.get(lifecycle, 'renderContent') as (
      bridge: TestBridge,
    ) => React.ReactNode;
    const fixture = createMfeBridgeFixture({
      extDomainId: 'profile-domain',
      extensionId: 'profile-instance',
    });
    const container = document.createElement('div');

    expect(Reflect.get(lifecycle, 'app')).toEqual({ id: 'demo-mfe-app' } satisfies TestApp);
    render(<>{renderContent(fixture.bridge)}</>);

    expect((await screen.findByTestId('profile-screen')).textContent).toContain('profile-domain');

    lifecycle.mount(container, fixture.bridge);

    expect(superMountSpy).toHaveBeenCalledWith(container, fixture.bridge);
    expect(fixture.registerActionHandler).toHaveBeenCalledTimes(1);

    const [actionId, handler] = fixture.registerActionHandler.mock.calls[0] as [
      string,
      { handleAction: (actionTypeId: string, payload: ActionPayload | undefined) => Promise<void> },
    ];

    expect(actionId).toBe(
      'gts.frontx.mfes.comm.action.v1~frontx.demo.action.refresh_profile.v1~'
    );

    await expect(handler.handleAction(actionId, undefined)).resolves.toBeUndefined();
    expect(fetchUserSpy).toHaveBeenCalledTimes(1);
  });
});
