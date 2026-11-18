/**
 * Dev-only runtime design-defect checker.
 *
 * Runs objective, layout-dependent checks that jsdom cannot perform (the
 * static half lives in eslint-plugin-jsx-a11y and the jsdom axe suite —
 * see src-app/__tests__/a11y.test.tsx):
 *
 *   - axe-core over the live document, including the color-contrast rule
 *     (browser-only: it needs real paint) — axe traverses open shadow roots,
 *     so MFE content is covered; contrast axe cannot decide (text over a
 *     gradient or an image) is reported as needing review, not dropped;
 *   - page-level horizontal scroll (the layout contract every screen must
 *     keep: wide content scrolls in its own container, never the page),
 *     measured on the document and on every box the main landmark's content
 *     scrolls in — the FrontX shell never scrolls the document and scrolls
 *     the screen in a container of its own;
 *   - clipped text (content wider than its box under overflow hidden/clip
 *     with no ellipsis treatment);
 *   - tiny text (visible text below a readable floor);
 *   - skipped heading levels (h1 → h3 with no h2), across shadow roots;
 *   - control-height mismatch (form controls sharing one flex row rendered
 *     at different heights — e.g. a default-size button beside a large
 *     input; tops or bottoms can never both align);
 *   - card missing padding (content ink flush against a drawn card edge;
 *     content scrolling inside its own auto/scroll container is measured at
 *     the scroller's visible content box; bounded containers carry horizontal
 *     padding; the one exemption is a card filled by a full-bleed media child);
 *     a negative inset reports as card-content-overflow instead;
 *   - control-surface contrast (WCAG 1.4.11 non-text contrast for the one
 *     case axe's text rule cannot see: a filled ACCENT control whose painted
 *     surface meets the band under it at less than 3:1 while drawing no
 *     border that reaches 3:1 either. A control counts as a filled accent
 *     only when its own surface stands out from the screen's own surface -
 *     the background of the screen root the sweep resolves - by at least
 *     1.5:1; a control with a transparent surface, a ghost or link button,
 *     is judged by its text, which axe covers. Neutral controls (the kit's
 *     outline and secondary buttons, whose surfaces sit at the page's own
 *     colours) and form fields (input, select, textarea, and the kit's field
 *     triggers) are NOT measured here: axe's text rule and the review judge
 *     them);
 *   - touching sections (two stacked sibling sections, regions or screen-root
 *     children painting distinct surfaces whose boxes meet with no gap on
 *     their shared horizontal edge - the runtime half of the spacing gate,
 *     which until now only the review rubric judged. The rule judges stacked
 *     sections: side-by-side pairs overlap so deeply on the vertical axis
 *     that the shared-gap bound leaves them out. Two sections sharing one
 *     background with their content separated by their own padding are not a
 *     finding);
 *   - dead spacing class (a spacing utility class present in the DOM that
 *     no CSS rule defines: the source reads correct, the padding renders as
 *     nothing; screens style spacing with CSS Modules on kit tokens instead).
 *
 * Delivery model: no browser-automation stack. The checker ships inside the
 * dev bundle only (the shell's main.tsx imports it behind `import.meta.env.DEV`
 * and only when this package is installed, so production builds tree-shake it
 * away and apps without the design-guardrails template never carry it) and runs in whatever real browser
 * the app is open in. Findings go to the console under the `[design-defects]`
 * prefix — a generation agent reading console messages gets them the same
 * way a developer does — and `window.__frontxDesignDefects()` re-runs the
 * sweep on demand (e.g. after switching theme) and resolves with the
 * structured findings.
 *
 * The objective-check selection follows the deterministic detector in
 * pbakaus/impeccable (Apache-2.0) — the checks are reimplemented here, not
 * copied, with axe-core supplying the contrast engine.
 */

import type { AxeResults, NodeResult } from 'axe-core';

export interface DesignDefectFinding {
  /** Stable rule id, e.g. 'axe/color-contrast', 'tiny-text'. */
  id: string;
  /** Human-readable description including the offending value. */
  detail: string;
  /** Best-effort locator for the offending element. */
  target?: string;
  /**
   * 'needs-review' marks a check the sweep could not decide (axe's
   * incomplete color-contrast results): not a defect, and not a pass either,
   * so a sweep that has one does not print the clean line.
   */
  kind?: 'needs-review';
}

/**
 * Text floors come from the installed type ramp, not from numbers chosen
 * here: the kit's `--text-mono-size` (its smallest role, 11px as shipped) is
 * the floor for anything visible, and `--text-label-size` (13px as shipped)
 * is the floor for text on anything interactive - the label role is the
 * smallest text the kit puts on a control. Reading the tokens at sweep time
 * keeps the checker, the guideline and the kit saying the same thing when
 * the ramp changes; the constants below are the fallbacks for a host whose
 * `:root` does not carry the ramp (the shipped values, so the fallback is
 * what the kit says today, never a looser number).
 */
export const TINY_TEXT_PX = 11;
export const CONTROL_TEXT_PX = 13;
export const TINY_TEXT_TOKEN = '--text-mono-size';
export const CONTROL_TEXT_TOKEN = '--text-label-size';

/**
 * Resolve a CSS length declared in `px` or `rem` to pixels; anything else
 * (an unset token, `em`, a calc()) yields null so the caller falls back.
 * Exported for unit tests.
 */
export function parseCssLengthPx(value: string, rootFontSizePx: number): number | null {
  const match = /^\s*(\d+(?:\.\d+)?)(px|rem)\s*$/.exec(value);
  if (!match) return null;
  const size = Number.parseFloat(match[1]);
  return match[2] === 'rem' ? size * rootFontSizePx : size;
}

/** The two text floors for one sweep, read from the installed ramp. */
export interface TextFloors {
  tinyTextPx: number;
  controlTextPx: number;
}

/**
 * Read the floors from the host's `:root` tokens. A token that is absent or
 * not a plain px/rem length falls back to the shipped value.
 */
export function readTextFloors(): TextFloors {
  const root = document.documentElement;
  const style = getComputedStyle(root);
  const rootPx = Number.parseFloat(style.fontSize) || 16;
  return {
    tinyTextPx: parseCssLengthPx(style.getPropertyValue(TINY_TEXT_TOKEN), rootPx) ?? TINY_TEXT_PX,
    controlTextPx:
      parseCssLengthPx(style.getPropertyValue(CONTROL_TEXT_TOKEN), rootPx) ?? CONTROL_TEXT_PX,
  };
}

/**
 * Pure predicate for the small-control-text rule; exported for unit tests.
 * Zero is ignored for the same reason as `isTinyText`.
 */
export function isSmallControlText(fontSizePx: number, floorPx: number = CONTROL_TEXT_PX): boolean {
  return fontSizePx > 0 && fontSizePx < floorPx;
}

/**
 * The interactive surfaces whose text the label floor applies to. `label`
 * is included because a form label is the control's name; `a` only when it
 * is a real link.
 */
const INTERACTIVE_SELECTOR =
  'button, a[href], input, select, textarea, label, [role="button"], [role="link"], ' +
  '[role="menuitem"], [role="tab"], [role="option"], [role="checkbox"], [role="radio"], [role="switch"]';

/** Whether `el` renders inside (or is) an interactive surface. */
function isInteractiveText(el: Element): boolean {
  return el.closest(INTERACTIVE_SELECTOR) !== null;
}

/** Slack for scrollWidth/clientWidth comparisons: sub-pixel rounding. */
const OVERFLOW_TOLERANCE_PX = 1;

/**
 * Pure predicate for the tiny-text rule; exported for unit tests (jsdom has
 * no layout, so the DOM walk itself is verified live, the maths here).
 */
export function isTinyText(fontSizePx: number, floorPx: number = TINY_TEXT_PX): boolean {
  return fontSizePx > 0 && fontSizePx < floorPx;
}

/**
 * Pure predicate for the clipped-text rule; exported for unit tests.
 * Ellipsis is an intentional truncation treatment, not a defect, and the
 * screen-reader-only pattern (content clipped inside a ~1px box, visually
 * hidden but exposed to assistive tech) is deliberate hiding, not clipping.
 */
export function isClippedText(box: {
  scrollWidth: number;
  clientWidth: number;
  clientHeight: number;
  overflowX: string;
  textOverflow: string;
}): boolean {
  if (box.overflowX !== 'hidden' && box.overflowX !== 'clip') return false;
  if (box.textOverflow === 'ellipsis') return false;
  if (box.clientWidth <= 1 && box.clientHeight <= 1) return false;
  return box.scrollWidth > box.clientWidth + OVERFLOW_TOLERANCE_PX;
}

/**
 * Pure predicate for the page-level horizontal-scroll rule on a box that is
 * not the document; exported for unit tests. Only a box that scrolls on the
 * inline axis counts: content past a hidden or clip box is clipped, not
 * scrolled.
 */
