---
status: accepted
version: 1
priority: p1
date: 2026-10-31
decision-makers: template-dashboard architecture maintainers
description: "Decision record for the widget data binding: a binding is one of three forms (own, shared or static), the request goes to a same-origin API path, the transform is a CEL expression whose variables depend on the form, the dashboard root runs it with a timeout through the FrontX fetch cache for GET, a shared request is sent once per load, and the CEL library is @marcbachmann/cel-js behind a small internal interface."
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

A data widget shows data, but the product writes no data code. The data must come from the product's API and be shaped into the widget's data type, and the shaping must be part of the dashboard so a dashboard author controls it. The binding connects a data widget to its data through one of three forms: a request the author writes, a shared request the dashboard declares once, or values written into the dashboard with no request. The binding is plain data, part of the dashboard JSON.

The dashboard root runs the binding, not the widget: widgets never make requests. The root sends the request (if any), evaluates the transform, validates the result, and passes it to the widget through `render_widget` ([ADR-0007](0007-extension-domain-taxonomy-v1.md)). What is the transform language, how are the three binding forms run, and what trust, sharing and timeout apply?

## Decision Drivers

* The binding is plain data, part of the dashboard JSON, editable like the rest of it.
* The product writes no data code; the dashboard root runs the binding.
* The binding has three forms — own, shared and static — with transform variables that depend on the form; shared requests are plain data in the dashboard JSON, sent once per dashboard load.
* Dashboard sources are trusted and product-controlled; requests go to same-origin absolute paths with `GET` or `POST` only, every `GET` through the FrontX fetch cache and every `POST` through the FrontX API package.
* A failing shared request fails every dependent cell; any other failure, including a request that never answers (which times out and shows the cell's error state), affects only its cell or larger view.
* Static bindings evaluate at once, with no request.
* The transform sees only its declared variables, with no access to the host, the network, other widgets or shared state.
* The transform library must be small, dependency-free, return plain JS, give authors feedback before anything runs, and be swappable behind a small internal interface.

## Considered Options

* A CEL transform over the parsed JSON response
* A product-supplied data adapter
* JSONPath or jq over the response

## Decision Outcome

Chosen option: "A CEL transform over the parsed JSON response", because the binding stays plain data in the dashboard JSON, the product writes no data code, CEL is a small expression language with no runtime dependencies that returns plain JS, and the root can run it with a timeout and a response-size cap.

**The binding (three forms).** A data widget's `data` is a binding with exactly one of three forms; `request` is mutually exclusive with both `source` and `params`, and `params` is allowed only with `source` or alone; the binding is plain data, part of the dashboard JSON:
- **own:** `{request, transform}` — `request` has `method` (`GET` or `POST`), `path` (an absolute same-origin path; the query string is part of the path), and an optional `body` (JSON, allowed only with `POST`). `transform` is a CEL expression whose single variable is `response`, the parsed JSON body.
- **shared:** `{source, params?, transform}` — `source` names an entry in the dashboard's `requests` object. `params` is any JSON object (absent means `{}`). `transform` is a CEL expression whose variables are `response` (the shared response) and `params`.
- **static:** `{params?, transform}` — `params` is any JSON object (absent means `{}`). `transform` is a CEL expression whose single variable is `params`. Binding `params` is the transform's input values; it is unrelated to the widget's `render` field.

**Shared requests.** The dashboard has an optional `requests` object: a name maps to a request with the same fields as an own binding's request (`method`, `path`, `body?`). Names match `^[a-z][a-z0-9_]{0,63}$`. The runner sends each shared request once per dashboard load, in parallel with own requests, and only if at least one cell or larger view refers to it. Shared requests use the same trust rules, timeout and response-size cap as own requests. The root keeps the response until teardown and runs every dependent transform on it.

**The runner.** The dashboard root runs each cell (and each larger view) in parallel, by binding form:
- **own:** send the request and evaluate the transform on `response`;
- **shared:** start the shared request if it isn't running yet; when it answers, evaluate this cell's transform on `response` and `params`;
- **static:** evaluate the transform on `params` at once, with no loader.

Then stamp the result, register it (which validates it against the widget's data type), and send `render_widget {widget, data}`. Widgets never make requests.

**GET through the FrontX fetch cache.** The runner issues every GET (own and shared) through a `RestEndpointProtocol` descriptor (`queryWith`) with `staleTime: 0`, and every POST through `RestProtocol.post`. The fetch cache lives on the realm global, so every evaluated copy of the API package in the page (host, dashboard root, other extensions) uses one cache. It joins concurrent identical GETs to one in-flight fetch; its key is the request after plugins ran (method, URL, headers, query params, body, credentials), so requests with different auth headers never share. It is active only while someone retains it, and it never covers POST. With `staleTime: 0` it only joins in-flight requests and never serves a completed response, so every load shows fresh data. The root does not retain the cache: the product decides whether it is on. Identical GETs across cells, dashboards and other runtimes are coalesced by FrontX when the product turns the cache on, and the template has no coalescing of its own. Template-side coalescing of identical own requests was considered as an option but rejected, because FrontX's fetch cache already coalesces concurrent identical GETs when the product turns it on, so template-side coalescing would duplicate what FrontX does and add complexity for no gain, and it cannot coalesce POSTs, so named shared requests are still needed for POST. Named shared requests are the explicit way to share, and the only one for POST. The API service `timeout` applies on both paths.

**Per-cell failure and static evaluation.** A failed or timed-out shared request shows the error state in every dependent cell; the developer log names the request. A `source` with no matching entry in `requests` fails only that cell, before anything runs. Each dependent transform succeeds or fails on its own. A static binding's transform is evaluated without a loader, then stamped and registered, which validates it against the widget's data type exactly like fetched data; a CEL error or failed validation shows the cell's error state. CEL has no current-time function, so static data can't depend on the date.

**Trust, timeout and safe mappings.** Dashboard sources are trusted and product-controlled. Requests go to same-origin absolute paths; the root rejects any other target before the request is sent. Sign-in and request authentication are out of scope; each request is authenticated by the product's API setup, and the template carries no credentials. A request that never answers times out and shows the cell's error state; the timeout is the root's API service `timeout` option, in milliseconds, and the value is set in the DESIGN. The transform sees only its declared variables (`response` and/or `params`), with no access to the host, the network, other widgets or any shared state; the root caps the response size it accepts, and the cap is set in the DESIGN.

**CEL library.** The template uses `@marcbachmann/cel-js` (MIT, no runtime dependencies, about 24 KB gzipped), version pinned, with `homogeneousAggregateLiterals: false` and `unlistedVariablesAreDyn: true`. The binding runner wraps it behind a small internal interface (parse, check, evaluate, convert to JSON), so it can be swapped in one module. `env.check()` and its caret errors give authors feedback before anything runs. Golden tests of typical transforms guard spec behaviour. The runner declares the form's variables explicitly; a golden test checks that `check()` rejects the others. JSON numbers arrive as CEL `double`, and CEL never converts numbers implicitly, so authors write `r[1] + 1.0` or `int(r[1])`; a missing field is an error, so optional fields need `has()`.

### Consequences

* Good, because the binding is plain data in the dashboard JSON, so a dashboard author controls the data shaping with no product code, and the product writes no data code; the root runs the binding against the product's same-origin API.
* Good, because a shared request is sent once, keeping the dashboard fast and light on the API.
* Good, because a static binding needs no request, so a widget with fixed data shows at once.
* Good, because CEL is small, dependency-free, returns plain JS, gives authors caret feedback before anything runs, and the library is pinned and wrapped behind a small interface so it can be swapped in one module.
* Good, because a per-cell timeout and a response-size cap contain a slow or huge response to its cell or larger view.
* Bad, because the single-maintainer library is a maintenance risk and no JS CEL library limits evaluation time. Mitigation: pinning, the wrapper interface, golden tests, the response-size cap, and a Worker timeout only if real expressions need it; `@bufbuild/cel` is the alternative behind the same interface.
* Bad, because a failing shared request fails all its dependent cells (a known trade-off for sharing).

### Confirmation

* A test runs the donut binding (`POST /…/run`, transform `{'slices': response.rows.map(r, {'label': string(r[0]), 'value': double(r[1])})}`) and confirms the stamped result validates against the `pie_chart` data type and reaches the widget through `render_widget`.
* A test confirms a request to a non-same-origin path or a method other than `GET`/`POST` is rejected before it is sent.
* A test confirms a request that never answers times out and the cell shows the cannot-be-shown state.
* A test confirms a transform that errors, or a result that fails validation, fails only its cell.
* A test confirms the root caps the response size it accepts, and an over-cap response fails the cell.
* A test confirms `env.check()` reports a malformed transform with a caret before the request is sent, that `has()` on a missing field does not error, and that a missing field without `has()` does.
* A test confirms the library is pinned and wrapped behind the internal interface, and that golden tests of typical transforms pass.
* A test confirms one network call is made per shared request, even when several widgets refer to it, and that every GET goes through a `queryWith` descriptor with `staleTime: 0`.
* A test confirms an unknown `source` (no matching entry in `requests`) fails only that cell before anything runs, and that a failing shared request fails all its dependent cells.
* A test confirms a static binding is evaluated and its result validated without a request.

## Pros and Cons of the Options

### A CEL transform over the parsed JSON response

The binding is one of three forms; the transform is a CEL expression over its declared variables, run by the root with a timeout and a response-size cap.

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

* **Review trigger / open items**: revisit if the single-maintainer CEL library stops being maintained, or if a real transform needs evaluation-time limiting. Open items: the response-size cap value and the timeout value — both set in the DESIGN; and whether grid rows should be positional arrays or keyed by column name through a CEL helper, which is an open question about the binding's transform variables for grid data.
* **Scope**: this decision covers the three binding forms, shared requests, the runner, the GET fetch-cache path, trust, timeout, safe mappings, and the CEL library. It does not cover the widget catalog data shapes ([ADR-0009](0009-subject-agnostic-widget-catalog-v1.md)), the GTS conventions or stamped data ([ADR-0003](0003-shared-data-types-and-schemas-v1.md)), the `widgets` domain or `render_widget` ([ADR-0007](0007-extension-domain-taxonomy-v1.md)), or the packages ([ADR-0010](0010-template-packages-and-host-contract-v1.md)).
* **Checklist applicability**: ARCH applicable; PERF applicable (timeout, response-size cap, one request per shared request); SEC applicable (same-origin, no credentials, safe mappings, response-size cap); REL applicable (per-cell failure, timeout, shared-request failure); DATA applicable (the binding schema, CEL over the parsed JSON); INT applicable (same-origin API, the FrontX API package, the FrontX fetch cache); OPS N/A; MAINT applicable (pinned, wrapped library); TEST applicable; COMPL applicable (MIT licence); UX N/A; BIZ applicable (the product writes no data code).
* **Notes**: The PRD calls the binding's `transform` field 'an expression'; this ADR uses `transform` for the field name.
* Related: [google/cel-spec](https://github.com/google/cel-spec).

## Traceability

- **PRD**: [PRD.md](../PRD.md)
- **DESIGN**: [DESIGN.md](../DESIGN.md)

This decision directly addresses the following requirements or design elements:

* `cpt-frontx-dashboard-fr-no-product-data-code` / `cpt-frontx-dashboard-fr-same-origin-data` — the product writes no data code; the root runs the binding against the product's same-origin API, and requests go to same-origin absolute paths with `GET` or `POST` only.
* `cpt-frontx-dashboard-fr-safe-mappings` — the transform sees only its declared variables, with no host, network or shared state, and the root caps the response size.
* `cpt-frontx-dashboard-fr-shared-data` / `cpt-frontx-dashboard-fr-static-data` — data shared by several widgets is fetched once per dashboard load from a request the dashboard declares once, and a data widget can show data written into the dashboard, with no request, validated like fetched data.
* `cpt-frontx-dashboard-fr-per-cell-failure` / `cpt-frontx-dashboard-fr-states` — a failed request, timeout, CEL error or data validation error affects only its cell or larger view, and a timed-out or failed cell shows the cannot-be-shown state.
