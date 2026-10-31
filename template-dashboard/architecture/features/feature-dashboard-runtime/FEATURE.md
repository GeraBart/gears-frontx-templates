---
status: accepted
version: 1
date: 2026-10-31
description: "Feature: the dashboard runtime — hosting-agnostic mounting, the widgets domain registry, served GTS-file loading, the binding runner, the cell frame, the larger-view overlay, and teardown."
---

# Feature: Dashboard Runtime

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-featstatus-dashboard-runtime`

<!-- toc -->

- [1. Feature Context](#1-feature-context)
  - [1.1 Overview](#11-overview)
  - [1.2 Purpose](#12-purpose)
  - [1.3 Actors](#13-actors)
  - [1.4 References](#14-references)
- [2. Actor Flows (CDSL)](#2-actor-flows-cdsl)
  - [Open a dashboard](#open-a-dashboard)
  - [Open a larger view](#open-a-larger-view)
  - [Switch theme](#switch-theme)
  - [Leave a dashboard](#leave-a-dashboard)
- [3. Processes / Business Logic (CDSL)](#3-processes--business-logic-cdsl)
  - [Register the widgets domain](#register-the-widgets-domain)
  - [Load the served GTS file](#load-the-served-gts-file)
  - [Run a binding](#run-a-binding)
- [4. States (CDSL)](#4-states-cdsl)
  - [Cell state](#cell-state)
- [5. Definitions of Done](#5-definitions-of-done)
  - [Hosting-agnostic mount](#hosting-agnostic-mount)
  - [widgets domain and generated extensions](#widgets-domain-and-generated-extensions)
  - [Binding runner](#binding-runner)
  - [Cell frame and larger-view overlay](#cell-frame-and-larger-view-overlay)
  - [No persistence](#no-persistence)
- [6. Acceptance Criteria](#6-acceptance-criteria)

<!-- /toc -->

## 1. Feature Context

- [ ] `p1` - `cpt-frontx-dashboard-feature-dashboard-runtime`

### 1.1 Overview

The code that renders a dashboard from its JSON: hosting-agnostic mounting, the `widgets` domain, the served GTS-file loading, the binding runner, the cell frame, the larger-view overlay, theme/language publishing, and teardown.

### 1.2 Purpose

The product writes no data code; the runtime runs each widget's binding against the product's same-origin API, stamps and validates the result, and sends `render_widget` to the widget. It owns the cell frame and the larger-view overlay. It is hosting-agnostic (D12).

**Requirements**: `cpt-frontx-dashboard-fr-dashboard-root`, `cpt-frontx-dashboard-fr-runtime-source`, `cpt-frontx-dashboard-fr-states`, `cpt-frontx-dashboard-fr-same-origin-data`, `cpt-frontx-dashboard-fr-no-product-data-code`, `cpt-frontx-dashboard-fr-larger-view`, `cpt-frontx-dashboard-fr-theme`, `cpt-frontx-dashboard-fr-safe-mappings`, `cpt-frontx-dashboard-fr-isolation`, `cpt-frontx-dashboard-nfr-initial-render`, `cpt-frontx-dashboard-nfr-no-persistence`, `cpt-frontx-dashboard-nfr-visual-quality` (root side: cell frame).

**Principles**: `cpt-frontx-dashboard-principle-render-only`, `cpt-frontx-dashboard-principle-per-instance-isolation`.

**Constraints**: `cpt-frontx-dashboard-constraint-same-origin-data`, `cpt-frontx-dashboard-constraint-hosting-agnostic`, `cpt-frontx-dashboard-constraint-one-gts-package`.

**Not applicable**: persistence/DB (no database), auth beyond same-origin (sign-in out of scope, D4), compliance/privacy (no data stored).

### 1.3 Actors

| Actor | Role in Feature |
|-------|-----------------|
| `cpt-frontx-dashboard-actor-dashboard-viewer` | Opens a dashboard, opens/closes a larger view, switches theme. |
| `cpt-frontx-dashboard-actor-host-application` | Supplies a container, a dashboard id, and the theme and language values. |
| `cpt-frontx-dashboard-actor-consuming-backend` | Answers the requests a binding makes, same-origin. |

### 1.4 References

- **PRD**: [PRD.md](../../PRD.md)
- **Design**: [DESIGN.md](../../DESIGN.md) (§3.6 Interactions & Sequences)
- **Dependencies**: `cpt-frontx-dashboard-feature-dashboard-model`

## 2. Actor Flows (CDSL)

**Use cases**: `cpt-frontx-dashboard-usecase-view-dashboard`.

### Open a dashboard

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-flow-dashboard-runtime-open`

