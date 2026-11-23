import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { UnitOutputChecks, type CheckedOutput } from './support/UnitOutputChecks';

import {
  UnitProducer,
  type ProducedSharedPackage,
  type UnitProducerOptions,
} from '../UnitProducer';

/**
 * Scenario: unit byte identity — a unit's bytes depend only on
 * `package@version` and its module set, never on who builds it or the
 * install layout. The fixture set is produced from two install layouts
 * (real copies vs a symlinked store at a different directory depth) and
 * under two consumer configs, and `UnitOutputChecks` requires the
 * output sets byte-identical. Emitted files are scanned for
 * source-map, path-comment and other build-environment text. Finally
 * one `package@version` (`@gears-frontx/mfes`) is produced through a
 * shell-shaped package root and an MFE-shaped one at different depths
 * and must come out byte-identical.
 */

const FIXTURES = [
  '@unit-format-fixture/esm-cycle',
  '@unit-format-fixture/cjs-package',
  '@unit-format-fixture/barrel-package',
  '@unit-format-fixture/subpath-import',
];

const CONSUMER_SPECIFIERS = ['@unit-format-fixture/subpath-import/feature'];

const require = createRequire(import.meta.url);

function fixturesDir(): string {
  const dir = fileURLToPath(new URL('./fixtures/unit-format', import.meta.url));
  if (!existsSync(dir)) {
    throw new Error(`unit-format fixtures not found at ${dir}`);
  }
  return dir;
}

const tmpRoots: string[] = [];

function tmpRoot(label: string): string {
  const root = mkdtempSync(join(tmpdir(), `upbi-${label}-`));
  tmpRoots.push(root);
  return root;
}

type FixtureInstall =
  | { /** Install as real copies under `node_modules` (npm-style flat). */ mode: 'copies' }
  | { /** Install as symlinks into a store outside the root, at depth. */ mode: 'symlinked-store' };

/** Build a package root declaring every fixture as a dependency. */
function makeFixtureRoot(base: string, install: FixtureInstall): string {
  mkdirSync(join(base, 'node_modules'), { recursive: true });
  const src = fixturesDir();
  for (const name of FIXTURES) {
    const short = name.split('/').pop()!;
    const target = join(base, 'node_modules', name);
    if (install.mode === 'copies') {
      cpSync(join(src, short), target, { recursive: true });
    } else {
      const storeDir = join(tmpRoot('store'), short);
      cpSync(join(src, short), storeDir, { recursive: true });
      mkdirSync(dirname(target), { recursive: true });
      symlinkSync(storeDir, target, 'dir');
    }
  }
  writeFileSync(
    join(base, 'package.json'),
    JSON.stringify({
      name: 'byte-identity-host',
      version: '0.0.0',
      dependencies: Object.fromEntries(FIXTURES.map((n) => [n, '1.0.0'])),
    })
  );
  return base;
}

/** Build a package root declaring only `@gears-frontx/mfes`, symlinked. */
function makeMfesRoot(base: string): string {
  const mfesPkg = join(
    dirname(require.resolve('@gears-frontx/mfes/unit-format')),
    '..'
  );
  const target = join(base, 'node_modules', '@gears-frontx', 'mfes');
  mkdirSync(dirname(target), { recursive: true });
  symlinkSync(realpathSync(mfesPkg), target, 'dir');
  const mfesVersion = (
    JSON.parse(readFileSync(join(mfesPkg, 'package.json'), 'utf-8')) as {
      version: string;
    }
  ).version;
  writeFileSync(
    join(base, 'package.json'),
    JSON.stringify({
      name: 'mfes-host',
      version: '0.0.0',
      dependencies: { '@gears-frontx/mfes': mfesVersion },
    })
  );
  return base;
}

const onError = (errors: string[]) => (m: string): never => {
  errors.push(m);
  throw new Error(m);
};

/** What each output directory's build produced, for the output checks. */
const producedByDir = new Map<string, ProducedSharedPackage[]>();

const checked = (dir: string): CheckedOutput => ({
  dir,
  produced: producedByDir.get(dir) ?? [],
});

async function produce(
  packageRoot: string,
  outputDir: string,
  options?: Partial<UnitProducerOptions>
): Promise<string[]> {
  const errors: string[] = [];
  producedByDir.set(
    outputDir,
    await new UnitProducer({
      packageRoot,
      outputDir,
      consumerSpecifiers: CONSUMER_SPECIFIERS,
      ...options,
    }).produce(onError(errors))
  );
  return errors;
}

function listFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) files.push(...listFiles(p));
    else files.push(p);
  }
  return files;
}

afterEach(() => {
  while (tmpRoots.length > 0) {
    rmSync(tmpRoots.pop()!, { recursive: true, force: true });
  }
});

