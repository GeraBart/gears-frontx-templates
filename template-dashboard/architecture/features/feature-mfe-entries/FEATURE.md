---
status: accepted
version: 1
date: 2026-10-27
description: Domain model of the widget realization type and the template's 9 realizations, the widget manifest with 9 cell entries, 9 modal entries, and 9 static extensions of the host modal domain declared by dashboard-widgets, the Viewer host manifest, entry, routed extension, and registered types declared by dashboard-viewer, the packaging of a consumer replacement realization, and the shared-package and budget rules of every entry.
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
  - [Viewer Host Package](#viewer-host-package)
  - [Static Modal Extensions and Own-Registry Registration](#static-modal-extensions-and-own-registry-registration)
  - [Consumer Replacement Package](#consumer-replacement-package)
  - [Shared Packages and Budget Basis](#shared-packages-and-budget-basis)
- [6. Domain Model](#6-domain-model)
  - [6.1 Widget Realization Type](#61-widget-realization-type)
  - [6.2 Widget Manifest](#62-widget-manifest)
  - [6.3 Widget Entries, Static Modal Extension, and Realization: Grid Example](#63-widget-entries-static-modal-extension-and-realization-grid-example)
  - [6.4 Declarations for All 9 Widget Types](#64-declarations-for-all-9-widget-types)
  - [6.5 Viewer Host Package (declared by `dashboard-viewer`)](#65-viewer-host-package-declared-by-dashboard-viewer)
  - [6.6 Admission Summary](#66-admission-summary)
  - [6.7 Consumer Replacement Package](#67-consumer-replacement-package)
  - [6.8 Packaging, Isolation, and Budget Basis](#68-packaging-isolation-and-budget-basis)
  - [6.9 Open Questions](#69-open-questions)
- [7. Acceptance Criteria](#7-acceptance-criteria)

<!-- /toc -->

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-featstatus-mfe-entries`
## 1. Feature Context

- [ ] `p2` - `cpt-frontx-dashboard-feature-mfe-entries`

### 1.1 Overview

This is a **domain-model feature**, not an actor-flow feature. It declares the widget realization type, which binds one widget type to the cell entry and the static modal extension that show it, and it lists every realization, entry, static extension, and manifest that the template ships. It also states how a consuming product packages a replacement realization, and which packages every entry declares as shared. The flow, process, and state sections of the FEATURE template are reduced to short not-applicable notes; the type and the instances live in section 6 Domain Model.

### 1.2 Purpose

Concrete types and instances of the "widget realization" part of DESIGN section 3.1, and the MFE entries, static modal extensions, and manifests of the two template packages. Every identifier builds on the FrontX MFE base types (`gts.frontx.mfes.*`) and uses the template's `frontx` vendor namespaces (`gts.frontx.v.*`, `gts.frontx.m.*`), with every template segment at `v1`. DESIGN section 3.1 delegates the field-level schema of the realization type and the exact identifier forms of the entries and static modal extensions to this document, so section 6 carries them.

The declarations follow the DESIGN and ADR-0008:

- Widget entries are plain instances of the FrontX Module Federation entry type `gts.frontx.mfes.mfe.entry.v1~frontx.mfes.mfe.entry_mf.v1~`. That type is final, so the template adds no entry type and no field to entries.
- The widget realization type `gts.frontx.v.mfe.widget_realization.v1~` links the two type families: a realization names one widget type, its cell entry, its static modal extension, and a weight. For each widget type the single realization with the highest weight wins.
- For each of the 9 template widget types, `dashboard-widgets` declares one cell entry, one modal entry, one static extension of the host modal domain whose entry is the modal entry, and one realization of weight 1.
- `dashboard-viewer` declares the Viewer host manifest, the Viewer host entry, and the Viewer host's routed extension in the host screen domain, and it carries the template's GTS types.
- A consuming product may replace how one template widget type is shown with a realization of a higher weight in its own package. It adds no widget types in v1.
- Every template MFE declares all its packages as shared. Each MFE instance still evaluates its own copy (per-instance isolation).

**Declaring packages**:
- `dashboard-widgets` (`src-app/mfe_packages/dashboard-widgets/`) declares, through its own `mfe.json`, the widget manifest, the 9 cell entries, the 9 modal entries, the 9 static modal extensions, and the 9 template realizations (sections 6.2 to 6.4).
- `dashboard-viewer` (`src-app/mfe_packages/dashboard-viewer/`) declares the widget realization type schema as an engine `frontx.v` type (DESIGN section 3.1, Location), and the Viewer host manifest, the Viewer host entry, and the Viewer host routed extension (section 6.5).

**Requirements**: `cpt-frontx-dashboard-fr-widget-catalog`, `cpt-frontx-dashboard-fr-domain-model`, `cpt-frontx-dashboard-fr-viewer-host`, `cpt-frontx-dashboard-fr-widget-modal`, `cpt-frontx-dashboard-fr-theme`, `cpt-frontx-dashboard-fr-replacement-widget`, `cpt-frontx-dashboard-nfr-bundle-budget`

**Principles**: `cpt-frontx-dashboard-principle-per-instance-isolation`, `cpt-frontx-dashboard-principle-own-registry-registration`, `cpt-frontx-dashboard-principle-gts-contracts`

**Constraints**: `cpt-frontx-dashboard-constraint-gts-id-convention`, `cpt-frontx-dashboard-constraint-role-based-host-ids`, `cpt-frontx-dashboard-constraint-shell-only-dependency`

### 1.3 Actors

N/A. This is a domain-model feature. Its type and instances are consumed by the runtime type system and by the registration path of the host bootstrap and the Viewer host (the manifest channel), not by an end-user actor, so no actor flows are authored. The actors of the use cases in section 2 are defined in the PRD.

### 1.4 References

- **PRD**: [PRD.md](../../PRD.md)
- **Design**: [DESIGN.md](../../DESIGN.md) section 2.1 (Per-Instance Isolation, No Shared Singletons; Each Nested Host Registers Only in Its Own Registry), section 2.2 (Dependency on `template-shell` Only; Host Identifiers by Role; GTS Identifier Form and Freeze), section 3.1 (Domain Model, ID-form convention, Widget realization), section 3.2 (Viewer Host, Widget Library), section 3.3 (Widget Realization; Template Extension Domains: admission of entries and identifier uniqueness), section 3.4 (Internal Dependencies), section 3.5 (Host contract, Manifest channel), section 3.6 (Widget Modal Open, Theme Switch), section 3.8 (Deployment Topology), section 3.9 (Bundle budget, Dependency sharing rules), section 4 (handoffs, open questions, later stages)
- **ADRs**: [ADR-0006](../../ADR/0006-theme-distribution-v1.md), [ADR-0007](../../ADR/0007-extension-domain-taxonomy-v1.md), [ADR-0008](../../ADR/0008-widget-type-and-mfe-realization-v1.md), [ADR-0010](../../ADR/0010-template-packages-and-host-contract-v1.md)
- **Design elements**: `cpt-frontx-dashboard-component-widget-library`, `cpt-frontx-dashboard-component-viewer-host` (its entry, manifest, and routed extension only), `cpt-frontx-dashboard-topology-overlay-packages`, `cpt-frontx-dashboard-interface-widget-realization`, `cpt-frontx-dashboard-contract-host-areas` (the host screen domain and the host modal domain by role), `cpt-frontx-dashboard-interface-domain-model` (realization and entry part), `cpt-frontx-dashboard-seq-widget-modal-open` (entry side: the static modal extension and the modal entry that the chain mounts)
- **Dependencies**:
  - [feature-widget-catalog](../feature-widget-catalog/FEATURE.md): the widget base and the 9 widget types that a realization's `widget_type` names, and the shared widget chrome that every cell and modal entry uses (section 6.10 there).
  - [feature-extension-domain-catalog](../feature-extension-domain-catalog/FEATURE.md): the action `set_widget_context` that every entry supports (section 6.1 there), the `layout_cells` domain that admits the cell entries (section 6.2 there), the extension type whose `entry` the Viewer host takes from the winning realization (section 6.3 there), the disjoint identifier sets of cell extensions and static modal extensions (section 6.4 there), and the larger-view chain that mounts a static modal extension (section 6.5 there). Its process "Create Cell Extensions at Dashboard Resolve" (section 3 there) applies the realization precedence of section 6.1.
- **Related**: [feature-backend-contract](../feature-backend-contract/FEATURE.md): the dashboard request whose result the Viewer host checks (section 6.1 there), the widget data request that every cell and modal entry sends with the `source` of its widget instance (section 6.2 there), and the failure classes and wording of the states that the entries show (section 6.3 there).

## 2. Actor Flows (CDSL)

**Use cases**: `cpt-frontx-dashboard-usecase-view-dashboard`, `cpt-frontx-dashboard-usecase-provide-dashboard`

### Domain-Model Feature: No Actor Flows

Not applicable because this feature declares static GTS types and instances; no actor interacts with the declarations themselves. In the viewing use case, the Viewer host entry is the screen that the dashboard viewer opens, and the cell and modal entries are the widgets in the cells and in the larger view. In the providing use case, a template consumer supplies its own widget for one widget type by shipping the replacement package of section 6.7. The runtime paths that use these instances are the manifest channel registration (DESIGN section 3.5) and the DESIGN sequences `cpt-frontx-dashboard-seq-initial-load`, `cpt-frontx-dashboard-seq-widget-modal-open`, and `cpt-frontx-dashboard-seq-theme-switch`.

## 3. Processes / Business Logic (CDSL)

### Domain-Model Feature: No Processes

Not applicable because this feature declares schemas and instances only. The realization precedence is a rule over the declared instances (section 6.1); the Viewer host applies it in feature-extension-domain-catalog section 3. Registration from the manifest channel is done by the host bootstrap and the Viewer host (DESIGN section 3.5) and is runtime behavior outside this feature.

## 4. States (CDSL)

### Domain-Model Feature: No State Machines

Not applicable because type and instance declarations are stateless. The extension lifecycle stages are declared by the domains: `layout_cells` in feature-extension-domain-catalog section 6.2, and the host modal domain by the shell.

## 5. Definitions of Done

### Domain Model Definition of Done

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-dod-mfe-entries-catalog-complete`

The system **MUST** declare in the `dashboard-widgets` `mfe.json` exactly one manifest and, for each of the 9 template widget types, one cell entry, one modal entry, one static extension of the host modal domain, and one widget realization of weight 1, with the identifiers of sections 6.3 and 6.4.

- Every cell and modal entry is a plain instance of `gts.frontx.mfes.mfe.entry.v1~frontx.mfes.mfe.entry_mf.v1~`, points to the widget manifest, requires the theme and language shared properties, lists `set_widget_context` in `actions`, and has an empty `domainActions`.
- No entry uses a type derived from the FrontX Module Federation entry type, and no entry carries a field beyond that type.
- Every static modal extension is an instance of the FrontX extension base `gts.frontx.mfes.ext.extension.v1~`, names the host modal domain in `domain`, and names the modal entry of its widget type in `entry`.
- Every template realization names one of the 9 widget types, the cell entry of that widget type, and the static modal extension of that widget type, all from the same manifest, and has weight 1.
- Every cell and modal widget maps the host theme id that it receives as the theme shared property to the light or dark scope of `@gears-frontx/ui-kit`; the template declares no theme type and no theme instance.
- No manifest-declared instance carries a dashboard, a widget instance, or widget data.

**Covers (PRD)**: `cpt-frontx-dashboard-fr-widget-catalog`, `cpt-frontx-dashboard-fr-widget-modal`, `cpt-frontx-dashboard-fr-theme`, `cpt-frontx-dashboard-fr-domain-model`

**Covers (DESIGN)**: `cpt-frontx-dashboard-component-widget-library`, `cpt-frontx-dashboard-interface-widget-realization`, `cpt-frontx-dashboard-interface-domain-model`, `cpt-frontx-dashboard-principle-gts-contracts`, `cpt-frontx-dashboard-seq-widget-modal-open`, `cpt-frontx-dashboard-seq-theme-switch`

**Constraints**: `cpt-frontx-dashboard-constraint-gts-id-convention`, `cpt-frontx-dashboard-constraint-role-based-host-ids`

**Touches**:
- Entities: widget manifest, cell entries, modal entries, static modal extensions, widget realizations

### Widget Realization Type and Precedence

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-dod-mfe-entries-widget-realization`

The system **MUST** declare the widget realization type `gts.frontx.v.mfe.widget_realization.v1~` in `dashboard-viewer` with the fields `id`, `widget_type`, `entry`, `modal_extension`, and `weight` of section 6.1, and **MUST** give every realization the precedence of section 6.1.

- `id`, `widget_type`, `entry`, and `modal_extension` are required; `weight` is optional, an integer of at least 1, and counts as 1 when it is missing. No other field is allowed.
- `widget_type` holds a type identifier and uses `x-gts-type-ref`; `id`, `entry`, and `modal_extension` hold instance identifiers and use `x-gts-instance-ref`; no field uses `x-gts-ref`.
- `widget_type` is the only reference from package `v` into package `m`.
- For each widget type, the single registered realization with the highest weight wins; a tie at the highest weight, or no realization, leaves every cell of that widget type in its cannot-show state, as feature-extension-domain-catalog section 3 applies it.
- A realization is a GTS instance, not an admitted extension: registering it admits nothing.

**Covers (PRD)**: `cpt-frontx-dashboard-fr-domain-model`, `cpt-frontx-dashboard-fr-viewer-host`, `cpt-frontx-dashboard-fr-replacement-widget`

**Covers (DESIGN)**: `cpt-frontx-dashboard-interface-widget-realization`, `cpt-frontx-dashboard-interface-domain-model`, `cpt-frontx-dashboard-principle-gts-contracts`

**Constraints**: `cpt-frontx-dashboard-constraint-gts-id-convention`

**Touches**:
- Entities: widget realization type, widget realizations

### Viewer Host Package

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-dod-mfe-entries-viewer-host-package`

The system **MUST** declare in the `dashboard-viewer` `mfe.json` the Viewer host manifest, the Viewer host entry, and the Viewer host routed extension of section 6.5, together with the template's GTS types listed there, and **MUST NOT** declare any other entry or extension there.

- The Viewer host entry is a plain instance of the FrontX Module Federation entry type, points to the Viewer host manifest, requires theme and language, and declares no actions and no domain actions.
- The routed extension is an instance of the shell screen extension type in the host screen domain. Its `route` carries the dashboard instance identifier, and it has a presentation label.
- Manifest-declared host identifiers are data that carry the current `template-shell` identifiers, or are generated from the shell constants at build time; TypeScript code never writes them as literals.
- The `dashboard-viewer` package depends on `template-shell` and the pinned FrontX packages only, and on nothing from `template-mfe`.

**Covers (PRD)**: `cpt-frontx-dashboard-fr-viewer-host`, `cpt-frontx-dashboard-fr-theme`, `cpt-frontx-dashboard-contract-host-areas`

**Covers (DESIGN)**: `cpt-frontx-dashboard-component-viewer-host`, `cpt-frontx-dashboard-topology-overlay-packages`

**Constraints**: `cpt-frontx-dashboard-constraint-role-based-host-ids`, `cpt-frontx-dashboard-constraint-shell-only-dependency`, `cpt-frontx-dashboard-constraint-gts-id-convention`

**Touches**:
- Entities: Viewer host manifest, Viewer host entry, Viewer host routed extension, template GTS types

### Static Modal Extensions and Own-Registry Registration

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-dod-mfe-entries-static-modal-extensions`

The system **MUST** deliver every modal entry and every static modal extension through the manifest channel, so that the host bootstrap registers them in the shell's registry, and **MUST NOT** let any template part register an extension of the host modal domain at run time.

- Every realization, template or consumer, names a static modal extension, so every cell widget can open its larger view.
- One static modal extension per widget type serves every widget of that type; each opening sends the widget's own context with `set_widget_context`.
- The static modal extension identifiers are fixed, one per realization, and disjoint from the cell extension identifiers.
- The modal entries and the static modal extensions are registered before the first larger view opens (DESIGN section 4, open question 2).
- Every modal entry is admitted to the host modal domain, and every cell entry to `layout_cells` (section 6.6).

**Covers (PRD)**: `cpt-frontx-dashboard-fr-widget-modal`, `cpt-frontx-dashboard-contract-host-areas`

**Covers (DESIGN)**: `cpt-frontx-dashboard-principle-own-registry-registration`, `cpt-frontx-dashboard-interface-widget-realization`, `cpt-frontx-dashboard-seq-widget-modal-open`

**Constraints**: `cpt-frontx-dashboard-constraint-role-based-host-ids`

**Touches**:
- Entities: modal entries, static modal extensions

### Consumer Replacement Package

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-dod-mfe-entries-consumer-replacement`

The system **MUST** accept a replacement realization that a consuming product ships in its own package by section 6.7, and **MUST** then show the consumer's cell entry and larger view for every widget of that widget type, without a change to the template's packages.

- The consumer package carries its own manifest, cell entry, modal entry, static modal extension, and a realization with a weight above 1 that names one of the 9 template widget types.
- The template's realization for that widget type stays registered but unused; the other widget types keep the template's realizations.
- No consumer widget type is accepted in v1.

**Covers (PRD)**: `cpt-frontx-dashboard-fr-replacement-widget`, `cpt-frontx-dashboard-fr-domain-model`

**Covers (DESIGN)**: `cpt-frontx-dashboard-interface-widget-realization`, `cpt-frontx-dashboard-topology-overlay-packages`

**Constraints**: `cpt-frontx-dashboard-constraint-gts-id-convention`

**Touches**:
- Entities: consumer package, replacement realization, consumer cell entry, consumer modal entry, consumer static modal extension

### Shared Packages and Budget Basis

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-dod-mfe-entries-shared-packages`

The system **MUST** declare, for every template MFE, every package it uses as shared, and **MUST** measure the download size of the entries by the budget basis of section 6.8.

- The Viewer host entry and every cell and modal entry declare all their packages as shared, also stateful ones; no entry relies on a template-owned singleton shared between instances.
- Every declared package passes the package-wide license check.
- The budget counts transferred gzipped bytes on a cold load of the reference dashboard: the Viewer host with the shared packages it fetches itself, each widget entry with its own code only, and each shared package once in the page total.

**Covers (PRD)**: `cpt-frontx-dashboard-nfr-bundle-budget`

**Covers (DESIGN)**: `cpt-frontx-dashboard-principle-per-instance-isolation`, `cpt-frontx-dashboard-topology-overlay-packages`

**Constraints**: `cpt-frontx-dashboard-constraint-shell-only-dependency`

**Touches**:
- Entities: widget manifest, Viewer host manifest, every entry

## 6. Domain Model

### 6.1 Widget Realization Type

**GTS ID**: `gts.frontx.v.mfe.widget_realization.v1~`

**Description**: Binds one widget type to the MFE parts that show it: the cell entry, from which the Viewer host generates the cell extension, and the static extension of the host modal domain that shows the larger view. Dashboards name only widget types, never entries, so a realization can be replaced without changing any dashboard (ADR-0008). The type lives in package `v`; its `widget_type` field is the single deliberate reference from package `v` into package `m` (DESIGN section 3.1).

**Schema**:

```json
{
  "$id": "gts://gts.frontx.v.mfe.widget_realization.v1~",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "Widget Realization",
  "description": "Binds one widget type to its cell entry, its static modal extension, and a weight.",
  "type": "object",
  "required": ["id", "widget_type", "entry", "modal_extension"],
  "additionalProperties": false,
  "properties": {
    "id": {
      "type": "string",
      "x-gts-instance-ref": "/$id",
      "description": "Instance identifier of the realization, rooted at this type, for example gts.frontx.v.mfe.widget_realization.v1~frontx.v.mfe.grid.v1."
    },
    "widget_type": {
      "type": "string",
      "x-gts-type-ref": "gts.frontx.m.widget.widget.v1~",
      "description": "Type identifier of the widget type this realization shows: one of the template widget types derived from the widget base."
    },
    "entry": {
      "type": "string",
      "x-gts-instance-ref": "gts.frontx.mfes.mfe.entry.v1~frontx.mfes.mfe.entry_mf.v1~",
      "description": "The cell entry: a FrontX Module Federation entry that the Viewer host mounts in a layout cell."
    },
    "modal_extension": {
      "type": "string",
      "x-gts-instance-ref": "gts.frontx.mfes.ext.extension.v1~",
      "description": "The static extension of the host modal domain whose entry is this widget type's modal entry."
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
- `id`: a well-known instance identifier that ends in a named segment (`cpt-frontx-dashboard-constraint-gts-id-convention`). The template's realizations use the segment of their cell entry, for example `frontx.v.mfe.grid.v1`.
- `widget_type` holds a type identifier, so it uses `x-gts-type-ref` with the widget base as operand. The widget base is abstract, and every widget instance belongs to one of the 9 concrete template widget types (feature-widget-catalog section 6.0), so only a realization that names one of those types can ever win.
- `entry` is constrained to the FrontX Module Federation entry type, the same constraint as the `entry` of the `layout_cells` extension type (feature-extension-domain-catalog section 6.3).
- `modal_extension` is required. Every realization, including a consumer replacement, brings its static modal extension, so the larger-view button of every cell widget can open a larger view. The Viewer host passes it to the cell widget as `modal.subject` in `set_widget_context` (feature-extension-domain-catalog section 6.1).
- `weight` is optional; a missing weight counts as 1. The template's realizations carry weight 1 explicitly.
- A realization is a GTS instance, not an admitted extension: registering it admits nothing, and the Viewer host still registers each cell extension itself (feature-extension-domain-catalog section 3).

**Precedence rule**:
- For each widget type, the realizations considered are those registered in the Viewer host's registry whose `widget_type` names that type. A realization that the registry rejected is left out with a diagnostic; only the cells of its widget type can be affected (DESIGN section 3.6, Failure Handling).
- The single realization with the highest `weight` wins. Its `entry` becomes the `entry` of each cell extension of that widget type, and its `modal_extension` becomes the larger-view subject of each such cell widget.
- A tie at the highest weight, or no realization at all, leaves every cell of that widget type in its cannot-show state, with a diagnostic that names the widget type, and the tied realizations for a tie, and no Retry. The other cells are unaffected.
- The rule is applied by the Viewer host when it resolves a dashboard, in feature-extension-domain-catalog section 3; this feature declares the data that the rule reads.

**Cross-references**: DESIGN section 3.1 (Widget realization; Packages, Namespaces, and the Model–View Split), `cpt-frontx-dashboard-interface-widget-realization`; widget types in feature-widget-catalog; ADR-0008.

### 6.2 Widget Manifest

**GTS instance ID**: `gts.frontx.mfes.mfe.mf_manifest.v1~frontx.v.widgets.manifest.v1`

**Description**: The single FrontX Module Federation manifest of the `dashboard-widgets` package. All 9 cell entries and all 9 modal entries point to it.

| Field | Source | Content |
|-------|--------|---------|
| `id` | authored in `dashboard-widgets/mfe.json` | `gts.frontx.mfes.mfe.mf_manifest.v1~frontx.v.widgets.manifest.v1` |
| `remoteEntry` | authored in `dashboard-widgets/mfe.json` | location of the remote entry of the `dashboard-widgets` build |
| `name`, `metaData`, `shared` | produced by the manifest pipeline (`scripts/generate-mfe-manifests.ts`) from the build | the FrontX `mf_manifest` fields: package name, public path and remote entry descriptor, and the shared package declarations of section 6.8 |

**What the `dashboard-widgets` `mfe.json` carries**: this manifest, the 18 entries of section 6.3, the 9 static modal extensions, and the 9 template realizations. It carries no dashboard, no widget instance, and no widget data (DESIGN section 3.5, Manifest channel).

**Registration**: the declarations reach every registry through the manifest channel. The host bootstrap registers the manifest, the modal entries, and the static modal extensions in the shell's registry. The Viewer host registers the manifest, the cell entries, and the realizations it needs in its own registry, before it creates any cell extension (DESIGN section 3.5). This feature declares the instances; the registration itself is runtime behavior.

### 6.3 Widget Entries, Static Modal Extension, and Realization: Grid Example

**Description**: For each widget type, `dashboard-widgets` declares four instances: a cell entry, a modal entry, a static modal extension, and a realization. All 9 widget types follow the same shape and differ only in their identifiers, their exposed modules, and the widget type that the realization names (section 6.4). The `grid` widget type shows the complete shape.

**Cell entry**:

```json
{
  "id": "gts.frontx.mfes.mfe.entry.v1~frontx.mfes.mfe.entry_mf.v1~frontx.v.mfe.grid.v1",
  "requiredProperties": [
    "gts.frontx.mfes.comm.shared_property.v1~frontx.mfes.comm.theme.v1~",
    "gts.frontx.mfes.comm.shared_property.v1~frontx.mfes.comm.language.v1~"
  ],
  "actions": [
    "gts.frontx.mfes.comm.action.v1~frontx.v.mfe.set_widget_context.v1~"
  ],
  "domainActions": [],
  "manifest": "gts.frontx.mfes.mfe.mf_manifest.v1~frontx.v.widgets.manifest.v1",
  "exposedModule": "./grid"
}
```

**Modal entry**:

```json
{
  "id": "gts.frontx.mfes.mfe.entry.v1~frontx.mfes.mfe.entry_mf.v1~frontx.v.mfe.grid_modal.v1",
  "requiredProperties": [
    "gts.frontx.mfes.comm.shared_property.v1~frontx.mfes.comm.theme.v1~",
    "gts.frontx.mfes.comm.shared_property.v1~frontx.mfes.comm.language.v1~"
  ],
  "actions": [
    "gts.frontx.mfes.comm.action.v1~frontx.v.mfe.set_widget_context.v1~"
  ],
  "domainActions": [],
  "manifest": "gts.frontx.mfes.mfe.mf_manifest.v1~frontx.v.widgets.manifest.v1",
  "exposedModule": "./grid_modal"
}
```

**Static modal extension**:

```json
{
  "id": "gts.frontx.mfes.ext.extension.v1~frontx.v.mfe.grid_modal.v1",
  "domain": "gts.frontx.mfes.ext.domain.v1~frontx.screensets.layout.popup.v1",
  "entry": "gts.frontx.mfes.mfe.entry.v1~frontx.mfes.mfe.entry_mf.v1~frontx.v.mfe.grid_modal.v1"
}
```

**Widget realization**:

```json
{
  "id": "gts.frontx.v.mfe.widget_realization.v1~frontx.v.mfe.grid.v1",
  "widget_type": "gts.frontx.m.widget.widget.v1~frontx.m.widget.grid.v1~",
  "entry": "gts.frontx.mfes.mfe.entry.v1~frontx.mfes.mfe.entry_mf.v1~frontx.v.mfe.grid.v1",
  "modal_extension": "gts.frontx.mfes.ext.extension.v1~frontx.v.mfe.grid_modal.v1",
  "weight": 1
}
```

**Entry field notes** (cell and modal entries alike):
- Both entries are plain instances of the FrontX Module Federation entry type `gts.frontx.mfes.mfe.entry.v1~frontx.mfes.mfe.entry_mf.v1~`. They use only its inherited fields: `id`, `requiredProperties`, `actions`, and `domainActions` from the FrontX entry base, and `manifest` and `exposedModule` from the Module Federation entry type.
- `requiredProperties`: theme and language. In a cell, `layout_cells` shares both, with the host's values forwarded unchanged (feature-extension-domain-catalog section 6.2). In the larger view, the host modal domain gives both to its occupant directly (DESIGN section 3.5). Each widget maps the host theme id to the light or dark scope of `@gears-frontx/ui-kit` and follows a theme switch without a request (feature-widget-catalog section 6.10; ADR-0006). It formats values and localizes its own wording for the host language.
- `actions`: `set_widget_context` (feature-extension-domain-catalog section 6.1). The cell widget receives it from the Viewer host, with `modal`, so its chrome shows the larger-view button. The modal widget receives it from the cell widget's larger-view chain, without `modal`, so its chrome shows no larger-view button (feature-widget-catalog section 6.10).
- `domainActions`: empty; an entry requires no domain action.
- `exposedModule`: `./<widget_type>` for the cell entry and `./<widget_type>_modal` for the modal entry, where `<widget_type>` is the widget type segment of section 6.4.
- `exposeAssets` is not authored: the manifest pipeline fills it in at registration time (FrontX `entry_mf`).
- Widget data: no entry action carries widget data. After it receives its context, each cell or modal widget sends its own widget data request with the `source` of its widget instance through the FrontX API package, and shows the result or one of the failure states (feature-backend-contract sections 6.2 and 6.3). The cell sends it once, and again only on Retry; the modal widget sends it each time it receives its context.

**Static modal extension notes**:
- It is an instance of the FrontX extension base `gts.frontx.mfes.ext.extension.v1~` and carries only `id`, `domain`, and `entry`. The host modal domain has no extension type constraint, so it accepts a plain extension (DESIGN section 3.5, host contract).
- `domain` names the host modal domain by role. As a manifest-declared extension it carries the current `template-shell` identifier `gts.frontx.mfes.ext.domain.v1~frontx.screensets.layout.popup.v1`, or is generated from the shell constant at build time (`cpt-frontx-dashboard-constraint-role-based-host-ids`).
- `entry` names the modal entry of the same widget type.
- The host bootstrap registers it in the shell's registry from the manifest channel, together with the modal entry. Neither the Viewer host nor a widget can register into the shell's registry (FrontX ADR-0008; `cpt-frontx-dashboard-principle-own-registry-registration`), and no template part registers anything when a larger view opens.
- One static modal extension serves every widget of its widget type: the cell widget's chain mounts it and then sends it the widget's own context (feature-extension-domain-catalog section 6.5). The host modal domain keeps at most one occupant.
- Its identifier is fixed and lies under `frontx.v.mfe`, so it never collides with the cell extension identifiers of `layout_cells` (feature-extension-domain-catalog section 6.4).

**Realization notes**: the template realization has weight 1 and the identifier segment of its cell entry. It names the cell entry and the static modal extension of the same widget type, both declared in the same manifest.

**Cross-references**: DESIGN `cpt-frontx-dashboard-component-widget-library`, `cpt-frontx-dashboard-interface-widget-realization`, `cpt-frontx-dashboard-seq-widget-modal-open`; ADR-0007; ADR-0008.

### 6.4 Declarations for All 9 Widget Types

**Description**: The identifiers and exposed modules of every cell entry, modal entry, static modal extension, and realization in `dashboard-widgets`. Each row follows the shape of section 6.3.

Identifier prefixes:
- Widget type: `gts.frontx.m.widget.widget.v1~` followed by the widget type segment.
- Cell entry and modal entry: `gts.frontx.mfes.mfe.entry.v1~frontx.mfes.mfe.entry_mf.v1~` followed by the entry segment.
- Static modal extension: `gts.frontx.mfes.ext.extension.v1~` followed by the modal entry segment.
- Realization: `gts.frontx.v.mfe.widget_realization.v1~` followed by the cell entry segment.

| # | Widget type segment | Cell entry and realization segment | Cell `exposedModule` | Modal entry and static modal extension segment | Modal `exposedModule` | Weight |
|---|---------------------|------------------------------------|----------------------|------------------------------------------------|-----------------------|--------|
| 1 | `frontx.m.widget.summary_card.v1~` | `frontx.v.mfe.summary_card.v1` | `./summary_card` | `frontx.v.mfe.summary_card_modal.v1` | `./summary_card_modal` | 1 |
| 2 | `frontx.m.widget.metric_card.v1~` | `frontx.v.mfe.metric_card.v1` | `./metric_card` | `frontx.v.mfe.metric_card_modal.v1` | `./metric_card_modal` | 1 |
| 3 | `frontx.m.widget.ranked_list_card.v1~` | `frontx.v.mfe.ranked_list_card.v1` | `./ranked_list_card` | `frontx.v.mfe.ranked_list_card_modal.v1` | `./ranked_list_card_modal` | 1 |
| 4 | `frontx.m.widget.progress_list_card.v1~` | `frontx.v.mfe.progress_list_card.v1` | `./progress_list_card` | `frontx.v.mfe.progress_list_card_modal.v1` | `./progress_list_card_modal` | 1 |
| 5 | `frontx.m.widget.grid.v1~` | `frontx.v.mfe.grid.v1` | `./grid` | `frontx.v.mfe.grid_modal.v1` | `./grid_modal` | 1 |
| 6 | `frontx.m.widget.cartesian_chart.v1~` | `frontx.v.mfe.cartesian_chart.v1` | `./cartesian_chart` | `frontx.v.mfe.cartesian_chart_modal.v1` | `./cartesian_chart_modal` | 1 |
| 7 | `frontx.m.widget.pie_chart.v1~` | `frontx.v.mfe.pie_chart.v1` | `./pie_chart` | `frontx.v.mfe.pie_chart_modal.v1` | `./pie_chart_modal` | 1 |
| 8 | `frontx.m.widget.heatmap.v1~` | `frontx.v.mfe.heatmap.v1` | `./heatmap` | `frontx.v.mfe.heatmap_modal.v1` | `./heatmap_modal` | 1 |
| 9 | `frontx.m.widget.markdown_card.v1~` | `frontx.v.mfe.markdown_card.v1` | `./markdown_card` | `frontx.v.mfe.markdown_card_modal.v1` | `./markdown_card_modal` | 1 |

For example, row 5 gives the cell entry `gts.frontx.mfes.mfe.entry.v1~frontx.mfes.mfe.entry_mf.v1~frontx.v.mfe.grid.v1`, the modal entry `gts.frontx.mfes.mfe.entry.v1~frontx.mfes.mfe.entry_mf.v1~frontx.v.mfe.grid_modal.v1`, the static modal extension `gts.frontx.mfes.ext.extension.v1~frontx.v.mfe.grid_modal.v1`, and the realization `gts.frontx.v.mfe.widget_realization.v1~frontx.v.mfe.grid.v1`, whose `widget_type` is `gts.frontx.m.widget.widget.v1~frontx.m.widget.grid.v1~`.

Each widget type has exactly one template realization, so with the template's packages alone every widget type has a single winner. Ties and missing realizations arise only from consumer packages or from a registration that the registry rejects (section 6.1, precedence rule).

**Stack layers per entry.** Each entry loads the layers it needs; every one is declared as shared (section 6.8).

| Entries | Stack layers loaded |
|---------|---------------------|
| Every cell and modal entry | React with React DOM; the FrontX MFE runtime for the entry's bridge and lifecycle; the FrontX gts-plugin, for the validation of its widget data result; the FrontX API package, for its widget data request; `@gears-frontx/ui-kit`; and its own code, which bundles the shared widget chrome with the data-request logic |
| Cell and modal entries of `cartesian_chart`, `pie_chart`, `heatmap` | in addition, ECharts through `echarts/core` imports, and echarts-for-react |
| Cell and modal entries of `grid` | in addition, TanStack Table v8 and the TanStack virtualizer |
| Viewer host entry | React with React DOM; the FrontX runtime (`@gears-frontx/react`, `@gears-frontx/mfes`); the FrontX gts-plugin; the FrontX API package; `@gears-frontx/ui-kit` |

**Cross-references**: widget types in feature-widget-catalog sections 6.1 to 6.9; DESIGN section 3.4 (Internal Dependencies) and section 3.5 (Third-Party Libraries).

### 6.5 Viewer Host Package (declared by `dashboard-viewer`)

**Description**: The manifest, the entry, and the routed extension of the Viewer host, and the template's GTS types that the `dashboard-viewer` `mfe.json` carries. The package declares no widget entry, no modal entry, and no extension of the host modal domain.

**Viewer host manifest**: `gts.frontx.mfes.mfe.mf_manifest.v1~frontx.v.viewer.manifest.v1`. The single manifest of `dashboard-viewer`, used by the Viewer host entry. Its authored fields are `id` and `remoteEntry`; the manifest pipeline produces the rest, as for the widget manifest in section 6.2.

**Viewer host entry**:

```json
{
  "id": "gts.frontx.mfes.mfe.entry.v1~frontx.mfes.mfe.entry_mf.v1~frontx.v.mfe.viewer.v1",
  "requiredProperties": [
    "gts.frontx.mfes.comm.shared_property.v1~frontx.mfes.comm.theme.v1~",
    "gts.frontx.mfes.comm.shared_property.v1~frontx.mfes.comm.language.v1~"
  ],
  "actions": [],
  "domainActions": [],
  "manifest": "gts.frontx.mfes.mfe.mf_manifest.v1~frontx.v.viewer.manifest.v1",
  "exposedModule": "./viewer"
}
```

The Viewer host reads the host theme id, which it maps to the light or dark ui-kit scope of its own chrome, and the host language, for which it localizes its own text; the host screen domain shares both. It forwards both values unchanged on `layout_cells` (feature-extension-domain-catalog section 6.2). It declares no actions, because the host screen domain requires no extension actions. The module name `./viewer` is still open (section 6.9).

**Viewer host routed extension**: `gts.frontx.mfes.ext.extension.v1~frontx.screensets.layout.screen.v1~frontx.v.screens.viewer.v1`, an instance of the shell screen extension type. It is declared in the `dashboard-viewer` `mfe.json` and registered by the host bootstrap from the manifest channel. It is a routed extension in the sense of FrontX ADR-0036.

| Field | Value |
|-------|-------|
| `id` | `gts.frontx.mfes.ext.extension.v1~frontx.screensets.layout.screen.v1~frontx.v.screens.viewer.v1` |
| `domain` | the host screen domain by role; as a manifest-declared extension it carries the current `template-shell` identifier `gts.frontx.mfes.ext.domain.v1~frontx.screensets.layout.screen.v1`, or is generated from the shell constant at build time |
| `entry` | `gts.frontx.mfes.mfe.entry.v1~frontx.mfes.mfe.entry_mf.v1~frontx.v.mfe.viewer.v1` |
| `route` | a route that carries the dashboard instance identifier, for example `gts.frontx.m.dashboard.dashboard.v1~<uuid>`; required by the screen extension type; the route pattern is open (section 6.9) |
| `presentation` | a `label`, required by the screen extension type; the label text is open (section 6.9) |

**Template GTS types carried by `dashboard-viewer`**: the `dashboard-viewer` `mfe.json` carries the schemas of every type the template owns. The host bootstrap registers the non-action schemas of every package in the shell's registry, and the Viewer host registers the schemas it needs in its own registry before it requests a dashboard (DESIGN section 3.5).

| Type | Owning feature |
|------|----------------|
| `gts.frontx.m.dashboard.dashboard.v1~` | feature-dashboard-root-types |
| `gts.frontx.m.layout.layout.v1~`, `gts.frontx.m.layout.cell.v1~` | feature-layout-types |
| `gts.frontx.m.widget.widget.v1~` and the 9 widget types `gts.frontx.m.widget.widget.v1~frontx.m.widget.<widget_type>.v1~` | feature-widget-catalog |
| `gts.frontx.v.widget_data.widget_data.v1~` | feature-widget-data-catalog |
| `gts.frontx.mfes.comm.action.v1~frontx.v.mfe.set_widget_context.v1~`, `gts.frontx.mfes.ext.extension.v1~frontx.v.layout.layout_cells.v1~` | feature-extension-domain-catalog |
| `gts.frontx.v.mfe.widget_realization.v1~` | this feature (section 6.1) |

The `layout_cells` domain instance is owned by feature-extension-domain-catalog section 6.2; the Viewer host registers it in its own registry during its first mount.

**Cross-references**: DESIGN section 3.1 (ID-form convention), `cpt-frontx-dashboard-component-viewer-host`, host contract in section 3.5 (`cpt-frontx-dashboard-constraint-role-based-host-ids`); ADR-0010.

### 6.6 Admission Summary

**Description**: How each entry passes FrontX ADR-0010 admission in the domain it is mounted into, restated from DESIGN section 3.3 (Admission of entries) for the instances above. Under the subset rule, an entry's required shared properties must be among the domain's shared properties, and the entry's actions must cover the extension actions that the domain requires; extra entry actions do not block admission.

| Entries | Domain | Domain shares | Domain requires of extensions | Entry requires and supports | Result |
|---------|--------|---------------|-------------------------------|-----------------------------|--------|
| 9 cell entries, and a consumer cell entry | `layout_cells` | theme, language | `set_widget_context` | requires theme and language; supports `set_widget_context` | admitted |
| 9 modal entries, and a consumer modal entry | host modal domain | theme, language | none | requires theme and language; supports `set_widget_context`, which the domain does not require | admitted |
| Viewer host entry | host screen domain | theme, language | none | requires theme and language; supports no action | admitted |

The static modal extensions are admitted to the host modal domain because that domain has no extension type constraint. The Viewer host routed extension is admitted to the host screen domain as an instance of the shell screen extension type with a `route` and a `presentation` label.

### 6.7 Consumer Replacement Package

**Description**: How a consuming product replaces how one template widget type is shown, in a cell and in the larger view (`cpt-frontx-dashboard-fr-replacement-widget`; DESIGN section 3.3, Consumer replacement).

The consuming product ships its own package under `src-app/mfe_packages/`, next to the template's packages, with its own `mfe.json`. The package declares:

- its own Module Federation manifest;
- its own cell entry and its own modal entry, both plain instances of the FrontX Module Federation entry type with the shape of section 6.3: they require theme and language and support `set_widget_context`, so they are admitted to `layout_cells` and to the host modal domain (section 6.6);
- its own static extension of the host modal domain, with its own fixed identifier, whose `entry` is its modal entry;
- one replacement realization with its own identifier, whose `widget_type` names one of the 9 template widget types, whose `entry` and `modal_extension` name the cell entry and the static modal extension above, and whose `weight` is above 1.

For example, a consuming product with the vendor `acme` that replaces the `grid` widget type could declare the realization `gts.frontx.v.mfe.widget_realization.v1~acme.dash.mfe.grid.v1` with `widget_type` `gts.frontx.m.widget.widget.v1~frontx.m.widget.grid.v1~`, `entry` `gts.frontx.mfes.mfe.entry.v1~frontx.mfes.mfe.entry_mf.v1~acme.dash.mfe.grid.v1`, `modal_extension` `gts.frontx.mfes.ext.extension.v1~acme.dash.mfe.grid_modal.v1`, and `weight` 2.

**Effects**:
- The package reaches the registries through the manifest channel like the template's packages: the host bootstrap registers its modal entry and static modal extension, and the Viewer host registers its cell entry and realization.
- The replacement wins for its widget type (section 6.1): every cell of that widget type mounts the consumer's cell entry, and its larger-view button opens the consumer's static modal extension. The template's realization for that widget type stays registered but unused. The other widget types keep the template's realizations.
- The template's packages stay unchanged.
- Two packages that replace the same widget type with the same highest weight produce a tie; the cells of that widget type then show their cannot-show state until one weight changes.
- The consumer's widget carries the obligations of `cpt-frontx-dashboard-fr-replacement-widget`: the per-widget states, the larger view, the host theme, and accessibility.

**No consumer widget types in v1.** A replacement realization names one of the 9 template widget types, because every widget instance belongs to one of them. Consumer widget types are a later stage (DESIGN section 4).

**Cross-references**: `cpt-frontx-dashboard-interface-widget-realization`, `cpt-frontx-dashboard-topology-overlay-packages`; ADR-0008; ADR-0010.

### 6.8 Packaging, Isolation, and Budget Basis

**Description**: Packaging rules that apply to every entry of this feature.

**Package placement**:

| Package subtree | Declarations in its `mfe.json` | Code |
|-----------------|--------------------------------|------|
| `src-app/mfe_packages/dashboard-viewer/` | the template's GTS types, the Viewer host manifest, the Viewer host entry, the Viewer host routed extension (section 6.5) | the Viewer host |
| `src-app/mfe_packages/dashboard-widgets/` | the widget manifest, 9 cell entries, 9 modal entries, 9 static modal extensions, 9 realizations of weight 1 (sections 6.2 to 6.4) | the 9 cell widgets and the 9 modal widgets, with the shared widget chrome and the data-request logic |
| a consumer package, when present | its manifest, its cell entry, modal entry, static modal extension, and replacement realization (section 6.7) | the consumer's widget |

`dashboard-widgets` depends on `dashboard-viewer` only for GTS identifiers, and `dashboard-viewer` reaches the widget entries only at run time, through the realizations (DESIGN section 3.4). Neither package depends on `template-mfe` (`cpt-frontx-dashboard-constraint-shell-only-dependency`).

**Shared packages**:
- Every template MFE, that is the Viewer host entry and every cell and modal entry, declares all its packages as shared; FrontX allows this also for stateful packages. The manifest pipeline records these declarations in the manifest's `shared` field (section 6.2).
- FrontX reuses the source text of a shared package across MFE loads by content hash (FrontX ADR-0034), so a shared package is fetched once per realm.
- FrontX still gives every MFE load its own module graph (FrontX ADR-0011), so each instance evaluates its own copy. Each chart widget instance evaluates its own ECharts and registers its own ECharts theme, and each `grid` instance evaluates its own TanStack Table. Source reuse saves fetches, not evaluation.
- No entry relies on a template-owned singleton shared between instances (`cpt-frontx-dashboard-principle-per-instance-isolation`). The FrontX API package, with its API cache shared across runtimes, and the FrontX gts-plugin, with its type store, keep realm-wide state by their own design, and the template uses them as they are.
- Every declared package passes the package-wide license check.
- Module Federation is used only as the bundling format; FrontX resolves dependencies itself.

**Budget basis** (DESIGN section 3.9; provisional figures, re-measured on production builds and then confirmed or revised). The budget measures transferred gzipped bytes on a cold load of the reference dashboard, with an empty browser cache.

| Unit | Provisional budget | Counting rule |
|------|--------------------|---------------|
| Viewer host | under 500 KB gzipped | its own entry code plus every shared package that the Viewer host itself fetches on the cold load |
| Each widget entry, cell or modal | under 100 KB gzipped | its own code only, including the shared widget chrome and the data-request logic it bundles; shared packages are excluded |
| Page total | no cap | every byte transferred on the cold load; each shared package, such as ECharts, TanStack Table, the virtualizer, and the FrontX packages, is counted once; recorded with the results |

Evaluation cost is not part of the bundle budget; each instance's evaluation of its own copies is covered by the initial-render budget (`cpt-frontx-dashboard-nfr-initial-render`).

### 6.9 Open Questions

- **Routed extension details.** The DESIGN fixes that the Viewer host's route carries the dashboard instance identifier, but not the route pattern, the presentation label of the routed extension, or the module name of the Viewer host entry, for which this feature uses `./viewer`. All three are fixed with the routing setup of `dashboard-viewer` (DESIGN section 4, open question 3). Owner: template architect.

## 7. Acceptance Criteria

- [ ] `cfs validate --artifact` reports no structural errors for this document.
- [ ] The widget realization type `gts.frontx.v.mfe.widget_realization.v1~` is declared in `dashboard-viewer` with the schema of section 6.1; a realization with `id`, `widget_type`, `entry`, and `modal_extension` and no `weight` validates and counts as weight 1; a realization without `modal_extension`, with `weight` 0, or with an extra field fails validation.
- [ ] No template entry uses a type derived from `gts.frontx.mfes.mfe.entry.v1~frontx.mfes.mfe.entry_mf.v1~`, and no entry carries a field beyond that type.
- [ ] `dashboard-widgets` declares exactly one manifest, `gts.frontx.mfes.mfe.mf_manifest.v1~frontx.v.widgets.manifest.v1`, and exactly 9 cell entries, 9 modal entries, 9 static modal extensions, and 9 realizations of weight 1, with the identifiers and exposed modules of section 6.4; every entry points to that manifest.
- [ ] Every template realization names one of the 9 widget types, the cell entry of that widget type, and the static modal extension of that widget type, all declared in the `dashboard-widgets` manifest; each of the 9 widget types is named by exactly one template realization.
- [ ] Every cell and modal entry requires exactly the theme and language shared properties, lists only `set_widget_context` in `actions`, and has an empty `domainActions`.
- [ ] Every cell entry is admitted to `layout_cells`, and every modal entry is admitted to the host modal domain, whose missing extension actions do not block the extra action `set_widget_context`.
- [ ] Every static modal extension is an instance of `gts.frontx.mfes.ext.extension.v1~` whose `domain` is the host modal domain and whose `entry` is the modal entry of its widget type; on a host with the rendered modal-domain slot, it is registered by the host bootstrap before the first larger view opens, and no template part registers an extension when a larger view opens.
- [ ] Given the template's packages only, when a dashboard with one widget of each of the 9 widget types resolves, then every cell uses the cell entry of the template realization of its widget type, and every cell widget's larger-view subject is the static modal extension that this realization names.
- [ ] Given a fixture consumer package with a `grid` realization of weight 2, its own cell entry, modal entry, and static modal extension, when a dashboard with a `grid` cell and a `pie_chart` cell resolves, then the `grid` cell shows the consumer's cell entry and opens the consumer's larger view, the `pie_chart` cell uses the template realization, and the template's packages are unchanged.
- [ ] Given two consumer packages that each declare a `grid` realization of weight 2, when a dashboard with a `grid` cell resolves, then that cell shows its cannot-show state with a diagnostic that names the widget type and both tied realizations, and no Retry, and the other cells are unaffected.
- [ ] `dashboard-viewer` declares the Viewer host manifest `gts.frontx.mfes.mfe.mf_manifest.v1~frontx.v.viewer.manifest.v1`, the Viewer host entry, which is a plain FrontX Module Federation entry that requires theme and language and declares no actions, and the routed extension `gts.frontx.mfes.ext.extension.v1~frontx.screensets.layout.screen.v1~frontx.v.screens.viewer.v1` in the host screen domain, whose route carries the dashboard instance identifier; it declares no other entry and no extension of the host modal domain.
- [ ] The `dashboard-viewer` `mfe.json` carries the schemas of every type listed in section 6.5, and no package's `mfe.json` contains a dashboard, a widget instance, or widget data.
- [ ] Given an open dashboard and an open larger view, when the host theme id changes, then every cell widget and the modal widget switch to the matching ui-kit scope without a request and without showing a skeleton again.
- [ ] Every identifier of this feature follows the template ID-form convention: types end with `~`, instances do not, every template segment is at `v1`, and no field uses `x-gts-ref`.
- [ ] Build review confirms that the Viewer host entry and every cell and modal entry declare all their packages as shared, that every declared package passes the package-wide license check, and that no entry relies on a template-owned singleton shared between instances.
- [ ] Transferred gzipped bytes on a cold load of the reference dashboard are measured and recorded per section 6.8: the Viewer host with the shared packages it fetches itself, each widget entry with its own code only, and each shared package counted once in the page total.
- [ ] No template TypeScript source writes a host domain identifier as a literal; the manifest-declared static modal extensions and the routed extension carry the current `template-shell` identifiers or are generated from the shell constants at build time.
