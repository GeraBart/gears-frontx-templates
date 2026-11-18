/**
 * Menu icon runtime.
 *
 * The navigation menu renders Iconify icons (each screen's
 * `presentation.icon`) from data bundled with the shell: the build-time
 * generator `scripts/generate-menu-icons.ts` writes the used icons into
 * `public/generated-menu-icons.json`, bootstrap starts the fetch of that file
 * in parallel with the manifest aggregate, and this module registers what it
 * carries with `addCollection` from `@iconify/react/offline`. Nothing here
 * contacts an icon API: an icon the file does not carry simply renders
 * without an icon (with one console warning per name in dev), which is what
 * an MFE deployed apart from this build shows.
 *
 * A missing or broken file costs one console warning and leaves the menu
 * without icons; the app works either way, and the manifests path never waits
 * for this one.
 */

import { addCollection } from '@iconify/react/offline';
import type { IconifyJSON } from '@iconify/react';

const MENU_ICONS_FILE = 'generated-menu-icons.json';

/** Registration state of the icon bundle. */
export type MenuIconsStatus =
  /** The fetch is in flight; icons may still arrive. */
  | 'pending'
  /** The file was fetched and its collections registered. */
  | 'ready'
  /** The file was missing or broken; no icons are coming. */
  | 'unavailable';

type MenuIconsSnapshot = `${MenuIconsStatus}:${number}`;

let status: MenuIconsStatus = 'pending';
let generation = 0;
/**
 * Whether the fetch has been started. Set synchronously at entry, it keeps a
 * second call from starting a second fetch while the first is still in
 * flight (`status` stays `pending` the whole time): bootstrap running again
 * after a failed bootstrap, or an HMR re-run, would otherwise register
 * collections twice and warn twice, breaking the one-warning invariant.
 */
let started = false;
/** Full icon names ("prefix:name") this process has registered. */
const registered = new Set<string>();
/** Full icon names a dev warning has already been issued for. */
const warned = new Set<string>();
const listeners = new Set<() => void>();

function getSnapshot(): MenuIconsSnapshot {
  return `${status}:${generation}`;
}

function notify(): void {
  generation += 1;
  for (const listener of listeners) {
    listener();
  }
}

/**
 * The store the menu subscribes to so a bundle that lands after the first
 * paint re-renders it. The snapshot changes on every status change and on
 * every registration, so a re-render sees the freshly registered names.
 */
export const menuIconsStore = {
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  getSnapshot,
};

/**
 * Whether the named icon ("prefix:name") is in the registered collections.
 * Drives both the render gate (an unknown name renders no icon at all, so no
 * consumer ever asks an icon API about it) and the dev warning.
 */
export function hasMenuIcon(name: string): boolean {
  return registered.has(name);
}

/**
 * One dev console warning per unknown icon name, naming it. Dev only: a
 * production build stays silent, the icon simply does not render.
 */
export function warnMenuIconMissing(name: string): void {
  if (!import.meta.env.DEV || warned.has(name)) return;
  warned.add(name);
  console.warn(
    `[Menu icons] Icon "${name}" is not in the registered menu icon bundle ` +
      `(${MENU_ICONS_FILE}). The menu item renders without an icon. If the MFE was ` +
      `built apart from this shell, rebuild them together, or regenerate the file with ` +
      `npm run generate:mfe-manifests.`
  );
}

/**
 * Where the icons file is served: in the shell's own folder, resolved the way
 * `manifestsUrl` in `../mfe/bootstrap.ts` resolves the manifest aggregate (a
 * relative base resolves against this module's own address, an absolute one
 * is used as it is).
 *
 * @param base - The build's base (`import.meta.env.BASE_URL`)
 * @param moduleUrl - The address of the module asking (`import.meta.url`)
 */
