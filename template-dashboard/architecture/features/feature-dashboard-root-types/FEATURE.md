---
status: accepted
version: 1
date: 2026-10-30
description: Dashboard root type with its embedded layout, the delivery set that comes with a dashboard, and the dashboard-level cannot-show triggers.
---

# Feature: Dashboard Root Types


<!-- toc -->

- [1. Feature Context](#1-feature-context)
  - [1.1 Overview](#11-overview)
  - [1.2 Purpose](#12-purpose)
  - [1.3 Actors](#13-actors)
  - [1.4 References](#14-references)
- [2. Actor Flows (CDSL)](#2-actor-flows-cdsl)
  - [Domain-Model Feature — No Actor Flows](#domain-model-feature--no-actor-flows)
- [3. Processes / Business Logic (CDSL)](#3-processes--business-logic-cdsl)
  - [Register Delivery Set](#register-delivery-set)
  - [Validate Dashboard](#validate-dashboard)
  - [Dashboard-Level Cannot-Show Triggers](#dashboard-level-cannot-show-triggers)
- [4. States (CDSL)](#4-states-cdsl)
  - [Domain-Model Feature — No State Machines](#domain-model-feature--no-state-machines)
- [5. Definitions of Done](#5-definitions-of-done)
  - [Domain Model Definition of Done](#domain-model-definition-of-done)
  - [Delivery and Cannot-Show Definition of Done](#delivery-and-cannot-show-definition-of-done)
- [6. Domain Model](#6-domain-model)
  - [6.1 Dashboard](#61-dashboard)
- [7. Acceptance Criteria](#7-acceptance-criteria)

<!-- /toc -->

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-featstatus-dashboard-root-types`
## 1. Feature Context

- [ ] `p2` - `cpt-frontx-dashboard-feature-dashboard-root-types`

### 1.1 Overview

This is mainly a **domain-model feature**. It declares the Dashboard root, which embeds its layout, and no other type. It also owns the rules that the domain owners apply when they load a dashboard: what is delivered with the dashboard (the delivery set) and the order in which it is registered, the validation of the dashboard with the attribution of its failures, and the dashboard-level cannot-show triggers. The rules are in section 3; the type is in section 6, Domain Model. The flow and state sections are stubs.

### 1.2 Purpose

Declare the Dashboard root of the domain model in DESIGN section 3.1, the instance that the data adapter returns for one dashboard id, together with the rules for what is delivered with it and when the whole dashboard cannot be shown. The root holds the combined instance `id`, `name`, an optional `description`, and the embedded `layout`. The consuming product writes or generates its dashboards; authoring is out of scope for the template. Either way, a dashboard validates against these types, so a consuming product can check the root of a dashboard it generates, and its embedded layout, before the dashboard is served. The dashboard carries no theme: the theme belongs to the host, and the dashboard follows the host theme (`cpt-frontx-dashboard-fr-theme` is covered by `cpt-frontx-dashboard-feature-extension-domain-catalog`).

**Depends on**: `cpt-frontx-dashboard-feature-layout-types`, `cpt-frontx-dashboard-feature-query-vocabulary`.

**Declaring package**: `dashboard`.

**Requirements**: `cpt-frontx-dashboard-fr-domain-model`, `cpt-frontx-dashboard-fr-backend-source`, `cpt-frontx-dashboard-fr-loading-error-states`

**Use cases**: `cpt-frontx-dashboard-usecase-provide-dashboard` (the types that a consuming product describes and checks a dashboard with; the other features named in DECOMPOSITION cover the remaining steps)

**Principles**: `cpt-frontx-dashboard-principle-gts-contracts`

**Constraints**: `cpt-frontx-dashboard-constraint-gts-id-convention`

**Out of scope**: a report type and any visibility, publication, sharing, or audience field; any theme type or theme instance; widget settings added by a consuming product; the obligation of the data adapter to return the delivery set (`cpt-frontx-dashboard-feature-data-adapter-contract`); the placeholder that shows a cannot-show trigger (`cpt-frontx-dashboard-feature-extension-domain-catalog`).

### 1.3 Actors

N/A — domain-model feature. The types are consumed by the domain owners (the dashboards root and the larger-view modal) and by the widgets, not by an end-user actor. No human actor flows are authored.

Not applicable here: performance (PERF), security (SEC), operations (OPS), compliance (COMPL) and user experience (UX), because this feature declares one closed type and the rules that apply it; access to dashboards belongs to the data adapter, and the placeholder belongs to `cpt-frontx-dashboard-feature-extension-domain-catalog`. Nothing is persisted. Reliability (REL) applies: an invalid dashboard is rejected at load, and the first registration of an id is kept. Data (DATA) applies: section 6 holds the schema.

### 1.4 References

- **PRD**: [PRD.md](../../PRD.md)
- **Design**: [DESIGN.md](../../DESIGN.md#31-domain-model) section 3.1; `cpt-frontx-dashboard-seq-initial-load` as context only, the load in which the owners apply these rules
- **ADRs**: [ADR-0002](../../ADR/0002-dashboard-layout-grid-v1.md) (a failed layout check is the dashboard-level cannot-show state), [ADR-0003](../../ADR/0003-shared-data-types-and-schemas-v1.md) (literal base operands, polymorphic validation), [ADR-0006](../../ADR/0006-theme-distribution-v1.md) (the dashboard carries no theme), [ADR-0011](../../ADR/0011-data-adapter-v1.md) (two-level cannot-show), [ADR-0012](../../ADR/0012-query-vocabulary-and-datasets-v1.md) (product data delivered with the dashboard; the first registration of an id wins)
- **Dependencies**: `cpt-frontx-dashboard-feature-layout-types` (the Dashboard embeds a `gts.frontx.dashboard_m.layout.layout.v1~` object and the layout checks run on it); `cpt-frontx-dashboard-feature-query-vocabulary` (the dataset types and the measure and dimension instances of the delivery set derive from its base types).
- **Related**: `cpt-frontx-dashboard-feature-data-adapter-contract` (returns the delivery set with the dashboard; cites the delivery rule of this feature); `cpt-frontx-dashboard-feature-extension-domain-catalog` (the domain owners that apply the rules and show the placeholder).
- **Design elements**:
  - Domain model entities: Dashboard.
  - Components: none; the root type is data, and its consumers belong to `cpt-frontx-dashboard-feature-extension-domain-catalog` and `cpt-frontx-dashboard-feature-data-adapter-contract`.
  - API: `cpt-frontx-dashboard-interface-data-adapter` (shared (data side), owned by `cpt-frontx-dashboard-feature-data-adapter-contract`: the delivery set that "get a dashboard" returns); `cpt-frontx-dashboard-interface-domain-model` (dashboard root part).
  - Sequences: `cpt-frontx-dashboard-seq-cannot-show` (shared (dashboard-level side), owned by `cpt-frontx-dashboard-feature-extension-domain-catalog`: the triggers that replace the whole dashboard with the placeholder).
  - Data: none; the template persists nothing.

## 2. Actor Flows (CDSL)

### Domain-Model Feature — No Actor Flows

N/A — domain-model feature. No actor flow is specified here; the load of a dashboard runs in the domain owners (`cpt-frontx-dashboard-seq-initial-load`).

## 3. Processes / Business Logic (CDSL)

### Register Delivery Set

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-algo-dashboard-root-types-register-delivery`

The delivery set is the set of product types and instances that the dashboard's queries use: the dataset types, and the measure and dimension instances. The data adapter returns it with the dashboard. This feature owns its content, its registration order (measure and dimension instances before dataset types), the new-version-id rule, the skip rule for an unserved query family, and the rule that attributes validation failures.

**Input**: the delivery set that "get a dashboard" returned with the dashboard, in the domain owner that loads it.

**Output**: the delivery set registered, with each dataset type of an unserved query family skipped; or the dashboard-level cannot-show trigger with the type or instance that GTS rejected.

**Steps**:

1. [ ] - `p1` - The domain owner has registered the template's types before any dashboard loads - `inst-template-types-first`
2. [ ] - `p1` - **IF** any delivered type id equals the id of a template type, **RETURN** the dashboard-level cannot-show trigger, naming that id, and register nothing of the delivery. A delivered type never takes the place of a template type - `inst-reject-template-id`
3. [ ] - `p1` - The domain owner registers the measure and dimension instances of the delivery set first, then the dataset types, before it validates the dashboard. A dataset type that names a measure or a dimension registers after it. Dashboard validation runs with reference-existence lookup off, so member existence is not enforced by GTS; the widget catalog's load-time cross-check enforces it (`cpt-frontx-dashboard-feature-widget-catalog`) - `inst-register-delivery`
4. [ ] - `p1` - The FrontX type store keeps the first registration of an id, a behaviour this feature relies on as a prerequisite and not as a GTS rule. A delivered type or instance whose id is already registered, with the same content or with changed content, is not a failure: the content registered first stays. This covers the second owner that loads the same dashboard, and a dashboard loaded again. A dataset, measure or dimension with new content must therefore carry a new version id - `inst-new-version-id`
5. [ ] - `p1` - Before it registers a dataset type, the domain owner checks the served families of the data adapter. **IF** the dataset type derives from a query family that the data adapter does not serve, so that the parent schema is not registered - `inst-if-unserved-dataset`
   1. [ ] - `p1` - The domain owner skips that type and does not register it, writes a diagnostic that names it, and continues; this is not a registration failure. Every widget whose query names that dataset gets the widget-level cannot-show state (unserved family, `cpt-frontx-dashboard-algo-data-adapter-contract-check-served-family`) - `inst-skip-unserved-dataset`
6. [ ] - `p1` - **IF** GTS rejects any other delivered type or instance, for example a schema that is not valid, or an instance that does not validate against its type - `inst-if-register-failed`
   1. [ ] - `p1` - **RETURN** the dashboard-level cannot-show trigger, naming the rejected type or instance - `inst-return-delivery-trigger`
7. [ ] - `p1` - **RETURN** the delivery set registered - `inst-return-registered`

### Validate Dashboard

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-algo-dashboard-root-types-validate-dashboard`

**Input**: the dashboard that "get a dashboard" returned, after its delivery set is registered.

**Output**: the dashboard-level cannot-show trigger with every dashboard-level failure collected; or the dashboard valid at dashboard level, with the failures that lie under a widget, each attributed to its cell widget or larger-view widget.

**Steps**:

1. [ ] - `p1` - The domain owner validates the dashboard once against the type that its `id` names, with GTS validation through the FrontX GTS plugin and no validation of its own. The validation is polymorphic: it checks the root fields, the embedded layout with the bounds of each cell, every embedded widget against the type that its `id` names, and every embedded query against the dataset that the query's `id` names. It reports every failure with its instance path - `inst-validate-root`
2. [ ] - `p1` - **FOR EACH** failure - `inst-for-each-failure`
   1. [ ] - `p1` - **IF** its instance path lies under `layout.cells[i].widget` - `inst-if-under-cell-widget`
      1. [ ] - `p1` - Attribute it to the cell widget of cell `i`: a widget-level failure, handed to the domain owner - `inst-attribute-cell-widget`
   2. [ ] - `p1` - **ELSE IF** its instance path lies under `layout.cells[i].larger_view` - `inst-if-under-larger-view`
      1. [ ] - `p1` - Attribute it to the larger-view widget of cell `i`: a widget-level failure, handed to the domain owner - `inst-attribute-larger-view`
   3. [ ] - `p1` - **ELSE IF** its instance path lies under `layout.cells[i]` but outside its `widget` and `larger_view` - `inst-if-under-cell`
      1. [ ] - `p1` - Hand it to the layout algorithm of step 3, which collects it once as a cell failure; it is not collected as an invalid root - `inst-hand-cell-failure`
   4. [ ] - `p1` - **ELSE** collect it as a dashboard-level failure (invalid root) - `inst-collect-root-failure`
3. [ ] - `p1` - **IF** the embedded layout has its `cells` array, run the layout checks of `cpt-frontx-dashboard-feature-layout-types` on it with the failures handed to it in step 2, in their order and with their rules for naming cells, and collect every failing check, each failure once, as a dashboard-level failure (failed layout check) - `inst-run-layout-checks`
4. [ ] - `p1` - **IF** any dashboard-level failure was collected - `inst-if-dashboard-failed`
   1. [ ] - `p1` - **RETURN** the dashboard-level cannot-show trigger with all collected failures, each named by its instance path or by its cells - `inst-return-dashboard-trigger`
5. [ ] - `p1` - **RETURN** the dashboard valid at dashboard level, with the widget-level failures by widget; each owner applies those of the widgets of its role, together with its member-kind checks and cross-checks (`cpt-frontx-dashboard-feature-extension-domain-catalog`) - `inst-return-valid`

### Dashboard-Level Cannot-Show Triggers

This feature owns the trigger rule: a dashboard that triggers any of the following is in the dashboard-level cannot-show state. The domain owner shows the placeholder in place of the dashboard, or in the modal, and mounts no cells; the placeholder belongs to `cpt-frontx-dashboard-feature-extension-domain-catalog` (`cpt-frontx-dashboard-seq-cannot-show`).

- an invalid root: a validation failure whose instance path lies outside `layout.cells[i]` (a failure under a cell but outside its `widget` and `larger_view` belongs to the layout check) (`cpt-frontx-dashboard-algo-dashboard-root-types-validate-dashboard`);
- a failed layout check, including a cell failure (the same algorithm);
- delivered types that GTS rejects, other than a dataset type of an unserved query family, which only gives the widget-level cannot-show state to the widgets that name it (`cpt-frontx-dashboard-algo-dashboard-root-types-register-delivery`).

A validation failure under a cell's `widget` or `larger_view`, and every other failure of one widget, is a widget-level cannot-show state, owned by `cpt-frontx-dashboard-feature-widget-catalog` and `cpt-frontx-dashboard-feature-extension-domain-catalog`. A failed owner start, when the registry rejects the owner's domain, also shows the dashboard-level placeholder; it is not a trigger of this feature but of `cpt-frontx-dashboard-feature-extension-domain-catalog`, which defines it.

## 4. States (CDSL)

### Domain-Model Feature — No State Machines

N/A — domain-model feature. Type declarations are stateless.

## 5. Definitions of Done

### Domain Model Definition of Done

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-dod-dashboard-root-types-catalog-complete`

The system **MUST** declare `gts.frontx.dashboard_m.dashboard.dashboard.v1~` as a closed type with only its four fields (`id`, `name`, `description`, `layout`) in the `dashboard` package, and **MUST NOT** declare a report type, a theme type, or a theme instance.

- The Dashboard is authored with a full JSON Schema declaration.
- Every identifier follows the GTS identifier grammar and the ID-form convention of DESIGN section 3.1 (types end with `~`, instances do not).
- The `id` field names its base type as a literal operand, and every `$ref` resolves to a declared type.
- The Dashboard `id` is a combined anonymous instance identifier (`gts.frontx.dashboard_m.dashboard.dashboard.v1~<uuid>`); the Dashboard declares no separate `type` field.
- The layout is embedded in the Dashboard; no layout reference or separate layout instance exists.
- The Dashboard declares no `theme` field; the theme belongs to the host, and the template defines no theme type, instance, or palette.
- The Dashboard is closed with `unevaluatedProperties: false`, so a dashboard with any other field, such as `theme`, fails validation.
- This feature declares no consumer widget types.

**Implements**:

- `cpt-frontx-dashboard-algo-dashboard-root-types-validate-dashboard`

### Delivery and Cannot-Show Definition of Done

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-dod-dashboard-root-types-delivery-and-cannot-show`

The domain owner **MUST** register the delivery set after the template types and before it validates the dashboard, the measure and dimension instances before the dataset types, **MUST** treat a first-registered id as final, **MUST** validate the dashboard with one GTS validation whose failures it attributes by instance path, and **MUST** treat an invalid root, a failed layout check, or a delivered type that GTS rejects (other than a dataset type of an unserved query family, which is skipped) as a dashboard-level cannot-show trigger.

- The delivery set holds the dataset types and the measure and dimension instances that the dashboard's queries use; the measure and dimension instances register before the dataset types.
- An entry with new content has a new version id; an id that is already registered, with the same or changed content, is not a failure.
- A delivered type cannot replace a template type.
- A failure under a cell's `widget` or `larger_view` belongs to that widget; a failure under a cell but outside those paths is collected once, by the layout check; every other failure, and every failed layout check, is collected as dashboard-level.

**Implements**:

- `cpt-frontx-dashboard-algo-dashboard-root-types-register-delivery`
- `cpt-frontx-dashboard-algo-dashboard-root-types-validate-dashboard`

## 6. Domain Model

### 6.1 Dashboard

**GTS ID**: `gts.frontx.dashboard_m.dashboard.dashboard.v1~`

**Description**: Top-level container of a dashboard: identifier, name, optional description, and the embedded layout. A Dashboard instance is one dashboard as the data adapter returns it, written or generated; authoring is out of scope for the template. A dashboard is structured as follows:

- `id`, `name`, and the optional `description` identify and name the dashboard;
- `layout` embeds the dashboard's layout on the 60-column grid (`cpt-frontx-dashboard-feature-layout-types`);
- each layout cell embeds one widget instance, whose `id` type chain names the widget type, and each data widget embeds its query (`cpt-frontx-dashboard-feature-widget-catalog`).

The dashboard carries no widget data and no theme: each data widget asks for its data with `request_data`, and the dashboard follows the host theme (ADR-0006). The data adapter returns the dashboard together with its delivery set. Visibility, sharing, publication, and audience settings are not part of the Dashboard.

**Schema**:

```json
{
  "$id": "gts://gts.frontx.dashboard_m.dashboard.dashboard.v1~",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "Dashboard",
  "description": "Top-level container defining a named dashboard with its embedded layout.",
  "type": "object",
  "required": ["id", "name", "layout"],
  "properties": {
    "id": {
      "type": "string",
      "x-gts-instance-ref": "gts.frontx.dashboard_m.dashboard.dashboard.v1~",
      "description": "Combined anonymous instance identifier: the dashboard type chain followed by a UUID, for example gts.frontx.dashboard_m.dashboard.dashboard.v1~<uuid>. No separate type field exists."
    },
    "name": {
      "type": "string",
      "description": "Human-readable dashboard name."
    },
    "description": {
      "type": "string",
      "description": "Optional longer description of the dashboard purpose."
    },
    "layout": {
      "$ref": "gts://gts.frontx.dashboard_m.layout.layout.v1~",
      "description": "The dashboard's layout, embedded: the grid columns and the cells, each embedding one widget instance."
    }
  },
  "unevaluatedProperties": false
}
```

**Cross-references**:
- No abstract base (flat single-segment chain). The type is closed: no field other than the four declared ones is accepted.
- Related types: `gts.frontx.dashboard_m.layout.layout.v1~` (`cpt-frontx-dashboard-feature-layout-types`), embedded through `$ref`.
- Theme: the Dashboard does not reference a theme; the theme belongs to the host (ADR-0006).
- Delivery: the dataset types and vocabulary instances of the delivery set derive from the base types of `cpt-frontx-dashboard-feature-query-vocabulary`.

## 7. Acceptance Criteria

- [ ] The Dashboard is authored with its full schema
- [ ] The Dashboard passes GTS identifier grammar and GTS v0.17 schema validation, including the literal base operand of `id`
- [ ] The type identifier ends with `~`, every instance identifier does not, and every identifier carries `v1`
- [ ] `cfs validate --artifact` on this file reports PASS
- [ ] This feature declares no theme type, theme instance, palette, or consumer widget type
- [ ] The Dashboard schema requires `id`, `name`, and `layout`, embeds `layout` as an object, declares only `id`, `name`, `description`, and `layout`, is closed with `unevaluatedProperties: false`, and declares no `theme` or `report` field
- [ ] A dashboard with an extra field `theme` fails validation, and the failure is dashboard-level
- [ ] A dashboard with an invalid root, a failed layout check, or a delivered type that GTS rejects (other than a dataset type of an unserved query family) is in the dashboard-level cannot-show state, and no cell mounts
- [ ] A dashboard without `name` whose layout also has two overlapping cells and a cell with `x + w` above 60 yields one dashboard-level trigger that names all three failures, each by its instance path or its cells, as `cpt-frontx-dashboard-feature-layout-types` names them
- [ ] A dashboard whose cell 1 widget fails its widget type and whose cell 2 larger-view widget fails its dataset passes at dashboard level, with one failure attributed to the cell widget of cell 1 and one to the larger-view widget of cell 2
- [ ] The delivery set is registered after the template types and before validation, measure and dimension instances before dataset types, and a delivered entry with the id of a registered one keeps the first content
- [ ] Given the dashboards root has loaded a dashboard, when the larger-view modal loads the same dashboard and registers the same delivery set again, then the registration is not a failure and the modal's load succeeds
- [ ] A delivered dataset type that references a delivered measure or dimension registers after that measure or dimension. Dashboard validation runs with reference-existence lookup off, and member existence is enforced by the widget catalog's load-time cross-check, so a reference to a member that is not registered can remain in a valid dashboard until that cross-check
- [ ] A delivery that contains a type id equal to a template type id is rejected before anything of the delivery is registered, and the dashboard is in the dashboard-level cannot-show state naming that id; the template type stays in effect
- [ ] A delivered dataset type whose query family is not served is checked before registration, skipped with a diagnostic and is not a dashboard-level failure; every widget whose query names it shows the widget-level cannot-show state, and the other cells mount
- [ ] A delivered measure instance that does not validate against the measure base type is rejected by GTS and gives the dashboard-level trigger, naming the instance
