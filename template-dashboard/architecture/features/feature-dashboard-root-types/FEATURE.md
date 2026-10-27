---
status: accepted
version: 1
date: 2026-10-27
description: Domain-model types of the Dashboard root with its embedded layout and of the Theme with its light and dark palettes, declared by dashboard-viewer.
---

# Feature: Dashboard Root Types


<!-- toc -->

- [1. Feature Context](#1-feature-context)
  - [1.1 Overview](#11-overview)
  - [1.2 Purpose](#12-purpose)
  - [1.3 Actors](#13-actors)
  - [1.4 References](#14-references)
- [2. Actor Flows (CDSL)](#2-actor-flows-cdsl)
  - [Domain-Model Feature — No Actor Flows](#domain-model-feature--no-actor-flows)
- [3. Processes / Business Logic (CDSL)](#3-processes--business-logic-cdsl)
  - [Domain-Model Feature — No Processes](#domain-model-feature--no-processes)
- [4. States (CDSL)](#4-states-cdsl)
  - [Domain-Model Feature — No State Machines](#domain-model-feature--no-state-machines)
- [5. Definitions of Done](#5-definitions-of-done)
  - [Domain Model Definition of Done](#domain-model-definition-of-done)
- [6. Domain Model](#6-domain-model)
  - [6.1 Dashboard](#61-dashboard)
  - [6.2 Theme](#62-theme)
- [7. Acceptance Criteria](#7-acceptance-criteria)

<!-- /toc -->

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-featstatus-dashboard-root-types`
## 1. Feature Context

- [ ] `p2` - `cpt-frontx-dashboard-feature-dashboard-root-types`

### 1.1 Overview

This is a **domain-model feature**, not an actor-flow feature. It declares the Dashboard root, which embeds its layout, and the Theme type. The FEATURE template's flow, process, and state sections are reduced to stubs; the types live in section 6, Domain Model.

### 1.2 Purpose

Concrete declaration of the dashboard root types of the domain model in DESIGN section 3.1: the Dashboard root and the Theme. The Dashboard root holds `id`, `name`, `description`, and the embedded `layout`, and no report type exists. A Dashboard instance is one dashboard as the consuming product backend provides it, GTS-typed (`cpt-frontx-dashboard-interface-dashboard-payload`; the dashboard request and response are specified in `feature-backend-contract` section 6.1). The consuming product writes or generates its dashboards; authoring is out of scope for the template. Either way, a dashboard validates against these types, so a consuming product can check the root of a dashboard it generates, and its embedded layout, before the dashboard is shown. The theme lives on the frontend: the template owns its Theme instance, and the consuming product backend does not provide it.

**Declaring package**: `dashboard-viewer`.

**Requirements**: `cpt-frontx-dashboard-fr-domain-model`, `cpt-frontx-dashboard-fr-theme`, `cpt-frontx-dashboard-fr-backend-source`

**Principles**: `cpt-frontx-dashboard-principle-gts-contracts`

### 1.3 Actors

N/A — domain-model feature. The types are consumed by the runtime type system (Viewer host and widget MFEs), not by an end-user actor. No human actor flows are authored.

### 1.4 References

- **PRD**: [PRD.md](../../PRD.md)
- **Design**: [DESIGN.md](../../DESIGN.md#31-domain-model)
- **ADRs**: [ADR-0003](../../ADR/0003-shared-data-types-and-schemas-v1.md), [ADR-0006](../../ADR/0006-theme-distribution-v1.md), [ADR-0011](../../ADR/0011-backend-delivered-dashboard-v1.md)
- **Dependencies**: `feature-layout-types` (the Dashboard embeds a `gts.frontx.m.layout.layout.v1~` object). Dependency graph: dashboard-root-types depends on layout-types; Theme has no dependency, and the Dashboard does not reference it.
- **Related**: `feature-backend-contract` (the dashboard response is one instance of the Dashboard type; its section 6.1 runs the layout checks on the embedded layout).

## 2. Actor Flows (CDSL)

### Domain-Model Feature — No Actor Flows

N/A — domain-model feature. The types are consumed at runtime by the type system, not by an actor flow. The full declarations live in section 6, Domain Model.

## 3. Processes / Business Logic (CDSL)

### Domain-Model Feature — No Processes

N/A — domain-model feature. This feature declares static GTS schemas; runtime validation and execution logic lives in the Viewer host bundle of `dashboard-viewer`, not in this file.

## 4. States (CDSL)

### Domain-Model Feature — No State Machines

N/A — domain-model feature. Type declarations are stateless.

## 5. Definitions of Done

### Domain Model Definition of Done

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-dod-dashboard-root-types-catalog-complete`

The system **MUST** declare `gts.frontx.m.dashboard.dashboard.v1~` with only its four fields (`id`, `name`, `description`, `layout`) and `gts.frontx.m.dashboard.theme.v1~` in `dashboard-viewer`, and **MUST NOT** declare a report type.

- Every concrete is authored with a full JSON Schema declaration.
- Every identifier follows the GTS identifier grammar and the ID-form convention of DESIGN section 3.1 (types end with `~`, instances do not).
- Every `x-gts-instance-ref` operand is valid under GTS v0.17, and every `$ref` resolves to a declared type.
- The Dashboard `id` is a combined anonymous instance identifier (`gts.frontx.m.dashboard.dashboard.v1~<uuid>`, UUID generated by the consuming product backend); the Dashboard declares no separate `type` field.
- The layout is embedded in the Dashboard; no layout reference or separate layout instance exists.
- The Dashboard root declares only these four fields, and no report type exists.
- The Dashboard root declares no `theme` field; the Theme instance is template-owned frontend content and is not part of the dashboard.
- Both palettes of the Theme declare the optional `row_tints` with the families `severity`, `status`, and `generic`.

**Constraints**: `cpt-frontx-dashboard-constraint-gts-id-convention`

## 6. Domain Model

### 6.1 Dashboard

**GTS ID**: `gts.frontx.m.dashboard.dashboard.v1~`

**Description**: Top-level container of a dashboard: identifier, name, optional description, and the embedded layout. A Dashboard instance is one dashboard as the consuming product provides it, written or generated; authoring is out of scope for the template. A dashboard is structured as follows:

- `id`, `name`, and the optional `description` identify and name the dashboard;
- `layout` embeds the dashboard's layout on the 60-column grid (`feature-layout-types` section 6.1);
- each layout cell places one widget and embeds that widget instance with its settings: its `id`, whose type chain names the widget kind, its `title`, its presentation configuration, and its `params` (`feature-layout-types` section 6.2; the widget base is `feature-widget-catalog` section 6.0).

The dashboard carries no widget data and no theme: each widget requests its own data (`feature-backend-contract` section 6.2), and the template applies its own Theme (section 6.2). The consuming product backend answers the dashboard request with one instance of this type (`feature-backend-contract` section 6.1). Visibility, sharing, publication, and audience settings are not part of the Dashboard; a consuming product may derive a subtype that adds them.

**Schema**:

```json
{
  "$id": "gts://gts.frontx.m.dashboard.dashboard.v1~",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "Dashboard",
  "description": "Top-level container defining a named dashboard with its embedded layout.",
  "type": "object",
  "required": ["id", "name", "layout"],
  "properties": {
    "id": {
      "type": "string",
      "x-gts-instance-ref": "/$id",
      "description": "Combined anonymous instance identifier: the dashboard type chain followed by a UUID generated by the consuming product backend, for example gts.frontx.m.dashboard.dashboard.v1~<uuid>. No separate type field exists."
    },
    "name": {
      "type": "string",
      "description": "Human-readable dashboard name."
    },
    "description": {
      "type": "string",
      "description": "Optional longer description of the dashboard purpose."
    },
    "layout": {
      "$ref": "gts://gts.frontx.m.layout.layout.v1~",
      "description": "The dashboard's layout, embedded: the grid columns and the cells, each embedding one widget instance."
    }
  }
}
```

**Cross-references**:
- No abstract base (flat single-segment chain).
- Related types: `gts.frontx.m.layout.layout.v1~` (`feature-layout-types`), embedded through `$ref`.
- No report type exists: each widget requests its own data (`feature-backend-contract` section 6.2), so the dashboard carries no data payload.
- Theme: the Dashboard does not reference a theme; the template applies its own frontend-owned Theme instance (section 6.2).
- Dashboard response: the consuming product backend answers the dashboard request with one instance of this type, and the Viewer host validates it and runs the layout checks on its embedded layout (`feature-backend-contract` section 6.1; `feature-layout-types` section 6.3).

### 6.2 Theme

**GTS ID**: `gts.frontx.m.dashboard.theme.v1~`

**Description**: Design system theme configuration. Defines all visual styling applied to dashboard widgets — light/dark palettes, typography, chart-type defaults, spacing. The template owns its Theme instance on the frontend; the consuming product backend does not provide it, and the active mode follows the host theme id (ADR-0006).

**Schema**:

```json
{
  "$id": "gts://gts.frontx.m.dashboard.theme.v1~",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "description": "Design system theme configuration. Defines all visual styling applied to dashboard widgets. The template owns one theme instance on the frontend; the theme produces ECharts theme JSON for chart widgets and shadcn CSS variables for UI components. Widget schemas contain only semantic properties — all styling comes from the theme. Both palettes are carried by the template-owned theme instance. The active mode follows the host: the Viewer host maps the host theme id to light or dark through its theme-mode map and supplies the matching palette.",
  "type": "object",
  "required": ["light_palette", "dark_palette", "typography", "chart_defaults"],
  "properties": {
    "light_palette": {
      "type": "object",
      "description": "Color palette for light mode. Used to derive ECharts theme colors and shadcn CSS variables in light mode.",
      "properties": {
"primary": { "type": "string", "description": "Primary brand color (HSL or hex)." },
"secondary": { "type": "string" },
"accent": { "type": "string" },
"background": { "type": "string" },
"foreground": { "type": "string" },
"muted": { "type": "string" },
"destructive": { "type": "string" },
"chart_categorical": {
  "type": "array",
  "items": { "type": "string" },
  "description": "Ordered color palette for categorical chart series."
},
"chart_sequential": {
  "type": "array",
  "items": { "type": "string" },
  "description": "Color ramp for sequential/heatmap data."
},
"row_tints": {
  "type": "object",
  "description": "Grid row tint colors per row_color_by_field palette family; each family maps a row value, matched exactly and case-sensitively on its string form, to a color.",
  "additionalProperties": false,
  "properties": {
    "severity": { "type": "object", "additionalProperties": false, "properties": { "critical": { "type": "string" }, "high": { "type": "string" }, "medium": { "type": "string" }, "low": { "type": "string" }, "info": { "type": "string" } } },
    "status": { "type": "object", "additionalProperties": false, "properties": { "success": { "type": "string" }, "warning": { "type": "string" }, "error": { "type": "string" }, "in_progress": { "type": "string" }, "neutral": { "type": "string" } } },
    "generic": { "type": "object", "additionalProperties": { "type": "string" }, "description": "Optional colors for chosen values; any other value takes the chart_categorical colors in order of first appearance in the rows, wrapping around." }
  }
}
      }
    },
    "dark_palette": {
      "type": "object",
      "description": "Color palette for dark mode. Used to derive ECharts theme colors and shadcn CSS variables in dark mode.",
      "properties": {
"primary": { "type": "string", "description": "Primary brand color (HSL or hex)." },
"secondary": { "type": "string" },
"accent": { "type": "string" },
"background": { "type": "string" },
"foreground": { "type": "string" },
"muted": { "type": "string" },
"destructive": { "type": "string" },
"chart_categorical": {
  "type": "array",
  "items": { "type": "string" },
  "description": "Ordered color palette for categorical chart series."
},
"chart_sequential": {
  "type": "array",
  "items": { "type": "string" },
  "description": "Color ramp for sequential/heatmap data."
},
"row_tints": {
  "type": "object",
  "description": "Grid row tint colors per row_color_by_field palette family; each family maps a row value, matched exactly and case-sensitively on its string form, to a color.",
  "additionalProperties": false,
  "properties": {
    "severity": { "type": "object", "additionalProperties": false, "properties": { "critical": { "type": "string" }, "high": { "type": "string" }, "medium": { "type": "string" }, "low": { "type": "string" }, "info": { "type": "string" } } },
    "status": { "type": "object", "additionalProperties": false, "properties": { "success": { "type": "string" }, "warning": { "type": "string" }, "error": { "type": "string" }, "in_progress": { "type": "string" }, "neutral": { "type": "string" } } },
    "generic": { "type": "object", "additionalProperties": { "type": "string" }, "description": "Optional colors for chosen values; any other value takes the chart_categorical colors in order of first appearance in the rows, wrapping around." }
  }
}
      }
    },
    "typography": {
      "type": "object",
      "properties": {
"font_family": { "type": "string" },
"title_size": { "type": "integer", "description": "Font size in px for widget titles." },
"label_size": { "type": "integer", "description": "Font size in px for axis labels and legends." },
"value_size": { "type": "integer", "description": "Font size in px for KPI card values." }
      }
    },
    "chart_defaults": {
      "type": "object",
      "description": "Per-chart-type visual defaults applied via ECharts registerTheme(). Controls properties that are styling concerns, not semantic widget configuration.",
      "properties": {
"bar_width": { "type": ["integer", "null"] },
"line_smooth": { "type": "boolean" },
"area_opacity": { "type": "number", "minimum": 0, "maximum": 1 },
"scatter_symbol_size": { "type": "integer" },
"scatter_symbol_shape": { "type": "string", "enum": ["circle", "rect", "triangle"] },
"pie_label_position": { "type": "string", "enum": ["inside", "outside", "center"] },
"animation_enabled": { "type": "boolean" },
"animation_duration_ms": { "type": "integer" }
      }
    },
    "spacing": {
      "type": "object",
      "properties": {
"widget_padding": { "type": "integer", "description": "Inner padding in px for widget containers." },
"grid_gap": { "type": "integer", "description": "Gap in px between layout cells." }
      }
    }
  }
}
```

**Cross-references**:
- No abstract base (flat single-segment chain).
- Row tints: the `grid` kind's `row_color_by_field` takes row colors from `row_tints` of the active palette, and for the `generic` family also from `chart_categorical`; a value with no color there shows no tint (`feature-widget-catalog` section 6.5).

## 7. Acceptance Criteria

- [ ] Every concrete listed in this feature is authored with its full schema
- [ ] Every concrete passes GTS identifier grammar and GTS v0.17 schema validation, including the `x-gts-instance-ref` operand of `id`
- [ ] Every type identifier ends with `~`, every instance identifier does not, and every identifier carries `v1`
- [ ] `cfs validate --artifact` on this file reports PASS
- [ ] The Theme instance is template-owned frontend content and is not part of the dashboard
- [ ] Both palettes of the Theme schema declare the optional `row_tints`, keyed by `severity` (`critical`, `high`, `medium`, `low`, `info`), `status` (`success`, `warning`, `error`, `in_progress`, `neutral`), and `generic` (any value), each mapping a value to a color
- [ ] The Dashboard schema requires `id`, `name`, and `layout`, embeds `layout` as an object, declares only `id`, `name`, `description`, and `layout`, and declares no `theme` or `report` field
- [ ] A dashboard whose cells each embed one widget instance with its `id`, `title`, presentation configuration, and `params`, and which carries no widget data, validates against the Dashboard type
