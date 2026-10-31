---
status: accepted
version: 1
date: 2026-10-31
description: "Feature: the dashboard model — the dashboard GTS type, the 60-column grid layout cells, the layout checks, and per-cell failure attribution."
---

# Feature: Dashboard Model

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-featstatus-dashboard-model`

<!-- toc -->

- [1. Feature Context](#1-feature-context)
  - [1.1 Overview](#11-overview)
  - [1.2 Purpose](#12-purpose)
  - [1.3 Actors](#13-actors)
  - [1.4 References](#14-references)
- [2. Actor Flows (CDSL)](#2-actor-flows-cdsl)
  - [No actor flows](#no-actor-flows)
- [3. Processes / Business Logic (CDSL)](#3-processes--business-logic-cdsl)
  - [Layout checks](#layout-checks)
  - [Failure attribution](#failure-attribution)
- [4. States (CDSL)](#4-states-cdsl)
  - [Dashboard load state](#dashboard-load-state)
- [5. Definitions of Done](#5-definitions-of-done)
  - [Dashboard type and instances](#dashboard-type-and-instances)
  - [Layout checks](#layout-checks-1)
  - [Per-cell failure attribution](#per-cell-failure-attribution)
- [6. Acceptance Criteria](#6-acceptance-criteria)

<!-- /toc -->

## 1. Feature Context

- [ ] `p1` - `cpt-frontx-dashboard-feature-dashboard-model`

### 1.1 Overview

The dashboard GTS type, its instances, the 60-column grid layout cells, the layout checks the root runs, and per-cell failure attribution. This is the data a dashboard author writes and the root validates.

### 1.2 Purpose

A dashboard author writes one JSON: a title, cells on the 60-column grid, and in each cell a widget instance. The root validates the dashboard against its type and runs the layout checks before it mounts any cell. A failure of the dashboard itself is dashboard-level; a widget that fails its own registration gets a failed cell (D13).

**Requirements**: `cpt-frontx-dashboard-fr-dashboard-root`, `cpt-frontx-dashboard-fr-per-cell-failure`, `cpt-frontx-dashboard-fr-dashboard-as-json`.

**Principles**: `cpt-frontx-dashboard-principle-open-bases-closed-leaves`.

**Constraints**: `cpt-frontx-dashboard-constraint-sixty-column-grid`, `cpt-frontx-dashboard-constraint-one-gts-package`.

**Not applicable**: persistence/DB (no database), auth/security (sign-in out of scope, D4), ops/rollout (no deployed service), compliance/privacy (no data stored).

### 1.3 Actors

| Actor | Role in Feature |
|-------|-----------------|
| `cpt-frontx-dashboard-actor-dashboard-author` | Writes the dashboard JSON (by hand or generated). |
| `cpt-frontx-dashboard-actor-dashboard-viewer` | Sees the dashboard or its cannot-be-shown state. |

### 1.4 References

- **PRD**: [PRD.md](../../PRD.md)
- **Design**: [DESIGN.md](../../DESIGN.md) (§3.1 Domain Model, §3.6 Runtime Flow load step)
- **Dependencies**: None (foundation feature)

## 2. Actor Flows (CDSL)

This feature has no actor flows of its own; the dashboard runtime drives the load and layout-check steps (see `cpt-frontx-dashboard-feature-dashboard-runtime`, flow `cpt-frontx-dashboard-flow-dashboard-runtime-open`). The model defines the data and the checks the runtime calls.

### No actor flows

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-flow-dashboard-model-none`

**Actor**: `cpt-frontx-dashboard-actor-dashboard-author`

**Success Scenarios**:
- The author writes a dashboard JSON that the runtime validates.

**Steps**:
1. [ ] - `p1` - The runtime calls the model's layout checks and failure attribution (no actor flow of the model's own). - `inst-dm-flow-none`
2. [ ] - `p1` - **RETURN**. - `inst-dm-flow-return`

## 3. Processes / Business Logic (CDSL)

