/**
 * useMountedExtensions against a REAL registry and the REAL framework router:
 * mounts and unmounts are driven through `mount_ext` / `unmount_ext` chains,
 * the only thing that changes a domain's mounted set.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type React from 'react';
import type { ActionPayload, ChildMfeBridge, DomainContext, Extension, ExtensionDomain, FrontXApp, MfeEntry } from '@gears-frontx/framework';

const MOUNT = 'gts.frontx.mfes.comm.action.v1~frontx.mfes.ext.mount_ext.v1~';
const LOAD = 'gts.frontx.mfes.comm.action.v1~frontx.mfes.ext.load_ext.v1~';
const UNMOUNT = 'gts.frontx.mfes.comm.action.v1~frontx.mfes.ext.unmount_ext.v1~';
const ENTRY_ID = 'gts.frontx.mfes.mfe.entry.v1~test.mounted.hook.entry.v1';
const DOMAIN_A = 'gts.frontx.mfes.ext.domain.v1~test.mounted.hook.domain_a.v1';
const DOMAIN_B = 'gts.frontx.mfes.ext.domain.v1~test.mounted.hook.domain_b.v1';

const domain = (id: string): ExtensionDomain => ({
  id,
  sharedProperties: [],
  actions: [LOAD, MOUNT, UNMOUNT],
  extensionsActions: [],
  defaultActionTimeout: 5000,
  lifecycleStages: [],
  extensionsLifecycleStages: [],
});

const extension = (name: string, domainId: string): Extension => ({
  id: `gts.frontx.mfes.ext.extension.v1~test.mounted.hook.${name}.v1`,
  domain: domainId,
  entry: ENTRY_ID,
});

let fw: typeof import('@gears-frontx/framework');
let internal: typeof import('@gears-frontx/framework/internal');
let react: typeof import('@gears-frontx/react');
let app: FrontXApp | undefined;

beforeEach(async () => {
  // A runtime builds one app, so each case loads its own module copy.
  vi.resetModules();
  fw = await import('@gears-frontx/framework');
  internal = await import('@gears-frontx/framework/internal');
  react = await import('@gears-frontx/react');
});

afterEach(() => {
  app?.destroy();
  app = undefined;
});

/** A concurrent domain over a detached root: mounts really occupy the registry's mounted set. */
function concurrentDomainFactory() {
  return new (class extends fw.ExtensionDomainImplementationFactory {
    build(ctx: DomainContext) {
      ctx.mounter.attach(document.createElement('div'));
      const strategy = new fw.ConcurrentMountStrategy(ctx.mounter, { create: () => document.createElement('div'), destroy: () => {} });
      ctx.registerHandler(MOUNT, fw.ActionHandler.fromFunction((_t, p) => strategy.mount(p as ActionPayload)));
      ctx.registerHandler(UNMOUNT, fw.ActionHandler.fromFunction((_t, p) => strategy.unmount!(p as ActionPayload)));
      return new (class extends fw.ExtensionDomainImplementation {
        protected getMountStrategies() {
          return [strategy];
        }
      })();
    }
  })();
}

/** Loads every entry and mounts it with nothing to render. */
function buildApp(): FrontXApp {
  class StubHandler extends fw.MfeHandler {
    readonly bridgeFactory = new (class extends fw.MfeBridgeFactory {
      create(): ChildMfeBridge {
        return {} as ChildMfeBridge;
      }
      dispose(): void {}
    })();
    async load() {
      return { mount: () => {}, unmount: () => {} };
    }
  }
  const built = fw
    .createFrontX()
    .use(fw.microfrontends({ typeSystem: fw.gtsPlugin, mfeHandlers: [new StubHandler('gts.frontx.mfes.mfe.entry.v1~')] }))
    .build();
  app = built;
  const registry = built.mfeRegistry;
  if (!registry) throw new Error('Expected mfeRegistry');
  for (const d of [domain(DOMAIN_A), domain(DOMAIN_B)]) {
    registry.registerDomain(d, concurrentDomainFactory());
  }
  const entry: MfeEntry = { id: ENTRY_ID, requiredProperties: [], actions: [], domainActions: [] };
  registry.typeSystem.register(entry);
  return built;
}

/** Runs a mount/unmount chain and resolves once the router has been told it settled. */
async function settle(built: FrontXApp, type: string, domainId: string, subject: string): Promise<void> {
  const registry = built.mfeRegistry!;
  await act(async () => {
    const settled = new Promise<void>((resolve) => {
      const release = internal.subscribeSettledMounts(registry, () => {
        release();
        resolve();
      });
    });
    registry.executeActionsChain({ action: { type, target: domainId, payload: { subject } } });
    await settled;
  });
}

function renderMounted(built: FrontXApp, domainId: string) {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <react.FrontXProvider app={built}>{children}</react.FrontXProvider>
  );
  return renderHook(() => react.useMountedExtensions(domainId), { wrapper });
}

describe('useMountedExtensions', () => {
  it('follows mount_ext and unmount_ext for its own domain', async () => {
    const built = buildApp();
    const extA1 = extension('a1', DOMAIN_A);
    const extA2 = extension('a2', DOMAIN_A);
    await built.mfeRegistry!.registerExtension(extA1);
    await built.mfeRegistry!.registerExtension(extA2);
    const { result } = renderMounted(built, DOMAIN_A);
    expect(result.current).toEqual([]);

    await settle(built, MOUNT, DOMAIN_A, extA1.id);
    expect(result.current.map((e) => e.id)).toEqual([extA1.id]);

    await settle(built, MOUNT, DOMAIN_A, extA2.id);
    expect(result.current.map((e) => e.id)).toEqual([extA1.id, extA2.id]);

    await settle(built, UNMOUNT, DOMAIN_A, extA1.id);
    expect(result.current.map((e) => e.id)).toEqual([extA2.id]);
  });

  it('keeps the same array when another domain settles a mount', async () => {
    const built = buildApp();
    const extB = extension('b1', DOMAIN_B);
    await built.mfeRegistry!.registerExtension(extB);
    const { result } = renderMounted(built, DOMAIN_A);
    const before = result.current;

    await settle(built, MOUNT, DOMAIN_B, extB.id);

    expect(result.current).toBe(before);
  });

  it('throws when the app has no microfrontends plugin', () => {
    app = fw.createFrontX().build();
    expect(() => renderMounted(app!, DOMAIN_A)).toThrow(/microfrontends plugin/i);
  });
});
