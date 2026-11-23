A real build of the blank microfrontend by an older producer, kept as it was
emitted (its `mfe-manifest.json` carries `shared[]` and the older-producer
fields, no `units` or `lists`), pruned of the files no load reads
(`remoteEntry.js`, `mf-*.json`, `@mf-types*`, `index.html`).
`compat-older-producer.spec.ts` serves it next to the current shell.
