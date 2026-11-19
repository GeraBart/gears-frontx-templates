// @vitest-environment node
// The static check on fixture projects written to a temp dir. Fixtures are
// strings, not files in this package, so the shell's lint and type-check
// never read the raw elements and literals they hold on purpose.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { checkContext, checkScript, collectFiles, main } from '../runner/static.mjs';
import { designMdParser, readSkillJson } from '../runner/skill.mjs';

// A small DESIGN.md of its own, so a token edit in the project DESIGN.md
// does not change the fix texts asserted here.
const FIXTURE_DESIGN_MD = `---
name: "Fixture"
version: "0.0.0"
description: "Tokens for the static check tests."
colors:
  background: "var(--background)"
  foreground: "var(--foreground)"
  primary: "var(--primary)"
  muted: "var(--muted)"
  border: "var(--border)"
  ring: "var(--ring)"
  danger: "var(--danger)"
spacing:
  space-2: "var(--space-2)"
  space-4: "var(--space-4)"
rounded:
  base: "var(--radius)"
typography:
  body:
    fontSize: "var(--text-body-size)"
elevation:
  popover-shadow: "var(--popover-shadow)"
motion:
  duration-micro: "var(--duration-micro)"
  ease-standard: "var(--ease-standard)"
---

# Fixture
`;
const designDir = fs.mkdtempSync(path.join(os.tmpdir(), 'design-verify-static-design-'));
const DESIGN_MD = path.join(designDir, 'DESIGN.md');
fs.writeFileSync(DESIGN_MD, FIXTURE_DESIGN_MD);
afterAll(() => fs.rmSync(designDir, { recursive: true, force: true }));

// The same front matter without one group, so a definition branch gated on
// that kind's tokens can be told from one gated on the colour kind.
function designMdWithout(...groups: string[]): string {
  const front = FIXTURE_DESIGN_MD.replace(/^---\n([\s\S]*?)\n---/, (_m, body: string) => {
    const kept: string[] = [];
    let dropping = false;
    for (const line of body.split('\n')) {
      if (/^\S/.test(line)) dropping = groups.some((group) => line.startsWith(`${group}:`));
      if (!dropping) kept.push(line);
    }
    return `---\n${kept.join('\n')}\n---`;
  });
  const file = path.join(designDir, `DESIGN.${groups.join('-')}.md`);
  fs.writeFileSync(file, front);
  return file;
}

const dirs: string[] = [];
afterEach(() => {
  for (const dir of dirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
});

function project(files: Record<string, string>) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'design-verify-static-'));
  dirs.push(root);
  for (const [file, text] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    fs.writeFileSync(path.join(root, file), text);
  }
  return root;
}

type Finding = { gate: string; kind: string; file: string; line: number; column: number; found: string; fix: string };

async function check(root: string, args: string[] = []) {
  const out: string[] = [];
  const err: string[] = [];
  const code = await main(['--src', 'src', '--design', DESIGN_MD, ...args], {
    cwd: root,
    env: {},
    log: (line) => out.push(line),
    error: (line) => err.push(line),
  });
  const reportFile = path.join(root, 'design-verify-report', 'static-findings.json');
  const report = fs.existsSync(reportFile) ? JSON.parse(fs.readFileSync(reportFile, 'utf8')) : undefined;
  return { code, out: out.join('\n'), err: err.join('\n'), report, findings: (report?.findings ?? []) as Finding[] };
}

const found = (findings: Finding[]) => findings.map((f) => `${f.kind} ${f.found}`);