export function scrollsSideways(box: { overflowX: string; scrollWidth: number; clientWidth: number }): boolean {
  if (!scrollsOnInlineAxis(box.overflowX)) return false;
  return box.scrollWidth > box.clientWidth + OVERFLOW_TOLERANCE_PX;
}

function scrollsOnInlineAxis(overflowX: string): boolean {
  return overflowX === 'auto' || overflowX === 'scroll';
}

/**
 * The boxes the page's content scrolls in, found from the main landmark:
 * each scroller among its ancestors, then the landmark itself and each box
 * on the chain of sole children below it. A shell can keep the document
 * still and scroll the page in a box of its own — the FrontX shell hides
 * overflow on html, body and main and scrolls the screen in
 * div[data-mfe-screen-container] — so the reflow rule has to measure that
 * box too. The chain stops at the first level with more than one child: a
 * box with siblings holds only part of the page, and a table scrolling in its
 * own overflow-x: auto wrapper is the isolated scroll the layout rule allows.
 * It also stops at a scroller whose only child is a table or grid, which is
 * that grid's own scroll box even when the grid is all the screen holds.
 * Generic over the node type so the walk is unit-testable without layout.
 */
export function findPageScrollers<T>(
  main: T,
  tree: {
    parent(node: T): T | null;
    soleChild(node: T): T | null;
    isScroller(node: T): boolean;
    isGrid(node: T): boolean;
  }
): T[] {
  const scrollers: T[] = [];
  for (let node = tree.parent(main); node !== null; node = tree.parent(node)) {
    if (tree.isScroller(node)) scrollers.push(node);
  }
  for (let node: T | null = main; node !== null; node = tree.soleChild(node)) {
    if (!tree.isScroller(node)) continue;
    const child = tree.soleChild(node);
    if (child !== null && tree.isGrid(child)) break;
    scrollers.push(node);
  }
  return scrollers;
}

/**
 * How a child node takes part in its parent's layout: a box of its own, a
 * display: contents wrapper (a slot, by default) whose own children lay out
 * in its place, text, or nothing (whitespace, hidden, out of flow).
 */
export type LayoutRole = 'box' | 'contents' | 'text' | 'none';

/**
 * The only box among `nodes`, looking through display: contents wrappers
 * to the nodes they lay out; null when there is none, more than one, or
 * text beside it. A wrapper without a box of its own still holds boxes of
 * the level: skipping it would leave a sibling looking like the only child.
 * Pure; exported for unit tests.
 */
export function soleLayoutChild<T>(
  nodes: Iterable<T>,
  layout: { role(node: T): LayoutRole; contents(node: T): Iterable<T> }
): T | null {
  let sole: T | null = null;
  for (const node of laidOutNodes(nodes, layout)) {
    const role = layout.role(node);
    if (role === 'text') return null;
    if (role !== 'box') continue;
    if (sole !== null) return null;
    sole = node;
  }
  return sole;
}

function* laidOutNodes<T>(
  nodes: Iterable<T>,
  layout: { role(node: T): LayoutRole; contents(node: T): Iterable<T> }
): Generator<T> {
  for (const node of nodes) {
    if (layout.role(node) === 'contents') yield* laidOutNodes(layout.contents(node), layout);
    else yield node;
  }
}

/**
 * Pure heading-sequence rule; exported for unit tests. Takes heading levels
 * in document order, returns the (fromLevel, toLevel) pairs that skip.
 * The first heading may be any level — screens inside a host legitimately
 * start below h1.
 */
export function findHeadingSkips(levels: number[]): Array<{ from: number; to: number }> {
  const skips: Array<{ from: number; to: number }> = [];
  for (let i = 1; i < levels.length; i++) {
    if (levels[i] > levels[i - 1] + 1) {
      skips.push({ from: levels[i - 1], to: levels[i] });
    }
  }
  return skips;
}

/**
 * Height difference above this is a real size-variant mismatch, not
 * sub-pixel rounding or a 1px border-box difference.
 */
export const CONTROL_HEIGHT_TOLERANCE_PX = 2;

/** Vertical extent of a rendered form control, for the row-mismatch rule. */
export interface ControlBox {
  top: number;
  bottom: number;
  height: number;
}

/**
 * Two controls are "in the same visual row" when the smaller one vertically
 * overlaps the other by at least half of its own height. Pure; exported for
 * unit tests.
 */
export function shareVisualRow(a: ControlBox, b: ControlBox): boolean {
  const overlap = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
  const smaller = Math.min(a.height, b.height);
  return smaller > 0 && overlap >= smaller / 2;
}

/**
 * Pure rule for control-height mismatch: among form controls grouped under
 * one flex-row container, every pair that shares a visual row must share a
 * height (within tolerance). Returns index pairs of mismatching controls;
 * exported for unit tests.
 */
export function findControlHeightMismatches(
  controls: readonly ControlBox[]
): Array<{ a: number; b: number }> {
  const pairs: Array<{ a: number; b: number }> = [];
  for (let i = 0; i < controls.length; i++) {
    for (let j = i + 1; j < controls.length; j++) {
      if (!shareVisualRow(controls[i], controls[j])) continue;
      if (Math.abs(controls[i].height - controls[j].height) > CONTROL_HEIGHT_TOLERANCE_PX) {
        pairs.push({ a: i, b: j });
      }
    }
  }
  return pairs;
}

/**
 * Content ink closer than this to a drawn card edge reads as "no padding".
 * One spacing step (4px) is the floor, not a recommendation — cards normally
 * carry 12-24px.
 */
export const MIN_CARD_PADDING_PX = 4;

/**
 * Size floor for the card-padding rule. Below this an element is an inline
 * chip at typography scale — a badge, a pill, a keycap — whose spacing is the
 * component's own business, not a content container. Measured against real
 * output: severity badges are ~50×20, the smallest real cards (stat tiles,
 * list rows) start well above 120×24.
 */
export const MIN_CARD_WIDTH_PX = 120;
export const MIN_CARD_HEIGHT_PX = 24;

/** Slack for "media fills the card" width comparisons. */
export const FULL_BLEED_TOLERANCE_PX = 2;

/** Horizontal extent of one piece of visible content inside a card. */
export interface InkEdge {
  left: number;
  right: number;
}

/** Ink sides cut off by a scroller edge are not measured. */
export interface MeasuredInk {
  left: number | null;
  right: number | null;
}

/**
 * A media child at (or beyond) the card's content width is a deliberate
 * full-bleed treatment, which exempts the card from the padding rule.
 * Pure; exported for unit tests.
 */
export function isFullBleedMedia(cardContentWidth: number, mediaWidth: number): boolean {
  return cardContentWidth > 0 && mediaWidth >= cardContentWidth - FULL_BLEED_TOLERANCE_PX;
}

/**
 * Slack for "runs under the scroller's edge": the scroller box comes from
 * integer clientLeft/clientWidth, the element box from fractional rects, so
 * a child that exactly fills the scroller can land a fraction of a pixel past
 * its edge without being cut off.
 */
export const SCROLL_EDGE_TOLERANCE_PX = 1;

/**
 * Clip ink to the visible content boxes of its horizontal scrollers. A null
 * side is cut off by a scroller edge, not measured: content continuing under
 * that edge is a scroll cue, not missing padding. A null result is not visible.
 * Scrolled content starts at the content box, and browsers put inline-end
 * padding after it, so readers see the scroller's padding at both ends of the
 * scroll range. This does not depend on the current scroll position.
 *
 * `box` is the element's own border box when the ink sits inside it (text
 * inside a cell's padding): the element decides what is cut, so a table
 * cell running under the scroller's edge is cut even where its text stops
 * short of that edge. It defaults to the ink itself.
 */
export function clipInkToScrollers(
  ink: InkEdge,
  scrollers: readonly InkEdge[],
  box: InkEdge = ink
): MeasuredInk | null {
  if (scrollers.length === 0) return { left: ink.left, right: ink.right };
  const lo = Math.max(...scrollers.map((scroller) => scroller.left));
  const hi = Math.min(...scrollers.map((scroller) => scroller.right));
  if (Math.max(box.left, lo) >= Math.min(box.right, hi)) return null;
  return {
    left: box.left < lo - SCROLL_EDGE_TOLERANCE_PX ? null : ink.left,
    right: box.right > hi + SCROLL_EDGE_TOLERANCE_PX ? null : ink.right,
  };
}

/**
 * Pure rule for card padding: given the card's content-box edges, the ink
 * extents of its visible content, and which edges the card actually draws,
 * report each drawn side where ink sits closer than the minimum padding.
 * Exported for unit tests.
 */
