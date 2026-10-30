---
status: accepted
date: 2026-10-29
decision-makers: template-dashboard architecture maintainers
description: "Decision record for the charting library of the chart widget types: Apache ECharts through echarts-for-react and echarts/core, with an ECharts theme built per widget instance from ui-kit tokens of the scope that the host theme id maps to, and its per-instance cost counted by the DESIGN budget rule."
---

# ADR-0004: Charting library

**ID**: `cpt-frontx-dashboard-adr-charting-library`

<!-- toc -->

- [Context and Problem Statement](#context-and-problem-statement)
- [Decision Drivers](#decision-drivers)
- [Considered Options](#considered-options)
- [Decision Outcome](#decision-outcome)
  - [Consequences](#consequences)
  - [Confirmation](#confirmation)
- [Pros and Cons of the Options](#pros-and-cons-of-the-options)
  - [Apache ECharts with echarts-for-react](#apache-echarts-with-echarts-for-react)
  - [Chart.js with react-chartjs-2](#chartjs-with-react-chartjs-2)
  - [Recharts](#recharts)
- [More Information](#more-information)
- [Traceability](#traceability)

<!-- /toc -->

## Context and Problem Statement

The chart widget types `cartesian_chart`, `pie_chart` and `heatmap` must draw cartesian charts (bar, line, area, scatter), pie charts and heatmaps from the typed data shape that each widget type receives through `set_data` ([ADR-0009](0009-subject-agnostic-widget-catalog-v1.md)). `cartesian_chart` takes one or more measures and draws them as series `[{member, type, y_axis, stack_group}]`. Before the first `set_data` a chart shows a loader; on a repeated request it shows a busy indicator; an empty result shows the empty state; and a widget that cannot be shown shows the cannot-show state ([ADR-0011](0011-data-adapter-v1.md)). Which charting library should they use, and how do charts take the host's light or dark look?

The template has no theme of its own. Its only theme input is the host theme id from the host's theme shared property, and every template MFE maps that id to the light or dark scope of `@gears-frontx/ui-kit` ([ADR-0006](0006-theme-distribution-v1.md)). Charts must take their colors and typography from the kit tokens of that scope.

FrontX isolates every MFE instance: each MFE instance evaluates its own copy of its code (FrontX ADR-0011). Every chart widget instance therefore evaluates its own copy of the charting library. For scale, the full Apache ECharts library is about 300 KB minified and gzipped.

## Decision Drivers

* Charts must follow the ui-kit tokens of the light or dark scope that the host theme id maps to, with no per-widget manual styling (`cpt-frontx-dashboard-nfr-visual-quality`).
* Chart descriptions should be a JSON option object, which fits widgets configured as data.
* The library must cover cartesian charts, pie and heatmap without extra plugins.
* The library must take theme values built from ui-kit tokens in one place, and take them again when the host theme changes.
* Download and evaluation cost must be understood under per-instance isolation.

## Considered Options

* Apache ECharts with echarts-for-react
* Chart.js with react-chartjs-2
* Recharts

## Decision Outcome

Chosen option: "Apache ECharts with echarts-for-react", because it covers cartesian, pie and heatmap charts natively, takes a JSON option object, and applies one registered theme to every chart type, which keeps token-driven light and dark theming in one place.

**Chart theme.** Each chart widget instance maps the host theme id to the light or dark scope of ui-kit and builds the ECharts theme `frontx-dashboard` from the kit tokens of that scope: colors, typography, axes and tooltips. It registers that theme in its own ECharts copy, and builds and registers it again on every theme change, without requesting its data again. The dashboards root does not register ECharts themes, because under isolation each widget has its own ECharts copy. The mapping effort is one theme builder that turns kit tokens into an ECharts theme for all chart types.

**Size and cost.** Chart widgets import only the chart types and components they need through `echarts/core`. ECharts and echarts-for-react are listed in the manifest's `shared` array, so they are shared dependencies. Under the counting rule of DESIGN section 3.9, the bundle budget measures transferred gzipped bytes on a cold load of the reference dashboard. Each widget entry counts only its own code against the per-widget figure. Shared dependencies such as ECharts are counted once, in an uncapped page total: their source text is fetched once only when every template MFE publishes the same `contentHash` for it (FrontX ADR-0034), with realm-wide reach (FrontX ADR-0035). That reuse does not lower the evaluation cost: each chart MFE instance evaluates its own copy (FrontX ADR-0011), and that cost counts against the initial-render budget. All figures of DESIGN section 3.9 are provisional and confirmed by measurement (Confirmation).

### Consequences

* Good, because one ECharts theme carries the kit colors and typography to every chart type in both scopes.
* Good, because one JSON option object describes a chart, which suits widgets configured as data.
* Good, because one library covers all required chart types.
* Good, because a theme switch only rebuilds and re-registers the theme in each chart widget, with no request.
* Bad, because ECharts is large, and every chart MFE instance evaluates it again.
* Bad, because the per-instance library cost is held per extension id until the page unloads (FrontX ADR-0011), and the deterministic extension ids of [ADR-0007](0007-extension-domain-taxonomy-v1.md) keep it bounded.
* Bad, because the per-instance cost of a chart widget is confirmed by measurement only, so the figures it counts against are provisional.
* Bad, because echarts-for-react is a small community wrapper maintained outside the Apache ECharts project, so it may fall behind ECharts or React releases. Fallback: the chart widget calls ECharts directly (initialize, set the option, dispose) inside its own component, and widget configuration is not affected because the library already sits behind the widget's typed props.

### Confirmation

Confirmed by rendering each chart widget type in the light and the dark kit scope, by inspecting them against the ui-kit tokens, by switching the host theme and checking that every chart re-themes without a request, and by measuring the chart widget entries under the counting rule of DESIGN section 3.9: transferred gzipped bytes of each entry's own code, ECharts counted once in the page total, and per-instance evaluation within the initial-render budget (`cpt-frontx-dashboard-nfr-bundle-budget`, `cpt-frontx-dashboard-nfr-initial-render`).

## Pros and Cons of the Options

### Apache ECharts with echarts-for-react

A canvas-based library with a declarative option object, wrapped for React.

* Good, because one registered theme object styles colors, typography, axes and tooltips for every chart type, so token mapping is done once.
* Good, because the option-as-JSON API suits charts described as data.
* Good, because it supports heatmap natively.
* Neutral, because selective `echarts/core` imports reduce size but not to the level of small libraries.
* Bad, because it is large to evaluate per instance.

### Chart.js with react-chartjs-2

A smaller canvas library with a configuration object.

* Good, because it is smaller.
* Bad, because heatmaps need a third-party plugin.
* Bad, because theming is split between global defaults and per-dataset colors, so token mapping touches each chart type, and the heatmap plugin is styled separately.

### Recharts

A React component library built on SVG.

* Good, because it is composed from React components.
* Good, because its SVG elements can take kit token values directly as styles.
* Bad, because styling is set per component, so token mapping repeats across each chart type.
* Bad, because the component model is less suited to charts described as data.
* Bad, because it has no native heatmap and renders slowly with many points.

## More Information

* **Review trigger**: if the measured cost of a chart widget exceeds the per-widget figure or the initial-render budget of DESIGN section 3.9, whose figures are provisional and confirmed by measurement (Confirmation), reconsider Chart.js.
* **Open questions**: how a mounted chart re-themes on a scope switch (a registered theme name per scope, or re-creating the instance with its local chart state reset); which ECharts specifiers are shared dependencies and which wrapper entry is used; and how charts meet the accessibility requirement (`cpt-frontx-dashboard-nfr-accessibility`): renderer choice, labelling and decals.
* **Isolation**: isolation is per instance, not a sandbox (FrontX ADR-0011).
* **Scope**: this decision covers the charting library, its React wrapper, and how charts build their theme from ui-kit tokens. It does not cover the budget figures (DESIGN section 3.9), how the host theme id reaches widgets (ADR-0006), the data shapes of the chart widget types ([ADR-0009](0009-subject-agnostic-widget-catalog-v1.md)), or the data grid ([ADR-0005](0005-data-grid-library-v1.md)).
* **Checklist applicability**: ARCH applicable (library choice for all chart widget types); PERF applicable (download counted once as a shared dependency, evaluation per instance, and the `echarts/core` mitigation); SEC N/A (charts render the data that the data adapter delivers ([ADR-0011](0011-data-adapter-v1.md)) and add no trust boundary); REL N/A (no failure mode beyond the widget's own loader, busy, empty and cannot-show states); DATA N/A (chart options are built from the typed data shape delivered through `set_data`); INT applicable (host theme id from the theme shared property, ADR-0006, and ui-kit tokens); OPS N/A (no deployment or operational change); MAINT applicable (wrapper maintenance risk and the direct-ECharts fallback); TEST applicable (rendering in both scopes, theme switch and size measurement); COMPL applicable (ECharts is Apache-2.0 and echarts-for-react is MIT, both compatible with the template); UX applicable (token-driven visual quality in light and dark); BIZ N/A (no business trade-off beyond the download and evaluation cost).
* Related decisions: FrontX ADR-0011 (FrontX isolates every MFE instance) and FrontX ADR-0034 (shared dependency source-text reuse by content hash) and FrontX ADR-0035 (realm-wide reach of that reuse).
* ADR-0001 explains the isolation model that causes the per-instance evaluation cost. ADR-0006 decides how the theme reaches widgets.

## Traceability

- **PRD**: [PRD.md](../PRD.md)
- **DESIGN**: [DESIGN.md](../DESIGN.md)

This decision directly addresses the following requirements or design elements:

* `cpt-frontx-dashboard-nfr-visual-quality` — one ECharts theme built from ui-kit tokens applies the kit look to every chart type, in light and dark, with no per-widget styling.
* `cpt-frontx-dashboard-fr-theme` — chart styling follows the host theme id through the kit scope it maps to, and a theme switch re-themes every chart without reload.
* `cpt-frontx-dashboard-nfr-bundle-budget` — chart widget entries and the shared ECharts dependency are counted by the rule of DESIGN section 3.9.
* `cpt-frontx-dashboard-nfr-initial-render` — the per-instance evaluation cost of ECharts counts against the initial-render budget.
* `cpt-frontx-dashboard-fr-widget-catalog` — the chart widget types `cartesian_chart`, `pie_chart` and `heatmap` use this library.
* `cpt-frontx-dashboard-component-widget-library` — chart widgets build and register their ECharts theme per instance.
* `cpt-frontx-dashboard-seq-theme-switch` — chart widgets rebuild and re-register their ECharts theme on a theme change.
