---
status: accepted
date: 2026-10-23
decision-makers: template-dashboard architecture maintainers
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

The `grid` widget kind shows tabular data, for example the pull request list of the demo dashboard. It renders rows and columns exactly as the backend supplies them, with each cell's value shown as text, and keeps frozen columns, column header groups, row coloring and optional row groups as supplied. The browser does not sort, group, paginate, filter or otherwise rearrange the rows, and the viewer offers no control that changes the presentation: the backend-supplied layout and widget configuration fully define how the grid is composed and presented, and the rows arrive in the order to show. They come as the grid's `widget_data`, which the grid widget requests once when it mounts ([ADR-0011](0011-backend-delivered-dashboard-v1.md)); after that the grid only renders. The earlier DevExpert prototype made this choice for widgets that were built as separate bundles; the template keeps the choice and has to restate it for FrontX, where each MFE instance is isolated.

Which library, if any, renders the `grid` widget kind?

Constraints that apply to every option:

- The grid is render-only: no client-side sorting, grouping, pagination or column resizing is needed, so built-in table interaction features carry no weight.
- Every feature used must be available under a permissive (MIT-compatible) license.
- Expected volume is 500 to 5,000 rows per grid widget, all shown without paging. Above 10,000 rows is not a target.
- Cells show their value as text; there are no cell renderers for now. Cell content stays DOM, so it remains reachable for screen readers.
- The design system owns visual appearance. The library must not impose its own CSS.

## Decision Drivers

* Strict TypeScript support with generic column definitions typed against the data shape.
* MIT license for every feature the widget uses.
* Headless rendering, so the grid shell owns the markup and the design system styles the grid.
* Small bundle size, because FrontX loads the library once per MFE instance and does not share it between instances (FrontX ADR-0011).
* Reliable AI code generation for the library's API.
* Rendering performance with 500 to 5,000 supplied rows, shown without paging, so only the visible rows may be rendered.

## Considered Options

* TanStack Table (headless)
* AG Grid Community Edition
* MUI DataGrid (free tier)
* Mantine DataTable
* Glide Data Grid (canvas-based)
* No library: semantic HTML table rendered by the widget

## Decision Outcome

Chosen option: "TanStack Table (headless)", because it combines full rendering control, strict TypeScript generics on column definitions, an MIT license, and a bundle small enough to be paid once per MFE instance, while sparing the widget a hand-built column and row model, and it pairs with a virtualizer from the same project for large row sets.

The `grid` widget kind uses TanStack Table only as a typed column and row model for rendering. Its sorting, grouping, pagination, filtering and column-sizing features are not used: rows, their order and the column set come from the backend-supplied configuration and data as given. The widget renders the table itself, and each cell shows its value as text. Large grids use virtualized row rendering: the grid shell renders only the rows in view, together with the supplied group heading rows, so 500 to 5,000 rows are shown without paging. The widget keeps the library behind its own typed props, so widget configuration does not depend on library types.

### Consequences

* Good, because column definitions are typed against the row shape under `strict: true`, so a wrong data key fails at compile time.
* Good, because every feature the widget uses is MIT-licensed, with no commercial tier.
* Good, because the headless design keeps the design system in charge of appearance, with no style conflicts.
* Good, because virtualized rows keep a 5,000-row grid responsive without paging, and the rows stay DOM elements.
* Good, because the library is small (about 15 KB gzipped). FrontX isolates each MFE instance and shares no singletons (FrontX ADR-0011), so every grid widget instance loads its own copy. A small library keeps that repeated cost low. Source-text reuse by content hash (FrontX ADR-0034) may reduce parsing further. This does not remove the per-instance cost.
* Bad, because headless means the header and row markup must be built once. Mitigation: it lives in one grid shell component that all grid configurations share.
* Bad, because accessibility (ARIA table semantics, including row counts and positions for virtualized rows) must be implemented in that shell by hand.
* Bad, because virtualization adds a second small library and means off-screen rows are not in the DOM. Mitigation: it is the TanStack virtualizer, used only inside the grid shell.
* Bad, because the library's sorting, grouping and pagination APIs are present but must stay unused. Mitigation: the grid shell exposes no props for them, and code review rejects their use.
* Bad, because AI tools sometimes produce the old React Table v7 API. Mitigation: AI guidance for the template names version 8.

### Confirmation

Confirmed by code review and by checks on the `grid` widget:

* The widget builds its table with TanStack Table and no other grid library appears in the dependency list of the widget package.
* Cells show their value as text, and no column configuration selects a cell renderer.
* A grid with 5,000 supplied rows renders only the rows in view plus the group heading rows, scrolls through all rows without paging, and keeps the supplied order and groups.
* The grid renders the `widget_data` rows in the supplied order and makes no request after its data has arrived, and the shell uses no sorting, grouping, pagination, filtering or column-resizing feature of the library and offers no control for them.
* The measured gzipped size of the `grid` widget, library included and counted once per instance, is recorded. Until open question Q1 sets the budget in `cpt-frontx-dashboard-nfr-bundle-budget`, the check confirms that the grid library stays in the low tens of KB gzipped. Once Q1 is resolved, the recorded size is checked against that budget. Source-text reuse by content hash (FrontX ADR-0034) is a mitigation for repeated fetches and is not counted as a reduction of the per-instance size.
* The grid shell exposes ARIA table semantics, including row counts and positions for virtualized rows, checked by an automated accessibility check and a keyboard test (traces `cpt-frontx-dashboard-nfr-accessibility`).