export function findCardEdgeFlush(
  content: { left: number; right: number },
  inks: readonly MeasuredInk[],
  drawnSides: { left: boolean; right: boolean }
): Array<{ side: 'left' | 'right'; insetPx: number }> {
  if (inks.length === 0) return [];
  const violations: Array<{ side: 'left' | 'right'; insetPx: number }> = [];
  if (drawnSides.left) {
    const lefts = inks.map((ink) => ink.left).filter((left): left is number => left !== null);
    if (lefts.length > 0) {
      const inset = Math.round(Math.min(...lefts) - content.left);
      if (inset < MIN_CARD_PADDING_PX) violations.push({ side: 'left', insetPx: inset });
    }
  }
  if (drawnSides.right) {
    const rights = inks.map((ink) => ink.right).filter((right): right is number => right !== null);
    if (rights.length > 0) {
      const inset = Math.round(content.right - Math.max(...rights));
      if (inset < MIN_CARD_PADDING_PX) violations.push({ side: 'right', insetPx: inset });
    }
  }
  return violations;
}

/**
 * WCAG 1.4.11 non-text contrast floor: a control's surface or boundary must
 * reach 3:1 against the surface next to it.
 */
export const NON_TEXT_CONTRAST_MIN = 3;

/** An sRGB colour as computed styles report it: channels 0-255, alpha 0-1. */
export interface Rgba {
  r: number;
  g: number;
  b: number;
  a: number;
}

/** What a page with no painted background shows: the canvas, opaque white. */
const CANVAS: Rgba = { r: 255, g: 255, b: 255, a: 1 };

const RGB_LEGACY_RE = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/;
const RGB_SPACE_RE = /^rgba?\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*(?:\/\s*([\d.]+)\s*)?\)$/;

/**
 * Parses the colour forms a computed style reports: `rgb()` and `rgba()` in
 * the legacy comma and the modern space syntax, and the `transparent`
 * keyword. A colour in another space (oklch, color()) has no rgb form here:
 * null, and the caller skips what it cannot measure rather than guess.
 * Exported for unit tests.
 */
export function parseCssColor(value: string): Rgba | null {
  const text = value.trim().toLowerCase();
  if (text === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };
  const match = RGB_LEGACY_RE.exec(text) ?? RGB_SPACE_RE.exec(text);
  if (!match) return null;
  const [, r, g, b, a] = match;
  return { r: Number(r), g: Number(g), b: Number(b), a: a === undefined ? 1 : Number(a) };
}

/**
 * Source-over compositing of one colour onto another. An opaque backdrop
 * makes the result opaque; the channels are premultiplied only inside the
 * formula, the result carries straight channels. Exported for unit tests.
 */
export function compositeOver(fore: Rgba, back: Rgba): Rgba {
  const a = fore.a + back.a * (1 - fore.a);
  if (a === 0) return { r: 0, g: 0, b: 0, a: 0 };
  const mix = (f: number, b: number) => (f * fore.a + b * back.a * (1 - fore.a)) / a;
  return {
    r: Math.round(mix(fore.r, back.r)),
    g: Math.round(mix(fore.g, back.g)),
    b: Math.round(mix(fore.b, back.b)),
    a,
  };
}

