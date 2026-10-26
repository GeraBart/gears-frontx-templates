---
status: proposed
version: 6
date: 2026-10-24
description: Domain-model types of the 60-column Layout, embedded in the Dashboard, and of the LayoutCell that embeds one widget instance, with the layout checks, declared by dashboard-viewer.
---

# Feature: Layout Types


<!-- toc -->

- [1. Feature Context](#1-feature-context)
  - [1.1 Overview](#11-overview)
  - [1.2 Purpose](#12-purpose)
  - [1.3 Actors](#13-actors)
  - [1.4 References](#14-references)
- [2. Actor Flows (CDSL)](#2-actor-flows-cdsl)
  - [Domain-Model Feature — No Actor Flows](#domain-model-feature--no-actor-flows)
- [3. Processes / Business Logic (CDSL)](#3-processes--business-logic-cdsl)
  - [Domain-Model Feature — No Processes](#domain-model-feature--no-processes)
- [4. States (CDSL)](#4-states-cdsl)
  - [Domain-Model Feature — No State Machines](#domain-model-feature--no-state-machines)
- [5. Definitions of Done](#5-definitions-of-done)
  - [Domain Model Definition of Done](#domain-model-definition-of-done)
- [6. Domain Model](#6-domain-model)
  - [6.1 Layout](#61-layout)
  - [6.2 LayoutCell](#62-layoutcell)
  - [6.3 Layout Checks](#63-layout-checks)
- [7. Acceptance Criteria](#7-acceptance-criteria)

<!-- /toc -->

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-featstatus-layout-types`
## 1. Feature Context

- [ ] `p2` - `cpt-frontx-dashboard-feature-layout-types`

### 1.1 Overview

This is a **domain-model feature**, not an actor-flow feature. It declares the Layout and LayoutCell types of the 60-column grid and states the layout checks. Both types are embedded object types: the Layout is embedded in the Dashboard, and each cell is embedded in the Layout; neither has an identifier of its own. The FEATURE template's flow, process, and state sections are reduced to stubs; the types and the layout checks live in section 6, Domain Model.

### 1.2 Purpose

Concrete declaration of the layout types of the domain model that the Viewer host recognises at runtime, with the full JSON Schema declaration and cross-references to the widget base (DESIGN section 3.1, Layout and cell). A layout is valid only when it passes the layout checks of section 6.3: schema validation checks the bounds of each coordinate, and the Viewer host checks that no two cells overlap and that `x + w` is not greater than 60. The consuming product writes or generates its dashboards; authoring is out of scope for the template. Either way, a dashboard's layout validates against these types and passes these checks, so a consuming product can check the layout and each cell of a dashboard it generates before the dashboard is shown.

**Declaring package**: `dashboard-viewer`.

**Requirements**: `cpt-frontx-dashboard-fr-domain-model`, `cpt-frontx-dashboard-fr-backend-source`

**Principles**: `cpt-frontx-dashboard-principle-gts-contracts`

### 1.3 Actors

N/A — domain-model feature. The types are consumed by the runtime type system (the Viewer host, which reads the layout from the dashboard that the consuming product backend provides, and the widget MFEs), not by an end-user actor. No human actor flows are authored.

### 1.4 References

- **PRD**: [PRD.md](../../PRD.md)
- **Design**: [DESIGN.md](../../DESIGN.md#31-domain-model); the layout arrives embedded in the dashboard that the consuming product backend provides (`cpt-frontx-dashboard-interface-dashboard-payload`), which carries no widget data
- **ADRs**: [ADR-0002](../../ADR/0002-dashboard-layout-grid-v1.md), [ADR-0003](../../ADR/0003-shared-data-types-and-schemas-v1.md), [ADR-0011](../../ADR/0011-backend-delivered-dashboard-v1.md)
- **Dependencies**: None that blocks this feature. `LayoutCell.widget` embeds one widget instance, presentation configuration plus `params`, checked against the Widget base `gts.frontx.m.widget.widget.v1~` (`feature-widget-catalog`) by `$ref`. `gts.frontx.m.dashboard.dashboard.v1~` (`feature-dashboard-root-types`) embeds the Layout. Dependency graph: layout-types depends on widget-catalog (reference only); dashboard-root-types depends on layout-types.
- **Related**: `feature-backend-contract` (its section 6.1 runs the layout checks of section 6.3 on the layout of each dashboard response, and its section 6.3 states what the viewer shows when a check fails).

## 2. Actor Flows (CDSL)

### Domain-Model Feature — No Actor Flows

N/A — domain-model feature. The types are consumed at runtime by the type system, not by an actor flow. The full declarations live in section 6, Domain Model.

## 3. Processes / Business Logic (CDSL)

### Domain-Model Feature — No Processes

N/A — domain-model feature. This feature declares static GTS schemas and states the layout checks; the runtime validation logic that runs them on the dashboard the consuming product backend provides lives in the Viewer host bundle of `dashboard-viewer`, not in this file.

## 4. States (CDSL)

### Domain-Model Feature — No State Machines

N/A — domain-model feature. Type declarations are stateless.

## 5. Definitions of Done

### Domain Model Definition of Done

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-dod-layout-types-catalog-complete`

The system **MUST** declare `gts.frontx.m.layout.layout.v1~` with `columns` fixed at 60 and `gts.frontx.m.layout.cell.v1~` with bounded `x`, `y`, `w`, `h`, in `dashboard-viewer`.

- Every concrete is authored with a full JSON Schema declaration.
- Every identifier follows the GTS identifier grammar and the ID-form convention of DESIGN section 3.1 (types end with `~`, instances do not).
- Every `$ref` resolves to a declared type.
- The Layout and LayoutCell are embedded object types with no `id` field; the Dashboard embeds the Layout, and nothing references a layout by identifier.
- The Layout fully defines widget composition: each cell fixes position, size, and the embedded widget instance, including its `params`; the cell carries no widget data. The Viewer host renders the cells as given and does not reorder, regroup, or re-place them in the browser.
- The layout checks of section 6.3 hold: the LayoutCell schema bounds each coordinate, and the Viewer host rejects overlapping cells and any cell with `x + w` greater than 60, without repairing the layout.

**Constraints**: `cpt-frontx-dashboard-constraint-sixty-column-grid`

## 6. Domain Model

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
      "description": "The one widget instance rendered in this cell, embedded inline: its id, title, presentation configuration, and params. The cell schema checks it against the Widget base; the widget type named by its id checks its own fields. The widget requests its own data with its kind and params."
    }
  }
}
```

**Cross-references**:
- No abstract base (flat single-segment chain).
- Related types: `gts.frontx.m.widget.widget.v1~` (embedded inline through `$ref`, matching DESIGN section 3.1: one inline widget instance per cell).
- Widget validation: the embedded widget's `id` names its concrete type (a kind, or a type a consuming product derives from a kind) as the rightmost type of its chain, and the widget validates against that type. How the dashboard's validation selects that type for an embedded widget, including how the `/$id` operand of the widget's `id` resolves there, is open item 2 of `feature-backend-contract` section 6.5.
- Layout checks: the bounds in this schema are the first of the layout checks of section 6.3.

### 6.3 Layout Checks

A layout is valid only when it passes all of these checks (DESIGN section 3.1, Layout and cell; `cpt-frontx-dashboard-constraint-sixty-column-grid`; ADR-0002):

- each cell's `x`, `y`, `w` and `h` lie within their bounds: `x` from 0 to 59, `y` 0 or more, `w` from 1 to 60, `h` 1 or more;
- no two cells overlap: no grid area lies both in the columns `x` to `x + w - 1` and rows `y` to `y + h - 1` of one cell and in those of another;
- for each cell, `x + w` is not greater than 60.

Schema validation of the LayoutCell type (section 6.2) checks the bounds. The Viewer host checks overlaps and `x + w` when it opens a dashboard, because each of these checks spans more than one field or more than one cell. The viewer repairs nothing: a dashboard whose layout fails any check is a dashboard that cannot be shown, so the viewer renders no cells and shows a diagnostic (`feature-backend-contract` sections 6.1 and 6.3).

The diagnostic names each failing cell by its zero-based index in `cells`, the same index `<c>` as in `feature-extension-domain-catalog` section 6.9. Bounds failures and `x + w` failures are reported together, each naming its cell. The overlap check runs only when every cell passes both the bounds check and the `x + w` check; an overlap names both cells of the pair. An empty `cells` array is valid: no cell is rendered and no diagnostic is shown.

## 7. Acceptance Criteria

- [ ] Every concrete listed in this feature is authored with its full schema
- [ ] Every concrete passes GTS identifier grammar and GTS v0.17 schema validation
- [ ] Every type identifier ends with `~`, every instance identifier does not, and every identifier carries `v1`
- [ ] No field of Layout or LayoutCell is changed in the browser; the rendered dashboard matches the delivered layout.
- [ ] A cell whose `x`, `y`, `w` or `h` lies outside its bounds fails schema validation of the LayoutCell type.
- [ ] A layout with two overlapping cells, or with a cell whose `x + w` is greater than 60, fails the Viewer host layout check: the viewer renders no cells and shows a diagnostic naming the failing cells by index.
- [ ] Given a layout in which the cell at index 2 has `w` of 0, when the Viewer host checks the layout, then the diagnostic names cell index 2 as a bounds failure and no cells are rendered.
- [ ] Given a layout in which the cells at indexes 0 and 3 overlap, when the Viewer host checks the layout, then the diagnostic names both cell indexes 0 and 3.
- [ ] Given a layout with one cell that fails the bounds check and two other cells that overlap, when the Viewer host checks the layout, then the diagnostic names the bounds failure at its index and the overlap check is skipped.
- [ ] Given a layout in which the cell at index 1 has `x` of 50 and `w` of 15, when the Viewer host checks the layout, then no cells are rendered and the diagnostic names cell index 1 as an `x + w` failure.
- [ ] Given a layout with an empty `cells` array, when the Viewer host checks the layout, then the layout is valid, no cell is rendered, and no diagnostic is shown.
- [ ] A LayoutCell embeds one widget instance with its `id`, `title`, presentation configuration, and `params`, and no widget data.
- [ ] The Layout declares no `id` or `name` and is embedded in the Dashboard; no layout reference exists.
- [ ] `cfs validate --artifact` on this file reports PASS