describe('CSS Modules', () => {
  it('reports each literal kind where DESIGN.md names a token for it', async () => {
    const root = project({
      'src/Orders.module.css': [
        '.a {',
        '  color: #fff;',
        '  background: rgb(0 0 0 / 50%);',
        '  border-color: oklch(0.7 0.1 200);',
        '  outline-color: red;',
        '  --local: #123456;',
        '  padding: 12px;',
        '  margin: calc(var(--space-2) + 2px);',
        '  border-radius: 6px;',
        '  font-size: 13px;',
        '  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);',
        '  transition: opacity 150ms ease-in;',
        '}',
      ].join('\n'),
    });
    const { code, findings } = await check(root);
    expect(code).toBe(0);
    expect(found(findings)).toEqual([
      'color #fff in color',
      'color rgb(0 0 0/50%) in background',
      'color oklch(0.7 0.1 200) in border-color',
      'color red in outline-color',
      'color #123456 in --local',
      'spacing 12px in padding',
      'spacing 2px in margin',
      'radius 6px in border-radius',
      'font-size 13px in font-size',
      'shadow 0 1px 2px rgba(0,0,0,0.2) in box-shadow',
      'duration 150ms in transition',
      'easing ease-in in transition',
    ]);
    expect(findings.every((f) => f.gate === 'SYS-002')).toBe(true);
    expect(findings[0]).toMatchObject({ file: 'src/Orders.module.css', line: 2, column: 10 });
    expect(findings[0].fix).toBe(
      'use a color token from DESIGN.md colors: var(--background), var(--foreground), var(--primary), ' +
        'var(--muted), var(--border), var(--ring) and 1 more there',
    );
    expect(findings.find((f) => f.kind === 'spacing')?.fix).toBe('use a spacing token from DESIGN.md spacing: var(--space-2), var(--space-4)');
    expect(findings.find((f) => f.kind === 'radius')?.fix).toBe('use a radius token from DESIGN.md rounded: var(--radius)');
    expect(findings.find((f) => f.kind === 'font-size')?.fix).toBe('use a font-size token from DESIGN.md typography: var(--text-body-size)');
    expect(findings.find((f) => f.kind === 'shadow')?.fix).toBe('use a shadow token from DESIGN.md elevation: var(--popover-shadow)');
    expect(findings.find((f) => f.kind === 'duration')?.fix).toBe('use a duration token from DESIGN.md motion: var(--duration-micro)');
    expect(findings.find((f) => f.kind === 'easing')?.fix).toBe('use an easing token from DESIGN.md motion: var(--ease-standard)');
  });

  it('reads only the font size of the font shorthand, not its line height', async () => {
    const root = project({
      'src/Type.module.css': [
        '.a { font: 600 14px/20px var(--font-sans); }',
        '.b { font: 12px system-ui; }',
        '.c { font: italic 600 var(--text-body-size)/24px var(--font-sans); }',
        '.d { font: 600 calc(1rem + 2px)/1.5 var(--font-sans); }',
      ].join('\n'),
      'src/Type.tsx': "export const T = () => <p style={{ font: '600 14px/20px var(--font-sans)' }} />;",
    });
    const { findings } = await check(root);
    expect(findings.map((f) => `${f.file}:${f.line} ${f.kind} ${f.found}`)).toEqual([
      'src/Type.module.css:1 font-size 14px in font',
      'src/Type.module.css:2 font-size 12px in font',
      'src/Type.module.css:4 font-size 1rem in font',
      'src/Type.module.css:4 font-size 2px in font',
      'src/Type.tsx:1 font-size 14px in font',
    ]);
  });

  // Vite compiles `color: danger` to the @value's literal, so the definition
  // is where the literal is. A definition is read like a `--name: value`
  // declaration: its colours, and its lengths by the property its references
  // read in (`padding: pad`), since a @value name names no kind.
  it('reads a CSS Modules @value definition as a local custom property, and skips the import form', async () => {
    const root = project({
      'src/Values.module.css': [
        '@value danger: #e11d48;',
        '@value brand: var(--primary);',
        "@value muted, gap from './tokens.module.css';",
        '@value  warn  oklch(0.8 0.1 80);',
        '@value pad: 12px;',
        '@value spare: 30px;',
        '.a { color: danger; padding: pad; }',
      ].join('\n'),
    });
    const { code, findings } = await check(root);
    expect(code).toBe(0);
    expect(findings.map((f) => `${f.line}:${f.column} ${f.gate} ${f.kind} ${f.found}`)).toEqual([
      '1:1 SYS-002 color #e11d48 in @value danger',
      '4:1 SYS-002 color oklch(0.8 0.1 80) in @value warn',
      '5:1 SYS-002 spacing 12px in @value pad',
    ]);
    expect(findings[0].fix).toMatch(/^use a color token from DESIGN.md colors: /);
  });

  // references/foundations.md allows values derived from tokens: a relative
  // colour or a color-mix() is checked by the colours it starts from.
  it('checks a relative colour by its origin and color-mix() by each colour argument', async () => {
    const root = project({
      'src/Derived.module.css': [
        '.a { color: rgb(from var(--foreground) r g b / 50%); }',
        '.b { background: oklch(from var(--primary) calc(l * 0.9) c h); }',
        '.c { border-color: hsl(from oklch(from var(--border) l c h) h s l); }',
        '.d { outline-color: rgb(from currentColor r g b / 40%); }',
        '.e { color: rgb(from #fff r g b / 50%); }',
        '.f { color: hsl(from red h s l); }',
        '.g { color: hsl(from oklch(from #123456 l c h) h s l); }',
        '.h { background: color-mix(in srgb, var(--primary) 30%, transparent); }',
        '.i { background: color-mix(in oklch, var(--primary), rgb(from var(--muted) r g b / 50%)); }',
        '.j { background: color-mix(in srgb, var(--primary) 30%, #fff); }',
        '.k { background: color-mix(in hsl longer hue, red, rgb(from #000 r g b)); }',
        '.l { box-shadow: 0 0 0 var(--space-2) rgb(from var(--ring) r g b / 50%); }',
        '.m { box-shadow: 0 0 0 var(--space-2) rgb(from #000 r g b / 50%); }',
      ].join('\n'),
      'src/Derived.tsx': [
        "export const A = () => <p style={{ color: 'rgb(from var(--foreground) r g b / 50%)' }} />;",
        "export const B = () => <p style={{ color: 'rgb(from #fff r g b)' }} />;",
      ].join('\n'),
    });
    const { findings } = await check(root);
    expect(findings.map((f) => `${f.file}:${f.line} ${f.kind} ${f.found}`)).toEqual([
      'src/Derived.module.css:5 color rgb(from #fff r g b/50%) in color',
      'src/Derived.module.css:6 color hsl(from red h s l) in color',
      'src/Derived.module.css:7 color hsl(from oklch(from #123456 l c h) h s l) in color',
      'src/Derived.module.css:10 color #fff in background',
      'src/Derived.module.css:11 color red in background',
      'src/Derived.module.css:11 color rgb(from #000 r g b) in background',
      'src/Derived.module.css:13 shadow 0 0 0 var(--space-2) rgb(from #000 r g b/50%) in box-shadow',
      'src/Derived.tsx:2 color rgb(from #fff r g b) in color',
    ]);
    expect(findings.every((f) => f.gate === 'SYS-002')).toBe(true);
  });

  // Every colour channel (alpha aside) must read an origin channel keyword or
  // a var(), alone or inside calc(); a channel of only literal numbers is a
  // fixed value, so the colour is a literal. Alpha may be anything, and
  // `alpha` is not a colour channel keyword.
  it('derives a relative colour only when every colour channel reads its origin or a var()', async () => {
    const root = project({
      'src/Channels.module.css': [
        '.a { color: oklch(from var(--p) l c var(--h)); }',
        '.b { color: rgb(from var(--p) var(--r) var(--g) var(--b)); }',
        '.c { color: oklch(from var(--p) l c calc(h + 30)); }',
        '.d { color: rgb(from var(--p) r g b / 50%); }',
        '.e { color: color(from var(--p) srgb r g b); }',
        '.f { color: rgb(from var(--x) 255 0 0); }',
        '.g { color: rgb(from var(--x) 255 0 0 / alpha); }',
        '.h { color: hwb(from var(--p) 0 0% 0% / alpha); }',
        '.i { color: rgb(from var(--p) r 0 0); }',
      ].join('\n'),
    });
    const { findings } = await check(root);
    expect(findings.map((f) => `${f.line} ${f.found}`)).toEqual([
      '6 rgb(from var(--x)255 0 0) in color',
      '7 rgb(from var(--x)255 0 0/alpha) in color',
      '8 hwb(from var(--p)0 0% 0%/alpha) in color',
      '9 rgb(from var(--p) r 0 0) in color',
    ]);
  });

  it('accepts tokens, var() fallbacks that name tokens, 0, the allowed keywords and plain .css files', async () => {
    const root = project({
      'src/Clean.module.css': [
        '.a {',
        '  color: var(--foreground);',
        '  background: var(--surface, var(--background));',
        '  border-color: transparent;',
        '  fill: currentColor;',
        '  padding: 0;',
        '  margin: calc(var(--space-2) * -1);',
        '  gap: var(--space-2);',
        '  border-radius: 50%;',
        '  box-shadow: none;',
        '  transition: opacity var(--duration-micro) var(--ease-standard);',
        '  font-family: var(--font-sans);',
        '  width: 320px;',
        '}',
      ].join('\n'),
      'src/global.css': '.b { color: #fff; }',
    });
    const { code, findings, report } = await check(root);
    expect(findings).toEqual([]);
    expect(report.files).toEqual(['src/Clean.module.css']);
    expect(code).toBe(0);
  });
});

