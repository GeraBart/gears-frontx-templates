import path from 'node:path';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it } from 'vitest';

import {
  DeterminismGate,
  hashFile,
  compareHashes,
  hashTree,
  comparisonsForTier,
} from './DeterminismGate.mjs';

/**
 * The two-tier determinism gate: compares content hashes, selects the
 * tier, and writes the JSON step records.
 */

/** @type {string | undefined} */
let rootDir;

afterEach(() => {
  if (rootDir) rmSync(rootDir, { recursive: true, force: true });
  rootDir = undefined;
});

function makeRoot() {
  rootDir = mkdtempSync(path.join(tmpdir(), 'determinism-gate-'));
  return rootDir;
}

/**
 * A fake StepRunner that records every step descriptor and returns a
 * result shaped exactly like the real StepRunner ({step, command,
 * exitCode, durationMs, log}). `exitCodes` lets a test simulate
 * failures/timeouts.
 */
function fakeStepRunner({ exitCodes = [] } = {}) {
  /** @type {any[]} */
  const recorded = [];
  let i = 0;
  const run = async (desc) => {
    recorded.push(desc);
    const exitCode = i < exitCodes.length ? exitCodes[i++] : 0;
    return {
      step: desc.step,
      command: desc.command.join(' '),
      exitCode,
      durationMs: 100,
      log: path.join('/tmp/fake-logs', `${desc.step}.log`),
    };
  };
  const calls = () => recorded;
  return { run, calls };
}

describe('DeterminismGate — hash comparison', () => {
  it('hashFile returns a SHA-256 hex digest of a file', () => {
    const root = makeRoot();
    const file = path.join(root, 'a.js');
    writeFileSync(file, 'export const x = 1;\n');
    const h = hashFile(file);
    expect(h).toMatch(/^[0-9a-f]{64}$/);
  });

  it('hashFile returns "" when the file cannot be read', () => {
    expect(hashFile(path.join(tmpdir(), 'definitely-not-a-file-xyz.js'))).toBe('');
  });

  it('hashTree hashes every file under dir keyed by relative path', () => {
    const root = makeRoot();
    mkdirSync(path.join(root, 'a'));
    writeFileSync(path.join(root, 'a', 'x.js'), 'a');
    writeFileSync(path.join(root, 'a', 'y.js'), 'b');
    const tree = hashTree(path.join(root, 'a'));
    expect([...tree.keys()].sort()).toEqual(['x.js', 'y.js']);
    expect(tree.get('x.js')).toMatch(/^[0-9a-f]{64}$/);
  });

  it('hashTree returns an empty map for a missing dir', () => {
    expect(hashTree(path.join(makeRoot(), 'missing'))).toBeInstanceOf(Map);
    expect(hashTree(path.join(makeRoot(), 'missing')).size).toBe(0);
  });

  it('compareHashes returns null when the two maps agree', () => {
    const a = new Map([['a.js', 'h1'], ['b.js', 'h2']]);
    const b = new Map([['a.js', 'h1'], ['b.js', 'h2']]);
    expect(compareHashes(a, b)).toBeNull();
  });

  it('compareHashes reports a hash-mismatch naming the file and both hashes', () => {
    const a = new Map([['a.js', 'h1']]);
    const b = new Map([['a.js', 'hX']]);
    const diff = compareHashes(a, b);
    expect(diff).toEqual({ file: 'a.js', kind: 'hash-mismatch', aHash: 'h1', bHash: 'hX' });
  });

  it('compareHashes reports a file missing in b', () => {
    const a = new Map([['a.js', 'h1'], ['b.js', 'h2']]);
    const b = new Map([['a.js', 'h1']]);
    expect(compareHashes(a, b)).toEqual({ file: 'b.js', kind: 'missing-in-b', aHash: 'h2' });
  });

  it('compareHashes reports a file missing in a', () => {
    const a = new Map([['a.js', 'h1']]);
    const b = new Map([['a.js', 'h1'], ['b.js', 'h2']]);
    expect(compareHashes(a, b)).toEqual({ file: 'b.js', kind: 'missing-in-a' });
  });
});

