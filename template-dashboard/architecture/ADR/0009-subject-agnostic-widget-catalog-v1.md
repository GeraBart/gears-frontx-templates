---
status: accepted
version: 1
date: 2026-10-31
decision-makers: template-dashboard architecture maintainers
description: "Decision record for what the widget catalog contains: 9 subject-agnostic widget types, each a GTS type (the params schema), a data type (the data shape) and one FrontX MFE entry that shows it (D1), with 8 data widget types derived from data_widget and markdown_card derived from the base with no data, the grid sorting and paging client-side over the rows the transform delivered (D15), and markdown rendered safely."
---

# ADR-0009: Subject-agnostic widget catalog

**ID**: `cpt-frontx-dashboard-adr-subject-agnostic-widget-catalog`

<!-- toc -->

- [Context and Problem Statement](#context-and-problem-statement)
- [Decision Drivers](#decision-drivers)
- [Considered Options](#considered-options)
- [Decision Outcome](#decision-outcome)
  - [Consequences](#consequences)
  - [Confirmation](#confirmation)
- [Pros and Cons of the Options](#pros-and-cons-of-the-options)
  - [Per-type data shapes with one entry per type](#per-type-data-shapes-with-one-entry-per-type)
  - [One generic tabular result with column bindings](#one-generic-tabular-result-with-column-bindings)
  - [A data field on every widget type](#a-data-field-on-every-widget-type)
  - [Subject-specific catalog](#subject-specific-catalog)
- [More Information](#more-information)
- [Traceability](#traceability)

<!-- /toc -->

## Context and Problem Statement

A widget type is three things: a GTS type (the `params` schema), a data type (the `data` schema), and one FrontX MFE entry that shows it (D1). The catalog can be cut along subject lines (one widget type per subject and presentation shape) or along presentation shapes alone. The first grows with every new metric. The second stays small, but then a widget type must state which data it needs and in which form, and a dashboard author writes the binding that produces that form ([ADR-0011](0011-widget-data-binding-v1.md)).

A widget is a passive renderer: it renders the `render_widget {widget, data}` action, including its own empty state, and makes no requests. Dashboards are written by hand or generated, so a widget definition must be checkable before anything mounts: its params must fit its widget type.

What does the catalog contain, how does a widget type state the data it needs, and how does a widget type that compares values take more than one series?

## Decision Drivers

* A small catalog whose size is bounded by presentation shapes, not by shape times subject.
* The same widget type is reusable across many datasets without forking the catalog.
* A widget is a passive renderer: it receives data in the form its type declares and does not map columns or compute results.
* Checks happen before display: params that do not fit the widget type fail validation instead of showing wrong content.
* The data contract stays typed in GTS, so the root's registration validates it ([ADR-0003](0003-shared-data-types-and-schemas-v1.md)).
* The grid sorts and pages client-side over the rows the transform delivered (D15).

## Considered Options

* Per-type data shapes with one entry per type
* One generic tabular result with column bindings
* A data field on every widget type
* Subject-specific catalog

## Decision Outcome

Chosen option: "Per-type data shapes with one entry per type", because the catalog stays bounded by presentation shapes, each widget type states exactly the data it needs, the widget does no mapping, and a dashboard author writes the binding that produces the shape.

**Widget type, data type, entry (D1).** A widget type is a GTS type (the `params` schema), a data type (the `data` schema), and one FrontX MFE entry that shows it. The widget type points to its entry through the `entry` trait, and to its data type through the `data_type` trait ([ADR-0008](0008-widget-type-and-mfe-realization-v1.md)). The root registers the data type from the served file.

**Widget base and `data_widget`.** The abstract widget base carries `id`, `title?`, and `params`. The abstract `data_widget` derives from it, adds a required `data` (the binding), and declares the `data_type` trait. Every data-taking widget type derives from `data_widget`; `markdown_card` derives from the base directly and closes itself, so its schema forbids `data` (D19).

**Widget-data base.** The abstract widget-data base `gts.frontx.dashboard.widget_data.widget_data.v1~` carries `id`. Each data widget type has one closed derived data type, e.g. `…widget_data.v1~frontx.dashboard.widget_data.pie_chart.v1~`. The root stamps the transform result with `<data type>~<UUIDv5(widget id | role)>` and registers it, which validates it against its data type (D20, [ADR-0003](0003-shared-data-types-and-schemas-v1.md)). There is one data type per widget type, even where two shapes are identical, so they can differ. Measure-valued fields accept `null`, and a widget renders a `null` as a gap or an empty value; for `metric_card`, a `null` `value` is the empty state.

**Nine widget types.** The catalog has 9 subject-agnostic widget types: 8 data widget types (`summary_card`, `metric_card`, `ranked_list_card`, `progress_list_card`, `grid`, `cartesian_chart`, `pie_chart`, `heatmap`) and `markdown_card`. No widget type gives its params a subject: the subject is the data the binding produces.

**Final params and data shapes per type (O3).** The final `params` and data shapes per type are decided in the widget catalog FEATURE. Richer params are candidates: series options and axes for `cartesian_chart`, radius and rose type for `pie_chart`, frozen columns, groups and row colours for `grid`, and scale bounds for `heatmap`. Value formats and units live in `params`. The data shape of each type is a small closed object; the DESIGN worked example (§6) shows the `pie_chart` shape (`{slices: [{label, value}]}`) and the `cartesian_chart` shape (`{series: [{name, points: [{x, y}]}]}`).

**Grid row cap and page sizes (O8).** The grid's transform output has a row cap, and its page sizes are set in the widget catalog FEATURE. The grid always pages, client-side, over the rows the transform delivered (D15, [ADR-0005](0005-data-grid-library-v1.md)).

**Markdown safety.** `markdown_card` shows CommonMark as formatted text. Embedded HTML is shown as text, never rendered. `javascript`, `vbscript` and `data` links are inactive. Links open with no opener (`cpt-frontx-dashboard-fr-markdown-safety`).

**Closed presentation fields.** Every concrete widget type ends with `unevaluatedProperties: false`. A misspelled param fails validation, and the widget gets the cannot-be-shown state ([ADR-0003](0003-shared-data-types-and-schemas-v1.md)).

### Consequences

* Good, because the catalog is bounded by presentation shapes: a new dataset needs no new widget type.
* Good, because each widget type states the exact data it needs, and the root's registration validates every answer against it.
* Good, because widgets do no column mapping and no result computing.
* Good, because params that do not fit the widget type fail before display.
* Good, because a widget type without data never requests data.
* Neutral, because one data type per widget type exists even where some shapes are identical; this keeps them free to differ.
* Bad, because the final params and data shapes per type are a catalog decision that the FEATURE settles (O3), so the ADR names the types and the FEATURE the details.

### Confirmation

* A schema test validates, for each of the 8 data widget types, one accepted `params` and one rejected `params`.
* A schema test checks that a misspelled param on each concrete widget type fails validation, and that `markdown_card` accepts no `data`.
* A test renders a `markdown_card` whose body contains CommonMark formatting, a link, an image and embedded HTML, and checks that the formatting, link and image are shown, the HTML is shown as text and not rendered, and a `javascript:` link is not active.
* A test sends each data widget type an instance of its data shape and checks the root accepts it; it also checks an answer of another type's shape is rejected.
* A test checks the grid sorts and pages client-side over the rows the transform delivered, up to the row cap, and sends no request.
* A test checks that a `null` measure value is shown as a gap or empty value, and a `null` `value` on `metric_card` is the empty state.

## Pros and Cons of the Options

### Per-type data shapes with one entry per type

An abstract `data_widget` holds `data` and the `data_type` trait. Eight concrete data types and eight data shapes. One entry per widget type, pointed to by the `entry` trait.

* Good, because each widget type gets exactly the data it needs, in a typed shape.
* Good, because the root can check params against the type before mounting.
* Good, because the grid sorts and pages client-side on the rows the transform delivered.
* Neutral, because the shapes are many but small, and each is one schema.
* Bad, because the final params and data shapes per type are a catalog decision (O3).

### One generic tabular result with column bindings

Every widget receives the same tabular result. Each widget type binds result columns to its roles in its own params.

* Good, because the data contract is one shape and does not grow with the catalog.
* Bad, because each widget must map columns and check that the bound columns exist, so it is not a passive renderer.
* Bad, because the root cannot check that the data fits a widget type; only the widget can, at run time.
* Bad, because column bindings repeat the result columns in the params, which can drift from the data.

### A data field on every widget type

The widget base carries `data` and the `data_type` trait. A widget type without data leaves them out of use.

* Good, because the hierarchy has one level fewer.
* Bad, because `markdown_card` cannot satisfy a required `data_type` trait, so the traits must be optional and the check that a data widget has them is lost.

### Subject-specific catalog

One widget type per subject and presentation shape combination.

* Good, because each widget is pre-tuned to one subject.
* Bad, because the catalog grows with every new metric, which is the problem the template exists to solve.

## More Information

* **Review trigger**: revisit when a widget type needs a data shape the catalog cannot express, or when a product needs a subject-specific widget.
* **Scope**: this decision covers the catalog structure (widget type = GTS type + data type + entry), the 9 types, the grid's client-side sort and page, and markdown safety. The final params and data shapes per type (O3) and the grid row cap and page sizes (O8) are decided in the widget catalog FEATURE.
* **Checklist applicability**: ARCH applicable; PERF applicable (client-side grid sort and page); SEC applicable (markdown safety); REL N/A; DATA applicable (per-type data shapes, closed params); INT N/A; OPS N/A; MAINT applicable (one data type per widget type to maintain); TEST applicable; COMPL applicable (CommonMark licence); UX applicable (the catalog's visual consistency and accessibility); BIZ N/A.
* Related: DESIGN §6 Worked Example shows the `pie_chart` and `cartesian_chart` types and shapes.

## Traceability

- **PRD**: [PRD.md](../PRD.md)
- **DESIGN**: [DESIGN.md](../DESIGN.md)

This decision directly addresses the following requirements or design elements:

* `cpt-frontx-dashboard-fr-widget-catalog` — the 9 subject-agnostic widget types, each a GTS type, a data type and an entry (D1).
* `cpt-frontx-dashboard-fr-grid-sort-page` — the grid sorts and pages client-side over the rows the transform delivered (D15).
* `cpt-frontx-dashboard-fr-markdown-safety` — `markdown_card` renders CommonMark safely, with HTML as text and inactive script links.
* `cpt-frontx-dashboard-interface-contract` — the widget types and data shapes are part of the published contract.
