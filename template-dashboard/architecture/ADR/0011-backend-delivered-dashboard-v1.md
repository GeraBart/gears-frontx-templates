---
status: accepted
date: 2026-10-24
decision-makers: template-dashboard architecture maintainers
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

A dashboard shows widgets in layout cells, and each widget needs data in the shape of its kind's widget data type. Something has to produce that data and deliver it to the widgets. The DevExpert prototype and the first port of this template computed it in the browser: entity data came from registered sources, a Web Worker indexed it, and per-widget queries with filters, operators and derived fields produced each widget's data, again on every filter change.

The template scope is render-only. The consuming project's backend is the only source of what a dashboard shows. Once a widget renders, nothing changes: there are no filters, no time-window reloads and no navigation between items. Each widget has one button that opens the same widget in a modal. A consuming product may generate dashboards, for example when a user types a request in a chat and a model on the consuming backend produces the layout and widgets; it never produces the data.

What does the backend store and return for a dashboard, who requests each widget's data and with what, and what happens after render?

## Decision Drivers

* The backend is the only data source; the viewer shows widget data as delivered and computes, aggregates or narrows nothing (`cpt-frontx-dashboard-fr-backend-source`).
* Contracts stay GTS-typed: the dashboard with its embedded layout and widgets, and each widget's data, are validated against types from the dashboard type catalog (`cpt-frontx-dashboard-fr-domain-model`).
* A slow or failing widget must not hold back or break the rest of the dashboard; loading, error and retry are shown per widget (`cpt-frontx-dashboard-fr-loading-error-states`).
* Widgets are isolated MFE instances (FrontX ADR-0011); data requests go through the FrontX API package, whose API cache is shared across MFE entries.
* Nothing changes after render (`cpt-frontx-dashboard-fr-widget-modal`).
* A consumer adds a dashboard or new data by changing the backend, without changing the viewer or the widget library (`cpt-frontx-dashboard-fr-backend-source`).
* A generated dashboard must be complete as a definition alone: the backend should not have to store queries or compute data when the dashboard is created.
* The theme is part of the template and lives on the frontend; the backend does not supply it (ADR-0006).

## Considered Options

* **Dashboard definition from the backend, per-widget data fetch** — the backend stores and returns only the dashboard definition, with its layout and widgets embedded; each widget requests its own data once when it mounts, with its kind and `params`.
* **Per-widget data reference to stored queries or pre-computed data** — each widget carries a `data_ref` that points to a query or to data the backend stored when the dashboard was created; the widget requests its data by that reference.
* **One dashboard payload with all widget data** — the backend returns the dashboard, its layout, its widgets and every widget's data in one payload; the Viewer host fetches it once and sends each widget its data.
* **Client-side query layer in a Web Worker** — the viewer fetches entity data from registered sources, indexes it in a Worker and runs per-widget queries with filters in the browser.

## Decision Outcome

Chosen option: "Dashboard definition from the backend, per-widget data fetch", because it keeps the backend the only source of what each widget shows, lets a generated dashboard be complete as a definition alone, and lets every widget load, fail and retry on its own, while the FrontX API package's shared API cache keeps repeated requests for the same data, such as the modal's, off the backend.

**Dashboard definition.** The consuming backend stores and returns only the dashboard definition: a GTS instance of the dashboard type with its `id`, `name`, `description` and an embedded `layout` object, whose `columns` and `cells` each embed one widget instance. The layout is part of the dashboard, not a separate instance. The backend stores no queries and no pre-computed data for a dashboard, and the definition carries no widget data and no theme. The definition may be authored by hand or generated by the consuming backend; generation is the consumer's job, and the template ships the GTS types that let a generated definition be validated ([ADR-0003](0003-shared-data-types-and-schemas-v1.md)). The Viewer host requests the definition once for the routed dashboard with the host application's existing sign-in, from an endpoint location given by configuration, registers its instances, checks the layout (ADR-0002), registers the widget extensions (ADR-0007), mounts the cells and sends each widget its configuration. The DESIGN describes the definition as `cpt-frontx-dashboard-interface-dashboard-payload`.

**Per-widget data.** The template ships the MFEs for all 9 widget kinds ([ADR-0008](0008-widget-kind-and-mfe-realization-v1.md)), and each of them knows how to get its data. A widget's MFE instance sends its widget kind type identifier and its `params` ([ADR-0009](0009-subject-agnostic-widget-catalog-v1.md)) to the consuming backend's widget data request once, when it mounts, with the host application's existing sign-in. The endpoint location comes from configuration, like the definition endpoint. The backend computes the data from its own sources on that request and returns one instance of the kind's widget data type, which the widget renders as delivered. Loading skeleton, error and Retry are shown per widget, so one failing widget affects one cell. The exact path and request form are an open item in the DESIGN (§4).

