import { act, render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MetricCard } from '../cards/MetricCard';
import type { CartesianData, PieData, RadarData, TreemapData, WaterfallData } from '../types';
import { CartesianChart } from './CartesianChart';
import { PieChart } from './PieChart';
import { RadarChart } from './RadarChart';
import { TreemapChart } from './TreemapChart';
import { WaterfallChart } from './WaterfallChart';

// Every observed element reports the current size, at once and again on each `resizeAll`, as a browser reports a
// widget's elements when a dashboard takes the widget out of the page while its cell reloads (0 by 0) and puts it back.
let size = { width: 640, height: 320 };
const observers = new Set<{ callback: ResizeObserverCallback; targets: Set<Element> }>();
const original = globalThis.ResizeObserver;
const report = (callback: ResizeObserverCallback, target: Element) =>
  callback([{ target, contentRect: { ...size, top: 0, left: 0, right: size.width, bottom: size.height, x: 0, y: 0 } } as unknown as ResizeObserverEntry], {} as ResizeObserver);
const resizeAll = (next: { width: number; height: number }) =>
  act(() => {
    size = next;
    for (const { callback, targets } of observers) for (const target of targets) report(callback, target);
  });

beforeEach(() => {
  globalThis.ResizeObserver = class {
    private readonly entry: { callback: ResizeObserverCallback; targets: Set<Element> };
    constructor(callback: ResizeObserverCallback) {
      this.entry = { callback, targets: new Set() };
      observers.add(this.entry);
    }
    observe(target: Element) {
      this.entry.targets.add(target);
      report(this.entry.callback, target);
    }
    unobserve(target: Element) {
      this.entry.targets.delete(target);
    }
    disconnect() {
      observers.delete(this.entry);
    }
  } as unknown as typeof ResizeObserver;
});

afterEach(() => {
  globalThis.ResizeObserver = original;
  observers.clear();
  size = { width: 640, height: 320 };
  vi.restoreAllMocks();
});

const DAYS: CartesianData = { series: [{ name: 'Commits', points: Array.from({ length: 5 }, (_, day) => ({ x: `2026-10-0${day + 1}`, y: day })) }] };
const SLICES: PieData = { slices: [{ label: 'Passed', value: 8 }, { label: 'Failed', value: 2 }] };
const SKILLS: RadarData = { points: ['Speed', 'Range', 'Cost'].map((axis, index) => ({ axis, series: null, value: index + 1 })) };
const STAGES: WaterfallData = { steps: [{ label: 'Coding', value: 4.1 }, { label: 'Review', value: 17 }, { label: 'Lead time', value: 21.1, kind: 'total' }] };

describe('a chart whose widget is taken out of the page', () => {
  it.each<[string, ReactElement]>([
    ['a cartesian chart', <CartesianChart payload={{ render: { series: [{ name: 'Commits', type: 'bar' }] }, data: DAYS }} />],
    ['a cartesian chart with drill-down', <CartesianChart payload={{ render: { drill_down: true, series: [{ name: 'Commits', type: 'line' }] }, data: DAYS }} />],
    ['a pie chart', <PieChart payload={{ render: {}, data: SLICES }} />],
    ['a radar chart', <RadarChart payload={{ render: {}, data: SKILLS }} />],
    ['a waterfall chart', <WaterfallChart payload={{ render: {}, data: STAGES }} />],
    ['a metric sparkline', <MetricCard payload={{ render: {}, data: { value: 3, sparkline: [1, 2, 3] } }} />],
  ])('%s is not drawn at 0 by 0, so the chart library does not warn, and is drawn again once it has a size', (_case, widget) => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { container } = render(widget);
    const charts = () => container.querySelectorAll('.recharts-responsive-container').length;
    const warnings = () => warn.mock.calls.filter(([message]) => String(message).includes('should be greater than 0'));
    expect(charts()).toBe(1);
    resizeAll({ width: 640, height: 0 });
    // A box whose height comes from its chart measures W by 0: the chart stays drawn, or it would never come back.
    expect(charts()).toBe(1);
    resizeAll({ width: 0, height: 0 });
    expect(warnings()).toEqual([]);
    expect(charts()).toBe(0);
    resizeAll({ width: 480, height: 200 });
    expect(charts()).toBe(1);
    expect(warnings()).toEqual([]);
    // Drawn again at the size it has now, measured afresh, not at the size it had before it was taken out.
    const sizeOfSurface = () => {
      const surface = container.querySelector('svg.recharts-surface');
      return [surface?.getAttribute('width'), surface?.getAttribute('height')];
    };
    expect(sizeOfSurface()).toEqual(['480', '200']);
    resizeAll({ width: 560, height: 240 });
    expect(sizeOfSurface()).toEqual(['560', '240']);
  });

  // The treemap draws with no chart library, so it has no responsive container to warn: its rule is the same, kept
  // by the tiles it draws only into a laid-out box.
  it('a treemap chart is not drawn at 0 by 0, and its tiles are drawn again once it has a size', () => {
    const items: TreemapData['items'] = [
      { label: 'a', value: 1, group: null },
      { label: 'b', value: 1, group: null },
    ];
    const { container } = render(<TreemapChart payload={{ render: {}, data: { items } }} />);
    const tiles = () => container.querySelectorAll('[class*="treemapTile"]').length;
    expect(tiles()).toBe(2);
    resizeAll({ width: 640, height: 0 });
    // A box whose height comes from its chart measures W by 0: a tile has no room there, so none is drawn, and
    // the next size draws them again.
    expect(tiles()).toBe(0);
    resizeAll({ width: 0, height: 0 });
    expect(tiles()).toBe(0);
    resizeAll({ width: 480, height: 200 });
    expect(tiles()).toBe(2);
    // Drawn again at the size it has now, measured afresh: two equal tiles share the box side by side.
    const [first, second] = [...container.querySelectorAll<HTMLElement>('[class*="treemapTile"]')];
    expect(Number.parseFloat(first!.style.width)).toBeCloseTo(240, 6);
    expect(Number.parseFloat(first!.style.height)).toBeCloseTo(200, 6);
    expect(Number.parseFloat(second!.style.left)).toBeCloseTo(240, 6);
    resizeAll({ width: 560, height: 240 });
    expect(Number.parseFloat(container.querySelector<HTMLElement>('[class*="treemapTile"]')!.style.width)).toBeCloseTo(280, 6);
  });
});
