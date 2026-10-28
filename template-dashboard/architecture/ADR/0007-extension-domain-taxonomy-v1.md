---
status: accepted
date: 2026-10-27
decision-makers: template-dashboard architecture maintainers
description: "Decision record for the extension domains of the dashboard template: one layout_cells domain that the Viewer host implements in its own registry, one template action set_widget_context, and the larger view as one static extension of the host modal domain per widget type, reached by an actions chain that escalates to the shell."
---

# ADR-0007: Extension domain taxonomy

**ID**: `cpt-frontx-dashboard-adr-extension-domain-taxonomy`

<!-- toc -->

- [Context and Problem Statement](#context-and-problem-statement)
- [Decision Drivers](#decision-drivers)
- [Considered Options](#considered-options)
- [Decision Outcome](#decision-outcome)
  - [Consequences](#consequences)
  - [Confirmation](#confirmation)
- [Pros and Cons of the Options](#pros-and-cons-of-the-options)
  - [One `layout_cells` domain and static modal extensions](#one-layout_cells-domain-and-static-modal-extensions)
  - [Modal container with its own `modal_panel` domain](#modal-container-with-its-own-modal_panel-domain)
  - [Per-instance modal extensions registered on open](#per-instance-modal-extensions-registered-on-open)
  - [Template-owned modal domain](#template-owned-modal-domain)
- [More Information](#more-information)
- [Traceability](#traceability)

<!-- /toc -->

## Context and Problem Statement

The Viewer host mounts widget microfrontends into extension domains. The render-only template has two mount surfaces: the multi-cell widget canvas of a dashboard, and the larger view, a modal that shows one widget with more room when the user presses that widget's larger-view button. The larger view must appear in the host modal area that the host application provides.

FrontX sets firm rules for both surfaces. FrontX admits an extension only through `registerExtension` on the registry that holds the extension's domain. A child's bridge exposes only `executeActionsChain`, `subscribeToProperty`, `getProperty` and `registerActionHandler`, so a child cannot register anything into its host's registry (FrontX ADR-0008). Every domain selects a mount strategy, and the FrontX ADR-0009 cardinality matrix fixes which lifecycle actions it must declare. Entries are admitted by the subset rule of FrontX ADR-0010. The collision guard for domain and extension identifiers is tree-global (FrontX ADR-0007).

On the host side, `template-shell` owns the host modal domain in the shell's registry. It uses the Optional strategy, so it holds zero or one occupant, declares no extension actions, shares theme and language with its occupant, and has no extension type constraint. The Viewer host is a nested host with its own registry inside the host screen domain, so it cannot register anything into the host modal domain.

Which extension domains does the template define, who registers which extensions where, and how does a widget reach the host modal domain for its larger view?

## Decision Drivers

* A bounded, enumerable set of mount surfaces that authors can reason about.
* The FrontX admission rule and bridge surface: an extension can be registered only through the registry that holds its domain, and no child can register into its host's registry.
* Compliance with FrontX ADR-0009: strategy and declared lifecycle actions must agree at domain registration.
* Widgets behave the same in both surfaces: a widget receives its context with one action, in a cell and in the larger view, and requests its own data through the FrontX API package ([ADR-0011](0011-backend-delivered-dashboard-v1.md)).
* No extension is registered when the user opens a larger view or on any other click; opening only mounts and configures.
* The template owns no modal surface of its own; modal chrome, focus trap and dismissal stay with the host.
* The template changes no `template-shell` file; what it needs from the host is stated in the host contract ([ADR-0010](0010-template-packages-and-host-contract-v1.md)).
* A consumer replacement widget realization must be able to bring its own larger view (`cpt-frontx-dashboard-fr-replacement-widget`).

## Considered Options

* **One `layout_cells` domain and static modal extensions** — the Viewer host implements one domain in its own registry; the larger view of each widget type is a static extension of the host modal domain, registered by the host bootstrap and reached by an escalated actions chain.
* **Modal container with its own `modal_panel` domain** — a template-shipped container occupies the host modal domain and hosts the widget in an inner domain of its own registry.
* **Per-instance modal extensions registered on open** — the larger-view button registers an extension for the one widget instance in the host modal domain and mounts it.
* **Template-owned modal domain** — the Viewer host registers a second domain of its own with modal chrome, next to `layout_cells`.

## Decision Outcome

Chosen option: "One `layout_cells` domain and static modal extensions", because it is the only option that shows the larger view in the host modal area, registers every extension in the registry that holds its domain, registers nothing on click, and needs neither a FrontX change nor a second template-owned modal surface. Its one host prerequisite, a rendered slot for the host modal domain, is part of the host contract.

**Template domain.** The template defines one extension domain, `gts.frontx.mfes.ext.domain.v1~frontx.v.layout.layout_cells.v1`. The Viewer host implements it: it builds its own registry synchronously inside its first mount (FrontX ADR-0008) and registers the domain there. The domain is an instance of the FrontX domain base, so the template adds no domain type. It uses the Concurrent strategy of FrontX ADR-0009 and declares the lifecycle actions `load_ext`, `mount_ext` and `unmount_ext`; the cardinality matrix requires both mount and unmount for a Concurrent domain. Its extension action is `set_widget_context`. Its shared properties are theme and language, which the Viewer host forwards unchanged from its host ([ADR-0006](0006-theme-distribution-v1.md)). Its extensions are of the type `gts.frontx.mfes.ext.extension.v1~frontx.v.layout.layout_cells.v1~`, which adds no fields. Each cell holds one occupant, and `unmount_ext` is used only on dashboard teardown. Because the domain identifier is fixed and the collision guard is tree-global, one Viewer host is mounted per application tree (`cpt-frontx-dashboard-constraint-one-viewer-per-tree`).

**Template action.** The template defines one host action, `gts.frontx.mfes.comm.action.v1~frontx.v.mfe.set_widget_context.v1~`. Its payload is `widget`, the widget instance; `data_endpoint`, the widget data endpoint from the consuming product's configuration; and `modal` with `target`, the host modal domain identifier, and `subject`, the static modal extension of the widget's realization. `modal` is always present for a cell widget and absent for a modal widget. The payload is closed: it allows only `widget`, `data_endpoint`, and `modal`, and `modal` allows only `target`, a domain identifier, and `subject`, an extension identifier. The field names of `modal` are those of the FrontX `mount_ext` action, so the cell widget's chain uses them as they arrive. The action carries no widget data: each widget requests its own ([ADR-0011](0011-backend-delivered-dashboard-v1.md)). The larger view opens through the FrontX lifecycle actions of the host modal domain, so the template defines no other action.

**Cell extensions.** When the Viewer host resolves a dashboard, it handles every embedded widget instance in the same way:

1. It reads the widget type from the rightmost type of the widget's `id` chain.
2. It picks the winning widget realization of that widget type: the single realization with the highest weight among those registered in its registry (`cpt-frontx-dashboard-interface-widget-realization`, [ADR-0008](0008-widget-type-and-mfe-realization-v1.md)). No realization, or a tie at the highest weight, leaves the cell in its cannot-show state, with a diagnostic that names the widget type, and the tied realizations for a tie.
3. It generates one extension of the `layout_cells` extension type, with the identifier `gts.frontx.mfes.ext.extension.v1~frontx.v.layout.layout_cells.v1~frontx.v.layout.cell_<c>.v1`, where `<c>` is the zero-based cell index, and with `entry` taken from the realization's `entry`.
4. It registers that extension with `registerExtension` in its own registry and runs `mount_ext`. The Concurrent strategy creates a container, and the domain's mounter places it in the cell.
5. It sends `set_widget_context` with the widget instance, `data_endpoint`, and `modal`, whose `target` is the host modal domain identifier, resolved from the shell constant, and whose `subject` is the realization's `modal_extension`.

**Larger view.** The larger view uses the host modal domain, which the shell implements. For each widget type, the `dashboard-widgets` manifest declares one static extension of the host modal domain whose `entry` is that widget type's modal entry. The host bootstrap registers it in the shell's registry from the manifest channel, together with the modal entry. `modal_extension` is required in every widget realization, including a consumer replacement, so every cell widget has a larger view and its larger-view button is always shown. One static extension serves every widget of its widget type, because each opening sends the widget's own context.

The larger-view button runs one chain through the cell widget's bridge: `mount_ext` with `modal.target` and `modal.subject`, then, as `next`, `set_widget_context` for `modal.subject` with the same widget instance and `data_endpoint`, without `modal`. The `set_widget_context` step has the fallback `unmount_ext` of the same extension. The Viewer host's registry has no handler for the host modal domain, so the chain escalates to the shell (FrontX ADR-0007). The static modal extension is already admitted, so opening only mounts and configures it. The Optional strategy keeps at most one occupant; when the extension is already mounted, the mount completes without change and the new context replaces the widget it shows. The host modal domain owns its single occupant: Close and dismissal are the shell's `unmount_ext`, and the Viewer host sends nothing to the host modal domain, not even on dashboard teardown.

**Own-registry registration.** Each nested host registers extensions only in its own registry (`cpt-frontx-dashboard-principle-own-registry-registration`). The Viewer host registers only `layout_cells` extensions, only in its own registry, and only when it resolves a dashboard. The shell registers the static modal extensions in its registry at bootstrap. No template part registers anything on click.

**Admission.** A cell entry requires theme and language, which `layout_cells` shares, and supports `set_widget_context`, which covers the domain's extension actions. A modal entry requires theme and language, which the host modal domain shares. The host modal domain declares no extension actions, so under the subset rule of FrontX ADR-0010 the extra action `set_widget_context` of the modal entry does not block its admission.

**Identifier uniqueness.** Cell extension identifiers are generated from the cell index; a cell without an extension leaves its index unused, and the other cells keep their positions. The static modal extensions have fixed identifiers, one per widget type. The two sets are disjoint, so no advertisement trips the tree-global collision guard.

**Host prerequisite.** The larger view is visible only if the host renders the host modal domain through a slot with modal chrome, Close, focus trap and dismissal. Current `template-shell` registers the domain but renders no slot for it. The slot is part of the host contract ([ADR-0010](0010-template-packages-and-host-contract-v1.md)) and a prerequisite `template-shell` change tracked outside the template (PRD open question Q2). On a host without it, the chain's `mount_ext` fails, no larger view appears, and the cell is unchanged.

### Consequences

* Good, because every extension is registered through the registry that holds its domain, so the design works on FrontX as it is, with no FrontX change.
* Good, because opening a larger view registers nothing: it mounts an admitted static extension and sends it a context.
* Good, because the template has one domain and one action, and a widget receives its context with the same action in a cell and in the larger view.
* Good, because the template owns no modal surface and adds no nested-host layer; modal chrome, focus trap, Close and dismissal stay with the host.
* Good, because every realization brings its own static modal extension, so a consumer replacement also replaces the larger view of its widget type.
* Good, because `layout_cells` is consistent with the FrontX ADR-0009 matrix, cell entries and modal entries pass admission, and all identifiers are unique in the tree.
* Neutral, because the shell's registry holds one static modal extension per realization, also for widget types that a dashboard does not use; each is a small manifest declaration.
* Bad, because a chain reports nothing back to its sender (FrontX ADR-0007): when an opening fails, neither the cell widget nor the Viewer host learns of it, and the next button press simply starts a new opening.
* Bad, because the larger view depends on a host prerequisite that current `template-shell` does not meet; until the slot exists, no larger view can be shown, while the rest of the dashboard works.
* Bad, because the static modal extensions are manifest data that carry the host modal domain identifier, so they must follow `template-shell` identifier changes or be generated from the shell constants at build time.
* Bad, because the opening depends on the host bootstrap having registered the static modal extensions before the first opening; the registration order is checked by an integration test.

### Confirmation

* A domain registration test verifies that `layout_cells` is accepted with the Concurrent strategy, that omitting `unmount_ext` is rejected, and that `set_widget_context` is its only extension action.
* An integration test resolves the reference dashboard and checks that the Viewer host registers exactly one `layout_cells` extension per cell whose widget type has a single winning realization, with the identifier of its cell index and the `entry` of the winning realization, and that a widget type with no realization or a tie leaves only its own cells in the cannot-show state.
* A test checks that every cell widget receives `set_widget_context` with `modal`, whose `target` is the host modal domain identifier from the shell constant and whose `subject` is the realization's `modal_extension`.
* A test opens a larger view, closes it and opens it again, for two widgets of the same widget type, checking that no registry registers anything, that no collision diagnostic is logged, and that the modal widget receives the same widget instance and `data_endpoint` as the cell.
* An integration test checks the registration order: `layout_cells` is advertised to the shell before the first nested mount, cell extensions follow their entries and realizations, and the host bootstrap registers the static modal extensions before the first opening.
* On a host that renders the modal-domain slot, a test checks that Close and dismissal run the shell's `unmount_ext` and leave the dashboard unchanged; on a host without the slot, a test checks that opening fails and the cell is unchanged.
* Design review confirms that the template defines no domain besides `layout_cells` and no action besides `set_widget_context`, that every realization names a `modal_extension`, and that the template changes no `template-shell` file.

## Pros and Cons of the Options

### One `layout_cells` domain and static modal extensions

The Viewer host implements `layout_cells` in its own registry and registers one generated cell extension per cell whose widget type has a single winning realization. The larger view of each widget type is a static extension of the host modal domain, declared in the `dashboard-widgets` manifest and registered by the host bootstrap; the cell widget reaches it with a chain that escalates to the shell.

* Good, because every registration happens in the registry that holds the domain, as FrontX requires.
* Good, because nothing is registered on click, and the larger view appears in the host modal area with the host's chrome.
* Good, because the action set is one action, and no extra nested host stands between a widget and the host modal domain.
* Neutral, because the static modal extension exists per widget type, not per widget instance; the instance is chosen by the context each opening sends.
* Bad, because it requires the host to render its modal domain through a slot, which current `template-shell` does not do yet.
* Bad, because a failed opening is not reported to the cell widget or the Viewer host.

### Modal container with its own `modal_panel` domain

A template-shipped static container extension occupies the host modal domain, registers an inner `modal_panel` domain in its own registry, and shows the widget there; the Viewer host drives that widget with actions forwarded across the container.

* Good, because the container is one static extension of the host modal domain, so opening the modal registers nothing in the shell's registry.
* Bad, because the widget extension for `modal_panel` would have to be registered in the container's registry, which neither the Viewer host nor a widget can reach: FrontX admits extensions only through the registry that holds the domain, and no bridge offers registration into another registry.
* Bad, because it adds a second nested host whose registry exists only after the container's first mount, so forwarding into it depends on synchronous registry construction.
* Bad, because the container needs its own template actions and its own theme handover to its inner domain, which enlarges the template's contract.

### Per-instance modal extensions registered on open

When the user presses the larger-view button, the template registers a modal extension for that one widget instance in the host modal domain, then mounts it.

* Good, because each larger view would be a separate extension with the widget instance bound at registration.
* Bad, because the host modal domain lives in the shell's registry, and neither the Viewer host nor a widget can register into it; this option needs a FrontX change that lets a child register an extension in its host's registry.
* Bad, because it registers an extension on every click, contrary to the decision drivers.
* Neutral, because it stays a candidate for a later stage, once FrontX offers such a registration path.

### Template-owned modal domain

The Viewer host registers a second domain of its own with modal chrome, focus trap and dismissal, next to `layout_cells`, and mounts the larger view there.

* Good, because the Viewer host could register the modal extensions in its own registry and would not depend on the host modal-domain slot.
* Bad, because the template would own a second modal surface next to the host's, duplicating focus trap, dismissal and stacking behavior.
* Bad, because the larger view would render inside the Viewer host's screen area, not in the host modal area that the PRD requires.

## More Information

**Review trigger.** Revisit if FrontX gains a way for a child to register an extension in its host's registry, which would allow per-instance modal extensions; if the host modal domain changes its strategy, its shared properties or its extension type constraint; if the FrontX ADR-0009 matrix or the FrontX ADR-0010 subset rule changes; or if the `template-shell` change that renders the host modal-domain slot is rejected or takes a different form.

**Scope.** This record decides which extension domain the template defines, which action it defines, who registers which extensions in which registry, and how a widget reaches the host modal domain. The widget realization type and its precedence are decided in [ADR-0008](0008-widget-type-and-mfe-realization-v1.md); the packages and the host contract in [ADR-0010](0010-template-packages-and-host-contract-v1.md); where widget data comes from in [ADR-0011](0011-backend-delivered-dashboard-v1.md); the theme in [ADR-0006](0006-theme-distribution-v1.md). It does not decide the action dispatch mechanism (FrontX ADR-0007), the bridge and registry linking (FrontX ADR-0008), the occupancy model (FrontX ADR-0009), entry compatibility (FrontX ADR-0010) or load isolation (FrontX ADR-0011).

**Checklist applicability.** ARCH applicable and addressed above. PERF applicable: opening a larger view registers nothing and mounts one extension. SEC not applicable because no admission or authorization mechanism is decided here; isolation is decided in FrontX ADR-0011. REL applicable: a failed cell mount stays in its cell, a failed context closes the larger view through the fallback, and a failed opening leaves the dashboard unchanged. DATA not applicable because no persistent store or schema is involved. INT applicable: the host modal domain's strategy, shared properties, missing extension type constraint and rendered slot form a documented coupling with `template-shell`. OPS not applicable because no operational procedure is governed. MAINT applicable: the static modal extensions carry the host modal domain identifier as manifest data. TEST applicable: the Confirmation tests cover registration, precedence, opening, order and the host prerequisite. COMPL not applicable because no regulatory obligation is involved. UX applicable: the larger view uses the host's modal chrome, focus trap and dismissal, and closing it returns to the unchanged dashboard. BIZ not applicable because no business rule is decided.

**Related FrontX decisions.** FrontX ADR-0007 (action dispatch, chaining and escalation), FrontX ADR-0008 (child MFE host access and nested registries), FrontX ADR-0009 (extension domain occupancy), FrontX ADR-0010 (domain-extension compatibility), FrontX ADR-0011 (MFE load isolation). These are upstream FrontX records, not this template's ADRs of the same numbers.

## Traceability

- **PRD**: [PRD.md](../PRD.md)
- **DESIGN**: [DESIGN.md](../DESIGN.md)

This decision directly addresses the following requirements or design elements:

* `cpt-frontx-dashboard-fr-widget-modal` — the larger-view button opens the widget type's static extension in the host modal domain and sends it the same widget context as the cell; Close and dismissal are the shell's unmount.
* `cpt-frontx-dashboard-fr-viewer-host` — the Viewer host implements `layout_cells` in its own registry and generates, registers and mounts one cell extension per cell whose widget type has a single winning realization when it resolves the dashboard.
* `cpt-frontx-dashboard-fr-replacement-widget` — every realization, including a consumer replacement, brings its own static modal extension, so the replacement also shows the larger view.
* `cpt-frontx-dashboard-contract-host-areas` — the larger view uses the host modal area, which requires the rendered host modal-domain slot.
* `cpt-frontx-dashboard-usecase-view-dashboard` — the dashboard viewer sees the cells mounted through `layout_cells` and opens a widget's larger view through the escalated chain.
* `cpt-frontx-dashboard-interface-template-domains` — the one template domain `layout_cells` and its extension type.
* `cpt-frontx-dashboard-interface-host-actions` — the one template action `set_widget_context` with `widget`, `data_endpoint` and `modal`.
* `cpt-frontx-dashboard-interface-widget-realization` — the winning realization gives the cell extension's `entry` and the `modal_extension` that the larger view mounts.
* `cpt-frontx-dashboard-principle-own-registry-registration` — each nested host registers extensions only in its own registry.
* `cpt-frontx-dashboard-constraint-one-viewer-per-tree` — the fixed domain and cell extension identifiers under the tree-global collision guard.
* `cpt-frontx-dashboard-seq-widget-modal-open` — the opening sequence of the larger view.