## Pros and Cons of the Options

### TanStack Table (headless)

The headless table library with full rendering control.

* Good, because column definition generics are strong under strict TypeScript.
* Good, because all features are MIT-licensed.
* Good, because its small size suits a library that each isolated instance loads separately.
* Good, because rendering is fully ours.
* Good, because virtualized rows through `@tanstack/react-virtual` cover 500 to 5,000 supplied rows without paging.
* Bad, because all grid markup must be built.
* Bad, because its interaction features (sorting, grouping, pagination) are unused weight in the render-only scope.
* Bad, because there is no built-in accessibility.

### AG Grid Community Edition

A complete grid with built-in UI.

* Good, because rendering and accessibility come built in.
* Good, because performance is high on very large sets.
* Bad, because most of its built-in UI is interaction (sorting, filtering, pagination) that the render-only grid does not use.
* Bad, because the bundle is about 300 KB gzipped, which would be paid again by every isolated instance.
* Bad, because its own CSS conflicts with the design system.

### MUI DataGrid (free tier)

The Material UI data grid.

* Good, because UI and accessibility come built in.
* Bad, because its built-in UI is largely interaction the render-only grid does not use, and it is large to load per instance.
* Bad, because it pulls in the MUI ecosystem, which conflicts with the design system.

### Mantine DataTable

The Mantine data table component.

* Good, because it is MIT-licensed with a simple API.
* Bad, because it has no virtualization and needs the Mantine ecosystem, which conflicts with the design system.

### Glide Data Grid (canvas-based)

A canvas-rendered grid for very large datasets.

* Good, because canvas rendering is fast on very large sets.
* Bad, because cells are canvas draw calls, outside the design system's components and styling.
* Bad, because canvas output has no DOM for screen readers.

### No library: semantic HTML table rendered by the widget

The widget renders a plain `<table>` from its configuration and data.

* Good, because it adds no library cost to any instance and fits the render-only scope directly.
* Good, because rendering and styling are fully ours.
* Bad, because the typed column model (column definitions checked against the row shape) and the row model must be built and maintained by hand.
* Bad, because large supplied row sets would need a hand-built virtualization.

## More Information

* **Revision.** Revised on 2026-10-23 for the render-only scope ([ADR-0011](0011-backend-delivered-dashboard-v1.md)): the grid no longer sorts, groups, paginates or resizes in the browser, the options were re-checked against that, and the no-library option was added. Revised again on 2026-10-23: cell renderers were removed (cells show their value as text), and virtualized row rendering for large grids was decided. The revised decision is accepted.
* This ADR covers the grid library only. Chart rendering is a separate decision.
* Evolution path: the grid shell hides TanStack Table behind typed props. If the library changes or is replaced, only the shell changes, and grid widget configurations stay the same.
* Review trigger: the measured benefit of the typed column model no longer outweighs the library cost in the render-only scope (the no-library option becomes preferable); data sets regularly exceed 10,000 rows; a TanStack Table major version forces a large shell rewrite; the measured per-instance size exceeds the budget set by Q1.
* Row order and row groups are supplied by the backend in the grid's `widget_data`; the grid renders one heading row per group and never reorders, collapses or regroups rows.
* Scope: changes the `grid` widget kind and its grid shell. Does not change other widget kinds, the dashboard definition, or widget configuration types.
* Checklist applicability:
  * ARCH: applicable, addressed by the decision and options.
  * PERF: applicable, per-instance bundle cost and virtualized rendering of 500 to 5,000 supplied rows.
  * SEC: N/A, because the grid library renders `widget_data` already in browser memory, with no auth or storage of its own.
  * REL: N/A, because the grid library has no external dependency; data request failures are shown per widget ([ADR-0011](0011-backend-delivered-dashboard-v1.md)).
  * DATA: N/A, because the grid reads `widget_data` and persists nothing.
  * INT: applicable, the grid consumes its `widget_data` through its own typed props; the library adds no external API.
  * OPS: N/A, because the template is a source overlay with no deployed service; the consuming application owns operations.
  * MAINT: applicable, the shell hides the library, and AI guidance names version 8.
  * TEST: applicable, see Confirmation.
  * COMPL: applicable, every used feature must be MIT-licensed.
  * UX: applicable, accessibility is built in the shell; the grid offers no controls that change the presentation.
  * BIZ: N/A, because this is a technical decision.

## Traceability

- **PRD**: [PRD.md](../PRD.md)
- **DESIGN**: [DESIGN.md](../DESIGN.md)

This decision directly addresses the following requirements or design elements:

* `cpt-frontx-dashboard-fr-grid-presentation` — the grid shell built on TanStack Table renders the supplied rows, columns and row groups as given, with virtualized rows for large grids.
* `cpt-frontx-dashboard-fr-widget-catalog` — the `grid` widget kind is one of the catalog kinds this decision implements.
* `cpt-frontx-dashboard-nfr-bundle-budget` — the per-instance library cost counts against the bundle budget.
* `cpt-frontx-dashboard-nfr-accessibility` — accessibility of the grid is delivered by the grid shell.
