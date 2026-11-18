#!/usr/bin/env node
/**
 * design-verify static check - reads a screen's source, no browser: literal
 * values where the kit has a token, and native elements where the kit has a
 * component.
 *
 *   npm run verify:static --workspace=@gears-frontx/design-verify -- \
 *     --src src-app/mfe_packages/orders [--src <dir or file>...]
 *
 * CSS Modules (`*.module.css`) are parsed with css-tree. Every declaration
 * value is walked outside `var()`: a colour literal anywhere (custom property
 * definitions included, or a literal would hide behind a local variable; a
 * `color-mix()` by each colour it mixes; a relative colour by the rule below),
 * literal lengths in spacing, radius and font-size properties, any literal in
 * a shadow, and literal durations and easings in transitions and animations.
 *
 * A local custom property definition (`--x: ...` in CSS or a `style` object,
 * or a CSS Modules `@value name: value`) hides its value from every use site,
 * so it is read as a declaration in its own right, not for colour only: a
 * colour as before, an easing whenever its value holds one (a value-shape
 * kind on definitions, like colour: a silent name does not spare it), and a
 * length or time literal when the definition says which kit kind it steps -
 * by its own name (`radius`; `text` or `font` for a size; `space`, `spacing`,
 * `gap`, `gutter`, `padding`, `margin` or `inset` for a spacing step; a whole
 * shadow value for `shadow`; `duration` or `delay` for a time), else by the
 * property its `var()` (or `@value`) references read in elsewhere in the same
 * file (`font-size` for font-size, margin/padding/gap for spacing,
 * border-radius for radius). A definition whose name and use sites are silent
 * declares no length or time kind: not reported, the way a length on an
 * unlisted property is not. Each branch runs only when
 * DESIGN.md names tokens for that kind, whatever the colour kind carries. The
 * import form `@value a from '...'` defines nothing. The fix of a finding on
 * a definition also names the theme folder, `src-app/app/themes/`, where a
 * project declares the steps the kit lacks.
 *
 * Files under `src-app/app/themes/` are the project's own token declarations
 * (its extra steps and page surface, references/theme.md): their literal
 * checks never run, whatever `--src` names, so a declared step is not a
 * finding while the same literal in a screen is. Their files are still
 * selected (a `--src` at or inside the theme folder is a clean run that lists
 * them as skipped, not a usage error) and a `.tsx` there still gets the
 * native-element check.
 *
 * A relative colour is derived from a token when its origin is a `var()`, a
 * relative colour that is itself derived, or an allowed keyword such as
 * `currentColor`, AND every colour channel except alpha reads an origin
 * channel keyword or a `var()`, alone or inside `calc()`. A colour channel of
 * only literal numbers makes it a literal finding. Alpha may be a literal or
 * `alpha`; `alpha` is not a colour channel keyword. These pass:
 * `oklch(from var(--p) l c var(--h))`,
 * `rgb(from var(--p) var(--r) var(--g) var(--b))`,
 * `oklch(from var(--p) l c calc(h + 30))`, `rgb(from var(--p) r g b / 50%)`.
 * These are findings: `rgb(from var(--x) 255 0 0)`,
 * `rgb(from var(--x) 255 0 0 / alpha)`, `hwb(from var(--p) 0 0% 0% / alpha)`.
 *
 * `0` is never a finding. TSX and TS are parsed with the project's own
 * TypeScript compiler API: lowercase JSX tags (and React's
 * `createElement('tag')`, never `document.createElement`) that the kit ships
 * a component for, a native element given a role the kit
 * covers, an `<a>` with `onClick` and no link target, and inline style
 * literals of the same kinds as in CSS (`style={{...}}`, or a `style` prop
 * object passed to React's `createElement`, on any element or component).
 *
 * What counts and what to use instead is data in the frontx-design skill:
 * `rules/static-check.json` (elements, roles, literal kinds and the DESIGN.md
 * group that holds each kind's tokens) and `rules/quality-gates.json` (the
 * gate each finding names). A kind whose DESIGN.md group names no token
 * reports nothing: the kit has no token for it.
 *
 * A finding the per-screen waiver file covers (`screen.source` glob,
 * runner/waivers.mjs) moves to the report's waived list.
 *
 * Paths resolve against the project root ($INIT_CWD, set by npm to where it
 * was invoked, else the current directory). Writes
 * `<out>/static-findings.json`. Exit codes, as the render runner: 0 ran
 * (findings are advisory), 1 findings with --fail-on-findings (with
 * --baseline, only findings the baseline lacks), 2 usage or input error,
 * including a source file that does not parse: an unread file is not clean.
 */
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import * as csstree from 'css-tree';
import { diffFindings, findingsExitCode } from './gate.mjs';
import { ContractError, designMdParser, isEntryPoint, projectRoot, readSkillJson } from './skill.mjs';
import { applyWaivers, coversSource, loadWaivers, waiverLines, waiverReport, WaiverError } from './waivers.mjs';

export const USAGE = `design-verify static check - literal values and native elements where the
kit has a token or a component, in CSS Modules and TSX/TS, no browser.

Usage: npm run verify:static --workspace=@gears-frontx/design-verify -- --src <dir> [flags]

  --src <dir or file>       Source to check; repeat for more. Required: name
                            the screen's own package, not the whole app
  --design <file>           DESIGN.md whose front matter names the kit tokens
                            each fix suggests (default DESIGN.md)
  --out <dir>               Report directory (default design-verify-report);
                            the report is static-findings.json
  --waivers <file>          Per-screen waiver file (default design-waivers.json
                            at the project root, when present): a finding a
                            waiver's screen.source glob covers moves to waived
  --baseline <file>         Compare against a prior static-findings.json: with
                            --fail-on-findings only findings it lacks gate
  --fail-on-findings        Exit 1 when a finding is reported (default:
                            advisory, exit 0)
  --help                    Print this message

Relative paths resolve against the project root ($INIT_CWD, else the current
directory). Symbolic links are followed. Listed as skipped: an entry that
cannot be read (a broken link, no access) unless an exclude glob covers it,
since what it points to is unknown; a link cycle or a directory it cannot
list, unless excluded; a file the globs select that is not a regular file;
and a second path to a file already read. Only an exclude glob ending in /**
excludes a directory. Directories named node_modules or .git are never
entered and never listed. Files under src-app/app/themes/, the project theme,
are never checked for literal values (they are listed as skipped); a .tsx
there still gets the native-element check.
Exit 0 ran, 1 findings with --fail-on-findings, 2 usage or input
error (a source file that does not parse, or a --src that selects no file,
included).
`;

/** A usage or input error: exit 2. */
export class InputError extends Error {}

