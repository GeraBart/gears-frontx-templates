/**
 * Seeded .gitignore CI Guard.
 *
 * A `.gitignore` a template ships lands in every project seeded from it, so
 * a rule written for this repository's own dev loop becomes a rule of the
 * team's project. `template-shell/.gitignore` once carried
 * `src-app/mfe_packages/*` (meant for MFE packages composed into
 * template-shell here for local testing): in a seeded project it hid every
 * MFE package `frontx add frontx-template-mfe` brought in, so `git add -A`
 * tracked none of them and a teammate's clone had no MFEs at all.
 *
 * The rule: no `.gitignore` a template ships into a seeded project may ignore
 * ground any template declares as its own. Which `.gitignore` files ship:
 * every `.gitignore` git tracks inside a template directory (`git ls-files`,
 * so an untracked one in a developer checkout never counts) whose
 * template-relative path lies within that template's declared
 * `ownershipBoundaries` - the same test
 * the CLI's assembler applies when it copies template items into a project
 * (an `exclusiveSubtrees` entry covers itself and everything under it, a
 * trailing slash is stripped before comparing; a `sharedFiles` entry covers
 * its exact `path`).
 *
 * How: the shipped files are laid out at their project-relative paths in a
 * temporary git repository, next to probes, and `git check-ignore --no-index`
 * says which probes are ignored and by which line. The probes:
 * - every declared boundary of every template, as written;
 * - for a directory boundary, a child file under it (one without an extension
 *   and one per extension among the tracked shipped files under it, so a
 *   `*.ts` rule hides a teammate's new `.ts` file there), a child directory
 *   inside it (`seeded-gitignore-probe-dir/package.json` plus the tracked
 *   layouts of every subdirectory of the boundary, merged, so a
 *   directory-only wildcard rule, one ending in a slash, that hides a
 *   teammate's new package there fails at any depth of the boundary), and,
 *   unless the boundary sits at the project root, a sibling directory in the
 *   same parent shaped like the boundary: one file per
 *   tracked shipped file under the boundary, at the same relative path (the
 *   shape of a package the team adds there later, e.g.
 *   `src-app/mfe_packages/<new>/package.json` and `.../<new>/src/index.ts`),
 *   or `package.json` when nothing is tracked under it;
 * - every file git tracks under a template directory whose
 *   template-relative path is shipped (`git ls-files`, so untracked install
 *   or build output never becomes a probe).
 * A path any probe needs as a directory is laid out as a directory. A
 * negated (`!`) match is not an ignore. Matching is case-sensitive on every
 * OS (`-c core.ignoreCase=false` on `git check-ignore`; `git init` on macOS
 * sets it to true). Every `GIT_*` variable is dropped
 * from the environment of the spawned git (a hook or `git rebase --exec`
 * sets `GIT_DIR` and friends, which would point git at the outer
 * repository), and global and system git config and excludes are switched
 * off, so the developer's own ignore rules never colour the result.
 *
 * Hard failures, never a vacuous or misleading pass: zero templates found by
 * manifest presence (`findTemplateDirs`); a boundary that is empty, absolute,
 * has a `.` or `..` segment or names no path at all (a boundary list that is
 * not an array, an entry that is not a string or `{ path }`); two templates shipping a `.gitignore` at the
 * same project-relative path (one would overwrite the other in the project).
 *
 * Rules this repository needs for its own tree belong in the root
 * `.gitignore`, which no template ships.
 *
 * CLI entry: `node scripts/seeded-gitignore-check.mjs` (exit 0 on success).
 * Wired into `npm run policy:seeded-gitignore` and
 * `.github/workflows/main.yml`. Core logic is exported for unit tests in
 * `scripts/seeded-gitignore-check.test.mjs`.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';
import { MANIFEST_FILENAME, findTemplateDirs } from './template-discovery.mjs';

/** File name of the child probe placed under a directory boundary. */
export const CHILD_PROBE_NAME = 'seeded-gitignore-probe';

/** Directory name of the child directory probe placed inside a directory boundary. */
export const CHILD_PROBE_DIR = 'seeded-gitignore-probe-dir';

