---
status: accepted
version: 1
date: 2026-10-31
description: "Feature: the widget contract — the widget base, data_widget, widget-data base, the entry and data_type traits, the render_widget action, the widgets domain extension type, the entry declaration, widget-author obligations, and shared-dependency and budget rules."
---

# Feature: Widget Contract

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-featstatus-widget-contract`

<!-- toc -->

- [1. Feature Context](#1-feature-context)
  - [1.1 Overview](#11-overview)
  - [1.2 Purpose](#12-purpose)
  - [1.3 Actors](#13-actors)
  - [1.4 References](#14-references)
- [2. Actor Flows (CDSL)](#2-actor-flows-cdsl)
  - [No actor flows](#no-actor-flows)
- [3. Processes / Business Logic (CDSL)](#3-processes--business-logic-cdsl)
  - [Resolve effective traits](#resolve-effective-traits)
  - [Validate a widget instance](#validate-a-widget-instance)
- [4. States (CDSL)](#4-states-cdsl)
  - [No lifecycle states](#no-lifecycle-states)
- [5. Definitions of Done](#5-definitions-of-done)
  - [Widget base and entry trait](#widget-base-and-entry-trait)
  - [data_widget and data_type trait](#data_widget-and-data_type-trait)
  - [Widget-data base and stamped data](#widget-data-base-and-stamped-data)
  - [render_widget action](#render_widget-action)
  - [Entry declaration](#entry-declaration)
  - [Widget-author obligations](#widget-author-obligations)
  - [Shared dependencies and budget](#shared-dependencies-and-budget)
  - [Widget-author guide](#widget-author-guide)
- [6. Acceptance Criteria](#6-acceptance-criteria)

<!-- /toc -->

## 1. Feature Context

- [ ] `p1` - `cpt-frontx-dashboard-feature-widget-contract`

### 1.1 Overview

The contract a widget author writes against: the abstract widget base and its `entry` trait, the abstract `data_widget` and its `data_type` trait, the widget-data base, the `render_widget` action, the `widgets` domain extension type, the entry declaration (a plain FrontX `entry_mf` instance), the widget-author obligations, and the shared-dependency and budget rules.

### 1.2 Purpose

A widget author derives a widget type from `data_widget` (or the widget base for a type with no data), writes a closed `params` schema, sets the `entry` and `data_type` traits, and builds a FrontX MFE entry. A product changes which entry a template widget type points to by setting a different `entry` in its copy of the served file (D6). The root resolves effective traits itself, since FrontX exposes no traits API.

**Requirements**: `cpt-frontx-dashboard-fr-add-fix-widget`, `cpt-frontx-dashboard-fr-widget-catalog` (contract side), `cpt-frontx-dashboard-fr-author-guides` (widget-author guide), `cpt-frontx-dashboard-interface-contract`, `cpt-frontx-dashboard-nfr-bundle-budget`.

**Principles**: `cpt-frontx-dashboard-principle-open-bases-closed-leaves`, `cpt-frontx-dashboard-principle-per-instance-isolation`.

**Constraints**: `cpt-frontx-dashboard-constraint-one-gts-package`, `cpt-frontx-dashboard-constraint-hosting-agnostic` (FrontX-only deps).

**Not applicable**: persistence/DB (no database), auth/security (sign-in out of scope, D4; the contract is data), performance beyond the per-widget budget (the runtime owns render budgets), ops/rollout (no deployed service).

### 1.3 Actors

| Actor | Role in Feature |
|-------|-----------------|
| `cpt-frontx-dashboard-actor-widget-author` | Derives a widget type, sets traits, builds an entry, follows the obligations. |
| `cpt-frontx-dashboard-actor-host-application` | Changes an entry in its copy of the served file. |

### 1.4 References

- **PRD**: [PRD.md](../../PRD.md)
- **Design**: [DESIGN.md](../../DESIGN.md) (§3.1 Domain Model, §3.3 API Contracts)
- **Dependencies**: `cpt-frontx-dashboard-feature-dashboard-model`

## 2. Actor Flows (CDSL)

This feature has no actor flows of its own; it defines the contract data the runtime and the catalog build on. A widget author's publish flow is described in `cpt-frontx-dashboard-flow-dashboard-runtime-open` (the runtime mounts what the contract describes) and in the widget-author guide.

### No actor flows

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-flow-widget-contract-none`

