#!/usr/bin/env node

/**
 * Menu Icon Generation Script
 *
 * Collects every `presentation.icon` the MFE packages declare (the Iconify
 * names `Menu.tsx` renders in the navigation menu) and writes the icon data
 * they resolve to into a public asset (`public/generated-menu-icons.json`),
 * so the menu renders its icons from data bundled with the shell instead of
 * asking an icon API at run time. One IconifyJSON collection is written per
 * prefix, holding only the icons the packages use.
 *
 * Icon data comes from the installed `@iconify-json/<prefix>` packages (their
 * `icons.json`), read directly: no icon API is contacted at build time or at
 * run time. An icon whose prefix package is not installed, or whose name the
 * installed set does not carry, fails the step with a message naming the icon
 * and the package to install.
 *
 * The file is refreshed by the same command that refreshes the MFE manifest
 * aggregate: `scripts/generate-mfe-manifests.ts` calls this generator once at
 * its CLI entry, so `npm run generate:mfe-manifests`, `npm run dev` and
 * `npm run build` all rewrite it. At run time
 * `src-app/app/layout/menuIcons.ts` fetches it and registers the collections
 * with `addCollection` from `@iconify/react/offline`; a missing or broken
 * file leaves the menu without icons and costs one console warning.
 *
 * Discovery mirrors `ManifestGenerator.discoverPackages` in
 * `generate-mfe-manifests.ts` (the same `scripts/lib/mfe-tools.ts` rules):
 * `shared` and dot-directories are never packages, and a package whose
 * `mfe.json` declares `"templateExample": true` contributes no icons unless
 * `FRONTX_INCLUDE_TEMPLATE_EXAMPLES=1`, for the same reason that rule keeps
 * example screens out of the aggregate.
 *
 * Icons are read from each package's hand-written `mfe.json`, not from the
 * built `dist/mfe-manifest.json`: the presentation metadata is source content
 * a rebuild of the package does not change, so regenerating the icons file
 * needs no package build first.
 *
 * Usage:
 *   npx tsx scripts/generate-menu-icons.ts
 *
 * Paths resolve against the working directory, the same convention
 * `generate-mfe-manifests.ts` uses: `src-app/mfe_packages/` in, and
 * `public/generated-menu-icons.json` out.
 */

import { existsSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';

import { isProcessEntryPoint } from './lib/entry-point.js';
import {
  isNonPackageDirectory,
  isTemplateExamplePackage,
  templateExamplesIncluded,
} from './lib/mfe-tools.js';

// ---------------------------------------------------------------------------
// Shapes read from disk
// ---------------------------------------------------------------------------

/** The part of an `mfe.json` this script reads. Everything else is ignored. */
interface RawMfeJson {
  templateExample?: unknown;
  extensions?: Array<{ presentation?: { icon?: unknown } | null }>;
}

/**
 * The part of an installed `@iconify-json/<prefix>` `icons.json` this script
 * reads. Icon and alias entries are copied through verbatim, so any field the
 * IconifyJSON format allows on them (body, width, height, left, top,
 * transformations on aliases) survives without this script knowing the list.
 */
export interface RawIconSet {
  prefix?: unknown;
  width?: unknown;
  height?: unknown;
  icons?: Record<string, unknown>;
  aliases?: Record<string, unknown>;
}

/**
 * Where the icons file is written, relative to the project root. The CLI
 * entries here and in `generate-mfe-manifests.ts` both name it, so the path
 * lives once: a move of the public folder updates one constant, not two.
 */
export const MENU_ICONS_OUTPUT_RELATIVE = 'public/generated-menu-icons.json';

// ---------------------------------------------------------------------------
// Discovery
// ---------------------------------------------------------------------------

/** One icon a package declares, and where it was declared. */
export interface UsedIcon {
  prefix: string;
  name: string;
  /**
   * Every package directory declaring the icon, first declaration first: a
   * name several packages declare (one of them misspelled or uninstalled)
   * must report all of them, or the operator fixes one package per rerun and
   * hits the next failure each time.
   */
  packageDirs: string[];
}

/**
 * Splits an Iconify icon name into its prefix and name parts, refusing a name
 * that carries no prefix: the icon set to read it from is selected by prefix,
 * so `home` alone names nothing to read. The refusal names the icon and the
 * file to fix, the way the missing-set refusal below names the package.
 */
function splitIconName(icon: string, packageDir: string): { prefix: string; name: string } {
  const colon = icon.indexOf(':');
  const prefix = colon === -1 ? '' : icon.slice(0, colon);
  const name = colon === -1 ? '' : icon.slice(colon + 1);
  if (!prefix || !name) {
    throw new Error(
      `[${packageDir}] mfe.json declares presentation.icon "${icon}", which is not an ` +
        `Iconify icon name of the form "prefix:name" (for example "lucide:home"). ` +
        `Fix the icon name in the package's mfe.json.`
    );
  }
  return { prefix, name };
}

/**
 * Orders two strings by code unit. A locale-dependent collation would order
 * names differently across hosts and ICU builds and break the
 * byte-identical-output invariant the sort below promises.
 */
function byCodeUnit(a: string, b: string): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

/**
 * Every icon the discovered MFE packages declare in `presentation.icon`,
 * deduplicated by full name.
 *
 * Discovery is the same walk `ManifestGenerator.discoverPackages` applies, so
 * the icons file and the manifest aggregate can never disagree about which
 * packages exist: a package one of them sees and the other does not would
 * put a screen in the menu whose icon data is missing (or the reverse).
 */
export function collectMenuIcons(mfePackagesDir: string): UsedIcon[] {
  const collected = new Map<string, UsedIcon>();
  if (!existsSync(mfePackagesDir)) {
    return [];
  }

  const includeExamples = templateExamplesIncluded();

  for (const dir of readdirSync(mfePackagesDir)) {
    if (isNonPackageDirectory(dir)) continue;
    const pkgPath = join(mfePackagesDir, dir);
    const mfeJsonPath = join(pkgPath, 'mfe.json');
    if (!existsSync(mfeJsonPath)) continue;
    if (!includeExamples && isTemplateExamplePackage(pkgPath)) continue;

    let mfeJson: RawMfeJson;
    try {
      mfeJson = JSON.parse(readFileSync(mfeJsonPath, 'utf-8')) as RawMfeJson;
    } catch (err) {
      throw new Error(`[${dir}] Cannot parse mfe.json: ${err instanceof Error ? err.message : String(err)}`);
    }

    if (mfeJson.extensions !== undefined && !Array.isArray(mfeJson.extensions)) {
      throw new Error(`[${dir}] mfe.json "extensions" must be an array when present.`);
    }

    for (const extension of mfeJson.extensions ?? []) {
      const presentation = extension?.presentation;
      const icon = presentation?.icon;
      if (typeof icon !== 'string' || icon === '') continue;
      const { prefix, name } = splitIconName(icon, dir);
      const key = `${prefix}:${name}`;
      const existing = collected.get(key);
      if (existing) {
        if (!existing.packageDirs.includes(dir)) existing.packageDirs.push(dir);
      } else {
        collected.set(key, { prefix, name, packageDirs: [dir] });
      }
    }
  }

  // Sorted by prefix, then name, so the written file does not depend on the
  // operating system's directory order: two runs over the same packages
  // produce byte-identical output. The comparison is by code unit, never by
  // locale: a host's collation order is not part of that invariant.
  return [...collected.values()].sort(
    (a, b) => byCodeUnit(a.prefix, b.prefix) || byCodeUnit(a.name, b.name)
  );
}

// ---------------------------------------------------------------------------
// Icon set reading and collection building
// ---------------------------------------------------------------------------

/**
 * Reads one installed icon set's `icons.json`, or returns `undefined` when no
 * such package is installed. Resolution runs from this module, so the package
 * is looked up in the shell's own `node_modules` the same way the dev server
 * and the build resolve it.
 */
export function loadIconSetFromNodeModules(prefix: string): RawIconSet | undefined {
  const requireFromHere = createRequire(import.meta.url);
  let iconsJsonPath: string;
  try {
    iconsJsonPath = requireFromHere.resolve(`@iconify-json/${prefix}/icons.json`);
  } catch {
    return undefined;
  }
  // Only resolution failure means "not installed". A set that is installed
  // but unreadable or corrupt must propagate: the refusal message for a
  // missing set sends the operator to install a package they already have.
  try {
    return JSON.parse(readFileSync(iconsJsonPath, 'utf-8')) as RawIconSet;
  } catch (err) {
    throw new Error(
      `Cannot read the installed icon set @iconify-json/${prefix} at ${iconsJsonPath}: ` +
        `${err instanceof Error ? err.message : String(err)}`
    );
  }
}

/**
 * The packages declaring an icon, for an error message: every declaring
 * package, so a shared misspelling names all of them at once.
 */
function declaringPackages(icon: UsedIcon): string {
  return icon.packageDirs.join(', ');
}

/** Injectable icon set reader, so tests can drive the generator over fixtures. */
export type IconSetLoader = (prefix: string) => RawIconSet | undefined;

/** The IconifyJSON shape this script writes (one collection per prefix). */
interface OutIconCollection {
  prefix: string;
  icons: Record<string, unknown>;
  aliases?: Record<string, unknown>;
  width?: unknown;
  height?: unknown;
}

/**
 * Builds one prefix's collection holding only the used icons.
 *
 * A used name that is an alias is written as the alias entry it carries, with
 * every parent it chains through (an alias resolves against its parent, so
 * the parent icon must travel in the same collection for the name to resolve
 * offline). A name neither set carries fails with a message naming the icon
 * and the package to install.
 */
export function buildIconCollection(
  used: UsedIcon[],
  loadIconSet: IconSetLoader
): OutIconCollection {
  // The function is exported for the fixture-driven tests, so an empty group
  // is reachable; fail with the pointed message this script reports
  // everywhere else instead of a bare TypeError on used[0].
  if (used.length === 0) {
    throw new Error(
      'buildIconCollection was given an empty icon group: no prefix to load an icon set for.'
    );
  }
  const prefix = used[0].prefix;
  const set = loadIconSet(prefix);

  if (set === undefined) {
    const names = used.map((icon) => `${prefix}:${icon.name}`).join('", "');
    const packages = [...new Set(used.flatMap((icon) => icon.packageDirs))].join(', ');
    throw new Error(
      `Menu icon(s) "${names}" (declared by ${packages}) need the icon set "${prefix}", ` +
        `which is not installed. Install it in the shell project: npm install -D @iconify-json/${prefix}`
    );
  }

  const icons = set.icons;
  const aliases = set.aliases;
  if (
    typeof set.prefix !== 'string' ||
    set.prefix !== prefix ||
    typeof icons !== 'object' ||
    icons === null
  ) {
    throw new Error(
      `Installed icon set for "${prefix}" (package @iconify-json/${prefix}) is not a valid ` +
        `Iconify icon set: its icons.json carries no "prefix": "${prefix}" and no "icons" object. ` +
        `Check the package installation.`
    );
  }

  const outIcons: Record<string, unknown> = {};
  const outAliases: Record<string, unknown> = {};

  for (const icon of used) {
    // A name may be an alias of an alias, so walk the chain and write every
    // hop: the runtime resolves an alias against its parent inside the same
    // collection, and a skipped middle hop would leave a name that resolves
    // at build time but not offline.
    let current: string = icon.name;
    const chain: Array<{ kind: 'icon' | 'alias'; name: string; entry: unknown }> = [];
    const seen = new Set<string>();
    for (;;) {
      if (seen.has(current)) {
        throw new Error(
          `Menu icon "${prefix}:${icon.name}" (declared by ${declaringPackages(icon)}) sits on an alias ` +
            `cycle in the installed icon set @iconify-json/${prefix}: "${current}" is its own ` +
            `ancestor. The icon set is broken; check the package installation.`
        );
      }
      seen.add(current);
      if (Object.prototype.hasOwnProperty.call(icons, current)) {
        chain.push({ kind: 'icon', name: current, entry: icons[current] });
        break;
      }
      if (aliases !== null && typeof aliases === 'object' && Object.prototype.hasOwnProperty.call(aliases, current)) {
        const aliasEntry = aliases[current];
        chain.push({ kind: 'alias', name: current, entry: aliasEntry });
        // A broken set can carry a null or non-object alias entry; read it as
        // parentless (the clear error below) instead of throwing a bare
        // TypeError from the property read.
        const parent =
          aliasEntry !== null && typeof aliasEntry === 'object'
            ? (aliasEntry as { parent?: unknown }).parent
            : undefined;
        if (typeof parent !== 'string' || !parent) {
          throw new Error(
            `Menu icon "${prefix}:${icon.name}" (declared by ${declaringPackages(icon)}) resolves through ` +
              `alias "${current}", which carries no parent in the installed icon set ` +
              `@iconify-json/${prefix}. The icon set is broken; check the package installation.`
          );
        }
        current = parent;
        continue;
      }
      throw new Error(
        `Menu icon "${prefix}:${icon.name}" (declared by ${declaringPackages(icon)}) is not in the ` +
          `installed icon set @iconify-json/${prefix}. Fix the icon name in the package's ` +
          `mfe.json, or install a set that carries it: npm install -D @iconify-json/${prefix}`
      );
    }

    // Written back-to-front so a parent is in place before the alias that
    // names it; order in the object does not matter to the reader, this only
    // keeps the walk honest.
    for (const hop of chain.reverse()) {
      if (hop.kind === 'icon') {
        outIcons[hop.name] = hop.entry;
      } else {
        outAliases[hop.name] = hop.entry;
      }
    }
  }

  return {
    prefix,
    icons: outIcons,
    ...(Object.keys(outAliases).length > 0 ? { aliases: outAliases } : {}),
    // Set-level dimensions: icons without their own width/height inherit
    // them, so a collection that drops them renders icons without a size.
    ...(set.width !== undefined ? { width: set.width } : {}),
    ...(set.height !== undefined ? { height: set.height } : {}),
  };
}

// ---------------------------------------------------------------------------
// Generator
// ---------------------------------------------------------------------------

/**
 * Exported for `__tests__/menu-icons-generator.test.ts`, which drives the
 * generator over fixture trees with an injected icon set loader rather than
 * over the installed packages. The CLI entry at the foot of this file guards
 * on being the process entry point so that importing it writes no icons file
 * of its own.
 */
export class MenuIconsGenerator {
  private readonly mfePackagesDir: string;
  private readonly outputFile: string;
  private readonly loadIconSet: IconSetLoader;

  constructor(
    mfePackagesDir: string,
    outputFile: string,
    loadIconSet: IconSetLoader = loadIconSetFromNodeModules
  ) {
    this.mfePackagesDir = mfePackagesDir;
    this.outputFile = outputFile;
    this.loadIconSet = loadIconSet;
  }

  run(): void {
    if (!existsSync(this.mfePackagesDir)) {
      console.log(
        `No MFE packages directory found at ${this.mfePackagesDir} - writing an empty menu icon file.`
      );
    }

    try {
      const used = collectMenuIcons(this.mfePackagesDir);

      // Grouped by prefix, one collection per prefix, so the runtime registers
      // one collection per installed icon set.
      const byPrefix = new Map<string, UsedIcon[]>();
      for (const icon of used) {
        const group = byPrefix.get(icon.prefix);
        if (group) {
          group.push(icon);
        } else {
          byPrefix.set(icon.prefix, [icon]);
        }
      }

      const collections = [...byPrefix.values()].map((group) =>
        buildIconCollection(group, this.loadIconSet)
      );

      writeFileSync(this.outputFile, `${JSON.stringify(collections, null, 2)}\n`, 'utf-8');
      const iconCount = used.length;
      console.log(
        `Generated ${this.outputFile} (${collections.length} icon set(s), ${iconCount} icon(s)).`
      );
    } catch (err) {
      // The same invariant its sibling generator holds: a failed run leaves
      // none of its output behind, because the file outlives the run that
      // wrote it and the menu reads it without knowing which run produced it.
      // Stale icons from a removed package would render a menu item this run
      // refuses, with nothing pointing at the failed generation.
      try {
        rmSync(this.outputFile, { force: true });
      } catch {
        // A failure to unlink must not replace the error already on its way
        // to the operator.
      }
      throw err;
    }
  }
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------

if (isProcessEntryPoint(import.meta.url)) {
  const mfePackagesDir = join(process.cwd(), 'src-app/mfe_packages');
  const outputFile = join(process.cwd(), MENU_ICONS_OUTPUT_RELATIVE);

  try {
    new MenuIconsGenerator(mfePackagesDir, outputFile).run();
  } catch (err) {
    console.error('Error generating menu icons:', err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}
