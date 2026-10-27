---
status: accepted
date: 2026-10-27
decision-makers: template-dashboard architecture maintainers
description: "Decision record for what the widget catalog contains: 9 subject-agnostic rendering-primitive widget kinds, each naming its widget data type through the data_type trait, with a widget's subject carried in consumer-owned params and its data supplied by the backend."
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
  - [Subject-agnostic kinds with per-kind widget data and backend-supplied widget data](#subject-agnostic-kinds-with-per-kind-widget-data-and-backend-supplied-widget-data)
  - [Single generic widget with a render discriminator](#single-generic-widget-with-a-render-discriminator)
- [More Information](#more-information)
- [Traceability](#traceability)

<!-- /toc -->

## Context and Problem Statement

A widget kind says how a placement renders; widget data is what it renders. A catalog can be cut along subject lines (one kind per subject and rendering shape) or along rendering shapes. The first grows with every new metric. A consuming product may also generate dashboards, for example from a user's chat request, so a widget's subject must be expressible in its definition and checkable before the dashboard is stored. The question is what the template's catalog contains and where the subject of a widget comes from.

## Decision Drivers

* A small catalog whose size is bounded by rendering shapes, not by shape times subject.
* The same rendering must be reusable across many analytics without forking the catalog.
* New analytics should be added as data and configuration, not as new widget code.
* The widget instance in dashboard config is the single record of a placement.
* A generated widget instance must be validatable against registered types, including the parts whose meaning only the consumer knows.
* The model composes with the GTS type system without new identifier grammar.

## Considered Options

* **Subject-specific catalog** — one widget kind per subject and rendering shape combination.
* **Subject-agnostic kinds with per-kind widget data and backend-supplied widget data** — rendering-primitive kinds, each paired with one widget data shape; the backend supplies the data.
* **Single generic widget with a render discriminator** — one widget type whose MFE branches on `render_as`.

## Decision Outcome

Chosen option: "Subject-agnostic kinds with per-kind widget data and backend-supplied widget data", because the catalog stays bounded by rendering shapes and new analytics need no new widget code.

The catalog has 9 rendering-primitive widget kinds: `summary_card`, `metric_card`, `ranked_list_card`, `progress_list_card`, `grid`, `cartesian_chart`, `pie_chart`, `heatmap` and `markdown_card`. Each kind names one widget data shape, derived from the abstract widget data base `gts.frontx.v.widget_data.widget_data.v1~`, through its `data_type` trait ([ADR-0003](0003-shared-data-types-and-schemas-v1.md)). The backend supplies the data: each widget requests its own data, and the response is an instance of its kind's `data_type` ([ADR-0011](0011-backend-delivered-dashboard-v1.md)).

**Widget instance.** A widget instance carries its presentation configuration and `params` inline. `params` is an object that tells the backend what to compute for this widget. The template's widget base declares it as an open object and gives no key a meaning: what `params` means belongs to the consumer. A consumer that wants its widgets checked may derive its own widget types from a template kind and close the `params` schema there, for example `gts.frontx.m.widget.widget.v1~frontx.m.widget.grid.v1~acme.gh.widget.pr_list.v1~` for a pull request list grid. A generated definition must then validate against those derived types. The kinds themselves stay free of any subject.

**Consumer responsibility.** Presentation keys that a widget references, such as the grid's column keys, must be producible by the backend from that widget's `params`. Keeping the two consistent is the consumer's responsibility when it authors or generates a definition; how it is checked is an open item of [feature-backend-contract](../features/feature-backend-contract/FEATURE.md) (section 6.5).

Data flow in the template: the backend returns the dashboard definition with its embedded layout and widget instances; each widget requests its data through the FrontX API package with its kind and `params` once when it mounts, and nothing changes after render, apart from a widget's own request for what its larger view needs. The backend supplies exactly what a widget shows; the kinds carry no display limits that hide or cut off supplied content.

### Consequences

* Good, because adding an analytic is a backend data change, not a catalog change.
* Good, because the same kind serves many analytics, for example a `summary_card` for pull request counts and for contributor counts.
* Good, because widgets receive their configuration with `set_subject`, request data with their kind and `params`, and carry no subject branching.
* Good, because configuration and data are separated: GTS instances and backend-supplied widget data.
* Good, because consumers can make generated widgets checkable by deriving widget types that close `params`, without changing the template.
* Bad, because authors must think in two layers, rendering shape and data subject.
* Bad, because the template alone cannot check that a widget's `params` make sense; that needs consumer-derived types.
* Bad, because the consistency between presentation keys and `params` is a consumer responsibility that the type system does not check.

### Confirmation

* Schema validation confirms that each of the 9 kinds sets exactly one `data_type` trait derived from the widget data base, and that a widget data fixture for each kind matches the `data_type` of that kind.
* Schema review confirms that the template's widget base declares `params` as an open object and that no template kind gives a `params` key a meaning.
* Design review confirms that no widget kind name carries a subject.

## Pros and Cons of the Options

### Subject-specific catalog

One kind per subject and shape.

* Good, because each leaf is fully specific.
* Bad, because the catalog grows with every metric and prevents reuse.
* Bad, because adding an analytic requires new widget code.

### Subject-agnostic kinds with per-kind widget data and backend-supplied widget data

Rendering primitives plus backend-supplied widget data.

* Good, because the catalog is bounded by rendering shapes.
* Good, because analytics are added as backend-supplied data, selected by consumer-defined `params`.
* Neutral, because authors learn two layers.
* Bad, because `params` stays open in the template, so its checking depends on consumer-derived types.

### Single generic widget with a render discriminator

One type; the MFE chooses a rendering at runtime.

* Good, because the catalog is a single type.
* Bad, because the type system no longer says what a placement consumes.
* Bad, because one MFE carries every rendering branch, inflating its bundle.

## More Information

**Review trigger.** Revisit if a needed analytic cannot be expressed with the 9 rendering shapes and their widget data types, so that a new kind or a subject-specific kind would be required.

**Scope.** This record decides what the widget catalog contains and where a widget's subject comes from. It does not decide how kinds map to MFE entries (ADR-0008), or how the backend produces the data ([ADR-0011](0011-backend-delivered-dashboard-v1.md)).

**Checklist applicability.** ARCH applicable and addressed above. PERF applicable only through the bundle size effect of one MFE per kind. SEC not applicable because no security mechanism is decided. REL not applicable because no failure-handling mechanism is decided. DATA applicable at contract level: widget data shapes are GTS types, each kind names its shape through the `data_type` trait, and `params` is open in the template and closed by consumer-derived types. INT applicable: consumers add analytics as backend-supplied data against the published widget data types and may derive widget types for their `params`. OPS not applicable because no operational procedure is governed. MAINT applicable: the catalog stays bounded by rendering shapes. TEST applicable: schema validation covers the kind-to-data pairing, and kind-level tests cover the rendering of each kind. COMPL not applicable because no regulatory obligation is involved. UX applicable in one respect: the set of rendering shapes bounds what a dashboard can show. BIZ not applicable because no business rule is decided.

**Related decisions.** ADR-0008 defines how kinds relate to MFE entries; [ADR-0011](0011-backend-delivered-dashboard-v1.md) defines the backend-delivered dashboard definition and the per-widget data request.

## Traceability

- **PRD**: [PRD.md](../PRD.md)
- **DESIGN**: [DESIGN.md](../DESIGN.md)

This decision directly addresses the following requirements or design elements:

* `cpt-frontx-dashboard-fr-widget-catalog` — defines the 9 rendering-primitive kinds, including the grid kind.
* `cpt-frontx-dashboard-fr-domain-model` — each kind names its widget data type through the `data_type` trait, and consumers may derive widget types that close `params`.
* `cpt-frontx-dashboard-fr-backend-source` — the backend supplies the dashboard definition and each widget's data.
* `cpt-frontx-dashboard-usecase-explore-dashboard` — the dashboard is composed of these widget instances.
