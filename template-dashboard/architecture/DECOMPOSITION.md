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

The DESIGN of `template-dashboard` is decomposed into seven features. Six of them are **domain-model features**, one per part of the dashboard domain model in DESIGN section 3.1 (Parts Summary and Ownership): each declares GTS types and has no actor flows or state machines. The extension domain catalog and the MFE entries also declare instances, and the extension domain catalog also specifies the one process by which the Viewer host creates a cell extension for each widget from the winning widget realization when it resolves a dashboard. The seventh, `cpt-frontx-dashboard-feature-backend-contract`, is the first behavior-level feature: it specifies the contract between the template and the consuming product backend, with actor flows, processes, state machines, and conformance cases, and declares no type of its own. Behavior FEATURE documents for the Viewer host and the host integration are later-stage work (DESIGN section 4, Later stages).

**Decomposition strategy**:

- One domain-model feature per namespace of the domain model, so each GTS family has exactly one owning feature, matching the ownership table of DESIGN section 3.1. The backend contract feature owns no part; it specifies the requests and results that carry the types of the parts.
- Features are ordered by type references. The widget catalog and the widget data catalog come first and are independent of each other, because a widget type does not name its data type. The layout types embed widgets, and the dashboard root types embed the layout. The extension domain catalog carries the widget instance in its action. The MFE entries come last among the domain-model features, because their widget realizations name widget types and their entries are admitted to the template domain. The backend contract follows the domain-model features whose types its requests and results carry.
- Each feature is a single phase: one complete part of the domain model, or for the backend contract one complete contract specification, closed by the Definitions of Done of its FEATURE document.
- Every feature has priority `p2`, the priority that each FEATURE document gives its own entry. The implementation order is the dependency order in section 3, not the priority.

**Element assignment**:

- Each DESIGN component that the template delivers as types or entries is assigned to one feature. Where a feature only declares the types that a component uses at run time, the entry says so, and the runtime behavior of that component belongs to a later behavior feature.
- `cpt-frontx-dashboard-feature-backend-contract` shares five elements with their owning entries, for the contract-visible behavior only: `cpt-frontx-dashboard-component-viewer-host` (owned by `cpt-frontx-dashboard-feature-mfe-entries`), `cpt-frontx-dashboard-seq-initial-load`, `cpt-frontx-dashboard-seq-failure-handling`, and `cpt-frontx-dashboard-seq-widget-modal-open` (owned by `cpt-frontx-dashboard-feature-extension-domain-catalog`), and `cpt-frontx-dashboard-interface-dashboard-payload` (owned by `cpt-frontx-dashboard-feature-dashboard-root-types` for the dashboard definition side and by `cpt-frontx-dashboard-feature-widget-data-catalog` for the widget data result side). The contract-visible behavior is the requests, the failure classes with what the user sees, Retry, the wait time, and the API cache rule; everything else of these elements stays with the owning entries. Its entry marks each of them "shared (contract side)".
- The other shared elements are marked the same way. The extension domain catalog lists `cpt-frontx-dashboard-component-viewer-host` for the creation of the cell extensions at dashboard resolve, marked "shared (extension creation side)". The MFE entries list `cpt-frontx-dashboard-seq-widget-modal-open` for the static modal extension and the modal entry that the larger view mounts, marked "shared (entry side)". The widget catalog lists `cpt-frontx-dashboard-interface-dashboard-payload` for the `source` from which a widget data request is built and for the columns that a result must contain, marked "shared (request side)".
- `cpt-frontx-dashboard-interface-widget-realization` and `cpt-frontx-dashboard-principle-own-registry-registration` are owned by `cpt-frontx-dashboard-feature-mfe-entries` and shared by `cpt-frontx-dashboard-feature-extension-domain-catalog`, as DESIGN section 5 allocates them. The MFE entries cover the widget realization type, the 9 template realizations, the entries, and the static modal extensions that the host bootstrap registers, because a widget cannot register into the host's registry. The extension domain catalog covers the realization precedence by which the Viewer host picks the winning realization, and the registration of the cell extensions only in the Viewer host's own registry, only at dashboard resolve.
- Cross-cutting elements are deliberately shared, because each feature that touches them must comply with them:
  - `cpt-frontx-dashboard-principle-gts-contracts` is listed by all seven features: the six domain-model features for the types they declare, and the backend contract feature for the identifiers that its requests and results carry.
  - `cpt-frontx-dashboard-constraint-gts-id-convention` is listed by the five features whose types, instances, or requests carry GTS identifiers: the widget catalog (the combined widget instance `id`), the dashboard root types (the combined dashboard instance `id`), the extension domain catalog (the domain and the cell extension identifiers), the MFE entries (the realizations, entries, static modal extensions, and manifests), and the backend contract (the dashboard identifier in the dashboard request).
  - `cpt-frontx-dashboard-principle-per-instance-isolation` is listed by the three features whose types cross an MFE instance boundary: the widget catalog, the extension domain catalog, and the MFE entries.
  - `cpt-frontx-dashboard-constraint-role-based-host-ids` and `cpt-frontx-dashboard-contract-host-areas` are listed by the two features that carry host domain identifiers. The extension domain catalog carries the host modal domain identifier that the Viewer host puts into `set_widget_context` as `modal.target`, resolved from shell constants. The MFE entries carry the host modal domain identifier in the static modal extensions and the host screen domain identifier in the Viewer host's routed extension, both as manifest data.
  - `cpt-frontx-dashboard-principle-render-only-viewer` is listed by two features. The backend contract fixes that a widget shows its result unchanged and that nothing is requested after render except Retry and the larger view's own request. The widget catalog fixes that no widget type has a field that hides, cuts off, or re-orders delivered content, with the markdown safety rule as the single exception.