/** Directory name of the sibling probe placed next to a directory boundary. */
export const SIBLING_PROBE_DIR = 'seeded-gitignore-sibling-probe';

/** File placed inside the sibling probe directory when nothing is tracked under the boundary. */
const SIBLING_PROBE_FILE = 'package.json';

/**
 * @typedef {{
 *   dir: string;
 *   name: string;
 *   exclusiveSubtrees: string[];
 *   sharedFiles: string[];
 * }} Template
 * @typedef {{ template: Template; relPath: string; absPath: string }} ShippedGitignore
 * @typedef {'boundary' | 'child' | 'sibling' | 'tracked'} ProbeKind
 * @typedef {{ template: Template; boundary: string; probe: string; isDir: boolean; kind: ProbeKind }} Probe
 * @typedef {{
 *   gitignore: ShippedGitignore;
 *   line: number;
 *   pattern: string;
 *   probe: Probe;
 * }} Violation
 */

/** @param {string} value */
function withoutTrailingSlash(value) {
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

/**
 * A copy of the environment for every spawned git: no `GIT_*` variable
 * survives (repository location, index, object store, ceiling and the
 * like), and global and system config are off.
 *
 * @returns {NodeJS.ProcessEnv}
 */
export function isolatedGitEnv() {
  const env = Object.fromEntries(Object.entries(process.env).filter(([name]) => !name.startsWith('GIT_')));
  return { ...env, GIT_CONFIG_GLOBAL: os.devNull, GIT_CONFIG_NOSYSTEM: '1' };
}

/** @param {string} value */
function toPosix(value) {
  return value.split(path.sep).join('/');
}

/**
 * Mirrors the CLI's `pathWithinSubtree`.
 *
 * @param {string} target
 * @param {string} subtree
 */
export function pathWithinSubtree(target, subtree) {
  const root = withoutTrailingSlash(subtree);
  const value = withoutTrailingSlash(target);
  return value === root || value.startsWith(`${root}/`);
}

/**
 * Mirrors the CLI's `isWithinDeclaredBoundaries`.
 *
 * @param {string} relPath template-relative, `/`-separated
 * @param {Template} template
 */
export function isShipped(relPath, template) {
  return (
    template.exclusiveSubtrees.some((subtree) => pathWithinSubtree(relPath, subtree)) ||
    template.sharedFiles.includes(relPath)
  );
}

/**
 * A boundary list as strings. A list that is not an array, or an entry that
 * names no path (not a string, or an object without a string `path`),
 * becomes `''`, which `findUnsafeBoundaries` reports with the template named.
 *
 * @param {unknown} list
 * @returns {string[]}
 */
function boundaryList(list) {
  if (list === undefined) return [];
  if (!Array.isArray(list)) return [''];
  return list.map((entry) => {
    const value = entry !== null && typeof entry === 'object' ? /** @type {{ path?: unknown }} */ (entry).path : entry;
    return typeof value === 'string' ? value : '';
  });
}

/**
 * A manifest that cannot be read or parsed, or is not a JSON object, throws
 * an error naming it (relative to `rootDir` when given).
 *
 * @param {string} templateDir
 * @param {string} [rootDir]
 * @returns {Template}
 */
export function readTemplate(templateDir, rootDir) {
  const manifestPath = path.join(templateDir, MANIFEST_FILENAME);
  const where = rootDir === undefined ? manifestPath : toPosix(path.relative(rootDir, manifestPath));
  /** @type {unknown} */
  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch (error) {
    throw new Error(`${where}: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`${where}: the manifest is not a JSON object`);
  }
  const manifest = /** @type {{ name?: unknown; ownershipBoundaries?: unknown }} */ (parsed);
  const boundaries = manifest.ownershipBoundaries;
  // An absent block declares no boundaries; one that is not a plain object
  // (string, array, number, null) is malformed: both lists become `['']`.
  const malformed =
    boundaries !== undefined && (boundaries === null || typeof boundaries !== 'object' || Array.isArray(boundaries));
  const lists = /** @type {{ exclusiveSubtrees?: unknown; sharedFiles?: unknown } | undefined} */ (
    malformed ? undefined : boundaries
  );
  return {
    dir: templateDir,
    name: typeof manifest.name === 'string' ? manifest.name : path.basename(templateDir),
    exclusiveSubtrees: malformed ? [''] : boundaryList(lists?.exclusiveSubtrees),
    sharedFiles: malformed ? [''] : boundaryList(lists?.sharedFiles),
  };
}

/**
 * The tracked `.gitignore` files (`trackedFiles`, relative to `rootDir`) a
 * template ships. A tracked file deleted in the working tree is skipped.
 *
 * @param {string} rootDir
 * @param {Template[]} templates
 * @param {string[]} trackedFiles
 * @returns {ShippedGitignore[]}
 */
export function findShippedGitignores(rootDir, templates, trackedFiles) {
  return templates.flatMap((template) =>
    templateRelative(rootDir, template, trackedFiles)
      .filter((relPath) => path.posix.basename(relPath) === '.gitignore' && isShipped(relPath, template))
      .map((relPath) => ({ template, relPath, absPath: path.join(template.dir, relPath) }))
      .filter(({ absPath }) => fs.existsSync(absPath)),
  );
}

/**
 * The entries of `trackedFiles` (relative to `rootDir`) under `template`'s
 * directory, relative to it.
 *
 * @param {string} rootDir
 * @param {Template} template
 * @param {string[]} trackedFiles
 */
function templateRelative(rootDir, template, trackedFiles) {
  const prefix = `${toPosix(path.relative(rootDir, template.dir))}/`;
  return trackedFiles.filter((file) => file.startsWith(prefix)).map((file) => file.slice(prefix.length));
}

/**
 * Boundary entries that name no usable project path (empty, absolute, or
 * with a `.` or `..` segment, which would place a probe at the scratch
 * repository root or outside it), one message per entry.
 *
 * @param {string} rootDir
 * @param {Template[]} templates
 * @returns {string[]}
 */
export function findUnsafeBoundaries(rootDir, templates) {
  return templates.flatMap((template) =>
    [...template.exclusiveSubtrees, ...template.sharedFiles]
      .filter(
        (boundary) =>
          boundary === '' ||
          path.posix.isAbsolute(boundary) ||
          path.win32.isAbsolute(boundary) ||
          boundary.split(/[\\/]/).some((segment) => segment === '.' || segment === '..'),
      )
      .map(
        (boundary) =>
          `${toPosix(path.relative(rootDir, template.dir))} (${template.name}) declares boundary "${boundary}": ` +
          'a boundary must be a non-empty relative path without "." or ".." segments',
      ),
  );
}

/**
 * Pairs of templates that ship a `.gitignore` at the same project-relative
 * path, one message per collision.
 *
 * @param {string} rootDir
 * @param {ShippedGitignore[]} gitignores
 * @returns {string[]}
 */
export function findGitignoreCollisions(rootDir, gitignores) {
  /** @type {Map<string, ShippedGitignore[]>} */
  const byRelPath = new Map();
  /** @type {string[]} */
  const collisions = [];
  for (const gitignore of gitignores) {
    const shipped = byRelPath.get(gitignore.relPath) ?? [];
    for (const earlier of shipped) {
      collisions.push(
        `${gitignore.relPath} is shipped by both ${toPosix(path.relative(rootDir, earlier.template.dir))} and ` +
          `${toPosix(path.relative(rootDir, gitignore.template.dir))}: one would overwrite the other in a seeded project`,
      );
    }
    shipped.push(gitignore);
    byRelPath.set(gitignore.relPath, shipped);
  }
  return collisions;
}

/**
 * The boundary entry of `template` that ships `relPath`.
 *
 * @param {string} relPath
 * @param {Template} template
 */
function coveringBoundary(relPath, template) {
  return (
    template.sharedFiles.find((file) => file === relPath) ??
    template.exclusiveSubtrees.find((subtree) => pathWithinSubtree(relPath, subtree)) ??
    relPath
  );
}

/**
 * Every file git tracks under `rootDir`, `/`-separated and relative to it.
 * Runs `git ls-files` against the real repository (`-C rootDir`), never a
 * filesystem walk, so untracked `node_modules` or build output stay out.
 *
 * @param {string} rootDir
 * @returns {string[]}
 */
export function listTrackedFiles(rootDir) {
  const result = spawnSync('git', ['-C', rootDir, 'ls-files', '-z'], {
    env: isolatedGitEnv(),
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  if (result.status !== 0) throw new Error(`git ls-files failed in ${rootDir}: ${result.stderr || result.error?.message}`);
  return result.stdout.split('\0').filter(Boolean);
}

/**
 * The probes:
 * - one per declared boundary;
 * - for a directory boundary, a child file under it (without an extension,
 *   and once per extension among the tracked shipped files under it), a
 *   child directory inside it (`seeded-gitignore-probe-dir/`) holding
 *   `package.json` and the tracked shipped files of every subdirectory of
 *   the boundary at their paths relative to their subdirectory (the union,
 *   each path once), and, unless the boundary sits at the project root, a
 *   sibling directory in the same parent holding every tracked shipped file
 *   under the boundary at its boundary-relative path (`package.json` when
 *   none), each sibling path once;
 * - one per tracked file (`trackedFiles`, relative to `rootDir`) under a
 *   template directory whose template-relative path is shipped.
 * A boundary is a directory when it exists as one in its template, or, when
 * absent, when it is written with a trailing slash or git tracks files
 * under it.
 *
 * @param {string} rootDir
 * @param {Template[]} templates
 * @param {string[]} trackedFiles
 * @returns {Probe[]}
 */
export function buildProbes(rootDir, templates, trackedFiles) {
  /** @type {Set<string>} */
  const siblingPaths = new Set();
  return templates.flatMap((template) => {
    const shippedFiles = templateRelative(rootDir, template, trackedFiles).filter((relPath) =>
      isShipped(relPath, template),
    );
    const boundaryProbes = [...template.exclusiveSubtrees, ...template.sharedFiles].flatMap((boundary) => {
      const probe = withoutTrailingSlash(boundary);
      const stat = fs.statSync(path.join(template.dir, probe), { throwIfNoEntry: false });
      const isDir = stat
        ? stat.isDirectory()
        : boundary.endsWith('/') || shippedFiles.some((file) => file.startsWith(`${probe}/`));
      /** @type {Probe[]} */
      const probes = [{ template, boundary, probe, isDir, kind: 'boundary' }];
      if (!isDir) return probes;
      const under = shippedFiles.filter((file) => file.startsWith(`${probe}/`));
      const extensions = new Set(under.map((file) => path.posix.extname(file)));
      extensions.add('');
      for (const extension of [...extensions].sort()) {
        probes.push({
          template,
          boundary,
          probe: `${probe}/${CHILD_PROBE_NAME}${extension}`,
          isDir: false,
          kind: 'child',
        });
      }
      // A directory the team adds inside the boundary, at any depth: a
      // directory-only rule (`packages/*/`) matches none of the child files
      // above. It holds `package.json` and the tracked layouts of every
      // subdirectory of the boundary, merged, each path once.
      const insideRels = under.map((file) => file.slice(probe.length + 1));
      const childDirRels = new Set([SIBLING_PROBE_FILE]);
      for (const rel of insideRels) {
        const slash = rel.indexOf('/');
        if (slash !== -1) childDirRels.add(rel.slice(slash + 1));
      }
      for (const rel of [...childDirRels].sort()) {
        probes.push({ template, boundary, probe: `${probe}/${CHILD_PROBE_DIR}/${rel}`, isDir: false, kind: 'child' });
      }
      const parent = path.posix.dirname(probe);
      // A directory boundary right at the project root has the whole project
      // as its parent: a sibling there is just any top-level directory
      // (dist/, coverage/), which a project may rightly ignore. A directory
      // the team adds inside such a boundary (`packages/<new>/`, `src/<new>/`)
      // is still probed by the child directory above.
      if (parent !== '.') {
        const rels = insideRels.length > 0 ? insideRels : [SIBLING_PROBE_FILE];
        for (const rel of rels) {
          const sibling = `${parent}/${SIBLING_PROBE_DIR}/${rel}`;
          if (siblingPaths.has(sibling)) continue;
          siblingPaths.add(sibling);
          probes.push({ template, boundary, probe: sibling, isDir: false, kind: 'sibling' });
        }
      }
      return probes;
    });

    const probed = new Set(boundaryProbes.map(({ probe }) => probe));
    /** @type {Probe[]} */
    const trackedProbes = shippedFiles
      .filter((relPath) => !probed.has(relPath))
      .map((relPath) => ({
        template,
        boundary: coveringBoundary(relPath, template),
        probe: relPath,
        isDir: false,
        kind: 'tracked',
      }));

    return [...boundaryProbes, ...trackedProbes];
  });
}

/**
 * `relPath` resolved under `workDir`; throws when it would land outside.
 *
 * @param {string} workDir
 * @param {string} relPath
 */
function insideWorkDir(workDir, relPath) {
  const target = path.resolve(workDir, relPath);
  if (!target.startsWith(`${workDir}${path.sep}`)) throw new Error(`probe path escapes the scratch repository: ${relPath}`);
  return target;
}

/**
 * Lays the shipped files and the probes out in a temporary git repository and
 * returns every probe a shipped `.gitignore` ignores.
 *
 * @param {ShippedGitignore[]} gitignores
 * @param {Probe[]} probes
 * @returns {Violation[]}
 */
export function findViolations(gitignores, probes) {
  if (gitignores.length === 0 || probes.length === 0) return [];
  const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'frontx-seeded-gitignore-'));
  try {
    const env = isolatedGitEnv();
    const init = spawnSync('git', ['init', '-q'], { cwd: workDir, env, encoding: 'utf8' });
    if (init.status !== 0) throw new Error(`git init failed: ${init.stderr || init.error?.message}`);

    // Every path some probe or shipped file needs as a directory, collected
    // before anything is written: a path one probe wants as a file and
    // another as a directory is laid out as a directory.
    /** @type {Set<string>} */
    const dirs = new Set();
    /** @param {string} relPath */
    const addParents = (relPath) => {
      for (let dir = path.posix.dirname(relPath); dir !== '.' && dir !== '/'; dir = path.posix.dirname(dir)) {
        dirs.add(dir);
      }
    };
    for (const gitignore of gitignores) addParents(gitignore.relPath);
    for (const { probe, isDir } of probes) {
      addParents(probe);
      if (isDir) dirs.add(probe);
    }
    for (const dir of dirs) fs.mkdirSync(insideWorkDir(workDir, dir), { recursive: true });

    /** @type {Map<string, ShippedGitignore>} */
    const byRelPath = new Map();
    for (const gitignore of gitignores) {
      byRelPath.set(gitignore.relPath, gitignore);
      fs.copyFileSync(gitignore.absPath, insideWorkDir(workDir, gitignore.relPath));
    }
    for (const { probe } of probes) {
      const target = insideWorkDir(workDir, probe);
      if (!dirs.has(probe) && !fs.existsSync(target)) fs.writeFileSync(target, '');
    }

    const uniqueProbes = [...new Set(probes.map((probe) => probe.probe))];
    const result = spawnSync(
      'git',
      [
        // macOS `git init` sets core.ignoreCase=true; matching must be case-sensitive on every OS.
        ...['-c', `core.excludesFile=${os.devNull}`, '-c', 'core.ignoreCase=false'],
        ...['check-ignore', '--no-index', '--verbose', '-z', '--stdin'],
      ],
      { cwd: workDir, env, encoding: 'utf8', input: uniqueProbes.map((probe) => `${probe}\0`).join('') },
    );
    // 0: some path ignored, 1: none ignored, anything else: git itself failed.
    if (result.status !== 0 && result.status !== 1) {
      throw new Error(`git check-ignore failed: ${result.stderr || result.error?.message}`);
    }

    const fields = result.stdout.split('\0');
    /** @type {Violation[]} */
    const violations = [];
    for (let i = 0; i + 3 < fields.length; i += 4) {
      const [source, line, pattern, probePath] = fields.slice(i, i + 4);
      if (pattern.startsWith('!')) continue;
      const gitignore = byRelPath.get(source);
      if (!gitignore) throw new Error(`git check-ignore named an unexpected source "${source}" for ${probePath}`);
      for (const probe of probes.filter((candidate) => candidate.probe === probePath)) {
        violations.push({ gitignore, line: Number(line), pattern, probe });
      }
    }
    return violations;
  } finally {
    fs.rmSync(workDir, { recursive: true, force: true });
  }
}

