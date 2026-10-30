---
status: accepted
date: 2026-10-29
decision-makers: template-dashboard architecture maintainers
description: Decision record choosing FrontX, with TypeScript in strict mode and FrontX MFE packaging, as the sole framework of template-dashboard.
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

`template-dashboard` adds a declarative dashboards root to a FrontX application that already uses `template-shell`. The dashboards root is whatever hosts the dashboards: a screen extension, or code copied into the shell of a single-page application. FrontX is given: the host application runs it, so the template cannot pick another host framework. What remains to decide is how the template adopts FrontX: with which language, and whether the dashboard uses the FrontX MFE (micro-frontend) packaging model or lives inside the host as ordinary React code.

FrontX isolates every MFE instance: each MFE instance evaluates its own copy of its code (FrontX ADR-0011). Each widget therefore relies only on its own copy of every library.

## Decision Drivers

* FrontX is given by the host application. The dashboards root must run inside that application, not as a second deployable application.
* Consumers must be able to replace how a template widget type is shown with a widget realization built and shipped in their own package, without rebuilding the template (`cpt-frontx-dashboard-fr-replacement-widget`).
* Strong typing is needed for the shared data types and for the messages between the dashboards root (and the larger-view modal) and the widgets: the FrontX actions `set_widget_context`, `request_data` and `set_data`.
* The design must follow FrontX isolation rules and not depend on template-owned module state held in common by MFE instances.
* The template must depend on `template-shell` only (`cpt-frontx-dashboard-nfr-compatibility`).
* The template must stay buildable while FrontX evolves.

## Considered Options

* FrontX with TypeScript and MFE packaging
* A single plain React component mounted as one FrontX extension

## Decision Outcome

Chosen option: "FrontX with TypeScript and MFE packaging", because FrontX is given by the host, and its MFE packaging is the only option that lets consumers ship replacement widget realizations as separately built packages, with typed messages routed by the framework.

The decision has these parts:

* FrontX, with TypeScript in strict mode, is the sole framework. No second UI framework is used.
* The dashboard is packaged as FrontX MFEs. The FrontX runtime loads and isolates them. Each MFE instance evaluates its own copy of its code (FrontX ADR-0011), so no library instance is held in common between MFE instances.
* The dashboards root, the larger-view modal and the widgets exchange typed messages through the FrontX actions `set_widget_context`, `request_data` and `set_data`. The framework routes them, and the types are checked as data.

This ADR does not restate the related decisions. ADR-0006 decides theme delivery. ADR-0007 decides the extension domains. ADR-0008 decides widget realization, including the choice between one MFE per widget type and widgets bundled into the dashboards root MFE. ADR-0010 decides how the template splits into packages and what it requires from the host.

### Consequences

* Good, because the dashboards root reuses the host application's navigation domain and, when it is a screen extension, its screen domain.
* Good, because per-instance isolation means widgets cannot couple through module state, which is not shared between MFE instances; only the registry's type store is shared.
* Good, because consumers ship replacement widget realizations as separate MFE packages without changing the template. Consumer widget types are out of scope.
* Bad, because every MFE instance evaluates its own copy of heavy libraries, which raises bundle and memory cost (see ADR-0004 and ADR-0005).
* Bad, because the per-instance library cost is held per extension id until the page unloads (FrontX ADR-0011), and the deterministic extension ids of [ADR-0007](0007-extension-domain-taxonomy-v1.md) keep it bounded.
* Bad, because isolation is per instance and is not a sandbox, and it does not contain main-thread faults. A widget that blocks the main thread or leaks memory slows the dashboards root and its neighbours.
* Bad, because the template is tied to FrontX conventions and to the `template-shell` host contract.
* Bad, because a new FrontX release can break the template. Mitigation: the template pins the FrontX ecosystem packages to exact published registry versions, as the repository pin policy requires, and moves a pin only after the template validates against the new release.

### Confirmation

