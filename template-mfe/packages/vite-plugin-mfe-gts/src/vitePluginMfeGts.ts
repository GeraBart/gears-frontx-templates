/**
 * `vitePluginMfeGts` — the plugin factory: the package's single function
 * export. Everything else is a class.
 *
 * The factory returns the plugin array a MFE's `vite.config.ts` needs,
 * whole: the `@module-federation/vite` plugins configured by
 * `MfeFederationSetup` (name from `package.json`, `remoteEntry.js`,
 * exposes from the options or `mfe.json`, `shared: {}`, `manifest:
 * true`), then the `MfeGtsPlugin` itself. An MFE's config is just its
 * framework plugin plus `vitePluginMfeGts({ exposes })`.
 */

import type { PluginOption } from 'vite';

import { MfeFederationSetup } from './MfeFederationSetup';
import { MfeGtsPlugin, type VitePluginMfeGtsOptions } from './MfeGtsPlugin';

export default function vitePluginMfeGts(
  options?: VitePluginMfeGtsOptions
): PluginOption[] {
  const setup = new MfeFederationSetup(
    options?.root ?? process.cwd(),
    options?.exposes
  );
  return [
    ...setup.plugins(),
    new MfeGtsPlugin({
      ...options,
      exposes: setup.getSettings().exposes,
      ownedFederationPlugins: new Set(setup.plugins()),
    }).toVitePlugin(),
  ];
}
