---
status: accepted
version: 1
priority: p1
date: 2026-10-31
decision-makers: template-dashboard architecture maintainers
description: "Decision record on how template-dashboard splits into packages, what the manifest channel carries, how the template serves its own GTS file of types and instances, where the dashboard root runs, how template schemas are registered, how shared dependencies are fetched and counted, and what the template requires from the host: a container, a dashboard id, and the theme and language values."
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
  - [Two packages, hosting-agnostic, host contract by role](#two-packages-hosting-agnostic-host-contract-by-role)
  - [One package per widget type](#one-package-per-widget-type)
  - [A fixed host application](#a-fixed-host-application)
  - [The dashboard root only as a screen extension](#the-dashboard-root-only-as-a-screen-extension)
- [More Information](#more-information)
- [Traceability](#traceability)

<!-- /toc -->

## Context and Problem Statement

The dashboard runs inside a host application. The template is a blueprint: the product copies it into its project and modifies it. The template's code has parts with different roles: the dashboard root, which owns the `widgets` domain and renders dashboards; and a library of widgets, each widget type with one FrontX MFE entry ([ADR-0007](0007-extension-domain-taxonomy-v1.md), [ADR-0008](0008-widget-type-and-mfe-realization-v1.md)). The template has no backend access of its own; the product's API answers the requests a binding makes ([ADR-0011](0011-widget-data-binding-v1.md)). A product may change which entry a template widget type points to, in its own copy of the served file.

The GTS types and instances (widget types, data types, entries) are read at runtime, never baked in at build time. In v1 they come from a JSON file the template serves as if from a backend; a product may serve its own. The bundle schemas are registered before the file is fetched.

FrontX isolates every widget instance (FrontX ADR-0011). A shared dependency is built as one standalone chunk, and its source text is fetched once only when every template widget publishes the same `contentHash` for it (FrontX ADR-0034); the cache reaches the whole realm (FrontX ADR-0035). The realm cache holds 128 entries. This shapes the download size.

How does the template split into packages, what does it depend on, where does the served GTS file come from, where are the template's schemas registered, how are shared dependencies fetched and counted, and what does the template require from the host?

## Decision Drivers

* **Hosting-agnostic.** The dashboard root can be copied into a single-page application or into a host that runs a screen, with no restriction. The template depends on FrontX packages only, never on a host or shell template.
* Sign-in is out of scope; each request a binding makes is authenticated by the product's API setup.
* No dashboard content and no backend configuration are packaged: dashboards and widget data come from the served file and the product's API.
* The template's schemas must be registered before any dashboard loads, in either hosting form.
* A product changes which entry a widget type points to by editing its copy of the served file, with no template change.
* Per-instance isolation: no package relies on state shared between instances, and the download size, with each shared dependency fetched once, stays within the budget (`cpt-frontx-dashboard-nfr-bundle-budget`).

## Considered Options

* Two packages, hosting-agnostic, host contract by role
* One package per widget type
* A fixed host application
* The dashboard root only as a screen extension

## Decision Outcome

Chosen option: "Two packages, hosting-agnostic, host contract by role", because the dashboard runs in the product's existing application, depends on FrontX packages alone, keeps the widget library one release unit, lets a product change entries in its own copy of the served file, leaves the hosting of the dashboard root to the product, and names what it needs from the host by role.

* **Dependencies.** The template depends on the FrontX packages it pins to exact published versions, including `@gears-frontx/ui-kit`, on a FrontX release that runs GTS v0.17. It depends on no host or shell template. It carries no endpoint configuration and makes no backend call: only the product's API answers the requests a binding makes ([ADR-0011](0011-widget-data-binding-v1.md)). Each evaluated copy of the API package has its own `apiRegistry` and plugins. In a single-page application the root shares the host's copy. In an MFE the root has its own copy, which the product configures in its copy of the template.
* **Packages, split by role.**
  * `dashboard`: the GTS types the template owns, in the `dashboard` package ([ADR-0003](0003-shared-data-types-and-schemas-v1.md)) — the dashboard type, the widget base, `data_widget`, the widget-data base, the `render_widget` action, the `widgets` domain and its extension type, the theme and language shared-property types. It also holds the code of the dashboard root, the binding runner, the cell frame and the larger-view overlay, the trait helper, and the template's GTS file.
  * `widgets`: one manifest. Per widget type it declares one entry, 9 entries in all. The entry is a plain FrontX MFE entry ([ADR-0008](0008-widget-type-and-mfe-realization-v1.md)). The package has no data-request code and no error chrome: a widget renders `render_widget` and shows its own empty state; the cannot-be-shown state in a cell is shown by the dashboard root, and its code is in `dashboard`. The cell frame belongs to the root, not to `widgets`.
* **Hosting of the dashboard root is abstract.** The dashboard root is either a screen extension the host mounts, or code copied into a single-page application. Everything else holds for both forms. The product copies the template into its project and modifies it for its form.
* **Registration of the template's schemas.** The bundle schemas (the contract types, the `render_widget` action, the `widgets` domain and its extension type, the shared-property types) are registered before any dashboard loads. When the dashboard root is a screen extension, they are registered through a template package manifest; otherwise the host's own bootstrap registers them. They are registered before the served file is fetched, so the bundle-schema guard (ADR-0003) can reject a colliding served type.
* **Manifest channel.** Each package's manifest carries GTS types, MFE entries and static extensions. Dashboards, widget instances and widget data never travel through the manifest; they come from the served file and the product's API.
* **The served GTS file.** The template serves its own JSON file of GTS types and instances (widget types, data types, entries) that are not part of a manifest. The dashboard root fetches it at start, as if a backend returned it, and registers its contents before any dashboard loads. A product changes which entry a widget type points to by editing its copy of the file. A backend that returns GTS types and instances can replace the file without changing the dashboard root. Nothing in the flow depends on where the file comes from.
* **Shared dependencies and budget basis.** In every template widget entry, the packages listed in the manifest's `shared` array are built as shared dependencies, one standalone chunk each. The source text of a shared dependency is fetched once only when every template widget publishes the same `contentHash` for it (FrontX ADR-0034), and the cache reaches the whole realm (FrontX ADR-0035). The realm cache holds 128 entries. Each widget instance still evaluates its own copy (FrontX ADR-0011), so no state is shared between instances. The budget counts transferred gzipped bytes on a cold load of the reference dashboard: the dashboard root with the shared dependencies it fetches, each widget entry with its own code only, and each shared dependency once in the page total. The provisional figures are in the DESIGN.
* **Host contract by role.** The template names what it needs from the host by role: a container for the dashboard root, a dashboard id (for example from its route), and the theme and language values. It depends on no host or shell template.
* **Template changes reach a product's copy by merging a template release.** The release notes of each release list the changes to the contract: the widget types, the data shapes, the binding, and the `render_widget` action. Product code lives outside template-owned files, so release merges stay clean.

### Consequences

* Good, because the dashboard runs in any host application that meets the role-based requirements, with no dependency on a host or shell template.
* Good, because the manifests carry no dashboard content and the template holds no endpoint configuration, so a new dashboard needs no package change.
* Good, because a product changes which entry a widget type points to by editing its copy of the served file, with no template change.
* Good, because the served GTS file lets a backend that returns GTS types and instances replace it without changing the dashboard root.
* Good, because building the listed packages as shared dependencies lets FrontX fetch the source text of each once, and the budget counts it once.
* Bad, because the product copies and modifies the template, so its copy can drift from the template. The contract is the stable part: the widget types, the data shapes, the binding, and `render_widget`. A product takes template changes by merging a release.
* Bad, because widgets cannot share state between instances: each evaluates its own copy of every shared dependency (FrontX ADR-0011). Source reuse saves fetches, not evaluation; the evaluation cost falls under the initial-render budget.
* Bad, because the single fetch of a shared dependency holds only while every template widget publishes the same `contentHash` for it; widgets built from different package versions fetch it once per distinct hash and exceed the budget basis.
* Neutral, because the 9 widget types share one manifest and one package, so they are released together.

### Confirmation

Confirmed when:

* A dependency check finds the template's packages depend on the pinned FrontX packages only, and on no host or shell template.
* A search of the template finds no endpoint configuration, and `widgets` contains no code that requests data from a backend and no error chrome. Its widgets show only their own empty state; the cannot-be-shown state in a cell is shown by the dashboard root, and its code is in `dashboard`.
* A test confirms the `widgets` manifest declares exactly 9 entries, one per widget type, and each served type names one.
* A test confirms no package manifest carries a dashboard, a widget instance or widget data.
* A test confirms the dashboard root fetches the served GTS file at start and registers its contents before any dashboard loads; a test that serves the same GTS types and instances from a test backend instead of the file changes nothing.
* A test confirms a product that sets a different `entry` on a template widget type in its copy of the served file mounts that entry, with no template change.
* A test confirms the bundle schemas are registered before the served file is fetched, and a served type whose id equals a bundle base is rejected.
* A check confirms each template release has release notes that list the changes to the contract (the widget types, the data shapes, the binding, and the `render_widget` action).
* A check confirms every listed shared package passes the package-wide licence check, and all template widgets publish the same `contentHash` for each shared dependency.
* Build review confirms the packages listed in each manifest's `shared` array are built as shared dependencies and no widget relies on state shared between instances.
* A measurement confirms transferred gzipped bytes on a cold load of the reference dashboard, with each shared dependency counted once, and records one fetch per shared dependency.
* Both hosting forms are exercised: the dashboard root mounts as a screen extension in one, and is copied into a single-page application in the other.

## Pros and Cons of the Options

### Two packages, hosting-agnostic, host contract by role

A `dashboard` package and a `widgets` package, a dependency on FrontX packages only, and host requirements stated by role.

* Good, because the dashboard runs in any host that meets the role-based requirements, with no host or shell template dependency.
* Good, because the widget library is one release unit, and a product changes entries in its own copy of the served file.
* Good, because the served GTS file can be replaced by a backend without changing the dashboard root.
* Bad, because the product's copy can drift from the template; the contract is the stable part.

### One package per widget type

The `dashboard` package plus 9 widget packages, each with its own manifest.

* Good, because each widget type is released on its own.
* Bad, because 9 widget packages and 9 manifests are a heavy split for a catalog that is released together.
* Bad, because a product must merge 9 packages to take a catalog change.

### A fixed host application

The template ships its own host application.

* Good, because the template controls the whole application.
* Bad, because the product already has an application; the template must be hosting-agnostic, not impose a host.

### The dashboard root only as a screen extension

The template fixes the dashboard root as a screen extension the host mounts.

* Good, because a screen extension is one clean hosting form.
* Bad, because a single-page application that has no screen domain could not host the dashboard root; the template must be hosting-agnostic.

## More Information

* **Review trigger**: revisit when a product needs a hosting form the role-based contract cannot meet, or when FrontX changes shared-dependency fetching.
* **Scope**: this decision covers the package split, the dependencies, the served GTS file, schema registration, shared dependencies and the budget basis, and the host contract by role. It does not cover the widget catalog ([ADR-0009](0009-subject-agnostic-widget-catalog-v1.md)), the `widgets` domain and `render_widget` ([ADR-0007](0007-extension-domain-taxonomy-v1.md)), the binding runner ([ADR-0011](0011-widget-data-binding-v1.md)), or the GTS conventions ([ADR-0003](0003-shared-data-types-and-schemas-v1.md)).
* **Checklist applicability**: ARCH applicable; PERF applicable (shared dependencies fetched once, budget basis); SEC applicable (no endpoint config, no backend call); REL N/A; DATA N/A; INT applicable (FrontX packages and the host contract); OPS N/A; MAINT applicable (the contract is the stable part); TEST applicable; COMPL applicable (permissive licences only); UX N/A; BIZ applicable (hosting-agnostic keeps adoption cheap).
* Related decisions: FrontX ADR-0011 (instance isolation), FrontX ADR-0034 (shared dependency source-text reuse by content hash), FrontX ADR-0035 (realm-wide reach of that reuse).

## Traceability

- **PRD**: [PRD.md](../PRD.md)
- **DESIGN**: [DESIGN.md](../DESIGN.md)

This decision directly addresses the following requirements or design elements:

* `cpt-frontx-dashboard-fr-runtime-source` — the served GTS file is the v1 runtime source; a backend can replace it without changing the dashboard root.
* `cpt-frontx-dashboard-contract-host` — the template depends on FrontX packages only, never on a host or shell template, and the host supplies a container, a dashboard id, and the theme and language values.
* `cpt-frontx-dashboard-nfr-bundle-budget` — shared dependencies are fetched once and counted once in the page total.
* `cpt-frontx-dashboard-fr-add-fix-widget` — a product changes which entry a widget type points to in its own copy of the served file.
