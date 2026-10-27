---
status: accepted
date: 2026-10-27
decision-makers: template-dashboard architecture maintainers
description: "Decision record for the extension domains of the dashboard template: the layout_cells domain of the Viewer host and a static modal container that occupies the host modal domain and shows a widget's larger view in its own modal_panel domain, with two host actions and the host prerequisite of a rendered modal-domain slot."
---

# ADR-0007: Extension domain taxonomy with a modal container

**ID**: `cpt-frontx-dashboard-adr-extension-domain-taxonomy`

<!-- toc -->

- [Context and Problem Statement](#context-and-problem-statement)
- [Decision Drivers](#decision-drivers)
- [Considered Options](#considered-options)
- [Decision Outcome](#decision-outcome)
  - [Consequences](#consequences)
  - [Confirmation](#confirmation)
- [Pros and Cons of the Options](#pros-and-cons-of-the-options)
  - [Own modal domain](#own-modal-domain)
  - [Change the host modal domain contract](#change-the-host-modal-domain-contract)
  - [Modal container](#modal-container)
- [More Information](#more-information)
- [Traceability](#traceability)

<!-- /toc -->

## Context and Problem Statement

The Viewer host mounts widget microfrontends into extension domains. The render-only template has two mount surfaces: the multi-cell widget canvas, and a modal that shows one widget's larger view when the user presses that widget's modal button. What a widget's larger view shows is that widget's implementation detail.

On FrontX the host application already owns a modal domain. The template's host is `template-shell`, whose host modal domain declares `extensionsActions: []`, so an extension mounted there cannot receive any action such as `set_subject`. `template-shell` registers this domain but today renders no slot for it, so nothing mounted there is visible until the host renders it. Domains also have occupancy semantics: FrontX ADR-0009 requires each domain to select a mount strategy, and its cardinality matrix fixes which lifecycle actions the domain must or must not declare. The question is which domains the template defines, how each occupies, and how a widget reaches the modal.

## Decision Drivers

* A bounded, enumerable set of mount surfaces that authors can reason about.
* Compliance with FrontX ADR-0009: strategy and declared lifecycle actions must agree at domain registration.
* Widgets stay unchanged: every widget receives its configuration with `set_subject` identically in every surface and requests its own data through the FrontX API package ([ADR-0011](0011-backend-delivered-dashboard-v1.md)).
* The template changes no `template-shell` file; what it needs from the host is stated as a host requirement.
* No extension is registered when the user opens the modal; opening only mounts.
* Theme is the only shared property of the template's own domains (`layout_cells`, `modal_panel`); widget entries require theme only.

## Considered Options

* **Own modal domain** — a template-owned modal domain with its own modal chrome next to `layout_cells`.
* **Change the host modal domain contract** — amend the host modal domain so that it declares the widget actions.
* **Modal container** — one Viewer host domain, and a template-shipped static modal container extension that occupies the host modal domain and hosts the widget in its own inner domain.

## Decision Outcome

Chosen option: "Modal container", because it is the only option that gives a widget in the modal its actions without the template changing `template-shell` files and without a second, template-owned modal surface that would compete with the host's. Its one host prerequisite, a rendered slot for the host modal domain, is stated below.

**Domains.** The template defines two domains, both with the concurrent mount strategy of FrontX ADR-0009 and the lifecycle actions `load_ext`, `mount_ext` and `unmount_ext` (the cardinality matrix requires unmount for a concurrent domain):

* `gts.frontx.mfes.ext.domain.v1~frontx.v.layout.layout_cells.v1` — registered by the Viewer host; one domain per dashboard, and one Viewer host per application tree (`cpt-frontx-dashboard-constraint-one-viewer-per-tree`), because the domain identifier is fixed and the FrontX collision guard is tree-global; each cell is an occupying extension; `unmount_ext` is used only on dashboard teardown.
* `gts.frontx.mfes.ext.domain.v1~frontx.v.layout.modal_panel.v1` — registered by the modal container in its own registry; it holds the one widget shown in the modal.

**Host actions.** The template defines two host actions `gts.frontx.mfes.comm.action.v1~frontx.v.mfe.{set_subject,mount_widget}.v1~`. `set_subject`, which carries the widget's configuration (its presentation configuration and `params`), is the extension action of both template domains. The Viewer host sends no widget data: each widget requests its own data ([ADR-0011](0011-backend-delivered-dashboard-v1.md)). `mount_widget` is a domain action of `layout_cells` only: a cell's modal button sends it, and the Viewer host answers by opening that widget's larger view in the modal. `modal_panel` does not declare `mount_widget`, so a widget in the modal cannot open another modal. Theme is the only shared property of these domains, so widget entries require theme only. The `frontx.widgets.area.*` types are not used.

**Extension registration.** The Viewer host registers a dashboard's widget extensions when it resolves the dashboard definition from the backend ([ADR-0011](0011-backend-delivered-dashboard-v1.md)): the cells for `layout_cells` and, for every widget of the dashboard, the extension that the modal mounts in `modal_panel`. Opening the modal therefore only mounts extensions that are already registered. The container's registry exists only after the container's first mount (FrontX ADR-0008), and in the template's reading of FrontX ADR-0008 there is no action that registers an extension in another registry; how the registrations made at dashboard resolve reach `modal_panel` is an open item in the DESIGN (§4). The collision guard of FrontX ADR-0007 covers extensions as well as domains, so every extension identifier is unique in the tree.

**Modal container.** The modal container is a static extension declared in the `dashboard-viewer` manifest for the host modal domain. It declares no custom actions, and its fields carry no per-widget data: no subject and no widget data. The container entry requires theme and language, because the host modal domain shares both. The container reads the host theme id through the host modal domain's theme shared property, like any domain, and passes the template-owned theme for that mode on as the theme shared property of `modal_panel` ([ADR-0006](0006-theme-distribution-v1.md)). The container is a nested host: in its own registry it registers `modal_panel`, an instance of the FrontX domain base with the concurrent strategy, the lifecycle actions above and the extension action `set_subject`, so no new domain type is introduced.

**Host requirement.** The modal is visible only if the host renders the host modal domain through a domain slot with modal chrome, focus trap and dismissal. Current `template-shell` registers the host modal domain but renders no slot for it, so this slot is a prerequisite `template-shell` change tracked outside the template and is part of the host contract (ADR-0010). The template itself renders no modal chrome around the host modal domain.

**Opening the modal.** The modal button sends `mount_widget` to `layout_cells`. The Viewer host mounts the container into the host modal domain, mounts the widget's modal extension into `modal_panel`, and sends that widget the same subject the cell received. The widget in the modal shows its larger view; what that view shows is the widget's implementation detail, and when it needs data the widget makes its own data request through the FrontX API package ([ADR-0011](0011-backend-delivered-dashboard-v1.md)). Closing the modal unmounts the container and leaves the dashboard unchanged.

**Reaching `modal_panel`.** The Viewer host's actions for `modal_panel` and its widget travel by FrontX forwarding across nested hosts (FrontX ADR-0007): they escalate from the Viewer host to the shell and are handed down to the container's registry. This works only because the container builds its registry and registers `modal_panel` synchronously inside its first mount (FrontX ADR-0008). The step-by-step sequence is specified in the DESIGN (§3.6).

### Consequences

* Good, because the template owns no second modal surface and changes no `template-shell` file; modal chrome, focus trap and dismissal are a host requirement on the rendered modal-domain slot.
* Good, because a widget receives its configuration the same way in `layout_cells` and in the container's `modal_panel`, and in the modal it requests the data its larger view needs on its own, through the FrontX API package.
* Good, because both template domains are consistent with the FrontX ADR-0009 matrix and pass admission, and their identifiers are unique in the tree.
* Good, because opening the modal registers nothing and the container is one static extension: every opening reuses the container's runtime and registry (FrontX ADR-0008).
* Good, because the action set is small: two host actions, one of which (`mount_widget`) is declared on one domain, and no action carries widget data.
* Bad, because the container is an extra nested-host layer: every action for the modal widget escalates from the Viewer host to the shell and is handed down into the container's registry.
* Bad, because delivery to `modal_panel` depends on the container building its registry synchronously in its first mount; a later refactoring that makes it asynchronous breaks the forwarding.
* Bad, because the modal depends on a host prerequisite: current `template-shell` registers the host modal domain but renders no slot for it, so the slot with modal chrome, focus trap and dismissal is a `template-shell` change tracked outside the template, and the modal cannot be shown until it exists.
* Neutral, because every widget's modal extension is registered at dashboard resolve, so the registry holds modal extensions for widgets the user never opens.
* Bad, because the container's dependence on the host modal domain's role makes the host contract a documented coupling that follows `template-shell` changes.

### Confirmation

* Domain registration tests verify that `layout_cells` and `modal_panel` are accepted with the concurrent strategy, that omitting `unmount_ext` is rejected, and that `mount_widget` is declared on `layout_cells` only.
* A test opens the modal, closes it and opens it again, checking each time that no registry logs a collision diagnostic and that `modal_panel` is advertised to the shell.
* A test checks that opening the modal registers no extension, and that a `set_subject` sent by the Viewer host is forwarded through the shell and reaches the widget mounted in the container's `modal_panel` with the same configuration as its cell.
* A test checks that the container reads the theme from the theme shared property and that a theme change reaches the widget in the modal.
* An integration test checks that the container's registry is built synchronously in its first mount, so its targets are advertised to the shell before the first nested `mount_ext`.
* Design review confirms that the container is declared statically in the `dashboard-viewer` manifest with no per-widget data fields, that no `frontx.widgets.area.*` type and no template-owned domain with modal chrome exists, and that the template changes no `template-shell` file.
* On a host that renders the host modal-domain slot, an integration test checks that the open modal shows the host's modal chrome, traps focus and, on dismissal, runs `unmount_ext` of the container.

## Pros and Cons of the Options

### Own modal domain

A template-owned modal domain with its own modal chrome.

* Good, because widgets receive their actions directly.
* Bad, because the template would own a second modal surface next to the host's, duplicating focus-trap, dismissal and z-ordering behavior.
* Bad, because it bypasses the host's modal role.

### Change the host modal domain contract

Amend `template-shell` so the host modal domain declares `extensionsActions`.

* Good, because widgets would mount directly into the host modal.
* Bad, because the template would change a `template-shell` file, and every host must adopt the change.
* Bad, because the modal domain would need to know dashboard-specific actions, contrary to substrate neutrality.

### Modal container

A template-shipped static extension occupies the host modal domain and hosts the widget in its own `modal_panel` domain, which the Viewer host drives through forwarded actions.

* Good, because the template changes no `template-shell` file and owns no modal surface; modal chrome, focus trap and dismissal stay with the host.
* Good, because the container is a regular entry in the Viewer host package and is declared once, so opening the modal registers no extension.
* Neutral, because the container entry requires theme and language, since the host modal domain shares both, while widget entries require theme only.
* Bad, because it adds a nested host, and every action for the modal widget depends on forwarding across it.
* Bad, because it requires the host to render its modal domain through a slot, which current `template-shell` does not do yet.

## More Information

**Review trigger.** Revisit if the host modal domain gains widget actions in its `extensionsActions`, which would allow widgets to mount there directly, if the FrontX ADR-0009 occupancy matrix changes, if FrontX forwarding (FrontX ADR-0007, FrontX ADR-0008) stops reaching targets registered in a nested host's registry, or if the `template-shell` change that renders the host modal-domain slot is rejected or takes a different form.

**Scope.** This record decides which extension domains the template defines, how each occupies, when widget extensions are registered, and how a widget reaches the modal. It does not decide the action dispatch mechanism (FrontX ADR-0007), the bridge and registry linking (FrontX ADR-0008), the occupancy model (FrontX ADR-0009), entry compatibility (FrontX ADR-0010) or load isolation (FrontX ADR-0011). Where widget data comes from and how a widget requests it is decided in [ADR-0011](0011-backend-delivered-dashboard-v1.md); the theme is decided in [ADR-0006](0006-theme-distribution-v1.md).

**Checklist applicability.** ARCH applicable and addressed above. PERF applicable: opening the modal registers nothing and mounts one container and one widget. SEC not applicable because no admission or authorization mechanism is decided; isolation is decided in FrontX ADR-0011. REL applicable: forwarding into `modal_panel` depends on the container's synchronous registry construction, and how dashboard-resolve registrations reach `modal_panel` is an open item in the DESIGN (§4). DATA not applicable because no persistent store or schema is involved. INT applicable: the contract with the host modal domain (its actions, shared properties, optional strategy and the rendered slot that is a host prerequisite) is a documented coupling with `template-shell`. OPS not applicable because no operational procedure is governed. MAINT applicable: the host contract must be re-checked when `template-shell` changes. TEST applicable: the Confirmation tests cover registration, collision, forwarding into `modal_panel` and theme. COMPL not applicable because no regulatory obligation is involved. UX applicable: modal chrome, focus trap and dismissal are a host requirement on the rendered modal-domain slot, and closing the modal returns to the unchanged dashboard. BIZ not applicable because no business rule is decided.

**Related FrontX decisions.** FrontX ADR-0007 (action dispatch and chaining), FrontX ADR-0008 (child MFE host access), FrontX ADR-0009 (extension domain occupancy), FrontX ADR-0010 (domain-extension compatibility), FrontX ADR-0011 (MFE load isolation). These are upstream FrontX records, not this template's ADRs of the same numbers.

## Traceability

- **PRD**: [PRD.md](../PRD.md)
- **DESIGN**: [DESIGN.md](../DESIGN.md)

This decision directly addresses the following requirements or design elements:

* `cpt-frontx-dashboard-fr-widget-modal` — the modal container shows a widget's larger view in the host modal domain; the widget receives its configuration as in its cell and requests the data its larger view needs on its own.
* `cpt-frontx-dashboard-fr-viewer-host` — the Viewer host registers `layout_cells` and the dashboard's widget extensions when it resolves the dashboard; one Viewer host is mounted per application tree.
* `cpt-frontx-dashboard-fr-theme` — the container derives the mode from the theme shared property and passes the template-owned theme to the widget in the modal.
* `cpt-frontx-dashboard-contract-host-domains` — the host screen domain and host modal domain roles are the contract with the host, including the rendered modal-domain slot.
* `cpt-frontx-dashboard-usecase-explore-dashboard` — the use case opens a widget in the modal through this domain and container flow.
* `cpt-frontx-dashboard-interface-template-domains` — the two template domains.
* `cpt-frontx-dashboard-interface-host-actions` — the two host actions.
* `cpt-frontx-dashboard-component-modal-container` — the static container and its `modal_panel`.
