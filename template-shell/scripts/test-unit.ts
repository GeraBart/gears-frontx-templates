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
 *
 * Arguments after `--` on the command line (`npm run test:unit -- <args>`)
 * are appended to every leg, after a `--` on the `npm run` leg, so a file
 * filter or a reporter flag reaches the package lane, the app lane and every
 * workspace lane alike.
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

/** A word the shell reads as itself: no quoting, no expansion, no splitting. */
const SHELL_PLAIN = /^[A-Za-z0-9_\-.,/:@%+=]+$/;

/**
 * One argument, quoted the way a POSIX shell reads it when it is not
 * shell-plain: wrapped in single quotes, with an embedded quote written as
 * the close-escape-open sequence, so a path with a space survives the hop
 * through `shell: true` as one word.
 */
function shellQuote(argument: string): string {
  return SHELL_PLAIN.test(argument) ? argument : `'${argument.replaceAll("'", `'\\''`)}'`;
}

/**
 * The legs with the command line's own arguments appended, so
 * `npm run test:unit -- <args>` reaches every leg: a file filter or a
 * reporter flag runs on the package lane, the app lane and every workspace
 * lane alike. The `npm run` leg takes the arguments after a `--`, so npm
 * forwards them to each workspace's `test:unit` instead of reading them as
 * its own flags. No arguments, no change: the legs stay verbatim.
 */
export function legsWithArgs(legs: readonly string[], args: readonly string[]): string[] {
  if (args.length === 0) return [...legs];
  const tail = args.map(shellQuote).join(' ');
  return legs.map((leg) => (leg.startsWith('npm run ') ? `${leg} -- ${tail}` : `${leg} ${tail}`));
}

/**
 * Runs one leg and resolves to its exit code. Injectable so tests can feed a
 * fake runner instead of spawning real Vitest.
 */
export type LegRunner = (leg: string) => Promise<number>;

/**
 * Default runner: spawn the leg through the shell with inherited stdio.
 *
 * `shell: true` hands every leg string to a shell. The legs are the hardcoded
 * TEST_UNIT_LEGS literals plus the command line's own arguments, each through
 * shellQuote's POSIX single-quoting, so a metacharacter in an argument cannot
 * split into a second command: never route env- or config-supplied strings in
 * here as legs.
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
  runTestUnitLegs(legsWithArgs(TEST_UNIT_LEGS, process.argv.slice(2)), spawnLeg)
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
