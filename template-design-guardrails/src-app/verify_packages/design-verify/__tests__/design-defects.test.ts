//
// Unit tests for the pure rule logic of the dev-only runtime design-defect
// checker (src/designDefects.ts). The DOM walk, axe run, and
// layout-dependent measurements need a real browser (jsdom has no layout —
// scrollWidth is always 0 and there is no paint for contrast), so what lives
// here is the rule maths those measurements feed: the predicates and the
// heading-sequence rule. The live half is exercised by opening the app in
// dev mode, where the shell installs the checker when this package is present.
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ACCENT_STANDOUT_MIN,
  CONTROL_HEIGHT_TOLERANCE_PX,
  CONTROL_TEXT_PX,
  FULL_BLEED_TOLERANCE_PX,
  MIN_CARD_PADDING_PX,
  NON_TEXT_CONTRAST_MIN,
  SCROLL_EDGE_TOLERANCE_PX,
  SECTION_TOUCH_TOLERANCE_PX,
  TINY_TEXT_PX,
  axeResultsToFindings,
  clipInkToScrollers,
  collectHeadingSkipFindings,
  compositeOver,
  contrastRatio,
  findCardEdgeFlush,
  findControlHeightMismatches,
  findHeadingSkips,
  findPageScrollers,
  findTouchingSectionPairs,
  installDesignDefectCheck,
  isClippedText,
  isControlSurfaceDefect,
  isFilledAccentControl,
  isFullBleedMedia,
  isSmallControlText,
  isTinyText,
  parseCssColor,
  parseCssLengthPx,
  readTextFloors,
  runDesignDefectCheck,
  scrollsSideways,
  shareVisualRow,
  soleLayoutChild,
  spacingProbeSpec,
} from '../src/designDefects';
import type { DesignDefectFinding, LayoutRole, Rgba, SectionSurface } from '../src/designDefects';

// axe-core's run is stubbed per test: the sweep-failure test below (K-002)
// makes it reject to assert the rejection is caught, not left as an
// unhandled rejection, and the console tests hand it results.
const axeRun = vi.hoisted(() => vi.fn());
vi.mock('axe-core', () => ({
  default: {
    run: axeRun,
  },
}));

describe('text floors from the installed ramp', () => {
  it('resolves px and rem tokens against the root font size, else null', () => {
    expect(parseCssLengthPx('0.6875rem', 16)).toBeCloseTo(11);
    expect(parseCssLengthPx(' 13px ', 16)).toBe(13);
    expect(parseCssLengthPx('', 16)).toBeNull();
    expect(parseCssLengthPx('1.2em', 16)).toBeNull();
    expect(parseCssLengthPx('calc(1rem - 2px)', 16)).toBeNull();
  });

  it('reads the floors from :root tokens and falls back to the shipped values', () => {
    const root = document.documentElement;
    root.style.removeProperty('--text-mono-size');
    root.style.removeProperty('--text-label-size');
    expect(readTextFloors()).toEqual({ tinyTextPx: TINY_TEXT_PX, controlTextPx: CONTROL_TEXT_PX });

    root.style.setProperty('--text-mono-size', '12px');
    root.style.setProperty('--text-label-size', '0.875rem');
    root.style.fontSize = '16px';
    expect(readTextFloors()).toEqual({ tinyTextPx: 12, controlTextPx: 14 });
    root.style.removeProperty('--text-mono-size');
    root.style.removeProperty('--text-label-size');
    root.style.removeProperty('font-size');
  });

  it('isSmallControlText: below the label floor, zero ignored', () => {
    expect(isSmallControlText(CONTROL_TEXT_PX - 1)).toBe(true);
    expect(isSmallControlText(CONTROL_TEXT_PX)).toBe(false);
    expect(isSmallControlText(12, 14)).toBe(true);
    expect(isSmallControlText(0)).toBe(false);
  });
});

describe('isTinyText', () => {
  it('flags visible text below the floor and accepts the floor itself', () => {
    expect(isTinyText(TINY_TEXT_PX - 0.5)).toBe(true);
    expect(isTinyText(TINY_TEXT_PX)).toBe(false);
    expect(isTinyText(16)).toBe(false);
  });

  it('ignores zero — jsdom and detached elements report 0, not tiny text', () => {
    expect(isTinyText(0)).toBe(false);
  });
});

describe('isClippedText', () => {
  it('flags hidden/clip overflow wider than the box', () => {
    expect(isClippedText({ scrollWidth: 200, clientWidth: 100, clientHeight: 20, overflowX: 'hidden', textOverflow: 'clip' })).toBe(true);
    expect(isClippedText({ scrollWidth: 200, clientWidth: 100, clientHeight: 20, overflowX: 'clip', textOverflow: 'clip' })).toBe(true);
  });

  it('accepts ellipsis as an intentional truncation treatment', () => {
    expect(isClippedText({ scrollWidth: 200, clientWidth: 100, clientHeight: 20, overflowX: 'hidden', textOverflow: 'ellipsis' })).toBe(false);
  });

  it('accepts scrollable and visible overflow', () => {
    expect(isClippedText({ scrollWidth: 200, clientWidth: 100, clientHeight: 20, overflowX: 'auto', textOverflow: 'clip' })).toBe(false);
    expect(isClippedText({ scrollWidth: 200, clientWidth: 100, clientHeight: 20, overflowX: 'visible', textOverflow: 'clip' })).toBe(false);
  });

  it('exempts the screen-reader-only pattern (content clipped in a ~1px box)', () => {
    expect(isClippedText({ scrollWidth: 51, clientWidth: 1, clientHeight: 1, overflowX: 'hidden', textOverflow: 'clip' })).toBe(false);
  });

  it('tolerates sub-pixel rounding', () => {
    expect(isClippedText({ scrollWidth: 101, clientWidth: 100, clientHeight: 20, overflowX: 'hidden', textOverflow: 'clip' })).toBe(false);
  });
});

describe('scrollsSideways', () => {
  it('flags a scroll container whose content is wider than its box', () => {
    // The shell's screen container holding a 900px screen at a 320px viewport.
    expect(scrollsSideways({ overflowX: 'auto', scrollWidth: 900, clientWidth: 288 })).toBe(true);
    expect(scrollsSideways({ overflowX: 'scroll', scrollWidth: 900, clientWidth: 288 })).toBe(true);
  });

  it('accepts content that fits, within sub-pixel rounding', () => {
    expect(scrollsSideways({ overflowX: 'auto', scrollWidth: 288, clientWidth: 288 })).toBe(false);
    expect(scrollsSideways({ overflowX: 'auto', scrollWidth: 289, clientWidth: 288 })).toBe(false);
  });

  it('ignores boxes that clip or let content spill instead of scrolling', () => {
    expect(scrollsSideways({ overflowX: 'hidden', scrollWidth: 900, clientWidth: 288 })).toBe(false);
    expect(scrollsSideways({ overflowX: 'clip', scrollWidth: 900, clientWidth: 288 })).toBe(false);
    expect(scrollsSideways({ overflowX: 'visible', scrollWidth: 900, clientWidth: 288 })).toBe(false);
  });
});

