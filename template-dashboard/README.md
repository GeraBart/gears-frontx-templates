# template-dashboard: development harness

This folder holds the dashboard template's architecture documents (`architecture/`) and its two packages under `src-app/mfe_packages/`: `dashboard` (the contract, the bundle schemas, the dashboard root with its runtime and cell frame, the served catalog file and a mock host) and `widgets` (the catalog widgets, their MFE lifecycles, and one Module Federation widget bundle per type under `bundles/`, built by `build-bundles.mjs`). A product team embeds a dashboard as described in [docs/embedding.md](docs/embedding.md). The `package.json` here is a development harness, not part of the template: it installs both packages as workspaces and runs their type check and tests in one place.

```bash
npm ci
npm run type-check
npm test
```

## Node, registry and rough timings

- Node: the repository root declares `"node": ">=24.14.0"` and `"npm": ">=10.0.0"` in its `engines` field, with `engine-strict=true` in its `.npmrc`. This folder has no `engines` field and no `.nvmrc` of its own. The commands in this README were run with Node 25.1.0 and npm 11.6.2.
- Registry: the lockfile resolves every package (367 of them) from the public npm registry. A user-level npmrc that points a scope such as `@gears-frontx` at a registry that is not running makes the requests for that scope wait on it (an `npm view` of a `@gears-frontx` package had not answered after 30 s). Install with a clean user config instead:

```bash
export NPM_CONFIG_USERCONFIG="$(mktemp)"
printf 'registry=https://registry.npmjs.org/\n' > "$NPM_CONFIG_USERCONFIG"
npm ci
```

- Timings: measured on one development machine that was busy with other work at the time, so take them as rough: `npm ci` took about 2 minutes (113 s), `npm run build:widgets` between about 1 and 5 minutes (52 s and 284 s in two runs), and `npm run dev:host` reported Vite ready in under a second and answered the first page request about 5 s after the command started.

## Dev preview

`preview/` is a dev-only page that mounts the dashboard area, the cell frame and the catalog widgets in a real browser, over invented, vendor-neutral demo data. It is not part of the template and no template manifest ships it. It checks layout, themes, legends, tooltips, the larger view and drill-down of the widget components by eye and with browser tools.

```bash
npm run dev:preview   # serves http://127.0.0.1:5199/
```

Query options:

- `?theme=light` or `?theme=dark` sets the kit theme; without it the page follows the system colour scheme.
- `?view=grid500` shows one grid of 500 rows on one page, mounted by the "Mount grid" button, for timing the first render, a sort and scrolling.

## Dev host

`host/` is a dev-only plain React application with no FrontX shell. It embeds the demo dashboard as a component, through the real runtime, on the mock host: the served file, the GTS registration, the widget MFEs in their shadow roots and every binding run as in a product. Its own bundle holds no widget: it loads each widget type at runtime from its bundle, which the dev server serves from `src-app/mfe_packages/widgets/dist/` under `/widgets/`. `host/widget-bundles/` holds a product widget type the host never saw, a bundle that throws while it loads and an entry whose bundle files are missing (see [docs/embedding.md](docs/embedding.md#try-it)). They are dev-only fixtures of the host app, not shipped widgets, and name their types under `frontx.test`, the namespace for test and fixture ids; a product names its own types with its own vendor segment in place of `frontx.test`.

```bash
npm run build:widgets                 # every bundle under src-app/mfe_packages/widgets/bundles, into its dist/
npm run build:widgets -- summary_card # one bundle only, after an edit that touches only that widget
npm run dev:host                      # serves http://127.0.0.1:5198/
npm run build:host && npm run preview:host   # the production build, on http://127.0.0.1:5197/
```

`build:widgets` is needed once per clone or worktree, since `dist/` is not committed, and again after a change to widget code: the dev server serves the built bundles, not the widget sources, so an edit shows only after its bundle is rebuilt. It reads the files from `dist/` on every request (`cache-control: no-store`), so a rebuilt bundle shows on the next page load without restarting `dev:host`. With the bundles built, `dev:host` draws the dashboard within a few seconds; the first page load after a fresh `npm ci` takes longer while Vite prebundles the host's dependencies. An edit to code that several widgets share (`src-app/mfe_packages/widgets/src/`) needs every affected bundle rebuilt, so the full `build:widgets` is the safe choice there. The bundles build in parallel child processes, as many at a time as the machine has cores by default, capped with `WIDGET_BUILD_JOBS` or `--jobs N` (for example `npm run build:widgets -- --jobs 2`).

Query options: `?theme=dark`, `?dashboard=<dashboard id>`, `?delay=<ms>` (the mock host's answer delay).

The page opens the "Engineering delivery" dashboard: 29 cells that use all 15 widget types (6 cartesian charts, 4 metric cards, 3 pie charts, 3 markdown cards, 2 heatmaps, 2 grids, and one each of `summary_card`, `ranked_list_card`, `progress_list_card`, `radial_progress`, `radar_chart`, `treemap_chart`, `waterfall_chart`, `funnel_chart` and `activity_feed`). One cell, "Incidents (failing API)", shows "This widget cannot be shown" with a "Try again" button on purpose: its data request fails on the mock host.
