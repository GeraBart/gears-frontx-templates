---
status: accepted
version: 1
date: 2026-10-30
description: Decomposition of the FrontX dashboard template DESIGN into eight features: seven domain-model features and the data adapter contract feature, with their scope, dependency order, and coverage of PRD and DESIGN identifiers.
---

# Decomposition: FrontX Dashboard Template

<!-- toc -->

- [1. Overview](#1-overview)
- [2. Entries](#2-entries)
  - [2.1 Query Vocabulary - MEDIUM](#21-query-vocabulary---medium)
  - [2.2 Widget Data Catalog - MEDIUM](#22-widget-data-catalog---medium)
  - [2.3 Widget Catalog - MEDIUM](#23-widget-catalog---medium)
  - [2.4 Layout Types - MEDIUM](#24-layout-types---medium)
  - [2.5 Dashboard Root Types - MEDIUM](#25-dashboard-root-types---medium)
  - [2.6 Extension Domain Catalog - MEDIUM](#26-extension-domain-catalog---medium)
  - [2.7 MFE Entries - MEDIUM](#27-mfe-entries---medium)
  - [2.8 Data Adapter Contract - MEDIUM](#28-data-adapter-contract---medium)
- [3. Feature Dependencies](#3-feature-dependencies)

<!-- /toc -->

## 1. Overview

The DESIGN of `template-dashboard` is decomposed into eight features. Seven of them are **domain-model features**, one per part of the domain model in DESIGN section 3.1 (Parts Summary and Ownership). Each declares GTS types. Most of them have no actor flows or state machines; the widget catalog and the query vocabulary add flows. Some of them also declare instances, and some specify the processes that the two domain owners run: the dashboards root and the larger-view modal. The eighth feature, `cpt-frontx-dashboard-feature-data-adapter-contract`, is the behavior-level feature. It specifies the data adapter interface that the consuming product implements, with actor flows, algorithms, and conformance cases, and it declares no type of its own. The data adapter implementation belongs to the consuming product and to no feature.

**Decomposition strategy**:

- One domain-model feature per namespace of the domain model, so each GTS family has exactly one owning feature, matching the ownership table of DESIGN section 3.1. The data adapter contract feature owns no part. It specifies the operations that carry the types of the parts.
- Features are listed in a topological order of their direct dependencies (section 3): the query vocabulary, the widget data catalog, the widget catalog, the layout types, the dashboard root types, the extension domain catalog, the MFE entries, and the data adapter contract. A data shape uses query members, so the widget data catalog follows the query vocabulary. A data widget type names its data shape and fill mode, so the widget catalog follows the widget data catalog. The layout embeds widgets, and the dashboard root embeds the layout. The domain owners validate and mount what the dashboard root types describe, and the MFE entries follow them because their entries are admitted to the template's domains. The data adapter contract is last: it specifies the interface that the owners call, and no feature lists it in Depends On.
- Each feature is one complete part of the domain model, or for the data adapter contract one complete interface specification, closed by the Definitions of Done of its FEATURE document.
- Every feature has priority `p2`: each FEATURE document gives its own entry `p2`, and all eight are needed for a complete template, so the priority does not order them. The implementation order is the dependency order in section 3.

**Element assignment**:

- Each DESIGN component, interface, sequence, principle, and constraint is assigned to one owning feature. Where more than one feature realizes an element, each of them lists it, and each entry says which side it covers: the owner marks no side, and the other features mark "shared" with their side. Principles and constraints that every type-declaring feature must comply with are listed by each of those features.
- The two domain owners are covered as follows:
  - `cpt-frontx-dashboard-component-dashboards-root` and `cpt-frontx-dashboard-component-larger-view-modal` are owned by `cpt-frontx-dashboard-feature-extension-domain-catalog` for their behavior. The MFE entries share both components for their entries, manifests, routed and static extensions, and package contents, marked "shared (entry side)". The data adapter contract shares both for the calls that they make to the data adapter, marked "shared (call side)".
  - `cpt-frontx-dashboard-component-data-adapter` is owned by `cpt-frontx-dashboard-feature-data-adapter-contract`, together with `cpt-frontx-dashboard-interface-data-adapter` and `cpt-frontx-dashboard-contract-consuming-backend`. The template ships the interface only. The widget data catalog shares the interface for the data shapes and fill modes that the data adapter must produce, and the dashboard root types share it for the delivery set that a call returns, both marked "shared (data side)". The MFE entries share it for its place in the `dashboard` package, marked "shared (package side)".
  - `cpt-frontx-dashboard-component-widget-library` is owned by `cpt-frontx-dashboard-feature-mfe-entries` for the `widgets` package, its 9 entries, and the shared widget chrome. The widget catalog shares it for the presentation rules of the widget types and the chrome states, marked "shared (presentation side)".
  - `cpt-frontx-dashboard-component-trait-helper` and its interface `cpt-frontx-dashboard-interface-trait-helper` are owned by `cpt-frontx-dashboard-feature-query-vocabulary`, which specifies the contract of effective traits. The MFE entries share both for their place in the `dashboard` package, marked "shared (package side)". The data adapter contract shares the interface for the calls that an implementation may make to it, marked "shared (call side)".
  - `cpt-frontx-dashboard-component-gts-file-loader` is owned by `cpt-frontx-dashboard-feature-mfe-entries`, which holds the template's GTS file and its loader. The extension domain catalog shares it for the step at which each domain owner runs it before any dashboard loads, marked "shared (start side)".
- `cpt-frontx-dashboard-interface-widget-realization` is owned by `cpt-frontx-dashboard-feature-mfe-entries` and shared by `cpt-frontx-dashboard-feature-extension-domain-catalog`, whose creation of generated extensions applies the realization precedence. `cpt-frontx-dashboard-principle-own-registry-registration` is owned by `cpt-frontx-dashboard-feature-extension-domain-catalog`, which specifies where each owner registers. The MFE entries share it for the static extension of the larger-view modal, which the shell's bootstrap registers from the `dashboard` package manifest, because a child cannot register into an ancestor's registry.
- **Delivery rule**: `cpt-frontx-dashboard-feature-dashboard-root-types` owns the content of the delivery set, the order in which the owner registers it, the new-version-id rule, the rule that an unserved query family's dataset type is skipped, and the rule that attributes each validation failure by instance path. `cpt-frontx-dashboard-feature-data-adapter-contract` keeps only the obligation to return the delivery set and cites the rule by feature ID.
- Cross-cutting elements are deliberately shared, because each feature that touches them must comply with them:
  - `cpt-frontx-dashboard-principle-gts-contracts` is listed by all eight features.
  - `cpt-frontx-dashboard-constraint-gts-id-convention` is listed by the seven features whose types, instances, or operations carry GTS identifiers: the query vocabulary, the widget data catalog, the widget catalog, the dashboard root types, the extension domain catalog, the MFE entries, and the data adapter contract.
  - `cpt-frontx-dashboard-principle-per-instance-isolation` is listed by the three features whose parts cross an MFE instance boundary: the widget catalog, the extension domain catalog, and the MFE entries.
  - `cpt-frontx-dashboard-constraint-role-based-host-ids`, `cpt-frontx-dashboard-contract-host-areas`, and `cpt-frontx-dashboard-constraint-one-dashboards-root-per-tree` are owned by `cpt-frontx-dashboard-feature-extension-domain-catalog`, which carries them for the owners, the open chain of the cell widget, and the fixed identifiers of `layout_cells` and `larger_view`. The MFE entries share them as "shared (manifest side)" for the routed extension of the dashboards root and the static extension of the larger-view modal, which are manifest data. The widget catalog lists none of them, because the extension domain catalog carries them for the widget.
  - `cpt-frontx-dashboard-principle-render-only-dashboards-root` is listed by three features: the widget catalog (the widget side), the extension domain catalog (the owners keep no widget data), and the data adapter contract (the data adapter returns what the query asks for).
  - `cpt-frontx-dashboard-principle-dashboards-root-orchestration` is owned by the extension domain catalog and shared by the data adapter contract, which covers the rule that each owner answers every `request_data` through the data adapter.
- The eight runtime DESIGN sequences are owned by `cpt-frontx-dashboard-feature-extension-domain-catalog`, which covers the owner side of each. The other sides are:
  - `cpt-frontx-dashboard-seq-initial-load`: the extension domain catalog covers the owner start (the GTS file loader, the family type schemas that the served-families declaration returns, the `widgets` manifest and every manifest that a registered realization names, with their entries, in the owner's own registry) and the owner side of the load. The widget catalog covers the widget side (loader, first `request_data`) and the data adapter contract the calls and served query families. The MFE entries cover the registration of the template's schemas before any dashboard loads, through the `dashboard` manifest or the shell's bootstrap.
  - `cpt-frontx-dashboard-seq-query-change`: the widget catalog covers the widget side and the data adapter contract the change-query flow.
  - `cpt-frontx-dashboard-seq-widget-modal-open`: the widget catalog covers the widget side (the button runs the chain, with the `popup` domain id resolved by role), the MFE entries cover the static extension and the entry, and the data adapter contract covers the modal's call. The modal's first mount runs the same start steps as the dashboards root.
  - `cpt-frontx-dashboard-seq-larger-view-refresh`: the MFE entries cover the static, routed extension that FrontX restores, and the data adapter contract the call that loads the dashboard again.
  - `cpt-frontx-dashboard-seq-larger-view-close`: the extension domain catalog covers the close button and the modal keeping its loaded dashboard, and the MFE entries cover the modal entry's declarations (lifecycle actions are not listed in `domainActions`). The `unmount_ext` of the occupant by the shell's modal container on a click outside is the shell's prerequisite.
  - `cpt-frontx-dashboard-seq-cannot-show`: each DESIGN item has a named feature side.
    - Dashboard level (item 1): the dashboard root types cover the triggers. The extension domain catalog covers the owner start failure (a domain that the registry rejects), the static placeholder at both levels, the dashboard-area loader, and the diagnostics.
    - Widget level (items 2 and 3): the widget catalog covers the rule that a failed validation or cross-check is a trigger, including a member that names no registered instance. The extension domain catalog covers the outcomes of extension creation (no single winning realization, a rejected registration, a failed mount, a failed `set_widget_context`, a failing leading `unmount_ext` of a larger-view chain) and a requested larger-view widget id that is not in the dashboard, including after a refresh. A load that another load has superseded is discarded, and an answer whose shape differs from the requested one is dropped before `set_data`; that widget keeps its loader. The data adapter contract covers the unserved query family as the adapter-side trigger, including a delivered dataset type of an unserved family that the owner skips.
    - Missing template GTS file (item 4): the MFE entries cover it as "shared (loader side)".
    - Data that never arrives (item 5) is not a cannot-show trigger. The data adapter contract covers the loader-stays case next to the sequence, and item 6 (backend errors, access, the session) belongs to the data adapter implementation.
    - The widget catalog covers the default English wordings of the loader, busy, empty, and cannot-show states.
  - `cpt-frontx-dashboard-seq-theme-switch`: the extension domain catalog covers the owner-chrome side (each owner maps the host theme id to the ui-kit scope for its own chrome). The widget catalog covers the widget side, marked "shared (widget side)": the scope mapping rule, stated once there, and the chart theme. The MFE entries cover the manifest side, marked "shared (manifest side)": each entry requires theme and language.
  - `cpt-frontx-dashboard-seq-teardown`: covered by the extension domain catalog alone.
  - The sequences are runtime behavior of the owners and the widgets. The features cover their contracts, and the code that runs them is outside the domain-model parts.
- **Unassigned elements**, with one reason per ID:
  - `cpt-frontx-dashboard-actor-template-consumer`, `cpt-frontx-dashboard-actor-dashboard-viewer`, `cpt-frontx-dashboard-actor-consuming-backend`, and `cpt-frontx-dashboard-actor-host-application` take part in the use cases and sequences and are not deliverables of a feature.
  - `cpt-frontx-dashboard-design-dashboard-template` is the document that these features decompose, so it has no deliverable of its own.
  - `cpt-frontx-dashboard-seq-consumer-generation` runs in the consuming product, outside the template, so the template has nothing to deliver for it. What it relies on is the set of types delivered by `cpt-frontx-dashboard-feature-dashboard-root-types`, `cpt-frontx-dashboard-feature-layout-types`, `cpt-frontx-dashboard-feature-widget-catalog`, and `cpt-frontx-dashboard-feature-query-vocabulary`, and the served query families that `cpt-frontx-dashboard-feature-data-adapter-contract` specifies.
  - `cpt-frontx-dashboard-tech-frontx-stack` describes the stack layers, which are honored through `cpt-frontx-dashboard-principle-gts-contracts` and the package layers in `cpt-frontx-dashboard-feature-mfe-entries`, and has nothing of its own to deliver.
  - The data adapter implementation is product code: the template ships the interface and no implementation.
- `cpt-frontx-dashboard-fr-backend-source` is covered by the seven features whose types or operations decide what a dashboard shows, how it is checked, and how data reaches it: the query vocabulary, the widget data catalog, the widget catalog, the layout types, the dashboard root types, the extension domain catalog (the owners make no backend call and reach data only through the data adapter), and the data adapter contract. Generation itself belongs to the consuming product.
- `cpt-frontx-dashboard-interface-domain-model` (PRD section 7.1) is shared by all eight features. It is the union of the seven parts. Each domain-model feature owns exactly one of them (DESIGN section 3.1) and lists it under API with the part it delivers. The data adapter contract lists it for the types that its operations carry.
- `cpt-frontx-dashboard-fr-domain-model` is covered by all eight features, each for its own part or for the contract. The following requirements are covered by several features, each for a different part:
  - `cpt-frontx-dashboard-fr-dashboards-root`: the extension domain catalog for the dashboards root's behavior; the MFE entries for its entry, routed extension, and package.
  - `cpt-frontx-dashboard-fr-data-adapter`: the data adapter contract for the interface and the obligations; the extension domain catalog for the owners' calls and answers; the query vocabulary for the query format and derivation rules the data adapter reads, and the trait helper it may call; the widget data catalog for the 5 fill modes and the 8 data shapes.
  - `cpt-frontx-dashboard-fr-widget-catalog`: the widget data catalog for the data shapes; the widget catalog for the 9 widget types; the MFE entries for one entry and one realization per widget type.
  - `cpt-frontx-dashboard-fr-grid-sort-page`: the widget catalog for the grid's presentation fields, paging rules and grid query limits; the MFE entries for the grid shell controls in the `widgets` package; the query vocabulary for the ordering and paging members of the query; the widget data catalog for the `positional_table` shape; the extension domain catalog for the query-change handshake; the data adapter contract for the change-query flow.
  - `cpt-frontx-dashboard-fr-widget-modal`: the layout types for the cell's optional `larger_view` widget; the widget catalog for the larger-view button; the extension domain catalog for the larger-view modal and its domain; the MFE entries for the modal's entry and static extension; the data adapter contract for the modal's calls.
  - `cpt-frontx-dashboard-fr-loading-error-states`: the widget catalog for the widget states and their wordings; the MFE entries for the shared chrome that shows them; the extension domain catalog for the placeholder and the dashboard-area loader; the dashboard root types for the dashboard-level triggers; the data adapter contract for the served-family trigger and the loader-stays case.
  - `cpt-frontx-dashboard-fr-theme`: the extension domain catalog for the theme and language shared properties; the widget catalog for the widget side of the theme switch and the MFE entries for the manifest side.
  - `cpt-frontx-dashboard-fr-replacement-widget`: the extension domain catalog for the realization precedence; the MFE entries for the replacement realization in its own package.
- PRD use cases are covered through the sequences and entries above. `cpt-frontx-dashboard-usecase-view-dashboard` is realized by the eight runtime sequences. `cpt-frontx-dashboard-usecase-provide-dashboard` is covered by `cpt-frontx-dashboard-feature-query-vocabulary`, `cpt-frontx-dashboard-feature-dashboard-root-types`, `cpt-frontx-dashboard-feature-layout-types`, and `cpt-frontx-dashboard-feature-widget-catalog` (the types that a consuming product describes a dataset and a dashboard with), by `cpt-frontx-dashboard-feature-data-adapter-contract` (how the data adapter provides the dashboard and answers the data requests), and by `cpt-frontx-dashboard-feature-mfe-entries` (the replacement realization of its optional replacement step).
- `cpt-frontx-dashboard-topology-overlay-packages` is assigned to `cpt-frontx-dashboard-feature-mfe-entries`, whose entries, realizations, extensions, manifests, and package contents are what each package subtree holds, including a consumer's replacement package.
- `cpt-frontx-dashboard-constraint-sixty-column-grid` is assigned to `cpt-frontx-dashboard-feature-layout-types`, which owns the layout checks. `cpt-frontx-dashboard-constraint-shell-only-dependency` and `cpt-frontx-dashboard-constraint-licensing-compliance-resources` are assigned to `cpt-frontx-dashboard-feature-mfe-entries`, which holds the manifest `shared` lists and the package-wide license check.
- DESIGN section 3.7 defines no database or table, so no feature lists data identifiers.
- ADRs are not feature deliverables. They are traced through DESIGN section 5 to the elements that realize them. The decision `cpt-frontx-dashboard-adr-query-vocabulary-and-datasets` is realized most directly by the query vocabulary feature, and `cpt-frontx-dashboard-adr-data-adapter` by the data adapter contract feature; the template's package and schema-registration decision is `cpt-frontx-dashboard-adr-template-packages-and-host-contract`.

**NFR coverage**: every PRD NFR is covered by at least one feature. A measured NFR counts as covered when a feature declares the contract that enables its measurement; the measurements are the verification approaches of DESIGN sections 1.2 and 3.9.

- `cpt-frontx-dashboard-nfr-accessibility`: the widget catalog (the larger-view button, the grid's sort, paging, page-size, and resize controls, ARIA grid semantics, no meaning by colour alone) and the extension domain catalog (the larger-view modal's close button and keyboard operability).
- `cpt-frontx-dashboard-nfr-visual-quality`: the widget catalog (token-only styling, the scope mapping rule, chart theme, row-colour tokens), the extension domain catalog (each owner maps the host theme id to the ui-kit scope for its own chrome), and the MFE entries (every entry requires theme and language).
- `cpt-frontx-dashboard-nfr-initial-render`: the extension domain catalog (one load, parallel mounts, handlers that resolve on acceptance), the data adapter contract (asynchronous answers, the test data adapter, the fixed-delay reference condition), and the widget catalog (one `request_data` per data widget).
- `cpt-frontx-dashboard-nfr-compatibility`: the MFE entries (the shell-only dependency, role-based identifiers, pinned packages, overlay packages).
- `cpt-frontx-dashboard-nfr-consumer-docs`: the MFE entries (the guide ships with the source), the data adapter contract (the data adapter obligations and conformance), and the query vocabulary (query families, datasets, vocabulary).
- `cpt-frontx-dashboard-nfr-large-table`: the widget catalog (the page limit and paging rules of the `grid` widget type) and the MFE entries (the grid shell).
- `cpt-frontx-dashboard-nfr-bundle-budget`: the MFE entries (the entry set and the per-entry packaging boundary).

**Prerequisites outside the template** (DESIGN section 4): (a) a FrontX version that supports GTS v0.17; (b) a GTS type store shared across the realm; (c) the modal container of the shell's `popup` domain, which keeps keyboard focus inside the larger-view modal and unmounts the occupant with `unmount_ext` on a click outside; and (d) data access for every viewer who may see a dashboard, which the consuming product's data adapter and backend provide. No feature delivers them. The data adapter implementation belongs to the consuming product.

## 2. Entries

**Overall implementation status:**

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-status-overall`

### 2.1 [Query Vocabulary](features/feature-query-vocabulary/FEATURE.md) - MEDIUM

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-feature-query-vocabulary`

- **Purpose**: Declare the closed base query type that every data widget embeds in its `data` field, the measure and dimension bases, and the rules by which a product derives its query families and datasets from them, and the contract of the trait helper that resolves effective traits.

- **Depends On**: None

- **Scope**:
  - The abstract, closed base query type `gts.frontx.dashboard_m.data.query.v1~` with its combined `id`, written in the query format of `cpt-frontx-dashboard-adr-query-vocabulary-and-datasets`: the closed base query type with its subset, filter operators, time forms, time zone rule, and the rules for `order`, `limit`, `offset` and `total`. The base declares `timezone` so the sent query validates, and a widget's `data` forbids it.
  - The query members and the canonical member order of the result columns.
  - The measure base `gts.frontx.dashboard_m.data.measure.v1~` and the dimension base `gts.frontx.dashboard_m.data.dimension.v1~`. A product delivers its measures and dimensions as well-known instances.
  - The rules for deriving a query family from the base and a dataset from a query family, with the narrowing of members by enums and the type traits that carry a backend binding, to which the template gives no meaning.
  - The rules for identifier fields: literal base operands, `x-gts-type-ref` or `x-gts-instance-ref` by kind, and no GTS identifier as an object key.
  - The contract of the trait helper (`cpt-frontx-dashboard-interface-trait-helper`), which this feature owns: it resolves the effective traits of a type along its `$id` chain, registers nothing, validates nothing, and keeps no state.
  - The query families, datasets, and vocabulary as a topic of the consumer guide.

- **Out of scope**:
  - The widget types that limit the form of a query and the cross-checks of a widget (`cpt-frontx-dashboard-feature-widget-catalog`).
  - The data shapes and fill modes that read a query (`cpt-frontx-dashboard-feature-widget-data-catalog`).
  - Which query families a data adapter serves (`cpt-frontx-dashboard-feature-data-adapter-contract`), and the delivery of datasets and vocabulary with a dashboard, including their registration order (`cpt-frontx-dashboard-feature-dashboard-root-types`).
  - The datasets, measures, and dimensions of a product, which belong to the consuming product, and the backend binding that a dataset carries.
  - Dashboard-wide filters and declarative dataset specs (DESIGN section 4, Not covered).

- **Requirements Covered**:

  - [ ] `p1` - `cpt-frontx-dashboard-fr-domain-model`
  - [ ] `p1` - `cpt-frontx-dashboard-fr-backend-source`
  - [ ] `p1` - `cpt-frontx-dashboard-fr-data-adapter`
  - [ ] `p1` - `cpt-frontx-dashboard-fr-grid-sort-page`
  - [ ] `p2` - `cpt-frontx-dashboard-nfr-consumer-docs`

- **Design Principles Covered**:

  - [ ] `p2` - `cpt-frontx-dashboard-principle-gts-contracts`

- **Design Constraints Covered**:

  - [ ] `p1` - `cpt-frontx-dashboard-constraint-gts-id-convention`

- **Domain Model Entities**:
  - Query
  - Query family
  - Dataset
  - Measure, dimension

- **Design Components**:

  - [ ] `p2` - `cpt-frontx-dashboard-component-trait-helper`

- **API**:
  - `cpt-frontx-dashboard-interface-domain-model` (query vocabulary part)
  - `cpt-frontx-dashboard-interface-trait-helper`

- **Sequences**:
  - None

- **Data**:
  - None (DESIGN section 3.7: the template persists nothing)

### 2.2 [Widget Data Catalog](features/feature-widget-data-catalog/FEATURE.md) - MEDIUM

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-feature-widget-data-catalog`

- **Purpose**: Declare the data shapes that a data widget receives in `set_data`, one per data widget type, and the 5 fill modes that tell a data adapter how to fill a shape from a query result.

- **Depends On**: `cpt-frontx-dashboard-feature-query-vocabulary`

- **Scope**:
  - The abstract data shape base `gts.frontx.dashboard_m.widget_data.widget_data.v1~` with `id`, constrained to the literal base operand of the base.
  - The 8 data shapes, one per data widget type, each with its own derived type and its combined instance `id`: the data shape type followed by a UUID that the data adapter generates. A measure value and a dimension value in a data shape may be null.
  - The 5 fill modes with their exact rules.
  - The grid rows as positional arrays in the canonical member order, with `total`, because GTS identifiers are never object keys.
  - The rule that FrontX validates each `set_data` against the exact shape that the data instance's `id` names, so no widget compares shapes.

- **Out of scope**:
  - The query that a fill mode reads, its members, and its canonical member order (`cpt-frontx-dashboard-feature-query-vocabulary`).
  - Which data shape and fill mode a widget type uses: the traits `data_shape` and `fill` of the widget types (`cpt-frontx-dashboard-feature-widget-catalog`).
  - The `request_data` and `set_data` action types that carry a shape (`cpt-frontx-dashboard-feature-extension-domain-catalog`).
  - The calls of the data adapter and its obligations as a whole (`cpt-frontx-dashboard-feature-data-adapter-contract`).
  - Computing the data, which belongs to the consuming product.

- **Requirements Covered**:

  - [ ] `p1` - `cpt-frontx-dashboard-fr-domain-model`
  - [ ] `p1` - `cpt-frontx-dashboard-fr-widget-catalog`
  - [ ] `p1` - `cpt-frontx-dashboard-fr-data-adapter`
  - [ ] `p1` - `cpt-frontx-dashboard-fr-backend-source`
  - [ ] `p1` - `cpt-frontx-dashboard-fr-grid-sort-page`

- **Design Principles Covered**:

  - [ ] `p2` - `cpt-frontx-dashboard-principle-gts-contracts`

- **Design Constraints Covered**:

  - [ ] `p1` - `cpt-frontx-dashboard-constraint-gts-id-convention`

- **Domain Model Entities**:
  - Data shape

- **Design Components**:
  - None (the data shapes are data; the widgets that show them are assigned to `cpt-frontx-dashboard-feature-mfe-entries`, and the data adapter that fills them to `cpt-frontx-dashboard-feature-data-adapter-contract`)

- **API**:
  - `cpt-frontx-dashboard-interface-data-adapter` (shared (data side), owned by `cpt-frontx-dashboard-feature-data-adapter-contract`: the data shapes and fill modes that "run a query" returns)
  - `cpt-frontx-dashboard-interface-domain-model` (data shape part)

- **Sequences**:
  - None

- **Data**:
  - None (DESIGN section 3.7: the template persists nothing)

### 2.3 [Widget Catalog](features/feature-widget-catalog/FEATURE.md) - MEDIUM

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-feature-widget-catalog`

- **Purpose**: Declare the widget base, the abstract data widget with its traits, and the 9 subject-agnostic widget types that every dashboard embeds in its layout cells, with the query limits and presentation fields of each type, the cross-checks of a widget, and the rendering rules of the shared chrome.

- **Depends On**: `cpt-frontx-dashboard-feature-widget-data-catalog`, `cpt-frontx-dashboard-feature-query-vocabulary`

- **Scope**:
  - The abstract widget base `gts.frontx.dashboard_m.widget.widget.v1~` with the combined instance `id` and `title`, and no traits.
  - The abstract data widget, derived from the base, with the required `data` field typed by the query base and the traits `data_shape`, `fill`, and `member_kinds`.
  - The 9 widget types, each ending with `unevaluatedProperties: false`: 8 data widget types with their query limits, traits, and presentation fields, and `markdown_card` with no `data` and no traits.
  - The per-type query limits: the limits on `timeDimensions`, `compareDateRange` on `metric_card` only, `total` on `grid` only, and no `timezone` in `data`.
  - The multi-measure rules and the metric trend.
  - The grid's presentation fields, paging rules and per-type query limits.
  - A data widget sets `timezone` to the viewer's time zone in the query it sends.
  - The cross-checks that JSON Schema cannot express: a member that names no registered instance, the order members, the operator-kind check of each filter, date pairs (start not after end, and real calendar values), filter value content (numbers for `gt`, `gte`, `lt` and `lte`; dates or allowed relative strings for date operators), the time dimension is time-valued, the grid cross-checks, and the member-kind check.
  - The rendering rule of `markdown_card`.
  - The empty and gap states of null values.
  - The shared widget chrome: the title, the loader, the busy indicator, the empty state, and the larger-view button, shown only in a cell widget whose context carries `larger_view`. The button runs the open chain, with the `popup` domain id resolved by role.
  - The default English wordings of the loader, busy, empty, and cannot-show states.
  - The widget side of a query change: the local copy of the query, the new `request_data`, and the latest-answer rule. A data widget sends one `request_data` after its context.
  - The rule that a widget which fails validation or a cross-check is a cannot-show trigger for its cell or larger view.
  - Theme: the scope mapping rule, stated here once for every template MFE (the host theme id maps to the light or dark ui-kit scope); chart widgets rebuild and re-register their chart theme from kit tokens on each change, and nothing is requested or remounted. All styling is token-only, and grid row colours are kit tokens.
  - Accessibility of the chrome and the grid: the larger-view button, the grid's sort, paging, page-size, and resize controls operable by keyboard, ARIA grid semantics for virtualized rows, and no meaning by colour alone.

- **Out of scope**:
  - Any field for client-side sorting, grouping, filtering, display limits, or drill-down (PRD section 4.2).
  - Consumer widget types and consumer widget settings, which DESIGN section 4 lists under Not covered. Replacing how a widget type is shown is a replacement realization (`cpt-frontx-dashboard-feature-mfe-entries`).
  - The data shapes and fill modes that the traits name (`cpt-frontx-dashboard-feature-widget-data-catalog`) and the query vocabulary that `data` is typed by (`cpt-frontx-dashboard-feature-query-vocabulary`).
  - The widget entries, their manifests, and the shared chrome's package (`cpt-frontx-dashboard-feature-mfe-entries`).
  - The display of the placeholder, the action types, and the processes by which a domain owner validates, mounts, and answers (`cpt-frontx-dashboard-feature-extension-domain-catalog`). The wording of the placeholder is the widget catalog's.
  - The shell identifiers of the open chain: `cpt-frontx-dashboard-constraint-role-based-host-ids` and `cpt-frontx-dashboard-contract-host-areas` are carried for the widget by `cpt-frontx-dashboard-feature-extension-domain-catalog`.
  - Generating dashboards, which belongs to the consuming product.

- **Requirements Covered**:

  - [ ] `p1` - `cpt-frontx-dashboard-fr-widget-catalog`
  - [ ] `p1` - `cpt-frontx-dashboard-fr-domain-model`
  - [ ] `p1` - `cpt-frontx-dashboard-fr-grid-sort-page`
  - [ ] `p1` - `cpt-frontx-dashboard-fr-widget-modal`
  - [ ] `p1` - `cpt-frontx-dashboard-fr-backend-source`
  - [ ] `p1` - `cpt-frontx-dashboard-fr-loading-error-states`
  - [ ] `p1` - `cpt-frontx-dashboard-fr-theme`
  - [ ] `p1` - `cpt-frontx-dashboard-nfr-visual-quality`
  - [ ] `p1` - `cpt-frontx-dashboard-nfr-initial-render`
  - [ ] `p2` - `cpt-frontx-dashboard-nfr-large-table`
  - [ ] `p2` - `cpt-frontx-dashboard-nfr-accessibility`

- **Design Principles Covered**:

  - [ ] `p1` - `cpt-frontx-dashboard-principle-render-only-dashboards-root`
  - [ ] `p2` - `cpt-frontx-dashboard-principle-gts-contracts`
  - [ ] `p1` - `cpt-frontx-dashboard-principle-per-instance-isolation`

- **Design Constraints Covered**:

  - [ ] `p1` - `cpt-frontx-dashboard-constraint-gts-id-convention`

- **Domain Model Entities**:
  - Widget
  - Data widget
  - Widget type

- **Design Components**:

  - [ ] `p1` - `cpt-frontx-dashboard-component-widget-library` (shared (presentation side), owned by `cpt-frontx-dashboard-feature-mfe-entries`: the presentation rules of the widget types and the chrome states; the package, the entries, and the code stay with the owner)

- **API**:
  - `cpt-frontx-dashboard-interface-domain-model` (widget part; each widget instance is embedded in a layout cell of the dashboard)

- **Sequences**:

  - [ ] `p1` - `cpt-frontx-dashboard-seq-initial-load` (shared (widget side), owned by `cpt-frontx-dashboard-feature-extension-domain-catalog`: the loader and the first `request_data`)
  - [ ] `p1` - `cpt-frontx-dashboard-seq-query-change` (shared (widget side), owned by `cpt-frontx-dashboard-feature-extension-domain-catalog`: the local copy of the query, the busy indicator, and the latest-answer rule)
  - [ ] `p1` - `cpt-frontx-dashboard-seq-widget-modal-open` (shared (widget side), owned by `cpt-frontx-dashboard-feature-extension-domain-catalog`: the larger-view button that runs the chain)
  - [ ] `p1` - `cpt-frontx-dashboard-seq-cannot-show` (shared (widget side), owned by `cpt-frontx-dashboard-feature-extension-domain-catalog`: the widget-level trigger rule and the wordings)
  - [ ] `p2` - `cpt-frontx-dashboard-seq-theme-switch` (shared (widget side), owned by `cpt-frontx-dashboard-feature-extension-domain-catalog`: scope mapping rule and chart theme)

- **Data**:
  - None (DESIGN section 3.7: the template persists nothing)

### 2.4 [Layout Types](features/feature-layout-types/FEATURE.md) - MEDIUM

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-feature-layout-types`

- **Purpose**: Declare the 60-column Layout and the LayoutCell, the embedded object types that together fully define how a dashboard composes its widgets, and state the layout checks that a valid layout passes.

- **Depends On**: `cpt-frontx-dashboard-feature-widget-catalog`

- **Scope**:
  - `gts.frontx.dashboard_m.layout.layout.v1~`, an embedded object type with no own identifier, with `columns` fixed at 60 and an ordered list of cells.
  - `gts.frontx.dashboard_m.layout.cell.v1~`, an embedded object type with bounded `x`, `y`, `w`, `h`, one embedded `widget`, and an optional embedded `larger_view` widget. Each is checked against the widget base and resolved to the widget type that its `id` names.
  - The layout checks and their order: the coordinate bounds, overlap of cells, `x + w` above 60, and a repeated widget id across cell and larger-view widgets. The failure trigger of a layout check stays with `cpt-frontx-dashboard-feature-dashboard-root-types` (dashboard-level triggers).
  - The placement rule: how a cell takes its place on the 60-column grid from its `x`, `y`, `w`, and `h`.

- **Out of scope**:
  - Running the layout checks when a dashboard loads and showing the placeholder, which belong to the domain owners (`cpt-frontx-dashboard-feature-extension-domain-catalog`).
  - Widget data, which the cell does not carry, and widget queries, which the widget carries (`cpt-frontx-dashboard-feature-widget-catalog`).
  - A separately stored or referenced layout instance, which does not exist.

- **Requirements Covered**:

  - [ ] `p1` - `cpt-frontx-dashboard-fr-domain-model`
  - [ ] `p1` - `cpt-frontx-dashboard-fr-backend-source`
  - [ ] `p1` - `cpt-frontx-dashboard-fr-widget-modal`

- **Design Principles Covered**:

  - [ ] `p2` - `cpt-frontx-dashboard-principle-gts-contracts`

- **Design Constraints Covered**:

  - [ ] `p2` - `cpt-frontx-dashboard-constraint-sixty-column-grid`

- **Domain Model Entities**:
  - Layout
  - Layout cell

- **Design Components**:
  - None (the layout types are data; the dashboards root that lays them out is assigned to `cpt-frontx-dashboard-feature-extension-domain-catalog`)

- **API**:
  - `cpt-frontx-dashboard-interface-domain-model` (layout part; the layout is embedded in the dashboard, assigned to `cpt-frontx-dashboard-feature-dashboard-root-types`)

- **Sequences**:
  - None

- **Data**:
  - None (DESIGN section 3.7: the template persists nothing)

### 2.5 [Dashboard Root Types](features/feature-dashboard-root-types/FEATURE.md) - MEDIUM

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-feature-dashboard-root-types`

- **Purpose**: Declare the Dashboard root of every dashboard, the instance that the data adapter returns for one dashboard id, together with the rules for what is delivered with it and when the whole dashboard cannot be shown.

- **Depends On**: `cpt-frontx-dashboard-feature-layout-types`, `cpt-frontx-dashboard-feature-query-vocabulary`

- **Scope**:
  - `gts.frontx.dashboard_m.dashboard.dashboard.v1~` with only the combined instance `id` (constrained to the literal base operand), `name`, an optional `description`, and the embedded `layout`, and no theme reference.
  - The validation of the root fields: one GTS validation of the dashboard against the type that its `id` names, with each failure attributed by its instance path to a cell, a larger view or the whole dashboard; the checks beyond GTS validation are the listed layout and widget cross-checks.
  - The delivery rule, owned here: the content of the delivery set (the dataset types and the measure and dimension instances that the dashboard's queries use), the order in which the owner registers it (the measure and dimension instances before the dataset types), and the new-version-id rule for new content.
  - The skip rule, owned here: a delivered dataset type of a query family the data adapter does not serve is skipped, not registered, and is a widget-level case.
  - The dashboard-level cannot-show triggers: an invalid root, a failed layout check, and delivered types that cannot be registered.

- **Out of scope**:
  - A report type and any visibility, publication, sharing, or audience field (PRD section 4.2).
  - Any theme type or theme instance: the theme is the host's theme shared property, published on the template's domains (`cpt-frontx-dashboard-feature-extension-domain-catalog`).
  - Widget settings added by a consuming product, which the template does not allow.
  - The obligation of the data adapter to return the delivery set (`cpt-frontx-dashboard-feature-data-adapter-contract`) and the placeholder that shows a trigger (`cpt-frontx-dashboard-feature-extension-domain-catalog`).

- **Requirements Covered**:

  - [ ] `p1` - `cpt-frontx-dashboard-fr-domain-model`
  - [ ] `p1` - `cpt-frontx-dashboard-fr-backend-source`
  - [ ] `p1` - `cpt-frontx-dashboard-fr-loading-error-states`

- **Design Principles Covered**:

  - [ ] `p2` - `cpt-frontx-dashboard-principle-gts-contracts`

- **Design Constraints Covered**:

  - [ ] `p1` - `cpt-frontx-dashboard-constraint-gts-id-convention`

- **Domain Model Entities**:
  - Dashboard

- **Design Components**:
  - None (the root type is data; its consumers are assigned to `cpt-frontx-dashboard-feature-extension-domain-catalog` and `cpt-frontx-dashboard-feature-data-adapter-contract`)

- **API**:
  - `cpt-frontx-dashboard-interface-data-adapter` (shared (data side), owned by `cpt-frontx-dashboard-feature-data-adapter-contract`: the delivery set that "get a dashboard" returns)
  - `cpt-frontx-dashboard-interface-domain-model` (dashboard root part)

- **Sequences**:

  - [ ] `p1` - `cpt-frontx-dashboard-seq-cannot-show` (shared (dashboard-level side), owned by `cpt-frontx-dashboard-feature-extension-domain-catalog`: the triggers that replace the whole dashboard with the placeholder)

- **Data**:
  - None (DESIGN section 3.7: the template persists nothing)

### 2.6 [Extension Domain Catalog](features/feature-extension-domain-catalog/FEATURE.md) - MEDIUM

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-feature-extension-domain-catalog`

- **Purpose**: Declare the template's runtime contracts between the domain owners and the widgets, the 4 template actions and the 2 domains `layout_cells` and `larger_view` with their extension types, and specify how the dashboards root and the larger-view modal load a dashboard, register generated extensions, answer data requests, and tear down.

- **Depends On**: `cpt-frontx-dashboard-feature-dashboard-root-types`, `cpt-frontx-dashboard-feature-widget-catalog`, `cpt-frontx-dashboard-feature-widget-data-catalog`, `cpt-frontx-dashboard-feature-query-vocabulary`

- **Scope**:
  - The 4 template actions with their closed payloads, which carry no widget data and no backend detail.
  - The `layout_cells` domain (Concurrent) and the `larger_view` domain (Optional) with their declarations and the extension type of each. Each domain lists `request_data` in its actions, and its handler is registered when the domain is built.
  - The rule that a handler of `request_data` or `show_larger_view` resolves on acceptance, and that `set_data` is always an own chain of the owner.
  - The generated-extension identifier rule.
  - The owner start: each domain owner registers its domain, runs the GTS file loader, registers the family type schemas that the data adapter's served-families declaration returns, and registers the `widgets` manifest and every manifest whose entries a registered realization names, consumer packages included, with their entries, in its own registry (the dashboards root as a screen extension, and the larger-view modal). A domain that the registry rejects ends the start with the dashboard-level placeholder. As shell code, the dashboards root relies on the entries that the shell's bootstrap registered.
  - The owner's load of a dashboard: the call to "get a dashboard", registration of the delivered types applying the delivery and attribution rules of dashboard root types, one GTS validation of the dashboard, the layout checks, the per-widget member-kind checks, cross-checks and served-family check, then creation of the generated extensions; a load that another load has superseded is discarded; the rules themselves stay with the features that define them.
  - The realization precedence applied when the owner creates extensions: the highest weight wins; a tie or no realization gives the cell or larger-view cannot-show.
  - The process by which a domain owner registers generated extensions in its own registry, only when a dashboard loads, and unregisters them.
  - The process by which a domain owner answers a data request: it accepts `request_data`, calls "run a query" on the data adapter with the request unchanged, checks the answered data against the widget's data shape and drops a mismatched answer before `set_data` (the widget keeps its loader), and otherwise sends `set_data` to `reply_to`. The owners keep no widget data and make no backend call.
  - The dashboard-area loader, the static "cannot be shown" placeholder at both levels, and the diagnostics.
  - The cannot-show outcomes of extension creation, each limited to one cell or larger view: no single winning realization, a rejected registration, a failed mount, a failed `set_widget_context`, or a failing leading `unmount_ext` of a larger-view chain; the owner places the placeholder for the widget-level triggers that the widget catalog defines, and for a requested larger-view widget id that is not in the dashboard, including after a refresh.
  - The larger-view modal as a domain owner: the `show_larger_view` handler with the two ids kept in the modal's own subroute, the load of the dashboard when it has not loaded that one, the chain that shows the requested larger-view extension, the restoration after a refresh, the modal's close button, and the modal keeping its loaded dashboard when closed. Its first mount runs the owner start.
  - The chain of the cell widget that opens the larger view: `mount_ext` of the larger-view modal in the shell's `popup` domain, then `show_larger_view`. Both `mount_ext` and `unmount_ext` of the larger-view modal carry `history: "none"`.
  - The theme and language shared properties of both domains, published unchanged, and read again and republished on every mount, so a theme switch is a shared-property change with no request. Each owner maps the host theme id to the ui-kit scope for its own chrome, which is the owner-chrome side of `cpt-frontx-dashboard-seq-theme-switch`.
  - Accessibility of the larger-view modal: the close button and its keyboard operability.
  - The teardown: `unmount_ext` of every cell on leaving the dashboard; a mount of the dashboards root whose dashboard is already loaded mounts its cells again without loading it.
  - The load path that enables the initial-render measurement: one dashboard load, parallel mounts, and handlers that resolve on acceptance.

- **Out of scope**:
  - The realization type, its fields and package placement stay with the MFE entries (`cpt-frontx-dashboard-feature-mfe-entries`), as do the realizations, the entries, the static and routed extensions, and the package contents.
  - The `popup` domain, its lifecycle actions, and its modal container: the shell implements the domain, and the container is a `template-shell` prerequisite (DESIGN section 4). The `unmount_ext` of the occupant by the container on a click outside, a FrontX version that supports GTS v0.17, and a GTS type store shared across the realm are prerequisites of the same kind.
  - What a widget's larger view shows, which belongs to the widget type.
  - The operations, errors, and access rules of the data adapter (`cpt-frontx-dashboard-feature-data-adapter-contract`).
  - The widget types, their checks, the chrome states, and their wordings (`cpt-frontx-dashboard-feature-widget-catalog`).

- **Requirements Covered**:

  - [ ] `p1` - `cpt-frontx-dashboard-fr-domain-model`
  - [ ] `p1` - `cpt-frontx-dashboard-fr-dashboards-root`
  - [ ] `p1` - `cpt-frontx-dashboard-fr-widget-modal`
  - [ ] `p1` - `cpt-frontx-dashboard-fr-theme`
  - [ ] `p1` - `cpt-frontx-dashboard-fr-loading-error-states`
  - [ ] `p1` - `cpt-frontx-dashboard-fr-grid-sort-page`
  - [ ] `p1` - `cpt-frontx-dashboard-fr-data-adapter`
  - [ ] `p1` - `cpt-frontx-dashboard-fr-backend-source`
  - [ ] `p1` - `cpt-frontx-dashboard-nfr-initial-render`
  - [ ] `p1` - `cpt-frontx-dashboard-nfr-visual-quality`
  - [ ] `p2` - `cpt-frontx-dashboard-nfr-accessibility`
  - [ ] `p2` - `cpt-frontx-dashboard-fr-replacement-widget`

- **Design Principles Covered**:

  - [ ] `p1` - `cpt-frontx-dashboard-principle-own-registry-registration`
  - [ ] `p1` - `cpt-frontx-dashboard-principle-dashboards-root-orchestration`
  - [ ] `p1` - `cpt-frontx-dashboard-principle-render-only-dashboards-root`
  - [ ] `p2` - `cpt-frontx-dashboard-principle-gts-contracts`
  - [ ] `p1` - `cpt-frontx-dashboard-principle-per-instance-isolation`

- **Design Constraints Covered**:

  - [ ] `p1` - `cpt-frontx-dashboard-constraint-gts-id-convention`
  - [ ] `p1` - `cpt-frontx-dashboard-constraint-role-based-host-ids`
  - [ ] `p2` - `cpt-frontx-dashboard-constraint-one-dashboards-root-per-tree`

- **Domain Model Entities**:
  - Template actions
  - Domains and extension types

- **Design Components**:

  - [ ] `p1` - `cpt-frontx-dashboard-component-dashboards-root`
  - [ ] `p1` - `cpt-frontx-dashboard-component-larger-view-modal`
  - [ ] `p2` - `cpt-frontx-dashboard-component-gts-file-loader` (shared (start side), owned by `cpt-frontx-dashboard-feature-mfe-entries`: the step at which each domain owner runs the loader before any dashboard loads)

- **API**:
  - `cpt-frontx-dashboard-interface-host-actions`
  - `cpt-frontx-dashboard-interface-template-domains`
  - `cpt-frontx-dashboard-interface-widget-realization` (shared, owned by `cpt-frontx-dashboard-feature-mfe-entries`: the realization precedence used when the generated extensions are created)
  - `cpt-frontx-dashboard-contract-host-areas` (the `popup` domain by role, as the target of the cell widget's chain)
  - `cpt-frontx-dashboard-interface-domain-model` (action and domain part)

- **Sequences**:

  - [ ] `p1` - `cpt-frontx-dashboard-seq-initial-load`
  - [ ] `p1` - `cpt-frontx-dashboard-seq-query-change`
  - [ ] `p1` - `cpt-frontx-dashboard-seq-widget-modal-open`
  - [ ] `p2` - `cpt-frontx-dashboard-seq-larger-view-refresh`
  - [ ] `p2` - `cpt-frontx-dashboard-seq-larger-view-close`
  - [ ] `p1` - `cpt-frontx-dashboard-seq-cannot-show`
  - [ ] `p2` - `cpt-frontx-dashboard-seq-theme-switch`
  - [ ] `p2` - `cpt-frontx-dashboard-seq-teardown`

- **Data**:
  - None (DESIGN section 3.7: the template persists nothing)

### 2.7 [MFE Entries](features/feature-mfe-entries/FEATURE.md) - MEDIUM

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-feature-mfe-entries`

- **Purpose**: Declare the widget realization type and the realizations, entries, static and routed extensions, manifests, and package contents through which the 9 widget types and the larger view are loaded and shown, in the packages `dashboard` and `widgets`.

- **Depends On**: `cpt-frontx-dashboard-feature-extension-domain-catalog`, `cpt-frontx-dashboard-feature-widget-catalog`

- **Scope**:
  - The widget realization type `gts.frontx.dashboard_v.mfe.widget_realization.v1~` with `id`, `widget_type`, `entry`, the optional `larger_view_entry`, and `weight` with default 1.
  - The template's GTS file, with the 9 template widget realizations of weight 1, one per widget type, and the loader that each domain owner runs to register them. A failure to fetch the file means no realization wins, which is the widget-level cannot-show state ("shared (loader side)" of `cpt-frontx-dashboard-seq-cannot-show`).
  - The `widgets` manifest with 9 entries, one per widget type, all plain instances of the FrontX MFE entry type, each requiring theme and language, with their `actions` and `domainActions`, admitted to both `layout_cells` and `larger_view`.
  - The `dashboard` manifest with the larger-view modal's entry and its static, routed extension of the shell's `popup` domain with a fixed identifier, registered by the shell's bootstrap.
  - The entry and the routed extension of the dashboards root in the shell screen domain, for a product whose dashboards root is a screen extension.
  - The registration of the template's schemas (types, action types, and extension types; each owner registers its own domain instance) before any dashboard loads: through the `dashboard` manifest when the dashboards root is a screen extension, and through the shell's bootstrap when it is shell code (`cpt-frontx-dashboard-adr-template-packages-and-host-contract`).
  - The package contents: the `dashboard` package holds the types, the template's GTS file, the code of the two owners, the data adapter interface, the trait helper, the GTS file loader, and the cannot-show placeholder, and no data adapter implementation. This feature only packages the trait helper, whose contract belongs to `cpt-frontx-dashboard-feature-query-vocabulary`; its signature belongs to the product-supplied implementations class of DESIGN section 3.3 because product data adapter code calls it, and its changes are listed in the release notes. The `widgets` package holds the manifest, the 9 entries, and the shared widget chrome with the grid shell.
  - The widget runtime: action handlers registered before `mount` resolves, application of `set_data`, value formatting and wording localized for the host language.
  - The shared widget chrome and grid shell that realize the presentation rules of the widget catalog: the chrome states, the grid's sort, paging, page-size, and resize controls, and virtualized rows of a page.
  - The isolation and packaging notes per entry: every MFE lists its packages in the `shared` array of its manifest, with the budget figures that the entry set enables, and the package-wide check that every listed third-party runtime library carries a permissive license.
  - Compatibility: the shell-only dependency, role-based identifiers in code and in manifests, FrontX packages pinned to exact published versions, and the overlay package subtrees.
  - The consumer guide that ships with the source.
  - The rule that template changes reach a product's copy by merging a template release. The release notes list the contract changes: the query format, the data shapes, the fill modes, the data adapter interface, and the trait helper.
  - The packaging of a consumer replacement realization in its own package, with its own entry, and a weight above 1.

- **Out of scope**:
  - The widget types themselves (`cpt-frontx-dashboard-feature-widget-catalog`).
  - Picking the winning realization, registering the generated extensions, and mounting them (`cpt-frontx-dashboard-feature-extension-domain-catalog`).
  - The behavior of the data adapter and its implementation (`cpt-frontx-dashboard-feature-data-adapter-contract`).
  - A template entry type or any field added to entries: entries stay plain FrontX entries.
  - Consumer widget types, which DESIGN section 4 lists under Not covered.
  - A FrontX version that supports GTS v0.17 and a GTS type store shared across the realm, which are prerequisites outside the template (DESIGN section 4), and the shell's modal container for the `popup` domain.

- **Requirements Covered**:

  - [ ] `p1` - `cpt-frontx-dashboard-fr-widget-catalog`
  - [ ] `p1` - `cpt-frontx-dashboard-fr-domain-model`
  - [ ] `p1` - `cpt-frontx-dashboard-fr-dashboards-root`
  - [ ] `p1` - `cpt-frontx-dashboard-fr-widget-modal`
  - [ ] `p1` - `cpt-frontx-dashboard-fr-theme`
  - [ ] `p1` - `cpt-frontx-dashboard-fr-loading-error-states`
  - [ ] `p1` - `cpt-frontx-dashboard-fr-grid-sort-page`
  - [ ] `p2` - `cpt-frontx-dashboard-fr-replacement-widget`
  - [ ] `p1` - `cpt-frontx-dashboard-nfr-visual-quality`
  - [ ] `p1` - `cpt-frontx-dashboard-nfr-compatibility`
  - [ ] `p2` - `cpt-frontx-dashboard-nfr-large-table`
  - [ ] `p2` - `cpt-frontx-dashboard-nfr-consumer-docs`
  - [ ] `p3` - `cpt-frontx-dashboard-nfr-bundle-budget`

- **Design Principles Covered**:

  - [ ] `p1` - `cpt-frontx-dashboard-principle-per-instance-isolation`
  - [ ] `p1` - `cpt-frontx-dashboard-principle-own-registry-registration` (shared, owned by `cpt-frontx-dashboard-feature-extension-domain-catalog`: the static extension of the larger-view modal, which the shell's bootstrap registers because a child cannot register into an ancestor's registry)
  - [ ] `p2` - `cpt-frontx-dashboard-principle-gts-contracts`

- **Design Constraints Covered**:

  - [ ] `p1` - `cpt-frontx-dashboard-constraint-gts-id-convention`
  - [ ] `p1` - `cpt-frontx-dashboard-constraint-role-based-host-ids` (shared (manifest side), owned by `cpt-frontx-dashboard-feature-extension-domain-catalog`)
  - [ ] `p1` - `cpt-frontx-dashboard-constraint-shell-only-dependency`
  - [ ] `p2` - `cpt-frontx-dashboard-constraint-one-dashboards-root-per-tree` (shared (manifest side), owned by `cpt-frontx-dashboard-feature-extension-domain-catalog`: the fixed identifier of the larger-view modal's extension)
  - [ ] `p2` - `cpt-frontx-dashboard-constraint-licensing-compliance-resources`

- **Domain Model Entities**:
  - Widget realization

- **Design Components**:

  - [ ] `p1` - `cpt-frontx-dashboard-component-widget-library`
  - [ ] `p1` - `cpt-frontx-dashboard-component-dashboards-root` (shared (entry side), owned by `cpt-frontx-dashboard-feature-extension-domain-catalog`: its entry, routed extension, manifest, and package contents)
  - [ ] `p1` - `cpt-frontx-dashboard-component-larger-view-modal` (shared (entry side), owned by `cpt-frontx-dashboard-feature-extension-domain-catalog`: its entry, static extension, manifest, and package contents)
  - [ ] `p2` - `cpt-frontx-dashboard-component-gts-file-loader`
  - [ ] `p2` - `cpt-frontx-dashboard-component-trait-helper` (shared (package side), owned by `cpt-frontx-dashboard-feature-query-vocabulary`: its place in the `dashboard` package)
  - [ ] `p2` - `cpt-frontx-dashboard-topology-overlay-packages` (the `dashboard` and `widgets` package subtrees, and a consumer's replacement package, that hold the entries, realizations, extensions, manifests, and code)

- **API**:
  - `cpt-frontx-dashboard-interface-widget-realization` (the realization type, the template realizations, and the entries)
  - `cpt-frontx-dashboard-interface-data-adapter` (shared (package side), owned by `cpt-frontx-dashboard-feature-data-adapter-contract`: its place in the `dashboard` package)
  - `cpt-frontx-dashboard-interface-trait-helper` (shared (package side), owned by `cpt-frontx-dashboard-feature-query-vocabulary`: its place in the `dashboard` package)
  - `cpt-frontx-dashboard-interface-host-actions` (shared (admission side), owned by `cpt-frontx-dashboard-feature-extension-domain-catalog`: the `actions` and `domainActions` of the entries)
  - `cpt-frontx-dashboard-interface-template-domains` (shared (admission side), owned by `cpt-frontx-dashboard-feature-extension-domain-catalog`: the admission of the entries to both domains)
  - `cpt-frontx-dashboard-contract-host-areas` (shared (manifest side), owned by `cpt-frontx-dashboard-feature-extension-domain-catalog`: the shell screen domain of the routed extension and the `popup` domain of the static extension, by role)
  - `cpt-frontx-dashboard-interface-domain-model` (realization and entry part; entries, realizations, and extensions reach the registries through the manifest channel and the template's GTS file, DESIGN section 3.5)

- **Sequences**:

  - [ ] `p1` - `cpt-frontx-dashboard-seq-initial-load` (shared (registration side), owned by `cpt-frontx-dashboard-feature-extension-domain-catalog`: the registration of the template's schemas before any dashboard loads)
  - [ ] `p1` - `cpt-frontx-dashboard-seq-widget-modal-open` (shared (entry side), owned by `cpt-frontx-dashboard-feature-extension-domain-catalog`: the static extension and the entry of the larger-view modal that the chain mounts, and the optional `larger_view_entry`)
  - [ ] `p2` - `cpt-frontx-dashboard-seq-larger-view-refresh` (shared (entry side), owned by `cpt-frontx-dashboard-feature-extension-domain-catalog`: the static, routed extension that FrontX restores after a refresh)
  - [ ] `p2` - `cpt-frontx-dashboard-seq-larger-view-close` (shared (entry side), owned by `cpt-frontx-dashboard-feature-extension-domain-catalog`: the larger-view modal's entry and its declarations)
  - [ ] `p1` - `cpt-frontx-dashboard-seq-cannot-show` (shared (loader side), owned by `cpt-frontx-dashboard-feature-extension-domain-catalog`: the failure to fetch the template's GTS file, after which no realization wins)
  - [ ] `p2` - `cpt-frontx-dashboard-seq-theme-switch` (shared (manifest side), owned by `cpt-frontx-dashboard-feature-extension-domain-catalog`: each entry requires theme and language)

- **Data**:
  - None (DESIGN section 3.7: the template persists nothing)

### 2.8 [Data Adapter Contract](features/feature-data-adapter-contract/FEATURE.md) - MEDIUM

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-feature-data-adapter-contract`

- **Purpose**: Specify exactly what the template requires from the data adapter that the consuming product implements, with conformance cases: the operations "get a dashboard" and "run a query", the served query families, the fill-mode obligations, the return of the delivery set, the data adapter results that lead to a cannot-show state, and the data that never arrives.

- **Depends On**: `cpt-frontx-dashboard-feature-dashboard-root-types`, `cpt-frontx-dashboard-feature-extension-domain-catalog`, `cpt-frontx-dashboard-feature-widget-data-catalog`, `cpt-frontx-dashboard-feature-query-vocabulary`

- **Scope**:
  - The data adapter interface in the `dashboard` package: "get a dashboard", "run a query", and the declaration of the query families it serves, read at start, which returns the type schemas of those families.
  - The obligations of an implementation in DESIGN section 3.3: the five fill modes, return of the delivery set under the rule of `cpt-frontx-dashboard-feature-dashboard-root-types`, member mapping and `timezone` pass-through, default order and complete results, local execution limits, new query families as data adapter work, registry access, or a trait helper bound to it, per owner runtime, and an answer to every call.
  - The data adapter results and their outcome: an unserved query family is the adapter-side cannot-show trigger at widget level. This feature keeps only the trigger side, the declaring of served families; the skip rule belongs to `cpt-frontx-dashboard-feature-dashboard-root-types`. Only the widgets whose data uses it show cannot-show.
  - Data that never arrives is not a cannot-show trigger: the dashboard area or the widget keeps its loader, with no error message and no timeout, as a stated limitation and risk.
  - The asynchronous answer and the consistency rule: each data instance is an independent snapshot, and the owner keeps answering other widgets while one waits.
  - The actor flows "open a dashboard" and "change a query", and the conformance cases, one per point above.
  - The test data adapter that names no backend, with the fixed-delay reference condition. It is test tooling outside the shipped `dashboard` package (DESIGN section 3.9).
  - The data adapter obligations and the conformance cases as a topic of the consumer guide.

- **Out of scope**:
  - Access to dashboards and data, backend errors, and the session, which belong to the consuming product.
  - The implementation of the data adapter, which is product code and belongs to no feature.
  - The shapes of the dashboard, the query, and the data, and the content and registration order of the delivery set (`cpt-frontx-dashboard-feature-dashboard-root-types`, `cpt-frontx-dashboard-feature-query-vocabulary`, and `cpt-frontx-dashboard-feature-widget-data-catalog`); the fill-mode rules (`cpt-frontx-dashboard-feature-widget-data-catalog`).
  - The traits `data_shape` and `fill` of the widget types (`cpt-frontx-dashboard-feature-widget-catalog`).
  - The processes by which the owners call the data adapter, register generated extensions, and show the placeholder (`cpt-frontx-dashboard-feature-extension-domain-catalog`).
  - The checks that a consuming product runs before it serves a dashboard and the generation of dashboards, which belong to the consuming product.
  - Limits, and dashboard and data size, which belong to the consuming product.
  - Versioning of the data adapter interface and the trait helper signature it calls beyond the stability classes of DESIGN section 3.3.

- **Requirements Covered**:

  - [ ] `p1` - `cpt-frontx-dashboard-fr-data-adapter`
  - [ ] `p1` - `cpt-frontx-dashboard-fr-backend-source`
  - [ ] `p1` - `cpt-frontx-dashboard-fr-loading-error-states`
  - [ ] `p1` - `cpt-frontx-dashboard-fr-domain-model`
  - [ ] `p1` - `cpt-frontx-dashboard-fr-widget-modal`
  - [ ] `p1` - `cpt-frontx-dashboard-fr-grid-sort-page`
  - [ ] `p1` - `cpt-frontx-dashboard-nfr-initial-render`
  - [ ] `p2` - `cpt-frontx-dashboard-nfr-consumer-docs`

- **Design Principles Covered**:

  - [ ] `p1` - `cpt-frontx-dashboard-principle-render-only-dashboards-root`
  - [ ] `p1` - `cpt-frontx-dashboard-principle-dashboards-root-orchestration` (shared, owned by `cpt-frontx-dashboard-feature-extension-domain-catalog`: each owner answers every `request_data` through the data adapter)
  - [ ] `p2` - `cpt-frontx-dashboard-principle-gts-contracts`

- **Design Constraints Covered**:

  - [ ] `p1` - `cpt-frontx-dashboard-constraint-gts-id-convention`

- **Domain Model Entities**:
  - Dashboard (shared (data side), owned by `cpt-frontx-dashboard-feature-dashboard-root-types`: as returned by "get a dashboard")
  - Query (shared (data side), owned by `cpt-frontx-dashboard-feature-query-vocabulary`: as carried by "run a query")
  - Data shape (shared (data side), owned by `cpt-frontx-dashboard-feature-widget-data-catalog`: as returned by "run a query")

- **Design Components**:

  - [ ] `p1` - `cpt-frontx-dashboard-component-data-adapter`
  - [ ] `p1` - `cpt-frontx-dashboard-component-dashboards-root` (shared (call side), owned by `cpt-frontx-dashboard-feature-extension-domain-catalog`: the calls it makes to the data adapter)
  - [ ] `p1` - `cpt-frontx-dashboard-component-larger-view-modal` (shared (call side), owned by `cpt-frontx-dashboard-feature-extension-domain-catalog`: the calls it makes to the data adapter)

- **API**:
  - `cpt-frontx-dashboard-interface-data-adapter`
  - `cpt-frontx-dashboard-interface-trait-helper` (shared (call side), owned by `cpt-frontx-dashboard-feature-query-vocabulary`: the calls that an implementation may make to it)
  - `cpt-frontx-dashboard-interface-domain-model` (the types that the operations carry)
  - `cpt-frontx-dashboard-contract-consuming-backend` (the PRD contract that the consuming product implements through its data adapter; this feature specifies it)

- **Sequences**:

  - [ ] `p1` - `cpt-frontx-dashboard-seq-initial-load` (shared (call side), owned by `cpt-frontx-dashboard-feature-extension-domain-catalog`: "get a dashboard", the served query families, and "run a query")
  - [ ] `p1` - `cpt-frontx-dashboard-seq-query-change` (shared (call side), owned by `cpt-frontx-dashboard-feature-extension-domain-catalog`: "run a query" for a changed query)
  - [ ] `p1` - `cpt-frontx-dashboard-seq-widget-modal-open` (shared (call side), owned by `cpt-frontx-dashboard-feature-extension-domain-catalog`: "get a dashboard" when the modal has not loaded that dashboard)
  - [ ] `p2` - `cpt-frontx-dashboard-seq-larger-view-refresh` (shared (call side), owned by `cpt-frontx-dashboard-feature-extension-domain-catalog`: "get a dashboard" after a refresh)
  - [ ] `p1` - `cpt-frontx-dashboard-seq-cannot-show` (shared (data adapter side), owned by `cpt-frontx-dashboard-feature-extension-domain-catalog`: the unserved query family, and the loader-stays case next to the sequence)

- **Data**:
  - None (DESIGN section 3.7: the template persists nothing)

---

## 3. Feature Dependencies

The listing order of section 2 is a topological order. Each feature lists as `Depends On` the features whose types or contracts it uses directly. The arrows below show the listing order, and the notes give the direct dependencies.

```text
cpt-frontx-dashboard-feature-query-vocabulary
    ↓
cpt-frontx-dashboard-feature-widget-data-catalog        (requires query-vocabulary)
    ↓
cpt-frontx-dashboard-feature-widget-catalog             (requires widget-data-catalog, query-vocabulary)
    ↓
cpt-frontx-dashboard-feature-layout-types               (requires widget-catalog)
    ↓
cpt-frontx-dashboard-feature-dashboard-root-types       (requires layout-types, query-vocabulary)
    ↓
cpt-frontx-dashboard-feature-extension-domain-catalog   (requires dashboard-root-types, widget-catalog, widget-data-catalog, query-vocabulary)
    ↓
cpt-frontx-dashboard-feature-mfe-entries                (requires extension-domain-catalog, widget-catalog)
    ↓
cpt-frontx-dashboard-feature-data-adapter-contract      (requires dashboard-root-types, extension-domain-catalog, widget-data-catalog, query-vocabulary)
```

**Dependency Rationale**:

- `cpt-frontx-dashboard-feature-query-vocabulary` is the only root: it declares the query base and the measure and dimension bases that the other features use.
- `cpt-frontx-dashboard-feature-widget-data-catalog` requires `cpt-frontx-dashboard-feature-query-vocabulary`: a fill mode reads the members of a query and fills the shape in the canonical member order.
- `cpt-frontx-dashboard-feature-widget-catalog` requires `cpt-frontx-dashboard-feature-widget-data-catalog` (each data widget type sets the `data_shape` trait to one of the shapes and the `fill` trait to one of the fill modes) and `cpt-frontx-dashboard-feature-query-vocabulary` (`data` is typed by the query base, and the cross-checks read the query format).
- `cpt-frontx-dashboard-feature-layout-types` requires `cpt-frontx-dashboard-feature-widget-catalog`: each cell checks its embedded widgets against the widget base.
- `cpt-frontx-dashboard-feature-dashboard-root-types` requires `cpt-frontx-dashboard-feature-layout-types` (the Dashboard embeds the Layout) and `cpt-frontx-dashboard-feature-query-vocabulary` (the delivery set holds the dataset types and the measure and dimension instances that the dashboard's queries use).
- `cpt-frontx-dashboard-feature-extension-domain-catalog` requires `cpt-frontx-dashboard-feature-dashboard-root-types` (the owners load, register, and validate a dashboard), `cpt-frontx-dashboard-feature-widget-catalog` (the actions carry the widget instance), `cpt-frontx-dashboard-feature-widget-data-catalog` (`set_data` carries the data instance, and `set_widget_context` carries the data shape and fill), and `cpt-frontx-dashboard-feature-query-vocabulary` (`request_data` carries the query, and the owners resolve widget-type traits through the trait helper).
- `cpt-frontx-dashboard-feature-mfe-entries` requires `cpt-frontx-dashboard-feature-extension-domain-catalog` (the actions that every entry supports and the domains that the entries are admitted to) and `cpt-frontx-dashboard-feature-widget-catalog` (each realization's `widget_type` names a widget type, constrained to the widget base).
- A use of an element by ID, where DESIGN fixes the element, is a reference and not a dependency. The instances are the realization precedence fields (`entry` and `larger_view_entry`) that the creation process of the extension domain catalog uses, the GTS file loader that each owner runs, the data adapter interface whose place in the `dashboard` package the MFE entries cite, and the `widgets` manifest that each owner registers. The widget catalog shares the presentation side of the widget library, which `cpt-frontx-dashboard-feature-mfe-entries` owns, and the widget data catalog, the dashboard root types and the extension domain catalog cite the data adapter interface, which `cpt-frontx-dashboard-feature-data-adapter-contract` owns; both are references. For the realization, the direction is one: the MFE entries depend on the extension domain catalog, and the extension domain catalog cites `cpt-frontx-dashboard-interface-widget-realization` by ID.
- `cpt-frontx-dashboard-feature-data-adapter-contract` requires `cpt-frontx-dashboard-feature-dashboard-root-types` (the dashboard and the delivery set that "get a dashboard" returns), `cpt-frontx-dashboard-feature-extension-domain-catalog` (the `request_data` payload that "run a query" receives), `cpt-frontx-dashboard-feature-widget-data-catalog` (the data shapes and fill modes that "run a query" returns), and `cpt-frontx-dashboard-feature-query-vocabulary` (the query format and derivation rules the data adapter reads, and the trait helper it may call). No feature lists it in Depends On, and the place of the interface in the `dashboard` package is cited by interface ID from `cpt-frontx-dashboard-feature-mfe-entries`, so the graph is acyclic.
