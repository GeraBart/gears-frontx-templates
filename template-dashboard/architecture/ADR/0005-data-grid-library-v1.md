---
status: accepted
date: 2026-10-30
decision-makers: template-dashboard architecture maintainers
description: "Decision record for the library behind the grid widget type: TanStack Table as a typed column and row model with virtualized rows, showing one page of up to 500 rows that the data adapter delivers; sorting and paging are query changes, and the grid keeps frozen columns, column groups, alignment, row colour and local column resizing keyed by query member."
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

The `grid` widget type shows tabular data. Its data is the grid's data shape, which the data adapter fills with the `positional_table` fill mode: `rows`, each a positional array of values in the canonical member order of its query, and `total`, the row count across all pages ([ADR-0009](0009-subject-agnostic-widget-catalog-v1.md), [ADR-0012](0012-query-vocabulary-and-datasets-v1.md)). The grid's configuration lists its displayed columns, and each column names one query member in `columns[].member`, and `columns` lists every query member exactly once. A column's value is the entry of each row at the position of its member in the canonical member order.

The grid always shows one page. The browser holds only that page, never the whole result. Sorting and paging are query changes: a click on a sortable column header, a page control or a new page size changes the widget's local copy of its query (`order`, `limit` and `offset`), which is never saved, and the widget sends `request_data`. While it waits for the answer, the grid keeps its current rows under the busy state that [ADR-0011](0011-data-adapter-v1.md) decides, and it applies only the answer whose timestamp equals its latest request (decided there as well). A widget is a passive renderer: it makes no call to a backend and only renders what `set_data` delivers.

The grid has presentation features that refer to query members, not to result columns: frozen leading columns, grouped column headings, column alignment and row colouring. The viewer may also resize columns. Resizing redraws locally, sends no request, and is never saved. In FrontX each MFE instance is isolated, so every grid widget instance evaluates its own copy of whatever library the grid uses.

Which library, if any, renders the `grid` widget type?

Constraints that apply to every option:

* The grid shows one page of up to 500 rows. This ADR decides the `page_sizes` rule: `page_sizes` is required, its largest value is at most 500, and the query's `limit` is at most the largest `page_sizes` value. The large-table requirement applies per page: a page of up to 500 rows renders and scrolls smoothly (`cpt-frontx-dashboard-nfr-large-table`).
* The browser does not sort, group, filter or page rows itself. Order and page come from the data adapter through the query. Column resizing is the only interaction that stays in the browser.
* Every feature used must be available under a permissive (MIT-compatible) license.
* Cells show their value as text, formatted by the column's number format; there are no cell renderers. Cell content stays DOM, so it remains reachable for screen readers.
* The design system, `@gears-frontx/ui-kit`, owns visual appearance. The library must not impose its own CSS.

## Decision Drivers

* Strict TypeScript support with generic column definitions typed against the grid shell's row model.
* MIT license for every feature the widget uses.
* Headless rendering, so the grid shell owns the markup and ui-kit tokens style the grid, including frozen columns, grouped headings and row colours.
* Small library size, because every grid widget instance evaluates its own copy of the library (FrontX ADR-0011).
* Reliable AI code generation for the library's API.
* Rendering performance with a page of up to 500 rows, so only the visible rows of a page may be rendered.
* Column resizing that redraws locally, without a request.
* Sorting and paging that the library does not perform itself, so that the query alone decides which rows are shown.

## Considered Options

* TanStack Table (headless)
* AG Grid Community Edition
* MUI DataGrid (free tier)
* Mantine DataTable
* Glide Data Grid (canvas-based)
* No library: semantic HTML table rendered by the widget

## Decision Outcome

Chosen option: "TanStack Table (headless)", because it combines full rendering control, strict TypeScript generics on column definitions, an MIT license, a column sizing feature for local resizing, and a library small enough to be evaluated once per MFE instance. It spares the widget a hand-built column and row model, and it pairs with a virtualizer from the same project for a page of up to 500 rows.

