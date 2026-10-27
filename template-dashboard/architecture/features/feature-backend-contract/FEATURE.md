---
status: accepted
version: 1
date: 2026-10-27
description: Exact specification and conformance cases of what the template requires from the consuming product's backend - the dashboard request and response, the widget data request and response, the errors with what the Viewer host shows, and the consumer widget types.
---

# Feature: Backend Contract


<!-- toc -->

- [1. Feature Context](#1-feature-context)
  - [1.1 Overview](#11-overview)
  - [1.2 Purpose](#12-purpose)
  - [1.3 Actors](#13-actors)
  - [1.4 References](#14-references)
- [2. Actor Flows (CDSL)](#2-actor-flows-cdsl)
  - [Open a Dashboard](#open-a-dashboard)
  - [Retry After a Failure](#retry-after-a-failure)
  - [Open a Widget in Its Larger View](#open-a-widget-in-its-larger-view)
  - [Use a Consumer Widget Type](#use-a-consumer-widget-type)
- [3. Processes / Business Logic (CDSL)](#3-processes--business-logic-cdsl)
  - [Check a Dashboard Response](#check-a-dashboard-response)
  - [Request a Widget's Data](#request-a-widgets-data)
  - [Classify a Request Failure](#classify-a-request-failure)
- [4. States (CDSL)](#4-states-cdsl)
  - [Dashboard View State Machine](#dashboard-view-state-machine)
  - [Widget View State Machine](#widget-view-state-machine)
- [5. Definitions of Done](#5-definitions-of-done)
  - [Dashboard Request and Response](#dashboard-request-and-response)
  - [Widget Data Request and Response](#widget-data-request-and-response)
  - [Errors and What the Viewer Host Shows](#errors-and-what-the-viewer-host-shows)
  - [Consumer Widget Types](#consumer-widget-types)
- [6. Backend Contract](#6-backend-contract)
  - [6.1 Dashboard Request and Response](#61-dashboard-request-and-response)
  - [6.2 Widget Data Request and Response](#62-widget-data-request-and-response)
  - [6.3 Errors and What the Viewer Host Shows](#63-errors-and-what-the-viewer-host-shows)
  - [6.4 Consumer Widget Types](#64-consumer-widget-types)
  - [6.5 Open Items](#65-open-items)
- [7. Conformance Cases](#7-conformance-cases)
  - [7.1 Point (a): Dashboard Request and Response](#71-point-a-dashboard-request-and-response)
  - [7.2 Point (b): Widget Data Request and Response](#72-point-b-widget-data-request-and-response)
  - [7.3 Point (c): Errors](#73-point-c-errors)
  - [7.4 Point (d): Consumer Widget Types](#74-point-d-consumer-widget-types)
- [8. Acceptance Criteria](#8-acceptance-criteria)

<!-- /toc -->

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-featstatus-backend-contract`
## 1. Feature Context

- [ ] `p2` - `cpt-frontx-dashboard-feature-backend-contract`

### 1.1 Overview

This feature specifies exactly what the template requires from the consuming product's backend, and how a consuming product checks that its backend conforms. It covers four points: (a) the dashboard request and its response, (b) the widget data request and its response, (c) the errors, with their meaning and what the Viewer host shows, and (d) the consumer widget types, with their definition and how they reach the browser. The contract itself lives in section 6, its open items in section 6.5, and the conformance cases in section 7. The types that the requests and responses carry are declared by `cpt-frontx-dashboard-feature-dashboard-root-types`, `cpt-frontx-dashboard-feature-widget-data-catalog` and `cpt-frontx-dashboard-feature-widget-catalog`; this feature uses them and declares no type of its own.

### 1.2 Purpose

The consuming product's backend is the only source of what a dashboard shows: it provides each dashboard, written or generated, and computes the data each widget shows (`cpt-frontx-dashboard-adr-backend-delivered-dashboard`). A consuming product can connect its backend to the template only if it knows exactly what to answer, what the Viewer host does with each answer, and how to check that its answers conform. DESIGN section 3.3 (`cpt-frontx-dashboard-interface-dashboard-payload`) describes this interface at architecture level; this feature is its exact specification.

**Requirements**: `cpt-frontx-dashboard-fr-backend-source`, `cpt-frontx-dashboard-fr-loading-error-states`, `cpt-frontx-dashboard-fr-domain-model`, `cpt-frontx-dashboard-fr-widget-modal`

**Principles**: `cpt-frontx-dashboard-principle-render-only-viewer`, `cpt-frontx-dashboard-principle-gts-contracts`

### 1.3 Actors

| Actor | Role in Feature |
|-------|-----------------|
| `cpt-frontx-dashboard-actor-dashboard-viewer` | Opens a dashboard, sees its loading and error states, selects Retry, and opens a widget in its larger view. |
| `cpt-frontx-dashboard-actor-consuming-backend` | The consuming product backend: answers the dashboard request with one dashboard and each widget data request with one widget data instance. |
| `cpt-frontx-dashboard-actor-template-consumer` | Defines the consuming product's own widget types and uses them in the dashboards its backend provides. |

### 1.4 References

- **PRD**: [PRD.md](../../PRD.md)
- **Design**: [DESIGN.md](../../DESIGN.md) section 3.3 (Dashboard Definition and Widget Data), section 3.6 (Initial Load and Viewing; Failure Handling)
- **ADRs**: [ADR-0011](../../ADR/0011-backend-delivered-dashboard-v1.md) (`cpt-frontx-dashboard-adr-backend-delivered-dashboard`), [ADR-0009](../../ADR/0009-subject-agnostic-widget-catalog-v1.md) (the meaning of `params` belongs to the consuming product)
- **Dependencies**: [feature-dashboard-root-types](../feature-dashboard-root-types/FEATURE.md) (the dashboard response is one instance of its Dashboard type), [feature-widget-data-catalog](../feature-widget-data-catalog/FEATURE.md) (the widget data response is one instance of the type its kind declares)
- **Related**: [feature-widget-catalog](../feature-widget-catalog/FEATURE.md) (the abstract widget base and the 9 kinds from which consumer widget types derive) and [feature-layout-types](../feature-layout-types/FEATURE.md) (the layout types whose checks section 6.1 states), both used by reference and reached transitively through feature-dashboard-root-types; [feature-mfe-entries](../feature-mfe-entries/FEATURE.md) (the widget MFE intended to render an instance of a consumer widget type; how the Viewer host resolves that type to the entry is open in its section 6.7)

## 2. Actor Flows (CDSL)

**Use cases**: `cpt-frontx-dashboard-usecase-explore-dashboard`

### Open a Dashboard

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-flow-backend-contract-open-dashboard`

**Actor**: `cpt-frontx-dashboard-actor-dashboard-viewer`

**Success Scenarios**:
- The dashboard request returns one valid dashboard; every cell mounts its widget, every widget requests its own data, and every widget renders the data it receives.

**Error Scenarios**:
- The dashboard request fails: skeletons, then an error banner with Retry in place of the dashboard.
- The dashboard cannot be shown: no cells and a diagnostic.
- One widget's data request fails, or its data cannot be shown: the error state appears in that widget only.

**Steps**:
1. [ ] - `p1` - Dashboard viewer opens the screen whose address names the dashboard identifier - `inst-open-screen`
2. [ ] - `p1` - Viewer host shows skeletons in place of the dashboard - `inst-show-dashboard-skeletons`
3. [ ] - `p1` - API: dashboard request to the consuming product backend, naming the dashboard identifier (request: identifier; response: one dashboard, section 6.1; path and form: open item 1) - `inst-request-dashboard`
4. [ ] - `p1` - Algorithm: classify the outcome of the request using `cpt-frontx-dashboard-algo-backend-contract-classify-failure` - `inst-classify-dashboard-outcome`
5. [ ] - `p1` - **IF** the dashboard request failed - `inst-if-dashboard-failed`
   1. [ ] - `p1` - Viewer host shows the dashboard error banner with Retry in place of the dashboard (section 6.3) - `inst-show-dashboard-banner`
   2. [ ] - `p1` - **RETURN** dashboard in the load-failed state; Retry follows `cpt-frontx-dashboard-flow-backend-contract-retry` - `inst-return-dashboard-failed`
6. [ ] - `p1` - Algorithm: check the dashboard response using `cpt-frontx-dashboard-algo-backend-contract-check-dashboard` - `inst-check-dashboard`
7. [ ] - `p1` - **IF** the dashboard cannot be shown - `inst-if-dashboard-cannot-show`
   1. [ ] - `p1` - Viewer host renders no cells and shows a diagnostic naming the failing instances, cells, or grid columns and groups - `inst-show-dashboard-diagnostic`
   2. [ ] - `p1` - **RETURN** dashboard in the cannot-show state - `inst-return-dashboard-cannot-show`
8. [ ] - `p1` - Viewer host replaces the skeletons with the cells and gives each widget its configuration from the dashboard - `inst-mount-cells`
9. [ ] - `p1` - **FOR EACH** widget in the dashboard, in parallel and independently - `inst-for-each-widget`
   1. [ ] - `p1` - Algorithm: request the widget's data using `cpt-frontx-dashboard-algo-backend-contract-request-widget-data` - `inst-request-widget-data`
   2. [ ] - `p1` - **IF** the widget data request failed, show the widget error with Retry in that widget only - `inst-show-widget-error`
   3. [ ] - `p1` - **IF** the widget data cannot be shown, show the cannot-show state in that widget only - `inst-show-widget-cannot-show`
   4. [ ] - `p1` - **ELSE** the widget renders the data it received, unchanged - `inst-render-widget`
10. [ ] - `p1` - **RETURN** dashboard rendered; nothing is requested after render except Retry after a failure and a widget's own request for what its larger view needs - `inst-return-dashboard-rendered`

### Retry After a Failure

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-flow-backend-contract-retry`

**Actor**: `cpt-frontx-dashboard-actor-dashboard-viewer`

**Success Scenarios**:
- Retry on the dashboard banner sends the dashboard request again; a successful answer removes the banner and the dashboard renders.
- Retry in a widget sends that widget's data request again; a successful answer renders the widget.

**Error Scenarios**:
- The repeated request fails again: the same error state with Retry stays in the same place.

**Steps**:
1. [ ] - `p1` - Dashboard viewer selects Retry on the dashboard error banner or in one widget's error - `inst-select-retry`
2. [ ] - `p1` - **IF** Retry was selected on the dashboard error banner - `inst-if-dashboard-retry`
   1. [ ] - `p1` - Viewer host shows skeletons in place of the dashboard - `inst-retry-dashboard-skeletons`
   2. [ ] - `p1` - API: Viewer host sends the dashboard request again, naming the same dashboard identifier - `inst-retry-dashboard-request`
   3. [ ] - `p1` - Algorithm: classify the outcome of the request using `cpt-frontx-dashboard-algo-backend-contract-classify-failure` - `inst-retry-classify-dashboard-outcome`
   4. [ ] - `p1` - **IF** the dashboard request failed, Viewer host shows the dashboard error banner with Retry again - `inst-retry-dashboard-banner-again`
   5. [ ] - `p1` - **ELSE** the banner is removed and the flow continues at step 6 of `cpt-frontx-dashboard-flow-backend-contract-open-dashboard`, which checks the dashboard response - `inst-retry-dashboard-continue`
3. [ ] - `p1` - **ELSE** Retry was selected in one widget - `inst-else-widget-retry`
   1. [ ] - `p1` - Algorithm: request that widget's data again using `cpt-frontx-dashboard-algo-backend-contract-request-widget-data`; the request is sent again through the FrontX API package - `inst-retry-widget-request`
   2. [ ] - `p1` - No other widget changes and no other request is made - `inst-retry-widget-only`
4. [ ] - `p1` - **RETURN** the dashboard or the widget in its new state - `inst-return-retry`

### Open a Widget in Its Larger View

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-flow-backend-contract-larger-view-data`

**Actor**: `cpt-frontx-dashboard-actor-dashboard-viewer`

**Success Scenarios**:
- The widget opens in its larger view; when that view needs data, the widget makes its own data request, and the backend answers it like any widget data request.

**Error Scenarios**:
- A failed larger-view data request is a widget data request failure of section 6.3; what the larger view then shows is that widget's own implementation detail.

**Steps**:
1. [ ] - `p1` - Dashboard viewer opens a widget in its larger view - `inst-open-larger-view`
2. [ ] - `p1` - **IF** the widget's larger view needs data - `inst-if-larger-view-needs-data`
   1. [ ] - `p1` - Algorithm: the widget makes its own data request using `cpt-frontx-dashboard-algo-backend-contract-request-widget-data` - `inst-larger-view-request`
   2. [ ] - `p1` - Consuming product backend answers it as a widget data request of section 6.2 - `inst-larger-view-answer`
3. [ ] - `p1` - **RETURN** the larger view as the widget implements it; what it shows, and its data, are the widget's implementation detail - `inst-return-larger-view`

### Use a Consumer Widget Type

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-flow-backend-contract-consumer-widget-type`

**Actor**: `cpt-frontx-dashboard-actor-template-consumer`

**Success Scenarios**:
- The template consumer defines a widget type derived from a template kind, the type is known to the Viewer host in the browser, and a dashboard that uses it is validated against it; the intended result is that the widget is rendered by the MFE of its kind (open item 3).

**Error Scenarios**:
- A widget instance does not validate against its consumer widget type: the dashboard cannot be shown.
- The consumer widget type is not known to the Viewer host in the browser: the dashboard cannot be validated and cannot be shown.

**Steps**:
1. [ ] - `p2` - Template consumer defines a widget type derived from one of the 9 template kinds, which closes or specifies the `params` schema (section 6.4) - `inst-define-consumer-type`
2. [ ] - `p2` - Consuming product backend provides a dashboard with a widget instance whose `id` names the consumer widget type in its type chain - `inst-provide-consumer-instance`
3. [ ] - `p2` - The consumer widget type reaches the Viewer host in the browser (mechanism: open item 3) - `inst-type-reaches-browser`
4. [ ] - `p2` - Algorithm: check the dashboard using `cpt-frontx-dashboard-algo-backend-contract-check-dashboard`; the widget validates against the consumer widget type - `inst-check-consumer-instance`
5. [ ] - `p2` - **IF** the dashboard cannot be shown, the Viewer host renders no cells and shows a diagnostic naming the widget - `inst-consumer-cannot-show`
6. [ ] - `p2` - **RETURN** the widget validated against its consumer widget type, with data of the widget data type of the kind its type derives from; the intended result is that the MFE of that kind renders it, and how the Viewer host resolves the type to that MFE is open (open item 3; feature-mfe-entries section 6.7) - `inst-return-consumer-widget`

## 3. Processes / Business Logic (CDSL)

### Check a Dashboard Response

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-algo-backend-contract-check-dashboard`

**Input**: The parsed body of a successful dashboard request.

**Output**: The dashboard, ready to render, or the cannot-show outcome with the failing instances, cells, or grid columns and groups.

**Steps**:
1. [ ] - `p1` - Validate the dashboard against `gts.frontx.m.dashboard.dashboard.v1~`, the type its `id` names (feature-dashboard-root-types section 6.1) - `inst-validate-dashboard`
2. [ ] - `p1` - **FOR EACH** widget instance embedded in a layout cell - `inst-for-each-embedded-widget`
   1. [ ] - `p1` - Validate the widget instance against the type its `id` names, a template kind or a consumer widget type, under GTS 0.17 (registration form: open item 2) - `inst-validate-embedded-widget`
3. [ ] - `p1` - **IF** the dashboard or any embedded widget fails validation **RETURN** cannot-show with the failing instances - `inst-return-invalid-instances`
4. [ ] - `p1` - Check the embedded layout with the layout checks of section 6.1 - `inst-check-layout`
5. [ ] - `p1` - **IF** the layout fails a check **RETURN** cannot-show with the failing cells - `inst-return-invalid-layout`
6. [ ] - `p1` - **FOR EACH** `grid` widget embedded in a layout cell, make the grid configuration checks of section 6.1: `columns` not empty and without a repeated key, and every `column_groups` group with non-empty `column_keys`, each entry matching a key in `columns`, no column named by two groups, and contiguous columns in `columns` order - `inst-check-grid-configuration`
7. [ ] - `p1` - **IF** a grid configuration check fails **RETURN** cannot-show naming the failing widget and the failing column or group - `inst-return-invalid-grid`
8. [ ] - `p1` - **RETURN** the dashboard - `inst-return-dashboard`

### Request a Widget's Data

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-algo-backend-contract-request-widget-data`

**Input**: One widget instance: its `id`, whose type chain names its kind, and its `params`.

**Output**: One widget data instance of the type its kind declares, or the load-failed or cannot-show outcome for that widget.

**Steps**:
1. [ ] - `p1` - Widget shows its own skeleton - `inst-show-widget-skeleton`
2. [ ] - `p1` - Take the widget kind from the type chain of the widget `id` and the `params` from the widget instance - `inst-take-kind-params`
3. [ ] - `p1` - API: widget data request through the FrontX API package to the consuming product backend, naming the widget kind and its `params` (response: one widget data instance, section 6.2; path and encoding: open item 1) - `inst-api-widget-request`
4. [ ] - `p1` - Algorithm: classify the outcome of the request using `cpt-frontx-dashboard-algo-backend-contract-classify-failure` - `inst-classify-widget-outcome`
5. [ ] - `p1` - **IF** the widget data request failed **RETURN** load-failed for this widget - `inst-return-widget-load-failed`
6. [ ] - `p1` - Validate the response against the widget data type that the kind's `data_type` trait names (feature-widget-data-catalog) - `inst-validate-widget-data`
7. [ ] - `p1` - **IF** the response does not validate **RETURN** cannot-show for this widget, rendering nothing of the response - `inst-return-widget-cannot-show`
8. [ ] - `p1` - **IF** the widget is a `grid` widget, check that every key its `columns` lists is declared in the Widget Data `columns` (feature-widget-catalog section 6.5) - `inst-check-column-keys`
9. [ ] - `p1` - **IF** a listed column key is missing from the Widget Data `columns` **RETURN** cannot-show for this widget, rendering nothing of the response - `inst-return-column-key-cannot-show`
10. [ ] - `p1` - **RETURN** the widget data, rendered unchanged - `inst-return-widget-data`

### Classify a Request Failure

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-algo-backend-contract-classify-failure`

**Input**: The outcome of one dashboard request or one widget data request.

**Output**: Success with a parsed body, or one request failure.

**Steps**:
1. [ ] - `p1` - **IF** the answer carries an error status **RETURN** request failure; every error status has the same meaning - `inst-error-status`
2. [ ] - `p1` - **IF** no answer arrives (network error) **RETURN** request failure - `inst-network-error`
3. [ ] - `p1` - **IF** no answer arrives within the time the Viewer host waits for a request **RETURN** request failure - `inst-request-timeout`
4. [ ] - `p1` - **IF** the body does not parse **RETURN** request failure - `inst-unparsable-body`
5. [ ] - `p1` - **RETURN** success with the parsed body - `inst-return-success`

## 4. States (CDSL)

### Dashboard View State Machine

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-state-backend-contract-dashboard-view`

**States**: Loading, Rendered, LoadFailed, CannotShow

**Initial State**: Loading

**Transitions**:
1. [ ] - `p1` - **FROM** Loading **TO** Rendered **WHEN** the dashboard request succeeds and the dashboard passes its checks - `inst-dashboard-loading-rendered`
2. [ ] - `p1` - **FROM** Loading **TO** LoadFailed **WHEN** the dashboard request fails - `inst-dashboard-loading-failed`
3. [ ] - `p1` - **FROM** Loading **TO** CannotShow **WHEN** the dashboard response fails validation, the layout checks, or the grid configuration checks of section 6.1 - `inst-dashboard-loading-cannot-show`
4. [ ] - `p1` - **FROM** LoadFailed **TO** Loading **WHEN** the dashboard viewer selects Retry on the error banner - `inst-dashboard-failed-retry`

### Widget View State Machine

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-state-backend-contract-widget-view`

**States**: Loading, Rendered, LoadFailed, CannotShow

**Initial State**: Loading

**Transitions**:
1. [ ] - `p1` - **FROM** Loading **TO** Rendered **WHEN** the widget data request succeeds and the response validates against the kind's widget data type - `inst-widget-loading-rendered`
2. [ ] - `p1` - **FROM** Loading **TO** LoadFailed **WHEN** the widget data request fails - `inst-widget-loading-failed`
3. [ ] - `p1` - **FROM** Loading **TO** CannotShow **WHEN** the response does not validate against the kind's widget data type or a column key of a `grid` widget is missing from the Widget Data `columns` - `inst-widget-loading-cannot-show`
4. [ ] - `p1` - **FROM** LoadFailed **TO** Loading **WHEN** the dashboard viewer selects Retry in that widget - `inst-widget-failed-retry`

Rendered and CannotShow are final for an open dashboard: nothing is requested after render except Retry after a failure and a widget's own request for what its larger view needs, and Retry is not offered for a response that would fail again. Each widget has its own instance of this state machine, so no widget's state changes another widget's state.

## 5. Definitions of Done

### Dashboard Request and Response

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-dod-backend-contract-dashboard-request`

The system **MUST** request one dashboard by its identifier, once per open dashboard and again only on Retry after a failure, and **MUST** accept as the response only one dashboard of the Dashboard root type, with its embedded layout and widget instances, carrying no widget data and no theme (section 6.1).

**Implements**:
- `cpt-frontx-dashboard-flow-backend-contract-open-dashboard`
- `cpt-frontx-dashboard-algo-backend-contract-check-dashboard`
- `cpt-frontx-dashboard-state-backend-contract-dashboard-view`

**Covers (PRD)**:
- `cpt-frontx-dashboard-fr-backend-source`
- `cpt-frontx-dashboard-fr-domain-model`
- `cpt-frontx-dashboard-contract-consuming-backend`

**Covers (DESIGN)**:
- `cpt-frontx-dashboard-interface-dashboard-payload`
- `cpt-frontx-dashboard-interface-domain-model`
- `cpt-frontx-dashboard-adr-backend-delivered-dashboard`
- `cpt-frontx-dashboard-component-viewer-host`
- `cpt-frontx-dashboard-seq-initial-load`

**Constraints**: `cpt-frontx-dashboard-constraint-gts-id-convention`

**Touches**:
- API: the dashboard request of `cpt-frontx-dashboard-interface-dashboard-payload` (path and form: open item 1)
- DB: none (the template persists nothing)
- Entities: Dashboard definition

### Widget Data Request and Response

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-dod-backend-contract-widget-data-request`

The system **MUST** let each widget request its own data through the FrontX API package, naming its kind and its `params`, once when it mounts and again only on Retry after a failure in that widget, and **MUST** render a response only when it is one instance of the widget data type its kind declares. A widget **MAY** make its own data request for what its larger view needs (section 6.2).

**Implements**:
- `cpt-frontx-dashboard-flow-backend-contract-open-dashboard`
- `cpt-frontx-dashboard-flow-backend-contract-larger-view-data`
- `cpt-frontx-dashboard-algo-backend-contract-request-widget-data`
- `cpt-frontx-dashboard-state-backend-contract-widget-view`

**Covers (PRD)**:
- `cpt-frontx-dashboard-fr-backend-source`
- `cpt-frontx-dashboard-fr-domain-model`
- `cpt-frontx-dashboard-contract-consuming-backend`
- `cpt-frontx-dashboard-fr-widget-modal`

**Covers (DESIGN)**:
- `cpt-frontx-dashboard-interface-dashboard-payload`
- `cpt-frontx-dashboard-interface-domain-model`
- `cpt-frontx-dashboard-adr-backend-delivered-dashboard`
- `cpt-frontx-dashboard-seq-initial-load`

**Touches**:
- API: the widget data request of `cpt-frontx-dashboard-interface-dashboard-payload` (path and encoding: open item 1)
- DB: none (the template persists nothing)
- Entities: Widget data

### Errors and What the Viewer Host Shows

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-dod-backend-contract-errors`

The system **MUST** treat every failure of a request as one request failure of that request, giving no error status a special meaning, and **MUST** show each failure class in its one place, as section 6.3 specifies: the dashboard error banner with Retry, the widget error with Retry in that widget only, and the cannot-show state, never misleading content.

**Implements**:
- `cpt-frontx-dashboard-flow-backend-contract-retry`
- `cpt-frontx-dashboard-algo-backend-contract-classify-failure`
- `cpt-frontx-dashboard-state-backend-contract-dashboard-view`
- `cpt-frontx-dashboard-state-backend-contract-widget-view`

**Covers (PRD)**:
- `cpt-frontx-dashboard-fr-loading-error-states`

**Covers (DESIGN)**:
- `cpt-frontx-dashboard-component-viewer-host`
- `cpt-frontx-dashboard-seq-failure-handling`

**Touches**:
- API: the dashboard request and the widget data request of `cpt-frontx-dashboard-interface-dashboard-payload`
- DB: none (the template persists nothing)
- Entities: Dashboard definition, Widget data

### Consumer Widget Types

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-dod-backend-contract-consumer-widget-types`

The system **MUST** validate each widget instance whose `id` names a consumer widget type against that type, **MUST** accept for it only data of the widget data type of the kind the type derives from, and **MUST NOT** show a dashboard that uses a consumer widget type the Viewer host cannot validate (section 6.4). The intended result is that the MFE of that kind renders the widget; how the Viewer host resolves the type to that MFE is open (open item 3; feature-mfe-entries section 6.7).

**Implements**:
- `cpt-frontx-dashboard-flow-backend-contract-consumer-widget-type`
- `cpt-frontx-dashboard-algo-backend-contract-check-dashboard`

**Covers (PRD)**:
- `cpt-frontx-dashboard-fr-domain-model`

**Covers (DESIGN)**:
- `cpt-frontx-dashboard-interface-domain-model`
- `cpt-frontx-dashboard-component-viewer-host`

**Constraints**: `cpt-frontx-dashboard-constraint-gts-id-convention`

**Touches**:
- API: none beyond the dashboard request (how the consumer widget types reach the browser: open item 3)
- DB: none (the template persists nothing)
- Entities: Consumer widget type, Dashboard definition

## 6. Backend Contract

The consuming product backend implements this contract; the template only consumes it. The contract is two requests: one dashboard request per open dashboard, and one widget data request per widget. Both carry JSON documents of GTS instances whose types are declared by the dependency features. Every instance identifier carries its type chain (GTS 0.17): a dashboard or widget identifier is the type chain followed by a UUID that the consuming product backend generates.

**Out of scope.** Access to dashboards and data; the distribution of the types to the backend; limits; versioning. The shapes of the dashboard root and of the widget data are declared by `cpt-frontx-dashboard-feature-dashboard-root-types` and `cpt-frontx-dashboard-feature-widget-data-catalog`. Viewer host orchestration (extension registration, theme, modal container) belongs to a later behavior feature; the Viewer host behavior that this contract makes visible, from the requests to the loading, error and cannot-show states and Retry, stays in scope. Observability and logging: not applicable because the diagnostics are developer-facing and there is no log or metric contract. Data protection and privacy: not applicable because the template stores nothing, and privacy follows the PRD exclusions (PRD section 6.2). Audit and data lifecycle: not applicable because nothing is persisted. Accessibility of the Retry control: not applicable to this contract because it is governed by the PRD requirement `cpt-frontx-dashboard-nfr-accessibility` and the host checks. Operations and rollout: not applicable because the template is a source package with no service of its own.

### 6.1 Dashboard Request and Response

**Request.** The Viewer host requests one dashboard by its identifier. The identifier comes from the screen address that names the dashboard, and it is the dashboard's combined anonymous instance identifier, for example `gts.frontx.m.dashboard.dashboard.v1~<uuid>`. The endpoint location comes from the configuration of the consuming product. The Viewer host sends the request once per open dashboard, and again only when the dashboard viewer selects Retry after a failed request. The path and the request form are open item 1.

**Response.** The response is that dashboard: one instance of the Dashboard root type `gts.frontx.m.dashboard.dashboard.v1~` (feature-dashboard-root-types section 6.1).

| Part | Content |
|------|---------|
| `id` | The dashboard's combined anonymous instance identifier: the dashboard type chain followed by a UUID generated by the consuming product backend. |
| `name` | The dashboard name. |
| `description` | Optional description of the dashboard. |
| `layout` | The embedded layout, with its `columns` and `cells`; each cell embeds one widget instance with its `id`, `title`, presentation configuration and `params`. Each widget `id` names, in its type chain, a template kind or a consumer widget type (section 6.4). |

The response carries no widget data and no theme. The template applies its own theme, and each widget requests its own data (section 6.2). The consuming product may write the dashboard or generate it; either way the dashboard validates against the types of the dependency features and any consumer widget types it uses.

**What the Viewer host does with it.** The Viewer host validates the dashboard and each embedded widget against the type its `id` names, then runs the layout checks on the embedded layout (DESIGN section 3.1, Layout and cell; `cpt-frontx-dashboard-constraint-sixty-column-grid`):

- each cell's `x`, `y`, `w` and `h` lie within their bounds: `x` from 0 to 59, `y` 0 or more, `w` from 1 to 60, `h` 1 or more;
- no two cells overlap;
- for each cell, `x + w` is not greater than 60.

The Viewer host also makes the grid configuration checks when it opens the dashboard, together with the layout checks (feature-widget-catalog section 6.5): a `grid` widget fails them when `columns` is empty or holds a key twice, or when `column_groups` holds a group with empty `column_keys`, a `column_keys` entry that matches no key in `columns`, a column named by two groups, or a group whose columns are not contiguous in `columns` order.

The layout diagnostic follows feature-layout-types section 6.3. It names each failing cell by its zero-based index in `cells`. Bounds failures and `x + w` failures are reported together, each naming its cell. The overlap check runs only when every cell passes both the bounds check and the `x + w` check, and an overlap names both cells of the pair. An empty `cells` array is valid: no cell is rendered and no diagnostic is shown.

The Viewer host repairs nothing. A dashboard that passes renders its cells, and each widget receives its configuration from the dashboard. A dashboard that fails validation, a layout check or a grid configuration check is a dashboard that cannot be shown (section 6.3).

### 6.2 Widget Data Request and Response

**Request.** Each widget requests its own data, through the FrontX API package, from the consuming product backend. The request names the widget's kind, taken from the type chain of its `id`, and its `params`. The endpoint location comes from the configuration of the consuming product. Each widget requests once, when it mounts, and again only when the dashboard viewer selects Retry after a failure in that widget; a widget may also make its own request for what its larger view needs (below). Widgets request in parallel and independently of each other. The path, and how the kind and `params` are encoded, are open item 1.

**`params`.** `params` is the widget's settings, an open object declared by the abstract widget base (feature-widget-catalog section 6.0). The template does not read it and gives it no meaning; its meaning belongs to the consuming product, which may close its schema with a consumer widget type (section 6.4). It may be empty.

**Response.** The response is one instance of the widget data type that the widget kind declares in its `data_type` trait, a type derived from `gts.frontx.v.widget_data.widget_data.v1~` (feature-widget-data-catalog). The backend computes it from its own data on that request. Widget data carries no `id`. The widget validates the response against its kind's widget data type and renders it unchanged: it does not compute, aggregate, narrow, re-order, group, page, hide, or truncate it.

**Larger view.** A widget may make its own data request for what its larger view needs. The contract only allows the request; the backend answers it as a widget data request of this section. What the larger view shows, and its data, are each widget's implementation detail.

**After render.** Nothing is requested after render except Retry after a failure and a widget's own request for what its larger view needs. There is no refresh while the dashboard is open, and a theme change requests nothing.

### 6.3 Errors and What the Viewer Host Shows

The contract gives no error status a special meaning: every error status is a failure of the request it answers. Every failure has one visible place.

| Failure class | Meaning | What the Viewer host shows | Retry |
|---------------|---------|----------------------|-------|
| Failed dashboard request | The dashboard request did not produce a usable answer: an error status, a network error, no answer within the time the Viewer host waits for a request, or a body that does not parse. All are one failure. | Skeletons in place of the dashboard while it loads, then an error banner with Retry in place of the dashboard. No cell is shown. | Retry sends the dashboard request again. A successful Retry removes the banner and renders the dashboard; a failed one shows the banner again. |
| Dashboard that cannot be shown | The dashboard response parses, but the dashboard or one of its embedded widgets does not validate against the type its `id` names, the layout fails a layout check of section 6.1, or a `grid` widget fails a grid configuration check of section 6.1. | No cells. The message "This dashboard can't be shown" appears in place of the dashboard, followed by a diagnostic naming the failing instances, cells, or widgets with the failing column or group. Nothing of the dashboard is shown. | Not offered, because the same response would fail again. |
| Failed widget data request | One widget's data request did not produce a usable answer: an error status, a network error, no answer within the time the Viewer host waits for a request, or a body that does not parse. All are one failure of that widget. | An error with Retry in that widget only. The other widgets are unaffected. | Retry sends that widget's data request again through the FrontX API package. A successful Retry renders the widget; a failed one shows the error with Retry in that widget again. |
| Widget data that cannot be shown | The response arrives but does not validate against the widget data type that the widget's kind declares, or a `grid` widget lists a column key that the Widget Data `columns` do not declare (feature-widget-catalog section 6.5). | An error state in that widget, with a diagnostic, rendering nothing of the response: never misleading content. The other widgets are unaffected. | Not offered, because the same response would fail again. |

The same wait applies to every request; its value is not a contract term and is open (DESIGN section 4, Request wait time).

A cell whose widget cannot be mounted is a failure of that cell, not of a request: when no widget entry, or more than one, realizes the kind of the cell's widget, or the FrontX registry rejects a registration for it, that cell shows its cannot-show state with a diagnostic and no Retry, and the other cells are unaffected (feature-extension-domain-catalog section 6.10).

The default English wording of the Viewer host, localized through the host language, is "Loading dashboard" for the dashboard skeletons, "Couldn't load dashboard" with "Retry" for the dashboard banner, "This dashboard can't be shown" for the dashboard cannot-show state, "Loading data" for a widget skeleton, "Couldn't load data" with "Retry" for a widget error, and "This content can't be shown" for the widget cannot-show state. Whether widgets receive the host language, and so how widget wording is localized, is open (DESIGN section 4, Host language in widgets).

### 6.4 Consumer Widget Types

**Definition.** A consumer widget type is a GTS type that the consuming product derives from the abstract widget base `gts.frontx.m.widget.widget.v1~` through one of the 9 template kinds (feature-widget-catalog), to close or specify the `params` schema with its own settings. Its type identifier extends the chain of the kind it derives from, for example `gts.frontx.m.widget.widget.v1~frontx.m.widget.grid.v1~acme.gh.widget.pr_list.v1~`. It keeps the kind's presentation and `data_type` trait, so its widget data response is of that kind's widget data type. The intended result is that an instance of it is rendered by the MFE of that kind; how the Viewer host resolves the type to that MFE is open (open item 3; feature-mfe-entries section 6.7).

**Use in a dashboard.** A widget instance of a consumer widget type is a combined anonymous instance whose `id` carries the full type chain, for example `gts.frontx.m.widget.widget.v1~frontx.m.widget.grid.v1~acme.gh.widget.pr_list.v1~<uuid>`. The dashboard that embeds it validates against the consumer widget type, and the widget requests its data like any widget (section 6.2).

**Reaching the browser.** The Viewer host validates each embedded widget against the type its `id` names, so a consumer widget type must be known to the Viewer host's type system in the browser before the Viewer host checks a dashboard that uses it. A dashboard whose widget names a type that the Viewer host does not know cannot be validated, and is a dashboard that cannot be shown (section 6.3). How consumer widget types reach the browser is open item 3.

### 6.5 Open Items

Each item records what is decided and what is open. None of them blocks the rest of the contract.

| # | Item | Decided | Open | Owner |
|---|------|---------|------|-------|
| 1 | Request form | The dashboard request names the dashboard identifier; the widget data request names the widget kind and its `params`; both endpoint locations come from the configuration of the consuming product. | The path of each request, and the request and response form, including how the kind and `params` are encoded in a widget data request and which identifier names the kind for an instance of a consumer widget type. | template architect |
| 2 | Validation of embedded widgets under GTS 0.17 `/$id` | The dashboard and each embedded widget carry an `id` with `x-gts-instance-ref: "/$id"`, and each validates against the type its `id` names. | Whether embedded widgets are registered as instances of their own or validated in place inside the dashboard instance. | template architect |
| 3 | Consumer widget types in the browser | A consuming product may derive widget types that close or specify `params`, and dashboards that use them validate against them. | How those types reach the Viewer host's type system in the browser, so that the Viewer host can validate dashboards that use them, and how the Viewer host resolves such a type to the MFE of the kind it derives from (feature-mfe-entries section 6.7). Intended result: an instance is rendered by the MFE of its kind; to be specified with the resolution. | template architect |
| 4 | Presentation keys and `params` | Presentation keys that a widget references, such as grid `columns[].key`, must be producible from its `params`; this is the responsibility of whoever writes or generates the dashboard. | Whether the template offers any means to check it, such as a trait or a schema convention on consumer widget types; the template defines none. | template architect |
| 5 | Consumer widget kinds | The backend interface accepts the 9 template kinds and widget types derived from them. | The ADRs allow consumer packages to add new widget kinds; how a dashboard names a new consumer kind and how its widget data type is defined. | template architect |

## 7. Conformance Cases

Each case is a testable scenario in the form Given / When / Then. A consuming product runs them against its backend and the template; a case passes when every Then statement holds.

### 7.1 Point (a): Dashboard Request and Response

- [ ] **BC-A1 One request by identifier.** Given a screen address that names dashboard `gts.frontx.m.dashboard.dashboard.v1~<uuid>`, when the dashboard viewer opens it, then the Viewer host sends exactly one dashboard request, naming that identifier, and sends no further dashboard request after render: nothing is requested after render except Retry after a failure and a widget's own request for what its larger view needs.
- [ ] **BC-A2 Valid dashboard renders.** Given a response that is one valid instance of `gts.frontx.m.dashboard.dashboard.v1~` with an embedded layout whose cells embed widget instances of template kinds, when the Viewer host receives it, then the skeletons are replaced by the cells and each widget receives its configuration from the dashboard.
- [ ] **BC-A3 No widget data and no theme.** Given any dashboard response of the backend, when it is checked against section 6.1, then it validates against the Dashboard root type, carries no widget data and no theme, and every instance `id` in it carries its type chain followed by a UUID.

### 7.2 Point (b): Widget Data Request and Response

- [ ] **BC-B1 One request per widget.** Given a rendered dashboard with N widgets, when the cells mount, then each widget sends exactly one widget data request through the FrontX API package, naming its kind and its `params`, the N requests run independently of each other, and after render no widget data request follows except Retry after a failure (BC-C6) and a widget's own request for what its larger view needs (BC-B3).
- [ ] **BC-B2 Response of the declared type.** Given a widget of kind `grid`, when the backend answers its widget data request, then the response validates against the widget data type that the `grid` kind declares in its `data_type` trait, carries no `id`, and the widget renders it unchanged.
- [ ] **BC-B3 Larger view request allowed.** Given a rendered widget, when the dashboard viewer opens the widget in its larger view, then any data request it makes names the widget's kind and `params`, the response validates against the widget data type of that kind, and a failure is a widget data request failure of section 6.3.
- [ ] **BC-B4 Theme change requests nothing.** Given a rendered dashboard, when the host theme changes, then no dashboard request and no widget data request is sent.

### 7.3 Point (c): Errors

- [ ] **BC-C1 Failed dashboard request.** Given a backend that answers the dashboard request with an error status, when the dashboard viewer opens the dashboard, then the Viewer host shows skeletons, then the dashboard error banner with Retry in place of the dashboard, and no cell.
- [ ] **BC-C2 Successful dashboard Retry.** Given the dashboard error banner and a backend that answers the next dashboard request with a valid dashboard, when the dashboard viewer selects Retry, then exactly one new dashboard request is sent, the banner is removed, and the dashboard renders.
- [ ] **BC-C3 Every request failure alike.** Given, in turn, two different error statuses, a network error, and a body that does not parse as the answer to the dashboard request, when the dashboard viewer opens the dashboard, then the Viewer host shows the same dashboard error banner with Retry in each case.
- [ ] **BC-C4 Dashboard that cannot be shown.** Given a dashboard response in which one embedded widget does not validate against the type its `id` names, or whose layout has two overlapping cells, which fails a layout check of section 6.1, when the Viewer host receives it, then the Viewer host renders no cells, shows the message "This dashboard can't be shown" followed by a diagnostic naming the failing instance or the overlapping cells, and offers no Retry.
- [ ] **BC-C5 Failed widget data request.** Given a dashboard with several widgets and a backend that answers one widget's data request with an error status, when the widgets request their data, then that widget shows an error with Retry, and every other widget renders its data.
- [ ] **BC-C6 Successful widget Retry.** Given a widget in its error state and a backend that answers the next request of that widget with valid widget data, when the dashboard viewer selects Retry in that widget, then exactly one new widget data request, for that widget only, is sent through the FrontX API package, and the widget renders the data.
- [ ] **BC-C7 Widget data that cannot be shown.** Given a widget data response that does not validate against the widget data type of the widget's kind, when the widget receives it, then the widget shows its cannot-show state with a diagnostic, renders nothing of the response, offers no Retry, and every other widget is unaffected.
- [ ] **BC-C8 Dashboard Retry that fails again.** Given the dashboard error banner and a backend that answers the next dashboard request with an error status, when the dashboard viewer selects Retry, then exactly one new dashboard request is sent, and once it fails the dashboard error banner with Retry stays in place of the dashboard, with no cell.
- [ ] **BC-C9 Widget data request with a network error.** Given a dashboard with several widgets and one widget whose data request ends in a network error, when the widgets request their data, then that widget shows an error with Retry, and every other widget renders its data.
- [ ] **BC-C10 Widget data request with an unparsable body.** Given a dashboard with several widgets and a backend that answers one widget's data request with a body that does not parse, when the widgets request their data, then that widget shows an error with Retry, and every other widget renders its data.
- [ ] **BC-C11 Widget Retry that fails again.** Given a widget in its error state and a backend that answers the next request of that widget with an error status, when the dashboard viewer selects Retry in that widget, then exactly one new widget data request, for that widget only, is sent through the FrontX API package, the error with Retry stays in that widget, and no other widget changes.
- [ ] **BC-C12 Widget data request with no answer in time.** Given a dashboard with several widgets and a backend that does not answer one widget's data request within the time the Viewer host waits for a request, when the widgets request their data, then that widget shows an error with Retry, as for any request failure, and every other widget renders its data.
- [ ] **BC-C13 Dashboard request with no answer in time.** Given a backend that does not answer the dashboard request within the time the Viewer host waits for a request, when the dashboard viewer opens the dashboard, then the Viewer host shows the dashboard error banner with Retry, as for any request failure.
- [ ] **BC-C14 Grid configuration that cannot be shown.** Given, in turn, a dashboard with a `grid` widget whose `columns` is empty or holds a key twice, or whose `column_groups` holds a group with empty `column_keys`, a key that matches no column, a column in two groups, or non-contiguous columns, when the Viewer host checks the dashboard, then in each case it renders no cells, shows the message "This dashboard can't be shown" followed by a diagnostic naming the widget and the failing column or group, and offers no Retry.
- [ ] **BC-C15 Column key missing from the widget data.** Given a `grid` widget whose `columns` lists a key that the Widget Data `columns` do not declare, when the widget receives the data, then it shows its cannot-show state with a diagnostic naming the key, renders nothing of the response, offers no Retry, and every other widget is unaffected.
- [ ] **BC-C16 Layout diagnostic.** Given a layout with a cell that fails the bounds check and two other cells that overlap, when the Viewer host checks the dashboard, then the diagnostic names the failing cell by its zero-based index in `cells` and the overlap check is skipped; given a layout whose cells at indexes 0 and 3 overlap and every cell passes the other checks, then the diagnostic names both indexes; given an empty `cells` array, then the layout is valid, no cell is rendered, and no diagnostic is shown.

### 7.4 Point (d): Consumer Widget Types

- [ ] **BC-D1 Consumer widget type validates.** Given a consumer widget type `gts.frontx.m.widget.widget.v1~frontx.m.widget.grid.v1~acme.gh.widget.pr_list.v1~` that is known to the Viewer host in the browser, and a dashboard with a widget instance of that type whose `params` match its schema, when the Viewer host checks the dashboard, then the widget validates against the consumer widget type.
- [ ] **BC-D2 Response of the kind's data type.** Given the widget of BC-D1, when it requests its data, then the response validates against the widget data type that the `grid` kind declares.
- [ ] **BC-D3 Settings that violate the consumer type.** Given a widget instance of the consumer widget type of BC-D1 whose `params` violate the schema that type closes, when the Viewer host checks the dashboard, then the dashboard cannot be shown and the diagnostic names that widget.
- [ ] **BC-D4 Consumer type unknown in the browser.** Given a dashboard with a widget instance whose `id` names a consumer widget type that the Viewer host does not know in the browser, when the Viewer host checks the dashboard, then the Viewer host renders no cells, shows the message "This dashboard can't be shown" followed by a diagnostic naming that widget, and offers no Retry.

## 8. Acceptance Criteria

- [ ] Section 6 specifies points (a), (b), (c) and (d), each with its request, response or failure class, and what the Viewer host does with it.
- [ ] Every conformance case in section 7 is written as Given / When / Then, and every point (a), (b), (c) and (d) has at least one case, including a failing dashboard request, a failing widget data request, and a widget response that cannot be shown.
- [ ] The dashboard response is specified as one instance of the Dashboard root type that carries no widget data and no theme, and the widget data response as one instance of the type the widget kind declares.
- [ ] A widget's own data request for its larger view is allowed, and what the larger view shows is left to each widget.
- [ ] No failure class gives an error status a special meaning.
- [ ] The open items list exactly the five items of section 6.5, each with the template architect as owner.
- [ ] Every identifier referenced in this document is defined in the PRD, the DESIGN, an ADR, the DECOMPOSITION, or this document, and every instance identifier shown carries its type chain.
- [ ] `cfs toc` and `cfs validate --artifact` report no errors for this document.
