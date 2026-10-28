---
status: accepted
date: 2026-10-27
decision-makers: template-dashboard architecture maintainers
description: "Decision record for how widget types relate to the MFE parts that show them and how widget MFEs ship: widget realization instances in package v link each widget type to a plain FrontX Module Federation cell entry and a static modal extension, the single highest-weight realization wins, a consuming product may ship a replacement realization in its own package, and one widget package ships the template's 9 realizations."
---

# ADR-0008: Widget type and MFE realization

**ID**: `cpt-frontx-dashboard-adr-widget-type-and-mfe-realization`

<!-- toc -->

- [Context and Problem Statement](#context-and-problem-statement)
- [Decision Drivers](#decision-drivers)
- [Considered Options](#considered-options)
- [Decision Outcome](#decision-outcome)
  - [Consequences](#consequences)
  - [Confirmation](#confirmation)
- [Pros and Cons of the Options](#pros-and-cons-of-the-options)
  - [Widget realization instances in package `v` with weight precedence](#widget-realization-instances-in-package-v-with-weight-precedence)
  - [`realizes:` on a derived entry type](#realizes-on-a-derived-entry-type)
  - [Entry identifiers stored in dashboards](#entry-identifiers-stored-in-dashboards)
  - [Entries found by naming convention](#entries-found-by-naming-convention)
  - [Widgets bundled in the Viewer host](#widgets-bundled-in-the-viewer-host)
- [More Information](#more-information)
- [Traceability](#traceability)

<!-- /toc -->

## Context and Problem Statement

Two artifact families describe a widget. The widget type is a design-time GTS type in package `m` that says what a widget's presentation configuration and `source` look like ([ADR-0003](0003-shared-data-types-and-schemas-v1.md), [ADR-0009](0009-subject-agnostic-widget-catalog-v1.md)). The MFE parts are runtime artifacts that FrontX loads and mounts: a cell entry, mounted in a layout cell, and, for the larger view, a modal entry behind an extension of the host modal domain. The question is how a widget type is linked to the MFE parts that show it, how a consuming product can replace how one widget type is shown, and whether widgets ship as their own MFEs at all or inside the Viewer host MFE.

Dashboards outlive MFE bundles, and the dashboard definition names only widget types. The FrontX Module Federation entry type `gts.frontx.mfes.mfe.entry.v1~frontx.mfes.mfe.entry_mf.v1~` is final: it cannot be derived, so the template cannot add a field to its entries. FrontX admits an extension only through the registry that holds its extension domain, and a child's bridge cannot register into its host's registry (FrontX ADR-0008), so the larger view in the host modal domain needs an extension that the shell registers.

## Decision Drivers

* Dashboard definitions reference widget types only, so that they keep working across MFE re-releases and replacements.
* The FrontX Module Federation entry type is final; the link must not need a derived entry type or an extra entry field.
* A consuming product must be able to replace how one template widget type is shown, in a cell and in the larger view, from its own package, without editing the template packages and while the other widget types keep the template widgets.
* The choice of the widget for a widget type must be deterministic: one winner, or a cannot-show state with a diagnostic.
* Every widget must be able to open its larger view in the host modal domain, where only the shell's registry can admit an extension.
* FrontX isolates every MFE instance in its own module graph, so the packaging must not rely on template-owned singletons shared between instances, and it should avoid fetching the same package more than once.

## Considered Options

* **Widget realization instances in package `v` with weight precedence** — a GTS instance names a widget type, its cell entry, its static modal extension, and a weight; widget entries are plain FrontX Module Federation entries.
* **`realizes:` on a derived entry type** — the template derives its own entry type from the FrontX Module Federation entry type and adds a field that points to the widget type.
* **Entry identifiers stored in dashboards** — each widget instance names the MFE entry that shows it.
* **Entries found by naming convention** — the entry for a widget type is found by matching its identifier segments, with no explicit link.
* **Widgets bundled in the Viewer host** — no widget MFEs; the Viewer host MFE renders every widget type as an internal component.

## Decision Outcome

Chosen option: "Widget realization instances in package `v` with weight precedence", because it links widget types to plain FrontX entries without changing FrontX, keeps dashboard definitions free of MFE identifiers, and gives consuming products one deterministic way to replace how a widget type is shown.

**Widget types and entries.** Widget types are `gts.frontx.m.widget.widget.v1~frontx.m.widget.<widget_type>.v1~` in package `m`. Widget cell and modal entries are plain instances of the FrontX Module Federation entry type, for example `gts.frontx.mfes.mfe.entry.v1~frontx.mfes.mfe.entry_mf.v1~frontx.v.mfe.grid.v1`. The template adds no entry type and no field to entries.

**Widget realization.** The type `gts.frontx.v.mfe.widget_realization.v1~` in package `v` links the two families. A realization has:

* `id` — its own instance identifier;
* `widget_type` — the widget type it realizes, constrained with `x-gts-type-ref` to the widget base;
* `entry` — the cell entry, constrained with `x-gts-instance-ref` to the FrontX Module Federation entry type;
* `modal_extension` (required) — the static extension of the host modal domain that shows this widget type's larger view, constrained with `x-gts-instance-ref`;
* `weight` (optional, default 1) — an integer of at least 1.

`widget_type` is the single deliberate reference from package `v` into package `m`. Package `m` holds no reference into `v`, so MFE parts can be released and replaced independently of the dashboards that use them.

**Precedence.** For each embedded widget, the Viewer host reads the widget type from the rightmost type of the widget's `id` chain and considers the realizations registered in its registry whose `widget_type` names that type. The single realization with the highest `weight` wins. A tie at the highest weight, or no realization at all, leaves every cell of that widget type in its cannot-show state, with a diagnostic that names the realizations involved; the other cells are unaffected. The Viewer host generates the cell extension from the winning realization's `entry`, registers it in its own registry, mounts it, and sends `set_widget_context` with the realization's `modal_extension` as the subject of the larger view ([ADR-0007](0007-extension-domain-taxonomy-v1.md)). The template's realizations have weight 1.

**Static modal extensions.** Each realization's `modal_extension` names one static extension of the host modal domain whose `entry` is that widget type's modal entry. It is declared in the package manifest and registered by the host bootstrap, because only the shell's registry can admit an extension of the host modal domain. One static extension per widget type serves every widget of that type, because each open sends the widget's own context.

**Consumer replacement.** A consuming product may ship a replacement realization in its own package, with its own identifier, its own cell entry, its own modal entry, its own static modal extension, and a weight above 1. It wins for that widget type; the template's realization stays registered but unused. A realization is a GTS instance, not an admitted extension, so registering it admits nothing; the Viewer host still registers each cell extension itself.

**No consumer widget types in v1.** A realization can only realize one of the 9 template widget types, because every widget instance belongs to one of them. Consumer widget types are a later stage: they need a way for the backend to register widget types.

**Packaging.** One package, `dashboard-widgets`, ships one manifest. For each of the 9 widget types it declares one cell entry, one modal entry, one static modal extension, and one realization of weight 1. Each widget entry requests its own data with the `source` of its widget instance through the FrontX API package ([ADR-0011](0011-backend-delivered-dashboard-v1.md)). FrontX ADR-0011 isolates every MFE instance in its own module graph, so the package relies on no template-owned singleton shared between instances; the FrontX packages that keep realm-wide state by design, the API cache and the gts-plugin type store, are used as they are (DESIGN section 2.1). Every MFE declares all its packages as shared: FrontX reuses a shared package's source text across MFE loads by content hash (FrontX ADR-0034), so it is fetched once, while each instance still evaluates its own copy. The template treats Module Federation only as the bundling format; FrontX resolves dependencies itself.

### Consequences

* Good, because saved and generated dashboards keep loading after an MFE entry is re-released or replaced.
* Good, because FrontX needs no change: entries stay plain Module Federation entries, and the link lives in a template-owned type.
* Good, because a consuming product replaces how one widget type is shown from its own package, and the template's widgets keep serving the other types.
* Good, because precedence is deterministic, and an unrealized widget type or a tie is visible as a diagnosed cannot-show state limited to the affected cells.
* Good, because every widget type, including a replaced one, brings its larger view through a static extension that the shell can admit.
* Good, because shared package declarations fetch each package once per realm.
* Bad, because two type families and a set of realization instances must be maintained, and an unrealized widget type or a tie is a possible state.
* Bad, because weight is a plain number: two packages that replace the same widget type with the same weight produce a tie, and that widget type cannot be shown until one weight changes.
* Bad, because a replacement widget must itself keep the per-widget states, the theme mapping, and the accessibility rules of the template widgets.
* Bad, because the Viewer host performs a realization lookup for every embedded widget when it resolves a dashboard.
* Bad, because every MFE instance evaluates its own copy of heavy libraries under isolation, which weighs on the initial-render budget.
* Bad, because a consuming product cannot add a widget type in v1.

### Confirmation

* Schema review confirms that widget instances in dashboard definitions name widget types only, never MFE entries, and that every realization validates against `gts.frontx.v.mfe.widget_realization.v1~`, with a `widget_type` among the 9 template widget types, an `entry` that is a FrontX Module Federation entry, and a `modal_extension` that is a static extension of the host modal domain.
* A catalog check verifies that the `dashboard-widgets` manifest declares, for each of the 9 widget types, one cell entry, one modal entry, one static modal extension, and one realization of weight 1, and that no template entry uses a type derived from the FrontX Module Federation entry type.
* Integration tests of the Viewer host confirm the precedence: the single highest-weight realization wins, and a tie or a missing realization gives the cannot-show state in the cells of that widget type only.
* Build review confirms that every MFE declares all its packages as shared and that no widget relies on a template-owned singleton shared between instances.

## Pros and Cons of the Options

### Widget realization instances in package `v` with weight precedence

A template-owned GTS instance links a widget type to a plain FrontX entry and a static modal extension; the single highest-weight realization wins.

* Good, because dashboard definitions are stable across MFE re-releases and replacements.
* Good, because it needs no derived entry type and no change in FrontX.
* Good, because replacement is one more realization with a higher weight, in the consumer's own package.
* Neutral, because it adds one type and one instance per widget type, and no new identifier grammar.
* Bad, because of the lookup, the possible tie, and the unrealized state.

### `realizes:` on a derived entry type

The template derives an entry type from the FrontX Module Federation entry type and adds a `realizes:` field that points to the widget type.

* Good, because the link sits on the entry itself, with no separate instance.
* Bad, because the FrontX Module Federation entry type is final and cannot be derived, so the option cannot be built.
* Bad, because it has no place for the static modal extension or for a precedence rule between several entries for one widget type.

### Entry identifiers stored in dashboards

Each widget instance names the entry that shows it.

* Good, because there is no lookup.
* Bad, because dashboards are tied to MFE identifiers and break when an entry is re-released under a new identifier.
* Bad, because replacing how a widget type is shown means rewriting every stored and generated dashboard.
* Bad, because a consuming product's dashboard generator would have to know the MFE entries.

### Entries found by naming convention

The entry for a widget type is found by matching identifier segments, with no stored link.

* Good, because no explicit link is stored.
* Bad, because a replacement entry with its own identifier cannot be found, and no precedence can be expressed.
* Bad, because the coupling between the two families is hidden in naming conventions.

### Widgets bundled in the Viewer host

The Viewer host MFE contains every widget type as an internal component; there are no widget MFEs.

* Good, because the browser fetches one bundle, and heavy libraries are evaluated once in the Viewer host's module graph instead of once per widget instance.
* Good, because there are no realizations, no catalog of entries, and no tie or unrealized states.
* Bad, because widgets cannot be released independently of the Viewer host.
* Bad, because a consuming product cannot replace how a widget type is shown without rebuilding the Viewer host.
* Bad, because widgets do not mount into extension domains as MFEs, so the larger view in the host modal domain would need a second, non-MFE rendering path.

## More Information

**Review trigger.** Revisit when consumer widget types are taken up, which needs a way for the backend to register widget types; when FrontX lets a child register an extension in its host's registry, which would allow per-instance modal extensions; or when FrontX makes its Module Federation entry type derivable.

**Scope.** This record decides how widget types relate to MFE entries and static modal extensions, the precedence between realizations, consumer replacement, and how widget MFEs are packaged. It does not decide which widget types exist ([ADR-0009](0009-subject-agnostic-widget-catalog-v1.md)), the extension domain and the action that widgets use ([ADR-0007](0007-extension-domain-taxonomy-v1.md)), the packages and the host contract ([ADR-0010](0010-template-packages-and-host-contract-v1.md)), or the isolation behavior (FrontX ADR-0011).

**Checklist applicability.** ARCH applicable and addressed above. PERF applicable: the realization lookup is a registry query per embedded widget, and per-instance evaluation affects the initial-render budget, while shared declarations bound the download size tracked by `cpt-frontx-dashboard-nfr-bundle-budget`. SEC not applicable here; isolation is decided in FrontX ADR-0011, and admission follows FrontX ADR-0008. REL applicable in one respect: a tie or a missing realization is contained in the cells of one widget type. DATA applicable at the contract level: dashboard definitions persist widget types, never MFE entry identifiers, and realizations hold the only reference from `v` into `m`. INT applicable: consuming products integrate by shipping a replacement realization with its entries and static modal extension. OPS not applicable because no operational procedure is governed. MAINT applicable: two type families, the realization instances, and one manifest must be maintained. TEST applicable: the schema review, the catalog check, and the precedence integration tests confirm the decision. COMPL not applicable because no regulatory or licensing obligation is involved. UX applicable in one respect: a replaced widget type is shown by the consumer's widget in the cell and in the larger view. BIZ applicable: consumers replace how a widget type is shown but add no widget types in v1.

**Related decisions.** The subject-agnostic widget catalog ([ADR-0009](0009-subject-agnostic-widget-catalog-v1.md)) defines the 9 widget types. The extension domain taxonomy ([ADR-0007](0007-extension-domain-taxonomy-v1.md)) defines `layout_cells` and `set_widget_context`. FrontX ADR-0008 defines registry admission through the registry that holds the extension domain, FrontX ADR-0011 the per-instance isolation, and FrontX ADR-0034 the reuse of shared source text.

## Traceability

- **PRD**: [PRD.md](../PRD.md)
- **DESIGN**: [DESIGN.md](../DESIGN.md)

This decision directly addresses the following requirements or design elements:

* `cpt-frontx-dashboard-fr-widget-catalog` — the template ships one realization of weight 1, one cell entry, one modal entry, and one static modal extension per widget type.
* `cpt-frontx-dashboard-fr-replacement-widget` — a consuming product replaces how a widget type is shown with a higher-weight realization in its own package.
* `cpt-frontx-dashboard-fr-domain-model` — the `m` and `v` type families and the single `v`-to-`m` reference; no consumer widget types in v1.
* `cpt-frontx-dashboard-fr-viewer-host` — the Viewer host picks the winning realization and generates each cell extension from it.
* `cpt-frontx-dashboard-fr-widget-modal` — each realization brings the static modal extension that shows the larger view.
* `cpt-frontx-dashboard-interface-widget-realization` — the realization type, its precedence, and consumer replacement.
* `cpt-frontx-dashboard-principle-own-registry-registration` — static modal extensions are registered by the host bootstrap, and cell extensions only in the Viewer host's own registry.
* `cpt-frontx-dashboard-nfr-bundle-budget` — one widget package and shared package declarations shape the download size.
* `cpt-frontx-dashboard-actor-template-consumer` — consumers ship replacement realizations as separate packages.
