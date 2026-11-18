//
// Locks the rendered output of the standalone-scaffold helpers in
// `vitest.shared.ts` against the canonical constants they are built from.
// Without these assertions a drift in `TEST_INCLUDE_TSX`, `COVERAGE_EXCLUDE`,
// `COVERAGE_THRESHOLDS`, or the setup-file body could silently ship to every
// scaffolded project via `packages/cli/scripts/copy-templates.ts`.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  COVERAGE_EXCLUDE,
  COVERAGE_THRESHOLDS,
  DEFAULT_COLD_START_TIMEOUT_MS,
  DEFAULT_TEST_EXCLUDE,
  FRONTX_TEST_TIMEOUT_MS_ENV_VAR,
  HOST_SCRIPT_TEST_INCLUDE,
  TEST_INCLUDE_TSX,
  renderStandaloneMfeVitestBase,
  renderStandaloneVitestConfig,
  renderStandaloneVitestSetupFile,
  resolveFrontxTestTimeoutMs,
} from '../vitest.shared';

const HERE = path.dirname(fileURLToPath(import.meta.url));
// `vitest.setup.ts` lives inside template-shell, one level up from this
// file (template-shell/__tests__/ -> template-shell/), so the template
// stays self-contained (see the comment in vitest.shared.ts).
const SETUP_FILE_PATH = path.join(HERE, '..', 'vitest.setup.ts');

afterEach(() => {
  // The wiring test stubs the env var and re-imports the module; leave the
  // environment as the run set it.
  vi.unstubAllEnvs();
});

/**
 * Normalize CRLF → LF so byte-compare assertions work across platforms.
 * Git on Windows can check files out with CRLF line endings depending on
 * `core.autocrlf`; without normalization, a clean Windows checkout would
 * fail this test even though the rendered template is semantically
 * identical to the on-disk file. The canonical form in this repo is LF,
 * so that's what the renderer emits and what we compare against.
 */
function toLf(contents: string): string {
  return contents.replaceAll('\r\n', '\n');
}

describe('renderStandaloneVitestSetupFile', () => {
  it('matches vitest.setup.ts byte-for-byte (LF-normalized)', () => {
    const onDisk = readFileSync(SETUP_FILE_PATH, 'utf-8');
    expect(toLf(renderStandaloneVitestSetupFile())).toBe(toLf(onDisk));
  });

  it('installs an afterEach hook (smoke check)', () => {
    expect(renderStandaloneVitestSetupFile()).toContain('afterEach');
  });
});

describe('renderStandaloneVitestConfig', () => {
  const rendered = renderStandaloneVitestConfig();

  it('emits every TEST_INCLUDE_TSX glob as a string literal', () => {
    for (const glob of TEST_INCLUDE_TSX) {
      expect(rendered).toContain(JSON.stringify(glob));
    }
  });

  it('wraps DEFAULT_TEST_EXCLUDE plus src/mfe_packages/** as host-app excludes', () => {
    expect(rendered).toContain(JSON.stringify('src/mfe_packages/**'));
    for (const glob of DEFAULT_TEST_EXCLUDE) {
      expect(rendered).toContain(JSON.stringify(glob));
    }
  });

  it('emits every COVERAGE_EXCLUDE glob', () => {
    for (const glob of COVERAGE_EXCLUDE) {
      expect(rendered).toContain(JSON.stringify(glob));
    }
  });

  it('emits the shared coverage thresholds', () => {
    for (const [key, value] of Object.entries(COVERAGE_THRESHOLDS)) {
      expect(rendered).toContain(`${JSON.stringify(key)}: ${value}`);
    }
  });

  it('keeps passWithNoTests strict, jsdom env, and shared setup wiring', () => {
    expect(rendered).toContain('passWithNoTests: false');
    expect(rendered).toContain("environment: 'jsdom'");
    expect(rendered).toContain('setupFiles: [sharedSetupFile]');
    // The rendered config resolves the timeout in the scaffolded project's
    // own test run: it references the constant the embedded lookup defines,
    // never a number resolved while this template rendered.
    expect(rendered).toContain('testTimeout: COLD_START_TIMEOUT_MS');
    expect(rendered).toContain('hookTimeout: COLD_START_TIMEOUT_MS');
    expect(rendered).not.toMatch(/testTimeout: \d/);
    expect(rendered).toContain('@vitejs/plugin-react');
    expect(rendered).toContain('execArgv: vitestNodeWorkerExecArgv()');
    expect(rendered).toContain('--no-experimental-webstorage');
  });

  it('embeds a runtime lookup of the env var, not the value resolved here', () => {
    expect(rendered).toContain('const COLD_START_TIMEOUT_MS = (() => {');
    expect(rendered).toContain('process.env.FRONTX_TEST_TIMEOUT_MS');
    // The default is baked in; the env read runs at the scaffold's load time.
    expect(rendered).toContain(`return ${DEFAULT_COLD_START_TIMEOUT_MS};`);
    expect(rendered).not.toContain(`testTimeout: ${DEFAULT_COLD_START_TIMEOUT_MS}`);
  });

  it('wires the @ and @frontx-test-utils aliases used by the host Vitest config', () => {
    expect(rendered).toContain("'@': fileURLToPath(new URL('./src'");
    expect(rendered).toContain(
      "'@frontx-test-utils': fileURLToPath(new URL('./src/__test-utils__'",
    );
  });

  it('includes the host scripts/**/*.test globs so scaffolds pick up logic-heavy script tests', () => {
    for (const glob of HOST_SCRIPT_TEST_INCLUDE) {
      expect(rendered).toContain(JSON.stringify(glob));
    }
  });
});

