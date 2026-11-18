// @vitest-environment node
/*
 * Tests for build-bundles.mjs, the widget bundle build script, at the boundary
 * it works at: a real parent run over a scratch bundles dir. The scratch dir
 * lives under node_modules/.cache of this dev harness, so node resolves react
 * the way the real bundles do and nothing a test builds lands in the real
 * bundles/ or dist/. One bundle compiles and one does not, so a failing run
 * also shows its failed: line. Every run is a real build, which takes seconds,
 * so this file is slower than the rest of the suite.
 */
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const here = path.dirname(fileURLToPath(import.meta.url));
const script = path.join(here, 'build-bundles.mjs');
// The dev harness root is three levels up from the widgets package.
const cacheRoot = path.join(here, '..', '..', '..', 'node_modules', '.cache', 'widget-build-test');
const OK = 'ok_widget';
const BROKEN = 'broken_widget';

const sleep = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); });

// pgrep -P lists the direct children of a pid: the build children the parent spawns.
const childPidsOf = (pid) => (spawnSync('pgrep', ['-P', String(pid)], { encoding: 'utf8' }).stdout ?? '')
  .split('\n')
  .filter((line) => /^\s*\d+\s*$/.test(line))
  .map((line) => Number(line.trim()));

// A pid that still names a process; a zombie is still on the process table.
const isRunning = (pid) => (spawnSync('ps', ['-o', 'stat=', '-p', String(pid)], { encoding: 'utf8' }).stdout ?? '').trim() !== '';

let scratch;

beforeAll(() => {
  scratch = mkdtempSync(path.join(cacheRoot, 'run-'));
  mkdirSync(path.join(scratch, 'bundles'), { recursive: true });
  for (const type of [OK, BROKEN]) {
    const dir = path.join(scratch, 'bundles', type);
    mkdirSync(dir, { recursive: true });
    // The real summary_card manifest with the type's own ids and expose.
    const mfe = readFileSync(path.join(here, 'bundles', 'summary_card', 'mfe.json'), 'utf-8').replaceAll('summary_card', type);
    writeFileSync(path.join(dir, 'mfe.json'), mfe);
    // The broken one does not parse, the fastest way a build fails.
    writeFileSync(path.join(dir, 'lifecycle.tsx'), type === OK ? 'export default { mount() {} };\n' : 'export default {{{\n');
  }
}, 30_000);

afterAll(() => {
  if (scratch) rmSync(scratch, { recursive: true, force: true });
});

const outPath = (...names) => path.join(scratch, 'out', ...names);

