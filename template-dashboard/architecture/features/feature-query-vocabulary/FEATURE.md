---
status: accepted
version: 1
date: 2026-10-30
description: Closed base query type with its subset, filter operators, time forms, time zone rule and the rules for order, limit, offset and total; query members and the canonical member order; measure and dimension bases; derivation of query families and datasets with enums at five narrowing positions and binding traits; identifier rules; contract of the trait helper interface.
---

# Feature: Query Vocabulary

<!-- toc -->

- [1. Feature Context](#1-feature-context)
  - [1.1 Overview](#11-overview)
  - [1.2 Purpose](#12-purpose)
  - [1.3 Actors](#13-actors)
  - [1.4 References](#14-references)
- [2. Actor Flows (CDSL)](#2-actor-flows-cdsl)
  - [Describe a Dataset and Write a Query](#describe-a-dataset-and-write-a-query)
- [3. Processes / Business Logic (CDSL)](#3-processes--business-logic-cdsl)
  - [Validate a Query](#validate-a-query)
  - [Derive the Canonical Member Order](#derive-the-canonical-member-order)
  - [Check a Derivation](#check-a-derivation)
  - [Resolve Effective Traits](#resolve-effective-traits)
- [4. States (CDSL)](#4-states-cdsl)
  - [Domain-Model Feature — No State Machines](#domain-model-feature--no-state-machines)
- [5. Definitions of Done](#5-definitions-of-done)
  - [Closed Base Query Type](#closed-base-query-type)
  - [Measure and Dimension Bases](#measure-and-dimension-bases)
  - [Query Family and Dataset Derivation](#query-family-and-dataset-derivation)
  - [Identifier Rules](#identifier-rules)
  - [Trait Helper Contract](#trait-helper-contract)
- [6. Domain Model](#6-domain-model)
  - [6.1 Base Query Type](#61-base-query-type)
  - [6.2 Time Forms](#62-time-forms)
  - [6.3 Query Members and Canonical Member Order](#63-query-members-and-canonical-member-order)
  - [6.4 Measure and Dimension Bases](#64-measure-and-dimension-bases)
  - [6.5 Query Families and Datasets](#65-query-families-and-datasets)
  - [6.6 Identifier Rules](#66-identifier-rules)
  - [6.7 Trait Helper Contract](#67-trait-helper-contract)
- [7. Acceptance Criteria](#7-acceptance-criteria)

<!-- /toc -->

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-featstatus-query-vocabulary`

## 1. Feature Context

- [ ] `p2` - `cpt-frontx-dashboard-feature-query-vocabulary`

### 1.1 Overview

This feature declares the vocabulary in which a data widget states what data it wants. It has the closed base query type, the query members and the canonical member order, the measure and dimension bases, the rules that derive a query family and a dataset from the base, the rules for identifier fields, and the contract of the trait helper. It is mostly a domain-model feature. One actor flow, four algorithms and a Domain Model section carry the details.

### 1.2 Purpose

A data widget embeds one query in its `data` field. The query is written in the query format of `cpt-frontx-dashboard-adr-query-vocabulary-and-datasets`, with that format's published meaning. Its members are GTS instance ids. Template rules only narrow what an author may write. Standard GTS validation must catch an unknown member, a member the dataset does not offer, a misspelled field, a field outside the subset, a wrong number of filter values or a date that does not match its pattern when the dashboard loads. The owner cross-check at load adds what a pattern cannot check: a date range whose start is after its end, and a date or time that is not a real calendar value (`cpt-frontx-dashboard-algo-widget-catalog-cross-check-widget`). The data adapter must be able to turn any valid query into backend calls without knowing the product. This feature gives the template-owned part of that contract: the closed base, the vocabulary, and the narrowing rules that a consuming product follows.

Not applicable: user experience (UX), operations (OPS) and compliance (COMPL) have no content in a vocabulary of types. Performance (PERF) has one rule here: a query without `limit` asks for the complete result, and the data adapter and the backend carry that load. Authors bound the rows through the dataset's members, through filters, or with a `limit` where the widget type allows it. Security (SEC) is covered by closed schema validation, which rejects unknown fields, and by the structured query, which sends no query text towards a backend. Filter `values` and `timezone` are data that the data adapter receives. They are never interpreted as query text.

**Declaring package**: `dashboard`, model package `dashboard_m` (the base query type, the measure base and the dimension base). The trait helper is template code in the `dashboard` package.

**Requirements**: `cpt-frontx-dashboard-fr-domain-model`, `cpt-frontx-dashboard-fr-backend-source`, `cpt-frontx-dashboard-fr-data-adapter`, `cpt-frontx-dashboard-fr-grid-sort-page`, `cpt-frontx-dashboard-nfr-consumer-docs`

**Principles**: `cpt-frontx-dashboard-principle-gts-contracts`

**Constraints**: `cpt-frontx-dashboard-constraint-gts-id-convention`

**Use cases**: `cpt-frontx-dashboard-usecase-provide-dashboard` (the types that a consuming product describes a dataset with; the other features named in DECOMPOSITION cover the remaining steps)

**Out of scope**:

- The widget types that limit the form of a query, the rule that a widget's `data` forbids `timezone`, which widget types allow `compareDateRange` and which require or forbid `total`, and the owner cross-checks of a widget (`cpt-frontx-dashboard-feature-widget-catalog`).
- The data shapes and fill modes that read a query (`cpt-frontx-dashboard-feature-widget-data-catalog`).
- Which query families a data adapter serves and how it answers a query (`cpt-frontx-dashboard-feature-data-adapter-contract`), and the delivery of datasets and vocabulary with a dashboard, including their registration order (`cpt-frontx-dashboard-feature-dashboard-root-types`).
- The datasets, measures and dimensions of a product, and the backend binding that a dataset carries. These belong to the consuming product.
- Dashboard-wide filters and declarative dataset specs (DESIGN section 4, Not covered).

### 1.3 Actors

| Actor | Role in Feature |
|-------|-----------------|
| `cpt-frontx-dashboard-actor-template-consumer` | Writes the query families, datasets, measures and dimensions of the product, and the queries in widgets (by hand or by generation), following this vocabulary. |

The dashboards root, the larger-view modal and the data adapter use the result at runtime. They are components, not actors of this feature.

### 1.4 References

- **PRD**: [PRD.md](../../PRD.md)
- **Design**: [DESIGN.md](../../DESIGN.md#31-domain-model) (query, query member, canonical member order, query family, dataset, measure, dimension), the trait helper component `cpt-frontx-dashboard-component-trait-helper`, the trait helper interface `cpt-frontx-dashboard-interface-trait-helper`, which this feature owns, and `cpt-frontx-dashboard-interface-domain-model` (query vocabulary part)
- **ADRs**: `cpt-frontx-dashboard-adr-query-vocabulary-and-datasets` (owner), `cpt-frontx-dashboard-adr-shared-data-types-and-schemas` (GTS conventions, polymorphic validation, ordered pairs, trait helper, registry access), `cpt-frontx-dashboard-adr-subject-agnostic-widget-catalog` (users of the canonical member order), `cpt-frontx-dashboard-adr-data-grid-library` (paging with `limit`, `offset` and `total`, sorting with `order` pairs), `cpt-frontx-dashboard-adr-data-adapter` (complete results, binding with measure aggregation), `cpt-frontx-dashboard-adr-template-packages-and-host-contract` (stable signature of the trait helper)
- **Dependencies**: None
- **Used by**: `cpt-frontx-dashboard-feature-widget-data-catalog`, `cpt-frontx-dashboard-feature-widget-catalog`, `cpt-frontx-dashboard-feature-dashboard-root-types`, `cpt-frontx-dashboard-feature-data-adapter-contract`, `cpt-frontx-dashboard-feature-extension-domain-catalog`. The trait helper is hosted with the template code of `cpt-frontx-dashboard-feature-mfe-entries`.

## 2. Actor Flows (CDSL)

**Use cases**: `cpt-frontx-dashboard-usecase-provide-dashboard`

### Describe a Dataset and Write a Query

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-flow-query-vocabulary-describe-dataset`

**Actor**: `cpt-frontx-dashboard-actor-template-consumer`

**Success Scenarios**:
- The product has a query family, a dataset and its vocabulary instances. A widget query written against them passes validation at dashboard load.

**Error Scenarios**:
- A query names a member that the dataset does not offer, has a misspelled field, or has a field outside the subset. Validation fails, and the widget shows the cannot-show state in its own cell.
- A widget's `data` carries `timezone`. Validation of the widget type fails, and the widget shows the cannot-show state in its own cell.
- A dataset widens a property of its parent. The dataset is rejected as a derivation.

**Steps**:
1. [ ] - `p1` - Write the measures and dimensions of the product as well-known instances of the measure base and the dimension base, with `id`, `title` and `value_type` - `inst-write-vocabulary`
2. [ ] - `p1` - Write a query family type derived from the base query type, with `x-gts-traits-schema` that states the shape of the backend binding, including whether each measure can be re-aggregated from grouped values - `inst-write-family`
3. [ ] - `p1` - Write a dataset type derived from the query family, with the members it supports as enums at the five narrowing positions and the binding values in `x-gts-traits` - `inst-write-dataset`
4. [ ] - `p1` - Check the dataset with `cpt-frontx-dashboard-algo-query-vocabulary-check-derivation` - `inst-check-derivation`
5. [ ] - `p1` - **IF** the dashboard is generated - `inst-branch-generated`
   1. [ ] - `p1` - Give the generator the JSON Schema of the dataset and the product's catalog of datasets and vocabulary - `inst-give-catalog`
6. [ ] - `p1` - Generate a UUID for the query - `inst-generate-uuid`
7. [ ] - `p1` - Write the embedded query of a widget: a combined `id` (the dataset type chain followed by the UUID), the members in `measures` and `dimensions`, and the optional `timeDimensions` entry, `filters`, `order` pairs, `limit`, `offset` and `total`. Leave out `timezone`, which the widget sets when it sends the query - `inst-write-query`
8. [ ] - `p1` - Deliver the dataset and vocabulary with the dashboard, as `cpt-frontx-dashboard-feature-dashboard-root-types` specifies - `inst-deliver`
9. [ ] - `p1` - **RETURN** a query that `cpt-frontx-dashboard-algo-query-vocabulary-validate-query` accepts - `inst-return-valid`

## 3. Processes / Business Logic (CDSL)

### Validate a Query

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-algo-query-vocabulary-validate-query`

**Input**: A widget instance whose `data` is an embedded query, and the registered types.

**Output**: Valid, or a failure that gives the widget the cannot-show state.

**Steps**:
1. [ ] - `p1` - Read the dataset type chain from `data.id`: the base query, the query family and the dataset, followed by the UUID - `inst-read-chain`
2. [ ] - `p1` - **IF** `data.id` names no registered dataset type, or its chain does not start with the base query type, **RETURN** failure - `inst-reject-unknown-dataset`
3. [ ] - `p1` - Validate `data` against the dataset type that `data.id` names. This is the polymorphic validation of `cpt-frontx-dashboard-adr-shared-data-types-and-schemas`, inside the one GTS validation of the widget - `inst-validate-polymorphic`
4. [ ] - `p1` - **IF** the GTS validation reports a failure, **RETURN** failure; otherwise **RETURN** valid. The owner cross-checks of `cpt-frontx-dashboard-feature-widget-catalog` run after it - `inst-return-validate-result`

The template adds no validation mode of its own. The single GTS validation of step 3 is what rejects a query. The table lists the GTS failures of a query.

| Rejected | What fails |
|----------|------------|
| Unknown dataset | A `data.id` that names no registered dataset type, or whose chain does not start at the base query |
| Unknown field | A field that the closed base does not declare, such as a misspelled field or `segments` |
| No members | A query with neither `measures` nor `dimensions` items |
| Member outside the dataset | A member that is not in the matching enum of the dataset at one of the five narrowing positions: an item of `measures` or `dimensions`, `timeDimensions[0].dimension`, a `filters[].member`, or the first item of an `order` pair |
| Time dimension entry | A `timeDimensions` array without exactly one entry, or a `granularity` outside the five values |
| Date range | A `dateRange` pair that does not match the date pattern, or a relative string outside the closed set. A start after the end, or a date that is not a real calendar value, passes GTS and fails the owner cross-check |
| Compared ranges | A `compareDateRange` next to `dateRange`, or one that does not hold exactly 2 ranges |
| Filter arity | A filter whose number of `values` does not fit its operator, or a value that is not a string |
| Order pair | An `order` item that is not a pair of a member and `asc` or `desc` |

An authored query with `timezone` is rejected by the same GTS validation, through the widget type's limit on `data` (`cpt-frontx-dashboard-feature-widget-catalog`). The checks that JSON Schema cannot express are owner cross-checks of `cpt-frontx-dashboard-algo-widget-catalog-cross-check-widget`: every query member names a registered instance of the right kind, the first item of every `order` pair is a result column, and each filter operator fits its member's kind, each date range has its start not after its end and holds real calendar values, and the values of a filter fit its operator.

### Derive the Canonical Member Order

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-algo-query-vocabulary-canonical-order`

**Input**: A valid query.

**Output**: The ordered list of the query's result columns.

**Steps**:
1. [ ] - `p1` - Start with the items of `dimensions` in query order - `inst-order-dimensions`
2. [ ] - `p1` - **IF** `timeDimensions[0]` is present and has a `granularity` - `inst-order-time-branch`
   1. [ ] - `p1` - Append `timeDimensions[0].dimension` - `inst-order-time`
3. [ ] - `p1` - Append the items of `measures` in query order - `inst-order-measures`
4. [ ] - `p1` - **RETURN** the list. Positional rows and the owner cross-checks use it - `inst-order-return`

### Check a Derivation

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-algo-query-vocabulary-check-derivation`

**Input**: A query family or a dataset type, and its parent type.

**Output**: Accepted, or a reason for rejection.

**Steps**:
1. [ ] - `p1` - **IF** the type is a query family - `inst-check-family-branch`
   1. [ ] - `p1` - Require `x-gts-abstract` and `x-gts-traits-schema`, and require that its `$id` chain starts with the base query type. Otherwise **RETURN** rejection naming the failed rule - `inst-check-family`
2. [ ] - `p1` - **IF** the type is a dataset - `inst-check-dataset-branch`
   1. [ ] - `p1` - Require that the dataset is concrete (not `x-gts-abstract`), and that its `$id` chain names the base query type, the query family and the dataset. Otherwise **RETURN** rejection naming the failed rule - `inst-check-concrete`
   2. [ ] - `p1` - Require that its member enums sit at the five narrowing positions of section 6.5, and that each enum is a subset of the allowed values of its parent, so the dataset only narrows. Otherwise **RETURN** rejection naming the failed rule - `inst-check-narrow`
   3. [ ] - `p1` - Require that no member of the enum at `timeDimensions.items.properties.dimension` is also in the enum at `dimensions.items`, so a query never lists its time dimension in `dimensions`. Otherwise **RETURN** rejection naming the failed rule - `inst-check-time-apart`
   4. [ ] - `p1` - Require `x-gts-traits` that satisfy the `x-gts-traits-schema` of the query family. Otherwise **RETURN** rejection naming the failed rule - `inst-check-traits`
3. [ ] - `p1` - **IF** the type adds a property or opens a closed one - `inst-check-widen`
   1. [ ] - `p1` - **RETURN** rejection. Schema review catches this, as `cpt-frontx-dashboard-adr-query-vocabulary-and-datasets` states under Confirmation - `inst-reject-widen`
4. [ ] - `p1` - **RETURN** accepted - `inst-accept`

A check that the template runs over its sample datasets verifies some rules automatically. The others remain schema review.

| Rule | Verified by |
|------|-------------|
| The type is concrete or abstract as its kind requires (`x-gts-abstract`) | Automatic check over the sample datasets |
| The `$id` chain starts at the base query and names the family and the dataset | Automatic check over the sample datasets |
| No member of the time dimension enum is in the `dimensions` enum | Automatic check over the sample datasets |
| Each enum only narrows the enum of its parent | Automatic check over the sample datasets |
| The traits satisfy the traits schema of the family | GTS registration |
| The type adds no property and opens no closed one | Schema review |
| The enums sit at the five narrowing positions and nowhere else | Schema review |

### Resolve Effective Traits

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-algo-query-vocabulary-effective-traits`

**Input**: A type id without a UUID, and the registry access of the owner runtime that the trait helper is bound to.

**Output**: The effective traits of the type, as one object, or a failure.

**Steps**:
1. [ ] - `p2` - Split the type id into its `$id` chain: the prefixes of the type id that end at each `~`, from the base to the type. **IF** the input ends with a UUID (an instance id), **RETURN** failure, because the helper takes type ids only - `inst-traits-chain`
2. [ ] - `p2` - **FOR EACH** type in the chain, in order - `inst-traits-each`
   1. [ ] - `p2` - Get its schema with `getSchema` of the bound registry access. **IF** `getSchema` cannot return a schema along the chain, **RETURN** failure and no partial result - `inst-traits-get`
   2. [ ] - `p2` - Merge its `x-gts-traits` into the result with RFC 7396, so a later type overrides an earlier one. A type without `x-gts-traits` contributes nothing - `inst-traits-merge`
3. [ ] - `p2` - **RETURN** the result. The helper registers nothing, validates nothing and keeps no state between calls. The caller gives the traits their meaning - `inst-traits-return`

## 4. States (CDSL)

### Domain-Model Feature — No State Machines

N/A — the query, the measure and the dimension have no lifecycle of their own. The trait helper keeps no state.

## 5. Definitions of Done

### Closed Base Query Type

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-dod-query-vocabulary-base-query`

The system **MUST** declare the abstract, closed base query type `gts.frontx.dashboard_m.data.query.v1~` as section 6.1 states: the subset of fields, the filter operators with their number of values, one `timeDimensions` entry with the time forms of section 6.2, `order` as ordered pairs, `limit`, `offset` and `total`, and `timezone` for the sent query. The system **MUST** document the rules of section 6.1 (filters before and after aggregation, the default order, the empty order, the complete result without `limit`, the time zone rule) and the query members and canonical member order of section 6.3.

**Implements**:
- `cpt-frontx-dashboard-algo-query-vocabulary-validate-query`
- `cpt-frontx-dashboard-algo-query-vocabulary-canonical-order`

**Constraints**: `cpt-frontx-dashboard-constraint-gts-id-convention`

**Touches**:
- Entities: Query

### Measure and Dimension Bases

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-dod-query-vocabulary-members`

The system **MUST** declare the measure base `gts.frontx.dashboard_m.data.measure.v1~` and the dimension base `gts.frontx.dashboard_m.data.dimension.v1~` with the instance fields of section 6.4, so that a product delivers its measures and dimensions as well-known instances. The measure base carries no aggregation. The product's binding declares, per measure, whether it can be re-aggregated from grouped values. The meaning and vocabulary of that declaration are the product's, and the template gives the binding no other meaning.

**Implements**:
- `cpt-frontx-dashboard-flow-query-vocabulary-describe-dataset`

**Touches**:
- Entities: Measure, dimension

### Query Family and Dataset Derivation

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-dod-query-vocabulary-derivation`

The system **MUST** support query families and datasets as section 6.5 states: a query family declares the shape of the binding, a dataset narrows members with enums at the five narrowing positions and carries binding values, including the per-measure re-aggregation declaration of the product, in `x-gts-traits`, and a dataset only narrows. The system **MUST** document these rules, and the versioning of entries with different content, as a topic of the consumer guide.

**Implements**:
- `cpt-frontx-dashboard-flow-query-vocabulary-describe-dataset`
- `cpt-frontx-dashboard-algo-query-vocabulary-check-derivation`

**Touches**:
- Entities: Query family, Dataset

### Identifier Rules

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-dod-query-vocabulary-identifiers`

The system **MUST** apply the identifier rules of section 6.6: literal base operands, `x-gts-type-ref` or `x-gts-instance-ref` by kind, a combined anonymous id for the embedded query, and arrays of objects or ordered pairs instead of id-keyed maps.

**Implements**:
- `cpt-frontx-dashboard-flow-query-vocabulary-describe-dataset`

**Constraints**: `cpt-frontx-dashboard-constraint-gts-id-convention`

**Touches**:
- Entities: Query, Measure, dimension

### Trait Helper Contract

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-dod-query-vocabulary-trait-helper`

The system **MUST** provide `cpt-frontx-dashboard-component-trait-helper` as template code in the `dashboard` package, with the contract of section 6.7, which specifies `cpt-frontx-dashboard-interface-trait-helper`. Each owner runtime has its own trait helper, bound to its registry access. The dashboards root and the larger-view modal use it for widget types. The data adapter may use it on dataset types. Its signature stays stable, because product data adapter code calls it.

**Implements**:
- `cpt-frontx-dashboard-algo-query-vocabulary-effective-traits`

**Touches**:
- Entities: Widget type, Dataset

## 6. Domain Model

### 6.1 Base Query Type

**GTS ID**: `gts.frontx.dashboard_m.data.query.v1~`

The type is abstract (`x-gts-abstract`) and closed (`unevaluatedProperties: false`), so a misspelled field or a field outside the subset fails validation. A dataset only narrows existing properties, so the closed base stays compatible with derivation. Every field keeps the meaning that `cpt-frontx-dashboard-adr-query-vocabulary-and-datasets` gives it. The one deviation from that format is that members are GTS instance ids.

| Field | Required | Content |
|-------|----------|---------|
| `id` | yes | The combined query id. A string with `x-gts-instance-ref` and the literal base operand `gts.frontx.dashboard_m.data.query.v1~`. It is template-only, and the data adapter drops it |
| `measures` | one of the two | Array of measure instance ids (`x-gts-instance-ref` to the measure base). At least one item, no duplicates |
| `dimensions` | one of the two | Array of dimension instance ids (`x-gts-instance-ref` to the dimension base). At least one item, no duplicates. It never lists the time dimension |
| `timeDimensions` | no | Array with exactly one entry. The entry has `dimension` (required, a dimension instance id), `granularity` (optional: `day`, `week`, `month`, `quarter` or `year`), and either `dateRange` or `compareDateRange` (both optional, never together). Section 6.2 gives the time forms |
| `filters` | no | Array of filter objects, all of which must hold. A filter has `member` (a measure or dimension instance id), `operator` (one of the 20 operators below) and, for most operators, `values` (an array of strings). No duplicate entries |
| `order` | no | Array of ordered pairs `[member, direction]`. The first item is a measure or dimension instance id. The second is `asc` or `desc`. No duplicate pairs. An empty array asks for no order |
| `limit` | no | Integer, at least 1. Page size or top-N. An absent `limit` asks for the complete result |
| `offset` | no | Integer, at least 0. Rows skipped, for paging |
| `total` | no | Boolean. `true` asks for the row count that ignores `limit` and `offset` |
| `timezone` | no | String, an IANA time zone name. Declared for the sent query only. The widget's `data` forbids it, and the data widget sets it to the viewer's time zone in the query it sends |

The operators are `equals`, `notEquals`, `gt`, `gte`, `lt`, `lte`, `set`, `notSet`, `inDateRange`, `notInDateRange`, `beforeDate`, `beforeOrOnDate`, `afterDate`, `afterOrOnDate`, `contains`, `notContains`, `startsWith`, `notStartsWith`, `endsWith` and `notEndsWith`. Their meaning, including how several values combine and how null values are treated, is the one of `cpt-frontx-dashboard-adr-query-vocabulary-and-datasets`. Local execution by the data adapter follows the rules of `cpt-frontx-dashboard-feature-data-adapter-contract` (section 6.3), which fill what those semantics leave open.

**Rules**:

- **Members.** A query has at least one of `measures` and `dimensions` (`anyOf` on the two). The time dimension is listed once, in `timeDimensions[0].dimension`, and never in `dimensions`.
- **Operator arity.** The base schema checks the number of values for each operator. `set` and `notSet` take no `values`. `inDateRange` and `notInDateRange` take one or two. `beforeDate`, `beforeOrOnDate`, `afterDate` and `afterOrOnDate` take exactly one. Every other operator takes one or more. Values are strings, also for numbers and dates.
- **Member-kind fit.** Whether an operator fits its member's kind cannot be written in JSON Schema. The domain owner cross-checks it against the member instance at load (`cpt-frontx-dashboard-feature-widget-catalog`). The `contains`, `startsWith` and `endsWith` operators and their negations apply only to string dimensions. `gt`, `gte`, `lt` and `lte` apply only to measures and number dimensions. The six date operators apply only to time dimensions.
- **Before and after aggregation.** A filter on a dimension applies to rows before aggregation. A filter on a measure applies to the aggregated values, after aggregation. Two filters on the same member both hold, so `gte` and `lte` together bound a range.
- **Filter values.** The owner cross-checks the content of `values` at load (`cpt-frontx-dashboard-algo-widget-catalog-cross-check-widget`). The values of `gt`, `gte`, `lt` and `lte` must be numbers written as strings. The values of the six date operators must be dates or date-times in the `dateRange` form (a date-time has seconds), or one of the allowed relative strings. `inDateRange` and `notInDateRange` with one value mean either exactly that timestamp or one relative string; with two values they mean a range, both ends included. The values and `timezone` are data that the data adapter receives, and are never interpreted as query text.
- **Order.** Each `order` item is a pair, checked with `prefixItems`. The first item of each pair must be a result column: a member named in `measures` or `dimensions`, or the time dimension with a `granularity`. The domain owner cross-checks this at load (`cpt-frontx-dashboard-feature-widget-catalog`). Whether GTS checks the instance reference inside `prefixItems` is an open question of `cpt-frontx-dashboard-adr-shared-data-types-and-schemas`. The dataset enum on the first item and the owner cross-check enforce membership either way.
- **Default order.** When `order` is absent, the default order applies: the time dimension ascending when it has a `granularity`, else the first measure descending, else the first dimension ascending. An empty `order` asks for no order.
- **Complete result.** `limit` and `offset` slice the result. A query without `limit` asks for the complete result. The data adapter applies no cap of its own and reads past any row limit of its backend (`cpt-frontx-dashboard-feature-data-adapter-contract`). Which widget types require `limit` or `total`, or forbid `total`, is set by `cpt-frontx-dashboard-feature-widget-catalog`.
- **Time zone.** An authored query has no `timezone`, because the widget's `data` forbids it (`cpt-frontx-dashboard-feature-widget-catalog`). The data widget sets `timezone` to the viewer's time zone in the query it sends with `request_data`. Dates in `dateRange`, relative strings and granularity buckets resolve in that time zone. The data adapter passes the field through to a backend that understands it.
- **Scope of the query.** The query only chooses, groups, filters, orders and slices. Logic such as ratios, running totals and "other" buckets belongs to the product's measure definitions.

**Schema**:

```json
{
  "$id": "gts://gts.frontx.dashboard_m.data.query.v1~",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "Query",
  "description": "Abstract, closed base of every query. A query family and a dataset narrow it.",
  "type": "object",
  "x-gts-abstract": true,
  "required": ["id"],
  "anyOf": [
    { "required": ["measures"] },
    { "required": ["dimensions"] }
  ],
  "properties": {
    "id": {
      "type": "string",
      "x-gts-instance-ref": "gts.frontx.dashboard_m.data.query.v1~",
      "description": "Combined anonymous instance id: the dataset type chain followed by a UUID."
    },
    "measures": {
      "type": "array",
      "minItems": 1,
      "uniqueItems": true,
      "items": { "type": "string", "x-gts-instance-ref": "gts.frontx.dashboard_m.data.measure.v1~" }
    },
    "dimensions": {
      "type": "array",
      "minItems": 1,
      "uniqueItems": true,
      "items": { "type": "string", "x-gts-instance-ref": "gts.frontx.dashboard_m.data.dimension.v1~" }
    },
    "timeDimensions": {
      "type": "array",
      "minItems": 1,
      "maxItems": 1,
      "items": {
        "type": "object",
        "required": ["dimension"],
        "properties": {
          "dimension": { "type": "string", "x-gts-instance-ref": "gts.frontx.dashboard_m.data.dimension.v1~" },
          "granularity": { "enum": ["day", "week", "month", "quarter", "year"] },
          "dateRange": {
            "oneOf": [
              {
                "type": "array",
                "minItems": 2,
                "maxItems": 2,
                "items": { "type": "string", "pattern": "^[0-9]{4}-[0-9]{2}-[0-9]{2}(T[0-9]{2}:[0-9]{2}:[0-9]{2}([.][0-9]+)?)?$" }
              },
              {
                "type": "string",
                "pattern": "^(today|yesterday|(this|last) (week|month|quarter|year)|last [1-9][0-9]* (days|weeks|months)|from [1-9][0-9]* (days|weeks|months) ago to now)$"
              }
            ]
          },
          "compareDateRange": {
            "type": "array",
            "minItems": 2,
            "maxItems": 2,
            "items": {
              "oneOf": [
                {
                  "type": "array",
                  "minItems": 2,
                  "maxItems": 2,
                  "items": { "type": "string", "pattern": "^[0-9]{4}-[0-9]{2}-[0-9]{2}(T[0-9]{2}:[0-9]{2}:[0-9]{2}([.][0-9]+)?)?$" }
                },
                {
                  "type": "string",
                  "pattern": "^(today|yesterday|(this|last) (week|month|quarter|year)|last [1-9][0-9]* (days|weeks|months)|from [1-9][0-9]* (days|weeks|months) ago to now)$"
                }
              ]
            }
          }
        },
        "not": { "required": ["dateRange", "compareDateRange"] },
        "additionalProperties": false
      }
    },
    "filters": {
      "type": "array",
      "uniqueItems": true,
      "items": {
        "type": "object",
        "required": ["member", "operator"],
        "properties": {
          "member": {
            "anyOf": [
              { "type": "string", "x-gts-instance-ref": "gts.frontx.dashboard_m.data.measure.v1~" },
              { "type": "string", "x-gts-instance-ref": "gts.frontx.dashboard_m.data.dimension.v1~" }
            ]
          },
          "operator": {
            "enum": [
              "equals", "notEquals", "gt", "gte", "lt", "lte", "set", "notSet",
              "inDateRange", "notInDateRange", "beforeDate", "beforeOrOnDate", "afterDate", "afterOrOnDate",
              "contains", "notContains", "startsWith", "notStartsWith", "endsWith", "notEndsWith"
            ]
          },
          "values": {
            "type": "array",
            "minItems": 1,
            "items": { "type": "string" }
          }
        },
        "allOf": [
          {
            "if": { "required": ["operator"], "properties": { "operator": { "enum": ["set", "notSet"] } } },
            "then": { "not": { "required": ["values"] } },
            "else": { "required": ["values"] }
          },
          {
            "if": { "required": ["operator"], "properties": { "operator": { "enum": ["inDateRange", "notInDateRange"] } } },
            "then": { "properties": { "values": { "maxItems": 2 } } }
          },
          {
            "if": { "required": ["operator"], "properties": { "operator": { "enum": ["beforeDate", "beforeOrOnDate", "afterDate", "afterOrOnDate"] } } },
            "then": { "properties": { "values": { "maxItems": 1 } } }
          }
        ],
        "additionalProperties": false
      }
    },
    "order": {
      "type": "array",
      "uniqueItems": true,
      "items": {
        "type": "array",
        "minItems": 2,
        "maxItems": 2,
        "prefixItems": [
          {
            "anyOf": [
              { "type": "string", "x-gts-instance-ref": "gts.frontx.dashboard_m.data.measure.v1~" },
              { "type": "string", "x-gts-instance-ref": "gts.frontx.dashboard_m.data.dimension.v1~" }
            ]
          },
          { "enum": ["asc", "desc"] }
        ],
        "items": false
      }
    },
    "limit": { "type": "integer", "minimum": 1 },
    "offset": { "type": "integer", "minimum": 0 },
    "total": { "type": "boolean" },
    "timezone": {
      "type": "string",
      "minLength": 1,
      "description": "IANA time zone name. Set by the data widget in the sent query. A widget's data field forbids it."
    }
  },
  "unevaluatedProperties": false
}
```

### 6.2 Time Forms

The single `timeDimensions` entry names the time dimension in `dimension`. Its other fields are optional.

- **Granularity.** `granularity` is one of `day`, `week`, `month`, `quarter` and `year`. Weeks start on Monday. With a `granularity`, the entry groups by the time dimension, and the time dimension gives a result column. Without one, the entry limits the period and does not group.
- **Date range.** `dateRange` is either a pair `[start, end]` or one relative string.
- **Compared ranges.** `compareDateRange` holds exactly 2 ranges, each in a `dateRange` form. It excludes `dateRange`. The previous period is written out, for example `["this month", "last month"]`. Which widget types allow it is set by `cpt-frontx-dashboard-feature-widget-catalog`.

All dates resolve in the `timezone` of the sent query (section 6.1). The patterns use only the GTS safe regular-expression profile.

| Form | Rule | Example |
|------|------|---------|
| Pair | Two strings, `[start, end]`. Each end is a date (`YYYY-MM-DD`) or a date-time without offset, with seconds and an optional fraction (`YYYY-MM-DDThh:mm:ss` or `YYYY-MM-DDThh:mm:ss.fff`). Both ends are included. A date-only end covers its whole day. A pattern cannot compare the two ends or check calendar validity, so the domain owner's cross-check at load rejects a `dateRange` or `compareDateRange` pair whose start is after its end, or whose date or time is not a real calendar value (`cpt-frontx-dashboard-algo-widget-catalog-cross-check-widget`). The widget shows the cannot-show state | `["2026-01-01", "2026-03-31"]` |
| Relative string | One string from a closed set: `today`, `yesterday`, `this` or `last` followed by `week`, `month`, `quarter` or `year`, `last N days`, `last N weeks`, `last N months`, and `from N days ago to now`, `from N weeks ago to now`, `from N months ago to now`. N is a positive whole number. Each string resolves as `cpt-frontx-dashboard-adr-query-vocabulary-and-datasets` defines it. A `last N` string does not include the current date. A `from N … ago to now` string does | `last 30 days`, `this quarter` |

The literal patterns of the base type:

- Each end of a pair: `^[0-9]{4}-[0-9]{2}-[0-9]{2}(T[0-9]{2}:[0-9]{2}:[0-9]{2}([.][0-9]+)?)?$`
- Relative string: `^(today|yesterday|(this|last) (week|month|quarter|year)|last [1-9][0-9]* (days|weeks|months)|from [1-9][0-9]* (days|weeks|months) ago to now)$`

A `this` string is the whole current calendar unit. A `last` string followed by a unit is the whole previous unit. Worked example, on Friday 2026-10-30 in the sent time zone: `this month` covers 2026-10-01 to 2026-10-31, `last month` covers 2026-09-01 to 2026-09-30, and `this week` covers Monday 2026-10-26 to Sunday 2026-11-01. With `compareDateRange: ["this month", "last month"]`, the measures are computed for October 2026 and for September 2026.

### 6.3 Query Members and Canonical Member Order

A **query member** is any measure or dimension instance that a query names: in `measures`, in `dimensions`, as `timeDimensions[0].dimension`, as a `filters[].member`, and as the first item of each `order` pair. The owner's registered-instance check covers every query member, and the operator-kind check covers every query member used in a filter (`cpt-frontx-dashboard-feature-widget-catalog`).

The **canonical member order** is a separate notion. It orders the result columns, not all query members: the dimensions in query order, then the time dimension when it has a `granularity`, then the measures in query order. A time dimension without a `granularity` is a query member but gives no column. With a `granularity`, the time dimension gives a result column, so it can appear in `order` and in grid columns. A filter member that is not in `measures` or `dimensions` gives no column. Positional rows of data shapes and the owner cross-checks use this order. `cpt-frontx-dashboard-algo-query-vocabulary-canonical-order` derives it.

### 6.4 Measure and Dimension Bases

| Base | GTS ID | Instance fields |
|------|--------|-----------------|
| Measure | `gts.frontx.dashboard_m.data.measure.v1~` | `id` (required), `title` (required), `value_type` (required: `number`, `percent` or `duration`), `unit` (optional, required when `value_type` is `duration`) |
| Dimension | `gts.frontx.dashboard_m.data.dimension.v1~` | `id` (required), `title` (required), `value_type` (required: `string`, `time` or `number`) |

Each base is a type whose `id` field uses its own literal base operand. The `value_type` sets are closed as a template decision: the template renders only these value types, and a new one is a change of the template. A `percent` measure is a ratio in which 1 means 100%. A `duration` measure names its `unit`. A product delivers its measures and dimensions as GTS well-known instances, for example `gts.frontx.dashboard_m.data.measure.v1~acme.example.metrics.loc.v1`. Ids are unique across products, and a dimension can be shared by several datasets. The metadata gives a widget default titles and formats. A measure states no aggregation. The product's binding declares, per measure, whether it can be re-aggregated from grouped values (section 6.5).

**Measure schema**:

```json
{
  "$id": "gts://gts.frontx.dashboard_m.data.measure.v1~",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "Measure",
  "type": "object",
  "x-gts-abstract": true,
  "required": [
    "id",
    "title",
    "value_type"
  ],
  "properties": {
    "id": {
      "type": "string",
      "x-gts-instance-ref": "gts.frontx.dashboard_m.data.measure.v1~"
    },
    "title": {
      "type": "string",
      "minLength": 1
    },
    "value_type": {
      "enum": [
        "number",
        "percent",
        "duration"
      ]
    },
    "unit": {
      "type": "string",
      "minLength": 1
    }
  },
  "unevaluatedProperties": false,
  "allOf": [
    {
      "if": {
        "properties": {
          "value_type": {
            "const": "duration"
          }
        },
        "required": [
          "value_type"
        ]
      },
      "then": {
        "required": [
          "unit"
        ]
      }
    }
  ]
}
```

**Dimension schema**:

```json
{
  "$id": "gts://gts.frontx.dashboard_m.data.dimension.v1~",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "Dimension",
  "type": "object",
  "x-gts-abstract": true,
  "required": [
    "id",
    "title",
    "value_type"
  ],
  "properties": {
    "id": {
      "type": "string",
      "x-gts-instance-ref": "gts.frontx.dashboard_m.data.dimension.v1~"
    },
    "title": {
      "type": "string",
      "minLength": 1
    },
    "value_type": {
      "enum": [
        "string",
        "time",
        "number"
      ]
    }
  },
  "unevaluatedProperties": false
}
```

### 6.5 Query Families and Datasets

- **Query family.** A product type derived from the base, for example `gts.frontx.dashboard_m.data.query.v1~acme.example.data.metric_query.v1~`. It is abstract. Its `x-gts-traits-schema` declares the shape of the backend binding. The template gives the binding no meaning. The data adapter declares the query families it serves. Its served-families declaration returns the family type schemas, and the owners register them at start (`cpt-frontx-dashboard-feature-data-adapter-contract`).
- **Dataset.** A product type derived from a query family, for example `gts.frontx.dashboard_m.data.query.v1~acme.example.data.metric_query.v1~acme.example.data.activity.v1~`. It narrows the members with enums at five narrowing positions: `measures.items`, `dimensions.items`, `timeDimensions.items.properties.dimension`, `filters.items.properties.member` and `order.items.prefixItems[0]`. It carries the binding values in `x-gts-traits`. The binding maps each member to its backend name and declares, per measure, whether it can be re-aggregated from grouped values, so the data adapter knows which measures it may combine when it executes a query locally. The meaning and vocabulary of that declaration are the product's, and the template gives the binding no other meaning. The declaration belongs to the binding, not to the measure base. One dataset serves every combination of its members. Datasets only narrow, never widen. The time dimension is in the enum at `timeDimensions.items.properties.dimension` and never in the enum at `dimensions.items`.
- **Query instance.** The query in a widget is an embedded anonymous GTS instance. Its `id` is the dataset type chain followed by a UUID that the author or the generator creates. The query's type is never stored apart from its id. Identical queries, ignoring their UUIDs and with the same `timezone`, give identical backend requests.
- **Versioning.** The registration rule (first registration of an id stays, template types cannot be replaced) is owned by `cpt-frontx-dashboard-algo-dashboard-root-types-register-delivery` (`inst-template-types-first`, `inst-new-version-id`). For the consumer: a dataset, measure or dimension with different content gets a different version id.

**Example** (the `acme.example` vendor is illustrative). The query family declares a binding with a source name and a list of columns. Each column maps a member to a backend column, and a measure column carries the product's re-aggregation declaration. The trait schema below is illustrative:

```json
{
  "$id": "gts://gts.frontx.dashboard_m.data.query.v1~acme.example.data.metric_query.v1~",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "x-gts-abstract": true,
  "x-gts-traits-schema": {
    "type": "object",
    "required": ["source", "columns"],
    "properties": {
      "source": { "type": "string" },
      "columns": {
        "type": "array",
        "items": {
          "type": "object",
          "required": ["member", "column"],
          "properties": {
            "member": {
              "anyOf": [
                { "type": "string", "x-gts-instance-ref": "gts.frontx.dashboard_m.data.measure.v1~" },
                { "type": "string", "x-gts-instance-ref": "gts.frontx.dashboard_m.data.dimension.v1~" }
              ]
            },
            "column": { "type": "string" },
            "aggregation": { "enum": ["sum", "count", "min", "max", "avg"] }
          }
        }
      }
    }
  },
  "allOf": [{ "$ref": "gts://gts.frontx.dashboard_m.data.query.v1~" }]
}
```

The dataset narrows the members at the five narrowing positions and carries the binding values:

```json
{
  "$id": "gts://gts.frontx.dashboard_m.data.query.v1~acme.example.data.metric_query.v1~acme.example.data.activity.v1~",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "x-gts-traits": {
    "source": "activity",
    "columns": [
      { "member": "gts.frontx.dashboard_m.data.measure.v1~acme.example.metrics.loc.v1", "column": "lines_added", "aggregation": "sum" },
      { "member": "gts.frontx.dashboard_m.data.measure.v1~acme.example.metrics.pr_count.v1", "column": "prs", "aggregation": "count" },
      { "member": "gts.frontx.dashboard_m.data.dimension.v1~acme.example.metrics.author.v1", "column": "author" },
      { "member": "gts.frontx.dashboard_m.data.dimension.v1~acme.example.metrics.project.v1", "column": "project" },
      { "member": "gts.frontx.dashboard_m.data.dimension.v1~acme.example.metrics.day.v1", "column": "date" }
    ]
  },
  "allOf": [
    { "$ref": "gts://gts.frontx.dashboard_m.data.query.v1~acme.example.data.metric_query.v1~" },
    {
      "properties": {
        "measures": { "items": { "enum": [
          "gts.frontx.dashboard_m.data.measure.v1~acme.example.metrics.loc.v1",
          "gts.frontx.dashboard_m.data.measure.v1~acme.example.metrics.pr_count.v1"
        ] } },
        "dimensions": { "items": { "enum": [
          "gts.frontx.dashboard_m.data.dimension.v1~acme.example.metrics.author.v1",
          "gts.frontx.dashboard_m.data.dimension.v1~acme.example.metrics.project.v1"
        ] } },
        "timeDimensions": { "items": { "properties": { "dimension": { "enum": [
          "gts.frontx.dashboard_m.data.dimension.v1~acme.example.metrics.day.v1"
        ] } } } },
        "filters": { "items": { "properties": { "member": { "enum": [
          "gts.frontx.dashboard_m.data.measure.v1~acme.example.metrics.loc.v1",
          "gts.frontx.dashboard_m.data.dimension.v1~acme.example.metrics.author.v1",
          "gts.frontx.dashboard_m.data.dimension.v1~acme.example.metrics.project.v1",
          "gts.frontx.dashboard_m.data.dimension.v1~acme.example.metrics.day.v1"
        ] } } } },
        "order": { "items": { "prefixItems": [ { "enum": [
          "gts.frontx.dashboard_m.data.measure.v1~acme.example.metrics.loc.v1",
          "gts.frontx.dashboard_m.data.measure.v1~acme.example.metrics.pr_count.v1",
          "gts.frontx.dashboard_m.data.dimension.v1~acme.example.metrics.author.v1",
          "gts.frontx.dashboard_m.data.dimension.v1~acme.example.metrics.project.v1",
          "gts.frontx.dashboard_m.data.dimension.v1~acme.example.metrics.day.v1"
        ] } ] } }
      }
    }
  ]
}
```

A query against this dataset, as a widget embeds it in `data`. Its canonical member order is the author, the day and the lines of code:

```json
{
  "id": "gts.frontx.dashboard_m.data.query.v1~acme.example.data.metric_query.v1~acme.example.data.activity.v1~b81d4c07-2e6a-4f39-9c15-7a0e3d5f8b42",
  "measures": ["gts.frontx.dashboard_m.data.measure.v1~acme.example.metrics.loc.v1"],
  "dimensions": ["gts.frontx.dashboard_m.data.dimension.v1~acme.example.metrics.author.v1"],
  "timeDimensions": [
    { "dimension": "gts.frontx.dashboard_m.data.dimension.v1~acme.example.metrics.day.v1", "granularity": "week", "dateRange": "last 3 months" }
  ],
  "filters": [
    { "member": "gts.frontx.dashboard_m.data.dimension.v1~acme.example.metrics.project.v1", "operator": "equals", "values": ["web", "mobile"] }
  ],
  "order": [["gts.frontx.dashboard_m.data.measure.v1~acme.example.metrics.loc.v1", "desc"]],
  "limit": 10
}
```

### 6.6 Identifier Rules

- An id field of a type that is embedded in other instances uses a literal base operand in `x-gts-instance-ref`, never the self-reference operand, because that operand resolves to the top-level type that is validated.
- A field that holds a type id uses `x-gts-type-ref`. A field that holds an instance id uses `x-gts-instance-ref`. A field that may hold either kind uses `anyOf` over the two.
- No GTS id is an object key where it must be validated. Collections keyed by ids are arrays of objects (for example the `columns` of a dataset binding, with `member` and a backend column) or ordered pairs (the query `order`, whose first item is the id). Grid rows are positional arrays in canonical member order.
- The template targets GTS v0.17 and the realm-shared type store, as `cpt-frontx-dashboard-adr-shared-data-types-and-schemas` decides.

### 6.7 Trait Helper Contract

This section is the exact contract of `cpt-frontx-dashboard-interface-trait-helper`, which this feature owns. `cpt-frontx-dashboard-component-trait-helper` realizes it.

| Input | Output | Failure |
|-------|--------|---------|
| A type id, without a UUID | The effective traits of the type: the `x-gts-traits` of the schemas along its `$id` chain, merged with RFC 7396 from the base to the type, so a later type overrides an earlier one | A schema along the chain cannot be found: a failure, never a partial result |

- **Registry access.** The helper gets the schemas with `getSchema` of the registry access it is bound to. That is the registry access of one owner runtime: the dashboards root's or the larger-view modal's. Each owner runtime has its own trait helper. There is no global singleton, because FrontX isolates each MFE instance. The data adapter interface hands the data adapter that registry access, or a trait helper bound to it (`cpt-frontx-dashboard-interface-data-adapter`).
- **No side effects.** The helper registers nothing, validates nothing and keeps no state between calls. The same input gives the same result. It gives traits no meaning; its callers interpret them.
- **Callers.** The dashboards root and the larger-view modal use it for widget types only, to read `data_shape`, `fill` and `member_kinds`. The data adapter may use it on dataset types, to read the binding.
- **Stable signature.** Product data adapter code calls the helper, so its signature is stable. It has the stability class of the data adapter interface (DESIGN, API Stability Classification; `cpt-frontx-dashboard-adr-template-packages-and-host-contract`).

## 7. Acceptance Criteria

- [ ] A query with a misspelled field fails validation, and its widget shows the cannot-show state in its own cell.
- [ ] A query with a field outside the subset, such as `segments` or `ungrouped`, fails validation.
- [ ] A query that names a member outside the dataset's enum at any of the five narrowing positions fails validation: in `measures`, in `dimensions`, as `timeDimensions[0].dimension`, as a `filters[].member`, or as the first item of an `order` pair.
- [ ] A query with neither `measures` nor `dimensions` fails validation, and so does an empty `measures` or `dimensions` array or one with a duplicate item.
- [ ] A query whose `data.id` names no registered dataset type, or whose chain does not start at the base query, fails validation, and its widget shows the cannot-show state.
- [ ] A query that lists a dimension id in `measures` fails validation, because the item must be a measure instance id.
- [ ] A query with two `timeDimensions` entries, an empty `timeDimensions` array, or an entry without `dimension` fails validation.
- [ ] A `granularity` of `hour` fails validation. `day`, `week`, `month`, `quarter` and `year` pass. A `week` bucket starts on Monday.
- [ ] A `dateRange` of `["2026-01-01", "2026-03-31"]` or `["2026-10-01T08:00:00", "2026-10-01T17:30:00.250"]` passes. A pair with an offset, such as `["2026-01-01T00:00:00Z", "2026-01-31"]`, fails validation, and so does a date-time without seconds, such as `["2026-10-01T08:00", "2026-10-01T17:30:00"]`, and so does a pair of 1 or 3 items. The pair `["2026-01-01", "2026-03-31"]` includes the whole of 31 March 2026 in the sent time zone.
- [ ] The relative strings `today`, `yesterday`, `this week`, `last quarter`, `last 30 days`, `last 6 months` and `from 7 days ago to now` pass. `next week`, `last 6 hours`, `last 0 days` and `from 7 days ago` fail validation. `last 6 months` does not include the current date, and `from 7 days ago to now` does.
- [ ] On Friday 2026-10-30, `this month` covers October 2026, `last month` covers September 2026, and `this week` covers Monday 2026-10-26 to Sunday 2026-11-01.
- [ ] A `compareDateRange` of `["this month", "last month"]` with no `dateRange` passes, and the measures are computed for October 2026 and September 2026 on 2026-10-30. A `compareDateRange` of 1 or 3 ranges fails validation, and so does one next to a `dateRange`.
- [ ] A `dateRange` or `compareDateRange` pair whose start is after its end, such as `["2026-03-31", "2026-01-01"]`, or whose date or time is not a real calendar value, such as `["2026-02-30", "2026-03-01"]` or `["2026-01-01T25:00:00", "2026-01-02"]`, passes GTS validation and fails the owner cross-check (`cpt-frontx-dashboard-algo-widget-catalog-cross-check-widget`), so the widget shows the cannot-show state.
- [ ] A `set` filter with `values` fails validation, and a `notSet` filter without `values` passes. An `equals` filter without `values` fails validation, and one with two values passes. An `inDateRange` filter with 3 values fails validation, and one with 1 or 2 values passes. A `beforeDate` filter with 2 values fails validation. A number in `values` fails validation. An operator outside the list, such as `measureFilter` or `onTheDate`, fails validation. A filter list with an exact duplicate entry fails validation.
- [ ] A filter with `contains` on a measure, `gt` on a string dimension, or `inDateRange` on a member that is not a time dimension passes GTS validation and fails the owner cross-check of `cpt-frontx-dashboard-feature-widget-catalog`, so the widget shows the cannot-show state.
- [ ] A filter with `gt`, `gte`, `lt` or `lte` whose value is not a number written as a string, such as `"many"`, passes GTS validation and fails the owner cross-check.
- [ ] An `inDateRange` or `notInDateRange` filter with one value passes when the value is one timestamp or one allowed relative string, and with two values it is a range with both ends included. A filter with a date operator whose value is not a date, a date-time with seconds in the `dateRange` form or an allowed relative string, such as `"next week"`, passes GTS validation and fails the owner cross-check.
- [ ] Filter `values` and `timezone` reach the data adapter as data and are never interpreted as query text. `timezone` is an IANA time zone name.
- [ ] A filter on a dimension removes rows before aggregation. A filter on a measure removes groups by their aggregated value, after aggregation.
- [ ] An `order` of one pair, the `loc` measure of the section 6.5 example with `desc`, passes. An `order` item of 3 elements, a direction other than `asc` or `desc`, or `order` as an object keyed by member fails validation. An `order` pair whose first item is in the dataset enum but is not a result column passes GTS validation and fails the owner cross-check.
- [ ] The membership of the first item of each `order` pair holds through the dataset enum at `order.items.prefixItems[0]` and the owner's cross-check, whether or not GTS checks instance references inside `prefixItems`.
- [ ] A query without `order` gets the default order: the time dimension ascending when it has a `granularity`, else the first measure descending, else the first dimension ascending. A query with `order: []` passes and gets no order.
- [ ] A query with `limit: 0` or `offset: -1` fails validation. A query without `limit` passes and asks for the complete result, with no cap set by the template or the data adapter.
- [ ] A query with `total: "yes"` fails validation. `total: true` asks for the row count that ignores `limit` and `offset`.
- [ ] The base query type accepts `timezone` in a sent query. A widget whose authored `data` carries `timezone` fails the validation of its widget type (`cpt-frontx-dashboard-feature-widget-catalog`). The sent query carries the viewer's time zone, and its dates resolve in that time zone.
- [ ] For a query with dimensions `author`, `project`, time granularity `day` and measures `loc`, `pr_count`, the canonical member order is `author`, `project`, the time dimension, `loc`, `pr_count`. Without `granularity` the time dimension is absent from the list but is still a query member. A filter member that is not in `measures` or `dimensions` is a query member and gives no column.
- [ ] A dataset that lists a measure outside its parent's allowed values is rejected as a derivation.
- [ ] A dataset that is `x-gts-abstract`, or whose `id` chain does not name the base, the query family and the dataset, is rejected as a derivation.
- [ ] A dataset that lists its time dimension in the enum at `dimensions.items` is rejected. The template-run check over the sample datasets verifies this rule, the abstract flag, the `$id` chain and that enums only narrow. Schema review covers the rest, and every rejection names the failed rule.
- [ ] A dataset that widens a property of its parent or opens a closed one is rejected as a derivation. GTS registration rejects a widened enum and a traits mismatch, and schema review catches the other cases.
- [ ] A dataset whose `x-gts-traits` do not satisfy the `x-gts-traits-schema` of its query family is rejected.
- [ ] The product's binding declares, per measure, whether it can be re-aggregated from grouped values, and the template gives the binding no other meaning. The measure base has no aggregation field, and a measure instance with one fails validation.
- [ ] A new dataset with new measures is added as data only, and the data adapter needs no change.
- [ ] The consumer guide requires a different version id for different content of a dataset, measure or dimension; the first-registration rule is `cpt-frontx-dashboard-algo-dashboard-root-types-register-delivery`.
- [ ] The `id` fields of the base query, the measure base and the dimension base use literal base operands, and none uses the self-reference operand.
- [ ] No schema of this feature uses a GTS id as an object key.
- [ ] A measure with `value_type: duration` and no `unit` fails validation. A `value_type` outside the closed set fails validation. A `percent` value of 0.25 means 25%.
- [ ] A query family served by the data adapter is delivered as a type schema by the served-families declaration, and the owners register it at start.
- [ ] The trait helper returns the merged `x-gts-traits` along the `$id` chain, with a later type overriding an earlier one, and a second call with the same input gives the same result.
- [ ] The trait helper splits a type id into the prefixes that end at each `~`, from the base to the type. A type without `x-gts-traits` contributes nothing. An input that ends with a UUID is rejected.
- [ ] Given a type id with a schema along its chain that `getSchema` cannot return, the trait helper returns a failure and no partial result.
- [ ] The dashboards root and the larger-view modal each have their own trait helper, bound to their own registry access. The data adapter reads a dataset's binding through the trait helper or the registry access of the owner runtime that called it.
- [ ] The consumer guide has a topic on the query subset, query families, datasets and vocabulary.