export function menuIconsUrl(base: string, moduleUrl: string): string {
  if (base === '' || base.startsWith('.')) {
    return new URL(`../${MENU_ICONS_FILE}`, moduleUrl).href;
  }
  return new URL(`${base.endsWith('/') ? base : `${base}/`}${MENU_ICONS_FILE}`, moduleUrl).href;
}

/** One icon's body: an object carrying the svg body string, dimensions numeric when present. */
function isIconifyIcon(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return false;
  const icon = value as { body?: unknown; width?: unknown; height?: unknown };
  if (typeof icon.body !== 'string') return false;
  if (icon.width !== undefined && typeof icon.width !== 'number') return false;
  if (icon.height !== undefined && typeof icon.height !== 'number') return false;
  return true;
}

/**
 * One collection, read fully: a string prefix, an `icons` map whose every
 * entry carries a string svg body (dimensions numeric when present), and
 * `aliases` whose every entry names an icon the same collection carries -
 * with the collection's own `width`/`height` numeric when present. An entry
 * that only looks like a collection (an icon with no body, an alias into
 * nothing) is a broken file: validating every entry here keeps registration
 * all-or-nothing, so nothing reaches the registry that the per-icon dev
 * warning (which only runs on `ready`) would never report.
 */
function isIconifyCollection(value: unknown): value is IconifyJSON {
  if (typeof value !== 'object' || value === null) return false;
  const collection = value as {
    prefix?: unknown;
    icons?: unknown;
    aliases?: unknown;
    width?: unknown;
    height?: unknown;
  };
  if (typeof collection.prefix !== 'string') return false;
  if (typeof collection.icons !== 'object' || collection.icons === null) return false;
  const icons = collection.icons as Record<string, unknown>;
  for (const icon of Object.values(icons)) {
    if (!isIconifyIcon(icon)) return false;
  }
  if (collection.aliases !== undefined) {
    if (typeof collection.aliases !== 'object' || collection.aliases === null) return false;
    for (const alias of Object.values(collection.aliases as Record<string, unknown>)) {
      if (typeof alias !== 'object' || alias === null) return false;
      const parent = (alias as { parent?: unknown }).parent;
      if (typeof parent !== 'string' || !(parent in icons)) return false;
    }
  }
  if (collection.width !== undefined && typeof collection.width !== 'number') return false;
  if (collection.height !== undefined && typeof collection.height !== 'number') return false;
  return true;
}

/**
 * Fetches the icons file and registers its collections. Called once, by
 * bootstrap, at the moment the manifest aggregate fetch starts, so the two
 * requests run in parallel; resolving is fire-and-forget, and every failure
 * (a non-200 response, a broken body, a network error) collapses to one
 * console warning and a menu without icons.
 */
export function startMenuIconsFetch(base: string, moduleUrl: string): void {
  if (started) return;
  started = true;

  void (async () => {
    const url = menuIconsUrl(base, moduleUrl);
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`);
      }
      const parsed: unknown = await response.json();
      if (!Array.isArray(parsed)) {
        throw new Error('the file does not hold a JSON array of icon collections');
      }
      // Validate the whole array before registering anything: a broken entry
      // halfway through must not leave the first collections registered while
      // the state says no icons are coming (the per-icon dev warning effect
      // only runs on `ready`, so those icons would render unreported).
      if (!parsed.every(isIconifyCollection)) {
        throw new Error('the file holds an entry that is not an Iconify icon collection');
      }
      for (const collection of parsed) {
        addCollection(collection);
        const { prefix, icons, aliases } = collection;
        for (const name of Object.keys(icons)) {
          registered.add(`${prefix}:${name}`);
        }
        for (const name of Object.keys(aliases ?? {})) {
          registered.add(`${prefix}:${name}`);
        }
      }
      status = 'ready';
    } catch (error) {
      status = 'unavailable';
      console.warn(
        `[Menu icons] Could not load ${url}: ${error instanceof Error ? error.message : String(error)}. ` +
          `The menu renders without icons. Regenerate the file with npm run generate:mfe-manifests.`
      );
    }
    notify();
  })();
}
