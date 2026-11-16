import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it } from 'vitest';
import { isShipped, isolatedGitEnv, runCli } from './seeded-gitignore-check.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** @type {string[]} */
let tempDirs = [];

afterEach(async () => {
  await Promise.all(tempDirs.map((dir) => rm(dir, { recursive: true, force: true })));
  tempDirs = [];
});

async function makeTempDir() {
  const dir = await mkdtemp(path.join(tmpdir(), 'frontx-seeded-gitignore-test-'));
  tempDirs.push(dir);
  return dir;
}

/**
 * @param {string} root
 * @param {string} relativePath
 * @param {string} content
 */
async function writeSource(root, relativePath, content) {
  const filePath = path.join(root, relativePath);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, content);
}

/**
 * `git init` (idempotent) and `git add -A -f` in `root` (forced: a fixture
 * .gitignore must not keep fixture files untracked), isolated from the
 * caller's git environment and config like the guard itself.
 *
 * @param {string} root
 */
function gitAddAll(root) {
  for (const args of [['init', '-q'], ['add', '-A', '-f']]) {
    const result = spawnSync('git', args, { cwd: root, env: isolatedGitEnv(), encoding: 'utf8' });
    if (result.status !== 0) throw new Error(`git ${args.join(' ')} failed: ${result.stderr}`);
  }
}

/**
 * @param {string} root
 * @param {string} dir
 * @param {object} manifest
 */
async function writeManifest(root, dir, manifest) {
  await writeSource(root, `${dir}/frontx-template.json`, JSON.stringify(manifest));
}

/**
 * A shell that ships its .gitignore and an overlay that owns
 * `src-app/mfe_packages/demo-mfe/`, the shape of the real pair. Files are
 * tracked by git, as the guard reads tracked files.
 *
 * @param {string} shellGitignore
 */
async function makeRoot(shellGitignore) {
  const root = await makeTempDir();
  await writeManifest(root, 'template-shell', {
    name: 'shell',
    ownershipBoundaries: { exclusiveSubtrees: ['src/', '.gitignore'], sharedFiles: [] },
  });
  await writeSource(root, 'template-shell/.gitignore', shellGitignore);
  await writeSource(root, 'template-shell/src/main.ts', '');
  await writeManifest(root, 'template-mfe', {
    name: 'mfe',
    ownershipBoundaries: { exclusiveSubtrees: ['src-app/mfe_packages/demo-mfe/'], sharedFiles: [] },
  });
  await writeSource(root, 'template-mfe/src-app/mfe_packages/demo-mfe/package.json', '{}\n');
  await writeSource(root, 'template-mfe/src-app/mfe_packages/demo-mfe/src/index.ts', '');
  // Outside every boundary: never shipped, so its rule must not count.
  await writeSource(root, 'template-mfe/.gitignore', 'src-app/\n');
  gitAddAll(root);
  return root;
}

/** @param {string} root */
function run(root) {
  /** @type {string[]} */
  const lines = [];
  /** @param {string} line */
  const record = (line) => lines.push(line);
  const exitCode = runCli({ rootDir: root, log: record, logError: record });
  return { exitCode, output: lines.join('\n') };
}

describe('isShipped', () => {
  const template = { dir: '', name: 't', exclusiveSubtrees: ['src/', '.gitignore'], sharedFiles: ['a/b.txt'] };

  it('mirrors the CLI boundary test', () => {
    expect(isShipped('.gitignore', template)).toBe(true);
    expect(isShipped('src/nested/.gitignore', template)).toBe(true);
    expect(isShipped('a/b.txt', template)).toBe(true);
    expect(isShipped('srcx/.gitignore', template)).toBe(false);
    expect(isShipped('other/.gitignore', template)).toBe(false);
  });
});