- The five runtime DESIGN sequences are assigned to `cpt-frontx-dashboard-feature-extension-domain-catalog` for its part of each. The backend contract feature covers the contract side of three of them, and the MFE entries cover the entry side of one. The split per sequence is:
  - `cpt-frontx-dashboard-seq-initial-load`: the extension domain catalog covers the creation of the cell extensions from the winning realizations and the `set_widget_context` step; the backend contract covers the dashboard request and the widget data requests.
  - `cpt-frontx-dashboard-seq-failure-handling`: the extension domain catalog covers the cell-level outcomes of extension creation (no single winning realization, a rejected registration, a failed mount, or a failed `set_widget_context`, each without Retry) in its action-chain summary; the backend contract covers the startup failure, the failure classes of both requests, what the user sees, and Retry.
  - `cpt-frontx-dashboard-seq-widget-modal-open`: the extension domain catalog covers the `modal` field of `set_widget_context` and the mapping of the cell widget's own chain, `mount_ext` of the static modal extension followed by `set_widget_context`, during which the Viewer host registers nothing; the MFE entries cover the static modal extension and the modal entry that the chain mounts; the backend contract covers the larger view's request, which is the same as the cell's.
  - `cpt-frontx-dashboard-seq-teardown`: the extension domain catalog covers `unmount_ext` of every cell and the unregistration of the `layout_cells` extensions; teardown sends nothing to the host modal domain.
  - `cpt-frontx-dashboard-seq-theme-switch`: the extension domain catalog covers the theme and language shared properties of `layout_cells`, forwarded unchanged, so a theme switch is a shared-property change only, with no request.
  - The sequences themselves are runtime behavior of the Viewer host and the widgets, outside the domain-model parts, and the runtime remainder of all five is deferred to later behavior features. `cpt-frontx-dashboard-principle-viewer-host-orchestration` is covered as a contract-level principle only.
- `cpt-frontx-dashboard-seq-consumer-generation` is deliberately assigned to no feature: DESIGN marks it as context that runs on the consuming product backend, outside the template, so the template has nothing to deliver for it. What it relies on from the template is the set of types that a generated definition validates against, delivered by `cpt-frontx-dashboard-feature-dashboard-root-types`, `cpt-frontx-dashboard-feature-layout-types`, and `cpt-frontx-dashboard-feature-widget-catalog`, and the layout and grid configuration checks that `cpt-frontx-dashboard-feature-backend-contract` states for the backend.
- Unassigned DESIGN elements, which the template delivers nothing for in these features:
  - `cpt-frontx-dashboard-component-widget-data-request` is the data-request logic inside every cell and modal entry. Its runtime behavior is deferred to a later behavior feature, and it relies on the contract specified in `cpt-frontx-dashboard-feature-backend-contract` (DESIGN section 5).
  - `cpt-frontx-dashboard-tech-frontx-stack` describes the stack layers, which are honored through `cpt-frontx-dashboard-principle-gts-contracts` and the per-entry layers in `cpt-frontx-dashboard-feature-mfe-entries`, and has nothing of its own to deliver.
  - `cpt-frontx-dashboard-constraint-licensing-compliance-resources` is a package-wide disposition for which no FEATURE declares a contract.
- `cpt-frontx-dashboard-fr-backend-source` is shared by the four features whose types a dashboard or its widget data is checked against, because a dashboard that the consuming product writes or generates is checked against all of them: the dashboard root with its embedded layout, the widget types with their `source` and column bindings, and the one widget data type that every result is checked against. The backend contract feature covers it for the requests and results that carry them. Generation itself, and the authoring-time check that each metric exists and returns the bound columns, belong to the consuming product.
- `cpt-frontx-dashboard-interface-domain-model` (PRD section 7.1) is shared by all seven features. It is the union of the six parts, and each domain-model feature owns exactly one of them (DESIGN section 3.1, Parts Summary and Ownership) and lists it under API with the part it delivers. The backend contract feature owns no part and lists it for the types that its requests and results carry.
- `cpt-frontx-dashboard-fr-domain-model` is covered by all seven features, each for its own part or the contract. Six further requirements are covered by several entries, each for a different part:
  - `cpt-frontx-dashboard-fr-widget-modal`: the shared widget chrome with its larger-view button, shown in every cell widget in every state, in the widget catalog; the `modal` field of `set_widget_context` and the mapping of the cell widget's chain to the host modal domain in the extension domain catalog; the 9 modal entries, the 9 static modal extensions, and the required modal extension of every realization in the MFE entries; the larger view's request, the same as the cell's, in the backend contract.
  - `cpt-frontx-dashboard-fr-loading-error-states`: the per-widget loading, error, empty, and cannot-show states of the widget chrome, and the cannot-show state for a missing bound column, in the widget catalog; the cell-level cannot-show outcomes of extension creation in the extension domain catalog; the startup failure, the failure classes, what the user sees for each, and Retry in the backend contract.
  - `cpt-frontx-dashboard-fr-widget-catalog`: the one widget data type that every widget type validates its result against in the widget data catalog; the 9 widget types with their column bindings, the `grid` presentation, and the `markdown_card` rendering safety in the widget catalog; one cell entry, one modal entry, one static modal extension, and one realization per widget type in the MFE entries.
  - `cpt-frontx-dashboard-fr-theme`: the theme and language shared properties of `layout_cells`, forwarded unchanged from the host, in the extension domain catalog; every cell and modal entry requiring theme and language in the MFE entries.
  - `cpt-frontx-dashboard-fr-viewer-host`: the creation of the cell extensions at dashboard resolve, and the action and domain it uses, in the extension domain catalog; the Viewer host entry, manifest, and routed extension in the MFE entries.
  - `cpt-frontx-dashboard-fr-replacement-widget`: the realization precedence by which a replacement realization of higher weight wins when the Viewer host creates the cell extensions, in the extension domain catalog; the replacement realization shipped in its own package, with its own cell entry, modal entry, and static modal extension, in the MFE entries. DESIGN section 5 maps this requirement to the widget realization interface, the Viewer host, and the package topology, so the widget catalog does not list it.