describe('findPageScrollers', () => {
  interface Box {
    name: string;
    scroller: boolean;
    grid: boolean;
    parent: Box | null;
    children: Box[];
  }

  function box(name: string, scroller: boolean, children: Box[] = []): Box {
    const node: Box = { name, scroller, grid: false, parent: null, children };
    for (const child of children) child.parent = node;
    return node;
  }

  function grid(name: string): Box {
    return { ...box(name, false), grid: true };
  }

  const tree = {
    parent: (node: Box) => node.parent,
    soleChild: (node: Box) => (node.children.length === 1 ? node.children[0] : null),
    isScroller: (node: Box) => node.scroller,
    isGrid: (node: Box) => node.grid,
  };

  function scrollersFrom(main: Box): string[] {
    return findPageScrollers(main, tree).map((node) => node.name);
  }

  it("finds the shell's screen container below a main that does not scroll", () => {
    // Layout > main (overflow hidden) > div[data-mfe-screen-container] (overflow auto) > slot > screen
    const main = box('main', false, [box('screen-container', true, [box('slot', false, [box('screen', false)])])]);
    box('layout', false, [main]);

    expect(scrollersFrom(main)).toEqual(['screen-container']);
  });

  it('measures every scroller on the sole-child chain, so a screen that scrolls on its own is found too', () => {
    const main = box('main', false, [box('screen-container', true, [box('slot', false, [box('screen-root', true)])])]);

    expect(scrollersFrom(main)).toEqual(['screen-container', 'screen-root']);
  });

  it("stops at a scroller whose only child is a table or grid: that is the grid's own scroll, not the page's", () => {
    // The screen's only content is a data grid in its own overflow-x: auto wrapper.
    const main = box('main', false, [
      box('screen-container', true, [box('slot', false, [box('table-wrapper', true, [grid('table')])])]),
    ]);

    expect(scrollersFrom(main)).toEqual(['screen-container']);
  });

  it('still measures the page container when a grid is all the screen holds and has no scroll box of its own', () => {
    const main = box('main', false, [box('screen-container', true, [box('slot', false, [grid('table')])])]);

    expect(scrollersFrom(main)).toEqual(['screen-container']);
  });

  it('stops at a level with more than one child, so a table in its own scroll wrapper is not the page', () => {
    const main = box('main', false, [box('screen', false, [box('heading', false), box('table-wrapper', true)])]);

    expect(scrollersFrom(main)).toEqual([]);
  });

  it('includes the main landmark itself and the scrollers above it, nearest first', () => {
    const main = box('main', true, [box('screen', false)]);
    box('app', true, [box('frame', false, [main])]);

    expect(scrollersFrom(main)).toEqual(['app', 'main']);
  });

  it('returns nothing when no box on the way scrolls', () => {
    const main = box('main', false, [box('screen', false)]);
    box('layout', false, [main]);

    expect(scrollersFrom(main)).toEqual([]);
  });
});

describe('soleLayoutChild', () => {
  interface LayoutNode {
    name: string;
    role: LayoutRole;
    contents: LayoutNode[];
  }

  const node = (name: string, role: LayoutRole, contents: LayoutNode[] = []): LayoutNode => ({ name, role, contents });
  const layout = { role: (n: LayoutNode) => n.role, contents: (n: LayoutNode) => n.contents };
  const sole = (nodes: LayoutNode[]) => soleLayoutChild(nodes, layout)?.name ?? null;

  it('returns the only box, passing over nodes that take no part in the layout', () => {
    // Whitespace text, a hidden element, a positioned badge.
    expect(sole([node('ws', 'none'), node('screen', 'box'), node('badge', 'none')])).toBe('screen');
  });

  it('returns null for a level with more than one box, or text beside a box', () => {
    expect(sole([node('heading', 'box'), node('table-wrapper', 'box')])).toBeNull();
    expect(sole([node('label', 'text'), node('screen', 'box')])).toBeNull();
    expect(sole([node('ws', 'none')])).toBeNull();
  });

  it("counts the boxes inside a display: contents wrapper, so a sibling is not taken for the level's only child", () => {
    // The screen's heading and copy sit in a wrapper without a box of its
    // own, beside a table that scrolls in its own wrapper.
    const wrapper = node('wrapper', 'contents', [node('heading', 'box'), node('copy', 'box')]);

    expect(sole([wrapper, node('table-wrapper', 'box')])).toBeNull();
  });

  it('follows a display: contents wrapper (a slot, by default) to the only box it lays out', () => {
    const slot = node('slot', 'contents', [node('ws', 'none'), node('screen-root', 'box')]);

    expect(sole([slot])).toBe('screen-root');
    expect(sole([node('outer', 'contents', [node('inner', 'contents', [node('screen-root', 'box')])])])).toBe(
      'screen-root'
    );
  });

  it('returns null when a wrapper lays out text beside the box', () => {
    expect(sole([node('wrapper', 'contents', [node('label', 'text')]), node('screen', 'box')])).toBeNull();
  });
});

describe('shareVisualRow', () => {
  it('bottom-aligned controls of different heights still share the row', () => {
    // items-end row: 40px input and 36px button, flush bottoms.
    expect(shareVisualRow(
      { top: 0, bottom: 40, height: 40 },
      { top: 4, bottom: 40, height: 36 }
    )).toBe(true);
  });

  it('controls stacked in separate rows do not', () => {
    expect(shareVisualRow(
      { top: 0, bottom: 40, height: 40 },
      { top: 56, bottom: 92, height: 36 }
    )).toBe(false);
  });

  it('a zero-height box never shares a row', () => {
    expect(shareVisualRow(
      { top: 0, bottom: 40, height: 40 },
      { top: 10, bottom: 10, height: 0 }
    )).toBe(false);
  });
});

describe('findControlHeightMismatches', () => {
  it('flags a default-size button beside a large input (the 36px-vs-40px case)', () => {
    expect(findControlHeightMismatches([
      { top: 0, bottom: 40, height: 40 },
      { top: 4, bottom: 40, height: 36 },
    ])).toEqual([{ a: 0, b: 1 }]);
  });

  it('accepts matched heights and tolerates border-box rounding', () => {
    expect(findControlHeightMismatches([
      { top: 0, bottom: 40, height: 40 },
      { top: 0, bottom: 40, height: 40 },
    ])).toEqual([]);
    expect(findControlHeightMismatches([
      { top: 0, bottom: 40, height: 40 },
      { top: 1, bottom: 40, height: 40 - CONTROL_HEIGHT_TOLERANCE_PX },
    ])).toEqual([]);
  });

  it('ignores controls the flex container has wrapped onto another line', () => {
    expect(findControlHeightMismatches([
      { top: 0, bottom: 40, height: 40 },
      { top: 48, bottom: 84, height: 36 },
    ])).toEqual([]);
  });
});

