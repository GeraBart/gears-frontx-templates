---
status: proposed
version: 6
date: 2026-10-24
description: Type catalog of the abstract widget data base and the 9 widget data types derived from it, one per widget kind, each the response of a widget's own data request to the consuming backend, declared by dashboard-viewer.
changelog:
  - "v6 (2026-10-24): traces `cpt-frontx-dashboard-fr-generated-dashboards` (p2); the data types named by each kind complete the validation of a generated definition."
  - "v5 (2026-10-24): params model and GTS v0.17. New abstract base `gts.frontx.v.widget_data.widget_data.v1~` (section 6.0); the 9 shapes derive from it, so their identifiers become `gts.frontx.v.widget_data.widget_data.v1~frontx.v.widget_data.<kind>.v1~`. Widget data carries no `id`: the backend computes it on each widget data request (sent with the widget kind and its `params`), and the widget validates it against its kind's `data_type` trait. `x-gts-ref` is no longer used."
  - "v4 (2026-10-23): each widget requests its own data; a shape is the response of that request, not part of the dashboard payload. Removed the code_diff, thread_list, event_timeline and metadata_strip shapes (9 shapes remain). Grid data gains optional row groups. The widget-to-data linking open item is gone."
  - "v3 (2026-10-23): the dashboard payload is referenced by its DESIGN interface ID; the grid column type no longer drives sort ordering, and grid rows render in the order supplied."
  - "v2 (2026-10-23): Source lines trace to PRD IDs only."
  - "v1: initial port from the prototype."
---

# Feature: Widget Data Catalog


<!-- toc -->

