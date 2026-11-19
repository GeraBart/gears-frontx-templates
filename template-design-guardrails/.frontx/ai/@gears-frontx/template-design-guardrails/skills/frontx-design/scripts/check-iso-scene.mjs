#!/usr/bin/env node
/**
 * Quick check of an isometric scene built from `templates/iso-scene.tsx`.
 * Reads the file as text (no parser).
 *
 *   node check-iso-scene.mjs <scene.tsx>...
 *
 * Findings, one line each as `file:line message`: no `viewBox="0 0 400 320"`;
 * a colour literal (#hex, rgb(), rgba(), hsl(), hsla(), oklch(), color(), or a
 * fill= or stroke= attribute other than none or currentColor); literal path
 * data in a d= attribute (paths come from the `iso` helpers); a <text>,
 * <image>, <foreignObject> or <img> element; more than 12 shapes (<Box>,
 * <Cylinder>, <Line>, <path> outside the FloorGrid, Box, Cylinder and Line
 * definitions); not exactly one highlighted element (tone="hi" or kind="hi").
 *
 * Exit 0 clean, 1 findings, 2 input error (no file given, a file it cannot read).
 * The CLI runs only when this file is the entry point.
 */
import { readFileSync, realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const USAGE = 'usage: node check-iso-scene.mjs <scene.tsx>...';
const MAX_SHAPES = 12;
const NOT_SHAPES = ['FloorGrid', 'Box', 'Cylinder', 'Line'];

/** Comments become spaces, newlines kept, so indexes and line numbers stay put. */
function stripComments(text) {
  const blank = (m) => m.replace(/[^\n]/g, ' ');
  return text.replace(/\/\*[\s\S]*?\*\//g, blank).replace(/\/\/[^\n]*/g, blank);
}

/** The [start, end) range of `function name(...) { ... }`, by paren and brace counting. */
function functionRange(text, name) {
  const m = new RegExp(`function\\s+${name}\\s*\\(`).exec(text);
  if (!m) return null;
  let i = m.index + m[0].length;
  for (let depth = 1; i < text.length && depth > 0; i += 1) {
    if (text[i] === '(') depth += 1;
    else if (text[i] === ')') depth -= 1;
  }
  i = text.indexOf('{', i);
  if (i === -1) return null;
  let depth = 0;
  for (let j = i; j < text.length; j += 1) {
    if (text[j] === '{') depth += 1;
    else if (text[j] === '}' && --depth === 0) return [m.index, j + 1];
  }
  return [m.index, text.length];
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

  if (!/viewBox="0 0 400 320"/.test(code)) add(0, 'no viewBox="0 0 400 320": the drawing is 400 x 320');

  each(/#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b/g, (m) => `colour literal ${m[0]}: use a kit token class`);
  each(/\b(?:rgba?|hsla?|oklch|color)\(/g, (m) => `colour literal ${m[0]}: use a kit token class`);
  for (const m of code.matchAll(/\b(fill|stroke)=(\{[^}]*\}|"[^"]*"|'[^']*')/g)) {
    const value = m[2].replace(/^\{\s*|\s*\}$/g, '').replace(/^["'`]|["'`]$/g, '');
    if (value !== 'none' && value !== 'currentColor') add(m.index, `${m[1]}=${m[2]}: set colours by class, not by attribute`);
  }
  each(/\bd=(?:"[^"]*"|'[^']*'|\{\s*(?:"[^"]*"|'[^']*'|`\s*[Mm][^`]*`)\s*\})/g, () => 'literal path data: build d from the iso helpers');
  each(/<(text|image|foreignObject|img)\b/g, (m) => `<${m[1]}> is not allowed: line shapes only`);

  // Shapes outside the definitions of the grid and the shape components.
  const skip = NOT_SHAPES.map((name) => functionRange(code, name)).filter(Boolean);
  const shapes = [...code.matchAll(/<(?:Box|Cylinder|Line|path)\b/g)].filter(
    (m) => !skip.some(([start, end]) => m.index >= start && m.index < end),
  );
  if (shapes.length > MAX_SHAPES) {
    add(shapes[MAX_SHAPES].index, `${shapes.length} shapes, at most ${MAX_SHAPES}`);
  }

  const highlights = [...code.matchAll(/\b(?:tone|kind)="hi"/g)];
  if (highlights.length !== 1) {
    add(highlights[1]?.index ?? 0, `${highlights.length} highlighted elements (tone="hi" or kind="hi"), exactly 1`);
  }
  return findings;
}

function main(files) {
  if (files.length === 0) {
    console.error(USAGE);
    return 2;
  }
  const findings = [];
  for (const file of files) {
    let text;
    try {
      text = readFileSync(file, 'utf8');
    } catch (error) {
      console.error(`cannot read ${file}: ${error.code ?? error.message}`);
      return 2;
    }
    findings.push(...checkScene(text, file));
  }
  for (const line of findings) console.log(line);
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
