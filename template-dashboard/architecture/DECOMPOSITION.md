---
status: proposed
version: 3
date: 2026-10-24
description: Decomposition of the FrontX dashboard template DESIGN into its seven features, six type-catalog features and the backend contract feature, with their scope, dependency order, and coverage of PRD and DESIGN identifiers.
---

# Decomposition: FrontX Dashboard Template

<!-- toc -->

- [1. Overview](#1-overview)
- [2. Entries](#2-entries)
  - [2.1 Widget Data Catalog - MEDIUM](#21-widget-data-catalog---medium)
  - [2.2 Widget Catalog - MEDIUM](#22-widget-catalog---medium)
  - [2.3 Layout Types Catalog - MEDIUM](#23-layout-types-catalog---medium)
  - [2.4 Dashboard Root Types Catalog - MEDIUM](#24-dashboard-root-types-catalog---medium)
  - [2.5 Extension Domain Catalog - MEDIUM](#25-extension-domain-catalog---medium)
  - [2.6 MFE Entries - MEDIUM](#26-mfe-entries---medium)
  - [2.7 Backend Contract - MEDIUM](#27-backend-contract---medium)
- [3. Feature Dependencies](#3-feature-dependencies)

<!-- /toc -->

## 1. Overview

The DESIGN of `template-dashboard` is decomposed into seven features. Six of them are **type-catalog features**, one per catalog of the dashboard type catalog in DESIGN section 3.1 (Catalog Summary and Ownership): each declares GTS types and instances only and has no actor flows, processes, or state machines. The seventh, `cpt-frontx-dashboard-feature-backend-contract`, is the first behavior-level feature: it specifies the contract between the template and the consuming product's backend, with actor flows, processes, state machines, and conformance cases, and declares no type of its own. Behavior FEATURE documents for the Viewer host orchestration, the modal container, and the host integration are later-stage work (PRD section 4.2, DESIGN section 4, Later stages).

**Decomposition strategy**:

- One type-catalog feature per catalog namespace, so each GTS family has exactly one owning feature, matching the ownership table of DESIGN section 3.1. The backend contract feature owns no catalog; it specifies the requests and responses that carry the catalog types.
- Features are ordered by type references: the widget data types come first, because every widget kind names one of them, and the MFE entries come last among the type catalogs, because they realize widget kinds and are admitted to the template domains. The backend contract follows the type catalogs whose types its requests and responses carry.
- Each feature is a single phase: one complete type catalog, or for the backend contract one complete contract specification, closed by the Definitions of Done of its FEATURE document.
- Every feature has priority `p2`, the priority that each FEATURE document gives its own entry. The implementation order is the dependency order in section 3, not the priority.

**Element assignment**:

- Each DESIGN component is assigned to one feature. Where a feature only declares the types that a component uses at run time, the entry says so, and the runtime behavior of that component belongs to a later behavior feature.
- `cpt-frontx-dashboard-feature-backend-contract` shares four elements with their owning entries, for the contract-visible behavior only: `cpt-frontx-dashboard-component-viewer-host` (owned by `cpt-frontx-dashboard-feature-mfe-entries`), `cpt-frontx-dashboard-seq-initial-load` and `cpt-frontx-dashboard-seq-failure-handling` (owned by `cpt-frontx-dashboard-feature-extension-domain-catalog`), and `cpt-frontx-dashboard-interface-dashboard-payload` (owned by `cpt-frontx-dashboard-feature-dashboard-root-types` for the dashboard definition side and by `cpt-frontx-dashboard-feature-widget-data-catalog` for the widget data side). The contract-visible behavior is the requests, the loading, error, and cannot-show states, and Retry; everything else of these elements stays with the owning entries. Its entry marks each of them "shared (contract side)".
- Five cross-cutting elements are deliberately shared, because each feature that touches them must comply with them: `cpt-frontx-dashboard-principle-gts-contracts` and `cpt-frontx-dashboard-constraint-gts-id-convention` are listed by all seven features, the six type-catalog features for the types they declare and the backend contract feature for the identifiers its requests and responses carry; `cpt-frontx-dashboard-principle-per-instance-isolation` by the three features whose types cross an MFE instance boundary; `cpt-frontx-dashboard-principle-render-only-viewer` by the widget catalog and the backend contract, which both fix that a widget renders its data unchanged. `cpt-frontx-dashboard-constraint-role-based-host-ids` is shared by the two features that carry host domain identifiers in their instances.
- The five runtime DESIGN sequences are assigned to `cpt-frontx-dashboard-feature-extension-domain-catalog`, whose action-chain table maps the template actions and domains onto them. The sequences themselves are runtime behavior of the Viewer host and the modal container, outside the type catalogs.
- `cpt-frontx-dashboard-seq-consumer-generation` is deliberately assigned to no feature: DESIGN marks it as context that runs on the consuming backend, outside the template, so the template has nothing to deliver for it. What it relies on from the template is the set of types a generated definition validates against, delivered by `cpt-frontx-dashboard-feature-dashboard-root-types`, `cpt-frontx-dashboard-feature-layout-types`, `cpt-frontx-dashboard-feature-widget-catalog`, and `cpt-frontx-dashboard-feature-widget-data-catalog`.
- `cpt-frontx-dashboard-fr-generated-dashboards` is shared by the same four features, because a generated definition is checked against all of their types: the dashboard root with its embedded layout, the widget kinds with their `params`, and the data types named by the kinds. Generation itself, and checking that presentation keys can be produced from `params`, belong to the consuming project.
- `cpt-frontx-dashboard-interface-domain-model` (PRD section 7.1) is shared by all seven features. It is the union of the six catalogs, and each type-catalog feature owns exactly one of them (DESIGN section 3.1, Catalog Summary and Ownership) and lists it under API with the catalog it delivers. The backend contract feature owns no catalog and lists it for the types that its requests and responses carry.
- `cpt-frontx-dashboard-tech-frontx-stack` and `cpt-frontx-dashboard-topology-overlay-packages` are assigned to `cpt-frontx-dashboard-feature-mfe-entries`, whose entries and manifests are what each layer and package subtree loads. Its Contracts layer is honored by all seven features through `cpt-frontx-dashboard-principle-gts-contracts`. The overlay manifest, the install step, and the demo opt-in stay coverage gaps (below).
- DESIGN section 3.7 defines no database or table, so no feature lists data identifiers.

**Coverage gaps**: the following PRD requirements are not covered by any of the seven features, because they concern packaging, quality measured on the running template, or shipped documentation, rather than type declarations or the backend contract. They are left for the later behavior features and are not assigned here:

- Packaging and demo: `cpt-frontx-dashboard-fr-overlay-install`, `cpt-frontx-dashboard-fr-demo-opt-in`, `cpt-frontx-dashboard-nfr-compatibility`.
- Measured quality: `cpt-frontx-dashboard-nfr-visual-quality`, `cpt-frontx-dashboard-nfr-initial-render`, `cpt-frontx-dashboard-nfr-accessibility`.
- Shipped documentation: `cpt-frontx-dashboard-nfr-consumer-docs`.

## 2. Entries

**Overall implementation status:**

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-status-overall`

### 2.1 [Widget Data Catalog](features/feature-widget-data-catalog/FEATURE.md) - MEDIUM

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-feature-widget-data-catalog`

- **Purpose**: Declare the backend wire contract for widget data: an abstract base and one derived data type per widget kind, which a widget's data request returns and the widget renders unchanged.

- **Depends On**: None

- **Scope**:
  - The abstract widget data base `gts.frontx.v.widget_data.widget_data.v1~`.
  - The 9 widget data types `gts.frontx.v.widget_data.widget_data.v1~frontx.v.widget_data.<kind>.v1~`, one per widget kind, derived from the base; a data instance carries no `id`.
  - The optional row groups of the `grid` shape.
  - "No demo coverage" markers for the two kinds without demo data.

- **Out of scope**:
  - The widget kinds that name these types in their `data_type` trait (`cpt-frontx-dashboard-feature-widget-catalog`).
  - The endpoint and request form of a widget data request (DESIGN section 4 open item).
  - The demo's static widget data responses themselves, which belong to the demo package.

- **Requirements Covered**:

  - [ ] `p1` - `cpt-frontx-dashboard-fr-domain-model`
  - [ ] `p1` - `cpt-frontx-dashboard-fr-widget-catalog`
  - [ ] `p2` - `cpt-frontx-dashboard-fr-grid-presentation`
  - [ ] `p2` - `cpt-frontx-dashboard-fr-generated-dashboards`

- **Design Principles Covered**:

  - [ ] `p2` - `cpt-frontx-dashboard-principle-gts-contracts`

- **Design Constraints Covered**:

  - [ ] `p1` - `cpt-frontx-dashboard-constraint-gts-id-convention`

- **Domain Model Entities**:
  - Widget data

- **Design Components**:

  - [ ] `p2` - `cpt-frontx-dashboard-component-demo-package` (type contract only: the demo's static widget data responses are instances of these types; the demo package itself is not delivered by this feature)

- **API**:
  - `cpt-frontx-dashboard-interface-dashboard-payload` (widget data side)
  - `cpt-frontx-dashboard-interface-domain-model` (widget data catalog)

- **Sequences**:
  - None

- **Data**:
  - None (DESIGN section 3.7: the template persists nothing)

### 2.2 [Widget Catalog](features/feature-widget-catalog/FEATURE.md) - MEDIUM

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-feature-widget-catalog`

- **Purpose**: Declare the abstract Widget base and the 9 subject-agnostic widget kinds that every dashboard places in its layout cells.

- **Depends On**: `cpt-frontx-dashboard-feature-widget-data-catalog`

- **Scope**:
  - The abstract Widget base `gts.frontx.m.widget.widget.v1~` with the combined instance `id`, `title`, the open `params` object, and the `data_type` trait.
  - The 9 concrete widget kinds, each setting its `data_type` trait to one widget data type.
  - The derivation point for consumer widget types that close or specify `params`; the derived types themselves belong to the consuming project.
  - The presentation settings of the `grid` kind, fixed by the layout.
  - The shared widget chrome contract: one modal button per kind, and the per-widget loading, error, and cannot-show states.

- **Out of scope**:
  - Any field for client-side sorting, grouping, paging, display limits, or drill-down (PRD section 4.2).
  - The MFE entries that realize the kinds (`cpt-frontx-dashboard-feature-mfe-entries`).
  - The runtime data request logic inside each widget MFE, which belongs to a later behavior feature.
  - Generating dashboards, and checking that presentation keys can be produced from `params`, which belong to the consuming project.

- **Requirements Covered**:

  - [ ] `p1` - `cpt-frontx-dashboard-fr-widget-catalog`
  - [ ] `p1` - `cpt-frontx-dashboard-fr-domain-model`
  - [ ] `p2` - `cpt-frontx-dashboard-fr-grid-presentation`
  - [ ] `p1` - `cpt-frontx-dashboard-fr-widget-modal`
  - [ ] `p1` - `cpt-frontx-dashboard-fr-backend-source`
  - [ ] `p1` - `cpt-frontx-dashboard-fr-loading-error-states`
  - [ ] `p2` - `cpt-frontx-dashboard-fr-generated-dashboards`

- **Design Principles Covered**:

  - [ ] `p2` - `cpt-frontx-dashboard-principle-gts-contracts`
  - [ ] `p1` - `cpt-frontx-dashboard-principle-per-instance-isolation`
  - [ ] `p1` - `cpt-frontx-dashboard-principle-render-only-viewer`

- **Design Constraints Covered**:

  - [ ] `p1` - `cpt-frontx-dashboard-constraint-gts-id-convention`

- **Domain Model Entities**:
  - Widget

- **Design Components**:

  - [ ] `p1` - `cpt-frontx-dashboard-component-backend-client` (type contract only: the data-request logic inside each of the 9 widget MFEs sends the widget's kind type id and its `params`, both declared here; the request logic itself is runtime behavior for a later feature)

- **API**:
  - `cpt-frontx-dashboard-interface-domain-model` (widget catalog; each widget instance is embedded in a layout cell of the dashboard definition)

- **Sequences**:
  - None

- **Data**:
  - None (DESIGN section 3.7: the template persists nothing)

### 2.3 [Layout Types Catalog](features/feature-layout-types/FEATURE.md) - MEDIUM

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-feature-layout-types`

- **Purpose**: Declare the 60-column Layout and the LayoutCell, the embedded object types that together fully define how a dashboard composes its widgets.

- **Depends On**: `cpt-frontx-dashboard-feature-widget-catalog`

- **Scope**:
  - `gts.frontx.m.layout.layout.v1~`, an embedded object type with no own identifier, with `columns` fixed at 60 and an ordered list of cells.
  - `gts.frontx.m.layout.cell.v1~`, an embedded object type with bounded `x`, `y`, `w`, `h` and one embedded widget instance checked against the Widget base.

- **Out of scope**:
  - The overlap and range check that the Viewer host runs at run time.
  - Widget data, which the cell does not carry.
  - A separately stored or referenced layout instance, which does not exist.

- **Requirements Covered**:

  - [ ] `p1` - `cpt-frontx-dashboard-fr-domain-model`
  - [ ] `p2` - `cpt-frontx-dashboard-fr-generated-dashboards`

- **Design Principles Covered**:

  - [ ] `p2` - `cpt-frontx-dashboard-principle-gts-contracts`

- **Design Constraints Covered**:

  - [ ] `p2` - `cpt-frontx-dashboard-constraint-sixty-column-grid`
  - [ ] `p1` - `cpt-frontx-dashboard-constraint-gts-id-convention`

- **Domain Model Entities**:
  - Layout
  - Layout cell

- **Design Components**:
  - None (the layout types are data; their consumer, the Viewer host, is assigned to `cpt-frontx-dashboard-feature-mfe-entries`)

- **API**:
  - `cpt-frontx-dashboard-interface-domain-model` (layout catalog; the layout is embedded in the dashboard definition, assigned to `cpt-frontx-dashboard-feature-dashboard-root-types`)

- **Sequences**:
  - None

- **Data**:
  - None (DESIGN section 3.7: the template persists nothing)

### 2.4 [Dashboard Root Types Catalog](features/feature-dashboard-root-types/FEATURE.md) - MEDIUM

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-feature-dashboard-root-types`

- **Purpose**: Declare the trimmed Dashboard root of every dashboard definition and the Theme type of the template's own frontend theme instance.

- **Depends On**: `cpt-frontx-dashboard-feature-layout-types`

- **Scope**:
  - `gts.frontx.m.dashboard.dashboard.v1~` with only the combined instance `id`, `name`, `description`, and the embedded `layout`.
  - `gts.frontx.m.dashboard.theme.v1~` with light and dark palettes, typography, chart defaults, and spacing.
  - The template-owned Theme instance.

- **Out of scope**:
  - The prototype's report type and its visibility, publication, sharing, and audience fields (PRD section 4.2).
  - A theme supplied by the backend.
  - The theme shared-property payload that the template domains publish (`cpt-frontx-dashboard-feature-extension-domain-catalog`).

- **Requirements Covered**:

  - [ ] `p1` - `cpt-frontx-dashboard-fr-domain-model`
  - [ ] `p1` - `cpt-frontx-dashboard-fr-theme`
  - [ ] `p1` - `cpt-frontx-dashboard-fr-backend-source`
  - [ ] `p2` - `cpt-frontx-dashboard-fr-generated-dashboards`

- **Design Principles Covered**:

  - [ ] `p2` - `cpt-frontx-dashboard-principle-gts-contracts`

- **Design Constraints Covered**:

  - [ ] `p1` - `cpt-frontx-dashboard-constraint-gts-id-convention`

- **Domain Model Entities**:
  - Dashboard definition
  - Dashboard
  - Theme

- **Design Components**:
  - None (the root types are data; their consumers are assigned to `cpt-frontx-dashboard-feature-mfe-entries` and `cpt-frontx-dashboard-feature-extension-domain-catalog`)

- **API**:
  - `cpt-frontx-dashboard-interface-dashboard-payload` (dashboard definition side; shared with `cpt-frontx-dashboard-feature-widget-data-catalog`, which owns the widget data side)
  - `cpt-frontx-dashboard-interface-domain-model` (dashboard root catalog)

- **Sequences**:
  - None

- **Data**:
  - None (DESIGN section 3.7: the template persists nothing)

### 2.5 [Extension Domain Catalog](features/feature-extension-domain-catalog/FEATURE.md) - MEDIUM

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-feature-extension-domain-catalog`

- **Purpose**: Declare the template's runtime contracts between the Viewer host, the modal container, and the widgets: host actions, extension domains, extension types, and the template theme payload.

- **Depends On**: `cpt-frontx-dashboard-feature-widget-catalog`, `cpt-frontx-dashboard-feature-dashboard-root-types`

- **Scope**:
  - The host actions `set_subject` and `mount_widget`.
  - The domains `layout_cells` and `modal_panel` and their extension types.
  - The modal container extension in the host modal domain.
  - The template theme shared-property payload.
  - The widget extension identifier rule and the action-chain summary mapped to the DESIGN sequences.

- **Out of scope**:
  - The MFE entries mounted into these domains (`cpt-frontx-dashboard-feature-mfe-entries`).
  - The runtime behavior of the Viewer host and the modal container, and the host modal-domain slot in `template-shell`.
  - The registration path of widget modal extensions into `modal_panel` (DESIGN section 4 open item).

- **Requirements Covered**:

  - [ ] `p1` - `cpt-frontx-dashboard-fr-domain-model`
  - [ ] `p1` - `cpt-frontx-dashboard-fr-widget-modal`
  - [ ] `p1` - `cpt-frontx-dashboard-fr-theme`
  - [ ] `p1` - `cpt-frontx-dashboard-fr-loading-error-states`

- **Design Principles Covered**:

  - [ ] `p1` - `cpt-frontx-dashboard-principle-no-extension-on-click`
  - [ ] `p1` - `cpt-frontx-dashboard-principle-viewer-host-orchestration`
  - [ ] `p2` - `cpt-frontx-dashboard-principle-gts-contracts`
  - [ ] `p1` - `cpt-frontx-dashboard-principle-per-instance-isolation`

- **Design Constraints Covered**:

  - [ ] `p1` - `cpt-frontx-dashboard-constraint-gts-id-convention`
  - [ ] `p1` - `cpt-frontx-dashboard-constraint-role-based-host-ids`
  - [ ] `p2` - `cpt-frontx-dashboard-constraint-one-viewer-per-tree`

- **Domain Model Entities**:
  - Host actions
  - Domains and extension types

- **Design Components**:

  - [ ] `p1` - `cpt-frontx-dashboard-component-modal-container` (its static extension and inner domain; its entry is in `cpt-frontx-dashboard-feature-mfe-entries`)

- **API**:
  - `cpt-frontx-dashboard-interface-host-actions`
  - `cpt-frontx-dashboard-interface-template-domains`
  - `cpt-frontx-dashboard-contract-host-domains` (host modal domain by role)
  - `cpt-frontx-dashboard-interface-domain-model` (extension and domain catalog)

- **Sequences**:

  - [ ] `p1` - `cpt-frontx-dashboard-seq-initial-load`
  - [ ] `p1` - `cpt-frontx-dashboard-seq-widget-modal-open`
  - [ ] `p1` - `cpt-frontx-dashboard-seq-failure-handling`
  - [ ] `p2` - `cpt-frontx-dashboard-seq-theme-switch`
  - [ ] `p2` - `cpt-frontx-dashboard-seq-teardown`

- **Data**:
  - None (DESIGN section 3.7: the template persists nothing)

### 2.6 [MFE Entries](features/feature-mfe-entries/FEATURE.md) - MEDIUM

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-feature-mfe-entries`

- **Purpose**: Declare the MFE entry type and the entries and manifests through which the Viewer host, the modal container, and the 9 widget kinds are loaded.

- **Depends On**: `cpt-frontx-dashboard-feature-widget-catalog`, `cpt-frontx-dashboard-feature-extension-domain-catalog`

- **Scope**:
  - The MFE entry type with `realizes:`.
  - The widget manifest and the 9 widget entries, one per widget kind.
  - The viewer manifest, the Viewer host entry, and the modal container entry.
  - The admission of each entry to its domains, and the isolation and packaging notes per entry.
  - The placement of the entries and manifests in the viewer and widget package subtrees, and the stack layers each entry loads.

- **Out of scope**:
  - The widget kinds themselves (`cpt-frontx-dashboard-feature-widget-catalog`).
  - Registration from the manifest channel and the kind-to-entry lookup at run time, which are Viewer host behavior.
  - The overlay manifest, the install step, and the demo opt-in (coverage gaps in section 1).

- **Requirements Covered**:

  - [ ] `p1` - `cpt-frontx-dashboard-fr-widget-catalog`
  - [ ] `p1` - `cpt-frontx-dashboard-fr-domain-model`
  - [ ] `p1` - `cpt-frontx-dashboard-fr-viewer-host`
  - [ ] `p1` - `cpt-frontx-dashboard-fr-widget-modal`
  - [ ] `p3` - `cpt-frontx-dashboard-nfr-bundle-budget`

- **Design Principles Covered**:

  - [ ] `p1` - `cpt-frontx-dashboard-principle-per-instance-isolation`
  - [ ] `p2` - `cpt-frontx-dashboard-principle-gts-contracts`

- **Design Constraints Covered**:

  - [ ] `p1` - `cpt-frontx-dashboard-constraint-gts-id-convention`
  - [ ] `p1` - `cpt-frontx-dashboard-constraint-role-based-host-ids`
  - [ ] `p1` - `cpt-frontx-dashboard-constraint-shell-only-dependency`
  - [ ] `p2` - `cpt-frontx-dashboard-constraint-licensing-compliance-resources`

- **Domain Model Entities**:
  - MFE entry

- **Design Components**:

  - [ ] `p1` - `cpt-frontx-dashboard-component-widget-library`
  - [ ] `p1` - `cpt-frontx-dashboard-component-viewer-host` (its entry and manifest only; its orchestration is runtime behavior for a later feature)
  - [ ] `p2` - `cpt-frontx-dashboard-tech-frontx-stack` (the layers that the entries load; the Contracts layer is shared by all seven features)
  - [ ] `p2` - `cpt-frontx-dashboard-topology-overlay-packages` (the viewer and widget package subtrees that hold the entries and manifests)

- **API**:
  - `cpt-frontx-dashboard-interface-domain-model` (MFE entry catalog; entries reach the registries through the manifest channel, DESIGN section 3.5)

- **Sequences**:
  - None

- **Data**:
  - None (DESIGN section 3.7: the template persists nothing)

### 2.7 [Backend Contract](features/feature-backend-contract/FEATURE.md) - MEDIUM

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-feature-backend-contract`

- **Purpose**: Specify exactly what the template requires from the consuming product's backend, with conformance cases: the dashboard request and its response, the widget data request and its response, the errors with what the viewer shows, and the consumer widget types.

- **Depends On**: `cpt-frontx-dashboard-feature-dashboard-root-types`, `cpt-frontx-dashboard-feature-widget-data-catalog`

- **Scope**:
  - The dashboard request by identifier, and its response.
  - The widget data request, which a widget makes through the FrontX API package, and its response, including a widget's own request for the data its larger view needs; what the larger view shows is each widget's implementation detail.
  - The errors: the meaning of each, and what the viewer shows, including Retry.
  - The consumer widget types: their definition, and how they reach the browser.
  - The open items, owned by the template architect: the request form; the validation of embedded widgets under GTS 0.17 `/$id`; the consumer widget types in the browser; the presentation keys and `params`.
  - The conformance cases, one per point above.

- **Out of scope**:
  - Access to dashboards and data.
  - The distribution of the types to the backend.
  - Limits.
  - Versioning.
  - The shapes of the dashboard root and of the widget data, which are declared by `cpt-frontx-dashboard-feature-dashboard-root-types` and `cpt-frontx-dashboard-feature-widget-data-catalog`.
  - The derivation point of consumer widget types and the layout types, which are declared by `cpt-frontx-dashboard-feature-widget-catalog` and `cpt-frontx-dashboard-feature-layout-types`; this feature uses them by reference, for consumer type derivation and for the layout checks, and reaches both transitively through `cpt-frontx-dashboard-feature-dashboard-root-types`.
  - The endpoint locations of both requests, which come from the configuration of the consuming product.
  - Viewer host orchestration (extension registration, theme, modal container), which belongs to a later behavior feature; the viewer behavior that the contract makes visible stays in scope.

- **Requirements Covered**:

  - [ ] `p1` - `cpt-frontx-dashboard-fr-backend-source`
  - [ ] `p1` - `cpt-frontx-dashboard-fr-loading-error-states`
  - [ ] `p1` - `cpt-frontx-dashboard-fr-domain-model`
  - [ ] `p1` - `cpt-frontx-dashboard-fr-widget-modal`

- **Design Principles Covered**:

  - [ ] `p1` - `cpt-frontx-dashboard-principle-render-only-viewer`
  - [ ] `p2` - `cpt-frontx-dashboard-principle-gts-contracts`

- **Design Constraints Covered**:

  - [ ] `p1` - `cpt-frontx-dashboard-constraint-gts-id-convention`

- **Domain Model Entities**:
  - Dashboard definition
  - Widget data
  - Consumer widget type

- **Design Components**:

  - [ ] `p1` - `cpt-frontx-dashboard-component-viewer-host` (shared (contract side), owned by `cpt-frontx-dashboard-feature-mfe-entries`: the requests it sends, the errors it shows, and the Retry it offers; its orchestration is runtime behavior for a later feature)

- **API**:
  - `cpt-frontx-dashboard-interface-dashboard-payload` (shared (contract side), owned by `cpt-frontx-dashboard-feature-dashboard-root-types` for the dashboard definition side and by `cpt-frontx-dashboard-feature-widget-data-catalog` for the widget data side: this feature specifies both requests and responses exactly)
  - `cpt-frontx-dashboard-interface-domain-model` (the types that the requests and responses carry)
  - `cpt-frontx-dashboard-adr-backend-delivered-dashboard` (the decision that the consuming product's backend delivers the dashboard and the widget data)

- **Sequences**:

  - [ ] `p1` - `cpt-frontx-dashboard-seq-initial-load` (shared (contract side), owned by `cpt-frontx-dashboard-feature-extension-domain-catalog`: the dashboard request and the widget data requests)
  - [ ] `p1` - `cpt-frontx-dashboard-seq-failure-handling` (shared (contract side), owned by `cpt-frontx-dashboard-feature-extension-domain-catalog`: the failure classes, what the viewer shows, and Retry)

- **Data**:
  - None (DESIGN section 3.7: the template persists nothing)

---

## 3. Feature Dependencies

```text
cpt-frontx-dashboard-feature-widget-data-catalog
    ↓
cpt-frontx-dashboard-feature-widget-catalog
    ├─→ cpt-frontx-dashboard-feature-layout-types
    │       ↓
    │   cpt-frontx-dashboard-feature-dashboard-root-types
    │       ↓
    ├─→ cpt-frontx-dashboard-feature-extension-domain-catalog   (also requires dashboard-root-types)
    │       ↓
    └─→ cpt-frontx-dashboard-feature-mfe-entries                (also requires extension-domain-catalog)

cpt-frontx-dashboard-feature-widget-data-catalog, cpt-frontx-dashboard-feature-dashboard-root-types
    ↓
cpt-frontx-dashboard-feature-backend-contract
```

**Dependency Rationale**:

- `cpt-frontx-dashboard-feature-widget-catalog` requires `cpt-frontx-dashboard-feature-widget-data-catalog`: each widget kind names one widget data type in its `data_type` trait.
- `cpt-frontx-dashboard-feature-layout-types` requires `cpt-frontx-dashboard-feature-widget-catalog`: each cell checks its embedded widget instance against the Widget base. The FEATURE calls this a reference only, so the layout types can be authored in parallel once the Widget base identifier is fixed.
- `cpt-frontx-dashboard-feature-dashboard-root-types` requires `cpt-frontx-dashboard-feature-layout-types`: the Dashboard embeds the Layout. The Theme has no dependency.
- `cpt-frontx-dashboard-feature-extension-domain-catalog` requires `cpt-frontx-dashboard-feature-widget-catalog` (the widget instance, with its `params`, carried by `set_subject`, and the modal button that sends `mount_widget`) and `cpt-frontx-dashboard-feature-dashboard-root-types` (the palette shape of the theme payload).
- `cpt-frontx-dashboard-feature-mfe-entries` requires `cpt-frontx-dashboard-feature-widget-catalog` (each widget entry realizes one kind) and `cpt-frontx-dashboard-feature-extension-domain-catalog` (the action types an entry lists and the domains it is admitted to).
- The extension domain FEATURE also names the MFE entries as a dependency, because the modal container extension points to the container entry. That link is a reference by identifier only and is not a build-order dependency, so the graph stays acyclic: the extension domain catalog comes first, and the MFE entries reference its action types and domains.
- `cpt-frontx-dashboard-feature-backend-contract` requires `cpt-frontx-dashboard-feature-dashboard-root-types` (the dashboard request returns one dashboard of that shape) and `cpt-frontx-dashboard-feature-widget-data-catalog` (the widget data response is of the type its kind declares). It also uses `cpt-frontx-dashboard-feature-widget-catalog` (consumer type derivation) and `cpt-frontx-dashboard-feature-layout-types` (the layout checks) by reference; both are reached transitively through `cpt-frontx-dashboard-feature-dashboard-root-types`, so they are not listed as direct dependencies. Nothing depends on it, so the graph stays acyclic.
- The order is a chain because the extension domain catalog needs the Theme palette of the dashboard root types. The Theme does not depend on the Layout, so the Theme part of `cpt-frontx-dashboard-feature-dashboard-root-types` can be authored in parallel with `cpt-frontx-dashboard-feature-layout-types`.
