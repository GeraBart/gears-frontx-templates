#!/usr/bin/env node
/**
 * Quick check of an isometric scene built from `templates/iso-scene.tsx`.
 * Reads the file as text (no parser).
 *
 *   node check-iso-scene.mjs <scene.tsx>...
 *
 * Findings, one line each as `file:line message`: no `viewBox="0 0 400 320"`;
 * a colour literal (#hex, rgb(), rgba(), hsl(), hsla(), oklch(), color(), or a
 * fill= or stroke= attribute on a lowercase SVG element, or a fill, stroke or
 * colour key in a style object, other than none, currentColor or var(--...));
 * literal path data in a d= attribute (paths come from the `iso` helpers); a
 * <text>, <image>, <foreignObject> or <img> element; more than 12 shapes
 * (<Box>, <Cylinder>, <Line>, <Face> and raw <path>; <FloorGrid> is not
 * counted) outside the definitions of FloorGrid, Box, Cylinder, Line and Face;
 * not exactly one highlighted element (tone="hi", kind="hi" or a
 * className={styles.hi} outside those definitions); a view written as a
 * hand-made object literal with ox and oy keys while the scene never calls
 * fitView (build the view with fitView(min, max) so the drawing fills its
 * width).
 *
 * The shape count is an optional aid for an honest agent: it counts the
 * skill's own shape components (Box, Cylinder, Line, Face, path) written out
 * one per element, as the reference asks.
 *
 * Exit 0 clean, 1 findings, 2 input error (no file given, a file it cannot read).
 * The CLI runs only when this file is the entry point.
 */