**Data and columns.** The `grid` widget type uses TanStack Table v8 as a typed column and row model for rendering. The grid shell builds one column definition per entry of `columns`. Each definition reads its value from the row array at the position of its member in the canonical member order of the widget's query, so the positional rows need no conversion. The shell keeps the rows in the delivered order. The library's own sorting, grouping, filtering and pagination features are not used, because order and page come from the data adapter. Its column sizing feature is used for resizing only.

**Sorting and paging are query changes.** A click on the header of a column whose `sortable` is true sets `order` in the widget's local copy of its query to that member and a direction, and resets `offset` to 0. A page control sets `offset`. A new page size from `page_sizes` sets `limit` and resets `offset` to 0. Each change sends `request_data` with a new timestamp. While the request is open, the grid keeps its current rows under the busy state of [ADR-0011](0011-data-adapter-v1.md). The pager shows the position in the result from `offset`, the number of rows on the page and `total`. A page size is always offered, by the `page_sizes` rule above. The larger view of a grid is its own grid widget with its own query, and it sorts and pages the same way.

**Grid checks.** This ADR decides the grid feature fields (`frozen_columns`, `column_groups`, `columns[].align`, `row_color`) and the paging behaviour. JSON Schema cannot express the following checks, so the owner of the widget's domain (the dashboards root for a cell widget, the larger-view modal for a larger-view widget) runs them at load. A failure gives the cell's, or the larger view's, cannot-show state ([ADR-0011](0011-data-adapter-v1.md)):

* every `order[].member` is a query member;
* `columns[].member` covers each query member exactly once;
* `column_groups[].members` and `row_color` name grid columns, the members of one column group are contiguous columns, no column is named by two groups, and no member repeats within one group;
* `sortable` is true only for members that the dataset allows in `order`;
* `limit` is at most the largest value of `page_sizes`, and `data.limit` is one of the `page_sizes` values.

**Presentation features keyed by query member.**

* `frozen_columns` is the number of leading columns that stay visible during horizontal scrolling.
* `column_groups` is a list of `{title, members}`. The shell shows each title above its contiguous columns, which are named by member. Grouping only labels the header and never reorders or collapses rows.
* `columns[].align` sets the alignment of a column.
* `row_color` names a query member that is also a column. The value of that member in a row names a row colour token of ui-kit, and the shell colours the row with it in the light or dark kit scope. A coloured row also shows an icon with an accessible name, so meaning is never conveyed by colour alone (`cpt-frontx-dashboard-nfr-accessibility`).
* The viewer may resize columns. The new width redraws the grid locally, sends no request, and is never saved. `columns[].width` is the initial width.

**Virtualized rows per page.** The grid shell uses the TanStack virtualizer: it renders only the rows in view, so a page of up to 500 rows renders and scrolls smoothly. The widget renders the table itself, and each cell shows its value as text. The widget keeps the library behind its own typed props, so the grid configuration does not depend on library types.

### Consequences

* Good, because column definitions are typed against the grid shell's row model under `strict: true`, and the accessor over positional rows is written once in the shell.
* Good, because every feature the widget uses is MIT-licensed, with no commercial tier.
* Good, because the headless design keeps ui-kit in charge of appearance, with no style conflicts, and row colours follow the light or dark kit scope.
* Good, because virtualized rows keep a page of 500 rows responsive, and the rows stay DOM elements.
* Good, because the browser never holds more than one page, and the query alone decides order and page, so a result of any size shows with the same grid.
* Good, because the library is small (about 15 KB gzipped). FrontX isolates each MFE instance (FrontX ADR-0011), so every grid widget instance evaluates its own copy, and a small library keeps that repeated cost low.
* Bad, because headless means the header and row markup, including frozen columns, grouped headings, alignment and the pager, must be built once. Mitigation: it lives in one grid shell component that all grid configurations share.
* Bad, because accessibility (ARIA grid semantics, including row counts and positions for virtualized rows, and sort state on headers) must be implemented in that shell by hand.
* Bad, because virtualization adds a second small library, and off-screen rows are not in the DOM. Mitigation: it is the TanStack virtualizer, used only inside the grid shell.
* Bad, because the library's sorting, grouping, filtering and pagination APIs are present but must stay unused. Mitigation: the grid shell exposes no props for them, and code review rejects their use.
* Bad, because each sort or page change waits for a data adapter answer, so a slow data adapter shows as a longer busy indicator. Mitigation: the grid keeps its current rows visible while it waits.
* Bad, because AI tools sometimes produce the old React Table v7 API. Mitigation: AI guidance for the template names version 8.