**Actor**: `cpt-frontx-dashboard-actor-dashboard-viewer`

**Success Scenarios**:
- The viewer opens a dashboard id and sees the dashboard with every widget in its own state.

**Error Scenarios**:
- The dashboard itself fails (file, type, validation, layout): the dashboard area shows cannot-be-shown.
- A widget fails: only its cell shows cannot-be-shown.

**Steps**:
1. [ ] - `p1` - The host gives the root a container, a dashboard id, and the theme and language values. - `inst-dr-open-host`
2. [ ] - `p1` - The root registers its bundle schemas. - `inst-dr-open-bundle`
3. [ ] - `p1` - The root registers the `widgets` domain (`cpt-frontx-dashboard-algo-dashboard-runtime-register-domain`). - `inst-dr-open-domain`
4. [ ] - `p1` - The root publishes theme and language with `updateSharedProperty`. - `inst-dr-open-theme`
5. [ ] - `p1` - The root loads the served GTS file (`cpt-frontx-dashboard-algo-dashboard-runtime-load-file`). - `inst-dr-open-load`
6. [ ] - `p1` - The root registers the dashboard instance, then each embedded widget instance on its own. - `inst-dr-open-register`
7. [ ] - `p1` - The root runs the layout checks (`cpt-frontx-dashboard-algo-dashboard-model-layout-checks`). - `inst-dr-open-layout`
8. [ ] - `p1` - **IF** the load, registration, or layout checks fail - `inst-dr-open-fail`
   1. [ ] - `p1` - Show the dashboard-level cannot-be-shown state and mount no cell. - `inst-dr-open-fail-show`
9. [ ] - `p1` - **ELSE** - `inst-dr-open-ok`
   1. [ ] - `p1` - **FOR EACH** cell in parallel - `inst-dr-open-cell`
      1. [ ] - `p1` - Read the widget type and its effective traits `entry` and `data_type`. - `inst-dr-open-traits`
      2. [ ] - `p1` - Register a generated extension in `widgets`, mount it with `mount_ext` (`history: "none"`); the cell frame shows a loader. - `inst-dr-open-mount`
      3. [ ] - `p1` - **IF** the widget has a binding (data widget) - `inst-dr-open-binding`
         1. [ ] - `p1` - Run the binding (`cpt-frontx-dashboard-algo-dashboard-runtime-run-binding`). - `inst-dr-open-run`
         2. [ ] - `p1` - **IF** the binding fails (request, timeout, CEL, data validation, registration) - `inst-dr-open-binding-fail`
            1. [ ] - `p1` - Show the cell's cannot-be-shown state; the other cells are unaffected. - `inst-dr-open-binding-fail-show`
         3. [ ] - `p1` - **ELSE** send `render_widget {widget, data}` once `mount_ext` finished and the data is valid. - `inst-dr-open-render`
      4. [ ] - `p1` - **ELSE** (markdown_card, no binding) send `render_widget {widget}` at once, with no loader. - `inst-dr-open-nodata`
10. [ ] - `p1` - **RETURN** the dashboard shown. - `inst-dr-open-return`

### Open a larger view

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-flow-dashboard-runtime-larger-view`

**Actor**: `cpt-frontx-dashboard-actor-dashboard-viewer`

**Success Scenarios**:
- The viewer clicks the larger-view button and sees the larger-view widget; closing returns to the unchanged dashboard.

**Error Scenarios**:
- The larger-view widget fails: the overlay shows cannot-be-shown.

**Steps**:
1. [ ] - `p1` - The viewer clicks the cell's larger-view button (shown only when the cell has `larger_view`). - `inst-dr-lv-click`
2. [ ] - `p1` - The root opens the overlay inside its own container. - `inst-dr-lv-open`
3. [ ] - `p1` - The root runs the cell flow (`cpt-frontx-dashboard-flow-dashboard-runtime-open`, steps 9.1.1–9.1.4) for the `larger_view` widget, with its own request. - `inst-dr-lv-run`
4. [ ] - `p1` - The overlay keeps focus inside and closes on Escape, a click outside, or a page refresh. - `inst-dr-lv-close`
5. [ ] - `p1` - **RETURN** the unchanged dashboard. - `inst-dr-lv-return`

### Switch theme

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-flow-dashboard-runtime-theme`

**Actor**: `cpt-frontx-dashboard-actor-host-application`

**Success Scenarios**:
- The host switches the theme; every widget and the larger view restyle without a reload or a re-run binding.