// A literal moved into a local custom property and used through var() hides
// from no check: the definition is read as a declaration in its own right,
// the theme folder as the one place a declared step is not a finding.
describe('literal steps behind var()', () => {
  it('reports the same three literals inline and behind local custom properties', async () => {
    const inline = await check(project({ 'src/A.module.css': '.title { font-size: 4rem; margin-top: 96px; color: #0756f5; }' }));
    expect(inline.findings.map((f) => `${f.kind} ${f.found}`)).toEqual([
      'font-size 4rem in font-size',
      'spacing 96px in margin-top',
      'color #0756f5 in color',
    ]);

    const behind = await check(
      project({
        'src/B.module.css': [
          '.parent { --my-size: 4rem; --my-gap: 96px; --my-color: #0756f5; }',
          '.title { font-size: var(--my-size); margin-top: var(--my-gap); color: var(--my-color); }',
        ].join('\n'),
      }),
    );
    expect(behind.findings.map((f) => `${f.kind} ${f.found}`)).toEqual([
      'font-size 4rem in --my-size',
      'spacing 96px in --my-gap',
      'color #0756f5 in --my-color',
    ]);
    // A definition is a declared step: its fix names the theme folder where a
    // project declares the steps the kit lacks.
    for (const finding of behind.findings) expect(finding.fix).toContain('src-app/app/themes/');
    expect(behind.code).toBe(0);
  });

  // A definition whose name and use sites are silent declares no kit kind:
  // its length is a layout value, not a missing spacing step, so it is not a
  // finding (a finding here could never be waived: SYS-002 has no waiver).
  it('leaves a definition with a silent name and no kinded use site unreported', async () => {
    const { findings } = await check(
      project({
        'src/Layout.module.css': [
          '.shell { --sidebar-width: 240px; --border-w: 1px; --bp-md: 768px; --shadow-color: #e11d48; }',
          '.sidebar { width: var(--sidebar-width); border-width: var(--border-w); }',
          '.sheet { color: var(--shadow-color); }',
        ].join('\n'),
      }),
    );
    // The colour the shadow-named definition holds is still a literal colour.
    expect(found(findings)).toEqual(['color #e11d48 in --shadow-color']);
  });

  // The use-site table spans every scanned file: a tokens file declaring the
  // steps and the screen file spending them is the arrangement the check
  // exists for, so a definition whose kind only another file names is
  // reported all the same. Six definitions, six findings, none of them
  // visible to a per-file table.
  it('reads a definition kind from a use site in another file', async () => {
    const { findings, code } = await check(
      project({
        'src/Tokens.module.css':
          '.t { --my-gap: 8px; --my-size: 14px; --my-radius: 6px; --my-pad: 16px; --my-row: 20px; --my-inset: 24px; }',
        'src/Hero.module.css': [
          '.hero {',
          '  gap: var(--my-gap);',
          '  font-size: var(--my-size);',
          '  border-radius: var(--my-radius);',
          '  padding-left: var(--my-pad);',
          '  row-gap: var(--my-row);',
          '  margin-block-start: var(--my-inset);',
          '}',
        ].join('\n'),
      }),
    );
    expect(findings.map((f) => `${f.file} ${f.kind} ${f.found}`)).toEqual([
      'src/Tokens.module.css spacing 8px in --my-gap',
      'src/Tokens.module.css font-size 14px in --my-size',
      'src/Tokens.module.css radius 6px in --my-radius',
      'src/Tokens.module.css spacing 16px in --my-pad',
      'src/Tokens.module.css spacing 20px in --my-row',
      'src/Tokens.module.css spacing 24px in --my-inset',
    ]);
    expect(code).toBe(0);
  });

  // A literal a var() carries as its fallback is a literal the source
  // declares and the browser can paint (when the variable is invalid at
  // computed-value time), so it hides from no check a direct literal hides
  // from - a var() without a fallback still names nothing.
  it('reports a literal given as a var() fallback where the kind is known', async () => {
    const { findings } = await check(
      project({
        'src/Fallback.module.css': [
          '.a {',
          '  padding: var(--unknown, 64px);',
          '  color: var(--brand, #0756f5);',
          '  font: 600 var(--size, 14px)/20px sans-serif;',
          '  font: var(--stack, 600 14px/20px sans-serif);',
          '  box-shadow: var(--shadow-x, 0 1px 2px #000);',
          '  transition: opacity var(--dur, 150ms) var(--ease, ease-in);',
          '  margin: var(--space-2);',
          '}',
        ].join('\n'),
      }),
    );
    expect(found(findings)).toEqual([
      'spacing 64px in padding',
      'color #0756f5 in color',
      'font-size 14px in font',
      'font-size 14px in font',
      'shadow var(--shadow-x,0 1px 2px #000) in box-shadow',
      'duration 150ms in transition',
      'easing ease-in in transition',
    ]);
  });

  it('reports a duration definition only on a time unit, and a shadow-named colour as a colour', async () => {
    const { findings } = await check(
      project({
        'src/Motion.module.css': [
          '.a { --hover-duration: 150ms; --delay-offset: 4px; --duration-bar-height: 8px; }',
          '.b { transition: color var(--hover-duration); }',
        ].join('\n'),
      }),
    );
    expect(found(findings)).toEqual(['duration 150ms in --hover-duration']);
  });

  // Each definition branch runs on the kind's own tokens, never on the colour
  // kind's: a DESIGN.md without colours still reports a spacing definition,
  // and one without a radius group reports no radius definition.
  it('gates every definition branch on its own kind having DESIGN.md tokens', async () => {
    const noColors = designMdWithout('colors');
    const { findings: spacingReported } = await check(
      project({ 'src/B.module.css': '.parent { --my-gap: 96px; } .title { margin-top: var(--my-gap); }' }),
      ['--design', noColors],
    );
    expect(found(spacingReported)).toEqual(['spacing 96px in --my-gap']);

    const noRadius = designMdWithout('rounded');
    const { findings: radiusSilent } = await check(
      project({ 'src/C.module.css': '.parent { --card-radius: 6px; } .card { border-radius: var(--card-radius); }' }),
      ['--design', noRadius],
    );
    expect(radiusSilent).toEqual([]);

    const { findings: radiusReported } = await check(
      project({ 'src/C.module.css': '.parent { --card-radius: 6px; } .card { border-radius: var(--card-radius); }' }),
    );
    expect(found(radiusReported)).toEqual(['radius 6px in --card-radius']);
  });

  it('reads a definition kind from its name and reports a bare easing', async () => {
    const { findings } = await check(
      project({
        'src/C.module.css': [
          '.a { --card-radius: 6px; --title-text-size: 18px; --hover-duration: 150ms; --card-shadow: 0 1px 2px #000; }',
          '.b {',
          '  border-radius: var(--card-radius);',
          '  font-size: var(--title-text-size);',
          '  transition: color var(--hover-duration) var(--hover-ease);',
          '  box-shadow: var(--card-shadow);',
          '}',
          // `move` and `settle` name no kit kind, so their definitions say
          // nothing to fix: unreported, however their values read.
          '.c { --move-time: 200ms; --settle: ease-in-out; }',
        ].join('\n'),
        'src/D.tsx': "export const D = () => <div style={{ '--my-gap': '96px' }} />;",
      }),
    );
    expect(findings.map((f) => `${f.kind} ${f.found}`)).toEqual([
      'radius 6px in --card-radius',
      'font-size 18px in --title-text-size',
      'duration 150ms in --hover-duration',
      'shadow 0 1px 2px #000 in --card-shadow',
      'easing ease-in-out in --settle',
      'spacing 96px in --my-gap',
    ]);
    expect(findings.every((f) => f.gate === 'SYS-002')).toBe(true);
  });

  // A bare CSS keyword (`auto` in `margin: 0 auto`) is not a @value use
  // site: a definition named after one, with an otherwise silent name, gets
  // no kit kind from an unrelated keyword use and is not reported.
  it('does not read a value keyword as a @value use site', async () => {
    const { findings } = await check(
      project({
        'src/Keys.module.css': ['@value auto: 96px;', '.a { margin: 0 auto; }'].join('\n'),
      }),
    );
    expect(findings).toEqual([]);
  });

  it('never reads a theme folder file for literals, but still selects it', async () => {
    const literals = '.parent { --my-size: 4rem; --my-gap: 96px; --my-color: #0756f5; } .title { font-size: var(--my-size); margin-top: var(--my-gap); color: var(--my-color); }';
    const root = project({
      'src-app/app/themes/extra.module.css': literals,
      'src-app/app/themes/custom.ts': `export const theme = { variables: {} };\n`,
      'src-app/Other.module.css': '.a { color: #fff; }',
    });
    const out: string[] = [];
    const err: string[] = [];
    const code = await main(['--src', 'src-app', '--design', DESIGN_MD], {
      cwd: root,
      env: {},
      log: (line) => out.push(line),
      error: (line) => err.push(line),
    });
    const reportFile = path.join(root, 'design-verify-report', 'static-findings.json');
    const report = JSON.parse(fs.readFileSync(reportFile, 'utf8'));
    const findings = (report?.findings ?? []) as Finding[];
    expect(found(findings)).toEqual(['color #fff in color']);
    expect(report.files).toEqual(['src-app/Other.module.css', 'src-app/app/themes/custom.ts', 'src-app/app/themes/extra.module.css']);
    // Readdir order is the filesystem's: compare the skipped list by membership.
    const reason = 'the project theme folder src-app/app/themes/ declares its own tokens: literals not checked';
    expect([...report.skipped].sort((a: { path: string }, b: { path: string }) => (a.path < b.path ? -1 : 1))).toEqual([
      { path: 'src-app/app/themes/custom.ts', reason },
      { path: 'src-app/app/themes/extra.module.css', reason },
    ]);
    expect(code).toBe(0);
    // The run is expected to be clean: nothing may reach the error sink,
    // which no other assertion here reads.
    expect(err.join('\n')).toBe('');
  });

  // A --src at or inside the theme folder is a clean run that lists the
  // skipped files, not a usage error: the theme declares the project's own
  // steps, so an empty selection there is expected, not a gate passed on
  // nothing.
  it('treats a --src inside the theme folder as a clean run naming the skipped files', async () => {
    const root = project({
      'src-app/app/themes/extra.module.css': '.parent { --my-gap: 96px; } .title { margin-top: var(--my-gap); }',
      'src-app/app/themes/custom.ts': `export const theme = { variables: {} };\n`,
    });
    const out: string[] = [];
    // Error keeps its own sink: the SKIPPED lines scan `out`, and a stderr
    // line mixed into it would hide behind assertions that never read it.
    const err: string[] = [];
    const code = await main(['--src', 'src-app/app/themes', '--design', DESIGN_MD], {
      cwd: root,
      env: {},
      log: (line) => out.push(line),
      error: (line) => err.push(line),
    });
    expect(code).toBe(0);
    expect(err.join('\n')).toBe('');
    expect(out.join('\n')).toContain('SKIPPED src-app/app/themes/custom.ts');
    expect(out.join('\n')).not.toContain('selects no file');
  });

  // The theme skip covers the literal checks only: a screen root under the
  // theme folder still gets the native-element gate, so a raw <button> there
  // is a finding while its literals are the project's own declarations.
  it('keeps the native-element gate for a .tsx under the theme folder', async () => {
    const root = project({
      'src-app/app/themes/Screen.tsx': "export const S = () => <button style={{ padding: 8 }} />;",
      'src-app/app/Other.tsx': 'export const O = () => <button />;',
    });
    const out: string[] = [];
    const code = await main(['--src', 'src-app', '--design', DESIGN_MD], {
      cwd: root,
      env: {},
      log: (line) => out.push(line),
      error: (line) => out.push(line),
    });
    const reportFile = path.join(root, 'design-verify-report', 'static-findings.json');
    const report = JSON.parse(fs.readFileSync(reportFile, 'utf8'));
    const findings = (report?.findings ?? []) as Finding[];
    // The theme file's element is found; its padding literal is not reported.
    expect(code).toBe(0);
    expect(found(findings)).toEqual(['element <button>', 'element <button>']);
    expect(findings[0]).toMatchObject({ gate: 'SYS-001', file: 'src-app/app/Other.tsx' });
    expect(findings[1]).toMatchObject({ gate: 'SYS-001', file: 'src-app/app/themes/Screen.tsx' });
  });

  // The theme skip covers the literal findings only: a theme stylesheet that
  // does not parse still reports, like every selected source - a malformed
  // theme .module.css is an input error (exit 2), not a clean run.
  it('reports parse errors from a theme stylesheet instead of passing it clean', async () => {
    const root = project({
      'src-app/app/themes/broken.module.css': '.a { color red; }',
      'src-app/app/themes/custom.ts': `export const theme = { variables: {} };\n`,
    });
    const out: string[] = [];
    const code = await main(['--src', 'src-app', '--design', DESIGN_MD], {
      cwd: root,
      env: {},
      log: (line) => out.push(line),
      error: (line) => out.push(line),
    });
    expect(code).toBe(2);
    expect(out.join('\n')).toContain('PARSE ERROR src-app/app/themes/broken.module.css');
  });

  // A theme file reaches the theme branch only through the guards every
  // selected file passes: a non-regular entry under the theme folder (a
  // device file a symlink puts there) is skipped as such, not handed on to
  // the literal checks, and a theme file reached through two --src paths is
  // selected and read once, its element findings not duplicated.
  it('skips a non-regular theme entry and reads a twice-reached theme file once', async () => {
    const root = project({
      'src-app/app/themes/custom.ts': `export const theme = { variables: {} };\n`,
      'src-app/app/themes/Screen.tsx': 'export const S = () => <button />;',
      'src-app/Reachable.tsx': 'export const R = () => <button />;',
    });
    fs.symlinkSync('/dev/null', path.join(root, 'src-app/app/themes/Null.module.css'));
    fs.mkdirSync(path.join(root, 'src'));
    fs.symlinkSync('../src-app/app/themes', path.join(root, 'src/themes-link'));

    const out: string[] = [];
    const code = await main(['--src', 'src-app', '--src', 'src/themes-link', '--design', DESIGN_MD], {
      cwd: root,
      env: {},
      log: (line) => out.push(line),
      error: (line) => out.push(line),
    });
    const report = JSON.parse(
      fs.readFileSync(path.join(root, 'design-verify-report', 'static-findings.json'), 'utf8'),
    );
    const findings = (report?.findings ?? []) as Finding[];

    expect(code).toBe(0);
    // The screen root under the theme folder is still element-checked, once,
    // and so is the one outside the theme folder.
    expect(found(findings)).toEqual(['element <button>', 'element <button>']);
    expect(findings).toEqual([
      expect.objectContaining({ gate: 'SYS-001', file: 'src-app/Reachable.tsx' }),
      expect.objectContaining({ gate: 'SYS-001', file: 'src-app/app/themes/Screen.tsx' }),
    ]);
    expect(report.files).toEqual([
      'src-app/Reachable.tsx',
      'src-app/app/themes/Screen.tsx',
      'src-app/app/themes/custom.ts',
    ]);
    const reason = 'the project theme folder src-app/app/themes/ declares its own tokens: literals not checked';
    expect([...report.skipped].sort((a: { path: string }, b: { path: string }) => (a.path < b.path ? -1 : 1))).toEqual([
      { path: 'src-app/app/themes/Null.module.css', reason: 'not a regular file or directory' },
      { path: 'src-app/app/themes/Screen.tsx', reason },
      { path: 'src-app/app/themes/custom.ts', reason },
      { path: 'src/themes-link/Null.module.css', reason: 'not a regular file or directory' },
      { path: 'src/themes-link/Screen.tsx', reason: 'the same file as src-app/app/themes/Screen.tsx, read once' },
      { path: 'src/themes-link/custom.ts', reason: 'the same file as src-app/app/themes/custom.ts, read once' },
    ]);
  });

  // A shadow name wins over the text/font and spacing segments it may also
  // carry: the whole value is one shadow, not a font-size step whose colour
  // gets reported on its own, and not a spacing step read off its lengths.
  it('reads a shadow name whole, before its text and spacing segments', async () => {
    const { findings } = await check(
      project({
        'src/Shadow.module.css': [
          '.a { --text-shadow: 0 1px 2px #000; --card-shadow-spacing: 4px; }',
          '.b { text-shadow: var(--text-shadow); }',
          '.c { box-shadow: var(--card-shadow-spacing); }',
        ].join('\n'),
      }),
    );
    expect(found(findings)).toEqual(['shadow 0 1px 2px #000 in --text-shadow', 'shadow 4px in --card-shadow-spacing']);
  });

  // The use-site table reads a definition's kind from the properties its
  // references are used in, and those properties' real spellings are the
  // hyphenated gap longhands and the radius corner longhands - a definition
  // with a silent name used only there is still a declared step.
  it('reads a definition kind from row-gap and the radius corner longhands', async () => {
    const { findings } = await check(
      project({
        'src/Gaps.module.css': [
          '.a { --stack-sep: 96px; --corner: 6px; }',
          '.b { row-gap: var(--stack-sep); }',
          '.c { border-top-left-radius: var(--corner); }',
          '.d { border-start-end-radius: var(--corner); }',
        ].join('\n'),
      }),
    );
    expect(found(findings)).toEqual(['spacing 96px in --stack-sep', 'radius 6px in --corner']);
  });
});