describe('clipInkToScrollers', () => {
  it('cuts both sides of wide ink and keeps an edge that starts at padded content', () => {
    const box = { left: 112, right: 388 };
    expect(clipInkToScrollers({ left: 100, right: 420 }, [box])).toEqual({ left: null, right: null });
    expect(clipInkToScrollers({ left: 112, right: 420 }, [box])).toEqual({ left: 112, right: null });
  });

  it('keeps an unpadded left edge measurable while cutting the right side', () => {
    const ink = clipInkToScrollers({ left: 100, right: 420 }, [{ left: 100, right: 400 }]);
    expect(ink).toEqual({ left: 100, right: null });
    expect(findCardEdgeFlush({ left: 100, right: 400 }, [ink!], { left: true, right: true })).toEqual([
      { side: 'left', insetPx: 0 },
    ]);
  });

  it('cuts only the side beyond a scroller and drops ink fully out of view', () => {
    const box = { left: 112, right: 388 };
    expect(clipInkToScrollers({ left: 100, right: 388 }, [box])).toEqual({ left: null, right: 388 });
    expect(clipInkToScrollers({ left: 390, right: 420 }, [box])).toBeNull();
  });

  it('intersects nested scrollers regardless of order', () => {
    const outer = { left: 108, right: 390 };
    const inner = { left: 112, right: 400 };
    expect(clipInkToScrollers({ left: 110, right: 395 }, [outer, inner])).toEqual({ left: null, right: null });
    expect(clipInkToScrollers({ left: 110, right: 395 }, [inner, outer])).toEqual({ left: null, right: null });
  });

  it('leaves ink unclipped without a scroller, so overflow past a hidden or clip container is still reported', () => {
    const ink = clipInkToScrollers({ left: 90, right: 380 }, []);
    expect(ink).toEqual({ left: 90, right: 380 });
    expect(findCardEdgeFlush({ left: 100, right: 400 }, [ink!], { left: true, right: true })).toEqual([
      { side: 'left', insetPx: -10 },
    ]);
  });

  it('cuts by the element box, so cell text short of the edge in a cut cell is not measured', () => {
    const scroller = { left: 100, right: 400 };
    const cellText = { left: 316, right: 399 };
    const cell = { left: 300, right: 415 };
    expect(clipInkToScrollers(cellText, [scroller], cell)).toEqual({ left: 316, right: null });
    expect(clipInkToScrollers(cellText, [scroller])).toEqual({ left: 316, right: 399 });
    expect(clipInkToScrollers({ left: 408, right: 412 }, [scroller], { left: 405, right: 415 })).toBeNull();
  });

  it('does not cut a child that fills the scroller to within a subpixel', () => {
    const box = { left: 112, right: 388 };
    const edge = SCROLL_EDGE_TOLERANCE_PX / 2;
    expect(clipInkToScrollers({ left: 112 - edge, right: 388 + edge }, [box])).toEqual({
      left: 112 - edge,
      right: 388 + edge,
    });
  });

  it('accepts padded ink at both scroll ends', () => {
    const content = { left: 100, right: 400 };
    const box = { left: content.left + MIN_CARD_PADDING_PX, right: content.right - MIN_CARD_PADDING_PX };
    const start = clipInkToScrollers({ left: box.left, right: 450 }, [box]);
    const end = clipInkToScrollers({ left: 50, right: box.right }, [box]);
    expect(start).toEqual({ left: box.left, right: null });
    expect(end).toEqual({ left: null, right: box.right });
    expect(findCardEdgeFlush(content, [start!, end!], { left: true, right: true })).toEqual([]);
  });
});

describe('findCardEdgeFlush', () => {
  const content = { left: 100, right: 400 };
  const bothSides = { left: true, right: true };

  it('flags ink flush against a drawn edge (the unpadded task-row case)', () => {
    expect(findCardEdgeFlush(content, [{ left: 100, right: 380 }], bothSides)).toEqual([
      { side: 'left', insetPx: 0 },
    ]);
  });

  it('accepts ink at or beyond the minimum padding on every drawn side', () => {
    expect(
      findCardEdgeFlush(content, [{ left: 100 + MIN_CARD_PADDING_PX, right: 400 - MIN_CARD_PADDING_PX }], bothSides)
    ).toEqual([]);
  });

  it('judges only the sides the card actually draws (divided list rows draw none)', () => {
    expect(findCardEdgeFlush(content, [{ left: 100, right: 400 }], { left: false, right: false })).toEqual([]);
    expect(findCardEdgeFlush(content, [{ left: 100, right: 400 }], { left: false, right: true })).toEqual([
      { side: 'right', insetPx: 0 },
    ]);
  });

  it('measures the closest ink per side across all content', () => {
    expect(
      findCardEdgeFlush(
        content,
        [
          { left: 116, right: 200 },
          { left: 101, right: 390 },
        ],
        bothSides
      )
    ).toEqual([{ side: 'left', insetPx: 1 }]);
  });

  it('reports nothing for an empty card', () => {
    expect(findCardEdgeFlush(content, [], bothSides)).toEqual([]);
  });

  it('skips null sides and leaves a side with only null values unmeasured', () => {
    expect(findCardEdgeFlush(content, [{ left: null, right: 400 }, { left: 116, right: null }], bothSides)).toEqual([
      { side: 'right', insetPx: 0 },
    ]);
    expect(findCardEdgeFlush(content, [{ left: null, right: 400 }], bothSides)).toEqual([
      { side: 'right', insetPx: 0 },
    ]);
    expect(findCardEdgeFlush(content, [{ left: null, right: null }], bothSides)).toEqual([]);
  });
});

describe('isFullBleedMedia', () => {
  it('exempts media filling the card, within tolerance', () => {
    expect(isFullBleedMedia(300, 300)).toBe(true);
    expect(isFullBleedMedia(300, 300 - FULL_BLEED_TOLERANCE_PX)).toBe(true);
    expect(isFullBleedMedia(300, 280)).toBe(false);
    expect(isFullBleedMedia(0, 0)).toBe(false);
  });
});

