---
status: proposed
version: 5
date: 2026-10-24
description: Domain model of the template MFE entry type with realizes, the widget manifest, and the 9 widget entries declared by dashboard-widgets, plus the viewer manifest, viewer and modal container entries, and the Viewer host routed extension declared by dashboard-viewer.
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
- [6. Domain Model](#6-domain-model)
  - [6.1 Template MFE Entry Type](#61-template-mfe-entry-type)
  - [6.2 Widget Manifest](#62-widget-manifest)
  - [6.3 Widget Entries](#63-widget-entries)
  - [6.4 Viewer Package Entries (declared by `dashboard-viewer`)](#64-viewer-package-entries-declared-by-dashboard-viewer)
  - [6.5 Admission Summary](#65-admission-summary)
  - [6.6 Isolation and Packaging Notes](#66-isolation-and-packaging-notes)
  - [6.7 Open Questions](#67-open-questions)
- [7. Acceptance Criteria](#7-acceptance-criteria)

<!-- /toc -->

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-featstatus-mfe-entries`
## 1. Feature Context

- [ ] `p2` - `cpt-frontx-dashboard-feature-mfe-entries`

### 1.1 Overview

This is a **domain-model feature**, not an actor-flow feature. It defines the template MFE entry type, which extends the FrontX Module Federation entry with one pointer to the widget kind the entry realizes, and it enumerates the entry and manifest instances the template ships. The flow, process, and state sections of the FEATURE template are reduced to short not-applicable notes; the types and instances live in section 6 Domain Model.

### 1.2 Purpose

Concrete types and instances of the "MFE entry" family of DESIGN section 3.1. Every identifier builds on the FrontX MFE base types (`gts.frontx.mfes.*`) and uses the template's `frontx` vendor namespaces (`gts.frontx.v.*`, `gts.frontx.m.*`), with every template segment at `v1`. DESIGN section 3.1 delegates the field-level schemas of these types and instances to this document, so section 6 carries them.

The entries follow the DESIGN and ADR-0008:

- The template ships the widget MFEs for all 9 widget kinds, one entry per kind. Each widget MFE requests its own data from the consuming product backend through the FrontX API package: it sends its widget kind (type identifier) and its `params` in a widget data request and receives one widget data instance of its kind's `data_type`.
- One widget manifest `gts.frontx.mfes.mfe.mf_manifest.v1~frontx.v.widgets.manifest.v1` is defined here, and all 9 widget entries point to it.
- The `dashboard-viewer` package entries are listed here as well: the viewer manifest, the viewer entry, the modal container entry, and the Viewer host routed extension.
- Per-instance isolation; Module Federation is used for bundling only, as a template assumption.

**Declaring packages**:
- `dashboard-widgets` (`src-app/mfe_packages/dashboard-widgets/`) declares the widget manifest and the 9 widget entries through its own `mfe.json`.
- `dashboard-viewer` (`src-app/mfe_packages/dashboard-viewer/`) declares the template MFE entry type schema, as an engine `frontx.v` type (DESIGN section 3.1, Location), and the viewer manifest, the viewer entry, the modal container entry, and the Viewer host routed extension (section 6.4).

**Requirements**: `cpt-frontx-dashboard-fr-widget-catalog`, `cpt-frontx-dashboard-fr-domain-model`, `cpt-frontx-dashboard-fr-viewer-host`, `cpt-frontx-dashboard-fr-widget-modal`, `cpt-frontx-dashboard-nfr-bundle-budget`

**Principles**: `cpt-frontx-dashboard-principle-per-instance-isolation`, `cpt-frontx-dashboard-principle-gts-contracts`

### 1.3 Actors

N/A. This is a domain-model feature. Its types and instances are consumed by the runtime type system and by the registration path of the host and the Viewer host (the manifest channel), not by an end-user actor, so no actor flows are authored.

### 1.4 References

- **PRD**: [PRD.md](../../PRD.md)
- **Design**: [DESIGN.md](../../DESIGN.md) section 3.1 (Domain Model, MFE entry, ID-form convention), section 3.2 (Widget Library, Modal Container), section 3.3 (Admission of entries), section 3.5 (Host contract, Manifest channel), section 3.9 (Bundle budget)
- **ADRs**: [ADR-0007](../../ADR/0007-extension-domain-taxonomy-v1.md), [ADR-0008](../../ADR/0008-widget-kind-and-mfe-realization-v1.md), [ADR-0010](../../ADR/0010-template-packages-and-host-contract-v1.md)
- **Design elements**: `cpt-frontx-dashboard-component-widget-library`, `cpt-frontx-dashboard-component-viewer-host`, `cpt-frontx-dashboard-component-modal-container`, `cpt-frontx-dashboard-topology-overlay-packages`
- **Dependencies**: `feature-widget-catalog` (every widget entry realizes one widget kind), `feature-extension-domain-catalog` (the host action types listed in `actions`, the domains the entries are admitted to, and the modal container extension that uses the container entry)

## 2. Actor Flows (CDSL)

**Use cases**: `cpt-frontx-dashboard-usecase-explore-dashboard`

### Domain-Model Feature: No Actor Flows

Not applicable because this feature declares static GTS types and instances; no actor interacts with the declarations themselves. The runtime paths that use these instances are the manifest channel registration (DESIGN section 3.5) and the kind-to-entry lookup in `cpt-frontx-dashboard-seq-initial-load`.

## 3. Processes / Business Logic (CDSL)

### Domain-Model Feature: No Processes

Not applicable because this feature declares schemas and instances only. Registration is done by the shell bootstrap and the Viewer host from the manifest channel, and the kind-to-entry lookup through `realizes:` is part of the Viewer host (DESIGN `cpt-frontx-dashboard-component-viewer-host`).

## 4. States (CDSL)

### Domain-Model Feature: No State Machines

Not applicable because type and instance declarations are stateless. The extension lifecycle stages are declared by the domains in `feature-extension-domain-catalog`.

## 5. Definitions of Done

### Domain Model Definition of Done

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-dod-mfe-entries-catalog-complete`

The system **MUST** register the entry type, the two manifests, the 11 entry instances, and the Viewer host routed extension of section 6 through the `mfe.json` of their declaring packages.

- The template MFE entry type extends the FrontX `entry_mf` type and adds exactly one required field, `realizes`.
- Each of the 9 widget entries validates against the entry type, points to the single widget manifest, requires theme only, lists `set_subject`, and realizes exactly one of the 9 widget kinds.
- The viewer and container entries are plain FrontX `entry_mf` instances that realize no widget kind.
- No package declares shared singletons.

**Covers (PRD)**: `cpt-frontx-dashboard-fr-widget-catalog`, `cpt-frontx-dashboard-fr-domain-model`, `cpt-frontx-dashboard-fr-viewer-host`, `cpt-frontx-dashboard-nfr-bundle-budget`

**Covers (DESIGN)**: `cpt-frontx-dashboard-component-widget-library`, `cpt-frontx-dashboard-component-modal-container`, `cpt-frontx-dashboard-topology-overlay-packages`, `cpt-frontx-dashboard-principle-per-instance-isolation`

**Constraints**: `cpt-frontx-dashboard-constraint-gts-id-convention`, `cpt-frontx-dashboard-constraint-role-based-host-ids`, `cpt-frontx-dashboard-constraint-shell-only-dependency`

**Touches**:
- Entities: template MFE entry type, widget manifest, viewer manifest, widget entries, viewer entry, modal container entry, Viewer host routed extension

## 6. Domain Model

### 6.1 Template MFE Entry Type

**GTS ID**: `gts.frontx.mfes.mfe.entry.v1~frontx.mfes.mfe.entry_mf.v1~frontx.v.mfe.entry.v1~`

**Description**: The MFE entry type of widget entries. It extends the FrontX Module Federation entry `gts.frontx.mfes.mfe.entry.v1~frontx.mfes.mfe.entry_mf.v1~` with one required field, `realizes:`, which names the widget kind the entry realizes. The Viewer host resolves a widget kind to an entry through this field; dashboards persist widget instances, never entry identifiers (ADR-0008).

**Schema**:

```json
{
  "$id": "gts://gts.frontx.mfes.mfe.entry.v1~frontx.mfes.mfe.entry_mf.v1~frontx.v.mfe.entry.v1~",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "Template MfeEntry",
  "description": "Module Federation entry of a widget MFE that names the widget kind it realizes.",
  "allOf": [
    { "$ref": "gts://gts.frontx.mfes.mfe.entry.v1~frontx.mfes.mfe.entry_mf.v1~" }
  ],
  "properties": {
    "realizes": {
      "type": "string",
      "x-gts-type-ref": "gts.frontx.m.widget.widget.v1~*",
      "description": "GTS ID of the widget kind this entry realizes."
    }
  },
  "required": ["realizes"]
}
```

**Inheritance notes**:
- Inherited FrontX fields: `id`, `requiredProperties`, optional `optionalProperties`, `actions`, `domainActions` (entry base), and `manifest`, `exposedModule`, `exposeAssets` (`entry_mf`). They are not redeclared.
- `realizes` holds a type identifier, so it uses `x-gts-type-ref` (GTS v0.17 section 9.6.1) with the wildcard operand `gts.frontx.m.widget.widget.v1~*`, which accepts every kind derived from the widget base and not the abstract base itself.

**Cross-references**: DESIGN section 3.1 (MFE entry, `m` and `v` split); widget kinds in `feature-widget-catalog`; ADR-0008.

### 6.2 Widget Manifest

**GTS instance ID**: `gts.frontx.mfes.mfe.mf_manifest.v1~frontx.v.widgets.manifest.v1`

**Description**: The single FrontX Module Federation manifest of the `dashboard-widgets` package. All 9 widget entries point to it.

| Field | Source | Content |
|-------|--------|---------|
| `id` | authored in `dashboard-widgets/mfe.json` | `gts.frontx.mfes.mfe.mf_manifest.v1~frontx.v.widgets.manifest.v1` |
| `remoteEntry` | authored in `dashboard-widgets/mfe.json` | location of the remote entry of the `dashboard-widgets` build |
| `name`, `metaData`, `shared` | produced by the manifest pipeline (`scripts/generate-mfe-manifests.ts`) from the build | the FrontX `mf_manifest` fields: package name, public path and remote entry descriptor, and shared dependency declarations |

The aggregate reaches every registry through the manifest channel; the shell bootstrap and the Viewer host register the manifest before the entries that point to it (DESIGN section 3.5).

### 6.3 Widget Entries

**Description**: 9 instances of the template MFE entry type, one per subject-agnostic widget kind, all in `dashboard-widgets`. Every entry has the same shape and differs only in its identifier, its exposed module, and its `realizes` value. The common shape, shown for `summary_card`:

```json
{
  "id": "gts.frontx.mfes.mfe.entry.v1~frontx.mfes.mfe.entry_mf.v1~frontx.v.mfe.entry.v1~frontx.v.summary_card.v1",
  "requiredProperties": [
    "gts.frontx.mfes.comm.shared_property.v1~frontx.mfes.comm.theme.v1~"
  ],
  "actions": [
    "gts.frontx.mfes.comm.action.v1~frontx.v.mfe.set_subject.v1~"
  ],
  "domainActions": [],
  "manifest": "gts.frontx.mfes.mfe.mf_manifest.v1~frontx.v.widgets.manifest.v1",
  "exposedModule": "./summary_card",
  "realizes": "gts.frontx.m.widget.widget.v1~frontx.m.widget.summary_card.v1~"
}
```

**Field notes**:
- `requiredProperties`: theme only, which every template domain provides. The value widgets read is the template theme payload (`feature-extension-domain-catalog`, section 6.8).
- `actions`: `set_subject`. This covers the extension actions of both template domains, so every entry is admitted to `layout_cells` and `modal_panel` (FrontX ADR-0010).
- `domainActions`: empty; an entry requires no domain action.
- Widget data: no entry action carries widget data. Each widget MFE instance requests its own data from the consuming product backend through the FrontX API package, sending its widget kind and its `params` (`feature-widget-catalog`, section 6.0): in a cell once when it mounts and again only on Retry after a failure, and in its larger view whenever that view needs data. The response is validated against the kind's `data_type`. The endpoint location comes from configuration; the path and request form are open item 1 of `cpt-frontx-dashboard-feature-backend-contract` section 6.5.
- `exposeAssets` is not authored: the host manifest pipeline populates it at registration time (FrontX `entry_mf`).

**Entry instances** (identifier prefix `gts.frontx.mfes.mfe.entry.v1~frontx.mfes.mfe.entry_mf.v1~frontx.v.mfe.entry.v1~`; `realizes` prefix `gts.frontx.m.widget.widget.v1~`):

| # | Kind | Instance segment | `exposedModule` | `realizes` segment |
|---|------|------------------|-----------------|--------------------|
| 1 | `summary_card` | `frontx.v.summary_card.v1` | `./summary_card` | `frontx.m.widget.summary_card.v1~` |
| 2 | `metric_card` | `frontx.v.metric_card.v1` | `./metric_card` | `frontx.m.widget.metric_card.v1~` |
| 3 | `ranked_list_card` | `frontx.v.ranked_list_card.v1` | `./ranked_list_card` | `frontx.m.widget.ranked_list_card.v1~` |
| 4 | `progress_list_card` | `frontx.v.progress_list_card.v1` | `./progress_list_card` | `frontx.m.widget.progress_list_card.v1~` |
| 5 | `grid` | `frontx.v.grid.v1` | `./grid` | `frontx.m.widget.grid.v1~` |
| 6 | `cartesian_chart` | `frontx.v.cartesian_chart.v1` | `./cartesian_chart` | `frontx.m.widget.cartesian_chart.v1~` |
| 7 | `pie_chart` | `frontx.v.pie_chart.v1` | `./pie_chart` | `frontx.m.widget.pie_chart.v1~` |
| 8 | `heatmap` | `frontx.v.heatmap.v1` | `./heatmap` | `frontx.m.widget.heatmap.v1~` |
| 9 | `markdown_card` | `frontx.v.markdown_card.v1` | `./markdown_card` | `frontx.m.widget.markdown_card.v1~` |

For example, row 5 is the instance `gts.frontx.mfes.mfe.entry.v1~frontx.mfes.mfe.entry_mf.v1~frontx.v.mfe.entry.v1~frontx.v.grid.v1`, which realizes `gts.frontx.m.widget.widget.v1~frontx.m.widget.grid.v1~`.

The template ships exactly one entry per widget kind. A widget kind with no entry, or with more than one, is a configuration error that the Viewer host handles per cell (`feature-extension-domain-catalog` section 3).

**Cross-references**: DESIGN `cpt-frontx-dashboard-component-widget-library`; widget kinds in `feature-widget-catalog`.

### 6.4 Viewer Package Entries (declared by `dashboard-viewer`)

**Description**: The entries and manifest of the `dashboard-viewer` package and the Viewer host's routed extension. The viewer and container entries realize no widget kind, so they are plain instances of the FrontX `entry_mf` type and carry no `realizes`. The modal container's static extension itself is owned by `feature-extension-domain-catalog` (section 6.7 there).

**Viewer manifest**: `gts.frontx.mfes.mfe.mf_manifest.v1~frontx.v.viewer.manifest.v1`. The single manifest of `dashboard-viewer`, used by the viewer entry and the container entry. Authored fields are `id` and `remoteEntry`; the manifest pipeline produces the rest, as for the widget manifest in section 6.2.

**Viewer entry**:

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

The Viewer host reads the host theme id, which it maps to a mode, and the host language, which it formats text for; the host screen domain shares both. It declares no custom actions, because the host screen domain requires no extension actions.

**Modal container entry**:

```json
{
  "id": "gts.frontx.mfes.mfe.entry.v1~frontx.mfes.mfe.entry_mf.v1~frontx.v.mfe.modal_container.v1",
  "requiredProperties": [
    "gts.frontx.mfes.comm.shared_property.v1~frontx.mfes.comm.theme.v1~",
    "gts.frontx.mfes.comm.shared_property.v1~frontx.mfes.comm.language.v1~"
  ],
  "actions": [],
  "domainActions": [],
  "manifest": "gts.frontx.mfes.mfe.mf_manifest.v1~frontx.v.viewer.manifest.v1",
  "exposedModule": "./modal-container"
}
```

It requires theme and language, which the host modal domain shares, and declares no custom actions, because the host modal domain requires none. The container reads the host theme id through the theme shared property, not through entry actions, and applies the template's own theme.

**Viewer host routed extension**: `gts.frontx.mfes.ext.extension.v1~frontx.screensets.layout.screen.v1~frontx.v.screens.viewer.v1`, an instance of the shell screen extension type, declared in the `dashboard-viewer` manifest and registered by the host bootstrap from the manifest channel. It is a routed extension in the sense of FrontX ADR-0036; the `route` field, the screen extension type, and the dashboard instance identifier in the route are template design.

| Field | Value |
|-------|-------|
| `id` | `gts.frontx.mfes.ext.extension.v1~frontx.screensets.layout.screen.v1~frontx.v.screens.viewer.v1` |
| `domain` | the host screen domain by role; as a manifest-declared extension it carries the current `template-shell` identifier `gts.frontx.mfes.ext.domain.v1~frontx.screensets.layout.screen.v1`, or is generated from the shell constant at build time |
| `entry` | `gts.frontx.mfes.mfe.entry.v1~frontx.mfes.mfe.entry_mf.v1~frontx.v.mfe.viewer.v1` |
| `route` | a route that carries the dashboard instance identifier; required by the screen extension type |
| `presentation` | a `label`, required by the screen extension type |

**Cross-references**: DESIGN section 3.1 (ID-form convention), `cpt-frontx-dashboard-component-viewer-host`, `cpt-frontx-dashboard-component-modal-container`, host contract in section 3.5 (`cpt-frontx-dashboard-constraint-role-based-host-ids`); ADR-0010.

### 6.5 Admission Summary

**Description**: How each entry passes FrontX ADR-0010 admission in the domains it is mounted into, restated from DESIGN section 3.3 for the instances above.

| Entry | Domain | Domain provides | Domain requires of extensions | Result |
|-------|--------|-----------------|-------------------------------|--------|
| 9 widget entries | `layout_cells`, `modal_panel` | theme | `set_subject` | admitted |
| modal container entry | host modal domain | theme, language | none | admitted |
| viewer entry | host screen domain | theme, language | none | admitted |

### 6.6 Isolation and Packaging Notes

**Description**: Packaging rules that apply to every entry of this feature.

- FrontX gives every MFE load its own module graph (FrontX ADR-0011), so no library, store, or theme object of the template is shared between MFE instances, and no package declares shared singletons (`cpt-frontx-dashboard-principle-per-instance-isolation`). Each widget requests its own data through the FrontX API package.
- Module Federation is used only as the bundling format, and FrontX resolves dependencies itself. This is a template assumption.
- Each chart widget instance evaluates its own ECharts, and each `grid` instance its own TanStack Table, because evaluation is per MFE instance (FrontX ADR-0011). The source text of a dependency can be fetched once and reused across instances only when the MFE build publishes its content hash and lists it as a shared dependency (FrontX ADR-0034); this saves repeated fetches, not repeated evaluation. How the bundle budget accounts for both is set in DESIGN section 3.9.
- Consumer widget kinds ship as separate packages with their own manifest and entries of the template entry type.
- `dashboard-widgets` depends on `dashboard-viewer` only for GTS identifiers; `dashboard-viewer` reaches the widget entries only at run time through `realizes:` (DESIGN section 3.4).

### 6.7 Open Questions

- **Routed extension route and label.** The DESIGN fixes that the route carries the dashboard instance identifier but not the route pattern or the presentation label of the Viewer host routed extension; both are fixed with the routing setup of `dashboard-viewer`.
- **Entry for consumer-derived widget types.** A consuming product may derive a widget type from a kind to close its `params` (for example `gts.frontx.m.widget.widget.v1~frontx.m.widget.grid.v1~acme.gh.widget.pr_list.v1~`). How the Viewer host resolves such a type to the entry that realizes the kind it derives from is not fixed yet. The consumer widget type itself is specified in `cpt-frontx-dashboard-feature-backend-contract` section 6.4, and how it reaches the browser is open item 3 of section 6.5 there. Owner: template architect.
- **Viewer entry module name.** The DESIGN names the container's exposed module (`./modal-container`) but not the viewer entry's; this feature uses `./viewer`, to be confirmed at implementation.

## 7. Acceptance Criteria

- [ ] The template MFE entry type `gts.frontx.mfes.mfe.entry.v1~frontx.mfes.mfe.entry_mf.v1~frontx.v.mfe.entry.v1~` extends the FrontX `entry_mf` type and adds exactly one required field, `realizes`, constrained to widget kind identifiers.
- [ ] `dashboard-widgets` declares exactly one manifest, `gts.frontx.mfes.mfe.mf_manifest.v1~frontx.v.widgets.manifest.v1`, and all 9 widget entries point to it.
- [ ] Every one of the 9 widget kinds has exactly one entry in that manifest, and each entry's `realizes` names that kind.
- [ ] Each widget MFE requests its widget data with its kind and `params` through the FrontX API package, and no entry action carries widget data.
- [ ] Every widget entry requires only the theme shared property, lists only `set_subject` in `actions`, has an empty `domainActions`, and is admitted to `layout_cells` and `modal_panel`.
- [ ] The viewer entry and the modal container entry are FrontX `entry_mf` instances without `realizes`, point to the viewer manifest, require theme and language, and declare no custom actions.
- [ ] The Viewer host routed extension is an instance of the shell screen extension type in the host screen domain with a route that carries the dashboard instance identifier.
- [ ] Every identifier of this feature follows the template ID-form convention: types end with `~`, instances do not, and every template segment is at `v1`.
- [ ] Build review confirms that no package declares shared singletons.
