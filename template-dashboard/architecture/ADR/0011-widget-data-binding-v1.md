---
status: accepted
version: 1
date: 2026-10-31
decision-makers: template-dashboard architecture maintainers
description: "Decision record for the widget data binding: a binding is {request, transform}, the request says which same-origin API to call (D17), the transform is a CEL expression that turns the response into the widget's data (D2), the dashboard root runs it with a timeout (D16), and the CEL library is @marcbachmann/cel-js behind a small internal interface (D21)."
---

# ADR-0011: Widget data binding

**ID**: `cpt-frontx-dashboard-adr-widget-data-binding`

<!-- toc -->

- [Context and Problem Statement](#context-and-problem-statement)
- [Decision Drivers](#decision-drivers)
- [Considered Options](#considered-options)
- [Decision Outcome](#decision-outcome)
  - [Consequences](#consequences)
  - [Confirmation](#confirmation)
- [Pros and Cons of the Options](#pros-and-cons-of-the-options)
  - [A CEL transform over the parsed JSON response](#a-cel-transform-over-the-parsed-json-response)
  - [A product-supplied data adapter](#a-product-supplied-data-adapter)
  - [JSONPath or jq over the response](#jsonpath-or-jq-over-the-response)
- [More Information](#more-information)
- [Traceability](#traceability)

<!-- /toc -->

## Context and Problem Statement

A data widget shows data, but the product writes no data code. The data must come from the product's API and be shaped into the widget's data type, and the shaping must be part of the dashboard so a dashboard author controls it. So a data widget's data is a binding the author wrote into the dashboard JSON: `{request, transform}` (D2). The `request` says which API to call; the `transform` is an expression that turns the response into the widget's data.

The dashboard root runs the binding, not the widget: widgets never make requests (D3). The root runs the request through the FrontX API package, evaluates the transform, validates the result, and passes it to the widget through `render_widget` ([ADR-0007](0007-extension-domain-taxonomy-v1.md)). What is the transform language, how is the binding run, and what trust and timeout apply?

## Decision Drivers

* The binding is plain data, part of the dashboard JSON, editable like the rest of it (D2).
* The product writes no data code; the dashboard root runs the binding (D3).
* Dashboard sources are trusted and product-controlled; requests go to same-origin absolute paths with `GET` or `POST` only (D17).
* A request that never answers times out and shows the cell's error state (D16).
* The transform sees only the parsed JSON response, with no access to the host, the network, other widgets or shared state (`cpt-frontx-dashboard-fr-safe-mappings`).
* The transform library must be small, dependency-free, return plain JS, and give authors feedback before anything runs.
* The transform library must be swappable behind a small internal interface.

## Considered Options

* A CEL transform over the parsed JSON response
* A product-supplied data adapter
* JSONPath or jq over the response

## Decision Outcome

Chosen option: "A CEL transform over the parsed JSON response", because the binding stays plain data in the dashboard JSON, the product writes no data code, CEL is a small expression language with no runtime dependencies that returns plain JS, and the root can run it with a timeout and a response-size cap.

**The binding (D2).** A data widget's `data` is a binding `{request, transform}`. `request` has `method` (`GET` or `POST`), `path` (an absolute same-origin path; the query string is part of the path), and an optional `body` (JSON, allowed only with `POST`, a schema rule). `transform` is a CEL expression whose single variable is `response`, the parsed JSON body. The binding is plain data, editable like the rest of the dashboard.

**The runner (D3).** The dashboard root runs the binding for each cell (and each larger view), in parallel, one request per widget (D9). For each binding it: runs the request through the FrontX API package, with a timeout (D16); evaluates the CEL transform on `response`; stamps the result with `<data type>~<UUIDv5(widget id | role)>` (D20); and registers it, which validates it against the widget's data type ([ADR-0003](0003-shared-data-types-and-schemas-v1.md)). It sends `render_widget {widget, data}` once `mount_ext` has finished and the data is valid. Widgets never make requests.

**Trust (D17).** Dashboard sources are trusted and product-controlled in v1. Requests go to same-origin absolute paths with `GET` or `POST` only; the root rejects any other target before the request is sent. Sign-in and request authentication are out of scope (D4); each request is authenticated by the product's API setup, and the template carries no credentials. Each evaluated copy of the API package has its own `apiRegistry` and plugins. In a single-page application the root shares the host's copy. In an MFE the root has its own copy, which the product configures in its copy of the template.

**Timeout (D16).** A request that never answers times out and shows the cell's error state. The timeout is the root's API service `timeout` option, in milliseconds; the value is set in the DESIGN (O9).

**Safe mappings.** The transform sees only `response`. It has no access to the host, the network, other widgets or any shared state. The root caps the response size it accepts; the cap is set in the DESIGN (O11).

**CEL library (D21).** The template uses `@marcbachmann/cel-js` (MIT, no runtime dependencies, about 24 KB gzipped), version pinned, with `homogeneousAggregateLiterals: false` and `unlistedVariablesAreDyn: true`. The binding runner wraps it behind a small internal interface (parse, check, evaluate, convert to JSON), so it can be swapped in one module. `env.check()` and its caret errors give authors feedback before anything runs. Golden tests of typical transforms guard spec behaviour, since the library doesn't run the official cel-spec conformance suite. JSON numbers arrive as CEL `double`, and CEL never converts numbers implicitly, so authors write `r[1] + 1.0` or `int(r[1])`; a missing field is an error, so optional fields need `has()`.

**Per-cell failure (D13).** A failed request, a timeout, a CEL error, a data validation error, a rejected registration or a failed mount affects only that cell or larger view. The diagnostic goes to the developer log, with dashboard id, widget id, widget type and the GTS message.

### Consequences

* Good, because the binding is plain data in the dashboard JSON, so a dashboard author controls the data shaping with no product code.
* Good, because the product writes no data code; the root runs the binding against the product's same-origin API.
* Good, because CEL is small, dependency-free, returns plain JS, and gives authors caret feedback before anything runs.
* Good, because the library is pinned and wrapped behind a small interface, so it can be swapped in one module.
* Good, because a per-cell timeout and a response-size cap contain a slow or huge response to its cell (D13, D16).
* Bad, because the single-maintainer library is a maintenance risk. Mitigation: pinning, the wrapper interface, and golden tests; `@bufbuild/cel` is the alternative behind the same interface.
* Bad, because no JS CEL library limits evaluation time. Mitigation: the response-size cap, and evaluation in a Worker with a timeout only if real expressions need it (O11).
* Bad, because rows are positional in v1, so authors index them by position; a column-by-name helper is open (O1).

### Confirmation

* A test runs the sketch's donut binding (`POST /…/run`, transform `{'slices': response.rows.map(r, {'label': string(r[0]), 'value': double(r[1])})}`) and confirms the stamped result validates against the `pie_chart` data type and reaches the widget through `render_widget`.
* A test confirms a request to a non-same-origin path or a method other than `GET`/`POST` is rejected before it is sent.
* A test confirms a request that never answers times out and the cell shows the cannot-be-shown state.
* A test confirms a transform that errors, or a result that fails validation, fails only its cell.
* A test confirms the root caps the response size it accepts, and an over-cap response fails the cell.
* A test confirms `env.check()` reports a malformed transform with a caret before the request is sent.
* A test confirms a transform with `has()` on a missing field does not error, and one without `has()` does.
* A test confirms the library is pinned and wrapped behind the internal interface, and that golden tests of typical transforms pass.

## Pros and Cons of the Options

### A CEL transform over the parsed JSON response

The binding is `{request, transform}`; the transform is a CEL expression over the parsed JSON response, run by the root with a timeout and a response-size cap.

* Good, because the binding is plain data, and the product writes no data code.
* Good, because CEL is small, dependency-free, returns plain JS, and gives caret feedback.
* Good, because the library is swappable behind the internal interface.
* Bad, because the library has a single maintainer and no conformance suite. Mitigation: pinning, the wrapper, golden tests.
* Bad, because no JS CEL library limits evaluation time. Mitigation: the response-size cap, and a Worker timeout only if needed.

### A product-supplied data adapter

The product implements a data adapter the root calls; the dashboard carries a query the adapter interprets.

* Good, because the product controls the data shaping in its own code.
* Bad, because the product writes data code for every dashboard, which is what the template exists to avoid.
* Bad, because the shaping is not part of the dashboard, so a dashboard author cannot control it.

### JSONPath or jq over the response

The transform is a JSONPath or jq expression over the response.

* Good, because both are small and well-known.
* Bad, because JSONPath cannot reshape or compute (it only selects), so it cannot produce most widget data shapes.
* Bad, because jq is a C library wrapped for JS, with a larger footprint and a different language to learn.

## More Information

* **Review trigger**: revisit if the single-maintainer CEL library stops being maintained, or if a real transform needs evaluation-time limiting (O11).
* **Open items**: positional rows vs a column-by-name CEL helper (O1); a validate-only GTS call (O2); the response-size cap value (O11); the timeout value (O9, set in the DESIGN).
* **Scope**: this decision covers the binding `{request, transform}`, the runner, trust, timeout, safe mappings, and the CEL library. It does not cover the widget catalog data shapes ([ADR-0009](0009-subject-agnostic-widget-catalog-v1.md)), the GTS conventions or stamped data ([ADR-0003](0003-shared-data-types-and-schemas-v1.md)), the `widgets` domain or `render_widget` ([ADR-0007](0007-extension-domain-taxonomy-v1.md)), or the packages ([ADR-0010](0010-template-packages-and-host-contract-v1.md)).
* **Checklist applicability**: ARCH applicable; PERF applicable (timeout, response-size cap); SEC applicable (same-origin, no credentials, safe mappings, response-size cap); REL applicable (per-cell failure, timeout); DATA applicable (the binding schema, CEL over the parsed JSON); INT applicable (same-origin API, the FrontX API package); OPS N/A; MAINT applicable (pinned, wrapped library); TEST applicable; COMPL applicable (MIT licence); UX N/A; BIZ applicable (the product writes no data code).
* Related: [google/cel-spec](https://github.com/google/cel-spec); the sketch's §10 CEL library comparison and §6 worked example.

## Traceability

- **PRD**: [PRD.md](../PRD.md)
- **DESIGN**: [DESIGN.md](../DESIGN.md)

This decision directly addresses the following requirements or design elements:

* `cpt-frontx-dashboard-fr-no-product-data-code` — the product writes no data code; the root runs the binding against the product's same-origin API (D2, D3).
* `cpt-frontx-dashboard-fr-same-origin-data` — requests go to same-origin absolute paths with `GET` or `POST` only (D17).
* `cpt-frontx-dashboard-fr-safe-mappings` — the transform sees only `response`, with no host, network or shared state, and the root caps the response size (O11).
* `cpt-frontx-dashboard-fr-per-cell-failure` — a failed request, timeout, CEL error or data validation error affects only its cell (D13, D16).
* `cpt-frontx-dashboard-fr-states` — a timed-out or failed cell shows the cannot-be-shown state.