describe('control-surface-contrast maths', () => {
  const white: Rgba = { r: 255, g: 255, b: 255, a: 1 };

  it('parses the colour forms computed styles report, and nothing else', () => {
    expect(parseCssColor('rgb(255, 0, 0)')).toEqual({ r: 255, g: 0, b: 0, a: 1 });
    expect(parseCssColor('rgba(16, 32, 48, 0.5)')).toEqual({ r: 16, g: 32, b: 48, a: 0.5 });
    expect(parseCssColor('rgb(16 32 48 / 0.25)')).toEqual({ r: 16, g: 32, b: 48, a: 0.25 });
    expect(parseCssColor('transparent')).toEqual({ r: 0, g: 0, b: 0, a: 0 });
    // Computed styles of other colour spaces and every non-colour: unmeasurable.
    expect(parseCssColor('oklch(0.7 0.1 200)')).toBeNull();
    expect(parseCssColor('color(srgb 1 0 0)')).toBeNull();
    expect(parseCssColor('')).toBeNull();
    expect(parseCssColor('none')).toBeNull();
  });

  it('composites a translucent surface over what is under it', () => {
    expect(compositeOver({ r: 255, g: 0, b: 0, a: 0.5 }, white)).toEqual({ r: 255, g: 128, b: 128, a: 1 });
    // A fully transparent fore leaves the backdrop; a fully opaque one wins.
    expect(compositeOver({ r: 0, g: 0, b: 0, a: 0 }, white)).toEqual(white);
    expect(compositeOver({ r: 10, g: 20, b: 30, a: 1 }, { r: 200, g: 200, b: 200, a: 1 })).toEqual({
      r: 10,
      g: 20,
      b: 30,
      a: 1,
    });
  });

  it('gives the WCAG ratios: black on white 21:1, a mid grey far under the floor', () => {
    expect(contrastRatio({ r: 0, g: 0, b: 0, a: 1 }, white)).toBeCloseTo(21);
    expect(contrastRatio(white, { r: 0, g: 0, b: 0, a: 1 })).toBeCloseTo(21);
    expect(contrastRatio({ r: 224, g: 224, b: 224, a: 1 }, white)).toBeLessThan(2);
    expect(contrastRatio({ r: 255, g: 0, b: 0, a: 1 }, white)).toBeGreaterThan(3);
  });

  it('reports a surface under the floor, spares one that reaches it', () => {
    expect(isControlSurfaceDefect({ ratio: 1.3, borderRatio: null })).toBe(true);
    expect(isControlSurfaceDefect({ ratio: NON_TEXT_CONTRAST_MIN, borderRatio: null })).toBe(false);
    expect(isControlSurfaceDefect({ ratio: 4, borderRatio: null })).toBe(false);
  });

  it('spares a quiet surface when its border reaches the floor, reports a weak one', () => {
    expect(isControlSurfaceDefect({ ratio: 1.3, borderRatio: 3.2 })).toBe(false);
    expect(isControlSurfaceDefect({ ratio: 1.3, borderRatio: NON_TEXT_CONTRAST_MIN })).toBe(false);
    expect(isControlSurfaceDefect({ ratio: 1.3, borderRatio: 2.9 })).toBe(true);
  });

  it('measures a control only when its surface stands out from the screen surface', () => {
    // A filled accent (the kit's primary on a light page) clears the gate.
    expect(isFilledAccentControl(5.3)).toBe(true);
    expect(isFilledAccentControl(ACCENT_STANDOUT_MIN)).toBe(true);
    // Neutral chrome sits at the page's own colours: the kit's outline button
    // surface reads 1.0:1 against the band it paints on, a secondary one just
    // over, and an unreadable screen surface measures nothing.
    expect(isFilledAccentControl(1.0)).toBe(false);
    expect(isFilledAccentControl(1.48)).toBe(false);
    expect(isFilledAccentControl(null)).toBe(false);
  });
});

describe('findTouchingSectionPairs', () => {
  const box = (over: Partial<SectionSurface>): SectionSurface => ({
    top: 0,
    bottom: 100,
    left: 0,
    right: 500,
    background: { r: 255, g: 255, b: 255, a: 1 },
    border: null,
    ...over,
  });

  it('reports two stacked sections whose painted edges meet', () => {
    const sections = [
      box({ top: 0, bottom: 200, background: { r: 255, g: 255, b: 255, a: 1 } }),
      box({ top: 200, bottom: 400, background: { r: 240, g: 240, b: 240, a: 1 } }),
    ];
    expect(findTouchingSectionPairs(sections)).toEqual([{ a: 0, b: 1 }]);
  });

  it('spares sections separated by a gap', () => {
    const sections = [
      box({ top: 0, bottom: 200 }),
      box({ top: 200 + SECTION_TOUCH_TOLERANCE_PX, bottom: 400, background: { r: 240, g: 240, b: 240, a: 1 } }),
    ];
    expect(findTouchingSectionPairs(sections)).toEqual([]);
  });

  it('spares two sections sharing one background - their padding separates the content', () => {
    const sections = [
      box({ top: 0, bottom: 200, background: { r: 255, g: 255, b: 255, a: 1 } }),
      box({ top: 200, bottom: 400, background: { r: 255, g: 255, b: 255, a: 1 } }),
    ];
    expect(findTouchingSectionPairs(sections)).toEqual([]);
  });

  it('spares sections side by side and ones painting nothing', () => {
    const sideBySide = [
      box({ top: 0, bottom: 100, left: 0, right: 200 }),
      box({ top: 0, bottom: 100, left: 200, right: 400, background: { r: 240, g: 240, b: 240, a: 1 } }),
    ];
    expect(findTouchingSectionPairs(sideBySide)).toEqual([]);
    const unpainted = [
      box({ top: 0, bottom: 100, background: null }),
      box({ top: 100, bottom: 200, background: { r: 240, g: 240, b: 240, a: 1 } }),
    ];
    expect(findTouchingSectionPairs(unpainted)).toEqual([]);
  });

  it('spares a pair a border on their shared edge divides, and reads a border elsewhere as a distinct surface', () => {
    // The divider the remedy names: a visible border where the two boxes
    // meet (the upper one's bottom, or the lower one's top) separates them.
    const divider = [
      box({ top: 0, bottom: 100, border: { r: 17, g: 17, b: 17, a: 1 }, borders: { top: null, right: null, bottom: { r: 17, g: 17, b: 17, a: 1 }, left: null } }),
      box({ top: 100, bottom: 200, background: { r: 240, g: 240, b: 240, a: 1 } }),
    ];
    expect(findTouchingSectionPairs(divider)).toEqual([]);
    // The same border on the pair's outer edge says nothing about the seam:
    // distinct surfaces still touch.
    const elsewhere = [
      box({ top: 0, bottom: 100 }),
      box({ top: 100, bottom: 200, background: { r: 240, g: 240, b: 240, a: 1 }, border: { r: 229, g: 229, b: 229, a: 1 }, borders: { top: null, right: null, bottom: null, left: { r: 229, g: 229, b: 229, a: 1 } } }),
    ];
    expect(findTouchingSectionPairs(elsewhere)).toEqual([{ a: 0, b: 1 }]);
    // The same border on both sides is one surface treatment, not a divider.
    const sameBorder = [
      box({ top: 0, bottom: 100, border: { r: 229, g: 229, b: 229, a: 1 } }),
      box({ top: 100, bottom: 200, border: { r: 229, g: 229, b: 229, a: 1 } }),
    ];
    expect(findTouchingSectionPairs(sameBorder)).toEqual([]);
  });
});

