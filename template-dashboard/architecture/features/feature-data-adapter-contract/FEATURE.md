---
status: accepted
version: 1
date: 2026-10-30
description: Exact specification and conformance cases of what the template requires from the data adapter that the consuming product implements - the operations "get a dashboard" and "run a query", the served query families with their type schemas, the fill-mode obligations, delivery of the dataset types and vocabulary with the dashboard, the cannot-show triggers on the adapter side, and data that never arrives - plus the test data adapter that serves as test tooling.
---

# Feature: Data Adapter Contract


<!-- toc -->

- [1. Feature Context](#1-feature-context)
  - [1.1 Overview](#11-overview)
  - [1.2 Purpose](#12-purpose)
  - [1.3 Actors](#13-actors)
  - [1.4 References](#14-references)
- [2. Actor Flows (CDSL)](#2-actor-flows-cdsl)
  - [Open a Dashboard](#open-a-dashboard)
  - [Change a Query](#change-a-query)
- [3. Processes / Business Logic (CDSL)](#3-processes--business-logic-cdsl)
  - [Get a Dashboard](#get-a-dashboard)
  - [Check the Served Query Family](#check-the-served-query-family)
  - [Run a Query](#run-a-query)
- [4. States (CDSL)](#4-states-cdsl)
  - [Dashboard Area State Machine](#dashboard-area-state-machine)
- [5. Definitions of Done](#5-definitions-of-done)
  - [Data Adapter Operations](#data-adapter-operations)
  - [Fill-Mode Obligations](#fill-mode-obligations)
  - [Delivery with the Dashboard](#delivery-with-the-dashboard)
  - [Cannot-Show Triggers and Data That Never Arrives](#cannot-show-triggers-and-data-that-never-arrives)
  - [Test Data Adapter](#test-data-adapter)
  - [Conformance Cases and Consumer Guide](#conformance-cases-and-consumer-guide)
- [6. Data Adapter Contract](#6-data-adapter-contract)
  - [6.1 Operations](#61-operations)
  - [6.2 Served Query Families](#62-served-query-families)
  - [6.3 Obligations of an Implementation](#63-obligations-of-an-implementation)
  - [6.4 Delivery with the Dashboard](#64-delivery-with-the-dashboard)
  - [6.5 Results and What the Dashboard Viewer Sees](#65-results-and-what-the-dashboard-viewer-sees)
  - [6.6 Test Data Adapter](#66-test-data-adapter)
- [7. Conformance Cases](#7-conformance-cases)
  - [7.1 Operations](#71-operations)
  - [7.2 Served Query Families](#72-served-query-families)
  - [7.3 Fill Modes and Answers](#73-fill-modes-and-answers)
  - [7.4 Delivery with the Dashboard](#74-delivery-with-the-dashboard)
  - [7.5 Cannot-Show and Data That Never Arrives](#75-cannot-show-and-data-that-never-arrives)
  - [7.6 Test Data Adapter](#76-test-data-adapter)
- [8. Acceptance Criteria](#8-acceptance-criteria)

<!-- /toc -->

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-featstatus-data-adapter-contract`
## 1. Feature Context

- [ ] `p2` - `cpt-frontx-dashboard-feature-data-adapter-contract`

### 1.1 Overview

This feature specifies exactly what the template requires from the data adapter that the consuming product implements, and how a consuming product checks that its data adapter conforms. The data adapter has two operations, "get a dashboard" and "run a query", and one declaration, the query families it serves, which returns the family type schemas. The feature covers the obligations of an implementation, the delivery of dataset types and vocabulary instances together with the dashboard, the data adapter results that lead to a cannot-show state, and data that never arrives. The contract itself is section 6, and the conformance cases are section 7. The types that the operations carry are declared by `cpt-frontx-dashboard-feature-dashboard-root-types`, `cpt-frontx-dashboard-feature-query-vocabulary` and `cpt-frontx-dashboard-feature-widget-data-catalog`; this feature uses them and declares no type of its own.

### 1.2 Purpose

The template has no backend access of its own. A consuming product connects its backend in one place, the data adapter, which is product code behind an interface that the template defines (`cpt-frontx-dashboard-adr-data-adapter`). A consuming product can connect its backend only if it knows exactly what each operation takes and returns, which obligations an implementation has, what the dashboard viewer sees for each outcome, and how to check that its data adapter conforms. DESIGN section 3.3 (`cpt-frontx-dashboard-interface-data-adapter`) states this interface at architecture level; this feature is its exact specification, and it specifies the PRD contract `cpt-frontx-dashboard-contract-consuming-backend`. How the domain owners call the data adapter belongs to `cpt-frontx-dashboard-feature-extension-domain-catalog`; this feature uses those calls as the call side of the contract.

**Requirements**: `cpt-frontx-dashboard-fr-data-adapter`, `cpt-frontx-dashboard-fr-backend-source`, `cpt-frontx-dashboard-fr-loading-error-states`, `cpt-frontx-dashboard-fr-domain-model`, `cpt-frontx-dashboard-fr-widget-modal`, `cpt-frontx-dashboard-fr-grid-sort-page`, `cpt-frontx-dashboard-nfr-initial-render`, `cpt-frontx-dashboard-nfr-consumer-docs`

**Principles**: `cpt-frontx-dashboard-principle-render-only-dashboards-root`, `cpt-frontx-dashboard-principle-dashboards-root-orchestration`, `cpt-frontx-dashboard-principle-gts-contracts`

**Constraints**: `cpt-frontx-dashboard-constraint-gts-id-convention`

### 1.3 Actors

| Actor | Role in Feature |
|-------|-----------------|
| `cpt-frontx-dashboard-actor-dashboard-viewer` | Opens a dashboard, sees its loader, data, empty and cannot-show states, and changes the query of a widget, for example by sorting or paging a grid. |
| `cpt-frontx-dashboard-actor-consuming-backend` | Is reached only by the data adapter; its errors, access checks and session belong to the data adapter. |
| `cpt-frontx-dashboard-actor-template-consumer` | Implements the data adapter, delivers the dataset types and vocabulary with each dashboard, and runs the conformance cases against the data adapter. |

### 1.4 References

- **PRD**: [PRD.md](../../PRD.md)
- **Design**: [DESIGN.md](../../DESIGN.md) section 3.2 (Data Adapter), section 3.3 (Data Adapter Interface; Trait Helper Interface `cpt-frontx-dashboard-interface-trait-helper`), section 3.6 (Initial Load and Viewing; Query Change; Cannot-Show States), section 3.9 (Test data adapter; Initial render), section 4 (prerequisite (d); handoff to this feature)
- **ADRs**: [ADR-0011](../../ADR/0011-data-adapter-v1.md) (`cpt-frontx-dashboard-adr-data-adapter`: owner of the interface, the data adapter duties, the served query families, the two cannot-show levels and data that never arrives), [ADR-0012](../../ADR/0012-query-vocabulary-and-datasets-v1.md) (the query format, the complete result of a query without `limit`, the default order, `timezone`; datasets and vocabulary instances are delivered with the dashboard and registered before validation), [ADR-0009](../../ADR/0009-subject-agnostic-widget-catalog-v1.md) (the five fill modes), [ADR-0007](../../ADR/0007-extension-domain-taxonomy-v1.md) (`set_data` is its own actions chain), [ADR-0003](../../ADR/0003-shared-data-types-and-schemas-v1.md) (combined ids; the trait helper; registry access per owner runtime)
- **Dependencies**: [feature-dashboard-root-types](../feature-dashboard-root-types/FEATURE.md) (the dashboard that "get a dashboard" returns; the rule for the delivery set and its registration before validation; the dashboard-level cannot-show triggers), [feature-extension-domain-catalog](../feature-extension-domain-catalog/FEATURE.md) (the calls of the dashboards root and of the larger-view modal to the data adapter; the `request_data` and `set_data` actions; the placeholder), [feature-widget-data-catalog](../feature-widget-data-catalog/FEATURE.md) (the data shapes that "run a query" returns and the exact rule of each fill mode), [feature-query-vocabulary](../feature-query-vocabulary/FEATURE.md) (the query that "run a query" carries; the query families and datasets)
- **Related**: [feature-widget-catalog](../feature-widget-catalog/FEATURE.md) (the traits `data_shape` and `fill` of the widget types, and the wording of the loader, busy, empty and cannot-show states); [feature-mfe-entries](../feature-mfe-entries/FEATURE.md) (the `dashboard` package that holds the data adapter interface)

## 2. Actor Flows (CDSL)

**Use cases**: `cpt-frontx-dashboard-usecase-view-dashboard`, `cpt-frontx-dashboard-usecase-provide-dashboard`

The consumer's steps are the product-owned implementation of the algorithms of section 3 and the cases of section 7, so no consumer flow is authored; the two flows below are the template-side view of the dashboard viewer.

### Open a Dashboard

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-flow-data-adapter-contract-open-dashboard`

**Actor**: `cpt-frontx-dashboard-actor-dashboard-viewer`

**Success Scenarios**:
- The data adapter returns the dashboard with its delivery set; the domain owner registers the delivery set, validates the dashboard, and mounts every cell; every data widget sends one `request_data` and renders the data instance that the data adapter returns, or its empty state when the data has no rows.

**Error Scenarios**:
- The data adapter returns no dashboard: the dashboard area keeps its loader, with no error message.
- A dashboard-level trigger of `cpt-frontx-dashboard-feature-dashboard-root-types` occurs: one "cannot be shown" placeholder in place of the dashboard.
- A data widget's query family is not served, including a delivered dataset type of that family that the owner skips instead of registering: the placeholder in that cell only; the other cells are unaffected.
- The data adapter never answers a `request_data`, answers with another data shape than the requested one, or answers with an instance that violates its own named shape: that widget keeps its loader, with no error message, and the other widgets are unaffected.

**Steps**:
1. [ ] - `p1` - Dashboard viewer opens the dashboard address - `inst-open-screen`
2. [ ] - `p1` - Dashboards root shows a loader in place of the dashboard - `inst-show-dashboard-loader`
3. [ ] - `p1` - Algorithm: get the dashboard from the data adapter using `cpt-frontx-dashboard-algo-data-adapter-contract-get-dashboard` - `inst-get-dashboard`
4. [ ] - `p1` - **IF** the data adapter returns no dashboard - `inst-if-no-dashboard`
   1. [ ] - `p1` - The dashboard area keeps its loader; no error message is shown and no timeout applies (section 6.5) - `inst-keep-dashboard-loader`
   2. [ ] - `p1` - **RETURN** the dashboard area in the loading state - `inst-return-dashboard-loading`
5. [ ] - `p1` - Dashboards root registers the delivery set before it validates the dashboard, under the rule of `cpt-frontx-dashboard-feature-dashboard-root-types` - `inst-register-delivery`
6. [ ] - `p1` - **IF** a dashboard-level trigger of `cpt-frontx-dashboard-feature-dashboard-root-types` occurs - `inst-if-dashboard-cannot-show`
   1. [ ] - `p1` - Dashboards root shows one "cannot be shown" placeholder in place of the dashboard and mounts no cells - `inst-show-dashboard-placeholder`
   2. [ ] - `p1` - **RETURN** the dashboard area in the cannot-show state - `inst-return-dashboard-cannot-show`
7. [ ] - `p1` - **FOR EACH** data widget of the dashboard, on its own - `inst-for-each-data-widget`
   1. [ ] - `p1` - Algorithm: check that the data adapter serves the widget's query family using `cpt-frontx-dashboard-algo-data-adapter-contract-check-served-family` - `inst-check-family`
   2. [ ] - `p1` - **IF** the query family is not served, the cell shows the "cannot be shown" placeholder, and the widget sends no `request_data` - `inst-show-unserved-placeholder`
8. [ ] - `p1` - Dashboards root mounts each remaining cell widget and sends it `set_widget_context` (`cpt-frontx-dashboard-feature-extension-domain-catalog`) - `inst-mount-cells`
9. [ ] - `p1` - **FOR EACH** mounted data widget, in parallel and independently - `inst-for-each-mounted-widget`
   1. [ ] - `p1` - Widget shows its loader and sends one `request_data` to the extension domain it sits in, with the query it received, `data_shape`, `fill`, `reply_to` and a `timestamp` - `inst-send-request-data`
   2. [ ] - `p1` - Dashboards root accepts the request and its handler resolves; it hands the request to the data adapter unchanged - `inst-accept-request-data`
   3. [ ] - `p1` - Algorithm: run the query using `cpt-frontx-dashboard-algo-data-adapter-contract-run-query` - `inst-run-query`
   4. [ ] - `p1` - **IF** the data adapter never answers, the widget keeps its loader - `inst-keep-widget-loader`
   5. [ ] - `p1` - Dashboards root compares the shape that the returned data instance's `id` names with the request's `data_shape` and drops a mismatch before `set_data` (`cpt-frontx-dashboard-feature-extension-domain-catalog`) - `inst-compare-shape`
   6. [ ] - `p1` - **IF** the shape is dropped, or FrontX rejects the `set_data` because the instance violates its own named shape, the widget keeps its loader - `inst-set-data-rejected`
   7. [ ] - `p1` - Dashboards root sends `set_data` with the returned data instance and the copied `timestamp` to `reply_to`, as its own actions chain; FrontX validates the action against the data shape that the data instance's `id` names - `inst-send-set-data`
   8. [ ] - `p1` - **IF** the `timestamp` equals that of the widget's latest request and the data has rows, the widget renders the data - `inst-render-data`
   9. [ ] - `p1` - **IF** the `timestamp` equals that of the widget's latest request and the data has no rows, the widget shows its widget type's empty state - `inst-render-empty`
10. [ ] - `p1` - **RETURN** the dashboard rendered; a `markdown_card` was rendered right after `set_widget_context` and sent no `request_data` - `inst-return-dashboard-rendered`

### Change a Query

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-flow-data-adapter-contract-change-query`

**Actor**: `cpt-frontx-dashboard-actor-dashboard-viewer`

**Success Scenarios**:
- The dashboard viewer sorts a grid by a column, goes to another page, or picks another page size; the grid sends one new `request_data`, keeps its rows under a busy indicator, and shows the rows of the answer to its latest request.
- The same holds for a grid in the larger view, where the larger-view modal is the domain owner.

**Error Scenarios**:
- The data adapter never answers the new request, or the answer is dropped or rejected: the grid keeps its current rows under the busy indicator, with no error message.
- A late answer to an older request arrives: the grid drops it.

**Steps**:
1. [ ] - `p1` - Dashboard viewer sorts by a sortable column, goes to a page, or picks a page size - `inst-change-query-input`
2. [ ] - `p1` - Widget updates its local copy of the query (`order`, `limit`, `offset`), which is never saved, and shows a busy indicator over its current rows - `inst-update-local-query`
3. [ ] - `p1` - Widget sends `request_data` with the changed query and a new `timestamp` - `inst-send-changed-request`
4. [ ] - `p1` - Domain owner accepts the request and hands it to the data adapter unchanged - `inst-owner-accepts`
5. [ ] - `p1` - Algorithm: run the changed query using `cpt-frontx-dashboard-algo-data-adapter-contract-run-query`; the data adapter keeps nothing between calls - `inst-run-changed-query`
6. [ ] - `p1` - Domain owner sends `set_data` with the returned data instance and the copied `timestamp` as its own actions chain - `inst-send-changed-set-data`
7. [ ] - `p1` - **IF** the `timestamp` equals that of the widget's latest request, the widget renders the new rows and removes the busy indicator - `inst-apply-answer`
8. [ ] - `p1` - **ELSE** the widget drops the answer - `inst-drop-answer`
9. [ ] - `p1` - **IF** the dashboard viewer changes only a presentation field, such as the width of a grid column, the widget redraws locally and sends no request - `inst-presentation-only`
10. [ ] - `p1` - **RETURN** the widget with the rows of its latest query - `inst-return-query-changed`

## 3. Processes / Business Logic (CDSL)

### Get a Dashboard

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-algo-data-adapter-contract-get-dashboard`

**Input**: A dashboard id, from the address that names the dashboard. The dashboards root calls "get a dashboard" when it loads a dashboard, and the larger-view modal calls it when it has not loaded that dashboard.

**Output**: The dashboard instance with its delivery set (the dataset types and the measure and dimension instances that it uses); or nothing.

**Steps**:
1. [ ] - `p1` - The data adapter reads the dashboard id and asks its own backend for the dashboard; requests, errors, access checks and the session are its own - `inst-adapter-asks-backend`
2. [ ] - `p1` - **IF** the backend cannot provide the dashboard, for any reason, the data adapter does the following: **RETURN** nothing - `inst-adapter-returns-nothing`
3. [ ] - `p1` - The data adapter builds one instance of the Dashboard type of `cpt-frontx-dashboard-feature-dashboard-root-types`, with no widget data - `inst-build-dashboard`
4. [ ] - `p1` - The data adapter collects the delivery set: the dataset types and the measure and dimension instances that the dashboard uses; each one that has new content has a new version id (section 6.4) - `inst-collect-delivery-set`
5. [ ] - `p1` - **RETURN** the dashboard together with its delivery set - `inst-return-dashboard`

### Check the Served Query Family

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-algo-data-adapter-contract-check-served-family`

**Input**: One data widget with its query; the query families that the data adapter declared, whose type schemas the domain owner registered at start. The dashboards root checks every data widget it shows, and the larger-view modal checks the larger-view widgets.

**Output**: Served, or not served.

**Steps**:
1. [ ] - `p1` - Read the query family from the type chain of the widget's query `id`: the type between the base query type and the dataset type - `inst-read-family`
2. [ ] - `p1` - **IF** the query family is among the registered served query families **RETURN** served - `inst-return-served`
3. [ ] - `p1` - **RETURN** not served (this includes a widget whose query names a dataset type that the owner skipped at registration, because the parent schema of its family is not registered); the domain owner shows the "cannot be shown" placeholder in that cell, or in the modal for a larger-view widget, and writes a diagnostic naming the query family for the developer - `inst-return-not-served`

### Run a Query

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-algo-data-adapter-contract-run-query`

**Input**: One `request_data` payload, unchanged: `data` (the query, with the `timezone` that the widget set), `data_shape`, `fill`, `reply_to` and `timestamp`. The domain owner that accepted the request calls the data adapter after its handler has resolved.

**Output**: One instance of the requested data shape, filled by the requested fill mode, with a combined `id`; or no answer.

**Steps**:
1. [ ] - `p1` - Read the binding traits of the dataset that the query `id` names, with the trait helper (`cpt-frontx-dashboard-interface-trait-helper`), which the data adapter calls through the registry access of its owner runtime; the template gives the binding no meaning - `inst-read-binding`
2. [ ] - `p1` - Map each member id of the query to a backend member name through those binding traits, and drop the template-only `id` - `inst-map-members`
3. [ ] - `p1` - Resolve dates and relative date strings in the `timezone` that the widget set, and pass `timezone` through to a backend that understands it; relative dates resolve against the current time, and when the adapter rounds the current time, identical queries with the same `timezone` give identical backend requests - `inst-resolve-dates`
4. [ ] - `p1` - **IF** `order` is absent, apply the default order: the time dimension ascending when it has a granularity, else the first measure descending, else the first dimension ascending; **IF** `order` is `[]`, apply no order - `inst-apply-order`
5. [ ] - `p1` - Ask the product backend for the result of the query, using the binding; **IF** the query has no `limit`, ask for the complete result and read past any row limit of the backend, for example by paging; **IF** the adapter pages past a backend's row limit, add the remaining result columns, ascending, after the query's own order as a tiebreak, so that pages neither repeat nor drop rows, while the order the widget sees stays the query's; the data adapter may group this call with the calls of other widgets and may cache identical requests - `inst-ask-backend`
6. [ ] - `p1` - **IF** the backend cannot provide the result, for any reason, the data adapter does the following: **RETURN** no answer - `inst-no-answer`
7. [ ] - `p1` - Obtain the totals and the count that the fill mode needs: the query-grain total of each measure (`row_per_measure`, `scalar_with_series`), the range-2 values when the query has `compareDateRange`, and, when `total: true`, the row count of the query ignoring `limit` and `offset`; take each value from the backend, or derive it locally over a complete result only for a measure that the binding declares re-aggregatable and for the row count; **IF** a needed value of a measure that is not declared re-aggregatable cannot be obtained at the needed grain, or on any other failure, **RETURN** no answer - `inst-obtain-totals`
8. [ ] - `p1` - Execute locally, only when needed, grouping, filtering, ordering or paging, and only over a complete, unpaged backend result; never slice a result that is already paged or limited. Aggregate locally only measures that the product's binding declares re-aggregatable from grouped values; the meaning and vocabulary of that declaration are the product's; take every other total from the backend at the query's grain - `inst-execute-locally`
9. [ ] - `p1` - Fill the data shape named by `data_shape` with the fill mode named by `fill`, passing it the query, the grouped result, and the totals, count and range-2 values of the previous step; for `rows_by_member`, its fields; the exact rule of each mode is in `cpt-frontx-dashboard-feature-widget-data-catalog`; a measure value may be null - `inst-fill-shape`
10. [ ] - `p1` - Generate a UUID and set the `id` of the data instance to the data shape type followed by that UUID - `inst-generate-data-id`
11. [ ] - `p1` - **RETURN** the data instance; each data instance is an independent snapshot of the moment the data adapter fills it - `inst-return-data-instance`

## 4. States (CDSL)

### Dashboard Area State Machine

The states of the dashboard area (Idle, Started, Loading, Loaded, Placeholder) and their transitions are owned by `cpt-frontx-dashboard-state-extension-domain-catalog-owner`; this feature defines no machine of its own. The dashboard-level triggers that lead from Loading to Placeholder are owned by `cpt-frontx-dashboard-feature-dashboard-root-types`. The data adapter sees only two outcomes: when it returns a dashboard, the area leaves Loading; when it returns no dashboard, the area stays in Loading, with no error message and no timeout. The same holds for the larger-view modal for the dashboard that it loads.

The widget-side states of a data widget are `cpt-frontx-dashboard-state-widget-catalog-data-widget`; this feature adds only the outcomes on the adapter side. When the data adapter answers and the owner sends `set_data` for the answer of the widget's latest request, the widget leaves its loader as that state machine defines. When the data adapter gives no answer, the widget keeps its loader (or, on a repeated request, its busy indicator with its current rows), with no error message. An answer that the owner drops for another shape, or that FrontX rejects, counts as an answer that never arrives. A widget whose query family is not served shows the cannot-show placeholder from the start (`cpt-frontx-dashboard-seq-cannot-show`).

## 5. Definitions of Done

### Data Adapter Operations

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-dod-data-adapter-contract-operations`

The data adapter interface in the `dashboard` package **MUST** have the operations "get a dashboard" and "run a query" and the declaration of the served query families, which returns the family type schemas, as section 6.1 and section 6.2 state. "Get a dashboard" **MUST** return the dashboard with its delivery set, and "run a query" **MUST** return one instance of the requested data shape, whose measure values may be null, with a combined `id` that ends in a UUID that the data adapter generates. The dashboards root and the larger-view modal **MUST** call the data adapter for every dashboard and every query, and template code **MUST** make no backend call of its own. The interface **MUST** hand the data adapter the registry access of its owner runtime (get schema), or a trait helper bound to it, with no global singleton.

**Implements**:
- `cpt-frontx-dashboard-flow-data-adapter-contract-open-dashboard`
- `cpt-frontx-dashboard-flow-data-adapter-contract-change-query`
- `cpt-frontx-dashboard-algo-data-adapter-contract-get-dashboard`
- `cpt-frontx-dashboard-algo-data-adapter-contract-run-query`

**Covers (PRD)**:
- `cpt-frontx-dashboard-fr-data-adapter`
- `cpt-frontx-dashboard-fr-backend-source`
- `cpt-frontx-dashboard-fr-domain-model`
- `cpt-frontx-dashboard-fr-widget-modal`
- `cpt-frontx-dashboard-fr-grid-sort-page`
- `cpt-frontx-dashboard-contract-consuming-backend`
- `cpt-frontx-dashboard-usecase-view-dashboard`

**Covers (DESIGN)**:
- `cpt-frontx-dashboard-interface-data-adapter`
- `cpt-frontx-dashboard-interface-domain-model`
- `cpt-frontx-dashboard-adr-data-adapter`
- `cpt-frontx-dashboard-component-data-adapter`
- `cpt-frontx-dashboard-component-dashboards-root`
- `cpt-frontx-dashboard-component-larger-view-modal`
- `cpt-frontx-dashboard-principle-render-only-dashboards-root`
- `cpt-frontx-dashboard-principle-dashboards-root-orchestration`
- `cpt-frontx-dashboard-principle-gts-contracts`
- `cpt-frontx-dashboard-seq-initial-load`
- `cpt-frontx-dashboard-seq-query-change`
- `cpt-frontx-dashboard-seq-widget-modal-open`
- `cpt-frontx-dashboard-seq-larger-view-refresh`

**Constraints**: `cpt-frontx-dashboard-constraint-gts-id-convention`

**Touches**:
- API: `cpt-frontx-dashboard-interface-data-adapter`, called in the runtime of the dashboards root and of the larger-view modal
- DB: none (the template persists nothing)
- Entities: Dashboard, Query, Data shape

### Fill-Mode Obligations

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-dod-data-adapter-contract-fill-modes`

An implementation of the data adapter **MUST** implement all 5 fill modes, `rows_by_member`, `x_series_value`, `row_per_measure`, `positional_table` and `scalar_with_series`, so that it fills any data shape for any query family it serves, with no code per widget, dataset or dashboard. It **MUST** map member ids to backend member names through the binding traits of the dataset and drop `id`, resolve dates in the query's `timezone` and pass it through to a backend that understands it, apply the default order when `order` is absent and no order for `[]`, answer a query without `limit` with the complete result, execute locally only over a complete, unpaged backend result, aggregate locally only measures that the product's binding declares re-aggregatable from grouped values, and **MUST** answer every call. A new fill mode is a change of the template that every data adapter then implements once. A new backend or endpoint family is a new query family type, which is data adapter work.

**Implements**:
- `cpt-frontx-dashboard-algo-data-adapter-contract-run-query`
- `cpt-frontx-dashboard-flow-data-adapter-contract-change-query`

**Covers (PRD)**:
- `cpt-frontx-dashboard-fr-data-adapter`
- `cpt-frontx-dashboard-fr-grid-sort-page`
- `cpt-frontx-dashboard-contract-consuming-backend`

**Covers (DESIGN)**:
- `cpt-frontx-dashboard-interface-data-adapter`
- `cpt-frontx-dashboard-adr-data-adapter`
- `cpt-frontx-dashboard-adr-subject-agnostic-widget-catalog`
- `cpt-frontx-dashboard-component-data-adapter`
- `cpt-frontx-dashboard-seq-query-change`

**Touches**:
- API: "run a query" of `cpt-frontx-dashboard-interface-data-adapter`
- DB: none (the template persists nothing)
- Entities: Query, Data shape

### Delivery with the Dashboard

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-dod-data-adapter-contract-delivery`

"Get a dashboard" **MUST** return the delivery set together with the dashboard. The content of the delivery set and the rules for its skip, registration and version ids are in `cpt-frontx-dashboard-feature-dashboard-root-types`; the adapter's obligation is to return it.

**Implements**:
- `cpt-frontx-dashboard-algo-data-adapter-contract-get-dashboard`
- `cpt-frontx-dashboard-flow-data-adapter-contract-open-dashboard`
- `cpt-frontx-dashboard-state-extension-domain-catalog-owner`

**Covers (PRD)**:
- `cpt-frontx-dashboard-fr-data-adapter`
- `cpt-frontx-dashboard-fr-domain-model`
- `cpt-frontx-dashboard-usecase-provide-dashboard`

**Covers (DESIGN)**:
- `cpt-frontx-dashboard-interface-data-adapter`
- `cpt-frontx-dashboard-adr-query-vocabulary-and-datasets`
- `cpt-frontx-dashboard-component-data-adapter`
- `cpt-frontx-dashboard-seq-initial-load`

**Constraints**: `cpt-frontx-dashboard-constraint-gts-id-convention`

**Touches**:
- API: "get a dashboard" of `cpt-frontx-dashboard-interface-data-adapter`
- DB: none (the template persists nothing)
- Entities: Dashboard, Query

### Cannot-Show Triggers and Data That Never Arrives

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-dod-data-adapter-contract-cannot-show`

The data adapter declares the query families it serves, and the domain owners **MUST** register the family type schemas that the declaration returns at start and check every data widget against them at dashboard load: a data widget whose query family is not served **MUST** show the cannot-show placeholder in its own cell or larger view only. Data that never arrives **MUST NOT** be a cannot-show trigger: when the data adapter returns no dashboard, the dashboard area **MUST** keep its loader, and when it never answers a `request_data`, or its answer is dropped or rejected, that widget **MUST** keep its loader, with no error message and no timeout. The consumer guide **MUST** state this limitation and its risk. The handler rule for slow data adapters is in `cpt-frontx-dashboard-feature-extension-domain-catalog`.

**Implements**:
- `cpt-frontx-dashboard-algo-data-adapter-contract-check-served-family`
- `cpt-frontx-dashboard-flow-data-adapter-contract-open-dashboard`
- `cpt-frontx-dashboard-state-extension-domain-catalog-owner`

**Covers (PRD)**:
- `cpt-frontx-dashboard-fr-loading-error-states`
- `cpt-frontx-dashboard-fr-data-adapter`
- `cpt-frontx-dashboard-usecase-view-dashboard`

**Covers (DESIGN)**:
- `cpt-frontx-dashboard-interface-data-adapter`
- `cpt-frontx-dashboard-adr-data-adapter`
- `cpt-frontx-dashboard-adr-extension-domain-taxonomy`
- `cpt-frontx-dashboard-component-data-adapter`
- `cpt-frontx-dashboard-seq-cannot-show`

**Touches**:
- API: the served query families of `cpt-frontx-dashboard-interface-data-adapter`
- DB: none (the template persists nothing)
- Entities: Query, Data shape

### Test Data Adapter

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-dod-data-adapter-contract-test-adapter`

The template **MUST** be tested with a test data adapter that names no backend. It **MUST** return the reference dashboard with its delivery set, fill every query from fixtures in memory by the requested fill mode, and answer "get a dashboard" and every "run a query" after the fixed delay of the reference conditions. The test data adapter is test tooling: it **MUST NOT** be part of the shipped `dashboard` package (section 6.6).

**Implements**:
- `cpt-frontx-dashboard-flow-data-adapter-contract-open-dashboard`
- `cpt-frontx-dashboard-algo-data-adapter-contract-run-query`

**Covers (PRD)**:
- `cpt-frontx-dashboard-nfr-initial-render`
- `cpt-frontx-dashboard-fr-data-adapter`

**Covers (DESIGN)**:
- `cpt-frontx-dashboard-interface-data-adapter`
- `cpt-frontx-dashboard-component-data-adapter`
- `cpt-frontx-dashboard-seq-initial-load`

**Touches**:
- API: `cpt-frontx-dashboard-interface-data-adapter`, implemented by the test data adapter
- DB: none (the template persists nothing)
- Entities: Dashboard, Query, Data shape

### Conformance Cases and Consumer Guide

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-dod-data-adapter-contract-conformance`

The consumer guide **MUST** present the data adapter obligations of section 6 and the conformance cases of section 7 as a topic, so that a developer who follows only the guide can write a data adapter that provides a dashboard with its delivery set, serves its query families, fills every data shape by the 5 fill modes, and knows that the data adapter owns backend errors, access and the session, and that data that never arrives keeps the loader. A consuming product **MUST** be able to run each consumer-run conformance case against its data adapter and the template; the template-run cases are run by the template's own tests.

**Implements**:
- `cpt-frontx-dashboard-flow-data-adapter-contract-open-dashboard`
- `cpt-frontx-dashboard-flow-data-adapter-contract-change-query`

**Covers (PRD)**:
- `cpt-frontx-dashboard-nfr-consumer-docs`
- `cpt-frontx-dashboard-fr-data-adapter`
- `cpt-frontx-dashboard-contract-consuming-backend`
- `cpt-frontx-dashboard-usecase-provide-dashboard`

**Covers (DESIGN)**:
- `cpt-frontx-dashboard-interface-data-adapter`
- `cpt-frontx-dashboard-component-data-adapter`

**Touches**:
- API: `cpt-frontx-dashboard-interface-data-adapter`
- DB: none (the template persists nothing)
- Entities: Dashboard, Query, Data shape

## 6. Data Adapter Contract

The consuming product implements this contract; the template only calls it. The data adapter is product code in the product's copy of the template, behind an interface that the template defines in the `dashboard` package. It is not a FrontX extension: it has no MFE entry, no extension and no extension domain. One data adapter serves every widget of every dashboard, in the dashboards root and in the larger-view modal, and a copy of it runs in the runtime of each. The interface is template code, not a GTS type, but every value it takes and returns is GTS-typed, so FrontX validates it like any other action payload. Every instance identifier carries its type chain (GTS 0.17), and a data instance identifier is the data shape type followed by a UUID that the data adapter generates.

**Out of scope.** Access to dashboards and data, backend errors, the session, limits, and dashboard and data size belong to the consuming product. The implementation of the data adapter is product code and belongs to no feature. The shapes of the dashboard, the query and the data, and the content and registration order of the delivery set, are declared by `cpt-frontx-dashboard-feature-dashboard-root-types`, `cpt-frontx-dashboard-feature-query-vocabulary` and `cpt-frontx-dashboard-feature-widget-data-catalog`; the exact fill-mode rules belong to the last of these. The traits `data_shape` and `fill` of the widget types belong to `cpt-frontx-dashboard-feature-widget-catalog`. The processes by which the domain owners call the data adapter, register generated extensions and show the placeholder belong to `cpt-frontx-dashboard-feature-extension-domain-catalog`. The checks that a consuming product runs before it serves a dashboard, and the generation of dashboards, belong to the consuming product. Versioning of the interface beyond the stability classes of DESIGN section 3.3 is not covered. Observability and logging: not applicable, because the diagnostics are for developers and there is no log or metric contract. Data protection and privacy: not applicable, because the template stores nothing; privacy follows the PRD exclusions. Audit and data lifecycle: not applicable, because nothing is persisted. Accessibility of the states: governed by `cpt-frontx-dashboard-nfr-accessibility` and the widget chrome of `cpt-frontx-dashboard-feature-widget-catalog`. Operations and rollout: not applicable, because the template is a source package with no service of its own. Security: the dashboard id from the address is untrusted input to the data adapter, and authorization is the data adapter's. Compliance: not applicable, because the contract carries no regulated data of its own. Business rules: not applicable, because the contract has none beyond the obligations below.

### 6.1 Operations

| Operation | Input | Output | Called by |
|-----------|-------|--------|-----------|
| Get a dashboard | A dashboard id. | The dashboard instance, the dataset types it uses, and the measure and dimension instances it uses. | The dashboards root when it loads a dashboard; the larger-view modal when it has not loaded that dashboard. |
| Run a query | One `request_data` payload, unchanged: `data` (the query), `data_shape`, `fill`, `reply_to`, `timestamp`. | One instance of the requested data shape, filled by the requested fill mode, with a combined `id` that ends in a UUID that the data adapter generates. | The owner of the extension domain that received the request: the dashboards root for `layout_cells`, the larger-view modal for `larger_view`. |
| Served query families | None. | The query family type schemas that the data adapter serves; each carries its type id. | The dashboards root and the larger-view modal, at start. |

The dashboard that "get a dashboard" returns is one instance of the Dashboard type of `cpt-frontx-dashboard-feature-dashboard-root-types`. It carries no widget data and no theme. The query that "run a query" carries is the widget's own query, typed by a dataset of the query vocabulary (`cpt-frontx-dashboard-feature-query-vocabulary`), with the `timezone` that the widget set to the viewer's time zone. The data instance is one instance of a data shape of `cpt-frontx-dashboard-feature-widget-data-catalog`; it carries a combined `id`, its measure values may be null, and FrontX validates the `set_data` action against the data shape that this `id` names. Before `set_data`, the owner compares the shape that the `id` names with the `data_shape` of the request and drops a mismatch (`cpt-frontx-dashboard-feature-extension-domain-catalog`).

**Registry access.** The interface hands the data adapter the registry access of its owner runtime (get schema), or a trait helper bound to it. There is one per owner runtime, the dashboards root's and the larger-view modal's, and no global singleton, because FrontX isolates each MFE instance (`cpt-frontx-dashboard-principle-per-instance-isolation`). The data adapter calls the trait helper (`cpt-frontx-dashboard-interface-trait-helper`) and does not implement it; the shared call side is owned by `cpt-frontx-dashboard-feature-query-vocabulary`.

The data adapter sees only the request. It never sees the presentation fields of a widget, and it keeps nothing between two calls: each `request_data` is self-contained.

**Asynchronous answers.** A call to "run a query" is asynchronous. The `request_data` handler of the domain owner resolves on acceptance (`cpt-frontx-dashboard-feature-extension-domain-catalog`) and has already resolved when it calls the data adapter, and the owner sends `set_data` as its own actions chain (ADR-0007). While one widget waits for its answer, the owner keeps answering the others. The first request of a widget carries the query as the dashboard defines it. A widget sends a new request whenever an interaction changes its query, such as sorting, paging or a new page size. An interaction that changes only presentation fields sends no request.

**Consistency.** Each data instance is an independent snapshot of the moment the data adapter fills it. There is no consistency guarantee across widgets. The dashboards root and the larger-view modal call the data adapter separately, each in its own runtime, so a cell and its larger view may each cause a backend call and may show different values.

### 6.2 Served Query Families

A query family is a product query type that groups the product's datasets by how they bind to its backend; it derives from the base query type, and a dataset derives from it (`cpt-frontx-dashboard-feature-query-vocabulary`). The data adapter declares the query families it serves and returns their type schemas.

The dashboards root and the larger-view modal register the family type schemas that the declaration returns when they start. At dashboard load, each of them checks every data widget it shows (`cpt-frontx-dashboard-algo-data-adapter-contract-check-served-family`): the widget's query family is found in the type chain of the widget's query `id`. A data widget whose query family is not served shows the cannot-show placeholder in its own cell, or in the modal for a larger-view widget, and sends no `request_data`. The other widgets are unaffected. A widget type without data, such as `markdown_card`, has no query family and is not checked.

### 6.3 Obligations of an Implementation

- **All 5 fill modes.** The data adapter implements `rows_by_member`, `x_series_value`, `row_per_measure`, `positional_table` and `scalar_with_series`, so it fills any data shape for any query family it serves. The exact rule of each mode is in `cpt-frontx-dashboard-feature-widget-data-catalog`. A widget type that reuses a mode needs no data adapter code, and a new mode is a template change that every data adapter implements once.
- **Delivery.** It returns the delivery set with the dashboard (section 6.4).
- **Query format.** It reads each query as the query format of `cpt-frontx-dashboard-adr-query-vocabulary-and-datasets` defines it. Filter `values` and `timezone` are data; it never interprets them as query text.
- **Binding and members.** It reads the binding traits of a dataset from the type traits of the dataset type, with the trait helper that it calls (section 6.1); the template gives the binding no meaning. It maps each member id to a backend member name through those traits and drops the template-only `id`.
- **Time zone.** It resolves dates and relative date strings in the `timezone` that the widget set, and passes `timezone` through to a backend that understands it. Relative dates resolve against the current time. When it rounds the current time, for example to the minute, identical queries with the same `timezone` give identical backend requests, and a cache can absorb them.
- **Order.** When `order` is absent, it applies the default order of the query format. An empty `order` asks for no order.
- **Complete results.** A query without `limit` asks for the complete result. It answers with the complete result and reads past any row limit of its backend, for example by paging. When it pages past a row limit, it adds the remaining result columns, ascending, after the query's own order as a tiebreak, so that pages neither repeat nor drop rows. The order the widget sees stays the query's.
- **Local execution.** It may group, filter, order or page locally only over a complete, unpaged backend result, and never over a result that is already paged or limited. It aggregates locally only measures that its product's binding declares re-aggregatable from grouped values; the meaning and vocabulary of that declaration are the product's. It takes every other total from the backend at the query's grain. When a needed value of a measure that is not declared re-aggregatable cannot be obtained at the needed grain, it gives no answer, and a product does not offer that measure at that grain in a dataset. The row count may be derived locally over a complete result.

  Local execution follows these rules. Where the query format's published semantics state a behavior, they apply; the template rule fills only what they leave open.

  | Subject | Rule |
  |---|---|
  | `contains`, `notContains`, `startsWith`, `notStartsWith`, `endsWith`, `notEndsWith` | Compare without regard to case. |
  | `notContains` and the other `not...` string operators | Include rows whose value is null, unless `values` lists null (the published semantics). |
  | `notEquals` | Excludes rows whose value is null (template rule). |
  | Grouping | Null forms its own group (template rule). |
  | Ordering | Nulls sort after all values, in both directions (template rule). |
  | `gt`, `gte`, `lt`, `lte` | Compare the values as numbers (template rule). |
- **New query family.** A new backend or endpoint family is a new query family type. Serving it is data adapter work, not a template change.
- **Grouping and caching.** It may group the requests of several widgets into one backend call, and may cache identical requests.
- **An answer to every call.** It answers every call. Data that the domain owner never gets keeps the loader (section 6.5).
- **Valid data.** It returns data that matches the requested data shape, with null for a measure that has no value. Null dimension values stay null and are never an empty string. Time-dimension values are the canonical time value: the first day of the period per `granularity` as a `YYYY-MM-DD` date, in the query's `timezone`, with weeks starting on Monday. With `compareDateRange`, `value` comes from range 1 and `previous_value` from range 2, and the sparkline runs over range 1. Producing valid data is its responsibility, because an answer that the owner drops for another shape, or that FrontX rejects, counts as an answer that never arrives.
- **Grid rows.** For `positional_table`, every row has one entry for each result column, in the canonical member order, and `total` is at least `offset` plus the number of rows returned. When `total: true`, `total` is the row count of the query ignoring `limit` and `offset`.
- **Ownership.** It owns backend errors, access checks (not found, not permitted) and the session. The template shows no error message for them, and has nothing to classify or to time.
- **Viewer access.** It lets every dashboard viewer who may see a dashboard get the data of its widgets (DESIGN section 4, prerequisite (d)). Without it, a viewer sees widgets that keep their loader, depending on what the data adapter does.

### 6.4 Delivery with the Dashboard

"Get a dashboard" returns the delivery set together with the dashboard. The content of the delivery set, its version ids, the skip of a dataset type of an unserved query family, and the registration order (measure and dimension instances before dataset types) are owned by `cpt-frontx-dashboard-feature-dashboard-root-types`, together with the outcome of a set that cannot be registered; the conformance cases of section 7.4 exercise that rule. The only obligation of the data adapter is to return the delivery set. A new dataset, a new dashboard or a new template widget type that reuses a fill mode needs no new data adapter code: it is data that the existing data adapter delivers and serves. A new backend or endpoint family is a new query family type, handled in the data adapter (section 6.3).

### 6.5 Results and What the Dashboard Viewer Sees

The user in this table is the dashboard viewer. The domain owners detect the dashboard-level and unknown-larger-view-id triggers (`cpt-frontx-dashboard-feature-dashboard-root-types`, `cpt-frontx-dashboard-feature-extension-domain-catalog`); on the adapter side, this feature owns the unserved query family and the data that never arrives.

| Result of the data adapter | Level | What the user sees |
|----------------------------|-------|--------------------|
| A data widget's query family is not served | Widget | The placeholder in that cell, or in the modal for a larger-view widget; the other cells are unaffected. The domain owner shows it and writes a diagnostic for the developer. |
| No dashboard is returned | Dashboard | The dashboard area keeps its loader; no error message. |
| No answer to a `request_data` | Widget | That widget keeps its loader; no error message. |
| An answer whose shape differs from the requested `data_shape` (dropped by the owner before `set_data`), or an instance that violates its own named shape (rejected by FrontX) | Widget | That widget keeps its loader; no error message. |

Valid data with no rows shows the widget type's empty state, which is not a cannot-show state. On a repeated request, a widget keeps its current data and shows a busy indicator. The wording of the loader, busy, empty and cannot-show states is specified in `cpt-frontx-dashboard-feature-widget-catalog`.

**Data that never arrives.** It is not a cannot-show trigger. The dashboard area or the widget keeps its loader, with no error message and no timeout. This is a stated limitation and a risk: the data adapter is responsible for answering, and for what the viewer sees when its backend fails, for example by returning no dashboard. The consumer guide states both.

### 6.6 Test Data Adapter

The test data adapter names no backend. It returns the reference dashboard of DESIGN section 3.9 with its dataset types and vocabulary instances, and fills every query from fixtures in memory by the requested fill mode. It answers "get a dashboard" and every "run a query" after a fixed delay of 250 ms, which is the data adapter response time of the initial-render reference conditions (provisional assumption, DESIGN section 3.9). The test data adapter is test tooling outside the shipped `dashboard` package; the template is complete without it. The conformance cases of section 7 use it, and a consuming product runs the same cases against its own data adapter.

## 7. Conformance Cases

Each case is a testable scenario in the form Given / When / Then. A consuming product runs them against its data adapter and the template; a case passes when every Then statement holds. Each case is tagged consumer-run, which a consuming product runs against its own data adapter, or template-run, which the template's own tests run with the test data adapter.

### 7.1 Operations

- [ ] **DA-A1 Get a dashboard once.** [consumer-run] Given an address that names dashboard `gts.frontx.dashboard_m.dashboard.dashboard.v1~3f2b8c1e-5d47-4a9e-9c61-2e8f0b7d4a15`, when the dashboard viewer opens it, then the dashboards root calls "get a dashboard" once with that id, and calls it no more after render.
- [ ] **DA-A2 Dashboard and delivery set.** [consumer-run] Given any dashboard that "get a dashboard" returns, when it is checked against section 6.1, then it is one instance of the Dashboard type, it carries no widget data and no theme, and it comes with the dataset types and the measure and dimension instances that it uses.
- [ ] **DA-A3 One request per data widget.** [consumer-run] Given a rendered dashboard with N data widgets, when each widget receives `set_widget_context`, then each widget sends exactly one `request_data` to `layout_cells`, the data adapter receives each request unchanged, and a `markdown_card` sends none.
- [ ] **DA-A4 Answer reaches the requester.** [consumer-run] Given a `request_data` with `reply_to` and `timestamp`, when the data adapter returns a data instance, then `set_data` reaches `reply_to` with the `timestamp` copied from the request, and the data instance's `id` is the data shape type followed by a UUID that the data adapter generated.
- [ ] **DA-A5 Larger view uses the same interface.** [consumer-run] Given a rendered widget, when the dashboard viewer opens its larger view, then the larger-view modal answers the `request_data` from `larger_view` through the same data adapter interface, and calls "get a dashboard" only when it has not loaded that dashboard.
- [ ] **DA-A6 Slow data adapter holds no chain.** [consumer-run] Given a data adapter that answers after a long delay, when a widget sends `request_data`, then the domain owner's handler resolves on acceptance, no action times out, and the other widgets are answered while this one waits.
- [ ] **DA-A7 Out-of-order answers.** [consumer-run] Given two requests of one widget and a data adapter that answers the older one last, when both answers arrive, then the widget shows the answer to its latest request and drops the older one.
- [ ] **DA-A8 No backend call by the template.** [template-run] Given the template packages, when they are checked, then no template package makes a backend call, no widget entry contains API-package code, and the data adapter interface is the only place where product code is called.

### 7.2 Served Query Families

- [ ] **DA-B1 Declaration read at start.** [consumer-run] Given a data adapter whose declaration returns the type schemas of two query families, when the dashboards root and the larger-view modal start, then each registers both schemas before any dashboard loads.
- [ ] **DA-B2 Unserved family.** [consumer-run] Given a dashboard with three data widgets, one of whose query family is not served, when the dashboards root loads it, then that cell shows the cannot-show placeholder, that widget sends no `request_data`, and the other widgets render their data.
- [ ] **DA-B3 Unserved family in the larger view.** [consumer-run] Given a larger-view widget whose query family is not served, when the dashboard viewer opens the larger view, then the modal shows the cannot-show placeholder and the cell is unaffected.
- [ ] **DA-B4 Served family.** [consumer-run] Given a data widget whose query family is served, when the dashboards root checks it, then it passes the check and the widget mounts.
- [ ] **DA-B5 Registry access per owner runtime.** [consumer-run] Given the dashboards root and the larger-view modal on one page, when each starts, then the interface hands each its own registry access (get schema), or a trait helper bound to it, and the data adapter uses no global singleton.

### 7.3 Fill Modes and Answers

- [ ] **DA-C1 All 5 fill modes.** [consumer-run] Given a data adapter and one query for each of the 8 data widget types, when each widget sends its `request_data`, then each answer is an instance of the data shape that the widget type names, produced by the fill mode that the widget type names, and FrontX accepts every `set_data`.
- [ ] **DA-C2 Another shape is dropped.** [consumer-run] Given a `request_data` for the shape of one widget type and an answer of another widget type's shape, when the owner receives the answer, then it drops the answer before `set_data` (`cpt-frontx-dashboard-feature-extension-domain-catalog`) and the widget keeps its loader.
- [ ] **DA-C3 Fill-mode fields.** [consumer-run] Given fixture results, when each fill mode runs, then it produces the fields of its data shape, including an omitted field in `rows_by_member`, a null measure value kept as null, several measures in `x_series_value`, `total` in `positional_table`, and `previous_value` and `sparkline` in `scalar_with_series`.
- [ ] **DA-C4 Dates in the query's time zone.** [consumer-run] Given a query that carries `timezone` and a date filter written as dates, and a query with a relative date string, when the data adapter runs them, then the dates resolve in that `timezone`, and the relative date resolves against the current time.
- [ ] **DA-C5 Identical queries.** [consumer-run] Given an adapter that rounds the current time and two identical queries, ignoring their UUIDs and with the same `timezone`, sent at nearly the same time, when the data adapter runs them, then it gives identical backend requests, so that a cache can absorb the second one.
- [ ] **DA-C6 Grid sort and page.** [consumer-run] Given a grid, when the dashboard viewer sorts a column, goes to another page, and picks another page size, then each change sends exactly one new `request_data` with the changed `order` (a list of `[member, "asc"|"desc"]` pairs), `limit` or `offset`, the grid keeps its rows under a busy indicator until the answer arrives, and resizing a column sends none.
- [ ] **DA-C7 Empty result.** [consumer-run] Given an answer that FrontX accepts and whose data has no rows, when the widget applies it, then the widget shows its widget type's empty state, not a cannot-show state.
- [ ] **DA-C8 Independent snapshots.** [consumer-run] Given a rendered widget whose backend data changes before its larger view opens, when the larger view's own request is answered, then the larger view shows the new values and the cell keeps the values it received.
- [ ] **DA-C9 Viewer access.** [consumer-run] Given a dashboard viewer who may see a dashboard, when every data widget of that dashboard sends its request under that viewer's session, then the data adapter answers every one of them.
- [ ] **DA-C10 Grid row entries and total.** [consumer-run] Given a `grid` query with `limit`, `offset` and `total`, when the data adapter answers, then every row has one entry for each result column, in the canonical member order, and `total` is at least `offset` plus the number of rows returned. With `total: true` and a fixture with a known row count, `total` equals that count. A `grid` query with a filter-only member and a time dimension without `granularity` yields rows with no entries for them.
- [ ] **DA-C11 Local execution refused over paged results.** [consumer-run] Given a backend result that is already paged or limited, when the query needs grouping, filtering, ordering or paging that the backend did not do, then the data adapter does not execute it locally over that slice, and asks the backend for the complete, unpaged result or for the operation itself.
- [ ] **DA-C12 No limit on a query without `limit`.** [consumer-run] Given a query without `limit` and a backend whose row limit is smaller than the full result, when the data adapter answers, then the answer holds the complete result, read past the backend row limit, and the data adapter sets no limit of its own.
- [ ] **DA-C13 Member mapping and `id` dropped.** [consumer-run] Given a query with member ids and its combined `id`, when the data adapter asks the backend, then each member id is mapped to a backend member name through the binding traits of the dataset, and the backend request carries no `id`.
- [ ] **DA-C14 `timezone` passed through.** [consumer-run] Given a query that carries `timezone` and a backend that understands it, when the data adapter asks the backend, then the backend request carries the same `timezone`.
- [ ] **DA-C15 Default order.** [consumer-run] Given a query without `order`, a query with `order` set to `[]`, and a query with an `order`, when the data adapter runs them, then the first gets the default order (the time dimension ascending when it has a granularity, else the first measure descending, else the first dimension ascending), the second gets no order, and the third gets its own order.
- [ ] **DA-C16 Declared re-aggregation only.** [consumer-run] Given a measure that the product's own binding declares re-aggregatable from grouped values and a measure that it does not, when the data adapter needs a total at a coarser grain, then it aggregates the first locally over a complete result and takes the total of the second from the backend at the query's grain.
- [ ] **DA-C17 Range-2 values.** [consumer-run] Given a `scalar_with_series` query with `compareDateRange` and a fixture with known values for both ranges, when the data adapter answers, then `value` equals the range 1 value, `previous_value` equals the range 2 value, and the sparkline runs over range 1.
- [ ] **DA-C18 Null dimension values.** [consumer-run] Given a result with a dimension value that is null, when the data adapter fills the data shape, then that value stays null and is not an empty string.
- [ ] **DA-C19 Canonical time value.** [consumer-run] Given a query with a time dimension with `granularity` `week` and a `timezone`, when the data adapter fills the data shape, then each time value is the first day of the period, a Monday for `week`, as a `YYYY-MM-DD` date in that `timezone`.
- [ ] **DA-C20 Filter values are data.** [consumer-run] Given a filter `values` entry and a `timezone` that hold text that looks like query syntax, when the data adapter asks the backend, then the text reaches the backend as data and is never interpreted as query text.
- [ ] **DA-C21 Totals without re-aggregation.** [consumer-run] Given a measure that the binding does not declare re-aggregatable and a backend that cannot give its total at the needed grain, when a fill mode needs that total, then the data adapter gives no answer and the widget keeps its loader. With a measure that is declared re-aggregatable, and with the row count, it derives the value locally over a complete result.
- [ ] **DA-C22 Null grouping.** [consumer-run] Given a complete result with several rows whose dimension value is null, when the data adapter groups it locally, then the null rows form one group of their own.
- [ ] **DA-C23 Null ordering.** [consumer-run] Given a complete result with null values in the ordered column, when the data adapter orders it locally ascending and descending, then the nulls come after all values in both directions.
- [ ] **DA-C24 `notEquals` on null.** [consumer-run] Given a complete result with rows whose value is null, when the data adapter runs a `notEquals` filter locally, then the rows whose value is null are excluded.
- [ ] **DA-C25 Case-insensitive `contains`.** [consumer-run] Given a string dimension with the value `Alpha` and a `contains` filter with the value `alp`, when the data adapter runs it locally, then the row is kept. The same holds for `startsWith` and `endsWith`, and `notContains` with `alp` drops it.
- [ ] **DA-C26 Paging past a backend limit.** [consumer-run] Given a query without `limit` and a backend whose row limit is smaller than the result, with ties in the query's order, when the data adapter pages, then it adds the remaining result columns, ascending, as a tiebreak, so no row repeats or drops, and the order of the answer is the query's.

### 7.4 Delivery with the Dashboard

- [ ] **DA-D1 Delivery registered before validation.** [consumer-run] Given a dashboard that uses a delivered dataset type and delivered measure and dimension instances, when the dashboards root loads it, then it registers the delivery set before it validates the dashboard, and a valid dashboard renders. When the delivery lists a dataset type before its measures, it still registers the measure and dimension instances first.
- [ ] **DA-D2 Delivery set cannot be registered.** [consumer-run] Given a delivery set that cannot be registered, other than a dataset type of a query family the adapter does not serve, when the dashboards root loads the dashboard, then it shows one cannot-show placeholder in place of the dashboard and mounts no cells.
- [ ] **DA-D3 Dataset type of an unserved family.** [consumer-run] Given a delivered dataset type of a query family the adapter does not serve, when the dashboards root loads the dashboard, then the owner skips that dataset type, the dashboard renders, and only the widgets whose data uses it show cannot-show.
- [ ] **DA-D4 First registration wins.** [consumer-run] Given a delivered dataset whose content differs from an already registered dataset under the same id, when it is delivered, then the first registration stays in effect; a dataset with new content is delivered under a new version id.
- [ ] **DA-D5 Template types cannot be replaced.** [consumer-run] Given a delivered type whose id equals the id of a template type, when the domain owner registers the delivery set, then the template type stays in effect.
- [ ] **DA-D6 New dataset without new code.** [consumer-run] Given a data adapter that implements all 5 fill modes and serves a query family, when a new dataset of that family, a new dashboard, and a new template widget type that reuses a fill mode are delivered, then they render with no change to the data adapter's code.
- [ ] **DA-D7 New query family is adapter work.** [consumer-run] Given a new backend or endpoint family, when a product adds a query family type for it, then the data adapter declares and serves that family in its own code, and the template changes nothing.

### 7.5 Cannot-Show and Data That Never Arrives

- [ ] **DA-E1 Dashboard-level cannot-show.** [consumer-run] Given, in turn, a dashboard with a validation failure outside every cell's `widget` and `larger_view` path, a layout with two overlapping cells, and a delivered type that GTS rejects, when the dashboards root loads it, then in each case the owner moves from Loading to Placeholder, shows one cannot-show placeholder in place of the dashboard and mounts no cells; in the larger-view modal, the modal shows it.
- [ ] **DA-E2 Widget-level cannot-show.** [consumer-run] Given, in turn, a widget that fails validation, a widget whose query family is not served, a widget type with no single winning realization, a widget whose extension fails to mount, a member that names no registered instance, and, in the larger-view modal, a failing leading `unmount_ext`, a requested larger-view widget id that is not in the dashboard, when the owner loads the dashboard, then each shows the placeholder in its own cell or larger view only, and every other widget renders.
- [ ] **DA-E3 No dashboard returned.** [consumer-run] Given a data adapter that returns no dashboard, when the dashboard viewer opens the dashboard, then the loader stays in place of the dashboard, with no error message, and no cell is mounted.
- [ ] **DA-E4 No answer to a request.** [consumer-run] Given a data adapter that never answers one widget's `request_data`, when the widgets request their data, then that widget keeps its loader with no error message and no timeout, and every other widget presents its data.
- [ ] **DA-E5 Rejected data.** [consumer-run] Given a data adapter that answers one request with an instance that violates its own named shape, when the owner sends `set_data`, then FrontX validation rejects it, that widget keeps its loader with no error message, and every other widget is unaffected.
- [ ] **DA-E6 No answer to a repeated request.** [consumer-run] Given a grid with rows and a data adapter that never answers its next request, when the dashboard viewer sorts the grid, then the grid keeps its current rows under the busy indicator, with no error message and no timeout.
- [ ] **DA-E7 Backend errors belong to the data adapter.** [consumer-run] Given a backend error, an access check that fails, and an expired session behind the data adapter, when the data adapter handles each, then the template shows no error message, classifies nothing and applies no timeout; what the viewer sees is decided by whether the data adapter returns a result.

### 7.6 Test Data Adapter

- [ ] **DA-F1 Names no backend.** [template-run] Given the test data adapter, when its code and fixtures are checked, then they name no backend, and the test data adapter is not part of the shipped `dashboard` package.
- [ ] **DA-F2 Reference dashboard.** [template-run] Given the test data adapter, when the dashboards root loads the reference dashboard, then "get a dashboard" returns it with its dataset types and vocabulary instances, and the test data adapter fills every query from fixtures in memory by the requested fill mode.
- [ ] **DA-F3 Fixed delay.** [template-run] Given the test data adapter under the reference conditions of DESIGN section 3.9, when it answers "get a dashboard" and every "run a query", then each answer follows after the data adapter response time of the reference conditions (DESIGN section 3.9), so the initial-render measurement uses a known data adapter response time.
- [ ] **DA-F4 Initial render measurement.** [template-run] Given the test data adapter and the reference conditions, when the dashboard viewer opens the reference dashboard, then the first full render is one "get a dashboard" call and one "run a query" call per data widget, answered asynchronously, and the measured time is the figure that `cpt-frontx-dashboard-nfr-initial-render` confirms or revises.

## 8. Acceptance Criteria

- [ ] Section 6 specifies the operations "get a dashboard" and "run a query" and the declaration of the served query families, each with its input, its output and its caller.
- [ ] Section 6 states the obligations of an implementation: all 5 fill modes, delivery with the dashboard, member mapping and dropping `id`, the `timezone` pass-through, the default order, complete results for a query without `limit`, local execution only over complete, unpaged results with local aggregation only of measures that the product's binding declares re-aggregatable, a new query family as adapter work, an answer to every call, valid data, and ownership of backend errors, access checks and the session.
- [ ] The delivery set is returned with the dashboard under the rule of `cpt-frontx-dashboard-feature-dashboard-root-types`.
- [ ] An unserved query family is stated as the cannot-show trigger on the adapter side, at widget level.
- [ ] Data that never arrives, including an answer that the owner drops or FrontX rejects, is stated as keeping the loader, with no error message and no timeout, as a limitation and a risk, and not as a cannot-show trigger.
- [ ] The asynchronous answer and the consistency rule are stated: each data instance is an independent snapshot, and the owner keeps answering other widgets while one waits.
- [ ] The flows "open a dashboard" and "change a query" are specified, and every conformance case in section 7 is written as Given / When / Then and tagged consumer-run or template-run, with at least one case for each of: the operations, the served query families, the fill modes, the delivery with the dashboard, the cannot-show and never-arrives outcomes, and the test data adapter.
- [ ] The test data adapter is stated as test tooling outside the shipped `dashboard` package, with the fixed delay of the initial-render reference conditions.
- [ ] The data adapter obligations and the conformance cases are stated as a topic of the consumer guide.
- [ ] Every identifier referenced in this document is defined in the PRD, the DESIGN, an ADR, the DECOMPOSITION, a FEATURE, or this document, and every instance identifier shown carries its type chain.
- [ ] `cfs toc` and `cfs validate --artifact` report no errors for this document.