**Steps**:
1. [ ] - `p1` - The host updates the theme shared property. - `inst-dr-theme-host`
2. [ ] - `p1` - The root republishes the theme on `widgets`. - `inst-dr-theme-repub`
3. [ ] - `p1` - Each widget selects the new kit scope; chart widgets rebuild their chart theme. - `inst-dr-theme-widgets`
4. [ ] - `p1` - **RETURN** — no binding re-runs, nothing remounts. - `inst-dr-theme-return`

### Leave a dashboard

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-flow-dashboard-runtime-leave`

**Actor**: `cpt-frontx-dashboard-actor-dashboard-viewer`

**Success Scenarios**:
- Every extension is unmounted; late results are dropped.

**Steps**:
1. [ ] - `p1` - The viewer leaves the dashboard. - `inst-dr-leave-go`
2. [ ] - `p1` - The root unmounts every extension and keeps the registrations. - `inst-dr-leave-unmount`
3. [ ] - `p1` - Before another dashboard loads, the root unregisters the generated extensions. - `inst-dr-leave-unregister`
4. [ ] - `p1` - The root drops any result for an extension no longer mounted; it never sends to an unmounted extension. - `inst-dr-leave-drop`
5. [ ] - `p1` - **RETURN**. - `inst-dr-leave-return`

## 3. Processes / Business Logic (CDSL)

### Register the widgets domain

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-algo-dashboard-runtime-register-domain`