### Layout checks

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-algo-dashboard-model-layout-checks`

**Input**: a registered dashboard instance with `layout.cells[]`.

**Output**: a list of layout failures, or an empty list if the layout is valid.

**Steps**:
1. [ ] - `p1` - Set `failures = []`. - `inst-dm-layout-init`
2. [ ] - `p1` - **FOR EACH** `cell` in `layout.cells` - `inst-dm-layout-cell`
   1. [ ] - `p1` - **IF** `cell.x < 0` OR `cell.x > 59` OR `cell.w < 1` OR `cell.w > 60` OR `cell.x + cell.w > 60` - `inst-dm-layout-bounds`
      1. [ ] - `p1` - Append a bounds failure for `cell`. - `inst-dm-layout-bounds-add`
   2. [ ] - `p1` - **IF** `cell` overlaps another cell already seen in this pass - `inst-dm-layout-overlap`
      1. [ ] - `p1` - Append an overlap failure for `cell`. - `inst-dm-layout-overlap-add`
3. [ ] - `p1` - Collect every widget id across all `cell.widget` and `cell.larger_view`. - `inst-dm-layout-ids`
4. [ ] - `p1` - **IF** any widget id appears more than once - `inst-dm-layout-unique`
   1. [ ] - `p1` - Append a duplicate-widget-id failure for each repeated id. - `inst-dm-layout-unique-add`
5. [ ] - `p1` - **RETURN** `failures`. - `inst-dm-layout-return`

All layout failures of one pass are reported together. A non-empty `failures` list is a dashboard-level failure (D13): the dashboard area shows the cannot-be-shown state and no cell is mounted.

### Failure attribution

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-algo-dashboard-model-failure-attribution`

**Input**: the step that failed (file fetch, type rejection, dashboard validation, layout check, widget registration, request, transform, data validation, mount).

**Output**: the scope the failure affects (dashboard or a single cell/larger view).

**Steps**:
1. [ ] - `p1` - **IF** the failure is a file-fetch failure, a type rejection, a dashboard validation failure, or a layout check failure - `inst-dm-fail-dashboard`
   1. [ ] - `p1` - **RETURN** dashboard scope. - `inst-dm-fail-dashboard-return`
2. [ ] - `p1` - **ELSE** the failure is a widget registration, request, transform, data validation, or mount failure - `inst-dm-fail-cell`
   1. [ ] - `p1` - **RETURN** the cell (or larger view) scope of that widget. - `inst-dm-fail-cell-return`

A dashboard-scope failure shows the dashboard-level cannot-be-shown state and mounts no cell. A cell-scope failure shows the cell's cannot-be-shown state; the other cells are unaffected (D13).

## 4. States (CDSL)

### Dashboard load state

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-state-dashboard-model-load`

**States**: `loading`, `shown`, `cannot-be-shown`

**Initial State**: `loading`

**Transitions**:
1. [ ] - `p1` - **FROM** `loading` **TO** `shown` **WHEN** the dashboard validates and the layout checks pass. - `inst-dm-state-shown`
2. [ ] - `p1` - **FROM** `loading` **TO** `cannot-be-shown` **WHEN** the file can't be fetched, a type is rejected, the dashboard fails validation, or the layout checks fail. - `inst-dm-state-cannot`

## 5. Definitions of Done

### Dashboard type and instances

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-dod-dashboard-model-type`

The system **MUST** ship the dashboard GTS type `gts.frontx.dashboard.dashboard.dashboard.v1~` with a `title` and a `layout.cells[]` of plain closed cell objects (`x`, `y`, `w`, `h`, `widget`, optional `larger_view`), under the `dashboard` package (D18).

**Implements**: `cpt-frontx-dashboard-fr-dashboard-as-json`.

**Constraints**: `cpt-frontx-dashboard-constraint-one-gts-package`.

**Touches**:
- Entities: Dashboard, Cell, Widget instance

### Layout checks

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-dod-dashboard-model-layout-checks`

The root **MUST** run the layout checks (`cpt-frontx-dashboard-algo-dashboard-model-layout-checks`) on every dashboard load and reject the whole dashboard when any check fails.

**Implements**: `cpt-frontx-dashboard-algo-dashboard-model-layout-checks`, `cpt-frontx-dashboard-fr-per-cell-failure`.

**Constraints**: `cpt-frontx-dashboard-constraint-sixty-column-grid`.

**Touches**:
- Entities: Dashboard, Cell

### Per-cell failure attribution

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-dod-dashboard-model-attribution`

The root **MUST** attribute each failure to its scope (`cpt-frontx-dashboard-algo-dashboard-model-failure-attribution`): dashboard-level or a single cell/larger view.

**Implements**: `cpt-frontx-dashboard-algo-dashboard-model-failure-attribution`, `cpt-frontx-dashboard-fr-per-cell-failure`.

**Touches**:
- Entities: Dashboard, Cell

## 6. Acceptance Criteria

- [ ] A dashboard author writes a dashboard JSON that validates against the dashboard type and passes the layout checks, and the root shows it.
- [ ] A dashboard with a cell where `x + w > 60` is rejected at the dashboard level and no cell is mounted.
- [ ] A dashboard with two overlapping cells is rejected at the dashboard level.
- [ ] A dashboard with the same widget id in two cells is rejected at the dashboard level.
- [ ] A widget that fails its own registration fails only its cell; the other cells are unaffected.