import { readFileSync, realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const USAGE = 'usage: node check-iso-scene.mjs <scene.tsx>...';
const MAX_SHAPES = 12;
const NOT_SHAPES = ['FloorGrid', 'Box', 'Cylinder', 'Line', 'Face'];

/** Comments become spaces, newlines kept, so indexes and line numbers stay put.
 * String and template spans match first and are kept, so a `//` inside a
 * string (an xmlns url, say) does not blank the rest of its line. */
function stripComments(text) {
  const blank = (m) => m.replace(/[^\n]/g, ' ');
  return text.replace(
    /"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`|\/\*[\s\S]*?\*\/|\/\/[^\n]*/g,
    (m) => (m.startsWith('/') ? blank(m) : m),
  );
}

/** The [start, end) range of `function name(...) { ... }` or of the arrow form
 * `const|let name = (...) => ...`, by paren and brace counting. An expression
 * body (no brace after `=>`) ends at the matching `)` of a wrapping `(`, else
 * at the first `;` or line break at depth 0. */
function functionRange(text, name) {
  const m = new RegExp(
    `(?:function\\s+${name}\\s*\\(|(?:const|let)\\s+${name}\\s*=\\s*(?:function\\s*)?\\()`,
  ).exec(text);
  if (!m) return null;
  const start = m.index;
  let i = start + m[0].length;
  for (let depth = 1; i < text.length && depth > 0; i += 1) {
    if (text[i] === '(') depth += 1;
    else if (text[i] === ')') depth -= 1;
  }
  const arrow = /^\s*=>\s*/.exec(text.slice(i, i + 128));
  if (arrow) i += arrow[0].length;
  else i = text.indexOf('{', i);
  if (i === -1) return null;
  if (text[i] === '{') {
    let depth = 0;
    for (let j = i; j < text.length; j += 1) {
      if (text[j] === '{') depth += 1;
      else if (text[j] === '}' && --depth === 0) return [start, j + 1];
    }
    return [start, text.length];
  }
  if (text[i] === '(') {
    let depth = 1;
    for (i += 1; i < text.length && depth > 0; i += 1) {
      if (text[i] === '(') depth += 1;
      else if (text[i] === ')') depth -= 1;
    }
    return [start, i];
  }
  let depth = 0;
  for (let j = i; j < text.length; j += 1) {
    if ('([{'.includes(text[j])) depth += 1;
    else if (')]}'.includes(text[j])) depth -= 1;
    else if (depth === 0 && (text[j] === ';' || text[j] === '\n')) return [start, j];
  }
  return [start, text.length];
}

/** Findings for one scene's text, each `file:line message`. */
export function checkScene(text, file) {
  const code = stripComments(text);
  const lineOf = (index) => code.slice(0, index).split('\n').length;
  const findings = [];
  const add = (index, message) => findings.push(`${file}:${lineOf(index)} ${message}`);
  const each = (pattern, message) => {
    for (const m of code.matchAll(pattern)) add(m.index, message(m));
  };

  if (!/viewBox\s*=\s*(?:\{\s*)?(["'])0\s+0\s+400\s+320\1(?:\s*\})?/.test(code)) {
    add(0, 'no viewBox="0 0 400 320": the drawing is 400 x 320');
  }

  // Not after href= or xlinkHref= (fragment links) or inside url( (a paint
  // reference), and not a fragment id kept whole (`#face`, `#1a2b3c-top`).
  each(
    /(?<!\b(?:href|xlinkHref)\s*=\s*\{?\s*["'])(?<!\burl\()#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})(?![\w-])/g,
    (m) => `colour literal ${m[0]}: use a kit token class`,
  );
  each(/\b(?:rgba?|hsla?|oklch|color)\(/g, (m) => `colour literal ${m[0]}: use a kit token class`);
  // fill= and stroke= on lowercase SVG elements only, not at props of the
  // capitalised parts: a part's own props (view, at, tone, surface, ...) may
  // hold anything, and a prop named fill on <Box> is not an SVG attribute.
  for (const tag of code.matchAll(/<[a-z][\w-]*\b[^>]*>/g)) {
    for (const m of tag[0].matchAll(/\b(fill|stroke)=(\{[^}]*\}|"[^"]*"|'[^']*')/g)) {
      const value = m[2].replace(/^\{\s*|\s*\}$/g, '').replace(/^["'`]|["'`]$/g, '').trim();
      if (value !== 'none' && value !== 'currentColor' && !/^var\(--[\w-]+\)$/.test(value)) {
        add(tag.index + m.index, `${m[1]}=${m[2]}: set colours by class, not by attribute`);
      }
    }
  }
  for (const m of code.matchAll(/\bstyle\s*=\s*\{\{([^}]*)\}\}/g)) {
    for (const s of m[1].matchAll(/\b(fill|stroke|color)\s*:\s*(["'])([^"']*)\2/g)) {
      const value = s[3].trim();
      if (value !== 'none' && value !== 'currentColor' && !/^var\(--[\w-]+\)$/.test(value)) {
        add(m.index + s.index, `style {{ ${s[1]}: ${s[2]}${s[3]}${s[2]} }}: set colours by class, not by style`);
      }
    }
  }
  each(/(?<![\w-])d=(?:"[^"]*"|'[^']*'|\{\s*(?:"[^"]*"|'[^']*'|`\s*[Mm][^`]*`)\s*\})/g, () => 'literal path data: build d from the iso helpers');
  each(/<(text|image|foreignObject|img)\b/g, (m) => `<${m[1]}> is not allowed: line shapes only`);

  // Shapes outside the definitions of the grid and the shape components.
  const skip = NOT_SHAPES.map((name) => functionRange(code, name)).filter(Boolean);
  const shapes = [...code.matchAll(/<(?:Box|Cylinder|Line|Face|path)\b/g)].filter(
    (m) => !skip.some(([start, end]) => m.index >= start && m.index < end),
  );
  if (shapes.length > MAX_SHAPES) {
    add(shapes[MAX_SHAPES].index, `${shapes.length} shapes, at most ${MAX_SHAPES}`);
  }

  // A view built by hand instead of fitted: an object literal with ox and oy
  // keys and no fitView call anywhere.
  if (!/\bfitView\s*\(/.test(code)) {
    const literal = code.match(/\{[^{}]*(?<![\w$])ox\s*:[^{}]*(?<![\w$])oy\s*:[^{}]*\}/) ?? code.match(/\{[^{}]*(?<![\w$])oy\s*:[^{}]*(?<![\w$])ox\s*:[^{}]*\}/);
    if (literal) add(literal.index, 'build the view with fitView(min, max) so the drawing fills its width');
  }

  // A ring, plane or polyline highlight is a <path className={styles.hi}>, so
  // count that member access too: in code (not in a string) and outside the
  // definitions, whose own tone check and styles[kind] are not highlights.
  const quoted = [...code.matchAll(/"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'/g)].map((m) => [m.index, m.index + m[0].length]);
  const inQuotes = (index) => quoted.some(([start, end]) => index >= start && index < end);
  const highlights = [
    ...code.matchAll(/(?<![\w-])(?:tone|kind)\s*=\s*(?:\{\s*)?(["'])hi\1(?:\s*\})?/g),
    ...[...code.matchAll(/(?<![\w.$])styles\s*\.\s*hi(?![\w$])/g)].filter(
      (m) => !inQuotes(m.index) && !skip.some(([start, end]) => m.index >= start && m.index < end),
    ),
  ].sort((a, b) => a.index - b.index);
  if (highlights.length !== 1) {
    add(highlights[1]?.index ?? 0, `${highlights.length} highlighted elements (tone="hi", kind="hi" or className={styles.hi}), exactly 1`);
  }
  return findings;
}

function main(files) {
  if (files.length === 0) {
    console.error(USAGE);
    return 2;
  }
  const findings = [];
  const errors = [];
  for (const file of files) {
    let text;
    try {
      text = readFileSync(file, 'utf8');
    } catch (error) {
      errors.push(`cannot read ${file}: ${error.code ?? error.message}`);
      continue;
    }
    // Outside the try: a checker bug is a bug, not an unreadable file.
    findings.push(...checkScene(text, file));
  }
  for (const line of findings) console.log(line);
  for (const line of errors) console.error(line);
  if (errors.length > 0) return 2;
  return findings.length > 0 ? 1 : 0;
}

/** Whether this file is the process entry point. */
function isEntryPoint() {
  try {
    return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
}

if (isEntryPoint()) process.exitCode = main(process.argv.slice(2));
