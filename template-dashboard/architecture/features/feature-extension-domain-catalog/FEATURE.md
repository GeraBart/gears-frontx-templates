---
status: accepted
version: 1
date: 2026-10-27
description: Domain model of the render-only Viewer host's two host actions, two extension domains, two extension types, the modal container extension, the template theme payload, and the widget extension identifier rule, declared by dashboard-viewer, with how the Viewer host creates the widget extensions of both domains.
---

# Feature: Extension Domain Catalog


<!-- toc -->

- [1. Feature Context](#1-feature-context)
  - [1.1 Overview](#11-overview)
  - [1.2 Purpose](#12-purpose)
  - [1.3 Actors](#13-actors)
  - [1.4 References](#14-references)
- [2. Actor Flows (CDSL)](#2-actor-flows-cdsl)
  - [Domain-Model Feature: No Actor Flows](#domain-model-feature-no-actor-flows)
- [3. Processes / Business Logic (CDSL)](#3-processes--business-logic-cdsl)
  - [Create Widget Extensions at Dashboard Resolve](#create-widget-extensions-at-dashboard-resolve)
  - [Mount a Widget's Larger View](#mount-a-widgets-larger-view)
- [4. States (CDSL)](#4-states-cdsl)
  - [Domain-Model Feature: No State Machines](#domain-model-feature-no-state-machines)
- [5. Definitions of Done](#5-definitions-of-done)
  - [Domain Model Definition of Done](#domain-model-definition-of-done)
  - [Widget Extension Creation](#widget-extension-creation)
- [6. Domain Model](#6-domain-model)
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

This is a **domain-model feature**: it declares the template's host actions, extension domains, extension types, the modal container extension, and the template theme payload of the render-only Viewer host, and it specifies how the Viewer host creates the widget extensions of both template domains from the dashboard's widgets. Their abstract bases and structural prose live in DESIGN section 3.1 and section 3.3. The actor-flow and state sections of the FEATURE template are reduced to short not-applicable notes; section 3 holds the two extension creation processes, and the types live in section 6 Domain Model.

### 1.2 Purpose

Concrete types and instances of the "host actions and extension domains" family of DESIGN section 3.1. Every identifier builds on the FrontX MFE base types (`gts.frontx.mfes.*`) and uses the template's `frontx` vendor namespaces (`gts.frontx.v.*`, `gts.frontx.m.*`), with every template segment at `v1`. DESIGN section 3.1 delegates the field-level schemas of these types to this document, so section 6 carries them. The host actions are template-authored types derived from the FrontX action base `gts.frontx.mfes.comm.action.v1~`; they add no new GTS namespace.

The types follow the DESIGN and ADR-0007:

- Two concurrent template domains: `layout_cells` in the Viewer host registry and `modal_panel` in the modal container registry. Each domain has its own extension type.
- Two host actions, `set_subject` and `mount_widget`, and no other: there is no navigation, filter, or drill-down action.
- `mount_widget` is sent by a widget's modal button to `layout_cells` and carries only the origin cell. The Viewer host answers it by opening that widget's larger view in `modal_panel`. What the larger view shows, and its data, are that widget's implementation detail.
- No host action carries widget data. Each widget's MFE instance requests its own data through the FrontX API package, sending its widget kind and its `params` (ADR-0011 backend-delivered-dashboard): a widget in a cell once when it mounts, and a widget in its larger view whenever that view needs data.
- The modal container is a static instance of the FrontX extension base in the host modal domain; it has no derived type. It reads the host theme id through the theme shared property of the host modal domain, like any domain, and applies the template's own frontend-owned theme.
- The Viewer host creates every widget's extensions when it resolves the dashboard: one `layout_cells` extension per cell's widget and one `modal_panel` extension for that widget's larger view (section 3). Opening the larger view only mounts.
- The template theme payload of the theme shared property, and the widget extension identifier rule.

**Declaring package**: `dashboard-viewer` (`src-app/mfe_packages/dashboard-viewer/`). Every type and instance of this feature is registered through the `mfe.json` of that package.

**Requirements**: `cpt-frontx-dashboard-fr-domain-model`, `cpt-frontx-dashboard-fr-viewer-host`, `cpt-frontx-dashboard-fr-widget-modal`, `cpt-frontx-dashboard-fr-theme`, `cpt-frontx-dashboard-fr-loading-error-states`

**Principles**: `cpt-frontx-dashboard-principle-no-extension-on-click`, `cpt-frontx-dashboard-principle-viewer-host-orchestration`, `cpt-frontx-dashboard-principle-gts-contracts`, `cpt-frontx-dashboard-principle-per-instance-isolation`

### 1.3 Actors

N/A. This is a domain-model feature. Its types are consumed by the runtime type system (the Viewer host registry, the modal container registry, the shell registry, and the widget MFEs), and its processes run inside the Viewer host, not by an end-user actor, so no actor flows are authored. The actors of the viewing use case are defined in the PRD and appear in the DESIGN sequences listed in section 2.

### 1.4 References

- **PRD**: [PRD.md](../../PRD.md)
- **Design**: [DESIGN.md](../../DESIGN.md) section 3.1 (Domain Model), section 3.2 (Viewer Host), section 3.3 (Host Actions, Template Extension Domains), section 3.5 (Host contract), section 3.6 (Interactions and Sequences), section 4 (handoffs and open items)
- **ADRs**: [ADR-0006](../../ADR/0006-theme-distribution-v1.md), [ADR-0007](../../ADR/0007-extension-domain-taxonomy-v1.md), [ADR-0008](../../ADR/0008-widget-kind-and-mfe-realization-v1.md), ADR-0011 backend-delivered-dashboard, [ADR-0010](../../ADR/0010-template-packages-and-host-contract-v1.md)
- **Design elements**: `cpt-frontx-dashboard-interface-host-actions`, `cpt-frontx-dashboard-interface-template-domains`, `cpt-frontx-dashboard-component-viewer-host`, `cpt-frontx-dashboard-component-modal-container`
- **Dependencies**: `feature-widget-catalog` (widget base carried by `set_subject`, including its `params`; the shared chrome with the modal button that sends `mount_widget`), `feature-dashboard-root-types` (palette shape of the theme payload), `feature-mfe-entries` (entries mounted into these domains, and the modal container entry; a reference by identifier only, not a build-order dependency, per DECOMPOSITION section 3)
- **Related**: `cpt-frontx-dashboard-feature-backend-contract` (the widget data request, including a widget's own request for its larger view, and the open request form)

## 2. Actor Flows (CDSL)

**Use cases**: `cpt-frontx-dashboard-usecase-explore-dashboard`

### Domain-Model Feature: No Actor Flows

Not applicable because this feature declares static GTS types and instances that the runtime consumes, and the extension creation processes of section 3 run inside the Viewer host; no actor interacts with the types themselves. The runtime flows that use these types are the DESIGN sequences `cpt-frontx-dashboard-seq-initial-load`, `cpt-frontx-dashboard-seq-widget-modal-open`, `cpt-frontx-dashboard-seq-failure-handling`, `cpt-frontx-dashboard-seq-theme-switch`, and `cpt-frontx-dashboard-seq-teardown`. Section 6.10 summarizes the action chains by reference to them.

## 3. Processes / Business Logic (CDSL)

The Viewer host creates the widget extensions of both template domains from the widgets of the resolved dashboard, and mounts a widget's larger view from the extension created for it. Validation and admission of the types and extensions are performed by the FrontX type system and registries (FrontX ADR-0009, ADR-0010); the step-by-step chains are the DESIGN sequences named in section 2.

### Create Widget Extensions at Dashboard Resolve

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-algo-extension-domain-catalog-create-widget-extensions`

**Input**: The resolved dashboard, after the dashboard and its embedded widget instances have passed validation and the layout has passed its checks (DESIGN `cpt-frontx-dashboard-seq-initial-load`, steps 4 and 6): the ordered `cells` of its layout, each embedding one widget instance whose `id` names its kind in its type chain; and the widget entries registered from the manifest channel.

**Output**: For every cell's widget, two registered extensions that point to the same widget entry: one `layout_cells` extension for the cell and one `modal_panel` extension for the widget's larger view. For a cell whose kind has no single realizing entry, or whose registration the FrontX registry rejects, neither extension; the Viewer host shows that cell's cannot-show state with a diagnostic and no Retry, and the other cells are unaffected. For a layout with zero cells, an empty result.

**Steps**:
1. [ ] - `p1` - **IF** the layout has zero cells - `inst-if-no-cells`
   1. [ ] - `p1` - Register nothing and **RETURN** an empty result - `inst-return-empty`
2. [ ] - `p1` - **FOR EACH** cell of the layout's ordered `cells`, with its zero-based index `<c>` - `inst-for-each-cell`
   1. [ ] - `p1` - Take the widget's kind from the type chain of the embedded widget instance's `id` - `inst-take-widget-kind`
   2. [ ] - `p1` - Resolve the kind to the widget entry whose `realizes` names it (`feature-mfe-entries` section 6.3); how a consumer-derived widget type resolves to the entry of the kind it derives from is open (`feature-mfe-entries` section 6.7) - `inst-resolve-entry`
   3. [ ] - `p1` - **IF** no widget entry realizes the kind - `inst-if-no-entry`
      1. [ ] - `p1` - Create neither extension for this cell; the Viewer host shows that cell's cannot-show state with a diagnostic and no Retry, and the other cells are unaffected; the loop continues - `inst-skip-cell-no-entry`
   4. [ ] - `p1` - **IF** more than one widget entry realizes the kind - `inst-if-ambiguous-entry`
      1. [ ] - `p1` - Treat it as a configuration error: create neither extension for this cell; the Viewer host shows that cell's cannot-show state with a diagnostic and no Retry, and the other cells are unaffected; the loop continues - `inst-skip-cell-ambiguous-entry`
   5. [ ] - `p1` - Create the cell extension: an instance of the layout cells extension type (section 6.5) with the identifier `gts.frontx.mfes.ext.extension.v1~frontx.v.layout.layout_cells.v1~frontx.v.layout.cell_<c>.v1` (section 6.9), `domain` set to the `layout_cells` instance, and `entry` set to the resolved entry - `inst-create-cell-extension`
   6. [ ] - `p1` - Create the widget's modal extension for its larger view: an instance of the modal panel extension type (section 6.6) with the identifier `gts.frontx.mfes.ext.extension.v1~frontx.v.layout.modal_panel.v1~frontx.v.layout.modal_<c>.v1` (section 6.9), `domain` set to the `modal_panel` instance, and `entry` set to the same resolved entry as the cell extension - `inst-create-modal-extension`
3. [ ] - `p1` - Register every cell extension in the Viewer host registry, where `layout_cells` lives - `inst-register-cell-extensions`
4. [ ] - `p1` - Register every modal extension for `modal_panel`; `modal_panel` exists only after the container's first mount, and the path by which these registrations reach it is open (section 6.11); blocked by section 6.11 - `inst-register-modal-extensions`
5. [ ] - `p1` - **IF** the FrontX registry rejects the registration of an extension of a cell - `inst-if-registration-rejected`
   1. [ ] - `p1` - Handle it like the no-entry case for that cell: no extension of that cell stays registered; the Viewer host shows that cell's cannot-show state with a diagnostic and no Retry, and the other cells are unaffected - `inst-skip-cell-registration-rejected`
6. [ ] - `p1` - **RETURN** the registered cell and modal extensions; no further extension is registered while the dashboard is open, and teardown unregisters all of them (DESIGN `cpt-frontx-dashboard-seq-teardown`) - `inst-return-extensions`

### Mount a Widget's Larger View

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-algo-extension-domain-catalog-mount-larger-view`

**Input**: A `mount_widget` received on `layout_cells` from a widget's modal button, whose `origin` names the extension identifier of the sending widget's cell.

**Output**: The modal container mounted in the host modal domain, with the widget's modal extension mounted in `modal_panel` and configured; or, when the container's mount or a step after it fails, or when the widget's modal extension is not registered, no modal and the dashboard unchanged; or, when the origin resolves to no cell, nothing opened.

**Steps**:
1. [ ] - `p1` - Resolve the `origin` cell extension identifier to its cell index `<c>` (section 6.9) - `inst-resolve-cell-index`
2. [ ] - `p1` - **IF** the `origin` resolves to no cell - `inst-if-origin-unknown`
   1. [ ] - `p1` - Ignore the `mount_widget` with a diagnostic; nothing is opened or changed, and **RETURN** - `inst-ignore-unknown-origin`
3. [ ] - `p1` - Take the widget instance of cell `<c>` from the loaded dashboard; the Viewer host makes no request - `inst-take-widget-instance`
4. [ ] - `p1` - Select the widget's modal extension `gts.frontx.mfes.ext.extension.v1~frontx.v.layout.modal_panel.v1~frontx.v.layout.modal_<c>.v1`, created at dashboard resolve; register nothing - `inst-select-modal-extension`
5. [ ] - `p1` - **IF** the widget's modal extension is not registered - `inst-if-modal-extension-unregistered`
   1. [ ] - `p1` - No modal appears and the dashboard is unchanged, and **RETURN** - `inst-modal-extension-unregistered-unchanged`
6. [ ] - `p1` - **IF** a widget is already in the modal (the modal holds at most one widget) - `inst-if-modal-occupied`
   1. [ ] - `p1` - Unmount the current occupant first, then continue - `inst-unmount-occupant`
7. [ ] - `p1` - Dispatch one chain that escalates to the shell; every step after the container's mount carries the fallback `unmount_ext` of the container in the host modal domain (section 6.10) - `inst-dispatch-chain`
   1. [ ] - `p1` - `mount_ext` of the modal container extension (section 6.7) in the host modal domain; when the container is still mounted, this step completes at once without change (FrontX ADR-0009) - `inst-mount-container`
   2. [ ] - `p1` - `mount_ext` of the widget's modal extension in `modal_panel` - `inst-mount-modal-extension`
   3. [ ] - `p1` - `set_subject` to the widget's modal extension with the widget instance that its cell received - `inst-send-subject`
8. [ ] - `p1` - **IF** the container's mount fails - `inst-if-container-fails`
   1. [ ] - `p1` - No modal appears and the dashboard is unchanged, and **RETURN** with no modal and the dashboard unchanged - `inst-container-fail-unchanged`
9. [ ] - `p1` - **IF** a step after the container's mount fails - `inst-if-step-fails`
   1. [ ] - `p1` - The container's registry runs the fallback `unmount_ext` of the container, which closes the modal; the Viewer host is not notified, the dashboard stays usable, and the next modal button selection starts a new open; **RETURN** with no modal and the dashboard unchanged - `inst-run-fallback`
10. [ ] - `p1` - **IF** the modal is closed (close, host dismissal, or dashboard close) - `inst-if-modal-closed`
   1. [ ] - `p1` - `unmount_ext` of the container, which unmounts its occupant - `inst-close-unmounts-occupant`
11. [ ] - `p1` - **IF** the chain succeeded, **RETURN** the widget's larger view in `modal_panel`; what it shows, and its data, are that widget's implementation detail, and the widget may make its own data request through the FrontX API package - `inst-return-modal-larger-view`

## 4. States (CDSL)

### Domain-Model Feature: No State Machines

Not applicable because type declarations are stateless. Extension lifecycle stages are FrontX stages declared per domain in sections 6.3 and 6.4. After render nothing changes, so the Viewer host keeps no view state beyond whether it has opened the modal while the dashboard is open.

## 5. Definitions of Done

### Domain Model Definition of Done

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-dod-extension-domain-catalog-catalog-complete`

The system **MUST** register every type and instance of section 6 through the `dashboard-viewer` `mfe.json`, with the identifiers of section 1.2, and **MUST** generate widget extension identifiers by the rule of section 6.9.

- The two host action types, the two extension types, and the two domain instances validate against their FrontX bases.
- Every identifier follows `cpt-frontx-dashboard-constraint-gts-id-convention`: types end with `~`, instances do not, every segment starts at `v1`.
- The two domains are admitted with the concurrent mount strategy and pass the FrontX ADR-0009 cardinality matrix.
- `mount_widget` is declared on `layout_cells` only (the opening of the larger view in `modal_panel` is blocked by section 6.11); every modal request is a `mount_widget` to `layout_cells` that names the origin cell, and the Viewer host answers it by opening that widget's larger view in `modal_panel`, sending the widget the same widget instance as its cell; what the larger view shows, and its data, are that widget's implementation detail.
- No host action carries widget data; each widget requests its own data, and loading, error, and Retry are shown per widget.
- Every widget's modal extension is registered when the Viewer host resolves the dashboard; opening the modal registers nothing, and every modal chain step after the container's mount carries the fallback `unmount_ext` of the container (blocked by section 6.11).
- The modal container extension is an instance of the FrontX extension base declared for the host modal domain, with no derived type and no per-widget fields.
- Theme is the only shared property of the two template domains, its value follows the template theme payload of section 6.8, and the modal container derives it from the theme shared property of the host modal domain and the template's own theme.

**Covers (PRD)**: `cpt-frontx-dashboard-fr-domain-model`, `cpt-frontx-dashboard-fr-widget-modal`, `cpt-frontx-dashboard-fr-theme`

**Covers (DESIGN)**: `cpt-frontx-dashboard-interface-host-actions`, `cpt-frontx-dashboard-seq-failure-handling`, `cpt-frontx-dashboard-interface-template-domains`, `cpt-frontx-dashboard-component-modal-container`, `cpt-frontx-dashboard-seq-widget-modal-open`, `cpt-frontx-dashboard-seq-theme-switch`, `cpt-frontx-dashboard-principle-no-extension-on-click`

**Constraints**: `cpt-frontx-dashboard-constraint-gts-id-convention`, `cpt-frontx-dashboard-constraint-role-based-host-ids`, `cpt-frontx-dashboard-constraint-one-viewer-per-tree`

**Touches**:
- Entities: host actions, extension domains, extension types, modal container extension, template theme payload, widget extension identifiers

### Widget Extension Creation

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-dod-extension-domain-catalog-extension-creation`

The system **MUST** create, when the Viewer host resolves the dashboard, one `layout_cells` extension for each cell's widget and one `modal_panel` extension for that widget's larger view, both pointing to the entry that realizes the widget's kind, and **MUST** open a widget's larger view only by mounting the modal extension created for it, registering nothing.

- Both extensions of a widget carry the same index `<c>` in their identifiers (section 6.9) and the same `entry`; the `layout_cells` extension is testable now, the `modal_panel` extension is blocked by section 6.11.
- The modal extension of a widget is mounted only after the container's mount, through the chain of section 6.10, and receives the same widget instance as its cell (the `modal_panel` bullets of this list are blocked by section 6.11).
- A cell whose kind has no entry or more than one entry, or whose registration the FrontX registry rejects, gets neither extension and shows its cannot-show state with a diagnostic and no Retry; a layout with zero cells registers nothing.
- Teardown unregisters every extension that dashboard resolve created.

**Implements**:
- `cpt-frontx-dashboard-algo-extension-domain-catalog-create-widget-extensions`
- `cpt-frontx-dashboard-algo-extension-domain-catalog-mount-larger-view`

**Covers (PRD)**: `cpt-frontx-dashboard-fr-viewer-host`, `cpt-frontx-dashboard-fr-widget-modal`

**Covers (DESIGN)**: `cpt-frontx-dashboard-component-viewer-host`, `cpt-frontx-dashboard-principle-no-extension-on-click`, `cpt-frontx-dashboard-interface-template-domains`, `cpt-frontx-dashboard-seq-initial-load`, `cpt-frontx-dashboard-seq-widget-modal-open`, `cpt-frontx-dashboard-seq-teardown`

**Constraints**: `cpt-frontx-dashboard-constraint-gts-id-convention`, `cpt-frontx-dashboard-constraint-one-viewer-per-tree`

**Touches**:
- Entities: layout cells extensions, modal panel extensions, widget entries, modal container extension

## 6. Domain Model

All lifecycle actions referenced below are the FrontX actions `gts.frontx.mfes.comm.action.v1~frontx.mfes.ext.load_ext.v1~`, `gts.frontx.mfes.comm.action.v1~frontx.mfes.ext.mount_ext.v1~`, and `gts.frontx.mfes.comm.action.v1~frontx.mfes.ext.unmount_ext.v1~`; code takes them from the FrontX constants. Every action is a type derived from the FrontX action base `gts.frontx.mfes.comm.action.v1~`. A chain carries an action, an optional `next`, and an optional `fallback`, and nothing comes back to the sender (FrontX ADR-0007).

### 6.1 Host Action: set_subject

**GTS ID**: `gts.frontx.mfes.comm.action.v1~frontx.v.mfe.set_subject.v1~`

**Description**: Viewer host to widget. Delivers the widget instance, which is the widget's whole configuration (its `id`, presentation configuration, and `params`), to a mounted widget extension. The widget stores it as its configuration. In a cell, the widget then requests its own data with its kind and `params`. In `modal_panel`, the widget receives the same instance as its cell and shows its larger view, making its own data request when that view needs data. Extension action of both template domains.

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
- `subject` carries the widget instance itself, not an instance identifier: DESIGN section 3.3 fixes the payload as the widget instance, and the dashboard definition carries widget instances inline in the layout cells (DESIGN section 3.1). The receiving widget kind validates it at its own boundary.

**Cross-references**: DESIGN `cpt-frontx-dashboard-interface-host-actions`, `cpt-frontx-dashboard-seq-initial-load`, `cpt-frontx-dashboard-seq-widget-modal-open`; widget base in `feature-widget-catalog`; used by sections 6.3 and 6.4.

### 6.2 Host Action: mount_widget

**GTS ID**: `gts.frontx.mfes.comm.action.v1~frontx.v.mfe.mount_widget.v1~`

**Description**: Widget modal button to Viewer host. Every modal request is a `mount_widget` targeted at `layout_cells`, because that domain lives in the Viewer host's own registry and always exists. The Viewer host answers it by opening that widget's larger view in `modal_panel`: it takes the origin widget's instance from the loaded dashboard definition, makes no request itself, and mounts the widget's modal extension created at dashboard resolve (section 3, `cpt-frontx-dashboard-algo-extension-domain-catalog-mount-larger-view`; chain in section 6.10). What the larger view shows, and its data, are that widget's implementation detail; the widget may make its own data request through the FrontX API package. FrontX tracks no chain origin (FrontX ADR-0007), so the widget names itself as the origin, using the extension identifier its bridge exposes (FrontX ADR-0008). Domain action of `layout_cells` only; `modal_panel` does not declare it, so a widget in the modal cannot open another modal.

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
- The modal shows the larger view of exactly the widget of the origin cell, so the payload carries only the origin; it carries no widget list, no clicked subject, no position, and no request for data.

**Cross-references**: DESIGN `cpt-frontx-dashboard-interface-host-actions`, `cpt-frontx-dashboard-seq-widget-modal-open`; the modal button in the shared chrome of `feature-widget-catalog`; declared in section 6.3.

### 6.3 Layout Cells Extension Domain

**GTS instance ID**: `gts.frontx.mfes.ext.domain.v1~frontx.v.layout.layout_cells.v1`

**Description**: Multi-instance widget canvas registered by the Viewer host in its own registry during its first mount. Each cell is one occupying extension that hosts exactly one widget; the Viewer host creates one extension per cell's widget when it resolves the dashboard (section 3), and cells are unmounted only on dashboard teardown. It is the single receiver of modal requests (`mount_widget`). Theme is the only shared property. One Viewer host per application tree (`cpt-frontx-dashboard-constraint-one-viewer-per-tree`) keeps this fixed identifier unique.

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

**Declaration notes**: `unmount_ext` is declared because the concurrent strategy requires it; `mount_widget` is declared here as the domain action that receives modal requests; the extension stages include `destroyed`, because cells are unmounted on dashboard teardown.

**Cross-references**: extension type section 6.5; extension creation section 3; chains section 6.10; DESIGN `cpt-frontx-dashboard-interface-template-domains`.

### 6.4 Modal Panel Extension Domain

**GTS instance ID**: `gts.frontx.mfes.ext.domain.v1~frontx.v.layout.modal_panel.v1`

**Description**: Inner domain of the modal container, registered by the container in its own registry synchronously during its first mount (FrontX ADR-0008) and advertised to the shell. It holds exactly one widget: the larger view of the widget whose modal button was selected, mounted from that widget's modal extension and sent the same widget instance as its cell. What the larger view shows, and its data, are that widget's implementation detail; the widget may make its own data request through the FrontX API package. Its extensions are the widgets' modal extensions, which the Viewer host creates when it resolves the dashboard (section 3), so opening the modal only mounts. Theme is the only shared property; the container publishes it from the theme shared property of the host modal domain and the template's own theme (section 6.8).

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
- `actions`: the lifecycle actions only. No `mount_widget`, because modal requests always go to `layout_cells` and a widget in the modal cannot open another modal. The shared widget chrome hides the modal button in the modal (`feature-widget-catalog`), so this feature adds no action for it.
- `extensionsActions`: `set_subject`, the same as `layout_cells`, so a widget entry is admitted to both domains.

**Cross-references**: extension type section 6.6; extension creation and mounting section 3; modal container section 6.7; DESIGN `cpt-frontx-dashboard-component-modal-container`, `cpt-frontx-dashboard-seq-widget-modal-open`.

### 6.5 Layout Cells Extension Type

**GTS ID**: `gts.frontx.mfes.ext.extension.v1~frontx.v.layout.layout_cells.v1~`

**Description**: Extension type of the cells in `layout_cells`. Adds no fields beyond the FrontX extension base. The Viewer host creates one extension of this type per cell's widget when it resolves the dashboard (section 3). Entries mounted with it support `set_subject`, as the domain requires.

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

**Declaration notes**: the `domain` constant uses the instance form without a trailing `~` (`cpt-frontx-dashboard-constraint-gts-id-convention`); there is no per-subtype incoming-action list.

**Cross-references**: domain section 6.3; extension creation section 3; identifier rule section 6.9; entries in `feature-mfe-entries`; ADR-0008.

### 6.6 Modal Panel Extension Type

**GTS ID**: `gts.frontx.mfes.ext.extension.v1~frontx.v.layout.modal_panel.v1~`

**Description**: Extension type of the widgets' modal extensions in the container's `modal_panel`; each extension of this type mounts one widget's larger view. Adds no fields beyond the FrontX extension base. The Viewer host creates one extension of this type per widget when it resolves the dashboard, pointing to the same entry as that widget's cell extension (section 3).

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

**Declaration notes**: the `domain` constant uses the instance form without a trailing `~`; the type has the same shape as the layout cells extension type.

**Cross-references**: domain section 6.4; extension creation and mounting section 3; identifier rule section 6.9; ADR-0007, ADR-0008.

### 6.7 Modal Container Extension

**GTS instance ID**: `gts.frontx.mfes.ext.extension.v1~frontx.v.layout.modal_container.v1`

**Description**: Static extension of the host modal domain, declared in the `dashboard-viewer` manifest and registered by the host bootstrap from the manifest channel. It is an instance of the FrontX extension base with no derived type, because it carries no fields of its own: no subject and no widget data. Its entry requires theme and language, which the host modal domain shares, and declares no custom actions (entry owned by `feature-mfe-entries`). The container is a nested host for `modal_panel` (section 6.4), in which it shows one widget's larger view. It reads the host theme id through the theme shared property of the host modal domain, like any domain, applies the template's own theme, and registers no extension when the modal opens. It renders the title area and Close, and offers no navigation to other widgets or items.

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

- `<c>` is the zero-based index of the cell in the layout's ordered `cells`; each cell hosts exactly one widget, so `<c>` names that widget on both surfaces, and the larger view of the widget in cell `<c>` is mounted from `modal_<c>`.
- The `cell_` and `modal_` prefixes and the distinct extension types keep the two sets disjoint, so no advertisement trips the tree-global collision guard (FrontX ADR-0007), and each modal extension identifier maps to exactly one widget of the open dashboard.
- Both sets are registered once, when the dashboard resolves, and unregistered on teardown; opening and closing the modal registers and unregisters nothing.
- The rule itself is TS-internal (DESIGN section 3.3, API Stability Classification); the identifiers it produces are not persisted.

**Cross-references**: `cpt-frontx-dashboard-interface-template-domains`; `cpt-frontx-dashboard-principle-no-extension-on-click`; extension creation section 3; section 6.11 (registration path into `modal_panel`).

### 6.10 Action Chain Patterns

**Description**: Summary of the chains that use these types. The authoritative step lists are the DESIGN sequences named in each row; this table is for orientation only. Per-widget configuration flows only through `set_subject`; each widget requests its own data through the FrontX API package; modal requests flow only through `mount_widget`; nothing travels through shared properties except the theme payload.

| Chain | Trigger | Steps, in order | DESIGN sequence |
|-------|---------|-----------------|-----------------|
| Cell mount | Dashboard definition resolved | creation and registration of every cell extension and every widget's modal extension (section 3); `load_ext`, `mount_ext`, and `set_subject` per cell | `cpt-frontx-dashboard-seq-initial-load` |
| Widget data load | Widget mounted in a cell with its configuration | no chain; the widget shows its loading skeleton and requests its data once with its kind and `params` through the FrontX API package, then renders the response | `cpt-frontx-dashboard-seq-initial-load` |
| Widget data failure | A widget's data request fails | no chain; only that cell shows its error with Retry; the other cells render; Retry repeats that widget's request only | `cpt-frontx-dashboard-seq-failure-handling` |
| Widget data that cannot be shown | A widget's response fails validation against the widget data type its kind names in the `data_type` trait, or fails a kind-specific check such as the grid column-key check (`feature-widget-catalog` section 6.5) | no chain; only that cell shows an error state with a diagnostic; nothing of the response is rendered; Retry does not apply; the other cells render | `cpt-frontx-dashboard-seq-failure-handling` |
| Definition fetch failure | The dashboard definition request fails | no chain; dashboard-level error banner with Retry; no cell is mounted | `cpt-frontx-dashboard-seq-failure-handling` |
| Dashboard that cannot be shown | The dashboard or an embedded widget fails validation against its type, the layout fails a layout check (`feature-layout-types` section 6.3), or a grid widget fails a grid configuration check (`feature-widget-catalog` section 6.5) | no chain; no cell is mounted; a diagnostic names the failing instances, cells, or grid columns and groups; Retry does not apply | `cpt-frontx-dashboard-seq-failure-handling` |
| Cell without a single realizing entry | No widget entry, or more than one, realizes the kind of a cell's widget, or the FrontX registry rejects a registration for it | no chain; the Viewer host shows that cell's cannot-show state with a diagnostic and no Retry; the other cells are unaffected | `cpt-frontx-dashboard-seq-initial-load` |
| Cell whose widget fails to load or mount | The `load_ext`, `mount_ext`, or `set_subject` of a cell fails | no chain continues for that cell; the Viewer host shows that cell's cannot-show state with a diagnostic; the other cells are unaffected; whether Retry applies, and what the cell shows before `set_subject`, are open (section 6.11) | `cpt-frontx-dashboard-seq-failure-handling` |
| Modal open | `mount_widget` to `layout_cells` from a widget's modal button | The Viewer host makes no request; one escalated chain, every step after the container's mount with fallback `unmount_ext` of the container: `mount_ext` of the container in the host modal domain, `mount_ext` of the widget's modal extension in `modal_panel`, `set_subject` with the same widget instance as its cell; when a widget already occupies the modal, its occupant is unmounted first, and who does that and how the Viewer host knows the occupant are open (modal occupant, section 6.11); the widget shows its larger view and may make its own data request through the FrontX API package | `cpt-frontx-dashboard-seq-widget-modal-open` |
| Theme switch | Host theme id changes | Viewer host updates the theme payload of `layout_cells`; when the modal is open, the container receives the change through the theme shared property of the host modal domain and updates the theme payload of `modal_panel`; the Viewer host sends the container nothing | `cpt-frontx-dashboard-seq-theme-switch` |
| Close and teardown | Close, host dismissal, or dashboard close | `unmount_ext` of the container in the host modal domain; who unmounts the widget that occupies `modal_panel` on Close and on host dismissal is open (modal occupant, section 6.11); on teardown also `unmount_ext` of every cell and unregistration of the dashboard's widget extensions | `cpt-frontx-dashboard-seq-teardown` |

**Invariants**:
- A widget receives `set_subject` only after it is mounted, and requests its data only after it has its configuration.
- No extension is registered or unregistered when the modal opens or closes.
- The modal holds at most one widget, and closing it leaves the dashboard unchanged.
- After render no widget requests data again, except on Retry after a failure and a widget's own request for what its larger view needs, and no chain changes a widget's data.

### 6.11 Open Questions

- **Modal extension registration path** (DESIGN section 4). The Viewer host creates each widget's modal extension when it resolves the dashboard (section 3), but `modal_panel` exists only after the container's first mount. How those registrations reach `modal_panel` is not chosen yet; whatever the mechanism, opening a widget's larger view only mounts, and the identifier rule of section 6.9 does not change. Owner: template architect. Blocked by this item: the modal_panel parts of the acceptance criteria and of both Definitions of Done (`cpt-frontx-dashboard-dod-extension-domain-catalog-extension-creation` and `cpt-frontx-dashboard-dod-extension-domain-catalog-catalog-complete`).
- **Modal occupant** (DESIGN section 4). Decided: the modal holds at most one widget, and Close and host dismissal run `unmount_ext` of the container in the host modal domain. Open: who unmounts the widget that occupies `modal_panel` on Close and on host dismissal, and how the Viewer host knows the current occupant of `modal_panel`, given that a chain reports nothing back to its sender (FrontX ADR-0007). The occupied-modal branch of section 3 (`inst-unmount-occupant`) and the Close step (`inst-close-unmounts-occupant`) depend on it. Owner: template architect. Blocked by this item: the acceptance criteria that unmount the current occupant and that close the modal.
- **Cell widget that fails to load or mount** (DESIGN section 4). Decided: a cell whose `load_ext`, `mount_ext`, or `set_subject` fails shows its cannot-show state with a diagnostic, and the other cells are unaffected. Open: whether Retry applies to such a cell, and what the cell shows before `set_subject`. Owner: template architect. Blocked by this item: any criterion on Retry for such a cell or on what a cell shows before `set_subject`.
- **Widget data request form.** The path and request form of a widget's data request, including a widget's own request for its larger view, are open item 1 of `cpt-frontx-dashboard-feature-backend-contract` section 6.5; whatever the form, no host action carries widget data.

## 7. Acceptance Criteria

Every acceptance criterion that mounts into `modal_panel` is blocked by section 6.11.

- [ ] Both host action types, the two extension types, the two domain instances, and the modal container extension of section 6 are registered through the `dashboard-viewer` `mfe.json` and validate against their FrontX bases.
- [ ] Every identifier of this feature follows the template ID-form convention: types end with `~`, instances do not, and every template segment is at `v1`.
- [ ] `layout_cells` and `modal_panel` are admitted with the concurrent strategy; registering either of them without `unmount_ext` is rejected.
- [ ] When a dashboard with N cells resolves and every cell's kind resolves to exactly one entry, exactly N `layout_cells` extensions are registered, with the identifiers `cell_0` to `cell_<N-1>` of section 6.9, and each points to the entry whose `realizes` names the kind of that cell's widget; likewise N `modal_panel` extensions with `modal_0` to `modal_<N-1>`, each pointing to the same entry as the cell of the same index (the `modal_panel` half is blocked by section 6.11); a skipped cell leaves its index unused, so the other identifiers keep their positions.
- [ ] `mount_widget` is declared on `layout_cells` only and carries only the origin cell; selecting the modal button of the widget in cell `<c>` mounts the modal extension `modal_<c>` in `modal_panel` and sends it the widget instance that cell `<c>` received, and the Viewer host makes no request (blocked by section 6.11).
- [ ] Opening a widget's larger view makes no request from the Viewer host; any data request made for the larger view is the widget's own, sent through the FrontX API package, and what the larger view shows is left to each widget.
- [ ] When no widget entry realizes the kind of a cell's widget, neither extension is created for that cell, the Viewer host shows that cell's cannot-show state with a diagnostic and no Retry, and the other cells are unaffected.
- [ ] When more than one widget entry realizes the kind of a cell's widget, that is a configuration error: neither extension is created for that cell, the Viewer host shows that cell's cannot-show state with a diagnostic and no Retry, and the other cells are unaffected.
- [ ] When the FrontX registry rejects the registration of an extension of a cell, no extension of that cell stays registered, the Viewer host shows that cell's cannot-show state with a diagnostic and no Retry, and the other cells are unaffected.
- [ ] When the modal extension of the origin cell's widget is not registered, a `mount_widget` opens no modal and the dashboard is unchanged.
- [ ] When the layout has zero cells, dashboard resolve registers no widget extension and returns an empty result.
- [ ] When the container's mount fails, no modal appears and the dashboard is unchanged.
- [ ] When the `origin` of a `mount_widget` resolves to no cell, it is ignored with a diagnostic and nothing is opened or changed.
- [ ] When a `mount_widget` arrives while a widget is already in the modal, the current occupant is unmounted first, so the modal holds at most one widget.
- [ ] Closing the modal unmounts the container, which unmounts its occupant.
- [ ] When a step after the container's mount fails, the container is unmounted, no modal remains, the dashboard stays usable, and the next modal button selection opens the modal again.
- [ ] No host action carries widget data; neither domain declares a data-delivery action.
- [ ] When a widget's data request fails, that cell shows its error with Retry and the other cells render; Retry repeats that widget's request only.
- [ ] When a widget's response fails validation against the widget data type its kind names in the `data_type` trait, or fails a kind-specific check such as the grid column-key check (`feature-widget-catalog` section 6.5), that cell shows an error state with a diagnostic, renders nothing of the response, and offers no Retry; the other cells render.
- [ ] Every widget's modal extension is registered when the dashboard resolves; opening, closing, and reopening the modal registers nothing and logs no collision diagnostic in any registry (blocked by section 6.11).
- [ ] After the dashboard viewer selects the larger-view control of cell `<c>`, the widget's modal extension `modal_<c>` is mounted in `modal_panel` with the same entry and the same widget instance as the cell, and opening registers nothing (blocked by section 6.11).
- [ ] Dashboard teardown unregisters every cell extension and every modal extension that dashboard resolve created.
- [ ] Widgets in both template domains, including the widget in the modal, receive the template theme payload with `theme_id`, `mode`, and `palette` through the theme shared property only, and no other shared property; a host theme change reaches the open modal without any action from the Viewer host.
- [ ] Widget extension identifiers follow section 6.9.
- [ ] The modal container extension carries only `id`, `domain`, and `entry`.
