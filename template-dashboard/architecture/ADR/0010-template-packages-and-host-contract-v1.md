---
status: accepted
date: 2026-10-27
decision-makers: template-dashboard architecture maintainers
description: Decision record on how template-dashboard splits into a Viewer host package and a widget package, depends on template-shell only, and states by role what it requires from the host - a screen, and a place to show modals with focus kept inside and dismissal.
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
  - [Dependency on `template-mfe`](#dependency-on-template-mfe)
  - [Own host application](#own-host-application)
- [More Information](#more-information)
- [Traceability](#traceability)

<!-- /toc -->

## Context and Problem Statement

The dashboard runs inside a consuming product's FrontX application, which is built on `template-shell`. The Viewer host is a nested host inside that application, not an application of its own. The template's code has parts with different roles: the engine and the Viewer host that every consuming product needs, and a library of widgets. Dashboard content itself comes from the consuming product backend at run time ([ADR-0011](0011-backend-delivered-dashboard-v1.md)), so the packages carry only types and code.

The dashboard has to mount inside the shell's existing extension domains: a screen domain for the Viewer host and a modal domain for the widget modal. Those domains belong to the shell and their identifiers may change. The shell registers both, but today it renders only the screen domain through a slot; the modal domain has no rendered slot. Docs and code need a stable way to refer to these domains, and the template needs a stated list of what it requires from the host.

How does the template split into packages, what does it depend on, and what does it require from the host?

## Decision Drivers

* Minimal dependencies: the template depends on `template-shell` only and takes nothing from `template-mfe`.
* Dashboard content is not packaged: it comes from the consuming product backend, so the manifest channel carries only GTS types and MFE entries.
* Stability against shell changes: host domain IDs are resolved from shell constants, never typed as literals.
* Isolation of widgets: each widget MFE instance is isolated by FrontX (FrontX ADR-0011), so the packages must not rely on shared singletons.

## Considered Options

1. **Two packages on `template-shell`, host contract by role** — a Viewer host package and a widget package, a dependency on `template-shell` only, and host requirements stated by role.
2. **Dependency on `template-mfe`** — build the dashboard on the reference MFE scaffold.
3. **Own host application** — the dashboard ships its own shell.

## Decision Outcome

Chosen option: "Two packages on `template-shell`, host contract by role", because the dashboard runs in the consuming product's existing shell-based application, depends on the shell alone, and names what it needs from the host by role, so a change of a shell identifier stays contained.

The decision:

* **Dependencies.** The template requires `template-shell` and depends on it only. It takes nothing from `template-mfe`.
* **Manifest channel.** Each package's `mfe.json` carries only GTS types and MFE entries. Dashboard content (dashboards with their embedded layout and widget instances, and widget data) never travels through `mfe.json`; it comes from the consuming product backend: the dashboard definition, and each widget's data on its own request ([ADR-0011](0011-backend-delivered-dashboard-v1.md)).
* **Packages, split by role.**
  * `dashboard-viewer`: the engine schemas (`frontx.v.*` and `frontx.m.*`), the Viewer host entry, and the modal-container entry. The Viewer host entry's extension in the host screen domain is a routed extension (FrontX ADR-0036); it uses the shell's screen extension type and its `route` field.
  * `dashboard-widgets`: one `mf_manifest` and 9 widget entries.
* **Host contract.** The template names host domains by role: the host screen domain and the host modal domain. Their current `template-shell` IDs are resolved from shell framework constants and never written as literals. Requirements on the host:
  * The host screen domain accepts routed extensions of the shell screen extension type and mounts one screen at a time.
  * The host modal domain accepts plain extensions and uses the optional mount strategy (zero or one occupant).
  * The host renders the host modal domain through a domain slot with modal chrome, focus kept inside the modal (focus trap) and dismissal. Current `template-shell` registers this domain but renders no slot for it, so the slot is a prerequisite `template-shell` change tracked outside `template-dashboard`. Without it the template builds and the dashboard works, but the widget modal cannot be shown.
  * The shell serves the aggregated MFE manifest that the Viewer host's registry reads.
  * The theme shared property carries the host theme id, and only the id; the template derives light or dark mode from it through its own theme-id map (ADR-0006). The language shared property is provided.

### Consequences

* Good, because the dashboard runs in any `template-shell`-based application that meets the host requirements; the widget modal additionally needs the host modal-domain slot.
* Good, because the manifests carry only types and MFE entries, so a new dashboard needs no package change.
* Good, because role-based references survive a rename of shell domain IDs; only the constant lookup tracks it.
* Bad, because the contract with the host is by role and depends on the shell exposing its domain constants and accepting plain extensions in its modal domain.
* Bad, because the widget modal depends on a host prerequisite that current `template-shell` does not meet: a rendered modal-domain slot with modal chrome, focus trap and dismissal, delivered by a shell change outside this template.
* Bad, because widgets cannot share module singletons: each widget instance evaluates its own dependencies (FrontX ADR-0011), which affects bundle size (`cpt-frontx-dashboard-nfr-bundle-budget`). Mitigation: FrontX ADR-0034 reuses the source text of a shared dependency across MFEs when content hashes match, which can save repeated fetches; evaluation stays per instance (FrontX ADR-0011). ADR-0004 records the per-instance cost of the charting library for the budget.
* Neutral, because the 9 widget entries share one manifest and one package, so consumer widget kinds ship as separate packages.

### Confirmation

Confirmed when:

* A dependency check finds that the template's packages depend on `template-shell` and the FrontX packages only, and on nothing from `template-mfe`.
* A grep over template code finds no literal host domain IDs; they come from shell framework constants.
* The Viewer host mounts in the host screen domain through `Extension.route`, and the modal container mounts in the host modal domain with theme and language shared properties.
* On a host that renders the modal-domain slot, the open modal shows modal chrome, traps focus and closes on dismissal.
* No package's `mfe.json` contains a dashboard, widget instance or widget data.
* Bundle sizes are measured and checked against the provisional figures of `cpt-frontx-dashboard-nfr-bundle-budget` in the DESIGN (§3.9), with the modal container entry counted separately from the Viewer host MFE.

## Pros and Cons of the Options

### Two packages on `template-shell`, host contract by role

* Good, because the dashboard runs in the consuming product's existing shell-based application and depends on the shell alone.
* Good, because the packages are split by role: the engine and Viewer host that every consuming product needs, and the widget library.
* Good, because naming host domains by role keeps shell identifier changes out of template code.
* Bad, because it relies on the host contract holding, including a modal-domain slot that current `template-shell` does not render.

### Dependency on `template-mfe`

* Good, because it provides a working MFE scaffold to copy from.
* Bad, because the dashboard would make consuming products carry an example package set they do not need.
* Bad, because it ties the dashboard's release to the scaffold's version and ownership.

### Own host application

* Good, because the dashboard controls its domains and has no host contract.
* Bad, because consuming products already have a shell and would have to run two applications or migrate.
* Bad, because it duplicates what `template-shell` provides.

## More Information

* [ADR-0011](0011-backend-delivered-dashboard-v1.md) decides that the dashboard definition and each widget's data come from the consuming product backend; this record keeps that content out of the packages.
* Related FrontX records (FrontX's own decisions, not this template's ADRs): FrontX ADR-0011 (per-load isolation), FrontX ADR-0034 (shared-dependency source-text reuse by content hash), FrontX ADR-0036 (extension routing).
* **Review trigger:** revisit if `template-shell` stops exposing its domain constants or stops accepting plain extensions in its modal domain, if the shell change that renders the modal-domain slot is rejected or takes a different form, or if measured per-widget sizes cannot meet the bundle budget.
* **Scope:** how the template splits into packages, what it depends on and what it requires from the host. Domain taxonomy and the modal container are in ADR-0007; where dashboard content comes from is in [ADR-0011](0011-backend-delivered-dashboard-v1.md).
* **Checklist applicability:** ARCH applicable and addressed above. INT applicable: the host contract by role and the manifest channel. MAINT applicable: one template dependency and role-based host references. PERF applicable: per-instance isolation affects bundle size, checked in Confirmation. TEST applicable: dependency and grep checks in Confirmation. UX applicable in one respect: modal chrome, focus trap and dismissal are a host requirement on the rendered modal-domain slot. SEC not applicable because isolation is decided in FrontX ADR-0011 and no credential is involved. OPS, REL, DATA, COMPL and BIZ not applicable because the package split decides no operational procedure, runtime failure handling, stored data, regulated processing or business rule.

## Traceability

- **PRD**: [PRD.md](../PRD.md)
- **DESIGN**: [DESIGN.md](../DESIGN.md)

This decision directly addresses the following requirements or design elements:

* `cpt-frontx-dashboard-fr-viewer-host` — the routed Viewer host in the host screen domain.
* `cpt-frontx-dashboard-fr-widget-catalog` — the widgets package with 9 entries.
* `cpt-frontx-dashboard-contract-host-domains` — the host contract by role, including the rendered modal-domain slot.
* `cpt-frontx-dashboard-fr-widget-modal` — the widget modal requires the host modal-domain slot.
* `cpt-frontx-dashboard-fr-backend-source` — dashboard content comes from the consuming product backend, not from the manifests.
* `cpt-frontx-dashboard-constraint-shell-only-dependency` — the template depends on `template-shell` only.
* `cpt-frontx-dashboard-constraint-role-based-host-ids` — host domains are named by role and resolved from shell constants.
* `cpt-frontx-dashboard-nfr-compatibility` — compatibility with the shell and FrontX.
* `cpt-frontx-dashboard-nfr-bundle-budget` — isolation without shared singletons affects size.
* `cpt-frontx-dashboard-actor-host-application` — the host that must meet the listed requirements.
