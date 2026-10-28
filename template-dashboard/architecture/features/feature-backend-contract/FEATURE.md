---
status: accepted
version: 1
date: 2026-10-27
description: Exact specification and conformance cases of what the template requires from the consuming product's backend - the dashboard request and its response with the checks before a dashboard is shown, the metric-based widget data request and its result, and the failure classes with what the dashboard viewer sees and Retry.
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
  - [Provide a Dashboard](#provide-a-dashboard)
- [3. Processes / Business Logic (CDSL)](#3-processes--business-logic-cdsl)
  - [Request a Dashboard](#request-a-dashboard)
  - [Check a Dashboard](#check-a-dashboard)
  - [Request a Widget's Data](#request-a-widgets-data)
  - [Classify a Request Outcome](#classify-a-request-outcome)
- [4. States (CDSL)](#4-states-cdsl)
  - [Dashboard View State Machine](#dashboard-view-state-machine)
  - [Widget View State Machine](#widget-view-state-machine)
- [5. Definitions of Done](#5-definitions-of-done)
  - [Dashboard Request and Response](#dashboard-request-and-response)
  - [Checks Before a Dashboard Is Shown](#checks-before-a-dashboard-is-shown)
  - [Widget Data Request and Result](#widget-data-request-and-result)
  - [Failure Classes and What the Viewer Sees](#failure-classes-and-what-the-viewer-sees)
- [6. Backend Contract](#6-backend-contract)
  - [6.1 Dashboard Request and Response](#61-dashboard-request-and-response)
  - [6.2 Widget Data Request and Result](#62-widget-data-request-and-result)
  - [6.3 Failures and What the Viewer Sees](#63-failures-and-what-the-viewer-sees)
- [7. Conformance Cases](#7-conformance-cases)
  - [7.1 Point (a): Dashboard Request and Response](#71-point-a-dashboard-request-and-response)
  - [7.2 Point (b): Widget Data Request and Result](#72-point-b-widget-data-request-and-result)
  - [7.3 Point (c): Failures](#73-point-c-failures)
- [8. Acceptance Criteria](#8-acceptance-criteria)

<!-- /toc -->

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-featstatus-backend-contract`
## 1. Feature Context

- [ ] `p2` - `cpt-frontx-dashboard-feature-backend-contract`

### 1.1 Overview

This feature specifies exactly what the template requires from the consuming product's backend, and how a consuming product checks that its backend conforms. It covers three points: (a) the dashboard request and its response, with the checks that the backend runs before it shows a dashboard; (b) the widget data request that each widget builds from its `source`, and its one generic result; and (c) the failure classes of both requests, with what the dashboard viewer sees for each and where Retry is offered. The contract itself is section 6, and the conformance cases are section 7. The types that the requests and results carry are declared by `cpt-frontx-dashboard-feature-dashboard-root-types`, `cpt-frontx-dashboard-feature-widget-data-catalog` and `cpt-frontx-dashboard-feature-widget-catalog`; this feature uses them and declares no type of its own.

### 1.2 Purpose

The consuming product's backend is the only source of what a dashboard shows: it provides each dashboard, written or generated, and computes the data of each widget from its own metrics on request (`cpt-frontx-dashboard-adr-backend-delivered-dashboard`). A consuming product can connect its backend to the template only if it knows exactly what each request names, what each answer must hold, what the dashboard viewer sees for each outcome, and how to check that its answers conform. DESIGN section 3.3 (`cpt-frontx-dashboard-interface-dashboard-payload`) states this interface at architecture level; this feature is its exact specification. The data-request logic inside each widget entry (`cpt-frontx-dashboard-component-widget-data-request`) relies on this contract; its runtime behavior belongs to a later behavior feature.

**Requirements**: `cpt-frontx-dashboard-fr-backend-source`, `cpt-frontx-dashboard-fr-loading-error-states`, `cpt-frontx-dashboard-fr-domain-model`, `cpt-frontx-dashboard-fr-widget-modal`

**Principles**: `cpt-frontx-dashboard-principle-render-only-viewer`, `cpt-frontx-dashboard-principle-gts-contracts`

**Constraints**: `cpt-frontx-dashboard-constraint-gts-id-convention`, `cpt-frontx-dashboard-constraint-sixty-column-grid`

### 1.3 Actors

| Actor | Role in Feature |
|-------|-----------------|
| `cpt-frontx-dashboard-actor-dashboard-viewer` | Opens a dashboard, sees its loading, error, empty and cannot-show states, selects Retry, and opens a widget in its larger view. |
| `cpt-frontx-dashboard-actor-consuming-backend` | Runs the checks before a dashboard is shown, answers the dashboard request with one dashboard, and answers each widget data request with one result computed from its own data. |
| `cpt-frontx-dashboard-actor-template-consumer` | Has the consuming product write or generate a dashboard with the published domain model, and has it checked before it is shown. |

### 1.4 References

- **PRD**: [PRD.md](../../PRD.md)
- **Design**: [DESIGN.md](../../DESIGN.md) section 3.3 (Dashboard Definition and Widget Data), section 3.6 (Initial Load and Viewing; Widget Modal Open; Failure Handling; Dashboard Teardown; Consumer-Side Dashboard Generation), section 4 (prerequisite (a) and open questions 4 and 5)
- **ADRs**: [ADR-0011](../../ADR/0011-backend-delivered-dashboard-v1.md) (`cpt-frontx-dashboard-adr-backend-delivered-dashboard`), [ADR-0009](../../ADR/0009-subject-agnostic-widget-catalog-v1.md) (the template passes `source` through unchanged and gives it no meaning; the consuming product checks metrics and columns when it writes or generates a dashboard, and the widget checks the bound columns at run time), [ADR-0008](../../ADR/0008-widget-type-and-mfe-realization-v1.md) (a widget type is shown by its single winning realization; a replacement realization sends the same request)
- **Dependencies**: [feature-dashboard-root-types](../feature-dashboard-root-types/FEATURE.md) (the dashboard response is one instance of its Dashboard type), [feature-widget-data-catalog](../feature-widget-data-catalog/FEATURE.md) (every widget data result is one instance of its single widget data type, section 6.1), [feature-widget-catalog](../feature-widget-catalog/FEATURE.md) (the widget base with its `source`, from which the widget data request is built; the column-binding check `cpt-frontx-dashboard-algo-widget-catalog-check-column-binding`; the grid configuration check `cpt-frontx-dashboard-algo-widget-catalog-check-grid-configuration`)
- **Related**: [feature-layout-types](../feature-layout-types/FEATURE.md) (the layout checks of its section 6.3, used by reference and reached transitively through feature-dashboard-root-types); [feature-extension-domain-catalog](../feature-extension-domain-catalog/FEATURE.md) (section 6.1, `set_widget_context`, which gives each widget its instance and `data_endpoint`; section 3, `cpt-frontx-dashboard-algo-extension-domain-catalog-create-widget-extensions`, which gives the cell outcomes when a widget cannot be mounted); [feature-mfe-entries](../feature-mfe-entries/FEATURE.md) (the cell and modal entries whose widgets send the widget data request)

## 2. Actor Flows (CDSL)

**Use cases**: `cpt-frontx-dashboard-usecase-view-dashboard`, `cpt-frontx-dashboard-usecase-provide-dashboard`

### Open a Dashboard

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-flow-backend-contract-open-dashboard`

**Actor**: `cpt-frontx-dashboard-actor-dashboard-viewer`

**Success Scenarios**:
- The dashboard request returns one dashboard that passes its checks; every cell mounts its widget, every widget requests its own data once, and every widget presents its result unchanged, or its empty state when the result has no rows or, for a `markdown_card`, a null or empty first-row `body`.

**Error Scenarios**:
- The Viewer host cannot start: the dashboard area shows that the dashboard cannot be shown, without Retry, and no dashboard request is sent.
- The dashboard request fails: skeletons, then an error banner with Retry in place of the dashboard.
- The dashboard cannot be shown: no cells, the cannot-show message, and a diagnostic, without Retry.
- A cell's widget cannot be mounted, one widget's data request fails, or its data cannot be shown: the outcome appears in that cell only, and the other widgets are unaffected.

**Steps**:
1. [ ] - `p1` - Dashboard viewer opens the screen whose route names the dashboard's GTS instance identifier - `inst-open-screen`
2. [ ] - `p1` - **IF** the Viewer host cannot start, because the manifest fetch fails or the registry rejects a required registration - `inst-if-startup-failed`
   1. [ ] - `p1` - The dashboard area shows the dashboard cannot-show message with a diagnostic and no Retry; no dashboard request is sent (section 6.3) - `inst-show-startup-cannot-show`
   2. [ ] - `p1` - **RETURN** the dashboard in the cannot-show state - `inst-return-startup-cannot-show`
3. [ ] - `p1` - Viewer host shows skeletons in place of the dashboard - `inst-show-dashboard-skeletons`
4. [ ] - `p1` - Algorithm: request the dashboard using `cpt-frontx-dashboard-algo-backend-contract-request-dashboard` - `inst-request-dashboard`
5. [ ] - `p1` - **IF** the host session has expired, the host's session flow handles it, and the template shows no state of its own - `inst-if-dashboard-session-expired`
6. [ ] - `p1` - **IF** the dashboard request failed - `inst-if-dashboard-failed`
   1. [ ] - `p1` - Viewer host shows the dashboard error banner with Retry in place of the dashboard (section 6.3) - `inst-show-dashboard-banner`
   2. [ ] - `p1` - **RETURN** the dashboard in the load-failed state; Retry follows `cpt-frontx-dashboard-flow-backend-contract-retry` - `inst-return-dashboard-failed`
7. [ ] - `p1` - **IF** the dashboard cannot be shown - `inst-if-dashboard-cannot-show`
   1. [ ] - `p1` - Viewer host renders no cells and shows the dashboard cannot-show message with a diagnostic naming the cause: the failing instances, the failing cells by their zero-based index, the failing grid widget with its column or group, or the backend's reason (rejected as invalid, not found, permission denied, or a result that does not parse) - `inst-show-dashboard-diagnostic`
   2. [ ] - `p1` - **RETURN** the dashboard in the cannot-show state - `inst-return-dashboard-cannot-show`
8. [ ] - `p1` - Viewer host replaces the skeletons with the cells, mounts each cell's widget, and sends it `set_widget_context` with its widget instance, `data_endpoint`, and `modal` (`cpt-frontx-dashboard-algo-extension-domain-catalog-create-widget-extensions`) - `inst-mount-cells`
9. [ ] - `p1` - **FOR EACH** cell, in parallel and independently - `inst-for-each-widget`
   1. [ ] - `p1` - **IF** the cell's widget could not be mounted, because its widget type has no single winning realization, the registry rejected its cell extension, or its `mount_ext` or `set_widget_context` failed, the cell shows its cannot-show state with a diagnostic and no Retry, and `mount_ext` is never retried - `inst-show-cell-cannot-show`
   2. [ ] - `p1` - **ELSE** the widget has its context - `inst-else-cell-mounted`
      1. [ ] - `p1` - Algorithm: the widget requests its data using `cpt-frontx-dashboard-algo-backend-contract-request-widget-data` - `inst-request-widget-data`
      2. [ ] - `p1` - **IF** the widget data request failed, the widget shows an error with Retry in that cell only - `inst-show-widget-error`
      3. [ ] - `p1` - **IF** the widget data cannot be shown, the widget shows its cannot-show state with a diagnostic in that cell only, with the "no permission" diagnostic when permission was denied, and no Retry - `inst-show-widget-cannot-show`
      4. [ ] - `p1` - **IF** the result has no rows, or a `markdown_card` result has a null or empty first-row `body`, the widget shows its widget type's empty state - `inst-show-widget-empty`
      5. [ ] - `p1` - **ELSE** the widget presents the result unchanged - `inst-render-widget`
10. [ ] - `p1` - **RETURN** the dashboard rendered; nothing is requested after render except Retry after a failed request and the larger view's own request - `inst-return-dashboard-rendered`

### Retry After a Failure

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-flow-backend-contract-retry`

**Actor**: `cpt-frontx-dashboard-actor-dashboard-viewer`

**Success Scenarios**:
- Retry on the dashboard banner sends the dashboard request again; a successful answer that passes the checks removes the banner, and the dashboard renders.
- Retry in a widget sends that widget's data request again; a successful answer shows the widget's data or its empty state.

**Error Scenarios**:
- The repeated request fails again with a temporary cause: the same error with Retry stays in the same place.
- The repeated request meets a permanent cause: the dashboard or the widget shows its cannot-show state, without Retry.

**Steps**:
1. [ ] - `p1` - Dashboard viewer selects Retry on the dashboard error banner or in one widget's error - `inst-select-retry`
2. [ ] - `p1` - **IF** Retry was selected on the dashboard error banner - `inst-if-dashboard-retry`
   1. [ ] - `p1` - Viewer host shows skeletons in place of the dashboard - `inst-retry-dashboard-skeletons`
   2. [ ] - `p1` - Algorithm: request the dashboard again using `cpt-frontx-dashboard-algo-backend-contract-request-dashboard`, naming the same dashboard identifier; the request must reach the backend - `inst-retry-dashboard-request`
   3. [ ] - `p1` - **IF** the dashboard request failed again, Viewer host shows the dashboard error banner with Retry again - `inst-retry-dashboard-banner-again`
   4. [ ] - `p1` - **IF** the dashboard cannot be shown, Viewer host renders no cells and shows the dashboard cannot-show message with a diagnostic and no Retry - `inst-retry-dashboard-cannot-show`
   5. [ ] - `p1` - **ELSE** the banner is removed, and the dashboard continues at the cell step of `cpt-frontx-dashboard-flow-backend-contract-open-dashboard` - `inst-retry-dashboard-continue`
3. [ ] - `p1` - **ELSE** Retry was selected in one widget - `inst-else-widget-retry`
   1. [ ] - `p1` - Algorithm: request that widget's data again using `cpt-frontx-dashboard-algo-backend-contract-request-widget-data`, through the FrontX API package; the request must reach the backend and is not served from the API cache - `inst-retry-widget-request`
   2. [ ] - `p1` - The outcome is shown in that widget only: its data, its empty state, the error with Retry again for a temporary cause, or its cannot-show state without Retry for a permanent cause - `inst-retry-widget-outcome`
   3. [ ] - `p1` - No other widget changes and no other request is made - `inst-retry-widget-only`
4. [ ] - `p1` - **RETURN** the dashboard or the widget in its new state - `inst-return-retry`

### Open a Widget in Its Larger View

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-flow-backend-contract-larger-view-data`

**Actor**: `cpt-frontx-dashboard-actor-dashboard-viewer`

**Success Scenarios**:
- The widget opens in its larger view; the modal widget sends the same widget data request as the cell, which the FrontX API package may serve from its shared API cache, and presents the data as delivered when the larger view opens.

**Error Scenarios**:
- The larger view's request fails or its data cannot be shown: the larger view shows the same failure classes as a cell (section 6.3).
- The larger view cannot be opened, for example on a host whose modal domain is not rendered: no larger view appears, and the dashboard is unchanged (DESIGN section 3.6, Widget Modal Open); this is not a failure of this contract.

**Steps**:
1. [ ] - `p1` - Dashboard viewer selects the larger-view button in a cell widget's chrome, in any state of the widget - `inst-open-larger-view`
2. [ ] - `p1` - The modal widget receives `set_widget_context` with the same widget instance and `data_endpoint` as the cell (feature-extension-domain-catalog section 6.1) - `inst-modal-receives-context`
3. [ ] - `p1` - Algorithm: the modal widget sends the same widget data request as the cell using `cpt-frontx-dashboard-algo-backend-contract-request-widget-data`; the FrontX API package may serve it from its shared API cache - `inst-larger-view-request`
4. [ ] - `p1` - **IF** the request failed, the larger view shows the error with Retry; Retry must reach the backend - `inst-larger-view-error`
5. [ ] - `p1` - **IF** the data cannot be shown, the larger view shows the cannot-show state with a diagnostic and no Retry - `inst-larger-view-cannot-show`
6. [ ] - `p1` - **ELSE** the larger view presents the data as delivered when it opens, with more room, and adds no paging, sorting, filtering, or other metric - `inst-larger-view-present`
7. [ ] - `p1` - Dashboard viewer closes the larger view; the modal widget aborts its in-flight request when the FrontX API package accepts an abort signal, and in any case ignores a late response - `inst-close-larger-view`
8. [ ] - `p1` - **RETURN** the unchanged dashboard - `inst-return-larger-view`

### Provide a Dashboard

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-flow-backend-contract-provide-dashboard`

**Actor**: `cpt-frontx-dashboard-actor-template-consumer`

**Success Scenarios**:
- The consuming product writes or generates a dashboard, its backend runs the checks before the dashboard is shown and they pass, and the Viewer host shows the dashboard in full, in the same way whether it was written or generated.

**Error Scenarios**:
- A check fails: the consuming product does not show the dashboard; it corrects the dashboard or generates it again.
- A dashboard that fails a check is served anyway: the Viewer host runs the same checks, renders no cells, and shows the dashboard cannot-show message with a diagnostic.

**Steps**:
1. [ ] - `p2` - Template consumer has the consuming product write a dashboard with the published domain model, or generate it, for example with a language model on its backend from a user's request in a chat (DESIGN section 3.6, Consumer-Side Dashboard Generation) - `inst-describe-dashboard`
2. [ ] - `p2` - Algorithm: the consuming product backend runs the checks before the dashboard is shown using `cpt-frontx-dashboard-algo-backend-contract-check-dashboard`, against the template types registered in its own GTS registry (section 6.1) - `inst-run-pre-display-checks`
3. [ ] - `p2` - The consuming product also checks that each `source.metric` exists and returns every column that its widget binds; this authoring check is its own, and the widget checks the bound columns again at run time (section 6.2) - `inst-check-metrics`
4. [ ] - `p2` - **IF** any check fails - `inst-if-check-fails`
   1. [ ] - `p2` - The consuming product does not show the dashboard; it corrects the dashboard or generates it again - `inst-correct-dashboard`
   2. [ ] - `p2` - **RETURN** no dashboard provided - `inst-return-not-provided`
5. [ ] - `p2` - Consuming product backend assigns the UUIDs of the dashboard and widget identifiers and stores the definition, without any widget data - `inst-store-dashboard`
6. [ ] - `p2` - Consuming product backend answers the dashboard request with that dashboard (section 6.1), and each widget data request with a result computed from its own data on that request (section 6.2), for every dashboard viewer who may see the dashboard - `inst-serve-dashboard`
7. [ ] - `p2` - **RETURN** a dashboard that the Viewer host shows in full; the Viewer host cannot tell a generated dashboard from a written one - `inst-return-provided`

## 3. Processes / Business Logic (CDSL)

### Request a Dashboard

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-algo-backend-contract-request-dashboard`

**Input**: The dashboard's GTS instance identifier, from the route; the dashboard endpoint, from the consuming product's configuration. Used for the first request and for every Retry.

**Output**: The dashboard, ready to render; a failed dashboard request; a dashboard that cannot be shown, with its diagnostic; or an expired session.

**Steps**:
1. [ ] - `p1` - API: dashboard request through the FrontX API package under the host session, to the dashboard endpoint, naming the dashboard's GTS instance identifier (result: one dashboard instance, section 6.1) - `inst-api-dashboard-request`
2. [ ] - `p1` - Algorithm: classify the outcome using `cpt-frontx-dashboard-algo-backend-contract-classify-failure` - `inst-classify-dashboard-outcome`
3. [ ] - `p1` - **IF** the session has expired **RETURN** session expired; the host's session flow handles it - `inst-return-dashboard-session-expired`
4. [ ] - `p1` - **IF** the outcome is a failed request **RETURN** failed dashboard request - `inst-return-dashboard-failed-request`
5. [ ] - `p1` - **IF** the outcome is cannot be shown **RETURN** dashboard that cannot be shown, with a diagnostic naming the backend's reason - `inst-return-dashboard-permanent`
6. [ ] - `p1` - Algorithm: check the dashboard using `cpt-frontx-dashboard-algo-backend-contract-check-dashboard` - `inst-check-dashboard`
7. [ ] - `p1` - **IF** a check fails **RETURN** dashboard that cannot be shown, with the diagnostic of the failing check - `inst-return-dashboard-check-failed`
8. [ ] - `p1` - **RETURN** the dashboard - `inst-return-dashboard`

### Check a Dashboard

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-algo-backend-contract-check-dashboard`

**Input**: One parsed dashboard. The Viewer host runs this check when it opens a dashboard; the consuming product backend runs the same check before it shows a dashboard that it writes or generates.

**Output**: Pass, or a failure with a diagnostic naming the failing instances, the failing cells by their zero-based index, or the failing grid widget with its failing column or group.

**Steps**:
1. [ ] - `p1` - Validate the dashboard against the Dashboard type `gts.frontx.m.dashboard.dashboard.v1~` that its `id` names, resolving each embedded widget instance against the widget type its `id` names, one of the 9 template widget types; the Viewer host validates through the FrontX gts-plugin, and the backend through its own GTS registry - `inst-validate-dashboard`
2. [ ] - `p1` - **IF** the dashboard or any embedded widget fails validation **RETURN** failure naming the failing instances - `inst-return-invalid-instances`
3. [ ] - `p1` - Run the layout checks on the embedded layout (feature-layout-types section 6.3): the bounds of each cell, `x + w` not greater than 60, and, only when every cell passes both, no overlap - `inst-check-layout`
4. [ ] - `p1` - **IF** a layout check fails **RETURN** failure naming each failing cell by its zero-based index in `cells`, and both cells of each overlapping pair - `inst-return-invalid-layout`
5. [ ] - `p1` - **FOR EACH** `grid` widget embedded in a layout cell - `inst-for-each-grid-widget`
   1. [ ] - `p1` - Algorithm: check its configuration using `cpt-frontx-dashboard-algo-widget-catalog-check-grid-configuration` - `inst-check-grid-configuration`
6. [ ] - `p1` - **IF** a grid configuration check fails **RETURN** failure naming the widget and the failing column or group - `inst-return-invalid-grid`
7. [ ] - `p1` - **RETURN** pass - `inst-return-check-pass`

### Request a Widget's Data

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-algo-backend-contract-request-widget-data`

**Input**: One widget instance, with its `source`, and the widget data endpoint `data_endpoint`, both received in `set_widget_context`. Used by a cell widget, by a modal widget, and for every Retry.

**Output**: The data to present; the widget type's empty state; a failed widget data request; widget data that cannot be shown, with its diagnostic; or an expired session.

**Steps**:
1. [ ] - `p1` - Widget shows its own skeleton - `inst-show-widget-skeleton`
2. [ ] - `p1` - Take the metric name from `source.metric`, and the time window from `source.range` and the bucketing flag from `source.bucket` when they are set - `inst-take-source`
3. [ ] - `p1` - API: widget data request through the FrontX API package under the host session, to `data_endpoint`, naming the metric and, when set, the time window and the bucketing flag; it carries no widget type, no tenant and no user field (result: one widget data instance, section 6.2) - `inst-api-widget-request`
4. [ ] - `p1` - Algorithm: classify the outcome using `cpt-frontx-dashboard-algo-backend-contract-classify-failure` - `inst-classify-widget-outcome`
5. [ ] - `p1` - **IF** the session has expired **RETURN** session expired; the host's session flow handles it - `inst-return-widget-session-expired`
6. [ ] - `p1` - **IF** the outcome is a failed request **RETURN** failed widget data request - `inst-return-widget-load-failed`
7. [ ] - `p1` - **IF** the outcome is cannot be shown **RETURN** widget data that cannot be shown, with the "no permission" diagnostic when permission was denied, or a diagnostic naming the backend's reason otherwise - `inst-return-widget-permanent`
8. [ ] - `p1` - Validate the result against the widget data type `gts.frontx.v.widget_data.widget_data.v1~` through the FrontX gts-plugin (feature-widget-data-catalog section 6.1) - `inst-validate-widget-data`
9. [ ] - `p1` - **IF** the result fails validation **RETURN** widget data that cannot be shown, presenting nothing of the result - `inst-return-widget-cannot-show`
10. [ ] - `p1` - Algorithm: check the result against the widget's column binding using `cpt-frontx-dashboard-algo-widget-catalog-check-column-binding` - `inst-check-column-binding`
11. [ ] - `p1` - **IF** the result is misaligned, because a row's length differs from `columns` or a percentage column is not among `columns` **RETURN** widget data that cannot be shown, with a diagnostic and presenting nothing of the result - `inst-return-misaligned-cannot-show`
12. [ ] - `p1` - **IF** a bound column is missing from `columns` **RETURN** widget data that cannot be shown, with a diagnostic naming every missing column and presenting nothing of the result - `inst-return-column-cannot-show`
13. [ ] - `p1` - **IF** the column-binding check gives the empty state, because the result has no rows, or a `markdown_card` result has a null or empty first-row `body` **RETURN** the widget type's empty state - `inst-return-widget-empty`
14. [ ] - `p1` - **RETURN** the data, presented unchanged - `inst-return-widget-data`

### Classify a Request Outcome

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-algo-backend-contract-classify-failure`

**Input**: The outcome of one dashboard request or one widget data request. A Retry is classified by the same steps as the first request; nothing in the classification depends on whether the request is a first request or a Retry.

**Output**: Success with the parsed result; a failed request, which is temporary and offers Retry; a result that cannot be shown, which is permanent and offers no Retry; or an expired session.

**Steps**:
1. [ ] - `p1` - **IF** the host session is no longer valid **RETURN** session expired - `inst-session-expired`
2. [ ] - `p1` - **IF** the backend reports a backend error or a backend timeout **RETURN** failed request - `inst-backend-error`
3. [ ] - `p1` - **IF** the request ends in a network failure **RETURN** failed request - `inst-network-failure`
4. [ ] - `p1` - **IF** no answer arrives within the wait time of 35 seconds **RETURN** failed request - `inst-request-timeout`
5. [ ] - `p1` - **IF** the backend rejects the request as invalid **RETURN** cannot be shown - `inst-rejected-invalid`
6. [ ] - `p1` - **IF** the backend reports that the dashboard or the metric is not found **RETURN** cannot be shown - `inst-not-found`
7. [ ] - `p1` - **IF** the backend reports that permission is denied **RETURN** cannot be shown, with the "no permission" diagnostic for a widget data request - `inst-permission-denied`
8. [ ] - `p1` - **IF** the result does not parse **RETURN** cannot be shown - `inst-unparsable-body`
9. [ ] - `p1` - **RETURN** success with the parsed result - `inst-return-success`

## 4. States (CDSL)

### Dashboard View State Machine

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-state-backend-contract-dashboard-view`

**States**: Starting, Loading, Rendered, LoadFailed, CannotShow

**Initial State**: Starting

**Transitions**:
1. [ ] - `p1` - **FROM** Starting **TO** Loading **WHEN** the Viewer host has started and sends the dashboard request - `inst-dashboard-starting-loading`
2. [ ] - `p1` - **FROM** Starting **TO** CannotShow **WHEN** the Viewer host cannot start, because the manifest fetch fails or the registry rejects a required registration; no dashboard request is sent - `inst-dashboard-starting-cannot-show`
3. [ ] - `p1` - **FROM** Loading **TO** Rendered **WHEN** the dashboard request succeeds and the dashboard passes its checks - `inst-dashboard-loading-rendered`
4. [ ] - `p1` - **FROM** Loading **TO** LoadFailed **WHEN** the dashboard request fails with a temporary cause - `inst-dashboard-loading-failed`
5. [ ] - `p1` - **FROM** Loading **TO** CannotShow **WHEN** the outcome has a permanent cause, or the dashboard fails validation, a layout check, or a grid configuration check - `inst-dashboard-loading-cannot-show`
6. [ ] - `p1` - **FROM** LoadFailed **TO** Loading **WHEN** the dashboard viewer selects Retry on the error banner - `inst-dashboard-failed-retry`

Rendered and CannotShow are final for an open dashboard. An expired session changes no state of the template: the host's session flow handles it.

### Widget View State Machine

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-state-backend-contract-widget-view`

**States**: Loading, Rendered, Empty, LoadFailed, CannotShow

**Initial State**: Loading, entered when the widget receives `set_widget_context`

**Transitions**:
1. [ ] - `p1` - **FROM** Loading **TO** Rendered **WHEN** the result validates against the widget data type, passes the column-binding check, and has rows, with a first-row `body` that is neither null nor empty for a `markdown_card` - `inst-widget-loading-rendered`
2. [ ] - `p1` - **FROM** Loading **TO** Empty **WHEN** the result validates and passes the column-binding check but has no rows, or is a `markdown_card` result whose first-row `body` is null or empty - `inst-widget-loading-empty`
3. [ ] - `p1` - **FROM** Loading **TO** LoadFailed **WHEN** the widget data request fails with a temporary cause - `inst-widget-loading-failed`
4. [ ] - `p1` - **FROM** Loading **TO** CannotShow **WHEN** the outcome has a permanent cause, the result fails the widget data type or is misaligned, or a bound column is missing - `inst-widget-loading-cannot-show`
5. [ ] - `p1` - **FROM** LoadFailed **TO** Loading **WHEN** the dashboard viewer selects Retry in that widget - `inst-widget-failed-retry`

Rendered, Empty and CannotShow are final for a mounted widget: nothing is requested after render except Retry after a failed request and the larger view's own request. Each cell widget and each modal widget has its own instance of this state machine, so no widget's state changes another widget's state. A cell whose widget cannot be mounted never enters this state machine; it shows its cannot-show state as `cpt-frontx-dashboard-algo-extension-domain-catalog-create-widget-extensions` specifies. When a widget unmounts in any state, it aborts its in-flight request when the FrontX API package accepts an abort signal, and in any case ignores a late response.

## 5. Definitions of Done

### Dashboard Request and Response

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-dod-backend-contract-dashboard-request`

The system **MUST** request one dashboard by its GTS instance identifier through the FrontX API package, once per open dashboard and again only on Retry after a failed request. It **MUST** accept as the response only one instance of the Dashboard root type with its embedded layout and widgets, carrying no widget data and no theme, and **MUST** render it only after it passes validation, the layout checks and the grid configuration checks (section 6.1).

**Implements**:
- `cpt-frontx-dashboard-flow-backend-contract-open-dashboard`
- `cpt-frontx-dashboard-algo-backend-contract-request-dashboard`
- `cpt-frontx-dashboard-algo-backend-contract-check-dashboard`
- `cpt-frontx-dashboard-state-backend-contract-dashboard-view`

**Covers (PRD)**:
- `cpt-frontx-dashboard-fr-backend-source`
- `cpt-frontx-dashboard-fr-domain-model`
- `cpt-frontx-dashboard-contract-consuming-backend`
- `cpt-frontx-dashboard-usecase-view-dashboard`

**Covers (DESIGN)**:
- `cpt-frontx-dashboard-interface-dashboard-payload`
- `cpt-frontx-dashboard-interface-domain-model`
- `cpt-frontx-dashboard-adr-backend-delivered-dashboard`
- `cpt-frontx-dashboard-component-viewer-host`
- `cpt-frontx-dashboard-seq-initial-load`

**Constraints**: `cpt-frontx-dashboard-constraint-gts-id-convention`, `cpt-frontx-dashboard-constraint-sixty-column-grid`

**Touches**:
- API: the dashboard request of `cpt-frontx-dashboard-interface-dashboard-payload`, sent to the dashboard endpoint from the consuming product's configuration
- DB: none (the template persists nothing)
- Entities: Dashboard definition, Widget

### Checks Before a Dashboard Is Shown

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-dod-backend-contract-pre-display-checks`

The system **MUST** let the consuming product check, before it shows a dashboard that it writes or generates, that the template can show it in full. The contract **MUST** state the checks that the consuming product backend runs, namely validation against the template types, the layout checks and the grid configuration checks, as the same checks, with the same outcome, that the Viewer host runs when it opens the dashboard (section 6.1).

**Implements**:
- `cpt-frontx-dashboard-flow-backend-contract-provide-dashboard`
- `cpt-frontx-dashboard-algo-backend-contract-check-dashboard`

**Covers (PRD)**:
- `cpt-frontx-dashboard-fr-backend-source`
- `cpt-frontx-dashboard-contract-consuming-backend`
- `cpt-frontx-dashboard-usecase-provide-dashboard`

**Covers (DESIGN)**:
- `cpt-frontx-dashboard-interface-dashboard-payload`
- `cpt-frontx-dashboard-adr-backend-delivered-dashboard`

**Constraints**: `cpt-frontx-dashboard-constraint-gts-id-convention`, `cpt-frontx-dashboard-constraint-sixty-column-grid`

**Touches**:
- API: none beyond the dashboard request; the checks run on the consuming product backend before it serves a dashboard
- DB: none (the template persists nothing)
- Entities: Dashboard definition, Widget

### Widget Data Request and Result

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-dod-backend-contract-widget-data-request`

The system **MUST** let each widget request its own data after it receives `set_widget_context`, through the FrontX API package under the host session, to `data_endpoint`, naming `source.metric` and, when set, `source.range` and `source.bucket`, and nothing else. A cell widget **MUST** send the request once and again only on Retry after a failed request, and a modal widget **MUST** send the same request each time it receives `set_widget_context`. The widget **MUST** present a result only when it validates against the single widget data type and passes the column-binding check, **MUST** present it unchanged, and **MUST** show its empty state for a result with no rows, or for a `markdown_card` result whose first-row `body` is null or empty. A Retry **MUST** reach the backend (section 6.2).

**Implements**:
- `cpt-frontx-dashboard-flow-backend-contract-open-dashboard`
- `cpt-frontx-dashboard-flow-backend-contract-larger-view-data`
- `cpt-frontx-dashboard-algo-backend-contract-request-widget-data`
- `cpt-frontx-dashboard-state-backend-contract-widget-view`

**Covers (PRD)**:
- `cpt-frontx-dashboard-fr-backend-source`
- `cpt-frontx-dashboard-fr-domain-model`
- `cpt-frontx-dashboard-fr-widget-modal`
- `cpt-frontx-dashboard-contract-consuming-backend`
- `cpt-frontx-dashboard-usecase-view-dashboard`

**Covers (DESIGN)**:
- `cpt-frontx-dashboard-interface-dashboard-payload`
- `cpt-frontx-dashboard-interface-domain-model`
- `cpt-frontx-dashboard-adr-backend-delivered-dashboard`
- `cpt-frontx-dashboard-seq-initial-load`
- `cpt-frontx-dashboard-seq-widget-modal-open`

**Touches**:
- API: the widget data request of `cpt-frontx-dashboard-interface-dashboard-payload`, sent to the `data_endpoint` that `set_widget_context` carries
- DB: none (the template persists nothing)
- Entities: Widget (its `source`), Widget data

### Failure Classes and What the Viewer Sees

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-dod-backend-contract-errors`

The system **MUST** classify every outcome of the dashboard request and of each widget data request, first request or Retry, into the failure classes of section 6.3 by meaning, and **MUST** wait 35 seconds for each answer. It **MUST** show each class in its one place: the dashboard error banner with Retry, the widget error with Retry in that widget only, and the cannot-show state of the dashboard or of one widget without Retry, never misleading content. It **MUST** show a startup failure of the Viewer host and a cell whose widget cannot be mounted as cannot-show without Retry, and **MUST** leave an expired session to the host's session flow.

**Implements**:
- `cpt-frontx-dashboard-flow-backend-contract-open-dashboard`
- `cpt-frontx-dashboard-flow-backend-contract-retry`
- `cpt-frontx-dashboard-algo-backend-contract-classify-failure`
- `cpt-frontx-dashboard-state-backend-contract-dashboard-view`
- `cpt-frontx-dashboard-state-backend-contract-widget-view`

**Covers (PRD)**:
- `cpt-frontx-dashboard-fr-loading-error-states`
- `cpt-frontx-dashboard-usecase-view-dashboard`

**Covers (DESIGN)**:
- `cpt-frontx-dashboard-interface-dashboard-payload`
- `cpt-frontx-dashboard-component-viewer-host`
- `cpt-frontx-dashboard-seq-failure-handling`

**Touches**:
- API: the dashboard request and the widget data request of `cpt-frontx-dashboard-interface-dashboard-payload`
- DB: none (the template persists nothing)
- Entities: Dashboard definition, Widget data

## 6. Backend Contract

The consuming product backend implements this contract; the template only consumes it. The contract is two requests: one dashboard request per open dashboard, and one widget data request per widget. Both are sent through the FrontX API package under the host session, and both carry JSON. The location of each endpoint comes from the consuming product's configuration. The dashboard carries GTS instances whose types are declared by the dependency features; every instance identifier carries its type chain (GTS 0.17), and a dashboard or widget identifier is the type chain followed by a UUID that the consuming product backend generates.

**Out of scope.** Access to dashboards and data, the distribution of the types to the backend, limits and versioning belong to the consuming product or are not covered by the contract. The shapes of the dashboard root, of the widget data, and of the widget base with its `source` and column bindings are declared by `cpt-frontx-dashboard-feature-dashboard-root-types`, `cpt-frontx-dashboard-feature-widget-data-catalog` and `cpt-frontx-dashboard-feature-widget-catalog`. Consumer widget types are not in this version; they are a later stage (DESIGN section 4). The choice of the winning realization, the registration of cell extensions and the forwarding of theme and language are specified in feature-extension-domain-catalog (section 3 and section 6.2); only the remaining Viewer host runtime, its screen and its chrome, belongs to a later behavior feature. The Viewer host behavior that this contract makes visible, from the requests to the loading, error, empty and cannot-show states and Retry, stays in scope. Observability and logging: not applicable, because the diagnostics are for developers and there is no log or metric contract. Data protection and privacy: not applicable, because the template stores nothing, and privacy follows the PRD exclusions (PRD section 6.2). Audit and data lifecycle: not applicable, because nothing is persisted. Accessibility of Retry and of the states: governed by `cpt-frontx-dashboard-nfr-accessibility` and the widget chrome of feature-widget-catalog. Operations and rollout: not applicable, because the template is a source package with no service of its own.

### 6.1 Dashboard Request and Response

**Request.** The Viewer host names one dashboard by its GTS instance identifier, the identifier that its route carries, for example `gts.frontx.m.dashboard.dashboard.v1~3f2b8c1e-5d47-4a9e-9c61-2e8f0b7d4a15`. It sends the request through the FrontX API package under the host session to the dashboard endpoint. The Viewer host sends the request once per open dashboard, and again only when the dashboard viewer selects Retry after a failed request. When the Viewer host cannot start, it sends no dashboard request (section 6.3).

**Response.** The response is that dashboard: one instance of the Dashboard root type `gts.frontx.m.dashboard.dashboard.v1~` (feature-dashboard-root-types section 6.1).

| Part | Content |
|------|---------|
| `id` | The dashboard's combined anonymous instance identifier: the dashboard type chain followed by a UUID generated by the consuming product backend. |
| `name` | The dashboard name. |
| `description` | Optional description of the dashboard. |
| `layout` | The embedded layout, with its `columns` and `cells`. Each cell embeds one widget instance with its `id`, `title`, presentation configuration and `source`. Each widget `id` names one of the 9 template widget types as the rightmost type of its chain. |

The response carries no widget data and no theme. Each widget requests its own data (section 6.2), and the dashboard follows the host theme. The consuming product may write the dashboard or generate it; the Viewer host cannot tell the two apart and shows both in the same way.

**What the Viewer host does with it.** The Viewer host validates the dashboard through the FrontX gts-plugin, which resolves each embedded widget against the widget type its `id` names. It then runs the layout checks of feature-layout-types section 6.3 on the embedded layout, and the grid configuration checks (`cpt-frontx-dashboard-algo-widget-catalog-check-grid-configuration`) on every `grid` widget. The whole check is `cpt-frontx-dashboard-algo-backend-contract-check-dashboard`. The layout diagnostic names each failing cell by its zero-based index in `cells`; bounds failures and `x + w` failures are reported together, the overlap check runs only when every cell passes both, and an overlap names both cells of the pair. An empty `cells` array is valid: no cell is rendered and no diagnostic is shown.

The Viewer host repairs nothing. A dashboard that passes renders its cells, and each widget receives its widget instance in `set_widget_context` (feature-extension-domain-catalog section 6.1). A dashboard that fails validation, a layout check or a grid configuration check is a dashboard that cannot be shown (section 6.3).

**Checks before a dashboard is shown.** Before the consuming product shows a dashboard that it writes or generates, its backend must run the same checks as the Viewer host, so that the template can show the dashboard in full:

1. Validation of the dashboard and each embedded widget against the template types, registered in the backend's own GTS registry (GTS OP#6 for instances, with the abstract-type and reference rules).
2. The layout checks of feature-layout-types section 6.3.
3. The grid configuration checks of `cpt-frontx-dashboard-algo-widget-catalog-check-grid-configuration`, for every `grid` widget.

A dashboard that fails any of them is not shown: the consuming product corrects it or generates it again. A dashboard that passes all three passes the Viewer host's checks too. Separately, the consuming product checks, when it writes or generates the dashboard, that each `source.metric` exists and returns every column that its widget binds; that check is its own, and the widget checks the bound columns again at run time (section 6.2).

### 6.2 Widget Data Request and Result

**Request.** Each widget's own extension sends its widget data request after it receives `set_widget_context`, through the FrontX API package under the host session, to the `data_endpoint` that `set_widget_context` carries (feature-extension-domain-catalog section 6.1). The request is built from the widget's `source` (feature-widget-catalog section 6.0):

| Part | Taken from | Content |
|------|------------|---------|
| Metric | `source.metric` | The name of a backend metric. Always present. |
| Time window | `source.range` | Optional. Present only when `source` sets it, in the form the backend defines. |
| Bucketing flag | `source.bucket` | Optional. Present only when `source` sets it. |

The request carries no widget type, no tenant and no user field; the host session identifies the caller. The template passes these values through unchanged and gives them no meaning (ADR-0009). A replacement realization of a widget type sends the same request (ADR-0008).

**When it is sent.** A cell widget sends its request once, after `set_widget_context`, and again only when the dashboard viewer selects Retry after a failed request in that widget. Widgets send their requests in parallel and independently of each other. A modal widget sends the same request each time it receives `set_widget_context`.

**Result.** The backend computes the metric from its own data on that request and returns one result: one instance of the widget data type `gts.frontx.v.widget_data.widget_data.v1~` (feature-widget-data-catalog section 6.1). The shape is the same for every metric and every widget type.

| Field | Content |
|-------|---------|
| `columns` | The ordered, unique column names. |
| `rows` | The rows in the order the backend delivers them; each row is a positional array that holds exactly one value per entry of `columns`, in the order of `columns`. |
| `percent_columns` | The names of the columns whose values hold percentages, each one of `columns`; empty when no column holds percentages. A value in a percentage column is a fraction where 1 means 100%: 0.385 is shown as 38.5%. |

The result carries no `id` and no column types. The backend must keep every row aligned to `columns` and name in `percent_columns` only columns that are among `columns`; the widget data type cannot express either rule, so the widget checks both, and a result that breaks one is misaligned. For example, a `grid` widget whose `source.metric` is `orders_by_region` and whose columns bind `region` and `orders` may receive `columns` `["region", "orders", "share"]`, two rows `["North", 1240, 0.385]` and `["South", 1985, 0.615]`, and `percent_columns` `["share"]`; the grid shows the `share` values as 38.5% and 61.5% when it binds that column.

**What the widget does with it.** The widget validates the result against the widget data type through the FrontX gts-plugin. It then runs the column-binding check (`cpt-frontx-dashboard-algo-widget-catalog-check-column-binding`): first that the result is aligned, with every row as long as `columns` and every percentage column among `columns`, and then that every column its presentation configuration binds is among `columns`. A result that passes both and has rows is presented unchanged: the widget does not compute, aggregate, narrow, re-order, group, page, hide or truncate it. Values of the percentage columns are formatted as percentages for the host language; nothing else in the result changes what is shown. A result with no rows shows the widget type's empty state, and so does a `markdown_card` result whose first-row `body` is null or empty; it is not a failure. A result that fails either check is widget data that cannot be shown (section 6.3).

**Larger view.** The modal entry sends the same widget data request as the cell, with the same validation, column-binding check and failure classes. It shows the data as delivered when the larger view opens. It may present the data differently, with more room, but adds no paging, sorting, filtering or other metric.

**API cache and conformance.** The FrontX API package shares its API cache across runtimes, so identical requests, such as those of a cell and of its larger view, may be served from the cache. Conformance therefore counts requests made through the FrontX API package, not network calls. A Retry must reach the backend: it is never served from the cache. That the cache never serves a cached failure to a Retry is to be confirmed against FrontX (DESIGN section 4, open question 5).

**Consistency.** Each widget's data is an independent snapshot, taken when that widget requests it. There is no consistency guarantee across widgets. A cell and its larger view may show different values when the backend data changed between their requests, or the same values when the second request is served from the API cache.

**After render.** Nothing is requested after the widgets show their data, except Retry after a failed request and the larger view's own request. There is no refresh while the dashboard is open, and a theme or language change requests nothing.

### 6.3 Failures and What the Viewer Sees

The failure classes are named by meaning. Every failure has one visible place.

| Request | Failure class | Causes | What the user sees | Retry |
|---------|---------------|--------|--------------------|-------|
| Dashboard | Failed dashboard request | Backend error, backend timeout, network failure, or no answer within the wait time | An error banner in place of the dashboard | Sends the dashboard request again |
| Dashboard | Dashboard that cannot be shown | Request rejected as invalid, dashboard not found, permission denied, or a result that does not parse or fails validation of the dashboard or an embedded widget; also a failing layout or grid configuration check | No cells and a diagnostic naming the failing instances, cells, or grid columns and groups | Not offered |
| Widget data | Failed widget data request | Backend error, backend timeout, network failure, or no answer within the wait time | An error in that widget only | Sends that widget's request again |
| Widget data | Widget data that cannot be shown | Request rejected as invalid. Metric not found. Permission denied, shown with a "no permission" diagnostic. A result that does not parse, fails the widget data type, is misaligned (a row's length differs from `columns`, or a percentage column is not among `columns`), or lacks a bound column. | A cannot-show state with a diagnostic in that widget only, showing nothing of the result | Not offered |
| Either | Session expired | The host session is no longer valid | Handled by the host's session flow; the template shows nothing of its own | Not applicable |

The user in this table is the dashboard viewer. While the dashboard loads, the Viewer host shows skeletons in place of the dashboard, and a failed dashboard request shows no cell. When the backend's reason makes a dashboard one that cannot be shown, the diagnostic names that reason. A widget failure of either class leaves every other widget unaffected.

**Retry.** A Retry is sent through the FrontX API package, must reach the backend, and is classified like the first request (`cpt-frontx-dashboard-algo-backend-contract-classify-failure`). Success shows the dashboard, or the widget's data or empty state. A further temporary failure shows the error with Retry again in the same place. A permanent outcome shows the cannot-show state, without Retry. Retry is not offered for a permanent outcome, because the same request would fail again.

**Failures inside the template.** Two failures are not failures of the backend interface, but use the same cannot-show outcome, without Retry:

- **The Viewer host cannot start.** The manifest fetch fails, or the registry rejects a required registration: the schemas, the manifests, the cell entries, or the `layout_cells` domain. The dashboard area shows that the dashboard cannot be shown, with a diagnostic and no Retry, and no dashboard request is sent.
- **A cell's widget cannot be mounted.** Its widget type has no single winning realization, the registry rejects its cell extension, or its `mount_ext` or `set_widget_context` fails, for example because the widget bundle does not load. That cell shows its cannot-show state with a diagnostic and no Retry, and `mount_ext` is never retried. The other cells are unaffected. `cpt-frontx-dashboard-algo-extension-domain-catalog-create-widget-extensions` specifies these outcomes.

**Wait time.** The Viewer host and every widget wait 35 seconds for an answer to the dashboard request and to every widget data request. No answer within that time is a failed request. The wait time is a template setting, not a term of this contract.

**Request ownership and unmount.** Every request belongs to the extension that sent it: the Viewer host owns the dashboard request, and each cell or modal widget owns its widget data requests. When an extension unmounts, for example when the dashboard closes or the larger view is closed, it aborts its in-flight requests through the FrontX API package when the package accepts an abort signal, and in any case ignores late responses (DESIGN section 4, open question 4). The Viewer host does not cancel requests on behalf of widgets (DESIGN section 3.6, Dashboard Teardown).

**Prerequisite outside the template.** The consuming product's backend must let every dashboard viewer who may see a dashboard get the widget data of its widgets. Without that, a viewer sees widgets in the cannot-show state with the "no permission" diagnostic on a dashboard they may open; the template has no workaround (DESIGN section 4, prerequisite (a)).

**Default wording.** The Viewer host and every widget localize their own wording for the host language. The default English wording is:

| State | Default English wording |
|-------|-------------------------|
| Dashboard skeletons | "Loading dashboard" |
| Failed dashboard request | "Couldn't load dashboard", with "Retry" |
| Dashboard that cannot be shown, including a startup failure of the Viewer host | "This dashboard can't be shown", followed by the diagnostic |
| Cell skeleton and widget skeleton | "Loading data" |
| Failed widget data request | "Couldn't load data", with "Retry" |
| Widget data that cannot be shown, and a cell whose widget cannot be mounted | "This content can't be shown", followed by the diagnostic |
| "No permission" diagnostic | "You don't have permission to see this data" |
| Empty state, the same default for every widget type | "No data to show" |

## 7. Conformance Cases

Each case is a testable scenario in the form Given / When / Then. A consuming product runs them against its backend and the template; a case passes when every Then statement holds. Every count of requests in these cases counts requests made through the FrontX API package, not network calls: a request served from the shared API cache counts, and a Retry must reach the backend.

### 7.1 Point (a): Dashboard Request and Response

- [ ] **BC-A1 One request by identifier.** Given a route that names dashboard `gts.frontx.m.dashboard.dashboard.v1~3f2b8c1e-5d47-4a9e-9c61-2e8f0b7d4a15`, when the dashboard viewer opens it, then the Viewer host sends exactly one dashboard request through the FrontX API package to the dashboard endpoint, naming that identifier, and sends no further dashboard request after render.
- [ ] **BC-A2 Valid dashboard renders.** Given a response that is one valid instance of `gts.frontx.m.dashboard.dashboard.v1~` whose layout and `grid` widgets pass their checks, when the Viewer host receives it, then the skeletons are replaced by the cells, and each mounted widget receives its own widget instance from the dashboard.
- [ ] **BC-A3 Response content.** Given any dashboard response of the backend, when it is checked against section 6.1, then it validates against the Dashboard root type, carries no widget data and no theme, every embedded widget has `id`, `title`, presentation configuration and `source`, every widget `id` names one of the 9 template widget types, and every instance `id` carries its type chain followed by a UUID.
- [ ] **BC-A4 Checks before a dashboard is shown.** Given, in turn, a written or generated dashboard that fails validation, one whose layout has two overlapping cells, and one with a `grid` widget whose `column_groups` names a key that matches no column, when the consuming product backend runs its checks before the dashboard is shown, then each dashboard fails with the same diagnostic that the Viewer host would show, and the consuming product does not show it; given a dashboard that passes all three checks on the backend, then the Viewer host's checks pass too.
- [ ] **BC-A5 Generated and written alike.** Given a generated dashboard and a written dashboard with the same content, when the dashboard viewer opens each of them, then the Viewer host sends the same requests and shows both in the same way.

### 7.2 Point (b): Widget Data Request and Result

- [ ] **BC-B1 One request per widget.** Given a rendered dashboard with N mounted widgets, when each widget receives `set_widget_context`, then each widget sends exactly one widget data request through the FrontX API package to its `data_endpoint`, the N requests run independently of each other, and after render no widget data request follows except Retry after a failed request (BC-C11) and the larger view's own request (BC-B4).
- [ ] **BC-B2 Request content.** Given a widget whose `source` names the metric `orders_by_region` with a time window and no bucketing flag, when it sends its widget data request, then the request names `orders_by_region` and that time window unchanged, carries no bucketing flag, and carries no widget type, no tenant and no user field.
- [ ] **BC-B3 Result of the widget data type.** Given the `grid` widget of section 6.2, bound to `region` and `orders`, and a backend that answers with `columns` `["region", "orders", "share"]`, two rows and `percent_columns` `["share"]`, when the widget receives the result, then the result validates against `gts.frontx.v.widget_data.widget_data.v1~`, passes the column-binding check, carries no `id`, and is presented unchanged in the delivered row order; when the grid also binds `share`, its values 0.385 and 0.615 are shown as 38.5% and 61.5%, formatted for the host language.
- [ ] **BC-B4 Larger view sends the same request.** Given a rendered widget, when the dashboard viewer opens it in its larger view, then the modal widget sends exactly one widget data request with the same metric, time window and bucketing flag as the cell, possibly served from the API cache, sends no request for another metric, page, sort order or filter, and shows the data as delivered when the larger view opens.
- [ ] **BC-B5 Empty result.** Given, in turn, a widget and a result that validates, has every bound column and has no rows, and a `markdown_card` and a result whose first-row `body` is null or an empty string, when the widget receives it, then it shows its widget type's empty state with "No data to show", not an error, and offers no Retry.
- [ ] **BC-B6 Independent snapshots.** Given a rendered widget whose backend data changes before the larger view opens, and a larger-view request that is not served from the API cache, when the dashboard viewer opens the larger view, then the larger view shows the new values and the cell keeps the values it received.
- [ ] **BC-B7 Theme or language change requests nothing.** Given a rendered dashboard, when the host theme or language changes, then no dashboard request and no widget data request is sent.
- [ ] **BC-B8 Viewer access.** Given a dashboard viewer who may see a dashboard, when every widget of that dashboard sends its widget data request under that viewer's host session, then the backend answers none of them with permission denied.
- [ ] **BC-B9 Aligned result.** Given any widget data result of the backend, when it is checked against section 6.2, then every row holds exactly one value per entry of `columns`, every name in `percent_columns` is among `columns`, and every value in a percentage column is a fraction where 1 means 100%.

### 7.3 Point (c): Failures

- [ ] **BC-C1 Failed dashboard request.** Given a backend that answers the dashboard request with a backend error, when the dashboard viewer opens the dashboard, then the Viewer host shows skeletons, then the dashboard error banner with Retry in place of the dashboard, and no cell.
- [ ] **BC-C2 Temporary dashboard causes alike.** Given, in turn, a backend error, a backend timeout, a network failure, and no answer within 35 seconds as the outcome of the dashboard request, when the dashboard viewer opens the dashboard, then the Viewer host shows the same dashboard error banner with Retry in each case.
- [ ] **BC-C3 Successful dashboard Retry.** Given the dashboard error banner and a backend that answers the next dashboard request with a valid dashboard, when the dashboard viewer selects Retry, then exactly one new dashboard request is sent and reaches the backend, the banner is removed, and the dashboard renders.
- [ ] **BC-C4 Dashboard Retry that fails again.** Given the dashboard error banner and a backend that answers the next dashboard request with a backend error, when the dashboard viewer selects Retry, then exactly one new dashboard request is sent, and the dashboard error banner with Retry stays in place of the dashboard, with no cell.
- [ ] **BC-C5 Dashboard Retry that meets a permanent cause.** Given the dashboard error banner and a backend that answers the next dashboard request with dashboard not found, when the dashboard viewer selects Retry, then the Viewer host renders no cells, shows "This dashboard can't be shown" with a diagnostic, and offers no Retry.
- [ ] **BC-C6 Permanent dashboard causes.** Given, in turn, a dashboard request that the backend rejects as invalid, a dashboard that is not found, permission denied, and a result that does not parse, when the dashboard viewer opens the dashboard, then in each case the Viewer host renders no cells, shows "This dashboard can't be shown" followed by a diagnostic naming the reason, offers no Retry, and no widget data request is sent.
- [ ] **BC-C7 Dashboard that fails its checks.** Given a dashboard response in which one embedded widget does not validate against the widget type its `id` names, or whose layout has two overlapping cells, when the Viewer host receives it, then it renders no cells, shows "This dashboard can't be shown" followed by a diagnostic naming the failing instance or both overlapping cells by their zero-based index, and offers no Retry.
- [ ] **BC-C8 Grid configuration that cannot be shown.** Given, in turn, a dashboard that passes validation with a `grid` widget whose `columns` holds a key twice, or whose `column_groups` holds a group with empty `column_keys`, a key that matches no column, a column in two groups, or non-contiguous columns, when the Viewer host runs the grid configuration checks, then in each case it renders no cells, shows "This dashboard can't be shown" followed by a diagnostic naming the widget and the failing column or group, and offers no Retry.
- [ ] **BC-C9 Layout diagnostic.** Given a layout with a cell that fails the bounds check and two other cells that overlap, when the Viewer host checks the dashboard, then the diagnostic names the failing cell by its zero-based index in `cells` and the overlap check is skipped; given a layout whose cells at indexes 0 and 3 overlap and every cell passes the other checks, then the diagnostic names both indexes; given an empty `cells` array, then the layout is valid, no cell is rendered, and no diagnostic is shown.
- [ ] **BC-C10 Failed widget data request.** Given a dashboard with several widgets and, in turn, a backend error, a backend timeout, a network failure, and no answer within 35 seconds as the outcome of one widget's data request, when the widgets request their data, then in each case that widget shows "Couldn't load data" with Retry, and every other widget presents its data.
- [ ] **BC-C11 Successful widget Retry.** Given a widget in its error state and a backend that answers the next request of that widget with a valid result, when the dashboard viewer selects Retry in that widget, then exactly one new widget data request, for that widget only, is sent and reaches the backend, and the widget presents the data.
- [ ] **BC-C12 Widget Retry that fails again.** Given a widget in its error state and a backend that answers the next request of that widget with a backend error, when the dashboard viewer selects Retry in that widget, then exactly one new widget data request, for that widget only, is sent, the error with Retry stays in that widget, and no other widget changes.
- [ ] **BC-C13 Widget Retry that meets a permanent cause.** Given a widget in its error state and a backend that answers the next request of that widget with metric not found, when the dashboard viewer selects Retry in that widget, then the widget shows its cannot-show state with a diagnostic and no Retry, and no other widget changes.
- [ ] **BC-C14 Widget data that cannot be shown.** Given, in turn, a widget data request that the backend rejects as invalid, a metric that is not found, a result that does not parse, and a result that does not validate against the widget data type, when the widget receives the outcome, then in each case it shows "This content can't be shown" with a diagnostic, presents nothing of the result, offers no Retry, and every other widget is unaffected.
- [ ] **BC-C15 Permission denied for a widget.** Given a backend that answers one widget's data request with permission denied, when the widgets request their data, then that widget shows its cannot-show state with the "no permission" diagnostic and no Retry, and every other widget presents its data.
- [ ] **BC-C16 Missing bound column.** Given a `grid` widget bound to `region` and `orders` and a result whose `columns` do not include `orders`, when the widget receives the result, then it shows its cannot-show state with a diagnostic naming `orders`, presents nothing of the result, offers no Retry, and every other widget is unaffected.
- [ ] **BC-C17 Viewer host startup failure.** Given a Viewer host whose manifest fetch fails, when the dashboard viewer opens the dashboard, then the dashboard area shows "This dashboard can't be shown" with a diagnostic, offers no Retry, and no dashboard request is sent.
- [ ] **BC-C18 Cell whose widget cannot be mounted.** Given a dashboard in which one cell's `mount_ext` fails, when the Viewer host mounts the cells, then that cell shows its cannot-show state with a diagnostic and no Retry, `mount_ext` is not retried, that cell sends no widget data request, and every other widget presents its data.
- [ ] **BC-C19 Session expired.** Given a host session that is no longer valid, when the dashboard request or a widget data request is sent, then the host's session flow handles it, and the template shows no state of its own.
- [ ] **BC-C20 Unmount with a request in flight.** Given a widget whose widget data request is in flight, when the dashboard closes, then the request is aborted when the FrontX API package accepts an abort signal, and a late response is ignored in any case and changes nothing that is shown.
- [ ] **BC-C21 Misaligned result.** Given the `grid` widget of section 6.2 and, in turn, a result that validates against the widget data type but has a row `["North", 1240]` with fewer values than `columns`, and a result whose `percent_columns` names `margin`, which is not among `columns`, when the widget receives the result, then in each case it shows "This content can't be shown" with a diagnostic, presents nothing of the result, offers no Retry, and every other widget is unaffected.

## 8. Acceptance Criteria

- [ ] Section 6 specifies points (a), (b) and (c), each with its request, result or failure class, and what the Viewer host and the widgets do with it.
- [ ] Every conformance case in section 7 is written as Given / When / Then, and each of points (a), (b) and (c) has at least one case, including the checks before a dashboard is shown, a failing dashboard request, a failing widget data request, a widget result that cannot be shown, and a Retry that meets a permanent cause.
- [ ] The dashboard response is specified as one instance of the Dashboard root type that carries no widget data and no theme, and every widget data result as one instance of the single widget data type.
- [ ] The widget data request names `source.metric` and, when set, `source.range` and `source.bucket`, and nothing else; the larger view sends the same request and adds no other metric.
- [ ] Every failure class is named by meaning, with its causes, what the dashboard viewer sees, and whether Retry is offered; a Retry is classified like the first request.
- [ ] The wait time of 35 seconds is stated as a template setting, the API cache and the rule that a Retry reaches the backend are stated, and request counts are made through the FrontX API package.
- [ ] Every identifier referenced in this document is defined in the PRD, the DESIGN, an ADR, the DECOMPOSITION, a FEATURE, or this document, and every instance identifier shown carries its type chain.
- [ ] `cfs toc` and `cfs validate --artifact` report no errors for this document.
