---
status: accepted
version: 1
date: 2026-10-30
description: Domain-model types of the widget base, the abstract data widget with its traits, and the 9 subject-agnostic widget types with their query limits and presentation fields, plus the cross-checks of a widget, the grid rules, the markdown card rendering rule, and the shared widget chrome with its states, wordings, larger-view button, and theme rules.
---

# Feature: Widget Catalog

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-featstatus-widget-catalog`

<!-- toc -->

- [1. Feature Context](#1-feature-context)
  - [1.1 Overview](#11-overview)
  - [1.2 Purpose](#12-purpose)
  - [1.3 Actors](#13-actors)
  - [1.4 References](#14-references)
- [2. Actor Flows (CDSL)](#2-actor-flows-cdsl)
  - [Show a Data Widget](#show-a-data-widget)
  - [Change the Query of a Data Widget](#change-the-query-of-a-data-widget)
  - [Open the Larger View](#open-the-larger-view)
  - [Follow a Host Theme Change](#follow-a-host-theme-change)
- [3. Processes / Business Logic (CDSL)](#3-processes--business-logic-cdsl)
  - [Cross-Check a Widget](#cross-check-a-widget)
  - [Map the Host Theme Id to a Scope](#map-the-host-theme-id-to-a-scope)
- [4. States (CDSL)](#4-states-cdsl)
  - [Data Widget Display State](#data-widget-display-state)
- [5. Definitions of Done](#5-definitions-of-done)
  - [Domain Model Definition of Done](#domain-model-definition-of-done)
  - [Query Limits and Multi-Measure Rules](#query-limits-and-multi-measure-rules)
  - [Cross-Checks](#cross-checks)
  - [Grid Presentation](#grid-presentation)
  - [Markdown Card Rendering Safety](#markdown-card-rendering-safety)
  - [Shared Widget Chrome and States](#shared-widget-chrome-and-states)
  - [Larger-View Button](#larger-view-button)
  - [Theme](#theme)
  - [Accessibility of the Chrome and the Grid](#accessibility-of-the-chrome-and-the-grid)
- [6. Domain Model](#6-domain-model)
  - [6.0 Widget (abstract base)](#60-widget-abstract-base)
  - [6.1 Data Widget (abstract)](#61-data-widget-abstract)
  - [6.2 Widget Types and Query Limits](#62-widget-types-and-query-limits)
  - [6.3 SummaryCard](#63-summarycard)
  - [6.4 MetricCard](#64-metriccard)
  - [6.5 RankedListCard](#65-rankedlistcard)
  - [6.6 ProgressListCard](#66-progresslistcard)
  - [6.7 Grid](#67-grid)
  - [6.8 CartesianChart](#68-cartesianchart)
  - [6.9 PieChart](#69-piechart)
  - [6.10 Heatmap](#610-heatmap)
  - [6.11 MarkdownCard](#611-markdowncard)
  - [6.12 Shared Widget Chrome and States](#612-shared-widget-chrome-and-states)
- [7. Acceptance Criteria](#7-acceptance-criteria)

<!-- /toc -->

## 1. Feature Context

- [ ] `p2` - `cpt-frontx-dashboard-feature-widget-catalog`

### 1.1 Overview

This feature declares the widget base `gts.frontx.dashboard_m.widget.widget.v1~`, the abstract data widget type `gts.frontx.dashboard_m.widget.widget.v1~frontx.dashboard_m.widget.data_widget.v1~` with its traits, and the 9 widget types, all under the FrontX vendor `frontx` in the package `dashboard_m`. Eight widget types derive from the data widget: `summary_card`, `metric_card`, `ranked_list_card`, `progress_list_card`, `grid`, `cartesian_chart`, `pie_chart`, and `heatmap`. `markdown_card` derives from the widget base and has no data. Each data widget type limits the form of its query, names its data shape and fill mode in its traits, and adds its presentation fields.

The feature also fixes the rules that every widget type shares: the cross-checks that JSON Schema cannot express, the grid rules, the markdown rendering rule, and the shared chrome with the loader, busy, empty, and cannot-show wordings, the larger-view button, the theme rules, and accessibility. The conceptual description is in DESIGN section 3.1. The types and rules are in section 6. Section 3 holds the two processes of this feature: the cross-check of a widget and the mapping of the host theme id to a ui-kit scope.

### 1.2 Purpose

A dashboard embeds one widget instance in each layout cell and, when a cell has a larger view, one more in that cell. Every widget instance validates against the types of this catalog. A widget type says how a placement is shown. It does not say what the subject is: the subject comes from the query's measures and dimensions. A widget instance is identified only by its GTS `id`, a combined id of its type chain and a UUID. It has no name of its own.

A data widget is a passive renderer. It carries one query in its `data` field. It receives its data in the shape that its type names, and it makes no call to a backend. The data adapter that the consuming product supplies runs the query and fills the shape by the fill mode that the type names. A consuming product adds no widget types and no widget settings. It can change how a template widget type is shown only through a replacement realization (`cpt-frontx-dashboard-feature-mfe-entries`).

The feature covers the widget catalog, the grid, the larger view button, the loading, busy, empty, and cannot-show states, the theme, and the accessibility and visual quality of the widgets.

**Checklist coverage.** PERF is covered: the large-table and initial-render targets are met by virtualized rows and by showing the loader or the body at once. SEC is covered for the one place where the widgets handle text from outside: delivered text in every widget is rendered as text, and the markdown card interprets only markdown (sections 6.11 and 6.12). Not applicable: REL, because a widget has no retry or recovery of its own and a failure is a static cannot-show state; DATA, because a widget stores nothing and holds only the page that it shows; INT, because the contracts that reach other parts are owned by `cpt-frontx-dashboard-feature-extension-domain-catalog` and `cpt-frontx-dashboard-feature-data-adapter-contract`; OPS, because the types define no operation procedure; MAINT, because the code layout of the widgets belongs to `cpt-frontx-dashboard-feature-mfe-entries`; COMPL, because the widgets process no regulated data; BIZ, because the types state presentation rules, not business rules.

**Requirements**: `cpt-frontx-dashboard-fr-widget-catalog`, `cpt-frontx-dashboard-fr-domain-model`, `cpt-frontx-dashboard-fr-grid-sort-page`, `cpt-frontx-dashboard-fr-widget-modal`, `cpt-frontx-dashboard-fr-backend-source`, `cpt-frontx-dashboard-fr-loading-error-states`, `cpt-frontx-dashboard-fr-theme`, `cpt-frontx-dashboard-nfr-visual-quality`, `cpt-frontx-dashboard-nfr-initial-render`, `cpt-frontx-dashboard-nfr-large-table`, `cpt-frontx-dashboard-nfr-accessibility`

**Use cases**: `cpt-frontx-dashboard-usecase-view-dashboard` (the widget side of the sequences listed below), `cpt-frontx-dashboard-usecase-provide-dashboard` (the widget types that a consuming product describes each widget with)

**Principles**: `cpt-frontx-dashboard-principle-render-only-dashboards-root`, `cpt-frontx-dashboard-principle-gts-contracts`, `cpt-frontx-dashboard-principle-per-instance-isolation`

**Constraints**: `cpt-frontx-dashboard-constraint-gts-id-convention`

**Design components**: `cpt-frontx-dashboard-component-widget-library` (presentation side; the package, the entries, and the code belong to `cpt-frontx-dashboard-feature-mfe-entries`)

**Interfaces**: `cpt-frontx-dashboard-interface-domain-model` (widget part)

**Sequences (widget side)**: `cpt-frontx-dashboard-seq-initial-load`, `cpt-frontx-dashboard-seq-query-change`, `cpt-frontx-dashboard-seq-widget-modal-open`, `cpt-frontx-dashboard-seq-cannot-show`, `cpt-frontx-dashboard-seq-theme-switch`. The owner of all five is `cpt-frontx-dashboard-feature-extension-domain-catalog`.

### 1.3 Actors

| Actor | Role in Feature |
|-------|-----------------|
| `cpt-frontx-dashboard-actor-template-consumer` | Writes or generates widget instances against these types |
| `cpt-frontx-dashboard-actor-dashboard-viewer` | Sees each widget in its cell, sorts and pages a grid, resizes grid columns, and opens a larger view |
| `cpt-frontx-dashboard-actor-host-application` | Provides the host theme id that every widget maps to a ui-kit scope |

### 1.4 References

- **PRD**: [PRD.md](../../PRD.md)
- **Design**: [DESIGN.md](../../DESIGN.md) section 3.1 (Widgets, Queries, and Data Shapes), section 3.2 (Widget Library), and section 3.6 (Interactions and Sequences)
- **ADRs**: [ADR-0003](../../ADR/0003-shared-data-types-and-schemas-v1.md), [ADR-0004](../../ADR/0004-charting-library-v1.md), [ADR-0005](../../ADR/0005-data-grid-library-v1.md), [ADR-0006](../../ADR/0006-theme-distribution-v1.md), [ADR-0007](../../ADR/0007-extension-domain-taxonomy-v1.md), [ADR-0009](../../ADR/0009-subject-agnostic-widget-catalog-v1.md), [ADR-0011](../../ADR/0011-data-adapter-v1.md), [ADR-0012](../../ADR/0012-query-vocabulary-and-datasets-v1.md)
- **Declaring package**: `dashboard` (the model types of package `dashboard_m`)
- **Dependencies**: `cpt-frontx-dashboard-feature-widget-data-catalog` (each data widget type sets its `data_shape` trait to one of the data shapes and its `fill` trait to one of the fill modes) and `cpt-frontx-dashboard-feature-query-vocabulary` (the `data` field is typed by the query base)
- **Related**:
  - [feature-layout-types](../feature-layout-types/FEATURE.md): each layout cell checks its embedded widgets against the widget base.
  - [feature-mfe-entries](../feature-mfe-entries/FEATURE.md): the widget entries and the widget realizations that show these widget types.
  - [feature-extension-domain-catalog](../feature-extension-domain-catalog/FEATURE.md): the actions `set_widget_context`, `request_data`, `set_data`, and `show_larger_view`, the domain owners that run the cross-checks of section 3, and the host identifiers that the larger-view chain uses.
  - [feature-data-adapter-contract](../feature-data-adapter-contract/FEATURE.md): the data adapter that answers each `request_data` with an instance of the data shape.

## 2. Actor Flows (CDSL)

These flows describe the widget side. The owner of each sequence is `cpt-frontx-dashboard-feature-extension-domain-catalog`; the owner of the domain (the dashboards root or the larger-view modal) does the other side.

**Use cases**: `cpt-frontx-dashboard-usecase-view-dashboard`

### Show a Data Widget

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-flow-widget-catalog-show-data-widget`