describe('renderStandaloneMfeVitestBase', () => {
  const rendered = renderStandaloneMfeVitestBase();

  it('emits every TEST_INCLUDE_TSX glob', () => {
    for (const glob of TEST_INCLUDE_TSX) {
      expect(rendered).toContain(JSON.stringify(glob));
    }
  });

  it('emits every DEFAULT_TEST_EXCLUDE glob but does NOT bake in src/mfe_packages/**', () => {
    for (const glob of DEFAULT_TEST_EXCLUDE) {
      expect(rendered).toContain(JSON.stringify(glob));
    }
    // MFE base is scoped to an MFE package root; the host-app carve-out
    // belongs only to renderStandaloneVitestConfig.
    expect(rendered).not.toContain(JSON.stringify('src/mfe_packages/**'));
  });

  it('emits every COVERAGE_EXCLUDE glob and the shared coverage thresholds', () => {
    for (const glob of COVERAGE_EXCLUDE) {
      expect(rendered).toContain(JSON.stringify(glob));
    }
    for (const [key, value] of Object.entries(COVERAGE_THRESHOLDS)) {
      expect(rendered).toContain(`${JSON.stringify(key)}: ${value}`);
    }
  });

  it('strips vitest.shared imports and rewires shared setup locally so the module is self-contained', () => {
    expect(rendered).not.toContain('vitest.shared');
    expect(rendered).not.toContain('SHARED_VITEST_SETUP_FILES');
    expect(rendered).toContain(
      "const sharedSetupFile = path.resolve(__dirname, '../../vitest.setup.ts');",
    );
    expect(rendered).toContain('setupFiles: [sharedSetupFile]');
    expect(rendered).toContain('const COLD_START_TIMEOUT_MS = (() => {');
    expect(rendered).toContain('process.env.FRONTX_TEST_TIMEOUT_MS');
    expect(rendered).toContain('const TEST_INCLUDE_TSX = [');
    expect(rendered).toContain('const DEFAULT_TEST_EXCLUDE = [');
    expect(rendered).toContain('const COVERAGE_EXCLUDE = [');
    expect(rendered).toContain('const COVERAGE_THRESHOLDS = {');
  });

  it('exposes the mfeVitestBaseConfig plus defineMfeProject helper', () => {
    expect(rendered).toContain('export const mfeVitestBaseConfig');
    expect(rendered).toContain('export function defineMfeProject');
    expect(rendered).toContain("'@frontx-test-utils'");
    expect(rendered).toContain('passWithNoTests: false');
    expect(rendered).toContain('testTimeout: COLD_START_TIMEOUT_MS');
    expect(rendered).toContain('hookTimeout: COLD_START_TIMEOUT_MS');
    expect(rendered).toContain('execArgv: vitestNodeWorkerExecArgv()');
    expect(rendered).toContain('--no-experimental-webstorage');
  });

  it('preserves the non-shared runtime imports used by the rendered module', () => {
    // Regression guard: a too-greedy import-block regex previously swallowed
    // these imports along with the `vitest.shared` block, producing a module
    // that referenced `fileURLToPath`, `defineConfig`, `mergeConfig`, and
    // `react` without importing them.
    expect(rendered).toContain("import path from 'node:path';");
    expect(rendered).toContain("import { fileURLToPath } from 'node:url';");
    expect(rendered).toContain("import { defineConfig, mergeConfig } from 'vitest/config';");
    expect(rendered).toContain("import react from '@vitejs/plugin-react';");
  });
});