const VAR_ONLY = /^var\((--[\w-]+)\)$/;
/** Directory names the source walk never enters, whatever the globs say. */
const ALWAYS_EXCLUDED = new Set(['node_modules', '.git']);
/**
 * The project theme folder, root-relative: where a project declares the
 * steps the kit lacks and its page surface (references/theme.md). Files under
 * it are token declarations, not screen source: never checked, whatever
 * `--src` names, so a declared step is not a finding while the same literal
 * in a screen is.
 */
const THEME_DIR = 'src-app/app/themes/';
const SHOWN_TOKENS = 6;

/**
 * Each literal kind's token names, from the DESIGN.md front matter group the
 * data names (and its key pattern or typography field).
 *
 * @param {any} literals `literals` of rules/static-check.json
 * @param {Record<string, any>} front parsed DESIGN.md front matter
 * @returns {Map<string, {group: string, tokens: string[]}>}
 */
export function kindTokens(literals, front) {
  const result = new Map();
  for (const [kind, spec] of Object.entries(literals.kinds)) {
    const group = front[spec.group];
    let values = [];
    if (group && typeof group === 'object') {
      const pattern = spec.keyPattern ? new RegExp(spec.keyPattern) : null;
      for (const [key, value] of Object.entries(group)) {
        if (pattern && !pattern.test(key)) continue;
        values.push(spec.field ? value?.[spec.field] : value);
      }
    }
    values = values.filter((v) => typeof v === 'string');
    const tokens = [...new Set(values.map((v) => VAR_ONLY.exec(v)?.[1]).filter(Boolean))];
    result.set(kind, { group: spec.group, tokens });
  }
  return result;
}

/** @param {string} kind @param {{group: string, tokens: string[]}} entry */
function tokenFix(kind, entry) {
  const shown = entry.tokens.slice(0, SHOWN_TOKENS).map((t) => `var(${t})`).join(', ');
  const more = entry.tokens.length - SHOWN_TOKENS;
  return (
    `use ${/^[aeiou]/.test(kind) ? 'an' : 'a'} ${kind} token from DESIGN.md ${entry.group}: ${shown}` +
    (more > 0 ? ` and ${more} more there` : '')
  );
}

/**
 * The context the value and element checks share.
 *
 * @param {any} rules rules/static-check.json
 * @param {Record<string, any>} front DESIGN.md front matter
 */
export function checkContext(rules, front) {
  const { literals } = rules;
  return {
    rules,
    tokens: kindTokens(literals, front),
    allowed: new Set(literals.allowedKeywords.map((k) => k.toLowerCase())),
    colorFunctions: new Set(literals.colorFunctions),
    colorIgnore: new Set(literals.colorIgnoreProperties ?? []),
    lengthUnits: new Set(literals.lengthUnits),
    timeUnits: new Set(literals.timeUnits),
    easingKeywords: new Set(literals.easings.keywords),
    easingFunctions: new Set(literals.easings.functions),
  };
}

/**
 * Kinds that apply to a property and have a kit token. A vendor prefix
 * (`-webkit-transition`) takes the kinds of the property it prefixes.
 */
function applicableKinds(ctx, property, isCustom) {
  if (!isCustom) property = property.replace(/^-(webkit|moz|ms|o)-/, '');
  const kinds = new Set();
  for (const [kind, spec] of Object.entries(ctx.rules.literals.kinds)) {
    if (ctx.tokens.get(kind).tokens.length === 0) continue;
    if (spec.properties === '*') {
      if (!ctx.colorIgnore.has(property)) kinds.add(kind);
    } else if (!isCustom && spec.properties.includes(property)) {
      kinds.add(kind);
    }
  }
  return kinds;
}

function isZero(node) {
  return Number(node.value) === 0;
}

/**
 * The colour channel keywords relative colour syntax gives each colour
 * function: the origin's channels, by the CSS Color 5 grammar. `color()` names
 * `r g b` or `x y z` by its colour space. `alpha` is not a colour channel.
 */
const ORIGIN_CHANNELS = {
  rgb: ['r', 'g', 'b'],
  rgba: ['r', 'g', 'b'],
  hsl: ['h', 's', 'l'],
  hsla: ['h', 's', 'l'],
  hwb: ['h', 'w', 'b'],
  lab: ['l', 'a', 'b'],
  oklab: ['l', 'a', 'b'],
  lch: ['l', 'c', 'h'],
  oklch: ['l', 'c', 'h'],
  color: ['r', 'g', 'b', 'x', 'y', 'z'],
};

/**
 * Whether every colour channel (the values before the `/` that starts alpha)
 * reads an origin channel keyword or a `var()`, alone or inside `calc()`.
 * Alpha is not checked.
 */
function readsOriginChannels(fnName, channels) {
  const keywords = new Set(ORIGIN_CHANNELS[fnName] ?? []);
  const slash = channels.findIndex((n) => n.type === 'Operator' && n.value === '/');
  let colour = slash === -1 ? channels : channels.slice(0, slash);
  // color() names its colour space first (`srgb`); the channels follow.
  if (fnName === 'color') colour = colour.slice(1);
  return (
    colour.length > 0 &&
    colour.every((channel) => {
      let reads = false;
      csstree.walk(channel, function enter(node) {
        if (node.type === 'Function' && node.name.toLowerCase() === 'var') {
          reads = true;
          return csstree.walk.skip;
        }
        if (node.type === 'Identifier' && keywords.has(node.name.toLowerCase())) reads = true;
        return undefined;
      });
      return reads;
    })
  );
}

/**
 * A colour written as a value rather than taken from a token; a relative
 * colour by the rule in the header. `color-mix()` is not a colour function
 * here, so the walk checks each of its colour arguments on its own.
 */
function isColorLiteral(ctx, node) {
  if (node.type === 'Hash') return true;
  if (node.type === 'Function') {
    const name = node.name.toLowerCase();
    if (!ctx.colorFunctions.has(name)) return false;
    const [first, origin, ...channels] = node.children.toArray().filter((n) => n.type !== 'WhiteSpace');
    const relative = first?.type === 'Identifier' && first.name.toLowerCase() === 'from';
    if (!relative || origin === undefined) return true;
    return isColorLiteral(ctx, origin) || !readsOriginChannels(name, channels);
  }
  if (node.type === 'Identifier') {
    const name = node.name.toLowerCase();
    if (ctx.allowed.has(name)) return false;
    return csstree.lexer.matchType('named-color', name).matched !== null;
  }
  return false;
}

