---
status: accepted
version: 1
date: 2026-10-30
description: Domain model of the widget realization type and the template's 9 realizations in the template's GTS file with its loader, the `widgets` manifest with its 9 widget entries, the `dashboard` manifest with the larger-view modal's entry and static extension and the dashboards root's entry and routed extension, the contents of the `dashboard` and `widgets` packages, schema registration, the packaging of a consumer replacement realization, and the shared dependency and budget rules of every entry.
---

# Feature: MFE Entries


<!-- toc -->

- [1. Feature Context](#1-feature-context)
  - [1.1 Overview](#11-overview)
  - [1.2 Purpose](#12-purpose)
  - [1.3 Actors](#13-actors)
  - [1.4 References](#14-references)
- [2. Actor Flows (CDSL)](#2-actor-flows-cdsl)
  - [Domain-Model Feature: No Actor Flows](#domain-model-feature-no-actor-flows)
- [3. Processes / Business Logic (CDSL)](#3-processes--business-logic-cdsl)
  - [Domain-Model Feature: No Processes](#domain-model-feature-no-processes)
- [4. States (CDSL)](#4-states-cdsl)
  - [Domain-Model Feature: No State Machines](#domain-model-feature-no-state-machines)
- [5. Definitions of Done](#5-definitions-of-done)
  - [Domain Model Definition of Done](#domain-model-definition-of-done)
  - [Widget Realization Type and Precedence](#widget-realization-type-and-precedence)
  - [Template GTS File and Loader](#template-gts-file-and-loader)
  - [Larger-View Modal Entry and Static Extension](#larger-view-modal-entry-and-static-extension)
  - [Dashboards Root Package](#dashboards-root-package)
  - [Package Contents and Compatibility](#package-contents-and-compatibility)
  - [Widget Chrome and Grid Shell](#widget-chrome-and-grid-shell)
  - [Consumer Replacement Package](#consumer-replacement-package)
  - [Shared Dependencies and Budget Basis](#shared-dependencies-and-budget-basis)
- [6. Domain Model](#6-domain-model)
  - [6.1 Widget Realization Type](#61-widget-realization-type)
  - [6.2 Widget Manifest](#62-widget-manifest)
  - [6.3 Widget Entry and Realization: Grid Example](#63-widget-entry-and-realization-grid-example)
  - [6.4 Declarations for All 9 Widget Types](#64-declarations-for-all-9-widget-types)
  - [6.5 Template GTS File and Loader](#65-template-gts-file-and-loader)
  - [6.6 Dashboard Manifest, Larger-View Modal, and Dashboards Root](#66-dashboard-manifest-larger-view-modal-and-dashboards-root)
  - [6.7 Admission Summary](#67-admission-summary)
  - [6.8 Consumer Replacement Package](#68-consumer-replacement-package)
  - [6.9 Package Contents and Schema Registration](#69-package-contents-and-schema-registration)
  - [6.10 Shared Dependencies and Budget Basis](#610-shared-dependencies-and-budget-basis)
  - [6.11 Open Questions](#611-open-questions)
- [7. Acceptance Criteria](#7-acceptance-criteria)

<!-- /toc -->

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-featstatus-mfe-entries`
## 1. Feature Context

- [ ] `p2` - `cpt-frontx-dashboard-feature-mfe-entries`

### 1.1 Overview

This is a **domain-model feature**, not an actor-flow feature. It declares the widget realization type, which binds one widget type to the entry that shows it, and it lists every realization, entry, extension, and manifest that the template ships in its two packages, `dashboard` and `widgets`. It also states what the packages contain, how the template's schemas are registered, how a consuming product packages a replacement realization, and which dependencies every entry shares. The flow, process, and state sections of the FEATURE template are reduced to short not-applicable notes; the type and the instances live in section 6 Domain Model.

### 1.2 Purpose

Concrete types and instances of the "widget realization" part of DESIGN section 3.1, and the entries, extensions, manifests, and package contents through which the 9 widget types, the larger view, and the dashboards root are loaded. Every identifier builds on the FrontX MFE base types (`gts.frontx.mfes.*`) and uses the template's GTS packages `frontx.dashboard_m` and `frontx.dashboard_v`, with every template segment at `v1`. DESIGN section 3.1 delegates the field-level schema of the realization type and the exact identifier forms of the entries and extensions to this document, so section 6 carries them.

The declarations follow the DESIGN, ADR-0008, and ADR-0010:

- Widget entries, the larger-view modal's entry, and the dashboards root's entry are plain instances of the FrontX MFE entry type `gts.frontx.mfes.mfe.entry.v1~frontx.mfes.mfe.entry_mf.v1~`. The template keeps that type as it is (ADR-0008), so it adds no entry type and no field to entries.
- The widget realization type `gts.frontx.dashboard_v.mfe.widget_realization.v1~` links the two type families: a realization names one widget type, the entry that shows it in a cell and in the larger view, an optional separate larger-view entry, and a weight. For each widget type the single realization with the highest weight wins.
- The `widgets` package declares one manifest and one entry per widget type, 9 in all. The same entry shows its widget in a layout cell and in the larger view, so both domains admit it.
- The template's GTS file, in the `dashboard` package, holds the 9 template realizations of weight 1. The loader that each domain owner runs fetches and registers the file at start.
- The `dashboard` package declares one manifest, the entry of the larger-view modal, and the larger-view modal's static, routed extension of the shell's `popup` domain. When the dashboards root is a screen extension, the manifest also carries its entry and its routed extension in the shell screen domain.
- A consuming product replaces how one template widget type is shown with a realization of a higher weight in its copy of the template's GTS file, with its entry in its own package. It adds no widget types.
- Every template MFE lists its packages in the `shared` array of its manifest. Each MFE instance evaluates its own copy (per-instance isolation).

**Declaring packages**:
- `widgets` (`src-app/mfe_packages/widgets/`) declares, through its own `mfe.json`, the widget manifest and the 9 widget entries (sections 6.2 to 6.4). It holds the shared widget chrome and the grid shell (section 6.9).
- `dashboard` (`src-app/mfe_packages/dashboard/`) declares the widget realization type schema and the other template types, the `dashboard` manifest, the larger-view modal's entry and static extension, and, when the dashboards root is a screen extension, its entry and routed extension (section 6.6). It holds the template's GTS file with its loader (section 6.5) and the code of the two domain owners (section 6.9).

**Requirements**: `cpt-frontx-dashboard-fr-widget-catalog`, `cpt-frontx-dashboard-fr-domain-model`, `cpt-frontx-dashboard-fr-dashboards-root`, `cpt-frontx-dashboard-fr-widget-modal`, `cpt-frontx-dashboard-fr-theme`, `cpt-frontx-dashboard-fr-loading-error-states`, `cpt-frontx-dashboard-fr-grid-sort-page`, `cpt-frontx-dashboard-fr-replacement-widget`, `cpt-frontx-dashboard-nfr-visual-quality`, `cpt-frontx-dashboard-nfr-compatibility`, `cpt-frontx-dashboard-nfr-large-table`, `cpt-frontx-dashboard-nfr-consumer-docs`, `cpt-frontx-dashboard-nfr-bundle-budget`

**Principles**: `cpt-frontx-dashboard-principle-per-instance-isolation`, `cpt-frontx-dashboard-principle-own-registry-registration`, `cpt-frontx-dashboard-principle-gts-contracts`

**Constraints**: `cpt-frontx-dashboard-constraint-gts-id-convention`, `cpt-frontx-dashboard-constraint-role-based-host-ids`, `cpt-frontx-dashboard-constraint-shell-only-dependency`, `cpt-frontx-dashboard-constraint-one-dashboards-root-per-tree`, `cpt-frontx-dashboard-constraint-licensing-compliance-resources`

### 1.3 Actors

N/A. This is a domain-model feature. Its type and instances are consumed by the runtime type system and by the registration paths of the shell's bootstrap and the domain owners (the manifest channel and the template's GTS file), not by an end-user actor, so no actor flows are authored. The actors of the use cases in section 2 are defined in the PRD.

### 1.4 References

- **PRD**: [PRD.md](../../PRD.md)
- **Design**: [DESIGN.md](../../DESIGN.md) section 2.1 (Per-Instance Isolation; Each Domain Owner Registers Only in Its Own Registry), section 2.2 (Dependency on `template-shell` Only; Host Identifiers by Role; GTS Identifier Form and Freeze; One Dashboards Root per Application Tree; Licensing), section 3.1 (Domain Model, Packages, Namespaces, and the Model–View Split, ID-form convention, Widget realization), section 3.2 (Widget Library, Template GTS File Loader), section 3.3 (Widget Realization, Template Extension Domains: admission of entries and identifier uniqueness), section 3.4 (Internal Dependencies), section 3.5 (Host contract, Manifest channel, Template's GTS file), section 3.6 (Cannot-Show States, Larger View Open), section 3.8 (Deployment Topology), section 3.9 (Bundle budget, Dependency sharing rules), section 4 (prerequisites, handoffs, open questions)
- **ADRs**: [ADR-0001](../../ADR/0001-frontend-framework-v1.md), [ADR-0006](../../ADR/0006-theme-distribution-v1.md), [ADR-0007](../../ADR/0007-extension-domain-taxonomy-v1.md), [ADR-0008](../../ADR/0008-widget-type-and-mfe-realization-v1.md), [ADR-0010](../../ADR/0010-template-packages-and-host-contract-v1.md)
- **Design elements**: `cpt-frontx-dashboard-component-widget-library`, `cpt-frontx-dashboard-component-dashboards-root` (its entry, routed extension, manifest, and package contents only), `cpt-frontx-dashboard-component-larger-view-modal` (its entry, static extension, manifest, and package contents only), `cpt-frontx-dashboard-component-gts-file-loader`, `cpt-frontx-dashboard-component-trait-helper` (its place in the `dashboard` package only), `cpt-frontx-dashboard-topology-overlay-packages`, `cpt-frontx-dashboard-interface-widget-realization`, `cpt-frontx-dashboard-interface-data-adapter` (its place in the `dashboard` package only), `cpt-frontx-dashboard-interface-host-actions` and `cpt-frontx-dashboard-interface-template-domains` (the `actions`, `domainActions`, and admission of the entries), `cpt-frontx-dashboard-contract-host-areas` (the shell screen domain and the `popup` domain by role), `cpt-frontx-dashboard-interface-domain-model` (realization and entry part), `cpt-frontx-dashboard-seq-initial-load` (registration of the template's schemas), `cpt-frontx-dashboard-seq-widget-modal-open` and `cpt-frontx-dashboard-seq-larger-view-refresh` (entry side), `cpt-frontx-dashboard-seq-larger-view-close` (the modal entry's `domainActions`, which lists no lifecycle action), `cpt-frontx-dashboard-seq-cannot-show` (loader side), `cpt-frontx-dashboard-seq-theme-switch` (manifest side)
- **Dependencies**:
  - [feature-widget-catalog](../feature-widget-catalog/FEATURE.md): the widget base and the 9 widget types that a realization's `widget_type` names, and the shared widget chrome and grid shell that the entries of the `widgets` package bundle.
  - [feature-extension-domain-catalog](../feature-extension-domain-catalog/FEATURE.md): the action types that the entries list in `actions` and `domainActions`, the `layout_cells` and `larger_view` domains that admit the widget entries, the registration of generated extensions from the winning realization, the deterministic ids of generated extensions, and the larger-view chain that mounts the modal's static extension. The precedence rule of section 6.1 is applied there.
- **Related**: [feature-data-adapter-contract](../feature-data-adapter-contract/FEATURE.md): the data adapter interface that the `dashboard` package carries, and the cannot-show outcomes that the domain owners show. `cpt-frontx-dashboard-feature-query-vocabulary` owns the trait helper, whose place in the `dashboard` package this feature states.

## 2. Actor Flows (CDSL)

**Use cases**: `cpt-frontx-dashboard-usecase-view-dashboard`, `cpt-frontx-dashboard-usecase-provide-dashboard`

### Domain-Model Feature: No Actor Flows

Not applicable because this feature declares static GTS types and instances; no actor interacts with the declarations themselves. In the viewing use case, the dashboards root's entry is the screen that the dashboard viewer opens when the dashboards root is a screen extension, the widget entries are the widgets in the cells and in the larger view, and the modal's entry is the larger-view window. In the providing use case, a template consumer supplies its own widget for one widget type by shipping the replacement package of section 6.8. The runtime paths that use these instances are the manifest channel registration (DESIGN section 3.5) and the DESIGN sequences `cpt-frontx-dashboard-seq-initial-load`, `cpt-frontx-dashboard-seq-widget-modal-open`, `cpt-frontx-dashboard-seq-cannot-show`, and `cpt-frontx-dashboard-seq-theme-switch`.

## 3. Processes / Business Logic (CDSL)

### Domain-Model Feature: No Processes

Not applicable because this feature declares schemas and instances only. The realization precedence is a rule over the declared instances (section 6.1); the domain owners apply it in feature-extension-domain-catalog. Registration from the manifest channel is done by the shell's bootstrap, and registration of the template's GTS file by the loader of each domain owner (section 6.5); both are runtime behavior outside the declarations.

## 4. States (CDSL)

### Domain-Model Feature: No State Machines

Not applicable because type and instance declarations are stateless. The extension lifecycle stages are declared by the domains: `layout_cells` and `larger_view` in feature-extension-domain-catalog, and the `popup` domain by the shell.

## 5. Definitions of Done

### Domain Model Definition of Done

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-dod-mfe-entries-catalog-complete`

The system **MUST** declare in the `widgets` `mfe.json` exactly one manifest and one entry for each of the 9 template widget types, and **MUST** hold in the template's GTS file exactly one widget realization of weight 1 for each of them, with the identifiers of sections 6.3 and 6.4.

- Every widget entry is a plain instance of `gts.frontx.mfes.mfe.entry.v1~frontx.mfes.mfe.entry_mf.v1~`, points to the `widgets` manifest, requires the theme and language shared properties, lists `set_widget_context` and `set_data` in `actions`, and lists `request_data` in `domainActions`. `markdown_card` lists them too.
- No entry uses a type derived from the FrontX MFE entry type, and no entry carries a field beyond that type.
- Every template realization names one of the 9 widget types and the widget entry of that widget type, names no `larger_view_entry`, and has weight 1.
- Every widget maps the host theme id that it receives as the theme shared property to the light or dark scope of `@gears-frontx/ui-kit`; the template declares no theme type and no theme instance.
- No manifest carries a template GTS instance (no widget realization) and no dashboard content, widget data included.

**Covers (PRD)**: `cpt-frontx-dashboard-fr-widget-catalog`, `cpt-frontx-dashboard-fr-theme`, `cpt-frontx-dashboard-fr-domain-model`

**Covers (DESIGN)**: `cpt-frontx-dashboard-component-widget-library`, `cpt-frontx-dashboard-interface-widget-realization`, `cpt-frontx-dashboard-interface-domain-model`, `cpt-frontx-dashboard-interface-host-actions`, `cpt-frontx-dashboard-interface-template-domains`, `cpt-frontx-dashboard-principle-gts-contracts`, `cpt-frontx-dashboard-seq-theme-switch`

**Constraints**: `cpt-frontx-dashboard-constraint-gts-id-convention`

**Touches**:
- Entities: widget manifest, widget entries, widget realizations

### Widget Realization Type and Precedence

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-dod-mfe-entries-widget-realization`

The system **MUST** declare the widget realization type `gts.frontx.dashboard_v.mfe.widget_realization.v1~` in the `dashboard` package with the fields `id`, `widget_type`, `entry`, `larger_view_entry`, and `weight` of section 6.1, and **MUST** give every realization the precedence semantics of section 6.1.

- `id`, `widget_type`, and `entry` are required; `larger_view_entry` is optional; `weight` is optional, an integer of at least 1, and counts as 1 when it is missing. No other field is allowed.
- `widget_type` holds a type identifier and uses `x-gts-type-ref`; `id`, `entry`, and `larger_view_entry` hold instance identifiers and use `x-gts-instance-ref`, each with a literal base operand.
- `widget_type` is the only field of the realization type that references package `dashboard_m`; the action types reference `dashboard_m` as DESIGN section 3.1 lists.
- The realization for a widget type is selected by `cpt-frontx-dashboard-algo-extension-domain-catalog-select-realization`; this feature declares the data that rule reads.
- A realization is a GTS instance, not an admitted extension: registering it admits nothing.

**Covers (PRD)**: `cpt-frontx-dashboard-fr-domain-model`, `cpt-frontx-dashboard-fr-widget-modal`, `cpt-frontx-dashboard-fr-replacement-widget`

**Covers (DESIGN)**: `cpt-frontx-dashboard-interface-widget-realization`, `cpt-frontx-dashboard-interface-domain-model`, `cpt-frontx-dashboard-principle-gts-contracts`

**Constraints**: `cpt-frontx-dashboard-constraint-gts-id-convention`

**Touches**:
- Entities: widget realization type, widget realizations

### Template GTS File and Loader

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-dod-mfe-entries-gts-file-loader`

The system **MUST** ship the template's GTS file with the 9 template realizations in the `dashboard` package, and **MUST** provide the loader of section 6.5, which the dashboards root and the larger-view modal each run in their own runtime at start.

- The loader registers the file's contents before any dashboard loads.
- A file that cannot be fetched, or an entry that the registry rejects, writes a diagnostic to the developer log that names the file or the entry. With no realization registered for a widget type, no realization wins for it, and every widget of that widget type gets the widget-level cannot-show state; the other widget types are unaffected.
- The loader loads no dashboard content and no product types.
- A backend that returns the same GTS types and instances can take the file's place without a change to the dashboards root or the larger-view modal.

**Covers (PRD)**: `cpt-frontx-dashboard-fr-domain-model`, `cpt-frontx-dashboard-fr-replacement-widget`, `cpt-frontx-dashboard-fr-loading-error-states`

**Covers (DESIGN)**: `cpt-frontx-dashboard-component-gts-file-loader`, `cpt-frontx-dashboard-interface-widget-realization`, `cpt-frontx-dashboard-seq-initial-load`, `cpt-frontx-dashboard-seq-cannot-show`

**Constraints**: `cpt-frontx-dashboard-constraint-gts-id-convention`

**Touches**:
- Entities: template GTS file, widget realizations

### Larger-View Modal Entry and Static Extension

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-dod-mfe-entries-static-modal-extensions`

The system **MUST** declare in the `dashboard` `mfe.json` the larger-view modal's entry and its static, routed extension of the shell's `popup` domain, with a fixed identifier, and **MUST** deliver them through the manifest channel so that the shell's bootstrap registers them in the shell's registry.

- The modal's entry is a plain instance of the FrontX MFE entry type, points to the `dashboard` manifest, requires theme and language, lists `show_larger_view` in `actions`, and lists no domain actions, because the lifecycle action it sends to the `popup` domain is exempt from admission (section 6.3).
- The extension is an instance of the FrontX extension base `gts.frontx.mfes.ext.extension.v1~`, names the `popup` domain by role in `domain`, names the modal's entry in `entry`, and carries the static route that FrontX routing restores after a page refresh.
- No template part registers an extension of the `popup` domain at run time; a child cannot register into an ancestor's registry, and the shell's bootstrap is the only registration path.
- The modal's entry and static extension are registered before the first larger view opens.
- The lifecycle chains that concern the modal carry `history: "none"`: the cell widget's `mount_ext` of the modal and the modal's close `unmount_ext`, both sent to the `popup` domain, so they add no entry to the browser history.
- The extension's identifier is fixed, one per application tree, and disjoint from every generated extension identifier.

**Covers (PRD)**: `cpt-frontx-dashboard-fr-widget-modal`, `cpt-frontx-dashboard-fr-theme`, `cpt-frontx-dashboard-contract-host-areas`

**Covers (DESIGN)**: `cpt-frontx-dashboard-component-larger-view-modal`, `cpt-frontx-dashboard-principle-own-registry-registration`, `cpt-frontx-dashboard-seq-widget-modal-open`, `cpt-frontx-dashboard-seq-larger-view-refresh`, `cpt-frontx-dashboard-seq-larger-view-close`

**Constraints**: `cpt-frontx-dashboard-constraint-role-based-host-ids`, `cpt-frontx-dashboard-constraint-one-dashboards-root-per-tree`

**Touches**:
- Entities: larger-view modal entry, larger-view modal static extension

### Dashboards Root Package

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-dod-mfe-entries-dashboards-root-package`

The system **MUST** declare in the `dashboard` `mfe.json` the `dashboard` manifest and, for a product whose dashboards root is a screen extension, the entry and the routed extension of the dashboards root of section 6.6, and **MUST** register the template's schemas before any dashboard loads, by section 6.9.

- The dashboards root's entry is a plain instance of the FrontX MFE entry type, points to the `dashboard` manifest, requires theme and language, and declares no actions and no domain actions.
- The routed extension is an instance of the shell screen extension type in the shell screen domain, with a `route` and a presentation label.
- When the dashboards root is a screen extension, the template's schemas are registered through the `dashboard` manifest; when it is code in the shell, the shell's own bootstrap registers them.
- Manifest-declared host identifiers are data that carry the current `template-shell` identifiers, or are generated from the shell constants at build time; TypeScript code never writes them as literals.

**Covers (PRD)**: `cpt-frontx-dashboard-fr-dashboards-root`, `cpt-frontx-dashboard-fr-theme`, `cpt-frontx-dashboard-contract-host-areas`

**Covers (DESIGN)**: `cpt-frontx-dashboard-component-dashboards-root`, `cpt-frontx-dashboard-topology-overlay-packages`, `cpt-frontx-dashboard-seq-initial-load`

**Constraints**: `cpt-frontx-dashboard-constraint-role-based-host-ids`, `cpt-frontx-dashboard-constraint-shell-only-dependency`, `cpt-frontx-dashboard-constraint-one-dashboards-root-per-tree`, `cpt-frontx-dashboard-constraint-gts-id-convention`

**Touches**:
- Entities: `dashboard` manifest, dashboards root entry, dashboards root routed extension, template GTS types

### Package Contents and Compatibility

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-dod-mfe-entries-package-contents`

The system **MUST** place the template's parts in the two package subtrees of section 6.9, **MUST** keep the template compatible with a `template-shell`-based application by section 6.9, and **MUST** ship the consumer guide with the source.

- The `dashboard` package holds the types, the template's GTS file, the code of the two domain owners, the data adapter interface, the trait helper, the GTS file loader, and the cannot-show placeholder, and holds no data adapter implementation.
- The `widgets` package holds the manifest, the 9 entries, and the shared widget chrome with the grid shell, and holds no data-request code beyond the `request_data` action and no error chrome.
- The packages depend on `template-shell` and the FrontX packages pinned to exact published versions only, and on nothing from `template-mfe`.
- Host domain identifiers come from shell constants in code and are data in manifests.
- The consumer guide ships with the source and covers the data adapter, the dashboards root hosting forms, the consumer replacement package of section 6.8, and the shell prerequisites.

**Covers (PRD)**: `cpt-frontx-dashboard-nfr-compatibility`, `cpt-frontx-dashboard-nfr-consumer-docs`, `cpt-frontx-dashboard-fr-dashboards-root`

**Covers (DESIGN)**: `cpt-frontx-dashboard-topology-overlay-packages`, `cpt-frontx-dashboard-interface-data-adapter`, `cpt-frontx-dashboard-component-trait-helper`

**Constraints**: `cpt-frontx-dashboard-constraint-shell-only-dependency`, `cpt-frontx-dashboard-constraint-role-based-host-ids`

**Touches**:
- Entities: `dashboard` package, `widgets` package

### Widget Chrome and Grid Shell

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-dod-mfe-entries-widget-chrome`

The system **MUST** bundle in the `widgets` package the shared widget chrome and the grid shell that realize the presentation rules of feature-widget-catalog, so that every widget entry shows the same states and the `grid` entry offers the same controls.

- The chrome shows the title, the loader, the busy indicator, the empty state, and the larger-view button; the cannot-show placeholder is not part of it.
- The grid shell offers sort headers, a pager, a page-size choice, and column resizing, and renders the rows of a page virtualized.
- All styling comes from `@gears-frontx/ui-kit` tokens in the scope that the host theme id maps to.

**Covers (PRD)**: `cpt-frontx-dashboard-fr-loading-error-states`, `cpt-frontx-dashboard-fr-grid-sort-page`, `cpt-frontx-dashboard-nfr-large-table`, `cpt-frontx-dashboard-nfr-visual-quality`

**Covers (DESIGN)**: `cpt-frontx-dashboard-component-widget-library`

**Touches**:
- Entities: shared widget chrome, grid shell

### Consumer Replacement Package

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-dod-mfe-entries-consumer-replacement`

The system **MUST** accept a replacement realization that a consuming product adds to its copy of the template's GTS file, with its entry in its own package by section 6.8, and **MUST** then show the consumer's entry for every widget of that widget type, in a cell and in the larger view, without a change to the template's packages.

- The consumer package carries its own manifest and its own entry, and the copy of the template's GTS file carries a realization with a weight above 1 that names one of the 9 template widget types and that entry.
- The consumer's entry lists `set_widget_context` and `set_data` in `actions` and `request_data` in `domainActions`, so that both domains admit it.
- The template's realization for that widget type stays registered but unused; the other widget types keep the template's realizations.
- No consumer widget type is accepted.

**Covers (PRD)**: `cpt-frontx-dashboard-fr-replacement-widget`, `cpt-frontx-dashboard-fr-domain-model`

**Covers (DESIGN)**: `cpt-frontx-dashboard-interface-widget-realization`, `cpt-frontx-dashboard-topology-overlay-packages`

**Constraints**: `cpt-frontx-dashboard-constraint-gts-id-convention`

**Touches**:
- Entities: consumer package, replacement realization, consumer entry

### Shared Dependencies and Budget Basis

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-dod-mfe-entries-shared-packages`

The system **MUST** list, in the `shared` array of the manifest of every template MFE, every package that MFE uses, and **MUST** measure the download size by the budget basis of section 6.10.

- Every widget entry, the larger-view modal, and, when it is a screen extension, the dashboards root list all their packages in `shared`, also stateful ones; no MFE relies on template-owned state shared between instances.
- All template MFEs publish the same `contentHash` for each shared dependency, because they are built together from one pinned set of package versions.
- Every listed package passes the package-wide license check.
- The budget counts transferred gzipped bytes on a cold load of the reference dashboard: the dashboards root and the larger-view modal with the shared dependencies they fetch themselves, each widget entry with its own code only, and each shared dependency once in the page total.

**Covers (PRD)**: `cpt-frontx-dashboard-nfr-bundle-budget`

**Covers (DESIGN)**: `cpt-frontx-dashboard-principle-per-instance-isolation`, `cpt-frontx-dashboard-topology-overlay-packages`

**Constraints**: `cpt-frontx-dashboard-constraint-licensing-compliance-resources`, `cpt-frontx-dashboard-constraint-shell-only-dependency`

**Touches**:
- Entities: `widgets` manifest, `dashboard` manifest, every entry

## 6. Domain Model

**Not applicable.** Security: the declarations hold no secrets and no state. Operations and rollout: the template is a source package with no service of its own. Data: the declarations store no data. Accessibility: governed by `cpt-frontx-dashboard-nfr-accessibility` and the widget chrome of feature-widget-catalog.

### 6.1 Widget Realization Type

**GTS ID**: `gts.frontx.dashboard_v.mfe.widget_realization.v1~`

**Description**: Binds one widget type to the entries that show it: the entry for a layout cell and for the larger view, and optionally a separate larger-view entry. Dashboards name only widget types, never entries, so a realization can be replaced without changing any dashboard (ADR-0008). The type lives in package `dashboard_v`; its `widget_type` field is the only field of this type that references package `dashboard_m`, while the action types reference `dashboard_m` as DESIGN section 3.1 lists.

**Schema**:

```json
{
  "$id": "gts://gts.frontx.dashboard_v.mfe.widget_realization.v1~",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "Widget Realization",
  "description": "Binds one widget type to its entry, an optional larger-view entry, and a weight.",
  "type": "object",
  "required": ["id", "widget_type", "entry"],
  "additionalProperties": false,
  "properties": {
    "id": {
      "type": "string",
      "x-gts-instance-ref": "gts.frontx.dashboard_v.mfe.widget_realization.v1~",
      "description": "Instance identifier of the realization, rooted at this type, for example gts.frontx.dashboard_v.mfe.widget_realization.v1~frontx.dashboard_v.mfe.grid.v1."
    },
    "widget_type": {
      "type": "string",
      "x-gts-type-ref": "gts.frontx.dashboard_m.widget.widget.v1~",
      "description": "Type identifier of the widget type this realization shows: one of the template widget types derived from the widget base."
    },
    "entry": {
      "type": "string",
      "x-gts-instance-ref": "gts.frontx.mfes.mfe.entry.v1~frontx.mfes.mfe.entry_mf.v1~",
      "description": "The entry that shows the widget in a layout cell and in the larger view."
    },
    "larger_view_entry": {
      "type": "string",
      "x-gts-instance-ref": "gts.frontx.mfes.mfe.entry.v1~frontx.mfes.mfe.entry_mf.v1~",
      "description": "A separate entry for the larger view, named only when the widget type needs different code there."
    },
    "weight": {
      "type": "integer",
      "minimum": 1,
      "default": 1,
      "description": "Precedence among the realizations of one widget type; the single highest weight wins."
    }
  }
}
```

**Field notes**:
- `id`: a well-known instance identifier that ends in a named segment (`cpt-frontx-dashboard-constraint-gts-id-convention`). The template's realizations use the segment of their entry, for example `frontx.dashboard_v.mfe.grid.v1`.
- `widget_type` holds a type identifier, so it uses `x-gts-type-ref` with the widget base as the literal operand. The widget base is abstract, and every widget instance belongs to one of the 9 concrete template widget types (feature-widget-catalog), so only a realization that names one of those types can ever win.
- `entry` is constrained to the FrontX MFE entry type, the same constraint as the `entry` of the extension type of `layout_cells` and `larger_view` (feature-extension-domain-catalog).
- `larger_view_entry` is optional and constrained like `entry`. A realization names it only when the widget type needs different code in the larger view. The template's realizations name none.
- `weight` is optional; a missing weight counts as 1. The template's realizations carry weight 1 explicitly. The precedence among realizations is in the Precedence paragraph below.
- The schema is closed: a field beyond these five fails validation.
- A realization is a GTS instance, not an admitted extension: registering it admits nothing, and each domain owner registers the generated extensions itself.

**Precedence**: the owner of a domain selects the realization for a widget type by `cpt-frontx-dashboard-algo-extension-domain-catalog-select-realization` (feature-extension-domain-catalog), which also decides what happens when no single realization is selected. That algorithm owns the weight comparison, the tie, and the choice between `entry` and `larger_view_entry`; this feature declares the fields it reads.
- The dashboards root applies the rule for cell widgets and the larger-view modal for larger-view widgets.

**Cross-references**: DESIGN section 3.1 (Widget realization; Packages, Namespaces, and the Model–View Split), `cpt-frontx-dashboard-interface-widget-realization`; widget types in feature-widget-catalog; ADR-0008.

### 6.2 Widget Manifest

**GTS instance ID**: `gts.frontx.mfes.mfe.mf_manifest.v1~frontx.dashboard_v.widgets.manifest.v1`

**Description**: The single manifest of the `widgets` package. All 9 widget entries point to it.

| Field | Source | Content |
|-------|--------|---------|
| `id` | authored in `widgets/mfe.json` | `gts.frontx.mfes.mfe.mf_manifest.v1~frontx.dashboard_v.widgets.manifest.v1` |
| `remoteEntry` | authored in `widgets/mfe.json` | location of the entry file of the `widgets` build |
| `name`, `metaData`, `shared` | produced by the manifest pipeline (`scripts/generate-mfe-manifests.ts`) from the build | the FrontX manifest fields: package name, public path and entry file descriptor, and the `shared` array of section 6.10 |

**What the `widgets` `mfe.json` carries**: this manifest and the 9 widget entries of section 6.3. It carries no template GTS instance (no widget realization) and no dashboard content (DESIGN section 3.5, Manifest channel). The 9 template realizations are not in it; they are in the template's GTS file (section 6.5).

**Registration**: the declarations reach every registry through the manifest channel. The shell's bootstrap registers the manifest and the entries in the shell's registry. The domain owners register the `widgets` manifest, and every manifest whose entries a registered realization names, in their own registries, from the same aggregated manifest, before they register any generated extension (DESIGN section 3.5). A consumer's replacement entry therefore resolves in the nested registries as well. This feature declares the instances; the registration itself is runtime behavior.

### 6.3 Widget Entry and Realization: Grid Example

**Description**: For each widget type, the `widgets` package declares one entry, and the template's GTS file holds one realization. All 9 widget types follow the same shape and differ only in their identifiers, their `exposedModule` values, and the widget type that the realization names (section 6.4). The `grid` widget type shows the complete shape.

**Widget entry**:

```json
{
  "id": "gts.frontx.mfes.mfe.entry.v1~frontx.mfes.mfe.entry_mf.v1~frontx.dashboard_v.mfe.grid.v1",
  "requiredProperties": [
    "gts.frontx.mfes.comm.shared_property.v1~frontx.mfes.comm.theme.v1~",
    "gts.frontx.mfes.comm.shared_property.v1~frontx.mfes.comm.language.v1~"
  ],
  "actions": [
    "gts.frontx.mfes.comm.action.v1~frontx.dashboard_v.mfe.set_widget_context.v1~",
    "gts.frontx.mfes.comm.action.v1~frontx.dashboard_v.mfe.set_data.v1~"
  ],
  "domainActions": [
    "gts.frontx.mfes.comm.action.v1~frontx.dashboard_v.mfe.request_data.v1~"
  ],
  "manifest": "gts.frontx.mfes.mfe.mf_manifest.v1~frontx.dashboard_v.widgets.manifest.v1",
  "exposedModule": "./grid"
}
```

**Widget realization** (in the template's GTS file):

```json
{
  "id": "gts.frontx.dashboard_v.mfe.widget_realization.v1~frontx.dashboard_v.mfe.grid.v1",
  "widget_type": "gts.frontx.dashboard_m.widget.widget.v1~frontx.dashboard_m.widget.data_widget.v1~frontx.dashboard_m.widget.grid.v1~",
  "entry": "gts.frontx.mfes.mfe.entry.v1~frontx.mfes.mfe.entry_mf.v1~frontx.dashboard_v.mfe.grid.v1",
  "weight": 1
}
```

**Entry field notes**:
- The entry is a plain instance of the FrontX MFE entry type `gts.frontx.mfes.mfe.entry.v1~frontx.mfes.mfe.entry_mf.v1~`. It uses only its inherited fields: `id`, `requiredProperties`, `actions`, and `domainActions` from the FrontX entry base, and `manifest` and `exposedModule` from the entry type. `exposeAssets` is produced by the manifest pipeline.
- `requiredProperties`: theme and language. `layout_cells` and `larger_view` both share both properties, with the host's values published unchanged (feature-extension-domain-catalog). Each widget maps the host theme id to the light or dark scope of `@gears-frontx/ui-kit` and follows a theme switch without a request (ADR-0006). It formats values and localizes its own wording for the host language.
- `actions`: `set_widget_context` and `set_data`, the two extension actions that `layout_cells` and `larger_view` both require, so one entry is admitted to both domains. The cell widget receives them from the dashboards root, the larger-view widget from the larger-view modal. `markdown_card` lists them too, although it never receives `set_data`.
- `domainActions`: `request_data`, which both domains support. A widget sends it to the domain it sits in, read from its bridge's `extDomainId`. `markdown_card` lists it too, although it never sends it.
- **Rule for the actions an entry sends to a domain.** An entry lists in `domainActions` the non-lifecycle actions it sends to a domain. The lifecycle actions `load_ext`, `mount_ext`, and `unmount_ext` are exempt from the entry-requires-domain admission rule (FrontX ADR-0010), so no entry lists them. A widget entry therefore lists `request_data` only, although the cell widget's chain also sends `mount_ext` to the shell's `popup` domain.
- `exposedModule`: `./<widget_type>` where `<widget_type>` is the widget type segment of section 6.4.
- The same entry serves a cell and the larger view. A realization names a separate `larger_view_entry` only for a widget type that needs different code there; the template's 9 do not.
- A widget entry carries no data-request code beyond the `request_data` action and no backend knowledge; the answer comes as `set_data` from the domain owner (feature-data-adapter-contract).

**Realization notes**: the template realization has weight 1, the identifier segment of its entry, and no `larger_view_entry`. It names the entry of the same widget type, declared in the `widgets` manifest.

**Cross-references**: DESIGN `cpt-frontx-dashboard-component-widget-library`, `cpt-frontx-dashboard-interface-widget-realization`, `cpt-frontx-dashboard-interface-host-actions`, `cpt-frontx-dashboard-interface-template-domains`; ADR-0007; ADR-0008.

### 6.4 Declarations for All 9 Widget Types

**Description**: The identifiers and `exposedModule` values of every widget entry and realization. Each row follows the shape of section 6.3.

Identifier prefixes:
- Widget type of rows 1 to 8, the data widget types: `gts.frontx.dashboard_m.widget.widget.v1~frontx.dashboard_m.widget.data_widget.v1~` followed by the widget type segment.
- Widget type of row 9, `markdown_card`: `gts.frontx.dashboard_m.widget.widget.v1~` followed by the widget type segment.
- Widget entry: `gts.frontx.mfes.mfe.entry.v1~frontx.mfes.mfe.entry_mf.v1~` followed by the entry segment.
- Realization: `gts.frontx.dashboard_v.mfe.widget_realization.v1~` followed by the entry segment.

| # | Widget type segment | Entry and realization segment | `exposedModule` | Weight |
|---|---------------------|-------------------------------|-----------------|--------|
| 1 | `frontx.dashboard_m.widget.summary_card.v1~` | `frontx.dashboard_v.mfe.summary_card.v1` | `./summary_card` | 1 |
| 2 | `frontx.dashboard_m.widget.metric_card.v1~` | `frontx.dashboard_v.mfe.metric_card.v1` | `./metric_card` | 1 |
| 3 | `frontx.dashboard_m.widget.ranked_list_card.v1~` | `frontx.dashboard_v.mfe.ranked_list_card.v1` | `./ranked_list_card` | 1 |
| 4 | `frontx.dashboard_m.widget.progress_list_card.v1~` | `frontx.dashboard_v.mfe.progress_list_card.v1` | `./progress_list_card` | 1 |
| 5 | `frontx.dashboard_m.widget.grid.v1~` | `frontx.dashboard_v.mfe.grid.v1` | `./grid` | 1 |
| 6 | `frontx.dashboard_m.widget.cartesian_chart.v1~` | `frontx.dashboard_v.mfe.cartesian_chart.v1` | `./cartesian_chart` | 1 |
| 7 | `frontx.dashboard_m.widget.pie_chart.v1~` | `frontx.dashboard_v.mfe.pie_chart.v1` | `./pie_chart` | 1 |
| 8 | `frontx.dashboard_m.widget.heatmap.v1~` | `frontx.dashboard_v.mfe.heatmap.v1` | `./heatmap` | 1 |
| 9 | `frontx.dashboard_m.widget.markdown_card.v1~` | `frontx.dashboard_v.mfe.markdown_card.v1` | `./markdown_card` | 1 |

For example, row 5 gives the entry `gts.frontx.mfes.mfe.entry.v1~frontx.mfes.mfe.entry_mf.v1~frontx.dashboard_v.mfe.grid.v1` and the realization `gts.frontx.dashboard_v.mfe.widget_realization.v1~frontx.dashboard_v.mfe.grid.v1`, whose `widget_type` is `gts.frontx.dashboard_m.widget.widget.v1~frontx.dashboard_m.widget.data_widget.v1~frontx.dashboard_m.widget.grid.v1~`.

Each widget type has exactly one template realization, so with the template's packages alone every widget type has a single winner. A tie or a missing realization arises only from a consumer's copy of the GTS file, from a registration that the registry rejects, or from a template GTS file that cannot be fetched (section 6.1, precedence rule).

**What each entry loads.** Each entry lists the packages it uses in its manifest's `shared` array (section 6.10).

| Entries | Packages used |
|---------|---------------|
| Every widget entry | React with React DOM; the FrontX MFE runtime for the entry's bridge and lifecycle; `@gears-frontx/ui-kit`; and its own code, which bundles the shared widget chrome |
| Entries of `cartesian_chart`, `pie_chart`, `heatmap` | in addition, ECharts through `echarts/core` imports, and echarts-for-react |
| Entry of `grid` | in addition, TanStack Table v8 and the TanStack virtualizer |
| Larger-view modal entry; dashboards root entry | React with React DOM; the FrontX runtime (`@gears-frontx/react`, `@gears-frontx/mfes`); the FrontX gts-plugin; `@gears-frontx/ui-kit`; the code of the domain owner, with the data adapter interface, the trait helper, the loader, and the cannot-show placeholder |

**Cross-references**: widget types in feature-widget-catalog; DESIGN section 3.4 (Internal Dependencies) and section 3.5 (Third-Party Libraries).

### 6.5 Template GTS File and Loader

**Description**: The shell's manifest carries no GTS instances, and FrontX offers no registry listing, so the template delivers the widget realizations to the domain owners in its own JSON file of GTS types and instances that no MFE manifest carries (ADR-0010; DESIGN section 3.2, Template GTS File Loader).

**The file**:
- It lives in the `dashboard` package, is served by the template and not by the shell, and holds the 9 template realizations of section 6.4, each of weight 1 and with no `larger_view_entry`. Its location is part of the product's copy of the template.
- A consuming product adds or changes realizations, including replacement realizations (section 6.8), by editing its copy.
- A backend that returns the same GTS types and instances can take the file's place without a change to the dashboards root or the larger-view modal.

**The loader**: template code in the `dashboard` package, run by each domain owner in its own runtime, because the dashboards root and the larger-view modal each hold their own registry.
- It fetches the file at start, as if a backend returned it, and registers its types and instances before any dashboard loads.
- It loads no dashboard content and no product types; those come from the data adapter.
- When the file cannot be fetched, or an entry is rejected by the registry, it writes a diagnostic to the developer log that names the file or the entry. With no realization registered for a widget type, no realization wins for it, and every widget of that widget type gets the widget-level cannot-show state, shown by the domain owner. A failure to fetch the file therefore leaves no widget of any widget type showable, while the rest of the dashboard layout is unchanged (`cpt-frontx-dashboard-seq-cannot-show`, loader side).

**Cross-references**: DESIGN `cpt-frontx-dashboard-component-gts-file-loader`, `cpt-frontx-dashboard-seq-initial-load`, `cpt-frontx-dashboard-seq-cannot-show`; ADR-0008; ADR-0010.

### 6.6 Dashboard Manifest, Larger-View Modal, and Dashboards Root

**Description**: The manifest, the entries, and the extensions that the `dashboard` `mfe.json` carries, with the template's GTS types that it declares. The package declares no widget entry.

**Dashboard manifest**: `gts.frontx.mfes.mfe.mf_manifest.v1~frontx.dashboard_v.dashboard.manifest.v1`. The single manifest of the `dashboard` package, used by the larger-view modal's entry and by the dashboards root's entry. The package always has a manifest, because the modal's static extension and entry travel in it. Its authored fields are `id` and `remoteEntry`; the manifest pipeline produces the rest, as for the widget manifest in section 6.2.

**Larger-view modal entry**:

```json
{
  "id": "gts.frontx.mfes.mfe.entry.v1~frontx.mfes.mfe.entry_mf.v1~frontx.dashboard_v.mfe.larger_view_modal.v1",
  "requiredProperties": [
    "gts.frontx.mfes.comm.shared_property.v1~frontx.mfes.comm.theme.v1~",
    "gts.frontx.mfes.comm.shared_property.v1~frontx.mfes.comm.language.v1~"
  ],
  "actions": [
    "gts.frontx.mfes.comm.action.v1~frontx.dashboard_v.mfe.show_larger_view.v1~"
  ],
  "domainActions": [],
  "manifest": "gts.frontx.mfes.mfe.mf_manifest.v1~frontx.dashboard_v.dashboard.manifest.v1",
  "exposedModule": "./larger_view_modal"
}
```

The modal's entry requires theme and language, which the `popup` domain shares. It lists `show_larger_view` in `actions`, because the cell widget's chain sends it there and FrontX rejects an action whose target entry does not list it. It lists no domain actions: its close button sends the lifecycle action `unmount_ext` of itself to the `popup` domain with `history: "none"`, which the rule of section 6.3 exempts from the entry's `domainActions`. The `popup` domain declares no extension actions, so under the subset rule the extra `show_larger_view` does not block admission.

**Larger-view modal static extension**:

| Field | Value |
|-------|-------|
| `id` | `gts.frontx.mfes.ext.extension.v1~frontx.dashboard_v.mfe.larger_view_modal.v1`, fixed |
| `domain` | the `popup` domain by role; as a manifest-declared extension it carries the current `template-shell` identifier `gts.frontx.mfes.ext.domain.v1~frontx.screensets.layout.popup.v1`, or is generated from the shell constant at build time (`cpt-frontx-dashboard-constraint-role-based-host-ids`) |
| `entry` | `gts.frontx.mfes.mfe.entry.v1~frontx.mfes.mfe.entry_mf.v1~frontx.dashboard_v.mfe.larger_view_modal.v1` |
| route | a static route, so that FrontX routing restores the larger-view modal after a page refresh (FrontX ADR-0036); its form is open (section 6.11) |

- The extension is an instance of the FrontX extension base `gts.frontx.mfes.ext.extension.v1~`. The `popup` domain has no extension type constraint, so it accepts a plain extension (DESIGN section 3.5, host contract).
- The shell's bootstrap registers it in the shell's registry from the manifest channel, together with the modal's entry. Neither a cell widget nor the dashboards root nor the larger-view modal can register into the shell's registry (FrontX ADR-0008; `cpt-frontx-dashboard-principle-own-registry-registration`), and no template part registers anything when a larger view opens.
- Its identifier is fixed, so one larger-view modal exists per application tree (`cpt-frontx-dashboard-constraint-one-dashboards-root-per-tree`), and it never collides with generated extension identifiers.
- The modal registers its generated extensions of the `larger_view` domain in its own registry; those are specified in feature-extension-domain-catalog.
- Showing the modal needs a modal container for the `popup` domain in the shell, a prerequisite outside the template (DESIGN section 4, prerequisite (c)).

**Dashboards root entry and routed extension**, declared only when the dashboards root is a screen extension:

```json
{
  "id": "gts.frontx.mfes.mfe.entry.v1~frontx.mfes.mfe.entry_mf.v1~frontx.dashboard_v.mfe.dashboards_root.v1",
  "requiredProperties": [
    "gts.frontx.mfes.comm.shared_property.v1~frontx.mfes.comm.theme.v1~",
    "gts.frontx.mfes.comm.shared_property.v1~frontx.mfes.comm.language.v1~"
  ],
  "actions": [],
  "domainActions": [],
  "manifest": "gts.frontx.mfes.mfe.mf_manifest.v1~frontx.dashboard_v.dashboard.manifest.v1",
  "exposedModule": "./dashboards_root"
}
```

The dashboards root reads the host theme id, which it maps to the light or dark ui-kit scope of its own chrome, and the host language, for which it localizes its own text; the shell screen domain shares both. It publishes both values unchanged on `layout_cells`. It declares no actions, because the shell screen domain requires no extension actions.

The routed extension is an instance of the shell screen extension type, in the sense of FrontX ADR-0036. It is declared in the `dashboard` `mfe.json` and registered by the shell's bootstrap from the manifest channel.

| Field | Value |
|-------|-------|
| `id` | `gts.frontx.mfes.ext.extension.v1~frontx.screensets.layout.screen.v1~frontx.dashboard_v.screens.dashboards_root.v1` |
| `domain` | the shell screen domain by role; as a manifest-declared extension it carries the current `template-shell` identifier `gts.frontx.mfes.ext.domain.v1~frontx.screensets.layout.screen.v1`, or is generated from the shell constant at build time |
| `entry` | `gts.frontx.mfes.mfe.entry.v1~frontx.mfes.mfe.entry_mf.v1~frontx.dashboard_v.mfe.dashboards_root.v1` |
| `route` | required by the screen extension type; the route pattern is open (section 6.11) |
| `presentation` | a `label`, required by the screen extension type; the label text is open (section 6.11) |

**Template GTS types declared in the `dashboard` package**: the package carries the schemas of every type the template owns. Each domain owner registers its own domain instance (feature-extension-domain-catalog). The shell's bootstrap registers the non-action schemas of every package in the shell's registry; the registration of the template's schemas is stated in section 6.9.

| Type | Owning feature |
|------|----------------|
| `gts.frontx.dashboard_m.dashboard.dashboard.v1~` | feature-dashboard-root-types |
| `gts.frontx.dashboard_m.layout.layout.v1~`, `gts.frontx.dashboard_m.layout.cell.v1~` | feature-layout-types |
| the query base, the measure base, and the dimension base | the query vocabulary feature |
| `gts.frontx.dashboard_m.widget.widget.v1~`, the data widget, and the 9 widget types | feature-widget-catalog |
| `gts.frontx.dashboard_m.widget_data.widget_data.v1~` and its 8 derived shapes | feature-widget-data-catalog |
| the 4 action types and the two extension types | feature-extension-domain-catalog |
| `gts.frontx.dashboard_v.mfe.widget_realization.v1~` | this feature (section 6.1) |

**Cross-references**: DESIGN section 3.1 (ID-form convention), `cpt-frontx-dashboard-component-dashboards-root`, `cpt-frontx-dashboard-component-larger-view-modal`, host contract in section 3.5 (`cpt-frontx-dashboard-constraint-role-based-host-ids`); ADR-0007; ADR-0010.

### 6.7 Admission Summary

**Description**: How each entry passes FrontX ADR-0010 admission in the domain it is mounted into, restated from DESIGN section 3.3 (Admission of entries). Under the subset rule, an entry's required shared properties must be among the domain's shared properties, and the entry's actions must cover the extension actions that the domain requires; extra entry actions do not block admission.

| Entries | Domain | Domain shares | Domain requires of extensions | Entry requires and supports | Result |
|---------|--------|---------------|-------------------------------|-----------------------------|--------|
| 9 widget entries, and a consumer entry | `layout_cells` | theme, language | `set_widget_context`, `set_data` | requires theme and language; supports `set_widget_context` and `set_data`; its `request_data` is among the domain's actions | admitted |
| 9 widget entries, and a consumer entry | `larger_view` | theme, language | `set_widget_context`, `set_data` | the same | admitted |
| Larger-view modal entry | the `popup` domain | theme, language | none | requires theme and language; supports `show_larger_view`, which the domain does not require; lists no domain action | admitted |
| Dashboards root entry | the shell screen domain | theme, language | none | requires theme and language; supports no action | admitted |

The larger-view modal's static extension is admitted to the `popup` domain because that domain has no extension type constraint. The dashboards root's routed extension is admitted to the shell screen domain as an instance of the shell screen extension type with a `route` and a `presentation` label. Admission follows the registry that holds the domain: the `popup` domain and the shell screen domain are in the shell's registry, and `layout_cells` and `larger_view` are in the registries of their owners.

### 6.8 Consumer Replacement Package

**Description**: How a consuming product replaces how one template widget type is shown, in a cell and in the larger view (`cpt-frontx-dashboard-fr-replacement-widget`; DESIGN section 3.3, Consumer replacement).

The consuming product ships its own package under `src-app/mfe_packages/`, next to the template's packages, with its own `mfe.json`. The package declares:

- its own manifest, which the domain owners register because the realization names its entry (section 6.2);
- its own entry, a plain instance of the FrontX MFE entry type with the shape of section 6.3: it requires theme and language, lists `set_widget_context` and `set_data` in `actions`, and lists `request_data` in `domainActions`, so that `layout_cells` and `larger_view` both admit it (section 6.7).

The product adds to its copy of the template's GTS file one replacement realization with its own identifier, whose `widget_type` names one of the 9 template widget types, whose `entry` names that entry, whose `larger_view_entry` is present only if the larger view needs different code, and whose `weight` is above 1.

For example, a consuming product with the vendor `acme` that replaces the `grid` widget type could add the realization `gts.frontx.dashboard_v.mfe.widget_realization.v1~acme.dashboard.mfe.grid.v1` with `widget_type` `gts.frontx.dashboard_m.widget.widget.v1~frontx.dashboard_m.widget.data_widget.v1~frontx.dashboard_m.widget.grid.v1~`, `entry` `gts.frontx.mfes.mfe.entry.v1~frontx.mfes.mfe.entry_mf.v1~acme.dashboard.mfe.grid.v1`, and `weight` 2.

**Effects**:
- The consumer's manifest and entry reach the registries through the manifest channel like the template's entries, and the realization through the copy of the template's GTS file. The domain owners register every manifest that a registered realization names, so the replacement resolves in their nested registries.
- The replacement is selected for its widget type (section 6.1): the dashboards root generates every cell extension of that widget type from the consumer's `entry`, and the larger-view modal generates its larger-view extensions from the consumer's `larger_view_entry` when named and from `entry` otherwise. The template's realization for that widget type stays registered but unused. The other widget types keep the template's realizations.
- The template's packages stay unchanged.
- Two realizations that replace the same widget type with the same highest weight are resolved by `cpt-frontx-dashboard-algo-extension-domain-catalog-select-realization`; the weights decide the outcome, and a consumer gives its replacement a weight no other realization of that widget type has.
- The consumer's widget carries the obligations of `cpt-frontx-dashboard-fr-replacement-widget`: the per-widget states, the larger view, the host theme, and accessibility.

**No consumer widget types.** A replacement realization names one of the 9 template widget types, because every widget instance belongs to one of them. Consumer widget types are listed under Not covered in DESIGN section 4.

**Cross-references**: `cpt-frontx-dashboard-interface-widget-realization`, `cpt-frontx-dashboard-topology-overlay-packages`; ADR-0008; ADR-0010.

### 6.9 Package Contents and Schema Registration

**Description**: What each template package contains, how the template's schemas are registered, and the compatibility rules that bind the packages (`cpt-frontx-dashboard-topology-overlay-packages`; ADR-0010; DESIGN section 3.8).

**Package placement**:

| Package subtree | Declarations in its `mfe.json` | Code and files |
|-----------------|--------------------------------|----------------|
| `src-app/mfe_packages/dashboard/` | the template's GTS types, action types and extension types, the `dashboard` manifest, the larger-view modal's entry and static extension, and, when the dashboards root is a screen extension, its entry and routed extension (section 6.6) | the types of `dashboard_m` and `dashboard_v`; the template's GTS file with the 9 realizations; the code of the dashboards root and of the larger-view modal; the code that both carry: the data adapter interface, the trait helper, the GTS file loader, and the cannot-show placeholder. No data adapter implementation. |
| `src-app/mfe_packages/widgets/` | the `widgets` manifest and the 9 widget entries (sections 6.2 to 6.4) | the 9 widgets, the shared widget chrome (title, larger-view button, loader, busy indicator, empty state), and the grid shell. No data-request code beyond the `request_data` action, and no error chrome. |
| a consumer package, when present | its manifest and its entry (section 6.8) | the consumer's widget |

The product adds its data adapter implementation to its copy of the template; the template holds none. The trait helper is owned by the query vocabulary feature and the data adapter interface by feature-data-adapter-contract; this feature states only that both live in the `dashboard` package and that both owners carry them.

**Shared widget chrome and grid shell.** The chrome and the grid shell realize the presentation rules of feature-widget-catalog, which the entries of the `widgets` package bundle:
- The chrome states: the title, the loader, the busy indicator, the empty state, and the larger-view button, shown only in a cell widget whose context carries a larger view. The wording of each state is specified in feature-widget-catalog. The cannot-show placeholder is shown by the domain owner, and its code is in the `dashboard` package (`cpt-frontx-dashboard-fr-loading-error-states`).
- The grid shell: sort headers, a pager, a page-size choice, column resizing, and the rows of a page rendered virtualized, so the DOM holds only the rows in view (`cpt-frontx-dashboard-fr-grid-sort-page`, `cpt-frontx-dashboard-nfr-large-table`).
- All styling uses `@gears-frontx/ui-kit` tokens in the light or dark scope that the host theme id maps to (`cpt-frontx-dashboard-nfr-visual-quality`).

**Schema registration.** The template's schemas, meaning its types, action types, and extension types, are registered before any dashboard loads (`cpt-frontx-dashboard-seq-initial-load`).
- When the dashboards root is a screen extension, they are registered through the `dashboard` package manifest, which the shell's bootstrap registers first among the template's declarations.
- When the dashboards root is code in the shell of a single-page application, the shell's own bootstrap registers them.
- Each domain owner registers its own domain instance (feature-extension-domain-catalog); the template registers no domain instance.
- The query family type schemas come from the served-families declaration of the data adapter, and the owners register them at start; dataset types arrive with the dashboard (feature-data-adapter-contract).
- The type store that nested owners validate against is realm-shared, a FrontX prerequisite outside the template (DESIGN section 4, prerequisite (b)).

**Compatibility** (`cpt-frontx-dashboard-nfr-compatibility`):
- The packages depend on `template-shell` and the FrontX packages only, and take nothing from `template-mfe` or from any other template (`cpt-frontx-dashboard-constraint-shell-only-dependency`). `widgets` depends on `dashboard` only for GTS identifiers, and `dashboard` reaches the widget entries only at run time, through the realizations (DESIGN section 3.4).
- Every `@gears-frontx/*` package is pinned to exact published versions, on a FrontX release that runs GTS v0.17 and provides the realm-shared GTS type store (DESIGN section 3.5, pin rule).
- Shell domain identifiers come from shell framework constants in TypeScript code and are data in manifests (`cpt-frontx-dashboard-constraint-role-based-host-ids`).
- The template's parts sit in the overlay subtrees `dashboard` and `widgets` of `src-app/mfe_packages/`, next to the shell's own packages.

**Consumer guide** (`cpt-frontx-dashboard-nfr-consumer-docs`). The consumer guide ships with the source. It covers how to implement and register the data adapter, the two hosting forms of the dashboards root, the replacement package of section 6.8 and the edit of the template's GTS file, and the shell prerequisites. The documents under `template-dashboard/architecture/` are not shipped.

### 6.10 Shared Dependencies and Budget Basis

**Description**: Packaging rules that apply to every entry of this feature.

**Shared dependencies**:
- In every template MFE, that is every widget entry, the larger-view modal, and the dashboards root when it is a screen extension, the packages listed in the `shared` array of the manifest are built as shared dependencies, one standalone chunk each. The manifest pipeline records the list (section 6.2).
- FrontX fetches the source text of a shared dependency once only when every template MFE publishes the same `contentHash` for it (FrontX ADR-0034), and the cache reaches the whole realm (FrontX ADR-0035). The template assumes equal content hashes, which holds when all its MFEs are built together from one pinned set of package versions. MFEs built from different package versions fetch the dependency once per distinct hash and exceed the budget basis.
- FrontX gives every MFE instance its own evaluated copy (FrontX ADR-0011; template ADR-0001), so each instance evaluates its own copy. Each chart widget instance evaluates its own ECharts and registers its own ECharts theme, and each `grid` instance evaluates its own TanStack Table. Source reuse saves fetches, not evaluation.
- Per-instance memory is held per extension id until page unload (FrontX ADR-0011). The deterministic ids of generated extensions keep it bounded (feature-extension-domain-catalog).
- No MFE relies on template-owned state shared between instances (`cpt-frontx-dashboard-principle-per-instance-isolation`). The FrontX gts-plugin keeps its realm-shared type store by its own design, and the template uses it as it is.
- Every listed package passes the package-wide license check (`cpt-frontx-dashboard-constraint-licensing-compliance-resources`).

**Budget basis** (DESIGN section 3.9; provisional figures, re-measured on production builds and then confirmed or revised). The budget measures transferred gzipped bytes on a cold load of the reference dashboard, with an empty browser cache.

| Unit | Provisional budget | Counting rule |
|------|--------------------|---------------|
| Dashboards root | under 500 KB gzipped | its own code plus every shared dependency it fetches itself, on a cold load of the reference dashboard |
| Larger-view modal | under 500 KB gzipped | its own code plus every shared dependency it fetches itself, on the first opening of a larger view after that load |
| Each widget entry | under 100 KB gzipped | its own code only, including the shared widget chrome it bundles; shared dependencies are excluded |
| Page total | no cap | every byte transferred on the cold load and the first opening; each shared dependency, such as ECharts, TanStack Table, the virtualizer, ui-kit, and the FrontX packages, is counted once; recorded with the results |

The product's data adapter and its backend client are bundled with the domain owners but are product code, counted outside these figures. Evaluation cost is not part of the bundle budget; each instance's evaluation of its own copies is covered by the initial-render budget (`cpt-frontx-dashboard-nfr-initial-render`).

### 6.11 Open Questions

- **Routed extension details.** DESIGN section 4 (open question 6) leaves open the route pattern and the presentation label of the dashboards root's routed extension, the static route of the larger-view modal, and the form of its private subroute parameters. This feature uses `./dashboards_root` and `./larger_view_modal` as `exposedModule` values; they are fixed with the `dashboard` package's build exposes, not with routing. Owner: template architect.
- **Template GTS file name and envelope.** The file name and the JSON envelope that holds the types and instances (section 6.5) are open. Owner: template architect.

## 7. Acceptance Criteria

- [ ] `cfs validate --artifact` reports no structural errors for this document.
- [ ] The widget realization type `gts.frontx.dashboard_v.mfe.widget_realization.v1~` is declared in the `dashboard` package with the schema of section 6.1; a realization with `id`, `widget_type`, and `entry` and no `weight` validates and counts as weight 1; a realization with `larger_view_entry` validates; a realization without `entry`, with `weight` 0, or with an extra field fails validation.
- [ ] No template entry uses a type derived from `gts.frontx.mfes.mfe.entry.v1~frontx.mfes.mfe.entry_mf.v1~`, and no entry carries a field beyond that type.
- [ ] `widgets` declares exactly one manifest, `gts.frontx.mfes.mfe.mf_manifest.v1~frontx.dashboard_v.widgets.manifest.v1`, and exactly 9 entries, with the identifiers and `exposedModule` values of section 6.4; every entry points to that manifest.
- [ ] The template's GTS file holds exactly 9 realizations of weight 1, none with a `larger_view_entry`; each names one of the 9 widget types and the entry of that widget type declared in the `widgets` manifest; each of the 9 widget types is named by exactly one template realization.
- [ ] Every widget entry requires exactly the theme and language shared properties, lists `set_widget_context` and `set_data` in `actions`, and lists `request_data` in `domainActions`; `markdown_card` lists them too.
- [ ] Every widget entry is admitted to `layout_cells` and to `larger_view`, and receives `set_widget_context` and `set_data` in both.
- [ ] Given the template's packages and GTS file only, when a dashboard with one cell widget of each of the 9 widget types, each with a larger-view widget of the same type, resolves, then every cell and every larger view uses the entry of the template realization of its widget type.
- [ ] Given a fixture realization of weight 2 (or the only realization of its type) that names a `larger_view_entry`, when a dashboard with that widget type in a cell and in the larger view resolves, then the cell uses `entry` and the larger view uses `larger_view_entry`.
- [ ] Given a fixture consumer package with a `grid` entry and a `grid` realization of weight 2 in the fixture's copy of the template's GTS file, when a dashboard with a `grid` cell and a `pie_chart` cell resolves, then the `grid` cell and its larger view show the consumer's entry, the `pie_chart` cell uses the template realization, and the template's packages are unchanged.
- [ ] Given two realizations of weight 2 for `grid` in the product's copy of the GTS file, when a dashboard with a `grid` cell resolves, then that cell shows the state that `cpt-frontx-dashboard-algo-extension-domain-catalog-select-realization` gives for a tie, and the other cells are unaffected.
- [ ] Given a template GTS file that cannot be fetched, when a dashboard resolves, then the developer log names the file, no realization is registered, and every widget shows the cannot-show state, while the dashboard layout is unchanged.
- [ ] The dashboards root and the larger-view modal fetch the template's GTS file at start and register its contents before the first dashboard loads; a test that serves the same GTS types and instances from a test backend instead of the file changes nothing in either.
- [ ] `dashboard` declares the `dashboard` manifest `gts.frontx.mfes.mfe.mf_manifest.v1~frontx.dashboard_v.dashboard.manifest.v1` and the larger-view modal's entry, which is a plain FrontX MFE entry that requires theme and language, lists `show_larger_view` in `actions`, and lists no domain actions.
- [ ] The larger-view modal's extension `gts.frontx.mfes.ext.extension.v1~frontx.dashboard_v.mfe.larger_view_modal.v1` is an instance of `gts.frontx.mfes.ext.extension.v1~` whose `domain` is the `popup` domain and whose `entry` is the modal's entry; on a shell that renders the modal container for its `popup` domain, the shell's bootstrap registers it before the first larger view opens, and no template part registers an extension of the `popup` domain at run time.
- [ ] When the dashboards root is a screen extension, `dashboard` declares its entry, a plain FrontX MFE entry that requires theme and language and declares no actions and no domain actions, and the routed extension `gts.frontx.mfes.ext.extension.v1~frontx.screensets.layout.screen.v1~frontx.dashboard_v.screens.dashboards_root.v1` in the shell screen domain, with a `route` and a presentation label.
- [ ] The template's schemas are registered before the first dashboard loads: through the `dashboard` manifest when the dashboards root is a screen extension, and through the shell's own bootstrap when it is code in the shell.
- [ ] No package's `mfe.json` contains a template GTS instance (no widget realization) or any dashboard content, widget data included; the `widgets` package contains no data-request code beyond the `request_data` action and no error chrome; the `dashboard` package contains no data adapter implementation.
- [ ] A dependency check finds that the packages depend on `template-shell` and the pinned FrontX packages only, and on nothing from `template-mfe`; the pinned versions are exact published versions.
- [ ] Given an open dashboard and an open larger view, when the host theme id changes, then every cell widget and the larger-view widget switch to the matching ui-kit scope without a request and without showing a skeleton again.
- [ ] Every identifier of this feature follows the template ID-form convention: types end with `~`, instances do not, every template segment is at `v1`, the GTS packages are `frontx.dashboard_m` and `frontx.dashboard_v`, and no field uses `x-gts-ref`.
- [ ] Build review confirms that every widget entry, the larger-view modal, and, when it is a screen extension, the dashboards root list all their packages in the `shared` array of their manifests, that all template MFEs publish the same `contentHash` for each shared dependency, that every listed package passes the package-wide license check, and that no MFE relies on template-owned state shared between instances.
- [ ] Transferred gzipped bytes on a cold load of the reference dashboard and on the first opening of a larger view are measured and recorded per section 6.10: the dashboards root and the larger-view modal with the shared dependencies they fetch themselves, each widget entry with its own code only, and each shared dependency counted once in the page total; the measurement records one fetch per shared dependency.
- [ ] The grid shell is checked against `cpt-frontx-dashboard-fr-grid-sort-page` and `cpt-frontx-dashboard-nfr-large-table` on the reference dashboard: sort, page, and page size work by keyboard, and scrolling a 500-row page never stops the view responding for longer than the provisional figure of DESIGN section 3.9.
- [ ] The consumer guide ships with the source and covers the data adapter, the hosting forms of the dashboards root, the consumer replacement package, and the shell prerequisites.
- [ ] No template TypeScript source writes a host domain identifier as a literal; the manifest-declared static extension and routed extension carry the current `template-shell` identifiers or are generated from the shell constants at build time.
