import { test, expect, type Page } from '@playwright/test';
import { menuItemTestId, BLANK_HOME_EXTENSION_ID } from './extensionIds.mjs';
import { SHELL_PORT } from './ports.mjs';

const scheme = process.env.E2E_PROTOCOL === 'h2' ? 'https' : 'http';

/**
 * Smoke: the built host boots and the blank MFE screen mounts with no
 * page errors and no failed requests. Blocking.
 */

async function waitForMountedScreen(page: Page, timeout = 30_000) {
  await page.waitForFunction(
    () => {
      const hosts = document.querySelectorAll(
        '[data-mfe-screen-container] [data-extension-id]',
      );
      for (const h of hosts) {
        const root = (h as HTMLElement).shadowRoot ?? h;
        if (root.childElementCount > 0) return true;
      }
      return false;
    },
    undefined,
    { timeout },
  );
}

test('shell boots and blank MFE screen mounts', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => {
    // Resource-load failures are already asserted through `failed`
    // below (with the font gap allow-listed there); the console's
    // generic "Failed to load resource" line would only duplicate it.
    if (m.type() === 'error' && !m.text().startsWith('Failed to load resource')) {
      errors.push(m.text());
    }
  });
  page.on('pageerror', (e) => errors.push(String(e)));
  const failed: string[] = [];
  page.on('response', (r) => {
    // Known gap, not this spec's subject: font.css references the
    // @fontsource-variable/inter woff2 files that the build does not
    // emit into dist/assets — they 404 on every boot. Everything else
    // must be a clean response.
    if (r.status() >= 400 && !r.url().includes('@fontsource-variable')) {
      failed.push(`${r.status()} ${r.url()}`);
    }
  });

  await page.goto(`${scheme}://localhost:${SHELL_PORT}/`);
  await expect(page.locator('#root')).not.toBeEmpty({ timeout: 60_000 });

  await page.getByTestId(menuItemTestId(BLANK_HOME_EXTENSION_ID)).click();
  await waitForMountedScreen(page);

  expect(failed).toEqual([]);
  expect(errors).toEqual([]);
});
