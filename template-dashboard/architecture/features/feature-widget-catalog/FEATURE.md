---
status: accepted
version: 1
date: 2026-10-31
description: "Feature: the widget catalog — the 9 v1 widget types, each with its render schema and data shape, the rendering rules, markdown safety, and the grid's client-side sort and page."
---

# Feature: Widget Catalog

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-featstatus-widget-catalog`

<!-- toc -->

- [1. Feature Context](#1-feature-context)
  - [1.1 Overview](#11-overview)
  - [1.2 Purpose](#12-purpose)
  - [1.3 Actors](#13-actors)
  - [1.4 References](#14-references)
- [2. Actor Flows (CDSL)](#2-actor-flows-cdsl)
  - [Sort and page a grid](#sort-and-page-a-grid)
- [3. Processes / Business Logic (CDSL)](#3-processes--business-logic-cdsl)
  - [Render a markdown card safely](#render-a-markdown-card-safely)
  - [Build a chart theme from kit tokens](#build-a-chart-theme-from-kit-tokens)
  - [Validate grid columns and groups](#validate-grid-columns-and-groups)
- [4. States (CDSL)](#4-states-cdsl)
  - [No lifecycle states](#no-lifecycle-states)
- [5. Definitions of Done](#5-definitions-of-done)
  - [Nine widget types](#nine-widget-types)
  - [Per-type render schemas and data shapes](#per-type-render-schemas-and-data-shapes)
  - [Grid row cap, page sizes, and client-side sort/page](#grid-row-cap-page-sizes-and-client-side-sortpage)
  - [Markdown safety](#markdown-safety)
  - [Per-type rendering rules](#per-type-rendering-rules)
  - [Catalog libraries and licences](#catalog-libraries-and-licences)
  - [Dashboard-author guide](#dashboard-author-guide)
- [6. Widget Type and Data Schemas](#6-widget-type-and-data-schemas)
  - [MFE entries](#mfe-entries)
  - [summary_card](#summary_card)
  - [metric_card](#metric_card)
  - [ranked_list_card](#ranked_list_card)
  - [progress_list_card](#progress_list_card)
  - [grid](#grid)
  - [cartesian_chart](#cartesian_chart)
  - [pie_chart](#pie_chart)
  - [heatmap](#heatmap)
  - [markdown_card](#markdown_card)
- [7. Acceptance Criteria](#7-acceptance-criteria)

<!-- /toc -->

## 1. Feature Context

- [ ] `p1` - `cpt-frontx-dashboard-feature-widget-catalog`

### 1.1 Overview

The 9 v1 widget types, each a GTS type (the render schema), a data type (the data shape), and one FrontX MFE entry. The final render schemas and data shapes per type, the grid row cap and page sizes, the grid sorts and pages client-side over the rows the transform delivered, markdown safety, and the per-type rendering rules.

### 1.2 Purpose

A dashboard author picks from the catalog. The catalog is bounded by presentation shapes, not by subject: a new dataset needs no new widget type. Each type states the exact data it needs, and the root's registration validates every answer against it.

**Requirements**: `cpt-frontx-dashboard-fr-widget-catalog`, `cpt-frontx-dashboard-fr-grid-sort-page`, `cpt-frontx-dashboard-fr-markdown-safety`, `cpt-frontx-dashboard-fr-accessibility`, `cpt-frontx-dashboard-fr-theme` (widget side), `cpt-frontx-dashboard-nfr-visual-quality`, `cpt-frontx-dashboard-nfr-large-table`, `cpt-frontx-dashboard-nfr-bundle-budget`, `cpt-frontx-dashboard-fr-author-guides` (dashboard-author guide).

**Use cases**: `cpt-frontx-dashboard-usecase-add-fix-widget`.

**Principles**: `cpt-frontx-dashboard-principle-open-bases-closed-leaves`, `cpt-frontx-dashboard-principle-per-instance-isolation`.

**Constraints**: `cpt-frontx-dashboard-constraint-one-gts-package`.

**Not applicable**: persistence/DB (no database), auth/security (sign-in is out of scope), ops/rollout (no deployed service).

### 1.3 Actors

| Actor | Role in Feature |
|-------|-----------------|
| `cpt-frontx-dashboard-actor-dashboard-author` | Picks widget types from the catalog. |
| `cpt-frontx-dashboard-actor-widget-author` | Ships the 9 types (or fixes one). |
| `cpt-frontx-dashboard-actor-dashboard-viewer` | Sorts and pages grids; reads cards and charts. |

### 1.4 References

- **PRD**: [PRD.md](../../PRD.md)
- **Design**: [DESIGN.md](../../DESIGN.md) (§3.1 Domain Model, §6 Worked Example)
- **Dependencies**: `cpt-frontx-dashboard-feature-widget-contract`

## 2. Actor Flows (CDSL)

### Sort and page a grid

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-flow-widget-catalog-grid-sort-page`

**Actor**: `cpt-frontx-dashboard-actor-dashboard-viewer`

**Success Scenarios**:
- The viewer sorts a grid by a column, pages it, and changes the page size, all client-side, with no request.

**Steps**:
1. [ ] - `p1` - The viewer clicks a sortable column header. - `inst-wc-sort-click`
2. [ ] - `p1` - The grid sorts the rows it holds in place. - `inst-wc-sort-do`
3. [ ] - `p1` - **IF** the viewer pages or changes the page size - `inst-wc-page`
   1. [ ] - `p1` - The grid moves between pages of the row cap, or changes the page size, in place. - `inst-wc-page-do`
4. [ ] - `p1` - **RETURN** — no request is sent, no binding re-runs. - `inst-wc-return`

## 3. Processes / Business Logic (CDSL)

### Render a markdown card safely

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-algo-widget-catalog-markdown`

**Input**: a `markdown_card` body string from its `render`.

**Output**: rendered CommonMark, with HTML as text.

**Steps**:
1. [ ] - `p1` - Parse the body as CommonMark. - `inst-wc-md-parse`
2. [ ] - `p1` - Render embedded HTML as text, never as markup. - `inst-wc-md-html`
3. [ ] - `p1` - Make `javascript`, `vbscript` and `data` links inactive. - `inst-wc-md-links`
4. [ ] - `p1` - Open links with no opener. - `inst-wc-md-noopener`
5. [ ] - `p1` - **RETURN** the rendered text. - `inst-wc-md-return`

### Build a chart theme from kit tokens

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-algo-widget-catalog-chart-theme`

**Input**: the host theme id.

**Output**: the `frontx-dashboard` ECharts theme registered in the chart's own ECharts copy.

**Steps**:
1. [ ] - `p1` - Map the host theme id to the ui-kit light or dark scope (unknown gives light). - `inst-wc-chart-scope`
2. [ ] - `p1` - Build the `frontx-dashboard` theme from the kit tokens of that scope (colors, typography, axes, tooltips). - `inst-wc-chart-build`
3. [ ] - `p1` - Register the theme in the chart's own ECharts copy. - `inst-wc-chart-register`
4. [ ] - `p1` - On a theme change, rebuild and re-register it (no request). - `inst-wc-chart-rebuild`
5. [ ] - `p1` - **RETURN** the theme. - `inst-wc-chart-return`

### Validate grid columns and groups

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-algo-widget-catalog-grid-checks`

**Input**: a `grid` widget instance (its `render`).

**Output**: pass, or a failure naming the widget and the problem.

**Steps**:
1. [ ] - `p1` - **IF** two columns share the same `key`, **RETURN** failure naming the widget and the key. - `inst-wc-grid-dup-key`
2. [ ] - `p1` - **FOR EACH** group in `column_groups` - `inst-wc-grid-for-group`
   1. [ ] - `p1` - **IF** a key in `members` is not the `key` of a grid column, **RETURN** failure naming the widget, the group, and the key. - `inst-wc-grid-group-member`
   2. [ ] - `p1` - **IF** the columns of the group are not contiguous in `columns` order, **RETURN** failure naming the widget and the group. - `inst-wc-grid-not-contiguous`
   3. [ ] - `p1` - **IF** a key is repeated within the group, **RETURN** failure naming the widget, the group, and the key. - `inst-wc-grid-repeated`
   4. [ ] - `p1` - **IF** a column of the group is also named by another group, **RETURN** failure naming the widget, the column, and both groups. - `inst-wc-grid-two-groups`
3. [ ] - `p1` - **IF** `row_color` is set and is not the `key` of a grid column, **RETURN** failure naming the widget and the key. - `inst-wc-grid-row-color`
4. [ ] - `p1` - **RETURN** pass. - `inst-wc-grid-pass`

## 4. States (CDSL)

### No lifecycle states

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-state-widget-catalog-none`