describe('TSX and TS', () => {
  it('reports native elements, roles and anchors the kit covers, and inline style literals', async () => {
    const root = project({
      'src/Orders.tsx': [
        "import { Button } from '@gears-frontx/ui-kit';",
        'export function Orders({ onClick }: { onClick: () => void }) {',
        '  return (',
        '    <div>',
        '      <button onClick={onClick}>Save</button>',
        '      <input />',
        '      <input type="checkbox" />',
        '      <input type="hidden" />',
        '      <select />',
        '      <textarea />',
        '      <dialog open />',
        '      <table />',
        '      <a onClick={onClick}>Open</a>',
        '      <a href="#" onClick={onClick}>Open</a>',
        '      <a href="/orders">Orders</a>',
        '      <div role="button" onClick={onClick} />',
        '      <Button>Kit</Button>',
        "      <div style={{ color: '#fff', padding: 8, margin: 0, gap: 'var(--space-2)' }} />",
        '    </div>',
        '  );',
        '}',
      ].join('\n'),
      'src/legacy.ts': "import React from 'react';\nexport const x = React.createElement('button', { type: 'button' });\n",
    });
    const { code, findings } = await check(root);
    expect(code).toBe(0);
    expect(found(findings)).toEqual([
      'element <button>',
      'element <input type="text">',
      'element <input type="checkbox">',
      'element <select>',
      'element <textarea>',
      'element <dialog>',
      'element <table>',
      'element <a onClick> with no link target',
      'element <a onClick> with no link target',
      'element <div role="button">',
      'color #fff in color',
      'spacing 8 in padding',
      'element <button>',
    ]);
    const button = findings[0];
    expect(button).toMatchObject({ gate: 'SYS-001', file: 'src/Orders.tsx', line: 5, column: 7 });
    expect(button.fix).toBe('use the kit Button from @gears-frontx/ui-kit');
    expect(findings[2].fix).toBe('use the kit Checkbox from @gears-frontx/ui-kit');
    expect(findings[3].fix).toBe('use the kit Select or NativeSelect from @gears-frontx/ui-kit');
    expect(findings.at(-1)).toMatchObject({ file: 'src/legacy.ts', line: 2 });
    expect(findings.filter((f) => f.kind !== 'element').every((f) => f.gate === 'SYS-002')).toBe(true);
  });

  // React appends px only to a bare number on a length property, so a bare
  // number elsewhere (opacity, z-index, flex, line-height, font-weight) is no
  // literal length.
  it('reports a bare number in an inline style only on a length property', async () => {
    const root = project({
      'src/Inline.tsx': [
        'export const Clean = () => <p style={{ opacity: 0.5, zIndex: 10, flex: 1, lineHeight: 1.5, fontWeight: 600 }} />;',
        'export const Negative = () => <p style={{ marginTop: -8 }} />;',
        "export const Vendor = () => <p style={{ WebkitTransition: 'opacity 200ms' }} />;",
      ].join('\n'),
      // A vendor prefix takes the kinds of the property it prefixes.
      'src/Vendor.module.css': '.a { -webkit-transition: opacity 200ms; }',
    });
    const { findings } = await check(root);
    expect(findings.map((f) => `${f.file}:${f.line} ${f.kind} ${f.found}`)).toEqual([
      'src/Inline.tsx:2 spacing -8 in margin-top',
      'src/Inline.tsx:3 duration 200ms in -webkit-transition',
      'src/Vendor.module.css:1 duration 200ms in -webkit-transition',
    ]);
    expect(findings.every((f) => f.gate === 'SYS-002')).toBe(true);
  });

  // A var() reference is CSS, not a token to regex: the runner reads it the
  // way the CSS path does, with css-tree, so whitespace inside the
  // parentheses does not hide a use site and leave a definition's kind
  // unreported.
  it('reads a var() reference in a style value whatever whitespace the parentheses hold', async () => {
    const root = project({
      'src/Space.tsx': "export const S = () => <p style={{ '--x': '13px', padding: 'var( --x)' }} />;",
    });
    const { findings } = await check(root);
    expect(found(findings)).toEqual(['spacing 13px in --x']);
  });

  // Use sites are read only from the style objects the runner supports (the
  // JSX style attribute and the style prop of a createElement call): an
  // unrelated object literal that happens to hold a var() under a kinded
  // property must not name a definition's kind - the finding it produces
  // names no literal the style object holds and no waiver covers.
  it('reads var() use sites only from style objects the runner supports', async () => {
    const root = project({
      'src/Data.tsx': [
        "const data = { padding: 'var(--x)' };",
        "export const D = () => <p style={{ '--x': '13px', width: 'var(--x)' }} />;",
      ].join('\n'),
    });
    const { findings } = await check(root);
    expect(findings).toEqual([]);
  });

  it("reports React's createElement and leaves document.createElement alone", async () => {
    const root = project({
      'src/react-default.ts': "import React from 'react';\nexport const a = React.createElement('button');\n",
      'src/react-namespace.ts': "import * as R from 'react';\nexport const b = R.createElement('select');\n",
      'src/react-named.ts': "import { createElement as h } from 'react';\nexport const c = h('textarea');\n",
      'src/react-global.ts': "export const d = React.createElement('table');\n",
      'src/dom.ts': [
        "const field = document.createElement('input');",
        "const host = window.document.createElement('button');",
        "function createElement(tag: string) { return tag; }",
        "export const e = [field, host, createElement('dialog')];",
      ].join('\n'),
      'src/other-lib.ts': "import { createElement } from 'preact';\nexport const f = createElement('button', null);\n",
    });
    const { findings } = await check(root);
    expect(findings.map((f) => `${f.file} ${f.found}`)).toEqual([
      'src/react-default.ts <button>',
      'src/react-global.ts <table>',
      'src/react-named.ts <textarea>',
      'src/react-namespace.ts <select>',
    ]);
  });

  // The JSX form `<Button style={{ padding: 8 }} />` reports the literal; the
  // createElement form of the same call must too.
  it('reads the style of a createElement call whatever its type, and reports only a native tag as an element', async () => {
    const root = project({
      'src/Create.ts': [
        "import React from 'react';",
        "import { Button } from '@gears-frontx/ui-kit';",
        "const Local = () => null;",
        'export const a = React.createElement(Button, { style: { padding: 8 } });',
        "export const b = React.createElement(Local, { style: { color: '#fff' } });",
        "export const c = React.createElement('span', { style: { gap: 'var(--space-2)', margin: '4px' } });",
        "export const d = document.createElement('div');",
      ].join('\n'),
      'src/Jsx.tsx': [
        "import { Button } from '@gears-frontx/ui-kit';",
        'export const J = () => <Button style={{ padding: 8 }} />;',
      ].join('\n'),
    });
    const { findings } = await check(root);
    expect(findings.map((f) => `${f.file}:${f.line} ${f.kind} ${f.found}`)).toEqual([
      'src/Create.ts:4 spacing 8 in padding',
      'src/Create.ts:5 color #fff in color',
      'src/Create.ts:6 spacing 4px in margin',
      'src/Jsx.tsx:2 spacing 8 in padding',
    ]);
    expect(findings.every((f) => f.gate === 'SYS-002')).toBe(true);
  });

  it('is clean on a screen built from kit components and tokens, and skips tests', async () => {
    const root = project({
      'src/Clean.tsx': [
        "import { Button, Input } from '@gears-frontx/ui-kit';",
        "import styles from './Clean.module.css';",
        'export function Clean() {',
        "  return <div className={styles.row} style={{ gap: 'var(--space-2)' }}><Input /><Button>Save</Button><a href=\"/x\">x</a></div>;",
        '}',
      ].join('\n'),
      'src/Clean.module.css': '.row { display: flex; gap: var(--space-2); }',
      'src/__tests__/Clean.test.tsx': 'export const t = <button />;',
    });
    const { code, findings, report, out } = await check(root);
    expect(findings).toEqual([]);
    expect(report.files).toEqual(['src/Clean.module.css', 'src/Clean.tsx']);
    expect(report.summary).toMatchObject({ filesChecked: 2, totalFindings: 0, parseErrors: 0 });
    expect(out).toContain('2 file(s) checked - 0 finding(s)');
    expect(code).toBe(0);
  });
});

