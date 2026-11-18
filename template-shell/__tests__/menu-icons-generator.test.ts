/**
 * Tests for the menu icon generator (`scripts/generate-menu-icons.ts`), driven
 * over a fixture MFE tree with an injected icon set loader, the way
 * `template-example-packages.test.ts` drives `ManifestGenerator`.
 *
 * Three invariants are pinned here, each because its failure is silent at the
 * place it is caused and loud only in the browser or in the build of someone
 * else's package:
 * - only the icons the packages declare are written (a whole-set copy would
 *   bundle two thousand icons for six menu items);
 * - an icon whose prefix package is not installed fails the run naming the
 *   icon and the package to install (a silent skip would ship a menu without
 *   that icon and with nothing pointing at the cause);
 * - an icon name the installed set does not carry fails the run naming it
 *   (the typo is a build-time fix in the package's mfe.json, not a runtime
 *   hunt).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  collectMenuIcons,
  loadIconSetFromNodeModules,
  MenuIconsGenerator,
  type IconSetLoader,
  type RawIconSet,
} from '../scripts/generate-menu-icons';

/** Set by the read-failure test; the fs mock reads it at call time. */
const iconReadFailure = vi.hoisted(() => ({ enabled: false }));

// Intercepts the icons.json read only when a test asks for it, so a set that
// is installed but unreadable can be exercised without a real broken file.
vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs')>();
  return {
    ...actual,
    readFileSync: (...args: Parameters<typeof actual.readFileSync>) => {
      if (iconReadFailure.enabled && String(args[0]).endsWith('@iconify-json/lucide/icons.json')) {
        throw new Error('EACCES: permission denied, read @iconify-json/lucide/icons.json');
      }
      return actual.readFileSync(...args);
    },
  };
});

/** The icons an `icons.json` the fixtures load carries, per prefix. */
function iconSet(prefix: string, icons: Record<string, unknown>, aliases?: Record<string, unknown>): RawIconSet {
  return { prefix, width: 24, height: 24, icons, ...(aliases ? { aliases } : {}) };
}

/** A loader over the fixture sets below; an unknown prefix has no package. */
function loaderWith(sets: Record<string, RawIconSet>): IconSetLoader {
  return (prefix) => sets[prefix];
}

let workspace: string;
let mfePackagesDir: string;
let outputFile: string;

/**
 * Writes a package whose `mfe.json` declares the given icons (and, when
 * `templateExample`, the flag that keeps it out of discovery by default).
 */
function packageWithIcons(name: string, icons: string[], options?: { templateExample?: boolean }): void {
  const packagePath = join(mfePackagesDir, name);
  mkdirSync(packagePath, { recursive: true });
  const flag = options?.templateExample ? '"templateExample": true, ' : '';
  const extensions = icons.map((icon, index) => ({
    id: `gts.frontx.mfes.ext.extension.v1~fixture.${name}.screens.${index}.v1`,
    domain: 'gts.frontx.mfes.ext.domain.v1~frontx.screensets.layout.screen.v1',
    entry: 'gts.frontx.mfes.mfe.entry.v1~frontx.mfes.mfe.entry_mf.v1~fixture.entry',
    presentation: { label: `Screen ${index}`, icon, order: index },
  }));
  writeFileSync(
    join(packagePath, 'mfe.json'),
    `{ ${flag}"entries": [], "extensions": ${JSON.stringify(extensions)} }`,
    'utf-8',
  );
}

/** Runs the generator against the fixture tree and parses the file it wrote. */
function generate(loadIconSet: IconSetLoader): unknown {
  new MenuIconsGenerator(mfePackagesDir, outputFile, loadIconSet).run();
  expect(existsSync(outputFile)).toBe(true);
  return JSON.parse(readFileSync(outputFile, 'utf-8'));
}