/**
 * @param {string} rootDir
 * @param {Violation} violation
 */
export function explainViolation(rootDir, { gitignore, line, pattern, probe }) {
  const file = toPosix(path.relative(rootDir, gitignore.absPath));
  const owner = `${toPosix(path.relative(rootDir, probe.template.dir))} (${probe.template.name})`;
  const where =
    probe.kind === 'sibling'
      ? `where a project adds its own directory next to "${probe.boundary}", which ${owner} declares`
      : `ground ${owner} declares in "${probe.boundary}"`;
  return `${file}:${line}: "${pattern}" ignores ${probe.probe}, ${where}`;
}

/**
 * @param {{ rootDir: string; log: (line: string) => void; logError: (line: string) => void }} options
 * @returns {number}
 */
function check({ rootDir, log, logError }) {
  const templateDirs = findTemplateDirs(rootDir);
  if (templateDirs.length === 0) {
    logError(
      `[seeded-gitignore-check] FAIL: no template (a directory carrying ${MANIFEST_FILENAME}) found under ` +
        `${rootDir} - a discovery bug, not a pass.`,
    );
    return 1;
  }
  const templates = templateDirs.map((templateDir) => readTemplate(templateDir, rootDir));

  const unsafe = findUnsafeBoundaries(rootDir, templates);
  if (unsafe.length > 0) {
    logError(`[seeded-gitignore-check] FAIL: ${unsafe.length} boundary entr(ies) are not usable project paths:`);
    for (const line of unsafe) logError(`  ${line}`);
    return 1;
  }

  const trackedFiles = listTrackedFiles(rootDir);
  const gitignores = findShippedGitignores(rootDir, templates, trackedFiles);
  const collisions = findGitignoreCollisions(rootDir, gitignores);
  if (collisions.length > 0) {
    logError(`[seeded-gitignore-check] FAIL: ${collisions.length} shipped .gitignore collision(s):`);
    for (const line of collisions) logError(`  ${line}`);
    return 1;
  }

  const probes = buildProbes(rootDir, templates, trackedFiles);
  const violations = findViolations(gitignores, probes);

  if (violations.length > 0) {
    logError(`[seeded-gitignore-check] FAIL: ${violations.length} template path(s) ignored in a seeded project:`);
    for (const violation of violations) logError(`  ${explainViolation(rootDir, violation)}`);
    logError(
      '\nA .gitignore inside a template boundary is copied into every seeded project, where these paths ' +
        "are the team's source. Put a rule this repository needs for its own tree in the root .gitignore instead.",
    );
    return 1;
  }

  log(
    `Seeded .gitignore check passed: ${gitignores.length} shipped .gitignore file(s) across ` +
      `${templates.length} template(s) ignore none of ${probes.length} probe(s).`,
  );
  return 0;
}

/**
 * CI entry point: a crash is turned into an exit code with a message naming
 * what broke, so it reads differently from a policy failure.
 *
 * @param {{
 *   rootDir?: string;
 *   log?: (line: string) => void;
 *   logError?: (line: string) => void;
 * }} [options]
 * @returns {number} 0 on success, 1 on failure.
 */
export function runCli(options = {}) {
  const rootDir = options.rootDir ?? process.cwd();
  const log = options.log ?? console.log;
  const logError = options.logError ?? console.error;
  try {
    return check({ rootDir, log, logError });
  } catch (error) {
    logError(`[seeded-gitignore-check] FAIL: ${error instanceof Error ? error.message : String(error)}`);
    return 1;
  }
}

const isEntryPoint = process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isEntryPoint) {
  process.exitCode = runCli();
}
