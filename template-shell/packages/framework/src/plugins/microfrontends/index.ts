/**
 * Microfrontends Plugin
 *
 * Enables MFE capabilities in FrontX applications.
 * This plugin accepts NO configuration parameters.
 * All MFE registration happens dynamically at runtime.
 *
 * @packageDocumentation
 */

// @cpt-flow:cpt-frontx-flow-framework-composition-mfe-lifecycle:p1
// @cpt-flow:cpt-frontx-flow-framework-composition-shared-property-broadcast:p1
// @cpt-algo:cpt-frontx-algo-framework-composition-gts-validation:p1
// @cpt-state:cpt-frontx-state-framework-composition-mfe-mount:p1
// @cpt-dod:cpt-frontx-dod-framework-composition-mfe-plugin:p1
// @cpt-dod:cpt-frontx-dod-framework-composition-shared-property:p1

import {
  type MfeHandler,
  type TypeSystemPlugin,
} from '@gears-frontx/mfes';
import { mfeRegistryFactory } from '../../mfe/registry';
import { entryAddressesSchema } from '../../mfe/entry-addresses-schema';
import type { FrontXPlugin } from '../../types';
import { mfeSlice } from './slice';
import { initMfeEffects } from './effects';
import {
  loadExtension,
  mountExtension,
  unmountExtension,
  registerExtension,
  unregisterExtension,
  setMfeRegistry,
} from './actions';
/**
 * Configuration for the microfrontends plugin.
 */
export interface MicrofrontendsConfig {
  /**
   * Type system plugin for entity validation.
   * The registry uses this for domain, extension, and handler type validation.
   */
  typeSystem: TypeSystemPlugin;

  /**
   * Optional MFE handlers to register with the screensets registry.
   * Handlers enable loading of specific MFE entry types (e.g., MfeEntryMF).
   *
   * If not provided, no handlers are registered. Applications must register
   * handlers manually via mfeRegistry API.
   */
  mfeHandlers?: MfeHandler[];
}

/**
 * Microfrontends plugin factory.
 *
 * Enables MFE capabilities in FrontX applications. Optionally accepts MFE handlers
 * for registration at plugin initialization.
 *
 * **Key Principles:**
 * - Optional mfeHandlers config for handler registration
 * - NO static domain registration - domains are registered at runtime
 * - Builds mfeRegistry with provided TypeSystemPlugin at plugin initialization
 * - Same TypeSystemPlugin instance is propagated throughout
 * - Integrates MFE lifecycle with Flux data flow (actions, effects, slice)
 *
 * @param config - Optional configuration with mfeHandlers array
 *
 * @example
 * ```typescript
 * import { createFrontX, microfrontends } from '@gears-frontx/framework';
 * import { MfeHandlerMF } from '@gears-frontx/mfes';
 * import { FrontX_MFE_ENTRY_MF } from '@gears-frontx/framework';
 * import { gtsPlugin } from '@gears-frontx/gts-plugin';
 *
 * const app = createFrontX()
 *   .use(microfrontends({
 *     typeSystem: gtsPlugin,
 *     mfeHandlers: [new MfeHandlerMF(FrontX_MFE_ENTRY_MF)],
 *   }))
 *   .build();
 *
 * // Register domains dynamically at runtime:
 * app.mfeRegistry.registerDomain(sidebarDomain, containerProvider);
 *
 * // Use MFE actions:
 * app.actions.loadExtension('my.extension.v1');
 * app.actions.mountExtension('my.extension.v1');
 * ```
 */
