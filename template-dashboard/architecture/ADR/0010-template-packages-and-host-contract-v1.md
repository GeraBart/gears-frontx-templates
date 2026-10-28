---
status: accepted
date: 2026-10-27
decision-makers: template-dashboard architecture maintainers
description: "Decision record on how template-dashboard splits into the dashboard-viewer and dashboard-widgets packages, what the manifest channel carries, how a consumer replacement realization ships, how packages are shared and counted against the budget, and what the template requires from the host by role: a screen, a rendered modal domain, and the theme and language shared properties."
---

# ADR-0010: Template packages and host contract

**ID**: `cpt-frontx-dashboard-adr-template-packages-and-host-contract`

<!-- toc -->

- [Context and Problem Statement](#context-and-problem-statement)
- [Decision Drivers](#decision-drivers)
- [Considered Options](#considered-options)
- [Decision Outcome](#decision-outcome)
  - [Consequences](#consequences)
  - [Confirmation](#confirmation)
- [Pros and Cons of the Options](#pros-and-cons-of-the-options)
  - [Two packages on `template-shell`, host contract by role](#two-packages-on-template-shell-host-contract-by-role)
  - [One package per widget type](#one-package-per-widget-type)
  - [Dependency on `template-mfe`](#dependency-on-template-mfe)
  - [Own host application](#own-host-application)
- [More Information](#more-information)
- [Traceability](#traceability)

<!-- /toc -->

## Context and Problem Statement

The dashboard runs inside a consuming product's FrontX application built on `template-shell`. The Viewer host is a nested host inside that application, not an application of its own. The template's code has parts with different roles: the Viewer host with the contracts it owns, and a library of widgets, each widget type with a cell entry, a modal entry, a static extension of the host modal domain, and a widget realization ([ADR-0007](0007-extension-domain-taxonomy-v1.md), [ADR-0008](0008-widget-type-and-mfe-realization-v1.md)). A consuming product may replace how a template widget type is shown (`cpt-frontx-dashboard-fr-replacement-widget`). Dashboard content comes from the consuming product backend at run time ([ADR-0011](0011-backend-delivered-dashboard-v1.md)), so the packages carry only types, instances that describe the MFEs, and code.

The dashboard mounts in two of the shell's extension domains: the host screen domain for the Viewer host and the host modal domain for the larger view. These domains belong to the shell, and their identifiers may change. The shell registers both but renders only the screen domain through a slot today. The shell's bootstrap registers what the manifest channel carries in the shell's registry, which is the only way a static extension of the host modal domain can be admitted. FrontX gives every MFE load its own module graph (FrontX ADR-0011) and reuses the source text of shared packages by content hash (FrontX ADR-0034), which shapes the download size.

How does the template split into packages, what does it depend on, what travels through the manifest channel, how are packages shared and counted, and what does the template require from the host?

## Decision Drivers

* Minimal dependencies: the template depends on `template-shell` and the pinned FrontX packages only, and takes nothing from `template-mfe`.
* Dashboard content is not packaged: it comes from the consuming product backend, so the manifest channel carries no dashboard and no widget data.
* The static modal extensions must reach the shell's registry, and the only path is the host bootstrap reading the manifest channel.
* A consumer replacement realization must ship without changing the template's packages.
* Stability against shell changes: host domain identifiers are resolved from shell constants in code, never typed as literals.
* Per-instance isolation: no package relies on template-owned singletons shared between instances (the FrontX API cache and the gts-plugin type store keep realm-wide state by design), and the download size stays within the budget (`cpt-frontx-dashboard-nfr-bundle-budget`).

## Considered Options

1. **Two packages on `template-shell`, host contract by role** — a Viewer host package and one widget package, a dependency on `template-shell` only, and host requirements stated by role.
2. **One package per widget type** — the Viewer host package plus 9 widget packages, each with its own manifest.
3. **Dependency on `template-mfe`** — build the dashboard on the reference MFE scaffold.
4. **Own host application** — the dashboard ships its own shell.

## Decision Outcome

Chosen option: "Two packages on `template-shell`, host contract by role", because the dashboard runs in the consuming product's existing shell-based application, depends on the shell alone, keeps the widget library one release unit, lets a consumer add a replacement in its own package, and names what it needs from the host by role, so a change of a shell identifier stays contained.

The decision:

* **Dependencies.** The template requires `template-shell` and depends on it and on the FrontX packages it pins to exact published versions, including `@gears-frontx/ui-kit`. It takes nothing from `template-mfe` or from any other template.
* **Packages, split by role.**
  * `dashboard-viewer`: the GTS types the template owns, in the `frontx.m` and `frontx.v` packages: the dashboard, layout and cell types, the widget base and the 9 widget types, the widget data type, the widget realization type, the `set_widget_context` action type, and the `layout_cells` domain with its extension type. It also holds the Viewer host manifest, the Viewer host entry and its screen extension, a routed extension of the shell's screen extension type that uses its `route` field (FrontX ADR-0036), and the reading of the endpoint configuration.
  * `dashboard-widgets`: one Module Federation manifest. Per widget type it declares one cell entry, one modal entry, one static extension of the host modal domain whose `entry` is the modal entry, and one widget realization of weight 1 that names the cell entry and the static modal extension (`cpt-frontx-dashboard-interface-widget-realization`). That is 9 of each, plus the shared widget chrome with the data-request logic. The larger view of a widget type is its modal entry, mounted through its static modal extension ([ADR-0007](0007-extension-domain-taxonomy-v1.md)).
* **Manifest channel.** Each package's `mfe.json` carries GTS types, MFE entries, widget realizations and static extensions: the Viewer host's routed extension and the static modal extensions. Dashboard content, meaning dashboards with their embedded layout and widget instances, and widget data never travel through `mfe.json`; they come from the consuming product backend ([ADR-0011](0011-backend-delivered-dashboard-v1.md)). The shell bootstrap registers the routed extension, the modal entries and the static modal extensions in the shell's registry. The Viewer host's own registry reads the same channel for the types, the cell entries and the widget realizations.
* **Consumer packages.** A consuming product that replaces how a template widget type is shown ships, in its own package, a replacement widget realization with a weight above 1, its own cell entry, its own modal entry and its own static modal extension. The template's packages stay unchanged, and the template's realization for that widget type stays registered but unused. In v1 a consuming product adds no widget types; consumer widget types are a later stage.
* **Shared packages and budget basis.** Every template MFE, the Viewer host screen extension and every cell and modal entry, declares all its packages as shared; FrontX allows this also for stateful packages. FrontX reuses the source text of a shared package across MFE loads by content hash (FrontX ADR-0034), so it is fetched once, while evaluation stays per instance (FrontX ADR-0011). The budget counts transferred gzipped bytes on a cold load of the reference dashboard: the Viewer host with the shared packages it fetches itself, each widget entry with its own code only, and each shared package once in the page total. The provisional figures are in the DESIGN (§3.9) and PRD open question Q1.
* **Host contract by role.** The template names host domains by role: the host screen domain and the host modal domain. TypeScript code resolves their current `template-shell` identifiers from shell framework constants and never writes them as literals. Manifest-declared extensions are data that carry the current identifiers, or are generated from the constants at build time. Requirements on the host:
  * The host screen domain shares theme and language, accepts routed extensions of the shell screen extension type, and mounts one screen at a time.
  * The host modal domain shares theme and language with its occupant, declares the lifecycle actions, has no extension type constraint, so it accepts the static modal extensions as plain extensions, and uses the Optional strategy, so it owns zero or one occupant.
  * The host renders the host modal domain through a domain slot with modal chrome, Close, focus kept inside the modal and dismissal; Close and dismissal unmount the occupant. Current `template-shell` registers this domain but renders no slot for it, so the slot is a prerequisite `template-shell` change tracked outside `template-dashboard` (PRD open question Q2). Without it the dashboard works, but no larger view can be shown.
  * The shell serves the aggregated manifest channel, and its bootstrap registers each package's schemas, manifest, domains, entries and extensions.
  * The theme shared property carries the host theme id, which the template uses unchanged; each MFE maps it to the light or dark scope of `@gears-frontx/ui-kit` ([ADR-0006](0006-theme-distribution-v1.md)). The language shared property is provided.
  * The host session is available to the FrontX API package for the dashboard request and every widget data request.

### Consequences

* Good, because the dashboard runs in any `template-shell`-based application that meets the host requirements; the larger view additionally needs the rendered modal-domain slot.
* Good, because the manifests carry no dashboard content, so a new dashboard needs no package change.
* Good, because the static modal extensions reach the shell's registry through the existing bootstrap, with no runtime registration by the template.
* Good, because a consumer replacement is a separate package with a higher weight, so the template's packages stay unchanged.
* Good, because role-based references in code survive a rename of shell domain identifiers; only the constant lookup tracks it.
* Good, because declaring every package as shared lets FrontX fetch each shared package once, and the budget counts it once.
* Bad, because the static modal extensions are manifest data that carry the host modal domain identifier, so they must follow `template-shell` identifier changes unless they are generated from the constants at build time.
* Bad, because the larger view depends on a host prerequisite that current `template-shell` does not meet: a rendered modal-domain slot with modal chrome, focus trap and dismissal, delivered by a shell change outside this template.
* Bad, because widgets cannot share module singletons: each MFE instance evaluates its own copy of every package (FrontX ADR-0011). Source reuse saves fetches, not evaluation; the evaluation cost falls under the initial-render budget, and [ADR-0004](0004-charting-library-v1.md) records the per-instance cost of the charting library.
* Neutral, because the 9 widget types share one manifest and one package, so they are released together.

### Confirmation

Confirmed when:

* A dependency check finds that the template's packages depend on `template-shell` and the pinned FrontX packages only, and on nothing from `template-mfe`.
* A grep over template TypeScript code finds no literal host domain identifier; they come from shell framework constants.
* The `dashboard-widgets` manifest declares exactly 9 cell entries, 9 modal entries, 9 static modal extensions and 9 widget realizations of weight 1, and every realization names a cell entry and a static modal extension of that manifest.
* No package's `mfe.json` contains a dashboard, a widget instance or widget data.
* A fixture consumer package with a replacement realization of weight 2 wins for its widget type in the cell and in the larger view, without a change to the template's packages.
* The Viewer host mounts in the host screen domain through its route; on a host that renders the modal-domain slot, a static modal extension mounts in the host modal domain with theme and language, and the open modal shows modal chrome, traps focus and closes on dismissal.
* Every template MFE declares all its packages as shared, and every declared package passes the package-wide license check.
* Transferred gzipped bytes on a cold load of the reference dashboard are measured and checked against the provisional figures of `cpt-frontx-dashboard-nfr-bundle-budget` in the DESIGN (§3.9), with each shared package counted once.

## Pros and Cons of the Options

### Two packages on `template-shell`, host contract by role

* Good, because the dashboard runs in the consuming product's existing shell-based application and depends on the shell alone.
* Good, because the packages are split by role: the Viewer host with its contracts, and the widget library as one release unit.
* Good, because a consumer replacement ships as its own package next to them.
* Good, because naming host domains by role keeps shell identifier changes out of template code.
* Bad, because it relies on the host contract holding, including a modal-domain slot that current `template-shell` does not render.

### One package per widget type

* Good, because each widget type could be released and versioned on its own.
* Bad, because the template would ship 9 manifests and 9 package configurations that change together, since all widget types share one widget chrome.
* Bad, because a consumer would install and keep in step more packages for no product gain; replacing one widget type already works through a consumer package.

### Dependency on `template-mfe`

* Good, because it provides a working MFE scaffold to copy from.
* Bad, because the dashboard would make consuming products carry an example package set they do not need.
* Bad, because it ties the dashboard's release to the scaffold's version and ownership.

### Own host application

* Good, because the dashboard controls its domains and has no host contract.
* Bad, because consuming products already have a shell and would have to run two applications or migrate.
* Bad, because it duplicates what `template-shell` provides, including the host modal area.

## More Information

* [ADR-0007](0007-extension-domain-taxonomy-v1.md) decides the `layout_cells` domain and the static modal extensions that this record packages; [ADR-0008](0008-widget-type-and-mfe-realization-v1.md) decides the widget realization type and its precedence; [ADR-0006](0006-theme-distribution-v1.md) decides the theme input; [ADR-0011](0011-backend-delivered-dashboard-v1.md) decides that the dashboard definition and each widget's data come from the consuming product backend.
* Related FrontX records (FrontX's own decisions, not this template's ADRs): FrontX ADR-0011 (per-load isolation), FrontX ADR-0034 (shared-dependency source-text reuse by content hash), FrontX ADR-0036 (extension routing).
* **Review trigger:** revisit if `template-shell` stops exposing its domain constants, stops serving the manifest channel or stops accepting plain extensions in its modal domain; if the shell change that renders the modal-domain slot is rejected or takes a different form; if consumer widget types move into scope; or if measured sizes cannot meet the bundle budget.
* **Scope:** how the template splits into packages, what it depends on, what the manifest channel carries, how a consumer replacement ships, how packages are shared and counted, and what the template requires from the host.
* **Checklist applicability:** ARCH applicable and addressed above. INT applicable: the host contract by role and the manifest channel. MAINT applicable: one template dependency, role-based host references in code, and manifest data that carries host identifiers. PERF applicable: shared packages and the budget basis, checked in Confirmation. TEST applicable: dependency, manifest, replacement and size checks in Confirmation. UX applicable in one respect: modal chrome, focus trap and dismissal are a host requirement on the rendered modal-domain slot. SEC not applicable because isolation is decided in FrontX ADR-0011 and no credential is involved. OPS, REL, DATA, COMPL and BIZ not applicable because the package split decides no operational procedure, runtime failure handling, stored data, regulated processing or business rule.

## Traceability

- **PRD**: [PRD.md](../PRD.md)
- **DESIGN**: [DESIGN.md](../DESIGN.md)

This decision directly addresses the following requirements or design elements:

* `cpt-frontx-dashboard-fr-viewer-host` — the `dashboard-viewer` package with the routed Viewer host in the host screen domain.
* `cpt-frontx-dashboard-fr-widget-catalog` — the `dashboard-widgets` package with one manifest and, per widget type, a cell entry, a modal entry, a static modal extension and a widget realization.
* `cpt-frontx-dashboard-fr-replacement-widget` — a consumer replacement realization with its own entries and static modal extension ships in its own package.
* `cpt-frontx-dashboard-interface-widget-realization` — the template's realizations of weight 1 and a consumer replacement above 1 travel through the manifest channel.
* `cpt-frontx-dashboard-contract-host-areas` — the host contract by role, including the rendered modal-domain slot and the theme and language shared properties.
* `cpt-frontx-dashboard-fr-widget-modal` — the larger view requires the host modal-domain slot and the static modal extensions registered by the host bootstrap.
* `cpt-frontx-dashboard-fr-backend-source` — dashboard content comes from the consuming product backend, not from the manifests.
* `cpt-frontx-dashboard-constraint-shell-only-dependency` — the template depends on `template-shell` and the pinned FrontX packages only.
* `cpt-frontx-dashboard-constraint-role-based-host-ids` — host domains are named by role and resolved from shell constants in code.
* `cpt-frontx-dashboard-nfr-compatibility` — compatibility with the shell and the current stable FrontX release.
* `cpt-frontx-dashboard-nfr-bundle-budget` — every MFE declares all its packages as shared; transferred gzipped bytes, per-widget own code, shared packages counted once.
* `cpt-frontx-dashboard-topology-overlay-packages` — the two package subtrees and a consumer's replacement package.
* `cpt-frontx-dashboard-actor-host-application` — the host that must meet the listed requirements.