**Actor**: `cpt-frontx-dashboard-actor-dashboard-viewer`

**Success Scenarios**:
- The widget shows its loader at once, then its data, or its empty state when the data has no rows.
- A `markdown_card` shows its body right after the context arrives.

**Error Scenarios**:
- The widget fails validation or a cross-check. The domain owner shows the cannot-show placeholder in its cell or larger view, and the widget is never mounted (section 3).
- The answer never arrives, or FrontX rejects it. The widget keeps its loader and shows no error message.

**Steps**:
1. [ ] - `p1` - The widget entry registers its `set_data` handler and mounts - `inst-register-set-data`
2. [ ] - `p1` - The widget receives `set_widget_context` with the widget instance, the member metadata, and, for a data widget, the data shape id and the fill mode - `inst-receive-context`
3. [ ] - `p1` - **IF** the widget type is `markdown_card` - `inst-if-markdown`
   1. [ ] - `p1` - Show the markdown body inside the chrome and **RETURN**. A `markdown_card` sends no `request_data` and shows no loader, busy indicator, or empty state - `inst-show-markdown`
4. [ ] - `p1` - Show the loader in place of the content, with the title and, in a cell that has a larger view, the larger-view button - `inst-show-loader`
5. [ ] - `p1` - Send one `request_data { data, data_shape, fill, reply_to, timestamp }` to the extension domain the widget sits in. `data` is the widget's query as delivered, `data_shape` and `fill` are copied from the context, `reply_to` is the widget's own extension id, and `timestamp` is strictly increasing per widget: it combines the clock with a per-widget counter, so two requests of one widget never share a value - `inst-send-first-request`
6. [ ] - `p1` - Receive `set_data { data, timestamp }` - `inst-receive-set-data`
7. [ ] - `p1` - **IF** the timestamp differs from the timestamp of the widget's latest request, drop the answer and **RETURN** - `inst-drop-stale-answer`
8. [ ] - `p1` - **IF** the data has no rows (for `metric_card`: the `value` is null), show the empty state in place of the content - `inst-show-empty`
9. [ ] - `p1` - **ELSE** show the content of the widget type, formatted by the member metadata and the host language. A null measure value shows as a gap or an empty value, as section 6 states for the type - `inst-show-content`

### Change the Query of a Data Widget

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-flow-widget-catalog-change-query`

**Actor**: `cpt-frontx-dashboard-actor-dashboard-viewer`

**Success Scenarios**:
- A click on a sortable grid header, a page control, or a new page size shows the new rows, with the current rows kept visible under a busy indicator while the answer is open.
- Resizing a grid column redraws the grid and sends no request.

**Error Scenarios**:
- An answer to an older request arrives after a newer request. The widget drops it.

**Steps**:
1. [ ] - `p1` - The viewer operates a grid control - `inst-operate-grid-control`
2. [ ] - `p1` - **IF** the control resizes a column, redraw the grid with the new width, keep the width local, and **RETURN**. Nothing is sent and nothing is saved - `inst-resize-local`
3. [ ] - `p1` - **IF** the control is a click on the header of a column whose `sortable` is true, set `order` in the widget's local copy of the query to one entry for that member, and set `offset` to 0. The direction comes from the current local `order`: when its first entry names that member, the new direction is the reverse of that entry's direction, and otherwise it is ascending. Only the member of the first entry of `order` shows a sort state - `inst-set-order`
4. [ ] - `p1` - **IF** the control is a page control, set `offset` in the local copy to the first row of the chosen page - `inst-set-offset`
5. [ ] - `p1` - **IF** the control is a page size from `page_sizes`, set `limit` in the local copy to it and set `offset` to 0 - `inst-set-limit`
6. [ ] - `p1` - Keep the current rows visible and show the busy indicator over them. The controls stay operable while the widget is busy - `inst-show-busy`
7. [ ] - `p1` - Send one `request_data` with the local copy of the query, the unchanged `data_shape` and `fill`, and a new timestamp. The local copy is never saved and the dashboard is not changed - `inst-send-new-request`
8. [ ] - `p1` - Apply the answer whose timestamp equals the timestamp of the latest request, hide the busy indicator, and show the new rows or the empty state. Drop every other answer. A control operated while a request is open sends a new request, and only the answer of the latest one ends the busy state - `inst-apply-latest-answer`

The rule applies to every data widget type: an interaction that changes the query sends `request_data`, and an interaction that changes only presentation fields redraws locally. In the template, only the grid has such interactions.

### Open the Larger View

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-flow-widget-catalog-open-larger-view`

**Actor**: `cpt-frontx-dashboard-actor-dashboard-viewer`

**Success Scenarios**:
- A cell widget whose context carries `larger_view` shows the larger-view button. Pressing it opens the larger view in the larger-view modal.

**Error Scenarios**:
- The shell offers no modal container for its `popup` domain. The larger view cannot open, and the rest of the dashboard works.

**Steps**:
1. [ ] - `p1` - **IF** the context carried no `larger_view` field, show no button and **RETURN**. A widget in the larger view never gets the field, so it shows no button - `inst-hide-button`
2. [ ] - `p1` - The viewer presses the larger-view button with the pointer or the keyboard - `inst-press-button`
3. [ ] - `p1` - The button runs the chain of `cpt-frontx-dashboard-algo-extension-domain-catalog-open-larger-view-chain`, with the dashboard id and the larger-view widget id from the `larger_view` field of the context - `inst-run-chain`

The chain, with its host identifiers and its `history: "none"`, is specified in `cpt-frontx-dashboard-feature-extension-domain-catalog`. The larger-view modal does the rest (`cpt-frontx-dashboard-seq-widget-modal-open`).

### Follow a Host Theme Change

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-flow-widget-catalog-follow-theme`

**Actor**: `cpt-frontx-dashboard-actor-host-application`

**Success Scenarios**:
- A mounted widget, in a cell and in the larger view, takes the other ui-kit scope without a request, without a loader, and without a remount.

**Steps**:
1. [ ] - `p2` - The widget receives the new value of the theme shared property - `inst-receive-theme`
2. [ ] - `p2` - Map the host theme id to the light or dark scope of `@gears-frontx/ui-kit` using `cpt-frontx-dashboard-algo-widget-catalog-map-theme-scope` - `inst-map-scope`
3. [ ] - `p2` - Apply the tokens of the chosen scope to the chrome and the content, including grid row colours - `inst-apply-tokens`
4. [ ] - `p2` - **IF** the widget is a chart, build the ECharts theme `frontx-dashboard` from the kit tokens of the chosen scope and register it again in the widget's own ECharts copy - `inst-register-chart-theme`
5. [ ] - `p2` - Send no `request_data`, show no loader, and keep all widget state - `inst-no-request`

## 3. Processes / Business Logic (CDSL)

### Cross-Check a Widget

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-algo-widget-catalog-cross-check-widget`

**Input**: One widget instance that has passed the GTS validation of its type; the member instances (`id`, `title`, `value_type`) that its query names; the effective traits of the widget type, read with `cpt-frontx-dashboard-algo-query-vocabulary-effective-traits`, of which this process uses `member_kinds`; and the members that the dataset of the query allows in `order`. A `member_kinds` trait that is absent, or that lacks its `measures` or its `dimensions` key, puts no restriction on that kind of member. The owner of the widget's domain runs this process once for each widget when it loads a dashboard: the dashboards root for a cell widget, the larger-view modal for a larger-view widget.

**Output**: Pass, or a failure that names the widget and the failing member or check.

**Steps**:
1. [ ] - `p1` - **IF** the widget has no `data` field (a `markdown_card`), **RETURN** pass - `inst-pass-without-data`
2. [ ] - `p1` - Build the list of query members in the canonical member order of `cpt-frontx-dashboard-algo-query-vocabulary-canonical-order` - `inst-build-member-list`
3. [ ] - `p1` - **FOR EACH** entry of `data.order` - `inst-for-each-order`
   1. [ ] - `p1` - **IF** `member` is not in the list of query members **RETURN** failure naming the widget and the member - `inst-fail-order-member`
4. [ ] - `p1` - **IF** the widget type sets the `member_kinds` trait - `inst-if-member-kinds`
   1. [ ] - `p1` - **IF** the `value_type` of a measure is not among the allowed measure kinds, or the `value_type` of a dimension in `data.dimensions` is not among the allowed dimension kinds, **RETURN** failure naming the widget and the member - `inst-fail-member-kind`
5. [ ] - `p1` - **IF** the widget type is `cartesian_chart` and `series` is set - `inst-if-series`
   1. [ ] - `p1` - **IF** a `series[].member` is not a measure of the query, or two entries name the same member, **RETURN** failure naming the widget and the member - `inst-fail-series`
6. [ ] - `p1` - **IF** the widget type is `heatmap` and `min_value` and `max_value` are both set and not null - `inst-if-heatmap-scale`
   1. [ ] - `p1` - **IF** `min_value` is greater than `max_value` **RETURN** failure naming the widget - `inst-fail-heatmap-scale`
7. [ ] - `p1` - **IF** the widget type is not `grid`, **RETURN** pass - `inst-pass-non-grid`
8. [ ] - `p1` - **IF** `columns[].member` names a query member twice, names a member that is not a query member, or leaves a query member out **RETURN** failure naming the widget and the member - `inst-fail-columns-cover`
9. [ ] - `p1` - **FOR EACH** group in `column_groups` - `inst-for-each-group`
   1. [ ] - `p1` - **IF** a name in `members` is not the member of a grid column **RETURN** failure naming the widget, the group, and the member - `inst-fail-group-member`
   2. [ ] - `p1` - **IF** the columns of the group are not contiguous in `columns` order **RETURN** failure naming the widget and the group - `inst-fail-not-contiguous`
   3. [ ] - `p1` - **IF** a member is repeated within the group **RETURN** failure naming the widget, the group, and the member - `inst-fail-repeated-in-group`
   4. [ ] - `p1` - **IF** a column of the group is also named by another group **RETURN** failure naming the widget, the column, and both groups. A column in two groups has no single place in the heading row of section 6.7 - `inst-fail-two-groups`