describe('exit codes and the baseline', () => {
  const dirty = { 'src/A.module.css': '.a { color: #fff; }\n.b { padding: 4px; }' };

  it('exits 1 on findings only with --fail-on-findings, and then only on new ones against a baseline', async () => {
    const root = project(dirty);
    expect((await check(root)).code).toBe(0);
    const failing = await check(root, ['--fail-on-findings']);
    expect(failing.code).toBe(1);

    fs.copyFileSync(path.join(root, 'design-verify-report/static-findings.json'), path.join(root, 'baseline.json'));
    const known = await check(root, ['--fail-on-findings', '--baseline', 'baseline.json']);
    expect(known.code).toBe(0);
    expect(known.out).toContain('vs baseline: 0 new, 0 resolved, 0 unverified, 2 carried over');

    // A line moved, a finding resolved and a new one: identity ignores the line.
    fs.writeFileSync(path.join(root, 'src/A.module.css'), '\n\n.a { color: #fff; }\n.c { margin: 3px; }');
    const changed = await check(root, ['--fail-on-findings', '--baseline', 'baseline.json']);
    expect(changed.code).toBe(1);
    expect(changed.out).toContain('vs baseline: 1 new, 1 resolved, 0 unverified, 1 carried over');
    expect(changed.out).toContain('NEW SYS-002 src/A.module.css: spacing 3px in margin');
    expect(changed.report.baselineComparison.new).toHaveLength(1);
  });

  it('exits 2 on usage and input errors, and on a file that does not parse', async () => {
    const root = project({ ...dirty, 'src/Broken.tsx': 'export const = ;' });
    const broken = await check(root);
    expect(broken.code).toBe(2);
    expect(broken.out).toContain('PARSE ERROR src/Broken.tsx:1:');

    const out: string[] = [];
    const io = { cwd: root, env: {}, log: () => undefined, error: (l: string) => out.push(l) };
    expect(await main(['--design', DESIGN_MD], io)).toBe(2);
    expect(out.pop()).toMatch(/--src is required/);
    expect(await main(['--src', 'missing', '--design', DESIGN_MD], io)).toBe(2);
    expect(out.pop()).toMatch(/does not exist/);
    expect(await main(['--src', 'src'], io)).toBe(2);
    expect(out.pop()).toMatch(/DESIGN\.md not found/);
    expect(await main(['--src', 'src', '--design', DESIGN_MD, '--baseline', 'nope.json'], io)).toBe(2);
    expect(out.pop()).toMatch(/--baseline .*nope\.json could not be read/);
    expect(await main(['--nope'], io)).toBe(2);
  });

  // parseDiagnostics is internal to TypeScript; a release without it must not
  // make every file parse clean.
  it('reports syntax errors through the public API, without the internal parseDiagnostics', async () => {
    const ts = (await import('typescript')).default;
    const withoutInternals = {
      ...ts,
      createSourceFile: (...args: Parameters<typeof ts.createSourceFile>) =>
        Object.defineProperty(ts.createSourceFile(...args), 'parseDiagnostics', { value: undefined }),
    };
    const { readDesignMd } = await designMdParser();
    const ctx = checkContext(readSkillJson('rules/static-check.json'), readDesignMd(DESIGN_MD).front);
    const { parseErrors } = checkScript(ctx, withoutInternals, 'export const = ;', 'src/Broken.tsx');
    expect(parseErrors).toEqual([expect.stringMatching(/^src\/Broken\.tsx:1:14: Variable declaration expected\.$/)]);
    expect(checkScript(ctx, withoutInternals, 'export const ok = <p />;', 'src/Ok.tsx').parseErrors).toEqual([]);
  });

  it('honours the root waiver file by source glob, and exits 2 on one it cannot honour', async () => {
    const root = project({
      'src/tree/Tree.tsx': 'export const T = () => <table />;',
      'src/Other.tsx': 'export const O = () => <table />;',
      'src/tree/Tree.module.css': '.a { color: #fff; }',
      'src/clean/Ok.tsx': 'export const K = () => null;',
      'design-waivers.json': JSON.stringify({
        waivers: [
          { gate: 'SYS-001', screen: { source: 'src/tree/**' }, reason: 'Tree grid: kit gap.' },
          { gate: 'SYS-001', screen: { source: 'src/clean/**' }, reason: 'Unused.' },
          { gate: 'SYS-001', screen: { route: '/?screen=tree' }, reason: 'For the render runner.' },
          { gate: 'LAY-001', screen: { source: 'src/tree/**' }, reason: 'Review only: no checker reports LAY-001.' },
          { gate: 'SYS-001', screen: { source: 'src/billing/**' }, reason: 'Outside this --src.' },
        ],
      }),
    });
    const { code, findings, report, out } = await check(root, ['--fail-on-findings']);
    expect(found(findings)).toEqual(['element <table>', 'color #fff in color']);
    expect(findings.map((f) => f.file)).toEqual(['src/Other.tsx', 'src/tree/Tree.module.css']);
    expect(report.waived).toEqual([
      expect.objectContaining({ file: 'src/tree/Tree.tsx', gate: 'SYS-001', waiver: { index: 0, reason: 'Tree grid: kit gap.' } }),
    ]);
    expect(report.summary).toMatchObject({ totalFindings: 2, waived: 1 });
    const unread = 'needs a file matching src/billing/** under --src; none of the files read matches';
    expect(report.waivers).toMatchObject({
      applied: 1,
      notApplicable: [
        { index: 2, needs: 'needs screen.source' },
        { index: 4, needs: unread },
      ],
    });
    expect(out).toContain('WAIVED SYS-001 src/tree/Tree.tsx:1:24 element <table> - waiver #0: Tree grid: kit gap.');
    expect(out).toContain('UNUSED WAIVER #1 SYS-001 (source src/clean/**): matched no finding in this run');
    expect(out).toContain('WAIVER #2 SYS-001 (route /?screen=tree): not applicable to this run (needs screen.source)');
    // A glob no file of this run matches was never exercised, so it is not unused.
    expect(out).toContain(`WAIVER #4 SYS-001 (source src/billing/**): not applicable to this run (${unread})`);
    expect(out).toContain('RECORDED WAIVER #3 LAY-001 (source src/tree/**): recorded, not checked by this runner');
    expect(report.waivers.unused.map((w: { index: number }) => w.index)).toEqual([1]);
    expect(code).toBe(1);

    // SYS-002 never yields: a waiver for it is an input error, not a pass.
    fs.writeFileSync(
      path.join(root, 'design-waivers.json'),
      JSON.stringify({ waivers: [{ gate: 'SYS-002', screen: { source: 'src/**' }, reason: 'x' }] }),
    );
    const rejected = await check(root);
    expect(rejected.code).toBe(2);
    expect(rejected.err).toMatch(/SYS-002 has waiver "never" and cannot be waived/);
  });

  it('exits 0 with --fail-on-findings when a waiver covers every finding, and 1 without it', async () => {
    const root = project({
      'src/tree/Tree.tsx': 'export const T = () => <table />;',
      'design-waivers.json': JSON.stringify({
        waivers: [{ gate: 'SYS-001', screen: { source: 'src/tree/**' }, reason: 'Tree grid: kit gap.' }],
      }),
    });
    const waived = await check(root, ['--fail-on-findings']);
    expect(waived.findings).toEqual([]);
    expect(waived.report.waived).toHaveLength(1);
    expect(waived.code).toBe(0);

    fs.rmSync(path.join(root, 'design-waivers.json'));
    const open = await check(root, ['--fail-on-findings']);
    expect(open.findings).toHaveLength(1);
    expect(open.code).toBe(1);
  });

  it('exits 2 naming each --src that selects no file, so a gate never passes on nothing', async () => {
    const root = project({
      'src/A.module.css': '.a { color: #fff; }',
      'src/typo/.keep': '',
      'tests-only/__tests__/A.test.tsx': 'export const t = <button />;',
    });
    const result = await check(root, ['--src', 'src/typo', '--src', 'tests-only']);
    expect(result.code).toBe(2);
    expect(result.err).toContain('--src src/typo selects no file to check\n--src tests-only selects no file to check\n');
    expect(result.err).not.toContain('--src src ');
    expect(result.report).toBeUndefined();

    // A --src inside another selects its files too: overlap is not empty.
    const overlap = await check(root, ['--src', 'src/A.module.css']);
    expect(overlap.code).toBe(0);
    expect(overlap.report.files).toEqual(['src/A.module.css']);
    expect(overlap.report.skipped).toEqual([]);
  });

  it('follows symbolic links, reads a cycle once and names every selectable entry it cannot check', async () => {
    const root = project({
      'lib/Shared.tsx': 'export const S = () => <button />;',
      'other/B.module.css': '.a { color: #fff; }',
    });
    fs.mkdirSync(path.join(root, 'src'));
    fs.symlinkSync('../lib', path.join(root, 'src/linked'));
    fs.symlinkSync('.', path.join(root, 'lib/loop'));
    fs.symlinkSync('../other/B.module.css', path.join(root, 'src/B.module.css'));
    fs.symlinkSync('../nowhere.tsx', path.join(root, 'src/Broken.tsx'));
    const { code, report, findings, out } = await check(root);
    expect(report.files).toEqual(['src/B.module.css', 'src/linked/Shared.tsx']);
    expect(found(findings)).toEqual(['color #fff in color', 'element <button>']);
    const skipped = [...report.skipped].sort((a, b) => (a.path < b.path ? -1 : 1));
    expect(skipped).toEqual([
      { path: 'src/Broken.tsx', reason: expect.stringMatching(/^cannot be read \(ENOENT\)/) },
      { path: 'src/linked/loop', reason: 'a link cycle back to src/linked, read once' },
    ]);
    expect(out).toContain('2 file(s) checked, 2 skipped');
    expect(out).toContain('SKIPPED src/linked/loop: a link cycle back to src/linked, read once');
    expect(code).toBe(0);
  });

  // chmod does not stop root, so the unlistable directory needs a normal user.
  it.skipIf(process.getuid?.() === 0)(
    'lists a directory it cannot list as skipped, and nothing the globs leave out',
    async () => {
      const root = project({
        'src/A.module.css': '.a { color: #fff; }',
        'src/locked/B.tsx': 'export const B = () => <button />;',
        'src/__tests__/locked/C.test.tsx': 'export const C = () => <button />;',
      });
      fs.symlinkSync('../nowhere.tsx', path.join(root, 'src/__tests__/Gone.tsx'));
      fs.symlinkSync('../nowhere', path.join(root, 'src/dist'));
      fs.symlinkSync('../nowhere.tsx', path.join(root, 'src/Moved.tsx'));
      const locked = [path.join(root, 'src/locked'), path.join(root, 'src/__tests__/locked')];
      for (const dir of locked) fs.chmodSync(dir, 0o000);
      try {
        const { code, report, out } = await check(root);
        expect(report.files).toEqual(['src/A.module.css']);
        const skipped = [...report.skipped].sort((a, b) => (a.path < b.path ? -1 : 1));
        expect(skipped).toEqual([
          { path: 'src/Moved.tsx', reason: expect.stringMatching(/^cannot be read \(ENOENT\)/) },
          { path: 'src/locked', reason: 'a directory that cannot be listed (EACCES)' },
        ]);
        expect(out).toContain('SKIPPED src/locked: a directory that cannot be listed (EACCES)');
        expect(code).toBe(0);
      } finally {
        for (const dir of locked) fs.chmodSync(dir, 0o755);
      }
    },
  );

  it('excludes a directory only by a glob ending in /**, never by a file-name glob', () => {
    const root = project({
      'src/_foo.tsx': 'export const F = () => null;',
      'src/Bar.tsx': 'export const B = () => null;',
      'src/pages/Baz.tsx': 'export const Z = () => null;',
      'src/dist/Out.tsx': 'export const O = () => null;',
      // A directory whose own name matches the file-name glob `**/_*`: its
      // files are still checked.
      'src/_drafts/Page.tsx': 'export const P = () => null;',
    });
    fs.symlinkSync('../nowhere.tsx', path.join(root, 'src/_gone.tsx'));
    fs.symlinkSync('../nowhere.tsx', path.join(root, 'src/Moved.tsx'));
    const globs = { css: ['**/*.css'], script: ['**/*.tsx'], exclude: ['**/_*', '**/dist/**'] };
    const { files, skipped } = collectFiles(root, [path.join(root, 'src')], globs);
    expect(files).toEqual([
      ['src/Bar.tsx', 'script'],
      ['src/_drafts/Page.tsx', 'script'],
      ['src/pages/Baz.tsx', 'script'],
    ]);
    // A broken link is listed unless an exclude glob covers it.
    expect(skipped).toEqual([{ path: 'src/Moved.tsx', reason: expect.stringMatching(/^cannot be read \(ENOENT\)/) }]);
  });

  it('resolves paths against $INIT_CWD, where npm was invoked', async () => {
    const root = project(dirty);
    const code = await main(['--src', 'src', '--design', DESIGN_MD], {
      cwd: os.tmpdir(),
      env: { INIT_CWD: root },
      log: () => undefined,
    });
    expect(code).toBe(0);
    expect(fs.existsSync(path.join(root, 'design-verify-report/static-findings.json'))).toBe(true);
  });
});

