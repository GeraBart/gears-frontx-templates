/**
 * Runs the design skill's `scripts/check-iso-scene.mjs` on the base scene
 * `templates/iso-scene.tsx` and on variants of it: each breaks one rule and
 * must give a finding. The CLI is run in a child process for its exit codes.
 */
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { checkScene } from '../.frontx/ai/@gears-frontx/template-design-guardrails/skills/frontx-design/scripts/check-iso-scene.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const skill = path.join(here, '../.frontx/ai/@gears-frontx/template-design-guardrails/skills/frontx-design');
const script = path.join(skill, 'scripts/check-iso-scene.mjs');
const scenePath = path.join(skill, 'templates/iso-scene.tsx');
const SCENE = readFileSync(scenePath, 'utf8');
// Built at run time, so the source itself holds no colour literal.
const HEX = ['#', '1a2b3c'].join('');
const RED = ['r', 'e', 'd'].join('');
const RGB = ['r', 'g', 'b'].join('');
const HSL = ['h', 's', 'l'].join('');
const PLACEHOLDER_END = '      {/* End of placeholder. */}';

/** The base scene with `extra` added after the placeholder shapes. */
const withShapes = (extra) => {
  expect(SCENE).toContain(PLACEHOLDER_END);
  return SCENE.replace(PLACEHOLDER_END, `${extra}\n${PLACEHOLDER_END}`);
};

/** The scene with `Box`, `Cylinder`, `Line` and `FloorGrid` written as arrow
 * functions with block bodies, as an agent may write them. */