- PRD use cases are covered through the sequences and entries above. `cpt-frontx-dashboard-usecase-view-dashboard` is realized by the five runtime sequences, split as above. `cpt-frontx-dashboard-usecase-provide-dashboard` is covered by `cpt-frontx-dashboard-feature-dashboard-root-types`, `cpt-frontx-dashboard-feature-layout-types`, and `cpt-frontx-dashboard-feature-widget-catalog` (the types that a consuming product describes and checks a dashboard with), by `cpt-frontx-dashboard-feature-backend-contract` (how the backend provides the dashboard and its data, and the checks it runs before showing it), and by `cpt-frontx-dashboard-feature-mfe-entries` (the replacement realization of its optional replacement step). This allocation follows the steps of the PRD use case, because DESIGN references the use case only from `cpt-frontx-dashboard-seq-consumer-generation`, which is context and assigned to no feature. The PRD actors (`cpt-frontx-dashboard-actor-template-consumer`, `cpt-frontx-dashboard-actor-dashboard-viewer`, `cpt-frontx-dashboard-actor-consuming-backend`, `cpt-frontx-dashboard-actor-host-application`) are not assigned: they take part in the use cases and sequences and are not deliverables of a feature.
- `cpt-frontx-dashboard-topology-overlay-packages` is assigned to `cpt-frontx-dashboard-feature-mfe-entries`, whose entries, realizations, static modal extensions, and manifests are what each package subtree holds, including a consumer's replacement package. The Contracts layer of the stack is honored by all seven features through `cpt-frontx-dashboard-principle-gts-contracts`.
- DESIGN section 3.7 defines no database or table, so no feature lists data identifiers.
- ADRs are not feature deliverables. They are traced through DESIGN section 5 to the elements that realize them, and those elements are allocated above.

**Coverage gaps**: the following PRD requirements are not covered by any of the seven features, because they concern compatibility, quality measured on the running template, or shipped documentation, rather than type declarations or the backend contract. They are left for the later behavior features and are not assigned here. DESIGN section 5 realizes `cpt-frontx-dashboard-nfr-compatibility` and `cpt-frontx-dashboard-nfr-consumer-docs` partly through elements these features deliver (the shell-only dependency, the role-based host identifiers, and the package topology); those elements are delivered, but the requirements are verified only by the later behavior features, through the host compatibility checks and the shipped consumer guide:

- Compatibility: `cpt-frontx-dashboard-nfr-compatibility`.
- Measured quality: `cpt-frontx-dashboard-nfr-visual-quality`, `cpt-frontx-dashboard-nfr-initial-render`, `cpt-frontx-dashboard-nfr-accessibility`.
- Shipped documentation: `cpt-frontx-dashboard-nfr-consumer-docs`.

A measured NFR counts as covered when the declared contract enables the measurement; the measurement itself is deferred to the running template. By this rule `cpt-frontx-dashboard-nfr-large-table` (enabled by the `grid` presentation rules in the widget catalog) and `cpt-frontx-dashboard-nfr-bundle-budget` (enabled by the entry set and the per-entry packaging boundary in the MFE entries) are covered. `cpt-frontx-dashboard-nfr-visual-quality`, `cpt-frontx-dashboard-nfr-initial-render`, and `cpt-frontx-dashboard-nfr-accessibility` stay gaps, because no FEATURE declares a contract that enables their measurement; they would move to covered only when a later behavior feature does. `cpt-frontx-dashboard-nfr-large-table` is listed by the widget catalog only, which owns its presentation rules.

Requirements and elements covered only at type or contract level, with their runtime behavior deferred to later behavior features: the remaining Viewer host runtime, its screen and chrome (`cpt-frontx-dashboard-principle-viewer-host-orchestration`), while realization choice, cell-extension registration, and theme forwarding are specified in `cpt-frontx-dashboard-feature-extension-domain-catalog` (FEATURE sections 3 and 6.2); the data-request logic (`cpt-frontx-dashboard-component-widget-data-request`) and rendering inside each widget entry; the mapping of the host theme id to the ui-kit scope in each MFE; and the runtime remainder of the five sequences, whose per-sequence split is stated above.