### Confirmation

Confirmed by code review and by checks on the `grid` widget:

* The widget builds its table with TanStack Table, and no other grid library appears in the dependency list of the widget package.
* Cells show their value as text, and no column configuration selects a cell renderer.
* Each column definition reads the value of its member by position in the canonical member order, and rows keep the delivered order.
* A page of 500 rows renders only the rows in view and scrolls smoothly in the light and the dark kit scope. A grid whose `page_sizes` is missing, or whose largest value exceeds 500, or whose `data.limit` exceeds the largest value or is not one of the `page_sizes` values, or in which a column is named by two groups or a member repeats within one group, is rejected as invalid by the `page_sizes` rule and the grid checks above, and a test for each grid check confirms that a failing widget gets the cannot-show state.
* A click on a sortable header sends one `request_data` with the new `order` and `offset` 0. A page control sends one with the new `offset`. A new page size sends one with the new `limit` and `offset` 0. During each request the current rows stay visible under a busy indicator, and an answer whose timestamp is not the latest is dropped.
* Resizing a column redraws the grid and sends no request. Presentation fields in the widget instance stay as authored.
* A row with a colour shows an icon with an accessible name, and no row meaning rests on colour alone.
* Frozen columns, grouped column headings, alignment and row colours render as configured, with members named in `columns`, `column_groups` and `row_color`.
* The shell uses no sorting, grouping, pagination or filtering feature of the library and offers no control for them.
* The transferred gzipped size of each `grid` widget entry is measured on a cold load of the reference dashboard under the counting rule of DESIGN section 3.9: its own code counts against the provisional per-widget figure, and TanStack Table and the virtualizer are built as shared dependencies, by listing them in the `shared` array of the manifest. Their source text is fetched once, with realm-wide reach, only when every template MFE publishes the same `contentHash` for it (FrontX ADR-0034 and ADR-0035), and only then do they count once in the page total. Each MFE instance evaluates its own copy, so the evaluation cost of each instance counts against the initial-render budget; source-text reuse is not a reduction of it (FrontX ADR-0011).
* The grid shell exposes ARIA grid semantics, including row counts and positions for virtualized rows and the sort state of headers, checked by an automated accessibility check and a keyboard test (traces `cpt-frontx-dashboard-nfr-accessibility`).

## Pros and Cons of the Options

### TanStack Table (headless)

The headless table library with full rendering control.

* Good, because column definition generics are strong under strict TypeScript.
* Good, because all features are MIT-licensed.
* Good, because its small size suits a library that each isolated instance evaluates separately.
* Good, because rendering is fully ours, including frozen columns, grouped headings and row colours.
* Good, because virtualized rows through `@tanstack/react-virtual` cover a page of up to 500 rows.
* Good, because its column sizing feature covers local resizing.
* Bad, because all grid markup must be built, including the pager and the busy indicator.
* Bad, because its sorting, grouping, filtering and pagination features are unused weight, since order and page come from queries.
* Bad, because there is no built-in accessibility.

### AG Grid Community Edition

A complete grid with built-in UI.

* Good, because rendering and accessibility come built in.
* Good, because performance is high on very large sets.
* Bad, because most of its built-in UI is client-side sorting, filtering and pagination, while this grid gets order and page from queries.
* Bad, because the library is about 300 KB gzipped, which every isolated instance would evaluate again.
* Bad, because its own CSS conflicts with ui-kit.

### MUI DataGrid (free tier)

The Material UI data grid.

* Good, because UI and accessibility come built in.
* Bad, because its built-in sorting and pagination work on rows the browser holds, which does not fit pages delivered by queries, and it is large to evaluate per instance.
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

