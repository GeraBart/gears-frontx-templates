import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
import type { ThemeConfig } from '@gears-frontx/react';
import { frontxThemes } from './index';

/*
 * The shell's themes sit on top of the kit's theme.css, which is the one
 * palette. These checks read the installed kit's stylesheet, so a kit release
 * that adds or renames a token fails here instead of in a screen.
 */

// Read from disk, not through a `?raw` import: Vitest hands CSS imports back
// empty, which would let every check below pass on nothing.
const resolveFromHere = createRequire(import.meta.url);
const kitThemeCss = readFileSync(resolveFromHere.resolve('@gears-frontx/ui-kit/theme.css'), 'utf8');
const kitCss = kitThemeCss.replace(/\/\*[\s\S]*?\*\//g, '');

const declaredNames = (css: string): Set<string> =>
  new Set([...css.matchAll(/(--[\w-]+)\s*:/g)].map((match) => match[1]));

/** Every custom property the kit declares, in any block. */
const kitTokens = declaredNames(kitCss);

/**
 * The colour tokens the kit declares per appearance: every block whose
 * selector names `data-theme` light or dark, in any quoting. A `:not(...)`
 * selector (the kit's prefers-color-scheme fallback) names the opposite of
 * what it sets, so it is skipped.
 */
const kitAppearanceTokens = (appearance: 'light' | 'dark'): Set<string> => {
  const tokens = new Set<string>();
  const selectorPattern = new RegExp(`\\[data-theme=['"]?${appearance}['"]?\\]`);
  for (const [, selector, body] of kitCss.matchAll(/([^{}]*)\{([^{}]*)\}/g)) {
    if (selector.includes(':not(') || !selectorPattern.test(selector)) continue;
    for (const name of declaredNames(body)) tokens.add(name);
  }
  return tokens;
};

const kitTokensByAppearance = { light: kitAppearanceTokens('light'), dark: kitAppearanceTokens('dark') };

/** The first family a kit font token names, unquoted. */
const kitFirstFamily = (token: string): string | undefined =>
  new RegExp(`${token}\\s*:\\s*['"]?([^'",;]+)`).exec(kitCss)?.[1]?.trim();

/** Names the shell owns: the kit declares none of them. */
const isShellToken = (name: string): boolean =>
  name === '--radius-none' ||
  /^--(left-menu|spacing|shadow|transition)(-|$)/.test(name);

/**
 * The suffixes the kit's type family repeats across roles, read from the
 * names the kit declares (--text-display-size, --text-heading-1-line-height,
 * ...): size, line-height (read whole - a last-segment match would turn every
 * `--text-<role>-line-height` into a bare `height` suffix and let any
 * `--text-<anything>-height` through), weight, tracking. A theme may add a
 * step that reuses one, never an unknown suffix.
 */
const typeSuffixPattern = /^--text-[\w-]+?-(line-height|[a-z]+)$/;
const kitTypeSuffixes = new Set(
  [...kitTokens].flatMap((token) => {
    const match = typeSuffixPattern.exec(token);
    return match ? [match[1]] : [];
  }),
);

/** Whether the kit numbers spacing steps, read once - it never changes mid-run. */
const kitHasSpaceSteps = [...kitTokens].some((token) => /^--space-\d+$/.test(token));

/** Whether the kit sizes control heights, read once for the same reason. */
const kitHasControlHeights = [...kitTokens].some((token) => /^--control-height-[a-z]+$/.test(token));

/**
 * Whether a name adds a step to a kit scale family, derived from the names
 * the installed kit declares, never hard-coded: the spacing steps the kit
 * numbers (--space-<n>), the control heights it sizes (--control-height-<size>)
 * and the type roles it repeats (--text-<role>-<suffix>). A project needing a
 * bigger type role, a wider spacing step or a taller control declares it in
 * its theme file as one more step of the kit's own scale; every other unknown
 * name stays rejected.
 */
const isKitScaleStep = (name: string): boolean => {
  if (kitHasSpaceSteps && /^--space-\d+$/.test(name)) return true;
  if (kitHasControlHeights && /^--control-height-[a-z]+$/.test(name)) return true;
  const type = typeSuffixPattern.exec(name);
  return kitTypeSuffixes.size > 0 && type !== null && kitTypeSuffixes.has(type[1]);
};

/**
 * The one documented prefix a project's own theme tokens live under, in its
 * theme file under `src-app/app/themes/`: a layout width, a gutter, a hero
 * size, a type role the kit's scales do not carry (`--app-gutter`,
 * `--app-hero-size`). Such a token is neither a kit colour override nor a kit
 * scale step: it maps no kit colour, so it never makes a theme a palette of
 * its own. The prefix is the whole door - the bare `--app-`, a name of
 * separators alone after it (`--app--`) and any other unknown name stay
 * rejected: the first character after the prefix must be alphanumeric.
 */
const isProjectToken = (name: string): boolean => /^--app-[a-z0-9][\w-]*$/i.test(name);

/**
 * The left menu family a kit-palette theme declares, selected label token
 * included. The set is pinned so a member dropped or added by hand is caught.
 */
const leftMenuTokens = [
  '--left-menu',
  '--left-menu-border',
  '--left-menu-foreground',
  '--left-menu-hover',
  '--left-menu-selected',
  '--left-menu-selected-foreground',
];

/**
 * Every name the shell's own themes declare: the shell tokens as they exist.
 * A reference that points at a shell token must point at one of these, so a
 * typo in the shell namespace fails here as well as a kit rename does.
 */
const shellTokens = new Set(frontxThemes.flatMap((theme) => Object.keys(theme.variables)));

/** The custom property names a value references through `var()`, in order. */
const referencedTokens = (value: string): string[] =>
  [...value.matchAll(/var\((--[\w-]+)\)/g)].map((match) => match[1]);

/**
 * True when a colour value is built only from token references: var() and
 * color-mix() of var(). After the wrappers are stripped, a literal colour
 * always leaves its function name or hex digits behind.
 */
const isDerivedFromTokens = (value: string): boolean =>
  value
    .replace(/var\(--[\w-]+\)/g, '')
    .replace(/color-mix\(\s*in\s+oklab\s*,/g, '')
    .replace(/[\s(),%/.0-9]/g, '') === '';

const byId = (id: string): ThemeConfig => {
  const theme = frontxThemes.find((candidate) => candidate.id === id);
  if (!theme) throw new Error(`theme "${id}" is not registered`);
  return theme;
};

const names = (theme: ThemeConfig): string[] => Object.keys(theme.variables);

/**
 * The names of a theme that neither the kit, nor the shell, nor a kit scale
 * step, nor the project's own `--app-` prefix shapes: the real check's
 * predicate, defined once so the assertions below cannot drift from it (or
 * from each other).
 */
const unknownNames = (theme: ThemeConfig): string[] =>
  names(theme).filter(
    (name) =>
      !kitTokens.has(name) && !isShellToken(name) && !isKitScaleStep(name) && !isProjectToken(name),
  );

/**
 * The page surface a theme may repaint alone: the page background and the
 * text colour it is read against. The kit's own palette keeps every other
 * colour, so the theme's page surface change stays on the kit's palette.
 */
const PAGE_SURFACE_TOKENS: readonly string[] = ['--background', '--foreground'];

/**
 * A theme with a palette of its own repaints more than the page surface:
 * any kit colour token beyond the page surface pair is the mark of one. A
 * mixed palette risks unreadable pairs, so such a theme must map every
 * colour token of its appearance. A theme that only sets the page surface
 * keeps the kit's palette for everything else and may override a few tokens
 * on purpose without mapping the rest.
 */
const hasOwnPalette = (theme: ThemeConfig): boolean =>
  names(theme).some((name) => kitTokens.has(name) && !PAGE_SURFACE_TOKENS.includes(name));

describe('shell themes over the ui-kit palette', () => {
  it('reads the token set, both appearances and the font stacks from the installed kit', () => {
    expect(kitTokens.size).toBeGreaterThan(50);
    for (const tokens of Object.values(kitTokensByAppearance)) {
      expect(tokens.has('--background')).toBe(true);
      expect(tokens.has('--primary')).toBe(true);
    }
    expect(kitFirstFamily('--font-sans')).toBeTruthy();
  });

  it('gives every theme an appearance, so the kit resolves the matching palette', () => {
    for (const theme of frontxThemes) {
      expect(theme.appearance, theme.id).toMatch(/^(light|dark)$/);
    }
  });

  it('lets every theme override only tokens the kit or the shell declares, add a kit scale step, or name a project token under --app-', () => {
    for (const theme of frontxThemes) {
      expect(unknownNames(theme), theme.id).toEqual([]);
    }
  });

  it('lets a theme add steps to the kit scale families, and nothing else', () => {
    // The one place for a step the kit lacks is the theme file: a bigger type
    // role, a wider spacing step, a taller control, declared as one more step
    // of the kit's own scale.
    const extraSteps: ThemeConfig = {
      id: 'extra-steps',
      name: 'Extra steps',
      appearance: 'light',
      variables: {
        '--space-12': '6rem',
        '--text-display-xl-size': '2.5rem',
        '--text-display-xl-line-height': '3rem',
        '--text-display-xl-weight': '600',
        '--control-height-xl': '2.75rem',
      },
    };
    expect(unknownNames(extraSteps)).toEqual([]);

    // A name no kit family shapes stays rejected, wherever it appears - a
    // `--text-` name included, unless its suffix is one the kit's type roles
    // repeat (`height` alone is not: a bare last-segment match would accept
    // any --text-<anything>-height as a type step).
    const madeUp: ThemeConfig = {
      id: 'made-up',
      name: 'Made up',
      appearance: 'light',
      variables: {
        '--made-up-token': '1rem',
        '--text-row-height': '2rem',
        '--text-icon-height': '1rem',
      },
    };
    expect(unknownNames(madeUp)).toEqual(['--made-up-token', '--text-row-height', '--text-icon-height']);
  });

  it('lets a theme declare its own tokens under the documented --app- prefix, and nothing unprefixed', () => {
    // A project's own layout or type token (a gutter, a hero size) is not a
    // kit colour override and not a kit scale step: it maps no kit colour, so
    // the theme is not a palette of its own because of it.
    const projectTokens: ThemeConfig = {
      id: 'project-tokens',
      name: 'Project tokens',
      appearance: 'light',
      variables: { '--app-gutter': '1.5rem', '--app-hero-size': '3rem' },
    };
    expect(unknownNames(projectTokens)).toEqual([]);
    expect(hasOwnPalette(projectTokens)).toBe(false);

    // The prefix is the whole door: the bare prefix, a separator-only name
    // after it, a lookalike family name and the same names without the prefix
    // all stay rejected, wherever they appear.
    const rejected: ThemeConfig = {
      id: 'rejected-project-tokens',
      name: 'Rejected project tokens',
      appearance: 'light',
      variables: {
        '--app-': '1.5rem',
        '--app--': '3rem',
        '--application-gutter': '1.5rem',
        '--gutter': '1.5rem',
        '--hero-size': '3rem',
      },
    };
    expect(unknownNames(rejected)).toEqual([
      '--app-',
      '--app--',
      '--application-gutter',
      '--gutter',
      '--hero-size',
    ]);
  });

  it('makes a theme with its own palette map every colour token of its appearance', () => {
    const ownPalettes = frontxThemes.filter(hasOwnPalette);
    expect(ownPalettes.map((theme) => theme.id)).toEqual(expect.arrayContaining(['dracula', 'dracula-large']));
    for (const theme of ownPalettes) {
      const kitSet = kitTokensByAppearance[theme.appearance ?? 'light'];
      expect([...kitSet].filter((name) => !(name in theme.variables)), theme.id).toEqual([]);
    }
  });

  it('lets a theme change the page surface alone, without mapping every colour token', () => {
    // A white page on the kit's light palette: the kit keeps every other
    // colour, so this is not a palette of its own and maps nothing.
    const whitePage: ThemeConfig = {
      id: 'white-page',
      name: 'White page',
      appearance: 'light',
      variables: { '--background': '#ffffff' },
    };
    expect(hasOwnPalette(whitePage)).toBe(false);
    // And the kit palette really does hold colour tokens the white page
    // never declares, so the mapping rule would reject it if the predicate
    // fired here: the predicate, not an accident of the shipped themes, is
    // what decides.
    expect([...kitTokensByAppearance.light].filter((name) => !(name in whitePage.variables)).length).toBeGreaterThan(0);
  });

  it('still asks a theme that overrides a kit colour beyond the page surface to map every colour token', () => {
    // One kit colour token past --background/--foreground is a palette of
    // its own: a mixed palette risks unreadable pairs, so the theme must
    // map every colour token of its appearance, --primary included.
    const tintedPrimary: ThemeConfig = {
      id: 'tinted-primary',
      name: 'Tinted primary',
      appearance: 'light',
      variables: { '--primary': '#7c3aed' },
    };
    expect(hasOwnPalette(tintedPrimary)).toBe(true);
    const unmapped = [...kitTokensByAppearance.light].filter((name) => !(name in tintedPrimary.variables));
    expect(unmapped).toContain('--background');
    expect(unmapped.length).toBeGreaterThan(0);
  });

  it.each(['default', 'light', 'dark'])('keeps %s on the kit palette, re-declaring no kit token', (id) => {
    expect(names(byId(id)).filter((name) => kitTokens.has(name))).toEqual([]);
  });

  it.each(['default', 'light', 'dark'])('builds every %s left menu colour from theme tokens, with no literal', (id) => {
    const theme = byId(id);
    const family = names(theme).filter((name) => /^--left-menu(-|$)/.test(name)).sort();
    expect(family, theme.id).toEqual(leftMenuTokens);
    for (const name of family) {
      const value = theme.variables[name] ?? '';
      // A missing or empty value references nothing, and would otherwise pass
      // the no-literal check below.
      const referenced = referencedTokens(value);
      expect(referenced.length, `${theme.id} ${name} = "${value}" references no token`).toBeGreaterThan(0);
      expect(isDerivedFromTokens(value), `${theme.id} ${name} = ${value}`).toBe(true);
      // The wrappers above are stripped before the literal check, so the names
      // inside them have to be checked separately: a renamed kit token or a
      // misspelled shell token resolves to nothing in the browser.
      for (const token of referenced) {
        expect(kitTokens.has(token) || shellTokens.has(token), `${theme.id} ${name} -> ${token}`).toBe(true);
      }
    }
  });

  it('scales dracula-large to 1.5x the kit --radius, which every kit radius step derives from', () => {
    const kitRadius = Number.parseFloat(kitCss.match(/--radius\s*:\s*([\d.]+)rem\s*;/)?.[1] ?? '');
    expect(kitRadius).toBeGreaterThan(0);
    expect(Number.parseFloat(byId('dracula-large').variables['--radius'])).toBeCloseTo(kitRadius * 1.5, 5);
    for (const step of ['--radius-sm', '--radius-md', '--radius-lg', '--radius-xl']) {
      expect(kitCss, step).toMatch(new RegExp(`${step}\\s*:[^;]*var\\(--radius\\)`));
    }
  });

  it('leaves the kit palette alone in globals.css', () => {
    const globalsCss = readFileSync(resolveFromHere.resolve('../globals.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    expect([...declaredNames(globalsCss)].filter((name) => kitTokens.has(name))).toEqual([]);
  });

  it('registers fonts under the family the kit names first for body and headings', () => {
    const fontCss = readFileSync(resolveFromHere.resolve('../font.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    const families = new Set([...fontCss.matchAll(/font-family:\s*['"]?([^'";]+)/g)].map((match) => match[1].trim()));
    expect([...families]).toEqual([kitFirstFamily('--font-sans')]);
    expect(kitFirstFamily('--font-heading')).toBe(kitFirstFamily('--font-sans'));
  });

  it('points every font src in font.css at a file that resolves', () => {
    const fontCss = readFileSync(resolveFromHere.resolve('../font.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    const urls = [...fontCss.matchAll(/url\(\s*['"]([^'"]+)['"]\s*\)/g)].map((match) => match[1]);
    expect(urls.length).toBeGreaterThan(0);
    for (const url of urls) {
      expect(() => resolveFromHere.resolve(url), url).not.toThrow();
    }
  });
});
