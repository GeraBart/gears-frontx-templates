---
status: accepted
version: 1
date: 2026-11-20
description: "Feature: the MFE build plugin's fetch-list assembly: one list per exposed module and per lazy own chunk keyed by emitted location, own chunks per list, the union for a target two parents reach, the lazy-import call, and the opaque-import report."
---

# Feature: MFE Fetch-List Assembly

- [x] `p1` - **ID**: `cpt-template-mfe-featstatus-mfe-fetch-list-assembly`

<!-- toc -->

- [1. Feature Context](#1-feature-context)
  - [1.1 Overview](#11-overview)
  - [1.2 Purpose](#12-purpose)
  - [1.3 Actors](#13-actors)
  - [1.4 References](#14-references)
- [2. Actor Flows (CDSL)](#2-actor-flows-cdsl)
  - [Assemble the manifest lists](#assemble-the-manifest-lists)
- [3. Processes / Business Logic (CDSL)](#3-processes--business-logic-cdsl)
  - [Compose fetch lists](#compose-fetch-lists)
- [4. States (CDSL)](#4-states-cdsl)
  - [No lifecycle states](#no-lifecycle-states)
- [5. Definitions of Done](#5-definitions-of-done)
  - [Manifest lists keyed per target](#manifest-lists-keyed-per-target)
- [6. Acceptance Criteria](#6-acceptance-criteria)

<!-- /toc -->

## 1. Feature Context

- [x] `p1` - `cpt-template-mfe-feature-mfe-fetch-list-assembly`

### 1.1 Overview

The MFE build plugin (`template-mfe/packages/vite-plugin-mfe-gts`) calls the unit producer and assembles the microfrontend's manifest `units` and `lists`: for every exposed module, the shared specifiers its chunk closure reaches merge into one list, and every lazily loaded own chunk gets a list of its own, in the format of the FrontX unit format contract.

### 1.2 Purpose

The runtime loads an exposed module or a lazy target in one round only when its list names every shared unit and own chunk it needs and is keyed where the runtime looks it up. The build plugin knows the emitted chunk graph, so it keys the lists by emitted chunk location and carries the own chunks per list.

**Requirements**: the FrontX unit format contract (FrontX feature unit-format-contract, algorithm fetch-list-schema, cpt-frontx-algo-unit-format-contract-fetch-list-schema) and its producer output obligations (the producer-obligations paragraph of that algorithm).

### 1.3 Actors

| Actor | Role in Feature |
|-------|-----------------|
| Build author | Builds a microfrontend and receives the manifest `units` and `lists` and the opaque-import report. |

### 1.4 References

- **FrontX contract**: the FrontX unit format contract, feature unit-format-contract, algorithm cpt-frontx-algo-unit-format-contract-fetch-list-schema; lazy-import resolution is FrontX ADR-0012 (cpt-frontx-adr-lazy-import-resolution).
- **Dependencies**: `cpt-template-shell-feature-unit-producer-output`.

## 2. Actor Flows (CDSL)

### Assemble the manifest lists

- [x] `p1` - **ID**: `cpt-template-mfe-flow-mfe-fetch-list-assembly-assemble`

**Actor**: Build author

**Success Scenarios**:
- The build author builds a microfrontend; the manifest carries `units` and `lists` only, one list per exposed module and per lazy own chunk, and the runtime loads each in one round.

**Error Scenarios**:
- A fully opaque `import(expr)` is reached: the build reports it with its file and line and leaves the call native.

**Steps**:
1. [x] - `p1` - Call the unit producer for the shared specifiers the exposed modules and lazy own chunks reach (`cpt-template-shell-flow-unit-producer-output-produce`) - `inst-call-producer`
2. [x] - `p1` - Compose the lists (`cpt-template-mfe-algo-mfe-fetch-list-assembly-compose`) - `inst-compose`
3. [x] - `p1` - Record `units` and `lists` in the manifest and no `shared` entry or whole-package file - `inst-record-units-lists`
4. [x] - `p1` - **RETURN** the manifest and the opaque-import report - `inst-return-manifest`

## 3. Processes / Business Logic (CDSL)

### Compose fetch lists

- [x] `p1` - **ID**: `cpt-template-mfe-algo-mfe-fetch-list-assembly-compose`

**Input**: The produced shared packages, the specifiers each exposed module's and each lazy own chunk's closure reaches, and the own chunks each reaches statically

**Output**: The manifest's `units` and `lists`

**Steps**:
1. [x] - `p1` - Merge, for each exposed module, the shared specifiers its chunk closure reaches into one fetch list, deduplicated by location - `inst-merge-expose-list`
2. [x] - `p1` - Carry `ownChunks` on each list: the own chunks the module or lazy chunk reaches statically, relative to `metaData.publicPath` - `inst-own-chunks`
3. [x] - `p1` - Give every lazily loaded own chunk a list of its own, keyed by its emitted chunk location and holding only what it needs beyond its parent's list, named in the `lazy` array of every list that reaches it - `inst-lazy-lists`
4. [x] - `p1` - **IF** two parents reach one lazy target - `inst-two-parents`
   1. [x] - `p1` - Hold one list for the target, keyed by its location, that is the union of what it needs beyond each parent's list - `inst-two-parents-union`
5. [x] - `p1` - Emit the lazy-import call (`__frontx_lazy`) for every literal and every pattern dynamic import in the microfrontend's own code; a pattern import gets no list, because built file names are hashed and a runtime pattern path never matches one, so the call takes the runtime's no-list rule (FrontX ADR-0012) - `inst-lazy-import-call`
6. [x] - `p1` - Report every fully opaque `import(expr)` with its file and line - `inst-opaque-report`
7. [x] - `p1` - **RETURN** `units` and `lists`, with shared code described by them alone - `inst-return-units-lists`

## 4. States (CDSL)

### No lifecycle states

This FEATURE defines no state machines.

## 5. Definitions of Done

### Manifest lists keyed per target

- [x] `p1` - **ID**: `cpt-template-mfe-dod-mfe-fetch-list-assembly-lists`

The build plugin **MUST** record one list per exposed module and per lazy own chunk, keyed by emitted chunk location, with `ownChunks` on each; **MUST** hold one union list for a target two parents reach; and **MUST** write only `units` and `lists` for shared code. It **MUST** emit the `__frontx_lazy` call for every literal and every pattern dynamic import in the microfrontend's own code. It **MUST** verify its output in its own tests.

**Implements**:
- `cpt-template-mfe-flow-mfe-fetch-list-assembly-assemble`
- `cpt-template-mfe-algo-mfe-fetch-list-assembly-compose`

**Touches**:
- Modules: `template-mfe/packages/vite-plugin-mfe-gts`

## 6. Acceptance Criteria

- [x] Verified in the plugin's own tests: one list exists per exposed module and per lazy own chunk, keyed by emitted chunk location, each carrying `ownChunks`.
- [x] Verified in the plugin's own tests: a lazy target that two parents reach has one list, the union of what it needs beyond each parent's list.
- [x] Verified in the plugin's own tests: the manifest carries `units` and `lists` only.
- [x] Verified in the plugin's own tests: every literal and every pattern dynamic import in the microfrontend's own code is emitted as the `__frontx_lazy` call, and a pattern import gets no list.
- [x] Verified in the plugin's own tests: every fully opaque `import(expr)` is reported with its file and line.
