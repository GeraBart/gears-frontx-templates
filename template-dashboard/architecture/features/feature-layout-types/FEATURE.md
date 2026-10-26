---
status: proposed
version: 6
date: 2026-10-24
description: Type catalog of the 60-column Layout, embedded in the Dashboard, and the LayoutCell that embeds one widget instance, declared by dashboard-viewer.
changelog:
  - "v6 (2026-10-24): traces `cpt-frontx-dashboard-fr-generated-dashboards` (p2); the layout types let a generated definition be validated."
  - "v5 (2026-10-24): embedded layout and params model. The Layout is an embedded object type of the Dashboard with no identifier of its own, and drops `name`; no layout reference or separate layout instance exists. Each cell embeds one widget instance: presentation configuration plus `params`, identified by its combined instance `id`; `data_ref` is gone. `x-gts-ref` is no longer used."
  - "v4 (2026-10-23): the layout arrives in the backend's dashboard definition, which carries no widget data; each cell's widget configuration carries its data reference, and each widget requests its own data."
  - "v3 (2026-10-23): the dashboard payload is referenced by its DESIGN interface ID; the Definition of Done and acceptance criteria state that the layout fully defines widget composition and the Viewer host renders it as given."
  - "v2 (2026-10-23): LayoutCell.widget is an inline widget instance checked by `$ref` to the Widget base, not a string reference, matching DESIGN section 3.1."
  - "v1: initial port from the prototype."
---

# Feature: Layout Types Catalog


<!-- toc -->