describe('DeterminismGate — tier selection', () => {
  it('comparisonsForTier fix = cold-vs-warm and serial-vs-parallel only', () => {
    expect(comparisonsForTier('fix')).toEqual(['cold-vs-warm', 'serial-vs-parallel']);
  });

  it('comparisonsForTier full = all four comparisons', () => {
    expect(comparisonsForTier('full')).toEqual([
      'cold-vs-warm',
      'serial-vs-parallel',
      'two-checkouts',
      'install-vs-link',
    ]);
  });

  it('the constructor rejects an unknown tier', () => {
    const sr = fakeStepRunner();
    expect(() => new DeterminismGate({ tier: 'bogus', stepRunner: sr })).toThrow(/unknown tier/);
  });

  it('the constructor rejects a missing stepRunner (the gate requires bounded steps)', () => {
    expect(() => new DeterminismGate({ tier: 'fix' })).toThrow(/stepRunner is required/);
  });
});

describe('DeterminismGate — run() JSON step format', () => {
  it('plan() emits one step per comparison, named with the tier and comparison', () => {
    const sr = fakeStepRunner();
    const gate = new DeterminismGate({ tier: 'fix', stepRunner: sr, repoRoot: '/repo' });
    const plan = gate.plan();
    expect(plan.map((p) => p.step)).toEqual([
      'determinism-fix-cold-vs-warm',
      'determinism-fix-serial-vs-parallel',
    ]);
    for (const p of plan) {
      expect(p.command).toEqual(['node', 'scripts/verify-dev.mjs']);
      expect(p.cwd).toBe('/repo');
    }
  });

  it('run() invokes the StepRunner once per planned step, and status=pass when all steps exit 0', async () => {
    const root = makeRoot();
    const resultsDir = path.join(root, 'e2e', 'results');
    const sr = fakeStepRunner();
    const fixedDate = new Date('2026-11-12T06:00:00.000Z');
    const gate = new DeterminismGate({
      tier: 'fix',
      stepRunner: sr,
      resultsDir,
      repoRoot: '/repo',
      now: () => fixedDate,
    });
    const out = await gate.run();
    expect(sr.calls()).toHaveLength(2);
    expect(out.status).toBe('pass');
    expect(out.json.status).toBe('pass');
    expect(out.json.summary).toEqual({ total: 2, passed: 2, failed: 0, tier: 'fix' });
    expect(out.json.steps).toHaveLength(2);
    // The step record shape is exactly {step, command, exitCode, durationMs, log}.
    const keys = Object.keys(out.json.steps[0]).sort();
    expect(keys).toEqual(['command', 'durationMs', 'exitCode', 'log', 'step']);
  });

  it('run() reports status=fail when any step exits non-zero (never relaunches in a loop)', async () => {
    const root = makeRoot();
    const resultsDir = path.join(root, 'e2e', 'results');
    const sr = fakeStepRunner({ exitCodes: [1, 0] });
    const gate = new DeterminismGate({
      tier: 'fix',
      stepRunner: sr,
      resultsDir,
      repoRoot: '/repo',
      now: () => new Date('2026-11-12T06:01:00.000Z'),
    });
    const out = await gate.run();
    expect(sr.calls()).toHaveLength(2);
    expect(out.status).toBe('fail');
    expect(out.json.summary.failed).toBe(1);
    expect(out.json.summary.passed).toBe(1);
  });

  it('run() writes the JSON to <resultsDir>/determinism-gate-<ISO>.json', async () => {
    const root = makeRoot();
    const resultsDir = path.join(root, 'e2e', 'results');
    const sr = fakeStepRunner();
    const fixedDate = new Date('2026-11-12T06:02:00.000Z');
    const gate = new DeterminismGate({
      tier: 'full',
      stepRunner: sr,
      resultsDir,
      repoRoot: '/repo',
      now: () => fixedDate,
    });
    const out = await gate.run();
    const expected = path.join(resultsDir, 'determinism-gate-2026-11-12T06-02-00-000Z.json');
    expect(out.jsonPath).toBe(expected);
    expect(existsSync(expected)).toBe(true);
    const written = JSON.parse(readFileSync(expected, 'utf-8'));
    expect(written.status).toBe('pass');
    expect(written.summary.tier).toBe('full');
    expect(written.steps).toHaveLength(4); // full tier = 4 comparisons
  });

  it('full tier plan() emits one step per comparison (all four)', () => {
    const sr = fakeStepRunner();
    const gate = new DeterminismGate({ tier: 'full', stepRunner: sr, repoRoot: '/repo' });
    expect(gate.plan().map((p) => p.step)).toEqual([
      'determinism-full-cold-vs-warm',
      'determinism-full-serial-vs-parallel',
      'determinism-full-two-checkouts',
      'determinism-full-install-vs-link',
    ]);
  });
});