Compliance is confirmed by code review and by build checks. The review confirms that no widget code imports state from another MFE instance. The build check confirms that the template builds with `template-shell` as its only template dependency. CI confirms that every pinned FrontX package version exists in the registry.

## Pros and Cons of the Options

### FrontX with TypeScript and MFE packaging

The dashboards root and the widgets are FrontX MFEs. The dashboards root hosts cell widgets and the larger-view modal hosts larger-view widgets, each in its own registry.

* Good, because it uses the loading, actions, and domains that the host framework already provides.
* Good, because TypeScript types and the shared data types line up with FrontX base types.
* Good, because consumers can ship replacement widget realizations as separately built packages.
* Neutral, because the split between one MFE per widget type and widgets bundled into the dashboards root MFE is decided separately in ADR-0008.
* Bad, because per-instance isolation duplicates library code across instances.
* Bad, because the per-instance library cost is held per extension id until the page unloads (FrontX ADR-0011).
* Bad, because each widget needs MFE entries, a manifest, and typed action contracts.

### A single plain React component mounted as one FrontX extension

The host runs FrontX. The template would ship one FrontX extension whose content is a plain React tree. The dashboards root would import widget components directly and pass data through props. There would be no widget MFEs, no nested host, and no FrontX actions inside the dashboard.

* Good, because the build is simple: one bundle, and the chart and grid libraries are evaluated once per dashboard, not once per widget instance.
* Good, because there are no widget MFE entries, manifests, or action types to maintain.
* Bad, because consumers cannot replace how a widget type is shown from a separately built package. A replacement needs a rebuild of the template's component.
* Bad, because widgets could couple through state held in common by the plain components.
* Bad, because widget contracts would be TypeScript props only, which cannot be validated as data (see ADR-0003).
* Bad, because the shell's `popup` domain holds FrontX extensions, so the larger-view modal (`cpt-frontx-dashboard-fr-widget-modal`) would need a separate MFE outside this model.

## More Information

* **Review trigger**: revisit this decision when a FrontX release changes MFE instance isolation or the `template-shell` host contract.
* **Scope**: this decision covers the framework, the language, and the MFE packaging model. It does not cover theme delivery (ADR-0006), extension domains (ADR-0007), widget realization (ADR-0008), the package split and the host requirements (ADR-0010), or the chart and grid libraries (ADR-0004 and ADR-0005). Authoring is out of scope for this template, so there is no authoring interface, and the consuming product writes or generates dashboards as data.
* **Checklist applicability**: ARCH applicable (sets the framework and packaging model); PERF applicable (per-instance library cost); SEC applicable (isolation is per instance, not a sandbox, between independently built widgets); REL applicable (fault containment limits and the FrontX dependency); DATA N/A (data types are decided in ADR-0003); INT applicable (FrontX packages and the `template-shell` host contract); OPS N/A (the template is built as part of the consuming product's application and has no deployment of its own); MAINT applicable (pin policy for the FrontX dependency); TEST applicable (build checks and review confirm compliance); COMPL N/A (no regulated data or new license is introduced); UX N/A (no user-facing behavior is decided here); BIZ applicable (consumers replace how a widget type is shown without changing the template).
* Related decision: FrontX ADR-0011 (load isolation).

## Traceability

- **PRD**: [PRD.md](../PRD.md)
- **DESIGN**: [DESIGN.md](../DESIGN.md)

This decision directly addresses the following requirements or design elements:

* `cpt-frontx-dashboard-fr-widget-catalog` — the 9 template widget types are realized as FrontX MFEs.
* `cpt-frontx-dashboard-fr-replacement-widget` — a consumer ships a replacement widget realization in its own package, without changing the template.
* `cpt-frontx-dashboard-fr-theme` — the FrontX shared-property channel is what ADR-0006 uses to deliver the theme.
* `cpt-frontx-dashboard-nfr-compatibility` — the framework choice and the pin policy set the supported FrontX baseline, and the template depends on `template-shell` only.
