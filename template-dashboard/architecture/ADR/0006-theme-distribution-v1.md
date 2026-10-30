---
status: accepted
date: 2026-10-29
decision-makers: template-dashboard architecture maintainers
description: "Decision record for where the dashboard's look comes from and how a theme change reaches every template MFE: the host's theme shared property, whose value is the host theme id, used unchanged, with @gears-frontx/ui-kit in every MFE and chart themes built from kit tokens inside each chart widget."
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
  - [Host theme shared property used unchanged, with ui-kit in every MFE](#host-theme-shared-property-used-unchanged-with-ui-kit-in-every-mfe)
  - [Template-owned theme instance with light and dark palettes](#template-owned-theme-instance-with-light-and-dark-palettes)
  - [Theme instance supplied by the backend and referenced by the dashboard](#theme-instance-supplied-by-the-backend-and-referenced-by-the-dashboard)
  - [Pre-generated CSS and chart theme JSON supplied by a backend](#pre-generated-css-and-chart-theme-json-supplied-by-a-backend)
  - [Separate theme bundle delivered as its own artifact](#separate-theme-bundle-delivered-as-its-own-artifact)
- [More Information](#more-information)
- [Traceability](#traceability)

<!-- /toc -->

## Context and Problem Statement

A dashboard must render in a light and in a dark theme, follow the host's theme, and look like the rest of the host application (`cpt-frontx-dashboard-fr-theme`, `cpt-frontx-dashboard-nfr-visual-quality`). The template's UI is spread over several isolated MFE instances: the dashboards root, the cell widgets that it mounts in `layout_cells`, and the larger-view widgets that the larger-view modal mounts in its nested `larger_view` domain. The larger-view modal is a static extension of the shell's `popup` domain, outside the dashboards root ([ADR-0007](0007-extension-domain-taxonomy-v1.md)). The dashboards root is whatever hosts the dashboards: a screen extension, or code copied into the shell of a single-page application. FrontX isolates every MFE instance: each MFE instance evaluates its own copy of its code (FrontX ADR-0011), so no theme object or style code is held in common between them, and each chart widget evaluates its own copy of ECharts ([ADR-0004](0004-charting-library-v1.md)).

The host already provides a theme input: its theme shared property `gts.frontx.mfes.comm.shared_property.v1~frontx.mfes.comm.theme.v1~`, whose value is the host theme id, updated on every theme change. The FrontX design system `@gears-frontx/ui-kit` provides components and tokens in a light and a dark scope. The dashboard arrives through the data adapter ([ADR-0011](0011-data-adapter-v1.md)) and carries no theme.

Where does the dashboard's look come from, how does a theme reach every template MFE, in a cell and in the larger view, and how does a theme switch reach them without a reload?

## Decision Drivers

* The template has no theme of its own: the dashboard follows the host's light or dark theme and uses the host's design-system look (`cpt-frontx-dashboard-fr-theme`).
* One theme input that reaches the cells and the larger view in the same way, although the larger view is mounted outside the dashboards root.
* Per-instance isolation: each MFE styles itself, and each chart widget registers its chart theme in its own ECharts copy.
* A theme switch reaches every mounted widget and an open larger view without a reload, without a request and without showing loading states again.
* A consumer replacement widget realization can follow the host theme in the same way as a template widget (`cpt-frontx-dashboard-fr-replacement-widget`).
* No data adapter involvement: the dashboard carries no theme and references none.
* As few template-owned contracts as possible: every GTS type the template owns must be versioned and frozen.

## Considered Options

* Host theme shared property used unchanged, with ui-kit in every MFE
* Template-owned theme instance with light and dark palettes
* Theme instance supplied by the backend and referenced by the dashboard
* Pre-generated CSS and chart theme JSON supplied by a backend
* Separate theme bundle delivered as its own artifact

## Decision Outcome

Chosen option: "Host theme shared property used unchanged, with ui-kit in every MFE", because it gives the dashboard the host's look, reaches the cells and the larger view through the standard FrontX shared-property channel, adds no template-owned theme contract, and needs no backend support.

The decision has these parts:

1. **One theme input.** The template's only theme input is the host's theme shared property `gts.frontx.mfes.comm.shared_property.v1~frontx.mfes.comm.theme.v1~`. Its value is the host theme id, which the template uses unchanged. The template reads no other property of the host theme.
2. **Delivery to every MFE.** The dashboards root obtains the host theme id (through its bridge when it is a screen extension, or from the shell when it is shell code) and publishes the same value, unchanged, as the theme shared property of `layout_cells`. The larger-view modal, a static extension of the shell's `popup` domain, receives the property from that domain and publishes it, with the language, on its nested `larger_view` domain. Both `layout_cells` and `larger_view` share the theme and language shared properties, and every widget entry, in a cell and in the larger view, requires them.
3. **The look comes from ui-kit.** Every template MFE, the dashboards root, the larger-view modal and every widget entry, in a cell and in the larger view, uses `@gears-frontx/ui-kit`. The kit has two scopes, light and dark, and each host theme maps onto one of them. Each MFE maps the host theme id to one of the two scopes through a small helper, the same approach that `template-mfe` takes, without a dependency on `template-mfe`. The helper is placed per package: `dashboard` and `widgets` each hold a copy. Every color, font and spacing value comes from kit tokens of that scope, and no widget carries manual styling.
4. **Chart themes in each chart widget.** Each chart widget instance builds its ECharts theme `frontx-dashboard` from the kit tokens of the active scope and registers it in its own ECharts copy. It builds and registers it again on every theme change ([ADR-0004](0004-charting-library-v1.md)).
5. **Grid row coloring.** The `grid` widget type colors rows with kit tokens of the active scope. Row colouring is keyed by a query member whose value names a row colour token, so row colors adapt to light and dark like every other color ([ADR-0005](0005-data-grid-library-v1.md)).
6. **Theme switch.** A theme switch is a shared-property change only. The host updates the property; the dashboards root maps the new id for its own chrome and publishes the same value on `layout_cells`; the larger-view modal receives the new value from the shell's `popup` domain and publishes it on `larger_view`; each widget selects the new kit scope, and chart widgets re-register their chart theme. Nothing is fetched, no widget requests its data again, and nothing is remounted.
7. **No template theme.** The template defines no theme type, no theme instance, no palettes or row tints, no theme-id-to-mode map with a consumer extension point, and no CSS-variable projection. The dashboard references no theme.

### Consequences

* Good, because the dashboard looks like the host application; there is no second look to keep in step with the host's design system.
* Good, because one input reaches the cells and the larger view in the same way: the larger-view modal, mounted outside the dashboards root, receives the property from the shell's `popup` domain and publishes it on `larger_view`.
* Good, because the template owns no theme contract: no type to version and freeze, no instance to validate, and nothing in the dashboard.
* Good, because the data adapter needs no theme support, and the theme costs no request and has no network failure path.
* Good, because a theme switch is a property change: no reload, no request and no loading states.
* Good, because a consumer replacement realization follows the host theme with the same property and the same kit, with no template-specific theme interface.
* Good, because the dashboards root has no ECharts dependency; chart themes live only in chart widgets.
* Bad, because a consuming product cannot give the dashboard a look of its own that differs from the host's design system, and all dashboards share that look.
* Bad, because chart colors and grid row colors are limited to what the kit tokens offer in each scope.
* Bad, because every MFE repeats the scope mapping, and every chart widget instance repeats the chart theme building. Mitigation: both are one small helper per package, and the per-instance cost is minor next to evaluating ECharts itself.
* Bad, because the dark-theme set is enumerated per package copy of the helper, and it must gain an entry when the host adds a dark theme.
* Bad, because an unknown theme id falls back to the light scope.
* Neutral, because every MFE evaluates its own copy of the kit (FrontX ADR-0011); the kit is a shared dependency, so its source text is fetched once only when every template MFE publishes the same `contentHash` for it (FrontX ADR-0034), with realm-wide reach (FrontX ADR-0035), and it is counted once in the page total ([ADR-0010](0010-template-packages-and-host-contract-v1.md)).

### Confirmation

Confirmed by design review, tests and inspection:

* Design review finds no theme type, theme instance, palette, row tint, theme-id map with an extension point or CSS-variable projection in the template packages, and no theme field or theme reference in the dashboard types.
* A test checks that the dashboards root publishes on `layout_cells` exactly the value that it reads from the host's theme shared property, and publishes the new value on every change.
* A test checks that a widget in the larger view receives the theme from the larger-view modal and follows a light and dark switch while the larger view is open.
* A test checks that every template MFE selects the kit's light or dark scope for each host theme id that `template-shell` ships.
* A test checks that an unrecognised theme id selects the light scope.
* A test checks that each chart widget registers `frontx-dashboard` built from kit tokens and registers it again on a theme change; a dependency check finds no ECharts dependency in the dashboards root package.
* A test switches the theme on the open reference dashboard and checks that no request is sent, no loading state is shown again, and the dashboard position and an open larger view are kept.
* Design inspection of all 9 widget types in both scopes, in a cell and in the larger view, against the design-system reference (`cpt-frontx-dashboard-nfr-visual-quality`).

## Pros and Cons of the Options

### Host theme shared property used unchanged, with ui-kit in every MFE

The template takes the host theme id from the host's theme shared property and forwards it unchanged. Every MFE maps it to the kit's light or dark scope and styles itself with kit tokens; chart widgets build their chart theme from the same tokens.

* Good, because the look is the host's, in both modes, with nothing template-specific to maintain.
* Good, because cells and the larger view use the same FrontX channel.
* Good, because it adds no GTS contract and needs no backend.
* Neutral, because every MFE carries a small scope-mapping helper.
* Bad, because a template-specific or per-dashboard look is not possible.
* Bad, because the helper knows only the light and dark kit scopes, so a host theme beyond them maps onto one of the two.

### Template-owned theme instance with light and dark palettes

The template ships a GTS theme instance with a light and a dark palette, chart defaults and row tints. It maps the host theme id to a mode through its own map with a consumer extension point, projects the active palette to CSS variables in the dashboards root, and passes the palette to widgets in its theme shared property.

* Good, because the template controls its look independently of the host.
* Bad, because the dashboard would have a second look next to the host's design system, which the PRD rules out.
* Bad, because it adds a theme type and instance that must be versioned, validated and frozen, and a mode map that every consumer must extend for its host themes, a cost the host-theme option also has in its small helper but without a consumer extension point.
* Bad, because the CSS projection in the dashboards root does not reach the larger view, which is mounted outside the dashboards root, so a second projection would be needed there.
* Bad, because the theme shared property of `layout_cells` would carry a palette, not the host theme id, so widgets could not use the same input in a cell and in the larger view.

### Theme instance supplied by the backend and referenced by the dashboard

The dashboard instance refers to a theme instance that the backend supplies with the dashboard.

* Good, because each dashboard could carry its own look.
* Bad, because every consuming product backend must store and serve a theme, although the look belongs to the host's frontend.
* Bad, because a missing or broken theme reference needs a fallback and a diagnostic path.
* Bad, because the larger view, outside the dashboards root, would need the backend-supplied theme delivered to it.

### Pre-generated CSS and chart theme JSON supplied by a backend

A backend resolves the theme into CSS and ECharts JSON and sends both.

* Good, because the dashboards root would only apply what it receives.
* Bad, because the theme would exist in several formats that must be kept in step with the host's design system.
* Bad, because every consuming product backend would have to implement the generation.
* Bad, because it adds a request and a failure path to something the host already provides.

### Separate theme bundle delivered as its own artifact

The theme is a standalone artifact, fetched apart from the template's code.

* Good, because the theme could change without a template release.
* Bad, because it duplicates what the host's theme and the kit already provide.
* Bad, because it adds a fetch and a second failure point.

## More Information

* Related ADRs: [ADR-0004](0004-charting-library-v1.md) (each chart widget builds and registers its chart theme from kit tokens), [ADR-0005](0005-data-grid-library-v1.md) (grid row coloring with kit tokens), [ADR-0007](0007-extension-domain-taxonomy-v1.md) (`layout_cells` and `larger_view` share theme and language), [ADR-0010](0010-template-packages-and-host-contract-v1.md) (the theme shared property in the host contract; shared dependencies and the budget basis).
* Review trigger: revisit if the host's theme shared property changes its meaning or starts to carry more than the host theme id, if the kit's scope model changes, if consuming products need a dashboard look that differs from the host's design system, or if FrontX stops isolating MFE instances (FrontX ADR-0011).
* Scope: decides the theme input, how it reaches every template MFE, where the look comes from, and how a theme switch propagates. The kit's tokens and the host's theme catalog are owned by FrontX and `template-shell`. The exact scope mapping is specified in the FEATURE documents.
* Checklist applicability:
  * ARCH: applicable, addressed by the decision parts and options.
  * PERF: applicable, the theme needs no request, the dashboards root carries no ECharts, and a switch needs no reload.
  * SEC: N/A, because the theme id is non-sensitive presentation data with no auth, secrets or user data.
  * REL: applicable, the theme has no network failure path.
  * DATA: N/A, because no theme data is stored or defined by the template.
  * INT: applicable, the host's theme shared property is the contract with the host, and the same property is the contract with every widget.
  * OPS: N/A, because the template has no deployed service; the consuming product owns operations.
  * MAINT: applicable, the scope mapping and the chart theme building are one helper each, held per package.
  * TEST: applicable, see Confirmation.
  * COMPL: N/A, because theming processes no regulated data.
  * UX: applicable, the host's look in both modes, the same look in the larger view, and live light and dark switching.
  * BIZ: N/A, because this is a technical decision; the product need is traced to the PRD below.

## Traceability

- **PRD**: [PRD.md](../PRD.md)
- **DESIGN**: [DESIGN.md](../DESIGN.md)

This decision directly addresses the following requirements or design elements:

* `cpt-frontx-dashboard-fr-theme` — the dashboard follows the host's light or dark theme and the host's design-system look, and a switch reaches every widget and the larger view without a reload.
* `cpt-frontx-dashboard-nfr-visual-quality` — every MFE styles itself with ui-kit tokens of one scope, and chart themes and grid row colors use the same tokens.
* `cpt-frontx-dashboard-fr-replacement-widget` — a replacement realization follows the host theme through the same property and kit.
* `cpt-frontx-dashboard-fr-domain-model` — the domain model has no theme type, and the dashboard references no theme.
* `cpt-frontx-dashboard-contract-host-areas` — the host provides the theme shared property to the host screen domain and the shell's `popup` domain, and the larger-view modal passes it on.
* `cpt-frontx-dashboard-seq-theme-switch` — the theme switch as a shared-property change only.
* `cpt-frontx-dashboard-component-widget-library` — every widget entry, in a cell and in the larger view, maps the host theme id to the kit scope; chart widgets build their chart theme from kit tokens.
