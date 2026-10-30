---
status: accepted
date: 2026-10-30
decision-makers: template-dashboard architecture maintainers
description: "Decision record for the GTS conventions of the template's domain model: GTS v0.17 as a prerequisite, the dashboard_m model package and the dashboard_v view package, literal base operands for ids of embedded instances, one polymorphic GTS validation per instance, arrays of objects or ordered pairs instead of id-keyed maps, the registry access that FrontX offers with a trait helper, and data shape checking through the FrontX validation of the set_data action."
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
  - [Reference operand for ids of embedded instances](#reference-operand-for-ids-of-embedded-instances)
  - [Validation of embedded instances](#validation-of-embedded-instances)
  - [Collections that need id validation](#collections-that-need-id-validation)
  - [Package layout](#package-layout)
  - [GTS version](#gts-version)
  - [Registry access](#registry-access)
- [More Information](#more-information)
- [Traceability](#traceability)

<!-- /toc -->

## Context and Problem Statement

The template's domain model (the dashboard with its embedded layout and widgets, the query vocabulary, the data shapes, the actions, the domains, the extension types and the widget realizations) is written as GTS types and instances on the FrontX base types under `gts.frontx.mfes.*`. Dashboards are written by hand or generated, delivered by a consuming product through the data adapter, and exchanged between the dashboards root, the larger-view modal and the widgets. All parties need the same conventions for ids, packages, validation and registry access, so that a dashboard can be checked against registered types alone and the contracts do not drift. Which GTS conventions does the template follow, and under which GTS version?

Several of these conventions follow from how GTS validates. An instance that is embedded in another instance, for example a widget in a dashboard or the query in a widget, carries its own id, and that id names its own derived type. The conventions below make that property work for validation instead of against it.

## Decision Drivers

* A written or generated dashboard must be checkable against the registered types alone, including every embedded instance against the type its own id names.
* Id fields of types that are embedded in other types must accept the ids they are meant to hold.
* Ids that need validating must sit at schema locations that GTS explicitly covers.
* The template's model must not depend on its view code, so that dashboards can be generated and checked without view types.
* The template relies on `x-gts-instance-ref`, `x-gts-type-ref`, `x-gts-abstract` and traits as GTS v0.17 defines them.
* The template can use only the registry operations that FrontX offers.
* Data delivered to a widget must be checked against its data shape without code of the widget's own.
* Template ids must not collide with FrontX ids or with ids from other templates; the package prefixes `frontx.dashboard_m` and `frontx.dashboard_v` keep them apart.

## Considered Options

* Id operand: a literal base operand in `x-gts-instance-ref`, or the `/$id` operand
* Validation: one polymorphic validation per instance, or a base-type validation followed by a second step per embedded instance
* Collections: arrays of objects or ordered pairs, or maps keyed by GTS ids
* Packages: `dashboard_m` and `dashboard_v` with a one-way dependency, or one package
* GTS version: target GTS v0.17, or interim workarounds on the GTS version FrontX pins
* Registry access: only the operations FrontX offers with a template trait helper, or a registry listing and effective-trait accessors added to FrontX

## Decision Outcome

Chosen options: a literal base operand; one polymorphic validation per instance; arrays of objects or ordered pairs; the `dashboard_m` and `dashboard_v` packages; GTS v0.17 as a prerequisite; and registry access limited to what FrontX offers with a template trait helper. Each option below states why. Together they let one standard GTS validation check a dashboard and everything embedded in it.

* **Literal base operands.** An id field of a type that is embedded in other instances (for example a widget's `id`, or the `id` of a data shape) names its base type as a literal operand in `x-gts-instance-ref`, never `/$id`. The `/$id` operand resolves to the top-level type that is being validated, so an embedded id would be checked against the wrong type. The query's own combined id is decided in [ADR-0012](0012-query-vocabulary-and-datasets-v1.md).
* **Polymorphic validation.** GTS validates every embedded instance against the derived type named by its own id, even where the property's schema names the base type. Validating a widget therefore also validates its `data` against the type named by `data.id`, and the FrontX validation of a `set_data` action also validates its `data` against the data shape named by `data.id`. No second validation step exists, and the template adds no validation mode of its own: schema validation is done only by GTS through the FrontX GTS plugin. The template runs only a short listed set of cross-checks that JSON Schema cannot express: the grid checks, including that a grid's `limit` is one of its `page_sizes` ([ADR-0005](0005-data-grid-library-v1.md)); that the first item of every `order` pair is a result column, named in `measures` or `dimensions` or the time dimension with a `granularity`; that every query member names a registered instance, of the kind the widget type's `member_kinds` trait asks for; that each filter operator fits its member's kind ([ADR-0012](0012-query-vocabulary-and-datasets-v1.md)); the layout checks; and the owner's comparison of an answered data instance's shape with the request's `data_shape`. The dashboards root and the larger-view modal validate a dashboard once and attribute each failure by its instance path: a failure under a cell's `widget` belongs to that cell, and a failure under a cell's `larger_view` belongs to that larger view, both at widget level; every other failure belongs to the dashboard as a whole.
* **No id-keyed maps.** GTS ids are not used as object keys where they need validating. The `x-gts-*-ref` keywords are explicitly covered for string values and array items, while coverage of keys through `propertyNames` is not confirmed. Collections keyed by ids are therefore arrays of objects or ordered pairs (the query `order`), and grid rows are positional arrays in canonical member order.
* **Packages.** `dashboard_m` is the model: the dashboard, the layout, the widgets, the query vocabulary and the data shapes. `dashboard_v` is the view: the actions (`request_data`, `set_data`, `set_widget_context`, `show_larger_view`), the domains, the extension types and the widget realizations. Ids look like `gts.frontx.dashboard_m.*` and `gts.frontx.dashboard_v.*`, with chained segments for derived types, for example `gts.frontx.dashboard_m.widget.widget.v1~frontx.dashboard_m.widget.data_widget.v1~`. The prefixes `frontx.dashboard_m` and `frontx.dashboard_v` keep template ids apart from FrontX's own `gts.frontx.mfes.*` ids and from the packages of other templates. `dashboard_v` depends on `dashboard_m` only, never the reverse. Widget types reference data shapes inside `dashboard_m`; actions and realizations reference `dashboard_m` types.
* **GTS v0.17 and a realm-shared type store.** FrontX runs GTS v0.17 and provides the realm-shared GTS type store (FrontX gts-plugin ADR-0001) as the platform prerequisite. The store is needed because nested owners validate chains that reference definitions registered by the shell. The template targets both without interim workarounds.
* **Registry access.** The template uses only what FrontX offers: register schema, get schema, register and validate instance, and type check. Widget realization instances come from the template's GTS file, a JSON file of GTS types and instances that no MFE manifest carries, starting with the widget realizations. The dashboards root and the larger-view modal fetch it at start and register it before any dashboard loads, and a product edits its copy of the file to add replacement realizations. Vocabulary instances are delivered with the dashboard ([ADR-0012](0012-query-vocabulary-and-datasets-v1.md)), and their member metadata (`id`, `title`, `value_type`, `unit`) reaches widgets in `set_widget_context` ([ADR-0007](0007-extension-domain-taxonomy-v1.md)). A small template trait helper resolves a type's effective traits. It has a stable signature, because product data adapter code calls it. The registry access it uses is handed over by the data adapter interface for each owner runtime, with no global singleton ([ADR-0010](0010-template-packages-and-host-contract-v1.md), [ADR-0011](0011-data-adapter-v1.md)). It gets the schemas along the type's `$id` chain with `getSchema` and merges their traits with RFC 7396. The dashboards root and the larger-view modal use it to select realizations and to validate widgets, and the data adapter ([ADR-0011](0011-data-adapter-v1.md)) may use it on dataset types.
* **Data shape checking.** The data instance of a `set_data` action carries a combined id `<data shape type>~<uuid>`. FrontX validates every action instance against its schema, so its polymorphic validation applies the exact data shape. Widgets never compare shapes. Measure values in a data instance may be `null`, and a widget renders a `null` as a gap or an empty value. Dimension values may be `null` too, and a widget shows them as an empty label ([ADR-0009](0009-subject-agnostic-widget-catalog-v1.md)). Data shapes and widget types are decided in [ADR-0009](0009-subject-agnostic-widget-catalog-v1.md); the actions and domains in [ADR-0007](0007-extension-domain-taxonomy-v1.md).

### Consequences

* Good, because one standard GTS validation checks a widget, its base fields and its embedded query, so the template needs no schema validation code of its own.
* Good, because a generated dashboard can be checked by its producer against registered types alone.
* Good, because the model package has no dependency on the view package.
* Good, because widgets need no code to check the shape of the data they receive.
* Bad, because a dashboard that mentions long chained ids is verbose, and array collections need a per-instance check that position and member align.
* Bad, because the template cannot be validated end to end while FrontX runs an older GTS version.
* Bad, because GTS v0.17 may not check `x-gts-instance-ref` inside `prefixItems`, so the first item of an `order` pair may go unchecked by GTS. Mitigation: the dataset enum on the pair's first item and the owner cross-check.
* Bad, because without a registry listing, whatever the dashboards root needs must be delivered to it, which adds delivery steps.

### Confirmation

* A schema review confirms that every id field of an embedded type uses a literal base operand and none uses `/$id`.
* A registry test registers the template types and validates one dashboard whose widget carries an embedded query, and one dashboard with a widget whose embedded id names a type that does not fit; the second one is rejected.
* A validation test validates one dashboard with an invalid cell widget, an invalid larger-view widget and a missing root field, and confirms that the first failure is attributed to that cell, the second to that larger view, and the third to the dashboard.
* A dependency check confirms that no `dashboard_m` schema references a `dashboard_v` id.
* A review confirms that no schema declares an object whose keys are GTS ids.
* A `set_data` test sends data whose id names a different data shape than the widget's and confirms that FrontX rejects the action.
* A test with an `order` pair whose first item is not a registered instance confirms that it is rejected, and records whether GTS or the owner cross-check rejected it.
* A test of the trait helper confirms that effective traits equal the RFC 7396 merge of the traits along the `$id` chain.

## Pros and Cons of the Options

### Reference operand for ids of embedded instances

Literal base operand: the id field names its base type, such as `gts.frontx.dashboard_m.widget.widget.v1~`, in `x-gts-instance-ref`. The `/$id` operand: the id field refers to the `$id` of the schema in which it is declared.

**Literal base operand**

* Good, because the literal operand holds wherever the type is embedded and accepts every derived id.
* Good, because it reads the same in the schema and in its documentation.
* Bad, because the base type is written out in each id field.

**`/$id`**

* Good, because `/$id` is shorter to write.
* Bad, because `/$id` resolves to the top-level type that is being validated, so for an embedded id it checks against the wrong type and rejects valid instances.

### Validation of embedded instances

Polymorphic validation: one standard validation per instance, in which GTS applies the derived type named by each embedded id. Two-step validation: validate against the base type, then validate each embedded instance against its own type in a second step of template code.

**Polymorphic validation**

* Good, because polymorphic validation needs no template code and one call checks everything embedded.
* Good, because the same mechanism checks `set_data` data against its shape.
* Bad, because the result depends on GTS applying the derived type; a registry that would not do so needs the second step.
* Neutral, because the failure of a polymorphic validation names the instance path, and the dashboards root and the larger-view modal attribute it by that path: under a cell's `widget` or `larger_view` to that cell or larger view, and otherwise to the dashboard.

**Two-step validation**

* Bad, because two-step validation needs template code for the second step and for finding embedded ids.

### Collections that need id validation

Arrays of objects or ordered pairs: a collection is an array whose items carry the id as a string field, or, for the query `order`, an array of pairs whose first item is the id. Id-keyed maps: a collection is an object whose keys are GTS ids.

**Arrays of objects or ordered pairs**

* Good, because arrays place ids at string values, which `x-gts-*-ref` keywords explicitly cover.
* Good, because positional grid rows avoid repeating long ids in each row.
* Good, because the pair form `[member, direction]` keeps the order of the query's sort keys without an id as a key.
* Bad, because the alignment of position and member must be checked for each instance.
* Bad, because the check of a GTS instance reference inside `prefixItems` is unconfirmed. Mitigation: the dataset enum on the pair's first item and the owner cross-check.

**Id-keyed maps**

* Good, because a map gives direct lookup by id and rules out duplicate keys.
* Bad, because validators do not scan keys as references, so the ids in keys would not be checked unless `propertyNames` coverage were confirmed, which it is not.

### Package layout

Two packages: `dashboard_m` for the model and `dashboard_v` for the view, with `dashboard_v` depending on `dashboard_m`. One package: all types under one package segment. Either layout uses the prefixes `frontx.dashboard_*` or a single `frontx.dashboard` prefix, so template ids stay apart from FrontX's `gts.frontx.mfes.*` ids and from other templates' packages.

**Two packages**

* Good, because the model can be generated, delivered and checked without any view type.
* Good, because the one-way dependency is visible in the ids.
* Good, because the prefixes `frontx.dashboard_m` and `frontx.dashboard_v` keep template ids apart from FrontX ids and from other templates.
* Bad, because authors must know which package a type lives in.

**One package**

* Good, because one package has a single place to look.
* Bad, because one package mixes what a dashboard describes with what the runtime exchanges, and nothing stops the model from referring to view types.

### GTS version

Target v0.17: the template uses `x-gts-instance-ref`, `x-gts-type-ref`, `x-gts-abstract` and traits as v0.17 defines them. Interim workarounds: the template adapts to the GTS version that FrontX pins (gts-ts 0.3.0, which knows only the single older reference keyword and does not apply the v0.17 keywords).

**Target v0.17**

* Good, because the types are written once, in the form they keep.
* Good, because the keywords carry the checks (kind of reference, abstract types) that the template would otherwise implement.
* Bad, because FrontX must run v0.17 before the checks work end to end.

**Interim workarounds**

* Good, because workarounds would run on the GTS version FrontX pins.
* Bad, because workarounds need template code for reference kinds, abstract types and traits, and that code would be redundant under v0.17.

### Registry access

Only what FrontX offers, with a template trait helper. Extended access: FrontX adds an instance listing and an effective-trait accessor that the template relies on.

**Offered operations with a trait helper**

* Good, because the template runs on FrontX as it is.
* Good, because the helper is small and covers the one need, effective traits.
* Bad, because the dashboards root cannot list what is registered, so realizations and vocabulary must be delivered to it.

**Extended registry access**

* Good, because an extended registry would let the root discover instances itself.
* Bad, because the template would depend on FrontX features that do not exist.

## More Information

**Open questions.**

* **Reference existence (lookup mode).** GTS v0.17 leaves the check that a referenced instance exists to a lookup mode (`none`, `any-present`, `any-valid`). It is open which mode FrontX's v0.17 GTS plugin uses and whether the dashboards root can select `any-present`. The answer comes from checking FrontX's v0.17 GTS plugin.
* **Ordered pairs.** The query `order` is a list of ordered pairs, written with `prefixItems`. GTS v0.17 may check `x-gts-instance-ref` inside `prefixItems` or may not; this is unconfirmed. The answer comes from checking FrontX's v0.17 GTS plugin.
* **Store growth.** If validation of dashboards and of every action registers instances in the GTS store, which has no removal, the store grows with each dashboard load and each action. The answer comes from checking the v0.17 GTS plugin API.

**Review trigger.** Revisit if FrontX's v0.17 plugin does not validate embedded instances against the type their own id names, if it cannot check that referenced instances exist, if GTS v0.17 cannot check `x-gts-instance-ref` inside `prefixItems`, or if validation makes the GTS store grow without bound.

**Scope.** This record decides the GTS conventions listed above. It does not decide:

* the query, datasets, measures, dimensions and the query's own id ([ADR-0012](0012-query-vocabulary-and-datasets-v1.md));
* the data adapter and how it is reached ([ADR-0011](0011-data-adapter-v1.md));
* widget types, data shapes and fill modes ([ADR-0009](0009-subject-agnostic-widget-catalog-v1.md));
* extension domains and actions ([ADR-0007](0007-extension-domain-taxonomy-v1.md)).

**Checklist applicability.** ARCH applicable: packages and their dependency direction. DATA applicable: id conventions, collections and validation of instances. INT applicable: the types are the exchange contract between the dashboards root, the larger-view modal, widgets and the consuming product. MAINT applicable: one convention for all ids and one-way package dependency. TEST applicable: the Confirmation tests. REL applicable: invalid instances fail at validation, not at render. PERF applicable to the extent of the open question on store growth. SEC, UX, OPS, COMPL and BIZ not applicable because no access rule, visible behavior, operational procedure, regulated processing or business rule is decided here.

## Traceability

- **PRD**: [PRD.md](../PRD.md)
- **DESIGN**: [DESIGN.md](../DESIGN.md)

This decision directly addresses the following requirements or design elements:

* `cpt-frontx-dashboard-fr-domain-model` — the domain model is published as GTS types under the `frontx` vendor in the packages `dashboard_m` and `dashboard_v`.
* `cpt-frontx-dashboard-interface-domain-model` — consumers validate written or generated dashboards against the registered template types, and the model package does not depend on the view package.
* `cpt-frontx-dashboard-fr-widget-catalog` — widget types derive from the widget base in `dashboard_m`, and an embedded widget is validated against the type its own id names.
* `cpt-frontx-dashboard-principle-gts-contracts` — dashboards, widgets, data and widget realizations are GTS v0.17 types, validated polymorphically through FrontX.
* `cpt-frontx-dashboard-constraint-gts-id-convention` — package segments, literal base operands, combined instance ids, and arrays of objects or ordered pairs instead of id-keyed maps.
* `cpt-frontx-dashboard-interface-widget-realization` — realization types live in `dashboard_v` and reference `dashboard_m` types.
