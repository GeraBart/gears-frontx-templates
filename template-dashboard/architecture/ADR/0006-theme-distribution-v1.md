---
status: accepted
date: 2026-10-23
decision-makers: template-dashboard architecture maintainers
---

# ADR-0006: Theme distribution

**ID**: `cpt-frontx-dashboard-adr-theme-distribution`

<!-- toc -->

- [Context and Problem Statement](#context-and-problem-statement)
- [Decision Drivers](#decision-drivers)
- [Considered Options](#considered-options)
- [Decision Outcome](#decision-outcome)
  - [Consequences](#consequences)
  - [Confirmation](#confirmation)
- [Pros and Cons of the Options](#pros-and-cons-of-the-options)
  - [Template-owned theme instance on the frontend, projected at runtime by the Viewer host](#template-owned-theme-instance-on-the-frontend-projected-at-runtime-by-the-viewer-host)
  - [Theme instance supplied by the backend and referenced by the dashboard](#theme-instance-supplied-by-the-backend-and-referenced-by-the-dashboard)
  - [Pre-generated CSS and ECharts JSON supplied by a backend](#pre-generated-css-and-echarts-json-supplied-by-a-backend)
  - [Separate theme bundle delivered as its own artifact](#separate-theme-bundle-delivered-as-its-own-artifact)
- [More Information](#more-information)
- [Traceability](#traceability)

<!-- /toc -->

## Context and Problem Statement

A dashboard needs a look: color palettes for light and dark modes, typography, chart styling defaults, and spacing. The look must reach two targets: shadcn/ui components, which read CSS variables, and ECharts charts, which read a registered ECharts theme. Widgets run as separate MFE instances and must follow theme changes without a reload (see `cpt-frontx-dashboard-fr-theme`). FrontX isolates each MFE instance and shares no singletons (FrontX ADR-0011), so each chart widget evaluates its own copy of ECharts (see [ADR-0004](0004-charting-library-v1.md)). An ECharts theme registered in the Viewer host would therefore never reach a chart.

The earlier DevExpert prototype embedded the theme inside a generated report and projected it at runtime in the Viewer. The template has no report, and the backend returns only the dashboard definition: the dashboard with its embedded layout and widget configurations, with no theme ([ADR-0011](0011-backend-delivered-dashboard-v1.md)). The theme is a GTS instance of `gts.frontx.m.dashboard.theme.v1~`.

Where does the theme come from, how does it reach the Viewer host and its widgets, and where is it projected into styling?

Scope: the source of the theme, which component projects it, and how it reaches the modal container and its `modal_panel` widgets. Out of scope: theme authoring, theme inheritance, the internal structure of the theme type, and how the template ships the theme instance (DESIGN).

## Decision Drivers

* One contract: the same theme type is used wherever a theme is defined, with no second stored or generated "resolved" format.
* The theme is part of the template: the backend supplies dashboard definitions and widget data only (ADR-0011).
* Per-instance isolation: each chart widget has its own ECharts copy, so the ECharts theme must be registered inside the chart widget, not in the Viewer host.
* CSS variables are inherited through the Shadow DOM boundaries of mounted widgets, so one projection in the Viewer host reaches the shadcn components of every widget mounted inside the Viewer host.
* Light and dark mode must follow the host application theme, which the host's theme shared property identifies by theme id only, and both palettes must be available so the mode can switch locally.
* Widgets are isolated MFE instances and need a defined way to receive the theme.
* A theme change must reach every mounted widget without a reload.

## Considered Options

* Template-owned theme instance on the frontend, projected at runtime by the Viewer host
* Theme instance supplied by the backend and referenced by the dashboard
* Pre-generated CSS and ECharts JSON supplied by a backend
* Separate theme bundle delivered as its own artifact

## Decision Outcome

Chosen option: "Template-owned theme instance on the frontend, projected at runtime by the Viewer host", because the theme is part of the template, it keeps one GTS contract, it needs no backend support and no extra request, and it puts each projection where its target lives under per-instance isolation.

The decision has these parts:

1. **Theme owned by the template.** The template owns its theme on the frontend: a `gts.frontx.m.dashboard.theme.v1~` instance with a light and a dark palette. The backend does not supply it, and the dashboard does not reference it. A consumer changes the look by changing the template's theme instance. How the template ships the instance is described in the DESIGN.
2. **Validation.** The theme instance is a GTS instance and is validated against its type like the other catalog instances ([ADR-0003](0003-shared-data-types-and-schemas-v1.md)).
3. **Mode precedence.** Light or dark mode follows the host application theme. The host's theme shared property carries only the host theme id and no mode, so the template derives the mode itself: it owns a map from host theme id to mode (`light` or `dark`), with a documented extension point through which a consumer adds the modes of its own host themes, the same approach that `template-mfe` takes for its kit themes, without a dependency on `template-mfe`. A host theme id that is not in the map resolves to `light` and surfaces a diagnostic. The template does not read any other property of the host theme. The theme instance does not choose the mode. It supplies the palette for the active mode, and it carries both palettes, so the mode switches locally.
4. **CSS projection in the Viewer host.** The Viewer host projects the palette of the active mode to CSS variables on its root. CSS variables are inherited through the Shadow DOM boundaries of mounted widgets, so the shadcn components in every widget read them. The Viewer host does not import ECharts.
5. **Delivery to widgets.** The Viewer host delivers the theme to widgets through the theme shared property. The property carries the palette for the active mode, including the chart colors and chart styling defaults the theme declares for that mode, plus the active mode (`light` or `dark`).
6. **ECharts theme in each chart widget.** Each chart widget instance registers its own ECharts theme with the neutral name `frontx-dashboard` from the theme shared property, in its own ECharts copy (see [ADR-0004](0004-charting-library-v1.md)). It registers the theme again and re-renders when the property changes.
7. **Switch trigger.** A change of the host theme id in the host's theme shared property triggers a switch. The Viewer host maps the new id to its mode, takes the palette for that mode, rewrites the CSS variables, and updates the theme shared property. Mounted widgets follow the property without a reload.
8. **Modal container and `modal_panel` widgets.** The modal container (ADR-0007) renders in the host modal domain, outside the Viewer host's DOM, so the Viewer host's CSS variables do not reach it. The container is part of the template and uses the same template-owned theme. It derives the mode from the host theme id in the host modal domain's theme shared property through the same theme-id map, projects the palette of that mode to CSS variables on its root, and provides the mode and palette to its `modal_panel` widgets through their theme shared property. It follows mode switches while the modal is open.

### Consequences

* Good, because one GTS type is used for the theme everywhere. The shared property carries the slice of that type for the active mode, not a separate generated schema.
* Good, because the theme instance is schema-validated through GTS.
* Good, because the backend needs no theme support, and the theme costs no request and has no network failure path.
* Good, because the modal container takes the palette from the same template-owned theme, so the modal looks like the dashboard without any delivery from the Viewer host.
* Good, because light and dark switching needs no extra load, and the mode follows the host application through the template's theme-id map, so the host's theme shared property needs to carry nothing beyond the theme id.
* Good, because projection is small: palette entries become CSS variables in the Viewer host and the modal container, and each chart widget maps the delivered chart colors and defaults into one ECharts theme registration.
* Good, because the ECharts theme is registered in the ECharts copy that actually draws the chart, so it works under per-instance isolation.
* Good, because the Viewer host has no ECharts dependency, so its bundle does not carry ECharts.
* Good, because the theme shared property gives isolated widget instances a single standard way to follow theme changes.
* Bad, because every dashboard of one installation shares the template's theme; a per-dashboard look is not possible.
* Bad, because the Viewer host and the modal container must contain the CSS projection logic and know the structure of the theme type. Mitigation: the logic is small and lives in one module that both use.
* Bad, because every chart widget instance repeats the ECharts theme registration. Mitigation: the mapping is one small helper in the widget package, and the per-instance cost is minor next to evaluating ECharts itself.
* Bad, because a consumer that wants a custom look must change the template's theme instance of this type.
* Bad, because the template's theme-id map must list every host theme; a consumer that adds host themes must declare their modes through the extension point. Mitigation: the extension point is documented in the consumer guide.

### Confirmation

Confirmed by code review and by tests:

* The template ships its theme as a `gts.frontx.m.dashboard.theme.v1~` instance on the frontend; the dashboard definition from the backend carries no theme and no theme reference, and no report or embedded copy exists.
* The theme instance passes GTS validation against its type.
* The Viewer host projects the active palette to CSS variables, and a mounted widget's shadcn components read them through the Shadow DOM boundary.
* The Viewer host package has no ECharts dependency; `registerTheme` runs inside chart widgets.
* Each chart widget instance registers its ECharts theme from the theme shared property and re-renders when the property changes.
* Changing the host theme id updates the CSS variables and the theme shared property, and a mounted widget reflects the change without a reload.
* The mode comes from the template's theme-id map: a test maps each shipped host theme id to its mode, and a consumer theme id added through the extension point maps to the mode it declares.
* A host theme id that is not in the map resolves to `light` and surfaces a diagnostic, checked by a test.
* A widget mounted in the modal container's `modal_panel` shows the template palette of the active mode and follows a light/dark switch, checked by a test.
* The ECharts theme is registered as `frontx-dashboard`; no prototype-specific theme name appears in code or configuration.

## Pros and Cons of the Options

### Template-owned theme instance on the frontend, projected at runtime by the Viewer host

The template ships the theme instance. The Viewer host projects it to CSS variables and delivers it to widgets through the theme shared property; the modal container does the same for its `modal_panel`. Chart widgets register the ECharts theme from that property.

* Good, because there is one contract and one validated instance.
* Good, because the theme needs no backend support and no request.
* Good, because each projection runs where its target lives: CSS variables in the Viewer host and the modal container, the ECharts theme inside each chart widget.
* Good, because both modes are available locally.
* Neutral, because projection is a small piece of code.
* Bad, because all dashboards of one installation share one theme.

### Theme instance supplied by the backend and referenced by the dashboard

The dashboard instance refers to a theme instance that the backend supplies with the dashboard. This was the previous choice of this record.

* Good, because each dashboard could carry its own look.
* Bad, because every consumer backend must store and serve the theme, although the look belongs to the frontend.
* Bad, because a missing or broken theme reference needs a fallback palette and a diagnostic path.
* Bad, because the modal container, outside the Viewer host, would need the backend-supplied palette delivered to it.

### Pre-generated CSS and ECharts JSON supplied by a backend

A backend resolves the theme into CSS and ECharts JSON and sends both.

* Good, because the Viewer host becomes a plain applier.
* Bad, because the theme would exist in two formats that must be kept in sync.
* Bad, because the template has no generation step, so every consumer backend would have to implement the projection.
* Bad, because the generated output is not GTS-validated.

### Separate theme bundle delivered as its own artifact

The theme is a standalone artifact, cached apart from other data.

* Good, because the theme can change without touching other data.
* Bad, because a theme is only a few KB, so the caching gain is negligible.
* Bad, because it adds an extra fetch and a second failure point, and a new type adds no domain value.

## More Information

* **Revision.** Revised on 2026-10-23 for the render-only scope ([ADR-0011](0011-backend-delivered-dashboard-v1.md)). Revised again on 2026-10-23: the theme is owned by the template on the frontend instead of being supplied by the backend and referenced by the dashboard, and the modal container uses the same theme. The previous choice is kept above as a rejected option. The revised decision is accepted.
* Related ADRs: [ADR-0004](0004-charting-library-v1.md) (charting library; each chart widget evaluates its own ECharts and registers the theme there), [ADR-0007](0007-extension-domain-taxonomy-v1.md) (modal container).
* Review trigger: revisit if dashboards need different looks within one installation, if projection grows beyond simple palette mapping, if widgets and the Viewer host show divergent styling, if FrontX starts sharing evaluated modules between MFE instances, or if the host's theme shared property starts to carry the mode.
* Scope: changes the Viewer host (CSS projection, theme shared property), the modal container (mode from the host theme id, CSS projection, theme shared property of `modal_panel`) and the chart widgets (ECharts theme registration). Adds the template-owned theme instance, the template-owned theme-id to mode map and its extension point. Does not change the theme type, theme authoring, or the host's theme shared property.
* Checklist applicability:
  * ARCH: applicable, addressed by the decision parts and options.
  * PERF: applicable, the projection is small, the theme needs no request, the Viewer host carries no ECharts, and switching needs no reload.
  * SEC: N/A, because theme data is non-sensitive presentation data with no auth, secrets, or user data.
  * REL: applicable, the theme has no network failure path, and an unknown host theme id falls back to `light` with a diagnostic.
  * DATA: N/A, because the theme is a read-only GTS instance with no persistence or migration in this decision.
  * INT: applicable, the theme shared property is the contract with widgets, and the host theme id is an input.
  * OPS: N/A, because the template is a source overlay with no deployed service; the consuming application owns operations.
  * MAINT: applicable, CSS projection lives in one module shared by the Viewer host and the modal container, and ECharts mapping in one widget helper.
  * TEST: applicable, see Confirmation.
  * COMPL: N/A, because theming processes no regulated data.
  * UX: applicable, visual consistency, the same look in the modal, and live light and dark switching.
  * BIZ: N/A, because this is a technical decision; the product need is traced to the PRD below.

## Traceability

- **PRD**: [PRD.md](../PRD.md)
- **DESIGN**: [DESIGN.md](../DESIGN.md)

This decision directly addresses the following requirements or design elements:

* `cpt-frontx-dashboard-fr-theme` — light and dark themes from the template-owned theme, delivered without a reload to every widget mounted inside the Viewer host, and used by the modal container for its `modal_panel` widgets through the theme shared property.
* `cpt-frontx-dashboard-nfr-visual-quality` — consistent projection of one theme to components and charts.
* `cpt-frontx-dashboard-fr-domain-model` — the theme type is part of the generic type catalog the template ships, and the template's theme is an instance of it.