10. [ ] - `p1` - **IF** `row_color` is set and is not the member of a grid column **RETURN** failure naming the widget and the member - `inst-fail-row-color`
11. [ ] - `p1` - **IF** a column with `sortable` true names a member that the widget's dataset does not allow in `order` **RETURN** failure naming the widget and the member - `inst-fail-sortable`
12. [ ] - `p1` - **IF** `data.limit` is not one of the values of `page_sizes` **RETURN** failure naming the widget - `inst-fail-limit`
13. [ ] - `p1` - **RETURN** pass - `inst-return-pass`

A failure is a widget-level cannot-show trigger. A failure of the GTS validation of the dashboard whose instance path lies under the `widget` or the `larger_view` of a cell is attributed to that cell or that larger view in the same way, and every other validation failure is dashboard-level. The template adds no validation mode of its own. The owner shows the cannot-show placeholder in the widget's cell, or in the larger-view modal for a larger-view widget, and writes a diagnostic to the developer log. Each widget is checked on its own, so a failure belongs to that cell or that larger view only (`cpt-frontx-dashboard-seq-cannot-show`). The checks that JSON Schema does express (query limits, closed presentation fields, the `member` references, the presence of `page_sizes` and `data.limit`, and the maximum of 500 for `page_sizes`) are not repeated here: they belong to the validation of the widget against its type. That `data.limit` is one of the values of `page_sizes` is a cross-check (step 12).

### Map the Host Theme Id to a Scope

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-algo-widget-catalog-map-theme-scope`

**Input**: The host theme id, which is the value of the host's theme shared property, used unchanged.

**Output**: The ui-kit scope, `light` or `dark`.

**Steps**:
1. [ ] - `p2` - **IF** the host theme id is one of the dark host theme ids that `template-shell` ships **RETURN** `dark` - `inst-return-dark`
2. [ ] - `p2` - **RETURN** `light`. This includes an unrecognised id - `inst-return-light`

This is the single statement of the mapping rule for every template MFE: the dashboards root, the larger-view modal, and every widget entry in a cell and in the larger view. Each package keeps its own small copy of the helper, because per-instance isolation shares no code at run time. The set of dark ids is part of that copy, and it gains an entry when the host adds a dark theme.

## 4. States (CDSL)

### Data Widget Display State

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-state-widget-catalog-data-widget`

**States**: Loader, Data, Empty, Busy

**Initial State**: Loader

**Transitions**:
1. [ ] - `p1` - **FROM** Loader **TO** Data **WHEN** the first answer for the latest request arrives and has rows - `inst-loader-to-data`
2. [ ] - `p1` - **FROM** Loader **TO** Empty **WHEN** the first answer for the latest request arrives and has no rows (for `metric_card`: a null `value`) - `inst-loader-to-empty`
3. [ ] - `p1` - **FROM** Data **TO** Busy **WHEN** an interaction changes the query and the widget sends a new `request_data` - `inst-data-to-busy`
4. [ ] - `p1` - **FROM** Empty **TO** Busy **WHEN** an interaction changes the query and the widget sends a new `request_data` - `inst-empty-to-busy`
5. [ ] - `p1` - **FROM** Busy **TO** Data **WHEN** the answer for the latest request arrives and has rows - `inst-busy-to-data`
6. [ ] - `p1` - **FROM** Busy **TO** Empty **WHEN** the answer for the latest request arrives and has no rows (for `metric_card`: a null `value`) - `inst-busy-to-empty`
7. [ ] - `p1` - **FROM** Busy **TO** Busy **WHEN** an interaction changes the query while a request is open and the widget sends a new `request_data`; only the answer of the latest request ends Busy - `inst-busy-to-busy`

This is the single state machine of a data widget; `cpt-frontx-dashboard-feature-data-adapter-contract` cites it. Busy keeps the current content (rows or empty state) visible under the busy indicator, and the controls stay operable in Busy. An answer to an older request causes no transition. A widget that never gets an answer stays in Loader or Busy with no error message. The cannot-show state is not a state of the widget: a widget that cannot be shown is not mounted, and its domain owner shows the placeholder in its place. A `markdown_card` has no states: it shows its body at once.

## 5. Definitions of Done

### Domain Model Definition of Done

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-dod-widget-catalog-catalog-complete`

The system **MUST** declare the widget base, the abstract data widget, and the 9 widget types of section 6 under the FrontX vendor `frontx`, in the package `dashboard_m`.

- Every type passes the GTS identifier grammar and GTS v0.17 schema validation, including every `x-gts-instance-ref` and `x-gts-type-ref` operand. The id fields of embedded types use the literal base type as operand, never the self-reference operand (`cpt-frontx-dashboard-constraint-gts-id-convention`).
- The widget base is abstract (`x-gts-abstract: true`), requires `id` and `title`, and declares no traits and no other field. The data widget is abstract, derives from the base, requires `data` typed by the query base, and declares the traits `data_shape` and `fill` as required and `member_kinds` as optional.
- Each of the 8 data widget types derives from the data widget, sets `data_shape` and `fill`, limits its query on `data`, and adds its presentation fields. `markdown_card` derives from the widget base directly, with no `data` and no traits.
- Every concrete widget type ends with `unevaluatedProperties: false`. A misspelled presentation field fails validation across the whole derivation chain.
- Widget instance identifiers are combined anonymous instance identifiers: the type chain followed by a UUID. No widget carries a separate `type` field or a name of its own. Every instance id is unique, so a dashboard never holds the same widget instance twice.
- No widget type declares a field for client-side sorting, grouping, filtering, display limits, or drill-down.
- No consumer-derived widget type exists: the `id` chain of every widget instance ends at one of the 9 template widget types.

**Constraints**: `cpt-frontx-dashboard-constraint-gts-id-convention`

**Touches**:
- Entities: `Widget`, `Data widget`, `Widget type`

### Query Limits and Multi-Measure Rules

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-dod-widget-catalog-query-limits`

The system **MUST** limit the query of each data widget type as section 6 specifies, so that a query that does not fit its type fails validation before display.

- `summary_card`, `metric_card`, `ranked_list_card`, `progress_list_card`, `pie_chart`, `cartesian_chart`, `heatmap`, and `grid` accept exactly the queries in the table of section 6.2. A query outside the limits, for example a second dimension on a `pie_chart` or one measure on a `progress_list_card`, fails validation.
- `ranked_list_card` takes 1 to 2 measures and the second is the secondary value. `progress_list_card` takes 2 measures: the current value and the target. `cartesian_chart` takes one or more measures, and its `series` field sets how each measure is drawn. `metric_card` takes one measure and an optional `value_label`.
- `metric_card` with `time.compare` set to `previous_period` shows a trend that the widget computes from `value` and `previous_value`.
- `grid` requires `page_sizes`, whose largest value is at most 500, and requires `data.limit`, which is one of the `page_sizes` values.
- `ranked_list_card`, `progress_list_card`, `pie_chart`, and `heatmap` accept no `time.granularity`, and every type except `metric_card` accepts no `time.compare`.

**Touches**:
- Entities: `Widget`, `Data widget`

### Cross-Checks

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-dod-widget-catalog-cross-checks`

The system **MUST** run the cross-checks of section 3 for every data widget when its domain owner loads a dashboard, and **MUST** treat a failure as a cannot-show trigger for that widget only.

- Every `order[].member` is a query member, and the member-kind check applies to every widget type that sets `member_kinds`.
- Every `series[].member` of a `cartesian_chart` is a measure of the query and no member repeats, and a `heatmap` with both scale ends set has `min_value` not greater than `max_value`.
- Every grid check of section 3 fails the widget when it is violated: `columns` covering the members, group members, a member repeated within a group, contiguity, a column in two groups, `row_color`, `sortable`, and `limit` being one of `page_sizes`.
- A failing widget is not mounted. Its cell, or the larger-view modal for a larger-view widget, shows the cannot-show placeholder with the wording of section 6.12, and the other cells are unaffected.

**Implements**:
- `cpt-frontx-dashboard-algo-widget-catalog-cross-check-widget`

**Touches**:
- Entities: `Widget`, `Data widget`

### Grid Presentation

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-dod-widget-catalog-grid-presentation`

The system **MUST** show every `grid` widget as section 6.7 specifies, one page at a time, with sorting and paging as query changes.

- The grid shows one page of at most 500 rows, in the delivered order, with virtualized rows, and the page renders and scrolls smoothly (`cpt-frontx-dashboard-nfr-large-table`).
- A sortable header, a page control, and a page size from `page_sizes` each send one `request_data` with the changed local query. The pager shows the position from `offset`, the number of rows on the page, and `total`. A page size is always offered.
- Frozen leading columns, grouped column headings, column alignment, the number notation, a column title, and row colouring apply as configured. A row with a colour shows an icon with an accessible name.
- Resizing a column redraws the grid locally, sends no request, and is never saved.
- Cells show their value as text, formatted by the column's number format. The grid has no cell renderers, and it uses no sorting, grouping, filtering, or paging feature of its table library.

**Implements**:
- `cpt-frontx-dashboard-flow-widget-catalog-change-query`

**Touches**:
- Entities: `Widget`, `Data widget`

### Markdown Card Rendering Safety

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-dod-widget-catalog-markdown-safety`

The system **MUST** show the `body` of a `markdown_card` as typical markdown (CommonMark), including links and images, and **MUST** show embedded HTML as plain text, as section 6.11 specifies.

- No element is created from embedded HTML.
- Links work and open in a new browsing context without access to the opener. A link whose scheme is a script scheme is not active and shows its text as plain text.
- Images are shown from their target, with the alt text as their accessible name.
- Delivered text in every other widget (titles, labels, values, legend entries, tooltips) is rendered as text, never as markup.

**Touches**:
- Entities: `Widget`

### Shared Widget Chrome and States

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-dod-widget-catalog-widget-chrome`

The system **MUST** give every widget type the shared chrome of section 6.12, with the title and the states that apply to the type.

