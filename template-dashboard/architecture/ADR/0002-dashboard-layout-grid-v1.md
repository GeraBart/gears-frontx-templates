---
status: accepted
date: 2026-10-27
decision-makers: template-dashboard architecture maintainers
description: "Decision record for how the Viewer host stores and renders layout: integer {x, y, w, h} cells on a 60-column grid, rendered with CSS Grid and no layout library, with invalid layouts rejected by schema validation and a layout check by the Viewer host."
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
  - [A layout library at run time (react-grid-layout) in the Viewer host](#a-layout-library-at-run-time-react-grid-layout-in-the-viewer-host)
- [More Information](#more-information)
- [Traceability](#traceability)

<!-- /toc -->

## Context and Problem Statement

A dashboard places widgets in cells. The Viewer host needs a layout model that is easy to store as data and easy to render. How should layout be represented and rendered in the Viewer host?

A layout is a set of cells, each stored as integer `{x, y, w, h}` coordinates with one widget per cell. The template covers the Viewer host only: it renders stored layouts and does not edit them. Authoring is out of scope for this template: the consuming product writes or generates layouts, and the stored format does not depend on any editor library.

## Decision Drivers

* The stored layout must be independent of any rendering library, so that it can be validated and reused.
* The Viewer host must not carry a layout library, to keep widget and Viewer host bundles small under per-instance isolation.
* Layout must render the same way for every dashboard, with no hidden collision logic at run time.
* Common row splits, including five equal widgets in a row, must fit without remainders, while coordinates stay easy to write by hand.
* The rendered layout must work inside the Shadow DOM boundary of the layout domain without document-level stylesheets.

## Considered Options

* 60-column `{x, y, w, h}` cells rendered with CSS Grid
* 12- or 24-column `{x, y, w, h}` cells rendered with CSS Grid
* A layout library at run time (react-grid-layout) in the Viewer host

## Decision Outcome

Chosen option: "60-column `{x, y, w, h}` cells rendered with CSS Grid", because it keeps the stored model library-independent, renders with browser-native layout at no bundle cost, and fits more common splits than a coarser grid.

The layout-to-CSS mapping is direct. The container is a grid with 60 equal columns. A cell with `x`, `y`, `w`, `h` occupies the column range starting at `x + 1` and spanning `w` columns, and the row range starting at `y + 1` and spanning `h` rows. Each cell holds one widget. The Viewer host trusts valid coordinates and does not move cells to resolve collisions.

Invalid layouts are caught in two places. Schema validation of the layout cell type checks the bounds of each coordinate (non-negative integers, `x` below 60, `w` from 1 to 60, `h` at least 1). A layout check by the Viewer host runs when the Viewer host opens a dashboard. It rejects cells that overlap or that extend past column 60 (`x + w` greater than 60), and the Viewer host shows a diagnostic instead of rendering the dashboard.

Authoring is out of scope for this template, and the consuming product writes or generates layouts. The stored format does not depend on any editor library, so the consuming product can use any editor without a format change.

### Consequences

* Good, because the Viewer host has no layout dependency, so there is no extra code to load in each instance.
* Good, because the same stored coordinates can feed any editor the consuming product uses, without a format change.
* Good, because 60 columns divide evenly into halves, thirds, quarters, fifths, sixths, tenths, and twelfths.
* Bad, because overlapping or out-of-range cells are not repaired at run time. Schema validation and the layout check by the Viewer host reject them, so one bad cell blocks the whole dashboard until its data is fixed.
* Bad, because coordinates on 60 columns are larger numbers than on 12 columns, so hand-written layouts are more prone to small gaps.
* Bad, because there is no visual editor, so layouts are written as data.

### Confirmation

Confirmed by rendering a test dashboard and checking that each cell lands on the column and row range given by its coordinates. Two fixtures confirm rejection: an overlapping fixture, where two cells share a grid area, and an out-of-range fixture, where a cell has `x + w` greater than 60. For each fixture the Viewer host renders no cells and shows a diagnostic. A review confirms that the Viewer host package has no layout library dependency.

## Pros and Cons of the Options

### 60-column `{x, y, w, h}` cells rendered with CSS Grid

Cells are integer coordinates on a fixed 60-column grid, mapped to CSS grid lines.

* Good, because it uses browser-native layout.
* Good, because the grid styles live in the Viewer host's own shadow root and need no document-level stylesheet.
* Good, because the stored model is simple and library-independent.
* Good, because 60 is divisible by 2, 3, 4, 5, 6, 10, 12, 15, 20, and 30, so five equal widgets in a row fit exactly.
* Neutral, because authoring is out of scope and left to the consuming product.
* Bad, because collisions are not resolved at run time and need a separate layout check.
* Bad, because the larger coordinates are harder to write by hand.

### 12- or 24-column `{x, y, w, h}` cells rendered with CSS Grid

The same model and rendering, with a coarser grid.

* Good, because it uses browser-native layout and works inside the shadow root, like the 60-column option.
* Good, because 12 columns is a familiar convention, and small coordinates are easy to write by hand.
* Neutral, because 24 columns adds eighths but still gives fewer splits than 60.
* Bad, because neither 12 nor 24 is divisible by 5, so five equal widgets in a row cannot fit.
* Bad, because it gives coarser placement for small widgets such as metric cards.
* Bad, because collisions are still not resolved at run time.

### A layout library at run time (react-grid-layout) in the Viewer host

The Viewer host would render and position cells through a drag-and-resize grid library.

* Good, because collision handling is built in.
* Bad, because the Viewer host would load an editing library only to display fixed layouts.
* Bad, because each isolated instance would pay for that code.
* Bad, because the library ships document-level stylesheets that would have to be injected into each shadow root.

## More Information

* **Review trigger**: revisit this decision when responsive layouts for narrow screens become a requirement.
* **Scope**: this decision covers the stored cell model, the column count, the rendering technique, and where invalid layouts are caught. It does not cover authoring, responsive reflow for narrow screens, or the layout domain and cell types, which the DESIGN specifies.
* **Checklist applicability**: ARCH applicable (layout model and rendering technique); PERF applicable (no layout library per instance, native layout at first render); SEC N/A (coordinates are validated integers and add no trust boundary); REL applicable (invalid layouts are rejected with a diagnostic); DATA applicable (stored coordinate format and its validation); INT N/A (no external system is involved); OPS N/A (no deployment or operational change); MAINT applicable (no layout library to upgrade, and the format is independent of any editor library); TEST applicable (overlapping and out-of-range fixtures); COMPL N/A (no regulated data or new license); UX applicable (placement precision and the missing visual editor); BIZ N/A (authoring out of scope is recorded in Scope, with no other business trade-off).
* Authoring is out of scope for this template; the consuming product writes or generates layouts.

## Traceability

- **PRD**: [PRD.md](../PRD.md)
- **DESIGN**: [DESIGN.md](../DESIGN.md)

This decision directly addresses the following requirements or design elements:

* `cpt-frontx-dashboard-fr-domain-model` — the layout and cell types of the domain model store integer `{x, y, w, h}` coordinates on the 60-column grid.
* `cpt-frontx-dashboard-fr-widget-catalog` — each cell holds one widget of the catalog.
* `cpt-frontx-dashboard-nfr-bundle-budget` — the Viewer host carries no layout library.
* `cpt-frontx-dashboard-nfr-initial-render` — native CSS Grid keeps layout cost low at first render.