/**
 * The kit kind a definition's own name names, by whole name segments: a name
 * segment that matches nothing says nothing, so `--sidebar-width` and
 * `--border-w` are silent while `--card-radius` is a radius. A `shadow` name
 * is read as one whole shadow value (`--shadow-color` says a colour, and its
 * colour branch reports it); a `duration` or `delay` name is a kind only for
 * a time value, never for a length.
 *
 * @param {string} property the custom property's own name, `--x`
 * @returns {'radius' | 'font-size' | 'spacing' | 'shadow' | 'duration' | undefined}
 */
function customNameKind(property) {
  // Shadow and radius are read before text/font and spacing: a name such as
  // `--text-shadow` or `--card-shadow-spacing` carries both segments, and the
  // whole value is one shadow, not a font-size or a spacing step whose colour
  // gets reported on its own.
  if (/(^|-)shadow(-|$)/.test(property)) return 'shadow';
  if (/(^|-)radius(-|$)/.test(property)) return 'radius';
  if (/(^|-)(text|font)(-|$)/.test(property)) return 'font-size';
  if (/(^|-)(space|spacing|gap|gutter|padding|margin|inset)(-|$)/.test(property)) return 'spacing';
  if (/(^|-)(duration|delay)(-|$)/.test(property)) return 'duration';
  return undefined;
}

/** The properties a use site's kind reads from. */
const USE_SITE_KINDS = [
  [/^(margin|padding)(-(top|bottom|left|right|inline|block|inline-start|inline-end|block-start|block-end))?$/, 'spacing'],
  [/^(row-|column-)?gap$/, 'spacing'],
  [/^border(-(top|bottom|start|end)-(left|right|start|end))?-radius$/, 'radius'],
  [/^font-size$/, 'font-size'],
];

/**
 * The kit kind a definition steps by the properties its references read in
 * (`font-size: var(--x)`, `margin-top: var(--x)`, `border-radius: var(--x)`),
 * when its own name is silent. A property no kind reads from (`width`) leaves
 * the definition unreported.
 *
 * @param {ReadonlySet<string>} [properties] the properties the references of
 *   one definition name read in, from the same file
 * @returns {'radius' | 'font-size' | 'spacing' | undefined}
 */
function useSiteKind(properties) {
  for (const property of properties ?? []) {
    for (const [pattern, kind] of USE_SITE_KINDS) {
      if (pattern.test(property)) return kind;
    }
  }
  return undefined;
}

/**
 * The kind a local custom property definition's length or time literals
 * step: by its own name, else by its use sites, else nothing - and nothing
 * too when DESIGN.md names no token for the kind, so a finding never suggests
 * an empty token list. A `shadow`-named definition is reported as one shadow
 * value (gated the same way); a colour it holds goes through the colour
 * branch whatever its name.
 *
 * @param {ReturnType<typeof checkContext>} ctx
 * @param {string} property the definition's own name, `--x`
 * @param {ReadonlySet<string>} [useSites] the properties its references read in
 */
function customLiteralKind(ctx, property, useSites) {
  const kind = customNameKind(property) ?? useSiteKind(useSites);
  if (kind === undefined) return undefined;
  return (ctx.tokens.get(kind)?.tokens.length ?? 0) > 0 ? kind : undefined;
}

/**
 * Literal values in one declaration value, outside `var()`.
 *
 * @param {ReturnType<typeof checkContext>} ctx
 * @param {string} rawProperty
 * @param {any} value a css-tree Value node
 * @param {ReadonlySet<string>} [useSites] for a custom property definition:
 *   the properties its references read in elsewhere in the same file, which
 *   name its kind when its own name is silent
 * @returns {Array<{kind: string, found: string, loc?: {line: number, column: number}}>}
 */
export function literalsInValue(ctx, rawProperty, value, useSites) {
  const isCustom = rawProperty.startsWith('--');
  const property = isCustom ? rawProperty : rawProperty.toLowerCase();
  const kinds = applicableKinds(ctx, property, isCustom);
  // A definition is read for its own literals even where no property applies
  // (on a custom property applicableKinds carries the `*` kinds only): its
  // kind comes from its name or its use sites, and only when DESIGN.md names
  // tokens for it, so the check never hangs on the colour kind.
  const customKind = isCustom ? customLiteralKind(ctx, property, useSites) : undefined;
  if (kinds.size === 0 && customKind === undefined) return [];
  const out = [];
  const lengthKind = ['spacing', 'radius', 'font-size'].find((k) => kinds.has(k));

  if (property === 'font') {
    // The shorthand holds one font size: the length (or calc) before its
    // `/line-height`, else its only length. The line height is not one.
    const nodes = value.children.toArray();
    const slash = nodes.findIndex((n) => n.type === 'Operator' && n.value === '/');
    const size = (slash === -1 ? nodes : nodes.slice(0, slash)).findLast(
      (n) =>
        (n.type === 'Dimension' && ctx.lengthUnits.has(n.unit.toLowerCase())) ||
        (n.type === 'Function' && n.name.toLowerCase() !== 'var'),
    );
    if (!size) return out;
    csstree.walk(size, function enter(node) {
      if (node.type === 'Function' && node.name.toLowerCase() === 'var') return csstree.walk.skip;
      if (node.type === 'Dimension' && !isZero(node) && ctx.lengthUnits.has(node.unit.toLowerCase())) {
        out.push({ kind: 'font-size', found: csstree.generate(node), loc: node.loc?.start });
      }
      return undefined;
    });
    return out;
  }

  if (kinds.has('shadow') || customKind === 'shadow') {
    // A shadow is one value: report it once, whatever literal it holds. A
    // definition named `shadow` that holds only a colour (`--shadow-color`)
    // names a colour, not a shadow: the walk below reports that colour.
    const wholeShadow = kinds.has('shadow') || !isColourOnlyValue(ctx, value);
    if (wholeShadow) {
      let literal = false;
      csstree.walk(value, function enter(node) {
        if (node.type === 'Function' && node.name.toLowerCase() === 'var') return csstree.walk.skip;
        if ((node.type === 'Dimension' && !isZero(node)) || isColorLiteral(ctx, node)) literal = true;
        return undefined;
      });
      if (literal) out.push({ kind: 'shadow', found: csstree.generate(value), loc: value.loc?.start });
      return out;
    }
  }

  // On a custom property definition a length or time is a declared step: the
  // name, or the use sites, say which kit kind it steps, and the kind only
  // counts when DESIGN.md names a token for it (customLiteralKind).
  const customLengthKind = ['spacing', 'radius', 'font-size'].includes(customKind) ? customKind : undefined;
  const customDuration = customKind === 'duration';

  csstree.walk(value, function enter(node) {
    if (node.type === 'Function' && node.name.toLowerCase() === 'var') return csstree.walk.skip;
    const loc = node.loc?.start;
    if (kinds.has('color') && isColorLiteral(ctx, node)) {
      out.push({ kind: 'color', found: csstree.generate(node), loc });
      return csstree.walk.skip;
    }
    if (kinds.has('easing') || (isCustom && (ctx.tokens.get('easing')?.tokens.length ?? 0) > 0)) {
      // Easing is a value-shape kind on a custom property definition, the way
      // colour is: a definition whose name and use sites are silent still
      // reports the easing literal it holds (its length and time halves stay
      // silent-name gated, the branches below).
      const easingFn = node.type === 'Function' && ctx.easingFunctions.has(node.name.toLowerCase());
      const easingWord = node.type === 'Identifier' && ctx.easingKeywords.has(node.name.toLowerCase());
      if (easingFn || easingWord) {
        out.push({ kind: 'easing', found: csstree.generate(node), loc });
        return csstree.walk.skip;
      }
    }
    if (node.type === 'Dimension' && !isZero(node)) {
      const unit = node.unit.toLowerCase();
      if (lengthKind && ctx.lengthUnits.has(unit)) out.push({ kind: lengthKind, found: csstree.generate(node), loc });
      else if (kinds.has('duration') && ctx.timeUnits.has(unit)) out.push({ kind: 'duration', found: csstree.generate(node), loc });
      else if (customLengthKind && ctx.lengthUnits.has(unit)) out.push({ kind: customLengthKind, found: csstree.generate(node), loc });
      else if (customDuration && ctx.timeUnits.has(unit)) out.push({ kind: 'duration', found: csstree.generate(node), loc });
    }
    return undefined;
  });
  return out;
}

