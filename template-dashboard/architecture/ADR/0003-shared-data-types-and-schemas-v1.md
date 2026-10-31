---
status: accepted
version: 1
date: 2026-10-31
decision-makers: template-dashboard architecture maintainers
description: "Decision record for the GTS conventions of the template's types: GTS v0.17 with 2020-12 schemas, one dashboard package (D18) with namespaces dashboard, widget, widget_data and mfe, literal base operands for embedded ids, per-instance registration of embedded widgets and stamped data (D13, D20), open bases and closed leaves, and a bundle-schema guard that rejects a served type whose id equals a bundle base."
---

# ADR-0003: GTS conventions for the template's types

**ID**: `cpt-frontx-dashboard-adr-shared-data-types-and-schemas`

<!-- toc -->

- [Context and Problem Statement](#context-and-problem-statement)
- [Decision Drivers](#decision-drivers)
- [Considered Options](#considered-options)
- [Decision Outcome](#decision-outcome)
  - [Consequences](#consequences)
  - [Confirmation](#confirmation)
- [Pros and Cons of the Options](#pros-and-cons-of-the-options)
  - [Id operand for embedded instances](#id-operand-for-embedded-instances)
  - [Validation of embedded instances](#validation-of-embedded-instances)
  - [Package layout](#package-layout)
  - [GTS version](#gts-version)
- [More Information](#more-information)
- [Traceability](#traceability)

<!-- /toc -->

## Context and Problem Statement

The template's types and instances (dashboards, widget types, data types, widget entries, widget instances) are written as GTS types and instances on the FrontX base types under `gts.frontx.mfes.*`. A dashboard embeds widget instances, and a binding stamps a data instance; both carry their own ids that name their own derived types. All parties need the same conventions for ids, packages, validation and registration, so a dashboard can be checked against registered types and the contracts do not drift. Which GTS conventions does the template follow, and under which GTS version?

## Decision Drivers

* A dashboard must be checkable against the registered types, including every embedded widget instance against the type its own id names.
* Id fields of embedded types must accept the ids they are meant to hold; `/$id` would resolve to the type being validated (the dashboard) and reject every widget id.
* A widget that fails its own validation must fail only its cell (D13), so each embedded widget is registered on its own.
* Stamped data must be validated against its data type, and the store has no removal, so a per-cell id keeps the store bounded while every load re-validates (D20).
* The template relies on `x-gts-instance-ref`, `x-gts-type-ref`, `x-gts-abstract` and traits as GTS v0.17 defines them.
* FrontX validates only by registering, and exposes no traits API, so the root resolves effective traits in its own code, following the spec.
* Template ids must not collide with FrontX ids; the `dashboard` package keeps them apart (D18).

## Considered Options

* Id operand: a literal base operand in `x-gts-instance-ref`, or `/$id`
* Validation: per-instance registration of embedded widgets and stamped data, or a single polymorphic validation of the dashboard
* Packages: one `dashboard` package (D18), or split model and view packages
* GTS version: target GTS v0.17, or interim workarounds on an older version

## Decision Outcome

Chosen options: a literal base operand; per-instance registration of embedded widgets and stamped data (D13, D20); one `dashboard` package (D18); and GTS v0.17 as a prerequisite. These four conventions are decided together as one coherent GTS-conventions set. Each is stated below.

* **Schema form.** Every type schema has a top-level `$schema` of `https://json-schema.org/draft/2020-12/schema` and a `$id` of `gts://<type id>`. The whole hierarchy uses that one dialect, because `unevaluatedProperties` needs 2019-09 or later. Derived types use `allOf` with `$ref` to their parent.
* **Ids.** Combined anonymous ids with lowercase UUIDs. No separate `type` field. Embedded instances carry no `$schema`. No GTS ids as object keys. Every id starts at `v1`.
* **Id operand.** Embedded `id` fields use literal base operands, never `/$id` (D3 `id` rules). `/$id` resolves to the type being validated (the dashboard), so it would reject every widget id.
* **One `dashboard` package (D18).** All template types live under one GTS package `dashboard`, with namespaces `dashboard`, `widget`, `widget_data` and `mfe`. The prefix `frontx.dashboard` keeps template ids apart from FrontX's own `gts.frontx.mfes.*` ids and from other templates.
* **Open bases, closed leaves.** The widget base, `data_widget` and the widget-data base are `x-gts-abstract: true`. They leave their top level and `params` open, so derived types can add and narrow. Every concrete type closes itself with `unevaluatedProperties: false`. That works through `allOf`, so base properties are not repeated.
* **Traits.** `x-gts-traits-schema` sits at the top level: `entry` on the widget base (with `x-gts-instance-ref` to `gts.frontx.mfes.mfe.entry.v1~frontx.mfes.mfe.entry_mf.v1~`), and `data_type` on `data_widget` (with `x-gts-type-ref` to the widget-data base). Neither trait schema is closed, so lower layers can add traits. Values go in `x-gts-traits` on the concrete type. The spec combines trait schemas along the chain and merges values root to leaf (RFC 7396), then fills defaults. A concrete type must set every required trait. FrontX exposes no traits API, so the root resolves effective traits in its own code, following the spec.
* **Per-instance registration (D13, D20).** Embedded instances are not validated against their own type by the GTS spec or gts-ts. A document is validated against the rightmost type of its own id, and an embedded object only against the schema at its position. So the root registers each embedded widget instance (cell `widget` and `larger_view`) on its own, which validates it fully against its own type; and it registers each stamped data instance on its own, which validates it against its data type. Widget instance ids are stable, so the store stays bounded. The type store is shared across the realm, per compatible plugin copy. Failures are per cell (D13).
* **Stamped data (D20).** The transform result is stamped with a deterministic combined id `<data type>~<UUIDv5(widget id | role)>` and registered, which validates it against its data type. FrontX validates only by registering. Instances are last-write-wins and the store has no removal, so a per-cell id means every load re-validates the new content while the store stays bounded by the number of cells. `render_widget.data` is typed by the widget-data base, which FrontX checks only at base level, so the root's registration is the real check.
* **`default`** in a schema documents a default and fills nothing. The widget applies its `params` defaults itself.
* **Bundle-schema guard.** The root's bundle carries the template's contract schemas (the dashboard type, the widget/data-widget/widget-data bases, the `render_widget` action, the `widgets` domain and its extension type `gts.frontx.mfes.ext.extension.v1~frontx.dashboard.mfe.widget_ext.v1~`, the theme and language shared-property types). They are registered before the served file is fetched. A served type whose id equals one of these bundle bases is rejected before anything registers; that is a dashboard-level failure (D13). Everything else in the file belongs to the product.

### Consequences

* Good, because a generated dashboard can be checked by its producer against the registered types, and each embedded widget and stamped data instance is validated on its own.
* Good, because per-cell ids keep the store bounded by the number of cells while every load re-validates.
* Good, because the literal operand holds wherever the type is embedded and accepts every derived id.
* Bad, because a dashboard that mentions long chained ids is verbose.
* Bad, because the template depends on the plugin's per-instance registration, on lookup off, on combined anonymous ids and on the reference keywords, none of which a bare GTS library guarantees. Mitigation: the DESIGN conformance tests.
* Bad, because FrontX can't list registered instances, so the root keeps its own index of what it registered.

### Confirmation

* A schema review confirms that every embedded `id` field uses a literal base operand and none uses `/$id`, that no schema declares an object whose keys are GTS ids, and that every concrete type closes itself with `unevaluatedProperties: false`.
* A test registers the bundle and a dashboard whose widget carries an embedded id that names a type that does not fit, and confirms the widget's own registration rejects it and only its cell fails.
* A test confirms a served type whose id equals a bundle base is rejected before anything registers, and the dashboard shows the dashboard-level cannot-be-shown state.
* A test confirms a stamped data instance whose id names a different data type than the widget's is rejected on registration.
* A test of the trait helper confirms that effective traits equal the RFC 7396 merge of the traits along the `$id` chain, with the trait schema defaults filled in.
* A dependency check confirms every template id starts with `gts.frontx.dashboard.`.

## Pros and Cons of the Options

### Id operand for embedded instances

**Literal base operand**

* Good, because the literal operand holds wherever the type is embedded and accepts every derived id.
* Good, because it reads the same in the schema and in its documentation.
* Bad, because the base type is written out in each id field.

**`/$id`**

* Good, because `/$id` is shorter to write.
* Bad, because `/$id` resolves to the top-level type being validated, so for an embedded id it checks against the wrong type and rejects valid instances.

### Validation of embedded instances

**Per-instance registration**

* Good, because each embedded widget and stamped data instance is validated against its own type, and a failure is attributed to its cell (D13).
* Good, because per-cell ids keep the store bounded by the number of cells (D20).
* Bad, because the root must register each embedded instance on its own and keep its own index, since FrontX can't list registered instances.

**Single polymorphic validation of the dashboard**

* Good, because one call checks everything embedded.
* Bad, because the GTS spec and gts-ts do not validate embedded instances against their own type, so the root would need a second step of its own code anyway, and a failed embedded widget could not be attributed to its cell alone.

### Package layout

**One `dashboard` package (D18)**

* Good, because one package has a single place to look, and the prefix `frontx.dashboard` keeps template ids apart from FrontX and other templates.
* Bad, because model and view concerns sit in one package.

**Split model and view packages**

* Good, because the model could be generated and checked without view types.
* Bad, because it adds a dependency direction to maintain, and the single-package form already keeps template ids apart by namespace.

### GTS version

**Target v0.17**

* Good, because the types are written once, in the form they keep.
* Good, because the keywords (`x-gts-type-ref`, `x-gts-instance-ref`, abstract types, traits) carry the checks the template would otherwise implement.
* Bad, because FrontX must run v0.17 (its gts-plugin pins gts-ts 0.3.0, which has the v0.17 reference keywords) before the checks work end to end.

**Interim workarounds**

* Good, because workarounds would run on an older GTS version.
* Bad, because workarounds need template code for reference kinds, abstract types and traits, redundant under v0.17.

## More Information

* **Reference existence (lookup mode).** The root runs validation with reference lookup off, so it cross-checks that `entry` and `data_type` exist in its own code. The spec suggests this as a policy among modes such as none, any-present and any-valid; under a lookup mode the anonymous combined ids of a dashboard, widget and data instance would be looked up and fail, because they are never registered.
* **Review trigger**: revisit when FrontX's GTS plugin changes its validation or listing behaviour, or when a validate-only GTS call arrives (O2).
* **Scope**: this decision covers the GTS schema form, id conventions, the package, validation and registration, stamped data, and the bundle-schema guard. It does not cover the widget catalog types ([ADR-0009](0009-subject-agnostic-widget-catalog-v1.md)), the `widgets` domain and `render_widget` ([ADR-0007](0007-extension-domain-taxonomy-v1.md)), the widget type → entry trait ([ADR-0008](0008-widget-type-and-mfe-realization-v1.md)), or the binding runner ([ADR-0011](0011-widget-data-binding-v1.md)).
* **Checklist applicability**: ARCH applicable; PERF N/A; SEC N/A; REL applicable (per-cell failure attribution); DATA applicable (schema form, id conventions, validation); INT applicable (GTS plugin prerequisites); OPS N/A; MAINT applicable; TEST applicable; COMPL N/A; UX N/A; BIZ N/A.
* Related: GTS specification v0.17; FrontX gts-plugin (pins gts-ts 0.3.0).

## Traceability

- **PRD**: [PRD.md](../PRD.md)
- **DESIGN**: [DESIGN.md](../DESIGN.md)

This decision directly addresses the following requirements or design elements:

* `cpt-frontx-dashboard-fr-per-cell-failure` — each embedded widget and stamped data instance is registered on its own, so a failure is attributed to its cell or larger view (D13).
* `cpt-frontx-dashboard-fr-runtime-source` — types and instances are read at runtime; the bundle bases are registered first, and a served type that collides with one is rejected.
* `cpt-frontx-dashboard-interface-contract` — the published shapes (ids, validation, registration, the `dashboard` package) that authors write against.
* `cpt-frontx-dashboard-fr-dashboard-as-json` — a dashboard embeds widget instances, each validated against the type its own id names.