## 2. Entries

**Overall implementation status:**

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-status-overall`

### 2.1 [Widget Data Catalog](features/feature-widget-data-catalog/FEATURE.md) - MEDIUM

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-feature-widget-data-catalog`

- **Purpose**: Declare the one widget data type that every widget data result is checked against, whatever the widget type: the generic tabular result that a widget requests through the FrontX API package and shows unchanged.

- **Depends On**: None

- **Scope**:
  - The concrete widget data type `gts.frontx.v.widget_data.widget_data.v1~`, which is not abstract and has no identifier.
  - Its exact field names, mirroring the widget data result of DESIGN section 3.3: the ordered column names, the rows as positional value arrays aligned to the columns, and the names of the columns that hold percentages, with no column types; a percentage value is a fraction where 1 means 100%, and a result whose rows or percentage columns do not align with its columns is misaligned and cannot be shown.

- **Out of scope**:
  - A data type per widget type, row groups, or any link from a widget type to a data type: every widget type uses this one type, and package `m` holds no reference into package `v`.
  - The column bindings of the widget types and the check that every bound column is present (`cpt-frontx-dashboard-feature-widget-catalog`).
  - The request form, the failure classes, and the wait time of a widget data request (`cpt-frontx-dashboard-feature-backend-contract`).
  - The large-grid target of 5,000 rows, which belongs to the `grid` presentation (`cpt-frontx-dashboard-feature-widget-catalog`).
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
  - None (the widget data type is data; the widget entries that request and show it are assigned to `cpt-frontx-dashboard-feature-mfe-entries`)

- **API**:
  - `cpt-frontx-dashboard-interface-dashboard-payload` (widget data result side)
  - `cpt-frontx-dashboard-interface-domain-model` (widget data catalog)

- **Sequences**:
  - None

- **Data**:
  - None (DESIGN section 3.7: the template persists nothing)

