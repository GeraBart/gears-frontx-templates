---
status: accepted
date: 2026-10-30
decision-makers: template-dashboard architecture maintainers
description: "Decision record on how template-dashboard splits into the dashboard and widgets packages, what the manifest channel carries, how the template serves its own file of GTS types and instances, where the dashboards root and the larger-view modal run, how template schemas are registered, how a consumer replacement realization ships, how shared dependencies are fetched and counted against the budget, and what the template requires from the shell by role: an abstract hosting place, a modal container for the shell's `popup` domain, and the theme and language shared properties."
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
  - [Dashboards root only as a screen extension](#dashboards-root-only-as-a-screen-extension)
- [More Information](#more-information)
- [Traceability](#traceability)

<!-- /toc -->

## Context and Problem Statement

The dashboard runs inside a consuming product's FrontX application built on `template-shell`. The template is a blueprint: the product copies it into its project and modifies it. The template's code has parts with different roles: the dashboards root, which owns the `layout_cells` domain and hosts the dashboards; the larger-view modal, which shows larger views; and a library of widgets, each widget type with one MFE entry, and one widget realization per widget type ([ADR-0007](0007-extension-domain-taxonomy-v1.md), [ADR-0008](0008-widget-type-and-mfe-realization-v1.md)). The dashboards root and the larger-view modal call the product's data adapter through an interface that the template defines ([ADR-0011](0011-data-adapter-v1.md)). A consuming product may replace how a template widget type is shown (`cpt-frontx-dashboard-fr-replacement-widget`). The template has no backend access of its own, so the packages carry only types, MFE entries and code, and the template serves one JSON file of GTS types and instances that are not part of an MFE manifest, starting with the widget realizations.

The **dashboards root** is whatever hosts the dashboards: a screen extension, or code copied into the shell of a single-page application that has no screen domain. The template stays abstract about which. The **larger-view modal** is the static, routed modal window extension of the shell's `popup` domain that shows larger views ([ADR-0007](0007-extension-domain-taxonomy-v1.md)). The `popup` domain belongs to the shell, and its identifier may change. A static extension of the `popup` domain can be admitted only through the shell's registry, which is filled by the shell's bootstrap from the manifest channel. The shell's manifest carries no GTS instances, so the widget realizations travel in the template's own file. FrontX isolates every MFE instance (FrontX ADR-0011). A shared dependency is built as one standalone chunk, and its source text is fetched once only when every template MFE publishes the same `contentHash` for it (FrontX ADR-0034); the cache reaches the whole realm (FrontX ADR-0035). This shapes the download size.

How does the template split into packages, what does it depend on, what travels through the manifest channel and what through the template's GTS file, where are the template's schemas registered, how are shared dependencies fetched and counted, and what does the template require from the shell?

## Decision Drivers

* Minimal dependencies: the template depends on `template-shell` and the pinned FrontX packages only, and takes nothing from `template-mfe`.
* No dashboard content and no backend configuration are packaged: dashboards and widget data come from the product's data adapter, so the manifest channel carries no dashboard and no widget data, and the template holds no endpoint configuration.
* The static extension of the larger-view modal must reach the shell's registry, and the only path is the shell's bootstrap reading the manifest channel.
* The widget realizations are GTS instances, which the shell's manifest cannot carry, so the template serves them in its own file, which a product edits or a backend replaces without touching the dashboards root or the larger-view modal.
* The template must work wherever the product places the dashboards root: as a screen extension or as code in the shell of a single-page application.
* The template's schemas must be registered before any dashboard loads, in either hosting form.
* A consumer replacement realization must ship in the product's own package and copy of the template's GTS file, with no change to the template's widget entries.
* Stability against shell changes: shell domain identifiers are resolved from shell constants in code, never typed as literals.
* Per-instance isolation: no package relies on template-owned state shared between instances, and the download size, with each shared dependency fetched once, stays within the budget (`cpt-frontx-dashboard-nfr-bundle-budget`).

## Considered Options

1. **Two packages on `template-shell`, host contract by role** — a package with the types, the dashboards root, the larger-view modal and the template's GTS file, one widget package, a dependency on `template-shell` only, and shell requirements stated by role.
2. **One package per widget type** — the first package plus 9 widget packages, each with its own manifest.
3. **Dependency on `template-mfe`** — build the dashboard on the reference MFE scaffold.
4. **Own host application** — the dashboard ships its own shell.
5. **Dashboards root only as a screen extension** — the template fixes the dashboards root as a routed extension of the shell's screen domain.

## Decision Outcome

Chosen option: "Two packages on `template-shell`, host contract by role", because the dashboard runs in the consuming product's existing shell-based application, depends on the shell alone, keeps the widget library one release unit, lets a consumer add a replacement entry in its own package, leaves the hosting of the dashboards root to the product, and names what it needs from the shell by role, so a change of a shell identifier stays contained.

The decision:

* **Dependencies.** The template requires `template-shell` and depends on it and on the FrontX packages it pins to exact published versions, including `@gears-frontx/ui-kit`, on a FrontX release that runs GTS v0.17 and provides the realm-shared GTS type store (FrontX gts-plugin ADR-0001), because nested owners validate chains that reference definitions registered by the shell. It takes nothing from `template-mfe` or from any other template.
* **No endpoint configuration.** The template reads no endpoint configuration and holds none. It makes no backend call: only the product's data adapter talks to a backend ([ADR-0011](0011-data-adapter-v1.md)).
* **Packages, split by role.**
  * `dashboard`: the GTS types the template owns, in the `frontx.dashboard_m` and `frontx.dashboard_v` packages ([ADR-0003](0003-shared-data-types-and-schemas-v1.md)): the model types (dashboard, layout and cell types, the widget base, the data widget type and the 9 widget types, the query vocabulary bases, the data shapes) and the view types (the `set_widget_context`, `request_data`, `set_data` and `show_larger_view` action types, the `layout_cells` and `larger_view` domains with their extension types, the widget realization type). It also holds the code of the dashboards root, the larger-view modal's MFE entry with its static extension, the code that the dashboards root and the larger-view modal both carry (the data adapter interface and the trait helper, [ADR-0011](0011-data-adapter-v1.md), [ADR-0003](0003-shared-data-types-and-schemas-v1.md)), and the template's GTS file with the 9 widget realizations. The package always has a manifest, because the larger-view modal's static extension and its entry travel in it. When the dashboards root is a screen extension, its routed extension and its entry travel in that manifest too: a routed extension of the shell's screen extension type that names its route in the extension schema's `route` field. The data adapter implementation is not in the template; the product supplies it in its copy.
  * `widgets`: one manifest. Per widget type it declares one entry, 9 entries in all, plus the shared widget chrome. The 9 widget realizations of weight 1, one per widget type, each naming its entry, are in the template's GTS file in `dashboard` (`cpt-frontx-dashboard-interface-widget-realization`). The same entry shows the widget in a cell and in the larger view ([ADR-0008](0008-widget-type-and-mfe-realization-v1.md)). The package has no data-request code and no error chrome: a widget shows a loader, a busy indicator and an empty state as [ADR-0011](0011-data-adapter-v1.md) defines, and sends `request_data` as a plain action. The cannot-show placeholder in a cell or in the modal is shown by the domain owner, the dashboards root or the larger-view modal, and its code is in `dashboard`.
* **Hosting of the dashboards root is abstract.** The dashboards root is either a screen extension of the shell's screen domain, declared in the manifest of `dashboard`, or code copied into the shell of a single-page application that has no screen domain. Everything else in this record holds for both forms. The product copies the template into its project and modifies it for its form.
* **Registration of the template's schemas.** The template's schemas, meaning its types, action types and extension types, are registered before any dashboard loads; each owner registers its own domain instance. When the dashboards root is a screen extension, they are registered through a template package manifest. Otherwise the shell's own bootstrap registers them. The family type schemas that the data adapter's served-families declaration returns are registered by the dashboards root and the larger-view modal at start. Each of them also registers the `widgets` manifest and every manifest whose entries a registered realization names, consumer packages included. Dataset types arrive with the dashboard ([ADR-0011](0011-data-adapter-v1.md), [ADR-0012](0012-query-vocabulary-and-datasets-v1.md)).
* **Manifest channel.** Each package's `mfe.json` carries GTS types, MFE entries and static extensions, which are the extensions listed above for `dashboard`. The shell's manifest carries no GTS instances. Dashboards, with their embedded layout and widget instances, and widget data never travel through `mfe.json`; they come from the product's data adapter ([ADR-0011](0011-data-adapter-v1.md)). The shell's bootstrap registers the routed and static extensions and their entries in the shell's registry.
* **The template's GTS file.** The template serves its own JSON file of GTS types and instances that are not part of an MFE manifest, starting with the widget realizations. The dashboards root and the larger-view modal fetch it at start, as if a backend returned it, and register its contents before any dashboard loads. A product changes realizations, including replacement realizations, by editing its copy of the file. A backend that returns GTS types and instances can replace the file without changing the dashboards root or the larger-view modal.
* **Consumer packages.** A consuming product that replaces how a template widget type is shown ships, in its own package, its own entry, and adds to its copy of the template's GTS file a replacement widget realization with a weight above 1 that names the entry, with a `larger_view_entry` only if the larger view needs different code. The template's widget entries stay unchanged, and the template's realization for that widget type stays registered but unused. Each owner registers the consumer package's manifest, because it registers every manifest whose entries a registered realization names. Consumer widget types are out of scope.
* **Shared dependencies and budget basis.** In every template MFE (the dashboards root when it is a screen extension, the larger-view modal and every widget entry), the packages listed in the manifest's `shared` array are built as shared dependencies, one standalone chunk each. The source text of a shared dependency is fetched once only when every template MFE publishes the same `contentHash` for it (FrontX ADR-0034), and the cache reaches the whole realm (FrontX ADR-0035). Each MFE instance still evaluates its own copy (FrontX ADR-0011), so no state is shared between instances. The template assumes equal content hashes, which holds when all its MFEs are built together from one pinned set of package versions. The budget counts transferred gzipped bytes on a cold load of the reference dashboard: the dashboards root and the larger-view modal with the shared dependencies they fetch themselves, each widget entry with its own code only, and each shared dependency once in the page total. The provisional figures are in the DESIGN (§3.9) and in the PRD.
* **Host contract by role.** The template names shell domains by role. TypeScript code resolves their current `template-shell` identifiers from shell framework constants and never writes them as literals. The cell widget learns the `popup` domain id from this host contract: it resolves it from the shell constants by role, as [ADR-0007](0007-extension-domain-taxonomy-v1.md) requires for opening the larger view. Manifest-declared extensions are data that carry the current identifiers, or are generated from the constants at build time. Requirements on the shell:
  * When the dashboards root is a screen extension, the shell's screen domain shares theme and language, accepts routed extensions of the shell screen extension type, and mounts one screen at a time. A shell without a screen domain needs none of this: it hosts the dashboards root as code.
  * The shell registers the `popup` domain already: the Optional strategy, so it owns zero or one occupant; routed, because the larger-view modal has a static route and FrontX routing restores it after a page refresh; the theme and language shared properties; `mount_ext` and `unmount_ext`. The shell must render a modal container for it, which shows the occupant in the shell's modal area with the shell's modal chrome, keeps keyboard focus inside the modal while it is open, and unmounts its occupant on a click outside the modal. The larger-view modal's own close button sends `unmount_ext` of itself to the `popup` domain. Without that container no larger view can be shown: the larger view cannot open. The cell's larger-view button is hidden only when the cell defines no larger-view widget. The rest of the dashboard works. Providing the container is a shell change that is tracked outside `template-dashboard`.
  * The shell serves the aggregated manifest channel, and its bootstrap registers each package's manifest, domains, entries and extensions, and the template's schemas when the dashboards root is not a screen extension. The template's GTS file is served by the template, not by the shell.
  * The theme shared property carries the shell theme id, which the template uses unchanged; each MFE maps it to the light or dark scope of `@gears-frontx/ui-kit` ([ADR-0006](0006-theme-distribution-v1.md)). The language shared property is provided.

### Consequences

* Good, because the dashboard runs in any `template-shell`-based application that meets the shell requirements, and in one that has no screen domain; the larger view additionally needs the modal container for the shell's `popup` domain.
* Good, because the manifests carry no dashboard content and the template holds no endpoint configuration, so a new dashboard needs no package change.
* Good, because the larger-view modal's static extension reaches the shell's registry through the existing bootstrap, with no runtime registration by the template.
* Good, because the same widget entry serves a cell and the larger view, so the widget package has 9 entries.
* Good, because a consumer replacement is its own package and entry plus a realization of higher weight in the product's copy of the template's GTS file, so the template's widget entries stay unchanged.
* Good, because the template's GTS file lets a product change realizations by editing it, and a backend that returns GTS types and instances can replace it without changing the dashboards root or the larger-view modal.
* Good, because role-based references in code survive a rename of shell domain identifiers; only the constant lookup tracks it.
* Good, because building the listed packages as shared dependencies lets FrontX fetch the source text of each once, and the budget counts it once.
* Bad, because the static extension of the larger-view modal is manifest data that carries the `popup` domain identifier, so it must follow `template-shell` identifier changes unless it is generated from the constants at build time.
* Bad, because the larger view depends on a shell prerequisite: a modal container for the `popup` domain that keeps keyboard focus inside the modal while it is open and unmounts its occupant on a click outside. A shell change outside this template provides it, and without it no larger view can be shown.
* Bad, because the product copies and modifies the template, so its copy can drift from the template; the interface of the data adapter and the template's types are the stable part.
* Bad, because widgets cannot share state between instances: each MFE instance evaluates its own copy of every shared dependency (FrontX ADR-0011). Source reuse saves fetches, not evaluation; the evaluation cost falls under the initial-render budget, and [ADR-0004](0004-charting-library-v1.md) records the per-instance cost of the charting library.
* Bad, because the single fetch of a shared dependency holds only while every template MFE publishes the same `contentHash` for it; MFEs built from different package versions fetch it once per distinct hash and exceed the budget basis.
* Neutral, because the 9 widget types share one manifest and one package, so they are released together.

### Confirmation

Confirmed when:

* A dependency check finds that the template's packages depend on `template-shell` and the pinned FrontX packages only, and on nothing from `template-mfe`.
* A grep over template TypeScript code finds no literal shell domain identifier; they come from shell framework constants.
* A search of the template finds no endpoint configuration, and `widgets` contains no code that requests data from a backend and no error chrome. Its widgets show only the loader, busy and empty states of [ADR-0011](0011-data-adapter-v1.md); the cannot-show placeholder in a cell or in the modal is shown by the domain owner, and its code is in `dashboard`.
* The `widgets` manifest declares exactly 9 entries. The template's GTS file holds exactly 9 widget realizations of weight 1, none with a `larger_view_entry`, and every realization names an entry of the `widgets` manifest.
* The dashboards root and the larger-view modal both carry the data adapter interface and the trait helper, and the template holds no data adapter implementation.
* No package's `mfe.json` contains a dashboard, a widget instance, a GTS instance or widget data.
* The dashboards root and the larger-view modal fetch the template's GTS file at start and register its contents before the first dashboard loads; a test that serves the same GTS types and instances from a test backend instead of the file changes nothing in the dashboards root or the larger-view modal.
* The template's schemas are registered before the first dashboard loads, through a template package manifest when the dashboards root is a screen extension, and through the shell's own bootstrap when the dashboards root is code in the shell.
* A fixture consumer package with an entry, and a replacement realization of weight 2 in the fixture's copy of the template's GTS file, wins for its widget type in the cell and in the larger view, without a change to the template's widget entries.
* On a shell with a screen domain, the dashboards root mounts as a screen through its route. On a shell that renders the modal container for its `popup` domain, the larger-view modal mounts in it with theme and language, closes with its close button and on a click outside, and an open larger view stays open after a page refresh. On a shell without the container, the larger view cannot open, the rest of the dashboard works, and the larger-view button is hidden only for a cell that defines no larger-view widget.
* On a shell that renders the modal container for its `popup` domain, with a larger view open, Tab and Shift+Tab move only between controls inside the larger-view modal and never reach the page behind it. This check runs on the shell and belongs to the shell change that provides the container, which is tracked outside `template-dashboard`.
* Every template MFE lists its packages in the `shared` array of its manifest, and every listed package passes the package-wide license check. All template MFEs publish the same `contentHash` for each shared dependency.
* Transferred gzipped bytes on a cold load of the reference dashboard are measured and checked against the provisional figures of `cpt-frontx-dashboard-nfr-bundle-budget` in the DESIGN (§3.9), with each shared dependency counted once. The measurement records one fetch per shared dependency.

## Pros and Cons of the Options

### Two packages on `template-shell`, host contract by role

* Good, because the dashboard runs in the consuming product's existing shell-based application and depends on the shell alone.
* Good, because the packages are split by role: the types and the parts that host and show dashboards, and the widget library as one release unit.
* Good, because a consumer replacement ships as its own package next to them.
* Good, because hosting of the dashboards root is left to the product, so it fits a screen extension and a single-page shell.
* Good, because naming shell domains by role keeps shell identifier changes out of template code.
* Bad, because it relies on the shell requirements holding, including a modal container for the `popup` domain.

### One package per widget type

* Good, because each widget type could be released and versioned on its own.
* Bad, because the template would ship 9 manifests and 9 package configurations that change together, since all widget types share one widget chrome.
* Bad, because a consumer would install and keep in step more packages for no product gain; replacing one widget type already works through a consumer package.

### Dependency on `template-mfe`

* Good, because it provides a working MFE scaffold to copy from.
* Bad, because the dashboard would make consuming products carry an example package set they do not need.
* Bad, because it ties the dashboard's release to the scaffold's version and ownership.

### Own host application

* Good, because the dashboard controls its domains and has no shell requirements.
* Bad, because consuming products already have a shell and would have to run two applications or migrate.
* Bad, because it duplicates what `template-shell` provides, including the modal area.

### Dashboards root only as a screen extension

* Good, because one hosting form is simpler to describe, build and test.
* Good, because the screen domain gives the dashboards root a route and a mount strategy.
* Bad, because a single-page application whose shell has no screen domain could not use the template without adding one.
* Bad, because it would tie the template to the shell's screen domain, which belongs to the shell and may change.

## More Information

* [ADR-0007](0007-extension-domain-taxonomy-v1.md) decides the `layout_cells` and `larger_view` domains and the larger-view modal that this record packages; [ADR-0008](0008-widget-type-and-mfe-realization-v1.md) decides the widget realization type and its precedence; [ADR-0006](0006-theme-distribution-v1.md) decides the theme input; [ADR-0011](0011-data-adapter-v1.md) decides the data adapter, which the product implements, and the states a widget shows; [ADR-0003](0003-shared-data-types-and-schemas-v1.md) decides the GTS packages and the trait helper.
* Related FrontX records (FrontX's own decisions, not this template's ADRs): FrontX ADR-0011 (per-instance isolation), FrontX ADR-0034 (shared-dependency source-text reuse by content hash), FrontX ADR-0035 (reach of the shared-dependency cache).
* **Review trigger:** revisit if `template-shell` stops exposing its domain constants, stops serving the manifest channel, or provides a `popup` domain that is not routed or does not use the Optional strategy; if consumer widget types move into scope; or if measured sizes cannot meet the bundle budget.
* **Scope:** how the template splits into packages, what it depends on, what the manifest channel carries, what the template's GTS file carries, where the dashboards root and the larger-view modal run, how the template's schemas are registered, how a consumer replacement ships, how shared dependencies are fetched and counted, and what the template requires from the shell.
* **Checklist applicability:** ARCH applicable and addressed above. INT applicable: the host contract by role, the manifest channel and the template's GTS file. MAINT applicable: one template dependency, role-based shell references in code, and manifest data that carries shell identifiers. PERF applicable: shared dependencies and the budget basis, checked in Confirmation. TEST applicable: dependency, manifest, registration, replacement and size checks in Confirmation. UX applicable in one respect: keyboard focus kept inside the larger-view modal and the click outside it are shell requirements on the modal container of the `popup` domain. SEC not applicable because isolation is decided in FrontX ADR-0011 and no credential is involved; access to data belongs to the product's data adapter. REL applicable only for the missing-container behaviour: without the modal container no larger view can be shown while the rest of the dashboard works. COMPL applicable only for the package-wide license check of the listed shared dependencies. OPS, DATA and BIZ not applicable because the package split decides no operational procedure, stored data or business rule.

## Traceability

- **PRD**: [PRD.md](../PRD.md)
- **DESIGN**: [DESIGN.md](../DESIGN.md)

This decision directly addresses the following requirements or design elements:

* `cpt-frontx-dashboard-fr-widget-catalog` — the `widgets` package with one manifest and, per widget type, one entry; its widget realization is in the template's GTS file.
* `cpt-frontx-dashboard-fr-replacement-widget` — a consumer replacement entry ships in its own package, and its replacement realization in the product's copy of the template's GTS file.
* `cpt-frontx-dashboard-interface-widget-realization` — the template's realizations of weight 1 and a consumer replacement above 1 travel in the template's GTS file.
* `cpt-frontx-dashboard-contract-host-areas` — the host contract by role: hosting of the dashboards root, the shell's `popup` domain with its modal container, and the theme and language shared properties.
* `cpt-frontx-dashboard-fr-widget-modal` — the larger view requires the modal container for the shell's `popup` domain and the larger-view modal's static extension registered by the shell's bootstrap.
* `cpt-frontx-dashboard-fr-backend-source` — the template holds no endpoint configuration and no backend access; dashboards and data come from the product's data adapter.
* `cpt-frontx-dashboard-constraint-shell-only-dependency` — the template depends on `template-shell` and the pinned FrontX packages only.
* `cpt-frontx-dashboard-constraint-role-based-host-ids` — shell domains are named by role and resolved from shell constants in code.
* `cpt-frontx-dashboard-nfr-compatibility` — compatibility with the shell and the FrontX packages the template pins.
* `cpt-frontx-dashboard-nfr-bundle-budget` — every MFE builds its listed packages as shared dependencies; transferred gzipped bytes, per-widget own code, shared dependencies counted once.
* `cpt-frontx-dashboard-topology-overlay-packages` — the two package subtrees and a consumer's replacement package.
* `cpt-frontx-dashboard-actor-host-application` — the shell that must meet the listed requirements.
