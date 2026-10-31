---
status: accepted
version: 1
date: 2026-10-31
description: "Feature: the dashboard runtime — hosting-agnostic mounting, the widgets domain registry, served GTS-file loading, the binding runner, the cell frame, the larger-view overlay, the placeholder, theme and language publishing, the owner state machine, and teardown."
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
  - [Show the placeholder](#show-the-placeholder)
  - [Publish theme and language](#publish-theme-and-language)
- [4. States (CDSL)](#4-states-cdsl)
  - [Owner state](#owner-state)
  - [Cell state](#cell-state)
- [5. Definitions of Done](#5-definitions-of-done)
  - [Hosting-agnostic mount](#hosting-agnostic-mount)
  - [widgets domain and generated extensions](#widgets-domain-and-generated-extensions)
  - [Binding runner](#binding-runner)
  - [Cell frame and larger-view overlay](#cell-frame-and-larger-view-overlay)
  - [Placeholder](#placeholder)
  - [Theme and language publishing](#theme-and-language-publishing)
  - [Owner state machine and load lifecycle](#owner-state-machine-and-load-lifecycle)
  - [No persistence](#no-persistence)
- [6. Acceptance Criteria](#6-acceptance-criteria)

<!-- /toc -->

## 1. Feature Context

- [ ] `p1` - `cpt-frontx-dashboard-feature-dashboard-runtime`

### 1.1 Overview

The code that renders a dashboard from its JSON: hosting-agnostic mounting, the `widgets` domain, the served GTS-file loading, the binding runner, the cell frame, the larger-view overlay, the placeholder, theme and language publishing, the owner state machine, and teardown.

### 1.2 Purpose

The product writes no data code; the runtime runs each widget's binding against the product's same-origin API, stamps and validates the result, and sends `render_widget` to the widget. It owns the cell frame and the larger-view overlay, maps the host theme id to a UI-kit scope for its own chrome, localizes its own text, and shows a static placeholder with a developer-log diagnostic on every failure. It is hosting-agnostic.

**Requirements**: `cpt-frontx-dashboard-fr-dashboard-root`, `cpt-frontx-dashboard-fr-runtime-source`, `cpt-frontx-dashboard-fr-states`, `cpt-frontx-dashboard-fr-same-origin-data`, `cpt-frontx-dashboard-fr-no-product-data-code`, `cpt-frontx-dashboard-fr-shared-data`, `cpt-frontx-dashboard-fr-static-data`, `cpt-frontx-dashboard-fr-larger-view`, `cpt-frontx-dashboard-fr-theme`, `cpt-frontx-dashboard-fr-safe-mappings`, `cpt-frontx-dashboard-fr-isolation`, `cpt-frontx-dashboard-nfr-initial-render`, `cpt-frontx-dashboard-nfr-no-persistence`, `cpt-frontx-dashboard-nfr-visual-quality` (root side: cell frame), `cpt-frontx-dashboard-contract-host`, `cpt-frontx-dashboard-contract-same-origin-api`.

**Principles**: `cpt-frontx-dashboard-principle-render-only`, `cpt-frontx-dashboard-principle-per-instance-isolation`.

**Constraints**: `cpt-frontx-dashboard-constraint-same-origin-data`, `cpt-frontx-dashboard-constraint-hosting-agnostic`, `cpt-frontx-dashboard-constraint-one-gts-package`.

**Not applicable**: persistence/DB (no database), auth beyond same-origin (sign-in is out of scope), compliance/privacy (no data stored).

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
- The viewer returns to a dashboard the root has already loaded: the cells remount from the kept registrations without fetching the served file again, and every binding runs again.

**Error Scenarios**:
- The dashboard itself fails (file, type, validation, layout): the dashboard area shows cannot-be-shown.
- A widget fails: only its cell shows cannot-be-shown.
- The dashboard id names no dashboard in the served file: the dashboard area shows cannot-be-shown with a developer-log diagnostic naming the id.

**Steps**:
1. [ ] - `p1` - The host gives the root a container, a dashboard id, and the theme and language values. - `inst-dr-open-host`
2. [ ] - `p1` - **IF** the dashboard id is the one the root has already loaded - `inst-dr-open-same`
   1. [ ] - `p1` - The root re-publishes theme and language (`cpt-frontx-dashboard-algo-dashboard-runtime-publish-theme`), remounts the cells from the kept registrations without fetching the served file again, and runs every binding again; the root does not re-fetch the served file, re-register the dashboard, or re-register the widget instances. - `inst-dr-open-same-remount`
   2. [ ] - `p1` - **RETURN** the dashboard shown. - `inst-dr-open-same-return`
3. [ ] - `p1` - The root registers its bundle schemas. - `inst-dr-open-bundle`
4. [ ] - `p1` - The root registers the `widgets` domain (`cpt-frontx-dashboard-algo-dashboard-runtime-register-domain`). - `inst-dr-open-domain`
5. [ ] - `p1` - The root publishes theme and language (`cpt-frontx-dashboard-algo-dashboard-runtime-publish-theme`). - `inst-dr-open-theme`
6. [ ] - `p1` - The root loads the served GTS file (`cpt-frontx-dashboard-algo-dashboard-runtime-load-file`). - `inst-dr-open-load`
7. [ ] - `p1` - **IF** a new dashboard id has superseded this load since step 2 - `inst-dr-open-superseded-1`
   1. [ ] - `p1` - Discard this load: unregister any extension registered so far, show nothing, and **RETURN**. This check runs after this step and again after each later step that waits. - `inst-dr-open-superseded-1-return`
8. [ ] - `p1` - **IF** the dashboard id names no dashboard in the served file - `inst-dr-open-unknown`
   1. [ ] - `p1` - Show the dashboard-level cannot-be-shown state (`cpt-frontx-dashboard-algo-dashboard-runtime-show-placeholder`), write a developer-log diagnostic naming the id, mount no cell, and **RETURN**. - `inst-dr-open-unknown-show`
9. [ ] - `p1` - The root registers the dashboard instance, then each embedded widget instance on its own. - `inst-dr-open-register`
10. [ ] - `p1` - The root runs the layout checks (`cpt-frontx-dashboard-algo-dashboard-model-layout-checks`). - `inst-dr-open-layout`
11. [ ] - `p1` - **IF** a new dashboard id has superseded this load - `inst-dr-open-superseded-2`
    1. [ ] - `p1` - Discard this load: unregister any extension registered so far, show nothing, and **RETURN**. - `inst-dr-open-superseded-2-return`
12. [ ] - `p1` - **IF** the load, registration, or layout checks fail - `inst-dr-open-fail`
    1. [ ] - `p1` - Show the dashboard-level cannot-be-shown state and mount no cell. - `inst-dr-open-fail-show`
13. [ ] - `p1` - **ELSE** - `inst-dr-open-ok`
    1. [ ] - `p1` - Collect the shared request names referenced by any cell or larger view; mark each cell whose `source` is unknown as failed. - `inst-dr-open-shared-collect`
    2. [ ] - `p1` - Send each referenced shared request once; hold each response until teardown. - `inst-dr-open-shared-send`
    3. [ ] - `p1` - **FOR EACH** cell in parallel - `inst-dr-open-cell`
       1. [ ] - `p1` - Read the widget type and its effective traits `entry` and `data_type`. - `inst-dr-open-traits`
       2. [ ] - `p1` - Register a generated extension in `widgets`, mount it with `mount_ext` (`history: "none"`); the cell frame shows a loader for own and shared forms only. - `inst-dr-open-mount`
       3. [ ] - `p1` - **IF** the widget has a binding (data widget) - `inst-dr-open-binding`
          1. [ ] - `p1` - Run the binding by form (`cpt-frontx-dashboard-algo-dashboard-runtime-run-binding`): own — send the request and evaluate the transform on `response`; shared — start the shared request if not running, then evaluate the transform on `response` and `params`; static — evaluate the transform on `params` at once, with no loader. - `inst-dr-open-run`
          2. [ ] - `p1` - **IF** a new dashboard id has superseded this load (checked after each binding that sends a request) - `inst-dr-open-superseded-3`
             1. [ ] - `p1` - Discard this load: unregister any extension registered so far, show nothing, and **RETURN**. - `inst-dr-open-superseded-3-return`
          3. [ ] - `p1` - **IF** the binding fails (request, timeout, CEL, data validation, registration, or the shared request it depends on) - `inst-dr-open-binding-fail`
             1. [ ] - `p1` - Show the cell's cannot-be-shown state; the other cells are unaffected. - `inst-dr-open-binding-fail-show`
          4. [ ] - `p1` - **ELSE** send `render_widget {widget, data}` once `mount_ext` finished and the data is valid. - `inst-dr-open-render`
       4. [ ] - `p1` - **ELSE** (markdown_card, no binding) send `render_widget {widget}` at once, with no loader. - `inst-dr-open-nodata`
14. [ ] - `p1` - **RETURN** the dashboard shown. - `inst-dr-open-return`

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
3. [ ] - `p1` - The root runs the cell flow (`cpt-frontx-dashboard-flow-dashboard-runtime-open`, steps 13.3.1–13.3.4) for the `larger_view` widget, with its own binding: own form as for a cell; shared form: evaluate the transform on the held response and the binding's `params`; static as for a cell. The cell and its larger view are independent snapshots for the own and static forms; a shared-form larger view shows the same held response as its cell. - `inst-dr-lv-run`
4. [ ] - `p1` - The overlay keeps focus inside and closes on Escape, a click outside, or a page refresh. - `inst-dr-lv-close`
5. [ ] - `p1` - An open larger view closes (its extension unmounts) when the viewer leaves the dashboard or another dashboard loads. - `inst-dr-lv-lifecycle`
6. [ ] - `p1` - **RETURN** the unchanged dashboard. - `inst-dr-lv-return`

### Switch theme

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-flow-dashboard-runtime-theme`

**Actor**: `cpt-frontx-dashboard-actor-host-application`

**Success Scenarios**:
- The host switches the theme; every widget and the larger view restyle without a reload or a re-run binding.
- The host changes the language; the root's own text and every widget follow it without a reload or a re-run binding.

**Steps**:
1. [ ] - `p1` - The host updates the theme (or language) shared property. - `inst-dr-theme-host`
2. [ ] - `p1` - The root maps the host theme id to a UI-kit scope for its own chrome (cell frame, loaders, overlay, close button) and, for a language change, localizes its own text. - `inst-dr-theme-map`
3. [ ] - `p1` - The root republishes the value on `widgets` (`cpt-frontx-dashboard-algo-dashboard-runtime-publish-theme`). - `inst-dr-theme-repub`
4. [ ] - `p1` - Each widget selects the new kit scope (theme) or follows the new language; chart widgets rebuild their chart theme (theme only). - `inst-dr-theme-widgets`
5. [ ] - `p1` - **RETURN** — no binding re-runs, nothing remounts. - `inst-dr-theme-return`

### Leave a dashboard

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-flow-dashboard-runtime-leave`

**Actor**: `cpt-frontx-dashboard-actor-dashboard-viewer`

**Success Scenarios**:
- Every extension is unmounted, including any open larger view; late results are dropped.

**Steps**:
1. [ ] - `p1` - The viewer leaves the dashboard. - `inst-dr-leave-go`
2. [ ] - `p1` - The root closes any open larger view (its extension unmounts), unmounts every cell extension, and keeps the registrations. - `inst-dr-leave-unmount`
3. [ ] - `p1` - Before another dashboard loads, the root unregisters the generated extensions. - `inst-dr-leave-unregister`
4. [ ] - `p1` - The root drops any result for an extension no longer mounted; it never sends to an unmounted extension. - `inst-dr-leave-drop`
5. [ ] - `p1` - The root drops the held shared responses. - `inst-dr-leave-shared`
6. [ ] - `p1` - A load superseded by a new dashboard id drops its shared responses. - `inst-dr-leave-supersede`
7. [ ] - `p1` - **RETURN**. - `inst-dr-leave-return`

## 3. Processes / Business Logic (CDSL)

### Register the widgets domain

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-algo-dashboard-runtime-register-domain`

**Input**: a registry the root can write to (the application's own in a SPA; a registry it builds in its first mount in an MFE).

**Output**: the `widgets` domain registered.

**Steps**:
1. [ ] - `p1` - Register the `widgets` domain with `sharedProperties` theme and language, `actions` [`mount_ext`, `unmount_ext`], `extensionsActions` [`render_widget`], `extensionsTypeId` the `widgets` extension type, `defaultActionTimeout`, `lifecycleStages` [] and `extensionsLifecycleStages` [], no `route`. - `inst-dr-domain-declare`
2. [ ] - `p1` - **IF** the domain is rejected - `inst-dr-domain-reject`
   1. [ ] - `p1` - The root shows the dashboard-level cannot-be-shown state (`cpt-frontx-dashboard-algo-dashboard-runtime-show-placeholder`); no dashboard loads, and every later mount, load, or larger-view opening shows the same placeholder. **RETURN** a dashboard-level failure. - `inst-dr-domain-reject-show`
3. [ ] - `p1` - Attach the domain's root element through the FrontX mounter. - `inst-dr-domain-attach`
4. [ ] - `p1` - **RETURN** the domain. - `inst-dr-domain-return`

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

**Input**: a binding (one of three forms — own, shared, or static), the widget id, the role, the data type id, and the dashboard's `requests` map (for the shared form).

**Output**: the stamped, validated data, or a cell-scope failure.

**Steps**:
1. [ ] - `p1` - **SWITCH** on the binding form. - `inst-dr-bind-form`
2. [ ] - `p1` - **own** (`{request, transform}`): - `inst-dr-bind-own`
   1. [ ] - `p1` - **IF** `request` is not same-origin or not `GET`/`POST`, **RETURN** a cell-scope failure. - `inst-dr-bind-own-origin`
   2. [ ] - `p1` - Send the request — a GET or POST request through the binding runner — with a timeout of 30000 ms; a request that never answers times out. - `inst-dr-bind-own-request`
   3. [ ] - `p1` - **IF** the request times out, fails, or the response exceeds the response-size cap of 1 MB, **RETURN** a cell-scope failure. - `inst-dr-bind-own-fail`
   4. [ ] - `p1` - Evaluate the CEL transform on `response` (the parsed JSON body) through the internal interface. - `inst-dr-bind-own-cel`
3. [ ] - `p1` - **shared** (`{source, params?, transform}`): - `inst-dr-bind-shared`
   1. [ ] - `p1` - **IF** `source` is not in the dashboard's `requests` map, **RETURN** a cell-scope failure before anything runs. - `inst-dr-bind-shared-unknown`
   2. [ ] - `p1` - **IF** the shared request is not running, start it (send once); the shared request uses the same same-origin, GET/POST, timeout, and response-size cap checks as the own form; hold the response until teardown. - `inst-dr-bind-shared-start`
   3. [ ] - `p1` - **IF** the shared request fails or times out, **RETURN** a cell-scope failure. - `inst-dr-bind-shared-fail`
   4. [ ] - `p1` - When it answers, evaluate the CEL transform on `response` and `params` through the internal interface. - `inst-dr-bind-shared-cel`
4. [ ] - `p1` - **static** (`{params?, transform}`): - `inst-dr-bind-static`
   1. [ ] - `p1` - Evaluate the CEL transform on `params` (absent means `{}`) at once, with no loader, through the internal interface. - `inst-dr-bind-static-cel`
5. [ ] - `p1` - **IF** the transform errors, **RETURN** a cell-scope failure. - `inst-dr-bind-celfail`
6. [ ] - `p1` - Stamp the result with `<data type>~<UUIDv5(widget id | role)>`, a deterministic combined id. - `inst-dr-bind-stamp`
7. [ ] - `p1` - Register the stamped data, which validates it against the data type. - `inst-dr-bind-register`
8. [ ] - `p1` - **IF** registration rejects it, **RETURN** a cell-scope failure. - `inst-dr-bind-regfail`
9. [ ] - `p1` - **RETURN** the stamped, validated data. - `inst-dr-bind-return`

### Show the placeholder

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-algo-dashboard-runtime-show-placeholder`

**Input**: a cannot-be-shown trigger, its level (dashboard or cell), and its place.

**Output**: one static placeholder in that place and one diagnostic in the developer log.

**Steps**:
1. [ ] - `p1` - **IF** the trigger is at dashboard level - `inst-dr-placeholder-if-dashboard`
   1. [ ] - `p1` - The root replaces the loader with one placeholder in place of the dashboard and mounts no cell. - `inst-dr-placeholder-dashboard`
2. [ ] - `p1` - **ELSE** the trigger is at cell level: the root shows the placeholder in that cell only; the other cells are unaffected. - `inst-dr-placeholder-cell`
3. [ ] - `p1` - The placeholder is static: no retry, no error text, no failure class; the root localizes it and draws it in its mapped UI-kit scope. - `inst-dr-placeholder-static`
4. [ ] - `p1` - Write one diagnostic to the developer log that names the dashboard id, the widget id and widget type, and the failing step or request; the diagnostic is never shown to the viewer. - `inst-dr-placeholder-diagnostic`
5. [ ] - `p1` - **RETURN**. - `inst-dr-placeholder-return`

The triggers, by level:

| Level | Trigger | Detected in |
|---|---|---|
| Dashboard | the `widgets` domain is rejected by the registry | Register the widgets domain, step 2 |
| Dashboard | the served GTS file can't be fetched | Load the served GTS file, step 2 |
| Dashboard | a served type's id equals a bundle base | Load the served GTS file, step 4 |
| Dashboard | the dashboard id names no dashboard in the served file | Open a dashboard, step 8 |
| Dashboard | the dashboard fails validation or a layout check fails | Open a dashboard, step 12 |
| Cell | a widget instance fails its own registration | Open a dashboard, step 9 |
| Cell | the widget's `entry` or `data_type` doesn't exist | Open a dashboard, step 13.3.1 |
| Cell | `mount_ext` fails | Open a dashboard, step 13.3.2 |
| Cell | the binding fails (request, timeout, CEL, data validation, registration) | Run a binding |
| Cell | the shared request it depends on fails or times out | Run a binding, step 3 |
| Cell | an unknown `source` (shared binding) | Run a binding, step 3.1 |

### Publish theme and language

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-algo-dashboard-runtime-publish-theme`

**Input**: the host theme id and the host language, on every mount of the root and on every change while the root is mounted.

**Output**: both values published unchanged on the `widgets` domain, and the root's own chrome in the matching UI-kit scope and language.

**Steps**:
1. [ ] - `p2` - Read both values: in an MFE, through the bridge's `getProperty`; in a single-page application, from the application. On a mount, read the current values; on a change, take the new value from the subscription. - `inst-dr-publish-read`
2. [ ] - `p2` - Map the host theme id to the light or dark scope of `@gears-frontx/ui-kit` for the root's own chrome: the cell frame, the loaders, the overlay, and the close button. - `inst-dr-publish-map`
3. [ ] - `p2` - Localize the root's own text for the host language. - `inst-dr-publish-localize`
4. [ ] - `p2` - Publish both values unchanged on the `widgets` domain, updating the shared property. - `inst-dr-publish-update`
5. [ ] - `p2` - On every mount, both values are on the domain before any extension mounts or mounts again, because every widget entry requires them; FrontX does not replay property updates when a bridge is activated again, so a change made while the root was unmounted reaches the domain through this republication. - `inst-dr-publish-before-mount`
6. [ ] - `p2` - **RETURN**. A change sends no action, no loader shows again, and nothing is remounted. - `inst-dr-publish-return`

## 4. States (CDSL)

### Owner state

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-state-dashboard-runtime-owner`

**States**: Idle, Started, Loading, Loaded, Placeholder

**Initial State**: Idle, before the first mount of the root

**Transitions**:
1. [ ] - `p1` - **FROM** Idle **TO** Started **WHEN** the root registers the `widgets` domain (`cpt-frontx-dashboard-algo-dashboard-runtime-register-domain`). - `inst-dr-owner-idle-started`
2. [ ] - `p1` - **FROM** Idle **TO** Placeholder **WHEN** the registry rejects the `widgets` domain; this start-failed placeholder has no exit. - `inst-dr-owner-idle-placeholder`
3. [ ] - `p1` - **FROM** Started **TO** Loading **WHEN** the root begins to load a dashboard id. - `inst-dr-owner-started-loading`
4. [ ] - `p1` - **FROM** Loading **TO** Loading **WHEN** the root begins to load another dashboard id; the earlier load is superseded and discarded. - `inst-dr-owner-loading-superseded`
5. [ ] - `p1` - **FROM** Loading **TO** Loaded **WHEN** the dashboard passes its dashboard-level checks and the generated extensions of its widgets are registered. - `inst-dr-owner-loading-loaded`
6. [ ] - `p1` - **FROM** Loading **TO** Placeholder **WHEN** a dashboard-level trigger occurs at load (the file can't be fetched, a type is rejected, the dashboard fails validation, a layout check fails, or the dashboard id names no dashboard in the served file). - `inst-dr-owner-loading-placeholder`
7. [ ] - `p1` - **FROM** Loaded **TO** Loading **WHEN** the root begins to load another dashboard id, after the generated extensions of the loaded one are unregistered. - `inst-dr-owner-loaded-loading`
8. [ ] - `p1` - **FROM** Placeholder **TO** Loading **WHEN** the root begins to load another dashboard id, unless the placeholder comes from a failed start. - `inst-dr-owner-placeholder-loading`

The root keeps, per state: in Loading, the dashboard id it loads; in Loaded and Placeholder, the dashboard id, its outcome, and the registered generated extensions by widget id. Unmounting the root changes no state: a root mounted again with the dashboard id it holds in Loaded or Placeholder shows that outcome again and mounts its cells again, with no transition.

### Cell state

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-state-dashboard-runtime-cell`

**States**: `loading`, `shown`, `empty`, `cannot-be-shown`

**Initial State**: `loading` for the own and shared forms; a static binding and a `markdown_card` start without a loader

**Transitions**:
1. [ ] - `p1` - **FROM** `loading` **TO** `shown` **WHEN** `render_widget {widget, data}` is sent with valid data. - `inst-dr-cell-shown`
2. [ ] - `p1` - **FROM** `loading` **TO** `empty` **WHEN** the data is valid and empty (the widget shows its own empty state). - `inst-dr-cell-empty`
3. [ ] - `p1` - **FROM** `loading` **TO** `cannot-be-shown` **WHEN** the binding or mount fails. - `inst-dr-cell-cannot`
4. [ ] - `p1` - **FROM** (no loader) **TO** `shown` **WHEN** a static binding evaluates successfully, or a `markdown_card` gets `render_widget {widget}`. - `inst-dr-cell-static-shown`
5. [ ] - `p1` - **FROM** (no loader) **TO** `empty` **WHEN** a static binding evaluates to empty. - `inst-dr-cell-static-empty`
6. [ ] - `p1` - **FROM** (no loader) **TO** `cannot-be-shown` **WHEN** a static binding fails (CEL error or data validation). - `inst-dr-cell-static-cannot`

A loader shows at mount only for the own and shared forms. The `empty` state is observed bookkeeping; the widget owns its own empty-state rendering.

## 5. Definitions of Done

### Hosting-agnostic mount

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-dod-dashboard-runtime-hosting`

The root **MUST** mount into a single-page application or a screen extension, depending on FrontX packages only and no host or shell template.

**Implements**: `cpt-frontx-dashboard-flow-dashboard-runtime-open`, `cpt-frontx-dashboard-fr-dashboard-root`, `cpt-frontx-dashboard-contract-host`.

**Constraints**: `cpt-frontx-dashboard-constraint-hosting-agnostic`.

### widgets domain and generated extensions

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-dod-dashboard-runtime-domain`

The root **MUST** register the `widgets` domain and generate one extension per cell and per larger view, with deterministic UUIDv5 ids, mounting with `history: "none"`; a reload reuses the ids. A rejected domain shows the dashboard-level cannot-be-shown state; no dashboard loads, and every later mount shows the same placeholder.

**Implements**: `cpt-frontx-dashboard-algo-dashboard-runtime-register-domain`, `cpt-frontx-dashboard-fr-isolation`.

### Binding runner

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-dod-dashboard-runtime-binding`

The root **MUST** run each binding (`cpt-frontx-dashboard-algo-dashboard-runtime-run-binding`) in one of three forms — own, shared, or static — and widgets never make requests; the root runs the binding. It sends every `GET` through a `queryWith` descriptor with `staleTime: 0` and every `POST` through `RestProtocol.post`, with a timeout. A shared request is sent once and held until teardown. A static binding is evaluated with no loader. The root evaluates the CEL transform, stamps and registers the result, and sends `render_widget`. A cell and its larger view are independent snapshots for the own and static forms; a shared-form larger view shows the same held response as its cell.

**Implements**: `cpt-frontx-dashboard-algo-dashboard-runtime-run-binding`, `cpt-frontx-dashboard-fr-no-product-data-code`, `cpt-frontx-dashboard-fr-same-origin-data`, `cpt-frontx-dashboard-fr-shared-data`, `cpt-frontx-dashboard-fr-static-data`, `cpt-frontx-dashboard-fr-safe-mappings`, `cpt-frontx-dashboard-contract-same-origin-api`.

**Constraints**: `cpt-frontx-dashboard-constraint-same-origin-data`.

### Cell frame and larger-view overlay

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-dod-dashboard-runtime-frame`

The root **MUST** own the cell frame (title, loader, error state, larger-view button) and the larger-view overlay inside its own container, accessible (close button, focus trapped, Escape/click-outside/refresh close); the widget renders one action, including its own empty state. An open larger view closes (its extension unmounts) when the viewer leaves the dashboard or another dashboard loads.

**Implements**: `cpt-frontx-dashboard-flow-dashboard-runtime-larger-view`, `cpt-frontx-dashboard-fr-larger-view`, `cpt-frontx-dashboard-fr-states`.

### Placeholder

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-dod-dashboard-runtime-placeholder`

The root **MUST** show a static placeholder on every failure: no retry, no error text, no failure class. Each failure writes one developer-log diagnostic naming the dashboard id, the widget id and type, and the failing step or request; the diagnostic is never shown to the viewer.

**Implements**: `cpt-frontx-dashboard-algo-dashboard-runtime-show-placeholder`, `cpt-frontx-dashboard-fr-states`.

### Theme and language publishing

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-dod-dashboard-runtime-theme`

The root **MUST** publish the host theme id and host language unchanged as the shared properties of the `widgets` domain, map the host theme id to a UI-kit scope for its own chrome (cell frame, loaders, overlay, close button), and localize its own text. On every mount, the root reads the current values and publishes them before any extension mounts. In an MFE, it reads through the bridge's `getProperty`; in a single-page application, from the application.

**Implements**: `cpt-frontx-dashboard-algo-dashboard-runtime-publish-theme`, `cpt-frontx-dashboard-fr-theme`.

### Owner state machine and load lifecycle

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-dod-dashboard-runtime-owner`

The root **MUST** track its state with the owner state machine (`cpt-frontx-dashboard-state-dashboard-runtime-owner`): a new dashboard id while loading supersedes the earlier load; a new dashboard id after loading unregisters the loaded extensions first; a failed start (rejected domain) has no exit, and every later mount shows the same placeholder; unmounting the root changes no state. Returning to a dashboard the root has already loaded remounts its cells from the kept registrations without fetching the served file again, and runs every binding again. A superseded load is checked after every step that waits; the extensions it registered are unregistered; nothing is shown. A dashboard id that names no dashboard in the served file shows the dashboard-level cannot-be-shown state with a developer-log diagnostic naming the id.

**Implements**: `cpt-frontx-dashboard-state-dashboard-runtime-owner`, `cpt-frontx-dashboard-flow-dashboard-runtime-open`, `cpt-frontx-dashboard-flow-dashboard-runtime-leave`.

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
- [ ] An open larger view closes (its extension unmounts) when the viewer leaves the dashboard or another dashboard loads.
- [ ] A theme switch restyles every widget and the root's own chrome without a reload or a re-run binding.
- [ ] A language change updates the root's own text and every widget without a reload or a re-run binding.
- [ ] Leaving the dashboard unmounts every extension, including any open larger view; a late result for an unmounted extension is dropped.
- [ ] A shared request is sent once even when several widgets refer to it.
- [ ] An unknown `source` fails only its cell before anything runs.
- [ ] A failing shared request fails all its dependent cells.
- [ ] A static binding is evaluated and validated without a request, with no loader.
- [ ] A cell and its larger view are independent snapshots for the own and static forms; a shared-form larger view shows the same held response as its cell.
- [ ] Returning to a dashboard the root has already loaded remounts its cells from the kept registrations without fetching the served file again, and runs every binding again.
- [ ] While loading dashboard A, when the viewer opens dashboard B before A's bindings finish, A is discarded: nothing of A is shown, the extensions A registered are unregistered, and B loads.
- [ ] A dashboard id that names no dashboard in the served file shows the dashboard-level cannot-be-shown state with a developer-log diagnostic naming the id.
- [ ] A registry that rejects the `widgets` domain shows the dashboard-level cannot-be-shown state; a later mount, load, or larger-view opening shows the same placeholder.
- [ ] The placeholder is static: no retry, no error text, no failure class; each failure writes one developer-log diagnostic naming the dashboard id, widget id and type, and the failing step or request; it's never shown to the viewer.
- [ ] The root maps the host theme id to a UI-kit scope for its own chrome (cell frame, loaders, overlay, close button) and localizes its own text for the host language.
- [ ] In an MFE, the root reads the theme and language through the bridge's `getProperty`; in a single-page application, from the application.
