//
// Proves the leg-running logic of scripts/test-unit.ts: every leg runs even
// when an earlier one failed, the overall exit is non-zero only when some
// leg failed, and the command line's arguments reach every leg. The runner
// is injected, so no real Vitest or npm is spawned.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { legsWithArgs, TEST_UNIT_LEGS, runTestUnitLegs } from '../scripts/test-unit.js';

describe('runTestUnitLegs', () => {
  it('runs legs two and three after the first leg fails, and exits non-zero', async () => {
    const ranLegs: string[] = [];
    const exitCode = await runTestUnitLegs(
      ['leg-one', 'leg-two', 'leg-three'],
      async (leg) => {
        ranLegs.push(leg);
        return leg === 'leg-one' ? 3 : 0;
      },
      () => undefined,
    );

    expect(ranLegs).toEqual(['leg-one', 'leg-two', 'leg-three']);
    expect(exitCode).not.toBe(0);
    expect(exitCode).toBe(1);
  });

  it('exits zero when every leg passes', async () => {
    const ranLegs: string[] = [];
    const exitCode = await runTestUnitLegs(
      ['leg-one', 'leg-two', 'leg-three'],
      async (leg) => {
        ranLegs.push(leg);
        return 0;
      },
      () => undefined,
    );

    expect(ranLegs).toEqual(['leg-one', 'leg-two', 'leg-three']);
    expect(exitCode).toBe(0);
  });

  it('exits non-zero when a later leg fails after earlier ones passed', async () => {
    const exitCode = await runTestUnitLegs(
      ['leg-one', 'leg-two'],
      async (leg) => (leg === 'leg-two' ? 2 : 0),
      () => undefined,
    );

    expect(exitCode).toBe(1);
  });

  // The summary is the run's only report of a lane the shell cannot see
  // past: with the first leg failing, its line must name that leg and its
  // exit code and the next leg must be named as passed, one line per leg,
  // in leg order.
  it('names every leg in the summary: the failed one with its exit code, then the passed one', async () => {
    const lines: string[] = [];
    const exitCode = await runTestUnitLegs(
      ['leg-one', 'leg-two'],
      async (leg) => (leg === 'leg-one' ? 3 : 0),
      (message) => lines.push(message),
    );

    expect(exitCode).toBe(1);
    expect(lines).toEqual(['[test:unit] failed (exit 3): leg-one', '[test:unit] passed (exit 0): leg-two']);
  });

  it('keeps the three package.json legs verbatim, in order', () => {
    expect(TEST_UNIT_LEGS).toEqual([
      'vitest --run --passWithNoTests=false',
      'vitest --run --config src-app/vitest.config.ts --passWithNoTests=false',
      'npm run test:unit --workspaces --if-present',
    ]);
  });
});

describe('legsWithArgs', () => {
  it('appends the arguments to every leg, after -- on the npm leg', () => {
    expect(legsWithArgs(TEST_UNIT_LEGS, ['--reporter=dot', 'src-app/__tests__/app.test.tsx'])).toEqual([
      'vitest --run --passWithNoTests=false --reporter=dot src-app/__tests__/app.test.tsx',
      'vitest --run --config src-app/vitest.config.ts --passWithNoTests=false --reporter=dot src-app/__tests__/app.test.tsx',
      'npm run test:unit --workspaces --if-present -- --reporter=dot src-app/__tests__/app.test.tsx',
    ]);
  });

  it('keeps the legs verbatim when no arguments are given', () => {
    expect(legsWithArgs(TEST_UNIT_LEGS, [])).toEqual([...TEST_UNIT_LEGS]);
  });

  it('single-quotes an argument the shell would otherwise split', () => {
    expect(legsWithArgs(['vitest --run'], ['my file.test.ts'])).toEqual(["vitest --run 'my file.test.ts'"]);
  });

  it('leaves the arguments on every leg the runner is handed', async () => {
    const ranLegs: string[] = [];
    await runTestUnitLegs(
      legsWithArgs(TEST_UNIT_LEGS, ['--reporter=dot']),
      async (leg) => {
        ranLegs.push(leg);
        return 0;
      },
      () => undefined,
    );
    expect(ranLegs).toHaveLength(TEST_UNIT_LEGS.length);
    expect(ranLegs.every((leg) => leg.endsWith('--reporter=dot'))).toBe(true);
  });
});

describe('the test:unit script wiring', () => {
  // `npm run test:unit -- <args>` only reaches the legs through the script:
  // a package.json that runs the legs itself as an && chain would drop both
  // the run-every-leg behaviour and the arguments.
  it('package.json runs test:unit through scripts/test-unit.ts', () => {
    const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as {
      scripts: Record<string, string>;
    };
    expect(manifest.scripts['test:unit']).toContain('scripts/test-unit.ts');
  });
});
