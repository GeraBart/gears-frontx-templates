/**
 * Checks `templates/iso.ts`'s `fitView` on three sample bounds: each view must
 * put the projected box of the scene's corners inside the 400 x 320 drawing,
 * centred, and spanning at least nine tenths of the drawing's width or of its
 * height. Spans and centres come from the module's own `project`.
 */
import { describe, expect, it } from 'vitest';

import { fitView, project } from '../.frontx/ai/@gears-frontx/template-design-guardrails/skills/frontx-design/templates/iso.ts';

const WIDTH = 400;
const HEIGHT = 320;

/** The 8 corners of the box from `min` to `max`. */
const corners = (min, max) => {
  const list = [];
  for (const x of [min[0], max[0]]) {
    for (const y of [min[1], max[1]]) {
      for (const z of [min[2], max[2]]) list.push([x, y, z]);
    }
  }
  return list;
};

describe('fitView', () => {
  // A wide flat floor with low shapes, a square block, and a tall stack.
  it.each([
    ['wide flat', [-4.8, -1.7, 0], [4.4, 1.7, 0.75]],
    ['square', [-5, -5, 0], [5, 5, 1]],
    ['tall', [-2, -2, 0], [2, 2, 6]],
  ])('fits the %s bounds', (_name, min, max) => {
    const view = fitView(min, max);
    const points = corners(min, max).map((point) => project(view, point));
    const xs = points.map(([x]) => x);
    const ys = points.map(([, y]) => y);
    const spanX = Math.max(...xs) - Math.min(...xs);
    const spanY = Math.max(...ys) - Math.min(...ys);
    // project() rounds to a tenth, so leave a fifth of a unit of slack.
    const slack = 0.2;
    expect(xs.every((x) => x >= 0 && x <= WIDTH)).toBe(true);
    expect(ys.every((y) => y >= 0 && y <= HEIGHT)).toBe(true);
    expect(Math.abs((Math.min(...xs) + Math.max(...xs)) / 2 - WIDTH / 2)).toBeLessThanOrEqual(slack);
    expect(Math.abs((Math.min(...ys) + Math.max(...ys)) / 2 - HEIGHT / 2)).toBeLessThanOrEqual(slack);
    expect(Math.max(spanX / (0.9 * WIDTH), spanY / (0.9 * HEIGHT))).toBeGreaterThanOrEqual(1 - slack);
  });
});