**Actor**: `cpt-frontx-dashboard-actor-widget-author`

**Success Scenarios**:
- The widget author derives a type and builds an entry that the runtime mounts.

**Steps**:
1. [ ] - `p1` - The runtime resolves effective traits and validates widget instances against the contract (no actor flow of the contract's own). - `inst-wc-flow-none`
2. [ ] - `p1` - **RETURN**. - `inst-wc-flow-return`

## 3. Processes / Business Logic (CDSL)

### Resolve effective traits

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-algo-widget-contract-effective-traits`

**Input**: a widget type id (a type chain).

**Output**: the effective traits for that type.

**Steps**:
1. [ ] - `p1` - Walk the type's `$id` chain from root to leaf, fetching each schema with `getSchema`. - `inst-wc-trait-walk`
2. [ ] - `p1` - Collect each schema's `x-gts-traits-schema` along the chain. - `inst-wc-trait-collect`
3. [ ] - `p1` - Merge the trait schemas along the chain. - `inst-wc-trait-merge-schema`
4. [ ] - `p1` - Merge the trait values (`x-gts-traits`) root to leaf (RFC 7396). - `inst-wc-trait-merge-values`
5. [ ] - `p1` - Fill the `default` values of the effective trait schema. - `inst-wc-trait-defaults`
6. [ ] - `p1` - **IF** a required trait is unset - `inst-wc-trait-missing`
   1. [ ] - `p1` - **RETURN** a validation failure. - `inst-wc-trait-missing-return`
7. [ ] - `p1` - **RETURN** the effective traits. - `inst-wc-trait-return`

### Validate a widget instance

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-algo-widget-contract-validate-instance`

**Input**: an embedded widget instance.

**Output**: the widget validated against its own type, or a failure.

**Steps**:
1. [ ] - `p1` - Read the widget type from the rightmost type of the widget's `id` chain. - `inst-wc-val-type`
2. [ ] - `p1` - Register the widget instance on its own, which validates it against its own type. - `inst-wc-val-register`
3. [ ] - `p1` - **IF** registration rejects it - `inst-wc-val-fail`
   1. [ ] - `p1` - **RETURN** a cell-scope failure. - `inst-wc-val-fail-return`
4. [ ] - `p1` - Resolve its effective traits `entry` and `data_type` (`cpt-frontx-dashboard-algo-widget-contract-effective-traits`). - `inst-wc-val-traits`
5. [ ] - `p1` - Cross-check that `entry` and `data_type` exist (validation with reference lookup off). - `inst-wc-val-crosscheck`
6. [ ] - `p1` - **RETURN** the validated widget and its traits. - `inst-wc-val-return`

## 4. States (CDSL)

### No lifecycle states

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-state-widget-contract-none`

**States**: `defined` (the contract is data, with no lifecycle)

**Initial State**: `defined`

**Transitions**:
1. [ ] - `p1` - **FROM** `defined` **TO** `defined` **WHEN** the contract is referenced (no transition; the contract is static data). - `inst-wc-state-none`

## 5. Definitions of Done

### Widget base and entry trait

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-dod-widget-contract-base`

The system **MUST** ship the abstract widget base `gts.frontx.dashboard.widget.widget.v1~` with `id`, `title?`, `params`, and the `entry` trait schema (`x-gts-instance-ref` to `gts.frontx.mfes.mfe.entry.v1~frontx.mfes.mfe.entry_mf.v1~`), open and abstract (D6).

**Implements**: `cpt-frontx-dashboard-fr-add-fix-widget`.

**Constraints**: `cpt-frontx-dashboard-constraint-one-gts-package`.

**Touches**:
- Entities: Widget base

### data_widget and data_type trait

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-dod-widget-contract-data-widget`

The system **MUST** ship the abstract `data_widget` deriving from the widget base, with a required `data` (the binding) and the `data_type` trait schema (`x-gts-type-ref` to the widget-data base). `markdown_card` derives from the widget base directly and forbids `data` (D19).

**Implements**: `cpt-frontx-dashboard-fr-widget-catalog` (contract side).

**Touches**:
- Entities: Data widget, Widget base, Binding

### Widget-data base and stamped data

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-dod-widget-contract-data-base`

The system **MUST** ship the abstract widget-data base `gts.frontx.dashboard.widget_data.widget_data.v1~` with `id`. The root stamps the transform result with `<data type>~<UUIDv5(widget id | role)>` and registers it, which validates it (D20).

**Implements**: `cpt-frontx-dashboard-fr-per-cell-failure` (data side).

**Touches**:
- Entities: Widget data base

### render_widget action

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-dod-widget-contract-render-action`

The system **MUST** ship the `render_widget {widget, data?}` action type, validated without polymorphism (its `widget` and `data` reference the open bases). The widget renders it, including its own empty state, and makes no requests (D7).

**Implements**: `cpt-frontx-dashboard-interface-contract`.

**Touches**:
- Entities: render_widget action

### Entry declaration

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-dod-widget-contract-entry`

A widget's entry **MUST** be a plain FrontX `entry_mf` instance with `requiredProperties` (theme and language), `actions` [`render_widget`], `domainActions` [], `manifest`, `exposedModule`, `exposeAssets`, no derived type, no extra field. Its `mount` resolves only after it has registered its `render_widget` handler.

**Implements**: `cpt-frontx-dashboard-fr-add-fix-widget`.

**Touches**:
- Entities: MFE entry

### Widget-author obligations

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-dod-widget-contract-obligations`

A widget entry **MUST** render `params` and `data` (including its own empty state), make no requests, map the host theme id to the ui-kit light or dark scope (unknown gives light), style with ui-kit tokens only, format numbers and dates for the host language, show text never markup, never cut content off, never convey meaning by colour alone, and be keyboard-operable.

**Implements**: `cpt-frontx-dashboard-fr-theme` (widget side), `cpt-frontx-dashboard-fr-accessibility`, `cpt-frontx-dashboard-nfr-visual-quality`.

### Shared dependencies and budget

- [ ] `p3` - **ID**: `cpt-frontx-dashboard-dod-widget-contract-shared-deps`

Every widget entry **MUST** list its packages in `shared`, built as shared dependencies, fetched once by contentHash (FrontX ADR-0034/0035), each entry under 100 KB own code only.

**Implements**: `cpt-frontx-dashboard-nfr-bundle-budget`.

### Widget-author guide

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-dod-widget-contract-guide`

The template **MUST** ship a widget-author guide covering deriving a type and data type, building and shipping the entry, the one action it renders, the entry declaration, and the obligations.

**Implements**: `cpt-frontx-dashboard-fr-author-guides` (widget-author guide).

## 6. Acceptance Criteria

- [ ] The widget base is abstract and open, with the `entry` trait; `data_widget` requires `data` and has the `data_type` trait; `markdown_card` forbids `data`.
- [ ] A concrete widget type sets `entry` and `data_type`; a product that sets a different `entry` in its copy of the served file mounts that entry, with no template change.
- [ ] The root resolves effective traits as the RFC 7396 merge along the `$id` chain, with defaults filled.
- [ ] A widget entry is a plain FrontX `entry_mf` instance with no derived type and no extra field; its `mount` resolves only after it registers its `render_widget` handler.
- [ ] A widget entry follows the obligations: no requests, theme mapping, ui-kit tokens, formats, text not markup, no cut-off, no meaning by colour alone, keyboard-operable.
