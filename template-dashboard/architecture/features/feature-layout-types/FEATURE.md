---
status: accepted
version: 1
date: 2026-10-30
description: Domain-model types of the 60-column Layout, embedded in the Dashboard, and of the LayoutCell that embeds one widget and an optional larger-view widget, with the layout checks that a valid layout passes and the placement of its cells.
---

# Feature: Layout Types

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-featstatus-layout-types`

<!-- toc -->

- [1. Feature Context](#1-feature-context)
  - [1.1 Overview](#11-overview)
  - [1.2 Purpose](#12-purpose)
  - [1.3 Actors](#13-actors)
  - [1.4 References](#14-references)
- [2. Actor Flows (CDSL)](#2-actor-flows-cdsl)
  - [Domain-Model Feature — No Actor Flows](#domain-model-feature--no-actor-flows)
- [3. Processes / Business Logic (CDSL)](#3-processes--business-logic-cdsl)
  - [Check a Layout](#check-a-layout)
  - [Place the Cells](#place-the-cells)
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

## 1. Feature Context

- [ ] `p2` - `cpt-frontx-dashboard-feature-layout-types`

### 1.1 Overview

This is a **domain-model feature**, not an actor-flow feature. It declares the Layout and LayoutCell types of the 60-column grid, states the layout checks, and states the placement rule that puts each cell on the grid. Both types are embedded object types: the Layout is embedded in the Dashboard, and each cell is embedded in the Layout; neither has an identifier of its own. A cell embeds one widget and may embed a second widget for its larger view. The flow and state sections of the FEATURE template are stubs. Section 3 holds the two processes (the layout check and the cell placement), and the types, the layout checks, and the placement rule live in section 6, Domain Model.

### 1.2 Purpose

Declare the 60-column Layout and the LayoutCell, the embedded object types that together fully define how a dashboard composes its widgets, and state the layout checks that a valid layout passes (DESIGN section 3.1, Layout and cell). A layout is valid only when its cells pass the coordinate bounds, which are part of the GTS validation of the dashboard, and the layout then passes the checks of section 6.3 for overlapping cells, for `x + w` above 60, and for a widget id repeated across cell widgets and larger-view widgets. The consuming product provides its dashboards through its data adapter; authoring is out of scope for the template. Either way, a dashboard's layout validates against these types and passes these checks, so a consuming product can check the layout and each cell of a dashboard it provides before the dashboard is shown. The trigger of a failed layout check, the dashboard-level cannot-show state, stays with `cpt-frontx-dashboard-feature-dashboard-root-types`, which runs the GTS validation of the dashboard first and the layout checks after it.

**Checklist coverage.** Not applicable: PERF, because the placement is plain CSS Grid with no measured target in this feature; SEC, because the types carry no text that a widget shows (text rendering belongs to `cpt-frontx-dashboard-feature-widget-catalog`); REL, because a failed check is a static dashboard-level state owned by `cpt-frontx-dashboard-feature-dashboard-root-types`; DATA, because the layout is delivered, never stored by the template; INT, because the delivery of a dashboard is owned by `cpt-frontx-dashboard-feature-data-adapter-contract`; OPS, because the types define no operation procedure; MAINT, because the code of the domain owners belongs to their features; COMPL, because no regulated data is processed; BIZ, because the types state grid rules, not business rules.

**Requirements**: `cpt-frontx-dashboard-fr-domain-model`, `cpt-frontx-dashboard-fr-backend-source`, `cpt-frontx-dashboard-fr-widget-modal`

**Use cases**: `cpt-frontx-dashboard-usecase-provide-dashboard` (the layout types and layout checks that a consuming product describes and checks the layout of a dashboard with; the other features named in DECOMPOSITION cover the remaining steps)

**Principles**: `cpt-frontx-dashboard-principle-gts-contracts`

**Declaring package**: `dashboard`, model package `dashboard_m`.

**Constraints**: `cpt-frontx-dashboard-constraint-sixty-column-grid`

### 1.3 Actors

N/A — domain-model feature. The types are consumed by the runtime type system (the dashboards root, which reads the layout from the dashboard that the data adapter provides, and the widget extensions), not by an end-user actor. No human actor flows are authored.

### 1.4 References

- **PRD**: [PRD.md](../../PRD.md)
- **Design**: [DESIGN.md](../../DESIGN.md#31-domain-model); the layout arrives embedded in the dashboard that the data adapter provides (`cpt-frontx-dashboard-interface-domain-model`)
- **ADRs**: [ADR-0002](../../ADR/0002-dashboard-layout-grid-v1.md), [ADR-0003](../../ADR/0003-shared-data-types-and-schemas-v1.md), [ADR-0007](../../ADR/0007-extension-domain-taxonomy-v1.md), [ADR-0011](../../ADR/0011-data-adapter-v1.md) (a failed layout check is the dashboard-level cannot-show state)
- **Dependencies**: `cpt-frontx-dashboard-feature-widget-catalog`. `LayoutCell.widget` and `LayoutCell.larger_view` each embed one widget, checked against the widget base `gts.frontx.dashboard_m.widget.widget.v1~` by `$ref` and resolved to the widget type that its `id` names. `gts.frontx.dashboard_m.dashboard.dashboard.v1~` (`cpt-frontx-dashboard-feature-dashboard-root-types`) embeds the Layout and depends on this feature.
- **Related**: `cpt-frontx-dashboard-feature-data-adapter-contract` and `cpt-frontx-dashboard-feature-extension-domain-catalog` (the domain owners run the layout checks of section 6.3 after the GTS validation of the dashboard, and show the placeholder when a check fails).

## 2. Actor Flows (CDSL)

### Domain-Model Feature — No Actor Flows

N/A — domain-model feature. The types are consumed at runtime by the type system, not by an actor flow. The full declarations live in section 6, Domain Model.

## 3. Processes / Business Logic (CDSL)

### Check a Layout

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-algo-layout-types-check-layout`