**Cache.** Widget data requests go through the FrontX API package, whose API cache is shared across MFE entries. The cache key is the widget kind type identifier plus the canonical form of `params`, so identical widgets share one request and the modal instance hits the same entry. Each request turns off staleness and refetching, because the shell's defaults would refetch after 30 seconds and on window focus. The exact request options, and whether opening a dashboard again refetches its data, are open items in the DESIGN (§4).

**After render.** Nothing is fetched again. There is no refetch and no background refresh of cached data, no filtering, no client-side query or aggregation, and no client-side sorting, grouping or pagination; the backend-supplied layout and widget configuration fully define how widgets are composed and presented. A theme change re-themes the mounted widgets without touching data.

**Modal.** The modal button of a widget opens a new instance of the same widget with the same configuration (ADR-0007). That instance requests its data with the same kind and `params` through the FrontX API package, so it hits the same cache entry: the modal shows the same data as the cell, normally without a new backend request.

**Demo.** The demo package ships static JSON for the sample dashboard's definition and its widgets' data, which the dev server serves, so the demo follows the same path as a consumer's backend (ADR-0010).

### Consequences

* Good, because the viewer contains no Worker, query engine, filter state or entity-source registry.
* Good, because a slow or failing widget affects only its own cell, and Retry reloads only that widget.
* Good, because the contract with the consumer is GTS-typed: one dashboard definition plus one widget data response per widget, which the consumer can produce from any backend and validate against the catalog types.
* Good, because a generated dashboard is complete once its definition is stored: the backend keeps no queries or pre-computed data per dashboard.
* Good, because the shared API cache serves identical data requests, so identical widgets cost one request and the modal shows the cell's data without a new backend request and without a cross-instance channel.
* Good, because the Viewer host holds no widget data, so it has no data-delivery action and no data held for the modal.
* Bad, because a dashboard costs one definition request plus one data request per widget, and widgets finish loading at different times.
* Bad, because the modal relies on the shared API cache still holding the cell's response; when the entry is no longer valid, the modal requests the data again and may show newer data. Cache validity is an open item in the DESIGN (§4).
* Bad, because every widget carries data-request logic, and the backend must compute every aggregate the widgets show from `params` on each request.
* Bad, because the dashboard is static after render: fresher data needs the user to open the dashboard again, and interactive exploration needs a new decision.

### Confirmation

* An integration test opens a dashboard and checks that the Viewer host issues exactly one definition request, that each mounted widget issues exactly one data request, and that no request follows render or a theme change.
* A test makes one widget's data request fail and checks that only that cell shows the error with Retry, that the other cells render, and that Retry issues one new request for that widget only.
* A test checks that a failed definition request shows the dashboard error with Retry.
* A test checks that each widget's data request carries its widget kind type identifier and its `params`, and that two widgets with the same kind and `params` issue one backend request.
* A test feeds a definition or a widget data response that violates the catalog types and checks that a diagnostic is reported instead of rendering it.
* A test opens a widget in the modal and checks that the modal instance receives the same configuration as its cell and requests its data with the same kind and `params`, served from the shared API cache without a new backend request while the cell's cache entry is valid.
* Review confirms that the definition embeds its layout and widgets and carries no widget data, no data reference, no stored query and no theme.
* A build check confirms that the viewer package has no Worker entry and no query or filter code.
* The demo dashboard renders from the static definition and widget data served by the dev server.

## Pros and Cons of the Options

### Dashboard definition from the backend, per-widget data fetch

The definition comes from the backend once; every widget fetches its own data once at mount, with its kind and `params`.

* Good, because loading, failure and retry are per widget.
* Good, because the backend stores only definitions, so a generated dashboard needs nothing else.
* Good, because identical requests, such as the modal's, are served from the shared API cache of the FrontX API package.
* Good, because the definition stays small and independent of data volume.
* Bad, because a dashboard costs one request per widget plus the definition.
* Bad, because the modal shows the cell's data only while the shared API cache entry is valid.

### Per-widget data reference to stored queries or pre-computed data

Each widget instance carries a `data_ref`; the backend resolves it to a query or to data it stored when the dashboard was created. This was the previous request form of this record.

* Good, because the widget request is a plain lookup and the backend does not interpret widget settings.
* Bad, because the backend must store a query or pre-computed data for every widget of every dashboard, including generated ones.
* Bad, because the reference says nothing about what a widget shows, so a definition cannot be validated or understood without the stored artifacts.
* Bad, because identical widgets in different dashboards hold different references and do not share a cache entry.

### One dashboard payload with all widget data

