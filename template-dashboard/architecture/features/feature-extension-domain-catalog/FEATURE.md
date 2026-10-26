---
status: proposed
version: 7
date: 2026-10-24
description: Type catalog of the render-only viewer's two host actions, two extension domains, two extension types, the modal container extension, the template theme payload, and the widget extension identifier rule, declared by dashboard-viewer.
changelog:
  - "v7 (2026-10-24): params model and GTS v0.17. The `set_subject` payload is the widget instance: presentation configuration plus `params`, identified by its combined instance `id`; each widget requests its data with its kind and `params`, and the modal instance hits the same shared API cache entry (key: kind plus canonical `params`). Every `x-gts-ref` is replaced by `x-gts-instance-ref`, because each field holds an instance identifier. The open question on the widget data request now covers the path, request form, and cache options."
  - "v6 (2026-10-23): section 1.4 marks the link to `feature-mfe-entries` as a reference by identifier only, not a build-order dependency, matching DECOMPOSITION section 3."
  - "v5 (2026-10-23): each widget requests its own data. Removed the `set_data` host action (two host actions remain); the action-chain table gains per-widget data load and failure rows; the modal opens a new instance of the same widget with the same configuration, which requests its data through the FrontX API package and is served from the shared API cache. The theme lives on the frontend, so the modal container uses the same template-owned theme; the palette-source and widget-to-data-linking open questions are closed. Sections renumbered after 6.1."
  - "v4 (2026-10-23): section 6.11 (now 6.10) adds the invalid-payload row, matching failure-handling item 5 of the DESIGN."
  - "v3 (2026-10-23): closed the open question on the modal button inside modal_panel (hidden, as fixed in feature-widget-catalog); added the open question on where the modal container gets the open dashboard's palette (DESIGN section 4)."
  - "v2 (2026-10-23): render-only scope cut. Removed the detail panel domain and extension type, the peer-navigation, local-filter and drill-down-context host actions, the surface filter companion, and the drill-down contract DoD. mount_widget now opens the same widget with the same data in modal_panel; set_data carries backend-delivered widget_data; modal_panel gets its own extension type; theme reaches the modal through the theme shared property; modal extensions are registered at dashboard resolve."
  - "v1 (2026-10-07): initial port from the prototype."
---

# Feature: Extension Domain Catalog


<!-- toc -->