**Input**: a registry the root can write to (the application's own in a SPA; a registry it builds in its first mount in an MFE).

**Output**: the `widgets` domain registered.

**Steps**:
1. [ ] - `p1` - Register the `widgets` domain with `sharedProperties` theme and language, `actions` [`mount_ext`, `unmount_ext`], `extensionsActions` [`render_widget`], `extensionsTypeId` the `widgets` extension type, `defaultActionTimeout`, `lifecycleStages` [] and `extensionsLifecycleStages` [], no `route`. - `inst-dr-domain-declare`
2. [ ] - `p1` - Attach the domain's one root element with `getMounter(widgets).attach(el)`. - `inst-dr-domain-attach`
3. [ ] - `p1` - **RETURN** the domain. - `inst-dr-domain-return`

### Load the served GTS file

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-algo-dashboard-runtime-load-file`

**Input**: the served GTS file URL.

**Output**: the file's types, manifests and entries registered, and the root's own index of what it registered.

**Steps**:
1. [ ] - `p1` - Fetch the served GTS file. - `inst-dr-load-fetch`
2. [ ] - `p1` - **IF** the fetch fails - `inst-dr-load-fail`
   1. [ ] - `p1` - **RETURN** a dashboard-level failure. - `inst-dr-load-fail-return`
3. [ ] - `p1` - Register the file's types, manifests and entries. - `inst-dr-load-register`
4. [ ] - `p1` - **IF** a served type's id equals a bundle base - `inst-dr-load-guard`
   1. [ ] - `p1` - Reject it before anything registers; **RETURN** a dashboard-level failure. - `inst-dr-load-guard-return`
5. [ ] - `p1` - Keep the root's own index of what it registered (FrontX can't list registered instances). - `inst-dr-load-index`
6. [ ] - `p1` - **RETURN** the registered set. - `inst-dr-load-return`

### Run a binding

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-algo-dashboard-runtime-run-binding`

**Input**: a binding `{request, transform}`, the widget id, the role, the data type id.

**Output**: the stamped, validated data, or a cell-scope failure.

**Steps**:
1. [ ] - `p1` - **IF** `request` is not same-origin or not `GET`/`POST` - `inst-dr-bind-origin`
   1. [ ] - `p1` - **RETURN** a cell-scope failure. - `inst-dr-bind-origin-return`
2. [ ] - `p1` - Run the request through the FrontX API package with a timeout (D16). - `inst-dr-bind-request`
3. [ ] - `p1` - **IF** the request times out or fails - `inst-dr-bind-reqfail`
   1. [ ] - `p1` - **RETURN** a cell-scope failure. - `inst-dr-bind-reqfail-return`
4. [ ] - `p1` - **IF** the response exceeds the response-size cap (O11) - `inst-dr-bind-cap`
   1. [ ] - `p1` - **RETURN** a cell-scope failure. - `inst-dr-bind-cap-return`
5. [ ] - `p1` - Evaluate the CEL transform on `response` (the parsed JSON body) through the internal interface. - `inst-dr-bind-cel`
6. [ ] - `p1` - **IF** the transform errors - `inst-dr-bind-celfail`
   1. [ ] - `p1` - **RETURN** a cell-scope failure. - `inst-dr-bind-celfail-return`
7. [ ] - `p1` - Stamp the result with `<data type>~<UUIDv5(widget id | role)>` (D20). - `inst-dr-bind-stamp`
8. [ ] - `p1` - Register the stamped data, which validates it against the data type. - `inst-dr-bind-register`
9. [ ] - `p1` - **IF** registration rejects it - `inst-dr-bind-regfail`
   1. [ ] - `p1` - **RETURN** a cell-scope failure. - `inst-dr-bind-regfail-return`
10. [ ] - `p1` - **RETURN** the stamped, validated data. - `inst-dr-bind-return`

## 4. States (CDSL)

### Cell state

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-state-dashboard-runtime-cell`

**States**: `loading`, `shown`, `empty`, `cannot-be-shown`

**Initial State**: `loading`

**Transitions**:
1. [ ] - `p1` - **FROM** `loading` **TO** `shown` **WHEN** `render_widget {widget, data}` is sent with valid data. - `inst-dr-cell-shown`
2. [ ] - `p1` - **FROM** `loading` **TO** `empty` **WHEN** the data is valid and empty (the widget shows its own empty state). - `inst-dr-cell-empty`
3. [ ] - `p1` - **FROM** `loading` **TO** `cannot-be-shown` **WHEN** the binding or mount fails. - `inst-dr-cell-cannot`

A `markdown_card` cell goes straight to `shown` with `render_widget {widget}` and no loader.

## 5. Definitions of Done

### Hosting-agnostic mount

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-dod-dashboard-runtime-hosting`

The root **MUST** mount into a single-page application or a screen extension, depending on FrontX packages only and no host or shell template (D12).

**Implements**: `cpt-frontx-dashboard-flow-dashboard-runtime-open`, `cpt-frontx-dashboard-fr-dashboard-root`.

**Constraints**: `cpt-frontx-dashboard-constraint-hosting-agnostic`.

### widgets domain and generated extensions

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-dod-dashboard-runtime-domain`

The root **MUST** register the `widgets` domain and generate one extension per cell and per larger view, with deterministic UUIDv5 ids, mounting with `history: "none"`; a reload reuses the ids.

**Implements**: `cpt-frontx-dashboard-algo-dashboard-runtime-register-domain`, `cpt-frontx-dashboard-fr-isolation`.

### Binding runner

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-dod-dashboard-runtime-binding`

The root **MUST** run each binding (`cpt-frontx-dashboard-algo-dashboard-runtime-run-binding`) through the FrontX API package with a timeout, evaluate the CEL transform, stamp and register the result, and send `render_widget`; widgets never make requests (D2, D3).

**Implements**: `cpt-frontx-dashboard-algo-dashboard-runtime-run-binding`, `cpt-frontx-dashboard-fr-no-product-data-code`, `cpt-frontx-dashboard-fr-same-origin-data`, `cpt-frontx-dashboard-fr-safe-mappings`.

**Constraints**: `cpt-frontx-dashboard-constraint-same-origin-data`.

### Cell frame and larger-view overlay

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-dod-dashboard-runtime-frame`

The root **MUST** own the cell frame (title, loader, error state, larger-view button) and the larger-view overlay inside its own container, accessible (close button, focus trapped, Escape/click-outside/refresh close) (D7, D8).

**Implements**: `cpt-frontx-dashboard-flow-dashboard-runtime-larger-view`, `cpt-frontx-dashboard-fr-larger-view`, `cpt-frontx-dashboard-fr-states`.

### No persistence

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-dod-dashboard-runtime-no-persistence`

The root and widgets **MUST NOT** persist any state; late results for unmounted extensions are dropped.

**Implements**: `cpt-frontx-dashboard-flow-dashboard-runtime-leave`, `cpt-frontx-dashboard-nfr-no-persistence`.

## 6. Acceptance Criteria

- [ ] A dashboard opens in a single-page application and as a screen extension, with no host or shell template dependency.
- [ ] Each cell mounts its own extension, runs its binding, and shows loading, shown, empty, or cannot-be-shown.
- [ ] A request to a non-same-origin path or a method other than GET/POST is rejected before it is sent.
- [ ] A request that never answers times out and the cell shows cannot-be-shown.
- [ ] A transform that errors, or data that fails validation, fails only its cell.
- [ ] The larger-view overlay opens inside the root's container, closes on Escape/click-outside/refresh, and traps focus.
- [ ] A theme switch restyles every widget without a reload or a re-run binding.
- [ ] Leaving the dashboard unmounts every extension; a late result for an unmounted extension is dropped.
