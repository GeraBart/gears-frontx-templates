import { describe, expect, it } from 'vitest';

import { IN_BUNDLE_PARTS } from './testing';

/*
 * The widget bundles carry their own types in the schemas of their mfe.json,
 * which used to stand in the catalog served file. The catalog file keeps no
 * types since then, so the counts below are pinned to what it had.
 */

/** The schemas field of a bundle's mfe.json, as the bundle build reads it. */
interface BundleSchemas {
  schemas?: Array<Record<string, unknown>>;
}

const sources = import.meta.glob<BundleSchemas>('../bundles/*/mfe.json', { eager: true, import: 'default' });
const TYPES_BY_BUNDLE: Readonly<Record<string, Array<Record<string, unknown>>>> = Object.fromEntries(
  Object.entries(sources).map(([file, source]) => [file.match(/bundles\/([^/]+)\/mfe\.json$/)?.[1] ?? file, source.schemas ?? []]),
);
const BUNDLES = Object.keys(TYPES_BY_BUNDLE).sort();
/** markdown_card renders markdown, no data: it has no data type and its widget type derives from the widget base directly. */
const NO_DATA_TYPE = new Set(['markdown_card']);

/** The id of the bundle's own type of one class, as the catalog served file named it. markdown_card is no data widget: its widget type derives from the widget base directly. */
const idOf = {
  data: (bundle: string) => `gts://gts.frontx.dashboard.widget_data.widget_data.v1~frontx.dashboard.widget_data.${bundle}.v1~`,
  render: (bundle: string) => `gts://gts.frontx.dashboard.widget.render.v1~frontx.dashboard.widget.${bundle}_render.v1~`,
  widget: (bundle: string) =>
    `gts://gts.frontx.dashboard.widget.widget.v1~frontx.dashboard.widget.${
      NO_DATA_TYPE.has(bundle) ? '' : 'data_widget.v1~frontx.dashboard.widget.'
    }${bundle}.v1~`,
};

const ownIds = (bundle: string) => [idOf.widget(bundle), idOf.render(bundle), ...(NO_DATA_TYPE.has(bundle) ? [] : [idOf.data(bundle)])].sort();

describe('the types the widget bundles declare', () => {
  it.each(BUNDLES)('are, for %s, exactly its own widget, render and data types', (bundle) => {
    const ids = (TYPES_BY_BUNDLE[bundle] ?? []).map((type) => String(type.$id));
    expect([...ids].sort()).toEqual(ownIds(bundle));
    // Every id carries the widget type's own name.
    expect(ids.every((id) => id.includes(bundle))).toBe(true);
  });

  it('are, together, the 44 types the catalog served file had, each id once', () => {
    expect(BUNDLES).toHaveLength(15);
    expect(IN_BUNDLE_PARTS.types).toHaveLength(44);
    const ids = IN_BUNDLE_PARTS.types.map((type) => String(type.$id));
    expect(new Set(ids).size).toBe(44);
    expect(ids.every((id) => id.startsWith('gts://gts.frontx.dashboard.'))).toBe(true);
    // The in-bundle parts carry the schemas of the bundles, each bundle's own in its mfe.json order, in bundle order.
    expect(IN_BUNDLE_PARTS.types).toEqual(BUNDLES.flatMap((bundle) => TYPES_BY_BUNDLE[bundle]));
    expect([...IN_BUNDLE_PARTS.types].sort((a, b) => String(a.$id).localeCompare(String(b.$id)))).toEqual(
      BUNDLES.flatMap((bundle) => TYPES_BY_BUNDLE[bundle]).sort((a, b) => String(a.$id).localeCompare(String(b.$id))),
    );
  });
});