**Input**: The layout of a dashboard, after the GTS validation of the dashboard, with the cell failures that this validation reported for the cells of the layout (any GTS failure whose instance path lies under a cell but not under its `widget` or `larger_view`, such as a missing `widget` or a coordinate outside its bounds).

**Output**: Pass, or the failures of one pass, each naming its cells by zero-based index in `cells`. The diagnostics go to the developer log.

**Steps**:
1. [ ] - `p1` - **IF** the GTS validation reported a cell failure for any cell, **RETURN** failure naming each such cell by its index as a cell failure. The checks below run only on a layout whose cells have no cell failure - `inst-return-bounds-failures`
2. [ ] - `p1` - Start an empty list of failures - `inst-start-failures`
3. [ ] - `p1` - **FOR EACH** cell - `inst-for-each-cell`
   1. [ ] - `p1` - **IF** `x + w` is greater than 60, add a failure naming the cell index - `inst-add-width-failure`
4. [ ] - `p1` - **FOR EACH** pair of cells - `inst-for-each-pair`
   1. [ ] - `p1` - **IF** the pair overlaps by the rule of section 6.3, add a failure naming both cell indexes - `inst-add-overlap-failure`
5. [ ] - `p1` - Collect the `id` of every cell widget and every larger-view widget. A widget without a string `id` takes no part: its own failure is widget-level - `inst-collect-ids`
6. [ ] - `p1` - **FOR EACH** id that occurs more than once, add a failure naming every cell that carries it and whether the id is on its cell widget or its larger-view widget - `inst-add-repeat-failure`
7. [ ] - `p1` - **IF** the list of failures is not empty, **RETURN** failure with all of them. Otherwise **RETURN** pass. An empty `cells` array passes - `inst-return-result`

The widgets embedded in the cells are not checked here. Their GTS validation is part of the validation of the dashboard, and a failure under a cell's `widget` or `larger_view` is widget-level for that cell (`cpt-frontx-dashboard-feature-widget-catalog`).

