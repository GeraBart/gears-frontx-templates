/*
 * The screen slot's side padding is a contract between the shell and every
 * screen it mounts: the shell insets a screen by `var(--space-4)` on both
 * sides, and a screen opts out by setting `--frontx-screen-inline-padding: 0`
 * on its own `:host`. The contract lives in the CSS module's text, so this
 * file reads it from disk - Vitest hands CSS imports back empty, which would
 * let every check below pass on nothing (the same trick `themes.test.ts`
 * uses for the kit's stylesheet). Layout assertions cannot pin it: jsdom runs
 * no cascade, and the shadow root is the MFE runtime's to build.
 *
 * Two invariants on the screens' side, one on the shell chrome beside them:
 *
 * - The scroller (`.container`) declares no padding and keeps its overflow:
 *   the scrollbar stays at the window's edge, and padding on the scroller
 *   would re-inset it and put a band under the scrollbar.
 * - The host selector (`.slot > [data-extension-id]`, the div the screen
 *   domain's container hooks create) declares the `padding-inline` whose
 *   `var()` names the opt-out property with the shell gutter as fallback.
 * - The load-failure state (`.errorState`, shell chrome that renders straight
 *   into the scroller instead of a screen host) declares the same gutter
 *   through the same custom property, so a project that overrides the gutter
 *   project-wide moves the screens and this state together.
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

const moduleCss = readFileSync(
  createRequire(import.meta.url).resolve('./MfeScreenContainer.module.css'),
  'utf8',
).replace(/\/\*[\s\S]*?\*\//g, '');

const blockBody = (css: string, selector: string): string => {
  const block = css.match(new RegExp(`${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([^}]*)\\}`));
  if (!block) throw new Error(`MfeScreenContainer.module.css declares no ${selector} block`);
  return block[1];
};

describe('the screen slot padding contract', () => {
  it('the scroll container keeps the scrollbar at the window edge: overflow without padding', () => {
    const body = blockBody(moduleCss, '.container');

    expect(body).toMatch(/overflow\s*:\s*auto/);
    expect(body).not.toMatch(/padding/);
  });

  it('the screen host carries the inline padding the screen can opt out of', () => {
    const body = blockBody(moduleCss, '.slot > [data-extension-id]');

    expect(body).toMatch(
      /padding-inline\s*:\s*var\(--frontx-screen-inline-padding,\s*var\(--space-4\)\)/,
    );
  });

  it('the load-failure state carries the same gutter the screens get', () => {
    const body = blockBody(moduleCss, '.errorState');

    expect(body).toMatch(
      /padding\s*:\s*0\s+var\(--frontx-screen-inline-padding,\s*var\(--space-4\)\)/,
    );
  });
});
