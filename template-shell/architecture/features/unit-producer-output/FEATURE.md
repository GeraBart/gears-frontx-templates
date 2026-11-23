---
status: accepted
version: 1
date: 2026-11-20
description: "Feature: the output of the unit producer: shared chunks and their unit table, the fetch-list emission, the alias unit for an unhashed cycle location, the opaque-import report, and the producer's own tests that verify the output against the FrontX unit format contract."
---

# Feature: Unit Producer Output

- [x] `p1` - **ID**: `cpt-template-shell-featstatus-unit-producer-output`

<!-- toc -->

- [1. Feature Context](#1-feature-context)
  - [1.1 Overview](#11-overview)
  - [1.2 Purpose](#12-purpose)
  - [1.3 Actors](#13-actors)
  - [1.4 References](#14-references)
- [2. Actor Flows (CDSL)](#2-actor-flows-cdsl)
  - [Produce the unit output](#produce-the-unit-output)
- [3. Processes / Business Logic (CDSL)](#3-processes--business-logic-cdsl)
  - [Emit fetch lists](#emit-fetch-lists)
- [4. States (CDSL)](#4-states-cdsl)
  - [No lifecycle states](#no-lifecycle-states)
- [5. Definitions of Done](#5-definitions-of-done)
  - [Fetch lists keyed per target](#fetch-lists-keyed-per-target)
  - [Producer output obligations](#producer-output-obligations)
- [6. Acceptance Criteria](#6-acceptance-criteria)

<!-- /toc -->

## 1. Feature Context

- [x] `p1` - `cpt-template-shell-feature-unit-producer-output`

### 1.1 Overview

The unit producer (`template-shell/packages/unit-producer`) turns the shared packages a build reaches into content-addressed chunks, a unit table and fetch lists, in the format the FrontX unit format contract fixes. The shell build and every microfrontend build call it. This feature specifies what the producer emits; the contract it emits against, and the runtime that reads the output, belong to FrontX.

### 1.2 Purpose

The FrontX runtime shares fetched text under the content identity a producer declares, so the output has to meet the contract exactly: every chunk content-addressed and declared, every fetch list complete, and nothing in the manifest beyond the unit table and the lists. A producer that breaks the contract breaks sharing or the load, so the producer verifies its own output in its own tests.

**Requirements**: the FrontX unit format contract (FrontX feature unit-format-contract, algorithm fetch-list-schema, cpt-frontx-algo-unit-format-contract-fetch-list-schema) and its producer output obligations (the producer-obligations paragraph of that algorithm).

### 1.3 Actors

| Actor | Role in Feature |
|-------|-----------------|
| Build author | Builds a shell or a microfrontend; receives chunks, `units` and `lists` for the manifest, and the opaque-import report. |

### 1.4 References

- **FrontX contract**: the FrontX unit format contract, feature unit-format-contract, algorithm cpt-frontx-algo-unit-format-contract-fetch-list-schema (the format, value formats, key forms, content identity, alias location form and the producer output obligations); content-keyed reuse is FrontX ADR-0034 (cpt-frontx-adr-shared-dep-reuse) and asset discovery FrontX ADR-0013 (cpt-frontx-adr-mfe-asset-discovery).
- **Dependencies**: None. The microfrontend build plugin consumes this output (`cpt-template-mfe-feature-mfe-fetch-list-assembly`).

## 2. Actor Flows (CDSL)

### Produce the unit output

- [x] `p1` - **ID**: `cpt-template-shell-flow-unit-producer-output-produce`

**Actor**: Build author

**Success Scenarios**:
- The build author builds a shell or microfrontend; the producer returns content-addressed chunks, the unit table and one flat fetch list per exposed module and per lazy target, and the runtime loads the output with content-keyed reuse.

**Error Scenarios**:
- A lazy chunk imports helpers from its entry chunk, so a cycle is spelled through an unhashed location: the producer publishes that alias file as a unit of its own with the same `contentHash` as the file it aliases, and the runtime resolves it like any other unit (see the alias unit step).
- A fully opaque `import(expr)` is reached: the build reports it with its file and line and leaves the call native.

**Steps**:
1. [x] - `p1` - The producer emits, for each exposed module and each lazy target, the shared chunks and the fetch list that describes them, following `cpt-template-shell-algo-unit-producer-output-emit-fetch-lists`; chunk bytes are fixed by `package@version` alone - `inst-produce-output`
2. [x] - `p1` - The producer returns the unit table and the fetch lists for the build to record in the manifest as `units` and `lists`, so every list references units by content identity that the unit table holds - `inst-record-manifest-entries`
3. [x] - `p1` - The producer describes shared code only through `units` and `lists`: it emits no `shared` entry and no whole-package file, so every shared file of its output is a unit that a list references - `inst-emit-no-whole-package`
4. [x] - `p1` - The producer verifies its own output against the producer output obligations (`cpt-template-shell-dod-unit-producer-output-obligations`) in its own tests - `inst-verify-own-output`
5. [x] - `p1` - **RETURN** output the FrontX runtime loads with content-keyed reuse - `inst-return-output`

## 3. Processes / Business Logic (CDSL)

### Emit fetch lists

- [x] `p1` - **ID**: `cpt-template-shell-algo-unit-producer-output-emit-fetch-lists`

**Input**: The exposed modules and lazy targets of a build, the shared packages they reach, the own chunks they reach statically, and each package's declared side-effect freedom

**Output**: A unit table and one flat fetch list per exposed module and per lazy target, in the format of the FrontX unit format contract

**Steps**:
1. [x] - `p1` - Determine each shared package's chunks by entry-point chunking: one chunk per entry point, overlapping internals in shared internal chunks by deterministic bundler chunk splitting with fixed settings and no merging, so chunk bytes stay fixed; `exports` subpaths and barrel members stay units. A package's entry set is its `exports` subpaths plus every module a public barrel re-exports; barrel members are split only when provably side-effect-free under the standard bundler semantics (the `sideEffects` field including its globs; when it is absent, only a barrel proven to be a pure re-export list), and otherwise the whole entry's chunk is used. One rule covers every package - `inst-determine-chunks`
2. [x] - `p1` - Keep every bare import in every chunk external and inline nothing across a package boundary; compute a package's chunk boundaries and bytes from that package's own complete entry set, independent of any consumer; include in a build's output only the chunks its own fetch lists reference - `inst-externalize-imports`
3. [x] - `p1` - Write each shared chunk once in the unit table, each unit carrying `location`, `contentHash` (SHA-256 of the file's text, 64 lowercase hexadecimal characters), `answers` and `imports` (a bare specifier, or an intra-package relative edge as `{ unit: <contentHash> }`). Write each fetch list's `units` as the content identities of every shared chunk the module or target reaches, so that every specifier a unit imports is answered by exactly one unit on the combined lists of the module or target and its parent chain, and the units of a load form no import cycle - `inst-emit-units`
4. [x] - `p1` - Carry on each fetch list `ownChunks`, the locations of the microfrontend's own chunks the exposed module or lazy target reaches statically, relative to `metaData.publicPath` or absolute http(s) URLs, with no content identity - `inst-emit-own-chunks`
5. [x] - `p1` - Key each fetch list by emitted chunk location. Hold every lazy target (an own lazy chunk, or the target of a literal dynamic import inside a shared chunk) as a list of its own under the target's chunk location relative to the base that chunk resolves against, holding only what the target needs beyond its parent chain's lists, and name it in the `lazy` array of every list that reaches it - `inst-emit-lazy-lists`
6. [x] - `p1` - **IF** two parents reach one lazy target - `inst-merge-shared-target`
   1. [x] - `p1` - Hold one list for the target, keyed by the target's location, that is the union of what the target needs beyond each parent chain, so a load through either parent finds every unit and own chunk the target needs - `inst-merge-union`
7. [x] - `p1` - Emit every chunk content-addressed, with the content hash in the file's location, and declare each unit's content identity in the unit table - `inst-emit-content-addressed`
8. [x] - `p1` - **IF** a lazy-chunk cycle is spelled through an unhashed location - `inst-emit-alias-unit`
   1. [x] - `p1` - Publish the unhashed alias file as a unit at its own location with the same `contentHash` as the content-addressed file it aliases, so the alias resolves to the same text under the same identity - `inst-alias-unit-publish`
9. [x] - `p1` - Report every fully opaque `import(expr)` with its file and line in the producer's own output, outside the manifest; the call stays native - `inst-report-opaque-imports`
10. [x] - `p1` - Write only `units` and `lists` for shared code: no `shared` entry, no whole-package file - `inst-write-units-lists-only`
11. [x] - `p1` - **RETURN** the chunks, the unit table `units` and the fetch lists - `inst-return-lists`

## 4. States (CDSL)

### No lifecycle states

This FEATURE defines no state machines; the producer's output is a pure function of its inputs.

## 5. Definitions of Done

### Fetch lists keyed per target

- [x] `p1` - **ID**: `cpt-template-shell-dod-unit-producer-output-fetch-lists`

The producer **MUST** emit one flat fetch list per exposed module and per lazy target, each list keyed by the location of the chunk it describes, and **MUST** merge into one union list a target that two parents reach. It **MUST** publish an unhashed alias location as a unit carrying the same `contentHash` as the file it aliases. It **MUST** write only `units` and `lists` for shared code.

**Implements**:
- `cpt-template-shell-flow-unit-producer-output-produce`
- `cpt-template-shell-algo-unit-producer-output-emit-fetch-lists`

**Touches**:
- Modules: `template-shell/packages/unit-producer`

### Producer output obligations

- [x] `p1` - **ID**: `cpt-template-shell-dod-unit-producer-output-obligations`

The producer's output **MUST** satisfy the FrontX producer output obligations: units and lists only, with no `shared` entry and no whole-package file; content identity, with every chunk content-addressed and every content identity a list names held by the unit table; complete fetch lists, with every shared chunk reachable from an exposed module on its fetch list, every own chunk it reaches statically in `ownChunks` and every import edge answered, including through re-export chains, namespace imports, `as default` and side-effectful barrels; acyclic units; delta lists; consumer independence, so two consumers using different subsets of a package get identical chunks for it; byte identity across builds of the same producer version; and, for the microfrontend's own code, the `__frontx_lazy` call emitted for every literal and every pattern dynamic import, with a fetch list per literal lazy target and none for a pattern import. The producer **MUST** verify its output against these obligations in its own tests.

**Implements**:
- `cpt-template-shell-flow-unit-producer-output-produce`
- `cpt-template-shell-algo-unit-producer-output-emit-fetch-lists`

**Touches**:
- Modules: `template-shell/packages/unit-producer`

## 6. Acceptance Criteria

- [x] Verified in the producer's own tests: shared packages are chunked by consumer-independent entry-point chunking: one chunk per entry point, overlapping internals in shared internal chunks; a package's chunk boundaries and bytes are computed from its own complete entry set (`exports` subpaths plus every module a public barrel re-exports), so every runtime's chunks of `package@version` are byte-identical; `exports` subpaths and barrel members stay units.
- [x] Verified in the producer's own tests: every bare import in a chunk is external and no package is inlined across a package boundary; barrel members are split only when provably side-effect-free under the standard bundler `sideEffects` semantics; chunk bytes carry only text derived from the package and are identical for every consumer.
- [x] Verified in the producer's own tests: exactly one flat fetch list exists per exposed module and per lazy target, each unit carrying `location`, `contentHash`, `answers` and `imports`, each list carrying `units`, `ownChunks` and the `lazy` and `patterns` arrays of keys; every lazy list is held once in the manifest's top-level `lists` under its target's chunk location.
- [x] Verified in the producer's own tests: the output carries `units` and `lists` only, with no `shared` entry and no whole-package file; every content identity a list names is held by the unit table, and chunks are content-addressed.
- [x] Verified in the producer's own tests: a lazy target that two parents reach has one list, the union of what it needs beyond each parent chain.
- [x] Verified in the producer's own tests: an unhashed alias location is published as a unit with the same `contentHash` as the file it aliases.
- [x] Verified in the producer's own tests: every fully opaque `import(expr)` is reported with its file and line.
