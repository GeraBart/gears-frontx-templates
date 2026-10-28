---
status: accepted
date: 2026-10-27
decision-makers: template-dashboard architecture maintainers
description: "Decision record for the type system of the template's domain model: GTS under gts-spec v0.17 on the FrontX base types, with the frontx vendor, the v and m packages, combined instance identifiers, a widget base without traits and with a typed source, one generic widget data type, the widget realization type as the single v-to-m reference, and validation through the FrontX gts-plugin."
---

# ADR-0003: Shared data types and schemas

**ID**: `cpt-frontx-dashboard-adr-shared-data-types-and-schemas`

<!-- toc -->

- [Context and Problem Statement](#context-and-problem-statement)
- [Decision Drivers](#decision-drivers)
- [Considered Options](#considered-options)
- [Decision Outcome](#decision-outcome)
  - [Consequences](#consequences)
  - [Confirmation](#confirmation)
- [Pros and Cons of the Options](#pros-and-cons-of-the-options)
  - [GTS (gts-spec) on FrontX base types with one generic widget data type](#gts-gts-spec-on-frontx-base-types-with-one-generic-widget-data-type)
  - [GTS (gts-spec) on FrontX base types with one widget data type per widget type, named by a type-level trait](#gts-gts-spec-on-frontx-base-types-with-one-widget-data-type-per-widget-type-named-by-a-type-level-trait)
  - [Hand-maintained TypeScript interfaces](#hand-maintained-typescript-interfaces)
  - [Plain JSON Schema or OpenAPI documents without a type system](#plain-json-schema-or-openapi-documents-without-a-type-system)
- [More Information](#more-information)
- [Traceability](#traceability)

<!-- /toc -->

## Context and Problem Statement

The Viewer host, the widgets, the consuming product backend that delivers dashboard definitions and widget data, and consumer code exchange dashboards (with their embedded layout and widget instances), widget data results, and the links between widget types and the MFE parts that show them. A consuming product backend may also generate dashboard definitions, for example from a user's chat request, and must be able to validate what it generates before it stores or returns it. All parties need one governed set of types and schemas, so that contracts do not drift. Which type system should define them, under which version of its rules, and how should widget types relate to the data they show?

FrontX builds its micro-frontend contracts on GTS (the Global Type System, specified by gts-spec), with base types under `gts.frontx.mfes.*`. The template's types must build on those FrontX base types. The consuming product backend computes every widget's data from a named metric, and every metric result has the same tabular shape: ordered column names, positional rows, and the names of the percentage columns.

## Decision Drivers

* The types must integrate with FrontX base types for extensions, domains, entries, and actions.
* Identifiers must be readable and must encode vendor, package, and version.
* Schema evolution must be safe, so that published identifiers never change meaning.
* Identifiers from this template must not collide with FrontX identifiers or with identifiers from other templates.
* A written or generated dashboard definition must be checkable against the registered types alone, without template code, including every embedded widget against the widget type its `id` names.
* The browser must validate through one path, the FrontX gts-plugin, with no validation code of the template's own.
* The data contract must not grow with the widget catalog: every metric result has one tabular shape, whatever widget shows it.
* A consuming product may add dashboard-level fields without editing the template, but in v1 the widget types and their settings stay owned by the template.

## Considered Options

* GTS (gts-spec) on FrontX base types with one generic widget data type
* GTS (gts-spec) on FrontX base types with one widget data type per widget type, named by a type-level trait
* Hand-maintained TypeScript interfaces
* Plain JSON Schema or OpenAPI documents without a type system

## Decision Outcome

Chosen option: "GTS (gts-spec) on FrontX base types with one generic widget data type", because FrontX already uses GTS for its own contracts, so the template types compose with extension, domain, entry, and action types, and because one widget data type matches the single tabular shape that every metric result has.

The conventions are:

* Vendor is `frontx`. Package `m` (model) holds what describes a dashboard: the dashboard, the layout and cell, the widget base, and the 9 template widget types. Package `v` (view runtime) holds what the runtime exchanges: the widget data type, the template action, the `layout_cells` domain, its extension type, and the widget realization type. Identifiers look like `gts.frontx.m.*` and `gts.frontx.v.*`.
* Namespace ownership: the FrontX project owns the `frontx` vendor and all of `gts.frontx.*`. Under it, this template reserves the packages `v` and `m`. The `mfes` package (`gts.frontx.mfes.*`) stays owned by the FrontX mfes package.
* Base types come from `gts.frontx.mfes.*`. Derived types are chained after a base, for example the template action derived from the FrontX action base.
* ID form: type identifiers end with `~`, and instance identifiers do not.
* Target rules: gts-spec v0.17. The conventions use its identifier forms (§2, §3.7), reference keywords (§9.6), modifiers (§9.11) and registry operations (§5.3, OP#6).
* Instance identifiers always carry their type chain and are never split into parts. Dashboards and widget instances use the combined anonymous form `<type chain>~<UUID>`, with the UUID generated by the consuming product backend. Instances never carry a separate `type` field: the type is the identifier prefix up to the last `~`. The `id` of a dashboard and of a widget instance is constrained with `x-gts-instance-ref: "/$id"`, so it must be an instance of the type it is validated against.
* Reference keywords follow what a field holds: `x-gts-type-ref` for a type identifier, `x-gts-instance-ref` for an instance identifier, and `x-gts-pattern-ref` for an identifier pattern. The pre-v0.17 keyword `x-gts-ref` is not used.
* The widget base `gts.frontx.m.widget.widget.v1~` is abstract (`x-gts-abstract: true`), so every widget instance belongs to one of the 9 concrete template widget types derived from it. The base declares `id`, `title`, and a typed `source` with `metric` (a required non-empty string that names a backend metric), `range` (an optional time window in the form the backend defines), and `bucket` (an optional bucketing flag). `source.metric` is a plain string, not a GTS type or reference, because metrics are run-time data of the backend. The template passes `source` through unchanged and gives it no meaning.
* The widget base declares no traits. A widget type does not name a data type; it names, in its presentation configuration, the result columns it uses for each role (its column binding, decided in [ADR-0009](0009-subject-agnostic-widget-catalog-v1.md)).
* Widget data has one concrete type, `gts.frontx.v.widget_data.widget_data.v1~`, with no abstract data base above it. It mirrors the generic tabular result: the ordered column names, the rows as positional value arrays, and the names of the percentage columns. A result is computed for each request and is not stored, so it carries no `id`. Every widget validates every result against this one type, whatever its widget type, and then checks that its bound columns are present.
* The widget realization type `gts.frontx.v.mfe.widget_realization.v1~` lives in package `v`. Its field `widget_type` is constrained with `x-gts-type-ref` to the widget base, and it is the single deliberate reference from `v` into `m` ([ADR-0008](0008-widget-type-and-mfe-realization-v1.md)). Package `m` holds no reference into `v`. The dashboard's embedded `layout` and the cell's embedded `widget` stay inside package `m`.
* No consumer widget types in v1: every widget instance's `id` chain ends at one of the 9 template widget types. A consuming product may derive a dashboard subtype that adds dashboard-level fields only; the Viewer host ignores those fields, and widget settings cannot be added in this version.
* Validation: in the browser, all schema validation goes through the FrontX gts-plugin, built on gts-ts, which resolves each embedded widget polymorphically against the type its `id` names. The template writes no validation code of its own. A consuming product backend registers the template types in its own GTS registry (§5.3) and validates every dashboard it serves, written or generated, under OP#6.
* Every template identifier starts at `v1`. Identifiers are frozen from the first non-alpha release of the template. Alpha releases may still change them. After the freeze, an incompatible change to a published identifier ships as a new version.
* Types that stay inside TypeScript, such as internal view-model state, are not given GTS identifiers.

### Consequences

* Good, because widget, domain, realization, and action types compose with FrontX types through chaining.
* Good, because identifiers make vendor, package, and version visible to readers and tools.
* Good, because the frozen `v1` rule gives consumers stable contracts from the first non-alpha release.
* Good, because a written or generated definition can be validated against registered types alone, and gts-ts resolves each embedded widget against its own widget type without template code.
* Good, because one widget data type keeps the data contract the same for every metric and every widget type, so adding a widget type adds no data type.
* Good, because package `m` does not depend on `v`, so dashboards stay valid when MFE parts are re-released or replaced.
* Good, because an identifier alone tells its type, so no `type` field can disagree with it.
* Bad, because contributors must learn GTS syntax and its reference annotations.
* Bad, because the conventions depend on v0.17 features (typed reference keywords and abstract types), so validators and registries must support v0.17.
* Bad, because the type system cannot check that a metric exists or returns the columns a widget binds; the consuming product checks this when it authors a dashboard, and the widget checks it at run time.
* Bad, because frozen identifiers mean mistakes in `v1` that survive the alpha releases can only be fixed by a new version.
* Bad, because all FrontX templates share one vendor namespace, so collisions are prevented by a rule and by review, not by the type system. The rule: no template may define a type or instance whose own (last) chain segment is in the `mfes` package or in a package that another template reserves.

### Confirmation

Confirmed by validating all type and instance files against the GTS v0.17 rules in CI through the FrontX gts-plugin, including a widget data fixture for each widget type against the single widget data type, and by a review check that every new identifier uses the `frontx` vendor, one of the reserved packages `v` or `m` for its own segment, a `v1` start, and the correct `~` form. Review also confirms that:

* no schema uses `x-gts-ref`, no instance carries a separate `type` field, and dashboards and widget instances use combined identifiers;
* the widget base declares `source` with a required `metric` and optional `range` and `bucket`, and declares no traits;
* no package `m` schema references a package `v` type, and `widget_realization.widget_type` is the only reference from `v` into `m`;
* no template schema defines a widget data type other than `gts.frontx.v.widget_data.widget_data.v1~`;
* the Viewer host and the widgets call no validation code other than the FrontX gts-plugin.

## Pros and Cons of the Options

### GTS (gts-spec) on FrontX base types with one generic widget data type

Types and instances are JSON files with GTS identifiers, chained from FrontX bases. Widget types describe presentation and the typed `source`; every result validates against one widget data type.

* Good, because it matches the FrontX platform.
* Good, because it supports inheritance chains and version compatibility rules.
* Good, because it validates both schemas and instances, including embedded widgets resolved polymorphically.
* Good, because the data contract is one shape for every metric, independent of the catalog.
* Neutral, because it needs governance discipline for versions.
* Bad, because it adds a toolchain and conventions to learn.
* Bad, because the match between a metric and a widget's bound columns is checked by the consumer and at run time, not by the types.

### GTS (gts-spec) on FrontX base types with one widget data type per widget type, named by a type-level trait

The widget base declares a traits schema with a required data type reference, each widget type closes it with its own widget data type derived from an abstract data base, and the registry checks trait completeness.

* Good, because the pairing of a widget type and its data shape is checked once per type.
* Bad, because every metric returns the same tabular shape, so the backend would have to reshape each result for the widget type that asks, and the data contract would grow with every widget type.
* Bad, because package `m` would reference package `v` through the trait, coupling the model to the view runtime.
* Bad, because it needs trait support in every validator and registry for a check that the column binding already covers at run time.

### Hand-maintained TypeScript interfaces

Types are written only as TypeScript interfaces.

* Good, because there is no extra tooling.
* Bad, because the interfaces cannot validate JSON dashboard definitions or widget data at run time.
* Bad, because a consuming product backend cannot validate generated definitions against them.
* Bad, because they do not compose with the FrontX type chain.

### Plain JSON Schema or OpenAPI documents without a type system

Schemas are standalone documents without identifiers or chaining.

* Good, because the formats are widely understood.
* Bad, because there is no shared identifier or inheritance model, so an embedded widget cannot name the type it is validated against.
* Bad, because it would sit beside, not on, the FrontX contracts.

## More Information

* **Review trigger**: revisit this decision when gts-spec moves past v0.17 or the FrontX mfes package changes its base types or chaining rules, when consumer widget types are taken up (they need a way for the backend to register widget types and traits that the backend uses to generate instances), and confirm the identifiers before the first non-alpha release freezes them.
* **Scope**: this decision covers the type system, the vendor and package namespace, the identifier form, the reference rules between packages, the widget data type, the validation path, and versioning. It does not cover the field-level content of the domain model, which the DESIGN and the domain-model FEATURE documents describe, which widget types exist ([ADR-0009](0009-subject-agnostic-widget-catalog-v1.md)), or how widget types link to MFE entries ([ADR-0008](0008-widget-type-and-mfe-realization-v1.md)).
* **Checklist applicability**: ARCH applicable (one type system for all contracts, and the `m`/`v` reference direction); PERF N/A (validation cost falls under the initial-render budget and is not decided here); SEC N/A (no trust boundary or credentials are introduced; validation of untrusted definitions and results is covered under DATA); REL N/A (no run-time failure mode is decided here; failed validation maps to the cannot-show states of [ADR-0011](0011-backend-delivered-dashboard-v1.md)); DATA applicable (schemas, identifiers, the single widget data type, versioning, and the freeze point); INT applicable (composition with FrontX base types, validation through the FrontX gts-plugin, and consumer dashboard subtypes); OPS N/A (no deployment or operational change); MAINT applicable (namespace ownership, collision rule, and version governance); TEST applicable (GTS validation in CI); COMPL N/A (no regulated data or new license); UX N/A (no user-facing behavior); BIZ applicable (consumers describe and validate dashboards with the template types and may add dashboard-level fields only).
* Related decision: FrontX ADR-0007 (action dispatch) routes actions by target and action type, which is how the template action reaches its targets. It does not define the action base type. That base type is the `gts.frontx.mfes.comm.action.v1~` schema of the FrontX mfes package, and `set_widget_context` is derived from it.
* The full domain model is described in the DESIGN, not here.

## Traceability

- **PRD**: [PRD.md](../PRD.md)
- **DESIGN**: [DESIGN.md](../DESIGN.md)

This decision directly addresses the following requirements or design elements:

* `cpt-frontx-dashboard-fr-domain-model` — the domain model is published as GTS types under the `frontx` vendor; consuming products describe their dashboards with it and add no widget types or widget settings in v1.
* `cpt-frontx-dashboard-interface-domain-model` — consumers validate written or generated dashboards against the registered template types and may derive a dashboard subtype with dashboard-level fields.
* `cpt-frontx-dashboard-fr-widget-catalog` — the 9 widget types derive from the abstract widget base, which carries the typed `source` and no traits.
* `cpt-frontx-dashboard-principle-gts-contracts` — dashboards, widgets, widget data, and widget realizations are GTS v0.17 types, validated in the browser only through the FrontX gts-plugin.
* `cpt-frontx-dashboard-constraint-gts-id-convention` — identifier form, combined instance identifiers, reference keywords, and the `v1` freeze.
* `cpt-frontx-dashboard-interface-widget-realization` — the realization type in package `v` holds the single reference into package `m`.