/**
 * Whether the value's only literals are colours (`#e11d48`, `red`): no
 * length, no time, no easing. A `shadow`-named definition holding one is a
 * colour definition, not a whole shadow value.
 */
function isColourOnlyValue(ctx, value) {
  let colour = false;
  let other = false;
  csstree.walk(value, function enter(node) {
    if (node.type === 'Function' && node.name.toLowerCase() === 'var') return csstree.walk.skip;
    if (isColorLiteral(ctx, node)) {
      colour = true;
      return csstree.walk.skip;
    }
    if (node.type === 'Dimension' && !isZero(node)) other = true;
    return undefined;
  });
  return colour && !other;
}

/** @param {ReturnType<typeof checkContext>} ctx @param {string} kind @param {string} found */
function literalFinding(ctx, kind, found, property) {
  // A finding on a definition (a local custom property or a @value) is a
  // declared step: name the theme folder where a project declares the steps
  // the kit lacks, the one place a literal step is not a finding.
  const declared = property.startsWith('--') || property.startsWith('@value');
  const fix =
    tokenFix(kind, ctx.tokens.get(kind)) +
    (declared ? `; a step the kit lacks is declared in ${THEME_DIR}, the project theme` : '');
  return {
    gate: ctx.rules.literals.gate,
    kind,
    found: `${found} in ${property}`,
    fix,
  };
}

/**
 * Value keywords a bare identifier can be without naming a CSS Modules
 * `@value`: the CSS-wide keywords, and the common value words (`auto`,
 * `normal`, `none`, the size-relative pair). Recording them as use sites
 * would let a definition named after one (`@value auto: ...`) infer a kit
 * kind from an unrelated keyword use, against the promise that a name
 * matching nothing says nothing.
 */
const VALUE_KEYWORDS = new Set([
  'inherit',
  'initial',
  'unset',
  'revert',
  'revert-layer',
  'auto',
  'normal',
  'none',
  'larger',
  'smaller',
]);

/**
 * Where each local definition's references read in, for the kind a silent
 * name does not give: `var(--x)` under a declaration's property, and a bare
 * identifier reference of a CSS Modules `@value`. Only real properties count
 * as use sites: a reference inside another custom property's own value names
 * nothing on its own.
 *
 * @param {any} ast a parsed css-tree AST
 * @returns {Map<string, Set<string>>} definition name -> use-site properties
 */
function useSiteProperties(ast) {
  const sites = new Map();
  const record = (name, property) => {
    if (property.startsWith('--')) return;
    const set = sites.get(name) ?? new Set();
    set.add(property.toLowerCase());
    sites.set(name, set);
  };
  csstree.walk(ast, {
    visit: 'Declaration',
    enter(decl) {
      if (decl.value.type !== 'Value') return;
      csstree.walk(decl.value, function enter(node) {
        if (node.type === 'Function' && node.name.toLowerCase() === 'var') {
          const name = node.children.first?.type === 'Identifier' ? node.children.first.name : undefined;
          if (name?.startsWith('--')) record(name, decl.property);
          return csstree.walk.skip;
        }
        if (
          node.type === 'Identifier' &&
          !VALUE_KEYWORDS.has(node.name.toLowerCase())
        ) {
          record(node.name, decl.property);
        }
        return undefined;
      });
    },
  });
  return sites;
}

/**
 * @param {ReturnType<typeof checkContext>} ctx
 * @param {string} text
 * @param {string} file root-relative path, for the report
 */
export function checkCss(ctx, text, file) {
  const findings = [];
  const parseErrors = [];
  const ast = csstree.parse(text, {
    positions: true,
    filename: file,
    parseCustomProperty: true,
    // Preludes stay raw: css-tree has no grammar for `@value name: value`.
    parseAtrulePrelude: false,
    onParseError: (error) => parseErrors.push(`${file}:${error.line}:${error.column}: ${error.message}`),
  });
  const sites = useSiteProperties(ast);
  csstree.walk(ast, {
    visit: 'Declaration',
    enter(decl) {
      if (decl.value.type !== 'Value') return;
      for (const hit of literalsInValue(ctx, decl.property, decl.value, sites.get(decl.property))) {
        const at = hit.loc ?? decl.loc.start;
        findings.push({
          ...literalFinding(ctx, hit.kind, hit.found, decl.property),
          file,
          line: at.line,
          column: at.column,
        });
      }
    },
  });
  csstree.walk(ast, {
    visit: 'Atrule',
    enter(rule) {
      if (rule.name.toLowerCase() !== 'value' || !rule.prelude) return;
      const def = valueDefinition(rule.prelude.value);
      if (!def) return;
      // Read as a local custom property definition: by name and shape, like
      // `--name: value` in a declaration. Its references are bare
      // identifiers, so the use sites are read under both spellings.
      const value = csstree.parse(def.value, { context: 'value', positions: true });
      const useSites = new Set([...(sites.get(`--${def.name}`) ?? []), ...(sites.get(def.name) ?? [])]);
      for (const hit of literalsInValue(ctx, `--${def.name}`, value, useSites)) {
        findings.push({
          ...literalFinding(ctx, hit.kind, hit.found, `@value ${def.name}`),
          file,
          line: rule.loc.start.line,
          column: rule.loc.start.column,
        });
      }
    },
  });
  return { findings, parseErrors };
}

