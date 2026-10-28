---
status: accepted
date: 2026-10-27
decision-makers: template-dashboard architecture maintainers
description: Decision record on where a dashboard and its data come from - the consuming product backend returns one dashboard instance with its layout and widgets embedded, and each widget requests a backend metric through the FrontX API package and gets one generic tabular result.
---

# ADR-0011: Backend-delivered dashboard with per-widget metric requests

**ID**: `cpt-frontx-dashboard-adr-backend-delivered-dashboard`

<!-- toc -->

- [Context and Problem Statement](#context-and-problem-statement)
- [Decision Drivers](#decision-drivers)
- [Considered Options](#considered-options)
- [Decision Outcome](#decision-outcome)
  - [Consequences](#consequences)
  - [Confirmation](#confirmation)
- [Pros and Cons of the Options](#pros-and-cons-of-the-options)
  - [Dashboard from the backend, per-widget metric request with a generic result](#dashboard-from-the-backend-per-widget-metric-request-with-a-generic-result)
  - [Per-widget request by widget type and settings, with a data type per widget type](#per-widget-request-by-widget-type-and-settings-with-a-data-type-per-widget-type)
  - [Per-widget reference to stored queries or pre-computed data](#per-widget-reference-to-stored-queries-or-pre-computed-data)
  - [One dashboard payload with all widget data](#one-dashboard-payload-with-all-widget-data)
  - [Client-side query layer in a Web Worker](#client-side-query-layer-in-a-web-worker)
- [More Information](#more-information)
- [Traceability](#traceability)

<!-- /toc -->

## Context and Problem Statement

A dashboard shows widgets in layout cells, and each widget needs data to present. Something has to produce that data and deliver it to the widgets. It could be computed in the browser from entity data, with per-widget queries and filters, or by the consuming product backend from the metrics it already has.

The template scope is render-only. The consuming product backend is the only source of what a dashboard shows. Once the widgets show their data, nothing changes it: there are no filters, no time-window reloads and no navigation between items. Each widget has one button that opens it in a larger view, which shows the same data with more room. A consuming product may generate dashboards, for example when a user types a request in a chat and a language model on the consuming product backend produces the layout and the widgets; generating a dashboard never produces its data.

What does the backend return for a dashboard, who requests each widget's data and with what, what comes back, how are failures classified, and what is requested after the dashboard is shown?

## Decision Drivers

* The backend is the only data source; the Viewer host and the widgets show widget data as delivered and compute, aggregate or narrow nothing (`cpt-frontx-dashboard-fr-backend-source`).
* Contracts stay GTS-typed: the dashboard with its embedded layout and widgets, and every widget data result, are validated against types of the template's domain model (`cpt-frontx-dashboard-fr-domain-model`).
* The 9 template widget types are presentation types over one generic tabular result ([ADR-0009](0009-subject-agnostic-widget-catalog-v1.md)), so the data request should not depend on the widget type, and a consumer replacement realization of a widget type must be able to send the same request ([ADR-0008](0008-widget-type-and-mfe-realization-v1.md)).
* A slow or failing widget must not hold back or break the rest of the dashboard; loading, error and Retry are shown per widget, and every failure has one visible place (`cpt-frontx-dashboard-fr-loading-error-states`).
* Widgets are isolated MFE instances (FrontX ADR-0011); a widget requests its data through the FrontX API package under the host session and holds the result itself.
* The larger view shows the widget's data as the backend delivers it when the view opens, with no paging, sorting or filtering (`cpt-frontx-dashboard-fr-widget-modal`).
* A consuming product adds a dashboard or new data by changing its backend, without changing the Viewer host or the widget library (`cpt-frontx-dashboard-fr-backend-source`).
* A generated dashboard must be complete as a definition alone: the backend should not have to store queries or compute data when the dashboard is created.
* The theme is not part of the dashboard: the template uses the host theme id from the host's theme shared property ([ADR-0006](0006-theme-distribution-v1.md)).

## Considered Options

* **Dashboard from the backend, per-widget metric request with a generic result** — the backend returns one dashboard instance with its layout and widgets embedded; each widget requests a backend metric after it receives `set_widget_context` and gets one generic tabular result.
* **Per-widget request by widget type and settings, with a data type per widget type** — each widget sends its widget type and its widget settings; the backend returns data in a widget data type specific to that widget type.
* **Per-widget reference to stored queries or pre-computed data** — each widget carries a reference to a query or to data the backend stored when the dashboard was created; the widget requests its data by that reference.
* **One dashboard payload with all widget data** — the backend returns the dashboard, its layout, its widgets and every widget's data in one payload; the Viewer host fetches it once and passes each widget its data.
* **Client-side query layer in a Web Worker** — the Viewer host fetches entity data from registered sources, indexes it in a Worker and runs per-widget queries with filters in the browser.

## Decision Outcome

Chosen option: "Dashboard from the backend, per-widget metric request with a generic result", because it keeps the backend the only source of what each widget shows, lets a generated dashboard be complete as a definition that only names metrics, gives every widget type and every replacement realization one request and one result shape, and lets every widget load, fail and retry on its own.

**Dashboard request.** The Viewer host reads `dashboard_endpoint` and `data_endpoint` from the consuming product's configuration. It names one dashboard by its GTS instance identifier, the identifier that its route carries, and sends the dashboard request to the dashboard endpoint through the FrontX API package under the host session. The result is that one dashboard instance of the root type `gts.frontx.m.dashboard.dashboard.v1~`: its `id`, `name` and `description`, and the embedded `layout`, whose cells each embed one widget instance with its `id`, `title`, presentation configuration and `source`. The layout and the widgets are part of the dashboard, not separate instances. The dashboard carries no widget data and no theme, and the backend stores no queries and no pre-computed data for it. The consuming product writes or generates the dashboard; generation is its job, and the template ships the GTS types that a dashboard is validated against ([ADR-0003](0003-shared-data-types-and-schemas-v1.md)). The Viewer host sends the dashboard request once per open dashboard and again only on Retry after a failed request. It validates the dashboard through the FrontX gts-plugin, runs the layout checks ([ADR-0002](0002-dashboard-layout-grid-v1.md)) and the grid configuration checks, generates and registers one cell extension per widget from the winning widget realization ([ADR-0007](0007-extension-domain-taxonomy-v1.md), [ADR-0008](0008-widget-type-and-mfe-realization-v1.md)), mounts the cells and sends each widget `set_widget_context`.

**Widget data request.** Each widget's own extension sends its widget data request after it receives `set_widget_context`, through the FrontX API package under the host session, to the `data_endpoint` that `set_widget_context` carries. `data_endpoint` travels only in `set_widget_context`; it is not a shared property. The request names a backend metric from `source.metric`, and may add a time window from `source.range`, in the form the backend defines, and a bucketing flag from `source.bucket`. It carries no widget type, no tenant and no user field; the host session identifies the caller. The template passes these values through unchanged and gives them no meaning ([ADR-0009](0009-subject-agnostic-widget-catalog-v1.md)). The backend computes the metric from its own data and returns one generic tabular result, the same shape for every metric: the ordered column names, the rows as positional value arrays aligned to those columns, and the names of the columns that hold percentages. The widget validates the result against the single widget data type through the FrontX gts-plugin and checks that every column its configuration binds is among the column names. A result with no rows shows the widget type's empty state and is not a failure. A cell widget sends its request once, and again only on Retry after a failed request. Widgets request in parallel and independently, so one failing widget affects only its own cell.

**Larger view.** The larger-view button of a cell widget opens the static modal extension of its widget type in the host modal domain and sends it the same `set_widget_context`, with the same widget and `data_endpoint` (ADR-0007). The modal entry sends the same widget data request as the cell, with the same validation, column binding and failure classes; the FrontX API package may serve it from its cache. The larger view shows the data as delivered when it opens. It may present the data differently, with more room, but adds no other metric and no paging, sorting or filtering. A cell and its larger view may show different values when the backend data changed between their requests, because each widget's data is an independent snapshot.

**Failure classes.** Every failure has one visible place.

| Scope | Class | Causes | What the user sees |
|-------|-------|--------|--------------------|
| Dashboard | Failed dashboard request | Backend error, backend timeout, network failure, or no answer within the wait time | An error banner in place of the dashboard, with Retry |
| Dashboard | Dashboard that cannot be shown | Request rejected as invalid, dashboard not found, permission denied, or a result that does not parse or fails validation, the layout checks or the grid configuration checks | No cells and a diagnostic, with no Retry |
| Widget | Failed widget data request | Backend error, backend timeout, network failure, or no answer within the wait time | An error in that widget only, with Retry |
| Widget | Widget data that cannot be shown | Request rejected as invalid, metric not found, permission denied, or a result that does not parse, fails the widget data type or lacks a bound column | A cannot-show state with a diagnostic in that widget only, with no Retry |

Two failures inside the template are not failures of the backend interface but use the same cannot-show outcome. When the Viewer host cannot start, because the manifest fetch fails or a required registration is rejected, the dashboard area cannot be shown, with no Retry, and no dashboard request is sent. When a cell's widget extension fails to register, load or mount, or its widget type has no single winning realization, that cell cannot be shown, with no Retry; `mount_ext` is never retried. A Retry is classified like the first request: a further temporary failure keeps the error with Retry, and a permanent outcome gives the cannot-show state without Retry. An expired session is handled by the host's session flow.

**Wait time.** The Viewer host and every widget wait 35 seconds for an answer to each request; no answer within that time is a failed request. The wait time is a template setting, not a term of the backend contract.

**API cache and Retry.** The FrontX API package shares its API cache across runtimes, so identical requests, such as those of a cell and of its larger view, may be served from the cache. Conformance therefore counts requests made through the FrontX API package, not network calls. A Retry must reach the backend.

**Request ownership.** Every request belongs to the extension that sent it: the Viewer host owns the dashboard request, and each widget extension owns its widget data requests. When an extension unmounts, it aborts its in-flight requests through the FrontX API package when the package accepts an abort signal, and in any case ignores late responses. The Viewer host does not cancel requests on behalf of widgets.

**After render.** Nothing is requested after the widgets show their data, except Retry after a failed request and the larger view's own request. There is no refresh while the dashboard is open, no filtering, no client-side query or aggregation, and no client-side sorting, grouping or paging. A theme change requests nothing.

**Widget types and replacement realizations.** Every embedded widget is an instance of one of the 9 template widget types; there are no consumer widget types in v1. A consumer replacement realization changes how a widget type is shown, but it receives the same `set_widget_context` and sends the same widget data request ([ADR-0008](0008-widget-type-and-mfe-realization-v1.md)).

**Prerequisite outside the template.** The consuming product's backend must let every viewer who may see a dashboard get the widget data of its widgets. Without that, a viewer sees permission-denied widgets on a dashboard they may open; the template has no workaround.

**Interface and specification.** DESIGN section 3.3 states this interface at architecture level (`cpt-frontx-dashboard-interface-dashboard-payload`). [feature-backend-contract](../features/feature-backend-contract/FEATURE.md) (`cpt-frontx-dashboard-feature-backend-contract`) is its exact specification: the dashboard request and its result, the widget data request and its result, the failure classes with what the user sees, the wait time, the API cache and Retry rule, the viewer-access prerequisite, and the conformance cases.

### Consequences

* Good, because the Viewer host contains no Worker, query engine, filter state or entity-source registry, and holds no widget data.
* Good, because a slow or failing widget affects only its own cell, and Retry sends only that widget's request again.
* Good, because one request form and one result shape serve all 9 widget types and every replacement realization, so a consuming product backend implements one widget data interface, whatever widget types its dashboards use.
* Good, because a generated dashboard is complete once it is stored: it names metrics, and the backend keeps no queries or pre-computed data per dashboard.
* Good, because the contract with the consuming product is GTS-typed: one dashboard instance per dashboard request and one generic result per widget data request, which any backend can produce and validate against the domain model types.
* Good, because each failure has one defined outcome, with Retry only where the same request can succeed later.
* Bad, because a dashboard costs one dashboard request plus one widget data request per widget, and widgets finish loading at different times.
* Bad, because every widget carries data-request logic, and the backend must compute every metric that a widget names on each request.
* Bad, because the result has no column types and no groups: the backend must return exactly the columns and rows each widget shows, and a wrong or missing column is found only by the consuming product's authoring-time check or by the widget at run time.
* Bad, because the larger view repeats the cell's request; when the API cache does not serve it, the backend computes the metric again, and the two may show different values.
* Bad, because the dashboard is static after render: fresher data needs the user to open the dashboard again, and interactive exploration needs a new decision.

### Confirmation

* An integration test opens a dashboard and checks that the Viewer host sends exactly one dashboard request, naming the dashboard's GTS instance identifier, and that each mounted widget sends exactly one widget data request through the FrontX API package after it receives `set_widget_context`.
* A test checks that each widget data request names `source.metric`, adds the time window and the bucketing flag only when `source` has them, and carries no widget type.
* A test checks that no request follows render or a theme change other than Retry after a failed request and the larger view's own request. Requests are counted through the FrontX API package, not as network calls.
* A test makes one widget's request fail and checks that only that cell shows the error with Retry, that the other cells render, and that Retry sends one new request for that widget only, which reaches the backend.
* A test lets a request go unanswered for longer than the wait time and checks that it becomes a failed request with Retry.
* Tests cover each failure class: a failed dashboard request shows the banner with Retry; a dashboard that is not found, is denied, or fails validation, the layout checks or the grid configuration checks shows no cells and a diagnostic with no Retry; a metric that is not found, a denied request, and a result that fails the widget data type or lacks a bound column show a cannot-show state in that widget with no Retry.
* A test makes the Viewer host's startup fail and checks that the dashboard area cannot be shown and that no dashboard request is sent; another makes one cell's `mount_ext` fail and checks that only that cell cannot be shown and that the mount is not retried.
* A test feeds a result with no rows and checks that the widget shows its empty state, not a failure.
* A test opens a widget in its larger view and checks that the modal entry sends the same widget data request as the cell, and no request for another metric, page, sort order or filter.
* A test unmounts a widget with a request in flight and checks that the request is aborted when the FrontX API package accepts an abort signal, and that a late response is ignored in any case.
* Review confirms that the dashboard embeds its layout and widgets and carries no widget data, no data reference, no stored query and no theme, and that `data_endpoint` reaches widgets only in `set_widget_context`.
* A build check confirms that the `dashboard-viewer` package has no Worker entry and no query or filter code.
* The conformance cases of feature-backend-contract pass.

## Pros and Cons of the Options

### Dashboard from the backend, per-widget metric request with a generic result

The dashboard comes from the backend once; every widget requests the metric its `source` names, once after `set_widget_context`, and gets one generic tabular result.

* Good, because loading, failure and Retry are per widget.
* Good, because the backend stores only dashboards, so a generated dashboard needs nothing else.
* Good, because the request and the result do not depend on the widget type, so replacement realizations and new presentations need no backend change.
* Good, because the dashboard stays small and independent of data volume.
* Neutral, because the widget must check its column binding at run time, since a metric's columns are run-time data of the backend.
* Bad, because a dashboard costs one request per widget plus the dashboard request.

### Per-widget request by widget type and settings, with a data type per widget type

Each widget sends its widget type and a settings object whose meaning the backend defines; the backend returns an instance of the widget data type that the widget type declares.

* Good, because each widget type receives data already shaped for it.
* Bad, because the backend must know every widget type and produce a separate data shape for each, and a replacement realization or a new presentation needs a backend change.
* Bad, because a widget type has to name its data type, which ties the presentation types to the data types and multiplies the types to maintain.
* Bad, because the backend must interpret open widget settings, which the template can neither validate nor document.

### Per-widget reference to stored queries or pre-computed data

Each widget instance carries a data reference; the backend resolves it to a query or to data it stored when the dashboard was created.

* Good, because the widget request is a plain lookup and the backend does not interpret anything the widget sends.
* Bad, because the backend must store a query or pre-computed data for every widget of every dashboard, including generated ones.
* Bad, because the reference says nothing about what a widget shows, so a dashboard cannot be validated or understood without the stored artifacts.

### One dashboard payload with all widget data

One GTS-typed payload per dashboard, with every widget's data embedded, fetched once by the Viewer host and passed to each widget.

* Good, because first render costs one request.
* Bad, because one failure or one slow metric blocks the whole dashboard.
* Bad, because a large payload delays every widget, and payload size grows with all widgets' data.
* Bad, because the Viewer host must hold every widget's data and pass it on through an extra host action, and the larger view would depend on data held by the Viewer host.

### Client-side query layer in a Web Worker

Entity data from registered sources, indexed in a Worker and queried per widget in the browser.

* Good, because filters and time windows could re-query without a backend round trip.
* Bad, because it adds a Worker, a query language, an in-memory index and filter state to every Viewer host instance.
* Bad, because the browser's memory and indexing time limit the data a dashboard can show.
* Bad, because the render-only scope has no filter or reload that would use it.

## More Information

* **Review trigger.** Revisit if a dashboard needs interaction that changes data after render, such as filters or time windows; if the larger view needs paged or sorted rows or a separate detail metric; if consumer widget types are introduced; or if the number of widget data requests makes first render miss `cpt-frontx-dashboard-nfr-initial-render`.
* **Related open questions.** DESIGN section 4 tracks whether the FrontX API package accepts an abort signal, and that a Retry is never served a cached failure by the shared API cache. Neither changes this decision: without an abort signal, extensions only ignore late responses, and Retry must reach the backend in any case.
* **Scope.** This record decides what the backend returns for a dashboard, that the layout and the widgets are embedded in it, that each widget requests a backend metric through the FrontX API package after `set_widget_context` and gets one generic tabular result, the failure classes, the wait time as a template setting, the API cache and Retry rule, request ownership, that the larger view sends the same request, and that nothing else is requested after render. It does not decide how a consuming product generates dashboards, the presentation types and their column bindings (ADR-0009), the type conventions (ADR-0003), the exact request form (feature-backend-contract), the extension domain and the static modal extensions (ADR-0007), widget realizations (ADR-0008), the theme (ADR-0006) or the packages (ADR-0010). Authorization of dashboards and data belongs to the consuming product backend.
* **Checklist applicability.** ARCH applicable: data source and responsibility split between the Viewer host and the widgets. PERF applicable: one dashboard request plus one parallel request per widget, and the shared API cache. REL applicable: two dashboard and two widget failure classes, startup and mount failures, the wait time, and Retry only for failed requests. DATA applicable: GTS-typed dashboard and one generic widget data type; no stored queries or pre-computed data. INT applicable: the dashboard and widget data contracts with the consuming product backend, and the viewer-access prerequisite. MAINT applicable: no query layer to maintain; all requests go through the FrontX API package. TEST applicable: Confirmation tests and the conformance cases. UX applicable: per-widget skeletons, errors, cannot-show and empty states, and Retry; static dashboard. SEC applicable to the extent that every request runs under the host session and carries no tenant or user field; access decisions belong to the consuming product backend. OPS, COMPL and BIZ not applicable because no operational procedure, regulated processing or business rule is decided.

## Traceability

- **PRD**: [PRD.md](../PRD.md)
- **DESIGN**: [DESIGN.md](../DESIGN.md)

This decision directly addresses the following requirements or design elements:

* `cpt-frontx-dashboard-fr-backend-source` — the backend is the only source: it returns each dashboard and computes each widget's metric on request; the widgets show the results as delivered.
* `cpt-frontx-dashboard-fr-viewer-host` — the Viewer host requests one dashboard by its GTS instance identifier, validates it and mounts its widgets.
* `cpt-frontx-dashboard-fr-loading-error-states` — the dashboard and widget failure classes, the startup and mount failures, and per-widget skeletons, errors, cannot-show and empty states.
* `cpt-frontx-dashboard-fr-widget-modal` — the larger view sends the same widget data request and shows the data as delivered when it opens, with no paging, sorting or filtering.
* `cpt-frontx-dashboard-fr-domain-model` — the dashboard and every widget data result are instances of domain model types, so written and generated dashboards can be validated.
* `cpt-frontx-dashboard-fr-replacement-widget` — a replacement realization receives the same context and sends the same request as the template's widget.
* `cpt-frontx-dashboard-contract-consuming-backend` — the dashboard request, the widget data request and result, the failure classes and the viewer-access prerequisite that the consuming product backend implements.
* `cpt-frontx-dashboard-nfr-initial-render` — first render is one dashboard request plus parallel widget data requests.
* `cpt-frontx-dashboard-actor-consuming-backend` — the consuming product backend that returns dashboards and computes widget data.
* `cpt-frontx-dashboard-component-viewer-host` — reads the endpoint configuration, requests and validates the dashboard, mounts the widgets and passes `data_endpoint` in `set_widget_context`.
* `cpt-frontx-dashboard-component-widget-data-request` — the data-request logic inside each cell and modal entry: `source` to the widget data endpoint through the FrontX API package, validation, column binding and failure classes.
* `cpt-frontx-dashboard-component-widget-library` — cell and modal entries that request, validate and present their own data.
* `cpt-frontx-dashboard-interface-dashboard-payload` — the dashboard request and the widget data request with its generic result.
* `cpt-frontx-dashboard-interface-host-actions` — `set_widget_context` carries the widget and `data_endpoint` to the cell and to the larger view.
* `cpt-frontx-dashboard-feature-backend-contract` — the exact specification of the requests, results and failure classes, with conformance cases.
* `cpt-frontx-dashboard-seq-initial-load` — dashboard request, then per-widget data requests after `set_widget_context`.
* `cpt-frontx-dashboard-seq-widget-modal-open` — the larger view sends the same widget data request, possibly served from the API cache.
* `cpt-frontx-dashboard-seq-failure-handling` — the failure classes and their visible places.
* `cpt-frontx-dashboard-seq-teardown` — each extension aborts or ignores its own requests on unmount.
* `cpt-frontx-dashboard-seq-consumer-generation` — a generated dashboard names metrics and stores no data.
* `cpt-frontx-dashboard-principle-render-only-viewer` — nothing is requested after render except Retry and the larger view's request.
* `cpt-frontx-dashboard-principle-viewer-host-orchestration` — the Viewer host orchestrates; widgets request and present their own data.
* `cpt-frontx-dashboard-principle-per-instance-isolation` — widget instances stay isolated, and each requests and holds its own data.
* `cpt-frontx-dashboard-principle-gts-contracts` — the dashboard and the widget data result stay GTS-typed.