describe('spacingProbeSpec', () => {
  it('maps padding and margin utilities to the sides they must move', () => {
    expect(spacingProbeSpec('p-8')).toEqual({ kind: 'self', properties: ['padding-top'] });
    expect(spacingProbeSpec('px-4')).toEqual({
      kind: 'self',
      properties: ['padding-left', 'padding-right'],
    });
    expect(spacingProbeSpec('ps-2')).toEqual({ kind: 'self', properties: ['padding-inline-start'] });
    expect(spacingProbeSpec('mt-1.5')).toEqual({ kind: 'self', properties: ['margin-top'] });
    expect(spacingProbeSpec('-m-4')).toEqual({ kind: 'self', properties: ['margin-top'] });
    expect(spacingProbeSpec('p-px')).toEqual({ kind: 'self', properties: ['padding-top'] });
  });

  it('maps gap and space-between utilities, space landing on a sibling', () => {
    expect(spacingProbeSpec('gap-4')).toEqual({ kind: 'self', properties: ['row-gap'] });
    expect(spacingProbeSpec('gap-x-2')).toEqual({ kind: 'self', properties: ['column-gap'] });
    expect(spacingProbeSpec('space-y-3')).toEqual({
      kind: 'sibling',
      properties: ['margin-top', 'margin-bottom'],
    });
  });

  it('ignores zero suffixes, variants, arbitrary values, and non-spacing classes', () => {
    expect(spacingProbeSpec('p-0')).toBeNull();
    expect(spacingProbeSpec('gap-0')).toBeNull();
    expect(spacingProbeSpec('md:p-8')).toBeNull();
    expect(spacingProbeSpec('p-[13px]')).toBeNull();
    expect(spacingProbeSpec('font-bold')).toBeNull();
    expect(spacingProbeSpec('padding')).toBeNull();
  });
});

describe('findHeadingSkips', () => {
  it('flags a level jump and names both sides', () => {
    expect(findHeadingSkips([1, 3])).toEqual([{ from: 1, to: 3 }]);
    expect(findHeadingSkips([2, 2, 4, 5])).toEqual([{ from: 2, to: 4 }]);
  });

  it('accepts descending and stepwise sequences', () => {
    expect(findHeadingSkips([1, 2, 3, 2, 3])).toEqual([]);
    expect(findHeadingSkips([3, 1, 2])).toEqual([]);
  });

  it('lets the first heading start at any level — screens inside a host begin below h1', () => {
    expect(findHeadingSkips([3])).toEqual([]);
    expect(findHeadingSkips([])).toEqual([]);
  });
});

describe('collectHeadingSkipFindings', () => {
  it('pairs each skip with the heading that caused it, not the first heading of that level', () => {
    // Levels [1, 3, 1, 3]: two independent skips (h1->h3 at index 1, h1->h3
    // at index 3), each must target its own h3 element, not both resolving
    // to the first one.
    const h3a = document.createElement('h3');
    h3a.id = 'first-h3';
    const h3b = document.createElement('h3');
    h3b.id = 'second-h3';
    const headingEls = [document.createElement('h1'), h3a, document.createElement('h1'), h3b];
    const headingLevels = [1, 3, 1, 3];

    const findings = collectHeadingSkipFindings(headingLevels, headingEls);

    expect(findings).toHaveLength(2);
    expect(findings[0]).toMatchObject({ id: 'skipped-heading', detail: 'heading level jumps h1 → h3', target: 'h3#first-h3' });
    expect(findings[1]).toMatchObject({ id: 'skipped-heading', detail: 'heading level jumps h1 → h3', target: 'h3#second-h3' });
    expect(findings[0].target).not.toBe(findings[1].target);
  });
});

describe('installDesignDefectCheck sweep failure', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    delete window.__frontxDesignDefects;
  });

  it('catches a rejected sweep instead of leaving an unhandled rejection', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    axeRun.mockRejectedValueOnce(new Error('axe-core failed to run'));

    installDesignDefectCheck(0);
    // Real timers: let the scheduled sweep (and the mocked axe-core
    // rejection it awaits) settle.
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(errorSpy).toHaveBeenCalledWith('[design-defects] sweep failed:', expect.any(Error));
  });
});

describe('axeResultsToFindings', () => {
  // Only the fields the mapping reads; axe's own result objects carry more.
  function result(id: string, nodes: Array<{ target: Array<string | string[]>; messages: string[] }>, extra: Record<string, unknown> = {}) {
    return {
      id,
      help: `${id} help`,
      impact: 'serious',
      nodes: nodes.map((node) => ({
        target: node.target,
        any: node.messages.map((message) => ({ id: 'check', message })),
        all: [],
        none: [],
      })),
      ...extra,
    };
  }

  function map(violations: unknown[], incomplete: unknown[]) {
    return axeResultsToFindings({ violations, incomplete } as unknown as Parameters<typeof axeResultsToFindings>[0]);
  }

  it('maps each violation to a defect, as before', () => {
    expect(map([result('color-contrast', [{ target: ['p'], messages: ['2.32:1'] }, { target: ['span'], messages: [] }])], [])).toEqual([
      {
        id: 'axe/color-contrast',
        detail: 'color-contrast help (impact: serious, 2 node(s))',
        target: 'p',
      },
    ]);
  });

  it('reports each node axe could not decide the contrast of as needing review, with its own target and reasons', () => {
    const gradient = "Element's background color could not be determined due to a background gradient";
    const overlapped = "Element's background color could not be determined because it's overlapped by another element";
    const findings = map(
      [],
      [
        result('color-contrast', [
          { target: ['p.synced'], messages: [gradient] },
          { target: ['span.hint'], messages: [gradient, gradient] },
          { target: ['em'], messages: [overlapped, gradient] },
        ]),
      ]
    );

    expect(findings).toEqual([
      { id: 'axe-incomplete/color-contrast', detail: `axe could not decide this: ${gradient}`, target: 'p.synced', kind: 'needs-review' },
      { id: 'axe-incomplete/color-contrast', detail: `axe could not decide this: ${gradient}`, target: 'span.hint', kind: 'needs-review' },
      {
        id: 'axe-incomplete/color-contrast',
        detail: `axe could not decide this: ${overlapped}; ${gradient}`,
        target: 'em',
        kind: 'needs-review',
      },
    ]);
  });

  it('names each shadow host on the way to an element inside a shadow root', () => {
    // axe's target for an element in a shadow root lists every host and then
    // the element; MFE content renders into shadow roots.
    const findings = map(
      [result('color-contrast', [{ target: [['my-widget', 'p']], messages: [] }])],
      [result('color-contrast', [{ target: [['my-widget', 'inner-card', 'span.hint']], messages: ['gradient'] }])]
    );

    expect(findings.map((finding) => finding.target)).toEqual(['my-widget >>> p', 'my-widget >>> inner-card >>> span.hint']);
  });

  it("leaves out other rules' undecided results and empty ones", () => {
    expect(map([], [result('aria-valid-attr-value', [{ target: ['div'], messages: ['?'] }]), result('color-contrast', [])])).toEqual([]);
  });
});

