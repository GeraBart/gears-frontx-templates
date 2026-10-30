---
status: accepted
version: 1
date: 2026-10-30
description: The 4 template actions, the layout_cells and larger_view extension domains with their extension types, and the identifier rule of generated extensions, declared in package dashboard_v, with the processes by which the dashboards root and the larger-view modal start, load a dashboard, register generated extensions, answer data requests, show and close a larger view, publish theme and language, show the cannot-show placeholder, and tear down.
---

# Feature: Extension Domain Catalog


<!-- toc -->

- [1. Feature Context](#1-feature-context)
  - [1.1 Overview](#11-overview)
  - [1.2 Purpose](#12-purpose)
  - [1.3 Actors](#13-actors)
  - [1.4 References](#14-references)
- [2. Actor Flows (CDSL)](#2-actor-flows-cdsl)
  - [Domain-Model Feature — No Actor Flows](#domain-model-feature--no-actor-flows)
- [3. Processes / Business Logic (CDSL)](#3-processes--business-logic-cdsl)
  - [Start a Domain Owner](#start-a-domain-owner)
  - [Load a Dashboard](#load-a-dashboard)
  - [Select the Winning Realization](#select-the-winning-realization)
  - [Derive a Generated Extension Id](#derive-a-generated-extension-id)
  - [Register Generated Extensions](#register-generated-extensions)
  - [Build the Widget Context](#build-the-widget-context)
  - [Mount Cell Widgets](#mount-cell-widgets)
  - [Answer a Data Request](#answer-a-data-request)
  - [Open the Larger View from a Cell Widget](#open-the-larger-view-from-a-cell-widget)
  - [Show a Larger View](#show-a-larger-view)
  - [Restore a Larger View after a Refresh](#restore-a-larger-view-after-a-refresh)
  - [Close the Larger View](#close-the-larger-view)
  - [Publish Theme and Language](#publish-theme-and-language)
  - [Show the Cannot-Show Placeholder](#show-the-cannot-show-placeholder)
  - [Tear Down](#tear-down)
- [4. States (CDSL)](#4-states-cdsl)
  - [Owner State Machine](#owner-state-machine)
  - [Larger-View Modal State Machine](#larger-view-modal-state-machine)
- [5. Definitions of Done](#5-definitions-of-done)
  - [Domain Model Definition of Done](#domain-model-definition-of-done)
  - [Domains and Handlers](#domains-and-handlers)
  - [Owner Start and Dashboard Load](#owner-start-and-dashboard-load)
  - [Generated Extension Creation](#generated-extension-creation)
  - [Widget Context](#widget-context)
  - [Data Requests](#data-requests)
  - [Larger-View Modal](#larger-view-modal)
  - [Cannot-Show Placeholder and Loader](#cannot-show-placeholder-and-loader)
  - [Theme and Language](#theme-and-language)
  - [Teardown](#teardown)
- [6. Domain Model](#6-domain-model)
  - [6.1 Template Action: set_widget_context](#61-template-action-set_widget_context)
  - [6.2 Template Action: request_data](#62-template-action-request_data)
  - [6.3 Template Action: set_data](#63-template-action-set_data)
  - [6.4 Template Action: show_larger_view](#64-template-action-show_larger_view)
  - [6.5 Extension Domain: layout_cells](#65-extension-domain-layout_cells)
  - [6.6 Extension Domain: larger_view](#66-extension-domain-larger_view)
  - [6.7 Extension Type: layout_cells](#67-extension-type-layout_cells)
  - [6.8 Extension Type: larger_view](#68-extension-type-larger_view)
  - [6.9 Generated Extension Identifier Rule](#69-generated-extension-identifier-rule)
  - [6.10 Declarations and Admission](#610-declarations-and-admission)
  - [6.11 Sequence Coverage](#611-sequence-coverage)
- [7. Acceptance Criteria](#7-acceptance-criteria)

<!-- /toc -->

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-featstatus-extension-domain-catalog`
## 1. Feature Context

- [ ] `p2` - `cpt-frontx-dashboard-feature-extension-domain-catalog`

### 1.1 Overview

This is a **domain-model feature** with owner processes. It declares the template's runtime contracts between the domain owners and the widgets: the 4 template actions, and the 2 extension domains `layout_cells` and `larger_view` with the extension type of each. It also specifies how the two domain owners, the dashboards root and the larger-view modal, run these contracts. Section 3 holds the processes, section 4 the states that each owner keeps, and section 6 the types. The actor-flow section is a short note.

### 1.2 Purpose

Declare the template's runtime contracts between the domain owners and the widgets, the 4 template actions and the 2 domains `layout_cells` and `larger_view` with their extension types, and specify how the dashboards root and the larger-view modal load a dashboard, register generated extensions, answer data requests, and tear down.

The **dashboards root** is whatever hosts the dashboards: a screen extension of the shell screen domain, or code copied into the shell of a single-page application. The **larger-view modal** is the static, routed extension of the shell's `popup` domain that shows larger views. Both are **domain owners**: each implements one extension domain in its own registry and answers the data requests of the widgets in it.

**Scope**:

- The 4 template actions with their closed payloads, which carry no widget data and no backend detail.
- The `layout_cells` domain (Concurrent) and the `larger_view` domain (Optional) with their declarations and the extension type of each. Each domain lists `request_data` in its actions, and its handler is registered when the domain is built.
- The rule that a handler of `request_data` or `show_larger_view` resolves on acceptance, and that `set_data` is always an own chain of the owner.
- The generated-extension identifier rule.
- The owner start: each domain owner registers its domain, runs the GTS file loader, registers the type schemas of the served query families that the data adapter declares, and registers in its own registry the `widgets` manifest and every manifest whose entries a registered widget realization names, consumer packages included. A domain that the registry rejects ends the start with the dashboard-level placeholder.
- The republication of theme and language on every mount of an owner, before any extension of its domain mounts.
- The owner's load of a dashboard: the call to "get a dashboard", registration of the delivered types and one GTS validation of the dashboard, applying the delivery and attribution rules of the dashboard root types feature, the layout checks, the cross-checks of the widget catalog (registered members, the time dimension, date pairs, order members, operator kinds and filter values, member kinds, and the grid checks) and the served-family check for each widget, then creation of the generated extensions. A load that another load has superseded is discarded. The rules themselves stay with the features that define them.
- The return of the dashboards root to its loaded dashboard: its cells mount again from the registered generated extensions, without a second load.
- The realization precedence applied when the owner creates extensions: the highest weight wins; a tie or no realization gives the cell or larger-view cannot-show.
- The process by which a domain owner registers generated extensions in its own registry, only when a dashboard loads, and unregisters them.
- The process by which a domain owner answers a data request: it accepts `request_data`, calls "run a query" on the data adapter with the request unchanged, drops an answer whose data shape differs from the requested one, and sends `set_data` to `reply_to`. The owners keep no widget data and make no backend call.
- The dashboard-area loader, the static "cannot be shown" placeholder at both levels, and the diagnostics.
- The cannot-show outcomes of extension creation, each limited to one cell or larger view: no single winning realization, a rejected registration, a failed mount, or a failed `set_widget_context`. A member that names no registered instance fails the load-time cross-check of the widget catalog, which owns that check. The owner places the placeholder for the widget-level triggers that the widget catalog defines, and for a requested larger-view widget id that is not in the dashboard, including after a refresh.
- The states that each owner keeps (section 4).
- The larger-view modal as a domain owner: the `show_larger_view` handler with the two ids kept in the modal's own subroute, the load of the dashboard when it has not loaded that one, the chain that shows the requested larger-view extension, the restoration after a refresh, the modal's close button, and the modal keeping its loaded dashboard when closed. Its first mount runs the owner start.
- The chain of the cell widget that opens the larger view: `mount_ext` of the larger-view modal in the shell's `popup` domain, then `show_larger_view`. Both `mount_ext` and `unmount_ext` of the larger-view modal carry `history: "none"`.
- The theme and language shared properties of both domains, published unchanged, so a theme switch is a shared-property change with no request. Each owner maps the host theme id to the ui-kit scope for its own chrome, which is the owner-chrome side of `cpt-frontx-dashboard-seq-theme-switch`.
- Accessibility of the larger-view modal: the close button and its keyboard operability.
- The teardown: `unmount_ext` of every cell on leaving the dashboard, with the loaded dashboard and its registrations kept until another dashboard loads.
- The load path that enables the initial-render measurement: one dashboard load, parallel mounts, and handlers that resolve on acceptance.

**Out of scope**:

- The realization type, its fields and package placement stay with the MFE entries (`cpt-frontx-dashboard-feature-mfe-entries`), as do the realizations, the entries, the static and routed extensions, and the package contents.
- The `popup` domain, its lifecycle actions, and its modal container: the shell implements the domain, and the container is a `template-shell` prerequisite (DESIGN section 4). The `unmount_ext` of the occupant by the container on a click outside, a FrontX version that supports GTS v0.17, and a GTS type store shared across the realm are prerequisites of the same kind.
- What a widget's larger view shows, which belongs to the widget type.
- The operations, errors, and access rules of the data adapter (`cpt-frontx-dashboard-feature-data-adapter-contract`).
- The widget types, their checks, the chrome states, and their wordings (`cpt-frontx-dashboard-feature-widget-catalog`).

**Depends on**: `cpt-frontx-dashboard-feature-dashboard-root-types`, `cpt-frontx-dashboard-feature-widget-catalog`, `cpt-frontx-dashboard-feature-widget-data-catalog`, `cpt-frontx-dashboard-feature-query-vocabulary`.

**Declaring package**: the `dashboard` template package. The 4 action types, the 2 domains and the 2 extension types belong to the GTS package `dashboard_v` and refer only to `dashboard_m` types. The action types and extension types are registered with the template's schemas before any dashboard loads (`cpt-frontx-dashboard-feature-mfe-entries`). Each owner registers its domain instance itself, in its own registry, with its own domain implementation (section 3, Start a Domain Owner).

**Requirements**: `cpt-frontx-dashboard-fr-domain-model`, `cpt-frontx-dashboard-fr-dashboards-root`, `cpt-frontx-dashboard-fr-widget-modal`, `cpt-frontx-dashboard-fr-theme`, `cpt-frontx-dashboard-fr-loading-error-states`, `cpt-frontx-dashboard-fr-grid-sort-page`, `cpt-frontx-dashboard-fr-data-adapter`, `cpt-frontx-dashboard-fr-backend-source`, `cpt-frontx-dashboard-nfr-initial-render`, `cpt-frontx-dashboard-nfr-accessibility`, `cpt-frontx-dashboard-nfr-visual-quality`, `cpt-frontx-dashboard-fr-replacement-widget`

**Use cases**: `cpt-frontx-dashboard-usecase-view-dashboard` (through the 8 runtime sequences of section 6.11)

**Principles**: `cpt-frontx-dashboard-principle-own-registry-registration`, `cpt-frontx-dashboard-principle-dashboards-root-orchestration`, `cpt-frontx-dashboard-principle-render-only-dashboards-root`, `cpt-frontx-dashboard-principle-gts-contracts`, `cpt-frontx-dashboard-principle-per-instance-isolation`

**Constraints**: `cpt-frontx-dashboard-constraint-gts-id-convention`, `cpt-frontx-dashboard-constraint-role-based-host-ids`, `cpt-frontx-dashboard-constraint-one-dashboards-root-per-tree`

### 1.3 Actors

N/A. This is a domain-model feature. Its processes run inside the two domain owners and are started by FrontX, by the host, or by an action, not by an end-user actor directly. The dashboard viewer and the host application take part in the DESIGN sequences that these processes realize (section 6.11). No actor flows are authored here.

Not applicable here: authentication and authorization (SEC), because the owners request dashboards and data only through the data adapter, which owns access; the only untrusted input is the pair of ids in the modal's subroute, which section 3, Restore a Larger View after a Refresh, handles. Data persistence (DATA), because the owners store nothing beyond the runtime. Rollout and operations (OPS), because the owners are template code with no service of their own. Performance (PERF) applies only through the load path that `cpt-frontx-dashboard-nfr-initial-render` measures: one dashboard load, all generated extensions registered before any mount, parallel mounts, and handlers that resolve on acceptance.

### 1.4 References

- **PRD**: [PRD.md](../../PRD.md)
- **Design**: [DESIGN.md](../../DESIGN.md) section 2.1 (principles), section 3.1 (Layout, Dashboard, Realization, Actions, and Domains; Generated extensions), section 3.2 (Dashboards Root, Larger-View Modal), section 3.3 (Widget Realization, Template Actions, Template Extension Domains), section 3.5 (host contract), section 3.6 (all sequences), section 4 (prerequisites (a) to (d) and handoffs)
- **ADRs**: [ADR-0007](../../ADR/0007-extension-domain-taxonomy-v1.md) (`cpt-frontx-dashboard-adr-extension-domain-taxonomy`: domains, actions, the larger-view modal, deterministic ids, declarations and admission), [ADR-0011](../../ADR/0011-data-adapter-v1.md) (`cpt-frontx-dashboard-adr-data-adapter`: the data adapter calls and the cannot-show triggers), [ADR-0008](../../ADR/0008-widget-type-and-mfe-realization-v1.md) (`cpt-frontx-dashboard-adr-widget-type-and-mfe-realization`: realization precedence), [ADR-0010](../../ADR/0010-template-packages-and-host-contract-v1.md) (`cpt-frontx-dashboard-adr-template-packages-and-host-contract`: host contract, the modal container prerequisite, the template's GTS file), [ADR-0006](../../ADR/0006-theme-distribution-v1.md) (`cpt-frontx-dashboard-adr-theme-distribution`: theme and language), [ADR-0003](../../ADR/0003-shared-data-types-and-schemas-v1.md) (`cpt-frontx-dashboard-adr-shared-data-types-and-schemas`: packages, literal base operands, polymorphic validation)
- **Design elements**:
  - Components: `cpt-frontx-dashboard-component-dashboards-root` and `cpt-frontx-dashboard-component-larger-view-modal` (owned here for their behavior); `cpt-frontx-dashboard-component-gts-file-loader` (shared (start side), owned by `cpt-frontx-dashboard-feature-mfe-entries`: the step at which each domain owner runs the loader before any dashboard loads).
  - API: `cpt-frontx-dashboard-interface-host-actions`; `cpt-frontx-dashboard-interface-template-domains`; `cpt-frontx-dashboard-interface-widget-realization` (shared, owned by `cpt-frontx-dashboard-feature-mfe-entries`: the realization precedence used when the generated extensions are created); `cpt-frontx-dashboard-contract-host-areas` (the `popup` domain by role, as the target of the cell widget's chain); `cpt-frontx-dashboard-interface-domain-model` (action and domain part).
  - Sequences: `cpt-frontx-dashboard-seq-initial-load`, `cpt-frontx-dashboard-seq-query-change`, `cpt-frontx-dashboard-seq-widget-modal-open`, `cpt-frontx-dashboard-seq-larger-view-refresh`, `cpt-frontx-dashboard-seq-larger-view-close`, `cpt-frontx-dashboard-seq-cannot-show`, `cpt-frontx-dashboard-seq-theme-switch`, `cpt-frontx-dashboard-seq-teardown` (owner side of each; the other sides are listed in section 6.11).
- **Dependencies**:
  - [feature-dashboard-root-types](../feature-dashboard-root-types/FEATURE.md): the delivery set and its registration order, the dashboard validation with the attribution of its failures, and the dashboard-level cannot-show triggers that the owners apply at load.
  - [feature-widget-catalog](../feature-widget-catalog/FEATURE.md): the widget base carried in `set_widget_context`, the traits `data_shape` and `fill`, the widget checks and cross-checks, the chrome with its larger-view button, the scope mapping rule, and the wordings of every state.
  - [feature-widget-data-catalog](../feature-widget-data-catalog/FEATURE.md): the data shape base carried in `request_data` and `set_data`, and the FrontX validation of `set_data`.
  - [feature-query-vocabulary](../feature-query-vocabulary/FEATURE.md): the query base carried in `request_data`, the measure and dimension instances whose metadata `set_widget_context` carries, and the effective-traits contract.
- **Related**:
  - [feature-mfe-entries](../feature-mfe-entries/FEATURE.md): the widget realization type and the template's realizations, the widget entries with their `actions` and `domainActions`, the larger-view modal's entry and static, routed extension with its fixed identifier, the dashboards root's entry and routed extension, and the template's GTS file. This feature uses them by identifier at run time.
  - [feature-layout-types](../feature-layout-types/FEATURE.md): the cell with its `widget` and optional `larger_view`, the layout checks, and the placement rule on the 60-column grid. This feature uses it by identifier only: it is a reference, not a dependency, because the owners run the layout checks through `cpt-frontx-dashboard-feature-dashboard-root-types`.
  - [feature-data-adapter-contract](../feature-data-adapter-contract/FEATURE.md): the operations "get a dashboard" and "run a query", the served query families and their check, and data that never arrives. This feature specifies the call side.

## 2. Actor Flows (CDSL)

**Use cases**: `cpt-frontx-dashboard-usecase-view-dashboard`

### Domain-Model Feature — No Actor Flows

N/A. This feature declares GTS types and specifies processes that run inside the two domain owners. The dashboard viewer acts only through the widgets, the larger-view modal's close button and the shell's modal container. The flows that the viewer sees are the 8 DESIGN sequences, and section 6.11 maps each of them to the processes of section 3.

## 3. Processes / Business Logic (CDSL)

The processes below run in a domain owner, the dashboards root or the larger-view modal. Where a step differs between the two owners, the step says so. "Own registry" means the registry that holds the owner's domain: the nested registry of the larger-view modal, the nested registry of the dashboards root as a screen extension, or the shell's registry for the dashboards root as shell code. A chain is a FrontX actions chain: each step runs after the one before it succeeds, `next` runs on success and `fallback` on failure, and nothing comes back to the sender.

### Start a Domain Owner

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-algo-extension-domain-catalog-start-owner`

**Input**: every mount of the larger-view modal or of the dashboards root as a screen extension, and every time the shell shows the dashboards root as shell code. Steps 1 to 10 run on the first of these only; steps 11 to 13 run on each of them.

**Output**: the owner started, with its domain registered in its own registry with its handlers, theme and language published on it with their current values, the template's GTS file registered, the type schemas of the served query families registered, and the widget manifests and entries known to the own registry; or the owner's start failed, with the dashboard-level placeholder. A start step that fails leaves a diagnostic and the cannot-show outcomes named below.

**Steps**:

1. [ ] - `p1` - On the first mount, as a screen extension and as the larger-view modal, the owner builds its own registry synchronously inside its `mount`. As shell code, the dashboards root uses the shell's registry. A later mount skips to step 11 and keeps the registry, the domain, the handlers and the registrations, because a nested registry is built in the first mount and its registrations survive an unmount - `inst-start-own-registry`
2. [ ] - `p1` - The owner registers its domain with `registerDomain` in its own registry: `layout_cells` with the Concurrent strategy for the dashboards root, `larger_view` with the Optional strategy for the larger-view modal, with the declarations of sections 6.5 and 6.6 - `inst-start-register-domain`
3. [ ] - `p1` - In its domain implementation's `build(ctx)`, the owner registers its `mount_ext` and `unmount_ext` handlers, which wrap those of the strategy, and its own `request_data` handler (`cpt-frontx-dashboard-algo-extension-domain-catalog-answer-data-request`) with `ctx.registerHandler`. The registry accepts the domain only when every listed action has a handler and every handler is listed - `inst-start-build-handlers`
4. [ ] - `p1` - **IF** the registry rejects the domain - `inst-start-if-domain-rejected`
   1. [ ] - `p1` - The owner writes a diagnostic, shows the dashboard-level placeholder in place of the dashboard or in the modal (`cpt-frontx-dashboard-algo-extension-domain-catalog-show-placeholder`), loads no dashboard, and enters the start-failed placeholder state (section 4). The larger-view modal still registers its `show_larger_view` handler as in step 6, and that handler then only keeps this placeholder. A later mount, a later load and a later `show_larger_view` show the same placeholder - `inst-start-domain-rejected`
   2. [ ] - `p1` - **RETURN** start failed - `inst-start-return-failed`
5. [ ] - `p1` - The owner subscribes to changes of the host theme id and the host language, and publishes each change by `cpt-frontx-dashboard-algo-extension-domain-catalog-publish-shared-properties` - `inst-start-publish-properties`
6. [ ] - `p1` - The larger-view modal registers its `show_larger_view` handler (`cpt-frontx-dashboard-algo-extension-domain-catalog-show-larger-view`) through its bridge's `registerActionHandler`. Its `mount` resolves only after this handler is registered - `inst-start-modal-handler`
7. [ ] - `p1` - Without holding its `mount`, the owner runs the GTS file loader: it fetches the template's GTS file, registers its types and instances, including the widget realizations, and keeps the list of realizations it registered - `inst-start-gts-file`
8. [ ] - `p1` - **IF** the GTS file cannot be fetched, or the registry rejects an entry of it - `inst-start-if-gts-file-fails`
   1. [ ] - `p1` - The owner writes a diagnostic that names the file or the rejected entry and continues with the entries that were registered; a widget type without a registered realization gets the widget-level placeholder at load - `inst-start-gts-file-fails`
9. [ ] - `p1` - The owner reads the data adapter's declaration of served query families, which returns the type schema of each family, and registers each schema in GTS (`cpt-frontx-dashboard-feature-data-adapter-contract`). A schema that GTS rejects is not registered, with a diagnostic that names it, so its family is not served - `inst-start-query-families`
10. [ ] - `p1` - The owner fetches the manifest channel and registers in its own registry the `widgets` manifest and every manifest that the entries of its registered widget realizations point to, consumer packages included, with their entries. As shell code, its own registry is the shell's registry, and a manifest that the shell's bootstrap has already registered there is not registered again. A manifest that cannot be fetched or registered leaves a diagnostic; the widgets whose winning entry it holds get the widget-level placeholder when their mount fails - `inst-start-widget-entries`
11. [ ] - `p1` - **IF** the owner's start has failed - `inst-start-if-failed`
    1. [ ] - `p1` - Show the dashboard-level placeholder again. **RETURN** start failed - `inst-start-failed-again`
12. [ ] - `p1` - On this mount, before any extension of its domain mounts or mounts again, the owner reads the current host theme id and host language, with `getProperty` through its bridge or, as shell code, from the shell, and publishes them on its domain with `updateSharedProperty` by `cpt-frontx-dashboard-algo-extension-domain-catalog-publish-shared-properties`. FrontX does not replay property updates when a bridge is activated again, so a value that changed while the owner was unmounted reaches its domain only this way - `inst-start-republish`
13. [ ] - `p1` - **RETURN** started - `inst-start-return`

### Load a Dashboard

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-algo-extension-domain-catalog-load-dashboard`

**Input**: the owner and a dashboard id. The dashboards root takes the id from its address: from its route as a screen extension, or from the host's address as shell code. The larger-view modal takes it from `show_larger_view` or from its own subroute.

**Output**: the owner's loaded dashboard. It is either the dashboard-level placeholder, or, for each widget of the owner's role, a registered generated extension or the widget-level placeholder. The role is "cell" for the dashboards root and "larger view" for the larger-view modal. A load that a later load supersedes has no output.

**Steps**:

1. [ ] - `p1` - Wait until the owner start (`cpt-frontx-dashboard-algo-extension-domain-catalog-start-owner`) has finished - `inst-load-wait-start`
2. [ ] - `p1` - **IF** the owner start failed - `inst-load-if-start-failed`
   1. [ ] - `p1` - Keep the dashboard-level placeholder of the failed start; call nothing and register nothing. **RETURN** - `inst-load-start-failed`
3. [ ] - `p1` - **IF** the owner is the dashboards root and the dashboard id is the one it has loaded, or is loading - `inst-load-if-same-dashboard`
   1. [ ] - `p1` - Load nothing again: once that dashboard is loaded, show its outcome again. A dashboard-level placeholder shows again; otherwise the cells are placed, each widget with a widget-level placeholder shows it again, and the cells mount again from the registered generated extensions by `cpt-frontx-dashboard-algo-extension-domain-catalog-mount-cell-widgets`. **RETURN** - `inst-load-same-dashboard`
4. [ ] - `p1` - Record the dashboard id as the one the owner is loading. A dashboards root that holds another loaded dashboard has first run its teardown for another dashboard (`cpt-frontx-dashboard-algo-extension-domain-catalog-teardown`) - `inst-load-record-id`
5. [ ] - `p1` - Show the loader in place of the dashboard; the larger-view modal shows it in the modal - `inst-load-show-loader`
6. [ ] - `p1` - Call "get a dashboard" on the data adapter once, with the dashboard id - `inst-load-get-dashboard`
7. [ ] - `p1` - **IF** the owner has started to load another dashboard id since step 4. This check runs here, after the call to the data adapter, and again after each later step that waits: step 9, step 10 and step 15 - `inst-load-if-superseded`
   1. [ ] - `p1` - Discard this load: show nothing of it, register nothing more, and unregister any generated extension that step 15 registered. Delivered types that step 9 registered stay, because GTS keeps them. **RETURN** - `inst-load-superseded`
8. [ ] - `p1` - **IF** the data adapter returns no dashboard - `inst-load-if-no-dashboard`
   1. [ ] - `p1` - The loader stays, with no error message and no timeout; this is data that never arrives, not a cannot-show trigger. **RETURN** - `inst-load-no-dashboard`
9. [ ] - `p1` - Register the delivered types and instances by `cpt-frontx-dashboard-algo-dashboard-root-types-register-delivery`. A dataset type whose query family is not served is skipped with a diagnostic and is not a registration failure; the widgets whose query names it get the widget-level placeholder at step 14 - `inst-load-register-delivery`
10. [ ] - `p1` - Validate the dashboard by `cpt-frontx-dashboard-algo-dashboard-root-types-validate-dashboard`: one GTS validation of the whole dashboard, followed by the layout checks. That process applies the attribution rule of the dashboard root types feature, which gives each failure to a cell widget, a larger-view widget or the whole dashboard - `inst-load-validate-dashboard`
11. [ ] - `p1` - **IF** step 9 or step 10 returns a dashboard-level trigger - `inst-load-if-dashboard-trigger`
    1. [ ] - `p1` - Show the dashboard-level placeholder (`cpt-frontx-dashboard-algo-extension-domain-catalog-show-placeholder`), mount no cells, and register nothing. **RETURN** - `inst-load-dashboard-trigger`
12. [ ] - `p1` - The dashboards root replaces its loader with the cells, placed on the 60-column grid at the positions the layout gives (`cpt-frontx-dashboard-feature-layout-types`) - `inst-load-place-cells`
13. [ ] - `p1` - Take the widgets of the owner's role: each cell's `widget` for the dashboards root, and each cell's `larger_view` widget, where a cell has one, for the larger-view modal. A validation failure attributed to a widget of the other role does not affect this owner - `inst-load-take-widgets`
14. [ ] - `p1` - **FOR EACH** widget taken, on its own - `inst-load-for-each-widget`
    1. [ ] - `p1` - Take the validation failures that step 10 attributed to the widget. Then run the cross-checks of the widget catalog by `cpt-frontx-dashboard-algo-widget-catalog-cross-check-widget`: registered members, the time dimension, date pairs, order members, operator kinds and filter values, member kinds, and the grid checks - `inst-load-validate-widget`
    2. [ ] - `p1` - For a data widget, check that the data adapter serves the query family in the type chain of the query's `id` (`cpt-frontx-dashboard-feature-data-adapter-contract`) - `inst-load-served-family`
    3. [ ] - `p1` - Select the winning realization by `cpt-frontx-dashboard-algo-extension-domain-catalog-select-realization` - `inst-load-select-realization`
    4. [ ] - `p1` - **IF** the widget has an attributed failure, or any of these steps fails - `inst-load-if-widget-fails`
       1. [ ] - `p1` - Give that widget the widget-level placeholder: in its cell for the dashboards root, or in the modal when the larger-view modal shows it. The other widgets continue - `inst-load-widget-fails`
15. [ ] - `p1` - Register the generated extensions of the widgets that passed by `cpt-frontx-dashboard-algo-extension-domain-catalog-register-generated-extensions` - `inst-load-register-extensions`
16. [ ] - `p1` - **RETURN** the loaded dashboard. The dashboards root, while it is mounted, then mounts its cells (`cpt-frontx-dashboard-algo-extension-domain-catalog-mount-cell-widgets`); the larger-view modal shows the requested widget (`cpt-frontx-dashboard-algo-extension-domain-catalog-show-larger-view`) - `inst-load-return`

A dashboard is requested once per load. The dashboards root loads it when the address names a dashboard id other than the one it has loaded; for the id it has loaded, it mounts the cells again (step 3). The larger-view modal loads it only when it has not loaded that dashboard id. The superseded-load check of step 7 runs after every step that waits, so a superseded load never shows a placeholder or a cell and leaves no generated extension registered.

### Select the Winning Realization

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-algo-extension-domain-catalog-select-realization`

**Input**: one widget and its role, cell or larger view; the realizations that the owner registered from the template's GTS file.

**Output**: the entry of the winning realization for that role, or a widget-level trigger that names the widget type, and for a tie the tied realizations.

**Steps**:

1. [ ] - `p1` - Take the widget type: the type that the widget's `id` names, the chain up to and including its last `~`, whose rightmost segment is the widget type - `inst-select-widget-type`
2. [ ] - `p1` - Collect the realizations that the owner registered whose `widget_type` equals that type. The owner keeps this list itself, because FrontX offers no listing of registered instances - `inst-select-collect`
3. [ ] - `p1` - **IF** no realization names the widget type - `inst-select-if-none`
   1. [ ] - `p1` - **RETURN** the widget-level trigger "no realization", naming the widget type - `inst-select-none`
4. [ ] - `p1` - Take each realization's `weight`; a realization without `weight` counts as 1 - `inst-select-weights`
5. [ ] - `p1` - **IF** two or more realizations share the highest weight - `inst-select-if-tie`
   1. [ ] - `p1` - **RETURN** the widget-level trigger "tied realizations", naming the widget type and the tied realizations - `inst-select-tie`
6. [ ] - `p1` - Take the single realization with the highest weight as the winner. A replacement realization with a weight above 1 wins over the template's realization, which stays registered but unused - `inst-select-winner`
7. [ ] - `p1` - **IF** the role is larger view and the winner names `larger_view_entry` - `inst-select-if-larger-view-entry`
   1. [ ] - `p1` - **RETURN** its `larger_view_entry` - `inst-select-larger-view-entry`
8. [ ] - `p1` - **RETURN** its `entry` - `inst-select-entry`

### Derive a Generated Extension Id

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-algo-extension-domain-catalog-derive-extension-id`

**Input**: the widget's full `id`, its role, and the entry selected for it.

**Output**: the identifier of the widget's generated extension (section 6.9).

**Steps**:

1. [ ] - `p1` - Take the role token: `cell` for a cell widget, `larger_view` for a larger-view widget - `inst-derive-role`
2. [ ] - `p1` - Build the name: the widget's full `id`, the role token and the entry id, joined by `|`, a character that no GTS identifier contains - `inst-derive-name`
3. [ ] - `p1` - Compute a UUIDv5 from the template namespace (section 6.9) and the UTF-8 bytes of the name, in lower-case canonical form - `inst-derive-uuid`
4. [ ] - `p1` - **RETURN** the extension type of the role's domain followed by the UUIDv5: `gts.frontx.mfes.ext.extension.v1~frontx.dashboard_v.layout.layout_cells.v1~<uuidv5>` for a cell, `gts.frontx.mfes.ext.extension.v1~frontx.dashboard_v.layout.larger_view.v1~<uuidv5>` for a larger view - `inst-derive-return`

### Register Generated Extensions

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-algo-extension-domain-catalog-register-generated-extensions`

**Input**: the owner, its domain, and the widgets of the loaded dashboard that passed their checks, each with the entry selected for it.

**Output**: one generated extension per such widget, registered in the owner's own registry, or the widget-level placeholder for a widget whose registration is rejected.

**Steps**:

1. [ ] - `p1` - The owner holds no generated extensions of another dashboard: the dashboards root unregistered them in its teardown for another dashboard (`cpt-frontx-dashboard-algo-extension-domain-catalog-teardown`), and the larger-view modal before its load (`cpt-frontx-dashboard-algo-extension-domain-catalog-show-larger-view`) - `inst-register-precondition`
2. [ ] - `p1` - **IF** no widget passed, for example in a layout with no cells or a dashboard without larger-view widgets - `inst-register-if-none`
   1. [ ] - `p1` - Register nothing. **RETURN** an empty result - `inst-register-none`
3. [ ] - `p1` - **FOR EACH** widget that passed - `inst-register-for-each`
   1. [ ] - `p1` - Derive its identifier by `cpt-frontx-dashboard-algo-extension-domain-catalog-derive-extension-id` - `inst-register-derive-id`
   2. [ ] - `p1` - Build the declaration, an instance of the domain's extension type (sections 6.7 and 6.8), with `id`, `domain` set to the owner's domain, and `entry` set to the selected entry - `inst-register-declaration`
   3. [ ] - `p1` - Register it with `registerExtension` in the owner's own registry, which holds the domain, and in no other registry. FrontX admits the entry by the subset rule (section 6.10) - `inst-register-call`
   4. [ ] - `p1` - **IF** the registry rejects the registration - `inst-register-if-rejected`
      1. [ ] - `p1` - Give that widget the widget-level placeholder with a diagnostic; the other widgets continue - `inst-register-rejected`
4. [ ] - `p1` - **RETURN** the registered extensions, by widget id. The dashboards root registers all of them before it mounts any cell - `inst-register-return`

An owner registers generated extensions only here, when it loads a dashboard. It registers none on a click, none when a larger view of an already loaded dashboard opens, none when the dashboards root returns to its loaded dashboard, and none into the shell's registry or an ancestor's registry. Loading the same dashboard again gives the same identifiers, so what FrontX keeps per extension id is reused, not added.

### Build the Widget Context

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-algo-extension-domain-catalog-build-widget-context`

**Input**: one widget of the loaded dashboard, its role, the cell that holds it, and the loaded dashboard id.

**Output**: the payload of `set_widget_context` for that widget (section 6.1), or a widget-level trigger that names the widget and a member id.

**Steps**:

1. [ ] - `p1` - Set `widget` to the widget instance, unchanged - `inst-context-widget`
2. [ ] - `p1` - **IF** the widget is a data widget - `inst-context-if-data`
   1. [ ] - `p1` - Read the effective traits of its widget type with the trait helper (`cpt-frontx-dashboard-algo-query-vocabulary-effective-traits`), and copy `data_shape` and `fill` unchanged into the payload - `inst-context-traits`
   2. [ ] - `p1` - Set `members`: one entry per distinct query member. Collect the member ids from `measures`, `dimensions`, `timeDimensions[0].dimension`, each `filters[].member`, and the first item of each `order` pair. Each entry has `id`, `title`, `value_type` and, for a measure that has one, `unit`, read from the registered measure or dimension instance - `inst-context-members`
   3. [ ] - `p1` - **IF** a member id names no registered measure or dimension instance. This is a guard only. It cannot trigger after the load-time cross-check of the widget catalog, which owns the registered-instance check (`cpt-frontx-dashboard-algo-widget-catalog-cross-check-widget`) - `inst-context-if-member-missing`
      1. [ ] - `p1` - **RETURN** the widget-level trigger "unregistered member", naming the widget and the member id. The owner sends no `mount_ext` for the widget - `inst-context-member-missing`
3. [ ] - `p1` - **IF** the role is cell and the cell has a `larger_view` widget - `inst-context-if-larger-view`
   1. [ ] - `p1` - Set `larger_view` to the loaded dashboard id as `dashboard` and the larger-view widget's `id` as `widget` - `inst-context-larger-view`
4. [ ] - `p1` - Add no widget data, no theme, no language and no backend detail - `inst-context-nothing-else`
5. [ ] - `p1` - **RETURN** the payload - `inst-context-return`

A larger-view widget never receives `larger_view`, so it shows no larger-view button. A `markdown_card` receives only `widget`, and, in a cell with a larger view, `larger_view`.

### Mount Cell Widgets

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-algo-extension-domain-catalog-mount-cell-widgets`

**Input**: the cell extensions that the dashboards root registered for the loaded dashboard, after a load or when the dashboards root returns to its loaded dashboard.

**Output**: each cell widget mounted in its cell with its context, or the widget-level placeholder in that cell.

**Steps**:

1. [ ] - `p1` - **FOR EACH** registered cell extension, without waiting for the other cells - `inst-mount-for-each`
   1. [ ] - `p1` - Build its context by `cpt-frontx-dashboard-algo-extension-domain-catalog-build-widget-context` - `inst-mount-build-context`
   2. [ ] - `p1` - **IF** building the context returns a widget-level trigger - `inst-mount-if-context-trigger`
      1. [ ] - `p1` - The cell shows the widget-level placeholder with a diagnostic, and no chain runs for it - `inst-mount-context-trigger`
   3. [ ] - `p1` - Run one chain with `executeActionsChain` on the own registry: `mount_ext` on `layout_cells` with the cell extension as `subject`; as `next`, `set_widget_context` to the cell extension with the context, whose `fallback` is `unmount_ext` of the same cell extension on `layout_cells` - `inst-mount-chain`
   4. [ ] - `p1` - The Concurrent strategy creates a container for the cell extension, and the domain's mounter places it in the cell. The entry's `mount` resolves only after the widget has registered its action handlers, so its `set_data` handler exists before its first `request_data` - `inst-mount-container`
   5. [ ] - `p1` - **IF** the strategy's mount fails inside the dashboards root's `mount_ext` handler, for example because the widget's entry does not load - `inst-mount-if-mount-fails`
      1. [ ] - `p1` - The handler sees the failure; the cell shows the widget-level placeholder with a diagnostic, and `mount_ext` is not sent again for it - `inst-mount-mount-fails`
   6. [ ] - `p1` - **IF** the `set_widget_context` step fails - `inst-mount-if-context-fails`
      1. [ ] - `p1` - Its `fallback` unmounts the cell extension; the dashboards root's `unmount_ext` handler receives this `unmount_ext`, which no teardown started, and the cell shows the widget-level placeholder with a diagnostic - `inst-mount-context-fails`
2. [ ] - `p1` - **RETURN**. The other cells are unaffected by a failure in one cell - `inst-mount-return`

All chains run in parallel. A `markdown_card` renders right after its context. A data widget shows its loader and sends `request_data` to `layout_cells`.

**Detected failures and their limit.** The owner detects exactly two kinds of chain failure: a failure inside its own `mount_ext` or `unmount_ext` handler, which wrap those of the strategy, such as the failed mount of a cell or the failed leading `unmount_ext` in the modal, and a failed `set_widget_context`, through its `fallback`. A failure that FrontX produces outside the handler, such as the action timeout of a `mount_ext` step or the replacement of a queued action, reaches neither the handler nor a `fallback` that the owner can see. This is a known limit: that cell stays empty, with no placeholder and no diagnostic. The same limit holds for the larger-view modal.

### Answer a Data Request

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-algo-extension-domain-catalog-answer-data-request`

**Input**: a `request_data` action targeted at the owner's domain, delivered by FrontX to the handler that the owner registered in `build(ctx)`.

**Output**: one `set_data` sent as the owner's own chain to `reply_to`, or nothing.

**Steps**:

1. [ ] - `p1` - FrontX has validated the action against the `request_data` schema (section 6.2), and its query against the dataset that the query's `id` names, before the handler runs - `inst-answer-validated`
2. [ ] - `p1` - **IF** `reply_to` is not a mounted generated extension of the owner's domain - `inst-answer-if-unknown-reply-to`
   1. [ ] - `p1` - Drop the request and resolve the handler. **RETURN** - `inst-answer-unknown-reply-to`
3. [ ] - `p1` - Take the request and resolve the handler at once. The chain step of `request_data` ends here, and the action timeout, or the domain default of 30 000 ms, covers only this time - `inst-answer-accept`
4. [ ] - `p1` - Outside the chain, call "run a query" on the data adapter with the request payload unchanged: `data` with the `timezone` that the widget set, `data_shape`, `fill`, `reply_to` and `timestamp`. While one call waits, the owner keeps taking and answering other requests - `inst-answer-run-query`
5. [ ] - `p1` - **IF** the call never returns a data instance - `inst-answer-if-no-data`
   1. [ ] - `p1` - Send nothing; the widget keeps its loader, with no error message and no timeout. **RETURN** - `inst-answer-no-data`
6. [ ] - `p1` - **IF** `reply_to` is not mounted in the owner's domain when the answer arrives - `inst-answer-if-unmounted`
   1. [ ] - `p1` - Drop the answer. **RETURN** - `inst-answer-unmounted`
7. [ ] - `p1` - **IF** the data shape that the data instance's `id` names, its type chain up to and including its last `~`, is not the request's `data_shape` - `inst-answer-if-shape-mismatch`
   1. [ ] - `p1` - Drop the answer and write a diagnostic that names both data shapes; the widget keeps its loader. **RETURN** - `inst-answer-shape-mismatch`
8. [ ] - `p1` - Send `set_data` to `reply_to` as the owner's own chain with `executeActionsChain` on its own registry, with `data` set to the returned data instance and `timestamp` copied from the request - `inst-answer-send`
9. [ ] - `p1` - FrontX validates `set_data` against the data shape that the data instance's `id` names (`cpt-frontx-dashboard-algo-widget-data-catalog-validate-set-data`). A rejected `set_data` reaches no widget, and the widget keeps its loader - `inst-answer-validate`
10. [ ] - `p1` - **RETURN**. The owner keeps neither the request nor the data after sending; the widget applies the answer only when its timestamp equals that of its latest request - `inst-answer-return`

The same process answers every request: the first one after `set_widget_context`, and each one after an interaction that changes the widget's query, such as a grid sort, page or page size (`cpt-frontx-dashboard-seq-query-change`). The owner never edits, merges or caches a request.

### Open the Larger View from a Cell Widget

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-algo-extension-domain-catalog-open-larger-view-chain`

**Input**: the dashboard viewer presses the larger-view button of a cell widget whose context carries `larger_view`.

**Output**: one chain sent by the cell widget.

**Steps**:

1. [ ] - `p1` - The cell widget shows the button only when its context carries `larger_view` (`cpt-frontx-dashboard-feature-widget-catalog`) - `inst-open-button`
2. [ ] - `p1` - The cell widget resolves the `popup` domain identifier from the shell constant by role and takes the larger-view modal's fixed extension identifier from the template's identifiers (`cpt-frontx-dashboard-feature-mfe-entries`). Neither is written as a literal in code - `inst-open-resolve-ids`
3. [ ] - `p1` - The cell widget runs one chain through its bridge's `executeActionsChain`: `mount_ext` on the `popup` domain with the larger-view modal as `subject` and `history: "none"`, then, as `next`, `show_larger_view` to the larger-view modal with `dashboard` and `widget` copied from its `larger_view`. The mount pushes no history entry; the modal's route follows from the executed mount - `inst-open-chain`
4. [ ] - `p1` - FrontX delivers each step to its target. The larger-view modal's `mount` resolves only after its `show_larger_view` handler is registered, so the second step finds the handler - `inst-open-delivery`
5. [ ] - `p1` - **IF** `mount_ext` of the larger-view modal fails, for example on a host without the modal container - `inst-open-if-mount-fails`
   1. [ ] - `p1` - The second step does not run, no larger view appears, and the dashboard is unchanged. The chain reports nothing back, so the cell widget is not told; the next press starts a new opening - `inst-open-mount-fails`
6. [ ] - `p1` - **RETURN**. No registry registers anything for the opening, and the dashboards root takes no part in it - `inst-open-return`

### Show a Larger View

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-algo-extension-domain-catalog-show-larger-view`

**Input**: `show_larger_view` with `dashboard` and `widget`, received by the larger-view modal's handler; or the same two ids read from its own subroute (`cpt-frontx-dashboard-algo-extension-domain-catalog-restore-larger-view`).

**Output**: the requested larger-view widget mounted in `larger_view` with its context, or the placeholder or the loader in the modal.

**Steps**:

1. [ ] - `p1` - The handler keeps `dashboard` and `widget` as the parameters of the modal's own private subroute, which only the modal's runtime reads and writes - `inst-show-keep-ids`
2. [ ] - `p1` - The handler resolves at once. Every step below runs after it, outside the cell widget's chain - `inst-show-accept`
3. [ ] - `p1` - **IF** the modal's owner start failed - `inst-show-if-start-failed`
   1. [ ] - `p1` - Keep the dashboard-level placeholder of the failed start in the modal. **RETURN** - `inst-show-start-failed`
4. [ ] - `p1` - **IF** the modal has not loaded, and is not loading, that dashboard id - `inst-show-if-not-loaded`
   1. [ ] - `p1` - Unregister the generated extensions of the dashboard it had loaded, if any, with `unregisterExtension`, which unmounts a mounted one first - `inst-show-unregister-other`
   2. [ ] - `p1` - Load the dashboard for the larger-view role by `cpt-frontx-dashboard-algo-extension-domain-catalog-load-dashboard` - `inst-show-load`
5. [ ] - `p1` - **ELSE** register nothing; a load of that dashboard that is still running is awaited - `inst-show-already-loaded`
6. [ ] - `p1` - **IF** a newer `show_larger_view` has arrived meanwhile, or the modal has been unmounted - `inst-show-if-stale`
   1. [ ] - `p1` - Stop; the loaded dashboard and its generated extensions are kept. **RETURN** - `inst-show-stale`
7. [ ] - `p1` - **IF** the loaded dashboard has the dashboard-level placeholder - `inst-show-if-dashboard-placeholder`
   1. [ ] - `p1` - Unmount the shown larger-view extension, if any, and keep the dashboard-level placeholder in the modal. **RETURN** - `inst-show-dashboard-placeholder`
8. [ ] - `p1` - **IF** `widget` is not the id of a larger-view widget of the loaded dashboard, including a cell widget's id or an id read after a refresh - `inst-show-if-unknown-widget`
   1. [ ] - `p1` - Unmount the shown larger-view extension, if any, and show the widget-level placeholder in the modal with a diagnostic (`cpt-frontx-dashboard-algo-extension-domain-catalog-show-placeholder`). **RETURN** - `inst-show-unknown-widget`
9. [ ] - `p1` - **IF** that larger-view widget has the widget-level placeholder from its load - `inst-show-if-widget-placeholder`
   1. [ ] - `p1` - Unmount the shown larger-view extension, if any, and show that placeholder in the modal. **RETURN** - `inst-show-widget-placeholder`
10. [ ] - `p1` - Build its context by `cpt-frontx-dashboard-algo-extension-domain-catalog-build-widget-context`, with the role larger view, so it carries no `larger_view`. When this returns a widget-level trigger, unmount the shown larger-view extension, if any, show the widget-level placeholder in the modal with a diagnostic, and **RETURN** - `inst-show-build-context`
11. [ ] - `p1` - Run one chain with `executeActionsChain` on the own registry: first `unmount_ext` on `larger_view` of the requested extension, which does nothing when it is not mounted; then, when another larger-view extension is recorded as shown, `unmount_ext` of that one; then `mount_ext` on `larger_view` of the requested one; then `set_widget_context` to it, whose `fallback` is `unmount_ext` of the same extension - `inst-show-chain`
12. [ ] - `p1` - The leading `unmount_ext` makes every shown widget start from a fresh mount followed by its context, also when the same widget is shown again. The Optional strategy keeps at most one occupant in `larger_view` - `inst-show-fresh-mount`
13. [ ] - `p1` - **IF** a leading `unmount_ext` step fails - `inst-show-if-unmount-fails`
    1. [ ] - `p1` - The requested widget is not mounted. The modal shows the widget-level placeholder with a diagnostic that names the extension it could not unmount, and keeps that extension recorded as shown, so the next showing unmounts it first - `inst-show-unmount-fails`
14. [ ] - `p1` - **IF** the `mount_ext` step or the `set_widget_context` step fails - `inst-show-if-chain-fails`
    1. [ ] - `p1` - The modal shows the widget-level placeholder with a diagnostic - `inst-show-chain-fails`
15. [ ] - `p1` - **RETURN**. The modal records the requested extension as shown once its `mount_ext` succeeds, and clears the record whenever the shown extension is unmounted, by an `unmount_ext` or by `unregisterExtension` (section 4). A data widget then sends `request_data` to `larger_view`, and the modal answers it (`cpt-frontx-dashboard-algo-extension-domain-catalog-answer-data-request`) - `inst-show-return`

The modal loads a dashboard on its own, in its own runtime: the first time a larger view of that dashboard opens, and after a page refresh. Opening a larger view of the dashboard it has loaded registers nothing.

### Restore a Larger View after a Refresh

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-algo-extension-domain-catalog-restore-larger-view`

**Input**: a mount of the larger-view modal, either by FrontX routing on a page load or by the cell widget's chain.

**Output**: the same larger view as before the refresh, or a wait for `show_larger_view`.

**Steps**:

1. [ ] - `p2` - FrontX routing restores the larger-view modal on a page load, because the shell's bootstrap registers it statically, with its route, before the `popup` domain takes its first resolution. The generated larger-view extensions are not routed, because they are registered only after the modal loads a dashboard - `inst-restore-routing`
2. [ ] - `p2` - The mount runs the owner start (`cpt-frontx-dashboard-algo-extension-domain-catalog-start-owner`): all of it on the first mount, and the republication of theme and language on a later one - `inst-restore-start`
3. [ ] - `p2` - **IF** the modal's own subroute holds both `dashboard` and `widget` - `inst-restore-if-params`
   1. [ ] - `p2` - Treat both ids as untrusted input from the page address, and show the larger view by `cpt-frontx-dashboard-algo-extension-domain-catalog-show-larger-view` from its step 3 - `inst-restore-show`
4. [ ] - `p2` - **ELSE** show the loader in the modal and wait for `show_larger_view` - `inst-restore-wait`
5. [ ] - `p2` - The dashboard is requested only through the data adapter, which owns access. A dashboard that the data adapter does not return leaves the modal's loader; a widget id that is not in the dashboard shows the placeholder in the modal - `inst-restore-untrusted`
6. [ ] - `p2` - **RETURN**. The dashboards root is restored on its own and runs its own load; the modal does not depend on it, and `larger_view` holds nothing that depends on what was registered when the page loaded - `inst-restore-return`

The route pattern of the larger-view modal and the form of its subroute parameters are DESIGN section 4, open question 6.

### Close the Larger View

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-algo-extension-domain-catalog-close-larger-view`

**Input**: the dashboard viewer presses the larger-view modal's close button, or clicks outside the modal.

**Output**: the larger-view modal unmounted from the `popup` domain, with its loaded dashboard kept.

**Steps**:

1. [ ] - `p2` - The close button is part of the modal's own chrome. It has an accessible name, can be reached and pressed with the keyboard alone, and follows the host accessibility policy - `inst-close-button`
2. [ ] - `p2` - **IF** the viewer presses the close button - `inst-close-if-button`
   1. [ ] - `p2` - The modal runs one chain through its bridge's `executeActionsChain`: `unmount_ext` on the `popup` domain, resolved from the shell constant by role, with its own fixed extension identifier as `subject` and `history: "none"`. The unmount pushes no history entry - `inst-close-by-button`
3. [ ] - `p2` - **IF** the viewer clicks outside the modal - `inst-close-if-outside`
   1. [ ] - `p2` - The shell's modal container unmounts the occupant with `unmount_ext`; this is a host prerequisite, and the modal does nothing for it - `inst-close-by-outside`
4. [ ] - `p2` - The modal's subroute leaves the address with the unmounted modal; the modal writes nothing to the address - `inst-close-subroute`
5. [ ] - `p2` - The modal keeps its registry, `larger_view`, the loaded dashboard and its generated extensions, because a nested registry and its registrations survive an unmount. It sends nothing to `larger_view`; the next opening's chain unmounts the shown extension first - `inst-close-keep`
6. [ ] - `p2` - **RETURN** the viewer to the unchanged dashboard. The dashboards root sends nothing and never closes the larger view - `inst-close-return`

While the larger view is open, the shell's modal container keeps keyboard focus inside the modal, so the viewer reaches no other part of the page. The modal frame, the focus rule and the click outside come from the shell's modal container, a host prerequisite (DESIGN section 4, prerequisite (c)).

### Publish Theme and Language

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-algo-extension-domain-catalog-publish-shared-properties`

**Input**: the host theme id and the host language, on every mount of the owner (`cpt-frontx-dashboard-algo-extension-domain-catalog-start-owner`, step 12) and on every change while the owner is mounted.

**Output**: both values published unchanged on the owner's domain, and the owner's own chrome in the matching ui-kit scope and language.

**Steps**:

1. [ ] - `p2` - Read both values: the dashboards root through its bridge as a screen extension, or from the shell as shell code; the larger-view modal through its bridge, from the shell's `popup` domain. On a mount, the owner reads the current values with `getProperty`; on a change, it takes the new value from its subscription - `inst-publish-read`
2. [ ] - `p2` - Map the host theme id to the light or dark scope of `@gears-frontx/ui-kit` for the owner's own chrome: the loader, the placeholder, and the modal's window and close button. The mapping rule is stated once in `cpt-frontx-dashboard-feature-widget-catalog` - `inst-publish-map-scope`
3. [ ] - `p2` - Localize the owner's own text for the host language - `inst-publish-localize`
4. [ ] - `p2` - Publish both values unchanged on the owner's domain with `updateSharedProperty` of its own registry. As shell code, `layout_cells` is in the shell's registry, so the shell's own update reaches it with the same value - `inst-publish-update`
5. [ ] - `p2` - On every mount, both values are on the domain before any extension mounts or mounts again, because every widget entry requires them. FrontX does not replay property updates when a bridge is activated again, so a change made while the owner was unmounted, such as a theme switch while the larger-view modal is closed, reaches the domain through this republication - `inst-publish-before-mount`
6. [ ] - `p2` - **RETURN**. A change sends no action, no widget sends `request_data`, no loader shows again, and nothing is remounted - `inst-publish-return`

### Show the Cannot-Show Placeholder

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-algo-extension-domain-catalog-show-placeholder`

**Input**: a cannot-show trigger, its level, and its place: the dashboard area, one cell, or the modal.

**Output**: one static placeholder in that place and one diagnostic in the developer log.

**Steps**:

1. [ ] - `p1` - **IF** the trigger is at dashboard level - `inst-placeholder-if-dashboard`
   1. [ ] - `p1` - The dashboards root replaces the loader with one placeholder in place of the dashboard and mounts no cells; the larger-view modal shows it in the modal - `inst-placeholder-dashboard`
2. [ ] - `p1` - **ELSE** the trigger is at widget level: the dashboards root shows the placeholder in that cell only, and the larger-view modal shows it in the modal. The other cells are unaffected - `inst-placeholder-widget`
3. [ ] - `p1` - The placeholder is static: it has no Retry, no error message and no failure class. Its default English wording comes from `cpt-frontx-dashboard-feature-widget-catalog`, and the owner localizes it and draws it in its mapped ui-kit scope - `inst-placeholder-static`
4. [ ] - `p1` - Write one diagnostic to the developer log that names the trigger and what it applies to: the dashboard id, the widget id and widget type, the failing instance path, the member id, the tied realizations, or the template's GTS file. The diagnostic is never shown to the viewer - `inst-placeholder-diagnostic`
5. [ ] - `p1` - **RETURN** - `inst-placeholder-return`

The triggers, by level and by the feature that defines them:

| Level | Trigger | Defined by | Detected in |
|---|---|---|---|
| Dashboard | the owner start failed, because the registry rejected the owner's domain | this feature | Start a Domain Owner, step 4 |
| Dashboard | GTS rejects a delivered type, other than a dataset type of an unserved query family | `cpt-frontx-dashboard-feature-dashboard-root-types` | Load a Dashboard, step 9 |
| Dashboard | the dashboard validation fails outside every cell's `widget` and `larger_view`, or the layout fails its checks | `cpt-frontx-dashboard-feature-dashboard-root-types`, `cpt-frontx-dashboard-feature-layout-types` | Load a Dashboard, step 10 |
| Widget | the dashboard validation fails under the widget's instance path, or the widget fails a cross-check of the widget catalog, including a member that names no registered instance | `cpt-frontx-dashboard-feature-dashboard-root-types`, `cpt-frontx-dashboard-feature-widget-catalog` | Load a Dashboard, steps 10 and 14 |
| Widget | the query family of a data widget is not served, including a delivered dataset type that the owner skipped for it at step 9 | `cpt-frontx-dashboard-feature-data-adapter-contract` | Load a Dashboard, step 14 |
| Widget | no realization, or a tie at the highest weight, including every widget when the template's GTS file is missing | this feature | Select the Winning Realization |
| Widget | the registration of the generated extension is rejected | this feature | Register Generated Extensions |
| Widget | a member that the query names is not a registered measure or dimension instance, met as a guard only: it cannot trigger after the load-time cross-check, which owns the check | `cpt-frontx-dashboard-feature-widget-catalog` | Build the Widget Context, as a guard |
| Widget | `mount_ext` fails inside the owner's handler, `set_widget_context` fails, or, in the modal, a leading `unmount_ext` fails | this feature | Mount Cell Widgets, Show a Larger View |
| Widget | the requested larger-view widget id is not in the loaded dashboard, including after a refresh | this feature | Show a Larger View |

Data that never arrives is not a trigger. When the data adapter returns no dashboard, the dashboard area keeps its loader. When it never answers a `request_data`, answers with a data shape other than the requested one, or FrontX rejects the `set_data`, that widget keeps its loader.

### Tear Down

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-algo-extension-domain-catalog-teardown`

**Input**: the dashboards root is unmounted, because the viewer leaves the dashboard, or it is about to load another dashboard id.

**Output**: no cell extension mounted. On leaving, the loaded dashboard and its generated cell extensions stay registered; before another dashboard loads, none of them is registered.

**Steps**:

1. [ ] - `p2` - The dashboards root unmounts every mounted cell extension with `unmount_ext` on `layout_cells`, as its own chains - `inst-teardown-unmount`
2. [ ] - `p2` - **IF** the dashboards root is about to load another dashboard id - `inst-teardown-if-unregister`
   1. [ ] - `p2` - Unregister every generated cell extension of the loaded dashboard with `unregisterExtension`, and forget the loaded dashboard - `inst-teardown-unregister`
3. [ ] - `p2` - **ELSE** the viewer leaves: keep the loaded dashboard id, its outcome and its generated cell extensions. A later mount with the same dashboard id mounts the cells again without a second load (`cpt-frontx-dashboard-algo-extension-domain-catalog-load-dashboard`, step 3); a later mount with another dashboard id loads that one, after this teardown for another dashboard - `inst-teardown-keep`
4. [ ] - `p2` - An answer that arrives later for an unmounted widget is dropped (`cpt-frontx-dashboard-algo-extension-domain-catalog-answer-data-request`, step 6); the owner holds no widget data to release - `inst-teardown-late-answers`
5. [ ] - `p2` - The dashboards root sends nothing to the larger-view modal, which keeps its own loaded dashboard - `inst-teardown-modal`
6. [ ] - `p2` - **RETURN**. Loading the same dashboard again after another one registers the same identifiers - `inst-teardown-return`

The larger-view modal has no teardown of its own: it unregisters its generated extensions only when it loads a different dashboard (`cpt-frontx-dashboard-algo-extension-domain-catalog-show-larger-view`, step 4).

## 4. States (CDSL)

### Owner State Machine

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-state-extension-domain-catalog-owner`

**States**: Idle, Started, Loading, Loaded, Placeholder

**Initial State**: Idle, before the first mount of the owner

**Transitions**:
1. [ ] - `p1` - **FROM** Idle **TO** Started **WHEN** the owner start registers the domain (`cpt-frontx-dashboard-algo-extension-domain-catalog-start-owner`) - `inst-owner-idle-started`
2. [ ] - `p1` - **FROM** Idle **TO** Placeholder **WHEN** the registry rejects the owner's domain; this start-failed placeholder has no exit in the runtime - `inst-owner-idle-placeholder`
3. [ ] - `p1` - **FROM** Started **TO** Loading **WHEN** the owner begins to load a dashboard id - `inst-owner-started-loading`
4. [ ] - `p1` - **FROM** Loading **TO** Loading **WHEN** the owner begins to load another dashboard id; the earlier load is superseded and discarded - `inst-owner-loading-superseded`
5. [ ] - `p1` - **FROM** Loading **TO** Loaded **WHEN** the dashboard passes its dashboard-level checks and the generated extensions of its widgets are registered - `inst-owner-loading-loaded`
6. [ ] - `p1` - **FROM** Loading **TO** Placeholder **WHEN** a dashboard-level trigger occurs at load - `inst-owner-loading-placeholder`
7. [ ] - `p1` - **FROM** Loaded **TO** Loading **WHEN** the owner begins to load another dashboard id, after the generated extensions of the loaded one are unregistered - `inst-owner-loaded-loading`
8. [ ] - `p1` - **FROM** Placeholder **TO** Loading **WHEN** the owner begins to load another dashboard id, unless the placeholder comes from a failed start - `inst-owner-placeholder-loading`

The owner keeps, per state: in Loading, the dashboard id it loads; in Loaded and Placeholder, the dashboard id, its outcome, the widget-level placeholders, and the registered generated extensions by widget id. When the data adapter returns no dashboard, the owner stays in Loading with its loader. Unmounting the owner changes no state: the dashboards root that is mounted again with the dashboard id it holds in Loaded or Placeholder shows that outcome again and mounts its cells again, with no transition. Extension lifecycle stages are FrontX stages declared on each domain (sections 6.5 and 6.6).

### Larger-View Modal State Machine

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-state-extension-domain-catalog-larger-view-modal`

**States**: Closed, Open

**Initial State**: Closed, before the first `mount_ext` of the larger-view modal on the `popup` domain

**Transitions**:
1. [ ] - `p2` - **FROM** Closed **TO** Open **WHEN** `mount_ext` on the `popup` domain mounts the larger-view modal, by the cell widget's chain or by FrontX routing after a refresh - `inst-modal-closed-open`
2. [ ] - `p2` - **FROM** Open **TO** Closed **WHEN** `unmount_ext` on the `popup` domain unmounts the larger-view modal, by its close button or by the shell's modal container on a click outside - `inst-modal-open-closed`

Besides its owner state, the modal keeps one record, the shown larger-view extension. It is set when `mount_ext` of a larger-view extension succeeds, and cleared when that extension is unmounted, by an `unmount_ext` or by `unregisterExtension`, also before another dashboard loads. A leading `unmount_ext` that fails keeps the record (section 3, Show a Larger View). Closing the modal keeps both its owner state and the record, so the next showing unmounts the recorded extension first. The occupant of the `popup` domain is managed by the shell's Optional strategy.

## 5. Definitions of Done

### Domain Model Definition of Done

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-dod-extension-domain-catalog-catalog-complete`

The system **MUST** declare in the `dashboard` package, under GTS package `dashboard_v`, exactly the 4 action types, the 2 domain instances and the 2 extension types of section 6, and **MUST** generate extension identifiers by the rule of section 6.9.

- Each action type derives from the FrontX action base, and its payload is closed. No payload carries widget data in `set_widget_context` or `show_larger_view`, and no payload carries a backend address, a theme or a language.
- `request_data` and `set_data` are single actions for every data widget type, typed by the query base and the data shape base.
- Each extension type derives from the FrontX extension base with no field of its own and fixes `domain` to its domain.
- Every identifier follows `cpt-frontx-dashboard-constraint-gts-id-convention`: types end with `~`, instances do not, every template segment is at `v1`, identifier fields use `x-gts-instance-ref` or `x-gts-type-ref` with a literal base operand, and `dashboard_v` refers only to `dashboard_m` types.
- The template declares no other action, domain or extension type.

**Implements**:

- `cpt-frontx-dashboard-algo-extension-domain-catalog-derive-extension-id`

**Covers (PRD)**: `cpt-frontx-dashboard-fr-domain-model`, `cpt-frontx-dashboard-interface-domain-model`

**Covers (DESIGN)**: `cpt-frontx-dashboard-interface-host-actions`, `cpt-frontx-dashboard-interface-template-domains`, `cpt-frontx-dashboard-principle-gts-contracts`

**Constraints**: `cpt-frontx-dashboard-constraint-gts-id-convention`

**Touches**:

- Entities: template actions, domains and extension types, generated extension identifiers

### Domains and Handlers

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-dod-extension-domain-catalog-domains-and-handlers`

Each domain owner **MUST** register its domain in its own registry with its strategy and its `request_data` handler while the domain is built, and the larger-view modal **MUST** register its `show_larger_view` handler before its `mount` resolves.

- `layout_cells` is registered with the Concurrent strategy by the dashboards root, and `larger_view` with the Optional strategy by the larger-view modal. Both pass the FrontX cardinality matrix.
- Each domain lists `request_data` in its `actions` and has a handler for it; leaving out the handler or the listing is rejected by the registry.
- Every `request_data` and `show_larger_view` handler resolves on acceptance, and `set_data` is always the owner's own chain.
- One dashboards root and one larger-view modal exist per application tree, because the domain identifiers and the modal's identifier are fixed.

**Implements**:

- `cpt-frontx-dashboard-algo-extension-domain-catalog-start-owner`

**Covers (PRD)**: `cpt-frontx-dashboard-fr-dashboards-root`, `cpt-frontx-dashboard-fr-widget-modal`

**Covers (DESIGN)**: `cpt-frontx-dashboard-interface-template-domains`, `cpt-frontx-dashboard-component-dashboards-root`, `cpt-frontx-dashboard-component-larger-view-modal`, `cpt-frontx-dashboard-principle-own-registry-registration`

**Constraints**: `cpt-frontx-dashboard-constraint-one-dashboards-root-per-tree`

**Touches**:

- Entities: `layout_cells`, `larger_view`, the owners' registries

### Owner Start and Dashboard Load

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-dod-extension-domain-catalog-start-and-load`

Each domain owner **MUST** run the owner start before any dashboard loads, and **MUST** load a dashboard with one call to "get a dashboard", the delivery, validation and attribution rules of the dashboard root types feature, and a check of each widget of its role on its own.

- The owner start runs the GTS file loader, registers the type schemas that the data adapter's declaration of served query families returns, and registers in the own registry the `widgets` manifest and every manifest whose entries a registered widget realization names, consumer packages included, in every hosting form.
- A domain that the registry rejects ends the start with the dashboard-level placeholder; a later mount, load or `show_larger_view` shows the same placeholder.
- The dashboard is checked with one GTS validation and the layout checks. Its failures are attributed by the attribution rule of the dashboard root types feature (`cpt-frontx-dashboard-algo-dashboard-root-types-validate-dashboard`).
- The dashboards root checks only cell widgets, and the larger-view modal only larger-view widgets.
- A missing dashboard keeps the loader; a load that another load supersedes is discarded after every step that waits and leaves no generated extension registered.
- A dashboards root that is mounted again with the dashboard id it has loaded mounts its cells again from the registered generated extensions, without a second load.
- The owners make no backend call, keep no widget data, and reach data only through the data adapter.
- One dashboard load, registration of all generated extensions before any mount, parallel mounts, and handlers that resolve on acceptance form the load path that the initial-render measurement uses.

**Implements**:

- `cpt-frontx-dashboard-algo-extension-domain-catalog-start-owner`
- `cpt-frontx-dashboard-algo-extension-domain-catalog-load-dashboard`
- `cpt-frontx-dashboard-state-extension-domain-catalog-owner`

**Covers (PRD)**: `cpt-frontx-dashboard-fr-dashboards-root`, `cpt-frontx-dashboard-fr-data-adapter`, `cpt-frontx-dashboard-fr-backend-source`, `cpt-frontx-dashboard-nfr-initial-render`

**Covers (DESIGN)**: `cpt-frontx-dashboard-component-dashboards-root`, `cpt-frontx-dashboard-component-larger-view-modal`, `cpt-frontx-dashboard-component-gts-file-loader`, `cpt-frontx-dashboard-principle-dashboards-root-orchestration`, `cpt-frontx-dashboard-principle-render-only-dashboards-root`, `cpt-frontx-dashboard-seq-initial-load`

**Constraints**: `cpt-frontx-dashboard-constraint-gts-id-convention`

**Touches**:

- Entities: the template's GTS file, widget realizations, the delivery set, the loaded dashboard

### Generated Extension Creation

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-dod-extension-domain-catalog-extension-creation`

Each domain owner **MUST** generate one extension per widget of its role that passes its checks, with `entry` from the winning realization and the deterministic identifier of section 6.9, **MUST** register it only in its own registry and only when it loads a dashboard, and the dashboards root **MUST** mount each cell widget with one chain.

- The winning realization is the single registered realization with the highest `weight` for the widget type; no realization or a tie gives the widget-level placeholder, with a diagnostic that names the widget type and the tied realizations.
- A larger view takes `larger_view_entry` when the winner names one, and `entry` otherwise.
- The same widget, role and entry always give the same identifier; a different winning entry gives a different identifier; a cell extension and a larger-view extension of the same widget never collide.
- A rejected registration, a failed `mount_ext` inside the owner's handler or a failed `set_widget_context` gives that cell or larger view the widget-level placeholder; `mount_ext` is not sent again, and the other cells are unaffected.
- A `mount_ext` failure that FrontX produces outside the owner's handler, such as an action timeout, is a stated known limit: the cell stays empty with no placeholder.
- Nothing is registered into the shell's registry or an ancestor's registry, on a click, or when a larger view of a loaded dashboard opens.

**Implements**:

- `cpt-frontx-dashboard-algo-extension-domain-catalog-select-realization`
- `cpt-frontx-dashboard-algo-extension-domain-catalog-derive-extension-id`
- `cpt-frontx-dashboard-algo-extension-domain-catalog-register-generated-extensions`
- `cpt-frontx-dashboard-algo-extension-domain-catalog-mount-cell-widgets`

**Covers (PRD)**: `cpt-frontx-dashboard-fr-dashboards-root`, `cpt-frontx-dashboard-fr-replacement-widget`, `cpt-frontx-dashboard-fr-loading-error-states`, `cpt-frontx-dashboard-nfr-initial-render`

**Covers (DESIGN)**: `cpt-frontx-dashboard-interface-widget-realization`, `cpt-frontx-dashboard-principle-own-registry-registration`, `cpt-frontx-dashboard-principle-per-instance-isolation`, `cpt-frontx-dashboard-seq-initial-load`, `cpt-frontx-dashboard-seq-cannot-show`

**Constraints**: `cpt-frontx-dashboard-constraint-gts-id-convention`, `cpt-frontx-dashboard-constraint-one-dashboards-root-per-tree`

**Touches**:

- Entities: generated extensions, widget realizations, widget entries

### Widget Context

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-dod-extension-domain-catalog-widget-context`

Each domain owner **MUST** send every mounted widget of its domain one `set_widget_context`, right after its `mount_ext` in the same chain. The context **MUST** carry the widget instance, for a data widget its `data_shape`, `fill` and member metadata, and, for a cell widget whose cell defines a larger view, `larger_view` with the dashboard id and the larger-view widget id.

- `data_shape` and `fill` are the effective traits of the widget type, copied unchanged; `members` holds `id`, `title`, `value_type` and an optional `unit` for every distinct query member: the members in `measures` and `dimensions`, the time dimension in `timeDimensions[0].dimension`, every filter member, and the first item of every `order` pair. A member that names no registered instance has already failed the load-time cross-check of the widget catalog, so the context build meets it only as a guard.
- `larger_view` is present only for a cell widget whose cell defines a larger-view widget, and never for a larger-view widget, so a larger-view widget shows no larger-view button.
- The context carries no backend detail, no widget data, no theme and no language; theme and language reach the widget only as shared properties.
- A cell widget and a larger-view widget receive the same action with the same structure, so one entry per widget type serves both domains.

**Implements**:

- `cpt-frontx-dashboard-algo-extension-domain-catalog-build-widget-context`
- `cpt-frontx-dashboard-algo-extension-domain-catalog-mount-cell-widgets`
- `cpt-frontx-dashboard-algo-extension-domain-catalog-show-larger-view`

**Covers (PRD)**: `cpt-frontx-dashboard-fr-widget-modal`, `cpt-frontx-dashboard-fr-replacement-widget`, `cpt-frontx-dashboard-fr-domain-model`

**Covers (DESIGN)**: `cpt-frontx-dashboard-interface-host-actions`, `cpt-frontx-dashboard-seq-initial-load`, `cpt-frontx-dashboard-seq-widget-modal-open`

**Constraints**: `cpt-frontx-dashboard-constraint-gts-id-convention`

**Touches**:

- Entities: `set_widget_context`, widget instances, measure and dimension instances

### Data Requests

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-dod-extension-domain-catalog-data-requests`

Each domain owner **MUST** answer every `request_data` from its domain by resolving the handler on acceptance, calling "run a query" with the request unchanged, and sending `set_data` with the returned data instance and the copied timestamp to `reply_to` as its own chain.

- Before it sends `set_data`, the owner compares the data shape that the data instance's `id` names with the request's `data_shape`, and drops a mismatch with a diagnostic; the widget keeps its loader.
- A data adapter that answers after longer than the domain's default action timeout causes no timeout, and `set_data` still reaches the widget.
- A request whose `reply_to` is not a mounted generated extension of the owner's domain is dropped; an answer for a widget that has been unmounted is dropped.
- The owner keeps no widget data between requests and never edits, merges or caches a request. The `timezone` that the widget sets in `data` reaches the data adapter unchanged.
- A query change, such as a grid sort, page or page size, is answered by the same process.

**Implements**:

- `cpt-frontx-dashboard-algo-extension-domain-catalog-answer-data-request`

**Covers (PRD)**: `cpt-frontx-dashboard-fr-data-adapter`, `cpt-frontx-dashboard-fr-backend-source`, `cpt-frontx-dashboard-fr-grid-sort-page`, `cpt-frontx-dashboard-nfr-initial-render`

**Covers (DESIGN)**: `cpt-frontx-dashboard-principle-dashboards-root-orchestration`, `cpt-frontx-dashboard-principle-render-only-dashboards-root`, `cpt-frontx-dashboard-seq-initial-load`, `cpt-frontx-dashboard-seq-query-change`

**Constraints**: `cpt-frontx-dashboard-constraint-gts-id-convention`

**Touches**:

- Entities: `request_data`, `set_data`, data instances

### Larger-View Modal

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-dod-extension-domain-catalog-larger-view-modal`

The cell widget **MUST** open a larger view with one chain: `mount_ext` of the larger-view modal in the shell's `popup` domain with `history: "none"`, then `show_larger_view`. The larger-view modal **MUST** close with `unmount_ext` on the `popup` domain with `history: "none"`, and **MUST** keep both ids in its own private subroute, show the requested widget in `larger_view`, restore it after a refresh, close by its own close button, and keep its loaded dashboard while closed.

- The `popup` domain identifier is resolved from the shell constant by role and is never a literal in code; the larger-view modal's identifier comes from the template's identifiers.
- Opening a larger view registers nothing into the shell's registry; opening a larger view of the dashboard the modal has loaded registers nothing at all.
- A requested widget id that is not a larger-view widget of the dashboard, also after a refresh, shows the placeholder in the modal.
- Closing by the close button or by a click outside returns the viewer to the unchanged dashboard; the modal's generated extensions stay registered until it loads a different dashboard.
- The close button is keyboard-operable and has an accessible name; keyboard focus stays inside the open modal through the shell's modal container.
- On a host without the modal container, no larger view appears and the dashboard is unchanged.
- The showing chain unmounts the requested extension first, and a recorded shown extension next, so every shown widget starts from a fresh mount; a failing leading `unmount_ext` gives the widget-level placeholder in the modal and keeps the record.
- The modal records the shown larger-view extension and clears the record whenever that extension is unmounted or unregistered.

**Implements**:

- `cpt-frontx-dashboard-algo-extension-domain-catalog-open-larger-view-chain`
- `cpt-frontx-dashboard-algo-extension-domain-catalog-show-larger-view`
- `cpt-frontx-dashboard-algo-extension-domain-catalog-restore-larger-view`
- `cpt-frontx-dashboard-algo-extension-domain-catalog-close-larger-view`
- `cpt-frontx-dashboard-state-extension-domain-catalog-larger-view-modal`

**Covers (PRD)**: `cpt-frontx-dashboard-fr-widget-modal`, `cpt-frontx-dashboard-contract-host-areas`, `cpt-frontx-dashboard-nfr-accessibility`

**Covers (DESIGN)**: `cpt-frontx-dashboard-component-larger-view-modal`, `cpt-frontx-dashboard-interface-host-actions`, `cpt-frontx-dashboard-seq-widget-modal-open`, `cpt-frontx-dashboard-seq-larger-view-refresh`, `cpt-frontx-dashboard-seq-larger-view-close`, `cpt-frontx-dashboard-principle-own-registry-registration`

**Constraints**: `cpt-frontx-dashboard-constraint-role-based-host-ids`, `cpt-frontx-dashboard-constraint-one-dashboards-root-per-tree`

**Touches**:

- Entities: `show_larger_view`, the larger-view modal's subroute parameters, `larger_view`

### Cannot-Show Placeholder and Loader

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-dod-extension-domain-catalog-cannot-show`

Each domain owner **MUST** show the dashboard-area loader while a dashboard loads, and **MUST** show one static "cannot be shown" placeholder, with a diagnostic in the developer log, for every trigger of section 3 at its level and in its place.

- A dashboard-level trigger replaces the whole dashboard, or fills the modal, and no cell is mounted.
- A widget-level trigger affects only its own cell, or the modal for a larger-view widget.
- The placeholder has no Retry and no error message; its wording comes from the widget catalog and is localized by the owner.
- Data that never arrives keeps the loader and is not a cannot-show state.

**Implements**:

- `cpt-frontx-dashboard-algo-extension-domain-catalog-show-placeholder`
- `cpt-frontx-dashboard-algo-extension-domain-catalog-load-dashboard`

**Covers (PRD)**: `cpt-frontx-dashboard-fr-loading-error-states`

**Covers (DESIGN)**: `cpt-frontx-dashboard-seq-cannot-show`, `cpt-frontx-dashboard-component-dashboards-root`, `cpt-frontx-dashboard-component-larger-view-modal`

**Constraints**: `cpt-frontx-dashboard-constraint-gts-id-convention`

**Touches**:

- Entities: the placeholder, the loader, diagnostics

### Theme and Language

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-dod-extension-domain-catalog-theme-and-language`

Each domain owner **MUST** publish the host theme id and the host language unchanged as the only shared properties of its domain, and **MUST** map the host theme id to the light or dark ui-kit scope for its own chrome.

- `layout_cells` and `larger_view` share exactly theme and language.
- On every mount, each owner reads the current values with `getProperty` and publishes them again before any extension of its domain mounts, because FrontX does not replay property updates when a bridge is activated again.
- A theme or language change sends no action, makes no request, shows no loader again and remounts nothing; an open larger view follows through the `popup` domain and `larger_view`.
- The template publishes no theme value of its own.

**Implements**:

- `cpt-frontx-dashboard-algo-extension-domain-catalog-publish-shared-properties`

**Covers (PRD)**: `cpt-frontx-dashboard-fr-theme`, `cpt-frontx-dashboard-nfr-visual-quality`

**Covers (DESIGN)**: `cpt-frontx-dashboard-seq-theme-switch`, `cpt-frontx-dashboard-interface-template-domains`, `cpt-frontx-dashboard-principle-per-instance-isolation`

**Constraints**: `cpt-frontx-dashboard-constraint-role-based-host-ids`

**Touches**:

- Entities: theme and language shared properties, the owners' chrome

### Teardown

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-dod-extension-domain-catalog-teardown`

The dashboards root **MUST** unmount every cell extension when the viewer leaves the dashboard or opens another one, **MUST** keep its loaded dashboard and its generated cell extensions when the viewer leaves, and **MUST** unregister them before it loads another dashboard.

- Returning to the loaded dashboard mounts its cells again without a second load and without a registration.
- Loading the same dashboard again after another one registers the same identifiers, and no collision diagnostic is logged.
- The dashboards root sends nothing to the larger-view modal.
- An answer that arrives for an unmounted widget is dropped.

**Implements**:

- `cpt-frontx-dashboard-algo-extension-domain-catalog-teardown`

**Covers (PRD)**: `cpt-frontx-dashboard-fr-dashboards-root`

**Covers (DESIGN)**: `cpt-frontx-dashboard-seq-teardown`, `cpt-frontx-dashboard-principle-own-registry-registration`, `cpt-frontx-dashboard-principle-per-instance-isolation`

**Constraints**: `cpt-frontx-dashboard-constraint-one-dashboards-root-per-tree`

**Touches**:

- Entities: generated cell extensions

## 6. Domain Model

The lifecycle actions are the FrontX actions `gts.frontx.mfes.comm.action.v1~frontx.mfes.ext.load_ext.v1~`, `gts.frontx.mfes.comm.action.v1~frontx.mfes.ext.mount_ext.v1~` and `gts.frontx.mfes.comm.action.v1~frontx.mfes.ext.unmount_ext.v1~`; code takes them from the FrontX constants. Every template action derives from the FrontX action base `gts.frontx.mfes.comm.action.v1~`, and FrontX validates every action instance against its schema, polymorphically on every embedded identifier. Action delivery is FrontX's concern: FrontX delivers each action to the handler that its target registered, wherever the target sits in the tree, and no template part passes actions on.

### 6.1 Template Action: set_widget_context

**GTS ID**: `gts.frontx.mfes.comm.action.v1~frontx.dashboard_v.mfe.set_widget_context.v1~`

**Description**: Gives a mounted widget extension everything it needs to render and to ask for its data. The dashboards root sends it to cell widgets, and the larger-view modal to larger-view widgets, each time as the step after `mount_ext` in one chain (sections 3, Mount Cell Widgets and Show a Larger View). A widget whose context carries `larger_view` shows the larger-view button.

**Schema**:

```json
{
  "$id": "gts://gts.frontx.mfes.comm.action.v1~frontx.dashboard_v.mfe.set_widget_context.v1~",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "set_widget_context",
  "description": "Gives a mounted cell or larger-view widget its widget instance, and for a data widget its data shape, fill mode and member metadata, and for a cell widget with a larger view the ids that open it.",
  "allOf": [
    { "$ref": "gts://gts.frontx.mfes.comm.action.v1~" },
    {
      "type": "object",
      "required": ["payload"],
      "properties": {
        "target": {
          "type": "string",
          "anyOf": [
            { "x-gts-instance-ref": "gts.frontx.mfes.ext.extension.v1~frontx.dashboard_v.layout.layout_cells.v1~" },
            { "x-gts-instance-ref": "gts.frontx.mfes.ext.extension.v1~frontx.dashboard_v.layout.larger_view.v1~" }
          ],
          "description": "A generated extension in layout_cells or larger_view."
        },
        "payload": {
          "type": "object",
          "required": ["widget"],
          "additionalProperties": false,
          "dependentRequired": {
            "data_shape": ["fill", "members"],
            "fill": ["data_shape", "members"],
            "members": ["data_shape", "fill"]
          },
          "properties": {
            "widget": {
              "$ref": "gts://gts.frontx.dashboard_m.widget.widget.v1~",
              "description": "The widget instance as it appears in the dashboard, validated against the widget type that its own id names."
            },
            "data_shape": {
              "type": "string",
              "x-gts-type-ref": "gts.frontx.dashboard_m.widget_data.widget_data.v1~",
              "description": "Data widget only: the data shape of the widget type, from its data_shape trait."
            },
            "fill": {
              "type": "object",
              "required": ["mode"],
              "additionalProperties": false,
              "description": "Data widget only: the fill mode of the widget type, from its fill trait, unchanged.",
              "properties": {
                "mode": {
                  "enum": ["rows_by_member", "x_series_value", "row_per_measure", "positional_table", "scalar_with_series"]
                },
                "fields": {
                  "type": "array",
                  "items": {
                    "type": "object",
                    "required": ["field", "from"],
                    "additionalProperties": false,
                    "properties": {
                      "field": { "type": "string", "minLength": 1 },
                      "from": { "type": "string", "pattern": "^(dimensions\\[(0|[1-9][0-9]*)\\]|measures\\[(0|[1-9][0-9]*)\\]|timeDimensions\\[0\\])$" }
                    }
                  }
                }
              },
              "if": { "properties": { "mode": { "const": "rows_by_member" } } },
              "then": { "required": ["fields"] },
              "else": { "not": { "required": ["fields"] } }
            },
            "members": {
              "type": "array",
              "description": "Data widget only: the metadata of every distinct query member: the members in measures and dimensions, the time dimension, every filter member, and the first item of every order pair.",
              "items": {
                "type": "object",
                "required": ["id", "title", "value_type"],
                "additionalProperties": false,
                "properties": {
                  "id": {
                    "type": "string",
                    "anyOf": [
                      { "x-gts-instance-ref": "gts.frontx.dashboard_m.data.measure.v1~" },
                      { "x-gts-instance-ref": "gts.frontx.dashboard_m.data.dimension.v1~" }
                    ]
                  },
                  "title": { "type": "string" },
                  "value_type": { "enum": ["number", "percent", "duration", "string", "time"] },
                  "unit": { "type": "string" }
                }
              }
            },
            "larger_view": {
              "type": "object",
              "required": ["dashboard", "widget"],
              "additionalProperties": false,
              "description": "Cell widget whose cell defines a larger-view widget only.",
              "properties": {
                "dashboard": {
                  "type": "string",
                  "x-gts-instance-ref": "gts.frontx.dashboard_m.dashboard.dashboard.v1~"
                },
                "widget": {
                  "type": "string",
                  "x-gts-instance-ref": "gts.frontx.dashboard_m.widget.widget.v1~"
                }
              }
            }
          }
        }
      }
    }
  ],
  "unevaluatedProperties": false
}
```

**Notes**:

- `widget` carries the widget instance itself, because the dashboard embeds its widgets. GTS validates it against the widget type that its `id` names.
- `data_shape`, `fill` and `members` come together or not at all: a data widget gets all three, and a `markdown_card` none.
- `fill` has the form of the widget type's `fill` trait (`cpt-frontx-dashboard-feature-widget-catalog`); the owner copies it unchanged, and the widget puts it unchanged into each `request_data`.
- Sync rule: the `fill` schema here, the `fill` schema of `request_data` (section 6.2) and the `fill` trait schema of the data widget in `cpt-frontx-dashboard-feature-widget-catalog` state the same modes, the same `fields` items and the same conditional rule: `fields` is required for `rows_by_member` and absent for every other mode. A change to one of them is made to all three, so every `fill` trait value of a template widget type validates in both actions.
- `larger_view` names the field of the cell, not the `larger_view` domain.
- The payload has no backend detail, no widget data, no theme and no language.

### 6.2 Template Action: request_data

**GTS ID**: `gts.frontx.mfes.comm.action.v1~frontx.dashboard_v.mfe.request_data.v1~`

**Description**: A self-contained data request that a data widget sends to the extension domain it sits in, which it reads from its bridge's `extDomainId`. The domain's owner answers it (section 3, Answer a Data Request).

**Schema**:

```json
{
  "$id": "gts://gts.frontx.mfes.comm.action.v1~frontx.dashboard_v.mfe.request_data.v1~",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "request_data",
  "description": "Data request of a data widget to the domain it sits in. The domain's owner hands it unchanged to the data adapter.",
  "allOf": [
    { "$ref": "gts://gts.frontx.mfes.comm.action.v1~" },
    {
      "type": "object",
      "required": ["payload"],
      "properties": {
        "target": {
          "type": "string",
          "enum": [
            "gts.frontx.mfes.ext.domain.v1~frontx.dashboard_v.layout.layout_cells.v1",
            "gts.frontx.mfes.ext.domain.v1~frontx.dashboard_v.layout.larger_view.v1"
          ],
          "description": "The domain the widget sits in."
        },
        "payload": {
          "type": "object",
          "required": ["data", "data_shape", "fill", "reply_to", "timestamp"],
          "additionalProperties": false,
          "properties": {
            "data": {
              "$ref": "gts://gts.frontx.dashboard_m.data.query.v1~",
              "required": ["timezone"],
              "description": "The widget's current query, with timezone set by the widget to the viewer's time zone, validated against the dataset that its own id names."
            },
            "data_shape": {
              "type": "string",
              "x-gts-type-ref": "gts.frontx.dashboard_m.widget_data.widget_data.v1~"
            },
            "fill": {
              "type": "object",
              "required": ["mode"],
              "additionalProperties": false,
              "description": "The fill mode, as the widget received it in set_widget_context.",
              "properties": {
                "mode": {
                  "enum": ["rows_by_member", "x_series_value", "row_per_measure", "positional_table", "scalar_with_series"]
                },
                "fields": {
                  "type": "array",
                  "items": {
                    "type": "object",
                    "required": ["field", "from"],
                    "additionalProperties": false,
                    "properties": {
                      "field": { "type": "string", "minLength": 1 },
                      "from": { "type": "string", "pattern": "^(dimensions\\[(0|[1-9][0-9]*)\\]|measures\\[(0|[1-9][0-9]*)\\]|timeDimensions\\[0\\])$" }
                    }
                  }
                }
              },
              "if": { "properties": { "mode": { "const": "rows_by_member" } } },
              "then": { "required": ["fields"] },
              "else": { "not": { "required": ["fields"] } }
            },
            "reply_to": {
              "type": "string",
              "anyOf": [
                { "x-gts-instance-ref": "gts.frontx.mfes.ext.extension.v1~frontx.dashboard_v.layout.layout_cells.v1~" },
                { "x-gts-instance-ref": "gts.frontx.mfes.ext.extension.v1~frontx.dashboard_v.layout.larger_view.v1~" }
              ],
              "description": "The requesting widget's own extension id."
            },
            "timestamp": {
              "type": "number",
              "exclusiveMinimum": 0,
              "description": "Strictly increasing per widget: a monotonic clock reading combined with a per-widget counter, so no two requests of one widget share a timestamp."
            }
          }
        }
      }
    }
  ],
  "unevaluatedProperties": false
}
```

**Notes**: `fill` repeats the form of `fill` in `set_widget_context` under the sync rule of section 6.1. `timestamp` is strictly increasing per widget, so the widget can tell its latest request from every earlier one. `data` is the widget's local copy of its query: the first request carries the query as the dashboard defines it, and each later one the query after an interaction such as a grid sort, page or page size. In each request the widget sets `timezone` in `data` to the viewer's time zone; the authored query has none. The owner passes the whole payload unchanged to "run a query", `timezone` included.

### 6.3 Template Action: set_data

**GTS ID**: `gts.frontx.mfes.comm.action.v1~frontx.dashboard_v.mfe.set_data.v1~`

**Description**: The answer to one `request_data`, sent by the domain's owner to `reply_to` as its own chain, after the request's chain has ended.

**Schema**:

```json
{
  "$id": "gts://gts.frontx.mfes.comm.action.v1~frontx.dashboard_v.mfe.set_data.v1~",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "set_data",
  "description": "One data instance for the requesting widget, with the timestamp of the request it answers.",
  "allOf": [
    { "$ref": "gts://gts.frontx.mfes.comm.action.v1~" },
    {
      "type": "object",
      "required": ["payload"],
      "properties": {
        "target": {
          "type": "string",
          "anyOf": [
            { "x-gts-instance-ref": "gts.frontx.mfes.ext.extension.v1~frontx.dashboard_v.layout.layout_cells.v1~" },
            { "x-gts-instance-ref": "gts.frontx.mfes.ext.extension.v1~frontx.dashboard_v.layout.larger_view.v1~" }
          ],
          "description": "The reply_to of the request."
        },
        "payload": {
          "type": "object",
          "required": ["data", "timestamp"],
          "additionalProperties": false,
          "properties": {
            "data": {
              "$ref": "gts://gts.frontx.dashboard_m.widget_data.widget_data.v1~",
              "description": "One data instance, validated against the data shape that its own id names."
            },
            "timestamp": {
              "type": "number",
              "exclusiveMinimum": 0,
              "description": "Copied from the request."
            }
          }
        }
      }
    }
  ],
  "unevaluatedProperties": false
}
```

**Notes**: Before sending, the owner drops an answer whose data shape differs from the request's `data_shape` (section 3, Answer a Data Request). FrontX then applies the exact data shape that the data instance's `id` names, so no widget compares shapes. The widget applies the answer only when its timestamp equals that of its latest request.

### 6.4 Template Action: show_larger_view

**GTS ID**: `gts.frontx.mfes.comm.action.v1~frontx.dashboard_v.mfe.show_larger_view.v1~`

**Description**: Asks the larger-view modal to show one larger-view widget of one dashboard. It is the second step of the cell widget's chain, after `mount_ext` of the larger-view modal (section 3, Open the Larger View from a Cell Widget).

**Schema**:

```json
{
  "$id": "gts://gts.frontx.mfes.comm.action.v1~frontx.dashboard_v.mfe.show_larger_view.v1~",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "show_larger_view",
  "description": "Shows the named larger-view widget of the named dashboard in the larger-view modal.",
  "allOf": [
    { "$ref": "gts://gts.frontx.mfes.comm.action.v1~" },
    {
      "type": "object",
      "required": ["payload"],
      "properties": {
        "target": {
          "type": "string",
          "x-gts-instance-ref": "gts.frontx.mfes.ext.extension.v1~",
          "description": "The larger-view modal's fixed extension id."
        },
        "payload": {
          "type": "object",
          "required": ["dashboard", "widget"],
          "additionalProperties": false,
          "properties": {
            "dashboard": {
              "type": "string",
              "x-gts-instance-ref": "gts.frontx.dashboard_m.dashboard.dashboard.v1~"
            },
            "widget": {
              "type": "string",
              "x-gts-instance-ref": "gts.frontx.dashboard_m.widget.widget.v1~"
            }
          }
        }
      }
    }
  ],
  "unevaluatedProperties": false
}
```

**Notes**: The exact form of the larger-view modal's fixed identifier belongs to `cpt-frontx-dashboard-feature-mfe-entries`. The larger-view modal's entry lists `show_larger_view` in its `actions`.

### 6.5 Extension Domain: layout_cells

**GTS instance ID**: `gts.frontx.mfes.ext.domain.v1~frontx.dashboard_v.layout.layout_cells.v1`

**Description**: The widget canvas of the dashboards root. The dashboards root implements it in its own registry with the Concurrent strategy. Each cell holds at most one occupant, the generated extension of that cell's widget. The template adds no domain type.

| Property | Value |
|----------|-------|
| Implemented by | the dashboards root, in its own registry |
| Mount strategy | Concurrent, given at registration |
| Routed | no |
| Domain actions | `load_ext`, `mount_ext`, `unmount_ext`, `request_data` |
| Extension actions | `set_widget_context`, `set_data` |
| Shared properties | theme and language, published unchanged |
| Extension type | `gts.frontx.mfes.ext.extension.v1~frontx.dashboard_v.layout.layout_cells.v1~` |
| Extensions registered | one per cell widget that passes its checks, when the dashboards root loads a dashboard |
| Occupancy | one occupant per cell |
| Domain lifecycle stages | `init` |
| Extension lifecycle stages | `init`, `activated`, `deactivated`, `destroyed` |
| Default action timeout | 30 000 ms |

**Instance**:

```json
{
  "id": "gts.frontx.mfes.ext.domain.v1~frontx.dashboard_v.layout.layout_cells.v1",
  "sharedProperties": [
    "gts.frontx.mfes.comm.shared_property.v1~frontx.mfes.comm.theme.v1~",
    "gts.frontx.mfes.comm.shared_property.v1~frontx.mfes.comm.language.v1~"
  ],
  "actions": [
    "gts.frontx.mfes.comm.action.v1~frontx.mfes.ext.load_ext.v1~",
    "gts.frontx.mfes.comm.action.v1~frontx.mfes.ext.mount_ext.v1~",
    "gts.frontx.mfes.comm.action.v1~frontx.mfes.ext.unmount_ext.v1~",
    "gts.frontx.mfes.comm.action.v1~frontx.dashboard_v.mfe.request_data.v1~"
  ],
  "extensionsActions": [
    "gts.frontx.mfes.comm.action.v1~frontx.dashboard_v.mfe.set_widget_context.v1~",
    "gts.frontx.mfes.comm.action.v1~frontx.dashboard_v.mfe.set_data.v1~"
  ],
  "extensionsTypeId": "gts.frontx.mfes.ext.extension.v1~frontx.dashboard_v.layout.layout_cells.v1~",
  "defaultActionTimeout": 30000,
  "lifecycleStages": [
    "gts.frontx.mfes.lifecycle.stage.v1~frontx.mfes.lifecycle.init.v1"
  ],
  "extensionsLifecycleStages": [
    "gts.frontx.mfes.lifecycle.stage.v1~frontx.mfes.lifecycle.init.v1",
    "gts.frontx.mfes.lifecycle.stage.v1~frontx.mfes.lifecycle.activated.v1",
    "gts.frontx.mfes.lifecycle.stage.v1~frontx.mfes.lifecycle.deactivated.v1",
    "gts.frontx.mfes.lifecycle.stage.v1~frontx.mfes.lifecycle.destroyed.v1"
  ]
}
```

**Declaration notes**:

- `actions`: the lifecycle actions that the Concurrent strategy requires, and `request_data`, which this domain handles. The owner registers a handler for each of them in `build(ctx)`.
- `extensionsActions`: `set_widget_context` and `set_data`, which the owner sends to its widgets, so only entries that handle both are admitted.
- `sharedProperties`: theme and language only. The owner publishes the host values unchanged (section 3, Publish Theme and Language).
- `lifecycleStages`: only `init`, because the domain lives as long as its registry.
- The domain has no `route`: generated extensions are not routed.

### 6.6 Extension Domain: larger_view

**GTS instance ID**: `gts.frontx.mfes.ext.domain.v1~frontx.dashboard_v.layout.larger_view.v1`

**Description**: The nested domain of the larger-view modal. The larger-view modal implements it in its own registry with the Optional strategy, which keeps at most one occupant: the shown larger-view widget. It exists because a child cannot register into an ancestor's registry, so the larger-view extensions are registered where their domain is held.

| Property | Value |
|----------|-------|
| Implemented by | the larger-view modal, in its own nested registry |
| Mount strategy | Optional, given at registration |
| Routed | no |
| Domain actions | `load_ext`, `mount_ext`, `unmount_ext`, `request_data` |
| Extension actions | `set_widget_context`, `set_data` |
| Shared properties | theme and language, published unchanged |
| Extension type | `gts.frontx.mfes.ext.extension.v1~frontx.dashboard_v.layout.larger_view.v1~` |
| Extensions registered | one per larger-view widget that passes its checks, when the larger-view modal loads a dashboard |
| Occupancy | at most one occupant, the shown larger-view widget |
| Domain lifecycle stages | `init` |
| Extension lifecycle stages | `init`, `activated`, `deactivated`, `destroyed` |
| Default action timeout | 30 000 ms |

**Instance**:

```json
{
  "id": "gts.frontx.mfes.ext.domain.v1~frontx.dashboard_v.layout.larger_view.v1",
  "sharedProperties": [
    "gts.frontx.mfes.comm.shared_property.v1~frontx.mfes.comm.theme.v1~",
    "gts.frontx.mfes.comm.shared_property.v1~frontx.mfes.comm.language.v1~"
  ],
  "actions": [
    "gts.frontx.mfes.comm.action.v1~frontx.mfes.ext.load_ext.v1~",
    "gts.frontx.mfes.comm.action.v1~frontx.mfes.ext.mount_ext.v1~",
    "gts.frontx.mfes.comm.action.v1~frontx.mfes.ext.unmount_ext.v1~",
    "gts.frontx.mfes.comm.action.v1~frontx.dashboard_v.mfe.request_data.v1~"
  ],
  "extensionsActions": [
    "gts.frontx.mfes.comm.action.v1~frontx.dashboard_v.mfe.set_widget_context.v1~",
    "gts.frontx.mfes.comm.action.v1~frontx.dashboard_v.mfe.set_data.v1~"
  ],
  "extensionsTypeId": "gts.frontx.mfes.ext.extension.v1~frontx.dashboard_v.layout.larger_view.v1~",
  "defaultActionTimeout": 30000,
  "lifecycleStages": [
    "gts.frontx.mfes.lifecycle.stage.v1~frontx.mfes.lifecycle.init.v1"
  ],
  "extensionsLifecycleStages": [
    "gts.frontx.mfes.lifecycle.stage.v1~frontx.mfes.lifecycle.init.v1",
    "gts.frontx.mfes.lifecycle.stage.v1~frontx.mfes.lifecycle.activated.v1",
    "gts.frontx.mfes.lifecycle.stage.v1~frontx.mfes.lifecycle.deactivated.v1",
    "gts.frontx.mfes.lifecycle.stage.v1~frontx.mfes.lifecycle.destroyed.v1"
  ]
}
```

**Declaration notes**: the same as for `layout_cells`, with the Optional strategy, which also requires `mount_ext` and `unmount_ext`. The domain has no `route`: the generated larger-view extensions are not known before the modal loads a dashboard, and FrontX routing restores only extensions that are registered when their domain takes its first resolution. The modal keeps the shown widget in its own subroute instead.

### 6.7 Extension Type: layout_cells

**GTS ID**: `gts.frontx.mfes.ext.extension.v1~frontx.dashboard_v.layout.layout_cells.v1~`

**Schema**:

```json
{
  "$id": "gts://gts.frontx.mfes.ext.extension.v1~frontx.dashboard_v.layout.layout_cells.v1~",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "Layout Cells Extension",
  "description": "Generated cell extension of the layout_cells domain. Adds no field to the FrontX extension base.",
  "allOf": [
    { "$ref": "gts://gts.frontx.mfes.ext.extension.v1~" },
    {
      "type": "object",
      "required": ["id", "domain", "entry"],
      "properties": {
        "id": {
          "type": "string",
          "x-gts-instance-ref": "gts.frontx.mfes.ext.extension.v1~frontx.dashboard_v.layout.layout_cells.v1~",
          "description": "This extension type followed by the UUIDv5 of section 6.9."
        },
        "domain": {
          "type": "string",
          "const": "gts.frontx.mfes.ext.domain.v1~frontx.dashboard_v.layout.layout_cells.v1"
        },
        "entry": {
          "type": "string",
          "x-gts-instance-ref": "gts.frontx.mfes.mfe.entry.v1~frontx.mfes.mfe.entry_mf.v1~",
          "description": "The entry of the winning widget realization."
        }
      }
    }
  ]
}
```

### 6.8 Extension Type: larger_view

**GTS ID**: `gts.frontx.mfes.ext.extension.v1~frontx.dashboard_v.layout.larger_view.v1~`

**Schema**:

```json
{
  "$id": "gts://gts.frontx.mfes.ext.extension.v1~frontx.dashboard_v.layout.larger_view.v1~",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "Larger View Extension",
  "description": "Generated larger-view extension of the larger_view domain. Adds no field to the FrontX extension base.",
  "allOf": [
    { "$ref": "gts://gts.frontx.mfes.ext.extension.v1~" },
    {
      "type": "object",
      "required": ["id", "domain", "entry"],
      "properties": {
        "id": {
          "type": "string",
          "x-gts-instance-ref": "gts.frontx.mfes.ext.extension.v1~frontx.dashboard_v.layout.larger_view.v1~",
          "description": "This extension type followed by the UUIDv5 of section 6.9."
        },
        "domain": {
          "type": "string",
          "const": "gts.frontx.mfes.ext.domain.v1~frontx.dashboard_v.layout.larger_view.v1"
        },
        "entry": {
          "type": "string",
          "x-gts-instance-ref": "gts.frontx.mfes.mfe.entry.v1~frontx.mfes.mfe.entry_mf.v1~",
          "description": "The larger_view_entry of the winning widget realization when it names one, and its entry otherwise."
        }
      }
    }
  ]
}
```

**Notes for both extension types**: the `domain` constant uses the instance form without a trailing `~`. The entry type is the FrontX MFE entry type, a final type that the template only instantiates. Everything that may change while the widget id stays the same, such as presentation fields, the query or member metadata, reaches the widget in `set_widget_context`, never in the declaration.

### 6.9 Generated Extension Identifier Rule

**Description**: Every generated extension has a deterministic identifier, because FrontX keeps per-extension state, such as the extension's bridge, across unmounting and unregistration, so an extension id is never fully released. The same widget, role and entry always give the same identifier, so loading the same dashboard again reuses what FrontX keeps per id.

| Domain | Registered by | Identifier form |
|--------|---------------|-----------------|
| `layout_cells` | the dashboards root, in its own registry, when it loads a dashboard | `gts.frontx.mfes.ext.extension.v1~frontx.dashboard_v.layout.layout_cells.v1~<uuidv5>` |
| `larger_view` | the larger-view modal, in its own registry, when it loads a dashboard | `gts.frontx.mfes.ext.extension.v1~frontx.dashboard_v.layout.larger_view.v1~<uuidv5>` |

- The UUIDv5 is computed under a fixed template namespace UUID, a constant of the `dashboard` package that never changes, from the name `<widget id>|<role>|<entry id>` (section 3, Derive a Generated Extension Id).
- `<widget id>` is the widget's full `id`, with its type chain and UUID. Each widget id appears once in a dashboard, in a cell or as a larger-view widget, because the layout checks reject a repeated id. So each generated extension belongs to exactly one widget instance.
- `<role>` is `cell` or `larger_view`. It keeps a cell extension and a larger-view extension of the same widget apart under the tree-wide uniqueness of target ids.
- `<entry id>` is the selected entry. A different winning realization gives a different identifier, so FrontX never reuses one id for different code.
- The identifier is a combined anonymous instance id: the extension type chain followed by the UUIDv5, never split into parts.
- The derivation is internal to the `dashboard` package (DESIGN section 3.3, API Stability Classification); the identifiers it produces are not persisted.
- The domain identifiers and the larger-view modal's identifier are fixed. Generated identifiers differ by widget, role and entry, so they never collide with each other or with the fixed ones.

### 6.10 Declarations and Admission

FrontX rejects an action whose target does not list it, and admits an entry into a domain by the subset rules. The declarations that make the template's contracts work:

| Party | Declares | Why |
|---|---|---|
| `layout_cells`, `larger_view` | `request_data` in `actions`, with a handler registered in `build(ctx)` | FrontX accepts a domain only when every listed action has a handler and every handler is listed |
| `layout_cells`, `larger_view` | `set_widget_context` and `set_data` in `extensionsActions` | only entries that handle both are admitted, so one entry per widget type fits both domains |
| Every widget entry (`cpt-frontx-dashboard-feature-mfe-entries`) | `set_widget_context` and `set_data` in `actions`, `request_data` in `domainActions`, theme and language as required properties; `markdown_card` too | admitted into both domains; its `set_data` handler exists before its first `request_data` |
| The larger-view modal's entry (`cpt-frontx-dashboard-feature-mfe-entries`) | `show_larger_view` in `actions`; no `domainActions` (`unmount_ext` is a lifecycle action, exempt from admission) | receives the second step of the cell widget's chain, and sends the lifecycle action `unmount_ext` from its close button |
| The shell's `popup` domain (host contract) | Optional strategy, routed, theme and language, `mount_ext` and `unmount_ext`, no extension type constraint | admits the larger-view modal; it declares no extension actions, so `show_larger_view` does not block admission |

**Cardinality matrix check**: `layout_cells` (Concurrent) and `larger_view` (Optional) both require `mount_ext` and `unmount_ext`, and both declare them, so both are admitted.

**Handlers exist before they are needed.** A domain's `request_data` handler is registered when the domain is registered, so before any extension in it mounts. An entry's `mount` resolves only after it has registered its action handlers, and the next step of a chain runs only after the mount resolves. So a widget's `set_data` handler exists before its first `request_data`, and the larger-view modal's `show_larger_view` handler exists before the second step of the cell widget's chain.

### 6.11 Sequence Coverage

This feature owns the owner side of the 8 runtime DESIGN sequences. The table is for orientation; the step lists are the processes of section 3.

| DESIGN sequence | Owner side, here | Other sides |
|---|---|---|
| `cpt-frontx-dashboard-seq-initial-load` | Start a Domain Owner (the GTS file loader, the served query-family type schemas, the `widgets` manifest and every manifest that a registered realization names, with their entries, in the own registry); Load a Dashboard; Register Generated Extensions; Mount Cell Widgets; Answer a Data Request | the widget side (loader, first `request_data`) in `cpt-frontx-dashboard-feature-widget-catalog`; the calls and served query families in `cpt-frontx-dashboard-feature-data-adapter-contract`; the registration of the template's schemas in `cpt-frontx-dashboard-feature-mfe-entries` |
| `cpt-frontx-dashboard-seq-query-change` | Answer a Data Request | the widget side in `cpt-frontx-dashboard-feature-widget-catalog`; the change-query flow in `cpt-frontx-dashboard-feature-data-adapter-contract` |
| `cpt-frontx-dashboard-seq-widget-modal-open` | Open the Larger View from a Cell Widget; Start a Domain Owner for the modal's first mount; Show a Larger View | the button in `cpt-frontx-dashboard-feature-widget-catalog`; the static extension and the entry in `cpt-frontx-dashboard-feature-mfe-entries`; the modal's call in `cpt-frontx-dashboard-feature-data-adapter-contract` |
| `cpt-frontx-dashboard-seq-larger-view-refresh` | Restore a Larger View after a Refresh | the static, routed extension that FrontX restores in `cpt-frontx-dashboard-feature-mfe-entries`; the call that loads the dashboard again in `cpt-frontx-dashboard-feature-data-adapter-contract` |
| `cpt-frontx-dashboard-seq-larger-view-close` | Close the Larger View (the close button, the modal keeping its loaded dashboard) | the modal entry's declarations in `cpt-frontx-dashboard-feature-mfe-entries` (`show_larger_view` in `actions`, no `domainActions`, because `unmount_ext` is exempt from admission); the click outside is the shell's prerequisite |
| `cpt-frontx-dashboard-seq-cannot-show` | Show the Cannot-Show Placeholder at both levels, the failed owner start, the attribution of validation failures, the dashboard-area loader, the diagnostics, the outcomes of extension creation, and the unknown larger-view widget id | the dashboard-level triggers in `cpt-frontx-dashboard-feature-dashboard-root-types`; the widget checks and the wordings in `cpt-frontx-dashboard-feature-widget-catalog`; the unserved query family and the loader-stays case in `cpt-frontx-dashboard-feature-data-adapter-contract`; the missing GTS file in `cpt-frontx-dashboard-feature-mfe-entries` |
| `cpt-frontx-dashboard-seq-theme-switch` | Publish Theme and Language (owner chrome, and the republication on every mount) | the widget side and the chart theme in `cpt-frontx-dashboard-feature-widget-catalog`; the required properties of each entry in `cpt-frontx-dashboard-feature-mfe-entries` |
| `cpt-frontx-dashboard-seq-teardown` | Tear Down, with the loaded dashboard kept for a return | none |

## 7. Acceptance Criteria

- [ ] `cfs validate --artifact` reports no structural errors for this document.
- [ ] The 4 action types, the 2 domain instances and the 2 extension types of section 6 validate against their FrontX bases under GTS v0.17, and the template declares no other action, domain or extension type.
- [ ] No schema of this feature refers to a `dashboard_v` type from `dashboard_m`, and every identifier field uses a literal base operand.
- [ ] Given `layout_cells` registered with the Concurrent strategy and `larger_view` with the Optional strategy, each with its `request_data` handler, when the owners register them, then both are accepted; leaving out the handler or the `request_data` listing is rejected.
- [ ] Given a widget entry that lists `set_widget_context` and `set_data` in `actions` and `request_data` in `domainActions`, when it is checked for admission, then it is admitted into both domains; an entry that misses `set_data` is rejected by both.
- [ ] Given a `set_widget_context` payload for a `grid` widget with `widget`, `data_shape`, `fill`, `members` and `larger_view`, when it is validated, then it passes; with `data_shape` but no `fill`, or with an extra payload field, it fails.
- [ ] Given a `set_widget_context` payload for a `markdown_card` with only `widget`, when it is validated, then it passes.
- [ ] Given the `fill` trait value of each of the 8 template data widget types, when it is placed as `fill` in a `set_widget_context` payload and in a `request_data` payload, then it validates in both; a `rows_by_member` value without `fields`, or another mode with `fields`, fails in both.
- [ ] Given a `request_data` whose `target` is not `layout_cells` or `larger_view`, whose payload misses `reply_to`, or whose `data` has no `timezone`, when it is validated, then it fails.
- [ ] Given a `fill` with `from` set to `timeDimensions[0]`, when it is placed in a `set_widget_context` payload and in a `request_data` payload, then it validates in both; a `from` of `time` or `timeDimensions[1]` fails in both.
- [ ] Given a dashboard with 3 cells whose widgets are of the widget types `grid`, `pie_chart` and `markdown_card`, and only the template's realizations, when the dashboards root loads it, then it calls "get a dashboard" once and registers exactly 3 generated extensions in its own registry, with the identifiers of section 6.9 and `entry` from the template realization of each widget type, and none in any other registry.
- [ ] Given that dashboard, when its cells mount, then each cell widget receives `set_widget_context` after its `mount_ext` and before any `set_data`, with its own widget instance, and the `grid` and `pie_chart` widgets also with `data_shape`, `fill` and `members`.
- [ ] Given a `pie_chart` whose query has one measure, one dimension, `timeDimensions[0]` without `granularity`, a filter on a second dimension, and an `order` pair on the measure, when the owner builds its context, then `members` holds exactly one entry each for the measure, the dimension, the time dimension and the filter dimension, with no duplicate for the measure named again in `order`.
- [ ] Given a cell that defines a larger-view widget and a cell that does not, when both cell widgets receive their context, then only the first carries `larger_view`, with the dashboard id and the larger-view widget id, and only the first shows the larger-view button.
- [ ] Given the same dashboard loaded twice, and another dashboard loaded in between, when the identifiers are compared, then they are equal for the same widget, role and entry, the extensions of the first dashboard are unregistered before the second is registered, and no collision diagnostic is logged.
- [ ] Given the template's `grid` realization of weight 1 and a replacement `grid` realization of weight 2, when a dashboard with a `grid` cell loads, then the cell extension takes its `entry` from the replacement and its identifier differs from the one the template realization gives.
- [ ] Given two `grid` realizations of weight 2, when a dashboard with a `grid` cell and a `pie_chart` cell loads, then the `grid` cell shows the placeholder with a diagnostic that names the widget type and both tied realizations, and the `pie_chart` cell mounts.
- [ ] Given no template GTS file can be fetched, when a dashboard loads, then every widget shows the widget-level placeholder and the diagnostic names the file.
- [ ] Given a template GTS file in which the registry rejects the `pie_chart` realization, when an owner starts and loads a dashboard with a `grid` cell and a `pie_chart` cell, then the diagnostic names the rejected entry, the other realizations are registered, the `grid` cell mounts, and the `pie_chart` cell shows the widget-level placeholder.
- [ ] Given a registry that rejects the owner's domain, when the dashboards root or the larger-view modal starts, then it shows the dashboard-level placeholder with a diagnostic and does not call "get a dashboard"; a later load, a later `show_larger_view` and a later mount show the same placeholder.
- [ ] Given a data adapter whose declaration of served query families returns two family type schemas, when an owner starts, then it registers both schemas before any dashboard loads.
- [ ] Given a consumer package whose manifest carries a `grid` entry, and a copy of the template's GTS file with a `grid` realization of weight 2 that names that entry, when a dashboards root that is a screen extension starts and loads a dashboard with a `grid` cell, then it registers the `widgets` manifest and the consumer manifest with their entries in its own registry, and the cell mounts the consumer entry.
- [ ] Given the same consumer package and realization, when the larger-view modal starts and shows a `grid` larger-view widget, then it registers the `widgets` manifest and the consumer manifest with their entries in its own registry, and the modal mounts the consumer entry.
- [ ] Given a cell extension whose registration is rejected, or whose `mount_ext` or `set_widget_context` fails, when the dashboard loads, then only that cell shows the placeholder, `mount_ext` is not sent again for it, and the other cells are unaffected.
- [ ] Given a dashboard whose layout fails its checks, when it loads, then the dashboard area shows one placeholder, no cell mounts, and no extension is registered.
- [ ] Given a delivery set with a dataset type of a query family that is not served, when the dashboards root loads the dashboard, then the owner skips the type with a diagnostic that names it, the widgets whose query names it show the widget-level placeholder, and the other cells mount.
- [ ] Given a delivery set with another dataset type that GTS rejects, when the dashboards root loads the dashboard, then the dashboard area shows one placeholder, the diagnostic names the type, no cell mounts, and no extension is registered.
- [ ] Given a dashboard with three cells, one of whose cell widgets has a presentation field that its widget type does not allow, and another of whose larger-view widgets has an invalid query, when the dashboards root loads it, then only the first cell shows the widget-level placeholder and the other two cells mount; when the larger-view modal shows the invalid larger-view widget, the modal shows the widget-level placeholder.
- [ ] Given a dashboard without `name`, when an owner loads it, then the validation failure lies outside every widget path and the dashboard-level placeholder shows.
- [ ] Given the dashboards root loading dashboard A, when the viewer opens dashboard B before the data adapter returns A, then A is discarded when it arrives, nothing of A is shown or registered, and B loads.
- [ ] Given a `grid` cell whose query names a measure id with no registered measure instance, when the dashboards root loads the dashboard, then the widget fails at load (Load a Dashboard, step 14), its cell shows the widget-level placeholder with a diagnostic that names the member, no generated extension is registered and no `mount_ext` is sent for it, and the other cells mount.
- [ ] Given a data adapter that returns no dashboard, when the dashboards root loads, then the loader stays, with no error message, no Retry and no timeout.
- [ ] Given a data adapter that answers `request_data` after longer than 30 000 ms, when a data widget requests its data, then the request's chain ends without a timeout and `set_data` reaches the widget with the copied timestamp.
- [ ] Given a data widget's request, when the owner answers it, then the data adapter receives the payload unchanged, including the `timezone` that the widget set in `data`, and `set_data` is sent as a separate chain to `reply_to`.
- [ ] Given a `request_data` whose `reply_to` is not a mounted generated extension of the owner's domain, when the owner receives it, then it calls nothing and sends nothing.
- [ ] Given a widget that is unmounted while its request is in flight, when the answer arrives, then the owner sends no `set_data`.
- [ ] Given a data adapter that answers a `grid` request with a data instance whose `id` names the `pie_chart` data shape, when the owner receives the answer, then it sends no `set_data`, writes a diagnostic that names both data shapes, and the widget keeps its loader.
- [ ] Given a grid that the viewer sorts, pages and resizes, when the owner receives the resulting requests, then it answers one `request_data` per sort or page change and receives none for the resize.
- [ ] Given a mounted cell widget with a larger view, when the viewer presses its button, then its chain runs `mount_ext` of the larger-view modal in the `popup` domain with `history: "none"` and then `show_larger_view`, no history entry is pushed, the `popup` domain identifier comes from the shell constant, and nothing is registered in the shell's registry.
- [ ] Given that opening, when the modal shows the larger view, then it loads the dashboard once, registers one generated extension per larger-view widget that passes, and mounts the requested one in `larger_view` with `set_widget_context` that carries no `larger_view`.
- [ ] Given a larger view of a dashboard that the modal has loaded, when the viewer closes it and opens a larger view of the same dashboard again, then the modal calls nothing, registers nothing, and the widget starts from a fresh mount followed by its context.
- [ ] Given a larger view of dashboard A and then an opening for dashboard B, when the modal shows B, then it unregisters the generated extensions of A before it registers those of B.
- [ ] Given a shown larger-view extension whose `unmount_ext` fails, when the viewer opens another larger view, then the modal shows the widget-level placeholder with a diagnostic that names that extension, and the next opening unmounts it first.
- [ ] Given a page refresh with a larger view open, when the page loads, then the same larger-view widget is shown again.
- [ ] Given a page address whose subroute names a larger-view widget id that is not in the dashboard, or a cell widget's id, when the page loads, then the modal shows the placeholder.
- [ ] Given an open larger view, when the viewer presses the close button with the keyboard, or clicks outside the modal, then the modal is unmounted from the `popup` domain, the dashboard is unchanged, and the modal's generated extensions stay registered; the close button's `unmount_ext` carries `history: "none"` and pushes no history entry.
- [ ] Given a host without the modal container, when the viewer presses a larger-view button, then no larger view appears and the dashboard is unchanged.
- [ ] Given an open dashboard with an open larger view, when the host theme id changes, then `layout_cells` and `larger_view` publish the new value unchanged, each owner's chrome switches its ui-kit scope, no action is sent to any widget, no `request_data` is sent and nothing is remounted.
- [ ] Given an open dashboard, when the host language changes, then both domains publish the new language unchanged and the owners' own text follows it.
- [ ] Given a larger view that the viewer has closed, when the host theme id changes while the modal is closed and the viewer then opens a larger view again, then the modal reads the current theme with `getProperty` and publishes it on `larger_view` before the widget mounts, and the modal's chrome and the widget show the new theme.
- [ ] Given an open dashboard, when the viewer opens another dashboard, then every cell extension is unmounted, the generated cell extensions of the first dashboard are unregistered, and nothing is sent to the larger-view modal.
- [ ] Given an open dashboard that the viewer leaves, when the dashboards root is mounted again with the same dashboard id, then on leaving every cell was unmounted and its generated extensions stayed registered, and on the return the root does not call "get a dashboard", registers nothing, and runs `mount_ext` followed by `set_widget_context` for each cell; when it is mounted again with another dashboard id instead, it unregisters the extensions of the first dashboard and loads the other one.
- [ ] Given the reference dashboard, when the initial-render measurement runs, then the dashboards root calls "get a dashboard" once, registers every generated extension before the first mount, and mounts the cells in parallel.