/** WCAG 2.2 relative luminance of a straight-channel sRGB colour. */
export function relativeLuminance({ r, g, b }: Rgba): number {
  const linear = (channel: number) => {
    const s = channel / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

/** WCAG contrast ratio of two colours, 1:1 to 21:1. */
export function contrastRatio(a: Rgba, b: Rgba): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const hi = Math.max(la, lb);
  const lo = Math.min(la, lb);
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Pure rule for control-surface contrast: report when the painted surface
 * misses the 3:1 floor AND no visible border reaches it either. A null
 * border ratio means the control draws no measurable border. Exported for
 * unit tests.
 */
export function isControlSurfaceDefect(surface: { ratio: number; borderRatio: number | null }): boolean {
  if (surface.ratio >= NON_TEXT_CONTRAST_MIN) return false;
  return surface.borderRatio === null || surface.borderRatio < NON_TEXT_CONTRAST_MIN;
}

/**
 * How far a control's painted surface must stand out from the screen's own
 * surface before the surface rule measures it at all. Below this the control
 * reads as neutral chrome on the page - the kit's outline and secondary
 * buttons paint at the page's own colours, and 1.4.11 says nothing about a
 * boundary the page does not distinguish - so its text is the cue, which
 * axe's color-contrast and the review judge. A filled accent (a primary
 * button, a destructive action) stands out on its own and is what the rule
 * exists for.
 */
export const ACCENT_STANDOUT_MIN = 1.5;

/**
 * Pure gate for the filled-accent narrowing; exported for unit tests. A null
 * ratio means the screen's own surface could not be resolved, and an
 * unresolvable reference measures nothing.
 */
export function isFilledAccentControl(ratioToScreenSurface: number | null): boolean {
  return ratioToScreenSurface !== null && ratioToScreenSurface >= ACCENT_STANDOUT_MIN;
}

/** How far apart two painted edges may sit and still read as touching. */
export const SECTION_TOUCH_TOLERANCE_PX = 1;

/** One section's box and the surface it paints, as the gap rule compares them. */
export interface SectionSurface {
  top: number;
  bottom: number;
  left: number;
  right: number;
  /** Painted background with alpha resolved against what is under it; null when none. */
  background: Rgba | null;
  /** A visible border's colour, else null. */
  border: Rgba | null;
  /**
   * The border colour per side, where the caller knows them. The shared-edge
   * rule reads these; a surface without them (a unit-test box) reads as
   * painting no side borders, so its one `border` colour never counts as a
   * divider on the shared edge.
   */
  borders?: {
    top: Rgba | null;
    right: Rgba | null;
    bottom: Rgba | null;
    left: Rgba | null;
  };
}

/** Whether a section paints anything this rule judges. */
export function sectionPaints(section: Pick<SectionSurface, 'background' | 'border'>): boolean {
  return section.background !== null || section.border !== null;
}

/**
 * Whether two sections' painted surfaces differ: equal backgrounds with
 * equal (or no) borders are one surface, and content separated inside one
 * surface is the sections' own padding business, not a gap finding.
 * Exported for unit tests.
 */
export function surfacesDistinct(a: SectionSurface, b: SectionSurface): boolean {
  const sameColour = (x: Rgba | null, y: Rgba | null) =>
    x === null || y === null ? x === y : x.r === y.r && x.g === y.g && x.b === y.b && Math.abs(x.a - y.a) < 1 / 255;
  return !sameColour(a.background, b.background) || !sameColour(a.border, b.border);
}

/**
 * The borders sitting on the edge two boxes share: the upper one's bottom and
 * the lower one's top for boxes stacked vertically, the left one's right and
 * the right one's left for boxes side by side. A pair touches on one axis and
 * overlaps on the other, and the axis it overlaps along is the negative gap:
 * stacked boxes meet on their vertical edges while their widths overlap. The
 * touching-sections rule only reports stacked adjacency, so its side-by-side
 * branch is reachable here only for a pair whose boxes overlap on neither
 * axis by more than the tolerance - a degenerate diagonal case, not genuine
 * side-by-side sections.
 * Exported for unit tests.
 */
export function bordersOnSharedEdge(a: SectionSurface, b: SectionSurface): Array<Rgba | null> {
  const verticalGap = Math.max(a.top, b.top) - Math.min(a.bottom, b.bottom);
  const horizontalGap = Math.max(a.left, b.left) - Math.min(a.right, b.right);
  const upper = a.top <= b.top ? a : b;
  const lower = a.top <= b.top ? b : a;
  const left = a.left <= b.left ? a : b;
  const right = a.left <= b.left ? b : a;
  return verticalGap > horizontalGap
    ? [upper.borders?.bottom ?? null, lower.borders?.top ?? null]
    : [left.borders?.right ?? null, right.borders?.left ?? null];
}

/**
 * Pure rule for touching sections: among sibling sections given with their
 * surfaces, every pair whose painted edges meet (a gap under the tolerance,
 * neither separated nor overlapping) while both paint, their surfaces
 * differ, and no border of theirs sits on the shared edge - a visible border
 * there is the divider the remedy names, whatever the pair's other borders
 * do. Stacked adjacency only: the gap is the vertical one, so side-by-side
 * pairs overlap too deeply on this axis to ever qualify (see the module
 * header). One entry per touching pair; exported for unit tests.
 */
export function findTouchingSectionPairs(sections: readonly SectionSurface[]): Array<{ a: number; b: number }> {
  const pairs: Array<{ a: number; b: number }> = [];
  for (let i = 0; i < sections.length; i++) {
    for (let j = i + 1; j < sections.length; j++) {
      const x = sections[i];
      const y = sections[j];
      // Stacked boxes: the lower one's top against the upper one's bottom.
      // Boxes overlapping further than the tolerance are a layout bug of a
      // different kind, not adjacency; boxes side by side overlap so deeply
      // on this axis that the same bound leaves them out.
      const gap = Math.max(x.top, y.top) - Math.min(x.bottom, y.bottom);
      if (gap >= SECTION_TOUCH_TOLERANCE_PX || gap <= -SECTION_TOUCH_TOLERANCE_PX) continue;
      if (Math.min(x.right, y.right) - Math.max(x.left, y.left) <= 0) continue;
      if (!sectionPaints(x) || !sectionPaints(y)) continue;
      if (!surfacesDistinct(x, y)) continue;
      if (bordersOnSharedEdge(x, y).some((colour) => colour !== null)) continue;
      pairs.push({ a: i, b: j });
    }
  }
  return pairs;
}

/**
 * Utility-class spacing grammar for the dead-class probe. Bare numeric
 * classes only: variants (`md:p-8`) and arbitrary values (`p-[13px]`) are
 * out of scope. The failure mode this rule catches is a utility class no
 * CSS rule defines, where the element looks styled in the source and
 * renders flush.
 */
const PADDING_MARGIN_RE = /^-?([pm])([trblxyse])?-(\d+(?:\.\d+)?|px)$/;
const GAP_RE = /^gap(?:-([xy]))?-(\d+(?:\.\d+)?|px)$/;
const SPACE_BETWEEN_RE = /^space-([xy])-(\d+(?:\.\d+)?|px)$/;

export interface SpacingProbeSpec {
  /** Where the utility's effect lands: the element itself, or a later sibling. */
  kind: 'self' | 'sibling';
  /** Computed properties of which at least one must be non-zero when the rule exists. */
  properties: string[];
}

/**
 * Maps a class token to what a live probe must observe for the utility to be
 * "alive". Returns null for tokens outside the grammar and for `*-0`, whose
 * computed zero is the intended effect. Pure; exported for unit tests.
 */
export function spacingProbeSpec(token: string): SpacingProbeSpec | null {
  const sides: Record<string, string[]> = {
    '': ['top'],
    t: ['top'],
    r: ['right'],
    b: ['bottom'],
    l: ['left'],
    x: ['left', 'right'],
    y: ['top', 'bottom'],
    s: ['inline-start'],
    e: ['inline-end'],
  };
  const pm = PADDING_MARGIN_RE.exec(token);
  if (pm) {
    if (Number.parseFloat(pm[3]) === 0) return null;
    const base = pm[1] === 'p' ? 'padding' : 'margin';
    return { kind: 'self', properties: sides[pm[2] ?? ''].map((side) => `${base}-${side}`) };
  }
  const gap = GAP_RE.exec(token);
  if (gap) {
    if (Number.parseFloat(gap[2]) === 0) return null;
    return { kind: 'self', properties: gap[1] === 'x' ? ['column-gap'] : ['row-gap'] };
  }
  const space = SPACE_BETWEEN_RE.exec(token);
  if (space) {
    if (Number.parseFloat(space[2]) === 0) return null;
    return {
      kind: 'sibling',
      properties: space[1] === 'y' ? ['margin-top', 'margin-bottom'] : ['margin-left', 'margin-right'],
    };
  }
  return null;
}

function isSpacingToken(token: string): boolean {
  return PADDING_MARGIN_RE.test(token) || GAP_RE.test(token) || SPACE_BETWEEN_RE.test(token);
}

/**
 * Probes each collected token on a hidden element appended to the root it was
 * seen in (a shadow root has its own style context — a class alive in the
 * document can be dead inside it and vice versa). A probe carries only the
 * token, so specificity and sibling utilities on the real element cannot mask
 * the verdict: zero computed effect means no stylesheet defines the class.
 */
function probeDeadSpacingTokens(
  root: Document | ShadowRoot,
  tokens: ReadonlyMap<string, number>
): DesignDefectFinding[] {
  const host = root instanceof Document ? root.body : root;
  const doc = root instanceof Document ? root : root.ownerDocument;
  if (!host || !doc) return [];
  const bench = doc.createElement('div');
  bench.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none;';
  host.appendChild(bench);
  const findings: DesignDefectFinding[] = [];
  try {
    for (const [token, count] of tokens) {
      const spec = spacingProbeSpec(token);
      if (!spec) continue;
      const probe = doc.createElement('div');
      probe.className = token;
      // gap only resolves to a length in a flex/grid formatting context.
      probe.style.display = 'flex';
      probe.style.flexDirection = 'column';
      let measured = probe;
      if (spec.kind === 'sibling') {
        probe.appendChild(doc.createElement('div'));
        measured = doc.createElement('div');
        probe.appendChild(measured);
      }
      bench.appendChild(probe);
      const style = getComputedStyle(measured);
      const dead = spec.properties.every((prop) => {
        const value = Number.parseFloat(style.getPropertyValue(prop));
        return !Number.isFinite(value) || value === 0;
      });
      if (dead) {
        findings.push({
          id: 'dead-spacing-class',
          detail: `spacing utility "${token}" is used by ${count} element(s) but no CSS rule defines it, so the class silently does nothing; style the spacing with a CSS Module rule on a --space-* token`,
        });
      }
      probe.remove();
    }
  } finally {
    bench.remove();
  }
  return findings;
}

/**
 * Form controls whose rendered height is a design decision. Checkbox, radio,
 * range, color and hidden inputs are intrinsically small or invisible and sit
 * beside taller controls by design.
 */
function isSizedFormControl(el: Element): boolean {
  const tag = el.tagName;
  if (tag === 'BUTTON' || tag === 'SELECT' || tag === 'TEXTAREA') return true;
  if (tag !== 'INPUT') return false;
  const type = (el.getAttribute('type') ?? 'text').toLowerCase();
  return !['checkbox', 'radio', 'range', 'color', 'hidden', 'image'].includes(type);
}

/**
 * Nearest ancestor laying its content out as a flex row — the container
 * whose children are expected to align as one control row. Stays within the
 * element's own DOM tree (does not cross shadow boundaries: a row never
 * spans a shadow root).
 */
function findFlexRowContainer(el: Element): Element | null {
  for (let cur = el.parentElement; cur !== null; cur = cur.parentElement) {
    const style = getComputedStyle(cur);
    if (
      (style.display === 'flex' || style.display === 'inline-flex') &&
      (style.flexDirection === 'row' || style.flexDirection === 'row-reverse')
    ) {
      return cur;
    }
  }
  return null;
}

function parsePx(value: string): number {
  const px = Number.parseFloat(value);
  return Number.isFinite(px) ? px : 0;
}

function hasOpaqueBackground(style: CSSStyleDeclaration): boolean {
  const bg = style.backgroundColor;
  if (!bg || bg === 'transparent') return false;
  const rgba = /rgba?\(\s*[\d.]+[\s,]+[\d.]+[\s,]+[\d.]+(?:[\s,/]+([\d.%]+)\s*)?\)/.exec(bg);
  if (!rgba) return true; // named colors, color(), etc. — assume painted
  return rgba[1] === undefined || Number.parseFloat(rgba[1]) > 0;
}

function borderSideVisible(width: string, borderStyle: string): boolean {
  return parsePx(width) > 0 && borderStyle !== 'none' && borderStyle !== 'hidden';
}

const MEDIA_TAGS = new Set(['IMG', 'PICTURE', 'VIDEO', 'CANVAS', 'SVG']);
const CONTROL_TAGS = new Set(['BUTTON', 'INPUT', 'SELECT', 'TEXTAREA']);
const CONTROL_ROLES = new Set(['button', 'checkbox', 'radio', 'switch', 'tab', 'menuitem', 'option', 'slider']);

/**
 * Which edges this element draws as a visible card boundary. A left/right
 * border, or the full "card look" (box shadow, or rounded corners over a
 * painted background), makes flush content read as missing padding. Elements
 * drawing only horizontal separators (border-top/bottom, e.g. divided list
 * rows) draw no vertical edge and are exempt. Returns null when nothing
 * card-like is drawn.
 */
function cardDrawnSides(style: CSSStyleDeclaration): { left: boolean; right: boolean } | null {
  const shadowed = style.boxShadow !== '' && style.boxShadow !== 'none';
  const rounded =
    parsePx(style.borderTopLeftRadius) > 0 ||
    parsePx(style.borderTopRightRadius) > 0 ||
    parsePx(style.borderBottomLeftRadius) > 0;
  const cardLook = shadowed || (rounded && hasOpaqueBackground(style));
  const left = cardLook || borderSideVisible(style.borderLeftWidth, style.borderLeftStyle);
  const right = cardLook || borderSideVisible(style.borderRightWidth, style.borderRightStyle);
  return left || right ? { left, right } : null;
}

/**
 * Measures a bounded container against the card-padding rule. Ink positions
 * come from where content is actually painted, not the card's own computed
 * padding, so padding delegated to an inner wrapper (Card > content div)
 * passes and a padded wrapper does not mask a flush sibling.
 */
function collectCardPaddingFindings(card: Element, cardStyle: CSSStyleDeclaration): DesignDefectFinding[] {
  const drawnSides = cardDrawnSides(cardStyle);
  if (!drawnSides) return [];
  const rect = card.getBoundingClientRect();
  const contentLeft = rect.left + parsePx(cardStyle.borderLeftWidth);
  const contentRight = rect.right - parsePx(cardStyle.borderRightWidth);
  const contentWidth = contentRight - contentLeft;
  if (contentWidth < MIN_CARD_WIDTH_PX || rect.height < MIN_CARD_HEIGHT_PX) return [];

  const inks: MeasuredInk[] = [];
  const scrollerBoxes = new Map<Element, InkEdge | null>();
  const pushDescendantInk = (el: Element, ink: InkEdge, box: InkEdge = ink): void => {
    const scrollers: InkEdge[] = [];
    for (let ancestor = el.parentElement; ancestor; ancestor = ancestor.parentElement) {
      let scrollerBox = scrollerBoxes.get(ancestor);
      if (scrollerBox === undefined) {
        const style = ancestor === card ? cardStyle : getComputedStyle(ancestor);
        scrollerBox = null;
        // Only a box that really scrolls sideways clips: overflow-y: auto also
        // computes overflow-x to auto, and an inline or display: contents box
        // reports auto with no width at all.
        if (
          (style.overflowX === 'auto' || style.overflowX === 'scroll') &&
          ancestor.scrollWidth > ancestor.clientWidth
        ) {
          const ancestorRect = ancestor === card ? rect : ancestor.getBoundingClientRect();
          scrollerBox = {
            left: ancestorRect.left + ancestor.clientLeft + parsePx(style.paddingLeft),
            right: ancestorRect.left + ancestor.clientLeft + ancestor.clientWidth - parsePx(style.paddingRight),
          };
        }
        scrollerBoxes.set(ancestor, scrollerBox);
      }
      if (scrollerBox) scrollers.push(scrollerBox);
      if (ancestor === card) break;
    }
    const clipped = clipInkToScrollers(ink, scrollers, box);
    if (clipped) inks.push(clipped);
  };
  if (hasDirectText(card)) {
    inks.push({
      left: contentLeft + parsePx(cardStyle.paddingLeft),
      right: contentRight - parsePx(cardStyle.paddingRight),
    });
  }
  for (const el of Array.from(card.querySelectorAll('*'))) {
    if (!isRendered(el)) continue;
    const style = getComputedStyle(el);
    // Positioned content (tooltips, badges pinned to a corner) sits outside
    // the card's flow and says nothing about its padding.
    if (style.position === 'absolute' || style.position === 'fixed') continue;
    const inkRect = el.getBoundingClientRect();
    if (MEDIA_TAGS.has(el.tagName.toUpperCase())) {
      if (isFullBleedMedia(contentWidth, inkRect.width)) return []; // deliberate full-bleed card
      pushDescendantInk(el, { left: inkRect.left, right: inkRect.right });
      continue;
    }
    const paintsOwnBox =
      (style.boxShadow !== '' && style.boxShadow !== 'none') ||
      hasOpaqueBackground(style) ||
      borderSideVisible(style.borderLeftWidth, style.borderLeftStyle) ||
      borderSideVisible(style.borderRightWidth, style.borderRightStyle);
    if (paintsOwnBox) {
      pushDescendantInk(el, { left: inkRect.left, right: inkRect.right });
    } else if (hasDirectText(el)) {
      // Unpainted text carriers (spans, ghost buttons): ink starts where the
      // text does, inside the element's own padding.
      pushDescendantInk(
        el,
        {
          left: inkRect.left + parsePx(style.borderLeftWidth) + parsePx(style.paddingLeft),
          right: inkRect.right - parsePx(style.borderRightWidth) - parsePx(style.paddingRight),
        },
        { left: inkRect.left, right: inkRect.right }
      );
    }
  }

  return findCardEdgeFlush({ left: contentLeft, right: contentRight }, inks, drawnSides).map(
    ({ side, insetPx }) =>
      insetPx < 0
        ? {
            // Negative inset is not thin padding — the content extends past the
            // card's edge. That is an overflow defect with a different fix
            // (scroll or wrap inside the container), so it gets its own id.
            id: 'card-content-overflow',
            detail: `content overflows the card's ${side} edge by ${-insetPx}px — wide content scrolls or wraps inside its container, never past a drawn edge`,
            target: describeElement(card),
          }
        : {
            id: 'card-missing-padding',
            detail: `content sits ${insetPx}px from the card's ${side} edge (minimum ${MIN_CARD_PADDING_PX}px) — bounded containers carry horizontal padding unless a full-width media child fills them`,
            target: describeElement(card),
          }
  );
}

/**
 * Filled controls the surface-contrast rule may measure. The kit Button
 * renders a native button (base-ui's nativeButton default), so the tag
 * list covers it; `[role="button"]` covers the render-prop forms and
 * home-made clickables. The collector casts wide and the rule narrows:
 * {@link isFormFieldControl} takes the fields and field triggers out, and
 * the accent gate takes the neutral surfaces out.
 */
const CONTROL_SURFACE_SELECTOR = 'button, [role="button"], input, select, textarea';

/**
 * The form fields this rule never measures. The kit's Select and Combobox
 * render their trigger as a button carrying `role="combobox"` and
 * `aria-haspopup="listbox"`, so the trigger forms are covered too (a menu
 * button's `aria-haspopup="menu"` is not a field and stays measurable).
 * A field's boundary is the convention every field on the page shares, not
 * an accent surface, and whether its value reads is axe's text rule's and
 * the review's business - a filled accent on a band is what this rule is for.
 */
const FORM_FIELD_SELECTOR = 'input, select, textarea';
const FIELD_TRIGGER_POPUPS = new Set(['listbox', 'grid', 'tree']);

function isFormFieldControl(el: Element): boolean {
  if (el.matches(FORM_FIELD_SELECTOR)) return true;
  return (
    el.getAttribute('role') === 'combobox' ||
    FIELD_TRIGGER_POPUPS.has((el.getAttribute('aria-haspopup') ?? '').toLowerCase())
  );
}

/**
 * The effective background under `el`: the ancestors' backgrounds from the
 * nearest one down to and including the first opaque one, composited
 * bottom-up over the canvas. Walks across the shadow host boundary the way
 * layoutParent does, and reads the page surface off body and html, which
 * layoutParent stops before.
 *
 * Returns null when the measurement is not possible: a colour in the chain
 * that parses as painted but not as sRGB (Chromium serialises a color-mix
 * as oklab()), which cannot be read as transparent or as painted, so the
 * caller skips what it stands behind rather than walk past it. `cache`
 * memoises one sweep's answers.
 */
function effectiveBackgroundUnder(el: Element, cache?: Map<Element, Rgba | null>): Rgba | null {
  if (cache?.has(el)) return cache.get(el)!;
  const layers: Rgba[] = [];
  let unmeasurable = false;
  const consider = (node: Element | null): boolean => {
    if (node === null) return false;
    const style = getComputedStyle(node);
    // An image the node paints over its background colour (a gradient, a url)
    // is what actually shows: the declared colour cannot stand in for it and
    // its painted contribution cannot be resolved here, so the backdrop it
    // stands over is unknowable, not transparent.
    const image = style.backgroundImage;
    if (image !== '' && image !== 'none') {
      unmeasurable = true;
      return true;
    }
    const colour = parseCssColor(style.backgroundColor);
    if (colour === null) {
      // An unparsable painted colour blocks the whole walk: the backdrop it
      // stands over is unknowable, not transparent.
      unmeasurable = true;
      return true;
    }
    if (colour.a <= 0) return false;
    layers.push(colour);
    return colour.a >= 1;
  };
  let cur: Element | null = el;
  while ((cur = layoutParent(cur)) !== null) {
    if (consider(cur)) break;
  }
  if (!unmeasurable && !layers.some((layer) => layer.a >= 1)) {
    consider(document.body);
    consider(document.documentElement);
  }
  if (unmeasurable) {
    cache?.set(el, null);
    return null;
  }
  let backdrop = CANVAS;
  for (let i = layers.length - 1; i >= 0; i--) backdrop = compositeOver(layers[i], backdrop);
  cache?.set(el, backdrop);
  return backdrop;
}

/**
 * The element whose painted surface is the screen's own: the outermost box
 * the main landmark directly holds, or the top of the tree when no landmark
 * wraps the control. Walking up stops at the first box the landmark holds,
 * so a card or a band between the control and the screen never passes for
 * the screen itself. The walk starts above the control: a control placed
 * straight in the screen root is not the screen itself, and starting at it
 * would resolve the control's own background as the screen's, read 1:1 and
 * never measure the control at all - for that layout the screen's own
 * surface is the landmark's.
 */
function screenSurfaceElement(el: Element): Element | null {
  let current: Element | null = layoutParent(el);
  if (current === null) return null;
  while (current !== null) {
    if (current.matches('main, [role="main"]')) return current;
    const parent = layoutParent(current);
    if (parent === null) return current;
    if (parent.matches('main, [role="main"]')) return current;
    current = parent;
  }
  return null;
}

/**
 * The surface the screen itself paints: its own background resolved over
 * what stands under it. An own opaque colour is the surface outright - it
 * covers everything the screen root stands over, so what stands behind it
 * (however unparsable) is never walked: the walk starts only when the root's
 * own colour leaves the surface to resolve. A screen root painting nothing
 * shows the surface behind it, which is then the screen's own surface. An
 * own colour that cannot be parsed (a color-mix Chromium reports as oklab())
 * leaves the surface unknowable, like every unparsable colour in this sweep:
 * null, so the caller skips instead of measuring against what stands behind
 * the root.
 */
function screenSurfaceOf(screenRoot: Element, backdrops?: Map<Element, Rgba | null>): Rgba | null {
  const own = parseCssColor(getComputedStyle(screenRoot).backgroundColor);
  if (own !== null && own.a >= 1) return own;
  const under = effectiveBackgroundUnder(screenRoot, backdrops);
  if (under === null) return null;
  if (own === null) return null;
  return own.a === 0 ? under : compositeOver(own, under);
}

/**
 * Whether the element's background is clipped inside its border
 * (`background-clip: padding-box` or `content-box`, on every layer, `text`
 * included): the border then paints straight over the backdrop, not over the
 * element's own background. The default (`border-box`, an unset value) keeps
 * the background under the border.
 */
function backgroundClipsInsideBorder(style: CSSStyleDeclaration): boolean {
  const clip = style.getPropertyValue('background-clip');
  if (clip === '') return false;
  const layers = clip.split(',').map((layer) => layer.trim().toLowerCase());
  return layers.every((layer) => layer === 'padding-box' || layer === 'content-box' || layer === 'text');
}

/**
 * The control's visible border sides with their colours resolved over the
 * surface the border paints on (`beneath`): the surface rule takes the
 * strongest of them, the section rule the first, as a divider. A border
 * drawn in a transparent colour is no border.
 */
function visibleBorderColours(
  style: CSSStyleDeclaration,
  beneath: Rgba
): Array<{ side: 'top' | 'right' | 'bottom' | 'left'; colour: Rgba }> {
  const sides: Array<{ side: 'top' | 'right' | 'bottom' | 'left'; colour: Rgba }> = [];
  for (const side of ['top', 'right', 'bottom', 'left'] as const) {
    if (!borderSideVisible(style.getPropertyValue(`border-${side}-width`), style.getPropertyValue(`border-${side}-style`))) continue;
    const colour = parseCssColor(style.getPropertyValue(`border-${side}-color`));
    if (colour === null || colour.a === 0) continue;
    sides.push({ side, colour: colour.a >= 1 ? colour : compositeOver(colour, beneath) });
  }
  return sides;
}

function collectControlSurfaceFindings(
  controls: readonly Element[],
  backdrops?: Map<Element, Rgba | null>
): DesignDefectFinding[] {
  const findings: DesignDefectFinding[] = [];
  for (const el of controls) {
    // Form fields and the triggers that open them are out of this check: a
    // field's boundary is a page-wide convention, not an accent surface.
    if (isFormFieldControl(el)) continue;
    const style = getComputedStyle(el);
    const surface = parseCssColor(style.backgroundColor);
    // An unparsable painted surface (a color-mix Chromium reports as oklab())
    // cannot be measured and is not a ghost: skip the control. A transparent
    // one is a ghost or link control, whose text is the cue axe's
    // color-contrast judges; there is no surface to measure here.
    if (surface === null || surface.a === 0) continue;
    // Inactive controls are exempt from WCAG 1.4.11 (:disabled also covers a
    // control a disabled fieldset holds, which the attribute check missed).
    if (el.matches(':disabled') || el.getAttribute('aria-disabled') === 'true') continue;
    const backdrop = effectiveBackgroundUnder(el, backdrops);
    // What the control stands over cannot be read: skip it, do not measure
    // against a guessed canvas.
    if (backdrop === null) continue;
    const painted = compositeOver(surface, backdrop);
    // The filled-accent gate: only a surface that stands out from the
    // screen's own surface names an accent control; neutral chrome (the
    // kit's outline and secondary buttons) drops out here, not by a colour
    // list that would go stale with the next kit release.
    const screenRoot = screenSurfaceElement(el);
    const screenSurface =
      screenRoot === null ? null : screenSurfaceOf(screenRoot, backdrops);
    if (
      !isFilledAccentControl(screenSurface === null ? null : contrastRatio(painted, screenSurface))
    ) {
      continue;
    }
    const ratio = contrastRatio(painted, backdrop);
    // The strongest border the control draws, against the surface the border
    // itself paints on: where the background extends under the border
    // (background-clip border-box, the default) the border composites over
    // the control's own painted surface, where the clip keeps the background
    // inside the border it composites over the backdrop. A boundary that
    // reaches 3:1 on its own saves a quiet surface (the kit's outline
    // buttons).
    let borderRatio: number | null = null;
    const borderBeneath = backgroundClipsInsideBorder(style) ? backdrop : painted;
    for (const { colour } of visibleBorderColours(style, borderBeneath)) {
      const sideRatio = contrastRatio(colour, backdrop);
      if (borderRatio === null || sideRatio > borderRatio) borderRatio = sideRatio;
    }
    if (!isControlSurfaceDefect({ ratio, borderRatio })) continue;
    findings.push({
      id: 'control-surface-contrast',
      detail:
        `filled accent control meets the surface under it at ${ratio.toFixed(2)}:1 (minimum ${NON_TEXT_CONTRAST_MIN}:1)` +
        (borderRatio === null ? '' : `; its border reaches only ${borderRatio.toFixed(2)}:1`) +
        ' - a control surface or its border must reach non-text contrast against the band under it',
      target: describeElement(el),
    });
  }
  return findings;
}

/** One visible border side's colour, resolved over the surface beneath the border; else null. */
function sectionBorder(style: CSSStyleDeclaration, beneath: Rgba): Rgba | null {
  return visibleBorderColours(style, beneath)[0]?.colour ?? null;
}

function collectSectionGapFindings(
  groups: Iterable<readonly Element[]>,
  backdrops?: Map<Element, Rgba | null>
): DesignDefectFinding[] {
  const findings: DesignDefectFinding[] = [];
  for (const group of groups) {
    let measurable = true;
    const surfaces = group.map((el): SectionSurface => {
      const rect = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      const backdrop = effectiveBackgroundUnder(el, backdrops);
      const painted = parseCssColor(style.backgroundColor);
      // A colour neither this section nor what stands under it can be read
      // as (a color-mix Chromium reports as oklab()) makes the pair's
      // surfaces unknowable: the group drops out of the comparison instead
      // of reading as no background or as painted.
      if (backdrop === null || painted === null) {
        measurable = false;
        return {
          top: rect.top,
          bottom: rect.bottom,
          left: rect.left,
          right: rect.right,
          background: null,
          border: null,
        };
      }
      const borders: NonNullable<SectionSurface['borders']> = {
        top: null,
        right: null,
        bottom: null,
        left: null,
      };
      // The surface the section's own background paints: what a border with
      // background-clip border-box (the default) composites over, the way a
      // control's translucent border does. A background clipped inside the
      // border leaves the border over the backdrop.
      const ownBackground = painted.a === 0 ? backdrop : compositeOver(painted, backdrop);
      const borderBeneath = backgroundClipsInsideBorder(style) ? backdrop : ownBackground;
      for (const { side, colour } of visibleBorderColours(style, borderBeneath)) borders[side] = colour;
      return {
        top: rect.top,
        bottom: rect.bottom,
        left: rect.left,
        right: rect.right,
        background: painted.a === 0 ? null : ownBackground,
        border: sectionBorder(style, borderBeneath),
        borders,
      };
    });
    if (!measurable) continue;
    for (const { a, b } of findTouchingSectionPairs(surfaces)) {
      const gap = Math.round(Math.abs(Math.max(surfaces[a].top, surfaces[b].top) - Math.min(surfaces[a].bottom, surfaces[b].bottom)));
      findings.push({
        id: 'adjacent-sections-no-gap',
        detail: `adjacent sections with different surfaces touch (${gap}px between their painted edges) - distinct surfaces separate with spacing scale steps or a divider on their shared edge`,
        target: `${describeElement(group[a])} vs ${describeElement(group[b])}`,
      });
    }
  }
  return findings;
}

/** Best-effort CSS-path-ish locator for console output. */
function describeElement(el: Element): string {
  const id = el.id ? `#${el.id}` : '';
  const cls = el.classList.length > 0 ? `.${Array.from(el.classList).slice(0, 2).join('.')}` : '';
  return `${el.tagName.toLowerCase()}${id}${cls}`;
}

/**
 * Depth-first walk over the document AND every open shadow root, so MFE
 * content (rendered into shadow roots by ThemeAwareReactLifecycle) is
 * checked the same as host content.
 */
function* walkElements(root: ParentNode): Generator<Element> {
  for (const el of Array.from(root.querySelectorAll('*'))) {
    yield el;
    if (el.shadowRoot) {
      yield* walkElements(el.shadowRoot);
    }
  }
}

/**
 * The FrontX Studio dev panel is dev-only chrome that never ships: its
 * findings are not the app's findings, and sweeping it lets real screen
 * defects hide behind "that's just the panel" attributions. Excluded from
 * both the layout walk and the axe run.
 */
export const STUDIO_CHROME_SELECTOR = '.studio-panel, .studio-portal-container';

function isStudioChrome(el: Element): boolean {
  return el.closest(STUDIO_CHROME_SELECTOR) !== null;
}

function isRendered(el: Element): boolean {
  const rect = el.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) return false;
  const style = getComputedStyle(el);
  return style.display !== 'none' && style.visibility !== 'hidden';
}

/**
 * Whether the user can see and reach a control well enough for the surface
 * rule to judge it. A control hidden from assistive tech by an aria-hidden
 * ancestor (in its own tree or across a shadow-host boundary: closest()
 * stays inside one tree, so the walk steps out the way layoutParent does,
 * while this sweep everywhere else crosses that boundary), fully
 * transparent, of type=hidden, or in the 1px clipped
 * visually-hidden pattern (Base UI's hidden inputs: 1px box, no border, and
 * Chromium's white `Field` surface) is either invisible or exempt, and
 * measuring it reports kit Selects and Comboboxes that carry one of those
 * accessibility patterns. Disabled is decided in the collector itself.
 */
function isMeasurableControl(el: Element): boolean {
  let current: Element | null = el;
  while (current !== null) {
    if (current.closest('[aria-hidden="true"]') !== null) return false;
    current = layoutParent(current);
  }
  if (el.getAttribute('type')?.toLowerCase() === 'hidden') return false;
  const style = getComputedStyle(el);
  if (style.opacity === '0') return false;
  const rect = el.getBoundingClientRect();
  if (rect.width <= 1 && rect.height <= 1) return false;
  return true;
}

/** Does this element have a direct (non-descendant) non-whitespace text node? */
function hasDirectText(el: Element): boolean {
  for (const node of Array.from(el.childNodes)) {
    if (node.nodeType === Node.TEXT_NODE && (node.textContent ?? '').trim().length > 0) {
      return true;
    }
  }
  return false;
}

/**
 * The parent box, stepping out of a shadow root to its host. Null at body:
 * the document's own scroll is measured on document.scrollingElement, and
 * body and html also carry the overflow the viewport takes from them.
 */
function layoutParent(el: Element): Element | null {
  const root = el.getRootNode();
  const parent = el.parentElement ?? (root instanceof ShadowRoot ? root.host : null);
  if (parent === null || parent === document.body || parent === document.documentElement) return null;
  return parent;
}

/**
 * A node's part in its parent's layout (see LayoutRole). Absolutely
 * positioned and fixed elements sit outside the flow and hold no part of
 * the page's content.
 */
function layoutRole(node: Node): LayoutRole {
  if (node.nodeType === Node.TEXT_NODE) return (node.textContent ?? '').trim().length > 0 ? 'text' : 'none';
  if (node.nodeType !== Node.ELEMENT_NODE) return 'none';
  const el = node as Element;
  const style = getComputedStyle(el);
  if (style.display === 'contents') return 'contents';
  if (!isRendered(el)) return 'none';
  return style.position === 'absolute' || style.position === 'fixed' ? 'none' : 'box';
}

/**
 * The nodes a display: contents element lays out in its place: a slot's
 * assigned nodes (its fallback content when none are assigned), otherwise
 * its children, or its shadow root's when it hosts one.
 */
function contentsNodes(node: Node): Node[] {
  if (node instanceof HTMLSlotElement) return node.assignedNodes({ flatten: true });
  const el = node as Element;
  return Array.from((el.shadowRoot ?? el).childNodes);
}

/**
 * The only rendered in-flow child box of `el`, or of its shadow root when it
 * hosts one; null when there is none, more than one, or text beside it.
 */
function soleInFlowChild(el: Element): Element | null {
  const children = Array.from((el.shadowRoot ?? el).childNodes);
  return soleLayoutChild<Node>(children, { role: layoutRole, contents: contentsNodes }) as Element | null;
}

/**
 * The page-level horizontal-scroll rule for the boxes the page's content
 * scrolls in (see findPageScrollers); the document itself is measured
 * separately.
 */
function collectPageScrollerFindings(mains: readonly Element[]): DesignDefectFinding[] {
  const scrollers = new Set<Element>();
  for (const main of mains) {
    const found = findPageScrollers(main, {
      parent: layoutParent,
      soleChild: soleInFlowChild,
      isScroller: (el) => scrollsOnInlineAxis(getComputedStyle(el).overflowX),
      isGrid: (el) => el.tagName === 'TABLE' || ['grid', 'treegrid'].includes(el.getAttribute('role') ?? ''),
    });
    for (const scroller of found) scrollers.add(scroller);
  }
  const findings: DesignDefectFinding[] = [];
  for (const scroller of scrollers) {
    const box = {
      overflowX: getComputedStyle(scroller).overflowX,
      scrollWidth: scroller.scrollWidth,
      clientWidth: scroller.clientWidth,
    };
    if (!scrollsSideways(box)) continue;
    findings.push({
      id: 'page-horizontal-scroll',
      detail: `the page's scroll container scrolls horizontally (${box.scrollWidth}px content in ${box.clientWidth}px box) — wide content must scroll inside its own container, not the page's`,
      target: describeElement(scroller),
    });
  }
  return findings;
}

/**
 * Pairs each heading-level skip with the specific heading element that
 * caused it (not the first heading of that level anywhere in the document —
 * a document with repeated levels, e.g. [1, 3, 1, 3], has one skip per h3
 * and each must target its own h3). Exported for unit tests.
 */
export function collectHeadingSkipFindings(
  headingLevels: readonly number[],
  headingEls: readonly Element[]
): DesignDefectFinding[] {
  const findings: DesignDefectFinding[] = [];
  for (let i = 1; i < headingLevels.length; i++) {
    if (headingLevels[i] > headingLevels[i - 1] + 1) {
      findings.push({
        id: 'skipped-heading',
        detail: `heading level jumps h${headingLevels[i - 1]} → h${headingLevels[i]}`,
        target: describeElement(headingEls[i]),
      });
    }
  }
  return findings;
}

function collectLayoutFindings(): DesignDefectFinding[] {
  const findings: DesignDefectFinding[] = [];
  const floors = readTextFloors();
  // One sweep's backdrop answers: every control and section under the same
  // ancestors reads the same chain, so it is computed once.
  const backdrops = new Map<Element, Rgba | null>();

  const scroller = document.scrollingElement;
  if (scroller && scroller.scrollWidth > scroller.clientWidth + OVERFLOW_TOLERANCE_PX) {
    findings.push({
      id: 'page-horizontal-scroll',
      detail: `page body scrolls horizontally (${scroller.scrollWidth}px content in ${scroller.clientWidth}px viewport) — wide content must scroll inside its own container`,
    });
  }

  const mains: Element[] = [];
  const headingLevels: number[] = [];
  const headingEls: Element[] = [];
  const controlRows = new Map<Element, Element[]>();
  const spacingTokens = new Map<Document | ShadowRoot, Map<string, number>>();
  const surfaceControls: Element[] = [];
  // Sections group under the element that lays them out (their layout parent,
  // stepping out of a shadow root to its host): only siblings can touch, so
  // a section inside one container is never compared with one in another.
  const sectionGroups = new Map<Element, Element[]>();

  for (const el of walkElements(document)) {
    if (!isRendered(el) || isStudioChrome(el)) continue;

    if (el.matches('main, [role="main"]')) mains.push(el);

    for (const token of Array.from(el.classList)) {
      if (!isSpacingToken(token)) continue;
      const rootNode = el.getRootNode();
      if (!(rootNode instanceof Document) && !(rootNode instanceof ShadowRoot)) continue;
      const perRoot = spacingTokens.get(rootNode) ?? new Map<string, number>();
      perRoot.set(token, (perRoot.get(token) ?? 0) + 1);
      spacingTokens.set(rootNode, perRoot);
    }

    if (isSizedFormControl(el)) {
      const row = findFlexRowContainer(el);
      if (row) {
        const group = controlRows.get(row) ?? [];
        group.push(el);
        controlRows.set(row, group);
      }
    }

    if (el.matches(CONTROL_SURFACE_SELECTOR) && isMeasurableControl(el)) surfaceControls.push(el);

    const style = getComputedStyle(el);

    // A section candidate: a section or region element, or a direct child of
    // the screen root that paints a surface of its own - a child of the main
    // landmark, or a top-level child of a screen's shadow root when its host
    // sits inside one (MFE screens render into shadow roots, where
    // parentElement is null).
    const paintsSurface = hasOpaqueBackground(style) || borderSideVisible(style.borderTopWidth, style.borderTopStyle);
    const inScreenRoot =
      el.parentElement?.matches('main, [role="main"]') === true ||
      (el.parentElement === null &&
        el.getRootNode() instanceof ShadowRoot &&
        (el.getRootNode() as ShadowRoot).host.closest('main, [role="main"]') !== null);
    const isSectionCandidate = el.tagName === 'SECTION' || el.getAttribute('role') === 'region' || (paintsSurface && inScreenRoot);
    if (isSectionCandidate) {
      const parent = layoutParent(el);
      if (parent !== null) {
        const group = sectionGroups.get(parent) ?? [];
        group.push(el);
        sectionGroups.set(parent, group);
      }
    }

    const headingMatch = /^H([1-6])$/.exec(el.tagName);
    if (headingMatch) {
      headingLevels.push(Number(headingMatch[1]));
      headingEls.push(el);
    }

    if (
      !CONTROL_TAGS.has(el.tagName) &&
      !MEDIA_TAGS.has(el.tagName.toUpperCase()) &&
      !CONTROL_ROLES.has(el.getAttribute('role') ?? '')
    ) {
      findings.push(...collectCardPaddingFindings(el, style));
    }

    if (hasDirectText(el)) {
      const fontSize = Number.parseFloat(style.fontSize);
      if (isTinyText(fontSize, floors.tinyTextPx)) {
        findings.push({
          id: 'tiny-text',
          detail: `visible text at ${fontSize}px (floor ${floors.tinyTextPx}px, the kit's ${TINY_TEXT_TOKEN})`,
          target: describeElement(el),
        });
      } else if (isSmallControlText(fontSize, floors.controlTextPx) && isInteractiveText(el)) {
        findings.push({
          id: 'small-control-text',
          detail: `interactive text at ${fontSize}px (floor ${floors.controlTextPx}px, the kit's ${CONTROL_TEXT_TOKEN})`,
          target: describeElement(el),
        });
      }
      if (
        isClippedText({
          scrollWidth: el.scrollWidth,
          clientWidth: el.clientWidth,
          clientHeight: el.clientHeight,
          overflowX: style.overflowX,
          textOverflow: style.textOverflow,
        })
      ) {
        findings.push({
          id: 'clipped-text',
          detail: `text clipped without ellipsis (${el.scrollWidth}px content in ${el.clientWidth}px box)`,
          target: describeElement(el),
        });
      }
    }
  }

  findings.push(...collectPageScrollerFindings(mains));

  for (const [, group] of controlRows) {
    if (group.length < 2) continue;
    const boxes: ControlBox[] = group.map((el) => {
      const rect = el.getBoundingClientRect();
      return { top: rect.top, bottom: rect.bottom, height: rect.height };
    });
    for (const { a, b } of findControlHeightMismatches(boxes)) {
      findings.push({
        id: 'control-height-mismatch',
        detail: `form controls sharing one row render at ${Math.round(boxes[a].height)}px and ${Math.round(boxes[b].height)}px — controls in a row must share a control height (match the size variants)`,
        target: `${describeElement(group[a])} vs ${describeElement(group[b])}`,
      });
    }
  }

  findings.push(...collectHeadingSkipFindings(headingLevels, headingEls));

  findings.push(...collectControlSurfaceFindings(surfaceControls, backdrops));
  findings.push(...collectSectionGapFindings(sectionGroups.values(), backdrops));

  for (const [root, tokens] of spacingTokens) {
    findings.push(...probeDeadSpacingTokens(root, tokens));
  }

  return findings;
}

/**
 * Rules whose undecided (axe "incomplete") results are reported as needing
 * review. color-contrast is the one the verification leans on as objective
 * evidence, and axe leaves it undecided whenever it cannot resolve the
 * background: text over a gradient or an image, or behind another element.
 */
const UNDECIDED_RULES_REPORTED = new Set(['color-contrast']);

/**
 * An axe node's target as one locator. Each entry selects within one frame.
 * An element inside a shadow root comes as a list of every shadow host and
 * then the element, joined here with `>>>` (`my-widget >>> p`): joined with a
 * space it would read as the selector list `my-widget,p`, and MFE content
 * renders into shadow roots.
 */
function axeTargetLocator(target: NodeResult['target'] | undefined): string | undefined {
  return target?.map((selector) => (Array.isArray(selector) ? selector.join(' >>> ') : selector)).join(' ');
}

/**
 * Maps an axe run to findings: each violation as a defect, and each node of
 * an undecided result of a rule in UNDECIDED_RULES_REPORTED as its own
 * needs-review entry, with that node's target and axe's reasons for it, since
 * each element needs its own check by hand. Pure; exported for unit tests.
 */
export function axeResultsToFindings(results: Pick<AxeResults, 'violations' | 'incomplete'>): DesignDefectFinding[] {
  const violations = results.violations.map((violation) => ({
    id: `axe/${violation.id}`,
    detail: `${violation.help} (impact: ${violation.impact ?? 'unknown'}, ${violation.nodes.length} node(s))`,
    target: axeTargetLocator(violation.nodes[0]?.target),
  }));
  const undecided = results.incomplete
    .filter((result) => UNDECIDED_RULES_REPORTED.has(result.id))
    .flatMap((result) =>
      result.nodes.map((node): DesignDefectFinding => {
        const reasons = new Set([...node.any, ...node.all, ...node.none].map((check) => check.message));
        return {
          id: `axe-incomplete/${result.id}`,
          detail: `axe could not decide this: ${[...reasons].join('; ')}`,
          target: axeTargetLocator(node.target),
          kind: 'needs-review',
        };
      })
    );
  return [...violations, ...undecided];
}

async function collectAxeFindings(): Promise<DesignDefectFinding[]> {
  const axe = (await import('axe-core')).default;
  // Both kinds in full: axe keeps one node per result for a type left out.
  const result = await axe.run(
    { exclude: [['.studio-panel'], ['.studio-portal-container']] },
    { resultTypes: ['violations', 'incomplete'] }
  );
  return axeResultsToFindings(result);
}

function consoleLine(finding: DesignDefectFinding): string {
  return `${finding.id}: ${finding.detail}${finding.target ? ` — ${finding.target}` : ''}`;
}

/**
 * Runs the full sweep and reports to the console. Resolves with findings,
 * needs-review entries included. The clean line prints only when there is
 * neither: a check the sweep could not decide is not a pass.
 */
export async function runDesignDefectCheck(): Promise<DesignDefectFinding[]> {
  const findings = [...collectLayoutFindings(), ...(await collectAxeFindings())];
  const defects = findings.filter((finding) => finding.kind !== 'needs-review');
  const needsReview = findings.filter((finding) => finding.kind === 'needs-review');

  if (findings.length === 0) {
    console.info('[design-defects] clean: no objective design defects detected');
    return findings;
  }
  if (defects.length > 0) {
    console.warn(`[design-defects] ${defects.length} finding(s):`);
    for (const finding of defects) console.warn(`[design-defects] ${consoleLine(finding)}`);
  }
  if (needsReview.length > 0) {
    console.warn(`[design-defects] ${needsReview.length} item(s) need review — undecided, so this state is not clean:`);
    for (const finding of needsReview) console.warn(`[design-defects] needs review ${consoleLine(finding)}`);
  }
  return findings;
}

declare global {
  interface Window {
    __frontxDesignDefects?: () => Promise<DesignDefectFinding[]>;
  }
}

/**
 * Installs the on-demand hook and schedules one sweep after the app settles
 * (MFEs mount asynchronously; a check at first paint would race them).
 */
export function installDesignDefectCheck(settleDelayMs = 3000): void {
  window.__frontxDesignDefects = runDesignDefectCheck;
  window.setTimeout(() => {
    runDesignDefectCheck().catch((error: unknown) => {
      console.error('[design-defects] sweep failed:', error);
    });
  }, settleDelayMs);
}