/**
 * A CSS Modules `@value` definition, split as postcss-modules-values (the
 * plugin Vite runs) splits it: `name: value` or `name value`. The import
 * form `@value a, b from './x.module.css'` defines nothing here: null.
 *
 * @param {string} prelude
 * @returns {{name: string, value: string} | null}
 */
function valueDefinition(prelude) {
  if (/^(.+?|\([\s\S]+?\))\s+from\s+("[^"]*"|'[^']*'|[\w-]+)$/.test(prelude.trim())) return null;
  const match = /^\s*([\w-]+)\s*:?([\s\S]*)$/.exec(prelude);
  return match && match[2].trim() ? { name: match[1], value: match[2] } : null;
}

/** `marginTop` -> `margin-top`, `WebkitTransition` -> `-webkit-transition`, `--x` stays. */
function cssProperty(key) {
  if (key.startsWith('--')) return key;
  return key.replace(/^(Webkit|Moz|ms)(?=[A-Z])/, (p) => `-${p.toLowerCase()}`).replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
}

/**
 * @param {ReturnType<typeof checkContext>} ctx
 * @param {any} ts the TypeScript module
 * @param {string} text
 * @param {string} file root-relative path, for the report
 */
export function checkScript(ctx, ts, text, file) {
  const findings = [];
  const kind = file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, kind);
  // Syntax errors through the public API: transpileModule reports the
  // syntactic diagnostics of the one file, and nothing about types or imports.
  const { diagnostics = [] } = ts.transpileModule(text, {
    fileName: file,
    reportDiagnostics: true,
    compilerOptions: { target: ts.ScriptTarget.Latest, jsx: ts.JsxEmit.Preserve },
  });
  const parseErrors = diagnostics.map((d) => {
    const message = ts.flattenDiagnosticMessageText(d.messageText, ' ');
    if (d.file === undefined || d.start === undefined) return `${file}: ${message}`;
    const { line, character } = source.getLineAndCharacterOfPosition(d.start);
    return `${file}:${line + 1}:${character + 1}: ${message}`;
  });
  const at = (node) => {
    const { line, character } = source.getLineAndCharacterOfPosition(node.getStart(source));
    return { file, line: line + 1, column: character + 1 };
  };
  const literalText = (expr) =>
    expr && (ts.isStringLiteral(expr) || ts.isNoSubstitutionTemplateLiteral(expr)) ? expr.text : undefined;
  // Where each local definition's var() reads in, for the kind a silent name
  // does not give: the style property a string value uses it under. Read
  // before anything is reported, since a definition can sit after its use.
  // Only the style objects this check reads literals from (the JSX style
  // attribute and the style prop of a createElement call, gathered by the
  // walk below) count: any other object literal in the file is data of an
  // unknown shape, and a var() under one of its properties names no use site
  // a style object answers for.
  const styleObjects = [];
  const varUseSites = new Map();
  /** @param {any} object an ObjectLiteralExpression of style properties */
  const collectVarUseSites = (object) => {
    for (const prop of object.properties) {
      if (!ts.isPropertyAssignment(prop)) continue;
      const key = ts.isIdentifier(prop.name) || ts.isStringLiteral(prop.name) ? prop.name.text : undefined;
      if (!key) continue;
      const text = literalText(prop.initializer);
      if (text === undefined) continue;
      let value;
      try {
        value = csstree.parse(text, { context: 'value' });
      } catch {
        continue;
      }
      const property = cssProperty(key).toLowerCase();
      csstree.walk(value, function enter(node) {
        // A reference is CSS, not a token to regex: parsed with css-tree the
        // way the CSS path parses one, so whitespace inside the parentheses
        // (`var( --x)`) hides nothing.
        if (node.type === 'Function' && node.name.toLowerCase() === 'var') {
          const name = node.children.first?.type === 'Identifier' ? node.children.first.name : undefined;
          if (name?.startsWith('--')) {
            const set = varUseSites.get(name) ?? new Set();
            set.add(property);
            varUseSites.set(name, set);
          }
          return csstree.walk.skip;
        }
        return undefined;
      });
    }
  };
  const { elements } = ctx.rules;

  /** @param {any} object an ObjectLiteralExpression of style properties */
  const queueStyle = (object) => {
    styleObjects.push(object);
  };

  /** @param {any} object an ObjectLiteralExpression of style properties */
  const checkStyle = (object) => {
    for (const prop of object.properties) {
      if (!ts.isPropertyAssignment(prop)) continue;
      const key = ts.isIdentifier(prop.name) || ts.isStringLiteral(prop.name) ? prop.name.text : undefined;
      if (!key) continue;
      const property = cssProperty(key);
      const init = prop.initializer;
      const text = literalText(init);
      if (text !== undefined) {
        let value;
        try {
          value = csstree.parse(text, { context: 'value' });
        } catch {
          continue;
        }
        for (const hit of literalsInValue(ctx, property, value, varUseSites.get(property.toLowerCase()))) {
          findings.push({ ...literalFinding(ctx, hit.kind, hit.found, property), ...at(init) });
        }
        continue;
      }
      const negative = ts.isPrefixUnaryExpression(init) && init.operator === ts.SyntaxKind.MinusToken;
      const num = negative ? init.operand : init;
      if (ts.isNumericLiteral(num) && Number(num.text) !== 0) {
        // React appends px to a bare number on a length property.
        const kinds = applicableKinds(ctx, property, false);
        const lengthKind = ['spacing', 'radius', 'font-size'].find((k) => kinds.has(k));
        if (lengthKind) {
          findings.push({ ...literalFinding(ctx, lengthKind, `${negative ? '-' : ''}${num.text}`, property), ...at(init) });
        }
      }
    }
  };

  /**
   * @param {string} tag
   * @param {Map<string, {value?: string, dynamic: boolean}>} attrs
   * @param {boolean} spread props of unknown shape are spread in
   * @param {any} node
   */
  const checkElement = (tag, attrs, spread, node) => {
    const push = (found, components) =>
      findings.push({
        gate: elements.gate,
        kind: 'element',
        found,
        fix: `use the kit ${components.join(' or ')} from @gears-frontx/ui-kit`,
        ...at(node),
      });
    const role = attrs.get('role')?.value?.trim().toLowerCase();
    if (role && Object.hasOwn(elements.roles, role)) {
      push(`<${tag} role="${role}">`, elements.roles[role]);
      return;
    }
    if (tag === 'a') {
      if (!attrs.has('onClick')) return;
      const href = attrs.get('href');
      if (href === undefined && spread) return;
      if (href?.dynamic) return;
      const target = href?.value?.trim().toLowerCase();
      if (href === undefined || target === '' || target === '#' || target?.startsWith('javascript:')) {
        push(`<a onClick> with no link target`, elements.anchorAsButton);
      }
      return;
    }
    let components = Object.hasOwn(elements.tags, tag) ? elements.tags[tag] : undefined;
    let found = `<${tag}>`;
    if (tag === 'input') {
      const type = attrs.get('type');
      if (type?.dynamic) return;
      const value = (type?.value ?? 'text').trim().toLowerCase();
      if (Object.hasOwn(elements.inputTypes, value)) components = elements.inputTypes[value];
      found = `<input type="${value}">`;
    }
    if (components && components.length > 0) push(found, components);
  };

  const jsxAttrs = (attributes) => {
    const attrs = new Map();
    let spread = false;
    for (const attr of attributes.properties) {
      if (ts.isJsxSpreadAttribute(attr)) {
        spread = true;
        continue;
      }
      const name = attr.name.getText(source);
      const init = attr.initializer;
      if (init === undefined) attrs.set(name, { value: '', dynamic: false });
      else if (ts.isStringLiteral(init)) attrs.set(name, { value: init.text, dynamic: false });
      else if (ts.isJsxExpression(init)) {
        const text = literalText(init.expression);
        attrs.set(name, text === undefined ? { dynamic: true } : { value: text, dynamic: false });
        if (name === 'style' && init.expression && ts.isObjectLiteralExpression(init.expression)) {
          queueStyle(init.expression);
        }
      }
    }
    return { attrs, spread };
  };

  const objectAttrs = (object) => {
    const attrs = new Map();
    let spread = false;
    if (!object) return { attrs, spread };
    // Props passed as a variable could hold anything.
    if (!ts.isObjectLiteralExpression(object)) return { attrs, spread: object.kind !== ts.SyntaxKind.NullKeyword };
    for (const prop of object.properties) {
      if (ts.isSpreadAssignment(prop)) {
        spread = true;
        continue;
      }
      if (!ts.isPropertyAssignment(prop) && !ts.isShorthandPropertyAssignment(prop)) continue;
      const name = prop.name.getText(source).replace(/^['"]|['"]$/g, '');
      const text = ts.isPropertyAssignment(prop) ? literalText(prop.initializer) : undefined;
      attrs.set(name, text === undefined ? { dynamic: true } : { value: text, dynamic: false });
      if (name === 'style' && ts.isPropertyAssignment(prop) && ts.isObjectLiteralExpression(prop.initializer)) {
        queueStyle(prop.initializer);
      }
    }
    return { attrs, spread };
  };

  // React's createElement only: `React.createElement` (or the name `react`'s
  // default or namespace import binds), and a bare name imported from
  // `react`. `document.createElement('input')` builds DOM, not React.
  const reactNamespaces = new Set(['React']);
  const reactCreateElement = new Set();
  for (const statement of source.statements) {
    if (!ts.isImportDeclaration(statement) || literalText(statement.moduleSpecifier) !== 'react') continue;
    const clause = statement.importClause;
    if (clause?.name) reactNamespaces.add(clause.name.text);
    const bindings = clause?.namedBindings;
    if (bindings && ts.isNamespaceImport(bindings)) reactNamespaces.add(bindings.name.text);
    if (bindings && ts.isNamedImports(bindings)) {
      for (const spec of bindings.elements) {
        if ((spec.propertyName ?? spec.name).text === 'createElement') reactCreateElement.add(spec.name.text);
      }
    }
  }
  const isReactCreateElement = (callee) =>
    ts.isIdentifier(callee)
      ? reactCreateElement.has(callee.text)
      : ts.isPropertyAccessExpression(callee) &&
        callee.name.text === 'createElement' &&
        ts.isIdentifier(callee.expression) &&
        reactNamespaces.has(callee.expression.text);

  const visit = (node) => {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const { attrs, spread } = jsxAttrs(node.attributes);
      if (ts.isIdentifier(node.tagName) && /^[a-z][a-z0-9]*$/.test(node.tagName.text)) {
        checkElement(node.tagName.text, attrs, spread, node);
      }
    } else if (ts.isCallExpression(node) && isReactCreateElement(node.expression)) {
      // Props are read for every type, as JSX attributes are, so an inline
      // style on a component counts; only a native tag is an element finding.
      const { attrs, spread } = objectAttrs(node.arguments[1]);
      const tag = literalText(node.arguments[0]);
      if (tag && /^[a-z][a-z0-9]*$/.test(tag)) checkElement(tag, attrs, spread, node);
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  // The use sites are read before any style is reported, since a definition
  // can sit after its use; both passes run over the style objects the walk
  // above found, in source order.
  for (const object of styleObjects) collectVarUseSites(object);
  for (const object of styleObjects) checkStyle(object);
  return { findings, parseErrors };
}

/**
 * Files under the given sources that the data's globs select, as
 * root-relative posix paths. Symbolic links are followed; a link back to a
 * directory above it (a cycle) is not walked again, and a file reached
 * through two paths is read once. `skipped` lists, with the reason: an
 * entry that cannot be read (a broken link, no access) unless an exclude
 * glob covers it, since the walk cannot know what it points to; a link
 * cycle and a directory it cannot list, unless excluded; a non-regular file
 * the globs select; and a second path to a file already read. A directory is
 * excluded whole only by an exclude glob ending in `/**` whose part before
 * it matches the directory. Directories named node_modules or .git are never
 * entered and never listed. `empty` names each source that selected no file.
 *
 * @param {string} root
 * @param {string[]} sources absolute paths
 * @param {{css: string[], script: string[], exclude: string[]}} globs
 * @returns {{files: Array<[string, 'css' | 'script']>, skipped: Array<{path: string, reason: string}>, empty: string[]}}
 */
export function collectFiles(root, sources, globs) {
  const files = new Map();
  const skipped = [];
  const empty = [];
  const reached = new Map(); // a selected file's real path -> the root-relative path it was first read by
  let selected = 0;
  const rel = (abs) => path.relative(root, abs).split(path.sep).join('/') || '.';
  const matches = (file, patterns) => patterns.some((p) => path.posix.matchesGlob(file, p));
  /** @returns {'css' | 'script' | undefined} the check a file at this path gets, if any */
  const typeOf = (file) =>
    matches(file, globs.exclude) ? undefined : matches(file, globs.css) ? 'css' : matches(file, globs.script) ? 'script' : undefined;
  // A directory an exclude glob covers whole: one that ends in `/**` and
  // whose part before it matches the directory (`**/dist/**`). Read from the
  // glob's shape, so a file-name glob such as `**/_*` excludes no directory.
  const dirExcludes = globs.exclude.filter((p) => p.endsWith('/**')).map((p) => p.slice(0, -3));
  const excludedDir = (dir) => matches(dir, dirExcludes);
  const errorCode = (error) => error.code ?? error.message;
  /** @param {string} abs @param {Map<string, string>} ancestors real path -> path of each directory above */
  const visit = (abs, ancestors) => {
    const at = rel(abs);
    let stat;
    try {
      stat = fs.statSync(abs);
    } catch (error) {
      // What a broken link points to is unknown: list it unless an exclude glob covers it.
      if (!matches(at, globs.exclude) && !excludedDir(at)) {
        skipped.push({ path: at, reason: `cannot be read (${errorCode(error)}), a broken link or no access` });
      }
      return;
    }
    if (stat.isDirectory()) {
      if (excludedDir(at)) return;
      let real;
      let entries;
      try {
        real = fs.realpathSync(abs);
        entries = fs.readdirSync(abs);
      } catch (error) {
        skipped.push({ path: at, reason: `a directory that cannot be listed (${errorCode(error)})` });
        return;
      }
      if (ancestors.has(real)) {
        skipped.push({ path: at, reason: `a link cycle back to ${ancestors.get(real)}, read once` });
        return;
      }
      const below = new Map(ancestors).set(real, at);
      for (const entry of entries) {
        if (!ALWAYS_EXCLUDED.has(entry)) visit(path.join(abs, entry), below);
      }
      return;
    }
    const file = at;
    const type = typeOf(file);
    if (!type) return;
    if (!stat.isFile()) {
      skipped.push({ path: file, reason: 'not a regular file or directory' });
      return;
    }
    let real;
    try {
      real = fs.realpathSync(abs);
    } catch (error) {
      skipped.push({ path: file, reason: `cannot be read (${errorCode(error)})` });
      return;
    }
    selected += 1;
    const first = reached.get(real);
    if (first !== undefined) {
      // The same path twice (two --src that overlap) is one file, not a skip.
      if (first !== file) skipped.push({ path: file, reason: `the same file as ${first}, read once` });
      return;
    }
    reached.set(real, file);
    if (file.startsWith(THEME_DIR)) {
      // The theme folder declares the project's own token steps: selected
      // (a --src at or inside it is a clean run, not a usage error) and
      // listed as skipped from the literal checks, but still read, so the
      // native-element gate keeps applying to a screen root that lives there.
      // Read only once, after the regular-file and already-reached guards a
      // theme file shares with every other selected file.
      skipped.push({ path: file, reason: `the project theme folder ${THEME_DIR} declares its own tokens: literals not checked` });
    }
    files.set(file, type);
  };
  for (const source of sources) {
    const before = selected;
    visit(source, new Map());
    if (selected === before) empty.push(rel(source));
  }
  // Code point order: the same on every machine, whatever its locale.
  return { files: [...files].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)), skipped, empty };
}

/** Identity across runs: line and column move with unrelated edits, so they are left out. */
function staticKey(finding) {
  return JSON.stringify([finding.file, finding.gate, finding.kind, finding.found]);
}

/**
 * Multiset diff against a prior static report, the render runner's diff
 * (gate.mjs): a finding counts as resolved only in a file checked now.
 *
 * @param {{findings?: any[]}} baseline
 * @param {{findings: any[], files: string[]}} current
 */
export function diffStatic(baseline, current) {
  const checked = new Set(current.files);
  return diffFindings(baseline.findings ?? [], current.findings, {
    key: staticKey,
    entry: ({ file, gate, kind, found }) => ({ file, gate, kind, found }),
    rechecked: (entry) => checked.has(entry.file),
  });
}

/**
 * @param {{root: string, sources: string[], files: string[], findings: any[],
 *   skipped?: Array<{path: string, reason: string}>,
 *   waived?: any[], waivers?: object, parseErrors: string[]}} run
 */
export function buildStaticReport(run) {
  const byGate = {};
  const byKind = {};
  for (const finding of run.findings) {
    byGate[finding.gate] = (byGate[finding.gate] ?? 0) + 1;
    byKind[finding.kind] = (byKind[finding.kind] ?? 0) + 1;
  }
  return {
    tool: 'design-verify static check',
    generatedAt: new Date().toISOString(),
    root: run.root,
    sources: run.sources,
    summary: {
      filesChecked: run.files.length,
      skipped: run.skipped?.length ?? 0,
      totalFindings: run.findings.length,
      waived: run.waived?.length ?? 0,
      parseErrors: run.parseErrors.length,
      byGate,
      byKind,
    },
    files: run.files,
    skipped: run.skipped ?? [],
    findings: run.findings,
    waived: run.waived ?? [],
    ...(run.waivers ? { waivers: run.waivers } : {}),
    parseErrors: run.parseErrors,
  };
}

/**
 * @param {ReturnType<typeof buildStaticReport>} report
 * @param {{failOnFindings: boolean}} config
 * @param {ReturnType<typeof diffStatic>} [diff]
 */
export function staticExitCode(report, config, diff) {
  if (report.summary.parseErrors > 0) return 2;
  return findingsExitCode(report.summary.totalFindings, config, diff);
}

/** @param {ReturnType<typeof buildStaticReport>} report @param {ReturnType<typeof diffStatic>} [diff] */
export function staticSummaryLines(report, diff) {
  const s = report.summary;
  const lines = [
    `design-verify static: ${s.filesChecked} file(s) checked` +
      (s.skipped > 0 ? `, ${s.skipped} skipped` : '') +
      ` - ${s.totalFindings} finding(s), ${s.waived} waived, ${s.parseErrors} parse error(s)`,
  ];
  for (const entry of report.skipped) lines.push(`  SKIPPED ${entry.path}: ${entry.reason}`);
  for (const f of report.findings) {
    lines.push(`  ${f.gate} ${f.file}:${f.line}:${f.column} ${f.kind} ${f.found}: ${f.fix}`);
  }
  for (const f of report.waived) {
    lines.push(`  WAIVED ${f.gate} ${f.file}:${f.line}:${f.column} ${f.kind} ${f.found} - waiver #${f.waiver.index}: ${f.waiver.reason}`);
  }
  lines.push(...waiverLines(report.waivers));
  for (const error of report.parseErrors) lines.push(`  PARSE ERROR ${error}`);
  if (diff) {
    const total = (entries) => entries.reduce((sum, e) => sum + e.count, 0);
    lines.push(
      `  vs baseline: ${total(diff.new)} new, ${total(diff.resolved)} resolved, ` +
        `${total(diff.unverified)} unverified, ${diff.carriedOver} carried over`,
    );
    const describe = (f) => `${f.gate} ${f.file}: ${f.kind} ${f.found}` + (f.count > 1 ? ` (x${f.count})` : '');
    for (const f of diff.new) lines.push(`  NEW ${describe(f)}`);
    for (const f of diff.resolved) lines.push(`  RESOLVED ${describe(f)}`);
    for (const f of diff.unverified) lines.push(`  UNVERIFIED ${describe(f)}`);
  }
  return lines;
}

/** The project's TypeScript, else the one this package resolves. */
function loadTypeScript(root) {
  for (const from of [path.join(root, 'package.json'), fileURLToPath(import.meta.url)]) {
    try {
      return createRequire(from)('typescript');
    } catch {
      // try the next location
    }
  }
  throw new InputError(`cannot resolve typescript from ${root} or from design-verify; install the project dependencies`);
}

function readJsonFile(file, what) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    throw new InputError(`${what} ${file} could not be read: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * @typedef {{cwd?: string, env?: Record<string, string | undefined>,
 *   log?: (line: string) => void, error?: (line: string) => void}} Io
 */

/**
 * @param {string[]} argv
 * @param {Io} [io]
 * @returns {Promise<number>} exit code
 */
export async function main(argv, io = {}) {
  try {
    return await run(argv, io);
  } catch (error) {
    if (!(error instanceof InputError || error instanceof ContractError || error instanceof WaiverError)) throw error;
    (io.error ?? ((line) => console.error(line)))(`design-verify static: ${error.message}`);
    return 2;
  }
}

/** @param {string[]} argv @param {Io} io */
async function run(argv, io) {
  const log = io.log ?? ((line) => console.log(line));
  const root = projectRoot(io.env ?? process.env, io.cwd ?? process.cwd());
  let values;
  try {
    ({ values } = parseArgs({
      args: argv,
      options: {
        src: { type: 'string', multiple: true },
        design: { type: 'string' },
        out: { type: 'string' },
        baseline: { type: 'string' },
        waivers: { type: 'string' },
        'fail-on-findings': { type: 'boolean' },
        help: { type: 'boolean' },
      },
    }));
  } catch (error) {
    throw new InputError(`${error instanceof Error ? error.message : String(error)}\nrun with --help for usage`);
  }
  if (values.help) {
    log(USAGE);
    return 0;
  }
  const at = (p) => path.resolve(root, p);
  const sources = (values.src ?? []).map(at);
  if (sources.length === 0) throw new InputError('--src is required: name the screen source to check\nrun with --help for usage');
  for (const source of sources) {
    if (!fs.existsSync(source)) throw new InputError(`--src ${source} does not exist`);
  }
  const baseline = values.baseline ? readJsonFile(at(values.baseline), '--baseline') : undefined;

  const rules = readSkillJson('rules/static-check.json');
  const waivers = loadWaivers(values.waivers ? at(values.waivers) : undefined, root, readSkillJson('rules/quality-gates.json'));
  const { readDesignMd, InputError: DesignMdError } = await designMdParser();
  let front;
  try {
    ({ front } = readDesignMd(at(values.design ?? 'DESIGN.md')));
  } catch (error) {
    if (error instanceof DesignMdError) throw new InputError(error.message);
    throw error;
  }
  const ctx = checkContext(rules, front);

  const { files, skipped, empty } = collectFiles(root, sources, rules.sources);
  // A source that selects nothing would pass a gate while checking nothing.
  if (empty.length > 0) {
    const why = (source) => skipped.find((s) => s.path === source)?.reason;
    throw new InputError(
      empty
        .map((source) => `--src ${source} selects no file to check` + (why(source) ? ` (${why(source)})` : ''))
        .join('\n') +
        `\nthe check reads ${[...rules.sources.css, ...rules.sources.script].join(', ')}, ` +
        `except ${rules.sources.exclude.join(', ')} (rules/static-check.json)`,
    );
  }
  const ts = files.some(([, type]) => type === 'script') ? loadTypeScript(root) : undefined;
  const findings = [];
  const parseErrors = [];
  for (const [file, type] of files) {
    const inTheme = file.startsWith(THEME_DIR);
    let text;
    try {
      text = fs.readFileSync(path.join(root, file), 'utf8');
    } catch (error) {
      throw new InputError(`${file} could not be read: ${error instanceof Error ? error.message : String(error)}`);
    }
    let result;
    if (type === 'css') {
      const css = checkCss(ctx, text, file);
      // A theme CSS file declares the project's own token steps: its literals
      // are never findings (see collectFiles), but a file that does not parse
      // still reports, like every selected source.
      result = inTheme ? { findings: [], parseErrors: css.parseErrors } : css;
    } else {
      result = checkScript(ctx, ts, text, file);
      if (inTheme) {
        // The theme skip covers the literal checks only: a screen root under
        // the theme folder still gets the native-element gate.
        result = { findings: result.findings.filter((finding) => finding.kind === 'element'), parseErrors: result.parseErrors };
      }
    }
    findings.push(...result.findings);
    parseErrors.push(...result.parseErrors);
  }

  const split = applyWaivers(findings, waivers.waivers, coversSource);
  const report = buildStaticReport({
    root,
    sources: sources.map((s) => path.relative(root, s).split(path.sep).join('/') || '.'),
    files: files.map(([file]) => file),
    skipped,
    findings: split.findings,
    waived: split.waived,
    waivers: waiverReport(waivers, {
      mode: 'source',
      gates: [rules.literals.gate, rules.elements.gate],
      exercised: files.map(([file]) => file),
    }),
    parseErrors,
  });
  const diff = baseline ? diffStatic(baseline, report) : undefined;
  if (diff) report.baselineComparison = { baseline: at(values.baseline), ...diff };
  const outDir = at(values.out ?? 'design-verify-report');
  fs.mkdirSync(outDir, { recursive: true });
  const reportPath = path.join(outDir, 'static-findings.json');
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  for (const line of staticSummaryLines(report, diff)) log(line);
  log(`design-verify static: report written to ${reportPath}`);
  return staticExitCode(report, { failOnFindings: Boolean(values['fail-on-findings']) }, diff);
}

if (isEntryPoint(import.meta.url)) {
  main(process.argv.slice(2)).then(
    (code) => process.exit(code),
    (error) => {
      console.error(`design-verify static: ${error instanceof Error ? error.stack : String(error)}`);
      process.exit(2);
    },
  );
}