beforeEach(() => {
  workspace = join(tmpdir(), `frontx-menu-icons-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mfePackagesDir = join(workspace, 'src-app', 'mfe_packages');
  outputFile = join(workspace, 'public', 'generated-menu-icons.json');
  mkdirSync(mfePackagesDir, { recursive: true });
  mkdirSync(join(workspace, 'public'), { recursive: true });
});

afterEach(() => {
  vi.unstubAllEnvs();
  rmSync(workspace, { recursive: true, force: true });
});

describe('collectMenuIcons', () => {
  it('collects the deduplicated prefix:name of every declared presentation.icon', () => {
    packageWithIcons('tasks-mfe', ['lucide:home', 'lucide:home', 'lucide:settings']);
    packageWithIcons('other-mfe', ['tabler:flag']);

    expect(collectMenuIcons(mfePackagesDir)).toEqual([
      { prefix: 'lucide', name: 'home', packageDirs: ['tasks-mfe'] },
      { prefix: 'lucide', name: 'settings', packageDirs: ['tasks-mfe'] },
      { prefix: 'tabler', name: 'flag', packageDirs: ['other-mfe'] },
    ]);
  });

  it('leaves a template example package out unless the run opts the examples back in', () => {
    packageWithIcons('tasks-mfe', ['lucide:home']);
    packageWithIcons('example-mfe', ['lucide:globe'], { templateExample: true });

    expect(collectMenuIcons(mfePackagesDir)).toEqual([
      { prefix: 'lucide', name: 'home', packageDirs: ['tasks-mfe'] },
    ]);

    // The variable may be set in the developer's or CI's shell for other
    // reasons: stub it (cleared here, whatever it carried) and let
    // unstubAllEnvs restore the original value, so this test neither assumes
    // an unset variable nor leaks its change to later tests.
    vi.stubEnv('FRONTX_INCLUDE_TEMPLATE_EXAMPLES', '1');
    expect(collectMenuIcons(mfePackagesDir)).toEqual([
      { prefix: 'lucide', name: 'globe', packageDirs: ['example-mfe'] },
      { prefix: 'lucide', name: 'home', packageDirs: ['tasks-mfe'] },
    ]);
  });

  it('answers an empty list for a shell-only seed with no mfe_packages directory', () => {
    expect(collectMenuIcons(join(workspace, 'absent'))).toEqual([]);
  });
});

describe('MenuIconsGenerator', () => {
  it('writes one collection per prefix holding only the icons the packages use', () => {
    packageWithIcons('tasks-mfe', ['lucide:home', 'lucide:settings']);
    packageWithIcons('other-mfe', ['tabler:flag']);

    // The installed sets carry far more than the packages use, and an alias
    // rides along with the parent it resolves against.
    const output = generate(
      loaderWith({
        lucide: iconSet('lucide', {
          home: { body: '<path d="home"/>' },
          settings: { body: '<path d="settings"/>' },
          unused: { body: '<path d="unused"/>' },
        }),
        tabler: iconSet('tabler', { flag: { body: '<path d="flag"/>' }, other: { body: '<x/>' } }),
      })
    );

    expect(output).toEqual([
      {
        prefix: 'lucide',
        icons: { home: { body: '<path d="home"/>' }, settings: { body: '<path d="settings"/>' } },
        width: 24,
        height: 24,
      },
      {
        prefix: 'tabler',
        icons: { flag: { body: '<path d="flag"/>' } },
        width: 24,
        height: 24,
      },
    ]);
  });

  it('writes a used alias together with the parent icon it resolves against', () => {
    packageWithIcons('tasks-mfe', ['lucide:activity-square']);

    const output = generate(
      loaderWith({
        lucide: iconSet(
          'lucide',
          { 'square-activity': { body: '<path d="square-activity"/>' } },
          { 'activity-square': { parent: 'square-activity' } }
        ),
      })
    );

    expect(output).toEqual([
      {
        prefix: 'lucide',
        icons: { 'square-activity': { body: '<path d="square-activity"/>' } },
        aliases: { 'activity-square': { parent: 'square-activity' } },
        width: 24,
        height: 24,
      },
    ]);
  });

  it('writes an empty file when no package declares an icon', () => {
    const output = generate(loaderWith({}));

    expect(output).toEqual([]);
  });

  it('fails naming the icon and the package to install when the prefix set is not installed', () => {
    packageWithIcons('tasks-mfe', ['lucide:home', 'si:rocket']);

    expect(() => generate(loaderWith({ lucide: iconSet('lucide', { home: { body: '<x/>' } }) }))).toThrow(
      /"si:rocket"[\s\S]*@iconify-json\/si/
    );
    // A failed run leaves none of its output behind, so no stale bundle
    // survives to be served by the dev server.
    expect(existsSync(outputFile)).toBe(false);
  });

  it('fails naming the icon and the package when the installed set does not carry the name', () => {
    packageWithIcons('tasks-mfe', ['lucide:home', 'lucide:teh-settings']);

    expect(() =>
      generate(loaderWith({ lucide: iconSet('lucide', { home: { body: '<x/>' } }) }))
    ).toThrow(/"lucide:teh-settings"[\s\S]*@iconify-json\/lucide/);
    expect(existsSync(outputFile)).toBe(false);
  });

  it('fails naming the icon when a name carries no prefix at all', () => {
    packageWithIcons('tasks-mfe', ['home']);

    expect(() => generate(loaderWith({}))).toThrow(/"home"[\s\S]*prefix:name/);
  });

  it('names every declaring package when several share a broken icon name', () => {
    // Two packages declaring the same missing name: the error lists both, so
    // one rerun after fixing one package does not surface the next failure.
    packageWithIcons('tasks-mfe', ['lucide:teh-settings']);
    packageWithIcons('other-mfe', ['lucide:teh-settings']);

    expect(() =>
      generate(loaderWith({ lucide: iconSet('lucide', { home: { body: '<x/>' } }) }))
    ).toThrow(/declared by (tasks-mfe, other-mfe|other-mfe, tasks-mfe)/);
  });

  it('reports a null alias entry as parentless, not as a TypeError', () => {
    packageWithIcons('tasks-mfe', ['lucide:activity-square']);

    expect(() =>
      generate(
        loaderWith({
          lucide: iconSet(
            'lucide',
            { 'square-activity': { body: '<path d="square-activity"/>' } },
            { 'activity-square': null as unknown as Record<string, unknown> }
          ),
        })
      )
    ).toThrow(/alias "activity-square", which carries no parent/);
  });

  it('propagates a read or parse failure of an installed set instead of reporting it uninstalled', () => {
    // The installed set resolves here, so the failure below is the read, not
    // the resolution: the error names the file it could not read, where a
    // "not installed" message would send the operator to install a package
    // they already have. Resolution failure itself still reads as missing.
    iconReadFailure.enabled = true;
    expect(() => loadIconSetFromNodeModules('lucide')).toThrow(
      /Cannot read the installed icon set @iconify-json\/lucide[\s\S]*EACCES/
    );
    expect(loadIconSetFromNodeModules('definitely-not-an-icon-set')).toBeUndefined();
  });
});
