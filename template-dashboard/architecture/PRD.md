---
description: Product requirements for the FrontX dashboard template - a render-only Viewer host that shows the dashboards and data a consuming product provides, with 9 widget kinds, a larger view for every widget, light and dark themes, and a published domain model for describing dashboards.
---

# PRD — FrontX Dashboard Template

<!-- toc -->

- [1. Overview](#1-overview)
  - [1.1 Purpose](#11-purpose)
  - [1.2 Background / Problem Statement](#12-background--problem-statement)
  - [1.3 Goals (Business Outcomes)](#13-goals-business-outcomes)
  - [1.4 Glossary](#14-glossary)
- [2. Actors](#2-actors)
  - [2.1 Human Actors](#21-human-actors)
  - [2.2 System Actors](#22-system-actors)
- [3. Operational Concept & Environment](#3-operational-concept--environment)
  - [3.1 Module-Specific Environment Constraints](#31-module-specific-environment-constraints)
- [4. Scope](#4-scope)
  - [4.1 In Scope](#41-in-scope)
  - [4.2 Out of Scope](#42-out-of-scope)
- [5. Functional Requirements](#5-functional-requirements)
  - [5.1 Viewing Dashboards](#51-viewing-dashboards)
  - [5.2 Widgets and Presentation](#52-widgets-and-presentation)
  - [5.3 Describing Dashboards](#53-describing-dashboards)
- [6. Non-Functional Requirements](#6-non-functional-requirements)
  - [6.1 NFR Inclusions](#61-nfr-inclusions)
  - [6.2 NFR Exclusions](#62-nfr-exclusions)
  - [6.3 Limitations and Known Gaps](#63-limitations-and-known-gaps)
- [7. Public Library Interfaces](#7-public-library-interfaces)
  - [7.1 Public API Surface](#71-public-api-surface)
  - [7.2 External Integration Contracts](#72-external-integration-contracts)
- [8. Use Cases](#8-use-cases)
  - [View a Dashboard](#view-a-dashboard)
- [9. Acceptance Criteria](#9-acceptance-criteria)
- [10. Dependencies](#10-dependencies)
- [11. Assumptions](#11-assumptions)
- [12. Risks](#12-risks)

<!-- /toc -->

## 1. Overview

### 1.1 Purpose

`template-dashboard` is a FrontX template. It provides a render-only Viewer host for applications built on `template-shell`. The consuming product provides the dashboards and the data they show, and the Viewer host displays them as provided. The application developer does not write chart or grid code for each dashboard.

A consuming product may write its dashboards by hand or generate them. For example, a user types a request in a chat, and the consuming product generates a dashboard for it. Generating dashboards is the consuming product's job. The template publishes a domain model that lets a consuming product check, before it shows a dashboard, whether the template can show it in full.

The template provides three things. The first is the **Viewer host**, the screen that shows dashboards. The second is a widget library with 9 widget kinds. The third is the published domain model, which describes the dashboards that a consuming product can provide.

The template is **render-only**. The consuming product provides the data, and the Viewer host shows it as provided. The look of the dashboard, including its light and dark theme, is part of the template. The Viewer host offers no filtering, searching, sorting, grouping, or paging, no navigation between widgets, and no refresh while the dashboard is open. A dashboard, as provided, fully defines how its widgets are composed and presented. Each widget can be opened in a larger view.

### 1.2 Background / Problem Statement

Teams that build cloud-project applications on FrontX often need dashboards: summary cards, grids, and charts that show how a project is doing. Each team builds these screens from scratch. The result is many one-off dashboards with different layouts and different visual quality.

This template provides a render-only Viewer host for FrontX applications. The consuming product decides what each dashboard shows, whether it writes the dashboard or generates it, and provides the data. The Viewer host only renders what it receives.

### 1.3 Goals (Business Outcomes)

- Product teams that build on FrontX get consistent dashboards without building chart or grid screens for each dashboard.
- A dashboard viewer sees a complete dashboard within the initial render target (`cpt-frontx-dashboard-nfr-initial-render`), with clear feedback while the dashboard and each widget load, and when loading fails. A widget whose data fails to load does not stop the other widgets from showing.
- A dashboard viewer can open any widget in a larger view, and still sees on the dashboard everything the consuming product provides for each widget (`cpt-frontx-dashboard-fr-backend-source`).
- A consuming product can show the dashboards it writes or generates, for example from a user's request in a chat, without changing the Viewer host or the widget library, and can check, before it shows a dashboard, whether the template can show it in full.

### 1.4 Glossary

| Term | Definition |
|------|------------|
| FrontX | The application framework that applications and templates in this repository target. |
| `template-shell` | The FrontX host application template. It provides the screen area where the Viewer host is shown and the place where modals are shown. |
| Consuming product | The product that uses this template to show its dashboards: its application built on `template-shell` and its backend. |
| Host screen area | The part of the host application where full screens are shown. The Viewer host is shown here. |
| Host modal area | The place in the host application where modals are shown. A widget's larger view is shown here. |
| Viewer host | The template's screen that shows the dashboard that the consuming product provides. |
| Dashboard | A screen of widgets that the consuming product provides, written or generated, and that the Viewer host displays as provided. |
| Generated dashboard | A dashboard that the consuming product generates, for example from a user's request in a chat. |
| Widget | A single dashboard element such as a card, a grid, or a chart. The template has 9 widget kinds. |
| Widget settings | The named choices a widget takes, with the values the consuming product sets. |
| Own widget | A widget a consuming product defines from one of the template's widget kinds by adding the settings it takes; it shows with that kind's look. |
| Widget library | The set of widget kinds that the template ships. |
| Larger view | A modal that shows one widget with more room than its place on the dashboard. |
| Domain model | The published description of what a dashboard can contain: dashboards, their layouts, the widget kinds, and the data each widget kind shows. The consuming product describes its dashboards with it. |
| p95 | The 95th percentile: 95% of measured cases are at or below the stated value. |

## 2. Actors

### 2.1 Human Actors

#### Template Consumer

**ID**: `cpt-frontx-dashboard-actor-template-consumer`

**Role**: A FrontX application developer who connects the template to their product.
**Needs**: A description of the dashboards they can provide and of what their backend must provide. A way to add the settings of their own widgets. Widgets and dashboards that work without custom chart code.

#### Dashboard Viewer

**ID**: `cpt-frontx-dashboard-actor-dashboard-viewer`

**Role**: An end user of the consuming application who opens a dashboard to understand the state of a cloud project.
**Needs**: Fast, readable dashboards. Opening any widget in a larger view. Clear feedback while the dashboard and each widget load, or when loading fails. A light or dark theme.

### 2.2 System Actors

#### Consuming Product Backend

**ID**: `cpt-frontx-dashboard-actor-consuming-backend`

**Role**: The backend of the consuming product. It provides the dashboards, written or generated, and the data each widget shows.

#### Host Application

**ID**: `cpt-frontx-dashboard-actor-host-application`

**Role**: `template-shell`, or an application built from it. It provides the screen where the Viewer host is shown and a place to show modals. For a widget's larger view, the host must show modals with a modal frame, keyboard focus kept inside, and dismissal. Current `template-shell` does not yet show modals this way, so this is a prerequisite `template-shell` change tracked outside the template.

## 3. Operational Concept & Environment

### 3.1 Module-Specific Environment Constraints

- The template runs only in a FrontX application that already contains `template-shell`, and it depends on `template-shell` only.
- The template works with the current stable FrontX release.

## 4. Scope

### 4.1 In Scope

The rule for this release is **render-only**: the consuming product provides the dashboards and the data they show, and the Viewer host renders them as provided.

- The Viewer host, shown in the host screen area, which opens a dashboard by its address.
- Dashboards and the data each widget shows, provided by the consuming product, whether it writes the dashboards or generates them.
- Rendering of each dashboard as provided, with loading and error feedback for the dashboard and for each widget. A dashboard's layout, as provided, fully defines how the widgets are composed and presented.
- The widget library: 9 subject-agnostic widget kinds.
- A larger view for every widget, shown in the host modal area. The host needs to support modals (host modal support, section 2.2); see the Host Application in section 2.2 for its status.
- Light and dark theme, owned by the template.
- The published domain model, which describes the dashboards a consuming product can provide and lets it add the settings of its own widgets.

### 4.2 Out of Scope

- Dashboard authoring. It is the consuming product's job.
- Generating dashboards, for example from a user's request in a chat. Generation is the consuming product's job; the template provides the published domain model that generated dashboards are described with.
- Report generation and report download.
- The frontend gateway.
- Filtering and searching of any kind.
- Sorting, grouping, or paging of widget content.
- Drill-down from one widget to another, and moving between items.
- Refreshing a dashboard or its data while it is open.
- A way to shorten or hide widget content on the dashboard.
- Rich cell formatting in a table shown in the `grid` widget, such as badges, links, or sparklines in cells.
- Dashboard visibility, publication, sharing, and audience settings.

## 5. Functional Requirements

### 5.1 Viewing Dashboards

#### Viewer Host Screen

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-fr-viewer-host`

The system **MUST** provide the Viewer host as a screen in the host application with its own address, and the address **MUST** identify the dashboard to show, so that a dashboard viewer can open a specific dashboard directly. The Viewer host **MUST** show the dashboard that the consuming product provides for that address. Dashboards open at the same time, for example in two browser tabs, **MUST** each show only their own content.

**Rationale**: The Viewer host is the entry point to everything else in the template. Dashboard viewers need to open a specific dashboard directly and trust that each open dashboard shows only its own data.

**Actors**: `cpt-frontx-dashboard-actor-dashboard-viewer`, `cpt-frontx-dashboard-actor-host-application`

#### Dashboards and Data from the Consuming Product

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-fr-backend-source`

The system **MUST** show the dashboards that the consuming product provides, with the data that the consuming product provides for each widget, as provided. A dashboard that the consuming product generates, for example from a user's request in a chat, **MUST** be shown in the same way as a dashboard that it writes by hand. A widget on the dashboard **MUST** show everything the consuming product provides for it, with nothing shortened or hidden; what its larger view shows is decided by each widget kind. A dashboard, as provided, **MUST** fully define how its widgets are composed and presented. The template **MUST** let the consuming product check, before it shows a dashboard, whether the template can show it in full.

**Rationale**: The consuming product decides what each dashboard shows, and consuming products want to build dashboards on request instead of writing each one by hand. A dashboard viewer should see only dashboards that the template can show in full, so the consuming product needs a way to check this first. The Viewer host stays the same for every product.

**Actors**: `cpt-frontx-dashboard-actor-template-consumer`, `cpt-frontx-dashboard-actor-consuming-backend`

#### Loading and Error States

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-fr-loading-error-states`

The system **MUST** show skeletons in place of the dashboard while it loads. When the dashboard fails to load, the system **MUST** show an error banner with a Retry action, and a successful retry **MUST** show the dashboard. Each widget **MUST** then show its own skeleton while its data loads. When its data fails to load, the widget **MUST** show its own error with a Retry action, and a successful retry **MUST** show the widget. When a widget's data is provided but cannot be shown, or a widget fails to load, that widget **MUST** show an error state that tells the dashboard viewer the content cannot be shown, and **MUST NOT** show wrong or misleading content in its place. When the dashboard's description, its layout, or a widget's settings fail the checks the Viewer host makes when it opens the dashboard, the dashboard as a whole cannot be shown: the system **MUST** replace it with a message saying so, never with wrong content. Only a widget's data that cannot be shown, or a widget that fails to load, **MUST** stay in that widget. Each widget **MUST** appear or fail on its own: a failing widget **MUST NOT** affect the other widgets.

**Rationale**: Loading can be slow or can fail, for the whole dashboard or for one widget. Dashboard viewers must always know which is happening, where, and what they can do about it.

**Actors**: `cpt-frontx-dashboard-actor-dashboard-viewer`, `cpt-frontx-dashboard-actor-consuming-backend`

### 5.2 Widgets and Presentation

#### Widget Catalog Coverage

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-fr-widget-catalog`

The system **MUST** provide a widget library with the following 9 subject-agnostic widget kinds, grouped by purpose:

- Cards: `summary_card`, `metric_card`, `ranked_list_card`, `progress_list_card`, `markdown_card`.
- Data: `grid`.
- Charts: `cartesian_chart`, `pie_chart`, `heatmap`.

The template **MUST** ship all 9 kinds ready to use, with no widget code from the consumer. Each kind **MUST** be usable on its own in any dashboard. A widget kind **MUST NOT** fix the meaning of its settings, so that a consumer can use the kinds with data from any subject area.

**Rationale**: A complete, domain-neutral catalog lets consumers build dashboards without writing chart or grid code.

**Actors**: `cpt-frontx-dashboard-actor-template-consumer`, `cpt-frontx-dashboard-actor-dashboard-viewer`

#### Open a Widget in a Larger View

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-fr-widget-modal`

Each widget **MUST** have one button that opens the widget in a larger view, shown in the host modal area. The larger view **MUST NOT** offer navigation to other widgets or items. Closing the larger view **MUST** return the dashboard viewer to the unchanged dashboard. The template **MUST** require the host to show modals with a modal frame, keyboard focus kept inside the open modal, and dismissal (see the Host Application in section 2.2).

**Rationale**: Dense widgets such as grids and charts need more room than a dashboard tile gives.

**Actors**: `cpt-frontx-dashboard-actor-dashboard-viewer`, `cpt-frontx-dashboard-actor-host-application`

#### Light and Dark Theme

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-fr-theme`

The system **MUST** render the Viewer host, the widgets, and the larger view in a light theme and in a dark theme. The theme **MUST** be part of the template, and the choice between light and dark **MUST** follow the host theme. A theme change **MUST** reach every shown widget, including a widget open in its larger view, without a reload of the dashboard.

**Rationale**: Consistent theming keeps dashboards inside the look of the host application.

**Actors**: `cpt-frontx-dashboard-actor-dashboard-viewer`, `cpt-frontx-dashboard-actor-host-application`

### 5.3 Describing Dashboards

#### Published Domain Model

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-fr-domain-model`

The system **MUST** publish a domain model that describes what a dashboard can contain: dashboards, their layouts, the widget kinds, and the data each widget kind shows. A consuming product **MUST** be able to describe the dashboards it writes or generates with it. A consuming product **MUST** be able to define its own widgets by adding the settings they take, without changing the template's widget kinds.

**Rationale**: Consumers need a published description of the dashboards they can provide, so that they can write or generate dashboards and check that the Viewer host can show them in full.

**Actors**: `cpt-frontx-dashboard-actor-template-consumer`

## 6. Non-Functional Requirements

### 6.1 NFR Inclusions

#### Visual Quality

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-nfr-visual-quality`

The system **MUST** give all chart and data display types one consistent look, in both light and dark themes, as measured by the threshold below.

**Threshold**: In design review, 100% of the 9 widget kinds follow the host design-system tokens (colors, typography, spacing) with no per-widget manual styling.

**Rationale**: Dashboards are decision tools, and visual quality shapes trust in the data.

**Verification Method**: Inspection against the design-system reference, in both themes.

#### Initial Render Latency

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-nfr-initial-render`

The system **MUST** show the complete dashboard, with every widget showing its data, within the threshold below, measured from the moment the dashboard viewer opens the dashboard address.

**Threshold**: **Provisional.** Under 3 seconds at p95. The reference conditions (reference device, network profile, and reference dashboard) are fixed in the DESIGN. The budget will be re-measured under those conditions and confirmed or revised.

**Rationale**: A slow first view undermines the value of the dashboard.

**Verification Method**: Measured on the reference dashboard under the reference conditions.

#### Large Table Responsiveness

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-nfr-large-table`

The system **MUST** keep a table shown in the `grid` widget, of up to 5,000 rows, responsive while the dashboard viewer scrolls it, with no paging.

**Threshold**: While a dashboard viewer scrolls a table of 5,000 rows shown in the `grid` widget, the view never stops responding for longer than 100 ms (provisional), under the reference conditions fixed in the DESIGN.

**Rationale**: Dashboard viewers want to scan and scroll through a full set of rows in one continuous table, without stepping through pages.

**Verification Method**: Measured by scrolling a 5,000-row table in the `grid` widget under the reference conditions.

#### Compatibility

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-nfr-compatibility`

The template **MUST** work with the current stable FrontX release, and **MUST** depend on `template-shell` only.

**Threshold**: An application built on `template-shell` with the current stable FrontX release shows a dashboard with the template, and the template needs no other template. A widget's larger view additionally needs host modal support (section 2.2).

**Rationale**: A narrow dependency keeps adoption cheap and upgrades predictable.

**Verification Method**: Built and run against the current stable FrontX release.

#### Download Size Budget (Provisional)

- [ ] `p3` - **ID**: `cpt-frontx-dashboard-nfr-bundle-budget`

The system **MUST** keep the download size of the Viewer host and of each widget within a budget, so that the first load of a dashboard stays fast. The figures are provisional; see question Q1 in section 12.

**Threshold**: **Provisional.** The Viewer host is under 500 KB, and each widget is under 100 KB, measured as the DESIGN sets out. Every figure is re-measured and confirmed or revised.

**Rationale**: A budget protects first-load time, but provisional figures must be confirmed before they are binding.

**Verification Method**: Analysis of download sizes measured as the DESIGN sets out.

#### Accessibility

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-nfr-accessibility`

The system **MUST** follow the host application's accessibility policy in every widget and control. The larger-view button, the larger view, and the Retry action **MUST** be operable with the keyboard alone.

**Threshold**: 100% of the 9 widget kinds and the larger view pass the host application's accessibility checks in both themes. In the reference dashboard fixed in the DESIGN, opening the larger view of every widget and closing it again can be completed with the keyboard alone.

**Rationale**: Dashboards are part of the host application, so they must be usable by the same people, including keyboard and assistive-technology users.

**Verification Method**: Inspection against the host accessibility policy, plus a keyboard-only walkthrough of the reference dashboard.

#### Consumer Documentation

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-nfr-consumer-docs`

The template **MUST** ship a consumer guide that explains how to describe the dashboards a consuming product provides, how to check, before a dashboard is shown, whether the template can show it in full, what the consuming product's backend must provide, what the host must provide, how to add the settings of the consuming product's own widgets, and that the consuming product owns dashboard size and data size.

**Threshold**: A developer who follows only the shipped guide can describe a dashboard of their own, have their backend provide it with its data, check before it is shown whether the template can show it in full, know what the host must provide, add the settings of their own widgets, and know who owns dashboard and data size, without reading the template source code or its design documents.

**Rationale**: What the backend must provide is the main step in adopting the template, and consumers need the guide without reading the template's design documents.

**Verification Method**: Inspection of the shipped guide, plus a walkthrough by a developer who did not build the template.

### 6.2 NFR Exclusions

- Multi-tenant isolation, role-based administration, and dashboard-delivery availability or recovery targets: the template provides no backend of its own. Tenancy belongs to the host application and the consuming product.
- Authoring usability: dashboard authoring is out of scope.
- Dashboard generation and report performance: generating dashboards belongs to the consuming product, and report generation is out of scope.
- On-prem and edge deployment portability: deployment belongs to the consuming product.
- Safety and regulatory compliance: not applicable. The template is a read-only information UI.
- Privacy: no separate privacy NFR. The template adds no processing of personal data beyond what the consuming product provides.
- Data volume: the consuming product decides how much data each widget shows. The template sets no data-volume limit of its own; responsiveness of a table shown in the `grid` widget, up to 5,000 rows, is covered in `cpt-frontx-dashboard-nfr-large-table`.
- Audit logging: not applicable at template level. The consuming product owns audit.
- Accessibility: covered as a requirement in `cpt-frontx-dashboard-nfr-accessibility`, which inherits the host application's policy.
- Internationalization and regional formats: inherited from the host. The template follows the host language setting, and number and date formatting follow the host locale.
- Supported browsers: inherited from the `template-shell` support matrix.
- Consumer documentation: covered as a requirement in `cpt-frontx-dashboard-nfr-consumer-docs`.
- Data retention: no requirement, because the template only displays what the consuming product provides.
- Release, operations, and monitoring: not applicable. The consuming product owns release and monitoring.

### 6.3 Limitations and Known Gaps

- **Nothing changes while the dashboard is open.** The Viewer host offers no filtering, search, sorting, grouping, paging, refresh, or navigation between widgets. To see newer data, the dashboard viewer reloads the page.
- **No cutting off and no rich cell formatting.** A widget on the dashboard shows what the consuming product provides for it; it does not shorten or hide content (`cpt-frontx-dashboard-fr-backend-source`). Cells of a table shown in the `grid` widget show plain text, with no badges, links, or sparklines.
- **Widgets show only what the consuming product provides.** A consuming product that cannot provide a widget's data cannot show that widget.
- **Generated dashboards are the consuming product's job.** The template publishes the domain model, but generating a dashboard and checking whether the template can show it in full are the consuming product's job. A dashboard whose description, layout, or a widget's settings fail the Viewer host's checks cannot be shown as a whole and is replaced by a message saying so; only a widget's data that cannot be shown, or a widget that fails to load, stays in that widget, which shows an error state.
- **The larger view needs a host change.** It needs host modal support (see the Host Application in section 2.2). Until the host provides it, the larger view cannot be shown; the dashboard itself works without it.

## 7. Public Library Interfaces

The template publishes one public surface, its domain model. It has two integration needs: the host application provides a screen and a place to show modals, and the consuming product provides the dashboards and the data they show.

### 7.1 Public API Surface

#### Dashboard Domain Model

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-interface-domain-model`

**Type**: Data format

**Stability**: experimental

**Description**: A versioned way to describe the dashboards that a consuming product provides: dashboards, their layouts, the widget kinds, and the data each widget kind shows. Consumers use it to write or generate dashboards and to check, before they are shown, whether the template can show them in full. A consuming product can use it to add the settings of its own widgets. Its format and structure are defined in the DESIGN.

**Breaking Change Policy**: While the template is in alpha, changes are allowed and are announced in the template release notes. From the first stable release, breaking changes are controlled and announced.

### 7.2 External Integration Contracts

#### Host Screen and Modal Areas

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-contract-host-domains`

**Direction**: required from client

**Protocol/Format**: Product-level need only: the host provides a screen area for the Viewer host and a place to show modals, with host modal support (section 2.2). The technical form is defined in the DESIGN.

**Compatibility**: Needed from `template-shell`, and from applications built from it, on the current stable FrontX release.

#### Dashboards and Data Provided by the Backend

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-contract-consuming-backend`

**Direction**: required from client

**Protocol/Format**: Product-level need only: the consuming product provides each dashboard and the data its widgets show. The technical contract is defined in the DESIGN.

**Compatibility**: Follows the breaking change policy of `cpt-frontx-dashboard-interface-domain-model`.

## 8. Use Cases

### View a Dashboard

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-usecase-explore-dashboard`

**Actor**: `cpt-frontx-dashboard-actor-dashboard-viewer`

**Preconditions**:
- The consuming product provides a dashboard and the data its widgets show. The dashboard may be one that the consuming product generated, for example from a user's request in a chat.

**Main Flow**:
1. The dashboard viewer opens the dashboard address.
2. The system shows skeletons while the dashboard loads.
3. The system shows the dashboard layout with a skeleton in each widget.
4. Each widget shows its data when the data arrives.
5. Optionally, the dashboard viewer opens a widget in its larger view.
6. The system shows the widget in its larger view.
7. The dashboard viewer closes the larger view and returns to the unchanged dashboard.

**Postconditions**:
- The dashboard shows the data that the consuming product provided, as provided.

**Alternative Flows**:
- **The dashboard fails to load**: The system shows an error banner with a Retry action. After a successful retry, step 3 continues.
- **A widget's data fails to load**: That widget shows an error with a Retry action; the other widgets are not affected. After a successful retry, the widget shows its data.
- **A widget's data cannot be shown, or a widget fails to load**: That widget shows an error state that the content cannot be shown, instead of wrong or misleading content; the rest of the dashboard is not affected.
- **The dashboard as a whole cannot be shown** (its description, its layout, or a widget's settings fail the checks the Viewer host makes when it opens the dashboard): The system replaces the dashboard with a message saying it cannot be shown, never with wrong content.
- **The host does not yet support modals**: The larger view cannot be opened; the dashboard stays usable.

## 9. Acceptance Criteria

- [ ] All 9 widget kinds are available, and a dashboard can use them with data from any subject area, with no widget code from the consumer.
- [ ] Opening the Viewer host's address for a specific dashboard shows that dashboard.
- [ ] Every widget can be opened in a larger view, and the larger view offers no navigation to other widgets or items. This is checked on a host that shows modals with a modal frame, focus kept inside, and dismissal (section 2.2).
- [ ] Closing a widget's larger view returns the dashboard viewer to the unchanged dashboard.
- [ ] Skeletons show while the dashboard loads. A dashboard that fails to load shows an error banner with Retry, and a successful retry shows the dashboard.
- [ ] Each widget shows its own skeleton while its data loads. A widget whose data fails to load shows an error with Retry in that widget only, and a successful retry shows the widget. Widget data that cannot be shown produces an error state in that widget, not wrong or misleading content, and the other widgets are not affected.
- [ ] A dashboard whose description, layout, or a widget's settings fail the checks the Viewer host makes when it opens the dashboard is replaced as a whole by a message saying it cannot be shown, never by wrong content; only a widget's data that cannot be shown, or a widget that fails to load, stays in that widget.
- [ ] A dashboard that the consuming product generates is shown in the same way as one that it writes by hand, and the consuming product can check, before it shows either, whether the template can show it in full.
- [ ] A consuming product can write or generate a dashboard of its own, including the settings of its own widgets, with the published domain model; from the first stable release, breaking changes are controlled and announced.
- [ ] A complete dashboard shows within 3 seconds at p95 (provisional) under the reference conditions fixed in the DESIGN, counted from the moment the dashboard viewer opens the dashboard address.
- [ ] Switching between the light and dark theme updates the Viewer host, every shown widget, and a widget open in its larger view without a reload of the dashboard.
- [ ] Two dashboards open at the same time (for example in two browser tabs) each show only their own content.
- [ ] A table of 5,000 rows shown in the `grid` widget stays responsive while the dashboard viewer scrolls it, without paging.
- [ ] Every widget on the dashboard shows all the content that the consuming product provides for it, with nothing shortened or hidden.
- [ ] The template works with the current stable FrontX release in an application built on `template-shell`, with no other template dependency. A widget's larger view additionally works once the host supports modals (section 2.2).
- [ ] In any dashboard, the larger-view button, the larger view, and the Retry action can be operated with the keyboard alone and pass the host accessibility checks.
- [ ] The template ships a consumer guide that covers how to describe dashboards, how to check, before a dashboard is shown, whether the template can show it in full, what the consuming product's backend must provide, what the host must provide, how to add the settings of the consuming product's own widgets, and who owns dashboard and data size.
- [ ] The limitations in section 6.3 are visible in the documentation.

## 10. Dependencies

| Dependency | Description | Criticality |
|------------|-------------|-------------|
| `template-shell` | Provides the host screen area, the place where modals are shown, and the base application. The only template dependency. A widget's larger view also needs host modal support (section 2.2). | p1 |
| FrontX (the current stable FrontX release) | The application framework and the design-system look (colors, typography, spacing). | p1 |
| Consuming product backend | Provides the dashboards and the data they show. | p1 |

## 11. Assumptions

- The consuming application is built on `template-shell`.
- The current stable FrontX release offers what the template needs.
- The consuming product backend can provide the dashboards and the data they show.
- A consuming product that generates dashboards makes sure, before it shows each one, that the template can show it in full.
- `template-shell` will provide host modal support (section 2.2) before the larger view is released to consumers.
- The provisional performance budgets are a valid starting point until they are re-measured under the reference conditions fixed in the DESIGN.

## 12. Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| The download-size budget is provisional (Q1) | First-load time may exceed the provisional figures | Measure download sizes early, as the DESIGN sets out. Confirm or revise the figures from the measurements. |
| Loading states prove unclear in use | Dashboard viewers may see unclear states during loading and failure | Take the requirements in this PRD as the baseline, review the loading and failure states in use, and refine them. |
| Large dashboards from the consuming product | Initial render can exceed its budget, because the Viewer host shows whatever the consuming product provides | State in the consumer guide that the consuming product owns dashboard size and data size. Measure the initial render with the reference dashboard. |
| Host modal support is a prerequisite outside this template (section 2.2) | Until the host provides host modal support, the larger view cannot be shown | Track it as that prerequisite. State it in the consumer guide. The dashboard works without the larger view until the host supports it. |
| A generated dashboard has a problem the template cannot show | A dashboard whose description, layout, or a widget's settings fail the Viewer host's checks is replaced as a whole by the cannot-be-shown message; only a widget's data that cannot be shown, or a widget that fails to load, leaves an error state in that widget | The consumer guide states that the consuming product makes sure, before it shows a generated dashboard, that the template can show it in full. |

**Open questions**:

- **Q1 — Download-size budget.** What download-size budget applies to the Viewer host and to each widget? Owner: template architect. Status: the PRD sets the provisional figures (the Viewer host under 500 KB, each widget under 100 KB); the DESIGN sets how they are measured; they are re-measured before they become binding. Resolve before the first stable release.
