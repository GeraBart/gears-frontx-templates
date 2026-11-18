import { describe, expect, it } from 'vitest';

import { BUNDLE_TYPES, IN_BUNDLE_PARTS } from './testing';

/*
 * The widget bundles carry their own types in the schemas of their mfe.json,
 * which used to stand in the catalog served file. The catalog file keeps no
 * types since then, so the counts below are pinned to what it had.
 */

const BUNDLES = Object.keys(BUNDLE_TYPES).sort();
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
    const ids = (BUNDLE_TYPES[bundle] ?? []).map((type) => String(type.$id));
    expect([...ids].sort()).toEqual(ownIds(bundle));
  });

  it('are, together, the 44 types the catalog served file had, each id once', () => {
    expect(BUNDLES).toHaveLength(15);
    expect(IN_BUNDLE_PARTS.types).toHaveLength(44);
    const ids = IN_BUNDLE_PARTS.types.map((type) => String(type.$id));
    expect(new Set(ids).size).toBe(44);
    expect(ids.every((id) => id.startsWith('gts://gts.frontx.dashboard.'))).toBe(true);
  });
});