One GTS-typed payload per dashboard, fetched once by the Viewer host and delivered to each widget. This was an earlier choice of this record.

* Good, because first render costs one request.
* Good, because the modal could reuse data already held by the Viewer host.
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

* **Revision.** Revised on 2026-10-23: the backend no longer returns widget data or theme in the dashboard response; each widget fetches its own data. The previous choice, one payload with all widget data, is kept above as a rejected option. Revised again on 2026-10-24: the backend stores and returns only the definition, with the layout embedded in the dashboard; each widget MFE requests its data with its kind and `params` instead of a data reference, which is kept above as a rejected option; the cache key is the kind plus canonical `params`. The revised decision is accepted.
* **Replaced decisions.** This record replaces the earlier decisions titled "Viewer data query layer", "Derived analytics producer", "Query, operator and CEL", "Viewer-host-orchestrated query lifecycle" and "Live entity source". They were removed with the render-only scope cut and are not kept as records.
* **Open items.** The exact path and request form of a widget's data request, the per-request cache options and whether opening a dashboard again refetches, and how a consumer checks that presentation keys are producible from `params`, are open items in the DESIGN (§4).
* **Review trigger.** Revisit if a dashboard needs interaction that changes data after render, such as filters or time windows, if the number of per-widget requests makes first render miss `cpt-frontx-dashboard-nfr-initial-render`, or if the shared API cache stops serving the modal's request with the cell's data.
* **Scope.** This record decides what the backend stores and returns for a dashboard, that the layout is embedded in it, that each widget requests its own data once with its kind and `params`, how those requests share the API cache, and that nothing changes after render. It does not decide how a consumer generates definitions, the meaning of `params` (ADR-0009), the type conventions (ADR-0003), the exact endpoints, the extension domains and the modal container (ADR-0007), the theme (ADR-0006) or packaging (ADR-0010).
* **Checklist applicability.** ARCH applicable: data source and responsibility split between Viewer host and widgets. PERF applicable: one definition request plus one parallel request per widget. REL applicable: per-widget failure with Retry, and one failure path for the definition. DATA applicable: GTS-typed definition and widget data validated against the catalog; no stored queries or pre-computed data. INT applicable: the definition and widget data contracts with the consuming backend. SEC applicable in one respect: requests use the host application's existing sign-in only. MAINT applicable: no query layer to maintain; data requests go through the FrontX API package. TEST applicable: Confirmation tests. UX applicable: per-widget skeletons, errors and Retry; static dashboard. OPS, COMPL and BIZ not applicable because no operational procedure, regulated processing or business rule is decided.

## Traceability

- **PRD**: [PRD.md](../PRD.md)
- **DESIGN**: [DESIGN.md](../DESIGN.md)

This decision directly addresses the following requirements or design elements:

* `cpt-frontx-dashboard-fr-backend-source` — the backend is the only source: it stores and returns each dashboard's definition and computes each widget's data on request; the viewer shows them as delivered.
* `cpt-frontx-dashboard-fr-viewer-host` — the Viewer host requests the dashboard definition once and renders it.
* `cpt-frontx-dashboard-fr-loading-error-states` — skeletons, errors and Retry per widget, and for the definition.
* `cpt-frontx-dashboard-fr-widget-modal` — the modal opens a new instance of the same widget with the same configuration, which requests its data with the same kind and `params` and is served from the shared API cache.
* `cpt-frontx-dashboard-fr-demo-opt-in` — the demo's static definition and widget data follow the same path.
* `cpt-frontx-dashboard-fr-domain-model` — the definition and every widget's data are instances of catalog types, so generated definitions can be validated.
* `cpt-frontx-dashboard-nfr-initial-render` — first render is one definition request plus parallel per-widget data requests.
* `cpt-frontx-dashboard-actor-consuming-backend` — the backend that returns definitions and widget data.
* `cpt-frontx-dashboard-component-viewer-host` — fetches the definition, registers it and mounts the widgets.
* `cpt-frontx-dashboard-component-backend-client` — the data request logic inside each widget MFE: kind and `params` to the consuming backend, through the FrontX API package.
* `cpt-frontx-dashboard-interface-dashboard-payload` — the dashboard definition and the widget data request.
* `cpt-frontx-dashboard-seq-initial-load` — definition load, then per-widget data loads.
* `cpt-frontx-dashboard-seq-widget-modal-open` — the modal instance requests its data and is served from the shared API cache.
* `cpt-frontx-dashboard-seq-failure-handling` — per-widget and definition failure paths.
* `cpt-frontx-dashboard-principle-per-instance-isolation` — widget instances stay isolated; only the FrontX API package's cache is shared across MFE entries.
* `cpt-frontx-dashboard-principle-gts-contracts` — definition and widget data stay GTS-typed.