- [1. Feature Context](#1-feature-context)
  - [1.1 Overview](#11-overview)
  - [1.2 Purpose](#12-purpose)
  - [1.3 Actors](#13-actors)
  - [1.4 References](#14-references)
- [2. Actor Flows (CDSL)](#2-actor-flows-cdsl)
  - [Type-Catalog Feature — No Actor Flows](#type-catalog-feature--no-actor-flows)
- [3. Processes / Business Logic (CDSL)](#3-processes--business-logic-cdsl)
  - [Type-Catalog Feature — No Processes](#type-catalog-feature--no-processes)
- [4. States (CDSL)](#4-states-cdsl)
  - [Type-Catalog Feature — No State Machines](#type-catalog-feature--no-state-machines)
- [5. Definitions of Done](#5-definitions-of-done)
  - [Type Catalog Definition of Done](#type-catalog-definition-of-done)
- [6. Type Catalog](#6-type-catalog)
  - [6.1 Layout](#61-layout)
  - [6.2 LayoutCell](#62-layoutcell)
- [7. Acceptance Criteria](#7-acceptance-criteria)

<!-- /toc -->

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-featstatus-layout-types`
## 1. Feature Context

- [ ] `p2` - `cpt-frontx-dashboard-feature-layout-types`

### 1.1 Overview

This is a **type-catalog feature**, not an actor-flow feature. It enumerates the Layout and LayoutCell types of the 60-column grid. Both are embedded object types: the Layout is embedded in the Dashboard, and each cell is embedded in the Layout; neither has an identifier of its own. The FEATURE template's flow, process, and state sections are reduced to stubs; the catalog lives in section 6, Type Catalog.

### 1.2 Purpose

Concrete catalog of the layout structural types the Viewer host recognises at runtime, with the full JSON Schema declaration and cross-references to the widget base (DESIGN section 3.1, Layout and cell). Schema validation checks each coordinate; the Viewer host checks overlaps and `x + w` greater than 60. For a generated dashboard, these types let the consuming project validate the layout and each cell of the definition before it is shown.

**Declaring package**: `dashboard-viewer`.

**Requirements**: `cpt-frontx-dashboard-fr-domain-model`, `cpt-frontx-dashboard-fr-generated-dashboards`

**Principles**: `cpt-frontx-dashboard-principle-gts-contracts`

### 1.3 Actors

N/A — type-catalog feature. The catalog is consumed by the runtime type system (the Viewer host, which reads the layout from the backend-delivered dashboard definition, and the widget MFEs), not by an end-user actor. No human actor flows are authored.

### 1.4 References

- **PRD**: [PRD.md](../../PRD.md)
- **Design**: [DESIGN.md](../../DESIGN.md#31-domain-model); the layout arrives embedded in the backend's dashboard definition (`cpt-frontx-dashboard-interface-dashboard-payload`), which carries no widget data
- **ADRs**: [ADR-0002](../../ADR/0002-dashboard-layout-grid-v1.md), [ADR-0003](../../ADR/0003-shared-data-types-and-schemas-v1.md), [ADR-0011](../../ADR/0011-backend-delivered-dashboard-v1.md)
- **Dependencies**: None for authoring. `LayoutCell.widget` embeds one widget instance, presentation configuration plus `params`, checked against the Widget base `gts.frontx.m.widget.widget.v1~` (`feature-widget-catalog`) by `$ref`. `gts.frontx.m.dashboard.dashboard.v1~` (`feature-dashboard-root-types`) embeds the Layout. Dependency graph: layout-types depends on widget-catalog (reference only); dashboard-root-types depends on layout-types.

## 2. Actor Flows (CDSL)

### Type-Catalog Feature — No Actor Flows

N/A — type-catalog feature. Catalog content is consumed at runtime by the type system, not by an actor flow. The full catalog lives in section 6, Type Catalog.

## 3. Processes / Business Logic (CDSL)

### Type-Catalog Feature — No Processes

N/A — type-catalog feature. The catalog declares static GTS schemas; runtime validation logic for the backend-delivered dashboard definition lives in the Viewer host bundle of `dashboard-viewer`, not in this catalog file.

## 4. States (CDSL)

### Type-Catalog Feature — No State Machines

N/A — type-catalog feature. Type declarations are stateless.

## 5. Definitions of Done

### Type Catalog Definition of Done

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-dod-layout-types-catalog-complete`

The system **MUST** declare `gts.frontx.m.layout.layout.v1~` with `columns` fixed at 60 and `gts.frontx.m.layout.cell.v1~` with bounded `x`, `y`, `w`, `h`, in `dashboard-viewer`.

- Every concrete is authored with a full JSON Schema declaration.
- Every identifier follows the GTS identifier grammar and the ID-form convention of DESIGN section 3.1 (types end with `~`, instances do not).
- Every `$ref` resolves to a declared type.
- The Layout and LayoutCell are embedded object types with no `id` field; the Dashboard embeds the Layout, and nothing references a layout by identifier.
- The Layout fully defines widget composition: each cell fixes position, size, and the embedded widget instance, including its `params`; the cell carries no widget data. The Viewer host renders the cells as given and does not reorder, regroup, or re-place them in the browser.

**Constraints**: `cpt-frontx-dashboard-constraint-sixty-column-grid`

## 6. Type Catalog


### 6.1 Layout

**GTS ID**: `gts.frontx.m.layout.layout.v1~`

**Description**: Grid layout embedded in a Dashboard: a 60-column model containing an ordered array of positioned cells. It has no identifier of its own.

**Schema**:

```json
{
  "$id": "gts://gts.frontx.m.layout.layout.v1~",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "Layout",
  "description": "Grid layout embedded in a Dashboard: a 60-column model containing an ordered array of positioned cells. Not independently addressable.",
  "type": "object",
  "required": ["columns", "cells"],
  "properties": {
    "columns": {
      "type": "integer",
      "const": 60,
      "description": "Number of grid columns. Fixed at 60 for all layouts."
    },
    "cells": {
      "type": "array",
      "description": "Ordered array of layout cells defining widget positions within the grid.",
      "items": {
"$ref": "gts://gts.frontx.m.layout.cell.v1~"
      }
    }
  }
}
```

**Cross-references**:
- No abstract base (flat single-segment chain).
- Related types: `gts.frontx.m.layout.cell.v1~`; embedded by `gts.frontx.m.dashboard.dashboard.v1~` (`feature-dashboard-root-types`).

### 6.2 LayoutCell

**GTS ID**: `gts.frontx.m.layout.cell.v1~`

**Description**: Embedded cell within a Layout specifying grid position, size, and the widget it renders. Each cell is an occupant of the `layout_cells` extension domain; the Viewer host derives the extension instances from the cells.

**Schema**:

```json
{
  "$id": "gts://gts.frontx.m.layout.cell.v1~",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "LayoutCell",
  "description": "Embedded cell within a Layout specifying grid position, size, and the widget it renders. Not independently addressable; always embedded in a Layout.",
  "type": "object",
  "required": ["x", "y", "w", "h", "widget"],
  "properties": {
    "x": {
      "type": "integer",
      "minimum": 0,
      "maximum": 59,
      "description": "Horizontal grid position (column index, 0-based)."
    },
    "y": {
      "type": "integer",
      "minimum": 0,
      "description": "Vertical grid position (row index, 0-based)."
    },
    "w": {
      "type": "integer",
      "minimum": 1,
      "maximum": 60,
      "description": "Width of the cell in grid columns."
    },
    "h": {
      "type": "integer",
      "minimum": 1,
      "description": "Height of the cell in grid rows."
    },
    "widget": {
      "$ref": "gts://gts.frontx.m.widget.widget.v1~",
      "description": "The one widget instance rendered in this cell, embedded inline: its id, presentation configuration, and params. The cell schema checks it against the Widget base; the widget type named by its id checks its own fields. The widget requests its own data with its kind and params."
    }
  }
}
```

**Cross-references**:
- No abstract base (flat single-segment chain).
- Related types: `gts.frontx.m.widget.widget.v1~` (embedded inline through `$ref`, matching DESIGN section 3.1: one inline widget instance per cell).
- Widget validation: the embedded widget's `id` names its concrete type (a kind, or a type a consuming product derives from a kind) as the rightmost type of its chain, and the widget validates against that type. How the definition's validation selects that type for an embedded widget, including how the `/$id` operand of the widget's `id` resolves there, is a DESIGN section 4 open item.

## 7. Acceptance Criteria

- [ ] Every concrete listed in this catalog is authored with its full schema
- [ ] Every concrete passes GTS identifier grammar and GTS v0.17 schema validation
- [ ] Every type identifier ends with `~`, every instance identifier does not, and every identifier carries `v1`
- [ ] No field of Layout or LayoutCell is changed in the browser; the rendered dashboard matches the delivered layout.
- [ ] A LayoutCell embeds one widget instance with its `id`, presentation configuration, and `params`, and no widget data.
- [ ] The Layout declares no `id` or `name` and is embedded in the Dashboard; no layout reference exists.
- [ ] `cfs validate --artifact` on this file reports PASS