### Place the Cells

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-algo-layout-types-place-cells`

**Input**: A layout that passed `cpt-frontx-dashboard-algo-layout-types-check-layout`.

**Output**: One grid in which each cell widget occupies the area of its cell.

**Steps**:
1. [ ] - `p1` - Make a CSS Grid container of 60 equal columns - `inst-make-grid`
2. [ ] - `p1` - **FOR EACH** cell in `cells` - `inst-place-each-cell`
   1. [ ] - `p1` - Place the cell widget in the column range that starts at column `x + 1` and spans `w` columns, and in the row range that starts at row `y + 1` and spans `h` rows - `inst-place-cell`
   2. [ ] - `p1` - Do not place the larger-view widget: it shows only in the larger view - `inst-skip-larger-view`
3. [ ] - `p1` - **RETURN**. No cell is moved, reordered, or resized, and the order of `cells` does not change the placement - `inst-place-return`

The code that runs these processes belongs to the domain owners (`cpt-frontx-dashboard-component-dashboards-root`), not to this file.

## 4. States (CDSL)

### Domain-Model Feature — No State Machines

N/A — domain-model feature. Type declarations are stateless.

## 5. Definitions of Done

### Domain Model Definition of Done

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-dod-layout-types-catalog-complete`

The system **MUST** declare `gts.frontx.dashboard_m.layout.layout.v1~` with `columns` fixed at 60 and `gts.frontx.dashboard_m.layout.cell.v1~` with bounded `x`, `y`, `w`, `h`, one embedded `widget` and an optional embedded `larger_view` widget, in package `dashboard`, model package `dashboard_m`.

- Every concrete type is authored with a full JSON Schema declaration.
- Every identifier follows the GTS identifier grammar and the ID-form convention of DESIGN section 3.1 (types end with `~`, instances do not).
- Every `$ref` resolves to a declared type.
- The Layout and LayoutCell are embedded object types with no `id` field; the Dashboard embeds the Layout, and nothing references a layout by identifier.
- The Layout fully defines widget composition: each cell fixes position, size, the embedded widget and the optional embedded larger-view widget; a data widget carries its own embedded query, and the cell carries no widget data. The dashboards root places the cells as section 6.4 states and does not reorder, regroup, or re-place them in the browser.
- The layout checks of section 6.3 hold. The LayoutCell schema bounds each coordinate, as part of the GTS validation of the dashboard. On a layout whose cells pass the bounds, overlapping cells, any cell with `x + w` greater than 60, and a widget id repeated across cell and larger-view widgets are rejected, all failures of one pass together, without repairing the layout.

**Implements**:
- `cpt-frontx-dashboard-algo-layout-types-check-layout`
- `cpt-frontx-dashboard-algo-layout-types-place-cells`

**Constraints**: `cpt-frontx-dashboard-constraint-sixty-column-grid`

## 6. Domain Model

### 6.1 Layout

**GTS ID**: `gts.frontx.dashboard_m.layout.layout.v1~`

**Description**: Grid layout embedded in a Dashboard: a 60-column model containing an ordered array of positioned cells. It has no identifier of its own.

**Schema**:

```json
{
  "$id": "gts://gts.frontx.dashboard_m.layout.layout.v1~",
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
        "$ref": "gts://gts.frontx.dashboard_m.layout.cell.v1~"
      }
    }
  },
  "unevaluatedProperties": false
}
```

**Cross-references**:
- No abstract base (flat single-segment chain).
- Related types: `gts.frontx.dashboard_m.layout.cell.v1~`; embedded by `gts.frontx.dashboard_m.dashboard.dashboard.v1~` (`cpt-frontx-dashboard-feature-dashboard-root-types`).

### 6.2 LayoutCell

**GTS ID**: `gts.frontx.dashboard_m.layout.cell.v1~`

**Description**: Embedded cell within a Layout specifying grid position, size, the widget it renders, and an optional widget for its larger view. The dashboards root mounts one extension per cell widget in the `layout_cells` domain; the larger-view modal mounts the larger-view widget in the `larger_view` domain.

**Schema**:

```json
{
  "$id": "gts://gts.frontx.dashboard_m.layout.cell.v1~",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "LayoutCell",
  "description": "Embedded cell within a Layout specifying grid position, size, the widget it renders and an optional larger-view widget. Not independently addressable; always embedded in a Layout.",
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
      "maximum": 9999,
      "description": "Vertical grid position (row index, 0-based). Supported range 0 to 9999."
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
      "maximum": 9999,
      "description": "Height of the cell in grid rows. Supported range 1 to 9999."
    },
    "widget": {
      "$ref": "gts://gts.frontx.dashboard_m.widget.widget.v1~",
      "description": "The widget rendered in this cell, embedded inline. It is checked against the widget base and resolved to the widget type that its `id` names, so that type checks the widget's own fields. A data widget carries its own embedded query in `data`."
    },
    "larger_view": {
      "$ref": "gts://gts.frontx.dashboard_m.widget.widget.v1~",
      "description": "Optional widget shown in the larger view of this cell, embedded inline and checked like `widget`. It is a second widget instance with its own id. When it is absent, the cell widget hides its larger-view button."
    }
  },
  "unevaluatedProperties": false
}
```

