---
status: accepted
version: 1
date: 2026-10-30
description: Domain-model feature that declares the abstract data shape base and the 8 data shapes, one per data widget type, with their combined instance ids, and that specifies the 5 fill modes, the from grammar and the validation of set_data.
---

# Feature: Widget Data Catalog

<!-- toc -->

- [1. Feature Context](#1-feature-context)
  - [1.1 Overview](#11-overview)
  - [1.2 Purpose](#12-purpose)
  - [1.3 Actors](#13-actors)
  - [1.4 References](#14-references)
- [2. Actor Flows (CDSL)](#2-actor-flows-cdsl)
  - [Domain-Model Feature: No Actor Flows](#domain-model-feature-no-actor-flows)
- [3. Processes / Business Logic (CDSL)](#3-processes--business-logic-cdsl)
  - [Resolve a `from` Member](#resolve-a-from-member)
  - [Fill by `rows_by_member`](#fill-by-rows_by_member)
  - [Fill by `x_series_value`](#fill-by-x_series_value)
  - [Fill by `row_per_measure`](#fill-by-row_per_measure)
  - [Fill by `positional_table`](#fill-by-positional_table)
  - [Fill by `scalar_with_series`](#fill-by-scalar_with_series)
  - [Build the Data Instance](#build-the-data-instance)
  - [Validate a Data Instance](#validate-a-data-instance)
- [4. States (CDSL)](#4-states-cdsl)
  - [Domain-Model Feature: No State Machines](#domain-model-feature-no-state-machines)
- [5. Definitions of Done](#5-definitions-of-done)
  - [Data Shapes Definition of Done](#data-shapes-definition-of-done)
  - [Fill Modes Definition of Done](#fill-modes-definition-of-done)
  - [Data Instance Definition of Done](#data-instance-definition-of-done)
- [6. Domain Model](#6-domain-model)
  - [6.1 WidgetData (abstract base)](#61-widgetdata-abstract-base)
  - [6.2 SummaryCardData](#62-summarycarddata)
  - [6.3 MetricCardData](#63-metriccarddata)
  - [6.4 RankedListCardData](#64-rankedlistcarddata)
  - [6.5 ProgressListCardData](#65-progresslistcarddata)
  - [6.6 PieChartData](#66-piechartdata)
  - [6.7 CartesianChartData](#67-cartesianchartdata)
  - [6.8 HeatmapData](#68-heatmapdata)
  - [6.9 GridData](#69-griddata)
  - [6.10 Fill Modes](#610-fill-modes)
- [7. Acceptance Criteria](#7-acceptance-criteria)

<!-- /toc -->

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-featstatus-widget-data-catalog`

## 1. Feature Context

- [ ] `p2` - `cpt-frontx-dashboard-feature-widget-data-catalog`

### 1.1 Overview

This feature declares the data that a data widget receives in `set_data`. It has an abstract data shape base, `gts.frontx.dashboard_m.widget_data.widget_data.v1~`, and 8 derived data shapes, one per data widget type. It also defines the 5 fill modes. A fill mode is a rule that tells a data adapter how to fill a data shape from the result of a query. All types are declared in package `dashboard_m`. Section 6 holds the schemas, and section 3 holds the fill rules as algorithms. There are no actor flows and no states.

### 1.2 Purpose

A data widget is a passive renderer. It must get its data in the form its widget type names, and the same fill rules must serve every dataset. This feature gives each data widget type one typed data shape. It gives the data adapter 5 fill modes that it implements once. FrontX checks each `set_data` against the exact shape that the data instance names, so no widget compares shapes.

The feature addresses the domain model, the widget catalog, the data adapter, the backend data and the grid paging requirements, and the data shape entity of DESIGN section 3.1.

**Requirements**: `cpt-frontx-dashboard-fr-domain-model`, `cpt-frontx-dashboard-fr-widget-catalog`, `cpt-frontx-dashboard-fr-data-adapter`, `cpt-frontx-dashboard-fr-backend-source`, `cpt-frontx-dashboard-fr-grid-sort-page`

**Principles**: `cpt-frontx-dashboard-principle-gts-contracts`

**Constraints**: `cpt-frontx-dashboard-constraint-gts-id-convention`

### 1.3 Actors

N/A. This is a domain-model feature. The types are consumed by the FrontX validation of `set_data` and by the data adapter of the consuming product, which fills them. The calls of the data adapter are specified in `cpt-frontx-dashboard-feature-data-adapter-contract`.

Not applicable as a pure data contract: performance (PERF), security (SEC), operations (OPS), compliance (COMPL) and user experience (UX) have no content in a type declaration. Reliability (REL) applies: shapes are closed, a wrong instance is rejected, and a null measure value or a null dimension value is a legal value. Data (DATA) applies: section 6 holds the schemas and the value rules.

### 1.4 References

- **PRD**: [PRD.md](../../PRD.md)
- **Design**: [DESIGN.md](../../DESIGN.md) section 3.1 (Widgets, Queries, and Data Shapes: the data shapes and the five fill modes)
- **ADRs**: [ADR-0009](../../ADR/0009-subject-agnostic-widget-catalog-v1.md) (data shapes, fill modes, the `from` grammar), [ADR-0003](../../ADR/0003-shared-data-types-and-schemas-v1.md) (combined instance id, polymorphic validation, arrays of objects instead of id-keyed maps), [ADR-0011](../../ADR/0011-data-adapter-v1.md) (the data adapter fills the shapes), [ADR-0012](../../ADR/0012-query-vocabulary-and-datasets-v1.md) (query fields and canonical member order), [ADR-0005](../../ADR/0005-data-grid-library-v1.md) (grid `positional_table` and `total`)
- **Declaring package**: GTS package `dashboard_m` in the `dashboard` package
- **Decomposition**: [DECOMPOSITION.md](../../DECOMPOSITION.md) section 2.2
- **Dependencies**: `cpt-frontx-dashboard-feature-query-vocabulary` ([feature-query-vocabulary](../feature-query-vocabulary/FEATURE.md): the query fields and the canonical member order that a fill mode reads)
- **Related**: [feature-widget-catalog](../feature-widget-catalog/FEATURE.md) (the traits `data_shape` and `fill` that name a shape and a fill mode for each widget type), [feature-extension-domain-catalog](../feature-extension-domain-catalog/FEATURE.md) (the `request_data` and `set_data` actions that carry a shape), [feature-data-adapter-contract](../feature-data-adapter-contract/FEATURE.md) (the calls of the data adapter and its obligations)

## 2. Actor Flows (CDSL)

### Domain-Model Feature: No Actor Flows

N/A. The shapes are consumed by the type system, not by an actor flow. The way a data instance travels from the data adapter to a widget is specified in `cpt-frontx-dashboard-feature-data-adapter-contract` and `cpt-frontx-dashboard-feature-extension-domain-catalog`.

## 3. Processes / Business Logic (CDSL)

The algorithms below are rules that the template defines. The data adapter of a consuming product implements them once, for every widget type. Common terms:

- **Query**: the query that the widget sends in `request_data`, as defined in `cpt-frontx-dashboard-feature-query-vocabulary` and `cpt-frontx-dashboard-adr-query-vocabulary-and-datasets`. It has `measures`, `dimensions`, at most one `timeDimensions` entry, optional `filters`, `order`, `limit`, `offset` and `total`, and the `timezone` that the widget sets.
- **`timeDimensions[0]`**: the single time entry of the query. Its `dimension` is the time dimension. It may set a `granularity`, and at most one of a `dateRange` and a `compareDateRange` of exactly 2 ranges.
- **Result column**: a member that gives a column of the result: each dimension, the time dimension when `timeDimensions[0]` has a `granularity`, and each measure. A time dimension without a `granularity` limits the period and gives no column.
- **Result row**: one row of the grouped result that the data adapter gets for the query. It holds one value for each result column.
- **Canonical member order**: the order of the result columns: the dimensions in query order, then the time dimension when `timeDimensions[0]` has a `granularity`, then the measures in query order.
- **Query grain**: the query's own filters and period, with no grouping by a dimension or by a `granularity` step. A total of a measure is the backend's value at the query grain. It is never a sum of grouped values for a measure that is not additive, such as a percentage or a distinct count.
- **Fill input**: what a fill mode reads: the query, the grouped result, and the totals and count that the fill mode needs. These are the query-grain total of each measure, for `row_per_measure` and `scalar_with_series`; the query-grain total of the measure over range 2 of `compareDateRange`, for `scalar_with_series`; and the row count that ignores `limit` and `offset`, for `positional_table`. The data adapter obtains them from its backend, or derives them locally over a complete result only for a measure that the binding declares re-aggregatable and for the row count. When a needed value of a measure that is not declared re-aggregatable cannot be obtained at the needed grain, the adapter gives no answer, and a product does not offer that measure at that grain in a dataset, as `cpt-frontx-dashboard-feature-data-adapter-contract` states. A fill mode reads them from its input and computes none of them.
- **Absent field**: a field of a shape that the fill mode cannot fill because the query has no member for it. An absent field is omitted. It is never set to null and never set to an empty value. A measure value or a dimension value that the backend reports as null is different: it is not an absent field, and the fill mode keeps it as `null`.

### Resolve a `from` Member

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-algo-widget-data-catalog-resolve-from`

**Input**: a `from` string and a query.

**Output**: a result column (a member that gives a column), or nothing.

The grammar of `from` is the pattern `^(dimensions\[(0|[1-9][0-9]*)\]|measures\[(0|[1-9][0-9]*)\]|timeDimensions\[0\])$`. The index `i` is a position in the query's own list. `timeDimensions[0]` names the time dimension of the query's single time entry.

**Steps**:
1. [ ] - `p1` - **IF** `from` does not match the grammar - `inst-from-grammar`
   1. [ ] - `p1` - **RETURN** nothing, because a `from` outside the grammar is an invalid fill descriptor that the widget catalog rejects at validation - `inst-from-invalid`
2. [ ] - `p1` - **IF** `from` is `dimensions[i]` and the query has an entry at position `i` in `dimensions` - `inst-from-dimension`
   1. [ ] - `p1` - **RETURN** that dimension - `inst-from-dimension-return`
3. [ ] - `p1` - **IF** `from` is `measures[i]` and the query has an entry at position `i` in `measures` - `inst-from-measure`
   1. [ ] - `p1` - **RETURN** that measure - `inst-from-measure-return`
4. [ ] - `p1` - **IF** `from` is `timeDimensions[0]` and the query has `timeDimensions[0]` with a `granularity` (`timeDimensions[0]` resolves only then, because only then is the time dimension a result column) - `inst-from-time`
   1. [ ] - `p1` - **RETURN** the time dimension of the query, `timeDimensions[0].dimension` - `inst-from-time-return`
5. [ ] - `p1` - **RETURN** nothing, because the query has no such member - `inst-from-none`

### Fill by `rows_by_member`

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-algo-widget-data-catalog-fill-rows-by-member`

**Input**: the query, the grouped result, and `fields`, a list of `{field, from}`. This mode needs no total and no count.

**Output**: `rows`, one object per result row.

**Steps**:
1. [ ] - `p1` - **FOR EACH** result row in the delivered order - `inst-rbm-row`
   1. [ ] - `p1` - Start an empty row object - `inst-rbm-start`
   2. [ ] - `p1` - **FOR EACH** `{field, from}` in `fields` - `inst-rbm-field`
      1. [ ] - `p1` - Resolve `from` with `cpt-frontx-dashboard-algo-widget-data-catalog-resolve-from` - `inst-rbm-resolve`
      2. [ ] - `p1` - **IF** a member was found, set `field` of the row object to the value of that member in the result row - `inst-rbm-set`
      3. [ ] - `p1` - **ELSE** omit `field` from the row object - `inst-rbm-omit`
   3. [ ] - `p1` - Append the row object to `rows` - `inst-rbm-append`
2. [ ] - `p1` - **RETURN** `rows` - `inst-rbm-return`

The mode adds no field that `fields` does not name. Whether a required field of the shape is present follows from the query limits of the widget type, so a valid widget never leaves a required field absent.

### Fill by `x_series_value`

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-algo-widget-data-catalog-fill-x-series-value`

**Input**: the query and the grouped result. This mode needs no total and no count.

**Output**: `rows`, in long format.

**Steps**:
1. [ ] - `p1` - Choose the `x` member: the time dimension when `timeDimensions[0]` has a `granularity`, otherwise `dimensions[0]` - `inst-xsv-x`
2. [ ] - `p1` - **IF** the query has one measure - `inst-xsv-single`
   1. [ ] - `p1` - Choose the `series` member: the first dimension that is not the `x` member, if there is one - `inst-xsv-series`
   2. [ ] - `p1` - **FOR EACH** result row in the delivered order, emit `{x, series?, value}`: `x` is the value of the `x` member, `series` is the value of the `series` member and is omitted when there is none, and `value` is the value of the measure - `inst-xsv-emit-single`
3. [ ] - `p1` - **ELSE** the query has several measures - `inst-xsv-multi`
   1. [ ] - `p1` - **FOR EACH** result row in the delivered order, **FOR EACH** measure in query order, emit `{x, series, value}`: `x` is the value of the `x` member, `series` is the id of the measure, and `value` is the value of that measure - `inst-xsv-emit-multi`
4. [ ] - `p1` - **RETURN** `rows` - `inst-xsv-return`

With several measures, the query limits of `cartesian_chart` allow either `timeDimensions[0]` with a `granularity` and no dimension, or no `granularity` and one dimension. In both cases the `x` member is the only grouping member, so every row of a measure has its own `x` value.

### Fill by `row_per_measure`

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-algo-widget-data-catalog-fill-row-per-measure`

**Input**: the query, the grouped result, and the query-grain total of each measure.

**Output**: `rows`, one `{key, value}` per measure.

**Steps**:
1. [ ] - `p1` - **FOR EACH** measure in query order - `inst-rpm-measure`
   1. [ ] - `p1` - Take the query-grain total of the measure from the input. It is never a sum of grouped values for a measure that is not additive - `inst-rpm-total`
   2. [ ] - `p1` - Emit `{key, value}`: `key` is the id of the measure and `value` is the total - `inst-rpm-emit`
2. [ ] - `p1` - **RETURN** `rows` - `inst-rpm-return`

### Fill by `positional_table`

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-algo-widget-data-catalog-fill-positional-table`

**Input**: the query, the grouped result, which holds the rows of the requested page, and the row count that ignores `limit` and `offset`.

**Output**: `rows`, one array per result row, and `total`.

**Steps**:
1. [ ] - `p1` - Build the canonical member order of the query - `inst-pt-order`
2. [ ] - `p1` - **FOR EACH** result row in the delivered order - `inst-pt-row`
   1. [ ] - `p1` - Emit one array whose entry at each position is the value of the member at that position of the canonical member order, or null when the result row has no value for it - `inst-pt-emit`
3. [ ] - `p1` - Set `total` to the row count from the input: the number of rows that the query would return with no `limit` and no `offset`, which the grid query asks for with `total: true`. The adapter is bound to `total ≥ offset + rows.length`, and `cpt-frontx-dashboard-feature-data-adapter-contract` carries the conformance case - `inst-pt-total`
4. [ ] - `p1` - **RETURN** `rows` and `total` - `inst-pt-return`

`rows` holds only the rows of the requested page. Rows are arrays because GTS identifiers are never used as object keys (`cpt-frontx-dashboard-constraint-gts-id-convention`).

### Fill by `scalar_with_series`

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-algo-widget-data-catalog-fill-scalar-with-series`

**Input**: the query, which has one measure, the grouped result, and the totals of the measure at the query grain: over the query, or over range 1 when `timeDimensions[0]` has a `compareDateRange`, and over range 2 in that case.

**Output**: `{value, previous_value?, sparkline?}`.

**Steps**:
1. [ ] - `p1` - Set `value` to the query-grain total of the measure from the input. When `timeDimensions[0]` has a `compareDateRange`, it is the total over range 1. The total is never a sum of grouped values for a measure that is not additive - `inst-sws-value`
2. [ ] - `p1` - **IF** `timeDimensions[0]` has a `compareDateRange` - `inst-sws-compare`
   1. [ ] - `p1` - Set `previous_value` to the query-grain total of the measure over range 2 of `compareDateRange`, from the input - `inst-sws-previous`
3. [ ] - `p1` - **ELSE** omit `previous_value` - `inst-sws-previous-omit`
4. [ ] - `p1` - **IF** `timeDimensions[0]` has a `granularity` - `inst-sws-granularity`
   1. [ ] - `p1` - Set `sparkline` to the value of the measure in each row of the grouped result, one row per `granularity` step of `timeDimensions[0]`, in time order. With a `compareDateRange`, the steps are those of range 1 only - `inst-sws-sparkline`
5. [ ] - `p1` - **ELSE** omit `sparkline` - `inst-sws-sparkline-omit`
6. [ ] - `p1` - **RETURN** the object - `inst-sws-return`

`value` and `previous_value` are never the sum of the series. A sum is wrong for a measure that is not additive, such as a percentage or a distinct count. The previous period is written out as range 2 of `compareDateRange`; the template does not derive it.

### Build the Data Instance

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-algo-widget-data-catalog-build-instance`

**Input**: the requested data shape id and the filled fields.

**Output**: a data instance.

**Steps**:
1. [ ] - `p1` - Generate a UUID - `inst-bi-uuid`
2. [ ] - `p1` - Set `id` to the data shape type followed by the UUID, so the id has the form `<data shape type><uuid>`, where the type id already ends with `~` - `inst-bi-id`
3. [ ] - `p1` - Add the filled fields to the instance - `inst-bi-fields`
4. [ ] - `p1` - **RETURN** the instance - `inst-bi-return`

An example for the grid, where `7e3a9c51-0b2d-4f86-9a14-c5d8e2f60b39` is the generated UUID:

```json
{
  "id": "gts.frontx.dashboard_m.widget_data.widget_data.v1~frontx.dashboard_m.widget_data.grid.v1~7e3a9c51-0b2d-4f86-9a14-c5d8e2f60b39",
  "rows": [
    ["jdoe", "frontx", 18452, 37],
    ["asmith", "web-ui", 12907, 22]
  ],
  "total": 143
}
```

### Validate a Data Instance

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-algo-widget-data-catalog-validate-set-data`

**Input**: the `data` of one `set_data` action.

**Output**: accepted or rejected.

**Steps**:
1. [ ] - `p1` - FrontX reads the data shape type from the `id` of the data instance, which is the id without its UUID - `inst-vd-type`
2. [ ] - `p1` - FrontX validates the instance against that derived shape, through the polymorphic validation of the FrontX GTS plugin (a required capability, DESIGN prerequisites) on the action payload - `inst-vd-validate`
3. [ ] - `p1` - **IF** the instance does not satisfy the shape that its own id names - `inst-vd-reject`
   1. [ ] - `p1` - **RETURN** rejected, so the widget never receives the data - `inst-vd-rejected`
4. [ ] - `p1` - **RETURN** accepted - `inst-vd-accepted`

FrontX does not know which shape was requested. The comparison of the answered instance's shape with the `data_shape` of the request is the work of the domain owner before `set_data`, and the owner drops a mismatch (`cpt-frontx-dashboard-feature-extension-domain-catalog`). The widget does not compare shapes and does not check the data. The widget renders what it receives.

## 4. States (CDSL)

### Domain-Model Feature: No State Machines

N/A. Type declarations are stateless. The data states of a widget (loader, busy, empty) are specified in `cpt-frontx-dashboard-feature-widget-catalog`.

## 5. Definitions of Done

### Data Shapes Definition of Done

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-dod-widget-data-catalog-shapes-complete`

The system **MUST** declare the abstract data shape base and exactly 8 derived data shapes in package `dashboard_m`, and **MUST NOT** declare any other data shape.

- The base is `gts.frontx.dashboard_m.widget_data.widget_data.v1~`. It is abstract and carries `id`, constrained with `x-gts-instance-ref` to the literal base operand `gts.frontx.dashboard_m.widget_data.widget_data.v1~`.
- The 8 shapes are `summary_card`, `metric_card`, `ranked_list_card`, `progress_list_card`, `pie_chart`, `cartesian_chart`, `heatmap` and `grid`, each derived from the base, with the fields of section 6.
- Each shape is its own type, even where two shapes have the same fields.
- `markdown_card` has no data shape.
- Every shape ends with `unevaluatedProperties: false`.
- Measure-valued fields and dimension-valued fields (`label`, `x`, `y`, `series`) accept `null`.
- No schema declares an object whose keys are GTS ids. Grid rows are positional arrays.
- Every schema passes GTS identifier grammar and GTS v0.17 schema validation through FrontX.

### Fill Modes Definition of Done

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-dod-widget-data-catalog-fill-modes-complete`

The system **MUST** define exactly 5 fill modes, `rows_by_member`, `x_series_value`, `row_per_measure`, `positional_table` and `scalar_with_series`, with the rules of section 3.

**Implements**:
- `cpt-frontx-dashboard-algo-widget-data-catalog-resolve-from`
- `cpt-frontx-dashboard-algo-widget-data-catalog-fill-rows-by-member`
- `cpt-frontx-dashboard-algo-widget-data-catalog-fill-x-series-value`
- `cpt-frontx-dashboard-algo-widget-data-catalog-fill-row-per-measure`
- `cpt-frontx-dashboard-algo-widget-data-catalog-fill-positional-table`
- `cpt-frontx-dashboard-algo-widget-data-catalog-fill-scalar-with-series`

- Only `rows_by_member` has `fields`.
- An absent field is omitted.
- `from` is one of `dimensions[i]`, `measures[i]` or `timeDimensions[0]`, and `timeDimensions[0]` resolves only when it has a `granularity`.
- `x_series_value` takes `x` from the time dimension when `timeDimensions[0]` has a `granularity`. With several measures it gives one row per measure and result row, with the measure id as `series`.
- `positional_table` follows the canonical member order and sets `total` to the row count with no `limit` and no `offset`.
- `row_per_measure` and `scalar_with_series` take each total as the backend's value at the query grain. A total is never a sum of grouped values for a measure that is not additive.
- `scalar_with_series` takes `value` from range 1 and `previous_value` from range 2 of `compareDateRange`, and takes `sparkline` per `granularity` step of `timeDimensions[0]`.
- A null measure value and a null dimension value stay `null`.
- A new fill mode is a change of the template.

### Data Instance Definition of Done

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-dod-widget-data-catalog-instance-validation`

The system **MUST** give every data instance a combined id and **MUST** validate every `set_data` against the shape that this id names.

**Implements**:
- `cpt-frontx-dashboard-algo-widget-data-catalog-build-instance`
- `cpt-frontx-dashboard-algo-widget-data-catalog-validate-set-data`

- The id has the form `<data shape type><uuid>`, where the type id already ends with `~`, and the data adapter generates the UUID.
- FrontX applies the exact shape named by the id. A widget never compares shapes.
- An instance that violates the shape its own id names is rejected. Data of another widget type's shape is dropped by the domain owner, which compares the instance's shape with the `data_shape` of the request before `set_data` (`cpt-frontx-dashboard-feature-extension-domain-catalog`).

## 6. Domain Model

All schemas are GTS v0.17 types in package `dashboard_m`. The 8 derived shapes derive from the base with `allOf` and a `$ref` to the base, and each ends with `unevaluatedProperties: false`. Value types: a measure value is a number or null (a measure that has no value for a row, a total or a time step is null); a dimension value, such as a label or an axis value, is a string, a number or null (a row whose dimension has no value); a time dimension value is a date string in canonical form: for every `granularity` (`day`, `week`, `month`, `quarter` and `year`), the first day of the period as a `YYYY-MM-DD` date, in the query's `timezone`. A week starts on Monday. A positional grid cell that holds no value is null.

### 6.1 WidgetData (abstract base)

**GTS ID**: `gts.frontx.dashboard_m.widget_data.widget_data.v1~`

**Description**: The abstract base of every data shape. It carries the combined `id` of a data instance. No data instance belongs to the base itself. Every instance belongs to one of the 8 derived shapes. The `id` has the form `<data shape type><uuid>`, where the type id already ends with `~`, and the data adapter generates the UUID. The `id` field uses the literal base operand, never the self-reference operand, so every derived id is accepted.

**Schema**:

```json
{
  "$id": "gts://gts.frontx.dashboard_m.widget_data.widget_data.v1~",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "WidgetData",
  "description": "Abstract base of every data shape. Carries the combined instance id.",
  "type": "object",
  "x-gts-abstract": true,
  "required": [
    "id"
  ],
  "properties": {
    "id": {
      "type": "string",
      "x-gts-instance-ref": "gts.frontx.dashboard_m.widget_data.widget_data.v1~",
      "description": "Combined anonymous instance id: the data shape type followed by a UUID that the data adapter generates."
    }
  }
}
```

### 6.2 SummaryCardData

**GTS ID**: `gts.frontx.dashboard_m.widget_data.widget_data.v1~frontx.dashboard_m.widget_data.summary_card.v1~`

**Description**: The data of `summary_card`. Fill mode `row_per_measure`. One row per measure of the query, in query order. `key` is the measure id and `value` is its total over the query.

**Schema**:

```json
{
  "$id": "gts://gts.frontx.dashboard_m.widget_data.widget_data.v1~frontx.dashboard_m.widget_data.summary_card.v1~",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "SummaryCardData",
  "description": "Data of a summary_card widget, filled by row_per_measure: one row per measure, in query order.",
  "allOf": [
    {
      "$ref": "gts://gts.frontx.dashboard_m.widget_data.widget_data.v1~"
    },
    {
      "type": "object",
      "required": [
        "rows"
      ],
      "properties": {
        "rows": {
          "type": "array",
          "description": "One row per measure in query order.",
          "items": {
            "type": "object",
            "required": [
              "key",
              "value"
            ],
            "properties": {
              "key": {
                "type": "string",
                "x-gts-instance-ref": "gts.frontx.dashboard_m.data.measure.v1~"
              },
              "value": {
                "type": [
                  "number",
                  "null"
                ]
              }
            },
            "additionalProperties": false
          }
        }
      }
    }
  ],
  "unevaluatedProperties": false
}
```

### 6.3 MetricCardData

**GTS ID**: `gts.frontx.dashboard_m.widget_data.widget_data.v1~frontx.dashboard_m.widget_data.metric_card.v1~`

**Description**: The data of `metric_card`. Fill mode `scalar_with_series`. `value` is the total over the query, or over range 1 when `timeDimensions[0]` has a `compareDateRange`. `previous_value` is present only with a `compareDateRange`, and it is the total over range 2. `sparkline` is present only when `timeDimensions[0]` has a `granularity`. The widget computes the trend from `value` and `previous_value`. The widget ignores `previous_value` unless its query has a `compareDateRange`, and ignores `sparkline` unless `timeDimensions[0]` has a `granularity`.

**Schema**:

```json
{
  "$id": "gts://gts.frontx.dashboard_m.widget_data.widget_data.v1~frontx.dashboard_m.widget_data.metric_card.v1~",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "MetricCardData",
  "description": "Data of a metric_card widget, filled by scalar_with_series.",
  "allOf": [
    {
      "$ref": "gts://gts.frontx.dashboard_m.widget_data.widget_data.v1~"
    },
    {
      "type": "object",
      "required": [
        "value"
      ],
      "properties": {
        "value": {
          "type": [
            "number",
            "null"
          ]
        },
        "previous_value": {
          "type": [
            "number",
            "null"
          ]
        },
        "sparkline": {
          "type": "array",
          "items": {
            "type": [
              "number",
              "null"
            ]
          }
        }
      }
    }
  ],
  "unevaluatedProperties": false
}
```

### 6.4 RankedListCardData

**GTS ID**: `gts.frontx.dashboard_m.widget_data.widget_data.v1~frontx.dashboard_m.widget_data.ranked_list_card.v1~`

**Description**: The data of `ranked_list_card`. Fill mode `rows_by_member` with the fields `label` from `dimensions[0]`, `value` from `measures[0]` and `secondary` from `measures[1]`. `secondary` is omitted when the query has one measure.

**Schema**:

```json
{
  "$id": "gts://gts.frontx.dashboard_m.widget_data.widget_data.v1~frontx.dashboard_m.widget_data.ranked_list_card.v1~",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "RankedListCardData",
  "description": "Data of a ranked_list_card widget, filled by rows_by_member.",
  "allOf": [
    {
      "$ref": "gts://gts.frontx.dashboard_m.widget_data.widget_data.v1~"
    },
    {
      "type": "object",
      "required": [
        "rows"
      ],
      "properties": {
        "rows": {
          "type": "array",
          "description": "Rows in the delivered order. secondary is omitted when the query has one measure.",
          "items": {
            "type": "object",
            "required": [
              "label",
              "value"
            ],
            "properties": {
              "label": {
                "type": [
                  "string",
                  "number",
                  "null"
                ]
              },
              "value": {
                "type": [
                  "number",
                  "null"
                ]
              },
              "secondary": {
                "type": [
                  "number",
                  "null"
                ]
              }
            },
            "additionalProperties": false
          }
        }
      }
    }
  ],
  "unevaluatedProperties": false
}
```

### 6.5 ProgressListCardData

**GTS ID**: `gts.frontx.dashboard_m.widget_data.widget_data.v1~frontx.dashboard_m.widget_data.progress_list_card.v1~`

**Description**: The data of `progress_list_card`. Fill mode `rows_by_member` with the fields `label` from `dimensions[0]`, `current` from `measures[0]` and `target` from `measures[1]`.

**Schema**:

```json
{
  "$id": "gts://gts.frontx.dashboard_m.widget_data.widget_data.v1~frontx.dashboard_m.widget_data.progress_list_card.v1~",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "ProgressListCardData",
  "description": "Data of a progress_list_card widget, filled by rows_by_member.",
  "allOf": [
    {
      "$ref": "gts://gts.frontx.dashboard_m.widget_data.widget_data.v1~"
    },
    {
      "type": "object",
      "required": [
        "rows"
      ],
      "properties": {
        "rows": {
          "type": "array",
          "description": "Rows in the delivered order.",
          "items": {
            "type": "object",
            "required": [
              "label",
              "current",
              "target"
            ],
            "properties": {
              "label": {
                "type": [
                  "string",
                  "number",
                  "null"
                ]
              },
              "current": {
                "type": [
                  "number",
                  "null"
                ]
              },
              "target": {
                "type": [
                  "number",
                  "null"
                ]
              }
            },
            "additionalProperties": false
          }
        }
      }
    }
  ],
  "unevaluatedProperties": false
}
```

### 6.6 PieChartData

**GTS ID**: `gts.frontx.dashboard_m.widget_data.widget_data.v1~frontx.dashboard_m.widget_data.pie_chart.v1~`

**Description**: The data of `pie_chart`. Fill mode `rows_by_member` with the fields `label` from `dimensions[0]` and `value` from `measures[0]`.

**Schema**:

```json
{
  "$id": "gts://gts.frontx.dashboard_m.widget_data.widget_data.v1~frontx.dashboard_m.widget_data.pie_chart.v1~",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "PieChartData",
  "description": "Data of a pie_chart widget, filled by rows_by_member.",
  "allOf": [
    {
      "$ref": "gts://gts.frontx.dashboard_m.widget_data.widget_data.v1~"
    },
    {
      "type": "object",
      "required": [
        "rows"
      ],
      "properties": {
        "rows": {
          "type": "array",
          "description": "Rows in the delivered order.",
          "items": {
            "type": "object",
            "required": [
              "label",
              "value"
            ],
            "properties": {
              "label": {
                "type": [
                  "string",
                  "number",
                  "null"
                ]
              },
              "value": {
                "type": [
                  "number",
                  "null"
                ]
              }
            },
            "additionalProperties": false
          }
        }
      }
    }
  ],
  "unevaluatedProperties": false
}
```

### 6.7 CartesianChartData

**GTS ID**: `gts.frontx.dashboard_m.widget_data.widget_data.v1~frontx.dashboard_m.widget_data.cartesian_chart.v1~`

**Description**: The data of `cartesian_chart`. Fill mode `x_series_value`, in long format. With one measure, `series` is the first dimension that is not used for `x`, and it is omitted when there is none. With several measures, `series` is the measure id.

**Schema**:

```json
{
  "$id": "gts://gts.frontx.dashboard_m.widget_data.widget_data.v1~frontx.dashboard_m.widget_data.cartesian_chart.v1~",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "CartesianChartData",
  "description": "Data of a cartesian_chart widget, filled by x_series_value, in long format.",
  "allOf": [
    {
      "$ref": "gts://gts.frontx.dashboard_m.widget_data.widget_data.v1~"
    },
    {
      "type": "object",
      "required": [
        "rows"
      ],
      "properties": {
        "rows": {
          "type": "array",
          "description": "Rows in long format. series is omitted when the query has one measure and no dimension besides x.",
          "items": {
            "type": "object",
            "required": [
              "x",
              "value"
            ],
            "properties": {
              "x": {
                "type": [
                  "string",
                  "number",
                  "null"
                ]
              },
              "series": {
                "type": [
                  "string",
                  "number",
                  "null"
                ]
              },
              "value": {
                "type": [
                  "number",
                  "null"
                ]
              }
            },
            "additionalProperties": false
          }
        }
      }
    }
  ],
  "unevaluatedProperties": false
}
```

### 6.8 HeatmapData

**GTS ID**: `gts.frontx.dashboard_m.widget_data.widget_data.v1~frontx.dashboard_m.widget_data.heatmap.v1~`

**Description**: The data of `heatmap`. Fill mode `rows_by_member` with the fields `x` from `dimensions[0]`, `y` from `dimensions[1]` and `value` from `measures[0]`.

**Schema**:

```json
{
  "$id": "gts://gts.frontx.dashboard_m.widget_data.widget_data.v1~frontx.dashboard_m.widget_data.heatmap.v1~",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "HeatmapData",
  "description": "Data of a heatmap widget, filled by rows_by_member.",
  "allOf": [
    {
      "$ref": "gts://gts.frontx.dashboard_m.widget_data.widget_data.v1~"
    },
    {
      "type": "object",
      "required": [
        "rows"
      ],
      "properties": {
        "rows": {
          "type": "array",
          "description": "One row per cell value.",
          "items": {
            "type": "object",
            "required": [
              "x",
              "y",
              "value"
            ],
            "properties": {
              "x": {
                "type": [
                  "string",
                  "number",
                  "null"
                ]
              },
              "y": {
                "type": [
                  "string",
                  "number",
                  "null"
                ]
              },
              "value": {
                "type": [
                  "number",
                  "null"
                ]
              }
            },
            "additionalProperties": false
          }
        }
      }
    }
  ],
  "unevaluatedProperties": false
}
```

### 6.9 GridData

**GTS ID**: `gts.frontx.dashboard_m.widget_data.widget_data.v1~frontx.dashboard_m.widget_data.grid.v1~`

**Description**: The data of `grid`. Fill mode `positional_table`. Each row is an array in the canonical member order of the query, and `total` is the row count across all pages. JSON Schema cannot express that each row has one entry for each result column, so the data adapter is bound to that rule, and to `total ≥ offset + rows.length`.

**Schema**:

```json
{
  "$id": "gts://gts.frontx.dashboard_m.widget_data.widget_data.v1~frontx.dashboard_m.widget_data.grid.v1~",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "GridData",
  "description": "Data of a grid widget, filled by positional_table.",
  "allOf": [
    {
      "$ref": "gts://gts.frontx.dashboard_m.widget_data.widget_data.v1~"
    },
    {
      "type": "object",
      "required": [
        "rows",
        "total"
      ],
      "properties": {
        "rows": {
          "type": "array",
          "description": "One array per row, in the canonical member order of the query. A position that holds no value holds null.",
          "items": {
            "type": "array",
            "items": {
              "type": [
                "string",
                "number",
                "null"
              ]
            }
          }
        },
        "total": {
          "type": "integer",
          "minimum": 0,
          "description": "Row count across all pages, ignoring limit and offset."
        }
      }
    }
  ],
  "unevaluatedProperties": false
}
```

### 6.10 Fill Modes

The fill modes are template-defined rules, not GTS types. The set is closed. The table gives each mode, what it produces, and the widget types that use it. The rules are the algorithms of section 3.

| Fill mode | Produces | Rule in short | Used by |
|---|---|---|---|
| `rows_by_member` | `rows: [{<field>: value, ...}]`, one object per result row | Each `fields[i].field` takes the result value of `fields[i].from`. A field whose `from` names a member that the query does not have is omitted. | `ranked_list_card`, `progress_list_card`, `pie_chart`, `heatmap` |
| `x_series_value` | `rows: [{x, series?, value}]` | `x` is the time dimension when `timeDimensions[0]` has a `granularity`, else the first dimension. One measure: `series` is the first dimension not used for `x`, if any. Several measures: one row per measure, with the measure id as `series`. | `cartesian_chart` |
| `row_per_measure` | `rows: [{key, value}]` | One row per measure in query order, with the backend's total at the query grain. | `summary_card` |
| `positional_table` | `rows: [[...]]` and `total` | One array per result row in the canonical member order. `total` ignores `limit` and `offset`. | `grid` |
| `scalar_with_series` | `{value, previous_value?, sparkline?}` | Totals computed by the backend at the query grain. `value` from range 1 and `previous_value` from range 2 when `compareDateRange` is set. `sparkline` when `timeDimensions[0]` has a `granularity`. | `metric_card` |

The `from` grammar: only `rows_by_member` has `fields`. Each entry is `{field, from}`, and `from` is one of `dimensions[i]`, `measures[i]` or `timeDimensions[0]`, where `i` is a position in the query's own lists. `from: timeDimensions[0]` resolves only when `timeDimensions[0]` has a `granularity`. Which widget type uses which mode is set by the traits `data_shape` and `fill` in `cpt-frontx-dashboard-feature-widget-catalog`.

**Cross-references**:

- The query, its members and the canonical member order: `cpt-frontx-dashboard-feature-query-vocabulary`.
- The traits `data_shape` and `fill` of each widget type: `cpt-frontx-dashboard-feature-widget-catalog`.
- The `request_data` and `set_data` actions that carry a shape: `cpt-frontx-dashboard-feature-extension-domain-catalog`.
- The calls of the data adapter and its obligations: `cpt-frontx-dashboard-feature-data-adapter-contract`. The data states of a widget are specified in `cpt-frontx-dashboard-feature-widget-catalog`.
- Interfaces: `cpt-frontx-dashboard-interface-data-adapter` (the shapes and fill modes that "run a query" returns), `cpt-frontx-dashboard-interface-domain-model`.
- Requirements: `cpt-frontx-dashboard-fr-domain-model`, `cpt-frontx-dashboard-fr-widget-catalog`, `cpt-frontx-dashboard-fr-data-adapter`, `cpt-frontx-dashboard-fr-backend-source`, `cpt-frontx-dashboard-fr-grid-sort-page`.

## 7. Acceptance Criteria

- [ ] The base `gts.frontx.dashboard_m.widget_data.widget_data.v1~` and exactly 8 derived shapes are authored with full JSON Schemas, and no other data shape exists.
- [ ] Every identifier follows GTS grammar, and every schema validates under GTS v0.17 through FrontX.
- [ ] `cfs validate --artifact` reports no structural errors for this document.
- [ ] The `id` of the base uses the literal base operand, and no schema uses the self-reference operand for it.
- [ ] Given a grid instance with an `id` that names the grid shape, `rows` as arrays and an integer `total`, when FrontX validates it, then it is accepted.
- [ ] Given a grid instance whose `rows` are objects keyed by a GTS id, when FrontX validates it, then it is rejected.
- [ ] Given a data instance that violates the shape its own `id` names, when FrontX validates the `set_data`, then it is rejected and the widget does not receive it.
- [ ] Given a `pie_chart` request answered with an instance whose `id` names the `grid` shape, when the domain owner compares the instance's shape with the `data_shape` of the request, then it drops the answer and does not call `set_data`.
- [ ] Given a data instance with a field that its shape does not declare, when FrontX validates it, then it is rejected.
- [ ] Given a `ranked_list_card` query with one measure and `rows_by_member` fields `label`, `value` and `secondary` (from `measures[1]`), when the data adapter fills the shape, then every row has `label` and `value` and no row has `secondary`.
- [ ] Given a `cartesian_chart` query with one measure, `timeDimensions[0]` with a `granularity` and one dimension, when `x_series_value` fills the shape, then `x` is the time value, `series` is the dimension value and `value` is the measure.
- [ ] Given a `cartesian_chart` query with one measure and one dimension and no `granularity`, when `x_series_value` fills the shape, then `x` is the dimension value and no row has `series`.
- [ ] Given a `cartesian_chart` query with two measures, `timeDimensions[0]` with a `granularity` and no dimension, when `x_series_value` fills the shape, then each time step gives two rows, and the `series` of each row is the id of its measure.
- [ ] Given a `summary_card` query with three measures, when `row_per_measure` fills the shape, then `rows` has three entries in query order, each with the measure id as `key`.
- [ ] Given a `grid` query with one dimension, `timeDimensions[0]` with a `granularity` and two measures, when `positional_table` fills the shape, then each row has four entries in the order dimension, time dimension, measure, measure. Given the same query with no `granularity`, then each row has three entries, because the time dimension gives no column.
- [ ] Given a grid instance with a row whose length differs from the number of result columns, then the data adapter violates its obligation, and `cpt-frontx-dashboard-feature-data-adapter-contract` catches it as a conformance failure.
- [ ] Given a grid instance whose `total` is smaller than `offset + rows.length`, then the data adapter violates its obligation.
- [ ] Given a `grid` query with `limit` 25 and `offset` 25 over 143 rows, when `positional_table` fills the shape, then `rows` holds one page and `total` is 143.
- [ ] Given a `metric_card` query whose `timeDimensions[0]` has `granularity` `day` and `compareDateRange` `["this month", "last month"]`, when `scalar_with_series` fills the shape, then `value` is the backend's total over this month, `previous_value` is the backend's total over last month, `sparkline` holds one point per day of this month, and `value` is not the sum of `sparkline`.
- [ ] Given a `metric_card` query with no `timeDimensions`, when `scalar_with_series` fills the shape, then `previous_value` and `sparkline` are omitted.
- [ ] Given a `metric_card` query with `timeDimensions[0]` that has a `dateRange` and no `compareDateRange`, when `scalar_with_series` fills the shape, then `previous_value` is omitted.
- [ ] Given a `metric_card` query with `timeDimensions[0]` with a `granularity` in which one step has no value, when `scalar_with_series` fills the shape, then that `sparkline` point is `null` and FrontX accepts the instance.
- [ ] Given a `summary_card` query with a `percent` measure, when `row_per_measure` fills the shape, then `value` is the backend's value at the query grain, and not a sum of values grouped by any member.
- [ ] Given a `cartesian_chart` row whose measure has no value, then `value` is `null` and FrontX accepts the instance.
- [ ] Given a `pie_chart` result row whose dimension has no value, when `rows_by_member` fills the shape, then `label` is `null` and FrontX accepts the instance. The same holds for `x`, `y` and `series` in the shapes that have them.
- [ ] Given a `cartesian_chart` query with `timeDimensions[0]` with `granularity` `month` and a row for March 2026, then `x` is `2026-03-01`. For `week` it is the Monday of the week, for `quarter` the first day of the quarter, for `year` the first day of the year, and for `day` the day itself, each in the query's `timezone`.
- [ ] Given a `from` of `timeDimensions[0]` on a query whose `timeDimensions[0]` has no `granularity`, then it resolves to nothing and the field is omitted.
- [ ] Given a `from` of `time` or `timeDimensions[1]`, then it does not match the grammar of `from`.
- [ ] Given a `from` of `measures[3]` on a query with two measures, when `rows_by_member` fills the shape, then the field is omitted from every row.
- [ ] Given a test data adapter that names no backend, when it answers each of the 8 data widget types with an instance of its shape, then FrontX accepts every answer.
- [ ] A new widget type that reuses a fill mode needs no change to the data adapter.