describe('runDesignDefectCheck console output', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('prints the clean line only when nothing was found and nothing is undecided', async () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    axeRun.mockResolvedValueOnce({ violations: [], incomplete: [] });

    expect(await runDesignDefectCheck()).toEqual([]);
    expect(info).toHaveBeenCalledWith('[design-defects] clean: no objective design defects detected');
  });

  it('lists undecided contrast as needing review instead of printing the clean line', async () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    axeRun.mockResolvedValueOnce({
      violations: [],
      incomplete: [
        {
          id: 'color-contrast',
          help: 'h',
          nodes: [{ target: ['p.synced'], any: [{ message: 'background gradient' }], all: [], none: [] }],
        },
      ],
    });

    const findings = await runDesignDefectCheck();

    expect(findings).toEqual([expect.objectContaining({ id: 'axe-incomplete/color-contrast', kind: 'needs-review' })]);
    // Both kinds in full: axe keeps one node per result for a type left out.
    expect(axeRun).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ resultTypes: ['violations', 'incomplete'] }),
    );
    expect(info).not.toHaveBeenCalled();
    expect(warn.mock.calls.map(([line]) => line)).toEqual([
      '[design-defects] 1 item(s) need review — undecided, so this state is not clean:',
      '[design-defects] needs review axe-incomplete/color-contrast: axe could not decide this: background gradient — p.synced',
    ]);
  });
});