// @cpt-begin:cpt-frontx-flow-framework-composition-mfe-lifecycle:p1:inst-1
// @cpt-begin:cpt-frontx-state-framework-composition-mfe-mount:p1:inst-1
// @cpt-begin:cpt-frontx-dod-framework-composition-mfe-plugin:p1:inst-1
export function microfrontends(config: MicrofrontendsConfig): FrontXPlugin {
  // Base domains declare this shared property. Keeping its schema alongside
  // those declarations makes every framework consumer valid without asking
  // each shell to know an implementation detail of the domains it installs.
  config.typeSystem.registerSchema(entryAddressesSchema);
  // Build the MfeRegistry instance with provided TypeSystemPlugin and optional handlers
  // This registry handles all MFE lifecycle: domains, extensions, actions, etc.
  // TypeSystemPlugin binding happens here at application wiring level.
  const mfeRegistry = mfeRegistryFactory.build({
    typeSystem: config.typeSystem,
    mfeHandlers: config.mfeHandlers,
  });

  // Store cleanup functions in closure (encapsulated per plugin instance)
  let effectsCleanup: (() => void) | null = null;

  return {
    name: 'microfrontends',
    dependencies: [],

    provides: {
      registries: {
        // Expose the MFE-enabled MfeRegistry
        // This registry has registerDomain(), registerExtension(), etc.
        mfeRegistry,
      },
      slices: [mfeSlice],
      // NOTE: Effects are NOT initialized via provides.effects.
      // They are initialized in onInit to capture cleanup references.
      // The framework calls provides.effects at build step 5, then onInit at step 7.
      // We only initialize effects in onInit to avoid duplicate event listeners.
      actions: {
        loadExtension,
        mountExtension,
        unmountExtension,
        registerExtension,
        unregisterExtension,
      },
    },

    onInit(): void {
      // Wire the registry reference into actions module
      setMfeRegistry(mfeRegistry);

      // Initialize effects and store cleanup references
      effectsCleanup = initMfeEffects(mfeRegistry);

      // Plugin is now initialized
      // TypeSystemPlugin: bound to mfeRegistry
      // MFE handlers: registered via config.mfeHandlers
      // Base domains: NOT pre-registered - registered dynamically at runtime
      // MFE actions: loadExtension, mountExtension, unmountExtension available

      // Plugin is now ready
      // Base domains are NOT registered here - they are registered dynamically
      // at runtime via app.mfeRegistry.registerDomain() or actions
    },

    onDestroy(): void {
      // Cleanup event subscriptions
      if (effectsCleanup) {
        effectsCleanup();
        effectsCleanup = null;
      }
    },
  };
}
// @cpt-end:cpt-frontx-flow-framework-composition-mfe-lifecycle:p1:inst-1
// @cpt-end:cpt-frontx-state-framework-composition-mfe-mount:p1:inst-1
// @cpt-end:cpt-frontx-dod-framework-composition-mfe-plugin:p1:inst-1

// Re-export MFE actions for direct usage
export {
  loadExtension,
  mountExtension,
  unmountExtension,
  registerExtension,
  unregisterExtension,
  type RegisterExtensionPayload,
  type UnregisterExtensionPayload,
} from './actions';

// Re-export MFE slice and selectors
export {
  mfeSlice,
  mfeActions,
  selectExtensionState,
  selectRegisteredExtensions,
  selectExtensionError,
  selectMountedExtensions,
  addExtensionMounted,
  removeExtensionMounted,
  type MfeState,
  type ExtensionRegistrationState,
} from './slice';

// Re-export FrontX layout domain constants and MfeEvents
export {
  FRONTX_POPUP_DOMAIN,
  FRONTX_SIDEBAR_DOMAIN,
  FRONTX_SCREEN_DOMAIN,
  FRONTX_OVERLAY_DOMAIN,
  MfeEvents,
} from './constants';

export {
  DomainRouting,
  dispatchChain,
  type DomainRouteStatus,
  type DomainRoutingOptions,
} from './domain-routing';
export { buildEntryAddresses, readEntryAddress, rootDomainKeyOf } from './entry-address';

// Re-export base ExtensionDomain constants
export {
  screenDomain,
  sidebarDomain,
  popupDomain,
  overlayDomain,
} from './base-domains';
