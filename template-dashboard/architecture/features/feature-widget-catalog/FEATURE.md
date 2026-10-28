---
status: accepted
version: 1
date: 2026-10-27
description: Domain-model types of the abstract widget base with its typed source and of the 9 subject-agnostic template widget types with their column bindings, declared by dashboard-viewer, plus the grid presentation, the markdown card safety rule, and the shared widget chrome.
---

# Feature: Widget Catalog


<!-- toc -->

- [1. Feature Context](#1-feature-context)
  - [1.1 Overview](#11-overview)
  - [1.2 Purpose](#12-purpose)
  - [1.3 Actors](#13-actors)
  - [1.4 References](#14-references)
- [2. Actor Flows (CDSL)](#2-actor-flows-cdsl)
  - [Domain-Model Feature: No Actor Flows](#domain-model-feature-no-actor-flows)
- [3. Processes / Business Logic (CDSL)](#3-processes--business-logic-cdsl)
  - [Check a Result Against the Column Binding](#check-a-result-against-the-column-binding)
  - [Check a Grid Configuration](#check-a-grid-configuration)
- [4. States (CDSL)](#4-states-cdsl)
  - [Domain-Model Feature: No State Machines](#domain-model-feature-no-state-machines)
- [5. Definitions of Done](#5-definitions-of-done)
  - [Domain Model Definition of Done](#domain-model-definition-of-done)
  - [Column Binding and Empty State](#column-binding-and-empty-state)
  - [Grid Presentation](#grid-presentation)
  - [Markdown Card Rendering Safety](#markdown-card-rendering-safety)
  - [Shared Widget Chrome](#shared-widget-chrome)
- [6. Domain Model](#6-domain-model)
  - [6.0 Widget (abstract base)](#60-widget-abstract-base)
  - [6.1 SummaryCard](#61-summarycard)
  - [6.2 MetricCard](#62-metriccard)
  - [6.3 RankedListCard](#63-rankedlistcard)
  - [6.4 ProgressListCard](#64-progresslistcard)
  - [6.5 Grid](#65-grid)
  - [6.6 CartesianChart](#66-cartesianchart)
  - [6.7 PieChart](#67-piechart)
  - [6.8 Heatmap](#68-heatmap)
  - [6.9 MarkdownCard](#69-markdowncard)
  - [6.10 Shared Widget Chrome and States](#610-shared-widget-chrome-and-states)
- [7. Acceptance Criteria](#7-acceptance-criteria)

<!-- /toc -->

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-featstatus-widget-catalog`
## 1. Feature Context

- [ ] `p2` - `cpt-frontx-dashboard-feature-widget-catalog`

### 1.1 Overview

This feature is a **domain-model feature**, declared in package `dashboard-viewer`. It declares the abstract widget base and the 9 template widget types `gts.frontx.m.widget.widget.v1~frontx.m.widget.<widget_type>.v1~`, all under the FrontX vendor `frontx`. Each widget type is a presentation schema with a column binding: for each role, its configuration names the result column that fills it. The feature also fixes the presentation rules that every widget type shares: the `grid` presentation, the rendering safety of `markdown_card`, and the shared widget chrome with its per-widget states and its larger-view button. The structural prose lives in DESIGN section 3.1; the types and rules live in section 6. Section 3 holds the two checks that this feature defines: the run-time column-binding check and the grid configuration checks.

### 1.2 Purpose

A dashboard embeds one widget instance in each layout cell. The consuming product writes or generates the dashboard, and its backend returns it; every widget instance in it validates against the types of this catalog. A widget instance carries its `id`, its `title`, its typed `source`, and the presentation configuration of its widget type. The `source` names a backend metric, with an optional time window and an optional bucketing flag. The widget builds its widget data request from it, receives one generic tabular result, and shows it through its column binding. The template passes `source` through unchanged and gives it no meaning. A widget instance is identified only by its GTS `id`; it has no name of its own.

Every widget type is subject-agnostic: the subject comes from the metric and the bound columns, not from the widget type. In this version a consuming product adds no widget types and no widget settings. It can change how a template widget type is shown only through a replacement realization (feature-mfe-entries).

The feature addresses the widget catalog, the larger view, the loading and error states, the large-table target, and the domain model of the PRD, and the Widget entity of DESIGN section 3.1.

**Requirements**: `cpt-frontx-dashboard-fr-widget-catalog`, `cpt-frontx-dashboard-fr-domain-model`, `cpt-frontx-dashboard-fr-widget-modal`, `cpt-frontx-dashboard-fr-backend-source`, `cpt-frontx-dashboard-fr-loading-error-states`, `cpt-frontx-dashboard-nfr-large-table`

**Use cases**: `cpt-frontx-dashboard-usecase-provide-dashboard` (the widget types that a consuming product describes each widget of a dashboard with, and the grid configuration checks it runs before the dashboard is shown; the other features named in DECOMPOSITION cover the remaining steps)

**Principles**: `cpt-frontx-dashboard-principle-render-only-viewer`, `cpt-frontx-dashboard-principle-gts-contracts`, `cpt-frontx-dashboard-principle-per-instance-isolation`

### 1.3 Actors

| Actor | Role in Feature |
|-------|-----------------|
| `cpt-frontx-dashboard-actor-template-consumer` | Writes or generates widget instances against these types, and checks at authoring time that each metric exists and returns the bound columns |
| `cpt-frontx-dashboard-actor-dashboard-viewer` | Sees each widget in its cell, opens its larger view, and selects Retry after a temporary failure |

No actor flows are authored here: opening a dashboard, Retry, and opening a larger view are flows of feature-backend-contract.

### 1.4 References

- **PRD**: [PRD.md](../../PRD.md)
- **Design**: [DESIGN.md](../../DESIGN.md) section 3.1 (Domain Model, Abstract Bases and Concrete Types) and section 3.2 (Widget Library)
- **ADRs**: [ADR-0003](../../ADR/0003-shared-data-types-and-schemas-v1.md), [ADR-0004](../../ADR/0004-charting-library-v1.md), [ADR-0005](../../ADR/0005-data-grid-library-v1.md), [ADR-0006](../../ADR/0006-theme-distribution-v1.md), [ADR-0007](../../ADR/0007-extension-domain-taxonomy-v1.md), [ADR-0008](../../ADR/0008-widget-type-and-mfe-realization-v1.md), [ADR-0009](../../ADR/0009-subject-agnostic-widget-catalog-v1.md), [ADR-0011](../../ADR/0011-backend-delivered-dashboard-v1.md)
- **Declaring package**: `dashboard-viewer` (`src-app/mfe_packages/dashboard-viewer/`)
- **Dependencies**: None. The widget types do not reference the widget data type, and package `m` holds no reference into package `v`.
- **Related**:
  - [feature-widget-data-catalog](../feature-widget-data-catalog/FEATURE.md): the single widget data type whose column names the bindings refer to. It is an independent feature; neither depends on the other.
  - [feature-backend-contract](../feature-backend-contract/FEATURE.md): section 6.1 runs the grid configuration checks of section 3 on each dashboard result; section 6.2 specifies the widget data request built from `source` and its result; section 6.3 gives the failure classes and the default wording of the per-widget states.
  - [feature-layout-types](../feature-layout-types/FEATURE.md): each layout cell embeds one widget instance, checked against the widget base.
  - [feature-mfe-entries](../feature-mfe-entries/FEATURE.md): the widget realizations, cell entries, and modal entries that show these widget types, and the replacement realization.
  - [feature-extension-domain-catalog](../feature-extension-domain-catalog/FEATURE.md): the `set_widget_context` action that hands a widget its instance and, in a cell, its `modal` target.

## 2. Actor Flows (CDSL)

### Domain-Model Feature: No Actor Flows

N/A. The catalog is consumed at runtime by the type system and by the widget entries. The dashboard viewer's flows (open a dashboard, Retry, open a larger view) are authored in feature-backend-contract.

## 3. Processes / Business Logic (CDSL)

### Check a Result Against the Column Binding

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-algo-widget-catalog-check-column-binding`

**Input**: One widget instance and one widget data result that has already validated against the single widget data type (feature-widget-data-catalog).

**Output**: The data to present, the widget type's empty state, or the cannot-show state with a diagnostic.

**Steps**:
1. [ ] - `p1` - **IF** a row of the result holds more or fewer values than there are column names, or a name in `percent_columns` is not among the column names **RETURN** cannot-show with a diagnostic that names the misaligned rows by their zero-based index or the unknown percentage columns, showing nothing of the result - `inst-return-misaligned`
2. [ ] - `p1` - Take the widget type from the rightmost type of the widget's `id` chain - `inst-take-widget-type`
3. [ ] - `p1` - Collect the bound columns that the widget's configuration names for its widget type (section 6), including every optional binding that the configuration sets - `inst-collect-bound-columns`
4. [ ] - `p1` - **FOR EACH** bound column - `inst-for-each-bound-column`
   1. [ ] - `p1` - **IF** the column is not among the result's column names, note it as missing - `inst-note-missing-column`
5. [ ] - `p1` - **IF** any bound column is missing **RETURN** cannot-show with a diagnostic that names every missing column, showing nothing of the result - `inst-return-missing-column`
6. [ ] - `p1` - **IF** the result has no rows **RETURN** the widget type's empty state - `inst-return-empty-no-rows`
7. [ ] - `p1` - **IF** the widget type is `markdown_card` and the first row's `body` value is null or an empty string **RETURN** the empty state - `inst-return-empty-markdown`
8. [ ] - `p1` - **RETURN** the data, with each role read from the position of its bound column in every row - `inst-return-bound-data`

Validation against the widget data type cannot check that the rows align with the column names, or that the percentage columns are among them (feature-widget-data-catalog section 6.1), so step 1 checks both right after it.

### Check a Grid Configuration

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-algo-widget-catalog-check-grid-configuration`

**Input**: One `grid` widget instance from a dashboard that has passed schema validation. The Viewer host runs this check for every `grid` widget when it opens the dashboard, together with the layout checks (feature-layout-types section 6.3).

**Output**: Pass, or a failure naming the widget and the failing column or group.

**Steps**:
1. [ ] - `p1` - **IF** `columns` holds the same `key` twice **RETURN** failure naming the widget and the repeated key - `inst-fail-repeated-key`
2. [ ] - `p1` - **FOR EACH** group in `column_groups` - `inst-for-each-column-group`
   1. [ ] - `p1` - **IF** the group's `column_keys` is empty **RETURN** failure naming the widget and the group - `inst-fail-empty-group`
   2. [ ] - `p1` - **IF** an entry of `column_keys` matches no `key` in `columns` **RETURN** failure naming the widget, the group, and the entry - `inst-fail-unknown-key`
   3. [ ] - `p1` - **IF** a column of the group is also named by another group **RETURN** failure naming the widget, the column, and both groups - `inst-fail-column-in-two-groups`
   4. [ ] - `p1` - **IF** the group's columns are not contiguous in `columns` order **RETURN** failure naming the widget and the group - `inst-fail-not-contiguous`
3. [ ] - `p1` - **RETURN** pass - `inst-return-grid-pass`

A failure makes the whole dashboard one that cannot be shown: no cells, a diagnostic naming the widget and the failing column or group, and no Retry (feature-backend-contract section 6.3).

## 4. States (CDSL)

### Domain-Model Feature: No State Machines

N/A. Type declarations are stateless. The per-widget states that the shared chrome shows (section 6.10) follow the failure classes of feature-backend-contract section 6.3.

## 5. Definitions of Done

### Domain Model Definition of Done

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-dod-widget-catalog-catalog-complete`

The system **MUST** declare the abstract widget base and the 9 template widget types of section 6 under the FrontX vendor `frontx`, in `dashboard-viewer`.

- Every type passes the GTS identifier grammar and GTS v0.17 schema validation, including its `x-gts-instance-ref` operand.
- The widget base is abstract (`x-gts-abstract: true`), requires `id`, `title`, and `source`, and declares no traits. `id` is constrained with `x-gts-instance-ref: "/$id"`.
- `source` requires `metric`, a non-empty string that names a backend metric and is not a GTS identifier or reference. It allows an optional `range` and an optional boolean `bucket`, and nothing else.
- Widget instance identifiers are combined anonymous instance identifiers: the type chain followed by a UUID that the consuming product backend generates. No widget carries a separate `type` field or a name of its own.
- Each of the 9 widget types derives from the widget base and declares its column binding fields as DESIGN section 3.1 lists them. No widget type references a widget data type.
- No widget type declares a field for user-driven column resizing, sorting, grouping, paging, or filtering in the browser, no display limit, no field for drill-down or the larger view, and no field that hides or cuts off delivered content. The `width` and `align` of a `grid` column are presentation hints, not controls for the dashboard viewer.
- No consumer-derived widget type exists: every widget instance's `id` chain ends at one of the 9 template widget types.

**Constraints**: `cpt-frontx-dashboard-constraint-gts-id-convention`

**Touches**:
- Entities: `Widget`

### Column Binding and Empty State

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-dod-widget-catalog-column-binding`

The system **MUST** check every widget data result against the widget's column binding before it shows anything, and **MUST** show the widget type's empty state for a result with no rows.

- A misaligned result, in which a row's length differs from the number of column names or a percentage column is not among them, gives the cannot-show state with a diagnostic, and shows nothing of the result.
- A result that lacks a bound column gives the cannot-show state with a diagnostic that names the missing columns, and shows nothing of the result. Other widgets are unaffected.
- A result with no rows is not a failure: the widget shows its widget type's empty state. A `markdown_card` also shows it when the first-row `body` value is null or an empty string.
- Each role reads its value by the position of its bound column in each row; the widget does not compute, aggregate, narrow, re-order, page, hide, or cut off the result.

**Implements**:
- `cpt-frontx-dashboard-algo-widget-catalog-check-column-binding`

**Touches**:
- Entities: `Widget`

### Grid Presentation

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-dod-widget-catalog-grid-presentation`

The system **MUST** show every `grid` widget with the grid presentation of section 6.5, and **MUST** run the grid configuration checks for every `grid` widget when the dashboard opens.

- Cells show their values as text; frozen leading columns, grouped column headings, and row coloring apply as configured.
- With `row_color_column` set, a row whose value is one of the color meanings, matched exactly, takes the ui-kit token of that meaning in the active light or dark scope, so row colors follow the host theme without a new request, and shows an icon of its meaning with an accessible name. A null or any other value leaves the row uncolored.
- The grid shows every delivered row in the delivered order, virtualized, and stays responsive with up to 5,000 rows without paging (`cpt-frontx-dashboard-nfr-large-table`).
- The grid offers no user-driven column resizing, sorting, grouping, paging, or filtering in the browser, and no display limit; the `width` and `align` of a column are presentation hints.

**Implements**:
- `cpt-frontx-dashboard-algo-widget-catalog-check-grid-configuration`

**Touches**:
- Entities: `Widget`

### Markdown Card Rendering Safety

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-dod-widget-catalog-markdown-safety`

The system **MUST** show the `body` of the first row of a `markdown_card` result with its markdown formatting, and **MUST** show embedded HTML as plain text, as section 6.9 specifies.

- Links with an allowed target work; links with any other target show their text as plain text.
- Images are not loaded: an image shows its alt text, or nothing when it has none.
- This is the single exception to showing delivered content in full.

**Touches**:
- Entities: `Widget`

### Shared Widget Chrome

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-dod-widget-catalog-widget-chrome`

The system **MUST** give every widget type the shared widget chrome of section 6.10: the title, the larger-view button in every cell widget and every state, and the per-widget skeleton, data, empty, error, and cannot-show states.

- The larger-view button is always shown in a cell, because every cell widget's `set_widget_context` carries `modal`; it is never shown in the larger view.
- An error offers Retry, and a Retry is classified like the first request; the cannot-show state offers no Retry.
- No widget conveys meaning by color alone.
- Each widget localizes its own wording and formats values for the host language, with the values of percentage columns shown as percentages, where 1 means 100%.
- The empty state shows the default wording "No data to show", the same for every widget type.

**Touches**:
- Entities: `Widget`

## 6. Domain Model

### 6.0 Widget (abstract base)

**GTS ID**: `gts.frontx.m.widget.widget.v1~`

**Description**: Abstract base type (`x-gts-abstract: true`) of the 9 template widget types. It declares the fields that every widget type shares: the instance identifier `id`, the display `title`, and the typed `source`. It declares no traits. A widget instance carries its whole presentation configuration and its `source`; its data is not part of the dashboard. The base is never instantiated directly.

**Schema**:

```json
{
  "$id": "gts://gts.frontx.m.widget.widget.v1~",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "Widget",
  "description": "Abstract base of the 9 template widget types. Declares the instance identifier, the display title, and the typed source that names the backend metric the widget requests.",
  "x-gts-abstract": true,
  "type": "object",
  "required": ["id", "title", "source"],
  "properties": {
    "id": {
      "type": "string",
      "x-gts-instance-ref": "/$id",
      "description": "Combined anonymous instance identifier: the widget's type chain followed by a UUID that the consuming product backend generates, for example gts.frontx.m.widget.widget.v1~frontx.m.widget.grid.v1~<uuid>. The rightmost type of the chain is the widget type. The widget has no other identifier and no name of its own."
    },
    "title": {
      "type": "string",
      "description": "Display title shown in the widget chrome, as delivered."
    },
    "source": {
      "type": "object",
      "required": ["metric"],
      "additionalProperties": false,
      "description": "What the widget requests. The template passes these values to the backend unchanged and gives them no meaning.",
      "properties": {
        "metric": {
          "type": "string",
          "minLength": 1,
          "description": "Name of a backend metric. A plain string, not a GTS identifier or reference, because metrics are run-time data of the backend."
        },
        "range": {
          "description": "Optional time window, in the form the backend defines."
        },
        "bucket": {
          "type": "boolean",
          "description": "Optional bucketing flag."
        }
      }
    }
  }
}
```

**Cross-references**:
- Widget types: each of the 9 widget types below extends this base through `allOf` `$ref` to `gts://gts.frontx.m.widget.widget.v1~` and adds its presentation configuration with its column binding. Because the base is abstract, every widget instance identifier names one of the 9 widget types as its rightmost type. No consumer-derived widget type exists in this version; consumer widget types are a later stage (DESIGN section 4).
- Conceptual definition: DESIGN section 3.1 (Abstract Bases and Concrete Types).
- Data request: after a widget receives `set_widget_context`, it builds its widget data request from `source` and sends it through the FrontX API package, as feature-backend-contract section 6.2 specifies. The request carries `metric`, and `range` and `bucket` when set, and no widget type. The result is one generic tabular result: the ordered column names, the rows as positional value arrays, and the names of the percentage columns. It validates against the single widget data type (feature-widget-data-catalog) and then passes the column-binding check of section 3.
- Authoring and run time: the consuming product checks, when it writes or generates a dashboard, that each `source.metric` exists and returns every column that the widget binds. The widget checks the bound columns again at run time and shows its cannot-show state when one is missing, never wrong content (ADR-0009).
- Larger view: the shared widget chrome of every widget type carries the larger-view button (section 6.10). The schema declares no field for it.

### 6.1 SummaryCard

**GTS ID**: `gts.frontx.m.widget.widget.v1~frontx.m.widget.summary_card.v1~`

**Description**: A card with a list of label and value lines, one line per result row, in the delivered order.

**Schema**:

```json
{
  "$id": "gts://gts.frontx.m.widget.widget.v1~frontx.m.widget.summary_card.v1~",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "SummaryCard",
  "description": "A card with one label and value line per result row, in the delivered order. The subject comes from the metric and the bound columns, not from the widget type.",
  "allOf": [
    { "$ref": "gts://gts.frontx.m.widget.widget.v1~" },
    {
      "type": "object",
      "required": ["label", "value"],
      "properties": {
        "label": { "type": "string", "minLength": 1, "description": "Bound column whose value is the line label." },
        "value": { "type": "string", "minLength": 1, "description": "Bound column whose value is the line value." }
      }
    }
  ]
}
```

**Cross-references**:
- Abstract base: `gts.frontx.m.widget.widget.v1~` (section 6.0).
- Bound columns: `label`, `value`.
- Presentation: every row is one line, in the delivered order; a null value shows as an empty value.

### 6.2 MetricCard

**GTS ID**: `gts.frontx.m.widget.widget.v1~frontx.m.widget.metric_card.v1~`

**Description**: A card with one headline value, an optional trend, and an optional sparkline.

**Schema**:

```json
{
  "$id": "gts://gts.frontx.m.widget.widget.v1~frontx.m.widget.metric_card.v1~",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "MetricCard",
  "description": "A card with one headline value from the first row, an optional trend from the first row, and an optional sparkline over all rows.",
  "allOf": [
    { "$ref": "gts://gts.frontx.m.widget.widget.v1~" },
    {
      "type": "object",
      "required": ["value"],
      "properties": {
        "value": { "type": "string", "minLength": 1, "description": "Bound column whose value in the first row is the headline value." },
        "trend": { "type": "string", "minLength": 1, "description": "Optional bound column whose value in the first row is the signed change shown next to the headline value." },
        "sparkline": { "type": "string", "minLength": 1, "description": "Optional bound column whose values over all rows, in the delivered order, form the sparkline." },
        "value_label": { "type": "string", "description": "Optional caption shown next to the headline value." }
      }
    }
  ]
}
```

**Cross-references**:
- Abstract base: `gts.frontx.m.widget.widget.v1~` (section 6.0).
- Bound columns: `value`, and `trend` and `sparkline` when set.
- Presentation: the trend shows a direction icon (up for a positive value, down for a negative value, flat for zero) together with the formatted value, so its meaning does not depend on color. The sparkline draws one point per row, in the delivered order; a null value is a gap.

### 6.3 RankedListCard

**GTS ID**: `gts.frontx.m.widget.widget.v1~frontx.m.widget.ranked_list_card.v1~`

**Description**: A card with a ranked list: one item per result row, ranked by its delivered position.

**Schema**:

```json
{
  "$id": "gts://gts.frontx.m.widget.widget.v1~frontx.m.widget.ranked_list_card.v1~",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "RankedListCard",
  "description": "A card with one ranked item per result row: the rank is the row's delivered position, followed by the label, the value, and an optional secondary value.",
  "allOf": [
    { "$ref": "gts://gts.frontx.m.widget.widget.v1~" },
    {
      "type": "object",
      "required": ["label", "value"],
      "properties": {
        "label": { "type": "string", "minLength": 1, "description": "Bound column whose value is the item label." },
        "value": { "type": "string", "minLength": 1, "description": "Bound column whose value is the primary value." },
        "secondary": { "type": "string", "minLength": 1, "description": "Optional bound column whose value is shown as the secondary value." },
        "value_label": { "type": "string", "description": "Optional heading of the primary value." },
        "secondary_label": { "type": "string", "description": "Optional heading of the secondary value." }
      }
    }
  ]
}
```

**Cross-references**:
- Abstract base: `gts.frontx.m.widget.widget.v1~` (section 6.0).
- Bound columns: `label`, `value`, and `secondary` when set.
- Presentation: the first row has rank 1, the second rank 2, and so on; the widget does not re-rank or re-order the rows.

### 6.4 ProgressListCard

**GTS ID**: `gts.frontx.m.widget.widget.v1~frontx.m.widget.progress_list_card.v1~`

**Description**: A card with one progress bar per result row, showing the current value against the target.

**Schema**:

```json
{
  "$id": "gts://gts.frontx.m.widget.widget.v1~frontx.m.widget.progress_list_card.v1~",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "ProgressListCard",
  "description": "A card with one progress item per result row, in the delivered order: the label, a bar for the current value against the target, and both values as text.",
  "allOf": [
    { "$ref": "gts://gts.frontx.m.widget.widget.v1~" },
    {
      "type": "object",
      "required": ["label", "current", "target"],
      "properties": {
        "label": { "type": "string", "minLength": 1, "description": "Bound column whose value is the item label." },
        "current": { "type": "string", "minLength": 1, "description": "Bound column whose value is the progress reached." },
        "target": { "type": "string", "minLength": 1, "description": "Bound column whose value is the target, the full length of the bar." }
      }
    }
  ]
}
```

**Cross-references**:
- Abstract base: `gts.frontx.m.widget.widget.v1~` (section 6.0).
- Bound columns: `label`, `current`, `target`.
- Presentation: the bar fills in proportion to current over target and is full when current reaches or exceeds the target. With a null or zero target the bar stays empty. The current and target values are always shown as text, so the bar does not carry meaning alone. Bar colors come from ui-kit tokens of the active scope.

### 6.5 Grid

**GTS ID**: `gts.frontx.m.widget.widget.v1~frontx.m.widget.grid.v1~`

**Description**: A render-only table over the result rows, built on TanStack Table (ADR-0005).

**Schema**:

```json
{
  "$id": "gts://gts.frontx.m.widget.widget.v1~frontx.m.widget.grid.v1~",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "Grid",
  "description": "A render-only table: one row per result row, in the delivered order, and one column per entry of columns, each bound to a result column. Frozen leading columns, grouped column headings, and row coloring are fixed by this configuration.",
  "allOf": [
    { "$ref": "gts://gts.frontx.m.widget.widget.v1~" },
    {
      "type": "object",
      "required": ["columns"],
      "properties": {
        "columns": {
          "type": "array",
          "minItems": 1,
          "description": "Displayed columns, in display order, at least one, with unique keys (checked by the grid configuration checks).",
          "items": {
            "type": "object",
            "required": ["key", "label"],
            "properties": {
              "key": { "type": "string", "minLength": 1, "description": "Bound result column whose values fill this column. Unique within columns." },
              "label": { "type": "string", "description": "Column heading, shown as delivered." },
              "width": { "type": "string", "description": "Optional width hint, for example '120px' or '1fr'." },
              "align": { "type": "string", "enum": ["left", "right", "center"], "description": "Optional alignment of the column body. When absent, the column body is leading-aligned." }
            }
          }
        },
        "frozen_columns": {
          "type": "integer",
          "minimum": 0,
          "description": "Number of leading columns kept visible during horizontal scrolling. 0 or absent freezes no column."
        },
        "column_groups": {
          "type": "array",
          "description": "Grouped column headings: each group shows one heading above contiguous columns. A heading only; it does not group, sort, or re-order rows.",
          "items": {
            "type": "object",
            "required": ["label", "column_keys"],
            "properties": {
              "label": { "type": "string", "description": "Group heading shown above its columns." },
              "column_keys": {
                "type": "array",
                "items": { "type": "string" },
                "description": "Keys of the columns in this group, at least one: each matches a key in columns, the columns are contiguous in columns order, and no other group names them (checked by the grid configuration checks)."
              }
            }
          }
        },
        "row_color_column": {
          "type": "string",
          "minLength": 1,
          "description": "Optional bound result column whose value in each row names that row's color meaning: success, warning, error, or info, matched exactly. A null or any other value colors nothing."
        }
      }
    }
  ]
}
```

**Cross-references**:
- Abstract base: `gts.frontx.m.widget.widget.v1~` (section 6.0).
- Bound columns: every `columns[].key`, and `row_color_column` when set. A result column that `columns` does not name is not shown.
- Source: `cpt-frontx-dashboard-fr-widget-catalog` anchors frozen columns, grouped column headings, and row coloring by color meaning; `cpt-frontx-dashboard-nfr-large-table` anchors large grids.
- Columns: the grid shows the columns of `columns` in that order, with the heading `label`, the optional `width`, and the alignment `align` of each; without `align`, the column body is leading-aligned.
- Cells: each cell shows its value as text and is never cut off; long text wraps within its column. Numbers are formatted for the host language, the values of a percentage column are formatted as percentages (a fraction where 1 means 100%, so 0.385 shows as 38.5%), and a null value shows an empty cell. The grid has no cell renderers: no badges, links, or sparklines in cells.
- Configuration checks: the Viewer host runs the grid configuration checks of section 3 for every `grid` widget when it opens the dashboard. A failure makes the whole dashboard one that cannot be shown, with a diagnostic naming the widget and the failing column or group, and no Retry (feature-backend-contract sections 6.1 and 6.3). An empty `columns` already fails schema validation; a group with empty `column_keys` passes it and fails the grid configuration checks.
- Frozen columns: the first `frozen_columns` columns, in `columns` order, stay visible at the leading edge while the dashboard viewer scrolls the grid horizontally; the other columns scroll beneath them. A value larger than the number of columns freezes all columns.
- Grouped column headings: each group shows its `label` once, in a heading row above the column headings, spanning exactly its columns. Headings follow column position, so the order of the groups in `column_groups` has no effect. A column outside every group has an empty cell in that heading row. Without `column_groups`, the grid shows a single heading row.
- Row coloring: with `row_color_column` set, each row whose value in that column is one of the color meanings `success`, `warning`, `error`, or `info`, matched exactly and case-sensitively, takes the row background of that meaning. Each meaning maps to the ui-kit token of the same meaning in the active light or dark scope, so row colors follow a host theme switch without a new request, and cell text keeps readable contrast in both scopes (ADR-0006). A colored row also shows, at its leading edge, an icon of its meaning with an accessible name in the host language, so the meaning is not conveyed by color alone. A row whose value is null or not one of the meanings has no color and no icon. The column need not be displayed. The template defines no theme and no palette of its own. Without `row_color_column`, no row is colored.
- Row order: the grid shows every delivered row, in the delivered order. It offers no user-driven column resizing, sorting, grouping, paging, or filtering in the browser, and no display limit; `width` and `align` are presentation hints.
- Large grids: rows are virtualized, so only the rows in view are rendered. With up to 5,000 rows the grid shows all of them in one continuous scrolling body, without paging and with no paging control, and while the dashboard viewer scrolls the view never stops responding for longer than 100 ms (provisional), under the reference conditions fixed in the DESIGN (`cpt-frontx-dashboard-nfr-large-table`).
- Accessibility: the grid exposes ARIA grid semantics, including row counts and positions for virtualized rows, and can be operated with the keyboard (ADR-0005).

### 6.6 CartesianChart

**GTS ID**: `gts.frontx.m.widget.widget.v1~frontx.m.widget.cartesian_chart.v1~`

**Description**: A chart on x and y axes with one or more series, each drawn as bars, a line, an area, or scatter points (Apache ECharts, ADR-0004).

**Schema**:

```json
{
  "$id": "gts://gts.frontx.m.widget.widget.v1~frontx.m.widget.cartesian_chart.v1~",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "CartesianChart",
  "description": "A chart on x and y axes: each result row is one x position, and each series takes its value in that row from its bound column.",
  "allOf": [
    { "$ref": "gts://gts.frontx.m.widget.widget.v1~" },
    {
      "type": "object",
      "required": ["x", "series"],
      "properties": {
        "x": { "type": "string", "minLength": 1, "description": "Bound column whose value in each row is the x position." },
        "series": {
          "type": "array",
          "minItems": 1,
          "description": "Series, in legend order.",
          "items": {
            "type": "object",
            "required": ["column", "type"],
            "properties": {
              "column": { "type": "string", "minLength": 1, "description": "Bound column whose value in each row is the series value." },
              "type": { "type": "string", "enum": ["bar", "line", "area", "scatter"], "description": "How the series is drawn." },
              "label": { "type": "string", "description": "Optional series name in the legend and tooltip. When absent, the bound column name is shown." },
              "y_axis": { "type": "string", "enum": ["primary", "secondary"], "description": "Optional y axis of the series. When absent, the primary axis." },
              "stack_group": { "type": "string", "description": "Optional stack group; series with the same stack group are stacked." }
            }
          }
        },
        "x_axis": {
          "type": "object",
          "description": "Optional x-axis settings.",
          "properties": {
            "type": { "type": "string", "enum": ["category", "value", "time"], "description": "Axis type. When absent, category." },
            "label": { "type": "string", "description": "Optional axis title." }
          }
        },
        "y_axis": {
          "type": "object",
          "description": "Optional primary y-axis settings.",
          "properties": {
            "type": { "type": "string", "enum": ["value", "log"], "description": "Axis type. When absent, value." },
            "label": { "type": "string", "description": "Optional axis title." }
          }
        },
        "y_axis_secondary": {
          "type": "object",
          "description": "Optional secondary y-axis settings, used by series whose y_axis is secondary.",
          "properties": {
            "type": { "type": "string", "enum": ["value", "log"], "description": "Axis type. When absent, value." },
            "label": { "type": "string", "description": "Optional axis title." }
          }
        },
        "legend_position": { "type": "string", "enum": ["top", "right", "bottom", "left"], "description": "Optional legend position. When absent, bottom." }
      }
    }
  ]
}
```

**Cross-references**:
- Abstract base: `gts.frontx.m.widget.widget.v1~` (section 6.0).
- Bound columns: `x`, and `series[].column` for each series.
- Presentation: on a category axis the x positions follow the delivered row order; on a value or time axis they are placed by value. A null series value is a gap. Every series is named in the legend and in the tooltip, so series do not differ by color alone. Series colors and the chart theme come from ui-kit tokens of the active scope (ADR-0006).

### 6.7 PieChart

**GTS ID**: `gts.frontx.m.widget.widget.v1~frontx.m.widget.pie_chart.v1~`

**Description**: A pie or donut chart with one segment per result row (Apache ECharts, ADR-0004).

**Schema**:

```json
{
  "$id": "gts://gts.frontx.m.widget.widget.v1~frontx.m.widget.pie_chart.v1~",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "PieChart",
  "description": "A pie or donut chart: each result row is one segment, in the delivered order.",
  "allOf": [
    { "$ref": "gts://gts.frontx.m.widget.widget.v1~" },
    {
      "type": "object",
      "required": ["label", "value"],
      "properties": {
        "label": { "type": "string", "minLength": 1, "description": "Bound column whose value is the segment label." },
        "value": { "type": "string", "minLength": 1, "description": "Bound column whose value is the segment size." },
        "radius": {
          "type": "array",
          "items": { "type": "string" },
          "description": "Optional inner and outer radius, for example ['40%', '70%'] for a donut."
        },
        "rose_type": { "type": "string", "enum": ["radius", "area", "none"], "description": "Optional rose display. When absent, none." }
      }
    }
  ]
}
```

**Cross-references**:
- Abstract base: `gts.frontx.m.widget.widget.v1~` (section 6.0).
- Bound columns: `label`, `value`.
- Presentation: every segment is listed in the legend with its label and value, and the tooltip shows both, so segments do not differ by color alone. A segment with a null or zero value has no size but stays in the legend. Segment colors come from ui-kit tokens of the active scope.

### 6.8 Heatmap

**GTS ID**: `gts.frontx.m.widget.widget.v1~frontx.m.widget.heatmap.v1~`

**Description**: A two-axis grid of cells whose color shows a value (Apache ECharts, ADR-0004).

**Schema**:

```json
{
  "$id": "gts://gts.frontx.m.widget.widget.v1~frontx.m.widget.heatmap.v1~",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "Heatmap",
  "description": "A two-axis heatmap: each result row is one cell at its x and y position, colored by its value.",
  "allOf": [
    { "$ref": "gts://gts.frontx.m.widget.widget.v1~" },
    {
      "type": "object",
      "required": ["x", "y", "value"],
      "properties": {
        "x": { "type": "string", "minLength": 1, "description": "Bound column whose value is the cell's x position." },
        "y": { "type": "string", "minLength": 1, "description": "Bound column whose value is the cell's y position." },
        "value": { "type": "string", "minLength": 1, "description": "Bound column whose value sets the cell's color." },
        "x_axis_label": { "type": "string", "description": "Optional x-axis title." },
        "y_axis_label": { "type": "string", "description": "Optional y-axis title." },
        "min_value": { "type": ["number", "null"], "description": "Optional lower end of the color scale; null or absent takes the lowest value in the rows." },
        "max_value": { "type": ["number", "null"], "description": "Optional upper end of the color scale; null or absent takes the highest value in the rows." },
        "show_cell_values": { "type": "boolean", "description": "Whether to show each cell's value inside the cell." }
      }
    }
  ]
}
```

**Cross-references**:
- Abstract base: `gts.frontx.m.widget.widget.v1~` (section 6.0).
- Bound columns: `x`, `y`, `value`.
- Presentation: the x and y categories follow the order of their first appearance in the delivered rows. The heatmap shows its color scale with numbers, and the tooltip of each cell shows its x, y, and value, so values do not depend on color alone. A null value leaves its cell empty. The color scale comes from ui-kit tokens of the active scope.

### 6.9 MarkdownCard

**GTS ID**: `gts.frontx.m.widget.widget.v1~frontx.m.widget.markdown_card.v1~`

**Description**: A card that shows the markdown of the bound `body` column of the first result row.

**Schema**:

```json
{
  "$id": "gts://gts.frontx.m.widget.widget.v1~frontx.m.widget.markdown_card.v1~",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "MarkdownCard",
  "description": "A card that shows, with its markdown formatting, the value of the bound body column in the first result row. Embedded HTML is shown as plain text.",
  "allOf": [
    { "$ref": "gts://gts.frontx.m.widget.widget.v1~" },
    {
      "type": "object",
      "required": ["body"],
      "properties": {
        "body": { "type": "string", "minLength": 1, "description": "Bound column whose value in the first row is the markdown to show." }
      }
    }
  ]
}
```

**Cross-references**:
- Abstract base: `gts.frontx.m.widget.widget.v1~` (section 6.0).
- Bound columns: `body`, taken from the first row. A null or empty `body` value shows the empty state.
- Source: `cpt-frontx-dashboard-fr-backend-source` (the markdown exception) and `cpt-frontx-dashboard-fr-widget-catalog`.
- Rendering safety: embedded HTML in the markdown is shown as plain text, not rendered, and no element is created from it; the card's markdown formatting still applies. Links whose target is `http`, `https`, or `mailto` work and open in a new browsing context without access to the opener. A link with any other target shows its link text as plain text. Images are not loaded: an image shows its alt text, or nothing when it has none. This is the single exception to showing delivered content in full; everything else in the markdown is shown.

### 6.10 Shared Widget Chrome and States

Every widget type shows its content inside one shared widget chrome, in a layout cell and in the larger view. The chrome is behavior of the widget entries, not a schema field.

**Title.** The chrome shows the widget's `title` as delivered.

**Per-widget states.** Each widget has its own states; a widget in any state affects no other widget. The default English wording of every state is given in feature-backend-contract section 6.3, and each widget localizes it for the host language.

| State | When | What the widget shows | Retry |
|-------|------|-----------------------|-------|
| Skeleton | From `set_widget_context` until its widget data request settles | The widget's own skeleton | None |
| Data | The result passes validation and the column-binding check and has rows | The content of its widget type | None |
| Empty | The result passes and has no rows, or a `markdown_card` result has a null or empty first-row `body` | The empty message in place of its content, with the default wording "No data to show", the same for every widget type; a `grid` keeps its column headings above it | None |
| Error | A temporary failure: a backend error, a backend timeout, a network failure, or no answer within the wait time | An error in that widget only | Offered. Retry sends the same widget data request again and is classified like the first request: success shows the data or the empty state, a temporary failure shows the error with Retry again, and a permanent failure shows the cannot-show state |
| Cannot show | A permanent failure: the request is rejected as invalid, the metric is not found, permission is denied (with a "no permission" diagnostic), or the result does not parse, fails the widget data type, is misaligned (a row's length differs from the number of column names, or a percentage column is not among them), or lacks a bound column (diagnostic naming the missing columns) | The cannot-show state with its diagnostic, and nothing of the result | Not offered |

**Larger-view button.** The chrome of every cell widget shows one larger-view button, in every state: skeleton, data, empty, error, and cannot-show. The button is always present because every cell widget's `set_widget_context` carries `modal`. Selecting it opens the widget's larger view in the host modal domain (DESIGN section 3.6, Widget Modal Open). The modal entry receives no `modal`, so the chrome shows no larger-view button in the larger view, and a widget in the larger view cannot open another.

**Larger view.** The modal entry sends the same widget data request as the cell, with the same validation, column-binding check, and failure classes, and shows the same states. It may present the result differently, with more room. It adds no paging, sorting, filtering, navigation, or other metric. Closing it returns to the unchanged dashboard.

**No meaning by color alone.** No widget type conveys meaning by color alone (`cpt-frontx-dashboard-nfr-accessibility`): grid row colors carry a meaning icon with an accessible name, chart series and pie segments are named in the legend and tooltip, the heatmap shows its scale with numbers, progress bars show their values as text, and the trend shows a direction icon with its value. The larger-view button and Retry can be operated with the keyboard alone.

**Language and value formatting.** Each widget localizes its own wording and formats numbers and dates for the host language. Wherever a widget type shows a value of a column that the result names as a percentage column, in a cell, a card value, an axis, or a tooltip, it formats that value as a percentage for the host language. A percentage value is a fraction where 1 means 100%: 0.385 is shown as 38.5%. Titles, labels, and text values from the dashboard and the result are shown as delivered.

**Nothing hidden.** No widget type cuts off, truncates, or hides delivered text or rows; long text wraps. The single exception is the markdown safety rule of section 6.9.

**Theme.** Each widget maps the host theme id to the light or dark scope of `@gears-frontx/ui-kit`, the same approach as `template-mfe`, and takes every color from kit tokens of that scope. A host theme switch changes the scope without a new request and without showing the skeleton again (ADR-0006).

## 7. Acceptance Criteria

- [ ] `cfs validate --artifact` reports no structural errors for this document.
- [ ] Every type of section 6 is authored with its full JSON Schema; every identifier follows the GTS grammar, uses the FrontX vendor `frontx`, and every `x-gts-instance-ref` operand is valid under GTS v0.17.
- [ ] The widget base is abstract, requires `id`, `title`, and `source`, constrains `id` with `x-gts-instance-ref: "/$id"`, and declares no traits and no field for the larger view.
- [ ] Given a widget instance whose `source` has `metric` "sales_by_region", when it is validated, then it passes; with `metric` an empty string, with no `metric`, with `bucket` "yes", or with an extra field in `source`, it fails.
- [ ] All 9 widget types chain from `gts.frontx.m.widget.widget.v1~`, declare the bound columns of DESIGN section 3.1, and reference no widget data type.
- [ ] No widget type declares a field for user-driven column resizing, sorting, grouping, paging, or filtering in the browser, a display limit, drill-down, or an in-browser toggle; the `width` and `align` of a `grid` column are presentation hints; and no widget instance's `id` chain names a type derived from one of the 9 widget types.
- [ ] Given a `summary_card` with `label` "region" and `value` "revenue" and a result whose rows hold "North", 120 and "South", 80, when it renders, then it shows two lines in that order, "North" with 120 and "South" with 80.
- [ ] Given a `grid` widget whose `columns` lists `region` and `revenue` and a result whose column names are `region`, `revenue`, and `cost`, when it renders, then only the `region` and `revenue` columns are shown, in that order.
- [ ] Given a `grid` widget whose `columns` lists the key `owner` and a result whose column names do not include `owner`, when the widget receives the result, then it shows its cannot-show state with a diagnostic naming `owner`, shows nothing of the result, offers no Retry, and every other widget is unaffected.
- [ ] Given a `metric_card` that binds `trend` to `change` and a result without a `change` column, when the widget receives it, then it shows its cannot-show state with a diagnostic naming `change`.
- [ ] Given a widget of any of the 9 widget types and a result that has every bound column and no rows, when the widget receives it, then it shows its widget type's empty state with the default wording "No data to show", not an error.
- [ ] Given a `grid` widget with no `align` and a result whose first row holds "alpha", 1234.5, true, and null, when the grid renders, then the cells show "alpha", 1234.5 formatted for the host language, "true", and an empty cell, every column body is leading-aligned, and no cell is cut off.
- [ ] Given a `grid` widget that binds a column named by the result as a percentage column, with the values 0.385 and 0.615, when the grid renders, then that column's values are shown as 38.5% and 61.5%, formatted for the host language.
- [ ] Given a `grid` widget and a result that passes the widget data type but has a row with fewer values than its column names, or names in `percent_columns` a column that is not among its column names, when the widget receives the result, then it shows its cannot-show state with a diagnostic, shows nothing of the result, offers no Retry, and every other widget is unaffected.
- [ ] Given, in turn, a `grid` widget whose `columns` holds the key `c1` twice; whose `column_groups` holds a group with empty `column_keys`; a group naming the key `zz` that no column has; the column `c3` in two groups; or one group over `c1` and `c3` with `c2` between them, when the Viewer host checks the dashboard, then in each case it shows no cells, shows a diagnostic naming the widget and the failing column or group, and offers no Retry.
- [ ] Given a `grid` widget with 8 columns and `frozen_columns` 2, when the dashboard viewer scrolls the grid horizontally to its last column, then the first 2 columns stay visible at the leading edge; with `frozen_columns` 0 or absent, all columns scroll; with `frozen_columns` 10, all 8 columns stay frozen.
- [ ] Given a `grid` widget whose `column_groups` lists a group "Group B" over `c5` and `c6` before a group "Group A" over `c3` and `c4`, when the grid renders, then a heading row above the column headings shows "Group A" once over `c3` and `c4` and "Group B" once over `c5` and `c6`, in column position, every other column has an empty cell in that row, and the rows keep the delivered order.
- [ ] Given a `grid` widget without `row_color_column`, when the grid renders, then no row is colored.
- [ ] Given a `grid` widget with `row_color_column` "level", which is not one of its `columns`, and rows whose `level` values are "error", "Error", "unknown", and null, when the grid renders in the light scope, then the "error" row takes the ui-kit error token background of the light scope and shows the error icon with its accessible name, the other three rows show no color and no icon, and cell text stays readable.
- [ ] Given the grid of the previous criterion, when the host theme switches to dark, then the "error" row takes the error token background of the dark scope, the other rows stay uncolored, and no widget data request is sent.
- [ ] Given a `grid` widget and a result with 5,000 rows, when the dashboard viewer scrolls from the first row to the last, then every row is reachable in the delivered order in one continuous scrolling body, no paging control appears, only the rows in view are rendered, and the view never stops responding for longer than 100 ms (provisional) under the reference conditions fixed in the DESIGN.
- [ ] Given a `cartesian_chart` with `x` "month" and two series bound to `revenue` (bar) and `cost` (line, label "Cost"), when it renders, then each row is one x position in the delivered order, the legend names the series "revenue" and "Cost", and a null `cost` value is a gap in the line.
- [ ] Given a `pie_chart` with `label` "region" and `value` "share" and rows "North", 0.6 and "South", 0.4, where `share` is a percentage column, when it renders, then it shows two segments in that order, and the legend and tooltip show each label with its value formatted as a percentage for the host language, "North" with 60% and "South" with 40%.
- [ ] Given a `markdown_card` with `body` "notes" and a result whose first row's `notes` holds a heading, a raw `<b>` tag, a link with an `https` target, a link with a `mailto` target, a link with a `javascript` target, and an image, and whose second row holds other text, when the card renders, then the heading is formatted, no element is created from the raw tag and the tag shows as plain text, the `https` and `mailto` links open in a new browsing context without access to the opener, the `javascript` link shows its text as plain text, the image is not requested and shows its alt text, and nothing of the second row is shown.
- [ ] Given a cell widget of any of the 9 widget types, when it is in its skeleton, data, empty, error, or cannot-show state, then its chrome shows the larger-view button; when the dashboard viewer selects it, the larger view opens in the host modal domain and sends the same widget data request; and in the larger view the chrome shows no larger-view button.
- [ ] Given a widget whose data request fails with no answer within the wait time, when it shows its error and the dashboard viewer selects Retry and the backend then answers that the metric is not found, then the widget shows its cannot-show state without Retry, and the other widgets are unaffected.
- [ ] Given a widget whose data request is answered with permission denied, when the widget shows it, then it shows its cannot-show state with a "no permission" diagnostic and no Retry.
- [ ] Given the reference dashboard, when it is inspected against the host accessibility policy in both scopes, then no widget conveys meaning by color alone, and the larger-view button and Retry can be operated with the keyboard alone.
