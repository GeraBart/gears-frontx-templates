/**
 * Theme Registry - Manages theme registration and application
 *
 * Framework Layer: L2
 */
// @cpt-flow:cpt-frontx-flow-framework-composition-theme-propagation:p1
// @cpt-algo:cpt-frontx-algo-ui-libraries-choice-theme-propagation:p1
// @cpt-dod:cpt-frontx-dod-ui-libraries-choice-theme-propagation:p1

import type { ThemeRegistry, ThemeConfig } from '../types';

/**
 * The attribute a screen host carries so the theme's managed rule reaches it:
 * the screen container marks every element it hands a screen with it (see the
 * shell's `ScreenContainerHooks`), and the managed rule below names it as its
 * second selector.
 */
export const FRONTX_THEME_HOST_ATTRIBUTE = 'data-frontx-theme-host';

/**
 * Create a new theme registry instance.
 */
export function createThemeRegistry(): ThemeRegistry {
  const themes = new Map<string, ThemeConfig>();
  let currentThemeId: string | null = null;

  // Subscription support for React
  const subscribers = new Set<() => void>();
  let version = 0;

  function notifySubscribers(): void {
    version++;
    subscribers.forEach((callback) => {
      callback();
    });
  }

  /**
   * Write theme CSS custom properties into a managed <style> element in <head>.
   * Using a stylesheet rule instead of inline styles allows Shadow DOM :host rules
   * and user CSS to override theme variables, which inline style.setProperty() blocks.
   */
  function applyCSSVariables(variables: Record<string, string>): void {
    if (typeof document === 'undefined') return;

    const existing = document.getElementById('frontx-theme-vars');
    let styleEl: HTMLStyleElement;
    if (existing instanceof HTMLStyleElement) {
      styleEl = existing;
    } else {
      existing?.remove();
      styleEl = document.createElement('style');
      styleEl.id = 'frontx-theme-vars';
      document.head.appendChild(styleEl);
    }

    const sheet = styleEl.sheet;
    if (!sheet) return;
    while (sheet.cssRules.length > 0) sheet.deleteRule(0);

    const parts: string[] = [];
    for (const [key, value] of Object.entries(variables)) {
      parts.push(`${key}: ${value}`);
    }
    if (parts.length === 0) return;
    // :root:root (specificity 0,2,0) so applied theme tokens deterministically beat
    // design-system [data-theme='...'] token blocks (0,1,0) — with plain :root the
    // outcome is a specificity tie decided by style-tag order, which Vite HMR
    // re-injection can flip at any time.
    // The second selector names FRONTX_THEME_HOST_ATTRIBUTE, doubled to stay at
    // (0,2,0): inside a screen's shadow tree the kit's sheet is re-anchored to
    // `:host`, so every kit token is declared on the screen host itself and a
    // declaration there beats one inherited from the document tree - a shell
    // theme value never reached the screen. An outer-tree rule beats a `:host`
    // rule from inside the shadow tree before specificity is compared, so
    // naming the host element here lets the theme's tokens win on it. What
    // wins there reaches the screen's contents only where the kit has no
    // value of its own: the kit re-declares its colour tokens on the screen
    // root's light or dark scope, so a theme's colours change the shell and
    // the screen host, not a screen's own kit surfaces, while the theme's
    // non-colour tokens and its extra steps inherit into the screen. At the
    // same weight as :root:root, a future outer-tree rule of equal weight
    // targeting the host (a module class on the screen container, say) cannot
    // bring the style-tag-order tie back either.
    sheet.insertRule(
      `:root:root, [${FRONTX_THEME_HOST_ATTRIBUTE}][${FRONTX_THEME_HOST_ATTRIBUTE}] { ${parts.join('; ')} }`,
      0
    );
  }

  return {
    register(config: ThemeConfig): void {
      if (themes.has(config.id)) {
        console.warn(`Theme "${config.id}" is already registered. Skipping.`);
        return;
      }

      themes.set(config.id, config);

      // If this is the default theme and no theme is applied yet, apply it
      if (config.default && currentThemeId === null) {
        this.apply(config.id);
      }
    },

    get(id: string): ThemeConfig | undefined {
      return themes.get(id);
    },

    getAll(): ThemeConfig[] {
      return Array.from(themes.values());
    },

    apply(id: string): void {
      const config = themes.get(id);

      if (!config) {
        console.warn(`Theme "${id}" not found. Cannot apply.`);
        return;
      }

      applyCSSVariables(config.variables);
      if (typeof document !== 'undefined') {
        // Default to 'light' rather than removing the attribute: with no
        // data-theme, a dark-OS machine lets the kit's
        // `:root:not([data-theme='light'])` block own every kit-only token
        // while the shell's own tokens stay light — a mixed palette.
        document.documentElement.setAttribute('data-theme', config.appearance ?? 'light');
      }
      currentThemeId = id;
      notifySubscribers();
    },

    getCurrent(): ThemeConfig | undefined {
      return currentThemeId ? themes.get(currentThemeId) : undefined;
    },

    subscribe(callback: () => void): () => void {
      subscribers.add(callback);
      return () => {
        subscribers.delete(callback);
      };
    },

    getVersion(): number {
      return version;
    },
  };
}
