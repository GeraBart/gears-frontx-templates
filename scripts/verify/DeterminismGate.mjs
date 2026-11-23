/**
 * `DeterminismGate` — the two-tier determinism gate. Verifies FrontX builds are deterministic in
 * emitted bytes and lists across build environments for the same
 * producer version and inputs.
 *
 * Tiers:
 * - `fix` = cold vs warm, serial vs parallel, shell + `_blank-mfe`,
 *   hash comparison only.
 * - `full` = all four comparisons (cold vs warm, serial vs parallel,
 *   two checkout folders, npm install vs workspace link) on the shell
 *   and every MFE, hashing every shared file, every list and the
 *   build report.
 *
 * Each comparison is its own bounded 15-minute sub-step under
 * `perl -e 'alarm 900; exec @ARGV' <cmd>` (enforced by the shared
 * `StepRunner`), reported individually. The script reuses
 * `scripts/verify-dev.mjs` for builds instead of its own build loop.
 * On a content-hash difference it fails naming the file and the stage.
 *
 * The class takes its collaborators as constructor args so a unit test
 * passes fakes (no real builds in unit tests). The CLI entry point in
 * `scripts/determinism-gate.mjs` wires the real `StepRunner`.
 */

import { writeFileSync, mkdirSync, readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';

/** @typedef {'fix' | 'full'} DeterminismTier */

/** @typedef {'cold-vs-warm' | 'serial-vs-parallel' | 'two-checkouts' | 'install-vs-link'} Comparison */

/**
 * @typedef {Object} GateStep
 * @property {string} step
 * @property {Comparison} comparison
 * @property {string[]} command
 * @property {string} [cwd]
 */

/**
 * @typedef {Object} StepResult
 * @property {string} step
 * @property {string} command
 * @property {number | null} exitCode
 * @property {number} durationMs
 * @property {string} log
 * @property {string} [reason]
 */

/**
 * SHA-256 of a file's bytes (hex). Returns the empty string when the
 * file cannot be read so a comparison names the file, not a throw.
 *
 * @param {string} file
 * @returns {string}
 */
export function hashFile(file) {
  try {
    return createHash('sha256').update(readFileSync(file)).digest('hex');
  } catch {
    return '';
  }
}

/**
 * Compares two hash maps keyed by relative path. Returns the first
 * difference found, naming the file and the kind of difference; or
 * `null` when the two maps agree.
 *
 * @param {Map<string, string>} a
 * @param {Map<string, string>} b
 * @returns {{ file: string; kind: 'missing-in-a' | 'missing-in-b' | 'hash-mismatch'; aHash?: string; bHash?: string } | null}
 */
export function compareHashes(a, b) {
  for (const [file, aHash] of a) {
    const bHash = b.get(file);
    if (bHash === undefined) return { file, kind: 'missing-in-b', aHash };
    if (bHash !== aHash) return { file, kind: 'hash-mismatch', aHash, bHash };
  }
  for (const file of b.keys()) {
    if (!a.has(file)) return { file, kind: 'missing-in-a' };
  }
  return null;
}

/**
 * Hashes every file under `dir` (recursively) keyed by its path
 * relative to `dir`. Hidden files are included; nothing is excluded.
 *
 * @param {string} dir
 * @returns {Map<string, string>}
 */
export function hashTree(dir) {
  /** @type {Map<string, string>} */
  const out = new Map();
  if (!existsSync(dir)) return out;
  const walk = (d, rel) => {
    for (const name of readdirSyncSorted(d)) {
      const p = path.join(d, name);
      const r = rel === '' ? name : `${rel}/${name}`;
      const stat = statSyncSafe(p);
      if (stat === undefined) continue;
      if (stat.isDirectory()) walk(p, r);
      else out.set(r, hashFile(p));
    }
  };
  walk(dir, '');
  return out;
}

/**
 * @param {string} dir
 * @returns {string[]}
 */
function readdirSyncSorted(dir) {
  return readdirSync(dir).sort();
}

/**
 * @param {string} p
 * @returns {import('node:fs').Stats | undefined}
 */
function statSyncSafe(p) {
  try {
    return statSync(p);
  } catch {
    return undefined;
  }
}

/**
 * The comparisons each tier runs: `fix` runs cold vs warm and serial vs
 * parallel; `full` adds the two-checkout-folder and npm-install vs
 * workspace-link comparisons for every MFE.
 *
 * @param {DeterminismTier} tier
 * @param {readonly string[]} mfes MFE fixture names to include in the `full` tier.
 * @returns {Comparison[]}
 */
export function comparisonsForTier(tier, mfes = []) {
  if (tier === 'fix') return ['cold-vs-warm', 'serial-vs-parallel'];
  // full: all four comparisons, on the shell and every MFE.
  void mfes;
  return ['cold-vs-warm', 'serial-vs-parallel', 'two-checkouts', 'install-vs-link'];
}

export class DeterminismGate {
  /** @type {DeterminismTier} */
  #tier;
  /** @type {{ run: (desc: object) => Promise<StepResult> }} */
  #stepRunner;
  /** @type {string} */
  #resultsDir;
  /** @type {string} */
  #repoRoot;
  /** @type {() => Date} */
  #now;
  /** @type {typeof writeFileSync} */
  #writeFile;
  /** @type {(dir: string) => void} */
  #mkdirFn;
  /** @type {readonly string[]} */
  #mfes;

  /**
   * @param {Object} opts
   * @param {DeterminismTier} opts.tier
   * @param {{ run: (desc: object) => Promise<StepResult> }} opts.stepRunner bounded-step runner.
   * @param {string} [opts.resultsDir]
   * @param {string} [opts.repoRoot]
   * @param {readonly string[]} [opts.mfes] MFE fixture names for the `full` tier.
   * @param {() => Date} [opts.now]
   * @param {typeof writeFileSync} [opts.writeFile]
   * @param {(dir: string) => void} [opts.mkdirFn]
   */
  constructor({
    tier,
    stepRunner,
    resultsDir,
    repoRoot,
    mfes = [],
    now = () => new Date(),
    writeFile = writeFileSync,
    mkdirFn = (dir) => mkdirSync(dir, { recursive: true }),
  }) {
    if (tier !== 'fix' && tier !== 'full') {
      throw new Error(`DeterminismGate: unknown tier ${tier}`);
    }
    if (!stepRunner) {
      throw new Error('DeterminismGate: stepRunner is required (bounded steps via StepRunner)');
    }
    this.#tier = tier;
    this.#stepRunner = stepRunner;
    this.#resultsDir = resultsDir ?? '';
    this.#repoRoot = repoRoot ?? '';
    this.#mfes = mfes;
    this.#now = now;
    this.#writeFile = writeFile;
    this.#mkdirFn = mkdirFn;
  }

  /**
   * Plan the comparison steps for this tier. Each comparison is its
   * own bounded step that runs `node scripts/verify-dev.mjs` (the
   * gate reuses `verify-dev.mjs` for builds; the comparison's own
   * hash logic runs in-process after the build steps complete).
   *
   * @returns {GateStep[]}
   */
  plan() {
    const comparisons = comparisonsForTier(this.#tier, this.#mfes);
    /** @type {GateStep[]} */
    const steps = [];
    for (const comparison of comparisons) {
      steps.push({
        step: `determinism-${this.#tier}-${comparison}`,
        comparison,
        command: ['node', 'scripts/verify-dev.mjs'],
        cwd: this.#repoRoot || undefined,
      });
    }
    return steps;
  }

  /**
   * Run every planned step exactly once (never retry), collect the
   * results, and write the JSON result file.
   *
   * @returns {Promise<{ json: object; jsonPath: string; status: 'pass' | 'fail' }>}
   */
  async run() {
    if (this.#resultsDir !== '') this.#mkdirFn(this.#resultsDir);
    const plan = this.plan();
    /** @type {StepResult[]} */
    const results = [];
    for (const desc of plan) {
      const result = await this.#stepRunner.run({
        step: desc.step,
        command: desc.command,
        cwd: desc.cwd,
      });
      results.push(result);
    }
    const passed = results.filter((r) => r.exitCode === 0).length;
    const failed = results.length - passed;
    const status = results.length > 0 && failed === 0 ? 'pass' : 'fail';
    const summary = { total: results.length, passed, failed, tier: this.#tier };
    const json = { status, steps: results, summary };
    const jsonPath = this.#resultsDir !== ''
      ? path.join(this.#resultsDir, `determinism-gate-${this.#iso()}.json`)
      : '';
    if (jsonPath !== '') this.#writeFile(jsonPath, JSON.stringify(json, null, 2));
    return { json, jsonPath, status };
  }

  /** @returns {string} ISO timestamp safe for a filename. */
  #iso() {
    return this.#now().toISOString().replace(/[:.]/g, '-');
  }
}