**Cross-references**:
- No abstract base (flat single-segment chain).
- Related types: `gts.frontx.dashboard_m.widget.widget.v1~` (embedded inline through `$ref` in `widget` and in `larger_view`, matching DESIGN section 3.1).
- Widget types: the `widget` and `larger_view` ids name one of the 9 widget types: the 8 data widget types under `gts.frontx.dashboard_m.widget.widget.v1~frontx.dashboard_m.widget.data_widget.v1~`, or `markdown_card`.
- Widget validation: each embedded widget is validated against the widget base and resolved polymorphically to the widget type that its `id` names by the FrontX GTS plugin (a required capability, DESIGN prerequisites, not a rule of the GTS specification), as part of the GTS validation of the dashboard. The template writes no validation code of its own for it, and it is not part of the layout check. A failure under a cell's `widget` or `larger_view` is a widget-level failure of that cell (`cpt-frontx-dashboard-feature-widget-catalog`).
- Widget content: a widget carries `id`, `title`, its presentation configuration, and, for a data widget, its embedded query in `data`. The cell carries no widget data.
- Layout checks: the bounds in this schema are checked by the GTS validation of the dashboard, and the layout checks of section 6.3 run after them.

### 6.3 Layout Checks

A layout is valid only when it passes all of these checks (DESIGN section 3.1, Layout and cell; `cpt-frontx-dashboard-constraint-sixty-column-grid`; ADR-0002):

1. each cell's `x`, `y`, `w` and `h` are integers within their bounds: `x` from 0 to 59, `y` from 0 to 9999, `w` from 1 to 60, `h` from 1 to 9999. This check is part of the GTS validation of the dashboard, and any GTS failure inside a cell outside its `widget` and `larger_view`, such as a missing `widget`, is a cell failure and a layout failure;
2. no two cells overlap: no grid area lies both in the columns `x` to `x + w - 1` and rows `y` to `y + h - 1` of one cell and in those of another. Cells that only touch at an edge do not overlap, a cell inside another overlaps it, and two cells with the same position and size overlap;
3. for each cell, `x + w` is not greater than 60;
4. no widget id repeats across the cell widgets and the larger-view widgets of the dashboard, because every GTS instance id is unique and a dashboard never holds the same widget instance twice. A larger-view widget that should look like its cell widget is a second widget instance with the same settings and its own id.

`cpt-frontx-dashboard-algo-layout-types-check-layout` runs checks 2 to 4 after the GTS validation of the dashboard, because each of these checks spans more than one field, more than one cell, or more than one widget. They run only on a layout whose cells have no cell failure (check 1). Nothing is repaired: a dashboard whose layout fails any check cannot be shown, so no cells are rendered and the dashboard-level cannot-show placeholder shows. The trigger of that state stays with `cpt-frontx-dashboard-feature-dashboard-root-types`.

A failure names each failing cell by its zero-based index in `cells`, and a repeated widget id names every cell, and whether the cell widget or its larger-view widget, that carries it. All cell failures of the layout are reported together, each naming its cell, and each failure is collected once. When no cell has a cell failure, all failures of checks 2 to 4 are reported together; an overlap names both cells of the pair. An empty `cells` array is valid: no cell is rendered and no placeholder is shown.

### 6.4 Placement Rule

The dashboards root places the cells of a valid layout with CSS Grid (ADR-0002), as `cpt-frontx-dashboard-algo-layout-types-place-cells` states. The container is a grid of 60 equal columns. A cell with `x`, `y`, `w` and `h` occupies the column range that starts at column `x + 1` (1-based) and spans `w` columns, and the row range that starts at row `y + 1` and spans `h` rows. Each cell holds exactly one cell widget; the larger-view widget is not placed on the grid and shows only in the larger view. The dashboards root trusts the coordinates of a valid layout: it does not move, reorder, or resize a cell to resolve a collision, and the order of `cells` does not change the placement.

