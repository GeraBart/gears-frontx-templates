---
status: accepted
date: 2026-10-29
decision-makers: template-dashboard architecture maintainers
description: "Decision record for how the dashboards root stores and renders layout: integer {x, y, w, h} cells on a 60-column grid, rendered with CSS Grid and no layout library, with invalid layouts rejected by schema validation and a layout check by the dashboards root."
---

# ADR-0002: Dashboard layout grid

**ID**: `cpt-frontx-dashboard-adr-dashboard-layout-grid`

<!-- toc -->

- [Context and Problem Statement](#context-and-problem-statement)
- [Decision Drivers](#decision-drivers)
- [Considered Options](#considered-options)
- [Decision Outcome](#decision-outcome)
  - [Consequences](#consequences)
  - [Confirmation](#confirmation)
- [Pros and Cons of the Options](#pros-and-cons-of-the-options)
  - [60-column `{x, y, w, h}` cells rendered with CSS Grid](#60-column-x-y-w-h-cells-rendered-with-css-grid)
  - [12- or 24-column `{x, y, w, h}` cells rendered with CSS Grid](#12--or-24-column-x-y-w-h-cells-rendered-with-css-grid)
  - [A layout library at run time (react-grid-layout) in the dashboards root](#a-layout-library-at-run-time-react-grid-layout-in-the-dashboards-root)
- [More Information](#more-information)
- [Traceability](#traceability)

<!-- /toc -->

## Context and Problem Statement

A dashboard places widgets in cells. The dashboards root is whatever hosts the dashboards: a screen extension, or code copied into the shell of a single-page application. The dashboards root needs a layout model that is easy to store as data and easy to render. How should layout be represented and rendered in the dashboards root?

A layout is a set of cells, each stored as integer `{x, y, w, h}` coordinates. A cell holds one widget and an optional larger-view widget. The template covers the dashboards root only: it renders stored layouts and does not edit them. Authoring is out of scope for this template: the consuming product writes or generates layouts, and the stored format does not depend on any editor library.

## Decision Drivers

* The stored layout must be independent of any rendering library, so that it can be validated and reused.
* The dashboards root must not carry a layout library, to keep widget and dashboards root bundles small under per-instance isolation.
* Layout must render the same way for every dashboard, with no hidden collision logic at run time.
* Common row splits, including five equal widgets in a row, must fit without remainders, while coordinates stay easy to write by hand.
* The rendered layout must work inside the style scope that the dashboards root owns, whether it is a screen extension or shell code, without document-level stylesheets.

## Considered Options

* 60-column `{x, y, w, h}` cells rendered with CSS Grid
* 12- or 24-column `{x, y, w, h}` cells rendered with CSS Grid
* A layout library at run time (react-grid-layout) in the dashboards root

## Decision Outcome

Chosen option: "60-column `{x, y, w, h}` cells rendered with CSS Grid", because it keeps the stored model library-independent, renders with browser-native layout at no bundle cost, and fits more common splits than a coarser grid.

The layout-to-CSS mapping is direct. The container is a grid with 60 equal columns. A cell with `x`, `y`, `w`, `h` occupies the column range starting at `x + 1` and spanning `w` columns, and the row range starting at `y + 1` and spanning `h` rows. Each cell holds one widget and may hold a larger-view widget (`cell.larger_view`); when it is absent, the cell hides its larger-view button. The dashboards root trusts valid coordinates and does not move cells to resolve collisions.

Invalid layouts are caught in two places. Schema validation of the layout cell type checks the bounds of each coordinate (`0 ≤ x ≤ 59`, `0 ≤ y ≤ 9999`, `1 ≤ w ≤ 60`, `1 ≤ h ≤ 9999`). A layout check by the dashboards root runs when the dashboards root opens a dashboard. It rejects cells that overlap, cells that extend past column 60 (`x + w` greater than 60), and a dashboard that repeats a widget id, in a cell widget or in a larger-view widget, because every GTS instance id is unique and a dashboard never holds the same widget instance twice. A failed layout check is a dashboard-wide cannot-show state ([ADR-0011](0011-data-adapter-v1.md)): the dashboard area shows one static "cannot be shown" placeholder in place of the dashboard. The same placeholder shows when the dashboard root fields fail validation or the delivered types cannot be registered. A cell whose widget fails its own checks shows the placeholder in that cell only.

The stored format does not depend on any editor library, so the consuming product can use any editor without a format change.

### Consequences

* Good, because the dashboards root has no layout dependency, so there is no extra code to load in each instance.
* Good, because the same stored coordinates can feed any editor the consuming product uses, without a format change.
* Good, because 60 columns divide evenly into halves, thirds, quarters, fifths, sixths, tenths, and twelfths.
* Bad, because overlapping or out-of-range cells and repeated widget ids are not repaired at run time. Schema validation and the layout check by the dashboards root reject them, so one bad cell blocks the whole dashboard, and its data must be fixed. A widget that fails its own checks affects only its cell.
* Bad, because coordinates on 60 columns are larger numbers than on 12 columns, so hand-written layouts are more prone to small gaps.
* Bad, because there is no visual editor, so layouts are written as data.

### Confirmation

Confirmed by rendering a test dashboard and checking that each cell lands on the column and row range given by its coordinates. Three fixtures confirm rejection: an overlapping fixture, where two cells share a grid area, an out-of-range fixture, where a cell has `x + w` greater than 60, and a repeated-widget-id fixture, where two widgets of the dashboard, in cells or in larger views, carry the same widget id. For each fixture the dashboards root renders no cells and shows the dashboard-wide placeholder. A review confirms that the dashboards root package has no layout library dependency.

## Pros and Cons of the Options

### 60-column `{x, y, w, h}` cells rendered with CSS Grid

Cells are integer coordinates on a fixed 60-column grid, mapped to CSS grid lines.

* Good, because it uses browser-native layout.
* Good, because the grid styles live in the style scope that the dashboards root owns, in either hosting form, and need no document-level stylesheet.
* Good, because the stored model is simple and library-independent.
* Good, because 60 is divisible by 2, 3, 4, 5, 6, 10, 12, 15, 20, and 30, so five equal widgets in a row fit exactly.
* Neutral, because authoring is out of scope and left to the consuming product.
* Bad, because collisions are not resolved at run time and need a separate layout check.
* Bad, because the larger coordinates are harder to write by hand.

### 12- or 24-column `{x, y, w, h}` cells rendered with CSS Grid

The same model and rendering, with a coarser grid.

* Good, because it uses browser-native layout and works inside the dashboards root's style scope, like the 60-column option.
* Good, because 12 columns is a familiar convention, and small coordinates are easy to write by hand.
* Neutral, because 24 columns adds eighths but gives fewer splits than 60.
* Bad, because neither 12 nor 24 is divisible by 5, so five equal widgets in a row cannot fit.
* Bad, because it gives coarser placement for small widgets such as metric cards.
* Bad, because collisions are not resolved at run time.

### A layout library at run time (react-grid-layout) in the dashboards root

The dashboards root would render and position cells through a drag-and-resize grid library.

* Good, because collision handling is built in.
* Bad, because the dashboards root would load an editing library only to display fixed layouts.
* Bad, because each isolated instance would pay for that code.
* Bad, because the library ships document-level stylesheets that would have to be injected into the style scope that the dashboards root owns.

## More Information

* **Review trigger**: revisit this decision when responsive layouts for narrow screens become a requirement.
* **Open questions**: the row track size of the grid (the unit of `h`), and the reading and keyboard order of cells.
* **Scope**: this decision covers the stored cell model, the column count, the rendering technique, and where invalid layouts are caught. It does not cover authoring, responsive reflow for narrow screens, or the `layout_cells` extension domain and the layout types, which the DESIGN specifies.
* **Checklist applicability**: ARCH applicable (layout model and rendering technique); PERF applicable (no layout library per instance, native layout at first render); SEC N/A (coordinates are validated integers and add no trust boundary); REL applicable (invalid layouts are rejected with the dashboard-wide cannot-show placeholder); DATA applicable (stored coordinate format and its validation); INT N/A (no external system is involved); OPS N/A (no deployment or operational change); MAINT applicable (no layout library to upgrade, and the format is independent of any editor library); TEST applicable (overlapping, out-of-range and repeated-widget-id fixtures); COMPL N/A (no regulated data or new license); UX applicable (placement precision and the missing visual editor); BIZ N/A (authoring out of scope is recorded in Scope, with no other business trade-off).

## Traceability

- **PRD**: [PRD.md](../PRD.md)
- **DESIGN**: [DESIGN.md](../DESIGN.md)

This decision directly addresses the following requirements or design elements:

* `cpt-frontx-dashboard-fr-domain-model` — the layout and cell types of the domain model store integer `{x, y, w, h}` coordinates on the 60-column grid.
* `cpt-frontx-dashboard-fr-widget-catalog` — each cell holds one widget of the catalog and an optional larger-view widget.
* `cpt-frontx-dashboard-nfr-bundle-budget` — the dashboards root carries no layout library.
* `cpt-frontx-dashboard-nfr-initial-render` — native CSS Grid keeps layout cost low at first render.
