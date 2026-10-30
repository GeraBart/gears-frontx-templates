---
status: accepted
version: 1
date: 2026-10-30
description: Closed base query type with its fields, range forms, compare and canonical member order; measure and dimension bases; derivation of query families and datasets with enums and binding traits; identifier rules; contract of the trait helper.
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
  - [6.2 Range Forms](#62-range-forms)
  - [6.3 Canonical Member Order](#63-canonical-member-order)
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

This feature declares the vocabulary in which a data widget states what data it wants. It has the closed base query type, the measure and dimension bases, the rules that derive a query family and a dataset from the base, the rules for identifier fields, and the contract of the trait helper. It is mostly a domain-model feature. One actor flow, three algorithms and a Domain Model section carry the details.

### 1.2 Purpose

A data widget embeds one query in its `data` field. Standard GTS validation must catch an unknown member, a member the dataset does not offer, a misspelled field or a malformed range when the dashboard loads. The data adapter must be able to turn any valid query into backend calls without knowing the product. This feature gives the template-owned part of that contract: the closed base, the vocabulary, and the narrowing rules that a consuming product follows. The decision is `cpt-frontx-dashboard-adr-query-vocabulary-and-datasets`.

Not applicable: performance (PERF) has no content here beyond `limit`, which bounds the size of a result. Security (SEC) is covered by closed schema validation, which rejects unknown fields. User experience (UX), operations (OPS) and compliance (COMPL) have no content in a vocabulary of types.

**Declaring package**: `dashboard`, model package `dashboard_m` (the base query type, the measure base and the dimension base). The trait helper is template code in the `dashboard` package.

**Requirements**: `cpt-frontx-dashboard-fr-domain-model`, `cpt-frontx-dashboard-fr-backend-source`, `cpt-frontx-dashboard-fr-data-adapter`, `cpt-frontx-dashboard-fr-grid-sort-page`, `cpt-frontx-dashboard-nfr-consumer-docs`

**Principles**: `cpt-frontx-dashboard-principle-gts-contracts`

**Constraints**: `cpt-frontx-dashboard-constraint-gts-id-convention`

**Use cases**: `cpt-frontx-dashboard-usecase-provide-dashboard` (the types that a consuming product describes a dataset with; the other features named in DECOMPOSITION cover the remaining steps)

**Out of scope**:

- The widget types that limit the form of a query, and the cross-checks of a widget (`cpt-frontx-dashboard-feature-widget-catalog`).
- The data shapes and fill modes that read a query (`cpt-frontx-dashboard-feature-widget-data-catalog`).
- Which query families a data adapter serves (`cpt-frontx-dashboard-feature-data-adapter-contract`), and the delivery of datasets and vocabulary with a dashboard, including their registration order (`cpt-frontx-dashboard-feature-dashboard-root-types`).
- The datasets, measures and dimensions of a product, and the backend binding that a dataset carries. These belong to the consuming product.
- Dashboard-wide filters and declarative dataset specs (DESIGN section 4, Not covered).

### 1.3 Actors

| Actor | Role in Feature |
|-------|-----------------|
| `cpt-frontx-dashboard-actor-template-consumer` | Writes the query families, datasets, measures and dimensions of the product, and the queries in widgets (by hand or by generation), following this vocabulary. |

The dashboards root, the larger-view modal and the data adapter use the result at runtime. They are components, not actors of this feature.

### 1.4 References

- **PRD**: [PRD.md](../../PRD.md)
- **Design**: [DESIGN.md](../../DESIGN.md#31-domain-model) (query, query family, dataset, measure, dimension), the trait helper component, and `cpt-frontx-dashboard-interface-domain-model` (query vocabulary part)
- **ADRs**: `cpt-frontx-dashboard-adr-query-vocabulary-and-datasets` (owner), `cpt-frontx-dashboard-adr-shared-data-types-and-schemas` (GTS conventions, polymorphic validation, trait helper), `cpt-frontx-dashboard-adr-subject-agnostic-widget-catalog` (users of the canonical member order), `cpt-frontx-dashboard-adr-data-grid-library` (paging with `limit` and `offset`)
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
- A query names a member that the dataset does not offer, or has a misspelled field. Validation fails, and the widget shows the cannot-show state in its own cell.
- A dataset widens a property of its parent. The dataset is rejected as a derivation.

**Steps**:
1. [ ] - `p1` - Write the measures and dimensions of the product as well-known instances of the measure base and the dimension base, with `id`, `title` and `value_type` - `inst-write-vocabulary`
2. [ ] - `p1` - Write a query family type derived from the base query type, with `x-gts-traits-schema` that states the shape of the backend binding - `inst-write-family`
3. [ ] - `p1` - Write a dataset type derived from the query family, with the members it supports as enums and the binding values in `x-gts-traits` - `inst-write-dataset`
4. [ ] - `p1` - Check the dataset with `cpt-frontx-dashboard-algo-query-vocabulary-check-derivation` - `inst-check-derivation`
5. [ ] - `p1` - **IF** the dashboard is generated - `inst-branch-generated`
   1. [ ] - `p1` - Give the generator the JSON Schema of the dataset and the product's catalog of datasets and vocabulary - `inst-give-catalog`
6. [ ] - `p1` - Write the embedded query of a widget: a combined `id`, the members, and the optional `time`, `filters`, `order`, `limit` and `offset` - `inst-write-query`
7. [ ] - `p1` - Generate a UUID for the query, and end its `id` with the UUID after the dataset type chain - `inst-generate-uuid`
8. [ ] - `p1` - Deliver the dataset and vocabulary with the dashboard, as `cpt-frontx-dashboard-feature-dashboard-root-types` specifies - `inst-deliver`
9. [ ] - `p1` - **RETURN** a query that `cpt-frontx-dashboard-algo-query-vocabulary-validate-query` accepts - `inst-return-valid`

## 3. Processes / Business Logic (CDSL)

### Validate a Query

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-algo-query-vocabulary-validate-query`

**Input**: A widget instance whose `data` is an embedded query, and the registered types.

**Output**: Valid, or a failure that gives the widget the cannot-show state.

**Steps**:
1. [ ] - `p1` - Read the dataset type chain from `data.id`: the base query, the query family and the dataset, followed by the UUID - `inst-read-chain`
2. [ ] - `p1` - Validate `data` against the dataset type that `data.id` names. This is the polymorphic validation of `cpt-frontx-dashboard-adr-shared-data-types-and-schemas` - `inst-validate-polymorphic`
3. [ ] - `p1` - **IF** the GTS validation reports a failure, **RETURN** failure; otherwise **RETURN** valid. Membership of `order[].member` in the query's own members is a cross-check of the widget owner (`cpt-frontx-dashboard-feature-widget-catalog`) - `inst-return-valid`

The template adds no validation mode of its own; the single GTS validation of step 2 is what rejects a query. Each of the following is a GTS failure: a field that the closed base does not declare; a query with neither `measures` nor `dimensions` items; a member in `measures`, `dimensions`, `time.dimension`, `filters[].member` or `order[].member` that is not in the matching enum of the dataset; a `time.range` that matches none of the three range forms; and a `time.compare` present while `time.range` is absent.

### Derive the Canonical Member Order

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-algo-query-vocabulary-canonical-order`

**Input**: A valid query.

**Output**: The ordered list of the query's members.

**Steps**:
1. [ ] - `p1` - Start with the items of `dimensions` in query order - `inst-order-dimensions`
2. [ ] - `p1` - **IF** `time.granularity` is set - `inst-order-time-branch`
   1. [ ] - `p1` - Append `time.dimension` - `inst-order-time`
3. [ ] - `p1` - Append the items of `measures` in query order - `inst-order-measures`
4. [ ] - `p1` - **RETURN** the list. Positional rows and the cross-checks use it - `inst-order-return`

### Check a Derivation

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-algo-query-vocabulary-check-derivation`

**Input**: A query family or a dataset type, and its parent type.

**Output**: Accepted, or a reason for rejection.

**Steps**:
1. [ ] - `p1` - **IF** the type is a query family - `inst-check-family-branch`
   1. [ ] - `p1` - Require `x-gts-abstract` and `x-gts-traits-schema`, and require that its `$id` chain starts with the base query type. Schema review checks this - `inst-check-family`
2. [ ] - `p1` - **IF** the type is a dataset - `inst-check-dataset-branch`
   1. [ ] - `p1` - Require that the dataset is concrete (not `x-gts-abstract`), and that its `$id` chain names the base query type, the query family and the dataset. Schema review checks this - `inst-check-concrete`
   2. [ ] - `p1` - Require that each of its enums is a subset of the allowed values of its parent, so the dataset only narrows. GTS registration enforces this - `inst-check-narrow`
   3. [ ] - `p1` - Require `x-gts-traits` that satisfy the `x-gts-traits-schema` of the query family. GTS registration enforces this - `inst-check-traits`
3. [ ] - `p1` - **IF** the type adds a property or opens a closed one - `inst-check-widen`
   1. [ ] - `p1` - **RETURN** rejection. Schema review catches this, as `cpt-frontx-dashboard-adr-query-vocabulary-and-datasets` states under Confirmation - `inst-reject-widen`
4. [ ] - `p1` - **RETURN** accepted - `inst-accept`

### Resolve Effective Traits

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-algo-query-vocabulary-effective-traits`

**Input**: A type id without a UUID.

**Output**: The effective traits of the type, as one object, or a failure.

**Steps**:
1. [ ] - `p2` - Split the type id into its `$id` chain, from the base to the type - `inst-traits-chain`
2. [ ] - `p2` - **FOR EACH** type in the chain, in order - `inst-traits-each`
   1. [ ] - `p2` - Get its schema with `getSchema`. **IF** `getSchema` cannot return the schema of an ancestor, **RETURN** failure and no partial result - `inst-traits-get`
   2. [ ] - `p2` - Merge its `x-gts-traits` into the result with RFC 7396, so a later type overrides an earlier one - `inst-traits-merge`
3. [ ] - `p2` - **RETURN** the result. The helper registers nothing, validates nothing and keeps no state between calls. The caller gives the traits their meaning - `inst-traits-return`

## 4. States (CDSL)

### Domain-Model Feature — No State Machines

N/A — the query, the measure and the dimension have no lifecycle of their own. The trait helper keeps no state.

## 5. Definitions of Done

### Closed Base Query Type

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-dod-query-vocabulary-base-query`

The system **MUST** declare the abstract, closed base query type `gts.frontx.dashboard_m.data.query.v1~` as section 6.1 states, with the range forms of section 6.2 and the canonical member order of section 6.3.

**Implements**:
- `cpt-frontx-dashboard-algo-query-vocabulary-validate-query`
- `cpt-frontx-dashboard-algo-query-vocabulary-canonical-order`

**Constraints**: `cpt-frontx-dashboard-constraint-gts-id-convention`

**Touches**:
- Entities: Query

### Measure and Dimension Bases

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-dod-query-vocabulary-members`

The system **MUST** declare the measure base `gts.frontx.dashboard_m.data.measure.v1~` and the dimension base `gts.frontx.dashboard_m.data.dimension.v1~` with the instance fields of section 6.4, so that a product delivers its measures and dimensions as well-known instances.

**Implements**:
- `cpt-frontx-dashboard-flow-query-vocabulary-describe-dataset`

**Touches**:
- Entities: Measure, dimension

### Query Family and Dataset Derivation

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-dod-query-vocabulary-derivation`

The system **MUST** support query families and datasets as section 6.5 states: a query family declares the shape of the binding, a dataset narrows members with enums and carries binding values in `x-gts-traits`, and a dataset only narrows. The system **MUST** document these rules, and the versioning of entries with different content, as a topic of the consumer guide.

**Implements**:
- `cpt-frontx-dashboard-flow-query-vocabulary-describe-dataset`
- `cpt-frontx-dashboard-algo-query-vocabulary-check-derivation`

**Touches**:
- Entities: Query family, Dataset

### Identifier Rules

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-dod-query-vocabulary-identifiers`

The system **MUST** apply the identifier rules of section 6.6: literal base operands, `x-gts-type-ref` or `x-gts-instance-ref` by kind, a combined anonymous id for the embedded query, and arrays of objects instead of id-keyed maps.

**Implements**:
- `cpt-frontx-dashboard-flow-query-vocabulary-describe-dataset`

**Constraints**: `cpt-frontx-dashboard-constraint-gts-id-convention`

**Touches**:
- Entities: Query, Measure, dimension

### Trait Helper Contract

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-dod-query-vocabulary-trait-helper`

The system **MUST** provide `cpt-frontx-dashboard-component-trait-helper` as template code in the `dashboard` package, with the contract of section 6.7. The dashboards root and the larger-view modal use it. The data adapter may use it.

**Implements**:
- `cpt-frontx-dashboard-algo-query-vocabulary-effective-traits`

**Touches**:
- Entities: Query family, Dataset

## 6. Domain Model

### 6.1 Base Query Type

**GTS ID**: `gts.frontx.dashboard_m.data.query.v1~`

The type is abstract (`x-gts-abstract`) and closed (`unevaluatedProperties: false`), so a misspelled field fails validation. A dataset only narrows existing properties, so the closed base stays compatible with derivation.

| Field | Required | Content |
|-------|----------|---------|
| `id` | yes | The combined query id. A string with `x-gts-instance-ref` and the literal base operand `gts.frontx.dashboard_m.data.query.v1~` |
| `measures` | one of the two | Array of measure instance ids (`x-gts-instance-ref` to the measure base). At least one item, no duplicates |
| `dimensions` | one of the two | Array of dimension instance ids (`x-gts-instance-ref` to the dimension base). At least one item, no duplicates. It does not repeat the time dimension |
| `time` | no | Object: `dimension` (required, a dimension instance id), `granularity` (optional, `day`, `week` or `month`), `range` (optional, section 6.2), `compare` (optional, only `previous_period`, and it needs `range` through `dependentRequired`) |
| `filters` | no | Array of objects, all three fields required: `member` (a measure or dimension instance id), `operator` (`eq`, `neq`, `in`, `gt`, `lt`, `between`) and `values` (an array of strings or numbers) |
| `order` | no | Array of objects, both fields required: `member` (a measure or dimension instance id) and `dir` (`asc` or `desc`) |
| `limit` | no | Integer, at least 1. Page size or top-N. An absent `limit` means no limit, and the data adapter may cap the result |
| `offset` | no | Integer, at least 0. Rows skipped, for paging |

A query has at least one of `measures` and `dimensions` (`anyOf` on the two). The filter grammar is the operator list above, not an expression language. The operator fixes the arity of `values`: `between` takes exactly 2 items, `in` at least 1, and `eq`, `neq`, `gt` and `lt` exactly 1. A member appears once in `filters` and once in `order`; `uniqueItems` rejects an exact duplicate entry. The time dimension is listed once in the canonical member order, so a product leaves it out of the `dimensions` enum of its datasets. The query only chooses, groups, filters, orders and slices. Logic such as ratios, running totals and "other" buckets belongs to the product's measure definitions. `time` without `granularity` limits the period and does not group. With `compare: previous_period`, the measures are computed also for the same span shifted back by one unit: for a calendar token, the previous whole calendar unit; for a relative duration or an absolute interval, the span of the same length that ends where `range` starts. The data adapter resolves calendar tokens in the user's time zone and week convention.

**Schema**:

```json
{
  "$id": "gts://gts.frontx.dashboard_m.data.query.v1~",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "Query",
  "description": "Abstract, closed base of every query. A query family and a dataset narrow it.",
  "type": "object",
  "x-gts-abstract": true,
  "required": [
    "id"
  ],
  "anyOf": [
    {
      "required": [
        "measures"
      ]
    },
    {
      "required": [
        "dimensions"
      ]
    }
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
      "items": {
        "type": "string",
        "x-gts-instance-ref": "gts.frontx.dashboard_m.data.measure.v1~"
      }
    },
    "dimensions": {
      "type": "array",
      "minItems": 1,
      "uniqueItems": true,
      "items": {
        "type": "string",
        "x-gts-instance-ref": "gts.frontx.dashboard_m.data.dimension.v1~"
      }
    },
    "time": {
      "type": "object",
      "required": [
        "dimension"
      ],
      "dependentRequired": {
        "compare": [
          "range"
        ]
      },
      "properties": {
        "dimension": {
          "type": "string",
          "x-gts-instance-ref": "gts.frontx.dashboard_m.data.dimension.v1~"
        },
        "granularity": {
          "enum": [
            "day",
            "week",
            "month"
          ]
        },
        "range": {
          "type": "string",
          "oneOf": [
            {
              "pattern": "^P(([0-9]+Y([0-9]+M)?([0-9]+W)?([0-9]+D)?|[0-9]+M([0-9]+W)?([0-9]+D)?|[0-9]+W([0-9]+D)?|[0-9]+D)(T([0-9]+H([0-9]+M)?([0-9]+S)?|[0-9]+M([0-9]+S)?|[0-9]+S))?|T([0-9]+H([0-9]+M)?([0-9]+S)?|[0-9]+M([0-9]+S)?|[0-9]+S))$"
            },
            {
              "pattern": "^[0-9]{4}-[0-9]{2}-[0-9]{2}(T[0-9]{2}:[0-9]{2}:[0-9]{2}(Z|[+-][0-9]{2}:[0-9]{2}))?/[0-9]{4}-[0-9]{2}-[0-9]{2}(T[0-9]{2}:[0-9]{2}:[0-9]{2}(Z|[+-][0-9]{2}:[0-9]{2}))?$"
            },
            {
              "enum": [
                "today",
                "yesterday",
                "this_week",
                "previous_week",
                "this_month",
                "previous_month",
                "this_quarter",
                "previous_quarter",
                "this_year",
                "previous_year"
              ]
            }
          ]
        },
        "compare": {
          "enum": [
            "previous_period"
          ]
        }
      },
      "additionalProperties": false
    },
    "filters": {
      "type": "array",
      "minItems": 1,
      "uniqueItems": true,
      "items": {
        "type": "object",
        "required": [
          "member",
          "operator",
          "values"
        ],
        "properties": {
          "member": {
            "anyOf": [
              {
                "type": "string",
                "x-gts-instance-ref": "gts.frontx.dashboard_m.data.measure.v1~"
              },
              {
                "type": "string",
                "x-gts-instance-ref": "gts.frontx.dashboard_m.data.dimension.v1~"
              }
            ]
          },
          "operator": {
            "enum": [
              "eq",
              "neq",
              "in",
              "gt",
              "lt",
              "between"
            ]
          },
          "values": {
            "type": "array",
            "items": {
              "type": [
                "string",
                "number"
              ]
            }
          }
        },
        "allOf": [
          {
            "if": {
              "properties": {
                "operator": {
                  "const": "between"
                }
              }
            },
            "then": {
              "properties": {
                "values": {
                  "minItems": 2,
                  "maxItems": 2
                }
              }
            }
          },
          {
            "if": {
              "properties": {
                "operator": {
                  "const": "in"
                }
              }
            },
            "then": {
              "properties": {
                "values": {
                  "minItems": 1
                }
              }
            }
          },
          {
            "if": {
              "properties": {
                "operator": {
                  "enum": [
                    "eq",
                    "neq",
                    "gt",
                    "lt"
                  ]
                }
              }
            },
            "then": {
              "properties": {
                "values": {
                  "minItems": 1,
                  "maxItems": 1
                }
              }
            }
          }
        ],
        "additionalProperties": false
      }
    },
    "order": {
      "type": "array",
      "minItems": 1,
      "uniqueItems": true,
      "items": {
        "type": "object",
        "required": [
          "member",
          "dir"
        ],
        "properties": {
          "member": {
            "anyOf": [
              {
                "type": "string",
                "x-gts-instance-ref": "gts.frontx.dashboard_m.data.measure.v1~"
              },
              {
                "type": "string",
                "x-gts-instance-ref": "gts.frontx.dashboard_m.data.dimension.v1~"
              }
            ]
          },
          "dir": {
            "enum": [
              "asc",
              "desc"
            ]
          }
        },
        "additionalProperties": false
      }
    },
    "limit": {
      "type": "integer",
      "minimum": 1
    },
    "offset": {
      "type": "integer",
      "minimum": 0
    }
  },
  "unevaluatedProperties": false
}
```

### 6.2 Range Forms

`time.range` is a string. It matches exactly one of three forms. Each form is enforced by a pattern or an enum in the base type. The patterns use only the GTS safe regular-expression profile.

| Form | Rule | Example |
|------|------|---------|
| Relative duration | An ISO 8601 duration back from the current moment. The pattern requires at least one component in the date part, or `T` followed by at least one component, so `P`, `PT` and `P1DT` fail | `P30D`, `P7D`, `PT12H` |
| Absolute interval | Two ISO 8601 dates (`YYYY-MM-DD`) or date-times (`YYYY-MM-DDThh:mm:ssZ`, or with an offset `+hh:mm`), separated by `/`. The start is not after the end. A pattern cannot compare the two ends, so the data adapter fails a query whose start is after its end | `2026-01-01/2026-03-31` |
| Calendar token | One value of an enum: `today`, `yesterday`, `this_week`, `previous_week`, `this_month`, `previous_month`, `this_quarter`, `previous_quarter`, `this_year`, `previous_year` | `this_month` |

The literal patterns of the base type, in the GTS safe regular-expression profile:

- Relative duration: `^P(([0-9]+Y([0-9]+M)?([0-9]+W)?([0-9]+D)?|[0-9]+M([0-9]+W)?([0-9]+D)?|[0-9]+W([0-9]+D)?|[0-9]+D)(T([0-9]+H([0-9]+M)?([0-9]+S)?|[0-9]+M([0-9]+S)?|[0-9]+S))?|T([0-9]+H([0-9]+M)?([0-9]+S)?|[0-9]+M([0-9]+S)?|[0-9]+S))$`
- Absolute interval: `^[0-9]{4}-[0-9]{2}-[0-9]{2}(T[0-9]{2}:[0-9]{2}:[0-9]{2}(Z|[+-][0-9]{2}:[0-9]{2}))?/[0-9]{4}-[0-9]{2}-[0-9]{2}(T[0-9]{2}:[0-9]{2}:[0-9]{2}(Z|[+-][0-9]{2}:[0-9]{2}))?$`

A `this_*` token is the whole current calendar unit, from its first to its last instant, and a `previous_*` token is the whole previous unit. Worked example: on 2026-10-30, `this_month` covers 2026-10-01 to 2026-10-31, and `previous_month` covers 2026-09-01 to 2026-09-30. With `range: this_month` and `compare: previous_period`, the measures are computed for October 2026 and for the same span shifted back by one month, which is September 2026.

### 6.3 Canonical Member Order

The canonical member order is the dimensions in query order, then the time dimension when `granularity` is set, then the measures in query order. Positional rows of data shapes and the cross-checks of the widget owner use this order. `cpt-frontx-dashboard-algo-query-vocabulary-canonical-order` derives it.

### 6.4 Measure and Dimension Bases

| Base | GTS ID | Instance fields |
|------|--------|-----------------|
| Measure | `gts.frontx.dashboard_m.data.measure.v1~` | `id` (required), `title` (required), `value_type` (required: `number`, `percent` or `duration`), `unit` (optional, required when `value_type` is `duration`) |
| Dimension | `gts.frontx.dashboard_m.data.dimension.v1~` | `id` (required), `title` (required), `value_type` (required: `string`, `time` or `number`) |

Each base is a type whose `id` field uses its own literal base operand. The `value_type` sets are closed as a template decision: the template renders only these value types, and a new one is a change of the template. A `percent` measure is a ratio in which 1 means 100%. A `duration` measure names its `unit`. A product delivers its measures and dimensions as GTS well-known instances, for example `gts.frontx.dashboard_m.data.measure.v1~acme.example.metrics.loc.v1`. Ids are unique across products, and a dimension can be shared by several datasets. The metadata gives a widget default titles and formats.

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
- **Dataset.** A product type derived from a query family, for example `gts.frontx.dashboard_m.data.query.v1~acme.example.data.metric_query.v1~acme.example.data.activity.v1~`. It narrows the members with enums: measures, dimensions, the time dimension, and the filter and order members. It carries the binding values in `x-gts-traits`. One dataset serves every combination of its members. Datasets only narrow, never widen.
- **Query instance.** The query in a widget is an embedded anonymous GTS instance. Its `id` is the dataset type chain followed by a UUID that the author or the generator creates. The query's type is never stored apart from its id. Identical queries, ignoring their UUIDs, give identical backend requests when the data adapter resolves relative ranges against a rounded current moment.
- **Versioning.** The registration rule (first registration of an id stays, template types cannot be replaced) is owned by `cpt-frontx-dashboard-algo-dashboard-root-types-register-delivery` (`inst-template-types-first`, `inst-new-version-id`). For the consumer: a dataset, measure or dimension with different content gets a different version id.

### 6.6 Identifier Rules

- An id field of a type that is embedded in other instances uses a literal base operand in `x-gts-instance-ref`, never the self-reference operand, because that operand resolves to the top-level type that is validated.
- A field that holds a type id uses `x-gts-type-ref`. A field that holds an instance id uses `x-gts-instance-ref`. A field that may hold either kind uses `anyOf` over the two.
- No GTS id is an object key where it must be validated. Collections keyed by ids are arrays of objects (for example the `columns` of a dataset binding, with `member` and a backend column). Grid rows are positional arrays in canonical member order.
- The template targets GTS v0.17 and the realm-shared type store, as `cpt-frontx-dashboard-adr-shared-data-types-and-schemas` decides.

### 6.7 Trait Helper Contract

- **Input**: a type id without a UUID. **Output**: the effective traits of the type, or a failure.
- The helper gets the schemas along the `$id` chain of the type with `getSchema`, and merges their `x-gts-traits` with RFC 7396, from the base to the type. When `getSchema` cannot return an ancestor, the helper returns a failure and never a partial result.
- The helper registers nothing, validates nothing and keeps no state between calls. It gives traits no meaning.
- The dashboards root and the larger-view modal use it for widget types and query families. The data adapter may use it to read the binding of a dataset.

## 7. Acceptance Criteria

- [ ] A query with a misspelled field fails validation, and its widget shows the cannot-show state in its own cell.
- [ ] A query that names a measure, dimension, time dimension, filter member or order member outside the dataset's enums fails validation.
- [ ] A query with neither `measures` nor `dimensions` fails validation, and so does an empty `measures` or `dimensions` array or one with a duplicate item.
- [ ] A query with a `granularity` outside `day`, `week` and `month`, an `operator` outside the list, or a `dir` outside `asc` and `desc` fails validation.
- [ ] A query that lists a dimension id in `measures` fails validation, because the item must be a measure instance id.
- [ ] A query with `limit: 0` or `offset: -1` fails validation. A query without `limit` passes, and its result has no limit that the template sets.
- [ ] A filter with `operator: between` and one value fails validation. `between` with two values, `in` with one or more, and `eq` with one value pass. A filter list with an exact duplicate entry fails validation.
- [ ] A `range` of `P`, `PT` or `P1DT`, or of a form that matches no pattern and no enum value, fails validation. `P30D`, `P7D`, `PT12H`, `2026-01-01/2026-03-31` and `this_month` pass. An interval whose start is after its end is a failure of the data adapter.
- [ ] A query with `compare: previous_period` and no `range` fails validation.
- [ ] On 2026-10-30, `this_month` with `compare: previous_period` gives October 2026 and September 2026, both whole calendar months.
- [ ] For a query with dimensions `d1`, `d2`, time granularity `day` and measures `m1`, `m2`, the canonical member order is `d1`, `d2`, the time dimension, `m1`, `m2`. Without `granularity` the time dimension is absent from the list.
- [ ] A dataset that lists a measure outside its parent's allowed values is rejected as a derivation.
- [ ] A dataset that is `x-gts-abstract`, or whose `id` chain does not name the base, the query family and the dataset, is rejected as a derivation.
- [ ] A dataset that widens a property of its parent or opens a closed one is rejected as a derivation. GTS registration rejects a widened enum and a traits mismatch, and schema review catches the other cases.
- [ ] A dataset whose `x-gts-traits` do not satisfy the `x-gts-traits-schema` of its query family is rejected.
- [ ] A new dataset with new measures is added as data only, and the data adapter needs no change.
- [ ] The consumer guide requires a different version id for different content of a dataset, measure or dimension; the first-registration rule is `cpt-frontx-dashboard-algo-dashboard-root-types-register-delivery`.
- [ ] The `id` fields of the base query, the measure base and the dimension base use literal base operands, and none uses the self-reference operand.
- [ ] No schema of this feature uses a GTS id as an object key.
- [ ] A measure with `value_type: duration` and no `unit` fails validation. A `value_type` outside the closed set fails validation. A `percent` value of 0.25 means 25%.
- [ ] A query family served by the data adapter is delivered as a type schema by the served-families declaration, and the owners register it at start.
- [ ] The trait helper returns the merged `x-gts-traits` along the `$id` chain, with a later type overriding an earlier one, and a second call with the same input gives the same result.
- [ ] Given a type id with an ancestor that `getSchema` cannot return, the trait helper returns a failure and no partial result.
- [ ] The consumer guide has a topic on query families, datasets and vocabulary.
