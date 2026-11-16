#!/usr/bin/env node
/*
 * Builds every widget bundle under bundles/ (or the ones named on the command
 * line) as its own Module Federation remote, into dist/<widget_type>/. The
 * bundles build in parallel: the parent spawns this same script as child
 * processes, one bundle per child (--only <type> marks a child), as many at a
 * time as WIDGET_BUILD_JOBS or --jobs N sets (N >= 1, --jobs wins), by default
 * min(DEFAULT_JOBS, os.availableParallelism(), the bundles to build): 4 at a
 * time, fewer on a machine with fewer cores or fewer bundles to build. A child
 * runs one bundle and nothing else: the vite build, then the bundle's
 * served-file part.
 * The parent buffers each child's output and writes it out whole when the
 * child ends, so the lines of two bundles never share a line, and starts no
 * new bundle once one child failed: the build then exits 1 and its last line
 * names every failed bundle. dist/widgets.json is written once, at the end,
 * only when every bundle built: the served widget list, the address of every
 * part built so far. Each bundle gets its served-file part next to it,
 * dist/<widget_type>/widget.gts.json: the manifest and the entry the FrontX
 * manifest pipeline completed from the build, with the types and instances of
 * the bundle's own served.gts.json when it has one (a widget type the template
 * does not define).
 *
 * WIDGET_BUNDLE_BASE is the address the bundles are served under, '/widgets/'
 * by default: a bundle's chunks load from <base><widget_type>/. It,
 * WIDGET_BUNDLES_DIR and WIDGET_BUNDLES_OUT pass to the children through the
 * environment.
 */
import { spawn } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, writeFileSync, writeSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = import.meta.dirname;
const script = fileURLToPath(import.meta.url);
const argv = process.argv.slice(2);
// A base written without its trailing slash still names a directory.
const base = (process.env.WIDGET_BUNDLE_BASE ?? '/widgets/').replace(/\/?$/, '/');
process.env.WIDGET_BUNDLE_BASE = base;
const bundlesDir = process.env.WIDGET_BUNDLES_DIR ? path.resolve(process.env.WIDGET_BUNDLES_DIR) : path.join(here, 'bundles');
const outDir = process.env.WIDGET_BUNDLES_OUT ? path.resolve(process.env.WIDGET_BUNDLES_OUT) : path.join(here, 'dist');
// The children read both back from the environment.
process.env.WIDGET_BUNDLES_DIR = bundlesDir;
process.env.WIDGET_BUNDLES_OUT = outDir;

// writeSync so the message survives process.exit when stderr is a pipe.
const failWith = (message) => {
  writeSync(2, `${message}\n`);
  process.exit(1);
};
const parseJobs = (value, origin) => {
  const count = Number(value);
  if (!Number.isInteger(count) || count < 1) failWith(`${origin} must be a whole number of 1 or more, got "${value}"`);
  return count;
};

// Measured on 15 bundles: 4 at a time is about 2.4 times faster than one at a time, at about a third of the memory of all at once.
const DEFAULT_JOBS = 4;

const onlyAt = argv.indexOf('--only');
if (onlyAt !== -1 && onlyAt === argv.length - 1) failWith('--only needs the type of the bundle to build');
const only = onlyAt === -1 ? undefined : argv[onlyAt + 1];