describe('the sweep over composed DOM (jsdom, painted boxes faked)', () => {
  // jsdom has no layout, so the sweep's boxes are faked: one rect per
  // element, everything else (computed colours, display) comes from the
  // inline styles jsdom does resolve. This exercises the walk and the two
  // collectors' DOM side; the maths above pins the rules themselves.
  interface FakeRect {
    top: number;
    bottom: number;
    left: number;
    right: number;
    width: number;
    height: number;
  }
  /**
   * Paints one box per target (a selector, or an element a shadow root
   * holds) at the given top, height and (400 by default) width: each test
   * lists only its layout, and the rect map is built here. Restored with the
   * other mocks in afterEach.
   */
  function paintBoxes(layout: Array<[target: string | Element, top: number, height: number, width?: number]>): void {
    const rects = new Map<Element, FakeRect>();
    for (const [target, top, height, width = 400] of layout) {
      const el = typeof target === 'string' ? document.querySelector(target)! : target;
      rects.set(el, { top, bottom: top + height, left: 0, right: width, width, height });
    }
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
      return (rects.get(this) ?? { top: 0, bottom: 0, left: 0, right: 0, width: 0, height: 0 }) as DOMRect;
    });
  }

  afterEach(() => {
    document.body.innerHTML = '';
    // restoreAllMocks also restores the rect spy above.
    vi.restoreAllMocks();
  });

  async function sweep(): Promise<DesignDefectFinding[]> {
    axeRun.mockResolvedValueOnce({ violations: [], incomplete: [] });
    return runDesignDefectCheck();
  }

  // The motivating case: a filled accent control sitting on a band of its
  // own colour. The accent stands out from the screen's own surface (white),
  // so the rule measures it, and the band under it is the same colour: 1:1.
  it('control-surface-contrast: a filled accent on a band of its own colour is reported, a contrasting one and a ghost are not', async () => {
    document.body.innerHTML = `
      <main>
        <div style="background-color: rgb(255, 255, 255); position: static;">
          <div id="band" style="background-color: rgb(255, 0, 0);">
            <button id="accent" style="background-color: rgb(255, 0, 0); border: 0;">Save</button>
            <button id="ghost" style="background-color: transparent; border: 0;">Help</button>
          </div>
          <button id="loud" style="background-color: rgb(255, 0, 0); border: 0;">Cancel</button>
        </div>
      </main>
    `;
    paintBoxes([
      ['div', 0, 400],
      ['#band', 0, 200],
      ['#accent', 10, 36],
      ['#ghost', 60, 36],
      ['#loud', 210, 36],
    ]);

    const findings = await sweep();

    expect(findings.map((finding) => finding.id)).toEqual(['control-surface-contrast']);
    expect(findings[0]).toMatchObject({ target: 'button#accent' });
  });

  it('control-surface-contrast: a border that reaches 3:1 saves a quiet accent surface', async () => {
    document.body.innerHTML = `
      <main>
        <div style="background-color: rgb(255, 255, 255);">
          <div id="band" style="background-color: rgb(255, 0, 0);">
            <button id="bordered" style="background-color: rgb(255, 0, 0); border: 1px solid rgb(0, 0, 0);">Save</button>
            <button id="naked" style="background-color: rgb(255, 0, 0); border: 0;">Save</button>
          </div>
        </div>
      </main>
    `;
    paintBoxes([
      ['div', 0, 400],
      ['#band', 0, 200],
      ['#bordered', 10, 36],
      ['#naked', 60, 36],
    ]);

    const findings = await sweep();

    expect(findings.map((finding) => finding.id)).toEqual(['control-surface-contrast']);
    expect(findings[0]).toMatchObject({ target: 'button#naked' });
  });

  // The narrowing the kit's example screens asked for: the default outline
  // button paints at the page's own colours, so does the secondary one, and a
  // field's boundary is a page-wide convention. None of them is a filled
  // accent, and none is measured here - the form fields not even when one
  // paints an accent colour on an accent band: the field exclusion, not the
  // accent gate, is what keeps them out of this check.
  it('control-surface-contrast: neutral controls and form fields are not measured', async () => {
    document.body.innerHTML = `
      <main>
        <div style="background-color: rgb(255, 255, 255);">
          <button id="outline" style="background-color: rgb(255, 255, 255); border: 1px solid rgb(148, 163, 184);">Outline</button>
          <button id="secondary" style="background-color: rgb(248, 250, 252); border: 1px solid rgb(226, 232, 240);">Secondary</button>
          <div id="band" style="background-color: rgb(255, 0, 0);">
            <input id="email" style="background-color: rgb(255, 0, 0); border: 1px solid rgb(148, 163, 184);" />
            <select id="choice" style="background-color: rgb(255, 0, 0); border: 1px solid rgb(148, 163, 184);"><option>one</option></select>
            <textarea id="bio" style="background-color: rgb(255, 0, 0); border: 1px solid rgb(148, 163, 184);"></textarea>
            <button id="field-trigger" role="combobox" aria-haspopup="listbox" style="background-color: rgb(255, 0, 0); border: 1px solid rgb(148, 163, 184);">Choose</button>
          </div>
        </div>
      </main>
    `;
    paintBoxes([
      ['div', 0, 500],
      ['#outline', 10, 36],
      ['#secondary', 60, 36],
      ['#band', 110, 240],
      ['#email', 120, 36],
      ['#choice', 170, 36],
      ['#bio', 220, 60],
      ['#field-trigger', 300, 36],
    ]);

    expect(await sweep()).toEqual([]);
  });

  it('control-surface-contrast: a control the user cannot see or reach is not measured', async () => {
    document.body.innerHTML = `
      <main>
        <div style="background-color: rgb(255, 255, 255);">
          <div id="band" style="background-color: rgb(255, 0, 0);">
            <button id="hidden-region" style="background-color: rgb(255, 0, 0); border: 0;" aria-hidden="true">Save</button>
            <div aria-hidden="true"><button id="hidden-parent" style="background-color: rgb(255, 0, 0); border: 0;">Save</button></div>
            <button id="transparent" style="background-color: rgb(255, 0, 0); border: 0; opacity: 0;">Save</button>
            <input id="offscreen" type="hidden" style="background-color: rgb(255, 0, 0);" />
            <button id="clipped" style="background-color: rgb(255, 0, 0); border: 0; position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0);">Save</button>
            <button id="inert" style="background-color: rgb(255, 0, 0); border: 0;" disabled>Save</button>
            <fieldset disabled><button id="fieldset-inert" style="background-color: rgb(255, 0, 0); border: 0;">Save</button></fieldset>
            <button id="quiet" style="background-color: rgb(255, 0, 0); border: 0;">Save</button>
          </div>
        </div>
      </main>
    `;
    paintBoxes([
      ['div', 0, 400],
      ['#band', 0, 400],
      ['#hidden-region', 10, 36],
      ['#hidden-parent', 50, 36],
      ['#transparent', 90, 36],
      ['#offscreen', 130, 20],
      ['#clipped', 170, 1, 1],
      ['#inert', 210, 36],
      ['#fieldset-inert', 250, 36],
      ['#quiet', 290, 36],
    ]);

    const findings = await sweep();

    // Every invisible or inactive control drops out; the one visible,
    // enabled accent control is still judged on its (failing) surface.
    expect(findings.map((finding) => finding.id)).toEqual(['control-surface-contrast']);
    expect(findings[0]).toMatchObject({ target: 'button#quiet' });
  });

  // closest() does not leave a shadow root, while this sweep crosses the host
  // boundary everywhere else: an aria-hidden host has to hide the controls
  // its shadow root holds, or a control the user never sees is measured and
  // reported exactly at the boundary the rest of the sweep handles.
  it('control-surface-contrast: an aria-hidden shadow host hides the controls its shadow root holds', async () => {
    document.body.innerHTML = `
      <main>
        <div style="background-color: rgb(255, 255, 255);">
          <div id="hidden-host" aria-hidden="true" style="background-color: rgb(255, 255, 255);"></div>
          <div id="band" style="background-color: rgb(255, 0, 0);">
            <button id="quiet" style="background-color: rgb(255, 0, 0); border: 0;">Save</button>
          </div>
        </div>
      </main>
    `;
    const shadow = document.querySelector('#hidden-host')!.attachShadow({ mode: 'open' });
    shadow.innerHTML =
      '<div id="shadow-band" style="background-color: rgb(255, 0, 0);">' +
      '<button id="shadowed" style="background-color: rgb(255, 0, 0); border: 0;">Save</button></div>';
    paintBoxes([
      ['div', 0, 400],
      [shadow.querySelector('#shadow-band')!, 0, 100],
      [shadow.querySelector('#shadowed')!, 10, 36],
      ['#band', 150, 100],
      ['#quiet', 160, 36],
    ]);

    const findings = await sweep();

    // The shadowed accent control sits on a band of its own colour and would
    // read 1:1, but its host hides it from assistive tech; the visible
    // light-DOM control is still judged.
    expect(findings.map((finding) => finding.id)).toEqual(['control-surface-contrast']);
    expect(findings[0]).toMatchObject({ target: 'button#quiet' });
  });
  // A control placed straight in the screen root is not the screen itself.
  // Starting the screen-surface walk at the control resolved the control's
  // own background as the screen's surface, read 1:1 and never measured the
  // control; for that layout the screen's own surface is the landmark's, so
  // the accent gate judges against it and the grey surface under the 3:1
  // non-text floor is reported.
  it('control-surface-contrast: a control that is a direct child of the screen root is measured', async () => {
    document.body.innerHTML = `
      <main style="background-color: rgb(255, 255, 255);">
        <button id="root-accent" style="background-color: rgb(160, 160, 160); border: 0;">Save</button>
      </main>
    `;
    paintBoxes([
      ['main', 0, 400],
      ['#root-accent', 10, 36],
    ]);

    const findings = await sweep();

    expect(findings.map((finding) => finding.id)).toEqual(['control-surface-contrast']);
    expect(findings[0]).toMatchObject({ target: 'button#root-accent' });
  });

  // The screen root's own colour cannot be parsed (a color-mix Chromium
  // reports as oklab()): the screen surface is unknowable, so the control
  // drops out of the accent gate instead of being judged against what stands
  // behind the root, the way every other unparsable colour in this sweep is
  // skipped. The band under the control paints opaquely, so the control's
  // own backdrop stays readable: the unparsable colour is only the screen's.
  it('control-surface-contrast: an unparsable screen surface skips the control instead of guessing', async () => {
    document.body.innerHTML = `
      <main>
        <div id="root" style="background-color: oklab(0.5 0.1 0.2);">
          <div id="band" style="background-color: rgb(255, 0, 0);">
            <button id="accent" style="background-color: rgb(255, 0, 0); border: 0;">Save</button>
          </div>
        </div>
      </main>
    `;
    paintBoxes([
      ['#root', 0, 400],
      ['#band', 0, 200],
      ['#accent', 10, 36],
    ]);

    expect(await sweep()).toEqual([]);
  });

  // A band painting an image over its background colour (an opaque white
  // gradient here) shows the image, not the colour the stylesheet declares:
  // the colour underneath cannot stand in for what the control visibly
  // stands over, so the pair is unmeasurable and drops out instead of
  // reporting a 1:1 the rendered page does not have.
  it('control-surface-contrast: a backdrop that paints a background-image is not measured against its background colour', async () => {
    document.body.innerHTML = `
      <main>
        <div style="background-color: rgb(255, 255, 255);">
          <div id="band" style="background-color: rgb(255, 0, 0); background-image: linear-gradient(rgb(255, 255, 255), rgb(255, 255, 255));">
            <button id="accent" style="background-color: rgb(255, 0, 0); border: 0;">Save</button>
          </div>
        </div>
      </main>
    `;
    paintBoxes([
      ['div', 0, 400],
      ['#band', 0, 200],
      ['#accent', 10, 36],
    ]);

    expect(await sweep()).toEqual([]);
  });

  // The border paints over the control's own background (background-clip
  // defaults to border-box), not straight over the band: a translucent border
  // darkened by a dark surface can reach 3:1 where compositing it over the
  // band alone reads it quiet.
  it('control-surface-contrast: a translucent border is composited over the surface it paints on', async () => {
    document.body.innerHTML = `
      <main>
        <div id="band" style="background-color: rgb(255, 255, 255);">
          <button id="bordered" style="background-color: rgb(160, 160, 160); border: 2px solid rgba(0, 0, 0, 0.3);">Save</button>
        </div>
      </main>
    `;
    paintBoxes([
      ['#band', 0, 200],
      ['#bordered', 10, 36],
    ]);

    // rgb(160,160,160) over white with a 2px rgba(0,0,0,.3) border: the
    // border composites to rgb(112,112,112) over the control's own surface
    // and reaches about 4.95:1, past the 3:1 floor.
    expect(await sweep()).toEqual([]);
  });

  // The same control with the background clipped inside the border paints no
  // background under it: the border composites over the band, reads 2.10:1
  // and the surface defect is reported.
  it('control-surface-contrast: a translucent border over a background clipped inside it is judged against the band', async () => {
    document.body.innerHTML = `
      <main>
        <div id="band" style="background-color: rgb(255, 255, 255);">
          <button id="clipped" style="background-color: rgb(160, 160, 160); background-clip: padding-box; border: 2px solid rgba(0, 0, 0, 0.3);">Save</button>
        </div>
      </main>
    `;
    paintBoxes([
      ['#band', 0, 200],
      ['#clipped', 10, 36],
    ]);

    const findings = await sweep();

    expect(findings.map((finding) => finding.id)).toEqual(['control-surface-contrast']);
    expect(findings[0]).toMatchObject({ target: 'button#clipped' });
  });

  // An opaque screen surface is what the accent gate judges against whatever
  // stands behind the screen root: an unparsable colour on an ancestor above
  // the screen (a color-mix Chromium reports as oklab()) must not blind the
  // gate to a control the screen's own opaque surface can still measure.
  it('control-surface-contrast: an opaque screen surface is read before what stands behind it', async () => {
    document.body.innerHTML = `
      <main style="background-color: rgb(255, 255, 255);">
        <button id="root-accent" style="background-color: rgb(160, 160, 160); border: 0;">Save</button>
      </main>
    `;
    document.body.style.backgroundColor = 'oklab(0.5 0.1 0.2)';
    paintBoxes([
      ['main', 0, 400],
      ['#root-accent', 10, 36],
    ]);

    // Removed before the assertions so a failure cannot leave the page
    // surface unparsable for the tests after this one.
    const findings = await sweep();
    document.body.style.removeProperty('background-color');

    expect(findings.map((finding) => finding.id)).toEqual(['control-surface-contrast']);
    expect(findings[0]).toMatchObject({ target: 'button#root-accent' });
  });

  it('adjacent-sections-no-gap: touching sections with different surfaces are reported, separated or same-colour ones are not', async () => {
    document.body.innerHTML = `
      <main>
        <section id="upper" style="background-color: rgb(255, 255, 255);"></section>
        <section id="lower" style="background-color: rgb(240, 240, 240);"></section>
        <section id="apart" style="background-color: rgb(0, 0, 0);"></section>
      </main>
    `;
    paintBoxes([
      ['#upper', 0, 200],
      ['#lower', 200, 200], // touches the upper one
      ['#apart', 410, 200], // 10px below the lower one
    ]);

    const findings = await sweep();

    expect(findings.map((finding) => finding.id)).toEqual(['adjacent-sections-no-gap']);
    expect(findings[0]).toMatchObject({ target: 'section#upper vs section#lower' });
  });

  it('adjacent-sections-no-gap: two sections sharing one background are not a finding', async () => {
    document.body.innerHTML = `
      <main>
        <section id="upper" style="background-color: rgb(255, 255, 255);"></section>
        <section id="lower" style="background-color: rgb(255, 255, 255);"></section>
      </main>
    `;
    paintBoxes([
      ['#upper', 0, 200],
      ['#lower', 200, 200],
    ]);

    expect(await sweep()).toEqual([]);
  });

  it('adjacent-sections-no-gap: a visible border on the shared edge is the divider the remedy names', async () => {
    document.body.innerHTML = `
      <main>
        <section id="upper" style="background-color: rgb(255, 255, 255); border-bottom: 1px solid rgb(17, 17, 17);"></section>
        <section id="lower" style="background-color: rgb(240, 240, 240);"></section>
      </main>
    `;
    paintBoxes([
      ['#upper', 0, 200],
      ['#lower', 200, 200],
    ]);

    expect(await sweep()).toEqual([]);
  });

  // Sections compare only against the siblings their layout parent holds: a
  // section inside one container is never judged against one in another, and
  // a screen renders its surfaces inside its own shadow root, whose top-level
  // children are the screen-root children the rule describes.
  it('adjacent-sections-no-gap: only siblings under one layout parent compare, including top-level children of a screen shadow root', async () => {
    document.body.innerHTML = `
      <main>
        <div id="wrap-a"><section id="in-a" style="background-color: rgb(255, 255, 255);"></section></div>
        <div id="wrap-b"><section id="in-b" style="background-color: rgb(0, 0, 0);"></section></div>
        <div id="screen"></div>
      </main>
    `;
    // Two screens of the same page, each with its own shadow root: the upper
    // band of one touches the lower band of the other in viewport space, but
    // they belong to different hosts, so they never compare. The bands are
    // plain painted divs: top-level children of a screen's shadow root, with
    // no parentElement, reach the rule through the shadow host branch.
    const hostA = document.querySelector('#screen')!;
    const shadowA = hostA.attachShadow({ mode: 'open' });
    shadowA.innerHTML = `
      <div id="s-top" style="background-color: rgb(255, 255, 255);"></div>
      <div id="s-bottom" style="background-color: rgb(0, 0, 0);"></div>
    `;
    paintBoxes([
      ['#in-a', 0, 100],
      ['#in-b', 100, 100], // touches #in-a in viewport space, different parent
      [shadowA.querySelector('#s-top')!, 500, 100],
      [shadowA.querySelector('#s-bottom')!, 600, 100], // touches #s-top inside the same shadow root
    ]);

    const findings = await sweep();

    expect(findings.map((finding) => finding.id)).toEqual(['adjacent-sections-no-gap']);
    expect(findings[0]).toMatchObject({ target: 'div#s-top vs div#s-bottom' });
  });

  it('adjacent-sections-no-gap: sections whose surfaces cannot be parsed are skipped, not read as transparent', async () => {
    document.body.innerHTML = `
      <main>
        <section id="upper" style="background-color: oklab(0.5 0.1 0.2); border-top: 1px solid rgb(17, 17, 17);"></section>
        <section id="lower" style="background-color: rgb(240, 240, 240);"></section>
      </main>
    `;
    paintBoxes([
      ['#upper', 0, 200],
      ['#lower', 200, 200],
    ]);

    // The unparsable painted colour (a color-mix Chromium reports as oklab())
    // makes the pair unmeasurable: no finding either way, not a finding read
    // off a transparent guess.
    expect(await sweep()).toEqual([]);
  });
});