// One parent run over the scratch bundles. Every run starts from an empty out
// dir; seedWidgetsJson puts an old list in it first. onFirstChild runs once,
// when the first build child shows up in the process table. The runner's test
// env goes out: the federation plugin of the bundle build loads no plugins
// when it sees NODE_ENV=test or VITEST set, and a real shell does not set
// either.
const runBuild = ({ args = [], env = {}, seedWidgetsJson = false, onFirstChild } = {}) => {
  rmSync(outPath(), { recursive: true, force: true });
  mkdirSync(outPath(), { recursive: true });
  if (seedWidgetsJson) writeFileSync(outPath('widgets.json'), '["/widgets/stale_type/widget.gts.json"]\n');
  const childEnv = { ...process.env, WIDGET_BUNDLES_DIR: path.join(scratch, 'bundles'), WIDGET_BUNDLES_OUT: outPath(), ...env };
  for (const key of ['NODE_ENV', 'VITEST', 'JEST_WORKER_ID']) delete childEnv[key];
  return new Promise((resolve) => {
    const parent = spawn(process.execPath, [script, ...args], { env: childEnv, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    let maxChildren = 0;
    let seenFirstChild = false;
    const seen = new Set();
    parent.stdout.setEncoding('utf8');
    parent.stderr.setEncoding('utf8');
    parent.stdout.on('data', (chunk) => { stdout += chunk; });
    parent.stderr.on('data', (chunk) => { stderr += chunk; });
    const poll = setInterval(() => {
      if (parent.exitCode !== null) return;
      const pids = childPidsOf(parent.pid);
      maxChildren = Math.max(maxChildren, pids.length);
      for (const pid of pids) seen.add(pid);
      if (pids.length > 0 && !seenFirstChild) {
        seenFirstChild = true;
        if (onFirstChild) onFirstChild(parent);
      }
    }, 25);
    parent.on('close', (code, signal) => {
      clearInterval(poll);
      resolve({ code, signal, stdout, stderr, maxChildren, childPids: [...seen] });
    });
  });
};

describe('build-bundles.mjs', () => {
  it('a full build that fails exits 1, names the broken bundle and leaves no widgets.json, also over a stale one', async () => {
    const run = await runBuild({ seedWidgetsJson: true });
    expect(run.code, run.stderr).toBe(1);
    expect(run.stdout).toContain(`failed: ${BROKEN}\n`);
    expect(existsSync(outPath('widgets.json'))).toBe(false);
  }, 120_000);

  it('a run that names bundles keeps widgets.json when one of them fails', async () => {
    const run = await runBuild({ args: [BROKEN], seedWidgetsJson: true });
    expect(run.code, run.stderr).toBe(1);
    expect(run.stdout).toContain(`failed: ${BROKEN}\n`);
    expect(existsSync(outPath('widgets.json'))).toBe(true);
  }, 120_000);

  it('--jobs 1 gives that failed run with one child at a time', async () => {
    const run = await runBuild({ args: ['--jobs', '1'] });
    expect(run.code, run.stderr).toBe(1);
    expect(run.stdout).toContain(`failed: ${BROKEN}\n`);
    expect(run.maxChildren).toBe(1);
    expect(existsSync(outPath('widgets.json'))).toBe(false);
  }, 120_000);

  it('--jobs 2 gives that failed run with two children at a time', async () => {
    const run = await runBuild({ args: ['--jobs', '2'] });
    expect(run.code, run.stderr).toBe(1);
    expect(run.stdout).toContain(`failed: ${BROKEN}\n`);
    expect(run.maxChildren).toBe(2);
    expect(existsSync(outPath('widgets.json'))).toBe(false);
  }, 120_000);

  it('WIDGET_BUILD_JOBS is honoured where the default would build both at once', async () => {
    const run = await runBuild({ env: { WIDGET_BUILD_JOBS: '1' } });
    expect(run.code, run.stderr).toBe(1);
    expect(run.stdout).toContain(`failed: ${BROKEN}\n`);
    expect(run.maxChildren).toBe(1);
  }, 120_000);

  it('--jobs 0, --jobs x and a trailing --jobs fail with their messages and build nothing', async () => {
    const cases = [
      { args: ['--jobs', '0'], message: '--jobs must be a whole number of 1 or more, got "0"' },
      { args: ['--jobs', 'x'], message: '--jobs must be a whole number of 1 or more, got "x"' },
      { args: ['--jobs'], message: '--jobs needs the number of bundles to build at a time' },
    ];
    for (const { args, message } of cases) {
      const run = await runBuild({ args });
      expect(run.code, `${args.join(' ')} exits 1`).toBe(1);
      expect(run.stderr, `${args.join(' ')} explains itself`).toContain(message);
      expect(run.maxChildren, `${args.join(' ')} starts no child`).toBe(0);
      expect(existsSync(outPath('widgets.json')), `${args.join(' ')} writes no list`).toBe(false);
    }
  }, 60_000);

  it('--only is refused as an unknown option', async () => {
    const run = await runBuild({ args: ['--only', OK] });
    expect(run.code, run.stderr).toBe(1);
    expect(run.stderr).toContain('unknown option --only');
    expect(existsSync(outPath('widgets.json'))).toBe(false);
  }, 60_000);

  it('a SIGTERM to the parent ends it with exit 143 and leaves no child running', async () => {
    let signalled = false;
    const run = await runBuild({
      onFirstChild: (parent) => {
        signalled = true;
        parent.kill('SIGTERM');
      },
    });
    expect(signalled).toBe(true);
    expect(run.code, run.stderr).toBe(143);
    expect(run.childPids.length).toBeGreaterThan(0);
    const deadline = Date.now() + 10_000;
    while (run.childPids.some(isRunning) && Date.now() < deadline) await sleep(50);
    expect(run.childPids.some(isRunning)).toBe(false);
  }, 120_000);
});
