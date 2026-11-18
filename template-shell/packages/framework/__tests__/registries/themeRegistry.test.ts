/**
 * The theme registry's managed rule reaches the screen host.
 *
 * Inside a mounted screen the kit's sheet is re-anchored to `:host`, so every
 * kit token is declared on the screen host element and a declaration there
 * beats one inherited from the document tree: a shell theme value written to
 * `:root:root` alone never reached a screen (measured: root 2.25rem, screen
 * 1.625rem). The managed rule therefore names the theme host attribute as its
 * second selector - an outer-tree rule beats a `:host` rule from inside the
 * shadow tree before specificity is compared - and the screen container marks
 * every screen host with that attribute.
 *
 * The rule is read back through the CSSOM of the <style id="frontx-theme-vars">
 * element the registry writes, so the assertion sees the selector the browser
 * parses, not the string this package happens to concatenate.
 *
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it } from 'vitest';
import { createThemeRegistry, FRONTX_THEME_HOST_ATTRIBUTE } from '../../src/registries';

const managedRule = (): CSSStyleRule => {
  const style = document.getElementById('frontx-theme-vars');
  if (!(style instanceof HTMLStyleElement)) throw new Error('the theme registry wrote no managed style element');
  const rule = style.sheet?.cssRules[0];
  if (!(rule instanceof CSSStyleRule)) throw new Error('the managed style element holds no rule');
  return rule;
};

describe('createThemeRegistry: the managed theme rule', () => {
  afterEach(() => {
    document.getElementById('frontx-theme-vars')?.remove();
  });

  it('names the theme host attribute beside :root:root, so a theme value reaches the screen host', () => {
    const registry = createThemeRegistry();
    registry.register({ id: 'dark', name: 'Dark', variables: { '--space-8': '2rem' }, default: true });

    const selector = managedRule().selectorText;

    expect(selector).toContain(`[${FRONTX_THEME_HOST_ATTRIBUTE}][${FRONTX_THEME_HOST_ATTRIBUTE}]`);
    expect(selector).toContain(':root:root');
  });

  it('holds the host selector at :root:root\'s weight, so no outer-tree tie can depend on style order', () => {
    const registry = createThemeRegistry();
    registry.register({ id: 'dark', name: 'Dark', variables: { '--space-8': '2rem' }, default: true });

    const selectors = managedRule().selectorText.split(',').map((part) => part.trim());

    // The theme host wins over a `:host` rule from inside the shadow tree
    // before specificity is compared, and a future outer-tree rule of the
    // same weight that targets the host (a module class on the screen
    // container, say) must not reintroduce a style-tag-order tie with this
    // rule: the doubled attribute keeps both selectors at (0,2,0).
    expect(selectors).toEqual([
      ':root:root',
      `[${FRONTX_THEME_HOST_ATTRIBUTE}][${FRONTX_THEME_HOST_ATTRIBUTE}]`,
    ]);
  });

  it('keeps carrying the theme variables for the selectors it already served', () => {
    const registry = createThemeRegistry();
    registry.register({ id: 'light', name: 'Light', variables: { '--space-8': '2rem' }, default: true });

    expect(managedRule().cssText).toContain('--space-8: 2rem');
  });
});
