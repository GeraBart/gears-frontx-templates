---
status: accepted
version: 1
date: 2026-10-27
description: Domain model of the template action set_widget_context, the layout_cells extension domain with its extension type, and the cell extension identifier rule, declared by dashboard-viewer, with how the Viewer host creates, registers, mounts, and configures one cell extension per widget from the winning widget realization.
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
  - [Create Cell Extensions at Dashboard Resolve](#create-cell-extensions-at-dashboard-resolve)
- [4. States (CDSL)](#4-states-cdsl)
  - [Domain-Model Feature: No State Machines](#domain-model-feature-no-state-machines)
- [5. Definitions of Done](#5-definitions-of-done)
  - [Domain Model Definition of Done](#domain-model-definition-of-done)
  - [Cell Extension Creation](#cell-extension-creation)
  - [Widget Context and Larger-View Chain](#widget-context-and-larger-view-chain)
- [6. Domain Model](#6-domain-model)
  - [6.1 Template Action: set_widget_context](#61-template-action-set_widget_context)
  - [6.2 Layout Cells Extension Domain](#62-layout-cells-extension-domain)
  - [6.3 Layout Cells Extension Type](#63-layout-cells-extension-type)
  - [6.4 Cell Extension Identifier Rule](#64-cell-extension-identifier-rule)
  - [6.5 Action Chain Summary](#65-action-chain-summary)
- [7. Acceptance Criteria](#7-acceptance-criteria)

<!-- /toc -->

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-featstatus-extension-domain-catalog`
## 1. Feature Context

- [ ] `p2` - `cpt-frontx-dashboard-feature-extension-domain-catalog`

### 1.1 Overview

This is a **domain-model feature**: it declares the template's one action, `set_widget_context`, and the template's one extension domain, `layout_cells`, with its extension type and the identifier rule of its cell extensions. It also specifies how the Viewer host creates one cell extension for each widget when it resolves a dashboard, from the winning widget realization of the widget's type. Their abstract bases and structural prose live in DESIGN section 3.1 and section 3.3. The actor-flow and state sections of the FEATURE template are reduced to short not-applicable notes. Section 3 holds the creation process, and the types live in section 6 Domain Model.

### 1.2 Purpose

Concrete types and instances of the "template action and domain" part of DESIGN section 3.1. Every identifier builds on the FrontX MFE base types (`gts.frontx.mfes.*`) and uses the template's `frontx` vendor namespaces (`gts.frontx.v.*`, `gts.frontx.m.*`), with every template segment at `v1`. DESIGN section 3.1 delegates the field-level schemas of these types to this document, so section 6 carries them. The action is a template-authored type derived from the FrontX action base `gts.frontx.mfes.comm.action.v1~`; it adds no new GTS namespace.

The types follow the DESIGN and ADR-0007:

- One template extension domain, `layout_cells`. The Viewer host implements it in its own registry with the Concurrent mount strategy. Theme and language are its shared properties, and the Viewer host forwards both unchanged from its host.
- One template action, `set_widget_context`, and no other. It gives a widget its context: the widget instance, the widget data endpoint, and, for a cell widget, the `modal` target and subject that open the widget's larger view. There is no navigation, filter, or drill-down action, and no action carries widget data.
- Each widget requests its own data with the `source` of its widget instance through the FrontX API package (feature-backend-contract section 6.2), once when it receives its context.
- The Viewer host creates every cell extension when it resolves the dashboard (section 3). For each cell it reads the widget type from the widget's `id`, picks the single highest-weight widget realization for that type, generates the cell extension with `entry` from that realization, registers it only in its own registry, mounts it, and sends it `set_widget_context`.
- The larger view is a static extension of the host modal domain, one per widget type, declared and registered outside this feature (feature-mfe-entries). A cell widget opens it with its own actions chain, built from the `modal` field that this feature defines. The Viewer host registers nothing and sends nothing when a larger view opens.

**Declaring package**: `dashboard-viewer` (`src-app/mfe_packages/dashboard-viewer/`). Every type and instance of this feature is registered through the `mfe.json` of that package.

**Requirements**: `cpt-frontx-dashboard-fr-domain-model`, `cpt-frontx-dashboard-fr-viewer-host`, `cpt-frontx-dashboard-fr-widget-modal`, `cpt-frontx-dashboard-fr-theme`, `cpt-frontx-dashboard-fr-loading-error-states`, `cpt-frontx-dashboard-fr-replacement-widget`

**Principles**: `cpt-frontx-dashboard-principle-own-registry-registration`, `cpt-frontx-dashboard-principle-viewer-host-orchestration`, `cpt-frontx-dashboard-principle-gts-contracts`, `cpt-frontx-dashboard-principle-per-instance-isolation`

**Constraints**: `cpt-frontx-dashboard-constraint-gts-id-convention`, `cpt-frontx-dashboard-constraint-role-based-host-ids`, `cpt-frontx-dashboard-constraint-one-viewer-per-tree`

### 1.3 Actors

N/A. This is a domain-model feature. Its types are consumed by the runtime: the Viewer host registry, the shell registry to which a cell widget's chain escalates, and the widget MFEs. Its process runs inside the Viewer host, not by an end-user actor, so no actor flows are authored. The actors of the viewing use case are defined in the PRD and appear in the DESIGN sequences listed in section 2.

### 1.4 References

- **PRD**: [PRD.md](../../PRD.md)
- **Design**: [DESIGN.md](../../DESIGN.md) section 2.1 (Each Nested Host Registers Only in Its Own Registry), section 3.1 (Domain Model), section 3.2 (Viewer Host), section 3.3 (Widget Realization, Host Actions, Template Extension Domains), section 3.5 (Host contract), section 3.6 (Interactions and Sequences), section 4 (handoffs and open questions)
- **ADRs**: [ADR-0006](../../ADR/0006-theme-distribution-v1.md), [ADR-0007](../../ADR/0007-extension-domain-taxonomy-v1.md), [ADR-0008](../../ADR/0008-widget-type-and-mfe-realization-v1.md), [ADR-0010](../../ADR/0010-template-packages-and-host-contract-v1.md), [ADR-0011](../../ADR/0011-backend-delivered-dashboard-v1.md)
- **Design elements**: `cpt-frontx-dashboard-interface-host-actions`, `cpt-frontx-dashboard-interface-template-domains`, `cpt-frontx-dashboard-interface-widget-realization` (shared: the realization precedence used when the cell extensions are created), `cpt-frontx-dashboard-contract-host-areas` (the host modal domain by role, as `modal.target`), `cpt-frontx-dashboard-interface-domain-model` (action and domain part), `cpt-frontx-dashboard-component-viewer-host` (shared: the creation of the cell extensions at dashboard resolve)
- **Dependencies**: [feature-widget-catalog](../feature-widget-catalog/FEATURE.md) (the widget base carried in the `widget` field of `set_widget_context`, and the shared chrome whose larger-view button runs the cell widget's chain)
- **Related**:
  - [feature-mfe-entries](../feature-mfe-entries/FEATURE.md): the widget realization type and its instances, the cell entries mounted into `layout_cells`, and the modal entries and static modal extensions of the host modal domain. This feature uses them by identifier at run time; it is not a build-order dependency.
  - [feature-layout-types](../feature-layout-types/FEATURE.md): the ordered `cells` whose zero-based index the identifier rule uses, and the layout checks that run before extension creation (section 6.3 there).
  - [feature-backend-contract](../feature-backend-contract/FEATURE.md): the dashboard request and its checks (section 6.1), the widget data request that each widget sends with its `source` to the endpoint it receives in `data_endpoint` (section 6.2), and the failure classes and wording of every state (section 6.3).

## 2. Actor Flows (CDSL)

**Use cases**: `cpt-frontx-dashboard-usecase-view-dashboard`

### Domain-Model Feature: No Actor Flows

Not applicable because this feature declares static GTS types and instances that the runtime consumes, and the extension creation process of section 3 runs inside the Viewer host; no actor interacts with the types themselves. The runtime flows that use these types are the DESIGN sequences `cpt-frontx-dashboard-seq-initial-load`, `cpt-frontx-dashboard-seq-widget-modal-open`, `cpt-frontx-dashboard-seq-failure-handling`, `cpt-frontx-dashboard-seq-theme-switch`, and `cpt-frontx-dashboard-seq-teardown`. Section 6.5 summarizes the action chains by reference to them.

## 3. Processes / Business Logic (CDSL)

The Viewer host creates the cell extensions of `layout_cells` from the widgets of the resolved dashboard and the widget realizations in its registry. Validation and admission of the types and extensions are performed by the FrontX type system and registries (FrontX ADR-0009, ADR-0010); the step-by-step chains are the DESIGN sequences named in section 2.

### Create Cell Extensions at Dashboard Resolve

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-algo-extension-domain-catalog-create-widget-extensions`

**Input**:
- The resolved dashboard, after it and its embedded widget instances have passed validation and the layout and grid configuration checks have passed (DESIGN `cpt-frontx-dashboard-seq-initial-load`, step 4): the ordered `cells` of its layout, each embedding one widget instance.
- The widget realizations and cell entries that the Viewer host has registered in its own registry from the manifest channel. A realization that the registry rejected is not among them.
- The `layout_cells` domain, registered in the Viewer host's own registry during its first mount.
- The host modal domain identifier, resolved from the shell constant (`cpt-frontx-dashboard-constraint-role-based-host-ids`), and the widget data endpoint, read from the consuming product's configuration.

**Output**: For every cell whose widget type has a single winning realization, one cell extension that is registered in the Viewer host's own registry, mounted in that cell, and configured with `set_widget_context`. For every other cell, its cannot-show state with a diagnostic and no Retry; the other cells are unaffected. Until a cell's widget is mounted, the cell shows the Viewer host's cell skeleton. For a layout with zero cells, an empty result.

**Steps**:
1. [ ] - `p1` - **IF** the layout has zero cells - `inst-if-no-cells`
   1. [ ] - `p1` - Register nothing and **RETURN** an empty result - `inst-return-empty`
2. [ ] - `p1` - **FOR EACH** cell of the layout's ordered `cells`, with its zero-based index `<c>` - `inst-for-each-cell`
   1. [ ] - `p1` - Take the widget type: the rightmost type of the embedded widget instance's `id` chain, for example `gts.frontx.m.widget.widget.v1~frontx.m.widget.grid.v1~` - `inst-take-widget-type`
   2. [ ] - `p1` - Collect the widget realizations registered in the Viewer host's registry whose `widget_type` names that widget type (realization precedence, DESIGN `cpt-frontx-dashboard-interface-widget-realization`) - `inst-collect-realizations`
   3. [ ] - `p1` - **IF** no realization names the widget type - `inst-if-no-realization`
      1. [ ] - `p1` - Create no extension for this cell; the cell shows its cannot-show state with a diagnostic that names the widget type, with no Retry; the other cells are unaffected, and the loop continues - `inst-skip-cell-no-realization`
   4. [ ] - `p1` - **IF** two or more realizations share the highest `weight` - `inst-if-weight-tie`
      1. [ ] - `p1` - Create no extension for this cell; the cell shows its cannot-show state with a diagnostic that names the widget type, and the tied realizations, with no Retry; the other cells are unaffected, and the loop continues - `inst-skip-cell-weight-tie`
   5. [ ] - `p1` - Take the single realization with the highest `weight` as the winner; a realization without `weight` counts as weight 1, so a replacement realization with a higher weight wins over the template's realization, which stays registered but unused - `inst-pick-winning-realization`
   6. [ ] - `p1` - Generate the cell extension: an instance of the layout cells extension type (section 6.3) with the identifier `gts.frontx.mfes.ext.extension.v1~frontx.v.layout.layout_cells.v1~frontx.v.layout.cell_<c>.v1` (section 6.4), `domain` set to the `layout_cells` instance, and `entry` set to the winning realization's `entry` - `inst-generate-cell-extension`
   7. [ ] - `p1` - Register the cell extension with `registerExtension` in the Viewer host's own registry, which holds `layout_cells`, and in no other registry: FrontX admits an extension only through the registry that holds its domain, and a child cannot register into its host's registry (FrontX ADR-0008; `cpt-frontx-dashboard-principle-own-registry-registration`) - `inst-register-cell-extension`
   8. [ ] - `p1` - **IF** the registry rejects the registration - `inst-if-registration-rejected`
      1. [ ] - `p1` - The cell shows its cannot-show state with a diagnostic and no Retry; the other cells are unaffected, and the loop continues - `inst-skip-cell-registration-rejected`
   9. [ ] - `p1` - Run `mount_ext` of the cell extension on `layout_cells`; FrontX loads the module, the Concurrent strategy creates a container, and the domain's mounter places it in cell `<c>` - `inst-mount-cell-extension`
   10. [ ] - `p1` - **IF** `mount_ext` fails, for example because the widget bundle does not load - `inst-if-mount-fails`
      1. [ ] - `p1` - The cell shows its cannot-show state with a diagnostic and no Retry; `mount_ext` is never retried; the other cells are unaffected, and the loop continues - `inst-skip-cell-mount-fails`
   11. [ ] - `p1` - Send `set_widget_context` (section 6.1) to the cell extension with `widget` set to the embedded widget instance, `data_endpoint` set to the widget data endpoint, and `modal` set to `target`, the host modal domain identifier, and `subject`, the winning realization's `modal_extension` - `inst-send-widget-context`
   12. [ ] - `p1` - **IF** `set_widget_context` fails - `inst-if-context-fails`
      1. [ ] - `p1` - The cell shows its cannot-show state with a diagnostic and no Retry; the other cells are unaffected, and the loop continues - `inst-skip-cell-context-fails`
3. [ ] - `p1` - **RETURN** the registered cell extensions; the Viewer host registers no further extension while the dashboard is open, and teardown unmounts every cell and unregisters every cell extension (DESIGN `cpt-frontx-dashboard-seq-teardown`) - `inst-return-extensions`

A skipped cell leaves its index unused, so the identifiers of the other cells keep their positions. After step 11 the widget shows its own skeleton and requests its own data; that request and its failures belong to the widget (section 6.5).

## 4. States (CDSL)

### Domain-Model Feature: No State Machines

Not applicable because type declarations are stateless. Extension lifecycle stages are FrontX stages declared on the domain in section 6.2. The per-cell outcomes of section 3 are results of one pass at dashboard resolve, not states that change later. The Viewer host keeps no state for the larger view: the host modal domain owns its single occupant.

## 5. Definitions of Done

### Domain Model Definition of Done

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-dod-extension-domain-catalog-catalog-complete`

The system **MUST** register the action type, the extension type, and the domain instance of section 6 through the `dashboard-viewer` `mfe.json`, with the identifiers of section 6, and **MUST** generate cell extension identifiers by the rule of section 6.4.

- `set_widget_context` validates against the FrontX action base. Its payload requires `widget` and `data_endpoint`, allows `modal` with the required fields `target` and `subject`, and allows no other field.
- No action carries widget data, and the template declares no action besides `set_widget_context`.
- Every identifier follows `cpt-frontx-dashboard-constraint-gts-id-convention`: types end with `~`, instances do not, every template segment starts at `v1`, and no field uses `x-gts-ref`.
- `layout_cells` is admitted with the Concurrent mount strategy and passes the FrontX ADR-0009 cardinality matrix. It declares the lifecycle actions `load_ext`, `mount_ext`, and `unmount_ext`, the extension action `set_widget_context`, the lifecycle stages of section 6.2, and a default action timeout of 30 000 ms.
- Theme and language are the only shared properties of `layout_cells`. The Viewer host publishes each with the value it reads from its own host bridge, unchanged: the theme value is the host theme id. `data_endpoint` is not a shared property.
- The layout cells extension type adds no fields beyond the FrontX extension base and fixes `domain` to the `layout_cells` instance.

**Covers (PRD)**: `cpt-frontx-dashboard-fr-domain-model`, `cpt-frontx-dashboard-fr-theme`, `cpt-frontx-dashboard-interface-domain-model`

**Covers (DESIGN)**: `cpt-frontx-dashboard-interface-host-actions`, `cpt-frontx-dashboard-interface-template-domains`, `cpt-frontx-dashboard-seq-theme-switch`, `cpt-frontx-dashboard-principle-gts-contracts`, `cpt-frontx-dashboard-principle-per-instance-isolation`

**Constraints**: `cpt-frontx-dashboard-constraint-gts-id-convention`, `cpt-frontx-dashboard-constraint-one-viewer-per-tree`

**Touches**:
- Entities: template action, extension domain, extension type, cell extension identifiers

### Cell Extension Creation

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-dod-extension-domain-catalog-extension-creation`

The system **MUST** create, when the Viewer host resolves the dashboard, one `layout_cells` extension for each cell whose widget type has a single winning widget realization, with `entry` from that realization, **MUST** register it only in the Viewer host's own registry, and **MUST** mount it and send it `set_widget_context`.

- The widget type is the rightmost type of the widget's `id` chain, and the winning realization is the single registered realization with the highest `weight` for that widget type. A replacement realization with a weight above 1 wins over the template's realization of weight 1.
- A cell whose widget type has no realization, or a tie at the highest weight, gets no extension and shows its cannot-show state with a diagnostic that names the widget type, and the tied realizations for a tie, and no Retry.
- A cell whose registration is rejected, or whose `mount_ext` or `set_widget_context` fails, shows its cannot-show state with a diagnostic and no Retry; `mount_ext` is never retried. The other cells are unaffected in every case.
- Cell extension identifiers follow section 6.4; a skipped cell leaves its index unused; a layout with zero cells registers nothing.
- The Viewer host registers nothing outside its own registry, and nothing after dashboard resolve.
- Teardown runs `unmount_ext` of every cell and unregisters every cell extension that dashboard resolve registered.

**Implements**:
- `cpt-frontx-dashboard-algo-extension-domain-catalog-create-widget-extensions`

**Covers (PRD)**: `cpt-frontx-dashboard-fr-viewer-host`, `cpt-frontx-dashboard-fr-replacement-widget`, `cpt-frontx-dashboard-fr-loading-error-states`

**Covers (DESIGN)**: `cpt-frontx-dashboard-component-viewer-host`, `cpt-frontx-dashboard-interface-widget-realization`, `cpt-frontx-dashboard-principle-own-registry-registration`, `cpt-frontx-dashboard-principle-viewer-host-orchestration`, `cpt-frontx-dashboard-interface-template-domains`, `cpt-frontx-dashboard-seq-initial-load`, `cpt-frontx-dashboard-seq-failure-handling`, `cpt-frontx-dashboard-seq-teardown`

**Constraints**: `cpt-frontx-dashboard-constraint-gts-id-convention`, `cpt-frontx-dashboard-constraint-one-viewer-per-tree`

**Touches**:
- Entities: cell extensions, widget realizations, cell entries

### Widget Context and Larger-View Chain

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-dod-extension-domain-catalog-widget-context`

The system **MUST** send every mounted cell widget `set_widget_context` with `modal`, whose `target` is the host modal domain identifier and whose `subject` is the winning realization's `modal_extension`, so that the cell widget's own chain opens its larger view in the host modal domain without the Viewer host.

- `modal` is present in the context of every cell widget and absent in the context that the cell widget's chain sends to its static modal extension.
- The host modal domain identifier in `modal.target` is resolved from the shell constant and is never written as a literal in code (`cpt-frontx-dashboard-constraint-role-based-host-ids`).
- The modal widget receives the same `widget` and `data_endpoint` as the cell.
- When a larger view opens, the Viewer host registers nothing, receives no action, and makes no request; no registry registers anything.
- On a host without the rendered modal-domain slot, the chain fails at `mount_ext`, no larger view appears, and the cell and the dashboard are unchanged.
- The Viewer host sends nothing to the host modal domain, also on teardown.

**Implements**:
- `cpt-frontx-dashboard-algo-extension-domain-catalog-create-widget-extensions`

**Covers (PRD)**: `cpt-frontx-dashboard-fr-widget-modal`, `cpt-frontx-dashboard-contract-host-areas`

**Covers (DESIGN)**: `cpt-frontx-dashboard-interface-host-actions`, `cpt-frontx-dashboard-seq-widget-modal-open`, `cpt-frontx-dashboard-principle-own-registry-registration`

**Constraints**: `cpt-frontx-dashboard-constraint-role-based-host-ids`

**Touches**:
- Entities: template action, cell extensions, host modal domain identifier

## 6. Domain Model

All lifecycle actions referenced below are the FrontX actions `gts.frontx.mfes.comm.action.v1~frontx.mfes.ext.load_ext.v1~`, `gts.frontx.mfes.comm.action.v1~frontx.mfes.ext.mount_ext.v1~`, and `gts.frontx.mfes.comm.action.v1~frontx.mfes.ext.unmount_ext.v1~`; code takes them from the FrontX constants. Every action is a type derived from the FrontX action base `gts.frontx.mfes.comm.action.v1~`. A chain carries an action, an optional `next`, and an optional `fallback`; nothing comes back to the sender, and an action that the sender's registry cannot resolve escalates to its ancestors (FrontX ADR-0007).

### 6.1 Template Action: set_widget_context

**GTS ID**: `gts.frontx.mfes.comm.action.v1~frontx.v.mfe.set_widget_context.v1~`

**Description**: Gives a mounted widget extension its context. It has two senders:

- The Viewer host sends it to every mounted cell extension, with `widget`, `data_endpoint`, and `modal` (section 3, step 11).
- A cell widget's larger-view chain sends it to the widget's static modal extension in the host modal domain, with the same `widget` and `data_endpoint` and without `modal` (section 6.5).

The widget stores the context as its configuration and then requests its own data with the `source` of `widget`, sent to `data_endpoint` through the FrontX API package (feature-backend-contract section 6.2). A widget whose context carries `modal` shows the larger-view button in its chrome (feature-widget-catalog section 6.10); a widget whose context has no `modal` shows none, so a widget in the larger view cannot open another. `set_widget_context` is the extension action of `layout_cells` (section 6.2).

**Schema**:

```json
{
  "$id": "gts://gts.frontx.mfes.comm.action.v1~frontx.v.mfe.set_widget_context.v1~",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "set_widget_context",
  "description": "Template action that gives a mounted cell or modal widget extension its widget instance, the widget data endpoint, and, for a cell widget, the target and subject of its larger view.",
  "allOf": [
    { "$ref": "gts://gts.frontx.mfes.comm.action.v1~" },
    {
      "required": ["payload"],
      "properties": {
        "target": {
          "type": "string",
          "x-gts-instance-ref": "gts.frontx.mfes.ext.extension.v1~",
          "description": "Narrows the inherited target to a mounted extension: a cell extension of layout_cells or a static modal extension of the host modal domain."
        },
        "payload": {
          "type": "object",
          "required": ["widget", "data_endpoint"],
          "additionalProperties": false,
          "properties": {
            "widget": {
              "$ref": "gts://gts.frontx.m.widget.widget.v1~",
              "description": "The widget instance, carried inline as it appears in its layout cell of the dashboard: id, title, source, and the presentation configuration of its widget type."
            },
            "data_endpoint": {
              "type": "string",
              "minLength": 1,
              "description": "The widget data endpoint from the consuming product's configuration. It travels only in this action and is not a shared property."
            },
            "modal": {
              "type": "object",
              "required": ["target", "subject"],
              "additionalProperties": false,
              "description": "Present for every cell widget and absent for a modal widget. The field names are those of the FrontX mount_ext action, so the cell widget's chain uses them as they arrive.",
              "properties": {
                "target": {
                  "type": "string",
                  "x-gts-instance-ref": "gts.frontx.mfes.ext.domain.v1~",
                  "description": "The host modal domain identifier, resolved from the shell constant."
                },
                "subject": {
                  "type": "string",
                  "x-gts-instance-ref": "gts.frontx.mfes.ext.extension.v1~",
                  "description": "The static modal extension named by the winning widget realization's modal_extension."
                }
              }
            }
          }
        }
      }
    }
  ]
}
```

**Inheritance notes**:
- `type` and `target` are inherited and already required by the base; this schema adds `payload` to `required` and narrows `target` to an extension.
- `widget` carries the widget instance itself, not an instance identifier, because the dashboard carries widget instances inline in its layout cells (DESIGN section 3.1). The receiving widget validates it at its own boundary.
- The schema allows `modal` in both uses; the sender decides. The Viewer host always sets it, and the cell widget's chain always leaves it out.
- No field carries widget data, theme, or language. Theme and language reach the widget only as shared properties (section 6.2).

**Cross-references**: DESIGN `cpt-frontx-dashboard-interface-host-actions`, `cpt-frontx-dashboard-seq-initial-load`, `cpt-frontx-dashboard-seq-widget-modal-open`; widget base in feature-widget-catalog section 6.0; realization `modal_extension` and static modal extensions in feature-mfe-entries; declared on the domain in section 6.2.

### 6.2 Layout Cells Extension Domain

**GTS instance ID**: `gts.frontx.mfes.ext.domain.v1~frontx.v.layout.layout_cells.v1`

**Description**: Multi-instance widget canvas, implemented by the Viewer host. The Viewer host is a nested host: it builds its own registry synchronously inside its first mount and registers this domain there (FrontX ADR-0008), so the registry adopts the inbound bridge and advertises the domain to the shell. The domain is an instance of the FrontX domain base; the template adds no domain type. Each cell holds one occupant, the cell extension that the Viewer host creates for that cell's widget when it resolves the dashboard (section 3). Cells are unmounted only on dashboard teardown. One Viewer host per application tree (`cpt-frontx-dashboard-constraint-one-viewer-per-tree`) keeps this fixed identifier unique under the tree-global collision guard (FrontX ADR-0007).

| Property | Value |
|----------|-------|
| Implemented by | Viewer host, in its own registry |
| Mount strategy | Concurrent (FrontX ADR-0009, given at registration) |
| Domain actions | `load_ext`, `mount_ext`, `unmount_ext` |
| Extension actions | `set_widget_context` |
| Shared properties | theme and language, forwarded unchanged from the host |
| Extension type | `gts.frontx.mfes.ext.extension.v1~frontx.v.layout.layout_cells.v1~` (section 6.3) |
| Extensions registered | one per cell whose widget type has a single winning realization, at dashboard resolve, by the Viewer host |
| Occupancy | one occupant per cell; `unmount_ext` only on dashboard teardown |
| Domain lifecycle stages | `init` |
| Extension lifecycle stages | `init`, `activated`, `deactivated`, `destroyed` |
| Default action timeout | 30 000 ms |

**Instance**:

```json
{
  "id": "gts.frontx.mfes.ext.domain.v1~frontx.v.layout.layout_cells.v1",
  "sharedProperties": [
    "gts.frontx.mfes.comm.shared_property.v1~frontx.mfes.comm.theme.v1~",
    "gts.frontx.mfes.comm.shared_property.v1~frontx.mfes.comm.language.v1~"
  ],
  "actions": [
    "gts.frontx.mfes.comm.action.v1~frontx.mfes.ext.load_ext.v1~",
    "gts.frontx.mfes.comm.action.v1~frontx.mfes.ext.mount_ext.v1~",
    "gts.frontx.mfes.comm.action.v1~frontx.mfes.ext.unmount_ext.v1~"
  ],
  "extensionsActions": [
    "gts.frontx.mfes.comm.action.v1~frontx.v.mfe.set_widget_context.v1~"
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

**Declaration notes**:
- `actions`: the lifecycle actions only. `unmount_ext` is declared because the Concurrent strategy requires both a mount and an unmount action (FrontX ADR-0009 cardinality matrix); its only use is dashboard teardown.
- `extensionsActions`: `set_widget_context` only. A cell entry supports it, so the entry is admitted by the subset rule (FrontX ADR-0010).
- `sharedProperties`: theme (`gts.frontx.mfes.comm.shared_property.v1~frontx.mfes.comm.theme.v1~`) and language (`gts.frontx.mfes.comm.shared_property.v1~frontx.mfes.comm.language.v1~`). The Viewer host reads both from its own host bridge and publishes them on this domain unchanged: the theme value is the host theme id, and the language value is the host language. Each widget maps the host theme id to the light or dark scope of `@gears-frontx/ui-kit` itself (feature-widget-catalog section 6.10; ADR-0006). The template publishes no theme payload of its own.
- `lifecycleStages`: only `init`, because the domain lives as long as the Viewer host's registry. `extensionsLifecycleStages` include `destroyed`, because cells are unmounted on dashboard teardown.
- `defaultActionTimeout`: 30 000 ms, used by every action on this domain that sets no timeout of its own.

**Cross-references**: extension type section 6.3; extension creation section 3; chains section 6.5; DESIGN `cpt-frontx-dashboard-interface-template-domains`, `cpt-frontx-dashboard-component-viewer-host`.

### 6.3 Layout Cells Extension Type

**GTS ID**: `gts.frontx.mfes.ext.extension.v1~frontx.v.layout.layout_cells.v1~`

**Description**: Extension type of the cells in `layout_cells`. Adds no fields beyond the FrontX extension base. The Viewer host generates one extension of this type per cell whose widget type has a single winning realization when it resolves the dashboard (section 3), with `entry` taken from that realization. Entries mounted with it support `set_widget_context`, as the domain requires.

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
          "description": "Identifier of the concrete cell extension, generated from the zero-based cell index (section 6.4)."
        },
        "domain": {
          "type": "string",
          "const": "gts.frontx.mfes.ext.domain.v1~frontx.v.layout.layout_cells.v1",
          "description": "Domain instance this extension mounts into."
        },
        "entry": {
          "type": "string",
          "x-gts-instance-ref": "gts.frontx.mfes.mfe.entry.v1~frontx.mfes.mfe.entry_mf.v1~",
          "description": "Cell entry to load: the entry of the winning widget realization for the cell widget's type."
        }
      }
    }
  ]
}
```

**Declaration notes**: the `domain` constant uses the instance form without a trailing `~` (`cpt-frontx-dashboard-constraint-gts-id-convention`). `entry` is narrowed to the FrontX Module Federation entry type, because every widget entry is a plain instance of it and the widget realization constrains its `entry` the same way (feature-mfe-entries). There is no per-subtype incoming-action list.

**Cross-references**: domain section 6.2; extension creation section 3; identifier rule section 6.4; realizations and entries in feature-mfe-entries; ADR-0008.

### 6.4 Cell Extension Identifier Rule

**Description**: The Viewer host generates cell extension identifiers deterministically from the cell index, under the template's `frontx.v.layout` namespace (DESIGN section 3.3, Identifier uniqueness). Each identifier is an instance of the layout cells extension type.

| Surface | Registered by | Identifier form |
|---------|---------------|-----------------|
| `layout_cells` | Viewer host, in its own registry, at dashboard resolve | `gts.frontx.mfes.ext.extension.v1~frontx.v.layout.layout_cells.v1~frontx.v.layout.cell_<c>.v1` |

- `<c>` is the zero-based index of the cell in the layout's ordered `cells`, the same index that the layout check diagnostics use (feature-layout-types section 6.3). Each cell hosts exactly one widget, so `<c>` names that widget's cell extension, for example `gts.frontx.mfes.ext.extension.v1~frontx.v.layout.layout_cells.v1~frontx.v.layout.cell_2.v1` for the third cell.
- A cell without an extension leaves its index unused; the identifiers of the other cells keep their positions.
- The static modal extensions of the host modal domain have fixed identifiers, one per widget type, registered once in the shell's registry (feature-mfe-entries). They are instances of a different type in a different namespace, so the two sets are disjoint and no advertisement trips the tree-global collision guard (FrontX ADR-0007).
- The identifiers are registered once, when the dashboard resolves, and unregistered on teardown; opening and closing a larger view registers and unregisters nothing.
- The rule itself is TypeScript-internal (DESIGN section 3.3, API Stability Classification); the identifiers it produces are not persisted.

**Cross-references**: `cpt-frontx-dashboard-interface-template-domains`; `cpt-frontx-dashboard-principle-own-registry-registration`; `cpt-frontx-dashboard-constraint-one-viewer-per-tree`; extension creation section 3.

### 6.5 Action Chain Summary

**Description**: Summary of the chains and outcomes that use these types. The authoritative step lists are the DESIGN sequences named in each row; this table is for orientation only. Per-widget context flows only through `set_widget_context`; each widget requests its own data through the FrontX API package; theme and language flow only through shared properties.

| Chain or outcome | Trigger | Steps, in order | DESIGN sequence |
|------------------|---------|-----------------|-----------------|
| Cell mount | Dashboard resolved after validation and the layout and grid configuration checks | per cell (section 3): widget type from the `id`, winning realization, cell extension generated with the realization's `entry`, `registerExtension` in the Viewer host's own registry, `mount_ext` on `layout_cells`, `set_widget_context` with `widget`, `data_endpoint`, and `modal` | `cpt-frontx-dashboard-seq-initial-load` |
| Widget data load | A cell widget receives its context | no chain; the widget shows its own skeleton, sends its widget data request once with its `source` to `data_endpoint` through the FrontX API package (feature-backend-contract section 6.2), validates the result against the widget data type, checks its bound columns, and presents the rows unchanged or its empty state | `cpt-frontx-dashboard-seq-initial-load` |
| Dashboard-level failure | The Viewer host cannot start, the dashboard request fails, or the dashboard cannot be shown | no chain; no cell extension is generated; the dashboard area shows the outcome of feature-backend-contract section 6.3 | `cpt-frontx-dashboard-seq-failure-handling` |
| Cell without a single winning realization | No realization names the cell widget's type, or two or more share the highest weight | no chain; no extension for the cell; every cell of that widget type shows its cannot-show state with a diagnostic that names the widget type, and the tied realizations for a tie, and no Retry; the other cells are unaffected | `cpt-frontx-dashboard-seq-failure-handling` |
| Cell whose widget fails to register, load, or mount | The registry rejects the cell extension, or its `mount_ext` or `set_widget_context` fails | no further step for that cell; the cell shows its cannot-show state with a diagnostic and no Retry; `mount_ext` is never retried; before the mount the cell shows the Viewer host's cell skeleton; the other cells are unaffected | `cpt-frontx-dashboard-seq-failure-handling` |
| Widget data failure | A cell widget's data request fails or its data cannot be shown | no chain; only that cell shows the outcome: an error with Retry for a temporary failure, or the cannot-show state without Retry for a permanent one, by the failure classes of feature-backend-contract section 6.3; Retry repeats that widget's request only | `cpt-frontx-dashboard-seq-failure-handling` |
| Larger view open | The dashboard viewer selects the larger-view button in a cell widget's chrome | the cell widget's own chain through its bridge: `mount_ext` with `target` = `modal.target` and `subject` = `modal.subject`, then as `next` `set_widget_context` to `modal.subject` with the same `widget` and `data_endpoint` and no `modal`, with the fallback `unmount_ext` of that extension; the Viewer host's registry has no handler for the host modal domain, so the chain escalates to the shell (FrontX ADR-0007); the static modal extension is already registered, so the Viewer host registers nothing, receives no action, and makes no request; the host modal domain's Optional strategy owns its single occupant, and when the extension is already mounted the mount completes at once and the new context replaces the widget it shows; the modal widget sends the same widget data request as the cell; on a host without the rendered modal-domain slot the chain fails at `mount_ext` and no larger view appears; a chain reports nothing back, so a failed opening leaves the cell and the dashboard unchanged and the next selection starts a new opening | `cpt-frontx-dashboard-seq-widget-modal-open` |
| Larger view close | Close or host dismissal | the shell's `unmount_ext` of the occupant; the modal widget aborts its in-flight requests when the FrontX API package accepts an abort signal and ignores late responses; the dashboard is unchanged | `cpt-frontx-dashboard-seq-widget-modal-open` |
| Theme or language switch | The host changes its theme or language shared property | shared-property change only: the Viewer host publishes the same value unchanged on `layout_cells`, and the host modal domain gives it to an open larger view directly; no action is sent and nothing is requested | `cpt-frontx-dashboard-seq-theme-switch` |
| Teardown | Route change or unmount of the Viewer host | the Viewer host aborts its own in-flight dashboard request when the FrontX API package accepts an abort signal; `unmount_ext` of every cell, in whose unmount each widget aborts its in-flight requests in the same way and ignores late responses; unregistration of every `layout_cells` extension; the loaded definition is discarded; nothing is sent to the host modal domain, so an open larger view stays until the shell closes it | `cpt-frontx-dashboard-seq-teardown` |

**Invariants**:
- A cell widget receives `set_widget_context` only after its `mount_ext` succeeds, and requests its data only after it has its context.
- The Viewer host registers only `layout_cells` extensions, only in its own registry, and only at dashboard resolve; no registry registers or unregisters anything when a larger view opens or closes.
- `data_endpoint` travels only in `set_widget_context`; theme and language are the only shared properties of `layout_cells`, and their values are the host's, unchanged.
- No action carries widget data.
- After the widgets show their data, nothing is requested except Retry after a failure and the larger view's own request, and no cell widget receives a new context.

## 7. Acceptance Criteria

- [ ] `cfs validate --artifact` reports no structural errors for this document.
- [ ] The action type, the extension type, and the domain instance of section 6 are registered through the `dashboard-viewer` `mfe.json` and validate against their FrontX bases; the template declares no other action, domain, or extension type.
- [ ] Every identifier of this feature follows the template identifier convention: types end with `~`, instances do not, every template segment is at `v1`, and no field uses `x-gts-ref`.
- [ ] `layout_cells` is admitted with the Concurrent strategy; registering it without `unmount_ext` is rejected; its only extension action is `set_widget_context`.
- [ ] Given a `set_widget_context` payload with `widget`, `data_endpoint`, and `modal` with `target` and `subject`, when it is validated, then it passes; without `modal` it passes; without `data_endpoint`, with `modal` missing `subject`, or with an extra payload field, it fails.
- [ ] Given a dashboard with 3 cells whose widgets are of the widget types `grid`, `pie_chart`, and `markdown_card`, and only the template's realizations, when the dashboard resolves, then exactly 3 extensions are registered in the Viewer host's registry with the identifiers ending in `cell_0`, `cell_1`, and `cell_2`, each with `entry` from the template realization of its widget type, and no extension is registered in any other registry.
- [ ] Given that dashboard, when its cells are mounted, then each cell widget receives `set_widget_context` with its own widget instance, the configured widget data endpoint as `data_endpoint`, and `modal` whose `target` is the host modal domain identifier from the shell constant and whose `subject` is the `modal_extension` of the realization that won for its widget type.
- [ ] Given the template's `grid` realization of weight 1 and a replacement `grid` realization of weight 2, when a dashboard with two `grid` cells and one `pie_chart` cell resolves, then both `grid` cell extensions take their `entry` from the replacement, their `modal.subject` is the replacement's `modal_extension`, and the `pie_chart` cell uses the template realization.
- [ ] Given two `grid` realizations of weight 2, when a dashboard with a `grid` cell and a `pie_chart` cell resolves, then no extension is created for the `grid` cell, it shows its cannot-show state with a diagnostic that names the widget type and both tied realizations, and no Retry, and the `pie_chart` cell mounts and shows its data.
- [ ] Given no registered realization for the `heatmap` widget type, when a dashboard with a `heatmap` cell resolves, then that cell shows its cannot-show state with a diagnostic naming the widget type and no Retry, and the other cells are unaffected.
- [ ] Given a cell extension whose registration the registry rejects, when the dashboard resolves, then that cell shows its cannot-show state with a diagnostic and no Retry, and the other cells are unaffected.
- [ ] Given a cell whose widget bundle does not load, when its `mount_ext` fails, then that cell shows its cannot-show state with a diagnostic and no Retry, `mount_ext` is not sent again for it, and the other cells are unaffected.
- [ ] Given a cell whose `set_widget_context` fails, when the Viewer host sends it, then that cell shows its cannot-show state with a diagnostic and no Retry, and the other cells are unaffected.
- [ ] Given a dashboard whose second cell gets no extension, when it resolves, then the other cells' extensions are `cell_0` and `cell_2`, and no extension has the index 1.
- [ ] Given a layout with zero cells, when the dashboard resolves, then no extension is registered and no cell is shown.
- [ ] Given a mounted `grid` widget in cell 2, when the dashboard viewer selects its larger-view button, then the chain runs `mount_ext` of `modal.subject` in the host modal domain and then `set_widget_context` to it with the same widget instance and `data_endpoint` and no `modal`; the Viewer host receives no action, makes no request, and no registry registers anything.
- [ ] Given an open larger view of one `grid` widget, when the dashboard viewer opens the larger view of another `grid` widget, then the host modal domain shows one larger view, now with the second widget's instance, and no registry registers anything or logs a collision diagnostic.
- [ ] Given a host without the rendered modal-domain slot, when the dashboard viewer selects a larger-view button, then no larger view appears and the cell and the dashboard are unchanged.
- [ ] Given a larger-view chain whose `set_widget_context` step fails, when it runs, then its fallback unmounts the static modal extension, no larger view remains, the dashboard is unchanged, and the next selection of the button starts a new opening.
- [ ] Given an open dashboard, when the host theme id changes, then `layout_cells` publishes the new host theme id unchanged, no action is sent to any cell widget, no request is made, and an open larger view receives the change from the host modal domain without any action from the Viewer host.
- [ ] Given an open dashboard, when the host language changes, then `layout_cells` publishes the new language unchanged, and no request is made.
- [ ] Given an open dashboard with a widget data request in flight, when the dashboard is torn down, then every cell is unmounted with `unmount_ext`, every cell extension is unregistered, the in-flight request is aborted when the FrontX API package accepts an abort signal and its late response is ignored in any case, and nothing is sent to the host modal domain.
- [ ] No action carries widget data, and `data_endpoint` is not a shared property of `layout_cells`.
- [ ] No TypeScript source of the Viewer host writes the host modal domain identifier as a literal; it is resolved from the shell constant.
