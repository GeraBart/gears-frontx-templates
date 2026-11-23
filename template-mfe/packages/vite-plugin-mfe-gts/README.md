# @gears-frontx/vite-plugin-mfe-gts

The single, type-system-dependent Vite plugin for a FrontX MFE build.
This package is template territory: it is published for MFE repos to
install, and carries no `@cpt-` markers.

## What it does

`vitePluginMfeGts()` returns the whole plugin array an MFE's
`vite.config.ts` needs — it owns Module Federation and the build
settings itself:

- configures `@module-federation/vite` internally: federation name from
  the MFE's `package.json` (scope stripped, camelCase), fixed
  `remoteEntry.js`, `shared` always `{}` (MF 2.0 sharing is bypassed —
  configuring a federation plugin by hand, federation sharing included,
  is a build error), `manifest` always `true` so `mf-manifest.json` is
  emitted for expose chunk discovery, `dts` always `false` (the host loads
  an MFE through its GTS manifest, so no federated type bundle is read);
- enforces `build.target: 'esnext'`, `modulePreload: false`,
  `minify: true`, `cssCodeSplit: true` — a user override is warned about
  (a different value would break remote loading) and ignored;
- resolves the shared-dependency set via `@gears-frontx/unit-producer`'s
  `SharedSetResolver` and the build graph (share-by-default from
  `dependencies` + non-optional `peerDependencies` plus every bare package
  the code imports, workspace-linked or aliased ones included; mutually
  exclusive `include` / `exclude`; never a name list) and
  externalizes it by root package name, so `react-dom/client` and other
  subpaths externalize too;
- rewrites the MFE's own named and default imports from a shared
  package's barrel to the modules that define them (`<pkg>/<module-path>`)
  for packages declaring side-effect freedom, so roots name only the units
  defining used bindings; namespace, side-effect and dynamic imports keep
  the barrel, `barrelRewriteExclude` (option or `mfe.json`
  `share.barrelRewrite.exclude`) opts a package out, and a rewrite no
  produced unit answers goes back to the barrel after production;
- rewrites lazy `import()` calls in compiled chunks to `__frontx_lazy`;
- produces the shared units, packs and graph files under
  `dist/<sharedOutDir>` (default `shared`); a shared unit's named imports
  from another shared package's barrel are rewritten to the defining
  modules by the same rules (kept on the barrel, with the reason, when
  no produced unit answers them);
- enriches `dist/mfe-manifest.json` into the closed served contract:
  the manifest carries only `id`, `metaData` (`publicPath`, `sharedBase`),
  `units` and `lists`; each entry carries `exposeAssets`
  (`js.sync`, `css.sync`, `css.async`). The authored `remoteEntry` of
  `mfe.json` is an input only and is never served;
- validates every `mfe.json` schema and entity by registering it with a
  `TypeSystemPlugin` (`@gears-frontx/gts-plugin`, isolated store) — the
  type system's verdict, never a regex;
- imports, where the MFE's code imports a shared module, the stylesheets
  that module's static import graph loads (shared units load none), so
  the MFE's own CSS carries the kit CSS of the components it uses;
- attributes emitted CSS to every expose that reaches it, kit CSS from
  `node_modules` included, and fails the build when a stylesheet an
  expose reaches is left undeliverable (stylesheets that compile to no
  CSS, recorded right before `vite:css-post`, never count);
- keeps each exposed module's own `default` export by emitting the module as an entry chunk with its export signature preserved, once per build at build start in sorted expose order, each module resolved through the bundler (extensionless paths, symlinks and queries included), and fails the build naming the expose when a module does not resolve or has no entry chunk;
- emits `dist/mfe-build-report.json` (per-MFE unit mode, barrel mode,
  reachable vs total bytes, fallback reasons, consumer barrel outcomes,
  each shared package's imported-barrel outcomes, and every kept
  barrel with its reason) and a matching log line.

## Usage

```ts
import { vitePluginMfeGts } from '@gears-frontx/vite-plugin-mfe-gts';

export default defineConfig({
  plugins: [
    react(),
    vitePluginMfeGts({
      exposes: { './lifecycle': './src/lifecycle.tsx' },
    }),
  ],
});
```

Exposes come from the `exposes` option or, absent that, `mfe.json`'s
`exposes` field. Options (all optional): `exposes`, `root` (where
`package.json`/`mfe.json` are read; defaults to `process.cwd()`),
`include`, `exclude`, `sharedOutDir`, `barrelRewriteExclude`, `typeSystem`
(test seam).