if (only !== undefined) {
  // A child: the per-bundle body, nothing else.
  const { build } = await import('vite');
  process.env.WIDGET_TYPE = only;
  await build({ configFile: path.join(here, 'vite.bundle.config.ts'), logLevel: 'warn' });
  const { manifest, entries } = JSON.parse(readFileSync(path.join(outDir, only, 'mfe-manifest.json'), 'utf-8'));
  // The served file names the manifest by id; its own `remoteEntry` field is the authoring input only.
  const { remoteEntry: _authored, ...served } = manifest;
  // A new widget type brings its own served types (and may bring a dashboard that shows it) in served.gts.json.
  const extraPath = path.join(bundlesDir, only, 'served.gts.json');
  const extra = existsSync(extraPath) ? JSON.parse(readFileSync(extraPath, 'utf-8')) : { types: [], instances: [] };
  const part = { types: extra.types ?? [], instances: [served, ...entries, ...(extra.instances ?? [])] };
  writeFileSync(path.join(outDir, only, 'widget.gts.json'), `${JSON.stringify(part, null, 2)}\n`);
  console.log(`built ${only}`);
} else {
  // The parent: one child per bundle, at most `count` children at a time.
  const named = [];
  let cap;
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--jobs') {
      if (index === argv.length - 1) failWith('--jobs needs the number of bundles to build at a time');
      index += 1;
      cap = parseJobs(argv[index], '--jobs');
    } else if (arg.startsWith('--jobs=')) {
      cap = parseJobs(arg.slice('--jobs='.length), '--jobs');
    } else if (arg.startsWith('--')) {
      failWith(`unknown option ${arg}: the parent takes --jobs N and the names of bundles to build`);
    } else {
      named.push(arg);
    }
  }
  const fromEnv = process.env.WIDGET_BUILD_JOBS?.trim();
  if (cap === undefined && fromEnv) cap = parseJobs(fromEnv, 'WIDGET_BUILD_JOBS');
  // A type named twice still builds once: two children would write one dist/<type>.
  const types = [...new Set(named.length ? named : readdirSync(bundlesDir).filter((name) => existsSync(path.join(bundlesDir, name, 'mfe.json'))))];
  const count = cap ?? Math.min(DEFAULT_JOBS, os.availableParallelism(), types.length);
  let next = 0;
  let running = 0;
  const failed = [];

  const finish = () => {
    if (failed.length) {
      console.log(`failed: ${failed.join(', ')}`);
      process.exitCode = 1;
      return;
    }
    const listed = readdirSync(outDir).filter((name) => existsSync(path.join(outDir, name, 'widget.gts.json')));
    writeFileSync(path.join(outDir, 'widgets.json'), `${JSON.stringify(listed.map((type) => `${base}${type}/widget.gts.json`), null, 2)}\n`);
  };

  const startNext = () => {
    // No new bundle starts once one failed; the ones already running end.
    while (failed.length === 0 && next < types.length && running < count) {
      const type = types[next];
      next += 1;
      running += 1;
      let child;
      try {
        child = spawn(process.execPath, [script, '--only', type], { stdio: ['ignore', 'pipe', 'pipe'] });
      } catch (error) {
        // Some errno values make spawn() throw instead of emitting 'error'
        // (ENOMEM among them): report it, count the bundle failed, and do not
        // count it as running, so the build ends with the failed summary
        // instead of crashing.
        writeSync(2, `${type}: ${error.message}\n`);
        running -= 1;
        failed.push(type);
        continue;
      }
      let out = '';
      let err = '';
      let settled = false;
      // EMFILE and ENFILE leave the child without pipes to read.
      child.stdout?.setEncoding('utf8');
      child.stderr?.setEncoding('utf8');
      child.stdout?.on('data', (chunk) => { out += chunk; });
      child.stderr?.on('data', (chunk) => { err += chunk; });
      // A child settles once, on the first of 'close' and 'error'. 'error'
      // covers the async spawn failures (EACCES, EAGAIN, EMFILE, ENFILE,
      // ENOENT): such a child may never emit 'close', so it is still counted,
      // its error recorded, and the build ends with the failed summary instead
      // of crashing on the unhandled event. Other spawn failures throw from
      // spawn() and are caught above.
      const settle = (failedRun) => {
        if (settled) return;
        settled = true;
        running -= 1;
        // A child's output goes out whole, so two bundles never share a line.
        if (out) process.stdout.write(out.endsWith('\n') ? out : `${out}\n`);
        if (err) process.stderr.write(err.endsWith('\n') ? err : `${err}\n`);
        if (failedRun) failed.push(type);
        startNext();
        if (running === 0) finish();
      };
      child.on('error', (error) => {
        err += `${type}: ${error.message}\n`;
        settle(true);
      });
      child.on('close', (code, signal) => {
        // A child the kernel killed (an OOM kill, say) closes with no code and
        // the signal: say so next to its output, and count the bundle failed.
        if (signal) err += `${type}: killed by ${signal}\n`;
        settle(code !== 0);
      });
    }
  };

  startNext();
  if (running === 0) finish();
}
