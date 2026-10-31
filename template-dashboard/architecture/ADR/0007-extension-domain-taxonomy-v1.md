---
status: accepted
version: 1
date: 2026-10-31
decision-makers: template-dashboard architecture maintainers
description: "Decision record for the extension domain, action, generated ids and lifecycle of the dashboard template: one widgets domain the dashboard root owns, the single render_widget action, one generated extension per cell and per larger view with deterministic UUIDv5 ids, and an in-container larger-view overlay (D7, D8)."
---

# ADR-0007: Extension domain, action and the larger view

**ID**: `cpt-frontx-dashboard-adr-extension-domain-taxonomy`

<!-- toc -->

- [Context and Problem Statement](#context-and-problem-statement)
- [Decision Drivers](#decision-drivers)
- [Considered Options](#considered-options)
- [Decision Outcome](#decision-outcome)
  - [Consequences](#consequences)
  - [Confirmation](#confirmation)
- [Pros and Cons of the Options](#pros-and-cons-of-the-options)
  - [One widgets domain with a single render_widget action](#one-widgets-domain-with-a-single-render_widget-action)
  - [A separate domain per widget place](#a-separate-domain-per-widget-place)
  - [The larger view as a host modal extension](#the-larger-view-as-a-host-modal-extension)
- [More Information](#more-information)
- [Traceability](#traceability)

<!-- /toc -->

## Context and Problem Statement

A dashboard shows widgets in cells, and a cell may define a larger view: a second widget instance shown in an overlay. Widgets are FrontX MFE instances, and FrontX isolates each instance. Which domain does the dashboard root own, which action do widgets render, how are extensions generated and identified, and where does the larger view appear?

## Decision Drivers

* A widget renders one action, including its own empty state, and nothing more; the dashboard root owns the cell frame (title, loader, error state and the larger-view button) (D7).
* The larger view is an overlay inside the dashboard root's own container, not a host modal (D8). The template owns its accessibility.
* FrontX keeps per-extension state by id, so loading the same dashboard again must reuse the same ids.
* FrontX requires a generated extension id to be a GTS instance id of an extension type.
* Every listed action has a handler; if the domain is rejected, the dashboard can't be shown.
* The domain shares theme and language, published by the root ([ADR-0006](0006-theme-distribution-v1.md)).

## Considered Options

* One `widgets` domain with a single `render_widget` action
* A separate domain per widget place (cell vs larger view)
* The larger view as a host modal extension

## Decision Outcome

Chosen option: "One `widgets` domain with a single `render_widget` action", because one domain with one action is the smallest contract, the same widget code serves a cell and the larger view, and the larger view stays inside the root's own container so the template owns it.

**The `widgets` domain.** The dashboard root registers the `widgets` domain in a registry it can write to: in a single-page application, the application's own registry; in an MFE, a nested registry the root builds in its first mount (the concrete registry-construction call is an implementation detail fixed in the DESIGN). A child cannot register into an ancestor's registry, but FrontX advertises the nested registry's domains and extensions upward. The nested registry and its registrations survive an unmount.

The domain declaration fields (the concrete FrontX domain-declaration call is an implementation detail fixed in the DESIGN):

* `sharedProperties`: theme and language;
* `actions`: lifecycle only, [`mount_ext`, `unmount_ext`];
* `extensionsActions`: [`render_widget`];
* `extensionsTypeId`: the `widgets` extension type `gts.frontx.mfes.ext.extension.v1~frontx.dashboard.mfe.widget_ext.v1~`;
* `defaultActionTimeout`;
* `lifecycleStages`: [] and `extensionsLifecycleStages`: [];
* no `route`.

**The `render_widget` action (D7).** The widget contract is one action, `render_widget {widget, data?}`. The widget renders it, including its own empty state, and nothing more. The dashboard root owns the cell frame: title, loader, error state and the larger-view button. The `render_widget` payload is validated against its action type without polymorphism, so its `widget` and `data` fields reference the open bases, and the payload never closes them.

**Containers.** The root attaches the domain's one root element (the concrete mounter call is fixed in the DESIGN). The domain's container hooks create each extension's container and append it under that root. Cell placement and the larger-view overlay are done by the hooks and CSS on those containers, never by mounting into arbitrary elements.

**Generated extensions and their ids.** The root registers one generated extension per cell and per larger view in `widgets`, then mounts it with `mount_ext` (`history: "none"`). The extension id is `<widgets extension type>~<UUIDv5 under the template namespace of widget id|role|entry id>`, where role is `cell` or `larger_view` (D5 id rules). FrontX requires it to be a GTS instance id of an extension type. The role keeps a cell extension and a larger-view extension of the same widget apart. The entry id gives a new id when a different entry wins, so FrontX never reuses one id for different code. Reloading the same dashboard reuses the ids. Everything that may differ while the widget id stays the same (params, the binding, data) reaches the widget in `render_widget`, never in the extension declaration.

**Larger view (D8).** The cell frame shows the button only when the cell has `larger_view`. A click opens the overlay inside the dashboard root's own container, then the root runs the cell flow for the `larger_view` widget in the same extension domain, with its own request. The cell and its larger view are independent snapshots. The overlay is accessible: a close button with an accessible name, focus kept inside, and closing on Escape or a click outside. It closes on a page refresh. Every `mount_ext` and `unmount_ext` the root sends carries `history: "none"`; FrontX treats a missing intent as `push`, which would drop the host's captured initial route.

**Lifecycle.** On leaving, the root unmounts every extension and keeps the registrations. Before another dashboard loads, it unregisters the generated extensions. Results that arrive late are dropped for any extension that has been unmounted; the root never sends to an unmounted extension.

### Consequences

* Good, because one domain and one action is the smallest contract, so the widget author's surface is small.
* Good, because the same widget code serves a cell and the larger view, so the two cannot drift apart.
* Good, because the larger view stays inside the root's own container, so the template owns its accessibility and no host modal is required.
* Good, because deterministic ids let the root reuse the same extensions on a reload, so the page does not pile up extensions.
* Good, because `history: "none"` keeps the host's captured route when the larger view opens.
* Bad, because the root builds its own registry in an MFE, which is one more step at first mount.
* Bad, because a FrontX failure outside the root's own handler stays invisible, and that cell stays empty (a known limit).

### Confirmation

* A test registers the `widgets` domain and confirms it declares the shared properties, the lifecycle actions, `render_widget`, the `widgets` extension type, and no route.
* A test mounts a dashboard and confirms one extension is generated per cell and per larger view, with ids of the form `<widgets extension type>~<UUIDv5(widget id|role|entry id)>`, and that a reload reuses the same ids.
* A test opens a larger view and confirms the overlay appears inside the root's container, the close button and Escape and a click outside close it, focus stays inside while open, and it closes on a page refresh.
* A test confirms every `mount_ext` and `unmount_ext` carries `history: "none"`.
* A test confirms a late result for an extension that has been unmounted is dropped and never sent.

## Pros and Cons of the Options

### One widgets domain with a single render_widget action

The dashboard root owns one `widgets` domain, generates one extension per cell and per larger view, and sends one `render_widget` action. The larger view is an overlay in the root's container.

* Good, because one domain and one action is the smallest contract.
* Good, because the larger view stays inside the root's container, so the template owns it and no host modal is required.
* Good, because deterministic ids keep the page from piling up extensions.
* Bad, because the root builds its own registry in an MFE.

### A separate domain per widget place

A `cells` domain for cell widgets and a `larger_view` domain for larger-view widgets.

* Good, because the two places are named separately.
* Bad, because two domains double the contract for no gain: the same widget code and the same action serve both.
* Bad, because the larger view would need its own registry, as a child cannot register into an ancestor's.

### The larger view as a host modal extension

The larger view is a static extension of a host modal domain, mounted outside the dashboard root.

* Good, because the host's modal chrome is reused.
* Bad, because the template no longer owns the larger view's accessibility (D8), and the template depends on a host modal feature it cannot guarantee (it is hosting-agnostic, D12).
* Bad, because a child cannot register into an ancestor's registry, so the root could not register the larger-view extension without a separate registry and a separate static extension.

## More Information

* **Review trigger**: revisit if FrontX changes per-extension state retention or the `mount_ext`/`unmount_ext` intent handling.
* **Scope**: this decision covers the `widgets` domain, the `render_widget` action, generated extension ids and lifecycle, and the in-container larger view. It does not cover the widget catalog ([ADR-0009](0009-subject-agnostic-widget-catalog-v1.md)), the widget type → entry trait ([ADR-0008](0008-widget-type-and-mfe-realization-v1.md)), the binding runner ([ADR-0011](0011-widget-data-binding-v1.md)), or the GTS conventions ([ADR-0003](0003-shared-data-types-and-schemas-v1.md)).
* **Checklist applicability**: ARCH applicable; PERF applicable (deterministic ids keep the page bounded); SEC N/A; REL applicable (per-cell failure, late results dropped); DATA N/A; INT applicable (the `widgets` domain contract); OPS N/A; MAINT applicable; TEST applicable; COMPL N/A; UX applicable (the larger-view accessibility, owned by the template); BIZ N/A.
* Related: FrontX ADR-0008 (a child cannot register into an ancestor's registry), FrontX ADR-0011 (per-instance isolation).

## Traceability

- **PRD**: [PRD.md](../PRD.md)
- **DESIGN**: [DESIGN.md](../DESIGN.md)

This decision directly addresses the following requirements or design elements:

* `cpt-frontx-dashboard-fr-larger-view` — the larger view is an overlay inside the root's own container, accessible, and closable on Escape, a click outside, or a page refresh (D8).
* `cpt-frontx-dashboard-fr-isolation` — each widget is a generated FrontX extension in the `widgets` domain.
* `cpt-frontx-dashboard-fr-states` — the root owns the cell frame (title, loader, error state, the larger-view button); the widget owns its empty state (D7).
* `cpt-frontx-dashboard-interface-contract` — the `widgets` domain and the `render_widget` action are part of the published contract.
