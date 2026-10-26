---
status: accepted
date: 2026-10-24
decision-makers: template-dashboard architecture maintainers
description: Decision record on where a dashboard and its data come from - the consuming product backend returns each dashboard definition with its layout and widgets embedded, and each widget requests its own data through the FrontX API package.
---

# ADR-0011: Backend-delivered dashboard definition with per-widget data fetch

**ID**: `cpt-frontx-dashboard-adr-backend-delivered-dashboard`

<!-- toc -->

- [Context and Problem Statement](#context-and-problem-statement)
- [Decision Drivers](#decision-drivers)
- [Considered Options](#considered-options)
- [Decision Outcome](#decision-outcome)
  - [Consequences](#consequences)
  - [Confirmation](#confirmation)
- [Pros and Cons of the Options](#pros-and-cons-of-the-options)
  - [Dashboard definition from the backend, per-widget data fetch](#dashboard-definition-from-the-backend-per-widget-data-fetch)
  - [Per-widget data reference to stored queries or pre-computed data](#per-widget-data-reference-to-stored-queries-or-pre-computed-data)
  - [One dashboard payload with all widget data](#one-dashboard-payload-with-all-widget-data)
  - [Client-side query layer in a Web Worker](#client-side-query-layer-in-a-web-worker)
- [More Information](#more-information)
- [Traceability](#traceability)

<!-- /toc -->

## Context and Problem Statement

A dashboard shows widgets in layout cells, and each widget needs data in the shape of its kind's widget data type. Something has to produce that data and deliver it to the widgets. It could be computed in the browser, from entity data with per-widget queries, filters and derived fields, or by the consuming product backend.

The template scope is render-only. The consuming product backend is the only source of what a dashboard shows. Once a dashboard renders, nothing changes it: there are no filters, no time-window reloads and no navigation between items. Each widget has one button that opens it in a larger view; what that view shows is the widget's own detail. A consuming product may generate dashboards, for example when a user types a request in a chat and a model on the consuming product backend produces the layout and widgets; generating a dashboard never produces its data.

What does the backend store and return for a dashboard, who requests each widget's data and with what, and what is requested after render?

## Decision Drivers

* The backend is the only data source; the viewer shows widget data as delivered and computes, aggregates or narrows nothing (`cpt-frontx-dashboard-fr-backend-source`).
* Contracts stay GTS-typed: the dashboard with its embedded layout and widgets, and each widget's data, are validated against types of the template's domain model (`cpt-frontx-dashboard-fr-domain-model`).
* A slow or failing widget must not hold back or break the rest of the dashboard; loading, error and retry are shown per widget (`cpt-frontx-dashboard-fr-loading-error-states`).
* Widgets are isolated MFE instances (FrontX ADR-0011); a widget requests its data through the FrontX API package.
* The dashboard is static after render; a widget opened in its larger view may need data for that view (`cpt-frontx-dashboard-fr-widget-modal`).
* A consuming product adds a dashboard or new data by changing its backend, without changing the viewer or the widget library (`cpt-frontx-dashboard-fr-backend-source`).
* A generated dashboard must be complete as a definition alone: the backend should not have to store queries or compute data when the dashboard is created.
* The theme is part of the template and lives on the frontend; the backend does not supply it (ADR-0006).

## Considered Options

* **Dashboard definition from the backend, per-widget data fetch** — the backend stores and returns only the dashboard definition, with its layout and widgets embedded; each widget requests its own data once when it mounts, naming its kind and its `params`.
* **Per-widget data reference to stored queries or pre-computed data** — each widget carries a `data_ref` that points to a query or to data the backend stored when the dashboard was created; the widget requests its data by that reference.
* **One dashboard payload with all widget data** — the backend returns the dashboard, its layout, its widgets and every widget's data in one payload; the Viewer host fetches it once and sends each widget its data.
* **Client-side query layer in a Web Worker** — the viewer fetches entity data from registered sources, indexes it in a Worker and runs per-widget queries with filters in the browser.

## Decision Outcome

Chosen option: "Dashboard definition from the backend, per-widget data fetch", because it keeps the backend the only source of what each widget shows, lets a generated dashboard be complete as a definition alone, and lets every widget load, fail and retry on its own.

**Dashboard definition.** The consuming product backend stores and returns only the dashboard definition: one instance of the Dashboard root type `gts.frontx.m.dashboard.dashboard.v1~`, whose `id` carries the dashboard type chain followed by a UUID, with its `name`, `description` and an embedded `layout` object, whose `columns` and `cells` each embed one widget instance. Each embedded widget's `id` names, in its type chain, a template kind or a consumer widget type derived from one. The layout is part of the dashboard, not a separate instance. The backend stores no queries and no pre-computed data for a dashboard, and the definition carries no widget data and no theme. The definition may be written by hand or generated by the consuming product backend; generation is the consuming product's job, and the template ships the GTS types that let a generated definition be validated ([ADR-0003](0003-shared-data-types-and-schemas-v1.md)). The Viewer host requests the definition by the dashboard identifier that the screen address names, once per open dashboard and again only on Retry after a failure, from an endpoint location given by the configuration of the consuming product. It validates the dashboard and each embedded widget against the type its `id` names, checks the layout (ADR-0002), registers the widget extensions (ADR-0007), mounts the cells and sends each widget its configuration.

**Per-widget data.** The template ships the MFEs for all 9 widget kinds ([ADR-0008](0008-widget-kind-and-mfe-realization-v1.md)), and each of them knows how to get its data. A widget's MFE instance requests its data through the FrontX API package from the consuming product backend, naming its widget kind, taken from the type chain of its `id`, and its `params` ([ADR-0009](0009-subject-agnostic-widget-catalog-v1.md)). It requests once, when it mounts, and again only on Retry after a failure in that widget. The endpoint location comes from configuration, like the definition endpoint. The backend computes the data from its own sources on that request and returns one instance of the widget data type that the kind declares, which the widget renders as delivered. Loading skeleton, error and Retry are shown per widget, so one failing widget affects one cell.

**Larger view.** A widget can be opened in its larger view, in the modal (ADR-0007). What that view shows, and its data, are each widget's implementation detail. The widget may make its own data request for what the view needs, through the FrontX API package; the backend answers it like any widget data request.

**After render.** Nothing is requested after render except Retry after a failure and a widget's own request for what its larger view needs. There is no refresh while the dashboard is open, no filtering, no client-side query or aggregation, and no client-side sorting, grouping or pagination; the dashboard's layout and widget configuration fully define how widgets are composed and presented. A theme change re-themes the mounted widgets and requests nothing.

**Interface and specification.** DESIGN section 3.3 describes this interface at architecture level (`cpt-frontx-dashboard-interface-dashboard-payload`). [feature-backend-contract](../features/feature-backend-contract/FEATURE.md) (`cpt-frontx-dashboard-feature-backend-contract`) is its exact specification: the dashboard request and response, the widget data request and response, the errors and what the viewer shows, the consumer widget types, the open items, and the conformance cases.

### Consequences

* Good, because the viewer contains no Worker, query engine, filter state or entity-source registry.
* Good, because a slow or failing widget affects only its own cell, and Retry reloads only that widget.
* Good, because the contract with the consuming product is GTS-typed: one dashboard definition plus one widget data response per widget request, which the consuming product can produce from any backend and validate against the domain model types.
* Good, because a generated dashboard is complete once its definition is stored: the backend keeps no queries or pre-computed data per dashboard.
* Good, because the Viewer host holds no widget data, so it has no data-delivery action and holds no data for a widget's larger view.
* Bad, because a dashboard costs one definition request plus one data request per widget, and widgets finish loading at different times.
* Bad, because every widget carries data-request logic, and the backend must compute every aggregate the widgets show from `params` on each request.
* Bad, because the dashboard is static after render: fresher data needs the user to open the dashboard again, and interactive exploration needs a new decision.

### Confirmation

* An integration test opens a dashboard and checks that the Viewer host issues exactly one definition request naming the dashboard identifier, that each mounted widget issues exactly one data request through the FrontX API package, and that no request follows render or a theme change other than Retry after a failure and a widget's own larger-view request.
* A test makes one widget's data request fail and checks that only that cell shows the error with Retry, that the other cells render, and that Retry issues one new request for that widget only.
* A test checks that a failed definition request shows the dashboard error with Retry.
* A test checks that each widget's data request names its widget kind and its `params`.
* A test feeds a definition or a widget data response that violates the domain model types and checks that a diagnostic is reported instead of rendering it.
* A test opens a widget in its larger view and checks that any data request the widget makes for that view names its kind and `params` and is answered as a widget data request.
* Review confirms that the definition embeds its layout and widgets and carries no widget data, no data reference, no stored query and no theme.
* A build check confirms that the viewer package has no Worker entry and no query or filter code.
* The conformance cases of feature-backend-contract (section 7) pass.

## Pros and Cons of the Options

### Dashboard definition from the backend, per-widget data fetch

The definition comes from the backend once; every widget requests its own data once at mount, naming its kind and `params`.

* Good, because loading, failure and retry are per widget.
* Good, because the backend stores only definitions, so a generated dashboard needs nothing else.
* Good, because the definition stays small and independent of data volume.
* Bad, because a dashboard costs one request per widget plus the definition.

### Per-widget data reference to stored queries or pre-computed data

Each widget instance carries a `data_ref`; the backend resolves it to a query or to data it stored when the dashboard was created.

* Good, because the widget request is a plain lookup and the backend does not interpret widget settings.
* Bad, because the backend must store a query or pre-computed data for every widget of every dashboard, including generated ones.
* Bad, because the reference says nothing about what a widget shows, so a definition cannot be validated or understood without the stored artifacts.

### One dashboard payload with all widget data

One GTS-typed payload per dashboard, fetched once by the Viewer host and delivered to each widget.

* Good, because first render costs one request.
* Good, because the Viewer host would hold all widget data in one place.
* Bad, because one failure or one slow widget computation blocks the whole dashboard.
* Bad, because a large payload delays every widget, and payload size grows with all widgets' data.
* Bad, because the Viewer host must hold every widget's data and deliver it through an extra host action.

### Client-side query layer in a Web Worker

Entity data from registered sources, indexed in a Worker and queried per widget in the browser.

* Good, because filters and time windows could re-query without a backend round trip.
* Bad, because it adds a Worker, a query language, an in-memory index and filter state to every viewer instance.
* Bad, because the browser's memory and indexing time limit the data a dashboard can show.
* Bad, because the render-only scope has no filter or reload that would use it.

## More Information

* **Open items.** The path and request form of the dashboard request and of a widget's data request, the validation of embedded widgets under GTS 0.17, how consumer widget types reach the browser, and how a consuming product checks that presentation keys are producible from `params` are the open items of feature-backend-contract (section 6.5).
* **Review trigger.** Revisit if a dashboard needs interaction that changes data after render, such as filters or time windows, or if the number of per-widget requests makes first render miss `cpt-frontx-dashboard-nfr-initial-render`.
* **Scope.** This record decides what the backend stores and returns for a dashboard, that the layout is embedded in it, that each widget requests its own data through the FrontX API package with its kind and `params`, that a widget may make its own request for what its larger view needs, and that nothing else is requested after render. It does not decide how a consuming product generates definitions, the meaning of `params` (ADR-0009), the type conventions (ADR-0003), the exact request form (feature-backend-contract), what a widget's larger view shows, the extension domains and the modal container (ADR-0007), the theme (ADR-0006) or the packages (ADR-0010). Access to dashboards and data is out of scope.
* **Checklist applicability.** ARCH applicable: data source and responsibility split between Viewer host and widgets. PERF applicable: one definition request plus one parallel request per widget. REL applicable: per-widget failure with Retry, and one failure path for the definition. DATA applicable: GTS-typed definition and widget data validated against the domain model; no stored queries or pre-computed data. INT applicable: the definition and widget data contracts with the consuming product backend. MAINT applicable: no query layer to maintain; data requests go through the FrontX API package. TEST applicable: Confirmation tests. UX applicable: per-widget skeletons, errors and Retry; static dashboard. SEC, OPS, COMPL and BIZ not applicable because access is out of scope and no operational procedure, regulated processing or business rule is decided.

## Traceability

- **PRD**: [PRD.md](../PRD.md)
- **DESIGN**: [DESIGN.md](../DESIGN.md)

This decision directly addresses the following requirements or design elements:

* `cpt-frontx-dashboard-fr-backend-source` — the backend is the only source: it stores and returns each dashboard's definition and computes each widget's data on request; the viewer shows them as delivered.
* `cpt-frontx-dashboard-fr-viewer-host` — the Viewer host requests the dashboard definition by its identifier and renders it.
* `cpt-frontx-dashboard-fr-loading-error-states` — skeletons, errors and Retry per widget, and for the definition.
* `cpt-frontx-dashboard-fr-widget-modal` — a widget opened in its larger view may make its own data request for what that view needs; what the view shows is the widget's own detail.
* `cpt-frontx-dashboard-fr-domain-model` — the definition and every widget's data are instances of domain model types, so generated definitions can be validated.
* `cpt-frontx-dashboard-nfr-initial-render` — first render is one definition request plus parallel per-widget data requests.
* `cpt-frontx-dashboard-actor-consuming-backend` — the consuming product backend that returns definitions and widget data.
* `cpt-frontx-dashboard-component-viewer-host` — requests the definition, validates it and mounts the widgets.
* `cpt-frontx-dashboard-component-backend-client` — the data request logic inside each widget MFE: kind and `params` to the consuming product backend, through the FrontX API package.
* `cpt-frontx-dashboard-interface-dashboard-payload` — the dashboard definition and the widget data request.
* `cpt-frontx-dashboard-feature-backend-contract` — the exact specification of the requests, responses and errors, with conformance cases.
* `cpt-frontx-dashboard-seq-initial-load` — definition load, then per-widget data loads.
* `cpt-frontx-dashboard-seq-widget-modal-open` — a widget opened in its larger view may request what that view needs through the FrontX API package.
* `cpt-frontx-dashboard-seq-failure-handling` — per-widget and definition failure paths.
* `cpt-frontx-dashboard-principle-per-instance-isolation` — widget instances stay isolated, and each requests its data through the FrontX API package.
* `cpt-frontx-dashboard-principle-gts-contracts` — definition and widget data stay GTS-typed.
