// @vitest-environment node
/*
 * Tests for build-bundles.mjs, the widget bundle build script, at the boundary
 * it works at: a real parent run over a scratch bundles dir. The scratch dir
 * lives under node_modules/.cache of this dev harness, so node resolves react
 * the way the real bundles do and nothing a test builds lands in the real
 * bundles/ or dist/. One bundle compiles and one does not, so a failing run
 * also shows its failed: line. Every run is a real build, which takes seconds,
 * so this file runs slower than the rest of the suite.
 */
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
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
  mkdirSync(cacheRoot, { recursive: true });
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
// dir; seedWidgetsJson puts a list in it first, the given string when one is
// given and an old one-name list otherwise, and seedParts puts part
// directories of a previous build in it first, so a run that names bundles
// rewrites the list over them. onFirstChild runs once, when the first build
// child shows up in the
// process table. The runner's test
// env goes out: the federation plugin of the bundle build loads no plugins
// when it sees NODE_ENV=test or VITEST set, and a real shell does not set
// either.
const runBuild = ({ args = [], env = {}, seedWidgetsJson = false, seedParts = [], onFirstChild, outDirMissing = false } = {}) => {
  rmSync(outPath(), { recursive: true, force: true });
  mkdirSync(outPath(), { recursive: true });
  if (seedWidgetsJson) writeFileSync(outPath('widgets.json'), typeof seedWidgetsJson === 'string' ? seedWidgetsJson : '["/widgets/stale_type/widget.gts.json"]\n');
  for (const type of seedParts) {
    mkdirSync(outPath(type), { recursive: true });
    writeFileSync(outPath(type, 'widget.gts.json'), '{}\n');
  }
  if (outDirMissing) rmSync(outPath(), { recursive: true, force: true });
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

  it('the part of a built bundle carries its mfe.json schemas and then its served.gts.json types, and the list it writes is sorted', async () => {
    // One extra type in the bundle's own served.gts.json: the part lists the schemas first, then it. The scratch OK
    // bundle is shared by every test in the file, so the file comes back out when the run is done, however it ends.
    const extra = { $id: 'gts://gts.frontx.test.widget.extra.v1~', $schema: 'https://json-schema.org/draft/2020-12/schema', type: 'object' };
    const served = path.join(scratch, 'bundles', OK, 'served.gts.json');
    writeFileSync(served, `${JSON.stringify({ types: [extra], instances: [] }, null, 2)}\n`);
    try {
      // Parts a previous build left behind, eleven of them seeded in a scattered order: the rewritten list names
      // every part in the out dir, sorted, and readdirSync order is the directory's own. APFS returns the names
      // sorted anyway, so on a developer Mac the assertion holds either way; the guard bites on a file system with
      // another order (ext4 on CI), where twelve names sorted by chance have odds of 1/12!. No list is seeded, so
      // the run also covers the fallback of a build that names bundles: with no widgets.json to start from, it
      // names the part directories of the out dir.
      const run = await runBuild({ args: [OK], seedParts: ['zeta_widget', 'mu_widget', 'beta_widget', 'alpha_widget', 'kappa_widget', 'sigma_widget', 'delta_widget', 'omicron_widget', 'iota_widget', 'rho_widget', 'eta_widget'] });
      expect(run.code, run.stderr).toBe(0);
      const part = JSON.parse(readFileSync(outPath(OK, 'widget.gts.json'), 'utf-8'));
      const mfe = JSON.parse(readFileSync(path.join(scratch, 'bundles', OK, 'mfe.json'), 'utf-8'));
      expect(part.types).toEqual([...mfe.schemas, extra]);
      expect(JSON.parse(readFileSync(outPath('widgets.json'), 'utf-8'))).toEqual([
        '/widgets/alpha_widget/widget.gts.json',
        '/widgets/beta_widget/widget.gts.json',
        '/widgets/delta_widget/widget.gts.json',
        '/widgets/eta_widget/widget.gts.json',
        '/widgets/iota_widget/widget.gts.json',
        '/widgets/kappa_widget/widget.gts.json',
        '/widgets/mu_widget/widget.gts.json',
        '/widgets/ok_widget/widget.gts.json',
        '/widgets/omicron_widget/widget.gts.json',
        '/widgets/rho_widget/widget.gts.json',
        '/widgets/sigma_widget/widget.gts.json',
        '/widgets/zeta_widget/widget.gts.json',
      ]);
    } finally {
      rmSync(served, { force: true });
    }
  }, 120_000);

  it('a full build lists only the bundles it built: a stale part directory stays on disk but off the list', async () => {
    // One input bundle only: the broken bundle's mfe.json sits out of its dir for the run, so the full build
    // succeeds and writes the list. A part directory an earlier build left in the out dir, and a list that still
    // names it, are seeded first. The list the build writes names only the bundle it built, and the stale
    // directory itself stays on disk, since the build removes nothing.
    const broken = path.join(scratch, 'bundles', BROKEN, 'mfe.json');
    const aside = `${broken}.away`;
    renameSync(broken, aside);
    try {
      const run = await runBuild({
        seedWidgetsJson: '["/widgets/stale_widget/widget.gts.json"]\n',
        seedParts: ['stale_widget'],
      });
      expect(run.code, run.stderr).toBe(0);
      expect(JSON.parse(readFileSync(outPath('widgets.json'), 'utf-8'))).toEqual(['/widgets/ok_widget/widget.gts.json']);
      expect(existsSync(outPath('stale_widget'))).toBe(true);
    } finally {
      renameSync(aside, broken);
    }
  }, 120_000);

  it('a run that names bundles keeps the entries of the list it starts from and leaves a stale part directory off it', async () => {
    // The list of an earlier full build names a part of another bundles dir that is still on disk, and a stale
    // part directory the list no longer names sits in the out dir: a run that names one bundle starts from that
    // list, keeps other_part on it and adds the bundle it built, and leaves the stale directory on disk but off
    // the list, so nothing loads it.
    const run = await runBuild({ args: [OK], seedWidgetsJson: '["/widgets/other_part/widget.gts.json"]\n', seedParts: ['other_part', 'stale_widget'] });
    expect(run.code, run.stderr).toBe(0);
    expect(JSON.parse(readFileSync(outPath('widgets.json'), 'utf-8'))).toEqual([
      '/widgets/ok_widget/widget.gts.json',
      '/widgets/other_part/widget.gts.json',
    ]);
    expect(existsSync(outPath('stale_widget'))).toBe(true);
  }, 120_000);

  it('a named run over a malformed list stops with its message and leaves the list as it was', async () => {
    // Not JSON and JSON that is not an array: the run stops before the first child spawns, says how to get out, and
    // does not write the list, so the file comes back byte for byte.
    for (const content of ['not json', '{}']) {
      const run = await runBuild({ args: [OK], seedWidgetsJson: content });
      expect(run.code, run.stderr).toBe(1);
      expect(run.stderr, content).toContain('dist/widgets.json is not a list of addresses, remove it or run the full build');
      expect(run.maxChildren, content).toBe(0);
      expect(readFileSync(outPath('widgets.json'), 'utf-8'), content).toBe(content);
    }
  }, 120_000);

  it('a named run over a list under another base stops before anything builds, naming the address and the base', async () => {
    // A list a build with another WIDGET_BUNDLE_BASE wrote: no entry of it starts with the base of this run, and the
    // run says so with the first such address instead of dropping the entries without a word.
    const run = await runBuild({ args: [OK], seedWidgetsJson: '["https://cdn.example.com/w/pie_chart/widget.gts.json"]\n' });
    expect(run.code, run.stderr).toBe(1);
    expect(run.stderr).toContain('https://cdn.example.com/w/pie_chart/widget.gts.json does not start with the base /widgets/');
    expect(run.stderr).toContain('built with another WIDGET_BUNDLE_BASE? set it, or run the full build');
    expect(run.maxChildren).toBe(0);
  }, 60_000);

  it('a named run drops the entries with no part on disk and names them in one warning', async () => {
    // gone_part has no directory in the out dir and the junk entry names no part at all: both come off the list,
    // one warning names them, and the list the run writes holds only the part that is there and the bundle built.
    const run = await runBuild({ args: [OK], seedWidgetsJson: '["/widgets/gone_part/widget.gts.json","/widgets/widget.gts.json"]\n' });
    expect(run.code, run.stderr).toBe(0);
    expect(run.stdout).toContain('dropping from dist/widgets.json, not parts of this dist: /widgets/gone_part/widget.gts.json, /widgets/widget.gts.json');
    expect(JSON.parse(readFileSync(outPath('widgets.json'), 'utf-8'))).toEqual(['/widgets/ok_widget/widget.gts.json']);
  }, 120_000);

  it('a named run with no list to start from says it is listing every part directory', async () => {
    const run = await runBuild({ args: [OK], seedParts: ['other_part'] });
    expect(run.code, run.stderr).toBe(0);
    expect(run.stdout).toContain('no dist/widgets.json: listing every part directory in dist/; run the full build to drop parts no bundle builds');
    expect(JSON.parse(readFileSync(outPath('widgets.json'), 'utf-8'))).toEqual([
      '/widgets/ok_widget/widget.gts.json',
      '/widgets/other_part/widget.gts.json',
    ]);
  }, 120_000);

  it('a named build into an out dir that does not exist yet builds the bundle and lists it', async () => {
    // A fresh clone or a new WIDGET_BUNDLES_OUT: no out dir, so no dist/widgets.json and no part
    // directories either. The run starts from no previous parts, without the listing line, since
    // there is no part directory to list, and the first build by name still goes through.
    const run = await runBuild({ args: [OK], outDirMissing: true });
    expect(run.code, run.stderr).toBe(0);
    expect(run.stdout).not.toContain('no dist/widgets.json');
    expect(JSON.parse(readFileSync(outPath('widgets.json'), 'utf-8'))).toEqual(['/widgets/ok_widget/widget.gts.json']);
  }, 120_000);
});