The widget renders a plain `<table>` from its configuration and its page of rows.

* Good, because it adds no library cost to any instance.
* Good, because rendering and styling are fully ours.
* Bad, because the typed column model and the row model must be built and maintained by hand.
* Bad, because virtualization of a page of up to 500 rows, and column resizing, would be built by hand.

## More Information

* This ADR covers the grid library, how the grid pages and sorts, and the grid features keyed by query member. Chart rendering is a separate decision ([ADR-0004](0004-charting-library-v1.md)). The grid's query limits, its data shape and its fields `columns` and `page_sizes` are decided in [ADR-0009](0009-subject-agnostic-widget-catalog-v1.md), and this ADR decides the grid feature fields and the paging behaviour; the canonical member order is decided in [ADR-0012](0012-query-vocabulary-and-datasets-v1.md); the request and answer steps and the loader, busy and empty states are decided in [ADR-0011](0011-data-adapter-v1.md).
* Evolution path: the grid shell hides TanStack Table behind typed props. If the library changes, only the shell changes, and grid widget configurations stay the same.
* Review trigger: the measured benefit of the typed column model does not outweigh the library cost (the no-library option becomes preferable); the page size limit of 500 rows is raised above what virtualized rendering handles smoothly; a TanStack Table major version forces a large shell rewrite; the measured size or evaluation cost exceeds the figures of DESIGN section 3.9, which are provisional and confirmed by measurement.
* Row order is the delivered order of the page's rows, and the grid never reorders, collapses or groups them. Grouped column headings only label contiguous columns in the header.
* Scope: the `grid` widget type and its grid shell. Does not change other widget types or the data adapter.
* Checklist applicability:
  * ARCH: applicable, addressed by the decision and options.
  * PERF: applicable, per-instance evaluation cost, the bundle counting rule of DESIGN section 3.9, and virtualized rendering of a page of up to 500 rows. Per-instance memory is held per extension id for the life of the page (FrontX ADR-0011), and the deterministic extension ids of [ADR-0007](0007-extension-domain-taxonomy-v1.md) keep it bounded.
  * SEC: N/A, because the grid library renders a page already in browser memory, with no auth or storage of its own.
  * REL: N/A, because the grid library has no external dependency; a data request that gets no answer keeps the busy indicator, as [ADR-0011](0011-data-adapter-v1.md) defines.
  * DATA: N/A, because the grid reads its page and persists nothing; the local copy of the query and resized widths are never saved.
  * INT: applicable, the grid consumes `positional_table` through its own typed props and maps columns to query members; the library adds no external API.
  * OPS: N/A, because the template has no deployed service; the consuming product owns operations.
  * MAINT: applicable, the shell hides the library, and AI guidance names version 8.
  * TEST: applicable, see Confirmation.
  * COMPL: applicable, every used feature must be MIT-licensed.
  * UX: applicable, accessibility is built in the shell; the viewer sorts, pages and resizes, and sees a busy indicator while a page loads.
  * BIZ: N/A, because this is a technical decision.

## Traceability

- **PRD**: [PRD.md](../PRD.md)
- **DESIGN**: [DESIGN.md](../DESIGN.md)

This decision directly addresses the following requirements or design elements:

* `cpt-frontx-dashboard-fr-widget-catalog` — the `grid` widget type is one of the 9 widget types; its grid shell on TanStack Table renders one page with sorting, paging, frozen columns, grouped column headings, alignment, row colours and local resizing.
* `cpt-frontx-dashboard-nfr-large-table` — virtualized row rendering keeps a page of up to 500 rows responsive while scrolling.
* `cpt-frontx-dashboard-nfr-bundle-budget` — the grid entry's own code and the shared dependencies are counted by the rule of DESIGN section 3.9.
* `cpt-frontx-dashboard-nfr-visual-quality` — row colours and all grid styling use ui-kit tokens in the light or dark scope.
* `cpt-frontx-dashboard-nfr-accessibility` — accessibility of the grid is delivered by the grid shell.
* `cpt-frontx-dashboard-component-widget-library` — the grid shell inside the `grid` widget type's entry.
