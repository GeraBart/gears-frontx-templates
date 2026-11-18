import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: { dedupe: ['react', 'react-dom'] },
  test: {
    globals: true,
    environment: 'jsdom',
    // Dates and times in the expected texts are written for UTC, whatever the machine's zone.
    env: { TZ: 'UTC' },
    // The widget build script's own tests are node level and spawn real builds, so they live next to the script.
    include: ['src-app/mfe_packages/*/src/**/*.test.{ts,tsx}', 'src-app/mfe_packages/widgets/*.test.mjs'],
    setupFiles: ['src-app/test-setup.ts'],
    css: { modules: { classNameStrategy: 'non-scoped' } },
    // The kit's entries import their own CSS, so they go through the Vite pipeline instead of Node.
    server: { deps: { inline: [/@gears-frontx\/ui-kit/] } },
  },
});
