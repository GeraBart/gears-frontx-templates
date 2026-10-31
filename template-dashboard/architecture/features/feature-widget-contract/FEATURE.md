---
status: accepted
version: 1
date: 2026-10-31
description: "Feature: the widget contract — the widget base with the value_format sub-schema and entry trait, data_widget with the binding and data_type trait, the widget-data base, the render_widget action, the widgets extension type and domain instance, the theme and language shared-property types, the widgets manifest, the entry declaration, generated extension id derivation, widget-author obligations, and shared-dependency and budget rules."
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
  - [widgets extension type](#widgets-extension-type)
  - [widgets domain instance](#widgets-domain-instance)
  - [Generated extension instance](#generated-extension-instance)
  - [Theme and language shared-property types](#theme-and-language-shared-property-types)
  - [Entry declaration](#entry-declaration)
  - [Widgets manifest](#widgets-manifest)
  - [Widget-author obligations](#widget-author-obligations)
  - [Shared dependencies and budget](#shared-dependencies-and-budget)
  - [Widget-author guide](#widget-author-guide)
- [6. Acceptance Criteria](#6-acceptance-criteria)

<!-- /toc -->

## 1. Feature Context

- [ ] `p1` - `cpt-frontx-dashboard-feature-widget-contract`

### 1.1 Overview

The contract a widget author writes against: the abstract widget base and its `entry` trait, the abstract `data_widget` and its `data_type` trait, the widget-data base, the `render_widget` action, the `widgets` domain extension type and domain instance, the theme and language shared-property types, the widgets manifest, the entry declaration (a plain FrontX `entry_mf` instance), generated extension id derivation, the widget-author obligations, and the shared-dependency and budget rules.

### 1.2 Purpose

A widget author derives a widget type from `data_widget` (or the widget base for a type with no data), writes a closed `render` schema, sets the `entry` and `data_type` traits, and builds a FrontX MFE entry. A product changes which entry a template widget type points to by setting a different `entry` in its copy of the served file. The root resolves effective traits itself, since FrontX exposes no traits API.

**Requirements**: `cpt-frontx-dashboard-fr-add-fix-widget`, `cpt-frontx-dashboard-fr-widget-catalog` (contract side), `cpt-frontx-dashboard-fr-author-guides` (widget-author guide), `cpt-frontx-dashboard-interface-contract`, `cpt-frontx-dashboard-interface-binding`, `cpt-frontx-dashboard-interface-render-widget`, `cpt-frontx-dashboard-nfr-bundle-budget`.

**Principles**: `cpt-frontx-dashboard-principle-open-bases-closed-leaves`, `cpt-frontx-dashboard-principle-per-instance-isolation`.

**Constraints**: `cpt-frontx-dashboard-constraint-one-gts-package`, `cpt-frontx-dashboard-constraint-hosting-agnostic` (FrontX-only deps).

**Not applicable**: persistence/DB (no database), auth/security (sign-in out of scope; the contract is data), performance beyond the per-widget budget (the runtime owns render budgets), ops/rollout (no deployed service).

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

Not applicable because the contract is data only; the runtime resolves effective traits and validates widget instances against the contract, with no actor flow of the contract's own.

## 3. Processes / Business Logic (CDSL)

### Resolve effective traits

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-algo-widget-contract-effective-traits`

**Input**: a widget type id (a type chain).

**Output**: the effective traits for that type.

**Steps**:
1. [ ] - `p1` - Walk the type's `$id` chain from root to leaf, fetching each schema with `getSchema`. - `inst-wc-trait-walk`
2. [ ] - `p1` - **IF** any schema along the chain is missing - `inst-wc-trait-missing-schema`
   1. [ ] - `p1` - **RETURN** a validation failure (never a partial result). - `inst-wc-trait-missing-schema-return`
3. [ ] - `p1` - Collect each schema's `x-gts-traits-schema` along the chain. - `inst-wc-trait-collect`
4. [ ] - `p1` - Merge the trait schemas along the chain. - `inst-wc-trait-merge-schema`
5. [ ] - `p1` - Merge the trait values (`x-gts-traits`) root to leaf (RFC 7396). - `inst-wc-trait-merge-values`
6. [ ] - `p1` - Fill the `default` values of the effective trait schema. - `inst-wc-trait-defaults`
7. [ ] - `p1` - **IF** a required trait is unset - `inst-wc-trait-missing`
   1. [ ] - `p1` - **RETURN** a validation failure. - `inst-wc-trait-missing-return`
8. [ ] - `p1` - **RETURN** the effective traits. - `inst-wc-trait-return`

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

Not applicable because the contract is static data with no lifecycle; the runtime resolves effective traits and validates instances against it, with no state transitions of its own.

## 5. Definitions of Done

### Widget base and entry trait

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-dod-widget-contract-base`

The system **MUST** ship the abstract widget base `gts.frontx.dashboard.widget.widget.v1~` with `id`, `title?`, a required open `render`, the `entry` trait schema (`x-gts-instance-ref` to `gts.frontx.mfes.mfe.entry.v1~frontx.mfes.mfe.entry_mf.v1~`), and the `$defs/value_format` sub-schema, open and abstract, so a product changes the entry in its copy of the served file.

The `value_format` sub-schema defines `{value_type: number | percent | duration, unit?}`. `unit` is required when `value_type` is `duration`. `percent` 0.25 means 25%. Every concrete widget type that shows numbers references `$defs/value_format` from the widget base.

The operand of `x-gts-instance-ref` on the `id` field is the literal base type, because the self-reference operand would resolve to the type being validated and would reject an id embedded in a layout cell or a dashboard.

**Schema**:

```json
{
  "$id": "gts://gts.frontx.dashboard.widget.widget.v1~",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "Widget",
  "description": "Abstract base of the 9 template widget types.",
  "x-gts-abstract": true,
  "type": "object",
  "required": ["id", "render"],
  "properties": {
    "id": {
      "type": "string",
      "x-gts-instance-ref": "gts.frontx.dashboard.widget.widget.v1~",
      "description": "Combined anonymous instance identifier: the widget's type chain followed by a UUID. The rightmost type of the chain is the widget type. The widget has no other identifier and no name of its own."
    },
    "title": {
      "type": "string",
      "description": "Display title shown in the widget chrome, as delivered."
    },
    "render": {
      "type": "object",
      "description": "Presentation fields, narrowed and closed by each concrete widget type."
    }
  },
  "$defs": {
    "value_format": {
      "type": "object",
      "additionalProperties": false,
      "required": ["value_type"],
      "properties": {
        "value_type": {
          "enum": ["number", "percent", "duration"]
        },
        "unit": {
          "type": "string",
          "description": "Required when value_type is duration."
        }
      },
      "allOf": [
        {
          "if": { "properties": { "value_type": { "const": "duration" } } },
          "then": { "required": ["unit"] }
        }
      ],
      "description": "A value format. percent 0.25 means 25%."
    }
  },
  "x-gts-traits-schema": {
    "type": "object",
    "properties": {
      "entry": {
        "type": "string",
        "x-gts-instance-ref": "gts.frontx.mfes.mfe.entry.v1~frontx.mfes.mfe.entry_mf.v1~",
        "description": "The MFE entry the widget type renders through."
      }
    }
  }
}
```

**Implements**: `cpt-frontx-dashboard-fr-add-fix-widget`.

**Constraints**: `cpt-frontx-dashboard-constraint-one-gts-package`.

**Touches**:
- Entities: Widget base

### data_widget and data_type trait

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-dod-widget-contract-data-widget`

The system **MUST** ship an abstract `data_widget` between the base and every data-taking type, deriving from the widget base, with a required `data` (the binding, a `oneOf` of three closed forms: own, shared, static) and the `data_type` trait schema (`x-gts-type-ref` to the widget-data base). `markdown_card` derives from the widget base directly and forbids `data`.

The binding is the data contract a dashboard author writes. A data widget's `data` has exactly one of three forms; `request` is mutually exclusive with both `source` and `params`, and `params` is allowed only with `source` or alone:

- **own:** `{request, transform}` — `request` has `method` (`GET` or `POST`), `path` (an absolute same-origin path; the query string is part of the path), and an optional `body` (JSON, allowed only with `POST`). `transform` is a CEL expression whose single variable is `response`, the parsed JSON body.
- **shared:** `{source, params?, transform}` — `source` names an entry in the dashboard's `requests` object. `params` is any JSON object (absent means `{}`). `transform` is a CEL expression whose variables are `response` (the shared response) and `params`.
- **static:** `{params?, transform}` — `params` is any JSON object (absent means `{}`). `transform` is a CEL expression whose single variable is `params`.

**Schema**:

```json
{
  "$id": "gts://gts.frontx.dashboard.widget.widget.v1~frontx.dashboard.widget.data_widget.v1~",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "DataWidget",
  "description": "Abstract base of the data widget types: a widget with a binding and the data_type trait.",
  "x-gts-abstract": true,
  "x-gts-traits-schema": {
    "type": "object",
    "properties": {
      "data_type": {
        "type": "string",
        "x-gts-type-ref": "gts.frontx.dashboard.widget_data.widget_data.v1~",
        "description": "The data type the widget type needs."
      }
    }
  },
  "allOf": [
    { "$ref": "gts://gts.frontx.dashboard.widget.widget.v1~" },
    {
      "type": "object",
      "required": ["data"],
      "properties": {
        "data": {
          "oneOf": [
            {
              "type": "object",
              "unevaluatedProperties": false,
              "required": ["request", "transform"],
              "description": "own: send a request and evaluate the transform on the response.",
              "properties": {
                "request": {
                  "type": "object",
                  "additionalProperties": false,
                  "required": ["method", "path"],
                  "properties": {
                    "method": { "enum": ["GET", "POST"] },
                    "path": {
                      "type": "string",
                      "pattern": "^/",
                      "description": "An absolute same-origin path; the query string is part of the path. The root rejects any other target before sending."
                    },
                    "body": {
                      "description": "JSON body, allowed only with POST."
                    }
                  },
                  "allOf": [
                    {
                      "if": { "properties": { "method": { "const": "GET" } } },
                      "then": { "properties": { "body": false } }
                    }
                  ]
                },
                "transform": {
                  "type": "string",
                  "description": "A CEL expression whose single variable is response, the parsed JSON body."
                }
              }
            },
            {
              "type": "object",
              "unevaluatedProperties": false,
              "required": ["source", "transform"],
              "description": "shared: evaluate the transform on a shared response and params.",
              "properties": {
                "source": {
                  "type": "string",
                  "pattern": "^[a-z][a-z0-9_]{0,63}$",
                  "description": "Names an entry in the dashboard's requests object."
                },
                "params": {
                  "type": "object",
                  "description": "Any JSON object. Absent means {}."
                },
                "transform": {
                  "type": "string",
                  "description": "A CEL expression whose variables are response (the shared response) and params."
                }
              }
            },
            {
              "type": "object",
              "unevaluatedProperties": false,
              "required": ["transform"],
              "description": "static: evaluate the transform on params, with no request.",
              "properties": {
                "params": {
                  "type": "object",
                  "description": "Any JSON object. Absent means {}."
                },
                "transform": {
                  "type": "string",
                  "description": "A CEL expression whose single variable is params."
                }
              }
            }
          ]
        }
      }
    }
  ]
}
```

**Implements**: `cpt-frontx-dashboard-fr-widget-catalog` (contract side), `cpt-frontx-dashboard-interface-binding`.

**Touches**:
- Entities: Data widget, Widget base, Binding

### Widget-data base and stamped data

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-dod-widget-contract-data-base`

The system **MUST** ship the abstract widget-data base `gts.frontx.dashboard.widget_data.widget_data.v1~` with `id`. The root stamps the transform result with `<data type>~<UUIDv5(widget id | role)>` and registers it, which validates it.

**Schema**:

```json
{
  "$id": "gts://gts.frontx.dashboard.widget_data.widget_data.v1~",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "WidgetData",
  "description": "Abstract base of every data type. Carries the combined instance id.",
  "type": "object",
  "x-gts-abstract": true,
  "required": ["id"],
  "properties": {
    "id": {
      "type": "string",
      "x-gts-instance-ref": "gts.frontx.dashboard.widget_data.widget_data.v1~",
      "description": "Combined anonymous instance id: the data type chain followed by the root's UUIDv5 stamp, of the form <data type>~UUIDv5(namespace, widget id | role)."
    }
  }
}
```

**Implements**: `cpt-frontx-dashboard-fr-per-cell-failure` (data side).

**Touches**:
- Entities: Widget data base

### render_widget action

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-dod-widget-contract-render-action`

The system **MUST** ship the `render_widget {widget, data?}` action type, validated without polymorphism (its `widget` and `data` reference the open bases). The widget renders it, including its own empty state, and makes no requests. The root sends it once `mount_ext` has finished and the data is valid; a `markdown_card` cell gets `render_widget {widget}` at once, with no loader.

**Schema**:

```json
{
  "$id": "gts://gts.frontx.mfes.comm.action.v1~frontx.dashboard.mfe.render_widget.v1~",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "render_widget",
  "description": "Gives a mounted widget extension its widget instance, and for a data widget its data.",
  "allOf": [
    { "$ref": "gts://gts.frontx.mfes.comm.action.v1~" },
    {
      "type": "object",
      "required": ["payload"],
      "properties": {
        "target": {
          "type": "string",
          "x-gts-instance-ref": "gts.frontx.mfes.ext.extension.v1~frontx.dashboard.mfe.widget_ext.v1~",
          "description": "A generated extension in the widgets domain."
        },
        "payload": {
          "type": "object",
          "required": ["widget"],
          "additionalProperties": false,
          "properties": {
            "widget": {
              "$ref": "gts://gts.frontx.dashboard.widget.widget.v1~",
              "description": "The widget instance as it appears in the dashboard, validated against the widget type that its own id names."
            },
            "data": {
              "$ref": "gts://gts.frontx.dashboard.widget_data.widget_data.v1~",
              "description": "Data widget only: the stamped and validated data instance."
            }
          }
        }
      }
    }
  ],
  "unevaluatedProperties": false
}
```

**Implements**: `cpt-frontx-dashboard-interface-contract`, `cpt-frontx-dashboard-interface-render-widget`.

**Touches**:
- Entities: render_widget action

### widgets extension type

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-dod-widget-contract-extension-type`

The system **MUST** ship the `widgets` extension type `gts.frontx.mfes.ext.extension.v1~frontx.dashboard.mfe.widget_ext.v1~`. It is the domain's `extensionsTypeId` and fixes `domain` to the `widgets` domain id. The `entry` field carries the entry from the widget type's `entry` trait. The extension type adds no field to the FrontX extension base.

**Schema**:

```json
{
  "$id": "gts://gts.frontx.mfes.ext.extension.v1~frontx.dashboard.mfe.widget_ext.v1~",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "Widgets Extension",
  "description": "Generated widget extension of the widgets domain. Adds no field to the FrontX extension base.",
  "allOf": [
    { "$ref": "gts://gts.frontx.mfes.ext.extension.v1~" },
    {
      "type": "object",
      "required": ["id", "domain", "entry"],
      "properties": {
        "id": {
          "type": "string",
          "x-gts-instance-ref": "gts.frontx.mfes.ext.extension.v1~frontx.dashboard.mfe.widget_ext.v1~",
          "description": "This extension type followed by the UUIDv5 of the widget id, role and entry id."
        },
        "domain": {
          "type": "string",
          "const": "gts.frontx.mfes.ext.domain.v1~frontx.dashboard.mfe.widgets.v1"
        },
        "entry": {
          "type": "string",
          "x-gts-instance-ref": "gts.frontx.mfes.mfe.entry.v1~frontx.mfes.mfe.entry_mf.v1~",
          "description": "The entry from the widget type's entry trait."
        }
      }
    }
  ]
}
```

**Implements**: `cpt-frontx-dashboard-fr-dashboard-root` (extension type side).

**Constraints**: `cpt-frontx-dashboard-constraint-one-gts-package`.

**Touches**:
- Entities: Widgets extension type

### widgets domain instance

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-dod-widget-contract-domain`

The system **MUST** ship the `widgets` domain instance `gts.frontx.mfes.ext.domain.v1~frontx.dashboard.mfe.widgets.v1` with `sharedProperties` theme and language, `actions` `mount_ext` and `unmount_ext`, `extensionsActions` `render_widget`, `extensionsTypeId` the `widget_ext` extension type, `defaultActionTimeout` 30000 ms, and both lifecycle-stage lists empty. The domain has no `route`: generated extensions are not routed.

**Instance**:

```json
{
  "id": "gts.frontx.mfes.ext.domain.v1~frontx.dashboard.mfe.widgets.v1",
  "sharedProperties": [
    "gts.frontx.mfes.comm.shared_property.v1~frontx.mfes.comm.theme.v1~",
    "gts.frontx.mfes.comm.shared_property.v1~frontx.mfes.comm.language.v1~"
  ],
  "actions": [
    "gts.frontx.mfes.comm.action.v1~frontx.mfes.ext.mount_ext.v1~",
    "gts.frontx.mfes.comm.action.v1~frontx.mfes.ext.unmount_ext.v1~"
  ],
  "extensionsActions": [
    "gts.frontx.mfes.comm.action.v1~frontx.dashboard.mfe.render_widget.v1~"
  ],
  "extensionsTypeId": "gts.frontx.mfes.ext.extension.v1~frontx.dashboard.mfe.widget_ext.v1~",
  "defaultActionTimeout": 30000,
  "lifecycleStages": [],
  "extensionsLifecycleStages": []
}
```

**Implements**: `cpt-frontx-dashboard-fr-dashboard-root` (domain side).

**Constraints**: `cpt-frontx-dashboard-constraint-one-root-per-registry`.

**Touches**:
- Entities: widgets domain

### Generated extension instance

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-dod-widget-contract-generated-extension`

The root generates one extension per cell (and per larger view). The extension id is `<widget_ext type>~<UUIDv5(namespace, widget id | role | entry id)>`, where role is `cell` or `larger_view`. A stamped data id is `<data type>~<UUIDv5(namespace, widget id | role)>`. The template uses one fixed UUIDv5 namespace constant, `b3f7a1c2-4d6e-4f8a-9c1b-3e5d7f9a2b04`, the template's own, for both extension ids and stamped data ids. The name parts are joined with `|`, in UTF-8, with ids in lowercase. A reload reuses the ids. Ids are never persisted.

**Example** (two generated extensions, one per cell, not a registered type):

```json
[
  {
    "id": "gts.frontx.mfes.ext.extension.v1~frontx.dashboard.mfe.widget_ext.v1~6b1f4e2a-93c7-5d08-a4e5-2c7f9b0d3e61",
    "domain": "gts.frontx.mfes.ext.domain.v1~frontx.dashboard.mfe.widgets.v1",
    "entry": "gts.frontx.mfes.mfe.entry.v1~frontx.mfes.mfe.entry_mf.v1~frontx.dashboard.mfe.pie_chart.v1"
  },
  {
    "id": "gts.frontx.mfes.ext.extension.v1~frontx.dashboard.mfe.widget_ext.v1~9d3a7c5e-1f42-5b86-8e0d-4a6c2f7b1d93",
    "domain": "gts.frontx.mfes.ext.domain.v1~frontx.dashboard.mfe.widgets.v1",
    "entry": "gts.frontx.mfes.mfe.entry.v1~frontx.mfes.mfe.entry_mf.v1~frontx.dashboard.mfe.grid.v1"
  }
]
```

**Implements**: `cpt-frontx-dashboard-fr-dashboard-root` (generated extension side).

**Touches**:
- Entities: Generated extension

### Theme and language shared-property types

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-dod-widget-contract-shared-properties`

The system **MUST** ship the theme and language shared-property types, registered under `gts.frontx.mfes.comm.shared_property.v1~frontx.mfes.comm.theme.v1~` and `gts.frontx.mfes.comm.shared_property.v1~frontx.mfes.comm.language.v1~`. Both derive from the FrontX shared-property base `gts.frontx.mfes.comm.shared_property.v1~`, constraining `value` to their respective types: theme to a non-empty string (any host theme id; the widget helpers fold an unknown id to the light ui-kit scope), language to a BCP-47 language tag string.

**FrontX shared-property base** (framework type, not a dashboard template type):

```json
{
  "$id": "gts://gts.frontx.mfes.comm.shared_property.v1~",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "id": { "x-gts-ref": "/$id" },
    "value": {}
  },
  "required": ["id"]
}
```

**Theme shared-property type**:

```json
{
  "$id": "gts://gts.frontx.mfes.comm.shared_property.v1~frontx.mfes.comm.theme.v1~",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "Theme Shared Property",
  "description": "The host theme shared property.",
  "allOf": [
    { "$ref": "gts://gts.frontx.mfes.comm.shared_property.v1~" },
    {
      "type": "object",
      "properties": {
        "value": {
          "type": "string",
          "minLength": 1,
          "description": "The host theme id, any non-empty string. The widget helpers fold an unknown id to light."
        }
      }
    }
  ]
}
```

**Language shared-property type**:

```json
{
  "$id": "gts://gts.frontx.mfes.comm.shared_property.v1~frontx.mfes.comm.language.v1~",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "Language Shared Property",
  "description": "The host language shared property.",
  "allOf": [
    { "$ref": "gts://gts.frontx.mfes.comm.shared_property.v1~" },
    {
      "type": "object",
      "properties": {
        "value": {
          "type": "string",
          "description": "A BCP-47 language tag, e.g. en, en-US, fr, fr-CA."
        }
      }
    }
  ]
}
```

**Implements**: `cpt-frontx-dashboard-fr-theme` (contract side).

**Touches**:
- Entities: Theme shared property, Language shared property

### Entry declaration

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-dod-widget-contract-entry`

A widget's entry **MUST** be a plain FrontX `entry_mf` instance with `requiredProperties` (theme and language), `actions` [`render_widget`], `domainActions` [], `manifest`, `exposedModule`, `exposeAssets`, no derived type, no extra field. Its `mount` resolves only after it has registered its `render_widget` handler. `exposeAssets` is produced by the manifest pipeline; the author writes `id` and `exposedModule` only.

**Grid entry example**:

```json
{
  "id": "gts.frontx.mfes.mfe.entry.v1~frontx.mfes.mfe.entry_mf.v1~frontx.dashboard.mfe.grid.v1",
  "requiredProperties": [
    "gts.frontx.mfes.comm.shared_property.v1~frontx.mfes.comm.theme.v1~",
    "gts.frontx.mfes.comm.shared_property.v1~frontx.mfes.comm.language.v1~"
  ],
  "actions": [
    "gts.frontx.mfes.comm.action.v1~frontx.dashboard.mfe.render_widget.v1~"
  ],
  "domainActions": [],
  "manifest": "gts.frontx.mfes.mfe.mf_manifest.v1~frontx.dashboard.widgets.manifest.v1",
  "exposedModule": "./grid",
  "exposeAssets": true
}
```

**Entry field notes**:
- The entry is a plain instance of the FrontX MFE entry type `gts.frontx.mfes.mfe.entry.v1~frontx.mfes.mfe.entry_mf.v1~`. It uses only its inherited fields: `id`, `requiredProperties`, `actions`, and `domainActions` from the FrontX entry base, and `manifest` and `exposedModule` from the entry type. `exposeAssets` is produced by the manifest pipeline.
- `requiredProperties`: theme and language. The widgets domain shares both properties, with the host's values published unchanged. Each widget maps the host theme id to the light or dark scope of `@gears-frontx/ui-kit` and follows a theme switch without a request. It formats values and localizes its own wording for the host language.
- `actions`: `render_widget`, the one extension action the domain sends to its widgets, so only entries that handle it are admitted. `markdown_card` lists it too, although it never receives `data`.
- `domainActions`: empty. The lifecycle actions `mount_ext` and `unmount_ext` are exempt from the entry-requires-domain admission rule, so no entry lists them. Widgets make no requests.
- `exposedModule`: `./<widget_type>` where `<widget_type>` is the widget type segment.
- The same entry serves a cell and the larger view.

**Implements**: `cpt-frontx-dashboard-fr-add-fix-widget`.

**Touches**:
- Entities: MFE entry

### Widgets manifest

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-dod-widget-contract-manifest`

The system **MUST** ship the `widgets` manifest `gts.frontx.mfes.mfe.mf_manifest.v1~frontx.dashboard.widgets.manifest.v1`, the single manifest of the `widgets` package. All 9 widget entries point to it. The `widgets` `mfe.json` carries this manifest and the 9 widget entries. It carries no template GTS instance and no dashboard content.

| Field | Source | Content |
|-------|--------|---------|
| `id` | authored in `widgets/mfe.json` | `gts.frontx.mfes.mfe.mf_manifest.v1~frontx.dashboard.widgets.manifest.v1` |
| `remoteEntry` | authored in `widgets/mfe.json` | location of the entry file of the `widgets` build |
| `name`, `metaData`, `shared` | produced by the manifest pipeline (`scripts/generate-mfe-manifests.ts`) from the build | the FrontX manifest fields: package name, public path and entry file descriptor, and the `shared` array of shared dependencies |

A full JSON instance block is not shown because the manifest is produced by the manifest pipeline from the build; only `id` and `remoteEntry` are authored in `widgets/mfe.json`.

**Implements**: `cpt-frontx-dashboard-nfr-bundle-budget` (manifest side).

**Touches**:
- Entities: Widgets manifest

### Widget-author obligations

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-dod-widget-contract-obligations`

A widget entry **MUST** render `render_widget` and, for data widgets, `data` (including its own empty state), make no requests, map the host theme id to the ui-kit light or dark scope (unknown gives light), style with ui-kit tokens only, format numbers and dates for the host language, show text never markup, never cut content off, never convey meaning by colour alone, and be keyboard-operable.

**Implements**: `cpt-frontx-dashboard-fr-theme` (widget side), `cpt-frontx-dashboard-fr-accessibility`, `cpt-frontx-dashboard-nfr-visual-quality`.

### Shared dependencies and budget

- [ ] `p3` - **ID**: `cpt-frontx-dashboard-dod-widget-contract-shared-deps`

Every widget entry **MUST** list its packages in `shared`, built as shared dependencies, fetched once by contentHash (FrontX ADR-0034/0035), each entry under 100 KB own code only. Stateful packages are listed in `shared` too, and per-instance memory is held per extension id until unload, bounded by deterministic ids. Package subtrees live under `src-app/mfe_packages/{dashboard,widgets}/`; the architecture documents are not shipped.

**Dependency sets per entry**:

| Entries | Packages used |
|---------|---------------|
| Every widget entry | React with React DOM; the FrontX MFE runtime for the entry's bridge and lifecycle; `@gears-frontx/ui-kit`; and its own widget code only (the cell frame lives in the root) |
| Entries of `cartesian_chart`, `pie_chart`, `heatmap` | in addition, ECharts through `echarts/core` imports, and echarts-for-react |
| Entry of `grid` | in addition, TanStack Table v8 and the TanStack virtualizer |

A schema missing along the type chain is a failure, never a partial result.

**Implements**: `cpt-frontx-dashboard-nfr-bundle-budget`.

### Widget-author guide

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-dod-widget-contract-guide`

The template **MUST** ship a widget-author guide covering deriving a type and data type, building and shipping the entry, the one action it renders, the entry declaration, and the obligations.

**Implements**: `cpt-frontx-dashboard-fr-author-guides` (widget-author guide).

## 6. Acceptance Criteria

- [ ] The widget base is abstract and open, with `id`, `title?`, a required open `render`, the `entry` trait, and the `$defs/value_format` sub-schema; `data_widget` requires `data` (the binding `oneOf` of three closed forms) and has the `data_type` trait; `markdown_card` forbids `data`.
- [ ] A concrete widget type sets `entry` and `data_type`; a product that sets a different `entry` in its copy of the served file mounts that entry, with no template change.
- [ ] The root resolves effective traits as the RFC 7396 merge along the `$id` chain, with defaults filled; a schema missing along the type chain is a failure, never a partial result.
- [ ] The `render_widget` action carries a single `target` (a `widget_ext` extension) and a closed payload of `{widget, data?}`; `widget` and `data` reference the open bases, validated without polymorphism.
- [ ] The `widgets` extension type fixes the `domain` const to the `widgets` domain id and carries the `entry` from the widget type's `entry` trait.
- [ ] The `widgets` domain instance declares `sharedProperties` theme and language, `actions` `mount_ext` and `unmount_ext`, `extensionsActions` `render_widget`, `extensionsTypeId` the `widget_ext` extension type, `defaultActionTimeout` 30000, and both lifecycle-stage lists empty.
- [ ] The theme and language shared-property types derive from the FrontX `shared_property` base; theme constrains `value` to a non-empty string (any host theme id, folded to light or dark by the widget helpers), language to a BCP-47 language tag string.
- [ ] The `widgets` manifest carries `id` and `remoteEntry` authored by the widget author; `name`, `metaData` and `shared` are produced by the manifest pipeline.
- [ ] A generated extension id is the `widget_ext` type followed by `UUIDv5(namespace, widget id | role | entry id)`; a stamped data id is the data type followed by `UUIDv5(namespace, widget id | role)`; name parts are joined with `|`, in UTF-8, with ids in lowercase; ids are never persisted.
- [ ] A widget entry is a plain FrontX `entry_mf` instance with no derived type and no extra field; its `mount` resolves only after it registers its `render_widget` handler.
- [ ] A widget entry follows the obligations: no requests, theme mapping, ui-kit tokens, formats, text not markup, no cut-off, no meaning by colour alone, keyboard-operable.
- [ ] Every widget entry lists its packages in `shared`, fetched once by contentHash, each entry under 100 KB own code only.
