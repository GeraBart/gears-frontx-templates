---
status: accepted
version: 1
date: 2026-10-27
description: Domain-model type of the single concrete widget data type, the generic tabular result that the consuming product backend returns for every widget data request whatever the widget type, declared by dashboard-viewer.
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
  - [Domain-Model Feature: No Processes](#domain-model-feature-no-processes)
- [4. States (CDSL)](#4-states-cdsl)
  - [Domain-Model Feature: No State Machines](#domain-model-feature-no-state-machines)
- [5. Definitions of Done](#5-definitions-of-done)
  - [Domain Model Definition of Done](#domain-model-definition-of-done)
- [6. Domain Model](#6-domain-model)
  - [6.1 WidgetData](#61-widgetdata)
- [7. Acceptance Criteria](#7-acceptance-criteria)

<!-- /toc -->

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-featstatus-widget-data-catalog`
## 1. Feature Context

- [ ] `p2` - `cpt-frontx-dashboard-feature-widget-data-catalog`

### 1.1 Overview

This feature is a **domain-model feature**, not an actor-flow feature, declared in package `dashboard-viewer`. It declares the one widget data type of the template, `gts.frontx.v.widget_data.widget_data.v1~`, under the FrontX vendor `frontx`. The type is concrete: there is no abstract data base above it, and the template declares no other widget data type. It is the generic tabular result that the consuming product backend returns for every widget data request, whatever the widget type: the ordered column names, the rows as positional value arrays aligned to the columns, and the names of the columns that hold percentages. The dashboard definition carries no widget data. The structural prose lives in DESIGN section 3.1 and the result shape in DESIGN section 3.3; the schema lives in section 6 Domain Model. The sections for flows, processes, and states are reduced to short not-applicable notes.

### 1.2 Purpose

Concrete declaration of the widget data type that every widget checks every result against, with its full GTS-typed JSON Schema. It addresses the domain model and the widget catalog of the PRD and the Widget data entity of DESIGN section 3.1. One type serves every metric and every widget type, so a consuming product backend produces one result shape, and adding a widget type adds no data type. The backend can validate the results it returns against the same type that the widgets use.

No widget type names this type. A widget type binds result columns by name in its presentation configuration, and package `m` holds no reference into package `v`, so this feature and the widget catalog are independent of each other.

**Requirements**: `cpt-frontx-dashboard-fr-domain-model`, `cpt-frontx-dashboard-fr-widget-catalog`, `cpt-frontx-dashboard-fr-backend-source`

**Principles**: `cpt-frontx-dashboard-principle-gts-contracts`

### 1.3 Actors

N/A. This is a domain-model feature. The type is consumed by the runtime type system, not by an end-user actor: the cell entry and the modal entry of each widget type validate the result of their widget data request against it through the FrontX gts-plugin. The consuming product backend produces results of this type; its part is specified in feature-backend-contract. No actor flows are authored here.

### 1.4 References

- **PRD**: [PRD.md](../../PRD.md)
- **Design**: [DESIGN.md](../../DESIGN.md) section 3.1 (Domain Model, the Widget data entity and its base shape), section 3.3 (Dashboard Definition and Widget Data, the widget data result)
- **ADRs**: [ADR-0003](../../ADR/0003-shared-data-types-and-schemas-v1.md) (the single widget data type and validation through the FrontX gts-plugin), [ADR-0008](../../ADR/0008-widget-type-and-mfe-realization-v1.md) (a replacement realization sends the same request and checks the same type), [ADR-0009](../../ADR/0009-subject-agnostic-widget-catalog-v1.md) (column bindings, the cannot-show state for a missing bound column, and the empty state), [ADR-0011](../../ADR/0011-backend-delivered-dashboard-v1.md) (the per-widget data request and its result)
- **Declaring package**: `dashboard-viewer` (`src-app/mfe_packages/dashboard-viewer/`)
- **Decomposition**: [DECOMPOSITION.md](../../DECOMPOSITION.md) section 2.1
- **Dependencies**: None.
- **Related**: [feature-backend-contract](../feature-backend-contract/FEATURE.md) (section 6.2, the widget data request that names a metric and its result; section 6.3, widget data that cannot be shown); [feature-widget-catalog](../feature-widget-catalog/FEATURE.md) (the column bindings of each widget type, the column-binding check against the column names of a result, and the empty state of each widget type)

## 2. Actor Flows (CDSL)

### Domain-Model Feature: No Actor Flows

N/A. Domain model content is consumed at runtime by the type system, not by an actor flow. The type lives in section 6.

## 3. Processes / Business Logic (CDSL)

### Domain-Model Feature: No Processes

N/A. This feature declares a static GTS schema. The validation of a result, the column-binding check, and the choice of the empty state run in the widget entries of `dashboard-widgets`, not in this declaration.

## 4. States (CDSL)

### Domain-Model Feature: No State Machines

N/A. Type declarations are stateless.

## 5. Definitions of Done

### Domain Model Definition of Done

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-dod-widget-data-catalog-catalog-complete`

The system **MUST** declare exactly one widget data type, `gts.frontx.v.widget_data.widget_data.v1~`, in `dashboard-viewer` under the FrontX vendor `frontx`, and **MUST NOT** declare any other widget data type.

- The type passes GTS identifier grammar and GTS v0.17 schema validation through the FrontX gts-plugin.
- The type is concrete: it is not marked `x-gts-abstract`, it derives from no widget data base, and no template type derives from it.
- The type declares exactly the fields `columns`, `rows`, and `percent_columns`, and no other field: no `id`, no column types, and nothing that nests rows.
- No widget type references the type. Every widget type validates its results against it, in its cell entry and in its modal entry.
- A widget data fixture for each of the 9 widget types validates against the type.
- The type is described only as the result of one widget data request that names a metric; the dashboard definition carries no widget data.

## 6. Domain Model

### 6.1 WidgetData

**GTS ID**: `gts.frontx.v.widget_data.widget_data.v1~`

**Description**: The generic tabular result of every widget data request. The consuming product backend computes it from the metric that the request names, on that request. A result is not stored and has no persistent identity, so an instance carries no `id`. Its shape is the same for every metric and every widget type:

- `columns`: the ordered column names. The names are unique, so each column that a widget type binds resolves to one position.
- `rows`: the rows in the order the backend delivers them. Each row is an array that holds one value per column, in the order of `columns`. A value is a string, a number, a boolean, or null.
- `percent_columns`: the names of the columns whose values hold percentages, each one of `columns`. It is empty when no column holds percentages. A value in a percentage column is a fraction where 1 means 100%: the value 0.385 is shown as 38.5%.

The type carries no column types. Widgets format the values of the percentage columns as percentages, using the host language; nothing else in the result changes what is shown (DESIGN section 3.3). JSON Schema cannot express that each row has exactly as many values as there are columns, or that each percentage column is among the columns; the backend that produces the result is bound to both. A result that breaks either rule is misaligned, and the widget treats it as widget data that cannot be shown.

**How widgets use it**:

- Every widget type validates every result against this one type through the FrontX gts-plugin, in its cell entry and in its modal entry. A replacement realization of a widget type does the same. A result that does not parse or fails this type is widget data that cannot be shown: a cannot-show state with a diagnostic in that widget only, nothing of the result shown, and no Retry (feature-backend-contract section 6.3).
- A result that passes the type then goes through the widget's column-binding check, owned by feature-widget-catalog. First, every row must hold exactly as many values as there are `columns`, and every percentage column must be among `columns`; a misaligned result gives the same cannot-show state, with a diagnostic and without Retry. Then every column that the widget's presentation configuration binds must be among `columns`; a missing bound column gives the same cannot-show state, without Retry.
- A result that passes both checks and has no rows is the widget type's empty state, and so is a `markdown_card` result whose first-row `body` value is null or an empty string. It is not a failure.
- The type sets no limit on the number of rows. The large-grid target of 5,000 rows belongs to the presentation of the `grid` widget type (feature-widget-catalog).

**Schema**:

```json
{
  "$id": "gts://gts.frontx.v.widget_data.widget_data.v1~",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "WidgetData",
  "description": "Generic tabular result of one widget data request, computed by the consuming product backend from the metric that the request names. The same shape for every metric and every widget type. Carries no id and no column types; every widget validates every result against this one type.",
  "type": "object",
  "required": ["columns", "rows", "percent_columns"],
  "additionalProperties": false,
  "properties": {
    "columns": {
      "type": "array",
      "items": { "type": "string", "minLength": 1 },
      "uniqueItems": true,
      "description": "Ordered column names. A widget type binds result columns by these names."
    },
    "rows": {
      "type": "array",
      "items": {
        "type": "array",
        "items": { "type": ["string", "number", "boolean", "null"] }
      },
      "description": "Rows in the order the backend delivers them. Each row holds one value per column, positionally aligned to columns. An empty array gives the widget type's empty state."
    },
    "percent_columns": {
      "type": "array",
      "items": { "type": "string", "minLength": 1 },
      "uniqueItems": true,
      "description": "Names of the columns whose values hold percentages, each one of columns. A value in a percentage column is a fraction where 1 means 100%. Empty when no column holds percentages."
    }
  }
}
```

**Cross-references**:

- No abstract base and no derived type. No widget type references this type; package `m` holds no reference into package `v` (DESIGN section 3.1).
- Request: the widget data request names a backend metric, with an optional time window and an optional bucketing flag, and the backend returns one result of this type (feature-backend-contract section 6.2).
- Failures: a result that does not parse, fails this type, is misaligned, or lacks a bound column is widget data that cannot be shown (feature-backend-contract section 6.3).
- Column bindings and empty states: the columns that each widget type binds, the column-binding check, and the empty state of each widget type are specified with the widget types (feature-widget-catalog).
- Source: `cpt-frontx-dashboard-fr-domain-model`, `cpt-frontx-dashboard-fr-backend-source`, `cpt-frontx-dashboard-fr-widget-catalog`.

## 7. Acceptance Criteria

- [ ] Exactly one widget data type is authored, `gts.frontx.v.widget_data.widget_data.v1~`, with its full JSON Schema. It is concrete, and the template declares no other widget data type.
- [ ] Its identifier follows GTS grammar and uses the FrontX vendor `frontx`, and the type validates under GTS v0.17 through the FrontX gts-plugin.
- [ ] `cfs validate --artifact` reports no structural errors for this document.
- [ ] The type declares `columns`, `rows`, and `percent_columns` and no other field; it declares no `id` and no column types.
- [ ] Given a result with `columns` `["label", "value"]`, `rows` `[["open", 3], ["closed", 5]]`, and `percent_columns` `[]`, when it is validated against the type, then it passes.
- [ ] Given a result whose rows are objects keyed by column name, or that carries a field other than the three declared fields, when a widget validates it, then the widget shows its cannot-show state with a diagnostic, nothing of the result, and no Retry.
- [ ] Given a result that passes the type but has a row with fewer values than `columns`, or names in `percent_columns` a column that is not among `columns`, when the widget runs its column-binding check, then the widget shows its cannot-show state with a diagnostic, nothing of the result, and no Retry.
- [ ] Given a result that passes the type but lacks a column that the widget's presentation configuration binds, when the widget runs its column-binding check, then the widget shows its cannot-show state with a diagnostic and no Retry.
- [ ] Given a result that passes the type and the column-binding check and has an empty `rows`, when the widget shows it, then the widget shows its widget type's empty state, not an error.
- [ ] The type is described as the result of a widget data request that names a metric; nothing describes it as part of the dashboard definition, and no widget type references it.
