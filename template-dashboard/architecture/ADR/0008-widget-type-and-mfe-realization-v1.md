---
status: accepted
date: 2026-10-29
decision-makers: template-dashboard architecture maintainers
description: "Decision record for how widget types relate to the MFE entries that show them: widget realization instances in package dashboard_v link each widget type to one plain FrontX MFE entry that serves both a layout cell and the larger view, with an optional separate larger-view entry, the highest-weight realization wins, a consuming product may add a replacement realization to its copy of the template's GTS file, and one widget package ships the template's 9 entries."
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
  - [Widget realization instances in package `dashboard_v` with weight precedence](#widget-realization-instances-in-package-dashboard_v-with-weight-precedence)
  - [A cell entry and a larger-view entry for every widget type](#a-cell-entry-and-a-larger-view-entry-for-every-widget-type)
  - [`realizes:` on a derived entry type](#realizes-on-a-derived-entry-type)
  - [Entry identifiers stored in dashboards](#entry-identifiers-stored-in-dashboards)
  - [Entries found by naming convention](#entries-found-by-naming-convention)
  - [Widgets bundled in the dashboards root](#widgets-bundled-in-the-dashboards-root)
- [More Information](#more-information)
- [Traceability](#traceability)

<!-- /toc -->

## Context and Problem Statement

Two artifact families describe a widget. The widget type is a design-time GTS type in package `dashboard_m` that says what a widget's presentation configuration and `data` look like ([ADR-0003](0003-shared-data-types-and-schemas-v1.md), [ADR-0009](0009-subject-agnostic-widget-catalog-v1.md)). The MFE entry is a runtime artifact that FrontX loads and mounts. The dashboards root mounts a widget in a layout cell, and the larger-view modal mounts a larger-view widget in its `larger_view` domain ([ADR-0007](0007-extension-domain-taxonomy-v1.md)). The question is how a widget type is linked to the MFE entry that shows it, how many entries a widget type needs, how a consuming product can replace how one widget type is shown, and whether widgets ship as their own MFEs at all or inside the dashboards root.

Widgets are passive renderers ([ADR-0011](0011-data-adapter-v1.md)). A widget receives `set_widget_context` and `set_data`, sends `request_data`, and makes no backend call. A widget in a cell and a widget in the larger view therefore receive the same actions, and both domains require the same shared properties, theme and language. The larger view is just another widget, so the same code can show it.

Dashboards outlive MFE bundles, and the dashboard definition names only widget types. The template prefers to keep the FrontX MFE entry type `gts.frontx.mfes.mfe.entry.v1~frontx.mfes.mfe.entry_mf.v1~` as it is: a derived entry type would couple the template to FrontX's entry schema.

## Decision Drivers

* Dashboard definitions reference widget types only, so that they keep working across MFE re-releases and replacements.
* The link should not couple the template to FrontX's entry schema through a derived entry type or an extra entry field.
* A consuming product must be able to replace how one template widget type is shown, in a cell and in the larger view, from its own package, without editing the template packages and while the other widget types keep the template widgets.
* The choice of the widget for a widget type must be deterministic: one winner, or a cannot-show state with a diagnostic.
* The default must be the smallest set of entries: a widget type needs one entry unless it needs different code for the larger view.
* FrontX isolates every MFE instance, so the packaging must not rely on template-owned state shared between instances, and it should avoid fetching the same package more than once.

## Considered Options

* **Widget realization instances in package `dashboard_v` with weight precedence** — a GTS instance names a widget type, one entry for the cell and the larger view, an optional separate larger-view entry, and a weight; widget entries are plain FrontX MFE entries.
* **A cell entry and a larger-view entry for every widget type** — every widget type ships two entries, one for each place it is shown, and a GTS instance names both.
* **`realizes:` on a derived entry type** — the template derives its own entry type from the FrontX MFE entry type and adds a field that points to the widget type.
* **Entry identifiers stored in dashboards** — each widget instance names the MFE entry that shows it.
* **Entries found by naming convention** — the entry for a widget type is found by matching its identifier segments, with no explicit link.
* **Widgets bundled in the dashboards root** — no widget MFEs; the dashboards root renders every widget type as an internal component.

## Decision Outcome

Chosen option: "Widget realization instances in package `dashboard_v` with weight precedence", because it links widget types to plain FrontX entries without changing FrontX, keeps dashboard definitions free of MFE identifiers, needs one entry per widget type by default, and gives consuming products one deterministic way to replace how a widget type is shown.

**Widget types and entries.** Widget types are `gts.frontx.dashboard_m.widget.widget.v1~frontx.dashboard_m.widget.data_widget.v1~frontx.dashboard_m.widget.<widget_type>.v1~` for the 8 data widget types, and `gts.frontx.dashboard_m.widget.widget.v1~frontx.dashboard_m.widget.markdown_card.v1~` for `markdown_card`, in package `dashboard_m` ([ADR-0009](0009-subject-agnostic-widget-catalog-v1.md)). Widget entries are plain instances of the FrontX MFE entry type, for example `gts.frontx.mfes.mfe.entry.v1~frontx.mfes.mfe.entry_mf.v1~frontx.dashboard_v.mfe.grid.v1`. The template adds no entry type and no field to entries.

**One entry per widget type by default.** The same entry renders a widget in a layout cell and in the larger view. This works because both domains admit it: `layout_cells` and `larger_view` require the same shared properties, theme and language, and both require entries that support the same actions ([ADR-0007](0007-extension-domain-taxonomy-v1.md)). Each entry lists `set_widget_context` and `set_data` in `actions` and `request_data` in `domainActions`, and `markdown_card` lists `set_data` and `request_data` too although it never sends or receives them.

**Widget realization.** The type `gts.frontx.dashboard_v.mfe.widget_realization.v1~` in package `dashboard_v` links the two families. A realization has:

* `id` — its own instance identifier;
* `widget_type` — the widget type it realizes, constrained with `x-gts-type-ref` to the widget base `gts.frontx.dashboard_m.widget.widget.v1~`;
* `entry` — the entry that shows the widget in a cell and in the larger view, constrained with `x-gts-instance-ref` to the FrontX MFE entry type;
* `larger_view_entry` (optional) — a separate entry for the larger view, named only when the widget type needs different code there, constrained like `entry`;
* `weight` (optional, default 1) — an integer of at least 1.

Package `dashboard_v` depends on package `dashboard_m` only, never the reverse. Realizations reference the widget base through `widget_type`, and action payloads reference the query and data-shape bases (decided in [ADR-0003](0003-shared-data-types-and-schemas-v1.md)), so MFE entries can be released and substituted independently of the dashboards that use them.

**Precedence.** For each widget, the owner of its domain reads the widget type from the rightmost type of the widget's `id` chain and considers the realizations it knows whose `widget_type` names that type. The dashboards root does this for cell widgets, and the larger-view modal for larger-view widgets. The realization with the highest `weight` wins. A tie at the highest weight, or no realization at all, gives the cannot-show state to that widget's cell or to the modal of that larger view, and the UI shows the static placeholder. The diagnostic that names the realizations involved goes to the developer log only. The other cells are unaffected ([ADR-0011](0011-data-adapter-v1.md)). The owner generates the widget's extension from the winning realization: from `entry` for a cell, and for a larger view from `larger_view_entry` when the realization names one and from `entry` otherwise. It registers the extension in its own registry at dashboard load, mounts it, and sends `set_widget_context` ([ADR-0007](0007-extension-domain-taxonomy-v1.md)). The entry of the winning realization is one input of the generated extension's deterministic id, so a different winner gives a different id (decided in [ADR-0007](0007-extension-domain-taxonomy-v1.md)). The template's realizations have weight 1. They come from the template's GTS file, which the dashboards root and the larger-view modal fetch at start and register before any dashboard loads ([ADR-0003](0003-shared-data-types-and-schemas-v1.md), [ADR-0010](0010-template-packages-and-host-contract-v1.md)).

**Consumer replacement.** A consuming product edits its copy of the template's GTS file to add a replacement realization, with its own identifier, its own entry, a `larger_view_entry` only if it needs one, and a weight above 1. It wins for that widget type; the template's realization stays registered but unused. A realization is a GTS instance, not an admitted extension, so registering it admits nothing; each owner still registers the generated extensions itself.

**No consumer widget types.** Consumer widget types are out of scope. A realization can only realize one of the 9 template widget types, because every widget instance belongs to one of them.

**Packaging.** One package, `widgets`, ships one manifest. For each of the 9 widget types it declares one entry. The template's GTS file carries, for each of the 9 widget types, one realization of weight 1 that names no `larger_view_entry`. Each widget entry is a passive renderer: it sends `request_data`, renders `set_data`, and contains no code that requests data from a backend ([ADR-0011](0011-data-adapter-v1.md)). FrontX isolates every MFE instance (FrontX ADR-0011), so the package relies on no template-owned state shared between instances. The packages listed in the manifest's `shared` array are built as shared dependencies. Their source text is fetched once only when every template MFE publishes the same `contentHash` for it (FrontX ADR-0034), with realm-wide reach (FrontX ADR-0035), while each MFE instance evaluates its own copy.

### Consequences

* Good, because saved and generated dashboards keep loading after an MFE entry is re-released or substituted.
* Good, because FrontX needs no change: entries stay plain FrontX MFE entries, and the link lives in a template-owned type.
* Good, because one entry per widget type shows the widget in a cell and in the larger view, so the template ships 9 entries and not 18, and the two places cannot drift apart.
* Good, because a consuming product replaces how one widget type is shown from its own package, and the template's widgets keep serving the other types.
* Good, because a widget type that needs different code for the larger view gets it by naming `larger_view_entry`, with no other change.
* Good, because precedence is deterministic, and an unrealized widget type or a tie is visible as a diagnosed cannot-show state limited to the affected widgets.
* Good, because a shared dependency that every template MFE publishes with the same `contentHash` is fetched once, with realm-wide reach.
* Bad, because two type families and a set of realization instances must be maintained, and an unrealized widget type or a tie is a possible state.
* Bad, because weight is a plain number: two packages that replace the same widget type with the same weight produce a tie, and that widget type cannot be shown while the weights tie.
* Bad, because a replacement widget must itself keep the per-widget states, the theme mapping and the accessibility rules of the template widgets, and must list `set_widget_context` and `set_data` in `actions` and `request_data` in `domainActions` so that both domains admit it.
* Bad, because each owner performs a realization lookup for every widget when it loads a dashboard.
* Bad, because every MFE instance evaluates its own copy of heavy libraries under isolation, which weighs on the initial-render budget.
* Bad, because a consuming product cannot add a widget type.

### Confirmation

* Schema review confirms that widget instances in dashboard definitions name widget types only, never MFE entries, and that every realization validates against `gts.frontx.dashboard_v.mfe.widget_realization.v1~`, with a `widget_type` among the 9 template widget types and an `entry`, and a `larger_view_entry` when present, that is a FrontX MFE entry.
* A catalog check verifies that the `widgets` manifest declares one entry for each of the 9 widget types, that the template's GTS file holds one realization of weight 1 without a `larger_view_entry` for each, and that no template entry uses a type derived from the FrontX MFE entry type.
* An admission test confirms that each widget entry is admitted both into `layout_cells` and into `larger_view`, and receives `set_widget_context` and `set_data` in both, and that its `request_data` is admitted in both.
* Integration tests confirm the precedence: the highest-weight realization wins, and a tie or a missing realization gives the cannot-show state with the static placeholder to the affected cell or larger view only, with the diagnostic in the developer log only.
* A test with a fixture realization that names a `larger_view_entry` confirms that the cell uses `entry` and the larger view uses `larger_view_entry`.
* Build review confirms that the packages listed in each manifest's `shared` array are built as shared dependencies and that no widget relies on template-owned state shared between instances.

## Pros and Cons of the Options

### Widget realization instances in package `dashboard_v` with weight precedence

A template-owned GTS instance links a widget type to a plain FrontX entry, with an optional separate larger-view entry; the highest-weight realization wins.

* Good, because dashboard definitions are stable across MFE re-releases and replacements.
* Good, because it needs no derived entry type and no change in FrontX.
* Good, because one entry serves a cell and the larger view unless the widget type needs different code.
* Good, because replacement is one more realization with a higher weight, in the consumer's own package.
* Neutral, because it adds one type and one instance per widget type, and no new identifier grammar.
* Bad, because of the lookup, the possible tie, and the unrealized state.

### A cell entry and a larger-view entry for every widget type

Every widget type ships two entries, and a GTS instance names both.

* Good, because the code for each place can be tuned on its own from the start.
* Bad, because the template would ship 18 entries, two for each widget type, although both receive the same actions and the same shared properties.
* Bad, because the two entries of a widget type would be near copies that must be kept in step.
* Bad, because every replacement widget would have to ship two entries.

### `realizes:` on a derived entry type

The template derives an entry type from the FrontX MFE entry type and adds a `realizes:` field that points to the widget type.

* Good, because the link sits on the entry itself, with no separate instance.
* Bad, because a derived entry type would couple the template to FrontX's entry schema.
* Bad, because it has no place for a separate larger-view entry or for a precedence rule between several entries for one widget type.

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

### Widgets bundled in the dashboards root

The dashboards root contains every widget type as an internal component; there are no widget MFEs.

* Good, because the browser fetches one bundle, and heavy libraries are evaluated once in the dashboards root instead of once per widget instance.
* Good, because there are no realizations, no catalog of entries, and no tie or unrealized states.
* Bad, because widgets cannot be released independently of the dashboards root.
* Bad, because a consuming product cannot replace how a widget type is shown without rebuilding the dashboards root.
* Bad, because widgets do not mount into extension domains as MFEs, so the larger-view modal would need a second, non-MFE rendering path for larger-view widgets.

## More Information

**Review trigger.** Revisit when a consuming product needs its own widget types; when a derived entry type can be built without coupling the template to FrontX's entry schema; when a widget type needs a larger-view entry in most realizations, which would make a separate entry the default; or when `layout_cells` and `larger_view` stop requiring the same shared properties and actions.

**Scope.** This record decides how widget types relate to MFE entries, that one entry per widget type serves a cell and the larger view by default, the optional separate larger-view entry, the precedence between realizations, consumer replacement, and how widget MFEs are packaged. It does not decide which widget types exist ([ADR-0009](0009-subject-agnostic-widget-catalog-v1.md)), the extension domains and the actions that widgets use, including the deterministic ids of generated extensions ([ADR-0007](0007-extension-domain-taxonomy-v1.md)), the GTS packages and their dependency direction ([ADR-0003](0003-shared-data-types-and-schemas-v1.md)), how widgets get their data and which states they show ([ADR-0011](0011-data-adapter-v1.md)), the packages and the host contract ([ADR-0010](0010-template-packages-and-host-contract-v1.md)), or the isolation behavior (FrontX ADR-0011).

**Checklist applicability.** ARCH applicable and addressed above. PERF applicable: the realization lookup is a registry query per widget at dashboard load, and per-instance evaluation affects the initial-render budget, while shared dependencies bound the download size tracked by `cpt-frontx-dashboard-nfr-bundle-budget` where every template MFE publishes the same `contentHash`. Per-instance memory is held per extension id for the life of the page (FrontX ADR-0011), and the deterministic extension ids of [ADR-0007](0007-extension-domain-taxonomy-v1.md) keep it bounded. SEC not applicable here; isolation is decided in FrontX ADR-0011, and admission follows FrontX ADR-0008 and FrontX ADR-0010. REL applicable in one respect: a tie or a missing realization is contained in the affected widgets. DATA applicable at the contract level: dashboard definitions persist widget types, never MFE entry identifiers, and realizations reference the widget base through `widget_type` while action payloads reference the query and data-shape bases. INT applicable: consuming products integrate by adding a replacement realization to their copy of the template's GTS file, with its entries. OPS not applicable because no operational procedure is governed. MAINT applicable: two type families, the realization instances and one manifest must be maintained. TEST applicable: the schema review, the catalog check, the admission test and the precedence integration tests confirm the decision. COMPL not applicable because no regulatory or licensing obligation is involved. UX applicable in one respect: a widget type with a replacement realization is shown by the consumer's widget in the cell and in the larger view. BIZ applicable: consumers replace how a widget type is shown, and consumer widget types are out of scope.

**Related decisions.** The subject-agnostic widget catalog ([ADR-0009](0009-subject-agnostic-widget-catalog-v1.md)) defines the 9 widget types. The extension domain taxonomy ([ADR-0007](0007-extension-domain-taxonomy-v1.md)) defines `layout_cells`, `larger_view`, the actions and the ids of generated extensions. The data adapter ([ADR-0011](0011-data-adapter-v1.md)) defines the widget states. FrontX ADR-0008 defines registry admission through the registry that holds the extension domain, FrontX ADR-0010 the compatibility of entries and domains, FrontX ADR-0011 the per-instance isolation, and FrontX ADR-0034 the reuse of shared source text.

## Traceability

- **PRD**: [PRD.md](../PRD.md)
- **DESIGN**: [DESIGN.md](../DESIGN.md)

This decision directly addresses the following requirements or design elements:

* `cpt-frontx-dashboard-fr-widget-catalog` — the template ships one entry and one realization of weight 1 per widget type.
* `cpt-frontx-dashboard-fr-replacement-widget` — a consuming product replaces how a widget type is shown with a higher-weight realization in its copy of the template's GTS file.
* `cpt-frontx-dashboard-fr-domain-model` — the `dashboard_m` and `dashboard_v` type families, where `dashboard_v` depends on `dashboard_m` only; consumer widget types are out of scope.
* `cpt-frontx-dashboard-fr-widget-modal` — the same entry shows a larger-view widget, or a separate larger-view entry when the realization names one.
* `cpt-frontx-dashboard-interface-widget-realization` — the realization type, its precedence, and consumer replacement.
* `cpt-frontx-dashboard-principle-own-registry-registration` — each owner generates and registers widget extensions from the winning realization in its own registry.
* `cpt-frontx-dashboard-principle-per-instance-isolation` — widget entries rely on no template-owned state shared between instances.
* `cpt-frontx-dashboard-nfr-bundle-budget` — one widget package and shared dependencies shape the download size.
* `cpt-frontx-dashboard-actor-template-consumer` — consumers add replacement realizations to their copy of the template's GTS file.
