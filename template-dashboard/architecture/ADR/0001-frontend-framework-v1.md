---
status: accepted
version: 1
date: 2026-10-31
decision-makers: template-dashboard architecture maintainers
description: "Decision record choosing FrontX, with TypeScript in strict mode and FrontX MFE packaging, as the sole framework of template-dashboard, so a widget author can add or fix a widget type at runtime without a product redeploy."
---

# ADR-0001: Frontend framework

**ID**: `cpt-frontx-dashboard-adr-frontend-framework`

<!-- toc -->

- [Context and Problem Statement](#context-and-problem-statement)
- [Decision Drivers](#decision-drivers)
- [Considered Options](#considered-options)
- [Decision Outcome](#decision-outcome)
  - [Consequences](#consequences)
  - [Confirmation](#confirmation)
- [Pros and Cons of the Options](#pros-and-cons-of-the-options)
  - [FrontX with TypeScript and MFE packaging](#frontx-with-typescript-and-mfe-packaging)
  - [A single plain React component mounted as one FrontX extension](#a-single-plain-react-component-mounted-as-one-frontx-extension)
- [More Information](#more-information)
- [Traceability](#traceability)

<!-- /toc -->

## Context and Problem Statement

`template-dashboard` is a declarative, backend-agnostic dashboard template a product copies into a host application. The host runs FrontX, so the template cannot pick another host framework. What remains to decide is how the template adopts FrontX: with which language, and whether each widget is a FrontX MFE loaded at runtime or lives inside the dashboard root as ordinary React code.

A widget author must be able to add a new widget type, or fix an existing one, at runtime, without a product redeploy; a fix released under the same widget type takes effect on the next page load ([ADR-0009](0009-subject-agnostic-widget-catalog-v1.md)).

## Decision Drivers

* FrontX is given by the host application; the dashboard root runs inside it, not as a second deployable application.
* A widget author adds or fixes a widget type at runtime, without a product redeploy (`cpt-frontx-dashboard-fr-add-fix-widget`). A fix under the same widget type shows on the next page load.
* Strong typing is needed for the shared widget contract and the `render_widget` action the dashboard root sends to each widget.
* The template must follow FrontX isolation rules and not depend on state held in common across widget instances.
* The template must depend on its own runtime packages only, never on a host or shell template (`cpt-frontx-dashboard-contract-host`).
* The template must stay buildable while FrontX evolves.

## Considered Options

* FrontX with TypeScript and MFE packaging
* A single plain React component mounted as one FrontX extension

## Decision Outcome

Chosen option: "FrontX with TypeScript and MFE packaging", because FrontX is given by the host, and its MFE packaging is the only option that lets a widget author ship a widget type as separately loaded code that the dashboard root mounts at runtime, so a fix or a new type needs no product redeploy.

The decision has these parts:

* FrontX, with TypeScript in strict mode, is the sole framework. No second UI framework is used.
* Each widget type is a FrontX MFE entry. The dashboard root generates one extension per cell (and per larger view) from the entry the widget type's trait names, and mounts it. FrontX caches each extension's evaluated code for the page's lifetime, keeps the first manifest it resolved for a manifest reference, and reuses an entry object still held by a registered extension. So a fix released under the same entry id takes effect on the next page load, and a reload of the same dashboard reuses the same extensions.
* The dashboard root and each widget exchange one typed action, `render_widget`, through the FrontX actions chain. The framework routes it, and the types are checked as data (`cpt-frontx-dashboard-interface-contract`).

This ADR does not restate the related decisions. ADR-0006 decides theme delivery. ADR-0007 decides the `widgets` domain and the `render_widget` action. ADR-0008 decides how a widget type points to its entry through a trait. ADR-0010 decides the packages and the host contract.

### Consequences

* Good, because a widget author ships a fix or a new widget type as separately loaded code, with no product redeploy, and a fix shows on the next page load.
* Good, because per-instance isolation means widgets cannot couple through module state; each widget instance evaluates its own copy of its code.
* Good, because the dashboard root reuses the same extension for the same widget on a reload, so the page does not pile up extensions.
* Bad, because every widget instance evaluates its own copy of heavy libraries, which raises bundle and memory cost (see ADR-0004 and ADR-0005).
* Bad, because isolation is per instance and is not a sandbox, and it does not contain main-thread faults. A widget that blocks the main thread or leaks memory slows the dashboard root and its neighbours (`cpt-frontx-dashboard-fr-isolation`).
* Bad, because a new FrontX release can break the template. Mitigation: the template pins the FrontX ecosystem packages to exact published registry versions and moves a pin only after it validates against the new release.

### Confirmation

Compliance is confirmed by code review and build checks. The review confirms that no widget code imports state from another widget instance. The build check confirms the template builds against its pinned FrontX packages. CI confirms every pinned FrontX package version exists in the registry.

## Pros and Cons of the Options

### FrontX with TypeScript and MFE packaging

The dashboard root and the widgets are FrontX MFEs. The dashboard root generates one extension per cell (and per larger view) from the entry the widget type's trait names, and mounts it.

* Good, because it uses the loading, actions, and domains the host framework already provides.
* Good, because a widget author ships a fix or a new type as separately loaded code, with no product redeploy.
* Good, because TypeScript types and the shared widget contract line up with FrontX base types.
* Bad, because per-instance isolation duplicates library code across widget instances.
* Bad, because each widget needs an entry, a manifest, and a typed action contract.

### A single plain React component mounted as one FrontX extension

The host runs FrontX. The template would ship one FrontX extension whose content is a plain React tree. The dashboard root would import widget components directly and pass data through props. There would be no widget MFEs.

* Good, because the build is simple: one bundle, and chart and grid libraries are evaluated once, not once per widget instance.
* Good, because there are no widget entries or manifests to maintain.
* Bad, because a widget author cannot add or fix a widget type at runtime; every change needs a rebuild of the template's component.
* Bad, because widgets could couple through state held in common by the plain components.
* Bad, because the widget contract would be TypeScript props only, which cannot be validated as data (see ADR-0003).

## More Information

* **Review trigger**: revisit when a FrontX release changes MFE instance isolation or the host contract.
* **Scope**: this decision covers the framework, the language, and the MFE packaging model. It does not cover theme delivery (ADR-0006), the `widgets` domain and `render_widget` (ADR-0007), how a widget type points to its entry (ADR-0008), the packages and the host contract (ADR-0010), or the chart and grid libraries (ADR-0004 and ADR-0005).
* **Checklist applicability**: ARCH applicable; PERF applicable (per-instance library cost); SEC applicable (isolation is per instance, not a sandbox); REL applicable (fault containment); DATA N/A; INT applicable (FrontX packages and the host contract); OPS N/A; MAINT applicable (pin policy); TEST applicable; COMPL N/A; UX N/A; BIZ applicable (add or fix a widget type without a redeploy).
* Related decision: FrontX ADR-0011 (load isolation).

## Traceability

- **PRD**: [PRD.md](../PRD.md)
- **DESIGN**: [DESIGN.md](../DESIGN.md)

This decision directly addresses the following requirements or design elements:

* `cpt-frontx-dashboard-fr-add-fix-widget` — a widget author ships a fix or a new widget type as a FrontX MFE, with no product redeploy; a fix shows on the next page load.
* `cpt-frontx-dashboard-fr-isolation` — each widget instance runs in its own isolated code.
* `cpt-frontx-dashboard-contract-host` — the framework choice and the pin policy set the supported FrontX baseline, and the template depends on its own runtime packages only, never on a host or shell template.
