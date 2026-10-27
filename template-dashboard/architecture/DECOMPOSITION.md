---
status: accepted
version: 1
date: 2026-10-27
description: Decomposition of the FrontX dashboard template DESIGN into seven features: six domain-model features and the backend contract feature, with their scope, dependency order, and coverage of PRD and DESIGN identifiers.
---

# Decomposition: FrontX Dashboard Template

<!-- toc -->

- [1. Overview](#1-overview)
- [2. Entries](#2-entries)
  - [2.1 Widget Data Catalog - MEDIUM](#21-widget-data-catalog---medium)
  - [2.2 Widget Catalog - MEDIUM](#22-widget-catalog---medium)
  - [2.3 Layout Types - MEDIUM](#23-layout-types---medium)
  - [2.4 Dashboard Root Types - MEDIUM](#24-dashboard-root-types---medium)
  - [2.5 Extension Domain Catalog - MEDIUM](#25-extension-domain-catalog---medium)
  - [2.6 MFE Entries - MEDIUM](#26-mfe-entries---medium)
  - [2.7 Backend Contract - MEDIUM](#27-backend-contract---medium)
- [3. Feature Dependencies](#3-feature-dependencies)

<!-- /toc -->

## 1. Overview

The DESIGN of `template-dashboard` is decomposed into seven features. Six of them are **domain-model features**, one per part of the dashboard domain model in DESIGN section 3.1 (Parts Summary and Ownership): each declares GTS types and has no actor flows or state machines; the dashboard root types, the extension domain catalog, and the MFE entries also declare instances, and the extension domain catalog also specifies the two processes by which the Viewer host creates the widget extensions. The seventh, `cpt-frontx-dashboard-feature-backend-contract`, is the first behavior-level feature: it specifies the contract between the template and the consuming product backend, with actor flows, processes, state machines, and conformance cases, and declares no type of its own. Behavior FEATURE documents for the Viewer host orchestration, the modal container, and the host integration are later-stage work (DESIGN section 4, Later stages).

**Decomposition strategy**:

- One domain-model feature per namespace of the domain model, so each GTS family has exactly one owning feature, matching the ownership table of DESIGN section 3.1. The backend contract feature owns no part; it specifies the requests and responses that carry the types of the parts.
- Features are ordered by type references: the widget data types come first, because every widget kind names one of them, and the MFE entries come last among the domain-model features, because they realize widget kinds and are admitted to the template domains. The backend contract follows the domain-model features whose types its requests and responses carry.
- Each feature is a single phase: one complete part of the domain model, or for the backend contract one complete contract specification, closed by the Definitions of Done of its FEATURE document.
- Every feature has priority `p2`, the priority that each FEATURE document gives its own entry. The implementation order is the dependency order in section 3, not the priority.

**Element assignment**:

- Each DESIGN component that the template delivers as types or entries is assigned to one feature. Where a feature only declares the types that a component uses at run time, the entry says so, and the runtime behavior of that component belongs to a later behavior feature.
- `cpt-frontx-dashboard-feature-backend-contract` shares four elements with their owning entries, for the contract-visible behavior only: `cpt-frontx-dashboard-component-viewer-host` (owned by `cpt-frontx-dashboard-feature-mfe-entries`), `cpt-frontx-dashboard-seq-initial-load` and `cpt-frontx-dashboard-seq-failure-handling` (owned by `cpt-frontx-dashboard-feature-extension-domain-catalog`), and `cpt-frontx-dashboard-interface-dashboard-payload` (owned by `cpt-frontx-dashboard-feature-dashboard-root-types` for the dashboard definition side and by `cpt-frontx-dashboard-feature-widget-data-catalog` for the widget data side). The contract-visible behavior is the requests, the loading, error, and cannot-show states, and Retry; everything else of these elements stays with the owning entries. Its entry marks each of them "shared (contract side)". The extension domain catalog likewise lists `cpt-frontx-dashboard-component-viewer-host` for the creation of the widget extensions at dashboard resolve, marked "shared (extension creation side)". The MFE entries likewise list `cpt-frontx-dashboard-component-modal-container` (owned by the extension domain catalog) for the container entry and its manifest, marked "shared (entry side)".
- Cross-cutting elements are deliberately shared, because each feature that touches them must comply with them: `cpt-frontx-dashboard-principle-gts-contracts` is listed by all seven features, the six domain-model features for the types they declare and the backend contract feature for the identifiers its requests and responses carry; `cpt-frontx-dashboard-constraint-gts-id-convention` by the four features whose instances or requests and responses carry GTS identifiers (the dashboard root types, the extension domain catalog, the MFE entries, and the backend contract); `cpt-frontx-dashboard-principle-per-instance-isolation` by the three features whose types cross an MFE instance boundary (the widget catalog, the extension domain catalog, and the MFE entries). `cpt-frontx-dashboard-constraint-role-based-host-ids` is shared by the two features that carry host domain identifiers in their instances. `cpt-frontx-dashboard-principle-render-only-viewer` is owned by the backend contract alone, which fixes that a widget renders its data unchanged.
- The five runtime DESIGN sequences are assigned to `cpt-frontx-dashboard-feature-extension-domain-catalog` for its part of each, and the backend contract feature covers the contract side of two of them. The split per sequence is: `cpt-frontx-dashboard-seq-initial-load` (the extension domain catalog covers the extension creation, the backend contract covers the requests); `cpt-frontx-dashboard-seq-failure-handling` (the extension domain catalog covers the action chain, the backend contract covers the failure classes); `cpt-frontx-dashboard-seq-widget-modal-open` (the extension domain catalog covers the action-chain mapping and the mounting of the larger view); `cpt-frontx-dashboard-seq-teardown` (the extension domain catalog covers the action-chain mapping and the unregistration of the dashboard's widget extensions); `cpt-frontx-dashboard-seq-theme-switch` (the action-chain mapping only). The sequences themselves are runtime behavior of the Viewer host and the modal container, outside the domain-model parts, and the runtime remainder of all five is deferred to later behavior features. `cpt-frontx-dashboard-principle-viewer-host-orchestration` is covered as a contract-level principle only.
- `cpt-frontx-dashboard-seq-consumer-generation` is deliberately assigned to no feature: DESIGN marks it as context that runs on the consuming product backend, outside the template, so the template has nothing to deliver for it. What it relies on from the template is the set of types a generated definition validates against, delivered by `cpt-frontx-dashboard-feature-dashboard-root-types`, `cpt-frontx-dashboard-feature-layout-types`, `cpt-frontx-dashboard-feature-widget-catalog`, and `cpt-frontx-dashboard-feature-widget-data-catalog`.
- Unassigned DESIGN elements, which the template delivers nothing for in these features: `cpt-frontx-dashboard-component-backend-client` is the data-request logic inside each widget MFE; its runtime behavior is deferred to a later behavior feature, and it relies on the contract specified in `cpt-frontx-dashboard-feature-backend-contract`. `cpt-frontx-dashboard-tech-frontx-stack` describes the stack layers, which are honored through `cpt-frontx-dashboard-principle-gts-contracts` and the per-entry layers in `cpt-frontx-dashboard-feature-mfe-entries`, and has nothing of its own to deliver. `cpt-frontx-dashboard-constraint-licensing-compliance-resources` is a package-wide disposition for which no FEATURE declares a contract.
- `cpt-frontx-dashboard-fr-backend-source` is shared by the four features whose types a dashboard or its widget data is checked against, because a dashboard that the consuming product writes or generates is checked against all of them: the dashboard root with its embedded layout, the widget kinds with their `params`, and the data types named by the kinds. The backend contract feature covers it for the requests and responses that carry them. Generation itself, and checking that presentation keys can be produced from `params`, belong to the consuming product.
- `cpt-frontx-dashboard-interface-domain-model` (PRD section 7.1) is shared by all seven features. It is the union of the six parts, and each domain-model feature owns exactly one of them (DESIGN section 3.1, Parts Summary and Ownership) and lists it under API with the part it delivers. The backend contract feature owns no part and lists it for the types that its requests and responses carry.
- Five further requirements are covered by several entries, each for a different part. `cpt-frontx-dashboard-fr-domain-model` is covered by all seven features, each for its own part or the contract:
  - `cpt-frontx-dashboard-fr-widget-modal`: the widget chrome and its one modal button per kind in the widget catalog; the `mount_widget` action, the `modal_panel` domain, the modal container extension, and the creation of the modal extension for a widget's larger view in the extension domain catalog; the modal container entry and the widget entries in the MFE entries; a widget's own request for the data its larger view needs in the backend contract.
  - `cpt-frontx-dashboard-fr-loading-error-states`: the per-widget loading, error, and cannot-show states of the widget chrome in the widget catalog; the failure-handling action chain in the extension domain catalog; the errors, what the Viewer host shows for each, and Retry in the backend contract.
  - `cpt-frontx-dashboard-fr-widget-catalog`: the data type that each widget kind returns in the widget data catalog; the kinds with their presentation and rendering-safety rules in the widget catalog; the one entry per kind in the MFE entries.
  - `cpt-frontx-dashboard-fr-theme`: the Theme type and the template-owned Theme instance in the dashboard root types; the theme shared-property payload that the template domains publish in the extension domain catalog.
  - `cpt-frontx-dashboard-fr-viewer-host`: the creation of the widget extensions at dashboard resolve, and the host actions and domains it uses, in the extension domain catalog; the Viewer host entry and manifest in the MFE entries.
- `cpt-frontx-dashboard-topology-overlay-packages` is assigned to `cpt-frontx-dashboard-feature-mfe-entries`, whose entries and manifests are what each package subtree holds. The Contracts layer of the stack is honored by all seven features through `cpt-frontx-dashboard-principle-gts-contracts`.
- DESIGN section 3.7 defines no database or table, so no feature lists data identifiers.

**Coverage gaps**: the following PRD requirements are not covered by any of the seven features, because they concern compatibility, quality measured on the running template, or shipped documentation, rather than type declarations or the backend contract. They are left for the later behavior features and are not assigned here:

- Compatibility: `cpt-frontx-dashboard-nfr-compatibility`.
- Measured quality: `cpt-frontx-dashboard-nfr-visual-quality`, `cpt-frontx-dashboard-nfr-initial-render`, `cpt-frontx-dashboard-nfr-accessibility`.
- Shipped documentation: `cpt-frontx-dashboard-nfr-consumer-docs`.

A measured NFR counts as covered when the declared contract enables the measurement; the measurement itself is deferred to the running template. By this rule `cpt-frontx-dashboard-nfr-large-table` (enabled by the grid shape and presentation rules in the widget catalog) and `cpt-frontx-dashboard-nfr-bundle-budget` (enabled by the entry set and the per-entry packaging boundary in the MFE entries) are covered. `cpt-frontx-dashboard-nfr-visual-quality`, `cpt-frontx-dashboard-nfr-initial-render`, and `cpt-frontx-dashboard-nfr-accessibility` stay gaps, because no FEATURE declares a contract that enables their measurement; they would move to covered only when a later behavior feature does. `cpt-frontx-dashboard-nfr-large-table` is listed by the widget catalog only, which owns its presentation rules.

Requirements and elements covered only at type or contract level, with their runtime behavior deferred to later behavior features: the Viewer host screen and orchestration (`cpt-frontx-dashboard-principle-viewer-host-orchestration`); the modal container behavior; the data-request logic (`cpt-frontx-dashboard-component-backend-client`) and rendering inside each widget MFE; the propagation of the theme; and the runtime remainder of the five sequences, whose per-sequence split is stated above.

## 2. Entries

**Overall implementation status:**

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-status-overall`

### 2.1 [Widget Data Catalog](features/feature-widget-data-catalog/FEATURE.md) - MEDIUM

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-feature-widget-data-catalog`

- **Purpose**: Declare the backend wire contract for widget data: an abstract base and one derived data type per widget kind, which a widget requests through the FrontX API package and renders unchanged.

- **Depends On**: None

- **Scope**:
  - The abstract widget data base `gts.frontx.v.widget_data.widget_data.v1~`.
  - The 9 widget data types `gts.frontx.v.widget_data.widget_data.v1~frontx.v.widget_data.<kind>.v1~`, one per widget kind, derived from the base; a data instance carries no `id`.
  - The `grid` shape with its optional row groups, which carries up to 5,000 rows in all.

- **Out of scope**:
  - The widget kinds that name these types in their `data_type` trait (`cpt-frontx-dashboard-feature-widget-catalog`).
  - The endpoint and request form of a widget data request (DESIGN section 4 open item).
  - Computing the widget data, which belongs to the consuming product backend.

- **Requirements Covered**:

  - [ ] `p1` - `cpt-frontx-dashboard-fr-domain-model`
  - [ ] `p1` - `cpt-frontx-dashboard-fr-widget-catalog`
  - [ ] `p1` - `cpt-frontx-dashboard-fr-backend-source`

- **Design Principles Covered**:

  - [ ] `p2` - `cpt-frontx-dashboard-principle-gts-contracts`

- **Design Constraints Covered**:

  - None

- **Domain Model Entities**:
  - Widget data

- **Design Components**:
  - None (the widget data types are data; the widget MFEs that request and render them are assigned to `cpt-frontx-dashboard-feature-mfe-entries`)

- **API**:
  - `cpt-frontx-dashboard-interface-dashboard-payload` (widget data side)
  - `cpt-frontx-dashboard-interface-domain-model` (widget data catalog)

- **Sequences**:
  - None

- **Data**:
  - None (DESIGN section 3.7: the template persists nothing)

### 2.2 [Widget Catalog](features/feature-widget-catalog/FEATURE.md) - MEDIUM

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-feature-widget-catalog`

- **Purpose**: Declare the abstract Widget base and the 9 subject-agnostic widget kinds that every dashboard places in its layout cells, with the presentation rules of the `grid` kind and the rendering safety of the `markdown_card` kind.

- **Depends On**: `cpt-frontx-dashboard-feature-widget-data-catalog`

- **Scope**:
  - The abstract Widget base `gts.frontx.m.widget.widget.v1~` with the combined instance `id`, `title`, the open `params` object, and the `data_type` trait.
  - The 9 concrete widget kinds, each setting its `data_type` trait to one widget data type.
  - The derivation point for consumer widget types that close or specify `params`; the derived types themselves belong to the consuming product.
  - The grid presentation of the `grid` kind: frozen columns, column groups, row coloring from the Theme `row_tints`, row groups, and up to 5,000 rows without paging while the view stays responsive.
  - The rendering-safety rules of the `markdown_card` kind.
  - The shared widget chrome contract: one modal button per kind, and the per-widget loading, error, and cannot-show states.

- **Out of scope**:
  - Any field for client-side sorting, grouping, paging, display limits, or drill-down (PRD section 4.2).
  - The MFE entries that realize the kinds (`cpt-frontx-dashboard-feature-mfe-entries`).
  - The runtime data request logic inside each widget MFE, which belongs to a later behavior feature.
  - Generating dashboards, and checking that presentation keys can be produced from `params`, which belong to the consuming product.

- **Requirements Covered**:

  - [ ] `p1` - `cpt-frontx-dashboard-fr-widget-catalog`
  - [ ] `p1` - `cpt-frontx-dashboard-fr-domain-model`
  - [ ] `p1` - `cpt-frontx-dashboard-fr-widget-modal`
  - [ ] `p1` - `cpt-frontx-dashboard-fr-backend-source`
  - [ ] `p1` - `cpt-frontx-dashboard-fr-loading-error-states`
  - [ ] `p2` - `cpt-frontx-dashboard-nfr-large-table`

- **Design Principles Covered**:

  - [ ] `p2` - `cpt-frontx-dashboard-principle-gts-contracts`
  - [ ] `p1` - `cpt-frontx-dashboard-principle-per-instance-isolation`

- **Design Constraints Covered**:

  - None

- **Domain Model Entities**:
  - Widget

- **Design Components**:
  - None (the widget kinds are data; the data-request logic inside each widget MFE, `cpt-frontx-dashboard-component-backend-client`, is later behavior, owned by none of the seven features)

- **API**:
  - `cpt-frontx-dashboard-interface-domain-model` (widget catalog; each widget instance is embedded in a layout cell of the dashboard definition)

- **Sequences**:
  - None

- **Data**:
  - None (DESIGN section 3.7: the template persists nothing)

### 2.3 [Layout Types](features/feature-layout-types/FEATURE.md) - MEDIUM

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-feature-layout-types`

- **Purpose**: Declare the 60-column Layout and the LayoutCell, the embedded object types that together fully define how a dashboard composes its widgets, and state the layout checks that a valid layout passes.

- **Depends On**: `cpt-frontx-dashboard-feature-widget-catalog`

- **Scope**:
  - `gts.frontx.m.layout.layout.v1~`, an embedded object type with no own identifier, with `columns` fixed at 60 and an ordered list of cells.
  - `gts.frontx.m.layout.cell.v1~`, an embedded object type with bounded `x`, `y`, `w`, `h` and one embedded widget instance checked against the Widget base.
  - The layout checks: the bounds of each cell (checked by schema validation), no two cells overlapping, and `x + w` not greater than 60, with the cannot-show diagnostic that names each failing cell.

- **Out of scope**:
  - Running the overlap and `x + w` checks when a dashboard is opened, which is Viewer host behavior for a later behavior feature; the Viewer host behavior for a failing layout is specified in `cpt-frontx-dashboard-feature-backend-contract`.
  - Widget data, which the cell does not carry.
  - A separately stored or referenced layout instance, which does not exist.

- **Requirements Covered**:

  - [ ] `p1` - `cpt-frontx-dashboard-fr-domain-model`
  - [ ] `p1` - `cpt-frontx-dashboard-fr-backend-source`

- **Design Principles Covered**:

  - [ ] `p2` - `cpt-frontx-dashboard-principle-gts-contracts`

- **Design Constraints Covered**:

  - [ ] `p2` - `cpt-frontx-dashboard-constraint-sixty-column-grid`

- **Domain Model Entities**:
  - Layout
  - Layout cell

- **Design Components**:
  - None (the layout types are data; their consumer, the Viewer host, is assigned to `cpt-frontx-dashboard-feature-mfe-entries`)

- **API**:
  - `cpt-frontx-dashboard-interface-domain-model` (layout part; the layout is embedded in the dashboard definition, assigned to `cpt-frontx-dashboard-feature-dashboard-root-types`)

- **Sequences**:
  - None

- **Data**:
  - None (DESIGN section 3.7: the template persists nothing)

### 2.4 [Dashboard Root Types](features/feature-dashboard-root-types/FEATURE.md) - MEDIUM

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-feature-dashboard-root-types`

- **Purpose**: Declare the Dashboard root of every dashboard definition and the Theme type of the template's own frontend theme instance.

- **Depends On**: `cpt-frontx-dashboard-feature-layout-types`

- **Scope**:
  - `gts.frontx.m.dashboard.dashboard.v1~` with only the combined instance `id`, `name`, `description`, and the embedded `layout`.
  - `gts.frontx.m.dashboard.theme.v1~` with light and dark palettes (each with the optional `row_tints` families `severity`, `status`, and `generic`), typography, chart defaults, and spacing.
  - The template-owned Theme instance.

- **Out of scope**:
  - A report type and any visibility, publication, sharing, or audience field (PRD section 4.2).
  - A theme supplied by the backend.
  - The theme shared-property payload that the template domains publish (`cpt-frontx-dashboard-feature-extension-domain-catalog`).

- **Requirements Covered**:

  - [ ] `p1` - `cpt-frontx-dashboard-fr-domain-model`
  - [ ] `p1` - `cpt-frontx-dashboard-fr-theme`
  - [ ] `p1` - `cpt-frontx-dashboard-fr-backend-source`

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
  - `cpt-frontx-dashboard-interface-domain-model` (dashboard root part)

- **Sequences**:
  - None

- **Data**:
  - None (DESIGN section 3.7: the template persists nothing)

### 2.5 [Extension Domain Catalog](features/feature-extension-domain-catalog/FEATURE.md) - MEDIUM

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-feature-extension-domain-catalog`

- **Purpose**: Declare the template's runtime contracts between the Viewer host, the modal container, and the widgets: host actions, extension domains, extension types, and the template theme payload, and specify how the Viewer host creates the widget extensions of both domains when it resolves a dashboard.

- **Depends On**: `cpt-frontx-dashboard-feature-widget-catalog`, `cpt-frontx-dashboard-feature-dashboard-root-types`

- **Scope**:
  - The host actions `set_subject` and `mount_widget`.
  - The domains `layout_cells` and `modal_panel` and their extension types.
  - The modal container extension in the host modal domain.
  - The template theme shared-property payload.
  - The widget extension identifier rule and the action-chain summary mapped to the DESIGN sequences.
  - The creation, at dashboard resolve, of one `layout_cells` extension per cell's widget and one `modal_panel` extension for that widget's larger view, and the mounting of the larger view on `mount_widget`, which only mounts and registers nothing.

- **Out of scope**:
  - The MFE entries mounted into these domains (`cpt-frontx-dashboard-feature-mfe-entries`).
  - The runtime behavior of the Viewer host and the modal container, and the host modal-domain slot in `template-shell`.
  - The registration path of widget modal extensions into `modal_panel`, which is an open item (FEATURE section 6.11 and DESIGN section 4), so the `modal_panel` parts of its acceptance criteria are blocked by it.
  - What a widget's larger view shows and its data, which are each widget's own detail.

- **Requirements Covered**:

  - [ ] `p1` - `cpt-frontx-dashboard-fr-domain-model`
  - [ ] `p1` - `cpt-frontx-dashboard-fr-viewer-host`
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
  - [ ] `p1` - `cpt-frontx-dashboard-component-viewer-host` (shared (extension creation side), owned by `cpt-frontx-dashboard-feature-mfe-entries`: the creation of the widget extensions at dashboard resolve; its entry and manifest stay with the owner)

- **API**:
  - `cpt-frontx-dashboard-interface-host-actions`
  - `cpt-frontx-dashboard-interface-template-domains`
  - `cpt-frontx-dashboard-contract-host-domains` (host modal domain by role)
  - `cpt-frontx-dashboard-interface-domain-model` (extension and domain part)

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
  - The Viewer host manifest, the Viewer host entry, and the modal container entry.
  - The admission of each entry to its domains, and the isolation and packaging notes per entry.
  - The placement of the entries and manifests in the Viewer host and widget package subtrees, and the stack layers each entry loads.

- **Out of scope**:
  - The widget kinds themselves (`cpt-frontx-dashboard-feature-widget-catalog`).
  - Registration from the manifest channel and the kind-to-entry lookup at run time, which are Viewer host behavior.
  - The entry for consumer-derived widget types, which is an open item of the FEATURE (section 6.7).

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

- **Domain Model Entities**:
  - MFE entry

- **Design Components**:

  - [ ] `p1` - `cpt-frontx-dashboard-component-widget-library`
  - [ ] `p1` - `cpt-frontx-dashboard-component-modal-container` (shared (entry side), owned by `cpt-frontx-dashboard-feature-extension-domain-catalog`: the modal container entry and its manifest; its static extension and inner domain stay with the owner)
  - [ ] `p1` - `cpt-frontx-dashboard-component-viewer-host` (its entry and manifest only; its orchestration is runtime behavior for a later feature)
  - [ ] `p2` - `cpt-frontx-dashboard-topology-overlay-packages` (the Viewer host and widget package subtrees that hold the entries and manifests)

- **API**:
  - `cpt-frontx-dashboard-interface-domain-model` (MFE entry part; entries reach the registries through the manifest channel, DESIGN section 3.5)

- **Sequences**:
  - None

- **Data**:
  - None (DESIGN section 3.7: the template persists nothing)

### 2.7 [Backend Contract](features/feature-backend-contract/FEATURE.md) - MEDIUM

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-feature-backend-contract`

- **Purpose**: Specify exactly what the template requires from the consuming product backend, with conformance cases: the dashboard request and its response, the widget data request and its response, the errors with what the Viewer host shows, and the consumer widget types.

- **Depends On**: `cpt-frontx-dashboard-feature-dashboard-root-types`, `cpt-frontx-dashboard-feature-widget-data-catalog`

- **Scope**:
  - The dashboard request by identifier, and its response.
  - The widget data request, which a widget makes through the FrontX API package, and its response, including a widget's own request for the data its larger view needs; what the larger view shows is each widget's implementation detail.
  - The errors: the meaning of each, and what the Viewer host shows, including Retry.
  - The consumer widget types: their definition, and how they reach the browser.
  - A pointer to the four open items of FEATURE section 6.5, owned by the template architect (the request form; the validation of embedded widgets under GTS 0.17 `/$id`; the consumer widget types in the browser; the presentation keys and `params`); the items are not deliverables of this entry.
  - The conformance cases, one per point above.

- **Out of scope**:
  - Access to dashboards and data, which belongs to the consuming product.
  - The distribution of the types to the backend, which belongs to the consuming product.
  - Limits, which belong to the consuming product.
  - Versioning, which the contract does not cover.
  - The shapes of the dashboard root and of the widget data, which are declared by `cpt-frontx-dashboard-feature-dashboard-root-types` and `cpt-frontx-dashboard-feature-widget-data-catalog`.
  - The derivation point of consumer widget types and the layout types, which are declared by `cpt-frontx-dashboard-feature-widget-catalog` and `cpt-frontx-dashboard-feature-layout-types`; this feature uses them by reference, for consumer type derivation and for the layout checks, and reaches both transitively through `cpt-frontx-dashboard-feature-dashboard-root-types`.
  - The endpoint locations of both requests, which come from the configuration of the consuming product.
  - Viewer host orchestration (extension registration, theme, modal container), which belongs to a later behavior feature; the Viewer host behavior that the contract makes visible stays in scope.

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
  - `cpt-frontx-dashboard-contract-consuming-backend` (the PRD contract that the consuming product backend implements; this feature specifies it)
  - `cpt-frontx-dashboard-adr-backend-delivered-dashboard` (the decision that the consuming product backend delivers the dashboard and the widget data)

- **Sequences**:

  - [ ] `p1` - `cpt-frontx-dashboard-seq-initial-load` (shared (contract side), owned by `cpt-frontx-dashboard-feature-extension-domain-catalog`: the dashboard request and the widget data requests)
  - [ ] `p1` - `cpt-frontx-dashboard-seq-failure-handling` (shared (contract side), owned by `cpt-frontx-dashboard-feature-extension-domain-catalog`: the failure classes, what the Viewer host shows, and Retry)

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
