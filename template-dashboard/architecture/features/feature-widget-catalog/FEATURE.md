---
status: accepted
version: 1
date: 2026-10-31
description: "Feature: the widget catalog — the 9 v1 widget types, each with its params and data shape, the rendering rules, markdown safety, and the grid's client-side sort and page."
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
- [4. States (CDSL)](#4-states-cdsl)
  - [No lifecycle states](#no-lifecycle-states)
- [5. Definitions of Done](#5-definitions-of-done)
  - [Nine widget types](#nine-widget-types)
  - [Per-type params and data shapes (O3)](#per-type-params-and-data-shapes-o3)
  - [Grid row cap, page sizes, and client-side sort/page (O8, D15)](#grid-row-cap-page-sizes-and-client-side-sortpage-o8-d15)
  - [Markdown safety](#markdown-safety)
  - [Per-type rendering rules](#per-type-rendering-rules)
  - [Catalog libraries and licences](#catalog-libraries-and-licences)
  - [Dashboard-author guide](#dashboard-author-guide)
- [6. Acceptance Criteria](#6-acceptance-criteria)

<!-- /toc -->

## 1. Feature Context

- [ ] `p1` - `cpt-frontx-dashboard-feature-widget-catalog`

### 1.1 Overview

The 9 v1 widget types, each a GTS type (params), a data type (data shape), and one FrontX MFE entry (D1). The final params and data shapes per type (O3), the grid row cap and page sizes (O8), the grid's client-side sort and page (D15), markdown safety, and the per-type rendering rules.

### 1.2 Purpose

A dashboard author picks from the catalog. The catalog is bounded by presentation shapes, not by subject: a new dataset needs no new widget type. Each type states the exact data it needs, and the root's registration validates every answer against it.

**Requirements**: `cpt-frontx-dashboard-fr-widget-catalog`, `cpt-frontx-dashboard-fr-grid-sort-page`, `cpt-frontx-dashboard-fr-markdown-safety`, `cpt-frontx-dashboard-fr-accessibility`, `cpt-frontx-dashboard-fr-theme` (widget side), `cpt-frontx-dashboard-nfr-visual-quality`, `cpt-frontx-dashboard-nfr-large-table`, `cpt-frontx-dashboard-nfr-bundle-budget`, `cpt-frontx-dashboard-usecase-add-fix-widget`, `cpt-frontx-dashboard-fr-author-guides` (dashboard-author guide).

**Principles**: `cpt-frontx-dashboard-principle-open-bases-closed-leaves`, `cpt-frontx-dashboard-principle-per-instance-isolation`.

**Constraints**: `cpt-frontx-dashboard-constraint-one-gts-package`.

**Not applicable**: persistence/DB (no database), auth/security (sign-in out of scope, D4), ops/rollout (no deployed service).

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
4. [ ] - `p1` - **RETURN** — no request is sent, no binding re-runs (D15). - `inst-wc-return`

## 3. Processes / Business Logic (CDSL)

### Render a markdown card safely

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-algo-widget-catalog-markdown`

**Input**: a `markdown_card` body string.

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

The system **MUST** ship 9 widget types, each a closed derived GTS type with `unevaluatedProperties: false`, setting `entry` and (for data widgets) `data_type`: `summary_card`, `metric_card`, `ranked_list_card`, `progress_list_card`, `grid`, `cartesian_chart`, `pie_chart`, `heatmap` (derived from `data_widget`), and `markdown_card` (derived from the widget base, forbidding `data`) (D1).

**Implements**: `cpt-frontx-dashboard-fr-widget-catalog`, `cpt-frontx-dashboard-usecase-add-fix-widget`.

**Touches**:
- Entities: the 9 widget types, the 8 data types, the 9 entries

### Per-type params and data shapes (O3)

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-dod-widget-catalog-shapes`

Each data widget type **MUST** declare a closed `params` schema (including any value format and unit hints) and a closed data shape derived from the widget-data base. Measure-valued fields accept `null` (shown as a gap or empty value; for `metric_card` a `null` `value` is the empty state). The final params and data shapes per type follow the sketch's worked example: `pie_chart` data `{slices: [{label, value}]}`; `cartesian_chart` params `{kind: line|bar|area, x_label?, y_label?, stacked?}` and data `{series: [{name, points: [{x, y}]}]}`. Richer params (series options and axes for `cartesian_chart`, radius and rose type for `pie_chart`, frozen columns, groups and row colours for `grid`, scale bounds for `heatmap`) are included where the type needs them.

**Implements**: `cpt-frontx-dashboard-fr-widget-catalog`.

**Touches**:
- Entities: the 9 widget types, the 8 data types

### Grid row cap, page sizes, and client-side sort/page (O8, D15)

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-dod-widget-catalog-grid`

The grid's transform output **MUST** have a row cap of 500 rows. The grid **MUST** always page, with page sizes `[10, 25, 50, 100, 500]`, and sort and page client-side over the rows the transform delivered, sending no request. The grid uses TanStack Table v8 with the virtualizer and ARIA grid semantics (ADR-0005).

**Implements**: `cpt-frontx-dashboard-flow-widget-catalog-grid-sort-page`, `cpt-frontx-dashboard-fr-grid-sort-page`, `cpt-frontx-dashboard-nfr-large-table`.

### Markdown safety

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-dod-widget-catalog-markdown`

`markdown_card` **MUST** render CommonMark (`cpt-frontx-dashboard-algo-widget-catalog-markdown`): embedded HTML as text, `javascript`/`vbscript`/`data` links inactive, links with no opener.

**Implements**: `cpt-frontx-dashboard-algo-widget-catalog-markdown`, `cpt-frontx-dashboard-fr-markdown-safety`.

### Per-type rendering rules

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-dod-widget-catalog-rendering`

Each widget entry **MUST** render `params` and `data` (including its own empty state), map the host theme id to the ui-kit light or dark scope (unknown gives light), style with ui-kit tokens, format numbers and dates for the host language, show text never markup, never cut content off, never convey meaning by colour alone, and be keyboard-operable. Chart widgets build their `frontx-dashboard` theme from kit tokens (`cpt-frontx-dashboard-algo-widget-catalog-chart-theme`) using ECharts via `echarts/core` (ADR-0004).

**Implements**: `cpt-frontx-dashboard-fr-theme` (widget side), `cpt-frontx-dashboard-fr-accessibility`, `cpt-frontx-dashboard-nfr-visual-quality`.

### Catalog libraries and licences

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-dod-widget-catalog-libraries`

The catalog widgets **MUST** use ECharts (Apache-2.0) via `echarts/core`, TanStack Table v8 + virtualizer (MIT), and CommonMark (permissive), listed in `shared`, each entry under 100 KB own code only.

**Implements**: `cpt-frontx-dashboard-nfr-bundle-budget`.

### Dashboard-author guide

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-dod-widget-catalog-author-guide`

The template **MUST** ship a dashboard-author guide covering writing a dashboard JSON, the grid, the binding, the catalog, and the layout checks.

**Implements**:
- `cpt-frontx-dashboard-fr-author-guides` (dashboard-author guide)

**Touches**:
- Entities: Dashboard, Cell, Widget instance, Binding

## 6. Acceptance Criteria

- [ ] The 9 widget types ship, each closed with `unevaluatedProperties: false`; `markdown_card` forbids `data`; the 8 data types derive from the widget-data base.
- [ ] A misspelled param on a concrete widget type fails validation and the widget gets the cannot-be-shown state.
- [ ] The grid sorts and pages client-side over the rows the transform delivered, up to the 500-row cap, with page sizes `[10, 25, 50, 100, 500]`, sending no request.
- [ ] `markdown_card` renders CommonMark with HTML as text, `javascript:` links inactive, and links with no opener.
- [ ] A `null` measure value is shown as a gap or empty value; a `null` `value` on `metric_card` is the empty state.
- [ ] Chart widgets build the `frontx-dashboard` theme from ui-kit tokens of the mapped scope and rebuild it on a theme change, with no request.
- [ ] Each widget entry follows the rendering rules: no requests, theme mapping, ui-kit tokens, formats, text not markup, no cut-off, no meaning by colour alone, keyboard-operable.
