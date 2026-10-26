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
  - [5.1 Template Installation and Content](#51-template-installation-and-content)
  - [5.2 Data Loading](#52-data-loading)
  - [5.3 Dashboard Content and Widgets](#53-dashboard-content-and-widgets)
- [6. Non-Functional Requirements](#6-non-functional-requirements)
  - [6.1 NFR Inclusions](#61-nfr-inclusions)
  - [6.2 NFR Exclusions](#62-nfr-exclusions)
  - [6.3 Limitations and Known Gaps](#63-limitations-and-known-gaps)
- [7. Public Library Interfaces](#7-public-library-interfaces)
  - [7.1 Public API Surface](#71-public-api-surface)
  - [7.2 External Integration Contracts](#72-external-integration-contracts)
- [8. Use Cases](#8-use-cases)
- [9. Acceptance Criteria](#9-acceptance-criteria)
- [10. Dependencies](#10-dependencies)
- [11. Assumptions](#11-assumptions)
- [12. Risks](#12-risks)

<!-- /toc -->

## 1. Overview

### 1.1 Purpose

`template-dashboard` is a FrontX template. It adds a render-only dashboard viewer to a FrontX application that already uses `template-shell`. The consuming project's backend supplies each dashboard's definition, which is the dashboard, its layout, and the setup of each widget, including the settings that tell the backend what data the widget needs. The backend keeps only the definition. Each widget then asks the backend for its own data, based on its settings, and the backend computes that data from its own data and returns it ready to show. The viewer only displays it. The application developer does not write chart or grid code for each dashboard.

A consuming product may write its dashboards by hand or generate them. For example, a user types a request in a chat, and the consuming product generates a dashboard for it: the layout and the widgets with their settings, never the data. Generating dashboards is the consuming product's job. The template provides the dashboard types that a generated dashboard is checked against before it is shown.

The template ships four things. The first is the dashboard viewer, called the **Viewer host**. The second is a widget library with 9 widget kinds, each of which gets its own data from the backend. The third is a demo package with example content. The fourth is a catalog of dashboard types that consumers write or generate dashboards against and check them with, renamed from the earlier prototype to FrontX naming.

The template is a **render-only viewer**. The backend is the only data source, and it supplies exactly what each widget shows. The look of the dashboard, including its light and dark theme, is part of the template, not something the backend supplies. Once the widgets are rendered, nothing about the data changes: the viewer offers no filtering, no sorting, grouping, or paging, and no navigation between widgets. The layout that the backend supplies fully defines how the widgets are composed and presented. Each widget has one button that opens the same widget, with the same view and the same data, in a modal. The template takes its widget kinds from the DevExpert report-dashboard prototype (vendor `de`); the prototype's own design is not a constraint.

### 1.2 Background / Problem Statement

Teams that build cloud-project applications on FrontX often need dashboards: summary cards, grids, and charts that show how a project is doing. Each team builds these screens from scratch. The result is many one-off dashboards with different layouts and different visual quality.

The DevExpert report-dashboard prototype solved this for GitHub engineering analytics. It has a declarative dashboard model and a library of widgets. The prototype runs outside FrontX, so teams cannot reuse it directly in a FrontX application.

This template brings the viewer side of the prototype to FrontX as a render-only viewer. The consuming project decides what the dashboard shows, either by writing its definition or by generating it, and its backend sends the definition. Each widget then asks the backend for its own data, based on its settings. The viewer only renders what it receives. GitHub engineering analytics is kept only as the demo domain. It shows what a real dashboard looks like and is not the goal of the template.

### 1.3 Goals (Business Outcomes)

- A FrontX application developer can add a working dashboard viewer to an application built on `template-shell` with one template command, and the template changes no `template-shell` file. Opening a widget in a modal also needs the host application to provide a place to show modals, which is a prerequisite `template-shell` change tracked outside the template (section 11).
- A dashboard viewer sees a complete dashboard within the latency budget in section 6, with clear feedback while the dashboard and each widget load, and when loading fails. A widget whose data fails to load does not stop the other widgets from showing.
- A dashboard viewer can open any widget in a modal, with the same view and data as on the dashboard.
- A consuming project can show its own dashboards by supplying them from its backend, without changing the viewer or the widget library. This includes dashboards that the consuming project generates, for example from a user's request in a chat, which it can check against the template's dashboard types before they are shown.
- Teams that do not want example content get a clean install; teams that want it get a complete working demo with one opt-in switch.

### 1.4 Glossary

| Term | Definition |
|------|------------|
| FrontX | The application framework that applications and templates in this repository target. |
| Template | A reusable add-only overlay of files that a developer applies to a project with `frontx add`. |
| `template-shell` | The FrontX host application template. It provides the screen area where the viewer is shown and the place where modals are shown. |
| Host screen area | The part of the host application where full screens are shown. The Viewer host is shown here. |
| Host modal area | The place in the host application where modals are shown. The widget modal uses it. |
| Viewer host | The dashboard viewer screen. It loads a dashboard definition from the backend and shows its widgets. |
| Dashboard definition | The dashboard, its layout, and the setup of each widget, as supplied by the backend. The layout is part of the definition. It does not contain widget data or the theme. |
| Generated dashboard | A dashboard definition that the consuming product generates, for example from a user's request in a chat. It contains no data. |
| Widget | A single dashboard element such as a card, a grid, or a chart. It gets its own data from the backend, based on its settings. The template has 9 widget kinds. |
| Widget settings | The part of a widget's setup that tells the backend what data the widget needs. The consuming project defines what the settings mean. |
| Widget library | The set of widget kinds that the template ships. |
| Widget modal | A modal that shows one widget, with the same view and the same data as on the dashboard. |
| p95 | The 95th percentile: 95% of measured cases are at or below the stated value. |
| Demo package | The opt-in package `dashboard-demo` with a sample dashboard and static example content for it that is served locally during development. |
| Prototype | The DevExpert report-dashboard prototype (vendor `de`), the source of the widget kinds. |

## 2. Actors

> **Note**: Stakeholder needs are managed at project/task level by steering committee. Document **actors** (users, systems) that interact with this module.

### 2.1 Human Actors

#### Template Consumer

**ID**: `cpt-frontx-dashboard-actor-template-consumer`

**Role**: A FrontX application developer who applies the template to a project, chooses whether to include the demo content, and connects the viewer to the project's own backend.
**Needs**: A one-command install that does not touch `template-shell`. A clear description of what the backend must supply. A way to state which settings the project's own widgets take, so that its dashboards, including generated ones, can be checked before they are shown. Demo content that is easy to include or leave out. Widgets and dashboards that work without custom chart code.

#### Dashboard Viewer

**ID**: `cpt-frontx-dashboard-actor-dashboard-viewer`

**Role**: An end user of the consuming application who opens a dashboard to understand the state of a cloud project.
**Needs**: Fast, readable dashboards. Opening any widget in a modal to see it larger, with the same view and data. Clear feedback while the dashboard and each widget load, or when loading fails. A light or dark theme.

### 2.2 System Actors

#### Consuming Project Backend

**ID**: `cpt-frontx-dashboard-actor-consuming-backend`

**Role**: The backend of the consuming project. It is the only data source. It keeps and supplies each dashboard definition, which it may also generate, for example from a user's request in a chat. When a widget asks for its data with its settings, the backend computes that data from its own data and returns it, ready to show. It keeps no widget data for a dashboard. It does not supply the theme. The viewer and its widgets reach it through the host application's existing sign-in.

#### Host Application

**ID**: `cpt-frontx-dashboard-actor-host-application`

**Role**: `template-shell`, or an application built from it. It provides the screen area where the Viewer host is shown, the place where the widget modal is shown, and the user's sign-in. This template does not modify it. For the widget modal, the host must show modals with a modal frame, keep keyboard focus inside the open modal, and let the user dismiss it. Current `template-shell` does not yet show modals this way, so this is a prerequisite `template-shell` change tracked outside the template.

## 3. Operational Concept & Environment

> **Note**: Project-wide runtime, OS, architecture, lifecycle policy, and integration patterns defined in root PRD. Document only module-specific deviations here. **Delete this section if no special constraints.**

### 3.1 Module-Specific Environment Constraints

- The template runs only in a FrontX application that already contains `template-shell`. It has no other template dependency; nothing from `template-mfe` or its demo content is required.
- The viewer processes no data in the browser beyond rendering. All data comes from the backend.
- The target FrontX ecosystem is the `develop` line of `gears-frontx`.
- The template documentation under `template-dashboard/architecture/` is not shipped to consumers.

## 4. Scope

### 4.1 In Scope

The rule for this release is **render-only viewer**: the backend delivers the dashboard definition and each widget's data, and the viewer renders them.

- The dashboard viewer: the Viewer host, shown in the host screen area, which loads the dashboard definition from the backend and renders it.
- Per-widget data loading: each widget gets its own data from the backend once, when it is shown, by asking with its settings.
- Support for generated dashboards: the dashboard types let a consuming project check a dashboard it generates, including the settings of its own widgets, before it is shown.
- Dashboard, layout, and widget rendering exactly as supplied by the backend, with loading and error states for the dashboard and for each widget. The supplied layout fully defines how the widgets are composed and presented.
- The widget library: 9 subject-agnostic widget kinds.
- A per-widget button that opens the same widget, with the same view and data, in a modal shown in the host modal area. The host must show modals with a modal frame, focus kept inside, and dismissal; current `template-shell` does not yet do this, so it is a prerequisite `template-shell` change tracked outside the template.
- Light and dark theme, owned by the template.
- The dashboard type catalog, renamed from the prototype naming to FrontX naming.
- The demo package: opt-in example content, with GitHub engineering analytics as the demo domain, served locally without a project backend.
- The template packaging: an add-only overlay on `template-shell`.

### 4.2 Out of Scope

- Dashboard authoring and the Admin Panel.
- Generating dashboards, for example from a user's request in a chat. Generation is the consuming project's job; the template provides only the dashboard types that a generated dashboard is checked against.
- The prototype's report generation pipeline and report download.
- The frontend gateway.
- Filtering of any kind: global filters, per-widget filters, a filter panel, time-window changes, and time-bucket granularity changes.
- Grid free-text search and column filters.
- Sorting, grouping, or paging of widget content in the browser, by the user or by the viewer. Order and grouping are decided by the backend in what it supplies.
- Drill-down from one widget to another, and peer navigation between items.
- Client-side data processing, such as indexing, querying, or computing fields in the browser.
- Any change to the data after the dashboard renders, including reloading it for a new window or refreshing it in the background.
- Display limits in the viewer, such as showing only the first items or hiding parts of a widget's content. The backend supplies exactly what is shown.
- Custom cell formatting in grids, such as badges, links, or sparklines in cells. Grid cells show their values as text.
- A theme supplied by the backend.
- Behavior-level FEATURE documents beyond those that describe this render-only scope. They come in later stages.
- Changes to `template-shell` files by this template. The host modal support that the widget modal needs is a `template-shell` change tracked outside the template.
- Sign-in methods other than the host application's existing sign-in.
- Dashboard visibility, publication, sharing, and audience settings from the prototype.

## 5. Functional Requirements

> **Testing strategy**: All requirements verified via automated tests (unit, integration, e2e) targeting 90%+ code coverage unless otherwise specified. Document verification method only for non-test approaches (analysis, inspection, demonstration).

Functional requirements define WHAT the system must do. They are grouped by feature area.

### 5.1 Template Installation and Content

#### Add-Only Overlay Installation

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-fr-overlay-install`

The template **MUST** install onto a project that contains `template-shell` through `frontx add`, as an add-only overlay. The install **MUST NOT** change or remove existing `template-shell` files, and **MUST** depend on `template-shell` only.

**Rationale**: Developers need to adopt the dashboard without forking or editing the shell.

**Actors**: `cpt-frontx-dashboard-actor-template-consumer`, `cpt-frontx-dashboard-actor-host-application`

#### Opt-In Demo Content

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-fr-demo-opt-in`

The template **MUST** keep the demo package out of a normal install. The demo package **MUST** be included only when the consumer explicitly opts in at install time. The demo package **MUST** include a sample dashboard in the GitHub engineering analytics domain and static example content for it, served locally during development, so that the viewer shows the demo dashboard without a project backend. A clean install **MUST NOT** contain the static example content.

**Rationale**: Consumers who bring their own backend should not receive example code. Consumers who evaluate the template need a working dashboard at once.

**Actors**: `cpt-frontx-dashboard-actor-template-consumer`

#### Viewer Host Screen

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-fr-viewer-host`

The system **MUST** provide the Viewer host as a screen in the host application with its own address, and the address **MUST** identify the dashboard to show. The Viewer host **MUST** load that dashboard's definition from the consuming backend and render it. Dashboards open at the same time, for example in two browser tabs, **MUST** be independent and never share data.

**Rationale**: The viewer is the entry point to everything else in the template. Users need to open a specific dashboard directly and trust that each open dashboard shows only its own data.

**Actors**: `cpt-frontx-dashboard-actor-dashboard-viewer`, `cpt-frontx-dashboard-actor-host-application`

### 5.2 Data Loading

#### Backend-Delivered Dashboard and Widget Data

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-fr-backend-source`

The system **MUST** get each dashboard definition (the dashboard, its layout, and the setup of each widget) from the consuming project backend. The dashboard definition **MUST NOT** carry widget data or the theme, and the backend **MUST NOT** need to keep anything for a dashboard other than its definition. Each widget **MUST** get its own data from the consuming backend once, when it is shown, through the host application's existing sign-in, by asking with its kind and its settings; the backend computes that data from its own data at that time. The backend **MUST** be the only data source: the viewer **MUST** show the data as delivered and **MUST NOT** filter, compute, aggregate, narrow, sort, group, or page it, and **MUST NOT** hide or cut off any part of what the backend supplies for a widget. Nothing **MUST** change after the dashboard is rendered, and the viewer **MUST NOT** refresh widget data in the background. The layout that the backend supplies **MUST** fully define how the widgets are composed and presented; the viewer **MUST** render it as given. While the template is in alpha, changes to what the backend must supply are allowed and are listed in the template release notes; after the first stable release, such a change needs a major version bump.

**Rationale**: The consuming project decides what each dashboard shows and computes it where its data lives. Loading data per widget lets each widget appear and fail on its own. The viewer stays the same for every project.

**Actors**: `cpt-frontx-dashboard-actor-template-consumer`, `cpt-frontx-dashboard-actor-consuming-backend`, `cpt-frontx-dashboard-actor-host-application`

#### Loading and Error States

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-fr-loading-error-states`

The system **MUST** show skeletons in place of the dashboard while its definition loads. When the dashboard definition fails to load, the system **MUST** show an error banner with a Retry action, and a successful retry **MUST** render the dashboard. Loading and errors **MUST** then be handled per widget: each widget **MUST** show its own skeleton while its data loads; when its data fails to load, the widget **MUST** show its own error with a Retry action, and a successful retry **MUST** show the widget. When a widget's data is delivered but cannot be shown, that widget **MUST** show an error state that tells the user the content cannot be shown, and **MUST NOT** show wrong or misleading content in its place. A failing widget **MUST NOT** affect the other widgets. The dashboard and each widget load once, so there is no reloading state.

**Rationale**: Loading can be slow or can fail, for the whole dashboard or for one widget. Users must always know which is happening, where, and what they can do about it.

**Actors**: `cpt-frontx-dashboard-actor-dashboard-viewer`, `cpt-frontx-dashboard-actor-consuming-backend`

### 5.3 Dashboard Content and Widgets

#### Widget Catalog Coverage

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-fr-widget-catalog`

The system **MUST** provide a widget library with the following 9 subject-agnostic widget kinds, grouped by purpose. Kinds marked with an asterisk (\*) are not shown in the demo dashboard (see section 6.3).

- Cards: `summary_card`, `metric_card`\*, `ranked_list_card`, `progress_list_card`, `markdown_card`\*.
- Data: `grid`.
- Charts: `cartesian_chart`, `pie_chart`, `heatmap`.

The template **MUST** ship all 9 kinds ready to use, and each kind **MUST** get its own data from the consuming backend based on its settings, with no widget code from the consumer. Each kind **MUST** be usable on its own in any dashboard. A widget kind **MUST NOT** depend on the demo domain or fix the meaning of its settings, so a consumer can use the kinds with data from any subject area.

**Rationale**: A complete, domain-neutral catalog lets consumers build dashboards without writing chart or grid code.

**Actors**: `cpt-frontx-dashboard-actor-template-consumer`, `cpt-frontx-dashboard-actor-dashboard-viewer`

#### Open a Widget in a Modal

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-fr-widget-modal`

Each widget **MUST** have one button that opens the same widget, with the same view and the same data, in a modal shown in the host modal area. The template **MUST** provide the widget modal content itself and **MUST NOT** change `template-shell` files. The template **MUST** require the host to show modals with a modal frame, keyboard focus kept inside the open modal, and dismissal. Current `template-shell` does not yet show modals this way, so this is a prerequisite `template-shell` change tracked outside the template. The modal **MUST** show the same data as the widget on the dashboard; opening it **MUST NOT** refresh the data and normally does not ask the backend again. The modal **MUST NOT** offer navigation to other widgets or items. Closing the modal **MUST** return the user to the unchanged dashboard.

**Rationale**: Dense widgets such as grids and charts need more room than a dashboard tile gives.

**Actors**: `cpt-frontx-dashboard-actor-dashboard-viewer`, `cpt-frontx-dashboard-actor-host-application`

#### Grid Columns, Frozen Columns, Column Groups, Row Coloring, and Row Groups

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-fr-grid-presentation`

The system **MUST** support, on the grid widget kind, the columns that the backend supplies, columns that stay visible during horizontal scroll, grouped column headers, and row background coloring driven by a row classifier such as the team. Grid cells **MUST** show their values as text. Which columns are shown and stay visible, how column headers are grouped, and how rows are colored **MUST** be defined by what the backend supplies. When the backend supplies the rows in groups, the grid **MUST** show one heading row with the group label before the rows of each group, in the order supplied, without collapsing or reordering groups; when no groups are supplied, the grid **MUST** show a flat list. The grid **MUST** show rows in the order supplied by the backend and **MUST NOT** let the user sort, group, or page them. A grid with up to 5,000 rows **MUST** stay responsive while the user scrolls, without paging.

**Rationale**: Grids with many columns or rows are unreadable without these presentation aids. The backend decides the presentation so that every viewer sees the dashboard as supplied.

**Actors**: `cpt-frontx-dashboard-actor-dashboard-viewer`

#### Light and Dark Theme

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-fr-theme`

The system **MUST** render the viewer, the widgets, and the widget modal in a light theme and in a dark theme. The theme **MUST** be part of the template, not supplied by the backend, and the choice between light and dark **MUST** follow the host theme. A theme change **MUST** reach every shown widget, including a widget open in the modal, without a reload of the dashboard.

**Rationale**: Consistent theming keeps dashboards inside the look of the host application.

**Actors**: `cpt-frontx-dashboard-actor-dashboard-viewer`, `cpt-frontx-dashboard-actor-host-application`

#### Domain Model

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-fr-domain-model`

The system **MUST** provide the dashboard type catalog under FrontX naming, replacing the prototype naming (vendor `de`). The catalog **MUST** cover dashboards, layouts, widgets, and the data each widget shows. A dashboard **MUST** be described only by its name, description, and layout. The prototype's visibility, sharing, publication, and audience settings **MUST NOT** be part of it. The generic types **MUST** stay separate from the demo types.

**Rationale**: Consumers need FrontX-native identifiers, and a clean split lets them reuse the generic types with their own domain.

**Actors**: `cpt-frontx-dashboard-actor-template-consumer`

#### Generated Dashboards

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-fr-generated-dashboards`

The system **MUST** show a dashboard that the consuming project generates, for example from a user's request in a chat, in the same way as any other dashboard. A generated dashboard **MUST** carry only the definition, never widget data. The dashboard types **MUST** let the consuming project check a generated dashboard before it is shown, including its layout, its widgets, and their settings. A consuming project **MUST** be able to state, for its own widgets, which settings they take, so that the check also covers the settings, without changing the template's widget kinds. Making sure that what a widget is set to show, such as a grid's columns, can be produced from its settings is the consuming project's responsibility.

**Rationale**: Consuming products want to build dashboards on request instead of writing each one by hand, and a generated dashboard must be checked before a user sees it.

**Actors**: `cpt-frontx-dashboard-actor-template-consumer`, `cpt-frontx-dashboard-actor-consuming-backend`

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

The system **MUST** show the first fully rendered dashboard within the threshold below, measured from the moment the dashboard has been requested.

**Threshold**: **Provisional.** Under 3 seconds at p95, covering the loading of the dashboard definition, the loading of every widget's data, and the rendering of the layout and all widgets. The budget is carried from the prototype, which rendered data computed ahead of time; here the backend computes each widget's data when the widget asks for it. The reference conditions (reference device, network profile, and reference dashboard) are fixed in the DESIGN. The budget will be re-measured under those conditions and confirmed or revised.

**Rationale**: A slow first view undermines the value of the dashboard.

#### Large Table Responsiveness

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-nfr-large-table`

The system **MUST** keep a table of up to 5,000 rows responsive while the viewer scrolls it, with no paging.

**Threshold**: While a viewer scrolls a table of 5,000 rows, the view never stops responding for longer than 100 ms (provisional), under the reference conditions fixed in the DESIGN.

**Rationale**: Viewers want to scan and scroll through a full set of rows in one continuous table, without stepping through pages.

#### Compatibility

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-nfr-compatibility`

The template **MUST** work with the FrontX ecosystem from the `develop` line of `gears-frontx`, and **MUST** depend on `template-shell` only.

**Threshold**: A clean install on a project with `template-shell` builds with no changes to `template-shell` files. An install with the demo opt-in also builds and opens the demo dashboard. The widget modal additionally needs the host modal support (modal frame, focus kept inside, dismissal), a prerequisite `template-shell` change tracked outside the template.

**Rationale**: A narrow dependency keeps adoption cheap and upgrades predictable.

#### Bundle Size Budget (Provisional)

- [ ] `p3` - **ID**: `cpt-frontx-dashboard-nfr-bundle-budget`

The system **MUST** keep the download size of the Viewer host and of each widget within a budget, so that the first load of a dashboard stays fast. The figures are provisional; see question Q1 in section 12.

**Threshold**: **Provisional.** The Viewer host is under 500 KB gzipped, and each widget is under 100 KB gzipped, not counting the chart and grid libraries, which are measured separately. These figures come from the prototype. Every figure is re-measured on production builds and confirmed or revised; the measurement rules are in the DESIGN.

**Rationale**: A budget protects first-load time, but figures carried over from the prototype must be confirmed before they are binding.

**Verification Method**: Analysis of measured production bundle sizes per instance.

#### Accessibility

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-nfr-accessibility`

The system **MUST** follow the host application's accessibility policy in every widget and control. The widget modal button, the widget modal, and the Retry action **MUST** be operable with the keyboard alone.

**Threshold**: 100% of the 9 widget kinds and the widget modal pass the host application's accessibility checks in both themes. In the demo dashboard, opening every shown widget in the modal and closing it again can be completed with the keyboard alone.

**Rationale**: Dashboards are part of the host application, so they must be usable by the same people, including keyboard and assistive-technology users.

**Verification Method**: Inspection against the host accessibility policy, plus a keyboard-only walkthrough of the demo dashboard.

#### Consumer Documentation

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-nfr-consumer-docs`

The template **MUST** ship a consumer guide that explains what a project backend must supply for a dashboard definition and for each widget's data, how to state which settings the project's own widgets take, how to check a generated dashboard against the dashboard types, and how to enable the demo content.

**Threshold**: A developer who follows only the shipped guide can enable the demo, supply a custom dashboard from a project backend, and check a generated dashboard, without reading the template source code.

**Rationale**: What the backend must supply is the main adoption step, and the documentation under `template-dashboard/architecture/` is not shipped to consumers.

**Verification Method**: Inspection of the shipped guide, plus a walkthrough by a developer who did not build the template.

### 6.2 NFR Exclusions

- Multi-tenant isolation, role-based administration, and dashboard-delivery availability or recovery targets: the template has no server component. Authentication and tenancy belong to the host application and the consuming backend.
- Authoring usability: dashboard authoring is out of scope.
- Dashboard generation and report-pipeline performance: generating dashboards belongs to the consuming project, and there is no report pipeline in this template.
- On-prem and edge deployment portability: the template ships as source files and has no delivery edge.
- Safety and regulatory compliance: not applicable. The template is a read-only information UI that stores nothing.
- Privacy: no separate privacy NFR. The dashboard data stays in browser memory only while the viewer is open. Demo data is synthetic. The template adds no processing of personal data beyond what the consuming backend returns.
- Data volume: the consuming backend decides how much data each widget gets. The template sets no data-volume limit of its own; grid responsiveness up to 5,000 rows is covered in `cpt-frontx-dashboard-fr-grid-presentation`.
- Audit logging: not applicable at template level. The consuming application owns audit.
- Accessibility: covered as a requirement in `cpt-frontx-dashboard-nfr-accessibility`, which inherits the host application's policy.
- Internationalization and regional formats: inherited from the host. The template follows the host language setting, and number and date formatting follow the host locale.
- Supported browsers: inherited from the `template-shell` support matrix.
- Consumer documentation: covered as a requirement in `cpt-frontx-dashboard-nfr-consumer-docs`.
- Data retention and persistence: none. Nothing is stored beyond the browser session.
- Release, operations, and monitoring: not applicable. The template is a source overlay with no runtime service; the consuming application owns release and monitoring.

### 6.3 Limitations and Known Gaps

- **Two widget kinds are not in the demo.** `metric_card` and `markdown_card` exist in the widget library (marked with an asterisk in `cpt-frontx-dashboard-fr-widget-catalog`) but the demo dashboard content does not show them.
- **Nothing changes after render.** The viewer offers no filtering, search, sorting, grouping, paging, refresh, or navigation between widgets, and it does not refresh widget data in the background. To see newer data, the user reloads the page.
- **No display limits and no cell formatting.** The viewer shows exactly what the backend supplies for each widget; it does not shorten or hide content. Grid cells show their values as text, with no badges, links, or sparklines.
- **No data processing in the browser.** Everything a widget shows is computed by the consuming backend. A project whose backend cannot compute a widget's data cannot show that widget.
- **Generated dashboards are checked by the consuming project.** The template provides the dashboard types, but generating a dashboard, checking it, and making sure each widget's settings can produce what the widget is set to show are the consuming project's job. A widget whose data cannot be shown shows an error state.
- **Host sign-in only.** The viewer and its widgets reach the backend only through the host application's existing sign-in. Other sign-in methods are not supported.
- **The widget modal needs a host change.** Current `template-shell` does not yet show modals with a modal frame, focus kept inside, and dismissal. Until it does, the widget modal cannot be shown; the dashboard itself works without it.

## 7. Public Library Interfaces

The template offers consumers one public surface, the dashboard type catalog, and needs one thing from the host application. What the consuming backend supplies, the dashboard definition and each widget's data computed for its settings, is a requirement on the backend (see `cpt-frontx-dashboard-fr-backend-source`); its technical form is defined in the DESIGN.

### 7.1 Public API Surface

#### Dashboard Domain Model

- [ ] `p1` - **ID**: `cpt-frontx-dashboard-interface-domain-model`

**Type**: Data format

**Stability**: experimental

**Description**: The published descriptions of dashboards, layouts, widgets, and widget data, under FrontX naming. Consumers write or generate dashboards against it and check them with it. A consuming project can extend the widget descriptions to state which settings its own widgets take. Its structure is defined in the DESIGN.

**Breaking Change Policy**: Every type starts at version 1 and is frozen from the first stable release. A change that is not backward compatible ships as a new version of the type.

### 7.2 External Integration Contracts

#### Host Screen and Modal Areas

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-contract-host-domains`

**Direction**: required from client

**Protocol/Format**: Product-level need only: the host provides a screen area for the Viewer host and a place to show modals with a modal frame, keyboard focus kept inside, and dismissal. Current `template-shell` does not yet show modals this way, so this is a prerequisite `template-shell` change tracked outside the template. The technical form is defined in the DESIGN.

**Compatibility**: A change to the host application's internal naming does not change the product behavior of the template.

## 8. Use Cases

#### View a Dashboard and Open a Widget in the Modal

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-usecase-explore-dashboard`

**Actor**: `cpt-frontx-dashboard-actor-dashboard-viewer`

**Preconditions**:
- The template is installed and a dashboard is available. It may be one that the consuming project generated, for example from a user's request in a chat.
- The consuming backend supplies the dashboard definition and each widget's data, or the demo package serves its static example content.

**Main Flow**:
1. The viewer opens the dashboard address.
2. The system shows skeletons and requests the dashboard definition.
3. The system renders the layout and shows a skeleton in each widget.
4. Each widget requests its own data with its settings and shows it when it arrives.
5. The viewer presses the modal button of a widget.
6. The system shows the same widget, with the same view and data, in the modal.
7. The viewer closes the modal and returns to the unchanged dashboard.

**Postconditions**:
- The dashboard shows the data that the backend delivered, unchanged.

**Alternative Flows**:
- **The dashboard definition fails to load**: The system shows an error banner with a Retry action. After a successful retry, step 3 continues.
- **A widget's data fails to load**: That widget shows an error with a Retry action; the other widgets are not affected. After a successful retry, the widget shows its data.
- **A widget's data cannot be shown**: That widget shows an error state that the content cannot be shown, instead of wrong or misleading content.
- **The host does not yet support modals**: The widget modal cannot be shown; the dashboard stays usable.

#### Adopt the Template

- [ ] `p2` - **ID**: `cpt-frontx-dashboard-usecase-adopt-template`

**Actor**: `cpt-frontx-dashboard-actor-template-consumer`

**Preconditions**:
- The project contains `template-shell`.

**Main Flow**:
1. The consumer applies the template with `frontx add`.
2. The consumer optionally includes the demo content with the opt-in switch.
3. The consumer opens the demo dashboard and checks that it works.
4. The consumer supplies dashboards from the project backend, following the consumer guide.

**Postconditions**:
- The application shows dashboards from the project's own backend.

**Alternative Flows**:
- **No demo content wanted**: The consumer skips steps 2 and 3 and supplies a dashboard written against the generic types.

## 9. Acceptance Criteria

- [ ] A project with `template-shell` accepts the template through `frontx add`, and no `template-shell` file is changed.
- [ ] A normal install contains no demo content. An opted-in install contains the demo package and shows a working demo dashboard from static example content, with no project backend.
- [ ] All 9 widget kinds are available, and a dashboard can use them with data from outside the demo domain.
- [ ] Every widget in the demo dashboard has one button that opens the same widget, with the same view and data, in the modal, and the modal offers no navigation to other widgets or items. This is checked on a host that shows modals with a modal frame, focus kept inside, and dismissal.
- [ ] The widget modal shows the same data as the widget on the dashboard, and opening and closing it leaves the dashboard and its data unchanged, with no data refreshed.
- [ ] Skeletons show while the dashboard definition loads. A failed dashboard request shows an error banner with Retry, and a successful retry renders the dashboard.
- [ ] Each widget shows its own skeleton while its data loads. A failed widget data request shows an error with Retry in that widget only, and a successful retry shows the widget. Widget data that cannot be shown produces an error state in that widget, not wrong or misleading content, and the other widgets are not affected.
- [ ] The dashboard definition carries no widget data and no theme, and each widget gets its data once, by asking with its settings, with no background refresh.
- [ ] All 9 widget kinds get their own data from the backend based on their settings, with no widget code from the consumer.
- [ ] A generated dashboard can be checked against the dashboard types, including settings that the consuming project states for its own widgets, and a generated dashboard that passes the check is shown like any other dashboard.
- [ ] Initial render meets the budget in section 6, checked under the reference conditions fixed in the DESIGN.
- [ ] Switching between the light and dark theme updates the viewer, every shown widget, and a widget open in the modal without a reload of the dashboard.
- [ ] The generic dashboard types can be used to write a dashboard without the demo package installed.
- [ ] Two dashboards open at the same time (for example in two browser tabs) do not share loaded data.
- [ ] The demo dashboard shows frozen columns, grouped column headers, and row coloring in its grids, all as defined by the supplied content, with cell values shown as text.
- [ ] Grids show their rows in the order supplied by the backend, and offer no sorting, grouping, or paging. Supplied row groups show as one heading row per group in the supplied order, without collapsing; without groups, the grid shows a flat list.
- [ ] A grid with 5,000 rows stays responsive while scrolling, without paging.
- [ ] Every widget shows all the content the backend supplies for it, with nothing shortened or hidden.
- [ ] A clean install on a project with `template-shell` builds with no changes to `template-shell` files, and an install with the demo opt-in also builds and opens the demo dashboard. The widget modal additionally works once the host supports modals, a prerequisite `template-shell` change tracked outside the template.
- [ ] The widget modal button, the widget modal, and the Retry action in the demo dashboard can be operated with the keyboard alone and pass the host accessibility checks.
- [ ] The template ships a consumer guide that covers what the backend must supply for the dashboard definition and for each widget's data, stating the settings of the project's own widgets, checking a generated dashboard, and enabling the demo content.
- [ ] The limitations in section 6.3 are visible in the documentation.

## 10. Dependencies

| Dependency | Description | Criticality |
|------------|-------------|-------------|
| `template-shell` | Provides the host screen area, the place where modals are shown, the user's sign-in, and the base application. The only template dependency. The widget modal also needs host modal support, a `template-shell` change tracked outside the template. | p1 |
| FrontX ecosystem (`gears-frontx` develop) | The application framework and the design-system look (colors, typography, spacing). | p1 |
| Consuming project backend | Supplies each dashboard definition and each widget's data in real deployments. Not needed for the demo, which serves static example content locally. | p2 |
| DevExpert report-dashboard prototype | The source of the widget kinds and the budgets. | p3 |

## 11. Assumptions

- Consumers apply the template to a project that already uses `template-shell`.
- The `develop` line of `gears-frontx` offers what the viewer needs: screens with their own address, modals, and dashboards that do not share data with each other.
- The consuming backend can supply each dashboard definition and compute everything each widget shows from its own data, based on the widget's settings, and supply it ready to show when the widget asks for it.
- A consuming project that generates dashboards checks each generated dashboard against the template's dashboard types before it is shown, and makes sure each widget's settings can produce what the widget is set to show.
- `template-shell` will show modals with a modal frame, focus kept inside, and dismissal, through a change tracked outside this template, before the widget modal is released to consumers.
- The host application's existing sign-in gives the viewer access to the consuming backend.
- The performance budgets from the prototype remain a valid starting point for this template. The initial render budget now includes loading the dashboard definition and each widget's data from the backend, so it is provisional and will be re-measured under the reference conditions fixed in the DESIGN.

## 12. Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| The download-size budget is provisional (Q1) | Chart and grid libraries may be downloaded more than once per dashboard, so first-load time may exceed the provisional figures | Measure per-instance sizes on production builds early. Check whether FrontX shared-dependency reuse helps. Confirm or revise the figures from the measurements. |
| Loading states prove unclear in use (Q2) | Users may see unclear states during loading and failure | The DESIGN defines the visible states and their default wording, using the requirements in this PRD as the baseline. Review them in the demo dashboard and refine them in the feature documents. |
| Large dashboards from the consuming backend | Initial render can exceed its budget, because the viewer renders whatever the backend sends and each widget loads its own data | State in the consumer guide that the backend owns dashboard size and widget data size. Measure the initial render with the reference dashboard. |
| Host modal support is a `template-shell` change outside this template, and current `template-shell` does not yet provide it | Until the host shows modals with a modal frame, focus kept inside, and dismissal, the widget modal cannot be shown | Track it as a prerequisite `template-shell` change. State it in the consumer guide. The dashboard works without the modal until the host supports it. |
| A generated dashboard sets a widget to show something that its settings cannot produce, such as a grid column the backend does not compute | The widget shows an error state instead of its content | The consumer guide states that the consuming project checks generated dashboards against the dashboard types, including the settings of its own widgets, and keeps what each widget shows consistent with its settings. |
| Two widget kinds are not in the demo dashboard | Defects in these kinds can go unnoticed in demo testing | Test them with unit fixtures. Add them to the demo dashboard in a later stage. |

**Open questions**:

- **Q1 — Download-size budget.** What download-size budget applies to the Viewer host and to each widget? Owner: template architect. Status: provisional figures are set in the DESIGN and are re-measured on production builds before they become binding.
- **Q2 — Loading UX states.** What exactly do users see, and with what wording, while the dashboard and each widget load and when loading fails? Owner: template product owner. Status: resolved in the DESIGN; reviewed in the demo dashboard.
- **Q3 to Q6** were design-level questions and are no longer tracked in this PRD. Open design questions are tracked in the DESIGN.
