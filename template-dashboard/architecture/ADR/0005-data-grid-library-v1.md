---
status: accepted
date: 2026-10-27
decision-makers: template-dashboard architecture maintainers
description: "Decision record for the library behind the render-only grid widget type: TanStack Table as a typed column and row model with virtualized rows, so up to 5,000 delivered rows show without paging at a small per-instance cost."
---

# ADR-0005: Data grid library

**ID**: `cpt-frontx-dashboard-adr-data-grid-library`

<!-- toc -->

- [Context and Problem Statement](#context-and-problem-statement)
- [Decision Drivers](#decision-drivers)
- [Considered Options](#considered-options)
- [Decision Outcome](#decision-outcome)
  - [Consequences](#consequences)
  - [Confirmation](#confirmation)
- [Pros and Cons of the Options](#pros-and-cons-of-the-options)
  - [TanStack Table (headless)](#tanstack-table-headless)
  - [AG Grid Community Edition](#ag-grid-community-edition)
  - [MUI DataGrid (free tier)](#mui-datagrid-free-tier)
  - [Mantine DataTable](#mantine-datatable)
  - [Glide Data Grid (canvas-based)](#glide-data-grid-canvas-based)
  - [No library: semantic HTML table rendered by the widget](#no-library-semantic-html-table-rendered-by-the-widget)
- [More Information](#more-information)
- [Traceability](#traceability)

<!-- /toc -->

## Context and Problem Statement

The `grid` widget type shows tabular data. Its data is the generic tabular result of its widget data request: the ordered column names and the rows, each a positional array of values aligned to those columns ([ADR-0011](0011-backend-delivered-dashboard-v1.md)). The grid's configuration lists its displayed columns, and each column binds by `columns[].key` to one result column name. The grid renders the rows in the delivered order, with each cell's value shown as text. Its presentation settings are fixed by the layout: frozen leading columns, grouped column headings, and row coloring by a result column with ui-kit tokens. The browser does not sort, group, page, filter or otherwise rearrange the rows, and the Viewer host offers no control that changes the presentation. The grid widget requests its data through the FrontX API package once, after it receives `set_widget_context`. After that it only renders, and it makes no further request other than Retry after a failed request. Its larger view sends the same request and adds no paging, sorting or filtering (ADR-0011). In FrontX each MFE instance is isolated, so every grid widget instance evaluates its own copy of whatever library the grid uses.

Which library, if any, renders the `grid` widget type?

Constraints that apply to every option:

- The grid is render-only: no client-side sorting, grouping, paging or column resizing is needed, so built-in table interaction features carry no weight.
- Every feature used must be available under a permissive (MIT-compatible) license.
- Expected volume is 500 to 5,000 rows per grid widget, all shown without paging. Above 10,000 rows is not a target.
- Cells show their value as text; there are no cell renderers for now. Cell content stays DOM, so it remains reachable for screen readers.
- The design system, `@gears-frontx/ui-kit`, owns visual appearance. The library must not impose its own CSS.

## Decision Drivers

* Strict TypeScript support with generic column definitions typed against the grid shell's row model.
* MIT license for every feature the widget uses.
* Headless rendering, so the grid shell owns the markup and ui-kit tokens style the grid.
* Small library size, because every grid widget instance evaluates its own copy of the library (FrontX ADR-0011).
* Reliable AI code generation for the library's API.
* Rendering performance with 500 to 5,000 delivered rows, shown without paging, so only the visible rows may be rendered.

## Considered Options

* TanStack Table (headless)
* AG Grid Community Edition
* MUI DataGrid (free tier)
* Mantine DataTable
* Glide Data Grid (canvas-based)
* No library: semantic HTML table rendered by the widget

## Decision Outcome

Chosen option: "TanStack Table (headless)", because it combines full rendering control, strict TypeScript generics on column definitions, an MIT license, and a library small enough to be evaluated once per MFE instance, while sparing the widget a hand-built column and row model, and it pairs with a virtualizer from the same project for large row sets.

The `grid` widget type uses TanStack Table v8 only as a typed column and row model for rendering. Its sorting, grouping, pagination, filtering and column-sizing features are not used: the rows, their order and the column set come from the delivered result and the grid configuration as given. The grid shell builds one column definition per configured column. Each definition reads its value from the position of its bound result column in the row array, so the positional rows of the generic result need no conversion. The shell keeps the first `frozen_columns` columns visible during horizontal scrolling, shows the grouped column headings from `column_groups`, and colors rows by a result column with ui-kit tokens. The widget renders the table itself, and each cell shows its value as text. Large grids use the TanStack virtualizer: the grid shell renders only the rows in view, so 500 to 5,000 rows show without paging. The widget keeps the library behind its own typed props, so the grid configuration does not depend on library types.

### Consequences

* Good, because column definitions are typed against the grid shell's row model under `strict: true`, and accessors over positional rows are written once in the shell. A configured column that the result lacks is caught by the widget's column-binding check at run time, which shows a cannot-show state instead of an empty column.
* Good, because every feature the widget uses is MIT-licensed, with no commercial tier.
* Good, because the headless design keeps ui-kit in charge of appearance, with no style conflicts, and row coloring follows the light or dark kit scope.
* Good, because virtualized rows keep a 5,000-row grid responsive without paging, and the rows stay DOM elements.
* Good, because the library is small (about 15 KB gzipped). FrontX isolates each MFE instance and shares no singletons (FrontX ADR-0011), so every grid widget instance evaluates its own copy, and a small library keeps that repeated cost low. FrontX ADR-0034 reuses the source text of a shared package when its content hash matches, so the library is fetched once per realm, but each instance still evaluates its own copy.
* Bad, because headless means the header and row markup, including frozen columns and grouped headings, must be built once. Mitigation: it lives in one grid shell component that all grid configurations share.
* Bad, because accessibility (ARIA grid semantics, including row counts and positions for virtualized rows) must be implemented in that shell by hand.
* Bad, because virtualization adds a second small library and means off-screen rows are not in the DOM. Mitigation: it is the TanStack virtualizer, used only inside the grid shell.
* Bad, because the library's sorting, grouping and pagination APIs are present but must stay unused. Mitigation: the grid shell exposes no props for them, and code review rejects their use.
* Bad, because AI tools sometimes produce the old React Table v7 API. Mitigation: AI guidance for the template names version 8.

### Confirmation

Confirmed by code review and by checks on the `grid` widget:

* The widget builds its table with TanStack Table, and no other grid library appears in the dependency list of the widget package.
* Cells show their value as text, and no column configuration selects a cell renderer.
* Each column definition reads the value of its bound result column by position, and a result that lacks a column named by `columns[].key` shows the widget's cannot-show state.
* A grid with 5,000 delivered rows renders only the rows in view, scrolls through all rows without paging, and keeps the delivered order. Frozen columns, grouped column headings and row coloring render as configured in the light and the dark kit scope.
* The grid sends its widget data request once after `set_widget_context` and makes no further request other than Retry after a failed request. Its larger view sends the same request and offers no paging, sorting or filtering. The shell uses no sorting, grouping, pagination, filtering or column-resizing feature of the library and offers no control for them.
* The transferred gzipped size of each `grid` widget entry is measured on a cold load of the reference dashboard under the counting rule of DESIGN section 3.9: its own code counts against the provisional per-widget figure, and TanStack Table and the virtualizer, as shared packages, count once in the page total. The evaluation cost of each instance counts against the initial-render budget. Source-text reuse by content hash (FrontX ADR-0034) is not counted as a reduction of the per-instance evaluation cost (FrontX ADR-0011).
* The grid shell exposes ARIA grid semantics, including row counts and positions for virtualized rows, checked by an automated accessibility check and a keyboard test (traces `cpt-frontx-dashboard-nfr-accessibility`).

## Pros and Cons of the Options

### TanStack Table (headless)

The headless table library with full rendering control.

* Good, because column definition generics are strong under strict TypeScript.
* Good, because all features are MIT-licensed.
* Good, because its small size suits a library that each isolated instance evaluates separately.
* Good, because rendering is fully ours, including frozen columns and grouped headings.
* Good, because virtualized rows through `@tanstack/react-virtual` cover 500 to 5,000 delivered rows without paging.
* Bad, because all grid markup must be built.
* Bad, because its interaction features (sorting, grouping, pagination) are unused weight in the render-only scope.
* Bad, because there is no built-in accessibility.

### AG Grid Community Edition

A complete grid with built-in UI.

* Good, because rendering and accessibility come built in.
* Good, because performance is high on very large sets.
* Bad, because most of its built-in UI is interaction (sorting, filtering, pagination) that the render-only grid does not use.
* Bad, because the library is about 300 KB gzipped, which every isolated instance would evaluate again.
* Bad, because its own CSS conflicts with ui-kit.

### MUI DataGrid (free tier)

The Material UI data grid.

* Good, because UI and accessibility come built in.
* Bad, because its built-in UI is largely interaction the render-only grid does not use, and it is large to evaluate per instance.
* Bad, because it pulls in the MUI ecosystem, which conflicts with ui-kit.

### Mantine DataTable

The Mantine data table component.

* Good, because it is MIT-licensed with a simple API.
* Bad, because it has no virtualization and needs the Mantine ecosystem, which conflicts with ui-kit.

### Glide Data Grid (canvas-based)

A canvas-rendered grid for very large datasets.

* Good, because canvas rendering is fast on very large sets.
* Bad, because cells are canvas draw calls, outside ui-kit's components and tokens.
* Bad, because canvas output has no DOM for screen readers.

### No library: semantic HTML table rendered by the widget

The widget renders a plain `<table>` from its configuration and its result.

* Good, because it adds no library cost to any instance and fits the render-only scope directly.
* Good, because rendering and styling are fully ours.
* Bad, because the typed column model and the row model must be built and maintained by hand.
* Bad, because large delivered row sets would need a hand-built virtualization.

## More Information

* This ADR covers the grid library only. Chart rendering is a separate decision ([ADR-0004](0004-charting-library-v1.md)).
* Evolution path: the grid shell hides TanStack Table behind typed props. If the library changes or is replaced, only the shell changes, and grid widget configurations stay the same.
* Review trigger: the measured benefit of the typed column model no longer outweighs the library cost in the render-only scope (the no-library option becomes preferable); data sets regularly exceed 10,000 rows; a TanStack Table major version forces a large shell rewrite; the measured size or evaluation cost exceeds the provisional figures of DESIGN section 3.9 once they are confirmed.
* Row order is the delivered order of the result's rows, and the grid never reorders, collapses or groups them. Grouped column headings only label contiguous columns in the header.
* Scope: changes the `grid` widget type and its grid shell. Does not change other widget types, the dashboard, the generic result, or the grid configuration type ([ADR-0009](0009-subject-agnostic-widget-catalog-v1.md)).
* Checklist applicability:
  * ARCH: applicable, addressed by the decision and options.
  * PERF: applicable, per-instance evaluation cost, the bundle counting rule of DESIGN section 3.9, and virtualized rendering of 500 to 5,000 delivered rows.
  * SEC: N/A, because the grid library renders a result already in browser memory, with no auth or storage of its own.
  * REL: N/A, because the grid library has no external dependency; widget data failures are shown per widget ([ADR-0011](0011-backend-delivered-dashboard-v1.md)).
  * DATA: N/A, because the grid reads its result and persists nothing.
  * INT: applicable, the grid consumes the generic result through its own typed props and binds columns by name; the library adds no external API.
  * OPS: N/A, because the template has no deployed service; the consuming product owns operations.
  * MAINT: applicable, the shell hides the library, and AI guidance names version 8.
  * TEST: applicable, see Confirmation.
  * COMPL: applicable, every used feature must be MIT-licensed.
  * UX: applicable, accessibility is built in the shell; the grid offers no controls that change the presentation.
  * BIZ: N/A, because this is a technical decision.

## Traceability

- **PRD**: [PRD.md](../PRD.md)
- **DESIGN**: [DESIGN.md](../DESIGN.md)

This decision directly addresses the following requirements or design elements:

* `cpt-frontx-dashboard-fr-widget-catalog` — the `grid` widget type is one of the 9 widget types; its grid shell on TanStack Table renders the delivered rows with frozen columns, grouped column headings and row coloring as configured.
* `cpt-frontx-dashboard-nfr-large-table` — virtualized row rendering keeps a grid of up to 5,000 delivered rows responsive while scrolling, without paging.
* `cpt-frontx-dashboard-nfr-bundle-budget` — the grid entry's own code and the shared library are counted by the rule of DESIGN section 3.9.
* `cpt-frontx-dashboard-nfr-visual-quality` — row coloring and all grid styling use ui-kit tokens in the light or dark scope.
* `cpt-frontx-dashboard-nfr-accessibility` — accessibility of the grid is delivered by the grid shell.
* `cpt-frontx-dashboard-component-widget-library` — the grid shell inside the `grid` widget type's cell and modal entries.