const asArrows = (text) =>
  text.replace(
    /^function (Box|Cylinder|Line|FloorGrid)\((.*)\) \{$/gm,
    (_, name, params) => `const ${name} = (${params}) => {`,
  );

/** Eight honest lines: with the base scene's three shapes that is 11, one under
 * the limit, so a body that stops being skipped shows as 19. */
const EIGHT_LINES = Array.from(
  { length: 8 },
  (_, i) => `      <Line view={view} from={[${i}, 0, 0]} to={[${i}, 1, 0]} />`,
).join('\n');

const run = (...args) => {
  const result = spawnSync(process.execPath, [script, ...args], { encoding: 'utf8' });
  return { code: result.status, stdout: result.stdout, stderr: result.stderr };
};

describe('check-iso-scene', () => {
  it('passes the base scene clean, from the CLI too', () => {
    expect(checkScene(SCENE, 'scene.tsx')).toEqual([]);
    expect(run(scenePath)).toMatchObject({ code: 0, stdout: '' });
  });

  it.each([
    ['a #hex colour', `      <path className={styles.edge} style={{ stroke: "${HEX}" }} d={segment(view, [0, 0, 0], [1, 1, 0])} />`, new RegExp(`colour literal ${HEX}`)],
    ['literal path data', '      <path className={styles.edge} d="M0 0L1 1" />', /literal path data/],
    ['a second highlighted element', '      <Line view={view} from={[0, 0, 0]} to={[1, 1, 0]} kind="hi" />', /2 highlighted elements/],
    ['13 shapes', Array.from({ length: 10 }, (_, i) => `      <Line view={view} from={[${i}, 0, 0]} to={[${i}, 1, 0]} />`).join('\n'), /13 shapes, at most 12/],
    ['a <text>', '      <text x="10" y="10">Label</text>', /<text> is not allowed/],
  ])('reports %s', (_name, extra, message) => {
    const findings = checkScene(withShapes(extra), 'scene.tsx');
    expect(findings.some((line) => /^scene\.tsx:\d+ /.test(line) && message.test(line))).toBe(true);
  });

  it.each([
    ['a stroke in a style object', `      <g style={{ stroke: "${RED}" }} />`, /set colours by class, not by style/],
    ['a fill attribute', `      <path fill="${RED}" className={styles.edge} d={segment(view, [0, 0, 0], [1, 1, 0])} />`, /set colours by class, not by attribute/],
    ['an rgb() call', `      <g style={{ fill: "${RGB}(59, 130, 246)" }} />`, new RegExp(`colour literal ${RGB}\\(`)],
    ['an hsl() call', `      <g style={{ stroke: "${HSL}(210, 80%, 50%)" }} />`, new RegExp(`colour literal ${HSL}\\(`)],
  ])('reports %s', (_name, extra, message) => {
    const findings = checkScene(withShapes(extra), 'scene.tsx');
    expect(findings.some((line) => /^scene\.tsx:\d+ /.test(line) && message.test(line))).toBe(true);
  });

  it.each([
    ['a missing viewBox', SCENE.replace('viewBox="0 0 400 320"', ''), /no viewBox/],
    ['zero highlighted elements', SCENE.replace(' tone="hi"', ''), /0 highlighted elements/],
  ])('reports %s', (_name, text, message) => {
    const findings = checkScene(text, 'scene.tsx');
    expect(findings.some((line) => /^scene\.tsx:\d+ /.test(line) && message.test(line))).toBe(true);
  });

  it('counts a path with className={styles.hi} as the one highlight', () => {
    const text = withShapes('      <path className={styles.hi} d={ring(view, 0, 0, 1, 0)} />').replace(' tone="hi"', '');
    expect(text).not.toContain('tone="hi"');
    expect(checkScene(text, 'scene.tsx')).toEqual([]);
  });

  it('reports a second highlight drawn as a path with className={styles.hi}', () => {
    const findings = checkScene(withShapes('      <path className={styles.hi} d={plane(view, 0, 0, 1, 1, 0)} />'), 'scene.tsx');
    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatch(/^scene\.tsx:\d+ 2 highlighted elements/);
  });

  it.each([
    ['an xmlns url on the viewBox line', SCENE.replace('viewBox="0 0 400 320"', 'xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 320"')],
    ['a viewBox in single quotes', SCENE.replace('viewBox="0 0 400 320"', "viewBox='0 0 400 320'")],
    ['a highlight in single quotes', SCENE.replace('tone="hi"', "tone='hi'")],
  ])('stays clean with %s', (_name, text) => {
    expect(checkScene(text, 'scene.tsx')).toEqual([]);
  });

  it.each([
    ['a fragment link', '      <path href="#face" className={styles.edge} d={segment(view, [0, 0, 0], [1, 1, 0])} />'],
    ['a hyphenated fragment id', `      <path clipPath="${HEX}-top" className={styles.edge} d={segment(view, [0, 0, 0], [1, 1, 0])} />`],
    ['a var() fill attribute', `      <path fill="var(--primary)" className={styles.edge} d={segment(view, [0, 0, 0], [1, 1, 0])} />`],
    ['a var() fill attribute with spaces around it', `      <path fill=" var(--primary) " className={styles.edge} d={segment(view, [0, 0, 0], [1, 1, 0])} />`],
    ['data-tone and data-d attributes', `      <path data-tone="hi" data-d="M0 0" className={styles.edge} d={segment(view, [0, 0, 0], [1, 1, 0])} />`],
  ])('stays clean with %s', (_name, extra) => {
    expect(checkScene(withShapes(extra), 'scene.tsx')).toEqual([]);
  });

  it('stays clean with the shape components as arrow functions', () => {
    const arrow = asArrows(SCENE);
    expect(arrow).toContain('const Box = (');
    expect(arrow).not.toContain('function Box(');
    expect(checkScene(arrow, 'scene.tsx')).toEqual([]);
    expect(checkScene(asArrows(withShapes(EIGHT_LINES)), 'scene.tsx')).toEqual([]);
  });

  it('exits 1 when a scene has a finding', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'check-iso-scene-'));
    try {
      const file = path.join(dir, 'scene.tsx');
      writeFileSync(file, withShapes('      <text x="10" y="10">Label</text>'));
      const result = run(file);
      expect(result.code).toBe(1);
      expect(result.stdout).toMatch(/<text> is not allowed/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('exits 2 on an unreadable file and still prints the earlier findings', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'check-iso-scene-'));
    try {
      const file = path.join(dir, 'scene.tsx');
      writeFileSync(file, withShapes('      <text x="10" y="10">Label</text>'));
      const missing = path.join(dir, 'missing.tsx');
      const result = run(file, missing);
      expect(result.code).toBe(2);
      expect(result.stdout).toMatch(/<text> is not allowed/);
      expect(result.stderr).toContain(`cannot read ${missing}`);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('exits 2 with no file given', () => {
    expect(run().code).toBe(2);
  });
});