**States**: `defined` (the catalog is data and rendering rules, with no lifecycle)

**Initial State**: `defined`

**Transitions**:
1. [ ] - `p1` - **FROM** `defined` **TO** `defined` **WHEN** a widget type is rendered (no transition; the catalog is static data). - `inst-wc-state-none`

## 5. Definitions of Done

### Nine widget types

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-dod-widget-catalog-types`

The system **MUST** ship 9 widget types, each a closed derived GTS type with `unevaluatedProperties: false`, setting `entry` and (for data widgets) `data_type`: `summary_card`, `metric_card`, `ranked_list_card`, `progress_list_card`, `grid`, `cartesian_chart`, `pie_chart`, `heatmap` (derived from `data_widget`), and `markdown_card` (derived from the widget base, forbidding `data`, carrying its text in `render`).

Each widget type has one FrontX MFE entry, a plain `entry_mf` instance with `actions` [`render_widget`], `domainActions` [], and `exposeAssets`. The full entry instances and the entry id table are in [MFE entries](#mfe-entries).

**Implements**: `cpt-frontx-dashboard-fr-widget-catalog`, `cpt-frontx-dashboard-usecase-add-fix-widget`.

**Touches**:
- Entities: the 9 widget types, the 8 data types, the 9 entries

### Per-type render schemas and data shapes

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-dod-widget-catalog-shapes`

