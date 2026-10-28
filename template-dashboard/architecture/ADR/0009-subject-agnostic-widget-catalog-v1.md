---
status: accepted
date: 2026-10-27
decision-makers: template-dashboard architecture maintainers
description: "Decision record for what the widget catalog contains: 9 subject-agnostic presentation widget types over one generic tabular result, each binding result columns to its roles, with a widget's subject named by the backend metric in its typed source and its data computed by the backend on request."
---

# ADR-0009: Subject-agnostic widget catalog

**ID**: `cpt-frontx-dashboard-adr-subject-agnostic-widget-catalog`

<!-- toc -->

- [Context and Problem Statement](#context-and-problem-statement)
- [Decision Drivers](#decision-drivers)
- [Considered Options](#considered-options)
- [Decision Outcome](#decision-outcome)
  - [Consequences](#consequences)
  - [Confirmation](#confirmation)
- [Pros and Cons of the Options](#pros-and-cons-of-the-options)
  - [Subject-specific catalog](#subject-specific-catalog)
  - [Presentation widget types with one data type per widget type and an open `params` object](#presentation-widget-types-with-one-data-type-per-widget-type-and-an-open-params-object)
  - [Nine presentation widget types over one generic tabular result](#nine-presentation-widget-types-over-one-generic-tabular-result)
  - [Single generic widget with a render discriminator](#single-generic-widget-with-a-render-discriminator)
- [More Information](#more-information)
- [Traceability](#traceability)

<!-- /toc -->

## Context and Problem Statement

A widget type says how a placement is presented; widget data is what it presents. A catalog can be cut along subject lines (one widget type per subject and presentation shape) or along presentation shapes alone. The first grows with every new metric. The consuming product backend computes each widget's data from a named metric, and every metric result has the same tabular shape: ordered column names, positional rows, and the names of the percentage columns. A consuming product may also generate dashboards, for example from a user's chat request, so a widget's subject must be expressible in its definition and checkable before the dashboard is stored. The question is what the template's catalog contains, how a widget names its subject, and how a widget type finds what it shows in a result.

## Decision Drivers

* A small catalog whose size is bounded by presentation shapes, not by shape times subject.
* The same presentation must be reusable across many metrics without forking the catalog.
* New analytics should be added as backend metrics and dashboard configuration, not as new widget code.
* The widget instance in the dashboard definition is the single record of a placement.
* A generated widget instance must be validatable against the registered template types, and what the types cannot know (whether a metric exists and which columns it returns) must still be checked before a viewer sees wrong content.
* The data contract must not grow with the catalog: one result shape serves every widget type.
* The model composes with the GTS type system without new identifier grammar.

## Considered Options

* **Subject-specific catalog** — one widget type per subject and presentation shape combination.
* **Presentation widget types with one data type per widget type and an open `params` object** — each widget type names its own widget data shape through a type-level trait; a widget carries an open, consumer-owned `params` object that consumers close by deriving their own widget types.
* **Nine presentation widget types over one generic tabular result** — each widget type is a presentation schema with a column binding; each widget names a backend metric in a typed `source`; every result has one shape.
* **Single generic widget with a render discriminator** — one widget type whose MFE branches on a `render_as` field.

## Decision Outcome

Chosen option: "Nine presentation widget types over one generic tabular result", because the catalog stays bounded by presentation shapes, new analytics need no new widget code, and one result shape matches what the backend computes for every metric.

**Widget types.** The catalog has 9 subject-agnostic widget types: `summary_card`, `metric_card`, `ranked_list_card`, `progress_list_card`, `grid`, `cartesian_chart`, `pie_chart`, `heatmap` and `markdown_card`. Each is a presentation type: a presentation schema derived from the abstract widget base ([ADR-0003](0003-shared-data-types-and-schemas-v1.md)), and the target of a widget realization ([ADR-0008](0008-widget-type-and-mfe-realization-v1.md)). Its presentation configuration names, for each role, the result column that fills it (its column binding): for example `columns[].key` for each `grid` column, `x` and `series[].column` for `cartesian_chart`, `label` and `value` for `pie_chart`, and `body` from the first row for `markdown_card`. The DESIGN lists the binding of every widget type. No widget type gives its settings a subject.

**Widget instance and `source`.** A widget instance carries its presentation configuration and a typed `source`: `metric`, the required name of a backend metric; `range`, an optional time window in the form the backend defines; and `bucket`, an optional bucketing flag. The template passes these values to the backend unchanged and gives them no meaning. `source.metric` is a plain string, not a GTS type or reference, because metrics are run-time data of the backend.

**Data.** After a widget receives `set_widget_context` with its widget instance, it requests its data once through the FrontX API package, naming the metric from `source` with the optional time window and bucketing flag ([ADR-0011](0011-backend-delivered-dashboard-v1.md)). The backend returns one generic tabular result. The widget validates it against the single widget data type `gts.frontx.v.widget_data.widget_data.v1~` and checks that every column its configuration binds is among the column names. A missing bound column makes the widget's data one that cannot be shown; a result with no rows shows the widget type's empty state. The larger view sends the same request. Nothing else is requested after render except Retry after a failure.

**Consistency of metrics and columns.** The consuming product checks, when it authors or generates a dashboard, that each `source.metric` exists and returns every column that the widget binds. The widget checks the same at run time and shows its cannot-show state when a bound column is missing, never wrong content.

**No consumer widget types in v1.** Every widget instance belongs to one of the 9 template widget types, and a consuming product derives no widget types and adds no widget settings. It can change how a template widget type is shown only through a replacement widget realization ([ADR-0008](0008-widget-type-and-mfe-realization-v1.md)). Consumer widget types are a later stage.

**Delivered content.** The backend supplies exactly what a widget shows; the widget types carry no display limits that hide or cut off supplied content. The single exception is the markdown safety rule: embedded HTML in a markdown card (`markdown_card`) is shown as plain text, not rendered; the card's markdown formatting still applies.

### Consequences

* Good, because adding an analytic is a backend metric and a dashboard configuration, not a catalog change.
* Good, because the same widget type serves many analytics, for example a `summary_card` for order counts and for active-user counts.
* Good, because one result shape keeps the backend interface the same for every widget type, and the backend never reshapes a result for the widget that asks.
* Good, because the typed `source` is checked by the template types, so a generated widget cannot carry an arbitrary request object.
* Good, because widgets receive their configuration with `set_widget_context`, request data with their `source`, and carry no subject branching.
* Bad, because authors must think in two layers, presentation shape and metric, and must know the column names a metric returns.
* Bad, because the type system cannot check that a metric exists or returns the bound columns; a mismatch that the consumer misses at authoring time shows up only as a cannot-show widget at run time.
* Bad, because a need that the 9 presentation shapes cannot meet requires a template change, since consumers cannot add widget types in v1.

### Confirmation

* Schema validation confirms that each of the 9 widget types derives from the abstract widget base and declares its column binding fields, and that the base declares `source` with a required `metric` and optional `range` and `bucket`, and no traits.
* A widget data fixture for each widget type validates against the single widget data type and contains every column that widget type binds; widget-level tests confirm that a result without a bound column gives the cannot-show state and that a result with no rows gives the empty state.
* Schema review confirms that no template widget type gives a `source` value a meaning and that no widget type has a field that hides or cuts off delivered content.
* Design review confirms that no widget type name carries a subject.

## Pros and Cons of the Options

### Subject-specific catalog

One widget type per subject and shape.

* Good, because each widget type is fully specific.
* Bad, because the catalog grows with every metric and prevents reuse.
* Bad, because adding an analytic requires new widget code.

### Presentation widget types with one data type per widget type and an open `params` object

Presentation primitives, each paired with its own widget data shape through a trait, and a consumer-owned `params` object that consumers close by deriving widget types.

* Good, because the catalog is bounded by presentation shapes.
* Good, because the pairing of widget type and data shape is checked once per type.
* Bad, because every metric returns one tabular shape, so the backend would have to reshape each result for the widget type that asks, and the data contract would grow with each widget type.
* Bad, because an open `params` object is not checked by the template types, so its checking depends on consumer-derived widget types.
* Bad, because consumer-derived widget types would need the backend to register widget types, which is a later stage.

### Nine presentation widget types over one generic tabular result

Presentation primitives with column bindings, a typed `source` that names a backend metric, and one result shape.

* Good, because the catalog is bounded by presentation shapes.
* Good, because analytics are added as backend metrics, selected by `source.metric`.
* Good, because the backend interface has one result shape for every widget type.
* Neutral, because authors learn two layers.
* Bad, because the match between a metric and the bound columns is checked by the consumer and at run time, not by the types.

### Single generic widget with a render discriminator

One widget type; the MFE chooses a presentation at run time.

* Good, because the catalog is a single type.
* Bad, because the type system does not say which settings a placement needs.
* Bad, because one MFE carries every presentation branch, inflating its bundle.
* Bad, because a consumer could not replace how one presentation is shown without replacing all of them.

## More Information

**Review trigger.** Revisit when a needed analytic cannot be expressed with the 9 presentation shapes; the answer is then a new widget type in the template, not a subject-specific one. Revisit also when consumer widget types are taken up as a later stage.

**Scope.** This record decides what the widget catalog contains, how a widget names its subject, and how a widget type finds its columns in a result. It does not decide how widget types map to MFE entries ([ADR-0008](0008-widget-type-and-mfe-realization-v1.md)), the type system and the widget data type ([ADR-0003](0003-shared-data-types-and-schemas-v1.md)), or how the backend is requested ([ADR-0011](0011-backend-delivered-dashboard-v1.md)).

**Checklist applicability.** ARCH applicable and addressed above. PERF applicable only through the bundle size effect of one MFE per widget type. SEC applicable in one respect: the markdown safety rule shows embedded HTML as plain text; no other security mechanism is decided. REL applicable at contract level: a missing bound column maps to the cannot-show state instead of wrong content. DATA applicable at contract level: one widget data type for every result, column bindings in presentation configuration, and a typed `source` whose metric is a plain string. INT applicable: consumers add analytics as backend metrics against the published result shape and check metrics and columns when they author dashboards. OPS not applicable because no operational procedure is governed. MAINT applicable: the catalog stays bounded by presentation shapes. TEST applicable: schema validation covers the bindings, and widget-level tests cover the column check, the empty state, and the presentation of each widget type. COMPL not applicable because no regulatory obligation is involved. UX applicable in one respect: the set of presentation shapes bounds what a dashboard can show. BIZ applicable: consumers cannot add widget types in v1.

**Related decisions.** [ADR-0003](0003-shared-data-types-and-schemas-v1.md) defines the widget base and the single widget data type; [ADR-0008](0008-widget-type-and-mfe-realization-v1.md) defines how widget types relate to MFE entries and how a consumer replaces how one is shown; [ADR-0011](0011-backend-delivered-dashboard-v1.md) defines the backend-delivered dashboard definition and the per-widget data request.

## Traceability

- **PRD**: [PRD.md](../PRD.md)
- **DESIGN**: [DESIGN.md](../DESIGN.md)

This decision directly addresses the following requirements or design elements:

* `cpt-frontx-dashboard-fr-widget-catalog` — defines the 9 subject-agnostic presentation widget types, including the grid widget type, with their column bindings.
* `cpt-frontx-dashboard-fr-domain-model` — widgets carry a typed `source`, every result validates against one widget data type, and consumers add no widget types or widget settings in v1.
* `cpt-frontx-dashboard-fr-backend-source` — the backend computes each widget's data from the metric named in its `source`.
* `cpt-frontx-dashboard-component-widget-data-request` — each widget requests its metric after `set_widget_context` and checks its bound columns.
* `cpt-frontx-dashboard-component-widget-library` — the 9 widget types, their empty states, and the markdown safety rule.
* `cpt-frontx-dashboard-usecase-view-dashboard` — the dashboard is composed of these widget instances, each showing its data as delivered or a cannot-show state.
