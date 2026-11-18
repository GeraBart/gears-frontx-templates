#!/usr/bin/env node
/**
 * Runs every leg of the old `test:unit` one-command chain, in order, and fails
 * at the end if any of them failed.
 *
 * `npm run` chains commands with `&&`, which stops at the first failing leg:
 * when the package lane failed, the app lane and the workspace MFE lanes never
 * ran and their failures (or passes) stayed unknown. This script keeps the
 * legs and their flags exactly as they were but always runs all of them with
 * inherited stdio, prints one summary line per leg and exits 1 when any leg
 * failed, so one run reports the state of every lane.
 */

import { spawn } from 'node:child_process';
import { isProcessEntryPoint } from './lib/entry-point.js';

/** The legs of `test:unit`, verbatim from the previous `&&` chain. */
export const TEST_UNIT_LEGS: readonly string[] = [
  'vitest --run --passWithNoTests=false',
  'vitest --run --config src-app/vitest.config.ts --passWithNoTests=false',
  'npm run test:unit --workspaces --if-present',
];

/** Prefix every summary line carries so it is easy to grep out of CI logs. */
const SUMMARY_PREFIX = '[test:unit]';

/**
 * Runs one leg and resolves to its exit code. Injectable so tests can feed a
 * fake runner instead of spawning real Vitest.
 */
export type LegRunner = (leg: string) => Promise<number>;

/**
 * Default runner: spawn the leg through the shell with inherited stdio.
 *
 * `shell: true` hands every leg string to a shell, so this stays injection
 * safe only while the legs are the hardcoded TEST_UNIT_LEGS literals: never
 * route env-, CLI- or config-supplied strings in here as legs.
 */
export function spawnLeg(leg: string): Promise<number> {
  return new Promise((resolvePromise) => {
    const child = spawn(leg, {
      shell: true,
      stdio: 'inherit',
    });
    child.on('close', (code) => {
      resolvePromise(code ?? 1);
    });
    child.on('error', (error) => {
      console.error(`${SUMMARY_PREFIX} could not start: ${error.message}`);
      resolvePromise(1);
    });
  });
}

/**
 * Run every leg in order, print one summary line per leg and return the
 * overall exit code: 0 when every leg passed, 1 when any leg failed.
 */
export async function runTestUnitLegs(
  legs: readonly string[],
  runLeg: LegRunner,
  log: (message: string) => void = console.log,
): Promise<number> {
  const exitCodes: number[] = [];

  for (const leg of legs) {
    const code = await runLeg(leg);
    exitCodes.push(code);
    log(
      code === 0
        ? `${SUMMARY_PREFIX} passed (exit 0): ${leg}`
        : `${SUMMARY_PREFIX} failed (exit ${code}): ${leg}`,
    );
  }

  return exitCodes.some((code) => code !== 0) ? 1 : 0;
}

if (isProcessEntryPoint(import.meta.url)) {
  runTestUnitLegs(TEST_UNIT_LEGS, spawnLeg)
    .then((code) => {
      // Every leg has emitted close by now, so nothing holds the event loop:
      // setting the exit code lets the last [test:unit] summary line flush to
      // a piped or redirected stdout, which process.exit() does not wait for.
      process.exitCode = code;
    })
    .catch((err: unknown) => {
      // The default runner always resolves, but the LegRunner contract allows
      // an injected one to reject: report it under the same summary prefix
      // instead of dying on an unlabeled unhandled rejection.
      console.error(
        `${SUMMARY_PREFIX} runner failed: ${err instanceof Error ? err.message : String(err)}`,
      );
      process.exitCode = 1;
    });
}