Each data widget type **MUST** declare a closed `render` schema (including any value format and unit hints) and a closed data shape derived from the widget-data base. The value format is one shared sub-schema, `$defs/value_format` in the widget base, referenced by every type that uses it. Measure-valued fields accept `null` (shown as a gap or empty value; for `metric_card` a `null` `value` is the empty state). The final render schemas and data shapes per type follow the DESIGN worked example: `pie_chart` data `{slices: [{label, value}]}`; `cartesian_chart` render `{series: [{name, type, y_axis, stack_group?}], x_axis, y_axis, legend_position, value_format}` and data `{series: [{name, points: [{x, y}]}]}`. Richer render fields (series options and axes for `cartesian_chart`, radius and rose type for `pie_chart`, frozen columns, groups and row colours for `grid`, scale bounds for `heatmap`) are included where the type needs them. The full schemas are in [Widget Type and Data Schemas](#6-widget-type-and-data-schemas).

**Implements**: `cpt-frontx-dashboard-fr-widget-catalog`.

**Touches**:
- Entities: the 9 widget types, the 8 data types

### Grid row cap, page sizes, and client-side sort/page

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-dod-widget-catalog-grid`

The grid's transform output **MUST** have a row cap of 500 rows (`maxItems` on the grid data type's `rows`). The grid **MUST** always page, with page sizes defaulting to `[10, 25, 50, 100, 500]` (the first entry is the initial page size), and sort and page client-side over the rows the transform delivered, sending no request. An over-cap result fails data validation and the cell shows its error state; rows are never truncated. The grid uses TanStack Table v8 with the virtualizer and ARIA grid semantics (ADR-0005). Grid columns are keyed by position: `render.columns[i]` describes position `i` and has a required `key` (unique, `^[a-z][a-z0-9_]{0,63}$`). `column_groups[].members` and `row_color` refer to column keys. The consistency checks are validated by `cpt-frontx-dashboard-algo-widget-catalog-grid-checks`.

**Implements**: `cpt-frontx-dashboard-flow-widget-catalog-grid-sort-page`, `cpt-frontx-dashboard-algo-widget-catalog-grid-checks`, `cpt-frontx-dashboard-fr-grid-sort-page`, `cpt-frontx-dashboard-nfr-large-table`.

### Markdown safety

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-dod-widget-catalog-markdown`

`markdown_card` **MUST** render CommonMark (`cpt-frontx-dashboard-algo-widget-catalog-markdown`): embedded HTML as text, `javascript`/`vbscript`/`data` links inactive, links with no opener. Images are shown with their alt text as the accessible name; an image whose target has a script scheme is not loaded and its alt text is shown. The scheme is compared case-insensitively after trimming leading whitespace and control characters.

**Implements**: `cpt-frontx-dashboard-algo-widget-catalog-markdown`, `cpt-frontx-dashboard-fr-markdown-safety`.

### Per-type rendering rules

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-dod-widget-catalog-rendering`

Each widget entry **MUST** render `render` and, for data widgets, `data` (including its own empty state), map the host theme id to the ui-kit light or dark scope (unknown gives light), style with ui-kit tokens, format numbers and dates for the host language, show text never markup, never cut content off, never convey meaning by colour alone, and be keyboard-operable. Chart widgets build their `frontx-dashboard` theme from kit tokens (`cpt-frontx-dashboard-algo-widget-catalog-chart-theme`) using ECharts via `echarts/core` (ADR-0004). The root registers no chart theme and has no chart-library dependency. The set of host theme ids that map to dark is enumerated per helper and updated when the host adds a dark theme; themes beyond light and dark fold into one of the two.

**Per-type rules:**

- **`metric_card`**: The trend compares `value` with `previous_value`: an up, down or flat icon, plus the change. A null `previous_value` means no trend; the headline stays. The sparkline has one point per step, and a null point is a gap. Whether the change is absolute or relative is left to the widget. With `value_label` the caption shows it; without it, no caption shows.
- **`summary_card`**: One label/value line per row, in delivered order; a null value shows as an empty value.
- **`ranked_list_card`**: The rank is the delivered position; the widget never re-ranks. `secondary` is optional; when absent, its column and heading are hidden. `value_label` and `secondary_label` replace the default headings.
- **`progress_list_card`**: The bar fills `current / target` and is full at or above the target. A null or zero target, or a null current, gives an empty bar. Values are always shown as text, and bar colours come from tokens.
- **`grid`**: Columns have `title`, `width` (initial px), `format.notation` (`standard | compact`), `align` (`start | end | center`, logical, default `start`) and `sortable`. `frozen_columns` (≥ 0) freezes leading columns; more than the column count freezes all. `column_groups` `{title, members}` are drawn as one heading row; an ungrouped column gets an empty cell there. `row_color`: the values `success | warning | error | info` are matched exactly and case-sensitively; they map to the kit row token plus an icon with an accessible name; any other value, or null, gives no colour; cell text keeps readable contrast. Sorting: one active sort column; clicking it again reverses the direction; a new column starts ascending; only that header shows a sort state. An empty grid shows "No data to show" with column headings staying above it. Cells are plain text.
- **`cartesian_chart`**: A category x axis follows the delivered order; a value or time x axis places points by value. A null value is a gap; a null x or series name is an empty label. Every series is named in the legend and the tooltip. A data series without an entry in `render.series` draws as bars on the primary axis.
- **`heatmap`**: Categories follow first-appearance order. The scale is shown with numbers. The tooltip shows x, y and value. A null value leaves the cell empty.
- **`pie_chart`**: The legend and tooltip show each segment's label and value. A null or zero segment has no size but stays in the legend.
- **`markdown_card`**: Images are shown with their alt text as the accessible name. An image with a script-scheme target is not loaded and its alt text is shown. The scheme is compared case-insensitively after trimming leading whitespace and control characters. An inactive link shows as plain text. Links open in a new browsing context.

**Cross-type rules:**

- A null label, `x`, `y` or series value is legal; it renders as an empty label and the row is kept.
- Chart tooltips are built from text, never HTML strings.
- Colour is never the only signal: the heatmap's numeric scale, progress values as text, the trend icon, and naming in legends and tooltips.
- The root registers no chart theme and has no chart-library dependency.

**Implements**: `cpt-frontx-dashboard-fr-theme` (widget side), `cpt-frontx-dashboard-fr-accessibility`, `cpt-frontx-dashboard-nfr-visual-quality`.

### Catalog libraries and licences

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-dod-widget-catalog-libraries`

The catalog widgets **MUST** use ECharts (Apache-2.0) via `echarts/core`, TanStack Table v8 + virtualizer (MIT), and CommonMark (permissive), listed in `shared`, each entry under 100 KB own code only.

**Implements**: `cpt-frontx-dashboard-nfr-bundle-budget`.

### Dashboard-author guide

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-dod-widget-catalog-author-guide`

The template **MUST** ship a dashboard-author guide covering writing a dashboard JSON, the grid, the binding, the catalog, and the layout checks.

**Implements**: `cpt-frontx-dashboard-fr-author-guides` (dashboard-author guide).

**Touches**:
- Entities: Dashboard, Cell, Widget instance, Binding

## 6. Widget Type and Data Schemas

Every schema is a full JSON block with `$schema` `https://json-schema.org/draft/2020-12/schema`, `$id` `gts://<type id>`, and the GTS rules in DESIGN §3.1. Each concrete widget type is closed (`unevaluatedProperties: false`), derives from `data_widget` (or the widget base for `markdown_card`), and sets `x-gts-traits` `{entry, data_type}`. Presentation fields sit in a closed `render`. Each data type is closed and derives from the widget-data base.

### MFE entries

One `entry_mf` instance per widget type. Each entry has `actions` [`render_widget`], `domainActions` [], `exposeAssets`, `requiredProperties` (theme and language), `manifest`, and `exposedModule` `./<widget_type>`.

**Entry instances:**

```json
{
  "id": "gts.frontx.mfes.mfe.entry.v1~frontx.mfes.mfe.entry_mf.v1~frontx.dashboard.mfe.summary_card.v1",
  "requiredProperties": [
    "gts.frontx.mfes.comm.shared_property.v1~frontx.mfes.comm.theme.v1~",
    "gts.frontx.mfes.comm.shared_property.v1~frontx.mfes.comm.language.v1~"
  ],
  "actions": [
    "gts.frontx.mfes.comm.action.v1~frontx.dashboard.mfe.render_widget.v1~"
  ],
  "domainActions": [],
  "manifest": "gts.frontx.mfes.mfe.mf_manifest.v1~frontx.dashboard.widgets.manifest.v1",
  "exposedModule": "./summary_card",
  "exposeAssets": true
}
```

```json
{
  "id": "gts.frontx.mfes.mfe.entry.v1~frontx.mfes.mfe.entry_mf.v1~frontx.dashboard.mfe.metric_card.v1",
  "requiredProperties": [
    "gts.frontx.mfes.comm.shared_property.v1~frontx.mfes.comm.theme.v1~",
    "gts.frontx.mfes.comm.shared_property.v1~frontx.mfes.comm.language.v1~"
  ],
  "actions": [
    "gts.frontx.mfes.comm.action.v1~frontx.dashboard.mfe.render_widget.v1~"
  ],
  "domainActions": [],
  "manifest": "gts.frontx.mfes.mfe.mf_manifest.v1~frontx.dashboard.widgets.manifest.v1",
  "exposedModule": "./metric_card",
  "exposeAssets": true
}
```

```json
{
  "id": "gts.frontx.mfes.mfe.entry.v1~frontx.mfes.mfe.entry_mf.v1~frontx.dashboard.mfe.ranked_list_card.v1",
  "requiredProperties": [
    "gts.frontx.mfes.comm.shared_property.v1~frontx.mfes.comm.theme.v1~",
    "gts.frontx.mfes.comm.shared_property.v1~frontx.mfes.comm.language.v1~"
  ],
  "actions": [
    "gts.frontx.mfes.comm.action.v1~frontx.dashboard.mfe.render_widget.v1~"
  ],
  "domainActions": [],
  "manifest": "gts.frontx.mfes.mfe.mf_manifest.v1~frontx.dashboard.widgets.manifest.v1",
  "exposedModule": "./ranked_list_card",
  "exposeAssets": true
}
```

```json
{
  "id": "gts.frontx.mfes.mfe.entry.v1~frontx.mfes.mfe.entry_mf.v1~frontx.dashboard.mfe.progress_list_card.v1",
  "requiredProperties": [
    "gts.frontx.mfes.comm.shared_property.v1~frontx.mfes.comm.theme.v1~",
    "gts.frontx.mfes.comm.shared_property.v1~frontx.mfes.comm.language.v1~"
  ],
  "actions": [
    "gts.frontx.mfes.comm.action.v1~frontx.dashboard.mfe.render_widget.v1~"
  ],
  "domainActions": [],
  "manifest": "gts.frontx.mfes.mfe.mf_manifest.v1~frontx.dashboard.widgets.manifest.v1",
  "exposedModule": "./progress_list_card",
  "exposeAssets": true
}
```

```json
{
  "id": "gts.frontx.mfes.mfe.entry.v1~frontx.mfes.mfe.entry_mf.v1~frontx.dashboard.mfe.grid.v1",
  "requiredProperties": [
    "gts.frontx.mfes.comm.shared_property.v1~frontx.mfes.comm.theme.v1~",
    "gts.frontx.mfes.comm.shared_property.v1~frontx.mfes.comm.language.v1~"
  ],
  "actions": [
    "gts.frontx.mfes.comm.action.v1~frontx.dashboard.mfe.render_widget.v1~"
  ],
  "domainActions": [],
  "manifest": "gts.frontx.mfes.mfe.mf_manifest.v1~frontx.dashboard.widgets.manifest.v1",
  "exposedModule": "./grid",
  "exposeAssets": true
}
```

```json
{
  "id": "gts.frontx.mfes.mfe.entry.v1~frontx.mfes.mfe.entry_mf.v1~frontx.dashboard.mfe.cartesian_chart.v1",
  "requiredProperties": [
    "gts.frontx.mfes.comm.shared_property.v1~frontx.mfes.comm.theme.v1~",
    "gts.frontx.mfes.comm.shared_property.v1~frontx.mfes.comm.language.v1~"
  ],
  "actions": [
    "gts.frontx.mfes.comm.action.v1~frontx.dashboard.mfe.render_widget.v1~"
  ],
  "domainActions": [],
  "manifest": "gts.frontx.mfes.mfe.mf_manifest.v1~frontx.dashboard.widgets.manifest.v1",
  "exposedModule": "./cartesian_chart",
  "exposeAssets": true
}
```

```json
{
  "id": "gts.frontx.mfes.mfe.entry.v1~frontx.mfes.mfe.entry_mf.v1~frontx.dashboard.mfe.pie_chart.v1",
  "requiredProperties": [
    "gts.frontx.mfes.comm.shared_property.v1~frontx.mfes.comm.theme.v1~",
    "gts.frontx.mfes.comm.shared_property.v1~frontx.mfes.comm.language.v1~"
  ],
  "actions": [
    "gts.frontx.mfes.comm.action.v1~frontx.dashboard.mfe.render_widget.v1~"
  ],
  "domainActions": [],
  "manifest": "gts.frontx.mfes.mfe.mf_manifest.v1~frontx.dashboard.widgets.manifest.v1",
  "exposedModule": "./pie_chart",
  "exposeAssets": true
}
```

```json
{
  "id": "gts.frontx.mfes.mfe.entry.v1~frontx.mfes.mfe.entry_mf.v1~frontx.dashboard.mfe.heatmap.v1",
  "requiredProperties": [
    "gts.frontx.mfes.comm.shared_property.v1~frontx.mfes.comm.theme.v1~",
    "gts.frontx.mfes.comm.shared_property.v1~frontx.mfes.comm.language.v1~"
  ],
  "actions": [
    "gts.frontx.mfes.comm.action.v1~frontx.dashboard.mfe.render_widget.v1~"
  ],
  "domainActions": [],
  "manifest": "gts.frontx.mfes.mfe.mf_manifest.v1~frontx.dashboard.widgets.manifest.v1",
  "exposedModule": "./heatmap",
  "exposeAssets": true
}
```

```json
{
  "id": "gts.frontx.mfes.mfe.entry.v1~frontx.mfes.mfe.entry_mf.v1~frontx.dashboard.mfe.markdown_card.v1",
  "requiredProperties": [
    "gts.frontx.mfes.comm.shared_property.v1~frontx.mfes.comm.theme.v1~",
    "gts.frontx.mfes.comm.shared_property.v1~frontx.mfes.comm.language.v1~"
  ],
  "actions": [
    "gts.frontx.mfes.comm.action.v1~frontx.dashboard.mfe.render_widget.v1~"
  ],
  "domainActions": [],
  "manifest": "gts.frontx.mfes.mfe.mf_manifest.v1~frontx.dashboard.widgets.manifest.v1",
  "exposedModule": "./markdown_card",
  "exposeAssets": true
}
```

**Entry id table:**

| # | Widget type | Entry id | `exposedModule` |
|---|-------------|----------|-----------------|
| 1 | `summary_card` | `gts.frontx.mfes.mfe.entry.v1~frontx.mfes.mfe.entry_mf.v1~frontx.dashboard.mfe.summary_card.v1` | `./summary_card` |
| 2 | `metric_card` | `gts.frontx.mfes.mfe.entry.v1~frontx.mfes.mfe.entry_mf.v1~frontx.dashboard.mfe.metric_card.v1` | `./metric_card` |
| 3 | `ranked_list_card` | `gts.frontx.mfes.mfe.entry.v1~frontx.mfes.mfe.entry_mf.v1~frontx.dashboard.mfe.ranked_list_card.v1` | `./ranked_list_card` |
| 4 | `progress_list_card` | `gts.frontx.mfes.mfe.entry.v1~frontx.mfes.mfe.entry_mf.v1~frontx.dashboard.mfe.progress_list_card.v1` | `./progress_list_card` |
| 5 | `grid` | `gts.frontx.mfes.mfe.entry.v1~frontx.mfes.mfe.entry_mf.v1~frontx.dashboard.mfe.grid.v1` | `./grid` |
| 6 | `cartesian_chart` | `gts.frontx.mfes.mfe.entry.v1~frontx.mfes.mfe.entry_mf.v1~frontx.dashboard.mfe.cartesian_chart.v1` | `./cartesian_chart` |
| 7 | `pie_chart` | `gts.frontx.mfes.mfe.entry.v1~frontx.mfes.mfe.entry_mf.v1~frontx.dashboard.mfe.pie_chart.v1` | `./pie_chart` |
| 8 | `heatmap` | `gts.frontx.mfes.mfe.entry.v1~frontx.mfes.mfe.entry_mf.v1~frontx.dashboard.mfe.heatmap.v1` | `./heatmap` |
| 9 | `markdown_card` | `gts.frontx.mfes.mfe.entry.v1~frontx.mfes.mfe.entry_mf.v1~frontx.dashboard.mfe.markdown_card.v1` | `./markdown_card` |

### summary_card

**GTS ID**: `gts.frontx.dashboard.widget.widget.v1~frontx.dashboard.widget.data_widget.v1~frontx.dashboard.widget.summary_card.v1~`

**Description**: A card with one label/value line per data row, in delivered order.

**Widget type schema:**

```json
{
  "$id": "gts://gts.frontx.dashboard.widget.widget.v1~frontx.dashboard.widget.data_widget.v1~frontx.dashboard.widget.summary_card.v1~",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "SummaryCard",
  "x-gts-traits": {
    "entry": "gts.frontx.mfes.mfe.entry.v1~frontx.mfes.mfe.entry_mf.v1~frontx.dashboard.mfe.summary_card.v1",
    "data_type": "gts.frontx.dashboard.widget_data.widget_data.v1~frontx.dashboard.widget_data.summary_card.v1~"
  },
  "allOf": [
    { "$ref": "gts://gts.frontx.dashboard.widget.widget.v1~frontx.dashboard.widget.data_widget.v1~" },
    {
      "type": "object",
      "properties": {
        "render": {
          "type": "object",
          "additionalProperties": false,
          "properties": {
            "value_format": { "$ref": "gts://gts.frontx.dashboard.widget.widget.v1~#/$defs/value_format" }
          }
        }
      }
    }
  ],
  "unevaluatedProperties": false
}
```

**Data type schema:**

```json
{
  "$id": "gts://gts.frontx.dashboard.widget_data.widget_data.v1~frontx.dashboard.widget_data.summary_card.v1~",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "SummaryCardData",
  "description": "Data of a summary_card widget: one row per line, in delivered order.",
  "allOf": [
    { "$ref": "gts://gts.frontx.dashboard.widget_data.widget_data.v1~" },
    {
      "type": "object",
      "required": ["rows"],
      "properties": {
        "rows": {
          "type": "array",
          "description": "One row per line, in delivered order.",
          "items": {
            "type": "object",
            "required": ["label", "value"],
            "additionalProperties": false,
            "properties": {
              "label": { "type": ["string", "null"] },
              "value": { "type": ["number", "null"] }
            }
          }
        }
      }
    }
  ],
  "unevaluatedProperties": false
}
```

**Cross-references**:
- Presentation: one label/value line per row, in delivered order. A null value shows as an empty value after its label. A null label shows as an empty label and the row stays.

### metric_card

**GTS ID**: `gts.frontx.dashboard.widget.widget.v1~frontx.dashboard.widget.data_widget.v1~frontx.dashboard.widget.metric_card.v1~`

**Description**: A card with one headline value, an optional trend against `previous_value`, and an optional sparkline.

**Widget type schema:**

```json
{
  "$id": "gts://gts.frontx.dashboard.widget.widget.v1~frontx.dashboard.widget.data_widget.v1~frontx.dashboard.widget.metric_card.v1~",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "MetricCard",
  "x-gts-traits": {
    "entry": "gts.frontx.mfes.mfe.entry.v1~frontx.mfes.mfe.entry_mf.v1~frontx.dashboard.mfe.metric_card.v1",
    "data_type": "gts.frontx.dashboard.widget_data.widget_data.v1~frontx.dashboard.widget_data.metric_card.v1~"
  },
  "allOf": [
    { "$ref": "gts://gts.frontx.dashboard.widget.widget.v1~frontx.dashboard.widget.data_widget.v1~" },
    {
      "type": "object",
      "properties": {
        "render": {
          "type": "object",
          "additionalProperties": false,
          "properties": {
            "value_label": { "type": "string", "description": "Optional caption of the headline value. Without it, no caption shows." },
            "value_format": { "$ref": "gts://gts.frontx.dashboard.widget.widget.v1~#/$defs/value_format" }
          }
        }
      }
    }
  ],
  "unevaluatedProperties": false
}
```

**Data type schema:**

```json
{
  "$id": "gts://gts.frontx.dashboard.widget_data.widget_data.v1~frontx.dashboard.widget_data.metric_card.v1~",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "MetricCardData",
  "description": "Data of a metric_card widget.",
  "allOf": [
    { "$ref": "gts://gts.frontx.dashboard.widget_data.widget_data.v1~" },
    {
      "type": "object",
      "required": ["value"],
      "properties": {
        "value": { "type": ["number", "null"] },
        "previous_value": { "type": ["number", "null"] },
        "sparkline": {
          "type": "array",
          "items": { "type": ["number", "null"] }
        }
      }
    }
  ],
  "unevaluatedProperties": false
}
```

**Cross-references**:
- Presentation: the headline is `value`. The trend compares `value` with `previous_value` and shows a direction icon (up for an increase, down for a decrease, flat for no change) together with the change, so its meaning does not depend on colour. Whether the change is absolute or relative is left to the widget. A null `previous_value` shows no trend; the headline stays. The sparkline draws one point per step, and a null point is a gap. A null `value` is the empty state of the widget.

### ranked_list_card

**GTS ID**: `gts.frontx.dashboard.widget.widget.v1~frontx.dashboard.widget.data_widget.v1~frontx.dashboard.widget.ranked_list_card.v1~`

**Description**: A card with one ranked item for each data row: the rank is the delivered position, followed by the label, the value, and an optional secondary value.

**Widget type schema:**

```json
{
  "$id": "gts://gts.frontx.dashboard.widget.widget.v1~frontx.dashboard.widget.data_widget.v1~frontx.dashboard.widget.ranked_list_card.v1~",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "RankedListCard",
  "x-gts-traits": {
    "entry": "gts.frontx.mfes.mfe.entry.v1~frontx.mfes.mfe.entry_mf.v1~frontx.dashboard.mfe.ranked_list_card.v1",
    "data_type": "gts.frontx.dashboard.widget_data.widget_data.v1~frontx.dashboard.widget_data.ranked_list_card.v1~"
  },
  "allOf": [
    { "$ref": "gts://gts.frontx.dashboard.widget.widget.v1~frontx.dashboard.widget.data_widget.v1~" },
    {
      "type": "object",
      "properties": {
        "render": {
          "type": "object",
          "additionalProperties": false,
          "properties": {
            "value_label": { "type": "string", "description": "Optional heading of the primary value." },
            "secondary_label": { "type": "string", "description": "Optional heading of the secondary value." },
            "value_format": { "$ref": "gts://gts.frontx.dashboard.widget.widget.v1~#/$defs/value_format" }
          }
        }
      }
    }
  ],
  "unevaluatedProperties": false
}
```

**Data type schema:**

```json
{
  "$id": "gts://gts.frontx.dashboard.widget_data.widget_data.v1~frontx.dashboard.widget_data.ranked_list_card.v1~",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "RankedListCardData",
  "description": "Data of a ranked_list_card widget.",
  "allOf": [
    { "$ref": "gts://gts.frontx.dashboard.widget_data.widget_data.v1~" },
    {
      "type": "object",
      "required": ["rows"],
      "properties": {
        "rows": {
          "type": "array",
          "description": "Rows in the delivered order. secondary is omitted when the data has no secondary value.",
          "items": {
            "type": "object",
            "required": ["label", "value"],
            "additionalProperties": false,
            "properties": {
              "label": { "type": ["string", "number", "null"] },
              "value": { "type": ["number", "null"] },
              "secondary": { "type": ["number", "null"] }
            }
          }
        }
      }
    }
  ],
  "unevaluatedProperties": false
}
```

**Cross-references**:
- Presentation: the first row has rank 1, the second rank 2, and so on. The widget never re-ranks or re-orders the rows. `secondary` is optional; when absent, its column and heading are hidden. `value_label` and `secondary_label` replace the default headings of the two values. A null value or a null secondary value shows as an empty value. A null label shows as an empty label and the row stays.

### progress_list_card

**GTS ID**: `gts.frontx.dashboard.widget.widget.v1~frontx.dashboard.widget.data_widget.v1~frontx.dashboard.widget.progress_list_card.v1~`

**Description**: A card with one progress bar for each data row, showing the current value against the target.

**Widget type schema:**

```json
{
  "$id": "gts://gts.frontx.dashboard.widget.widget.v1~frontx.dashboard.widget.data_widget.v1~frontx.dashboard.widget.progress_list_card.v1~",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "ProgressListCard",
  "x-gts-traits": {
    "entry": "gts.frontx.mfes.mfe.entry.v1~frontx.mfes.mfe.entry_mf.v1~frontx.dashboard.mfe.progress_list_card.v1",
    "data_type": "gts.frontx.dashboard.widget_data.widget_data.v1~frontx.dashboard.widget_data.progress_list_card.v1~"
  },
  "allOf": [
    { "$ref": "gts://gts.frontx.dashboard.widget.widget.v1~frontx.dashboard.widget.data_widget.v1~" },
    {
      "type": "object",
      "properties": {
        "render": {
          "type": "object",
          "additionalProperties": false,
          "properties": {
            "value_format": { "$ref": "gts://gts.frontx.dashboard.widget.widget.v1~#/$defs/value_format" }
          }
        }
      }
    }
  ],
  "unevaluatedProperties": false
}
```

**Data type schema:**

```json
{
  "$id": "gts://gts.frontx.dashboard.widget_data.widget_data.v1~frontx.dashboard.widget_data.progress_list_card.v1~",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "ProgressListCardData",
  "description": "Data of a progress_list_card widget.",
  "allOf": [
    { "$ref": "gts://gts.frontx.dashboard.widget_data.widget_data.v1~" },
    {
      "type": "object",
      "required": ["rows"],
      "properties": {
        "rows": {
          "type": "array",
          "description": "Rows in the delivered order.",
          "items": {
            "type": "object",
            "required": ["label", "current", "target"],
            "additionalProperties": false,
            "properties": {
              "label": { "type": ["string", "number", "null"] },
              "current": { "type": ["number", "null"] },
              "target": { "type": ["number", "null"] }
            }
          }
        }
      }
    }
  ],
  "unevaluatedProperties": false
}
```

**Cross-references**:
- Presentation: the bar fills in proportion to `current` over `target`, and it is full when `current` reaches or exceeds `target`. With a null or zero target, or a null `current`, the bar stays empty, and a null value shows as an empty value. The current and target values are always shown as text, so the bar does not carry meaning alone. Bar colours come from kit tokens of the active scope. A null label shows as an empty label and the row stays.

### grid

**GTS ID**: `gts.frontx.dashboard.widget.widget.v1~frontx.dashboard.widget.data_widget.v1~frontx.dashboard.widget.grid.v1~`

**Description**: A table that pages and sorts client-side over the rows the transform delivered. The table is built on TanStack Table with its virtualizer (ADR-0005).

**Widget type schema:**

```json
{
  "$id": "gts://gts.frontx.dashboard.widget.widget.v1~frontx.dashboard.widget.data_widget.v1~frontx.dashboard.widget.grid.v1~",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "Grid",
  "x-gts-traits": {
    "entry": "gts.frontx.mfes.mfe.entry.v1~frontx.mfes.mfe.entry_mf.v1~frontx.dashboard.mfe.grid.v1",
    "data_type": "gts.frontx.dashboard.widget_data.widget_data.v1~frontx.dashboard.widget_data.grid.v1~"
  },
  "allOf": [
    { "$ref": "gts://gts.frontx.dashboard.widget.widget.v1~frontx.dashboard.widget.data_widget.v1~" },
    {
      "type": "object",
      "properties": {
        "render": {
          "type": "object",
          "additionalProperties": false,
          "required": ["columns"],
          "properties": {
            "value_format": { "$ref": "gts://gts.frontx.dashboard.widget.widget.v1~#/$defs/value_format" },
            "columns": {
              "type": "array",
              "minItems": 1,
              "description": "Displayed columns, in display order. Each describes one data position. The consistency checks are validated by cpt-frontx-dashboard-algo-widget-catalog-grid-checks.",
              "items": {
                "type": "object",
                "required": ["key"],
                "additionalProperties": false,
                "properties": {
                  "key": {
                    "type": "string",
                    "pattern": "^[a-z][a-z0-9_]{0,63}$",
                    "description": "Unique column key. column_groups[].members and row_color refer to this key."
                  },
                  "title": { "type": "string", "description": "Optional heading." },
                  "width": { "type": "integer", "minimum": 1, "description": "Optional initial width in pixels. The viewer may resize the column locally." },
                  "format": {
                    "type": "object",
                    "additionalProperties": false,
                    "description": "Optional number format. notation applies to number-valued cells only: standard shows the full number and compact shows the abbreviated number of the host language.",
                    "properties": { "notation": { "enum": ["standard", "compact"] } }
                  },
                  "align": { "enum": ["start", "end", "center"], "default": "start", "description": "Optional alignment of the column body, in logical terms: start and end follow the writing direction of the host language." },
                  "sortable": { "type": "boolean", "description": "Whether a click on the header sorts by this column." }
                }
              }
            },
            "page_sizes": {
              "type": "array",
              "minItems": 1,
              "uniqueItems": true,
              "items": { "type": "integer", "minimum": 1, "maximum": 500 },
              "default": [10, 25, 50, 100, 500],
              "description": "Optional page sizes offered. The first entry is the initial page size. Defaults to [10, 25, 50, 100, 500]."
            },
            "frozen_columns": { "type": "integer", "minimum": 0, "description": "Number of leading columns that stay visible during horizontal scrolling. 0 or absent freezes no column. More than the column count freezes all." },
            "column_groups": {
              "type": "array",
              "description": "Grouped column headings. A heading only: it never reorders rows or collapses columns.",
              "items": {
                "type": "object",
                "required": ["title", "members"],
                "additionalProperties": false,
                "properties": {
                  "title": { "type": "string" },
                  "members": {
                    "type": "array",
                    "minItems": 1,
                    "items": { "type": "string", "pattern": "^[a-z][a-z0-9_]{0,63}$", "description": "A column key." }
                  }
                }
              }
            },
            "row_color": {
              "type": "string",
              "pattern": "^[a-z][a-z0-9_]{0,63}$",
              "description": "Optional column key. Its value in a row names the row colour: success, warning, error, or info."
            }
          }
        }
      }
    }
  ],
  "unevaluatedProperties": false
}
```

**Data type schema:**

```json
{
  "$id": "gts://gts.frontx.dashboard.widget_data.widget_data.v1~frontx.dashboard.widget_data.grid.v1~",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "GridData",
  "description": "Data of a grid widget. One positional array per row, in display order. A position that holds no value holds null.",
  "allOf": [
    { "$ref": "gts://gts.frontx.dashboard.widget_data.widget_data.v1~" },
    {
      "type": "object",
      "required": ["rows"],
      "properties": {
        "rows": {
          "type": "array",
          "maxItems": 500,
          "description": "One positional array per row, in the order of render.columns. A position that holds no value holds null. Capped at 500 rows; an over-cap result fails data validation.",
          "items": {
            "type": "array",
            "items": { "type": ["string", "number", "null"] }
          }
        }
      }
    }
  ],
  "unevaluatedProperties": false
}
```

**Cross-references**:
- Data: each row is a positional array. Column `i` reads its value from `rows[r][i]`. Cells show their value as text, formatted by the column's `format.notation` and the render's `value_format`. A null value shows an empty cell. The grid has no cell renderers. Long text wraps and is never cut off. The column heading is the column's `title`.
- Paging: the grid always shows one page. The viewer pages and changes the page size client-side, sending no request. The pager shows the position and the number of rows on the page.
- Sorting: one active sort column. Clicking it again reverses the direction; a new column starts ascending; only that header shows a sort state. Sorting is client-side over the rows the transform delivered.
- Frozen columns: the first `frozen_columns` columns stay visible at the leading edge while the viewer scrolls horizontally. A value larger than the number of columns freezes all columns.
- Column groups: each group shows its `title` once, in a heading row above the column headings, spanning exactly its columns. A column outside every group has an empty cell in that heading row. Without `column_groups`, the grid has a single heading row.
- Row colour: with `row_color` set, a row whose value is one of `success`, `warning`, `error`, or `info`, matched exactly and case-sensitively, takes the row background of the kit token of that meaning in the active light or dark scope. The row also shows an icon of that meaning, with an accessible name in the host language. A null or any other value leaves the row uncoloured, and cell text keeps readable contrast.
- Resizing: the viewer may resize a column. The new width redraws the grid locally, sends no request, and is never saved. `columns[].width` is the initial width.
- Empty grid: the column headings stay above "No data to show".
- Consistency checks: validated by `cpt-frontx-dashboard-algo-widget-catalog-grid-checks` — there is exactly one column per data position, group members are columns, groups are contiguous, there are no repeats inside a group, no column belongs to two groups, and `row_color` names a column.

### cartesian_chart

**GTS ID**: `gts.frontx.dashboard.widget.widget.v1~frontx.dashboard.widget.data_widget.v1~frontx.dashboard.widget.cartesian_chart.v1~`

**Description**: A chart on x and y axes with one or more series, each drawn as bars, a line, an area, or scatter points (Apache ECharts, ADR-0004).

**Widget type schema:**

```json
{
  "$id": "gts://gts.frontx.dashboard.widget.widget.v1~frontx.dashboard.widget.data_widget.v1~frontx.dashboard.widget.cartesian_chart.v1~",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "CartesianChart",
  "x-gts-traits": {
    "entry": "gts.frontx.mfes.mfe.entry.v1~frontx.mfes.mfe.entry_mf.v1~frontx.dashboard.mfe.cartesian_chart.v1",
    "data_type": "gts.frontx.dashboard.widget_data.widget_data.v1~frontx.dashboard.widget_data.cartesian_chart.v1~"
  },
  "allOf": [
    { "$ref": "gts://gts.frontx.dashboard.widget.widget.v1~frontx.dashboard.widget.data_widget.v1~" },
    {
      "type": "object",
      "properties": {
        "render": {
          "type": "object",
          "additionalProperties": false,
          "properties": {
            "series": {
              "type": "array",
              "description": "How each data series is drawn. A data series without an entry here draws as bars on the primary y axis.",
              "items": {
                "type": "object",
                "required": ["name", "type"],
                "additionalProperties": false,
                "properties": {
                  "name": { "type": "string", "description": "The series name, matching a series name in the data." },
                  "type": { "enum": ["bar", "line", "area", "scatter"], "description": "How the series is drawn." },
                  "y_axis": { "enum": ["primary", "secondary"], "default": "primary", "description": "Which y axis the series uses. Without it, the primary axis." },
                  "stack_group": { "type": "string", "description": "Optional stack group. Series with the same stack group are stacked." }
                }
              }
            },
            "x_axis": {
              "type": "object",
              "additionalProperties": false,
              "properties": {
                "type": { "enum": ["category", "value", "time"], "default": "category", "description": "Without it, category." },
                "label": { "type": "string" }
              }
            },
            "y_axis": {
              "type": "object",
              "additionalProperties": false,
              "properties": {
                "type": { "enum": ["value", "log"], "default": "value", "description": "Without it, value." },
                "label": { "type": "string" }
              }
            },
            "y_axis_secondary": {
              "type": "object",
              "additionalProperties": false,
              "description": "Settings of the secondary y axis, used by series whose y_axis is secondary.",
              "properties": {
                "type": { "enum": ["value", "log"], "default": "value", "description": "Without it, value." },
                "label": { "type": "string" }
              }
            },
            "legend_position": { "enum": ["top", "right", "bottom", "left"], "default": "bottom", "description": "Without it, bottom." },
            "value_format": { "$ref": "gts://gts.frontx.dashboard.widget.widget.v1~#/$defs/value_format" }
          }
        }
      }
    }
  ],
  "unevaluatedProperties": false
}
```

**Data type schema:**

```json
{
  "$id": "gts://gts.frontx.dashboard.widget_data.widget_data.v1~frontx.dashboard.widget_data.cartesian_chart.v1~",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "CartesianChartData",
  "description": "Data of a cartesian_chart widget, in long format.",
  "allOf": [
    { "$ref": "gts://gts.frontx.dashboard.widget_data.widget_data.v1~" },
    {
      "type": "object",
      "required": ["series"],
      "properties": {
        "series": {
          "type": "array",
          "description": "One entry per series, each with its name and points.",
          "items": {
            "type": "object",
            "required": ["name", "points"],
            "additionalProperties": false,
            "properties": {
              "name": { "type": ["string", "null"] },
              "points": {
                "type": "array",
                "items": {
                  "type": "object",
                  "required": ["x", "y"],
                  "additionalProperties": false,
                  "properties": {
                    "x": { "type": ["string", "number", "null"] },
                    "y": { "type": ["number", "null"] }
                  }
                }
              }
            }
          }
        }
      }
    }
  ],
  "unevaluatedProperties": false
}
```

**Cross-references**:
- Presentation: on a category axis the x positions follow the delivered order, and on a value or time axis they are placed by value. A null value is a gap. A null x or series name shows as an empty label. Every series is named in the legend and in the tooltip, so series do not differ by colour alone. A data series without an entry in `render.series` draws as bars on the primary axis.
- Chart theme: the series colours, typography, axes, and tooltips come from the ECharts theme `frontx-dashboard` that the widget builds from kit tokens (`cpt-frontx-dashboard-algo-widget-catalog-chart-theme`, ADR-0004).

### pie_chart

**GTS ID**: `gts.frontx.dashboard.widget.widget.v1~frontx.dashboard.widget.data_widget.v1~frontx.dashboard.widget.pie_chart.v1~`

**Description**: A pie or donut chart with one segment for each data row (Apache ECharts, ADR-0004).

**Widget type schema:**

```json
{
  "$id": "gts://gts.frontx.dashboard.widget.widget.v1~frontx.dashboard.widget.data_widget.v1~frontx.dashboard.widget.pie_chart.v1~",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "PieChart",
  "x-gts-traits": {
    "entry": "gts.frontx.mfes.mfe.entry.v1~frontx.mfes.mfe.entry_mf.v1~frontx.dashboard.mfe.pie_chart.v1",
    "data_type": "gts.frontx.dashboard.widget_data.widget_data.v1~frontx.dashboard.widget_data.pie_chart.v1~"
  },
  "allOf": [
    { "$ref": "gts://gts.frontx.dashboard.widget.widget.v1~frontx.dashboard.widget.data_widget.v1~" },
    {
      "type": "object",
      "properties": {
        "render": {
          "type": "object",
          "additionalProperties": false,
          "properties": {
            "radius": {
              "type": "array",
              "minItems": 1,
              "maxItems": 2,
              "items": { "type": "string", "pattern": "^[0-9]{1,4}(\\.[0-9]{1,2})?(%|px)$" },
              "description": "Optional outer radius, or inner and outer radius, each a percentage or a pixel value, for example [\"50%\", \"70%\"] for a donut or [\"60px\"]. Two items make a donut."
            },
            "rose_type": { "enum": ["radius", "area", "none"], "default": "none", "description": "Optional rose display. Without it, none." },
            "legend_position": { "enum": ["top", "right", "bottom", "left"], "default": "bottom", "description": "Without it, bottom." },
            "value_format": { "$ref": "gts://gts.frontx.dashboard.widget.widget.v1~#/$defs/value_format" }
          }
        }
      }
    }
  ],
  "unevaluatedProperties": false
}
```

**Data type schema:**

```json
{
  "$id": "gts://gts.frontx.dashboard.widget_data.widget_data.v1~frontx.dashboard.widget_data.pie_chart.v1~",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "PieChartData",
  "description": "Data of a pie_chart widget.",
  "allOf": [
    { "$ref": "gts://gts.frontx.dashboard.widget_data.widget_data.v1~" },
    {
      "type": "object",
      "required": ["slices"],
      "properties": {
        "slices": {
          "type": "array",
          "description": "One slice per segment, in delivered order.",
          "items": {
            "type": "object",
            "required": ["label", "value"],
            "additionalProperties": false,
            "properties": {
              "label": { "type": ["string", "number", "null"] },
              "value": { "type": ["number", "null"] }
            }
          }
        }
      }
    }
  ],
  "unevaluatedProperties": false
}
```

**Cross-references**:
- Presentation: every segment is listed in the legend with its label and value, and the tooltip shows both, so segments do not differ by colour alone. A segment with a null or zero value has no size but stays in the legend. Segment colours come from the chart theme.

### heatmap

**GTS ID**: `gts.frontx.dashboard.widget.widget.v1~frontx.dashboard.widget.data_widget.v1~frontx.dashboard.widget.heatmap.v1~`

**Description**: A two-axis grid of cells whose colour shows a value (Apache ECharts, ADR-0004).

**Widget type schema:**

```json
{
  "$id": "gts://gts.frontx.dashboard.widget.widget.v1~frontx.dashboard.widget.data_widget.v1~frontx.dashboard.widget.heatmap.v1~",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "Heatmap",
  "x-gts-traits": {
    "entry": "gts.frontx.mfes.mfe.entry.v1~frontx.mfes.mfe.entry_mf.v1~frontx.dashboard.mfe.heatmap.v1",
    "data_type": "gts.frontx.dashboard.widget_data.widget_data.v1~frontx.dashboard.widget_data.heatmap.v1~"
  },
  "allOf": [
    { "$ref": "gts://gts.frontx.dashboard.widget.widget.v1~frontx.dashboard.widget.data_widget.v1~" },
    {
      "type": "object",
      "properties": {
        "render": {
          "type": "object",
          "additionalProperties": false,
          "properties": {
            "x_axis_label": { "type": "string", "description": "Optional x-axis title." },
            "y_axis_label": { "type": "string", "description": "Optional y-axis title." },
            "min_value": { "type": ["number", "null"], "description": "Optional lower end of the colour scale. Null or absent takes the lowest value in the rows. When both ends are set, it is not greater than max_value (a cross-check)." },
            "max_value": { "type": ["number", "null"], "description": "Optional upper end of the colour scale. Null or absent takes the highest value in the rows." },
            "show_cell_values": { "type": "boolean", "description": "Whether to show each cell's value inside the cell." },
            "value_format": { "$ref": "gts://gts.frontx.dashboard.widget.widget.v1~#/$defs/value_format" }
          }
        }
      }
    }
  ],
  "unevaluatedProperties": false
}
```

**Data type schema:**

```json
{
  "$id": "gts://gts.frontx.dashboard.widget_data.widget_data.v1~frontx.dashboard.widget_data.heatmap.v1~",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "HeatmapData",
  "description": "Data of a heatmap widget.",
  "allOf": [
    { "$ref": "gts://gts.frontx.dashboard.widget_data.widget_data.v1~" },
    {
      "type": "object",
      "required": ["rows"],
      "properties": {
        "rows": {
          "type": "array",
          "description": "One row per cell value.",
          "items": {
            "type": "object",
            "required": ["x", "y", "value"],
            "additionalProperties": false,
            "properties": {
              "x": { "type": ["string", "number", "null"] },
              "y": { "type": ["string", "number", "null"] },
              "value": { "type": ["number", "null"] }
            }
          }
        }
      }
    }
  ],
  "unevaluatedProperties": false
}
```

**Cross-references**:
- Presentation: the x and y categories follow the order of their first appearance in the delivered rows. The heatmap shows its colour scale with numbers, and the tooltip of each cell shows its x, y, and value, so values do not depend on colour alone. A null value leaves its cell empty. The colour scale comes from the chart theme.

### markdown_card

**GTS ID**: `gts.frontx.dashboard.widget.widget.v1~frontx.dashboard.widget.markdown_card.v1~`

**Description**: A card that shows its markdown `body` (CommonMark, with embedded HTML shown as text). It is not a data widget: it has no `data`, no `data_type` trait, and it never requests data.

**Widget type schema:**

```json
{
  "$id": "gts://gts.frontx.dashboard.widget.widget.v1~frontx.dashboard.widget.markdown_card.v1~",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "MarkdownCard",
  "x-gts-traits": {
    "entry": "gts.frontx.mfes.mfe.entry.v1~frontx.mfes.mfe.entry_mf.v1~frontx.dashboard.mfe.markdown_card.v1"
  },
  "allOf": [
    { "$ref": "gts://gts.frontx.dashboard.widget.widget.v1~" },
    {
      "type": "object",
      "properties": {
        "render": {
          "type": "object",
          "additionalProperties": false,
          "required": ["body"],
          "properties": {
            "body": {
              "type": "string",
              "minLength": 1,
              "description": "The markdown to show: CommonMark, including links and images. Embedded HTML is shown as text."
            }
          }
        }
      }
    }
  ],
  "unevaluatedProperties": false
}
```

**Cross-references**:
- Rendering: the card renders right after `render_widget`, with no data states, and sends no request.
- Markdown: the body is typical markdown, CommonMark including links and images. The card shows the formatting, the links, and the images.
- Embedded HTML: HTML in the body is shown as plain text and no element is created from it.
- Links: a link works and opens in a new browsing context without access to the opener. A link whose scheme is a script scheme (`javascript`, `vbscript`, or `data`) is not active and shows its link text as plain text. The scheme is compared case-insensitively after leading whitespace and control characters are trimmed, so `JavaScript:` and a target with a leading space are inactive too.
- Images: an image is shown from its target with its alt text as the accessible name. An image whose target has a script scheme is not loaded and shows its alt text, or nothing when it has none.
- Other widgets: the markdown card is the only widget that interprets markup. Every other delivered text is rendered as text.

## 7. Acceptance Criteria

- [ ] The 9 widget types ship, each closed with `unevaluatedProperties: false`; `markdown_card` forbids `data`; the 8 data types derive from the widget-data base.
- [ ] A misspelled render field on a concrete widget type fails validation and the widget gets the cannot-be-shown state.
- [ ] The grid sorts and pages client-side over the rows the transform delivered, up to the 500-row cap, with page sizes defaulting to `[10, 25, 50, 100, 500]`, sending no request.
- [ ] `markdown_card` renders CommonMark with HTML as text, `javascript:` links inactive, and links with no opener.
- [ ] A `null` measure value is shown as a gap or empty value; a `null` `value` on `metric_card` is the empty state.
- [ ] Chart widgets build the `frontx-dashboard` theme from ui-kit tokens of the mapped scope and rebuild it on a theme change, with no request.
- [ ] Each widget entry follows the rendering rules: no requests, theme mapping, ui-kit tokens, formats, text not markup, no cut-off, no meaning by colour alone, keyboard-operable.
- [ ] Given a widget whose title, a label, or a chart tooltip value holds `<img src=x onerror=alert(1)>`, when it renders, then the text is shown as text and no element is created.
- [ ] Given a `markdown_card` whose body holds a heading, a raw `<b>` tag, a link with an `https` target, a link with a `mailto` target, and an image, when it renders, then the heading is formatted, no element is created from the raw tag and the tag shows as plain text, the links open in a new browsing context without access to the opener, and the image is shown with its alt text as accessible name.
- [ ] Given a `markdown_card` whose body holds links with the targets `javascript:alert(1)`, `JavaScript:alert(1)`, and ` javascript:alert(1)` (leading space), when it renders, then no link is active and each shows its text as plain text.
- [ ] Given a `markdown_card` whose body holds an image with a `javascript:` target, when it renders, then the image is not loaded and its alt text is shown.
- [ ] Given a `metric_card` whose data has `value` 120 and `previous_value` 100, when it renders, then it shows the up direction icon and a change. Given `value` 80, then it shows the down icon, and given `value` 100, the flat icon. The form of the change, absolute or relative, is not checked. Given a null `previous_value`, then it shows the headline and no trend.
- [ ] Given a `metric_card` whose data has a `sparkline`, when it renders, then the sparkline draws one point per step, and a null point is a gap.
- [ ] Given a `metric_card` with `value_label` "Open alerts", then the caption shows it. Without `value_label`, no caption shows.
- [ ] Given a `summary_card` with 3 rows, when it renders, then it shows 3 lines in delivered order, each with its label and formatted value, and a null value as an empty value.
- [ ] Given a `ranked_list_card` with `value_label` and `secondary_label`, when it renders, then the two headings show these labels. Given data with no `secondary`, then no secondary value and no secondary heading show.
- [ ] Given a `progress_list_card` with rows (current 120, target 100), (50, 100), (10, null), and (null, 100), when it renders, then the first bar is full, the second is half full, the third and the fourth are empty, and every value shows as text, empty for a null.
- [ ] Given a `grid` with a column whose `align` is `end`, one whose `format.notation` is `compact`, and one with a `title`, when it renders, then the first body is end-aligned, the number is abbreviated, and the heading shows the title.
- [ ] Given a `grid` with 8 columns and `frozen_columns` 2, when the viewer scrolls to the last column, then the first 2 columns stay visible. With `frozen_columns` 0 or absent, all columns scroll.
- [ ] Given a `grid` whose `column_groups` lists a group "Group B" over `c5` and `c6` before a group "Group A" over `c3` and `c4`, when it renders, then a heading row shows "Group A" once over `c3` and `c4` and "Group B" once over `c5` and `c6`, in column position.
- [ ] Given a `grid` with `row_color` set to a column whose values are "error", "Error", "unknown", and null, when it renders in the light scope, then the "error" row takes the error token background of the light scope and shows the error icon with its accessible name, and the other rows show no colour and no icon. When the host theme switches to dark, then the "error" row takes the error token background of the dark scope and no request is sent.
- [ ] Given a `grid` showing rows, when the viewer clicks a sortable column header, then the grid sorts in place. Clicking the same header reverses the direction; a new column starts ascending; only that header shows a sort state.
- [ ] Given a `grid`, when the viewer changes the page or page size, then the grid pages in place, sending no request.
- [ ] Given a `grid` with no rows, then the column headings stay above "No data to show".
- [ ] Given a `grid` whose data has more than 500 rows, then it fails data validation and the cell shows its error state; rows are never truncated.
- [ ] Given a `grid` page of 500 rows, when the viewer scrolls from the first row to the last, then only the rows in view are rendered and the view stays responsive in the light and the dark scope (`cpt-frontx-dashboard-nfr-large-table`).
- [ ] Given a `grid`, when it is inspected, then ARIA grid semantics expose the row count and the row positions of virtualized rows, the sort state of each sortable header, and the sort, page, page size, and resize controls can be operated with the keyboard alone.
- [ ] Given a `grid` whose `columns` has two entries with the same `key`, whose `column_groups` names a key that is not a column, whose group columns are not contiguous, whose column is in two groups, whose `row_color` is not a column key, or whose member is repeated within one group, when it is validated, then in each case the widget fails.
- [ ] Given a `cartesian_chart` with a category x axis, when it renders, then the x positions follow the delivered order. With a value or time x axis, points are placed by value. A null value is a gap; a null x or series name is an empty label. Every series is named in the legend and the tooltip.
- [ ] Given a `cartesian_chart` whose data has a series with no entry in `render.series`, when it renders, then that series draws as bars on the primary axis.
- [ ] Given a `pie_chart`, when it renders, then the legend and tooltip show each segment's label and value. A null or zero segment has no size but stays in the legend.
- [ ] Given a `heatmap`, when it renders, then the categories follow first-appearance order, the scale is shown with numbers, the tooltip shows x, y, and value, and a null value leaves the cell empty.
- [ ] Given a `heatmap` whose `min_value` is greater than its `max_value`, when it is validated, then the widget fails.
- [ ] Given a data widget whose answer has a null label, x, y, or series value, when it renders, then that value shows as an empty label and the row or point stays.
- [ ] Given a chart widget, when it builds a tooltip, then the tooltip is built from text, never from HTML strings.
- [ ] Given a widget, when it conveys meaning, then colour is never the only signal: the heatmap's numeric scale, progress values as text, the trend icon, and series and segment naming in legends and tooltips all carry the meaning.
- [ ] Given the dashboard root, when it is inspected, then it registers no chart theme and has no chart-library dependency.
- [ ] Given a widget, when the host theme id maps to dark, then it uses the dark ui-kit scope; an unknown id gives light. The set of dark theme ids is enumerated and updated when the host adds a dark theme.
