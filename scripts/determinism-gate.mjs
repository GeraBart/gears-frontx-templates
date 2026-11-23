#!/usr/bin/env node
/**
 * `scripts/determinism-gate.mjs` — the two-tier determinism gate.
 * Verifies FrontX builds are deterministic in emitted bytes and lists across build environments
 * for the same producer version and inputs.
 *
 * Tiers:
 * - `--tier=fix` — cold vs warm, serial vs parallel, shell +
 *   `_blank-mfe`, hash comparison only.
 * - `--tier=full` — all four comparisons (cold vs warm, serial vs
 *   parallel, two checkout folders, npm install vs workspace link) on
 *   the shell and every MFE, hashing every shared file, every list
 *   and the build report.
 *
 * Each comparison is its own bounded 15-minute sub-step under
 * `perl -e 'alarm 900; exec @ARGV' <cmd>` (enforced by the shared
 * `StepRunner`), reported individually; a sub-step timeout is
 * reported, not retried in a loop. The script reuses
 * `scripts/verify-dev.mjs` for builds instead of its own build loop.
 * Writes `e2e/results/determinism-gate-<ISO>.json` with
 * per-step `{step, command, exitCode, durationMs, log}` and an
 * overall `status`. Exits non-zero on fail.
 *
 * CLI: `node scripts/determinism-gate.mjs --tier=fix|full [--mfes=a,b]`
 *
 * Coordinator script — runs detached with stdin closed (`nohup node …
 * < /dev/null > <log> 2>&1 &`); every step inside it carries its own
 * 15-minute limit enforced by the StepRunner; the caller polls the
 * log and the JSON. Generic: discovers MFE fixtures by directory;
 * no package names in logic.
 *
 * It changes no package version and writes only `e2e/results/`. Unit tests
 * use tiny fake commands only, never a real run.
 */
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import process from 'node:process';

import { StepRunner, DEFAULT_TIMEOUT_MS } from './verify/StepRunner.mjs';
import { DeterminismGate } from './verify/DeterminismGate.mjs';
import { MfeFixtureDiscovery } from './verify/MfeFixtureDiscovery.mjs';

const REPO_ROOT = path.resolve(fileURLToPath(import.meta.url), '..', '..');
const RESULTS_DIR = path.join(REPO_ROOT, 'e2e', 'results');
const LOGS_DIR = path.join(RESULTS_DIR, 'logs');

const args = process.argv.slice(2);
/** @type {{ tier: 'fix' | 'full' | undefined; mfes: string[] | undefined }} */
const opts = { tier: undefined, mfes: undefined };
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a.startsWith('--tier=')) opts.tier = a.slice('--tier='.length);
  else if (a.startsWith('--mfes=')) opts.mfes = a.slice('--mfes='.length).split(',').map((s) => s.trim()).filter(Boolean);
  else if (a === '--help' || a === '-h') {
    console.log('Usage: determinism-gate.mjs --tier=fix|full [--mfes=a,b]');
    process.exit(0);
  }
}

if (opts.tier !== 'fix' && opts.tier !== 'full') {
  console.error('[determinism-gate] --tier=fix|full is required');
  process.exit(2);
}

const isEntryPoint =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isEntryPoint) {
  const stepRunner = new StepRunner({ logDir: LOGS_DIR, timeoutMs: DEFAULT_TIMEOUT_MS });
  const pinnedMfes = opts.mfes;
  const discovery = pinnedMfes !== undefined
    ? { discover: () => pinnedMfes.map((name) => path.join(REPO_ROOT, 'template-mfe', 'src-app', 'mfe_packages', name)) }
    : new MfeFixtureDiscovery({ root: REPO_ROOT });
  const mfes = discovery.discover().map((p) => path.basename(p));
  const gate = new DeterminismGate({
    tier: opts.tier,
    stepRunner,
    resultsDir: RESULTS_DIR,
    repoRoot: REPO_ROOT,
    mfes,
  });
  gate.run()
    .then(({ jsonPath, status }) => {
      console.log(`determinism-gate: status=${status} → ${jsonPath}`);
      process.exitCode = status === 'pass' ? 0 : 1;
    })
    .catch((error) => {
      console.error(`[determinism-gate] FAIL: ${error instanceof Error ? error.message : String(error)}`);
      process.exitCode = 1;
    });
}

export { DeterminismGate, StepRunner, DEFAULT_TIMEOUT_MS };
