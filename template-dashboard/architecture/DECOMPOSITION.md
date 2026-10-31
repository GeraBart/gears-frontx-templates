---
status: accepted
version: 1
date: 2026-10-31
description: "Decomposition of the dashboard template DESIGN into four features: the dashboard model, the dashboard runtime, the widget contract, and the widget catalog, with their scope, dependency order, and coverage of PRD and DESIGN identifiers."
---

# Decomposition: Dashboard Template

<!-- toc -->

- [1. Overview](#1-overview)
- [2. Entries](#2-entries)
  - [2.1 Dashboard Model - HIGH](#21-dashboard-model---high)
  - [2.2 Dashboard Runtime - HIGH](#22-dashboard-runtime---high)
  - [2.3 Widget Contract - HIGH](#23-widget-contract---high)
  - [2.4 Widget Catalog - HIGH](#24-widget-catalog---high)
- [3. Feature Dependencies](#3-feature-dependencies)

<!-- /toc -->

## 1. Overview

The DESIGN is decomposed into four features. Two are **model features** (the dashboard model and the widget contract) that declare GTS types and have no actor flows. One is a **runtime feature** (the dashboard runtime) that owns the flows. One is a **catalog feature** (the widget catalog) that owns the widget types, their params and data shapes, and the rendering rules.

**Decomposition strategy:**

- The dashboard model owns the dashboard type, the layout, the cells, the layout checks, and failure attribution. It is the data a dashboard author writes.
- The widget contract owns the widget base, `data_widget`, the widget-data base, the `render_widget` action, the `widgets` domain and its extension type, the entry declaration, the widget-author obligations, and the shared-dependency and budget rules. It is the contract a widget author writes against.
- The dashboard runtime owns the hosting, the registry, the GTS-file loading, the binding runner, the cell frame, the larger-view overlay, and teardown. It is the code that renders a dashboard.
- The widget catalog owns the 9 widget types, each with its params and data shape, the rendering rules, markdown safety, and the grid's client-side sort and page. It is what a dashboard author picks from.
- Each feature is `p1`: all four are needed for a complete template. The implementation order is the dependency order in section 3.

Each feature is delivered as a single phase; no sub-decomposition is needed at this level.

## 2. Entries

**Overall implementation status:**

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-status-overall`

### 2.1 Dashboard Model - HIGH

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-feature-dashboard-model`

- **Purpose**: The dashboard type, the layout cells on the 60-column grid, the layout checks, and per-cell failure attribution. This is the data a dashboard author writes and the root validates.

- **Depends On**: None

- **Scope**:
  - The dashboard GTS type and its instances.
  - The layout cells (`x`, `y`, `w`, `h` on the 60-column grid) as plain closed objects.
  - The embedded widget instance (`widget` and `larger_view`) and its registration on its own.
  - The layout checks: cell bounds, overlaps, `x + w ≤ 60`, unique widget ids.
  - Failure attribution: dashboard-level vs per-cell (D13).

- **Out of scope**:
  - The widget types and data types (feature-widget-contract, feature-widget-catalog).
  - The runtime that runs the checks (feature-dashboard-runtime).

- **Requirements Covered**:
  - [ ] `p1` - `cpt-frontx-dashboard-fr-dashboard-root`
  - [ ] `p1` - `cpt-frontx-dashboard-fr-per-cell-failure`
  - [ ] `p1` - `cpt-frontx-dashboard-fr-dashboard-as-json`

- **Design Principles Covered**:
  - [ ] `p1` - `cpt-frontx-dashboard-principle-open-bases-closed-leaves`

- **Design Constraints Covered**:
  - [ ] `p1` - `cpt-frontx-dashboard-constraint-sixty-column-grid`
  - [ ] `p1` - `cpt-frontx-dashboard-constraint-one-gts-package`

- **Domain Model Entities**:
  - Dashboard (type and instances)
  - Cell (layout coordinates, widget, larger_view)
  - Widget instance (embedded, registered on its own)

- **Design Components**:

  - [ ] `p1` - `cpt-frontx-dashboard-component-dashboard-root` (model side: dashboard type, layout checks, failure attribution)

- **API**:
  - The dashboard GTS type and instance schema.

- **Sequences**:

  - `cpt-frontx-dashboard-seq-runtime-flow` (load and layout-check steps)

- **Data**:
  - None (no database; `cpt-frontx-dashboard-db-none`).

### 2.2 Dashboard Runtime - HIGH

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-feature-dashboard-runtime`

- **Purpose**: The hosting, the `widgets` domain registry, the served GTS-file loading, the binding runner, the cell frame, the larger-view overlay, and teardown. This is the code that renders a dashboard from its JSON.

- **Depends On**: `cpt-frontx-dashboard-feature-dashboard-model`

- **Scope**:
  - Hosting-agnostic mounting (single-page application or screen extension) (D12).
  - The `widgets` domain registration and its declaration (D7).
  - Generated extensions per cell and per larger view, with deterministic UUIDv5 ids, `mount_ext`/`unmount_ext` with `history: "none"` (D5).
  - The served GTS-file fetch and registration; the bundle-schema guard.
  - The binding runner: request via the FrontX API package, CEL transform, stamp, register (D2, D3, D16, D17, D20).
  - The cell frame (title, loader, error state, larger-view button) and the larger-view overlay inside the root's container (D7, D8).
  - Theme and language publishing; teardown; late-result dropping.

- **Out of scope**:
  - The dashboard type and layout checks (feature-dashboard-model).
  - The widget types and the `render_widget` action contract (feature-widget-contract).
  - The 9 catalog widget types (feature-widget-catalog).

- **Requirements Covered**:
  - [ ] `p1` - `cpt-frontx-dashboard-fr-dashboard-root`
  - [ ] `p1` - `cpt-frontx-dashboard-fr-runtime-source`
  - [ ] `p1` - `cpt-frontx-dashboard-fr-states`
  - [ ] `p1` - `cpt-frontx-dashboard-fr-same-origin-data`
  - [ ] `p1` - `cpt-frontx-dashboard-fr-no-product-data-code`
  - [ ] `p1` - `cpt-frontx-dashboard-fr-larger-view`
  - [ ] `p1` - `cpt-frontx-dashboard-fr-theme`
  - [ ] `p1` - `cpt-frontx-dashboard-fr-safe-mappings`
  - [ ] `p1` - `cpt-frontx-dashboard-fr-isolation`
  - [ ] `p1` - `cpt-frontx-dashboard-nfr-initial-render`
  - [ ] `p1` - `cpt-frontx-dashboard-nfr-no-persistence`
  - [ ] `p1` - `cpt-frontx-dashboard-nfr-visual-quality` (root side: cell frame)
  - [ ] `p2` - `cpt-frontx-dashboard-usecase-view-dashboard`
  - [ ] `p1` - `cpt-frontx-dashboard-contract-host`
  - [ ] `p1` - `cpt-frontx-dashboard-contract-same-origin-api`

- **Design Principles Covered**:
  - [ ] `p1` - `cpt-frontx-dashboard-principle-render-only`
  - [ ] `p1` - `cpt-frontx-dashboard-principle-per-instance-isolation`

- **Design Constraints Covered**:
  - [ ] `p1` - `cpt-frontx-dashboard-constraint-same-origin-data`
  - [ ] `p1` - `cpt-frontx-dashboard-constraint-hosting-agnostic`
  - [ ] `p1` - `cpt-frontx-dashboard-constraint-one-gts-package`

- **Domain Model Entities**:
  - Widget extension (generated per cell/larger view)

- **Design Components**:

  - [ ] `p1` - `cpt-frontx-dashboard-component-dashboard-root` (runtime side)
  - [ ] `p1` - `cpt-frontx-dashboard-component-binding-runner`

- **API**:
  - The `widgets` domain and its declaration.
  - The binding runner internal interface (parse, check, evaluate, convert to JSON).

- **Sequences**:

  - `cpt-frontx-dashboard-seq-runtime-flow`
  - `cpt-frontx-dashboard-seq-open-dashboard`
  - `cpt-frontx-dashboard-seq-open-larger-view`

- **Data**:
  - None (no database; `cpt-frontx-dashboard-db-none`).

### 2.3 Widget Contract - HIGH

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-feature-widget-contract`

- **Purpose**: The bases, the traits, the `render_widget` action, the `widgets` domain extension type, the entry declaration, the widget-author obligations, and the shared-dependency and budget rules. This is the contract a widget author writes against.

- **Depends On**: `cpt-frontx-dashboard-feature-dashboard-model`

- **Scope**:
  - The abstract widget base (`id`, `title?`, `params`) and the `entry` trait schema (D6).
  - The abstract `data_widget` (required `data`, `data_type` trait) (D19).
  - The abstract widget-data base and the stamped-data id rule (D20).
  - The `render_widget` action type (D7).
  - The `widgets` domain extension type.
  - The entry declaration (a plain FrontX `entry_mf` instance: `requiredProperties`, `actions`, `domainActions`, `manifest`, `exposedModule`, `exposeAssets`).
  - The widget-author obligations (renders `params` and `data`, makes no requests, theme mapping, ui-kit tokens, formats, text not markup, no cut-off, no meaning by colour alone, keyboard-operable).
  - The shared-dependency and budget rules (ADR-0010).

- **Out of scope**:
  - The 9 concrete widget types and their params/data shapes (feature-widget-catalog).
  - The runtime that sends `render_widget` (feature-dashboard-runtime).

- **Requirements Covered**:
  - [ ] `p1` - `cpt-frontx-dashboard-fr-add-fix-widget`
  - [ ] `p1` - `cpt-frontx-dashboard-fr-widget-catalog` (contract side)
  - [ ] `p2` - `cpt-frontx-dashboard-fr-author-guides` (widget-author guide)
  - [ ] `p1` - `cpt-frontx-dashboard-interface-contract`
  - [ ] `p1` - `cpt-frontx-dashboard-interface-binding`
  - [ ] `p1` - `cpt-frontx-dashboard-interface-render-widget`
  - [ ] `p3` - `cpt-frontx-dashboard-nfr-bundle-budget` (shared-dependency and root budget rules)

- **Design Principles Covered**:
  - [ ] `p1` - `cpt-frontx-dashboard-principle-open-bases-closed-leaves`
  - [ ] `p1` - `cpt-frontx-dashboard-principle-per-instance-isolation`

- **Design Constraints Covered**:
  - [ ] `p1` - `cpt-frontx-dashboard-constraint-one-gts-package`
  - [ ] `p1` - `cpt-frontx-dashboard-constraint-hosting-agnostic` (FrontX-only deps)

- **Domain Model Entities**:
  - Widget base (abstract, `entry` trait)
  - Data widget (abstract, `data`, `data_type` trait)
  - Widget data base (abstract)
  - Binding (closed sub-schema of `data_widget`)
  - MFE entry (plain FrontX instance)

- **Design Components**:

  - [ ] `p1` - `cpt-frontx-dashboard-component-widget-catalog` (contract side: bases, traits, entry declaration)

- **API**:
  - The `render_widget` action type.
  - The widget base, `data_widget`, and widget-data base schemas.
  - The `entry` and `data_type` trait schemas.

- **Sequences**:
  - None (no actor flows; the contract is data).

- **Data**:
  - None (no database; `cpt-frontx-dashboard-db-none`).

### 2.4 Widget Catalog - HIGH

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-feature-widget-catalog`

- **Purpose**: The 9 widget types, each with its params and data shape, the rendering rules, markdown safety, and the grid's client-side sort and page. This is what a dashboard author picks from.

- **Depends On**: `cpt-frontx-dashboard-feature-widget-contract`

- **Scope**:
  - The 9 v1 widget types: `summary_card`, `metric_card`, `ranked_list_card`, `progress_list_card`, `grid`, `cartesian_chart`, `pie_chart`, `heatmap`, `markdown_card` (D1).
  - The final `params` and data shapes per type (O3).
  - The grid row cap and page sizes (O8), and the grid's client-side sort and page (D15).
  - Markdown safety: CommonMark, HTML as text, script links inactive, links with no opener.
  - The per-type rendering rules (theme mapping, ui-kit tokens, formats, accessibility).
  - The catalog widget libraries: ECharts via `echarts/core`, TanStack Table v8 + virtualizer, CommonMark.

- **Out of scope**:
  - The bases and traits (feature-widget-contract).
  - The runtime (feature-dashboard-runtime).
  - New widget types defined by a product (out of scope for the template).

- **Requirements Covered**:
  - [ ] `p1` - `cpt-frontx-dashboard-fr-widget-catalog` (the 9 types)
  - [ ] `p1` - `cpt-frontx-dashboard-fr-grid-sort-page`
  - [ ] `p1` - `cpt-frontx-dashboard-fr-markdown-safety`
  - [ ] `p2` - `cpt-frontx-dashboard-fr-accessibility`
  - [ ] `p1` - `cpt-frontx-dashboard-fr-theme` (widget side: scope mapping, chart themes)
  - [ ] `p1` - `cpt-frontx-dashboard-nfr-visual-quality`
  - [ ] `p2` - `cpt-frontx-dashboard-nfr-large-table`
  - [ ] `p3` - `cpt-frontx-dashboard-nfr-bundle-budget` (per-widget entry size)
  - [ ] `p2` - `cpt-frontx-dashboard-usecase-add-fix-widget` (the 9 types a widget author ships)
  - [ ] `p2` - `cpt-frontx-dashboard-fr-author-guides` (dashboard-author guide)

- **Design Principles Covered**:
  - [ ] `p1` - `cpt-frontx-dashboard-principle-open-bases-closed-leaves` (each concrete type closes itself)
  - [ ] `p1` - `cpt-frontx-dashboard-principle-per-instance-isolation` (per-instance chart themes)

- **Design Constraints Covered**:
  - [ ] `p1` - `cpt-frontx-dashboard-constraint-one-gts-package`

- **Domain Model Entities**:
  - The 9 widget types (concrete derived types)
  - The 8 data types (one per data widget type)
  - The 9 MFE entries

- **Design Components**:

  - [ ] `p1` - `cpt-frontx-dashboard-component-widget-catalog` (the 9 types, libraries, rendering rules)

- **API**:
  - The 9 widget type schemas and 8 data type schemas.

- **Sequences**:
  - None (the catalog is data and rendering rules; the runtime drives the flows).

- **Data**:
  - None (no database; `cpt-frontx-dashboard-db-none`).

---

## 3. Feature Dependencies

```text
cpt-frontx-dashboard-feature-dashboard-model
    ↓
    ├─→ cpt-frontx-dashboard-feature-dashboard-runtime
    └─→ cpt-frontx-dashboard-feature-widget-contract
            ↓
            └─→ cpt-frontx-dashboard-feature-widget-catalog
```

**Dependency Rationale**:

- `cpt-frontx-dashboard-feature-dashboard-runtime` requires `cpt-frontx-dashboard-feature-dashboard-model`: the runtime registers the dashboard type and runs the layout checks the model defines.
- `cpt-frontx-dashboard-feature-widget-contract` requires `cpt-frontx-dashboard-feature-dashboard-model`: the widget base and `data_widget` derive from the model's GTS package, and the dashboard embeds widget instances the contract describes.
- `cpt-frontx-dashboard-feature-widget-catalog` requires `cpt-frontx-dashboard-feature-widget-contract`: each of the 9 types derives from the widget base or `data_widget` and sets the `entry` and `data_type` traits the contract defines.
- `cpt-frontx-dashboard-feature-dashboard-runtime` and `cpt-frontx-dashboard-feature-widget-contract` are independent of each other and can be developed in parallel once the model is fixed.