## 7. Acceptance Criteria

- [ ] Every concrete type listed in this feature is authored with its full schema
- [ ] Every concrete type passes GTS identifier grammar and GTS v0.17 schema validation
- [ ] Every type identifier ends with `~`, every instance identifier does not, and every identifier carries `v1`
- [ ] No field of Layout or LayoutCell is changed in the browser; the rendered dashboard matches the provided layout.
- [ ] A cell with no `widget`, or whose `x`, `y`, `w` or `h` lies outside its bounds (including `y` or `h` above 9999) or is not an integer, fails the GTS validation of the dashboard, and the failure is a cell failure, collected once by the layout check, that names the cell; it is not also collected as an invalid root.
- [ ] A layout with two overlapping cells, with a cell whose `x + w` is greater than 60, or with a repeated widget id fails the layout checks: no cells are rendered and the dashboard-level placeholder shows.
- [ ] Given a layout in which the cell at index 2 has `w` of 0, when the layout is validated and checked, then the failure names cell index 2 as a cell failure and no cells are rendered.
- [ ] Given a layout in which the cells at indexes 0 and 3 overlap, when the layout is checked, then the failure names both cell indexes 0 and 3.
- [ ] Given a layout with one cell that has a cell failure and two other cells that overlap, when the layout is checked, then only the cell failure is named at its index, because the layout checks run only on a layout whose cells have no cell failure. When the cell failure is removed, the overlapping pair is named.
- [ ] Given a layout with an overlapping pair and, among other cells, one cell whose `x + w` is greater than 60, when the layout is checked, then one pass names both failures.
- [ ] Given a layout in which the cell at index 1 has `x` of 50 and `w` of 15, when the layout is checked, then no cells are rendered and the failure names cell index 1 as an `x + w` failure.
- [ ] Given a cell with `x` of 59 and `w` of 1, and a cell with `x` of 0 and `w` of 60, then each passes the checks.
- [ ] Given two cells that touch at an edge, such as `x` 0 `w` 10 and `x` 10 `w` 10 in the same rows, or `y` 0 `h` 2 and `y` 2 `h` 2 in the same columns, when the layout is checked, then they do not overlap.
- [ ] Given a cell that lies fully inside another cell, and given two cells with the same `x`, `y`, `w` and `h`, when the layout is checked, then each pair overlaps and the failure names both cells.
- [ ] Given a cell whose `x` is 1.5, when the dashboard is validated, then the cell has a cell failure and the failure names it.
- [ ] Given a layout in which the `larger_view` widget of cell 0 and the `widget` of cell 2 carry the same id, when the layout is checked, then no cells are rendered and the failure names both.
- [ ] Given a cell whose `widget` and `larger_view` carry the same id, when the layout is checked, then the failure names that cell, for both roles.
- [ ] Given two cells whose `widget` ids are the same, when the layout is checked, then the failure names both cells.
- [ ] Given a layout with an empty `cells` array, when the layout is checked, then the layout is valid, no cell is rendered, and no placeholder is shown.
- [ ] A LayoutCell embeds one widget and an optional `larger_view` widget; a data widget carries its own embedded query, and the cell carries no widget data.
- [ ] A cell without `larger_view` is valid, and its cell widget hides the larger-view button.
- [ ] GTS resolves the embedded widget of a cell and its larger-view widget to the widget type that each `id` names, with no custom validation code, and a failure under a cell's `widget` or `larger_view` is a widget-level failure of that cell, not a layout failure.
- [ ] Given a valid cell with `x` of 10, `y` of 2, `w` of 20 and `h` of 3, when the dashboards root places it, then it occupies columns 11 to 30 and rows 3 to 5 of the 60-column grid.
- [ ] The Layout and the LayoutCell schemas are each closed with `unevaluatedProperties: false`, so a layout or cell with any other field fails the GTS validation of the dashboard.
- [ ] The Layout declares no `id` or `name` and is embedded in the Dashboard; no layout reference exists.
- [ ] `cfs validate --artifact` on this file reports PASS
