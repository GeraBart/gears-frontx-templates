/**
 * Runs the design skill's `scripts/check-iso-scene.mjs` on the base scene
 * `templates/iso-scene.tsx` and on variants of it: each breaks one rule and
 * must give a finding. The CLI is run in a child process for its exit codes.
 */
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
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
const PLACEHOLDER_END = '      {/* End of placeholder. */}';

/** The base scene with `extra` added after the placeholder shapes. */
const withShapes = (extra) => {
  expect(SCENE).toContain(PLACEHOLDER_END);
  return SCENE.replace(PLACEHOLDER_END, `${extra}\n${PLACEHOLDER_END}`);
};

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

  it('exits 2 with no file given', () => {
    expect(run().code).toBe(2);
  });
});