describe('the shipped shell layout', () => {
  // The real layout the shell template ships, not a fixture: the template
  // must pass the static check it delivers. The shell sits beside this
  // package in this repository and around it when the package is composed
  // into a project (src-app/verify_packages/design-verify), so the shell root
  // is found by walking up from this file. The check runs exactly as a
  // `verify:static` run in the shell does: the shell root as the project
  // root, so its own design-waivers.json applies, and the report goes to a
  // temp dir, never to the default design-verify-report/ in the tree.
  //
  // The shell's layout is the project's to edit, so this test pins only the
  // invariant the package itself delivers: the run ends with no unwaived
  // finding, and every waived finding is SYS-001 (the one gate a waiver may
  // carry, since SYS-002 never yields). Where the shell is, one native
  // element per layout file that needs it is the waiver file's own record.
  function findShellRoot(): string | undefined {
    for (let dir = path.dirname(fileURLToPath(import.meta.url)); ; dir = path.dirname(dir)) {
      for (const candidate of [path.join(dir, 'template-shell'), dir]) {
        if (fs.existsSync(path.join(candidate, 'src-app', 'app', 'layout', 'Layout.tsx'))) return candidate;
      }
      if (path.dirname(dir) === dir) return undefined;
    }
  }

  // Only the presence of the shell decides the skip, and nothing throws while
  // tests are collected: a composed project owns its layout and may move or
  // rename it, and a missing one must not fail every file in this suite.
  const shellRoot = findShellRoot();

  it.skipIf(!shellRoot)('passes the static check: no unwaived finding, every waived one is SYS-001', async () => {
    const designMd = [
      path.join(shellRoot!, 'DESIGN.md'),
      path.join(shellRoot!, '..', 'template-design-guardrails', 'DESIGN.md'),
    ].find((file) => fs.existsSync(file));
    expect(designMd, `no DESIGN.md found for the shell at ${shellRoot}`).toBeTruthy();
    const out = fs.mkdtempSync(path.join(os.tmpdir(), 'design-verify-shell-layout-'));
    dirs.push(out);
    const lines: string[] = [];
    const code = await main(['--src', 'src-app/app/layout', '--design', designMd as string, '--out', out], {
      env: { INIT_CWD: shellRoot as string },
      log: (line) => lines.push(line),
      error: (line) => lines.push(line),
    });
    const report = JSON.parse(fs.readFileSync(path.join(out, 'static-findings.json'), 'utf8'));
    // The invariant the package delivers, not the project's own counts: no
    // unwaived finding, and every waived one is SYS-001, the one gate a
    // waiver may carry (SYS-002 never yields). The layout files and waiver
    // entries behind those counts are the project's to edit.
    expect(report.findings).toEqual([]);
    expect(
      report.waived.every((f: Finding) => f.gate === 'SYS-001'),
      `waived findings must all be SYS-001, got ${JSON.stringify(report.waived.map((f: Finding) => f.gate))}`,
    ).toBe(true);
    expect(code).toBe(0);
  });
});

describe('rules/static-check.json', () => {
  const rules = readSkillJson('rules/static-check.json');
  const named = [
    ...Object.values(rules.elements.tags),
    ...Object.values(rules.elements.inputTypes),
    ...Object.values(rules.elements.roles),
    rules.elements.anchorAsButton,
  ].flat() as string[];

  // Real names only: a kit upgrade that drops or renames one fails here.
  // The kit is imported once in beforeAll with its own explicit timeout: the
  // import itself is what can take tens of seconds on a cold cache, and the
  // per-test limit must bound the assertion, not the module load.
  let kit: Record<string, unknown>;

  beforeAll(async () => {
    kit = (await import('@gears-frontx/ui-kit')) as Record<string, unknown>;
  }, 120000);

  it('names only components the installed kit exports', () => {
    expect(named.length).toBeGreaterThan(20);
    expect(named.filter((name) => typeof kit[name] === 'undefined')).toEqual([]);
  });
});