### 2.2 [Widget Catalog](features/feature-widget-catalog/FEATURE.md) - MEDIUM

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-feature-widget-catalog`

- **Purpose**: Declare the abstract widget base and the 9 subject-agnostic widget types that every dashboard embeds in its layout cells, with the column binding of each widget type, the presentation rules of the `grid` widget type, and the rendering safety of the `markdown_card` widget type.

- **Depends On**: None

- **Scope**:
  - The abstract widget base `gts.frontx.m.widget.widget.v1~` with the combined instance `id`, `title`, and the typed `source` with `metric`, an optional `range`, and an optional `bucket`; the base declares no traits.
  - The 9 template widget types as presentation types, each with its presentation schema and its column bindings, which name for each role the result column that fills it.
  - The run-time rule that a result lacking a bound column makes the widget one that cannot be shown, and the empty state of each widget type.
  - The `grid` presentation: values shown as text, frozen columns, grouped column headings, optional row coloring by `row_color_column` with ui-kit tokens and an icon of each color meaning, column width and alignment as presentation hints, up to 5,000 rows without paging while the view stays responsive, and the grid configuration checks.
  - The rendering safety of `markdown_card`: its body comes from the bound `body` column of the first row, embedded HTML is shown as plain text and not rendered, links show their text, and an image is not loaded and shows its alt text.
  - The shared widget chrome contract: one larger-view button in every cell widget, in every state, and the per-widget loading, error, empty, and cannot-show states.

- **Out of scope**:
  - Any field for client-side sorting, grouping, paging, filtering, display limits, or drill-down (PRD section 4.2).
  - Consumer widget types and consumer widget settings, which are a later stage (DESIGN section 4); replacing how a widget type is shown is a replacement realization (`cpt-frontx-dashboard-feature-mfe-entries`).
  - The widget realizations and entries that show the widget types (`cpt-frontx-dashboard-feature-mfe-entries`).
  - The widget data type whose columns the bindings name (`cpt-frontx-dashboard-feature-widget-data-catalog`); the widget types do not reference it.
  - The runtime data-request logic inside each widget entry, which belongs to a later behavior feature.
  - Generating dashboards, and checking at authoring time that each metric exists and returns the bound columns, which belong to the consuming product.

- **Requirements Covered**:

  - [ ] `p1` - `cpt-frontx-dashboard-fr-widget-catalog`
  - [ ] `p1` - `cpt-frontx-dashboard-fr-domain-model`
  - [ ] `p1` - `cpt-frontx-dashboard-fr-widget-modal`
  - [ ] `p1` - `cpt-frontx-dashboard-fr-backend-source`
  - [ ] `p1` - `cpt-frontx-dashboard-fr-loading-error-states`
  - [ ] `p2` - `cpt-frontx-dashboard-nfr-large-table`

- **Design Principles Covered**:

  - [ ] `p1` - `cpt-frontx-dashboard-principle-render-only-viewer`
  - [ ] `p2` - `cpt-frontx-dashboard-principle-gts-contracts`
  - [ ] `p1` - `cpt-frontx-dashboard-principle-per-instance-isolation`

- **Design Constraints Covered**:

  - [ ] `p1` - `cpt-frontx-dashboard-constraint-gts-id-convention`

- **Domain Model Entities**:
  - Widget

- **Design Components**:
  - None (the widget types are data; the widget library is assigned to `cpt-frontx-dashboard-feature-mfe-entries`, and the data-request logic inside each widget entry, `cpt-frontx-dashboard-component-widget-data-request`, is later behavior, assigned to none of the seven features)

- **API**:
  - `cpt-frontx-dashboard-interface-domain-model` (widget catalog; each widget instance is embedded in a layout cell of the dashboard definition)
  - `cpt-frontx-dashboard-interface-dashboard-payload` (shared (request side), owned by `cpt-frontx-dashboard-feature-dashboard-root-types` and `cpt-frontx-dashboard-feature-widget-data-catalog`: the `source` from which a widget data request is built, and the bound columns that a result must contain)

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
  - `gts.frontx.m.layout.cell.v1~`, an embedded object type with bounded `x`, `y`, `w`, `h` and one embedded widget instance, checked against the widget base and resolved to the widget type that its `id` names.
  - The layout checks: the bounds of each cell (checked by schema validation), `x + w` not greater than 60, and, only when every cell passes both, no two cells overlapping, with the cannot-show diagnostic that names each failing cell by its zero-based index.
  - The placement rule: how a cell takes its place on the 60-column grid from its `x`, `y`, `w`, and `h`.

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

- **Purpose**: Declare the Dashboard root of every dashboard definition, the instance that the consuming product backend returns for one dashboard request.

- **Depends On**: `cpt-frontx-dashboard-feature-layout-types`

- **Scope**:
  - `gts.frontx.m.dashboard.dashboard.v1~` with only the combined instance `id`, `name`, an optional `description`, and the embedded `layout`, and no theme reference.
  - The rule that a consuming product may derive a dashboard subtype that adds dashboard-level fields, which the Viewer host ignores.

- **Out of scope**:
  - A report type and any visibility, publication, sharing, or audience field (PRD section 4.2).
  - Any theme type or theme instance: the theme is the host's theme shared property, forwarded on `layout_cells` (`cpt-frontx-dashboard-feature-extension-domain-catalog`).
  - Widget settings added by a consuming product, which this version does not allow.

- **Requirements Covered**:

  - [ ] `p1` - `cpt-frontx-dashboard-fr-domain-model`
  - [ ] `p1` - `cpt-frontx-dashboard-fr-backend-source`

- **Design Principles Covered**:

  - [ ] `p2` - `cpt-frontx-dashboard-principle-gts-contracts`

- **Design Constraints Covered**:

  - [ ] `p1` - `cpt-frontx-dashboard-constraint-gts-id-convention`

- **Domain Model Entities**:
  - Dashboard definition
  - Dashboard

- **Design Components**:
  - None (the root type is data; its consumers are assigned to `cpt-frontx-dashboard-feature-mfe-entries` and `cpt-frontx-dashboard-feature-backend-contract`)

- **API**:
  - `cpt-frontx-dashboard-interface-dashboard-payload` (dashboard definition side; shared with `cpt-frontx-dashboard-feature-widget-data-catalog`, which owns the widget data result side)
  - `cpt-frontx-dashboard-interface-domain-model` (dashboard root part)

- **Sequences**:
  - None

- **Data**:
  - None (DESIGN section 3.7: the template persists nothing)

### 2.5 [Extension Domain Catalog](features/feature-extension-domain-catalog/FEATURE.md) - MEDIUM

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-feature-extension-domain-catalog`

- **Purpose**: Declare the template's runtime contracts between the Viewer host and the widgets, the `set_widget_context` action and the `layout_cells` domain with its extension type, and specify how the Viewer host creates one cell extension per widget from the winning widget realization when it resolves a dashboard.

- **Depends On**: `cpt-frontx-dashboard-feature-widget-catalog`

- **Scope**:
  - The template action `set_widget_context` with its payload: `widget`, the widget instance; `data_endpoint`, which travels only in this action and is not a shared property; and `modal` with `target` and `subject`, present for every cell widget and absent for a modal widget.
  - The `layout_cells` domain with the Concurrent strategy, its domain and extension lifecycle stages, occupancy, and default action timeout, theme and language as shared properties forwarded unchanged from the host, and its extension type.
  - The cell extension identifier rule, from the zero-based cell index.
  - The creation of the cell extensions at dashboard resolve: the widget type read from the widget's `id`, the winning realization by realization precedence, the cell extension generated with `entry` from that realization and registered only in the Viewer host's own registry, and the cannot-show outcomes for no realization, a tie at the highest weight, a rejected registration, a failed mount, or a failed `set_widget_context`.
  - The action-chain summary mapped to the DESIGN sequences, including the cell widget's own chain that opens the larger view in the host modal domain.

- **Out of scope**:
  - The widget realization type, the realizations, the entries, and the static modal extensions (`cpt-frontx-dashboard-feature-mfe-entries`).
  - The host modal domain and its lifecycle actions, which the shell implements, and the host's rendered modal-domain slot, a `template-shell` prerequisite (DESIGN section 4).
  - The remaining Viewer host runtime, its screen and chrome, which is a later behavior feature; realization choice, cell-extension registration, and theme forwarding are in scope here (FEATURE sections 3 and 6.2).
  - What a widget's larger view shows, which belongs to the widget type and its modal entry.

