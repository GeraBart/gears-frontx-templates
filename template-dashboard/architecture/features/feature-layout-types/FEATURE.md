---
status: accepted
version: 1
date: 2026-10-27
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
  - [6.4 Placement Rule](#64-placement-rule)
- [7. Acceptance Criteria](#7-acceptance-criteria)

<!-- /toc -->

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-featstatus-layout-types`
## 1. Feature Context

- [ ] `p2` - `cpt-frontx-dashboard-feature-layout-types`

### 1.1 Overview

This is a **domain-model feature**, not an actor-flow feature. It declares the Layout and LayoutCell types of the 60-column grid, states the layout checks, and states the placement rule that puts each cell on the grid. Both types are embedded object types: the Layout is embedded in the Dashboard, and each cell is embedded in the Layout; neither has an identifier of its own. The FEATURE template's flow, process, and state sections are reduced to stubs; the types, the layout checks, and the placement rule live in section 6, Domain Model.

### 1.2 Purpose

Concrete declaration of the layout types of the domain model that the Viewer host recognises at runtime, with the full JSON Schema declaration and cross-references to the widget base (DESIGN section 3.1, Layout and cell). A layout is valid only when it passes the layout checks of section 6.3: schema validation checks the bounds of each coordinate, and the Viewer host checks that no two cells overlap and that `x + w` is not greater than 60. The consuming product writes or generates its dashboards; authoring is out of scope for the template. Either way, a dashboard's layout validates against these types and passes these checks, so a consuming product can check the layout and each cell of a dashboard it generates before the dashboard is shown.

**Declaring package**: `dashboard-viewer`.

**Requirements**: `cpt-frontx-dashboard-fr-domain-model`, `cpt-frontx-dashboard-fr-backend-source`

**Use cases**: `cpt-frontx-dashboard-usecase-provide-dashboard` (the layout types and layout checks that a consuming product describes and checks the layout of a dashboard with; the other features named in DECOMPOSITION cover the remaining steps)

**Principles**: `cpt-frontx-dashboard-principle-gts-contracts`

### 1.3 Actors

N/A — domain-model feature. The types are consumed by the runtime type system (the Viewer host, which reads the layout from the dashboard that the consuming product backend provides, and the widget MFEs), not by an end-user actor. No human actor flows are authored.

### 1.4 References

- **PRD**: [PRD.md](../../PRD.md)
- **Design**: [DESIGN.md](../../DESIGN.md#31-domain-model); the layout arrives embedded in the dashboard that the consuming product backend provides (`cpt-frontx-dashboard-interface-dashboard-payload`), which carries no widget data
- **ADRs**: [ADR-0002](../../ADR/0002-dashboard-layout-grid-v1.md), [ADR-0003](../../ADR/0003-shared-data-types-and-schemas-v1.md), [ADR-0011](../../ADR/0011-backend-delivered-dashboard-v1.md)
- **Dependencies**: None that blocks this feature. `LayoutCell.widget` embeds one widget instance, `id`, `title`, presentation configuration with its column binding, and `source`, checked against the Widget base `gts.frontx.m.widget.widget.v1~` (`feature-widget-catalog`) by `$ref` and resolved to the widget type that its `id` names. `gts.frontx.m.dashboard.dashboard.v1~` (`feature-dashboard-root-types`) embeds the Layout. Dependency graph: layout-types depends on widget-catalog (reference only); dashboard-root-types depends on layout-types.
- **Related**: `feature-backend-contract` (its section 6.1 runs the layout checks of section 6.3 on the layout of each dashboard response, and its section 6.3 states what the Viewer host shows when a check fails).

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
- The Layout fully defines widget composition: each cell fixes position, size, and the embedded widget instance, including its `source`; the cell carries no widget data. The Viewer host places the cells as section 6.4 states and does not reorder, regroup, or re-place them in the browser.
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
      "description": "The one widget instance rendered in this cell, embedded inline: its `id`, `title`, presentation configuration with its column binding, and `source`. The FrontX gts-plugin validates it against the Widget base and resolves it to the widget type that its `id` names, so that type checks the widget's own fields. The widget builds its own data request from `source`."
    }
  }
}
```

**Cross-references**:
- No abstract base (flat single-segment chain).
- Related types: `gts.frontx.m.widget.widget.v1~` (embedded inline through `$ref`, matching DESIGN section 3.1: one inline widget instance per cell).
- Widget validation: the cell embeds one widget instance, validated against the Widget base and resolved polymorphically by the FrontX gts-plugin (gts-ts) to the widget type that its `id` names. The template writes no validation code of its own for it.
- Widget content: `id`, `title`, presentation configuration with its column binding, and `source`; the widget carries no `params`.
- Layout checks: the bounds in this schema are the first of the layout checks of section 6.3.

### 6.3 Layout Checks

A layout is valid only when it passes all of these checks (DESIGN section 3.1, Layout and cell; `cpt-frontx-dashboard-constraint-sixty-column-grid`; ADR-0002):

- each cell's `x`, `y`, `w` and `h` lie within their bounds: `x` from 0 to 59, `y` 0 or more, `w` from 1 to 60, `h` 1 or more;
- no two cells overlap: no grid area lies both in the columns `x` to `x + w - 1` and rows `y` to `y + h - 1` of one cell and in those of another;
- for each cell, `x + w` is not greater than 60.

Schema validation of the LayoutCell type (section 6.2) checks the bounds. The Viewer host checks overlaps and `x + w` when it opens a dashboard, because each of these checks spans more than one field or more than one cell. The Viewer host repairs nothing: a dashboard whose layout fails any check is a dashboard that cannot be shown, so the Viewer host renders no cells and shows a diagnostic (`feature-backend-contract` sections 6.1 and 6.3).

The diagnostic names each failing cell by its zero-based index in `cells`, the same index `<c>` as in `feature-extension-domain-catalog` section 6.4. Bounds failures and `x + w` failures are reported together, each naming its cell. The overlap check runs only when every cell passes both the bounds check and the `x + w` check; an overlap names both cells of the pair. An empty `cells` array is valid: no cell is rendered and no diagnostic is shown.

### 6.4 Placement Rule

The Viewer host places the cells of a valid layout with CSS Grid (ADR-0002). The container is a grid of 60 equal columns. A cell with `x`, `y`, `w` and `h` occupies the column range that starts at column `x + 1` (1-based) and spans `w` columns, and the row range that starts at row `y + 1` and spans `h` rows. Each cell holds exactly one widget. The Viewer host trusts the coordinates of a valid layout: it does not move, reorder, or resize a cell to resolve a collision, and the order of `cells` does not change the placement.

## 7. Acceptance Criteria

- [ ] Every concrete listed in this feature is authored with its full schema
- [ ] Every concrete passes GTS identifier grammar and GTS v0.17 schema validation
- [ ] Every type identifier ends with `~`, every instance identifier does not, and every identifier carries `v1`
- [ ] No field of Layout or LayoutCell is changed in the browser; the rendered dashboard matches the delivered layout.
- [ ] A cell whose `x`, `y`, `w` or `h` lies outside its bounds fails schema validation of the LayoutCell type.
- [ ] A layout with two overlapping cells, or with a cell whose `x + w` is greater than 60, fails the Viewer host layout check: the Viewer host renders no cells and shows a diagnostic naming the failing cells by index.
- [ ] Given a layout in which the cell at index 2 has `w` of 0, when the Viewer host checks the layout, then the diagnostic names cell index 2 as a bounds failure and no cells are rendered.
- [ ] Given a layout in which the cells at indexes 0 and 3 overlap, when the Viewer host checks the layout, then the diagnostic names both cell indexes 0 and 3.
- [ ] Given a layout with one cell that fails the bounds check and two other cells that overlap, when the Viewer host checks the layout, then the diagnostic names the bounds failure at its index and the overlap check is skipped.
- [ ] Given a layout in which the cell at index 1 has `x` of 50 and `w` of 15, when the Viewer host checks the layout, then no cells are rendered and the diagnostic names cell index 1 as an `x + w` failure.
- [ ] Given a layout with an empty `cells` array, when the Viewer host checks the layout, then the layout is valid, no cell is rendered, and no diagnostic is shown.
- [ ] A LayoutCell embeds one widget instance with its `id`, `title`, presentation configuration with column binding, and `source`, and no widget data and no `params`.
- [ ] The FrontX gts-plugin resolves the embedded widget of a cell to the widget type that its `id` names, with no custom validation code.
- [ ] Given a valid cell with `x` of 10, `y` of 2, `w` of 20 and `h` of 3, when the Viewer host places it, then it occupies columns 11 to 30 and rows 3 to 5 of the 60-column grid.
- [ ] The Layout declares no `id` or `name` and is embedded in the Dashboard; no layout reference exists.
- [ ] `cfs validate --artifact` on this file reports PASS