- A data widget shows its loader before its first answer, keeps its current content under a busy indicator while a repeated request is open, and shows the empty state for data with no rows. A `markdown_card` shows none of these states.
- A widget sends one request after its context, and applies only the answer whose timestamp equals the latest request.
- The loader, busy, empty, and cannot-show states use the default English wordings of section 6.12. Each widget and each domain owner localizes its own wording and formats values for the host language.
- Data that never arrives leaves the loader in place and shows no error message.
- All styling is token-only. Every widget type looks consistent with the design system in the light and the dark scope (`cpt-frontx-dashboard-nfr-visual-quality`).
- A cell widget shows its loader or its content at once after its context arrives, and the chrome adds no blocking work to the initial render (`cpt-frontx-dashboard-nfr-initial-render`).

**Implements**:
- `cpt-frontx-dashboard-flow-widget-catalog-show-data-widget`
- `cpt-frontx-dashboard-state-widget-catalog-data-widget`

**Touches**:
- Entities: `Widget`, `Data widget`

### Larger-View Button

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-dod-widget-catalog-larger-view-button`

The system **MUST** show the larger-view button only in a cell widget whose `set_widget_context` carries `larger_view`, and **MUST** run the open chain when it is pressed.

- A cell with no larger view has no button. The larger view never shows the button, because its context carries no `larger_view` field.
- The button is present in every widget state of its cell, and it can be operated with the keyboard.
- Pressing it runs the chain of `cpt-frontx-dashboard-algo-extension-domain-catalog-open-larger-view-chain`, which carries `history: "none"`. The host identifiers that the chain uses are carried by `cpt-frontx-dashboard-feature-extension-domain-catalog` (`cpt-frontx-dashboard-constraint-role-based-host-ids`, `cpt-frontx-dashboard-contract-host-areas`).

**Implements**:
- `cpt-frontx-dashboard-flow-widget-catalog-open-larger-view`

**Touches**:
- Entities: `Widget`

### Theme

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-dod-widget-catalog-theme`

The system **MUST** make every widget follow the host theme through the scope mapping rule of section 3, with token-only styling.

- Each widget maps the host theme id to the light or dark scope of `@gears-frontx/ui-kit`, and an unrecognised id selects the light scope.
- Every colour, font, and spacing value comes from kit tokens of the chosen scope, including the row colours of a grid.
- Each chart widget builds the ECharts theme `frontx-dashboard` from the kit tokens, registers it in its own ECharts copy, and builds and registers it again on every theme change.
- A theme change sends no request, shows no loader, and remounts nothing.

**Implements**:
- `cpt-frontx-dashboard-flow-widget-catalog-follow-theme`
- `cpt-frontx-dashboard-algo-widget-catalog-map-theme-scope`

**Touches**:
- Entities: `Widget`