- **Requirements Covered**:

  - [ ] `p1` - `cpt-frontx-dashboard-fr-domain-model`
  - [ ] `p1` - `cpt-frontx-dashboard-fr-viewer-host`
  - [ ] `p1` - `cpt-frontx-dashboard-fr-widget-modal`
  - [ ] `p1` - `cpt-frontx-dashboard-fr-theme`
  - [ ] `p1` - `cpt-frontx-dashboard-fr-loading-error-states`
  - [ ] `p2` - `cpt-frontx-dashboard-fr-replacement-widget`

- **Design Principles Covered**:

  - [ ] `p1` - `cpt-frontx-dashboard-principle-own-registry-registration` (shared, owned by `cpt-frontx-dashboard-feature-mfe-entries`: the registration of cell extensions only in the Viewer host's own registry, only at dashboard resolve)
  - [ ] `p1` - `cpt-frontx-dashboard-principle-viewer-host-orchestration`
  - [ ] `p2` - `cpt-frontx-dashboard-principle-gts-contracts`
  - [ ] `p1` - `cpt-frontx-dashboard-principle-per-instance-isolation`

- **Design Constraints Covered**:

  - [ ] `p1` - `cpt-frontx-dashboard-constraint-gts-id-convention`
  - [ ] `p1` - `cpt-frontx-dashboard-constraint-role-based-host-ids`
  - [ ] `p2` - `cpt-frontx-dashboard-constraint-one-viewer-per-tree`

- **Domain Model Entities**:
  - Template action
  - Domain and extension type

- **Design Components**:

  - [ ] `p1` - `cpt-frontx-dashboard-component-viewer-host` (shared (extension creation side), owned by `cpt-frontx-dashboard-feature-mfe-entries`: the creation of the cell extensions at dashboard resolve; its entry and manifest stay with the owner)

- **API**:
  - `cpt-frontx-dashboard-interface-host-actions`
  - `cpt-frontx-dashboard-interface-template-domains`
  - `cpt-frontx-dashboard-interface-widget-realization` (shared, owned by `cpt-frontx-dashboard-feature-mfe-entries`: the realization precedence used when the cell extensions are created)
  - `cpt-frontx-dashboard-contract-host-areas` (the host modal domain by role, as the `modal.target` of `set_widget_context`)
  - `cpt-frontx-dashboard-interface-domain-model` (action and domain part)

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

- **Purpose**: Declare the widget realization type and the realizations, entries, static modal extensions, and manifests through which the Viewer host and the 9 widget types are loaded and shown in a cell and in the larger view.

- **Depends On**: `cpt-frontx-dashboard-feature-widget-catalog`, `cpt-frontx-dashboard-feature-extension-domain-catalog`

- **Scope**:
  - The widget realization type `gts.frontx.v.mfe.widget_realization.v1~` with `id`, `widget_type`, `entry`, the required `modal_extension`, and `weight` with default 1.
  - The 9 template widget realizations of weight 1, one per widget type.
  - The widget manifest with 9 cell entries and 9 modal entries, all plain instances of the FrontX Module Federation entry type, each requiring theme and language and supporting `set_widget_context`.
  - The 9 static extensions of the host modal domain, one per widget type, each pointing to that type's modal entry, declared in the widget manifest and registered by the host bootstrap.
  - The Viewer host manifest, the Viewer host entry, and its routed extension in the host screen domain.
  - The admission of each entry: cell entries to `layout_cells`, and modal entries to the host modal domain under the subset rule; and the isolation and packaging notes per entry, with every MFE declaring all its packages as shared.
  - The packaging of a consumer replacement realization in its own package, with its own cell entry, modal entry, and static modal extension, and a weight above 1.
  - The placement of the entries, realizations, static modal extensions, and manifests in the Viewer host and widget package subtrees, and the stack layers each entry loads.

- **Out of scope**:
  - The widget types themselves (`cpt-frontx-dashboard-feature-widget-catalog`).
  - Picking the winning realization and creating the cell extensions at dashboard resolve (`cpt-frontx-dashboard-feature-extension-domain-catalog`).
  - Registration from the manifest channel at run time, which is Viewer host and host bootstrap behavior.
  - A template entry type or any field added to entries; entries stay plain FrontX entries.
  - Consumer widget types, which are a later stage (DESIGN section 4).

- **Requirements Covered**:

  - [ ] `p1` - `cpt-frontx-dashboard-fr-widget-catalog`
  - [ ] `p1` - `cpt-frontx-dashboard-fr-domain-model`
  - [ ] `p1` - `cpt-frontx-dashboard-fr-viewer-host`
  - [ ] `p1` - `cpt-frontx-dashboard-fr-widget-modal`
  - [ ] `p1` - `cpt-frontx-dashboard-fr-theme`
  - [ ] `p2` - `cpt-frontx-dashboard-fr-replacement-widget`
  - [ ] `p3` - `cpt-frontx-dashboard-nfr-bundle-budget`

- **Design Principles Covered**:

  - [ ] `p1` - `cpt-frontx-dashboard-principle-per-instance-isolation`
  - [ ] `p1` - `cpt-frontx-dashboard-principle-own-registry-registration` (the static modal extensions, registered by the host bootstrap because a widget cannot register into the host's registry)
  - [ ] `p2` - `cpt-frontx-dashboard-principle-gts-contracts`

- **Design Constraints Covered**:

  - [ ] `p1` - `cpt-frontx-dashboard-constraint-gts-id-convention`
  - [ ] `p1` - `cpt-frontx-dashboard-constraint-role-based-host-ids`
  - [ ] `p1` - `cpt-frontx-dashboard-constraint-shell-only-dependency`

- **Domain Model Entities**:
  - Widget realization
  - MFE entries and static modal extensions (instances of FrontX types)

- **Design Components**:

  - [ ] `p1` - `cpt-frontx-dashboard-component-widget-library`
  - [ ] `p1` - `cpt-frontx-dashboard-component-viewer-host` (its entry, manifest, and routed extension only; realization choice, cell-extension registration, and theme forwarding are specified in `cpt-frontx-dashboard-feature-extension-domain-catalog` (FEATURE sections 3 and 6.2), and the remaining Viewer host runtime, its screen and chrome, is a later behavior feature)
  - [ ] `p2` - `cpt-frontx-dashboard-topology-overlay-packages` (the Viewer host and widget package subtrees, and a consumer's replacement package, that hold the entries, realizations, static modal extensions, and manifests)

- **API**:
  - `cpt-frontx-dashboard-interface-widget-realization` (the realization type, the template realizations, and the static modal extensions)
  - `cpt-frontx-dashboard-contract-host-areas` (the host screen domain of the routed extension and the host modal domain of the static modal extensions, by role)
  - `cpt-frontx-dashboard-interface-domain-model` (realization and entry part; entries, realizations, and static modal extensions reach the registries through the manifest channel, DESIGN section 3.5)

- **Sequences**:

  - [ ] `p1` - `cpt-frontx-dashboard-seq-widget-modal-open` (shared (entry side), owned by `cpt-frontx-dashboard-feature-extension-domain-catalog`: the static modal extension and the modal entry that the chain mounts)

- **Data**:
  - None (DESIGN section 3.7: the template persists nothing)

### 2.7 [Backend Contract](features/feature-backend-contract/FEATURE.md) - MEDIUM

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-feature-backend-contract`

- **Purpose**: Specify exactly what the template requires from the consuming product backend, with conformance cases: the dashboard request and its response, the metric-based widget data request and its generic result, the failure classes with what the user sees and Retry, and the rules for the wait time and the API cache.

- **Depends On**: `cpt-frontx-dashboard-feature-dashboard-root-types`, `cpt-frontx-dashboard-feature-widget-data-catalog`, `cpt-frontx-dashboard-feature-widget-catalog`

- **Scope**:
  - The dashboard request by the dashboard's GTS instance identifier, and its response: one dashboard instance with its embedded layout and widgets, with no widget data and no theme.
  - The widget data request built from a widget's `source`: the metric name, an optional time window, and an optional bucketing flag; and its one generic result. The larger view sends the same request as the cell and adds no other metric.
  - The failure classes by meaning, for both requests: a failed request with Retry, and a dashboard or widget data that cannot be shown, without Retry, including the "no permission" diagnostic. Also the startup failure of the Viewer host, the session expiry handled by the host, and what the user sees for each.
  - The wait time of 35 seconds, a template setting and not a contract term.
  - The API cache that the FrontX API package shares across runtimes, the rule that Retry must reach the backend, and conformance counted as requests made through the FrontX API package.
  - The checks the backend runs before it shows a written or generated dashboard: validation against the template types, the layout checks, and the `grid` configuration checks, so that the template can show the dashboard in full.
  - The viewer-access prerequisite: every dashboard viewer can request the widget data of the dashboards they can open.
  - The conformance cases, one per point above.

- **Out of scope**:
  - Access to dashboards and data, which belongs to the consuming product.
  - The distribution of the types to the backend, which belongs to the consuming product.
  - Limits, which belong to the consuming product.
  - Versioning, which the contract does not cover.
  - The shapes of the dashboard root, of the widget data, and of the widget base with its `source` and column bindings, which are declared by `cpt-frontx-dashboard-feature-dashboard-root-types`, `cpt-frontx-dashboard-feature-widget-data-catalog`, and `cpt-frontx-dashboard-feature-widget-catalog`.
  - The layout types, which are declared by `cpt-frontx-dashboard-feature-layout-types`; this feature uses them by reference for the layout checks and reaches them transitively through `cpt-frontx-dashboard-feature-dashboard-root-types`.
  - Consumer widget types, which are a later stage (DESIGN section 4).
  - The endpoint locations of both requests, which come from the configuration of the consuming product.
  - Realization choice, cell-extension registration, and theme forwarding, which are specified in `cpt-frontx-dashboard-feature-extension-domain-catalog` (FEATURE sections 3 and 6.2); the remaining Viewer host runtime, its screen and chrome, is a later behavior feature. The Viewer host behavior that the contract makes visible stays in scope.

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
  - [ ] `p2` - `cpt-frontx-dashboard-constraint-sixty-column-grid` (layout checks in the backend's pre-display checks)

- **Domain Model Entities**:
  - Dashboard definition
  - Widget (its `source`)
  - Widget data

- **Design Components**:

  - [ ] `p1` - `cpt-frontx-dashboard-component-viewer-host` (shared (contract side), owned by `cpt-frontx-dashboard-feature-mfe-entries`: the dashboard request it sends, the failures it shows, and the Retry it offers; realization choice, cell-extension registration, and theme forwarding are specified in `cpt-frontx-dashboard-feature-extension-domain-catalog` (FEATURE sections 3 and 6.2), and the remaining Viewer host runtime, its screen and chrome, is a later behavior feature)

- **API**:
  - `cpt-frontx-dashboard-interface-dashboard-payload` (shared (contract side), owned by `cpt-frontx-dashboard-feature-dashboard-root-types` for the dashboard definition side and by `cpt-frontx-dashboard-feature-widget-data-catalog` for the widget data result side: this feature specifies both requests and their results exactly)
  - `cpt-frontx-dashboard-interface-domain-model` (the types that the requests and results carry)
  - `cpt-frontx-dashboard-contract-consuming-backend` (the PRD contract that the consuming product backend implements; this feature specifies it)
  - `cpt-frontx-dashboard-adr-backend-delivered-dashboard` (the decision that the consuming product backend delivers the dashboard and computes the widget data)

- **Sequences**:

  - [ ] `p1` - `cpt-frontx-dashboard-seq-initial-load` (shared (contract side), owned by `cpt-frontx-dashboard-feature-extension-domain-catalog`: the dashboard request and the widget data requests)
  - [ ] `p1` - `cpt-frontx-dashboard-seq-failure-handling` (shared (contract side), owned by `cpt-frontx-dashboard-feature-extension-domain-catalog`: the startup failure, the failure classes, what the user sees, and Retry)
  - [ ] `p1` - `cpt-frontx-dashboard-seq-widget-modal-open` (shared (contract side), owned by `cpt-frontx-dashboard-feature-extension-domain-catalog`: the larger view's request, the same as the cell's, possibly served from the API cache)

- **Data**:
  - None (DESIGN section 3.7: the template persists nothing)

---

## 3. Feature Dependencies

```text
cpt-frontx-dashboard-feature-widget-catalog
    ├─→ cpt-frontx-dashboard-feature-layout-types
    │       ↓
    │   cpt-frontx-dashboard-feature-dashboard-root-types
    ├─→ cpt-frontx-dashboard-feature-extension-domain-catalog
    │       ↓
    └─→ cpt-frontx-dashboard-feature-mfe-entries                (also requires extension-domain-catalog)

cpt-frontx-dashboard-feature-widget-data-catalog

cpt-frontx-dashboard-feature-dashboard-root-types, cpt-frontx-dashboard-feature-widget-data-catalog, cpt-frontx-dashboard-feature-widget-catalog
    ↓
cpt-frontx-dashboard-feature-backend-contract
```

**Dependency Rationale**:

- `cpt-frontx-dashboard-feature-widget-catalog` and `cpt-frontx-dashboard-feature-widget-data-catalog` are independent roots: a widget type does not name its data type, and package `m` holds no reference into package `v`, because every widget checks its result against the one widget data type. The two can be authored in parallel.
- `cpt-frontx-dashboard-feature-layout-types` requires `cpt-frontx-dashboard-feature-widget-catalog`: each cell checks its embedded widget instance against the widget base. The FEATURE calls this a reference only, so the layout types can be authored in parallel once the widget base identifier is fixed.
- `cpt-frontx-dashboard-feature-dashboard-root-types` requires `cpt-frontx-dashboard-feature-layout-types`: the Dashboard embeds the Layout.
- `cpt-frontx-dashboard-feature-extension-domain-catalog` requires `cpt-frontx-dashboard-feature-widget-catalog`: `set_widget_context` carries the widget instance with its `source`, and the creation of the cell extensions reads the widget type from the widget's `id`. It does not depend on the dashboard root types, so it can be authored in parallel with the layout types and the dashboard root types.
- `cpt-frontx-dashboard-feature-mfe-entries` requires `cpt-frontx-dashboard-feature-widget-catalog` (each realization's `widget_type` names a widget type, constrained to the widget base) and `cpt-frontx-dashboard-feature-extension-domain-catalog` (the action that every entry supports and the domain that the cell entries are admitted to).
- The creation process of the extension domain catalog uses the realization precedence and the `entry` field of a realization, which the MFE entries declare. DESIGN sections 3.1 and 3.3 fix both, so that use is a reference by name only and is not a build-order dependency, and the graph stays acyclic: the extension domain catalog comes first, and the MFE entries reference its action and domain.
- `cpt-frontx-dashboard-feature-backend-contract` requires three features. It needs `cpt-frontx-dashboard-feature-dashboard-root-types` because the dashboard request returns one dashboard of that shape. It needs `cpt-frontx-dashboard-feature-widget-data-catalog` because every widget data result is of the one widget data type. It needs `cpt-frontx-dashboard-feature-widget-catalog` because a widget data request is built from the widget's `source`, and a result that lacks a bound column cannot be shown. It also uses `cpt-frontx-dashboard-feature-layout-types` (the layout checks) by reference, reached transitively through `cpt-frontx-dashboard-feature-dashboard-root-types`, so it is not listed as a direct dependency. Nothing depends on it, so the graph stays acyclic.