describe('seeded-gitignore-check', () => {
  it("fails when a shipped .gitignore ignores another template's subtree", async () => {
    const root = await makeRoot('node_modules\nsrc-app/mfe_packages/*\n');
    const { exitCode, output } = run(root);
    expect(exitCode).toBe(1);
    expect(output).toContain(
      'template-shell/.gitignore:2: "src-app/mfe_packages/*" ignores src-app/mfe_packages/demo-mfe, ' +
        'ground template-mfe (mfe) declares in "src-app/mfe_packages/demo-mfe/"',
    );
    expect(output).toContain('ignores src-app/mfe_packages/demo-mfe/seeded-gitignore-probe');
    expect(output).not.toContain('template-mfe/.gitignore');
  });

  it('fails when a shipped .gitignore ignores a file a template tracks', async () => {
    const root = await makeRoot('node_modules\n*.json\n');
    const { exitCode, output } = run(root);
    expect(exitCode).toBe(1);
    expect(output).toContain(
      'template-shell/.gitignore:2: "*.json" ignores src-app/mfe_packages/demo-mfe/package.json, ' +
        'ground template-mfe (mfe) declares in "src-app/mfe_packages/demo-mfe/"',
    );
  });

  it('fails when declared packages are re-included but a package the team adds is not', async () => {
    const root = await makeRoot('src-app/mfe_packages/*\n!src-app/mfe_packages/demo-mfe\n');
    const { exitCode, output } = run(root);
    expect(exitCode).toBe(1);
    expect(output).toContain(
      'template-shell/.gitignore:1: "src-app/mfe_packages/*" ignores ' +
        'src-app/mfe_packages/seeded-gitignore-sibling-probe/package.json, where a project adds its own ' +
        'directory next to "src-app/mfe_packages/demo-mfe/", which template-mfe (mfe) declares',
    );
    expect(output).not.toContain('ignores src-app/mfe_packages/demo-mfe/package.json');
  });

  it('fails when a root-level subtree boundary loses a directory the team adds', async () => {
    const root = await makeTempDir();
    await writeManifest(root, 'template-shell', {
      name: 'shell',
      ownershipBoundaries: { exclusiveSubtrees: ['packages/', 'packages/react/', '.gitignore'], sharedFiles: [] },
    });
    await writeSource(root, 'template-shell/.gitignore', 'packages/*/\n!packages/react\n');
    await writeSource(root, 'template-shell/packages/react/package.json', '{}\n');
    gitAddAll(root);
    const { exitCode, output } = run(root);
    expect(exitCode).toBe(1);
    expect(output).toContain('"packages/*/" ignores');
    expect(output).toContain(
      'template-shell/.gitignore:1: "packages/*/" ignores packages/seeded-gitignore-probe-dir/package.json, ' +
        'ground template-shell (shell) declares in "packages/"',
    );
  });

  it('fails when a directory-only wildcard hides a new directory under a root-level boundary', async () => {
    // The negations keep every tracked directory, so only a directory the team adds is lost.
    const root = await makeRoot('src/*/\n!src/lib/\n!src/zeta/\n');
    await writeSource(root, 'template-shell/src/lib/util.ts', '');
    await writeSource(root, 'template-shell/src/lib/nested/deep.ts', '');
    await writeSource(root, 'template-shell/src/zeta/other.css', '');
    gitAddAll(root);
    const { exitCode, output } = run(root);
    expect(exitCode).toBe(1);
    for (const probe of ['package.json', 'util.ts', 'nested/deep.ts']) {
      expect(output).toContain(
        `template-shell/.gitignore:1: "src/*/" ignores src/seeded-gitignore-probe-dir/${probe}, ` +
          'ground template-shell (shell) declares in "src/"',
      );
    }
    // Every subdirectory's layout is mirrored, zeta's as well as lib's.
    expect(output).toContain('ignores src/seeded-gitignore-probe-dir/other.css');
  });

  it('fails when a nested directory of a later subdirectory is lost in a directory the team adds', async () => {
    const root = await makeTempDir();
    await writeManifest(root, 'template-shell', {
      name: 'shell',
      ownershipBoundaries: { exclusiveSubtrees: ['packages/', '.gitignore'], sharedFiles: [] },
    });
    await writeSource(root, 'template-shell/.gitignore', 'packages/*/src/\n!packages/react/src\n');
    await writeSource(root, 'template-shell/packages/a-utils/index.ts', '');
    await writeSource(root, 'template-shell/packages/react/src/index.ts', '');
    gitAddAll(root);
    const { exitCode, output } = run(root);
    expect(exitCode).toBe(1);
    expect(output).toContain(
      'template-shell/.gitignore:1: "packages/*/src/" ignores packages/seeded-gitignore-probe-dir/src/index.ts, ' +
        'ground template-shell (shell) declares in "packages/"',
    );
  });

  it('names the manifest that is not valid JSON', async () => {
    const root = await makeRoot('node_modules\n');
    await writeSource(root, 'template-extra/frontx-template.json', '{ "name": "extra", }\n');
    gitAddAll(root);
    const { exitCode, output } = run(root);
    expect(exitCode).toBe(1);
    expect(output).toContain('[seeded-gitignore-check] FAIL: template-extra/frontx-template.json: ');
  });

  it('names the manifest that is not a JSON object', async () => {
    const root = await makeRoot('node_modules\n');
    await writeSource(root, 'template-extra/frontx-template.json', 'null\n');
    gitAddAll(root);
    const { exitCode, output } = run(root);
    expect(exitCode).toBe(1);
    expect(output).toContain(
      '[seeded-gitignore-check] FAIL: template-extra/frontx-template.json: the manifest is not a JSON object',
    );
  });

  it('fails when a package the team adds loses a nested directory the declared package keeps', async () => {
    const root = await makeRoot('src-app/mfe_packages/*/src/\n!src-app/mfe_packages/demo-mfe/src\n');
    const { exitCode, output } = run(root);
    expect(exitCode).toBe(1);
    expect(output).toContain(
      'template-shell/.gitignore:1: "src-app/mfe_packages/*/src/" ignores ' +
        'src-app/mfe_packages/seeded-gitignore-sibling-probe/src/index.ts, where a project adds its own ' +
        'directory next to "src-app/mfe_packages/demo-mfe/", which template-mfe (mfe) declares',
    );
    expect(output).not.toContain('ignores src-app/mfe_packages/demo-mfe/src/index.ts');
  });

  it('fails when a package the team adds loses its files by extension', async () => {
    const root = await makeRoot('*.ts\n!src-app/mfe_packages/demo-mfe/**\n');
    const { exitCode, output } = run(root);
    expect(exitCode).toBe(1);
    expect(output).toContain(
      'template-shell/.gitignore:1: "*.ts" ignores src-app/mfe_packages/seeded-gitignore-sibling-probe/src/index.ts',
    );
  });

  it('lays out a path one probe needs as a file and another as a directory as a directory', async () => {
    const root = await makeTempDir();
    await writeManifest(root, 'template-gen', {
      name: 'gen',
      ownershipBoundaries: { exclusiveSubtrees: ['gen', 'gen/out/', '.gitignore'], sharedFiles: [] },
    });
    await writeSource(root, 'template-gen/.gitignore', 'node_modules\n');
    gitAddAll(root);
    // Absent on disk, no trailing slash, nothing tracked under it: `gen` is
    // probed as a file, while `gen/out/` (trailing slash) needs it as a directory.
    const { exitCode, output } = run(root);
    expect(output).toContain('Seeded .gitignore check passed: 1 shipped .gitignore file(s) across 1 template(s)');
    expect(exitCode).toBe(0);
  });

  it('probes an absent boundary with tracked files under it as a directory', async () => {
    const root = await makeTempDir();
    await writeManifest(root, 'template-gen', {
      name: 'gen',
      ownershipBoundaries: { exclusiveSubtrees: ['pkg/gen', '.gitignore'], sharedFiles: [] },
    });
    await writeSource(root, 'template-gen/.gitignore', 'pkg/gen/*\npkg/*/out/\n');
    await writeSource(root, 'template-gen/pkg/gen/out/x.txt', '');
    gitAddAll(root);
    // Tracked but absent on disk, written without a trailing slash.
    await rm(path.join(root, 'template-gen/pkg/gen'), { recursive: true, force: true });
    const { exitCode, output } = run(root);
    expect(exitCode).toBe(1);
    expect(output).toContain('"pkg/gen/*" ignores pkg/gen/seeded-gitignore-probe,');
    expect(output).toContain('"pkg/*/out/" ignores pkg/seeded-gitignore-sibling-probe/out/x.txt,');
  });

  it('fails when a new file under a directory boundary is ignored by its extension', async () => {
    const root = await makeRoot('*.json\n!src-app/mfe_packages/demo-mfe/package.json\n');
    const { exitCode, output } = run(root);
    expect(exitCode).toBe(1);
    expect(output).toContain(
      'template-shell/.gitignore:1: "*.json" ignores src-app/mfe_packages/demo-mfe/seeded-gitignore-probe.json, ' +
        'ground template-mfe (mfe) declares in "src-app/mfe_packages/demo-mfe/"',
    );
    expect(output).not.toContain('ignores src-app/mfe_packages/demo-mfe/package.json');
  });

  it('matches case-sensitively on every OS', async () => {
    const root = await makeRoot('SRC/\n');
    const { exitCode, output } = run(root);
    expect(output).toContain('Seeded .gitignore check passed');
    expect(exitCode).toBe(0);
  });

  it('counts only tracked .gitignore files', async () => {
    const root = await makeRoot('node_modules\n');
    await writeSource(root, 'template-shell/src/.gitignore', '*\n');
    const { exitCode, output } = run(root);
    expect(output).toContain('Seeded .gitignore check passed: 1 shipped .gitignore file(s) across 2 template(s)');
    expect(exitCode).toBe(0);
  });

  it('passes when the shipped .gitignore leaves declared ground alone', async () => {
    const root = await makeRoot('node_modules\ndist\n!src-app/mfe_packages/demo-mfe\n');
    const { exitCode, output } = run(root);
    expect(output).toContain('Seeded .gitignore check passed: 1 shipped .gitignore file(s) across 2 template(s)');
    expect(exitCode).toBe(0);
  });

  it('fails when two templates ship a .gitignore at the same project path', async () => {
    const root = await makeRoot('node_modules\n');
    await writeManifest(root, 'template-extra', {
      name: 'extra',
      ownershipBoundaries: { exclusiveSubtrees: [], sharedFiles: [{ path: '.gitignore' }] },
    });
    await writeSource(root, 'template-extra/.gitignore', 'dist\n');
    gitAddAll(root);
    const { exitCode, output } = run(root);
    expect(exitCode).toBe(1);
    expect(output).toContain(
      '.gitignore is shipped by both template-extra and template-shell: one would overwrite the other',
    );
  });

  it('reports every pair when three templates ship a .gitignore at the same project path', async () => {
    const root = await makeRoot('node_modules\n');
    for (const name of ['extra', 'more']) {
      await writeManifest(root, `template-${name}`, {
        name,
        ownershipBoundaries: { exclusiveSubtrees: [], sharedFiles: [{ path: '.gitignore' }] },
      });
      await writeSource(root, `template-${name}/.gitignore`, 'dist\n');
    }
    gitAddAll(root);
    const { exitCode, output } = run(root);
    expect(exitCode).toBe(1);
    expect(output).toContain('FAIL: 3 shipped .gitignore collision(s):');
    for (const [first, second] of [
      ['template-extra', 'template-more'],
      ['template-extra', 'template-shell'],
      ['template-more', 'template-shell'],
    ]) {
      expect(output).toContain(`.gitignore is shipped by both ${first} and ${second}:`);
    }
  });

  it.each([
    ['an object without a path or null in sharedFiles', { exclusiveSubtrees: [], sharedFiles: [{}, null] }, 2],
    ['a string for exclusiveSubtrees', { exclusiveSubtrees: 'src/', sharedFiles: [] }, 1],
    ['a string for ownershipBoundaries', 'src/', 2],
    ['an array for ownershipBoundaries', [], 2],
    ['null for ownershipBoundaries', null, 2],
  ])('reports a malformed boundary entry (%s)', async (_label, ownershipBoundaries, count) => {
    const root = await makeRoot('node_modules\n');
    await writeManifest(root, 'template-extra', { name: 'extra', ownershipBoundaries });
    gitAddAll(root);
    const { exitCode, output } = run(root);
    expect(exitCode).toBe(1);
    expect(output).toContain(`FAIL: ${count} boundary entr(ies) are not usable project paths`);
    expect(output).toContain(
      'template-extra (extra) declares boundary "": ' +
        'a boundary must be a non-empty relative path without "." or ".." segments',
    );
    expect(output).not.toMatch(/TypeError|ERR_INVALID_ARG_TYPE|is not a function/);
  });

  it('rejects a boundary that is empty, absolute, or has a "." or ".." segment', async () => {
    const root = await makeRoot('node_modules\n');
    const bad = ['../escape/', '/etc/', '', '.', './', './src/', 'a/./b'];
    await writeManifest(root, 'template-extra', {
      name: 'extra',
      ownershipBoundaries: { exclusiveSubtrees: bad, sharedFiles: [{ path: 'a/../../b.txt' }] },
    });
    gitAddAll(root);
    const { exitCode, output } = run(root);
    expect(exitCode).toBe(1);
    expect(output).toContain('FAIL: 8 boundary entr(ies) are not usable project paths');
    for (const boundary of [...bad, 'a/../../b.txt']) {
      expect(output).toContain(
        `template-extra (extra) declares boundary "${boundary}": ` +
          'a boundary must be a non-empty relative path without "." or ".." segments',
      );
    }
    expect(output).not.toContain('escapes the scratch repository');
  });

  it('fails closed when no template is found', async () => {
    const root = await makeTempDir();
    const { exitCode, output } = run(root);
    expect(exitCode).toBe(1);
    expect(output).toContain('no template');
  });

  it('passes on the real repository tree', () => {
    const { exitCode, output } = run(REPO_ROOT);
    expect(output).toMatch(/Seeded \.gitignore check passed: [1-9]\d* shipped \.gitignore file\(s\)/);
    expect(exitCode).toBe(0);
  });

  it('ignores a GIT_DIR inherited from the caller', async () => {
    const root = await makeRoot('src-app/mfe_packages/*\n');
    const baseline = run(root);
    const unrelated = await makeTempDir();
    await writeSource(unrelated, 'unrelated.txt', '');
    gitAddAll(unrelated);
    const saved = process.env.GIT_DIR;
    process.env.GIT_DIR = path.join(unrelated, '.git');
    try {
      expect(run(root)).toEqual(baseline);
    } finally {
      if (saved === undefined) delete process.env.GIT_DIR;
      else process.env.GIT_DIR = saved;
    }
    expect(baseline.exitCode).toBe(1);
    expect(baseline.output).toContain('"src-app/mfe_packages/*" ignores src-app/mfe_packages/demo-mfe/package.json');
  });

  it.each(['*.ts', 'src/'])("ignores the developer's global excludes file (%s)", async (pattern) => {
    const root = await makeRoot('node_modules\n');
    const baseline = run(root);
    const home = await makeTempDir();
    const excludes = path.join(home, 'excludes');
    await writeSource(home, 'excludes', `${pattern}\n`);
    await writeSource(home, '.gitconfig', `[core]\n\texcludesFile = ${excludes}\n`);
    await writeSource(home, '.config/git/config', `[core]\n\texcludesFile = ${excludes}\n`);
    await writeSource(home, '.config/git/ignore', `${pattern}\n`);
    const saved = { HOME: process.env.HOME, XDG_CONFIG_HOME: process.env.XDG_CONFIG_HOME };
    process.env.HOME = home;
    process.env.XDG_CONFIG_HOME = path.join(home, '.config');
    try {
      expect(run(root)).toEqual(baseline);
    } finally {
      for (const [name, value] of Object.entries(saved)) {
        if (value === undefined) delete process.env[name];
        else process.env[name] = value;
      }
    }
    expect(baseline.exitCode).toBe(0);
  });
});