- [1. Feature Context](#1-feature-context)
  - [1.1 Overview](#11-overview)
  - [1.2 Purpose](#12-purpose)
  - [1.3 Actors](#13-actors)
  - [1.4 References](#14-references)
- [2. Actor Flows (CDSL)](#2-actor-flows-cdsl)
  - [Type-Catalog Feature: No Actor Flows](#type-catalog-feature-no-actor-flows)
- [3. Processes / Business Logic (CDSL)](#3-processes--business-logic-cdsl)
  - [Type-Catalog Feature: No Processes](#type-catalog-feature-no-processes)
- [4. States (CDSL)](#4-states-cdsl)
  - [Type-Catalog Feature: No State Machines](#type-catalog-feature-no-state-machines)
- [5. Definitions of Done](#5-definitions-of-done)
  - [Type Catalog Definition of Done](#type-catalog-definition-of-done)
- [6. Type Catalog](#6-type-catalog)
  - [6.1 Host Action: set_subject](#61-host-action-set_subject)
  - [6.2 Host Action: mount_widget](#62-host-action-mount_widget)
  - [6.3 Layout Cells Extension Domain](#63-layout-cells-extension-domain)
  - [6.4 Modal Panel Extension Domain](#64-modal-panel-extension-domain)
  - [6.5 Layout Cells Extension Type](#65-layout-cells-extension-type)
  - [6.6 Modal Panel Extension Type](#66-modal-panel-extension-type)
  - [6.7 Modal Container Extension](#67-modal-container-extension)
  - [6.8 Template Theme Payload](#68-template-theme-payload)
  - [6.9 Widget Extension Identifier Rule](#69-widget-extension-identifier-rule)
  - [6.10 Action Chain Patterns](#610-action-chain-patterns)
  - [6.11 Open Questions](#611-open-questions)
- [7. Acceptance Criteria](#7-acceptance-criteria)

<!-- /toc -->

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-featstatus-extension-domain-catalog`
## 1. Feature Context

- [ ] `p2` - `cpt-frontx-dashboard-feature-extension-domain-catalog`

### 1.1 Overview

This is a **type-catalog feature**, not an actor-flow feature. It enumerates the template's host actions, extension domains, extension types, the modal container extension, and the template theme payload of the render-only viewer. Their abstract bases and structural prose live in DESIGN section 3.1 and section 3.3. The flow, process, and state sections of the FEATURE template are reduced to short not-applicable notes; the catalog content lives in section 6 Type Catalog.

### 1.2 Purpose

Concrete catalog of the "host actions and extension domains" family of DESIGN section 3.1, ported from the prototype with rebased identifiers (`gts.hai3.mfes.*` to `gts.frontx.mfes.*`, `gts.de.v.*` to `gts.frontx.v.*`, `gts.de.m.*` to `gts.frontx.m.*`, every identifier at `v1`). DESIGN section 3.1 delegates the field-level schemas of these types to this document, so section 6 carries them. The host actions are template-authored types derived from the FrontX action base `gts.frontx.mfes.comm.action.v1~`; they add no new GTS namespace.

Deltas against the prototype, all decided in the DESIGN and ADR-0007:

- Two concurrent template domains: `layout_cells` in the Viewer host registry and `modal_panel` in the modal container registry. The prototype's detail panel, its own `modal` domain, and their extension types are dropped; `modal_panel` has its own extension type.
- Two host actions: `set_subject` and `mount_widget`. The prototype's peer-navigation and filter-overlay actions are dropped, and no drill-down context action is added.
- `mount_widget` is sent by a widget's modal button to `layout_cells` and carries only the origin cell. The Viewer host answers it by opening a new instance of the same widget, with the same configuration, in `modal_panel`.
- No host action carries widget data. Each widget's MFE instance requests its own data once, when it mounts, sending its widget kind and its `params`, through the FrontX API package, whose API cache is shared across MFE entries (ADR-0011 backend-delivered-dashboard). The cache key is the widget kind plus the canonical form of `params`, so the modal instance, which sends the same kind and `params`, is served from the same cache entry.
- The modal container is a static instance of the FrontX extension base in the host modal domain; it has no derived type. It reads the host theme id through the theme shared property of the host modal domain, like any domain, and applies the template's own frontend-owned theme.
- Every widget's modal extension is registered when the Viewer host resolves the dashboard; opening the modal only mounts.
- The template theme payload of the theme shared property, and the widget extension identifier rule.

**Declaring package**: `dashboard-viewer` (`src-app/mfe_packages/dashboard-viewer/`). Every type and instance in this catalog is registered through the `mfe.json` of that package.

**Requirements**: `cpt-frontx-dashboard-fr-domain-model`, `cpt-frontx-dashboard-fr-widget-modal`, `cpt-frontx-dashboard-fr-theme`, `cpt-frontx-dashboard-fr-loading-error-states`

**Principles**: `cpt-frontx-dashboard-principle-no-extension-on-click`, `cpt-frontx-dashboard-principle-viewer-host-orchestration`, `cpt-frontx-dashboard-principle-gts-contracts`, `cpt-frontx-dashboard-principle-per-instance-isolation`

### 1.3 Actors

N/A. This is a type-catalog feature. The catalog is consumed by the runtime type system (the Viewer host registry, the modal container registry, the shell registry, and the widget MFEs), not by an end-user actor, so no actor flows are authored. The actors of the viewing use case are defined in the PRD and appear in the DESIGN sequences listed in section 2.

### 1.4 References

- **PRD**: [PRD.md](../../PRD.md)
- **Design**: [DESIGN.md](../../DESIGN.md) section 3.1 (Domain Model), section 3.3 (Host Actions, Template Extension Domains), section 3.5 (Host contract), section 3.6 (Interactions and Sequences), section 4 (handoffs and open items)
- **ADRs**: [ADR-0006](../../ADR/0006-theme-distribution-v1.md), [ADR-0007](../../ADR/0007-extension-domain-taxonomy-v1.md), [ADR-0008](../../ADR/0008-widget-kind-and-mfe-realization-v1.md), ADR-0011 backend-delivered-dashboard, [ADR-0010](../../ADR/0010-template-packages-and-host-contract-v1.md)
- **Design elements**: `cpt-frontx-dashboard-interface-host-actions`, `cpt-frontx-dashboard-interface-template-domains`, `cpt-frontx-dashboard-component-viewer-host`, `cpt-frontx-dashboard-component-modal-container`
- **Dependencies**: `feature-widget-catalog` (widget base carried by `set_subject`, including its `params`; the shared chrome with the modal button that sends `mount_widget`), `feature-dashboard-root-types` (palette shape of the theme payload), `feature-mfe-entries` (entries mounted into these domains, and the modal container entry; a reference by identifier only, not a build-order dependency, per DECOMPOSITION section 3)

## 2. Actor Flows (CDSL)

**Use cases**: `cpt-frontx-dashboard-usecase-explore-dashboard`

### Type-Catalog Feature: No Actor Flows

Not applicable because this feature declares static GTS types and instances that the runtime consumes; no actor interacts with the catalog itself. The runtime flows that use these types are the DESIGN sequences `cpt-frontx-dashboard-seq-initial-load`, `cpt-frontx-dashboard-seq-widget-modal-open`, `cpt-frontx-dashboard-seq-failure-handling`, `cpt-frontx-dashboard-seq-theme-switch`, and `cpt-frontx-dashboard-seq-teardown`. Section 6.10 summarizes the action chains by reference to them.

## 3. Processes / Business Logic (CDSL)

### Type-Catalog Feature: No Processes

Not applicable because the catalog declares schemas and instances only. Validation and admission are performed by the FrontX type system and registries (FrontX ADR-0009, ADR-0010); the chain logic lives in the Viewer host and the modal container, as described in DESIGN section 3.2 and section 3.6.

## 4. States (CDSL)

### Type-Catalog Feature: No State Machines

Not applicable because type declarations are stateless. Extension lifecycle stages are FrontX stages declared per domain in sections 6.3 and 6.4. After render nothing changes, so the Viewer host keeps no view state beyond whether it has opened the modal in this session.

## 5. Definitions of Done

### Type Catalog Definition of Done

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-dod-extension-domain-catalog-catalog-complete`

The system **MUST** register every type and instance of section 6 through the `dashboard-viewer` `mfe.json`, ported from the prototype with rebased identifiers and the deltas listed in section 1.2, and **MUST** generate widget extension identifiers by the rule of section 6.9.

- The two host action types, the two extension types, and the two domain instances validate against their FrontX bases.
- Every identifier follows `cpt-frontx-dashboard-constraint-gts-id-convention`: types end with `~`, instances do not, every segment starts at `v1`.
- The two domains are admitted with the concurrent mount strategy and pass the FrontX ADR-0009 cardinality matrix.
- `mount_widget` is declared on `layout_cells` only; every modal request is a `mount_widget` to `layout_cells` that names the origin cell, and the Viewer host answers it by mounting a new instance of the same widget with the same subject in `modal_panel`; that instance requests its own data with the same kind and `params`.
- No host action carries widget data; each widget requests its own data, and loading, error, and Retry are shown per widget.
- Every widget's modal extension is registered when the Viewer host resolves the dashboard; opening the modal registers nothing, and every modal chain step after the container's mount carries the fallback `unmount_ext` of the container.
- The modal container extension is an instance of the FrontX extension base declared for the host modal domain, with no derived type and no per-widget fields.
- Theme is the only shared property of the two template domains, its value follows the template theme payload of section 6.8, and the modal container derives it from the theme shared property of the host modal domain and the template's own theme.

**Covers (PRD)**: `cpt-frontx-dashboard-fr-domain-model`, `cpt-frontx-dashboard-fr-widget-modal`, `cpt-frontx-dashboard-fr-theme`

**Covers (DESIGN)**: `cpt-frontx-dashboard-interface-host-actions`, `cpt-frontx-dashboard-seq-failure-handling`, `cpt-frontx-dashboard-interface-template-domains`, `cpt-frontx-dashboard-component-modal-container`, `cpt-frontx-dashboard-seq-widget-modal-open`, `cpt-frontx-dashboard-seq-theme-switch`, `cpt-frontx-dashboard-principle-no-extension-on-click`

**Constraints**: `cpt-frontx-dashboard-constraint-gts-id-convention`, `cpt-frontx-dashboard-constraint-role-based-host-ids`, `cpt-frontx-dashboard-constraint-one-viewer-per-tree`

**Touches**:
- Entities: host actions, extension domains, extension types, modal container extension, template theme payload, widget extension identifiers

## 6. Type Catalog

All lifecycle actions referenced below are the FrontX actions `gts.frontx.mfes.comm.action.v1~frontx.mfes.ext.load_ext.v1~`, `gts.frontx.mfes.comm.action.v1~frontx.mfes.ext.mount_ext.v1~`, and `gts.frontx.mfes.comm.action.v1~frontx.mfes.ext.unmount_ext.v1~`; code takes them from the FrontX constants. Every action is a type derived from the FrontX action base; a chain carries an action, an optional `next`, and an optional `fallback`, and nothing comes back to the sender (FrontX ADR-0007).

### 6.1 Host Action: set_subject

**GTS ID**: `gts.frontx.mfes.comm.action.v1~frontx.v.mfe.set_subject.v1~`

**Description**: Viewer host to widget. Delivers the widget instance, which is the widget's whole configuration (its `id`, presentation configuration, and `params`), to a mounted widget extension. The widget stores it as its configuration and then requests its own data with its kind and `params`. Extension action of both template domains; the widget in `modal_panel` receives the same instance as its cell.

**Schema**:

```json
{
  "$id": "gts://gts.frontx.mfes.comm.action.v1~frontx.v.mfe.set_subject.v1~",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "set_subject",
  "description": "Host-to-widget action that delivers the widget instance to a mounted widget extension.",
  "allOf": [
    { "$ref": "gts://gts.frontx.mfes.comm.action.v1~" },
    {
      "required": ["payload"],
      "properties": {
        "target": {
          "type": "string",
          "x-gts-instance-ref": "gts.frontx.mfes.ext.extension.v1~",
          "description": "Narrows the inherited target to a mounted widget extension."
        },
        "payload": {
          "type": "object",
          "required": ["subject"],
          "properties": {
            "subject": {
              "$ref": "gts://gts.frontx.m.widget.widget.v1~",
              "description": "The widget instance of one concrete widget kind (or a type derived from one), carried inline as it appears in the layout cell of the dashboard definition: id, presentation configuration, and params."
            }
          }
        }
      }
    }
  ]
}
```

**Inheritance notes**:
- `type` and `target` are inherited and already required by the base; this schema adds `payload` to `required`.
- Delta: the prototype typed `subject` as an instance identifier. DESIGN section 3.3 fixes the payload as the widget instance, and the dashboard definition carries widget instances inline in the layout cells (DESIGN section 3.1), so the payload carries the instance itself. The receiving widget kind validates it at its own boundary.

**Cross-references**: DESIGN `cpt-frontx-dashboard-interface-host-actions`, `cpt-frontx-dashboard-seq-initial-load`, `cpt-frontx-dashboard-seq-widget-modal-open`; widget base in `feature-widget-catalog`; used by sections 6.3 and 6.4.

### 6.2 Host Action: mount_widget

**GTS ID**: `gts.frontx.mfes.comm.action.v1~frontx.v.mfe.mount_widget.v1~`

**Description**: Widget modal button to Viewer host. Every modal request is a `mount_widget` targeted at `layout_cells`, because that domain lives in the Viewer host's own registry and always exists. The Viewer host answers it by opening a new instance of the same widget, with the same configuration, in `modal_panel`: it takes the origin widget's instance from the loaded dashboard definition, makes no request itself, and runs the modal open chain (section 6.10). The modal instance requests its data with the same kind and `params` through the FrontX API package, so it hits the same shared API cache entry and receives the same data as the cell, normally without a new backend request. FrontX tracks no chain origin (FrontX ADR-0007), so the widget names itself as the origin, using the extension identifier its bridge exposes (FrontX ADR-0008). Domain action of `layout_cells` only; `modal_panel` does not declare it, so a widget in the modal cannot open another modal.

**Schema**:

```json
{
  "$id": "gts://gts.frontx.mfes.comm.action.v1~frontx.v.mfe.mount_widget.v1~",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "mount_widget",
  "description": "Modal request from a widget's modal button to the Viewer host, always targeted at the layout_cells domain.",
  "allOf": [
    { "$ref": "gts://gts.frontx.mfes.comm.action.v1~" },
    {
      "required": ["payload"],
      "properties": {
        "target": {
          "const": "gts.frontx.mfes.ext.domain.v1~frontx.v.layout.layout_cells.v1",
          "description": "Always the layout_cells domain instance."
        },
        "payload": {
          "type": "object",
          "required": ["origin"],
          "properties": {
            "origin": {
              "type": "string",
              "x-gts-instance-ref": "gts.frontx.mfes.ext.extension.v1~frontx.v.layout.layout_cells.v1~",
              "description": "Extension identifier of the sending widget's cell, as exposed by its bridge. The Viewer host opens this cell's widget in the modal."
            }
          }
        }
      }
    }
  ]
}
```

**Inheritance notes**:
- `type` and `target` are inherited; `target` is narrowed from the base's domain-or-extension choice to the single `layout_cells` instance.
- Delta: the prototype carried a widget list and allowed any domain as target. In the render-only scope the modal shows exactly the widget of the origin cell, so the payload carries only the origin; it carries no widget list, no clicked subject, no position, and no request for data.

**Cross-references**: DESIGN `cpt-frontx-dashboard-interface-host-actions`, `cpt-frontx-dashboard-seq-widget-modal-open`; the modal button in the shared chrome of `feature-widget-catalog`; declared in section 6.3.

### 6.3 Layout Cells Extension Domain

**GTS instance ID**: `gts.frontx.mfes.ext.domain.v1~frontx.v.layout.layout_cells.v1`

**Description**: Multi-instance widget canvas registered by the Viewer host in its own registry during its first mount. Each cell is one occupying extension that hosts exactly one widget; cells are unmounted only on dashboard teardown. It is the single receiver of modal requests (`mount_widget`). Theme is the only shared property. One Viewer host per application tree (`cpt-frontx-dashboard-constraint-one-viewer-per-tree`) keeps this fixed identifier unique.

**Mount strategy**: concurrent (FrontX ADR-0009, given at registration).

**Instance**:

```json
{
  "id": "gts.frontx.mfes.ext.domain.v1~frontx.v.layout.layout_cells.v1",
  "sharedProperties": [
    "gts.frontx.mfes.comm.shared_property.v1~frontx.mfes.comm.theme.v1~"
  ],
  "actions": [
    "gts.frontx.mfes.comm.action.v1~frontx.mfes.ext.load_ext.v1~",
    "gts.frontx.mfes.comm.action.v1~frontx.mfes.ext.mount_ext.v1~",
    "gts.frontx.mfes.comm.action.v1~frontx.mfes.ext.unmount_ext.v1~",
    "gts.frontx.mfes.comm.action.v1~frontx.v.mfe.mount_widget.v1~"
  ],
  "extensionsActions": [
    "gts.frontx.mfes.comm.action.v1~frontx.v.mfe.set_subject.v1~"
  ],
  "extensionsTypeId": "gts.frontx.mfes.ext.extension.v1~frontx.v.layout.layout_cells.v1~",
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

**Deltas**: `unmount_ext` added (the concurrent strategy requires it); `mount_widget` declared here as the domain action that receives modal requests; extension stages add `destroyed`.

**Cross-references**: extension type section 6.5; chains section 6.10; DESIGN `cpt-frontx-dashboard-interface-template-domains`.

### 6.4 Modal Panel Extension Domain

**GTS instance ID**: `gts.frontx.mfes.ext.domain.v1~frontx.v.layout.modal_panel.v1`

**Description**: Inner domain of the modal container, registered by the container in its own registry synchronously during its first mount (FrontX ADR-0008) and advertised to the shell. It holds exactly one widget: a new instance of the widget whose modal button was selected, mounted with the same subject as its cell; the instance requests its own data with the same kind and `params`. Its extensions are the widgets' modal extensions, which the Viewer host registers when it resolves the dashboard, so opening the modal only mounts. It replaces the prototype's `modal` domain. Theme is the only shared property; the container publishes it from the theme shared property of the host modal domain and the template's own theme (section 6.8).

**Mount strategy**: concurrent (FrontX ADR-0009, given at registration).

**Instance**:

```json
{
  "id": "gts.frontx.mfes.ext.domain.v1~frontx.v.layout.modal_panel.v1",
  "sharedProperties": [
    "gts.frontx.mfes.comm.shared_property.v1~frontx.mfes.comm.theme.v1~"
  ],
  "actions": [
    "gts.frontx.mfes.comm.action.v1~frontx.mfes.ext.load_ext.v1~",
    "gts.frontx.mfes.comm.action.v1~frontx.mfes.ext.mount_ext.v1~",
    "gts.frontx.mfes.comm.action.v1~frontx.mfes.ext.unmount_ext.v1~"
  ],
  "extensionsActions": [
    "gts.frontx.mfes.comm.action.v1~frontx.v.mfe.set_subject.v1~"
  ],
  "extensionsTypeId": "gts.frontx.mfes.ext.extension.v1~frontx.v.layout.modal_panel.v1~",
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

**Action membership notes**:
- `actions`: the lifecycle actions only. No `mount_widget`, because modal requests always go to `layout_cells` and a widget in the modal cannot open another modal. The shared widget chrome hides the modal button in the modal (`feature-widget-catalog`), so this catalog adds no action for it.
- `extensionsActions`: `set_subject`, the same as `layout_cells`, so a widget entry is admitted to both domains.

**Cross-references**: extension type section 6.6; modal container section 6.7; DESIGN `cpt-frontx-dashboard-component-modal-container`, `cpt-frontx-dashboard-seq-widget-modal-open`.

### 6.5 Layout Cells Extension Type

**GTS ID**: `gts.frontx.mfes.ext.extension.v1~frontx.v.layout.layout_cells.v1~`

**Description**: Extension type of the cells in `layout_cells`. Adds no fields beyond the FrontX extension base. Entries mounted with it support `set_subject`, as the domain requires.

**Schema**:

```json
{
  "$id": "gts://gts.frontx.mfes.ext.extension.v1~frontx.v.layout.layout_cells.v1~",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "Layout Cells Extension",
  "description": "Derived extension type for the layout_cells domain. Adds no fields beyond the FrontX extension base.",
  "allOf": [
    { "$ref": "gts://gts.frontx.mfes.ext.extension.v1~" },
    {
      "type": "object",
      "required": ["id", "domain", "entry"],
      "properties": {
        "id": {
          "type": "string",
          "x-gts-instance-ref": "gts.frontx.mfes.ext.extension.v1~frontx.v.layout.layout_cells.v1~",
          "description": "Identifier of the concrete cell extension."
        },
        "domain": {
          "type": "string",
          "const": "gts.frontx.mfes.ext.domain.v1~frontx.v.layout.layout_cells.v1",
          "description": "Domain instance this extension mounts into."
        },
        "entry": {
          "type": "string",
          "x-gts-instance-ref": "gts.frontx.mfes.mfe.entry.v1~",
          "description": "MFE entry to load, resolved through realizes: for the cell widget's kind."
        }
      }
    }
  ]
}
```

**Deltas**: the `domain` constant uses the instance form without a trailing `~` (`cpt-frontx-dashboard-constraint-gts-id-convention`); no per-subtype incoming-action list.

**Cross-references**: domain section 6.3; identifier rule section 6.9; entries in `feature-mfe-entries`; ADR-0008.

### 6.6 Modal Panel Extension Type

**GTS ID**: `gts.frontx.mfes.ext.extension.v1~frontx.v.layout.modal_panel.v1~`

**Description**: Extension type of the widgets' modal extensions in the container's `modal_panel`. Adds no fields beyond the FrontX extension base. The Viewer host registers one extension of this type per widget when it resolves the dashboard. It replaces the prototype's separate modal extension type.

**Schema**:

```json
{
  "$id": "gts://gts.frontx.mfes.ext.extension.v1~frontx.v.layout.modal_panel.v1~",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "Modal Panel Extension",
  "description": "Derived extension type for the modal_panel domain. Adds no fields beyond the FrontX extension base.",
  "allOf": [
    { "$ref": "gts://gts.frontx.mfes.ext.extension.v1~" },
    {
      "type": "object",
      "required": ["id", "domain", "entry"],
      "properties": {
        "id": {
          "type": "string",
          "x-gts-instance-ref": "gts.frontx.mfes.ext.extension.v1~frontx.v.layout.modal_panel.v1~",
          "description": "Identifier of the concrete modal extension of one widget."
        },
        "domain": {
          "type": "string",
          "const": "gts.frontx.mfes.ext.domain.v1~frontx.v.layout.modal_panel.v1",
          "description": "Domain instance this extension mounts into."
        },
        "entry": {
          "type": "string",
          "x-gts-instance-ref": "gts.frontx.mfes.mfe.entry.v1~",
          "description": "MFE entry to load, resolved through realizes: for the widget's kind; the same entry as the widget's cell."
        }
      }
    }
  ]
}
```

**Deltas**: new type with the instance form of `domain` without a trailing `~`; same shape as the layout cells extension type.

**Cross-references**: domain section 6.4; identifier rule section 6.9; ADR-0007, ADR-0008.

### 6.7 Modal Container Extension

**GTS instance ID**: `gts.frontx.mfes.ext.extension.v1~frontx.v.layout.modal_container.v1`

**Description**: Static extension of the host modal domain, declared in the `dashboard-viewer` manifest and registered by the host bootstrap from the manifest channel. It is an instance of the FrontX extension base with no derived type, because it carries no fields of its own: no subject and no widget data. Its entry requires theme and language, which the host modal domain shares, and declares no custom actions (entry owned by `feature-mfe-entries`). The container is a nested host for `modal_panel` (section 6.4). It reads the host theme id through the theme shared property of the host modal domain, like any domain, applies the template's own theme, and registers no extension when the modal opens. It renders the title area and Close, and offers no navigation to other widgets or items. It replaces the prototype's `modal` domain and `modal` extension type.

**Instance**:

```json
{
  "id": "gts.frontx.mfes.ext.extension.v1~frontx.v.layout.modal_container.v1",
  "domain": "gts.frontx.mfes.ext.domain.v1~frontx.screensets.layout.popup.v1",
  "entry": "gts.frontx.mfes.mfe.entry.v1~frontx.mfes.mfe.entry_mf.v1~frontx.v.mfe.modal_container.v1"
}
```

**Host contract notes**:
- `domain` is the host modal domain by role. As a manifest-declared extension it carries the current `template-shell` identifier from the DESIGN host contract table, or is generated from the shell constant at build time (`cpt-frontx-dashboard-constraint-role-based-host-ids`).
- The host modal domain has no extension type constraint, uses the optional mount strategy (zero or one occupant), and requires no extension actions, so this plain extension is admitted (FrontX ADR-0010).
- Host prerequisite: the host must render the host modal domain through a domain slot with modal chrome, focus trap, and dismissal. Current `template-shell` does not, and this change is tracked outside the template (DESIGN section 3.5 and section 4). Until it exists the container mounts but is not visible; the rest of the dashboard works.

**Cross-references**: DESIGN `cpt-frontx-dashboard-component-modal-container`, `cpt-frontx-dashboard-contract-host-domains`; ADR-0007, ADR-0010.

### 6.8 Template Theme Payload

**Description**: Value of the FrontX theme shared property `gts.frontx.mfes.comm.shared_property.v1~frontx.mfes.comm.theme.v1~` as published by the template into its own domains. Theme reaches every template domain, including the modal container and its `modal_panel`, through the theme shared property only; no host action carries theme data. Theme is the only shared property of the two template domains. The payload adds no GTS type: it is the stable value shape that the template publishes, and widgets read only this payload; they never map a host theme id themselves.

| Publisher | Domains | Value |
|-----------|---------|-------|
| Host | host screen and modal domains | the host theme id only (host contract, not template-owned) |
| Viewer host | `layout_cells` | template payload below |
| Modal container | `modal_panel` | template payload below, derived from the host theme id the container reads through the theme shared property of the host modal domain, mapped through the same theme-mode map, with the palette of the same template-owned theme |

**Template payload fields**:

| Field | Required | Meaning |
|-------|----------|---------|
| `theme_id` | yes | The host theme id, as received from the host. |
| `mode` | yes | `light` or `dark`, from the template's theme-mode map; an unmapped id resolves to `light` with a diagnostic. |
| `palette` | yes | The palette for that mode of the template's own theme, which lives on the frontend, in the shape of `light_palette` and `dark_palette` of `gts.frontx.m.dashboard.theme.v1~`. |

**Cross-references**: DESIGN section 3.1 (theme shared-property payload table), `cpt-frontx-dashboard-seq-theme-switch`; palette shape in `feature-dashboard-root-types`; ADR-0006.

### 6.9 Widget Extension Identifier Rule

**Description**: The Viewer host generates widget extension identifiers deterministically from the surface and the cell index, under the template's `frontx.v.layout` namespace (DESIGN section 3.3, Identifier uniqueness). This section fixes the form, as handed off by DESIGN section 4. Each identifier is an instance of the surface's extension type.

| Surface | Registered by | Identifier form |
|---------|---------------|-----------------|
| `layout_cells` | Viewer host, at dashboard resolve | `gts.frontx.mfes.ext.extension.v1~frontx.v.layout.layout_cells.v1~frontx.v.layout.cell_<c>.v1` |
| `modal_panel` | Viewer host, at dashboard resolve | `gts.frontx.mfes.ext.extension.v1~frontx.v.layout.modal_panel.v1~frontx.v.layout.modal_<c>.v1` |

- `<c>` is the zero-based index of the cell in the layout's ordered `cells`; each cell hosts exactly one widget, so `<c>` names that widget on both surfaces.
- The `cell_` and `modal_` prefixes and the distinct extension types keep the two sets disjoint, so no advertisement trips the tree-global collision guard (FrontX ADR-0007), and each modal extension identifier maps to exactly one widget of the open dashboard.
- Both sets are registered once, when the dashboard resolves, and unregistered on teardown; opening and closing the modal registers and unregisters nothing.
- The rule itself is TS-internal (DESIGN section 3.3, API Stability Classification); the identifiers it produces are not persisted.

**Cross-references**: `cpt-frontx-dashboard-interface-template-domains`; `cpt-frontx-dashboard-principle-no-extension-on-click`; section 6.11 (registration path into `modal_panel`).

### 6.10 Action Chain Patterns

**Description**: Summary of the chains that use this catalog. The authoritative step lists are the DESIGN sequences named in each row; this table is for orientation only. Per-widget configuration flows only through `set_subject`; each widget requests its own data through the FrontX API package; modal requests flow only through `mount_widget`; nothing travels through shared properties except the theme payload.

| Chain | Trigger | Steps, in order | DESIGN sequence |
|-------|---------|-----------------|-----------------|
| Cell mount | Dashboard definition resolved | registration of every cell extension and every widget's modal extension; `load_ext`, `mount_ext`, and `set_subject` per cell | `cpt-frontx-dashboard-seq-initial-load` |
| Widget data load | Widget mounted with its configuration | no chain; the widget shows its loading skeleton and requests its data once with its kind and `params` through the FrontX API package, then renders the response | `cpt-frontx-dashboard-seq-initial-load` |
| Widget data failure | A widget's data request fails, or its response fails validation against the widget data type its kind names in the `data_type` trait | no chain; only that cell shows its error with Retry; the other cells render; Retry repeats that widget's request only | `cpt-frontx-dashboard-seq-failure-handling` |
| Definition fetch failure | The dashboard definition request fails | no chain; dashboard-level error banner with Retry; no cell is mounted | `cpt-frontx-dashboard-seq-failure-handling` |
| Invalid definition | The definition parses, but one or more instances fail validation against the catalog types | no chain; no cell is mounted; a diagnostic names the failing instances; Retry does not apply | `cpt-frontx-dashboard-seq-failure-handling` |
| Modal open | `mount_widget` to `layout_cells` from a widget's modal button | The Viewer host makes no request; one escalated chain, every step after the container's mount with fallback `unmount_ext` of the container: `mount_ext` of the container in the host modal domain, `mount_ext` of the widget's modal extension in `modal_panel`, `set_subject` with the same instance as its cell; the new instance requests its data with the same kind and `params` and is served from the same shared API cache entry | `cpt-frontx-dashboard-seq-widget-modal-open` |
| Theme switch | Host theme id changes | Viewer host updates the theme payload of `layout_cells`; when the modal is open, the container receives the change through the theme shared property of the host modal domain and updates the theme payload of `modal_panel`; the Viewer host sends the container nothing | `cpt-frontx-dashboard-seq-theme-switch` |
| Close and teardown | Close, host dismissal, or dashboard close | `unmount_ext` of the container in the host modal domain; on teardown also `unmount_ext` of every cell and unregistration of the dashboard's widget extensions | `cpt-frontx-dashboard-seq-teardown` |

**Invariants**:
- A widget receives `set_subject` only after it is mounted, and requests its data only after it has its configuration.
- No extension is registered or unregistered when the modal opens or closes.
- The modal holds at most one widget, and closing it leaves the dashboard unchanged.
- After render no widget requests its data again, except on Retry after a failure, and no chain changes a widget's data.

### 6.11 Open Questions

- **Modal extension registration path** (DESIGN section 4). The Viewer host registers each widget's modal extension when it resolves the dashboard, but `modal_panel` exists only after the container's first mount. How those registrations reach `modal_panel` is not chosen yet; whatever the mechanism, opening the modal only mounts, and the identifier rule of section 6.9 does not change.
- **Widget data request form and cache options** (DESIGN section 4). The endpoint location comes from configuration, like the definition endpoint; the exact path and request form of a widget's data request (kind and `params`), the per-request cache options that keep entries from going stale or refetching, and whether reopening a dashboard refetches, are not chosen yet; whatever the mechanism, no host action carries widget data.

## 7. Acceptance Criteria

- [ ] Both host action types, the two extension types, the two domain instances, and the modal container extension of section 6 are registered through the `dashboard-viewer` `mfe.json` and validate against their FrontX bases.
- [ ] Every identifier in this catalog follows the template ID-form convention: types end with `~`, instances do not, and every template segment is at `v1`.
- [ ] `layout_cells` and `modal_panel` are admitted with the concurrent strategy; registering either of them without `unmount_ext` is rejected.
- [ ] `mount_widget` is declared on `layout_cells` only and carries only the origin cell; selecting a widget's modal button mounts a new instance of the same widget with the same subject in `modal_panel`, and the Viewer host makes no request.
- [ ] No host action carries widget data; neither domain declares a data-delivery action.
- [ ] A failing widget data request shows the error with Retry in that cell only; the other cells render.
- [ ] Every widget's modal extension is registered when the dashboard resolves; opening, closing, and reopening the modal registers nothing and logs no collision diagnostic in any registry.
- [ ] Widgets in both template domains, including the widget in the modal, receive the template theme payload with `theme_id`, `mode`, and `palette` through the theme shared property only, and no other shared property; a host theme change reaches the open modal without any action from the Viewer host.
- [ ] Widget extension identifiers follow section 6.9.
- [ ] The modal container extension carries only `id`, `domain`, and `entry`.