### Accessibility of the Chrome and the Grid

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-dod-widget-catalog-accessibility`

The system **MUST** make the chrome and the grid operable by keyboard and readable by assistive technology, and **MUST NOT** convey meaning by colour alone (`cpt-frontx-dashboard-nfr-accessibility`).

- The larger-view button, the grid's sortable headers, page controls, page size control, and column resize controls can be operated with the keyboard alone.
- The grid exposes ARIA grid semantics, including the row count and the row positions of virtualized rows, and the sort state of each sortable header.
- A coloured grid row shows an icon with an accessible name. Chart series and pie segments are named in the legend and the tooltip. The heatmap shows its scale with numbers. Progress items show their values as text. The trend shows a direction icon together with its value.

**Touches**:
- Entities: `Widget`

## 6. Domain Model

### 6.0 Widget (abstract base)

**GTS ID**: `gts.frontx.dashboard_m.widget.widget.v1~`

**Description**: Abstract base type of every widget type. It carries the instance identifier `id` and the display `title`, and no traits. The base is never instantiated directly.

**Schema**:

```json
{
  "$id": "gts://gts.frontx.dashboard_m.widget.widget.v1~",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "Widget",
  "description": "Abstract base of the 9 template widget types.",
  "x-gts-abstract": true,
  "type": "object",
  "required": ["id", "title"],
  "properties": {
    "id": {
      "type": "string",
      "x-gts-instance-ref": "gts.frontx.dashboard_m.widget.widget.v1~",
      "description": "Combined anonymous instance identifier: the widget's type chain followed by a UUID. The rightmost type of the chain is the widget type. The widget has no other identifier and no name of its own."
    },
    "title": {
      "type": "string",
      "description": "Display title shown in the widget chrome, as delivered."
    }
  }
}
```

**Cross-references**:
- The operand of `x-gts-instance-ref` is the literal base type, because the self-reference operand would resolve to the type being validated and would reject an id embedded in a layout cell or a dashboard (`cpt-frontx-dashboard-constraint-gts-id-convention`).
- Widget types: every concrete widget type extends this base through `allOf` `$ref`, either directly (`markdown_card`) or through the data widget. Because the base and the data widget are abstract, every widget instance names one of the 9 widget types as the rightmost type of its `id`.
- Conceptual definition: DESIGN section 3.1. Decision: ADR-0009.

### 6.1 Data Widget (abstract)

**GTS ID**: `gts.frontx.dashboard_m.widget.widget.v1~frontx.dashboard_m.widget.data_widget.v1~`

**Description**: Abstract type of the 8 data widget types. It adds the required `data` field, typed by the query base, and declares the traits that name the data a widget type needs.

**Schema**:

```json
{
  "$id": "gts://gts.frontx.dashboard_m.widget.widget.v1~frontx.dashboard_m.widget.data_widget.v1~",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "DataWidget",
  "description": "Abstract base of the data widget types: a widget with a query and the traits that name its data shape and fill mode.",
  "x-gts-abstract": true,
  "x-gts-traits-schema": {
    "type": "object",
    "required": ["data_shape", "fill"],
    "properties": {
      "data_shape": {
        "type": "string",
        "x-gts-type-ref": "gts.frontx.dashboard_m.widget_data.widget_data.v1~",
        "description": "Identifier of the data shape that the widget type needs."
      },
      "fill": {
        "type": "object",
        "required": ["mode"],
        "additionalProperties": false,
        "properties": {
          "mode": { "enum": ["rows_by_member", "x_series_value", "row_per_measure", "positional_table", "scalar_with_series"] },
          "fields": {
            "type": "array",
            "description": "Used by rows_by_member only.",
            "items": {
              "type": "object",
              "required": ["field", "from"],
              "additionalProperties": false,
              "properties": {
                "field": { "type": "string", "minLength": 1 },
                "from": { "type": "string", "pattern": "^(dimensions\\[(0|[1-9][0-9]*)\\]|measures\\[(0|[1-9][0-9]*)\\]|time)$" }
              }
            }
          }
        },
        "if": { "properties": { "mode": { "const": "rows_by_member" } } },
        "then": { "required": ["fields"] },
        "else": { "not": { "required": ["fields"] } }
      },
      "member_kinds": {
        "type": "object",
        "description": "Optional allowed value kinds of the query's measures and dimensions, checked by the domain owner against the member instances.",
        "properties": {
          "measures": { "type": "array", "description": "No template widget type sets it. A widget type that does restricts the value kinds of the query's measures.", "items": { "enum": ["number", "percent", "duration"] } },
          "dimensions": { "type": "array", "items": { "enum": ["string", "time", "number"] } }
        }
      }
    }
  },
  "allOf": [
    { "$ref": "gts://gts.frontx.dashboard_m.widget.widget.v1~" },
    {
      "type": "object",
      "required": ["data"],
      "properties": {
        "data": { "$ref": "gts://gts.frontx.dashboard_m.data.query.v1~" }
      }
    }
  ]
}
```

**Cross-references**:
- Traits: `data_shape` and `fill` are required. The domain owner passes both to the widget in `set_widget_context`, and the widget copies them unchanged into each `request_data`. A widget never compares data shapes. The five fill modes and the data shapes are specified in `cpt-frontx-dashboard-feature-widget-data-catalog`.
- `member_kinds`: the domain owner checks it against the `value_type` of the member instances (section 3). An absent key puts no restriction on that kind of member. The four category types (`ranked_list_card`, `progress_list_card`, `pie_chart`, `heatmap`) allow the dimension kinds `string` and `number` and exclude `time`, because they draw unordered categories and a time-valued category belongs on the `time` of a chart with a time axis. The time dimension of `time` is checked by the dataset's own enum.
- `data`: the query base is specified in `cpt-frontx-dashboard-feature-query-vocabulary`. Each data widget type narrows it with the limits of section 6.2.

### 6.2 Widget Types and Query Limits

Every data widget type is a concrete type under the data widget. Its identifier is `gts.frontx.dashboard_m.widget.widget.v1~frontx.dashboard_m.widget.data_widget.v1~frontx.dashboard_m.widget.<widget_type>.v1~`, and its data shape is `gts.frontx.dashboard_m.widget_data.widget_data.v1~frontx.dashboard_m.widget_data.<widget_type>.v1~`. The `markdown_card` identifier is `gts.frontx.dashboard_m.widget.widget.v1~frontx.dashboard_m.widget.markdown_card.v1~`.

| Widget type | Query limits | Fill mode (traits) | Data shape rows |
|---|---|---|---|
| `summary_card` | 1 or more measures, no dimensions, no `granularity`, no `compare` | `row_per_measure` | `{key, value}` |
| `metric_card` | 1 measure, no dimensions; optional `time` with `granularity` for the sparkline; optional `time.compare` for the trend | `scalar_with_series` | `{value, previous_value?, sparkline?}` |
| `ranked_list_card` | 1 dimension, 1 to 2 measures, no `granularity`; `order`, `limit` | `rows_by_member`: `label` from `dimensions[0]`, `value` from `measures[0]`, `secondary` from `measures[1]` | `{label, value, secondary?}` |
| `progress_list_card` | 1 dimension, 2 measures, no `granularity`; `order`, `limit` | `rows_by_member`: `label` from `dimensions[0]`, `current` from `measures[0]`, `target` from `measures[1]` | `{label, current, target}` |
| `pie_chart` | 1 dimension, 1 measure, no `granularity`, no `compare` | `rows_by_member`: `label` from `dimensions[0]`, `value` from `measures[0]` | `{label, value}` |
| `cartesian_chart` | 1 measure: `time` with `granularity` and at most 1 dimension, or no `granularity` and 1 to 2 dimensions. Several measures: `time` with `granularity` and no dimension, or no `granularity` and 1 dimension. No `compare` | `x_series_value` | `{x, series?, value}` |
| `heatmap` | 2 dimensions, 1 measure, no `granularity`, no `compare` | `rows_by_member`: `x` from `dimensions[0]`, `y` from `dimensions[1]`, `value` from `measures[0]` | `{x, y, value}` |
| `grid` | 1 or more members; `order`; paging by `limit` and `offset`, with `limit` required and one of the `page_sizes` values; no `compare` | `positional_table` | `rows: [[...]]`, `total` |
| `markdown_card` | Not a data widget: no `data`, no traits | none | none |

**Multi-measure rules.** A widget type that compares values takes more than one measure. `ranked_list_card` takes 1 to 2 measures, and the second is the secondary value of each row. `progress_list_card` takes 2 measures: the first is the current value and the second is the target. `cartesian_chart` takes one or more measures. Its `series` field has at most one entry per measure and sets how that measure is drawn. A measure with no entry is drawn as bars on the primary y axis. An entry that names a member that is not a measure of the query, or a second entry for the same measure, fails the cross-check of section 3. `metric_card` keeps an optional `value_label`, and without it the headline shows the measure's title.

**Granularity and compare limits.** `ranked_list_card` and `progress_list_card` take no `time.granularity`, like `pie_chart` and `heatmap`: their rows are one per category, so a time series has no place in them. `time.compare` is allowed only on `metric_card`, because only its data shape carries `previous_value`; every other type rejects it, since its shape cannot carry the comparison.

**Null values.** A measure value in an answer may be null. Each widget shows a null as a gap or as an empty value, as its section states.

**Metric trend.** A `metric_card` whose query sets `time.compare` to `previous_period` receives `previous_value` next to `value`. The widget computes the trend from these two values and does not compute any other result.

**Member metadata.** A widget takes default titles and formats from the metadata (`title`, `value_type`, `unit`) that `set_widget_context` carries for each member of its query. A presentation field overrides the default.

**Closed fields.** Every concrete type ends with `unevaluatedProperties: false`. Because each type lists every field it accepts, a misspelled presentation field fails the validation of the widget, and its cell shows the cannot-show placeholder.

### 6.3 SummaryCard

**GTS ID**: `gts.frontx.dashboard_m.widget.widget.v1~frontx.dashboard_m.widget.data_widget.v1~frontx.dashboard_m.widget.summary_card.v1~`

**Description**: A card with one label and value line for each measure, in query order.

**Schema**:

```json
{
  "$id": "gts://gts.frontx.dashboard_m.widget.widget.v1~frontx.dashboard_m.widget.data_widget.v1~frontx.dashboard_m.widget.summary_card.v1~",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "SummaryCard",
  "x-gts-traits": {
    "data_shape": "gts.frontx.dashboard_m.widget_data.widget_data.v1~frontx.dashboard_m.widget_data.summary_card.v1~",
    "fill": { "mode": "row_per_measure" }
  },
  "allOf": [
    { "$ref": "gts://gts.frontx.dashboard_m.widget.widget.v1~frontx.dashboard_m.widget.data_widget.v1~" },
    {
      "type": "object",
      "properties": {
        "data": {
          "required": ["measures"],
          "properties": {
            "measures": { "minItems": 1 },
            "dimensions": { "maxItems": 0 },
            "time": { "not": { "anyOf": [ { "required": ["granularity"] }, { "required": ["compare"] } ] } }
          }
        }
      }
    }
  ],
  "unevaluatedProperties": false
}
```

**Cross-references**:
- Presentation fields: none. The label of each line is the member's title and its value is formatted by the member's metadata.
- Each answer row is one line, in the delivered order. A null value shows as an empty value after its label.

### 6.4 MetricCard

**GTS ID**: `gts.frontx.dashboard_m.widget.widget.v1~frontx.dashboard_m.widget.data_widget.v1~frontx.dashboard_m.widget.metric_card.v1~`

**Description**: A card with one headline value, a trend when the query compares with the previous period, and a sparkline when the query has a granularity.

**Schema**:

```json
{
  "$id": "gts://gts.frontx.dashboard_m.widget.widget.v1~frontx.dashboard_m.widget.data_widget.v1~frontx.dashboard_m.widget.metric_card.v1~",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "MetricCard",
  "x-gts-traits": {
    "data_shape": "gts.frontx.dashboard_m.widget_data.widget_data.v1~frontx.dashboard_m.widget_data.metric_card.v1~",
    "fill": { "mode": "scalar_with_series" }
  },
  "allOf": [
    { "$ref": "gts://gts.frontx.dashboard_m.widget.widget.v1~frontx.dashboard_m.widget.data_widget.v1~" },
    {
      "type": "object",
      "properties": {
        "data": {
          "required": ["measures"],
          "properties": {
            "measures": { "minItems": 1, "maxItems": 1 },
            "dimensions": { "maxItems": 0 }
          }
        },
        "value_label": { "type": "string", "description": "Optional caption of the headline value. Without it, the headline shows the measure's title." }
      }
    }
  ],
  "unevaluatedProperties": false
}
```

**Cross-references**:
- Presentation: the headline is `value`. The trend is computed from `value` and `previous_value` and shows a direction icon (up for an increase, down for a decrease, flat for no change) together with the formatted change, so its meaning does not depend on colour. The sparkline draws one point per granularity step, in the delivered order, and a null point is a gap. A null `value` is the empty state of the widget ("No data to show"). A null or absent `previous_value` shows no trend, and the headline stays.

### 6.5 RankedListCard

**GTS ID**: `gts.frontx.dashboard_m.widget.widget.v1~frontx.dashboard_m.widget.data_widget.v1~frontx.dashboard_m.widget.ranked_list_card.v1~`

**Description**: A card with one ranked item for each answer row: the rank is the delivered position, followed by the label, the value, and an optional secondary value.

**Schema**:

```json
{
  "$id": "gts://gts.frontx.dashboard_m.widget.widget.v1~frontx.dashboard_m.widget.data_widget.v1~frontx.dashboard_m.widget.ranked_list_card.v1~",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "RankedListCard",
  "x-gts-traits": {
    "data_shape": "gts.frontx.dashboard_m.widget_data.widget_data.v1~frontx.dashboard_m.widget_data.ranked_list_card.v1~",
    "fill": {
      "mode": "rows_by_member",
      "fields": [
        { "field": "label", "from": "dimensions[0]" },
        { "field": "value", "from": "measures[0]" },
        { "field": "secondary", "from": "measures[1]" }
      ]
    },
    "member_kinds": { "dimensions": ["string", "number"] }
  },
  "allOf": [
    { "$ref": "gts://gts.frontx.dashboard_m.widget.widget.v1~frontx.dashboard_m.widget.data_widget.v1~" },
    {
      "type": "object",
      "properties": {
        "data": {
          "required": ["measures", "dimensions"],
          "properties": {
            "measures": { "minItems": 1, "maxItems": 2 },
            "dimensions": { "minItems": 1, "maxItems": 1 },
            "time": { "not": { "anyOf": [ { "required": ["granularity"] }, { "required": ["compare"] } ] } }
          }
        },
        "value_label": { "type": "string", "description": "Optional heading of the primary value." },
        "secondary_label": { "type": "string", "description": "Optional heading of the secondary value." }
      }
    }
  ],
  "unevaluatedProperties": false
}
```

**Cross-references**:
- Presentation: the first row has rank 1, the second rank 2, and so on. The widget does not re-rank or re-order the rows. A query with one measure has no secondary value, and the `secondary` field is omitted from each row by the fill mode, so the secondary value and its heading are not shown. `value_label` and `secondary_label` replace the default headings of the two values. A null value or a null secondary value shows as an empty value.

### 6.6 ProgressListCard

**GTS ID**: `gts.frontx.dashboard_m.widget.widget.v1~frontx.dashboard_m.widget.data_widget.v1~frontx.dashboard_m.widget.progress_list_card.v1~`

**Description**: A card with one progress bar for each answer row, showing the current value against the target.

**Schema**:

```json
{
  "$id": "gts://gts.frontx.dashboard_m.widget.widget.v1~frontx.dashboard_m.widget.data_widget.v1~frontx.dashboard_m.widget.progress_list_card.v1~",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "ProgressListCard",
  "x-gts-traits": {
    "data_shape": "gts.frontx.dashboard_m.widget_data.widget_data.v1~frontx.dashboard_m.widget_data.progress_list_card.v1~",
    "fill": {
      "mode": "rows_by_member",
      "fields": [
        { "field": "label", "from": "dimensions[0]" },
        { "field": "current", "from": "measures[0]" },
        { "field": "target", "from": "measures[1]" }
      ]
    },
    "member_kinds": { "dimensions": ["string", "number"] }
  },
  "allOf": [
    { "$ref": "gts://gts.frontx.dashboard_m.widget.widget.v1~frontx.dashboard_m.widget.data_widget.v1~" },
    {
      "type": "object",
      "properties": {
        "data": {
          "required": ["measures", "dimensions"],
          "properties": {
            "measures": { "minItems": 2, "maxItems": 2 },
            "dimensions": { "minItems": 1, "maxItems": 1 },
            "time": { "not": { "anyOf": [ { "required": ["granularity"] }, { "required": ["compare"] } ] } }
          }
        }
      }
    }
  ],
  "unevaluatedProperties": false
}
```

**Cross-references**:
- Presentation fields: none.
- Presentation: the bar fills in proportion to `current` over `target`, and it is full when `current` reaches or exceeds `target`. With a null or zero target, or a null `current`, the bar stays empty, and a null value shows as an empty value. The current and target values are always shown as text, so the bar does not carry meaning alone. Bar colours come from kit tokens of the active scope.

### 6.7 Grid

**GTS ID**: `gts.frontx.dashboard_m.widget.widget.v1~frontx.dashboard_m.widget.data_widget.v1~frontx.dashboard_m.widget.grid.v1~`

**Description**: A table that shows one page of the answer. Order and page come from the query, and the browser never sorts, groups, filters, or pages rows itself. The table is built on TanStack Table with its virtualizer (ADR-0005).

**Schema**:

```json
{
  "$id": "gts://gts.frontx.dashboard_m.widget.widget.v1~frontx.dashboard_m.widget.data_widget.v1~frontx.dashboard_m.widget.grid.v1~",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "Grid",
  "x-gts-traits": {
    "data_shape": "gts.frontx.dashboard_m.widget_data.widget_data.v1~frontx.dashboard_m.widget_data.grid.v1~",
    "fill": { "mode": "positional_table" }
  },
  "allOf": [
    { "$ref": "gts://gts.frontx.dashboard_m.widget.widget.v1~frontx.dashboard_m.widget.data_widget.v1~" },
    {
      "type": "object",
      "required": ["columns", "page_sizes"],
      "properties": {
        "data": {
          "required": ["limit"],
          "properties": {
            "time": { "not": { "required": ["compare"] } }
          }
        },
        "columns": {
          "type": "array",
          "minItems": 1,
          "description": "Displayed columns, in display order. Each names one query member, and together they list every query member exactly once (a cross-check).",
          "items": {
            "type": "object",
            "required": ["member"],
            "additionalProperties": false,
            "properties": {
              "member": {
                "type": "string",
                "anyOf": [
                  { "x-gts-instance-ref": "gts.frontx.dashboard_m.data.measure.v1~" },
                  { "x-gts-instance-ref": "gts.frontx.dashboard_m.data.dimension.v1~" }
                ]
              },
              "title": { "type": "string", "description": "Optional heading. Without it, the member's title." },
              "width": { "type": "integer", "minimum": 1, "description": "Optional initial width in pixels. The viewer may resize the column locally." },
              "format": {
                "type": "object",
                "additionalProperties": false,
                "description": "Optional number format. `notation` applies to number-valued members only: standard shows the full number and compact shows the abbreviated number of the host language. A percent member shows as a percentage and a duration member as a duration, and neither is changed by the notation.",
                "properties": { "notation": { "enum": ["standard", "compact"] } }
              },
              "align": { "enum": ["start", "end", "center"], "description": "Optional alignment of the column body, in logical terms: start and end follow the writing direction of the host language. Without it, start." },
              "sortable": { "type": "boolean", "description": "Whether a click on the header sorts by this member. Only members that the dataset allows in order may be sortable (a cross-check)." }
            }
          }
        },
        "page_sizes": {
          "type": "array",
          "minItems": 1,
          "uniqueItems": true,
          "items": { "type": "integer", "minimum": 1, "maximum": 500 },
          "description": "The page sizes offered. Required, with the largest value at most 500."
        },
        "frozen_columns": { "type": "integer", "minimum": 0, "description": "Number of leading columns that stay visible during horizontal scrolling. 0 or absent freezes no column." },
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
                "items": {
                  "type": "string",
                  "anyOf": [
                    { "x-gts-instance-ref": "gts.frontx.dashboard_m.data.measure.v1~" },
                    { "x-gts-instance-ref": "gts.frontx.dashboard_m.data.dimension.v1~" }
                  ]
                }
              }
            }
          }
        },
        "row_color": {
          "type": "string",
          "anyOf": [
            { "x-gts-instance-ref": "gts.frontx.dashboard_m.data.measure.v1~" },
            { "x-gts-instance-ref": "gts.frontx.dashboard_m.data.dimension.v1~" }
          ],
          "description": "Optional query member that is also a column. Its value in a row names the row colour: success, warning, error, or info."
        }
      }
    }
  ],
  "unevaluatedProperties": false
}
```

**Cross-references**:
- Data: the answer is `rows`, one positional array for each result row in the canonical member order, and `total`, the row count across all pages. Each column reads its value from the entry at the position of its member in the canonical member order. Rows keep the delivered order. Cells show their value as text, formatted by the column's number format and the member metadata, and a null value shows an empty cell. The grid has no cell renderers. Long text wraps and is never cut off. The column heading is the column's `title`, or the member's title without it.
- Paging: the grid always shows one page, and the browser holds only that page. The `page_sizes` rule is: it is required, its largest value is at most 500, and `data.limit` is one of its values (a cross-check). The pager shows the position from `offset`, the number of rows on the page, and `total`.
- Sorting and paging are query changes: see `cpt-frontx-dashboard-flow-widget-catalog-change-query`. The grid keeps its current rows under the busy indicator while it waits. The larger view of a grid is its own grid widget with its own query, and it sorts and pages the same way.
- Frozen columns: the first `frozen_columns` columns stay visible at the leading edge while the viewer scrolls horizontally. A value larger than the number of columns freezes all columns.
- Column groups: each group shows its `title` once, in a heading row above the column headings, spanning exactly its columns. A column outside every group has an empty cell in that heading row. Because each column has one place in that row, a column named by two groups fails the cross-check, and so does a member repeated within one group. Without `column_groups`, the grid has a single heading row.
- Row colour: with `row_color` set, a row whose value is one of the meanings `success`, `warning`, `error`, or `info`, matched exactly and case-sensitively, takes the row background of the kit token of that meaning in the active light or dark scope. The row also shows an icon of that meaning, with an accessible name in the host language. A null or any other value leaves the row uncoloured, and cell text keeps readable contrast.
- Resizing: the viewer may resize a column. The new width redraws the grid locally, sends no request, and is never saved. `columns[].width` is the initial width.
- Cross-checks: the grid checks of section 3, run by the domain owner when it loads a dashboard.
- Table library: the widget keeps TanStack Table behind its own typed props. It uses no sorting, grouping, filtering, or pagination feature of the library, and it uses the column sizing feature for resizing only.
- Virtualization: only the rows in view of the page are rendered, so a page of up to 500 rows scrolls smoothly (`cpt-frontx-dashboard-nfr-large-table`).
- Accessibility: ARIA grid semantics, including the row count and the position of each virtualized row, and the sort state of each sortable header.

### 6.8 CartesianChart

**GTS ID**: `gts.frontx.dashboard_m.widget.widget.v1~frontx.dashboard_m.widget.data_widget.v1~frontx.dashboard_m.widget.cartesian_chart.v1~`

**Description**: A chart on x and y axes with one or more series, each drawn as bars, a line, an area, or scatter points (Apache ECharts, ADR-0004).

**Schema**:

```json
{
  "$id": "gts://gts.frontx.dashboard_m.widget.widget.v1~frontx.dashboard_m.widget.data_widget.v1~frontx.dashboard_m.widget.cartesian_chart.v1~",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "CartesianChart",
  "x-gts-traits": {
    "data_shape": "gts.frontx.dashboard_m.widget_data.widget_data.v1~frontx.dashboard_m.widget_data.cartesian_chart.v1~",
    "fill": { "mode": "x_series_value" }
  },
  "allOf": [
    { "$ref": "gts://gts.frontx.dashboard_m.widget.widget.v1~frontx.dashboard_m.widget.data_widget.v1~" },
    {
      "type": "object",
      "properties": {
        "data": {
          "required": ["measures"],
          "oneOf": [
            {
              "required": ["time"],
              "properties": {
                "measures": { "minItems": 1, "maxItems": 1 },
                "dimensions": { "maxItems": 1 },
                "time": { "required": ["granularity"], "not": { "required": ["compare"] } }
              }
            },
            {
              "required": ["dimensions"],
              "properties": {
                "measures": { "minItems": 1, "maxItems": 1 },
                "dimensions": { "minItems": 1, "maxItems": 2 },
                "time": { "not": { "anyOf": [ { "required": ["granularity"] }, { "required": ["compare"] } ] } }
              }
            },
            {
              "required": ["time"],
              "properties": {
                "measures": { "minItems": 2 },
                "dimensions": { "maxItems": 0 },
                "time": { "required": ["granularity"], "not": { "required": ["compare"] } }
              }
            },
            {
              "required": ["dimensions"],
              "properties": {
                "measures": { "minItems": 2 },
                "dimensions": { "minItems": 1, "maxItems": 1 },
                "time": { "not": { "anyOf": [ { "required": ["granularity"] }, { "required": ["compare"] } ] } }
              }
            }
          ]
        },
        "series": {
          "type": "array",
          "description": "How each measure is drawn: at most one entry for each measure. A measure with no entry is drawn as bars on the primary y axis.",
          "items": {
            "type": "object",
            "required": ["member", "type"],
            "additionalProperties": false,
            "properties": {
              "member": { "type": "string", "x-gts-instance-ref": "gts.frontx.dashboard_m.data.measure.v1~" },
              "type": { "enum": ["bar", "line", "area", "scatter"], "description": "How the measure is drawn." },
              "y_axis": { "enum": ["primary", "secondary"], "description": "Optional y axis. Without it, the primary axis." },
              "stack_group": { "type": "string", "description": "Optional stack group. Series with the same stack group are stacked." }
            }
          }
        },
        "x_axis": {
          "type": "object",
          "additionalProperties": false,
          "properties": {
            "type": { "enum": ["category", "value", "time"], "description": "Without it, category." },
            "label": { "type": "string" }
          }
        },
        "y_axis": {
          "type": "object",
          "additionalProperties": false,
          "properties": {
            "type": { "enum": ["value", "log"], "description": "Without it, value." },
            "label": { "type": "string" }
          }
        },
        "y_axis_secondary": {
          "type": "object",
          "additionalProperties": false,
          "description": "Settings of the secondary y axis, used by series whose y_axis is secondary.",
          "properties": {
            "type": { "enum": ["value", "log"], "description": "Without it, value." },
            "label": { "type": "string" }
          }
        },
        "legend_position": { "enum": ["top", "right", "bottom", "left"], "description": "Without it, bottom." }
      }
    }
  ],
  "unevaluatedProperties": false
}
```

**Cross-references**:
- Data: `rows` in long format. With one measure, `x` is the time or the first dimension, `series` is the first dimension not used for `x`, and `value` is the measure. With several measures, each row is one measure at one `x`, `series` is the measure id, and `value` is that measure.
- Presentation: on a category axis the `x` positions follow the delivered order, and on a value or time axis they are placed by value. A null value is a gap. Every series is named in the legend and in the tooltip, so series do not differ by colour alone.
- Chart theme: the series colours, typography, axes, and tooltips come from the ECharts theme `frontx-dashboard` that the widget builds from kit tokens (section 6.12, ADR-0004).

### 6.9 PieChart

**GTS ID**: `gts.frontx.dashboard_m.widget.widget.v1~frontx.dashboard_m.widget.data_widget.v1~frontx.dashboard_m.widget.pie_chart.v1~`

**Description**: A pie or donut chart with one segment for each answer row (Apache ECharts, ADR-0004).

**Schema**:

```json
{
  "$id": "gts://gts.frontx.dashboard_m.widget.widget.v1~frontx.dashboard_m.widget.data_widget.v1~frontx.dashboard_m.widget.pie_chart.v1~",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "PieChart",
  "x-gts-traits": {
    "data_shape": "gts.frontx.dashboard_m.widget_data.widget_data.v1~frontx.dashboard_m.widget_data.pie_chart.v1~",
    "fill": {
      "mode": "rows_by_member",
      "fields": [
        { "field": "label", "from": "dimensions[0]" },
        { "field": "value", "from": "measures[0]" }
      ]
    },
    "member_kinds": { "dimensions": ["string", "number"] }
  },
  "allOf": [
    { "$ref": "gts://gts.frontx.dashboard_m.widget.widget.v1~frontx.dashboard_m.widget.data_widget.v1~" },
    {
      "type": "object",
      "properties": {
        "data": {
          "required": ["measures", "dimensions"],
          "properties": {
            "measures": { "minItems": 1, "maxItems": 1 },
            "dimensions": { "minItems": 1, "maxItems": 1 },
            "time": { "not": { "anyOf": [ { "required": ["granularity"] }, { "required": ["compare"] } ] } }
          }
        },
        "radius": {
          "type": "array",
          "minItems": 1,
          "maxItems": 2,
          "items": { "type": "string", "pattern": "^[0-9]{1,4}(\\.[0-9]{1,2})?(%|px)$" },
          "description": "Optional outer radius, or inner and outer radius, each a percentage or a pixel value, for example [\"40%\", \"70%\"] for a donut or [\"60px\"]."
        },
        "rose_type": { "enum": ["radius", "area", "none"], "description": "Optional rose display. Without it, none." }
      }
    }
  ],
  "unevaluatedProperties": false
}
```

**Cross-references**:
- Presentation: every segment is listed in the legend with its label and value, and the tooltip shows both, so segments do not differ by colour alone. A segment with a null or zero value has no size but stays in the legend. Segment colours come from the chart theme.

### 6.10 Heatmap

**GTS ID**: `gts.frontx.dashboard_m.widget.widget.v1~frontx.dashboard_m.widget.data_widget.v1~frontx.dashboard_m.widget.heatmap.v1~`

**Description**: A two-axis grid of cells whose colour shows a value (Apache ECharts, ADR-0004).

**Schema**:

```json
{
  "$id": "gts://gts.frontx.dashboard_m.widget.widget.v1~frontx.dashboard_m.widget.data_widget.v1~frontx.dashboard_m.widget.heatmap.v1~",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "Heatmap",
  "x-gts-traits": {
    "data_shape": "gts.frontx.dashboard_m.widget_data.widget_data.v1~frontx.dashboard_m.widget_data.heatmap.v1~",
    "fill": {
      "mode": "rows_by_member",
      "fields": [
        { "field": "x", "from": "dimensions[0]" },
        { "field": "y", "from": "dimensions[1]" },
        { "field": "value", "from": "measures[0]" }
      ]
    },
    "member_kinds": { "dimensions": ["string", "number"] }
  },
  "allOf": [
    { "$ref": "gts://gts.frontx.dashboard_m.widget.widget.v1~frontx.dashboard_m.widget.data_widget.v1~" },
    {
      "type": "object",
      "properties": {
        "data": {
          "required": ["measures", "dimensions"],
          "properties": {
            "measures": { "minItems": 1, "maxItems": 1 },
            "dimensions": { "minItems": 2, "maxItems": 2 },
            "time": { "not": { "anyOf": [ { "required": ["granularity"] }, { "required": ["compare"] } ] } }
          }
        },
        "x_axis_label": { "type": "string", "description": "Optional x-axis title." },
        "y_axis_label": { "type": "string", "description": "Optional y-axis title." },
        "min_value": { "type": ["number", "null"], "description": "Optional lower end of the colour scale. Null or absent takes the lowest value in the rows. When both ends are set, it is not greater than `max_value` (a cross-check)." },
        "max_value": { "type": ["number", "null"], "description": "Optional upper end of the colour scale. Null or absent takes the highest value in the rows." },
        "show_cell_values": { "type": "boolean", "description": "Whether to show each cell's value inside the cell." }
      }
    }
  ],
  "unevaluatedProperties": false
}
```

**Cross-references**:
- Presentation: the x and y categories follow the order of their first appearance in the delivered rows. The heatmap shows its colour scale with numbers, and the tooltip of each cell shows its x, y, and value, so values do not depend on colour alone. A null value leaves its cell empty. The colour scale comes from the chart theme.

### 6.11 MarkdownCard

**GTS ID**: `gts.frontx.dashboard_m.widget.widget.v1~frontx.dashboard_m.widget.markdown_card.v1~`

**Description**: A card that shows its markdown `body` (CommonMark, with embedded HTML shown as text). It is not a data widget: it has no `data`, no traits, and no query, and it never requests data.

**Schema**:

```json
{
  "$id": "gts://gts.frontx.dashboard_m.widget.widget.v1~frontx.dashboard_m.widget.markdown_card.v1~",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "MarkdownCard",
  "allOf": [
    { "$ref": "gts://gts.frontx.dashboard_m.widget.widget.v1~" },
    {
      "type": "object",
      "required": ["body"],
      "properties": {
        "body": { "type": "string", "minLength": 1, "description": "The markdown to show: CommonMark, including links and images. Embedded HTML is shown as text." }
      }
    }
  ],
  "unevaluatedProperties": false
}
```

**Cross-references**:
- Rendering: the card renders right after `set_widget_context`, with none of the data states, and sends no `request_data` (`cpt-frontx-dashboard-fr-backend-source`).
- Markdown: the body is typical markdown, CommonMark including links and images. The card shows the formatting, the links, and the images.
- Embedded HTML: HTML in the body is shown as plain text and no element is created from it.
- Links: a link works and opens in a new browsing context without access to the opener. A link whose scheme is a script scheme (`javascript`, `vbscript`, or `data`) is not active and shows its link text as plain text, as standard CommonMark sanitizing does. The scheme is compared case-insensitively after leading whitespace and control characters are trimmed, so `JavaScript:` and a target with a leading space are inactive too.
- Images: an image is shown from its target with its alt text as the accessible name. An image whose target has a script scheme is not loaded and shows its alt text, or nothing when it has none.
- Other widgets: the markdown card is the only widget that interprets markup. Every other delivered text is rendered as text (section 6.12).

### 6.12 Shared Widget Chrome and States

Every widget type shows its content inside one shared chrome, in a layout cell and in the larger view. The chrome is behaviour of the widget entries, not a schema field.

**Title.** The chrome shows the widget's `title` as delivered.

**Default English wordings.** A widget and a domain owner localize these for the host language.

| State | Wording | Shown by |
|---|---|---|
| Loader of a widget | "Loading" | The widget, from its context until its first answer |
| Busy indicator | "Updating" | The widget, over its current content while a repeated request is open |
| Empty state | "No data to show" | The widget, the same for every widget type. A grid keeps its column headings above it |
| Cannot show, widget level | "This widget cannot be shown" | The domain owner, in a cell, or the larger-view modal, in place of the widget |
| Loader of the dashboard | "Loading dashboard" | The dashboards root, and the larger-view modal while it loads a dashboard |
| Cannot show, dashboard level | "This dashboard cannot be shown" | The dashboards root, or the larger-view modal, in place of the dashboard |

The loader and the busy indicator are announced to assistive technology as a status.

**States of a widget.** A data widget has the states of `cpt-frontx-dashboard-state-widget-catalog-data-widget`. A `markdown_card` shows its body at once. A widget in any state affects no other widget. The cannot-show placeholder is static: it has no Retry, and it shows no message from the data adapter.

**Cannot-show trigger.** A widget that fails its GTS validation (a failure whose instance path lies under its `widget` or `larger_view`) or a cross-check is a cannot-show trigger for its own cell, or for the larger-view modal when it is a larger-view widget (section 3).

**Requests.** A data widget sends one `request_data` after it receives its context, and sends a new one when an interaction changes its query, as `cpt-frontx-dashboard-flow-widget-catalog-change-query` specifies. When a widget requests data is decided in ADR-0011.

**Larger-view button.** The chrome of a cell widget shows one larger-view button, in every state, only when the widget's `set_widget_context` carries the `larger_view` field. The field holds the dashboard id and the larger-view widget id. A cell with no larger view has no button. A widget in the larger view receives no `larger_view` field, so it shows no button, and a larger-view widget cannot open another larger view. Pressing the button runs `cpt-frontx-dashboard-flow-widget-catalog-open-larger-view`.

**Language and value formatting.** Each widget formats numbers and dates for the host language, by the `value_type` and `unit` of the member metadata. Titles and text values from the dashboard and the answer are shown as delivered, as text.

**Nothing hidden.** No widget type cuts off or hides delivered text or rows. Long text wraps.

**Text, not markup.** Delivered text in every widget (titles, labels, values, legend entries, and tooltips) is rendered as text: markup or HTML in it is never interpreted, and chart tooltips are built from text, not from HTML strings. Only the body of a `markdown_card` is interpreted, as markdown, with embedded HTML shown as text (section 6.11).

**Theme.** Each widget maps the host theme id to the light or dark scope of `@gears-frontx/ui-kit` by `cpt-frontx-dashboard-algo-widget-catalog-map-theme-scope`, and takes every colour, font, and spacing value from the kit tokens of that scope. Chart widgets build the ECharts theme `frontx-dashboard` from the kit tokens: colours, typography, axes, and tooltips. They register it in their own ECharts copy and build and register it again on every theme change. The dashboards root registers no chart theme and has no ECharts dependency. Grid row colours are kit tokens.

**No meaning by colour alone.** Grid row colours carry a meaning icon with an accessible name. Chart series and pie segments are named in the legend and the tooltip. The heatmap shows its scale with numbers. Progress items show their values as text. The trend shows a direction icon with its value.

## 7. Acceptance Criteria

- [ ] `cfs validate --artifact` reports no structural errors for this document.
- [ ] Every type of section 6 is authored with its full JSON Schema. Every identifier follows the GTS grammar, uses the FrontX vendor `frontx` and the package `dashboard_m`, and every `x-gts-instance-ref` and `x-gts-type-ref` operand is a literal type id that is valid under GTS v0.17.
- [ ] The widget base is abstract, requires `id` and `title`, and declares no traits. The data widget is abstract, requires `data`, and declares `data_shape` and `fill` as required traits and `member_kinds` as an optional trait. `markdown_card` derives from the widget base directly.
- [ ] Given a widget instance whose `id` is a widget type followed by a UUID and whose fields are valid, when it is validated, then it passes. Given the same widget with one misspelled presentation field, then it fails validation, for each of the 9 concrete widget types.
- [ ] Given a `markdown_card` with a `data` field, when it is validated, then it fails.
- [ ] Given each of the 8 data widget types, when one accepted query and one rejected query are validated, then the accepted query passes and the rejected query fails. The rejected queries include a second dimension on a `pie_chart`, one measure on a `progress_list_card`, a dimension on a `summary_card`, a `granularity` on a `heatmap`, a `granularity` on a `ranked_list_card`, a `compare` on a `grid`, and a `grid` with no `limit`.
- [ ] Given a `cartesian_chart` with one measure and `time` with `granularity`, with one measure and one dimension and no `granularity`, with two measures and `time` with `granularity` and no dimension, or with two measures and one dimension and no `granularity`, when it is validated, then it passes. Given two measures and two dimensions, or two measures with a dimension and a `granularity`, then it fails.
- [ ] Given a `grid` whose `page_sizes` is missing, or holds a value above 500, or whose `data.limit` is not one of the `page_sizes` values, when it is validated and cross-checked, then it fails.
- [ ] Given a widget whose `order` names a member that is not in the query, when the domain owner cross-checks it, then it fails and its cell shows "This widget cannot be shown".
- [ ] Given a `pie_chart` whose dimension has the `value_type` `time`, when the domain owner cross-checks it, then it fails the member-kind check.
- [ ] Given, in turn, a `grid` whose `columns` names a member twice, leaves a query member out, or names a member that is not in the query; a `column_groups` entry naming a member that is not a column; a group over `c1` and `c3` with `c2` between them; a column in two groups; a `row_color` that is not a column; a sortable column whose member the dataset does not allow in `order`; or a `limit` that is not one of `page_sizes`, a member repeated within one group, when the domain owner cross-checks it, then in each case the widget fails, its cell shows the placeholder, and the other cells are unaffected.
- [ ] Given a `cartesian_chart` whose `series` names a member that is not a measure of the query, or names the same measure twice, when the domain owner cross-checks it, then the widget fails. Given a measure with no `series` entry, then it is drawn as bars on the primary y axis.
- [ ] Given a `heatmap` whose `min_value` is greater than its `max_value`, when the domain owner cross-checks it, then the widget fails.
- [ ] Given a failure of the GTS validation of the dashboard whose instance path lies under the `widget` of a cell, then that cell shows the placeholder and the other cells are unaffected. Given a failure at any other path, then the dashboard-level placeholder shows.
- [ ] Given a `larger_view` widget that fails a cross-check, when its larger view opens, then the larger-view modal shows the placeholder and the dashboard is unchanged.
- [ ] Given a data widget that has just received its context, when it has not received an answer, then it shows the loader "Loading", has sent exactly one `request_data`, and its larger-view button, if its context carries `larger_view`, is shown.
- [ ] Given a data widget whose answer has no rows, then it shows "No data to show". Given a `grid` with no rows, then the column headings stay above it.
- [ ] Given a `metric_card` whose answer has a null `value`, then it shows "No data to show". Given a `summary_card`, a `ranked_list_card`, or a `grid` answer with a null measure value, then that value shows as empty and the other values show.
- [ ] Given a `markdown_card`, when its context arrives, then it shows its body at once, sends no `request_data`, and shows no loader or empty state.
- [ ] Given a `markdown_card` whose body holds a heading, a raw `<b>` tag, a link with an `https` target, a link with a `mailto` target, and an image, when it renders, then the heading is formatted, no element is created from the raw tag and the tag shows as plain text, the links open in a new browsing context without access to the opener, and the image is shown with its alt text as accessible name.
- [ ] Given a `markdown_card` whose body holds links with the targets `javascript:alert(1)`, `JavaScript:alert(1)`, and ` javascript:alert(1)` (leading space), when it renders, then no link is active and each shows its text as plain text.
- [ ] Given a widget whose title, a label, or a chart tooltip value holds `<img src=x onerror=alert(1)>`, when it renders, then the text is shown as text and no element is created.
- [ ] Given a data widget that never gets an answer, then it keeps its loader with no error message and no Retry. Given an answer that FrontX rejects, then the widget also keeps its loader.
- [ ] Given a `grid` showing the first page, when the viewer clicks a sortable header, then one `request_data` is sent with the new `order` and `offset` 0, the current rows stay visible under "Updating", and the new rows replace them when the answer for that request arrives. Given the header of the column that `order` already names first, when the viewer clicks it, then the direction is reversed, and given any other sortable header, then the new `order` has that one member in ascending direction and only that header shows a sort state.
- [ ] Given a `grid` in Busy, when the viewer clicks another sortable header, then a second `request_data` is sent with a newer timestamp, the widget stays in Busy, the answer of the first request is dropped, and the answer of the second ends Busy.
- [ ] Given the same `grid`, when the viewer uses a page control, then one `request_data` is sent with the new `offset`. When the viewer chooses a page size, then one is sent with the new `limit` and `offset` 0. In each case, an answer whose timestamp is not the latest is dropped.
- [ ] Given a `grid`, when the viewer resizes a column, then the grid redraws, no `request_data` is sent, and the widget instance is unchanged.
- [ ] Given a `grid` with a column whose `align` is `end`, one whose `format.notation` is `compact` over a number-valued member, one over a percent member with `compact`, and one with a `title`, when it renders, then the first body is end-aligned, the number is abbreviated, the percent still shows as a percentage, and the heading shows the title instead of the member's title.
- [ ] Given a `grid` with 8 columns and `frozen_columns` 2, when the viewer scrolls to the last column, then the first 2 columns stay visible. With `frozen_columns` 0 or absent, all columns scroll.
- [ ] Given a `grid` whose `column_groups` lists a group "Group B" over `c5` and `c6` before a group "Group A" over `c3` and `c4`, when it renders, then a heading row shows "Group A" once over `c3` and `c4` and "Group B" once over `c5` and `c6`, in column position.
- [ ] Given a `grid` with `row_color` set to a column whose values are "error", "Error", "unknown", and null, when it renders in the light scope, then the "error" row takes the error token background of the light scope and shows the error icon with its accessible name, and the other rows show no colour and no icon. When the host theme switches to dark, then the "error" row takes the error token background of the dark scope and no request is sent.
- [ ] Given a `grid` page of 500 rows, when the viewer scrolls from the first row to the last, then only the rows in view are rendered and the view stays responsive in the light and the dark scope (`cpt-frontx-dashboard-nfr-large-table`).
- [ ] Given a `grid`, when it is inspected, then ARIA grid semantics expose the row count and the row positions of virtualized rows, the sort state of each sortable header, and the sort, page, page size, and resize controls can be operated with the keyboard alone.
- [ ] Given a `metric_card` whose query sets `time.compare` to `previous_period` and whose answer has `value` and `previous_value`, when it renders, then it shows the trend computed from the two values with a direction icon. Given a null `previous_value`, then it shows the headline and no trend.
- [ ] Given a `metric_card` with `value_label` "Open alerts", then the caption shows it, and without `value_label` the caption is the measure's title.
- [ ] Given a `summary_card` with 3 measures, when it renders, then it shows 3 lines in query order, each with the member's title and its formatted value, and a null value as an empty value.
- [ ] Given a `ranked_list_card` with `value_label` and `secondary_label`, when it renders, then the two headings show these labels. Given a query with one measure, then no secondary value and no secondary heading show.
- [ ] Given a `progress_list_card` with rows (current 120, target 100), (50, 100), (10, null), and (null, 100), when it renders, then the first bar is full, the second is half full, the third and the fourth are empty, and every value shows as text, empty for a null.
- [ ] Given a `pie_chart` with `radius` ["40%", "70%"] and `rose_type` `area`, when it renders, then it draws a donut as a rose by area. Given `radius` ["big"], then validation fails.
- [ ] Given a `heatmap` with `min_value` 0, `max_value` 100, and `show_cell_values` true, when it renders, then the colour scale runs from 0 to 100 and each cell shows its value. Given `min_value` and `max_value` absent, then the scale takes the lowest and the highest value in the rows.
- [ ] Given a `cartesian_chart` with two measures and a `series` entry for each, one drawn as bars and one as a line on the secondary y axis, when it renders, then the legend names both series and a null value is a gap in the line.
- [ ] Given a cell widget whose context carries `larger_view`, when it is in its loader, data, or empty state, then it shows the larger-view button. When the viewer presses it, then the chain of `cpt-frontx-dashboard-algo-extension-domain-catalog-open-larger-view-chain` runs with the ids from `larger_view`; the chain carries `history: "none"`.
- [ ] Given a cell widget whose context carries no `larger_view`, then it shows no button. Given a widget in the larger view, then it shows no button.
- [ ] Given a chart widget, when the host theme switches from light to dark, then the widget builds and registers the ECharts theme `frontx-dashboard` from the dark kit tokens, and no request is sent, no loader shows, and nothing is remounted.
- [ ] Given each host theme id that `template-shell` ships, when a widget maps it, then it selects the kit scope of that theme. Given an unrecognised id, then the widget selects the light scope.
- [ ] Given the reference dashboard, when all 9 widget types are inspected in both scopes, in a cell and in the larger view, against the design-system reference, then every colour, font, and spacing value comes from kit tokens (`cpt-frontx-dashboard-nfr-visual-quality`), and no widget conveys meaning by colour alone (`cpt-frontx-dashboard-nfr-accessibility`).
- [ ] Given the reference dashboard on a cold load, when the cell widgets mount, then each data widget shows its loader and each `markdown_card` shows its body without waiting for any answer, within the initial render target (`cpt-frontx-dashboard-nfr-initial-render`).
