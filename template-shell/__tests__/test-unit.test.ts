//
// Proves the leg-running logic of scripts/test-unit.ts: every leg runs even
// when an earlier one failed, and the overall exit is non-zero only when some
// leg failed. The runner is injected, so no real Vitest or npm is spawned.
import { describe, expect, it } from 'vitest';

import { TEST_UNIT_LEGS, runTestUnitLegs } from '../scripts/test-unit.js';

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

  it('keeps the three package.json legs verbatim, in order', () => {
    expect(TEST_UNIT_LEGS).toEqual([
      'vitest --run --passWithNoTests=false',
      'vitest --run --config src-app/vitest.config.ts --passWithNoTests=false',
      'npm run test:unit --workspaces --if-present',
    ]);
  });
});