describe('resolveFrontxTestTimeoutMs', () => {
  it('keeps the default when the variable is unset', () => {
    expect(resolveFrontxTestTimeoutMs(undefined)).toBe(DEFAULT_COLD_START_TIMEOUT_MS);
    expect(DEFAULT_COLD_START_TIMEOUT_MS).toBe(30_000);
  });

  it('keeps the default when the variable is empty', () => {
    expect(resolveFrontxTestTimeoutMs('')).toBe(DEFAULT_COLD_START_TIMEOUT_MS);
  });

  it('keeps the default when the variable is whitespace only', () => {
    expect(resolveFrontxTestTimeoutMs('   ')).toBe(DEFAULT_COLD_START_TIMEOUT_MS);
    expect(resolveFrontxTestTimeoutMs('\t\n')).toBe(DEFAULT_COLD_START_TIMEOUT_MS);
  });

  it('accepts a positive integer of milliseconds', () => {
    expect(resolveFrontxTestTimeoutMs('45000')).toBe(45_000);
    expect(resolveFrontxTestTimeoutMs('1')).toBe(1);
  });

  it('accepts surrounding whitespace around a valid value', () => {
    expect(resolveFrontxTestTimeoutMs(' 45000 ')).toBe(45_000);
  });

  it('rejects zero', () => {
    expect(() => resolveFrontxTestTimeoutMs('0')).toThrow(
      `${FRONTX_TEST_TIMEOUT_MS_ENV_VAR} must be a positive integer of milliseconds`,
    );
  });

  it('rejects negative numbers', () => {
    expect(() => resolveFrontxTestTimeoutMs('-5000')).toThrow(
      `${FRONTX_TEST_TIMEOUT_MS_ENV_VAR} must be a positive integer of milliseconds`,
    );
  });

  it('rejects non-numeric values and names the variable and the value', () => {
    expect(() => resolveFrontxTestTimeoutMs('soon')).toThrow(
      `${FRONTX_TEST_TIMEOUT_MS_ENV_VAR} must be a positive integer of milliseconds`,
    );
    expect(() => resolveFrontxTestTimeoutMs('soon')).toThrow('got "soon".');
  });

  it('rejects a value above the 32-bit setTimeout maximum', () => {
    // Node clamps such timers to 1 ms with a TimeoutOverflowWarning, so a
    // user setting a huge value to mean "never time out" would instead see
    // every test time out at once: reject it at config load.
    expect(() => resolveFrontxTestTimeoutMs('2147483648')).toThrow('up to 2147483647');
    expect(resolveFrontxTestTimeoutMs('2147483647')).toBe(2_147_483_647);
  });

  it('wires the resolved value into COLD_START_TIMEOUT_MS', async () => {
    // The constant is resolved once at module load from the environment, so
    // the wiring is proven on a fresh module instance under a stubbed
    // variable - not by comparing the constant with the same function applied
    // to the same input.
    vi.stubEnv(FRONTX_TEST_TIMEOUT_MS_ENV_VAR, '45000');
    vi.resetModules();
    const wired = await import('../vitest.shared');
    expect(wired.COLD_START_TIMEOUT_MS).toBe(45_000);

    vi.stubEnv(FRONTX_TEST_TIMEOUT_MS_ENV_VAR, '');
    vi.resetModules();
    const unset = await import('../vitest.shared');
    expect(unset.COLD_START_TIMEOUT_MS).toBe(unset.DEFAULT_COLD_START_TIMEOUT_MS);
  });

  // The rendered standalone configs embed a second, untyped copy of this
  // function's parsing; nothing type-checks one against the other. Run the
  // IIFE the rendered text carries, under a stubbed process, and require the
  // same answer or the same rejection the function gives for every input
  // class the parse distinguishes - so a rule changed in one copy and not in
  // the other fails here instead of passing CI with a scaffolded project that
  // accepts what the monorepo rejects, or the reverse.
  it('renders a lookup that resolves exactly what resolveFrontxTestTimeoutMs resolves', () => {
    const lookup = /const COLD_START_TIMEOUT_MS = (\(\(\) => \{[\s\S]*?\}\)\(\));/;
    const inputs = [undefined, '', '   ', '\t\n', ' 45000 ', '0', '-1', 'soon', '2147483647', '2147483648'];
    const outcome = (run: () => number): string => {
      try {
        return `value ${run()}`;
      } catch (error) {
        return `throw ${(error as Error).message}`;
      }
    };
    for (const rendered of [renderStandaloneVitestConfig(), renderStandaloneMfeVitestBase()]) {
      const iife = lookup.exec(rendered)?.[1];
      expect(iife).toBeDefined();
      for (const input of inputs) {
        const env = input === undefined ? {} : { [FRONTX_TEST_TIMEOUT_MS_ENV_VAR]: input };
        const embedded = new Function('process', `"use strict"; return (${iife});`) as (p: { env: object }) => number;
        expect(outcome(() => embedded({ env }))).toBe(outcome(() => resolveFrontxTestTimeoutMs(input)));
      }
    }
  });
});