describe('UnitProducer byte identity', () => {
  it('emitted units carry no source-map, path-comment or build-environment text', async () => {
    const packageRoot = makeFixtureRoot(tmpRoot('scan'), { mode: 'copies' });
    const out = join(packageRoot, 'out');
    expect(await produce(packageRoot, out)).toEqual([]);

    const files = listFiles(out).filter((f) => f.endsWith('.js'));
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      const source = readFileSync(file, 'utf-8');
      const rel = relative(out, file);
      expect(source, rel).not.toContain('sourceMappingURL');
      expect(source, rel).not.toContain('unit-producer-entry-');
      // No whole-line `// <path>` provenance comments esbuild writes
      // above each bundled module — build-environment text.
      for (const line of source.split('\n')) {
        expect(
          /^\/\/ \S.*\.(js|mjs|cjs|ts|mts|cts|jsx|tsx|json|node|css)$/.test(line),
          `${rel}: "${line}"`
        ).toBe(false);
      }
      // No absolute filesystem path of this build's environment.
      expect(source, rel).not.toContain(packageRoot);
      expect(source, rel).not.toContain(tmpdir());
    }
  }, 120000);

  it('two install layouts at different directory depths produce byte-identical output', async () => {
    // Layout A: npm-style real copies directly under the root.
    const rootA = makeFixtureRoot(join(tmpRoot('a'), 'app'), {
      mode: 'copies',
    });
    // Layout B: node_modules entries symlinked to a store, the root
    // nested several directories deeper — esbuild's resolved module
    // paths reach the store through `../` hops of a different shape.
    const rootB = makeFixtureRoot(
      join(tmpRoot('b'), 'deeply', 'nested', 'consumer', 'app'),
      { mode: 'symlinked-store' }
    );
    const outA = join(rootA, 'dist', 'shared');
    const outB = join(rootB, 'build', 'units', 'out');

    expect(await produce(rootA, outA)).toEqual([]);
    expect(await produce(rootB, outB)).toEqual([]);

    const violations = new UnitOutputChecks().checkAll([checked(outA), checked(outB)]);
    expect(violations).toEqual([]);
  }, 240000);

  it('two consumer configs produce byte-identical output', async () => {
    const packageRoot = makeFixtureRoot(tmpRoot('cfg'), { mode: 'copies' });
    const outA = join(packageRoot, 'out-config-a');
    const outB = join(packageRoot, 'out-config-b');

    // Config A carries the optional knobs a shell build sets; config B
    // is the bare options an MFE build passes. None may reach the bytes.
    expect(
      await produce(packageRoot, outA, {
        exclude: [],
        declaredVersions: new Map(FIXTURES.map((n) => [n, '1.0.0'])),
      })
    ).toEqual([]);
    expect(await produce(packageRoot, outB, {})).toEqual([]);

    const checks = new UnitOutputChecks();
    expect(checks.checkAll([checked(outA), checked(outB)])).toEqual([]);
    expect(checks.checkConsumerIndependence([outA, outB])).toEqual([]);
  }, 240000);

  it('the same package@version built through a shell root and an MFE root is byte-identical', async () => {
    const shellRoot = makeMfesRoot(join(tmpRoot('shell'), 'template-shell'));
    const mfeRoot = makeMfesRoot(
      join(tmpRoot('mfe'), 'consumers', 'my-mfe')
    );
    const outShell = join(shellRoot, 'dist', 'shared');
    const outMfe = join(mfeRoot, 'public', 'mfe', 'shared');

    const errorsShell = await produce(shellRoot, outShell, {
      consumerSpecifiers: ['@gears-frontx/mfes'],
    });
    const errorsMfe = await produce(mfeRoot, outMfe, {
      consumerSpecifiers: ['@gears-frontx/mfes'],
      exclude: [],
    });
    expect(errorsShell).toEqual([]);
    expect(errorsMfe).toEqual([]);

    const violations = new UnitOutputChecks()
      .checkAll([checked(outShell), checked(outMfe)])
      .filter((v) => v.rule !== 'naming');
    // `@gears-frontx/mfes` carries a dynamic `import()` the unit-format
    // contract prohibits — reported identically against both outputs.
    // Byte identity is what this scenario proves: no byte-identity
    // violation, and every content-addressed file name — each carrying
    // its bytes' SHA-256 — is the same in both output sets.
    expect(violations.filter((v) => v.rule === 'byte-identity')).toEqual(
      []
    );
    const namesOf = (dir: string) =>
      listFiles(dir)
        .map((f) => relative(dir, f))
        .sort();
    const namesShell = namesOf(outShell);
    expect(namesShell.length).toBeGreaterThan(0);
    expect(namesOf(outMfe)).toEqual(namesShell);
    expect(
      namesShell.some((n) => n.startsWith('@gears-frontx/mfes@'))
    ).toBe(true);
  }, 300000);
});
