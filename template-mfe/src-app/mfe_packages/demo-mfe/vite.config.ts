// @cpt-dod:cpt-frontx-dod-mfe-isolation-mf-vite-plugin:p1
// @cpt-flow:cpt-frontx-flow-mfe-isolation-build-v2:p2
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { federation } from '@module-federation/vite';
import { frontxMfGts } from '@gears-frontx/frontx-template-shell/build/mf-gts';

const sharedDeps = [
  'react',
  'react-dom',
  '@gears-frontx/react',
  // Shared alongside @gears-frontx/react rather than left to inline: this
  // MFE imports routing-tanstack directly (routedScreen.tsx's
  // createRootRoute), and ExtensionRouter (@gears-frontx/react) builds the
  // router over that same route tree. Without a shared entry, esbuild/
  // rollup each mint their own copy of @tanstack/react-router — harmless
  // while no screen here calls a context-reading hook, but a route
  // component that starts calling one (e.g. useSearch) would hit the same
  // null-context crash widgets-fixture-a did.
  '@gears-frontx/routing-tanstack',
  '@gears-frontx/framework',
  '@gears-frontx/state',
  '@gears-frontx/mfes',
  '@gears-frontx/gts-plugin',
  '@gears-frontx/api',
  '@gears-frontx/i18n',
  '@tanstack/react-query',
  '@reduxjs/toolkit',
  'react-redux',
];

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'demoMfe',
      filename: 'remoteEntry.js',
      exposes: {
        './lifecycle-helloworld': './src/lifecycle-helloworld.tsx',
        './lifecycle-profile': './src/lifecycle-profile.tsx',
        './lifecycle-theme': './src/lifecycle-theme.tsx',
        './lifecycle-uikit': './src/lifecycle-uikit.tsx',
        './lifecycle-widgets-host': './src/lifecycle-widgets-host.tsx',
      },
      // Empty shared config — MF 2.0's shared dep mechanism is bypassed.
      // Shared deps are externalized via rollupOptions.external and provided
      // at runtime by the handler's bare-specifier rewriting.
      shared: {},
      // mf-manifest.json must be generated alongside remoteEntry.js so that
      // MfeHandlerMF can discover expose chunk paths without regex-parsing the bundle.
      manifest: true,
    }),
    frontxMfGts(),
  ],
  build: {
    target: 'esnext',
    modulePreload: false,
    minify: true,
    cssCodeSplit: true,
    rollupOptions: {
      // Preserve bare specifiers for shared deps in the output chunks.
      // The handler rewrites these to blob URLs at runtime.
      external: sharedDeps,
    },
  },
});