- [1. Feature Context](#1-feature-context)
  - [1.1 Overview](#11-overview)
  - [1.2 Purpose](#12-purpose)
  - [1.3 Actors](#13-actors)
  - [1.4 References](#14-references)
- [2. Actor Flows (CDSL)](#2-actor-flows-cdsl)
  - [Type-Catalog Feature: No Actor Flows](#type-catalog-feature-no-actor-flows)
- [3. Processes / Business Logic (CDSL)](#3-processes--business-logic-cdsl)
  - [Type-Catalog Feature: No Processes](#type-catalog-feature-no-processes)
- [4. States (CDSL)](#4-states-cdsl)
  - [Type-Catalog Feature: No State Machines](#type-catalog-feature-no-state-machines)
- [5. Definitions of Done](#5-definitions-of-done)
  - [Type Catalog Definition of Done](#type-catalog-definition-of-done)
- [6. Type Catalog](#6-type-catalog)
  - [6.0 WidgetData (abstract base)](#60-widgetdata-abstract-base)
  - [6.1 SummaryCardData](#61-summarycarddata)
  - [6.2 MetricCardData](#62-metriccarddata)
  - [6.3 RankedListCardData](#63-rankedlistcarddata)
  - [6.4 ProgressListCardData](#64-progresslistcarddata)
  - [6.5 GridData](#65-griddata)
  - [6.6 CartesianChartData](#66-cartesianchartdata)
  - [6.7 PieChartData](#67-piechartdata)
  - [6.8 HeatmapData](#68-heatmapdata)
  - [6.9 MarkdownCardData](#69-markdowncarddata)
- [7. Acceptance Criteria](#7-acceptance-criteria)

<!-- /toc -->

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-featstatus-widget-data-catalog`
## 1. Feature Context

- [ ] `p2` - `cpt-frontx-dashboard-feature-widget-data-catalog`

### 1.1 Overview

This feature is a **type-catalog feature**, not an actor-flow feature, declared in package `dashboard-viewer`. It enumerates the abstract widget data base `gts.frontx.v.widget_data.widget_data.v1~` and the 9 widget data types derived from it, `gts.frontx.v.widget_data.widget_data.v1~frontx.v.widget_data.<kind>.v1~`, one per widget kind. Together they are the backend wire contract for widget data. The dashboard definition carries no widget data, and the backend stores none: each widget's MFE instance requests its own data once, when it mounts, sending its widget kind and its `params`; the backend computes the data from its own data on that request, and the response is one widget data instance of the type its kind names in the `data_type` trait, which the widget renders unchanged. The request goes through the FrontX API package, whose API cache is shared across MFE entries (`cpt-frontx-dashboard-interface-dashboard-payload`; the endpoint and request form are a DESIGN section 4 open item). Its structural prose lives in DESIGN section 3.1; the content lives in section 6 Type Catalog. The sections for flows, processes, and states are reduced to short not-applicable notes. The catalog is ported one-to-one from the prototype, rebased to the FrontX vendor (`gts.de.*` to `gts.frontx.*`).

### 1.2 Purpose

Concrete catalog of the widget data types that the consuming backend returns to a widget's data request and that the widget renders, each with its full GTS-typed JSON Schema. It addresses the type catalog and widget catalog of the PRD and the Widget data entity of DESIGN section 3.1. Two kinds have no demo coverage (see section 6). A generated dashboard carries no widget data, but each widget kind it uses names one of these types in its `data_type` trait, so validating the definition relies on them.

**Requirements**: `cpt-frontx-dashboard-fr-domain-model`, `cpt-frontx-dashboard-fr-widget-catalog`, `cpt-frontx-dashboard-fr-generated-dashboards`

**Principles**: `cpt-frontx-dashboard-principle-gts-contracts`

### 1.3 Actors

N/A. This is a type-catalog feature. The catalog is consumed by the runtime type system (the widget MFEs, which request their widget data from the consuming backend with their kind and `params` and render it), not by an end-user actor, so no actor flows are authored.

### 1.4 References

- **PRD**: [PRD.md](../../PRD.md)
- **Design**: [DESIGN.md](../../DESIGN.md) section 3.1 (Domain Model); section 4 (open item: path and request form of a widget's data request)
- **ADRs**: [ADR-0003](../../ADR/0003-shared-data-types-and-schemas-v1.md), [ADR-0005](../../ADR/0005-data-grid-library-v1.md), [ADR-0008](../../ADR/0008-widget-kind-and-mfe-realization-v1.md), [ADR-0009](../../ADR/0009-subject-agnostic-widget-catalog-v1.md), [ADR-0011](../../ADR/0011-backend-delivered-dashboard-v1.md)
- **Declaring package**: `dashboard-viewer` (`src-app/mfe_packages/dashboard-viewer/`)
- **Dependencies**: None for authoring; the 9 types derive from the base in section 6.0. Paired with [feature-widget-catalog](../feature-widget-catalog/FEATURE.md): the widget base's `data_type` trait references this base, and each widget kind sets it to its paired type here; the widget data returned for a widget's data request must be an instance of that type. The widget requests its data with its kind and its `params` (feature-widget-catalog section 6.0).

## 2. Actor Flows (CDSL)

### Type-Catalog Feature: No Actor Flows

N/A. Type catalog content is consumed at runtime by the type system, not by an actor flow. The catalog lives in section 6.

## 3. Processes / Business Logic (CDSL)

### Type-Catalog Feature: No Processes

N/A. The catalog declares static GTS schemas. Runtime validation logic lives in the widget MFE bundles, which validate the response of their data request, not in this catalog.

## 4. States (CDSL)

### Type-Catalog Feature: No State Machines

N/A. Type declarations are stateless.

## 5. Definitions of Done

### Type Catalog Definition of Done

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-dod-widget-data-catalog-catalog-complete`

The system **MUST** author every concrete type of this catalog, ported one-to-one from the prototype and rebased to the FrontX vendor.

- Every concrete passes GTS identifier grammar and GTS v0.17 schema validation.
- The base `gts.frontx.v.widget_data.widget_data.v1~` is `x-gts-abstract: true`, and every one of the 9 types derives from it.
- Every concrete keeps its prototype schema; only the vendor, namespace, version form, and the derivation from the base change. The grid shape adds optional row groups (section 6.5).
- Each type is the response of one widget's data request; the dashboard definition carries no widget data, and widget data carries no `id`.
- The two kinds without widget data in the demo are marked "no demo coverage".

## 6. Type Catalog

### 6.0 WidgetData (abstract base)

**GTS ID**: `gts.frontx.v.widget_data.widget_data.v1~`

**Description**: Abstract base (`x-gts-abstract: true`) of every widget data type. It is the operand of the `data_type` trait that the Widget base declares (feature-widget-catalog section 6.0), so each widget kind names a type derived from it. It adds no fields. Widget data is computed by the backend on each widget data request and has no persistent identity: an instance carries no `id`, and the widget validates it against the `data_type` of its own kind. Never instantiated directly.

**Schema**:

```json
{
  "$id": "gts://gts.frontx.v.widget_data.widget_data.v1~",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "WidgetData",
  "description": "Abstract base of every widget data type: the response to one widget's data request, computed by the backend from the widget kind and its params. Carries no id; validated against the data_type trait of the requesting widget's kind.",
  "x-gts-abstract": true,
  "type": "object"
}
```

**Cross-references**:
- Derived types: sections 6.1 to 6.9. Each derives through its `$id` chain; because the base adds no constraints beyond `type: object`, their bodies repeat no `$ref` to it (GTS v0.17 section 9.7.5, derivation follows the `$id` chain).
- Referenced by the `data_type` trait schema of `gts.frontx.m.widget.widget.v1~` (`x-gts-type-ref`).

Demo coverage of the 9 kinds (PRD section 6.3): `summary_card`, `ranked_list_card`, `progress_list_card`, `grid`, `cartesian_chart`, `pie_chart`, and `heatmap` have widget data in the demo's static widget data. The two kinds `metric_card` and `markdown_card` are marked **no demo coverage**.

### 6.1 SummaryCardData

**GTS ID**: `gts.frontx.v.widget_data.widget_data.v1~frontx.v.widget_data.summary_card.v1~`

**Description**: Widget Data for `summary_card`: ordered list of label/value rows.

**Schema**:

```json
{
  "$id": "gts://gts.frontx.v.widget_data.widget_data.v1~frontx.v.widget_data.summary_card.v1~",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "SummaryCardData",
  "description": "Paired Widget Data shape for the summary_card widget kind: an ordered list of label/value rows returned by the backend for the widget's data request (e.g. PR-status counts, contributor-bucket counts, LOC-by-language counts).",
  "type": "object",
  "required": ["rows"],
  "properties": {
    "rows": {
      "type": "array",
      "description": "Ordered row records. The widget kind's row_order references each row's key.",
      "items": {
"type": "object",
"required": ["key", "value"],
"properties": {
  "key": { "type": "string", "description": "Stable row key (e.g., ready, in_review, human, bot_critical); independent of presentation labels." },
  "value": { "type": "number", "description": "Numeric value rendered for the row." },
  "format": { "type": ["string", "null"], "description": "Optional format hint (e.g., integer, percent_1); falls back to a default when null." },
  "trend": { "type": ["string", "null"], "enum": ["up", "down", "flat", null], "description": "Optional trend indicator the renderer surfaces alongside the value." }
}
      }
    }
  }
}
```

**Cross-references**:
- Abstract base: `gts.frontx.v.widget_data.widget_data.v1~` (section 6.0); this type derives from it through its `$id` chain.
- Related types: Paired widget kind: `gts.frontx.m.widget.widget.v1~frontx.m.widget.summary_card.v1~` (in feature-widget-catalog)

### 6.2 MetricCardData

**GTS ID**: `gts.frontx.v.widget_data.widget_data.v1~frontx.v.widget_data.metric_card.v1~`

**Description**: Widget Data for `metric_card`: single headline value with optional trend and optional sparkline series.

**Schema**:

```json
{
  "$id": "gts://gts.frontx.v.widget_data.widget_data.v1~frontx.v.widget_data.metric_card.v1~",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "MetricCardData",
  "description": "Paired Widget Data shape for the metric_card widget kind: a single headline value with optional trend and optional sparkline.",
  "type": "object",
  "required": ["value"],
  "properties": {
    "value": { "type": "number", "description": "Headline value rendered as the primary KPI." },
    "format": { "type": ["string", "null"], "description": "Optional format hint (integer, percent_1, compact_loc, etc.); the widget kind's format field overrides this when both are present." },
    "trend": {
      "type": ["object", "null"],
      "description": "Optional trend descriptor.",
      "required": ["direction", "delta"],
      "properties": {
"direction": { "type": "string", "enum": ["up", "down", "flat"], "description": "Trend direction." },
"delta": { "type": "number", "description": "Magnitude of the trend (signed)." }
      }
    },
    "sparkline": { "type": ["array", "null"], "items": { "type": "number" }, "description": "Optional inline sparkline series (chronologically ordered)." }
  }
}
```

**Cross-references**:
- Abstract base: `gts.frontx.v.widget_data.widget_data.v1~` (section 6.0); this type derives from it through its `$id` chain.
- Related types: Paired widget kind: `gts.frontx.m.widget.widget.v1~frontx.m.widget.metric_card.v1~` (in feature-widget-catalog)
- Demo coverage: none. The demo's static widget data carries no instance of this shape; the paired widget kind `metric_card` has no demo coverage (PRD section 6.3).

### 6.3 RankedListCardData

**GTS ID**: `gts.frontx.v.widget_data.widget_data.v1~frontx.v.widget_data.ranked_list_card.v1~`

**Description**: Widget Data for `ranked_list_card`: ordered ranked items (rank, label, value, optional secondary).

**Schema**:

```json
{
  "$id": "gts://gts.frontx.v.widget_data.widget_data.v1~frontx.v.widget_data.ranked_list_card.v1~",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "RankedListCardData",
  "description": "Paired Widget Data shape for the ranked_list_card widget kind: a ranked list of items with primary value and optional secondary value.",
  "type": "object",
  "required": ["items"],
  "properties": {
    "items": {
      "type": "array",
      "description": "Ordered ranked items (rank ascending).",
      "items": {
"type": "object",
"required": ["rank", "label", "value"],
"properties": {
  "rank": { "type": "integer", "description": "One-based rank within the list." },
  "label": { "type": "string", "description": "Display label of the ranked item (e.g., contributor name, repo slug)." },
  "value": { "type": "number", "description": "Primary value driving the rank." },
  "secondary": { "type": ["number", "null"], "description": "Optional secondary value rendered alongside the primary." }
}
      }
    }
  }
}
```

**Cross-references**:
- Abstract base: `gts.frontx.v.widget_data.widget_data.v1~` (section 6.0); this type derives from it through its `$id` chain.
- Related types: Paired widget kind: `gts.frontx.m.widget.widget.v1~frontx.m.widget.ranked_list_card.v1~` (in feature-widget-catalog)

### 6.4 ProgressListCardData

**GTS ID**: `gts.frontx.v.widget_data.widget_data.v1~frontx.v.widget_data.progress_list_card.v1~`

**Description**: Widget Data for `progress_list_card`: list of items with current/target progress.

**Schema**:

```json
{
  "$id": "gts://gts.frontx.v.widget_data.widget_data.v1~frontx.v.widget_data.progress_list_card.v1~",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "ProgressListCardData",
  "description": "Paired Widget Data shape for the progress_list_card widget kind: a list of items with current/target progress.",
  "type": "object",
  "required": ["items"],
  "properties": {
    "items": {
      "type": "array",
      "description": "Ordered progress items.",
      "items": {
"type": "object",
"required": ["label", "current", "target"],
"properties": {
  "label": { "type": "string", "description": "Display label (e.g., milestone name, contributor display name)." },
  "current": { "type": "number", "description": "Progress value achieved so far." },
  "target": { "type": "number", "description": "Target value defining 100%." },
  "unit": { "type": ["string", "null"], "description": "Optional unit hint (e.g., LOC, prs, points); rendered next to the value." }
}
      }
    }
  }
}
```

**Cross-references**:
- Abstract base: `gts.frontx.v.widget_data.widget_data.v1~` (section 6.0); this type derives from it through its `$id` chain.
- Related types: Paired widget kind: `gts.frontx.m.widget.widget.v1~frontx.m.widget.progress_list_card.v1~` (in feature-widget-catalog)

### 6.5 GridData

**GTS ID**: `gts.frontx.v.widget_data.widget_data.v1~frontx.v.widget_data.grid.v1~`

**Description**: Widget Data for `grid`: declared columns + tabular rows.

**Schema**:

```json
{
  "$id": "gts://gts.frontx.v.widget_data.widget_data.v1~frontx.v.widget_data.grid.v1~",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "GridData",
  "description": "Paired Widget Data shape for the grid widget kind: tabular data with declared columns and either a flat list of rows or an ordered list of row groups.",
  "type": "object",
  "required": ["columns"],
  "oneOf": [
    { "required": ["rows"] },
    { "required": ["groups"] }
  ],
  "properties": {
    "columns": {
      "type": "array",
      "description": "Column descriptors. The widget kind's columns references each column's key and adds presentation-only attributes.",
      "items": {
"type": "object",
"required": ["key", "label", "type"],
"properties": {
  "key": { "type": "string", "description": "Stable column key." },
  "label": { "type": "string", "description": "Default header label (the widget kind's columns[].label may override)." },
  "type": { "type": "string", "enum": ["string", "number", "integer", "boolean", "date", "enum"], "description": "Column value type; drives default formatting." }
}
      }
    },
    "rows": {
      "type": "array",
      "description": "Flat list of tabular row records keyed by column key, rendered in the order supplied; the grid does not sort, group, or paginate them.",
      "items": { "type": "object" }
    },
    "groups": {
      "type": "array",
      "description": "Optional row groups, rendered in the order supplied. The grid renders one group heading row with the group label, followed by the group's rows; groups do not collapse and are not reordered. Without groups the grid renders the flat rows list.",
      "items": {
"type": "object",
"required": ["label", "rows"],
"properties": {
  "label": { "type": "string", "description": "Group heading label." },
  "rows": { "type": "array", "items": { "type": "object" }, "description": "Row records of this group keyed by column key, rendered in the order supplied." }
}
      }
    }
  }
}
```

**Cross-references**:
- Abstract base: `gts.frontx.v.widget_data.widget_data.v1~` (section 6.0); this type derives from it through its `$id` chain.
- Related types: Paired widget kind: `gts.frontx.m.widget.widget.v1~frontx.m.widget.grid.v1~` (in feature-widget-catalog)
- Source: `cpt-frontx-dashboard-fr-grid-presentation` anchors the optional row groups.
- Large grids: the grid renders 500 to 5,000 rows without paging, using virtualized row rendering (ADR-0005).

### 6.6 CartesianChartData

**GTS ID**: `gts.frontx.v.widget_data.widget_data.v1~frontx.v.widget_data.cartesian_chart.v1~`

**Description**: Widget Data for `cartesian_chart`: shared x_values plus a list of named series with per-series type ∈ {bar, line, area, scatter}.

**Schema**:

```json
{
  "$id": "gts://gts.frontx.v.widget_data.widget_data.v1~frontx.v.widget_data.cartesian_chart.v1~",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "CartesianChartData",
  "description": "Paired Widget Data shape for the cartesian_chart widget kind. Carries a shared x_values axis and a list of named series; each series declares its own rendering type via series[].type. Current enum values are bar | line | area | scatter; future Cartesian rendering shapes extend this enum without changing the widget kind.",
  "type": "object",
  "required": ["x_values", "series"],
  "properties": {
    "x_values": {
      "type": "array",
      "items": { "type": ["string", "number"] },
      "description": "Shared x-axis values (categorical strings, numeric values, or epoch-millisecond timestamps). All series align positionally to this array."
    },
    "series": {
      "type": "array",
      "description": "One or more named series. Each series declares its own rendering shape.",
      "items": {
"type": "object",
"required": ["type", "name", "data"],
"properties": {
  "type": { "type": "string", "enum": ["bar", "line", "area", "scatter"], "description": "Per-series rendering shape; drives the rendering library's series-type axis." },
  "name": { "type": "string", "description": "Series display name; surfaced in legend and tooltips." },
  "data": { "type": "array", "items": { "type": ["number", "null"] }, "description": "Series y-values, indexed positionally against x_values; null indicates a missing point." },
  "y_axis_index": { "type": ["integer", "null"], "enum": [0, 1, null], "description": "Which y-axis the series binds to; 0 primary, 1 optional secondary axis. Null when only the primary axis is in use." },
  "color": { "type": ["string", "null"], "description": "Optional theme-resolvable color override; falls back to the widget kind's series_overrides[name].color and then to the theme palette." },
  "stack_group": { "type": ["string", "null"], "description": "Optional stack-group identifier; series sharing a stack_group are stacked together. Null when unstacked." }
}
      }
    }
  }
}
```

**Cross-references**:
- Abstract base: `gts.frontx.v.widget_data.widget_data.v1~` (section 6.0); this type derives from it through its `$id` chain.
- Related types: Paired widget kind: `gts.frontx.m.widget.widget.v1~frontx.m.widget.cartesian_chart.v1~` (in feature-widget-catalog)

### 6.7 PieChartData

**GTS ID**: `gts.frontx.v.widget_data.widget_data.v1~frontx.v.widget_data.pie_chart.v1~`

**Description**: Widget Data for `pie_chart`: ordered segments (label, value, optional color).

**Schema**:

```json
{
  "$id": "gts://gts.frontx.v.widget_data.widget_data.v1~frontx.v.widget_data.pie_chart.v1~",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "PieChartData",
  "description": "Paired Widget Data shape for the pie_chart widget kind: an ordered list of segments.",
  "type": "object",
  "required": ["segments"],
  "properties": {
    "segments": {
      "type": "array",
      "description": "Ordered pie segments.",
      "items": {
"type": "object",
"required": ["label", "value"],
"properties": {
  "label": { "type": "string", "description": "Segment display label (legend + tooltip)." },
  "value": { "type": "number", "description": "Numeric value driving the segment angle." },
  "color": { "type": ["string", "null"], "description": "Optional theme-resolvable color override; falls back to the widget kind's color_scheme palette when null." }
}
      }
    }
  }
}
```

**Cross-references**:
- Abstract base: `gts.frontx.v.widget_data.widget_data.v1~` (section 6.0); this type derives from it through its `$id` chain.
- Related types: Paired widget kind: `gts.frontx.m.widget.widget.v1~frontx.m.widget.pie_chart.v1~` (in feature-widget-catalog)

### 6.8 HeatmapData

**GTS ID**: `gts.frontx.v.widget_data.widget_data.v1~frontx.v.widget_data.heatmap.v1~`

**Description**: Widget Data for `heatmap`: sparse cells with (x, y, value) plus optional axis label arrays.

**Schema**:

```json
{
  "$id": "gts://gts.frontx.v.widget_data.widget_data.v1~frontx.v.widget_data.heatmap.v1~",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "HeatmapData",
  "description": "Paired Widget Data shape for the heatmap widget kind: a sparse cell collection plus optional axis label arrays.",
  "type": "object",
  "required": ["cells"],
  "properties": {
    "cells": {
      "type": "array",
      "description": "Sparse list of cells (cells with no value MAY be omitted).",
      "items": {
"type": "object",
"required": ["x", "y", "value"],
"properties": {
  "x": { "type": ["string", "number"], "description": "X-axis coordinate (category or numeric)." },
  "y": { "type": ["string", "number"], "description": "Y-axis coordinate (category or numeric)." },
  "value": { "type": "number", "description": "Cell intensity value driving the color scale." }
}
      }
    },
    "x_labels": { "type": ["array", "null"], "items": { "type": "string" }, "description": "Optional ordered x-axis category labels; null when the x-axis is numeric." },
    "y_labels": { "type": ["array", "null"], "items": { "type": "string" }, "description": "Optional ordered y-axis category labels; null when the y-axis is numeric." }
  }
}
```

**Cross-references**:
- Abstract base: `gts.frontx.v.widget_data.widget_data.v1~` (section 6.0); this type derives from it through its `$id` chain.
- Related types: Paired widget kind: `gts.frontx.m.widget.widget.v1~frontx.m.widget.heatmap.v1~` (in feature-widget-catalog)

### 6.9 MarkdownCardData

**GTS ID**: `gts.frontx.v.widget_data.widget_data.v1~frontx.v.widget_data.markdown_card.v1~`

**Description**: Widget Data for `markdown_card`: a markdown body string with optional metadata sub-shape.

**Schema**:

```json
{
  "$id": "gts://gts.frontx.v.widget_data.widget_data.v1~frontx.v.widget_data.markdown_card.v1~",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "MarkdownCardData",
  "description": "Paired Widget Data shape for the markdown_card widget kind: a markdown body returned by the backend for the widget's data request (e.g., a pull-request body, an issue body, release notes) with optional author/age metadata for an inline header.",
  "type": "object",
  "required": ["markdown"],
  "properties": {
    "markdown": {
      "type": "string",
      "description": "Markdown body rendered by the widget kind. Authoring-time normalization (e.g., GitHub-flavored markdown extensions) is the backend's responsibility; the widget kind treats the value as opaque markdown source."
    },
    "metadata": {
      "type": ["object", "null"],
      "description": "Optional metadata sub-shape rendered above the body when the widget kind's show_metadata_header is true.",
      "properties": {
"author_label": { "type": "string", "description": "Display label of the body's author (e.g., a contributor display name)." },
"age_seconds": { "type": "integer", "minimum": 0, "description": "Age in seconds at the time the backend produced the data; the renderer humanizes it (e.g., '3 days ago')." }
      }
    }
  }
}
```

**Cross-references**:
- Abstract base: `gts.frontx.v.widget_data.widget_data.v1~` (section 6.0); this type derives from it through its `$id` chain.
- Related types: Paired widget kind: `gts.frontx.m.widget.widget.v1~frontx.m.widget.markdown_card.v1~` (in feature-widget-catalog)
- Source: `cpt-frontx-dashboard-fr-widget-catalog`.
- Demo coverage: none. The demo's static widget data carries no instance of this shape; the paired widget kind `markdown_card` has no demo coverage (PRD section 6.3).

## 7. Acceptance Criteria

- [ ] Every concrete listed in section 6 is authored with its full JSON Schema.
- [ ] Every identifier follows GTS grammar, and every type validates under GTS v0.17.
- [ ] No identifier uses the prototype vendor `de` or the `hai3` namespace.
- [ ] `cfs validate --artifact` reports no structural errors for this document.
- [ ] Exactly 9 types are authored, one per widget kind, each derived from the abstract base `gts.frontx.v.widget_data.widget_data.v1~`, which is authored too.
- [ ] No widget data type declares an `id` field.
- [ ] Each shape is described as the response of a widget's own data request; no shape is described as part of the dashboard definition.
- [ ] The grid shape accepts either flat `rows` or ordered `groups`, each group with a label and its rows.
- [ ] The two shapes for `metric_card` and `markdown_card` are marked "no demo coverage".
