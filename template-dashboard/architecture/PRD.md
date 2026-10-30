---
description: Product requirements for the FrontX dashboard template - a render-only dashboards root that shows the dashboards a consuming product provides, with data supplied through the product's data adapter, 9 widget types, sortable and pageable grids, a larger view where the dashboard defines one, light and dark themes, and a published domain model for describing dashboards and datasets.
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
  - [Provide a Dashboard and Replace a Widget Type](#provide-a-dashboard-and-replace-a-widget-type)
- [9. Acceptance Criteria](#9-acceptance-criteria)
- [10. Dependencies](#10-dependencies)
- [11. Assumptions](#11-assumptions)
- [12. Risks](#12-risks)

<!-- /toc -->

## 1. Overview

### 1.1 Purpose

`template-dashboard` is a FrontX template. It provides a render-only dashboards root for applications built on `template-shell`. The consuming product provides the dashboards, and the template displays them as provided. The template has no backend access of its own: the consuming product supplies a data adapter, and all dashboards and data reach the template through it. The application developer does not write chart or grid code for each dashboard, and does not write new data adapter code for each dataset, dashboard or widget.

A consuming product may write its dashboards by hand or generate them. For example, a user types a request in a chat, and the consuming product generates a dashboard for it. Generating dashboards is the consuming product's job. The template publishes a domain model that lets a consuming product check, before it shows a dashboard, whether the template can show it in full.

The template provides three things. The first is the **dashboards root**, which shows dashboards. The second is a widget library with 9 widget types. The third is the published domain model, which describes the dashboards, their data definitions and their datasets that a consuming product can provide.

The template is **render-only**. Each widget asks for the data it shows with a data definition that the dashboard defines (a markdown card has none), and the consuming product's data adapter answers it. The dashboard follows the host's light or dark theme and uses the host's design-system look; the template has no theme of its own. The dashboards root offers no filtering or searching, no grouping chosen by the viewer, no navigation between widgets, and no refresh while the dashboard is open. A dashboard, as provided, fully defines how its widgets are composed and presented. The viewer can sort grids, page them and change their page size, and can resize grid columns. A widget has a larger view only where the dashboard defines one.

### 1.2 Background / Problem Statement

Teams that build cloud-project applications on FrontX often need dashboards: summary cards, grids, and charts that show how a project is doing. Each team builds these screens from scratch. The result is many one-off dashboards with different layouts and different visual quality. Each new dataset or dashboard also tends to need new code to fetch and shape its data.

This template provides a render-only dashboards root for FrontX applications. The consuming product decides what each dashboard shows, whether it writes the dashboard or generates it, and supplies one data adapter that answers the widgets' data requests. The template only renders what it receives.

### 1.3 Goals (Business Outcomes)

- Product teams that build on FrontX get consistent dashboards without building chart or grid screens for each dashboard.
- A consuming product can support a new dataset, a new dashboard or a new template widget type that takes its data in a form the template already supports without writing new data adapter code.
- A dashboard viewer sees a complete dashboard within the initial render target (`cpt-frontx-dashboard-nfr-initial-render`), with clear feedback while data loads, while new data is requested, when there are no rows, and when something cannot be shown. A widget that cannot be shown does not affect the other widgets.
- A dashboard viewer can sort and page grids and open a larger view wherever the dashboard defines one, and sees on the dashboard what each widget's data definition asks for (`cpt-frontx-dashboard-fr-backend-source`).
- A consuming product can show the dashboards it writes or generates, for example from a user's request in a chat, without changing the dashboards root or the widget library, and can check, before it shows a dashboard, whether the template can show it in full.

Business success metrics are not set at template level. The template is a building block, and adoption is measured by the consuming products.

### 1.4 Glossary

| Term | Definition |
|------|------------|
| FrontX | The application framework that applications and templates in this repository target. |
| `template-shell` | The FrontX host application template. It provides the place where the dashboards are shown. |
| Consuming product | The product that uses this template to show its dashboards: its application built on `template-shell` and its backend. |
| Dashboards root | Whatever hosts the dashboards in the product: a screen of the application, or part of a single-page application's shell. The template does not fix which. |
| Dashboard | A screen of widgets that the consuming product provides, written or generated, and that the dashboards root displays as provided. |
| Generated dashboard | A dashboard that the consuming product generates, for example from a user's request in a chat. |
| Widget | A single dashboard element such as a card, a grid, or a chart. The template has 9 widget types. |
| Widget settings | The named choices a widget takes, with the values the consuming product sets. |
| Replacement widget | A widget that a consuming product supplies to replace how one of the template's widget types is shown. It cannot add a new widget type or new widget settings. |
| Widget library | The set of widget types that the template ships. |
| Larger view | A widget of its own, shown in a modal window over the dashboard. The dashboard defines it for a cell; it has its own settings and its own data definition. |
| Data adapter | The code that the consuming product writes once. It provides the dashboards and answers every widget's data request, using the product's backend. The template has no backend access of its own. |
| Dataset | A description of one set of data that the consuming product can provide: which measures and dimensions it offers. One dataset serves many different data definitions. |
| Measure | A number the data can report, such as a count or a percentage, with a title and a unit. |
| Dimension | A property by which measures can be grouped or ordered, such as a status or a date. |
| Data definition | What a widget shows: which measures, broken down by which dimensions, over which time range, filtered how, in which order and how many rows; the dashboard defines it per widget, and the viewer's sorting and paging change it. A widget's data definition is optional: the markdown card has none. |
| Domain model | The published description of what a dashboard can contain: dashboards, their layouts, the widget types, the data definitions, and the datasets. The consuming product describes its dashboards with it. |
| p95 | The 95th percentile: 95% of measured cases are at or below the stated value. |

## 2. Actors

### 2.1 Human Actors

#### Template Consumer

**ID**: `cpt-frontx-dashboard-actor-template-consumer`

**Role**: A FrontX application developer who connects the template to their product.
**Needs**: A description of the dashboards and datasets they can describe, and of what their data adapter must provide. To supply one data adapter that serves all dashboards. A way to replace how one of the template's widget types is shown, with their own widget for that type. Widgets and dashboards that work without custom chart code.

#### Dashboard Viewer

**ID**: `cpt-frontx-dashboard-actor-dashboard-viewer`

**Role**: An end user of the consuming application who opens a dashboard to understand the state of a cloud project.
**Needs**: Fast, readable dashboards. Sorting a grid, paging it, changing its page size and resizing its columns. Opening and closing a larger view where the dashboard defines one. Clear feedback while data loads, while new data is requested, when there are no rows, and when something cannot be shown. A dashboard that follows the host's light or dark theme.

### 2.2 System Actors

#### Consuming Product Backend

**ID**: `cpt-frontx-dashboard-actor-consuming-backend`

**Role**: The backend of the consuming product, reached only through the consuming product's data adapter. It holds the dashboards, written or generated, and the data each widget shows. The data adapter owns backend errors and access.

#### Host Application

**ID**: `cpt-frontx-dashboard-actor-host-application`

**Role**: `template-shell`, or an application built from it. It provides the place where the dashboards root is shown. For a larger view, the host is required to provide a modal window over the page that keeps keyboard focus inside while it is open, closes when the viewer clicks outside it, and closes when the larger view asks to close (section 11).

## 3. Operational Concept & Environment

### 3.1 Module-Specific Environment Constraints

- The template runs only in a FrontX application that already contains `template-shell`, and it depends on `template-shell` only.
- The template needs a FrontX platform version that supports the type-system features it relies on (GTS version 0.17).

## 4. Scope

### 4.1 In Scope

The rule is **render-only**: the consuming product provides the dashboards, and the template renders them as provided, with data that comes only through the product's data adapter.

- The dashboards root, which opens a dashboard by its address and which the product places in its application.
- Dashboards, and the data each widget shows, provided by the consuming product through its data adapter, whether it writes the dashboards or generates them.
- Rendering of each dashboard as provided, with a loader, a busy indicator, an empty state and a "cannot be shown" state. A dashboard's layout, as provided, fully defines how the widgets are composed and presented.
- The widget library: 9 subject-agnostic widget types.
- Grids that the viewer can sort and page, with a page size the viewer can change.
- A larger view where the dashboard defines one, shown in a modal window that the host provides (sections 10 and 11).
- Light and dark theme, following the host theme and the host's design-system look.
- The published domain model, which describes the dashboards, data definitions and datasets a consuming product can provide.
- A consuming product can replace how one of the template's widget types is shown, by supplying its own widget for that type.

### 4.2 Out of Scope

- Dashboard authoring. It is the consuming product's job.
- Generating dashboards, for example from a user's request in a chat. Generation is the consuming product's job; the template provides the published domain model that generated dashboards are described with.
- The data adapter implementation, and any backend binding. They belong to the consuming product.
- Report generation and report download.
- The frontend gateway.
- Filters that apply to the whole dashboard and that the viewer changes, and searching of any kind.
- Grouping of widget content chosen by the viewer. (Grouped column headings that the dashboard itself specifies are in scope.)
- New widget types defined by a consuming product, and widget settings added by a consuming product.
- Drill-down from one widget to another, and moving between items.
- Refreshing a dashboard or its data on its own while it is open.
- A way to shorten or hide widget content on the dashboard.
- Rich cell formatting in a table shown in the grid widget, such as badges, links, or sparklines in cells.
- Saving a viewer's column widths.
- Dashboard visibility, publication, sharing, and audience settings.

## 5. Functional Requirements

### 5.1 Viewing Dashboards

#### Dashboards Root

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-fr-dashboards-root`

The system **MUST** provide the dashboards root, wherever the consuming product places it in its application. The dashboards root **MUST** open the dashboard that its address identifies, so that a dashboard viewer can open a specific dashboard directly, and **MUST** show the dashboard that the consuming product provides for that address. Dashboards open at the same time, for example in two browser tabs, **MUST** each show only their own content.

**Rationale**: The dashboards root is the entry point to everything else in the template. Dashboard viewers need to open a specific dashboard directly and trust that each open dashboard shows only its own data.

**Actors**: `cpt-frontx-dashboard-actor-dashboard-viewer`, `cpt-frontx-dashboard-actor-host-application`

#### Data Adapter

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-fr-data-adapter`

The consuming product **MUST** supply one data adapter that provides its dashboards and answers the data requests of all widgets. The template **MUST** define the contract that the data adapter follows. No code **MUST** be needed for each widget, dataset, or dashboard: one data adapter serves every widget of every dashboard, on the dashboard and in a larger view.

**Rationale**: The template has no backend access of its own, so every product connects its backend in one place. A product that supports a new dataset, a new dashboard or a new template widget type that takes its data in a form the template already supports should not need to write new data adapter code.

**Actors**: `cpt-frontx-dashboard-actor-template-consumer`, `cpt-frontx-dashboard-actor-consuming-backend`

#### Dashboards and Data from the Consuming Product

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-fr-backend-source`

Data **MUST** reach the template only through the consuming product's data adapter (`cpt-frontx-dashboard-fr-data-adapter`). Each widget's data definition **MUST** decide what data the widget shows, its limits, and its paging. A dashboard that the consuming product generates, for example from a user's request in a chat, **MUST** be shown in the same way as a dashboard that it writes by hand. A widget that has a data definition **MUST** show everything it defines, with nothing shortened or hidden. A widget without a data definition, such as the markdown card, shows its own content. A markdown card **MUST** show typical markdown, in the CommonMark form with links and images, as formatted text, and **MUST** show any HTML embedded in its text as plain text, never rendered. A larger view shows what its own data definition defines. A dashboard, as provided, **MUST** fully define how its widgets are composed and presented. The template **MUST** let the consuming product check, before it shows a dashboard, whether the template can show it in full.

**Rationale**: The consuming product decides what each dashboard shows, and consuming products want to build dashboards on request instead of writing each one by hand. A dashboard viewer should see only dashboards that the template can show in full, so the consuming product needs a way to check this first. The template stays the same for every product, because only the data adapter touches the backend. Embedded HTML in a markdown card is shown as plain text so that a consuming product cannot place active content on a dashboard through a card.

**Actors**: `cpt-frontx-dashboard-actor-template-consumer`, `cpt-frontx-dashboard-actor-consuming-backend`

#### Loading, Empty and Cannot-Be-Shown States

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-fr-loading-error-states`

The system **MUST** show every state by what the dashboard viewer sees:

- **Loading.** The system **MUST** show a loader in place of the dashboard until the dashboard arrives, and a loader in a widget that shows data until its data arrives. A widget without a data definition, such as the markdown card, shows its content at once.
- **Busy.** When a widget that shows data requests data again, for example after the viewer sorts or pages a grid, the system **MUST** keep the current content visible and show a busy indicator over it until the answer arrives.
- **Empty.** When the data of a widget that shows data is valid and has no rows, the widget **MUST** show an empty state.
- **Cannot be shown.** The system **MUST** show a "cannot be shown" state at two levels, never wrong or misleading content. At the level of the whole dashboard, it replaces the dashboard when the dashboard's description or layout fails the checks the template makes when it opens the dashboard, or when the types that come with the dashboard cannot be accepted. At the level of one cell or one larger view, it replaces that cell or larger view when the widget's settings or data definition fail the checks, when the data adapter does not support the widget's data definition, when no widget can show the widget type, or when the widget fails to load.

A widget that cannot be shown, or that is waiting for data, **MUST NOT** affect the other widgets. The template shows no error message for data, and has no timeout; see section 6.3.

**Rationale**: Loading can take time, and a dashboard or a widget can be invalid. Dashboard viewers must always know which state they see, and where.

**Actors**: `cpt-frontx-dashboard-actor-dashboard-viewer`, `cpt-frontx-dashboard-actor-consuming-backend`

### 5.2 Widgets and Presentation

#### Widget Catalog Coverage

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-fr-widget-catalog`

The system **MUST** provide a widget library with the following 9 subject-agnostic widget types, grouped by purpose:

- Cards: summary card, metric card, ranked list card, progress list card, markdown card.
- Data: grid.
- Charts: cartesian chart, pie chart, heatmap.

The template **MUST** ship all 9 types ready to use, with no widget code from the consumer. Each type **MUST** be usable on its own in any dashboard. A widget type **MUST NOT** fix the meaning of its settings, so that a consumer can use the types with data from any subject area.

The widget types **MUST** support the following:

- **Grid.** Sort by a column, page, and page size (`cpt-frontx-dashboard-fr-grid-sort-page`). Leading columns that stay visible while the viewer scrolls sideways. Grouped column headings. Column alignment. Row colouring as the dashboard specifies: the dashboard assigns each coloured row a colour meaning from a defined set, and the row colours **MUST** adapt to the host's light or dark theme with readable contrast. Column resizing by the viewer, which is local and never saved.
- **Ranked list card.** A secondary value next to each item's main value.
- **Progress list card.** The current value of each item against its target.
- **Charts.** A cartesian chart can show several measures.
- **Metric card.** A trend of the value against the previous period.

**Rationale**: A complete, domain-neutral catalog lets consumers build dashboards without writing chart or grid code.

**Actors**: `cpt-frontx-dashboard-actor-template-consumer`, `cpt-frontx-dashboard-actor-dashboard-viewer`

#### Grid Sorting and Paging

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-fr-grid-sort-page`

The dashboard viewer **MUST** be able to sort a grid by a column, move between pages, and change the page size. Each of these changes **MUST** request new data. The grid **MUST** keep its current rows visible, with a busy indicator over them, until the answer arrives. The grid **MUST** always page, with a largest page size of 500 rows.

**Rationale**: Dashboard viewers need to look through a long table in an order they choose, without loading every row at once.

**Actors**: `cpt-frontx-dashboard-actor-dashboard-viewer`

#### Open a Larger View

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-fr-widget-modal`

The larger view is a widget of its own that the dashboard defines for a cell. It has its own settings and, if it shows data, its own data definition, and it is not connected to the widget in the cell. A cell that has a larger view **MUST** offer a button that opens it, shown in a modal window over the dashboard. A cell with no larger view **MUST** hide the button. The larger view **MUST** show the loader, busy, empty and "cannot be shown" states in the same way as any widget that shows data, and **MAY** itself sort and page, when it is a grid. A larger view **MUST** be closable with its own close button, and with a click outside it. Closing it **MUST** return the dashboard viewer to the unchanged dashboard. An open larger view **MUST** stay open after the page is refreshed. The template requires the host to provide the modal window described in section 11.

**Rationale**: Dense widgets such as grids and charts need more room than a dashboard cell gives, and the dashboard may want to show something different there.

**Actors**: `cpt-frontx-dashboard-actor-dashboard-viewer`, `cpt-frontx-dashboard-actor-host-application`

#### Light and Dark Theme

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-fr-theme`

The system **MUST** render the dashboards root, the widgets, and the larger view in a light theme and in a dark theme. The template **MUST NOT** have a theme of its own: the dashboard **MUST** follow the host's light or dark theme and use the host's design-system look. When the host theme is switched, every shown widget and the larger view **MUST** switch to it without reload: without reloading the page, without showing loading states again, and keeping the viewer's position on the dashboard and an open larger view.

**Rationale**: Consistent theming keeps dashboards inside the look of the host application.

**Actors**: `cpt-frontx-dashboard-actor-dashboard-viewer`, `cpt-frontx-dashboard-actor-host-application`

#### Replace How a Widget Type Is Shown

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-fr-replacement-widget`

A consuming product **MAY** replace how one of the template's widget types is shown, by supplying its own widget for that type. The system **MUST** then show the consuming product's widget for every widget of that type, in its place on the dashboard and in its larger view, and **MUST** keep showing the template's own widgets for the other types. The consuming product is then responsible for its widget keeping the larger view (`cpt-frontx-dashboard-fr-widget-modal`), following the host theme (`cpt-frontx-dashboard-fr-theme`), and the accessibility requirement (`cpt-frontx-dashboard-nfr-accessibility`), and, when the widget shows data, the loader, busy, empty, and "cannot be shown" states (`cpt-frontx-dashboard-fr-loading-error-states`). A replacement widget **MUST NOT** add new widget types or new widget settings (`cpt-frontx-dashboard-fr-domain-model`).

**Rationale**: Some consuming products need one widget type to look or behave in their own way. They can do this without waiting for a template change and without giving up the rest of the widget library.

**Actors**: `cpt-frontx-dashboard-actor-template-consumer`

### 5.3 Describing Dashboards

#### Published Domain Model

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-fr-domain-model`

The system **MUST** publish a domain model that describes what a dashboard can contain: dashboards, their layouts, the widget types, the data definitions, and the datasets with the measures and dimensions they offer. A consuming product **MUST** be able to describe the dashboards and datasets it writes or generates with it. A consuming product **MUST NOT** be able to add new widget types or its own widget settings.

**Rationale**: Consumers need a published description of the dashboards and datasets they can provide, so that they can write or generate dashboards and check that the template can show them in full.

**Actors**: `cpt-frontx-dashboard-actor-template-consumer`

## 6. Non-Functional Requirements

### 6.1 NFR Inclusions

#### Visual Quality

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-nfr-visual-quality`

The system **MUST** give all widget types one consistent look, in both light and dark themes, as measured by the threshold below.

**Threshold**: In design review, all 9 widget types look consistent with the host application in both light and dark theme, with no widget styled on its own.

**Rationale**: Dashboards are decision tools, and visual quality shapes trust in the data.

**Verification Method**: Inspection against the design-system reference, in both themes.

#### Initial Render Latency

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-nfr-initial-render`

The system **MUST** show the complete dashboard, with every widget that shows data showing its data, within the threshold below, measured from the moment the dashboard viewer opens the dashboard address.

**Threshold**: **Provisional.** Under 3 seconds at p95. The reference conditions (reference device, network profile, and reference dashboard) are fixed in the DESIGN. The threshold assumes that the consuming product's data adapter answers within those reference conditions, including the response time the DESIGN fixes; the template is not held to data adapter or backend latency beyond them. The figures are provisional and confirmed by measurement under the reference conditions.

**Rationale**: A slow first view undermines the value of the dashboard.

**Verification Method**: Measured on the reference dashboard under the reference conditions.

#### Large Table Responsiveness

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-nfr-large-table`

The system **MUST** keep one page of a table shown in the grid widget, of up to 500 rows, rendering and scrolling smoothly. The grid always pages.

**Threshold**: While a dashboard viewer scrolls a page of 500 rows shown in the grid widget, the view never stops responding for longer than 100 ms (provisional), under the reference conditions fixed in the DESIGN.

**Rationale**: Dashboard viewers scan a page of rows quickly, and a large page must not make the grid feel slow.

**Verification Method**: Measured by scrolling a 500-row page in the grid widget under the reference conditions.

#### Compatibility

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-nfr-compatibility`

The template **MUST** work on a FrontX platform version that supports the type-system features it relies on (GTS version 0.17) and shares registered type definitions across the whole application, and **MUST** depend on `template-shell` only.

**Threshold**: An application built on `template-shell`, on a FrontX platform version that supports those type-system features, shows a dashboard with the template, and the template needs no other template. A larger view additionally needs the host's modal window (section 11).

**Rationale**: A narrow dependency keeps adoption cheap and upgrades predictable.

**Verification Method**: Built and run on a FrontX platform version that supports the type-system features.

#### Download Size Budget (Provisional)

- [ ] `p3` - **ID**: `cpt-frontx-dashboard-nfr-bundle-budget`

The system **MUST** keep the download size of the dashboards root and of each widget within a budget, so that the first load of a dashboard stays fast. See question Q1 in section 12.

**Threshold**: **Provisional.** The dashboards root is under 500 KB, and each widget is under 100 KB, measured as the DESIGN sets out. The figures are provisional and confirmed by measurement.

**Rationale**: A budget protects first-load time, but provisional figures bind only when confirmed by measurement.

**Verification Method**: Analysis of download sizes measured as the DESIGN sets out.

#### Accessibility

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-nfr-accessibility`

The system **MUST** follow the host application's accessibility policy in every widget and control. The way to open the larger view, the larger view, and the grid's sort, page, page size and column resize controls **MUST** be operable with the keyboard alone. A widget **MUST NOT** convey meaning by color alone: for example, row colors and chart series also differ in another visible way or are labelled.

**Threshold**: 100% of the 9 widget types and the larger view pass the host application's accessibility checks in both themes, and no widget conveys meaning by color alone. In the reference dashboard fixed in the DESIGN, opening the larger view of every widget and closing it again, and sorting, paging, changing the page size of and resizing the columns of every grid, can be completed with the keyboard alone.

**Rationale**: Dashboards are part of the host application, so they must be usable by the same people, including keyboard and assistive-technology users.

**Verification Method**: Inspection against the host accessibility policy, plus a keyboard-only walkthrough of the reference dashboard.

#### Consumer Documentation

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-nfr-consumer-docs`

The template **MUST** ship a consumer guide that explains how to describe the dashboards and datasets a consuming product provides, the vocabulary of measures and dimensions, how to write the data adapter and what it must provide, how to check, before a dashboard is shown, whether the template can show it in full, that every viewer who may see a dashboard must be able to get the data of its widgets, that the data adapter owns backend errors and access, what the host must provide, how to replace how a widget type is shown with the consuming product's own widget and what that widget must keep (`cpt-frontx-dashboard-fr-replacement-widget`), and that the consuming product owns dashboard size and data size.

**Threshold**: A developer who follows only the shipped guide can describe a dataset and a dashboard of their own, write the data adapter that provides the dashboard and its data, check before it is shown whether the template can show it in full, know that every viewer who may see a dashboard must be able to get the data of its widgets, know that the data adapter owns backend errors and access, know what the host must provide, replace how a widget type is shown with their own widget, and know who owns dashboard and data size, without reading the template source code or its design documents.

**Rationale**: The data adapter is the main step in adopting the template, and consumers need the guide without reading the template's design documents.

**Verification Method**: Inspection of the shipped guide, plus a walkthrough by a developer who did not build the template.

### 6.2 NFR Exclusions

- Multi-tenant isolation, role-based administration, and dashboard-delivery availability or recovery targets: the template provides no backend of its own. Tenancy belongs to the host application and the consuming product.
- Authoring usability: dashboard authoring is out of scope.
- Dashboard generation and report performance: generating dashboards belongs to the consuming product, and report generation is out of scope.
- On-prem and edge deployment portability: deployment belongs to the consuming product.
- Safety and regulatory compliance: not applicable. The template is a read-only information UI.
- Privacy: no separate privacy NFR. The template adds no processing of personal data beyond what the consuming product provides.
- Data volume: the consuming product decides how much data each widget's data definition asks for. The template sets no data-volume limit of its own beyond the grid's largest page size of 500 rows; responsiveness of a page of a table shown in the grid widget is covered in `cpt-frontx-dashboard-nfr-large-table`.
- Audit logging: not applicable at template level. The consuming product owns audit.
- Accessibility: covered as a requirement in `cpt-frontx-dashboard-nfr-accessibility`, which inherits the host application's policy.
- Internationalization and regional formats: inherited from the host. The template follows the host language setting, and number and date formatting follow the host locale.
- Supported browsers: inherited from the `template-shell` support matrix.
- Device and screen-size support: inherited from the host application; no separate small-screen layout.
- Authentication and sessions: they belong to the host application and the data adapter. A viewer whose session has ended is handled by them.
- Access rules: the consuming product's data adapter and backend alone decide who may see a dashboard and the data of its widgets. The template enforces no access rules of its own.
- Consumer documentation: covered as a requirement in `cpt-frontx-dashboard-nfr-consumer-docs`.
- Data retention: no requirement, because the template only displays what the consuming product provides.
- Release, operations, and monitoring: not applicable. The consuming product owns release and monitoring.

### 6.3 Limitations and Known Gaps

- **Data that never arrives keeps the loader.** When the data adapter gives no dashboard, the dashboard area keeps its loader. When it never answers a widget's data request, that widget keeps its loader. An answer that the template cannot accept, because its data does not match what the widget asked for, counts the same as an answer that never arrives. The template shows no error message for data and has no timeout. The consuming product's data adapter owns backend errors and access, for example a dashboard that does not exist, a viewer who may not see it, or an ended session.
- **Limited changes while the dashboard is open.** The dashboards root offers no filtering, search, grouping chosen by the viewer, refresh, or navigation between widgets. A viewer can sort and page grids and resize their columns. To see newer data, the dashboard viewer reloads the page.
- **No cutting off and no rich cell formatting.** A widget that has a data definition shows everything it defines; it does not shorten or hide content. A markdown card shows typical markdown (CommonMark, with links and images) as formatted text and any embedded HTML as plain text, never rendered (`cpt-frontx-dashboard-fr-backend-source`). Cells of a table shown in the grid widget show plain text, with no badges, links, or sparklines.
- **Widgets show only what the consuming product provides.** A consuming product whose data adapter cannot provide a widget's data cannot show that widget.
- **Column widths are not saved.** A viewer's column resizing lasts only while the dashboard is open.
- **Generated dashboards are the consuming product's job.** The template publishes the domain model, but generating a dashboard and checking whether the template can show it in full are the consuming product's job. A dashboard whose description or layout fails the template's checks cannot be shown as a whole and is replaced by a "cannot be shown" message; a widget whose settings or data definition fail the checks, or that fails to load, stays in its cell or larger view, which shows "cannot be shown".
- **The larger view needs the host's modal window.** Where the host does not provide the modal window (section 11), the larger view cannot be shown; the dashboard itself works.

## 7. Public Library Interfaces

The template publishes one public surface, its domain model. It also offers two consumer-facing extension points: the data adapter that the consuming product supplies (`cpt-frontx-dashboard-fr-data-adapter`), and a widget that a consuming product can supply for one of the template's widget types (`cpt-frontx-dashboard-fr-replacement-widget`). It has two integration needs: the host application provides a place for the dashboards root and, for the larger view, a modal window, and the consuming product provides the dashboards and the data they show through its data adapter.

### 7.1 Public API Surface

#### Dashboard Domain Model

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-interface-domain-model`

**Type**: Data format

**Stability**: experimental

**Description**: A versioned way to describe the dashboards that a consuming product provides: dashboards, their layouts, the widget types, the data definitions, and the datasets with their measures and dimensions. Consumers use it to write or generate dashboards and to check, before they are shown, whether the template can show them in full. Its format and structure are defined in the DESIGN.

**Breaking Change Policy**: The stability of this interface is the one stated in its Stability field above: while it is experimental, changes are allowed and are announced in the template release notes; breaking changes are controlled and announced only when the Stability field says so. The same policy applies to the data adapter contract and to how a replacement widget connects to the template (`cpt-frontx-dashboard-fr-replacement-widget`).

### 7.2 External Integration Contracts

#### Host Place for Dashboards and the Modal Window

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-contract-host-areas`

**Direction**: required from client

**Protocol/Format**: Product-level need only: the host provides a place for the dashboards root and, for the larger view, the modal window described in section 11. The technical form is defined in the DESIGN.

**Compatibility**: Needed from `template-shell`, and from applications built from it, on a FrontX platform version that supports the type-system features the template relies on (GTS version 0.17).

#### Dashboards and Data Provided Through the Data Adapter

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-contract-consuming-backend`

**Direction**: required from client

**Protocol/Format**: Product-level need only: the consuming product's data adapter provides each dashboard, and answers the data requests of its widgets. The technical contract is defined in the DESIGN.

**Compatibility**: Follows the breaking change policy of `cpt-frontx-dashboard-interface-domain-model`.

## 8. Use Cases

### View a Dashboard

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-usecase-view-dashboard`

**Actor**: `cpt-frontx-dashboard-actor-dashboard-viewer`

**Preconditions**:
- The consuming product's data adapter provides a dashboard and answers the data requests of its widgets. The dashboard may be one that the consuming product generated, for example from a user's request in a chat.

**Main Flow**:
1. The dashboard viewer opens the dashboard address.
2. The system shows a loader while the dashboard loads.
3. The system shows the dashboard layout with a loader in each widget that shows data; a widget without a data definition, such as the markdown card, shows its content at once.
4. Each widget that shows data shows it when the data arrives.
5. Optionally, the dashboard viewer sorts a grid, pages it, or changes its page size. The grid keeps its rows visible with a busy indicator until the new rows arrive.
6. Optionally, the dashboard viewer opens a larger view where the cell has one.
7. The system shows the larger view in a modal window over the dashboard.
8. The dashboard viewer closes the larger view with its close button or with a click outside, and returns to the unchanged dashboard.

**Postconditions**:
- The dashboard shows the data that the consuming product's data adapter provided, as the widgets' data definitions asked for it.

**Alternative Flows**:
- **The dashboard as a whole is invalid** (its description or layout fails the checks the template makes when it opens the dashboard): The system replaces the whole dashboard with a "cannot be shown" message, never with wrong content.
- **A widget's settings or data definition fail the checks, the data adapter does not support the data definition, or the widget fails to load**: That cell, or that larger view, shows "cannot be shown", instead of wrong or misleading content; the other widgets are not affected.
- **The data of a widget that shows data is valid but has no rows**: The widget shows an empty state.
- **The data never arrives**: The dashboard area or the widget keeps its loader (section 6.3). The data adapter owns the backend error.
- **The cell has no larger view**: The button that opens a larger view is hidden.
- **The page is refreshed while a larger view is open**: The larger view is open again after the page loads.
- **The host does not provide the modal window**: The larger view cannot be opened; the dashboard stays usable.

### Provide a Dashboard and Replace a Widget Type

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-usecase-provide-dashboard`

**Actor**: `cpt-frontx-dashboard-actor-template-consumer`

**Preconditions**:
- The consuming application is built on `template-shell` and includes the template.
- The consuming product's backend can provide dashboards and the data their widgets show, and every viewer who may see a dashboard can get the data of its widgets (section 10).

**Main Flow**:
1. The template consumer supplies the data adapter, and describes a dataset with the published domain model.
2. The template consumer describes a dashboard with the published domain model, either by writing it or by having the consuming product generate it.
3. The consuming product checks that the template can show the dashboard in full.
4. The data adapter provides the dashboard and answers the data requests of its widgets.
5. Optionally, the template consumer supplies the consuming product's own widget for one of the template's widget types.
6. A dashboard viewer opens the dashboard address.
7. The system shows the dashboard. Every widget of the replaced type is shown with the consuming product's widget, on the dashboard and in its larger view; every other widget is shown with the template's own widget.

**Postconditions**:
- The dashboard is shown in full, with the consuming product's widget for the replaced widget type, if any.

**Alternative Flows**:
- **The check finds that the template cannot show the dashboard in full**: The consuming product does not show the dashboard; it corrects the dashboard or generates it again.
- **A dashboard that is invalid is shown anyway**: The system replaces the whole dashboard with a "cannot be shown" message (`cpt-frontx-dashboard-usecase-view-dashboard`).
- **The consuming product's widget fails to load**: That cell shows "cannot be shown"; the other widgets are not affected.
- **A new dataset, a new dashboard or a new template widget type is added**: The data adapter needs no new code for it.
- **The template consumer needs a new widget type or new widget settings**: This is not possible. The template consumer uses the template's widget types and their settings.

## 9. Acceptance Criteria

- [ ] All 9 widget types are available, and a dashboard can use them with data from any subject area, with no widget code from the consumer.
- [ ] Opening the dashboards root's address for a specific dashboard shows that dashboard, wherever the product places the dashboards root.
- [ ] The consuming product supplies one data adapter that provides its dashboards and answers the data requests of every widget. A new dataset, a new dashboard or a new template widget type needs no new data adapter code, provided the new widget type takes its data in a form the template already supports.
- [ ] Data reaches the template only through the data adapter, and each widget's data definition decides what the widget shows, its limits and its paging.
- [ ] A cell that has a larger view offers a button that opens it, in a modal window over the dashboard; a cell with no larger view hides the button. This is checked on a host that provides the modal window described in section 11.
- [ ] A larger view closes with its close button and with a click outside it, and closing it returns the dashboard viewer to the unchanged dashboard. A larger view that is open stays open after the page is refreshed. A larger view that is a grid can sort and page.
- [ ] A loader shows in place of the dashboard until it arrives, and each widget that shows data shows a loader until its data arrives. A widget without a data definition, such as the markdown card, shows its content at once.
- [ ] When a widget that shows data requests data again, its current content stays visible with a busy indicator until the answer arrives.
- [ ] A widget that shows data and has valid data with no rows shows an empty state.
- [ ] A dashboard whose description or layout fails the checks the template makes when it opens the dashboard is replaced as a whole by a "cannot be shown" message, never by wrong content.
- [ ] A cell or larger view whose widget settings or data definition fail the checks, whose data definition the data adapter does not support, or whose widget fails to load shows "cannot be shown", and does not affect the other widgets.
- [ ] A dashboard that the consuming product generates is shown in the same way as one that it writes by hand, and the consuming product can check, before it shows either, whether the template can show it in full.
- [ ] A consuming product can write or generate a dashboard and describe a dataset of its own with the published domain model.
- [ ] A consuming product can replace how one of the template's widget types is shown by supplying its own widget. Every widget of that type is then shown with the consuming product's widget, on the dashboard and in its larger view, and every other widget with the template's own widget.
- [ ] A consuming product cannot add new widget types or its own widget settings.
- [ ] A complete dashboard shows within 3 seconds at p95 (provisional) under the reference conditions fixed in the DESIGN, counted from the moment the dashboard viewer opens the dashboard address.
- [ ] Switching the host between the light and dark theme switches the dashboards root, every shown widget, and a widget open in its larger view without reload: the page is not reloaded, no loading states show again, and the viewer's position on the dashboard and an open larger view are kept. The dashboard uses the host's design-system look.
- [ ] Two dashboards open at the same time (for example in two browser tabs) each show only their own content.
- [ ] A dashboard viewer can sort a grid by a column, move between pages, and change the page size. Each change requests new data, and the grid keeps its current rows visible with a busy indicator until the answer arrives.
- [ ] A page of up to 500 rows shown in the grid widget renders and scrolls smoothly, and the grid always pages.
- [ ] A grid can keep its leading columns visible while the viewer scrolls sideways, show grouped column headings, align columns, and colour rows as the dashboard specifies; the row colours stay readable in both the light and the dark theme. The viewer can resize columns, and the widths are not saved.
- [ ] A ranked list card can show a secondary value, a progress list card shows the current value against a target, a cartesian chart can show several measures, and a metric card can show a trend against the previous period.
- [ ] A widget that has a data definition shows everything it defines, with nothing shortened or hidden. A widget without a data definition, such as the markdown card, shows its own content.
- [ ] A markdown card shows typical markdown (CommonMark, with links and images) as formatted text, and shows any HTML embedded in its text as plain text, never rendered.
- [ ] The template works on a FrontX platform version that supports the type-system features it relies on (GTS version 0.17), in an application built on `template-shell`, with no other template dependency. A larger view works on a host that provides the modal window (section 11).
- [ ] In any dashboard, the way to open the larger view, the larger view, and the grid's sort, page, page size and column resize controls can be operated with the keyboard alone and pass the host accessibility checks, and no widget conveys meaning by color alone.
- [ ] The template ships a consumer guide that covers how to describe dashboards and datasets, the vocabulary of measures and dimensions, how to write the data adapter and what it must provide, how to check, before a dashboard is shown, whether the template can show it in full, that every viewer who may see a dashboard must be able to get the data of its widgets, that the data adapter owns backend errors and access, what the host must provide, how to replace how a widget type is shown with the consuming product's own widget and what that widget must keep, and who owns dashboard and data size.
- [ ] The limitations in section 6.3 are visible in the documentation.

## 10. Dependencies

| Dependency | Description | Criticality |
|------------|-------------|-------------|
| `template-shell` | Provides the place where the dashboards root is shown and the base application. The only template dependency. | p1 |
| FrontX platform | The application framework and the design-system look (colors, typography, spacing). The version used supports the type-system features the template relies on (GTS version 0.17) and shares registered type definitions across the whole application. | p1 |
| Consuming product data adapter and backend | The data adapter provides the dashboards and answers the widgets' data requests, using the product's backend. Every viewer who may see a dashboard can get the data of its widgets. The data adapter owns backend errors and access. | p1 |
| Host modal window | The host application provides a modal window over the page that keeps keyboard focus inside while it is open, closes when the viewer clicks outside it, and closes when the larger view asks to close. Without it, the larger view cannot be shown; the rest of the dashboard works. | p2 |
| Host accessibility policy | The host application's accessibility policy and checks, which every widget and control follows (`cpt-frontx-dashboard-nfr-accessibility`). | p2 |

## 11. Assumptions

- The consuming application is built on `template-shell`.
- The FrontX platform version in use supports the type-system features the template relies on (GTS version 0.17) and shares registered type definitions across the whole application.
- The consuming product supplies a data adapter that meets its dependency in section 10: it provides the dashboards and answers the data requests of their widgets, and every viewer who may see a dashboard can get the data of its widgets.
- A consuming product that generates dashboards makes sure, before it shows each one, that the template can show it in full.
- The host application provides a modal window over the page that keeps keyboard focus inside while it is open, closes when the viewer clicks outside it, and closes when the larger view asks to close. Without it, the larger view cannot be shown; the rest of the dashboard works.
- The host application has an accessibility policy with checks that the template can follow and be measured against (section 10).
- The provisional performance budgets are confirmed by measurement under the reference conditions fixed in the DESIGN.

## 12. Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| The download-size budget is provisional (Q1) | First-load time may exceed the provisional figures | Measure download sizes early, as the DESIGN sets out. Confirm or revise the figures from the measurements. |
| Data that never arrives keeps the loader | A dashboard viewer sees a loader that never ends when the data adapter gives no answer, or an answer the template cannot accept; the template shows no error message and has no timeout | The consumer guide states that the data adapter owns backend errors and access, and that it must answer every data request with data the widget asked for. |
| Loading, busy, empty and cannot-be-shown states prove unclear in use | Dashboard viewers may see unclear states during loading | Take the requirements in this PRD as the baseline, review these states in use, and refine them. |
| Large dashboards or large answers from the consuming product | Initial render can exceed its budget, because the template shows whatever the data definitions ask for | State in the consumer guide that the consuming product owns dashboard size and data size. Measure the initial render with the reference dashboard. |
| The host's modal window is a prerequisite outside this template (section 11) | Where the host does not provide it, the larger view cannot be shown | Consumers know from the consumer guide that the larger view needs the host's modal window, and the dashboard works without the larger view. |
| A viewer of a dashboard lacks permission for the data of its widgets | Viewers without that permission see widgets that keep their loader or show "cannot be shown", depending on what the data adapter does | The consumer guide states the requirement on the consuming product's data adapter and backend (section 10), so that every viewer who may see a dashboard can get the data of its widgets. |
| A generated dashboard has a problem the template cannot show | A dashboard whose description or layout fails the template's checks is replaced as a whole by the "cannot be shown" message; a widget whose settings or data definition fail the checks, or that fails to load, shows "cannot be shown" in its cell or larger view only | The consumer guide states that the consuming product makes sure, before it shows a generated dashboard, that the template can show it in full. |

**Open questions**:

- **Q1 — Download-size budget.** What download-size budget applies to the dashboards root and to each widget? Owner: template architect. Status: the PRD sets the provisional figures (the dashboards root under 500 KB, each widget under 100 KB); the DESIGN sets how they are measured; the figures are confirmed by measurement under the reference conditions.
