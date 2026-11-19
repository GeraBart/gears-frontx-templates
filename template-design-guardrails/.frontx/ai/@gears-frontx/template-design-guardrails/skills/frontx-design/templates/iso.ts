// Isometric geometry for line illustrations: projection of a grid point (x to the right and down, y to the left and down, z up) onto the 400 x 320 drawing, and the path data of the shapes a scene is made of. Every scene uses these few shapes, so all scenes share one projection, one scale and one stroke.

/** A grid point: x, y on the floor, z up. */
export type Point = readonly [number, number, number];

/** Where the grid's origin lands on the drawing and how long one grid unit is. */
export interface View {
  ox: number;
  oy: number;
  unit: number;
}

const COS = Math.cos(Math.PI / 6);
const SIN = 0.5;

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

/** The drawing coordinates of a grid point. */
export function project(view: View, [x, y, z]: Point): [number, number] {
  return [round(view.ox + (x - y) * COS * view.unit), round(view.oy + (x + y) * SIN * view.unit - z * view.unit)];
}

function moveTo(view: View, points: readonly Point[]): string {
  return points.map((point, index) => `${index === 0 ? 'M' : 'L'}${project(view, point).join(' ')}`).join('');
}

/** A closed outline through the points. */
export function polygon(view: View, points: readonly Point[]): string {
  return `${moveTo(view, points)}Z`;
}

/** An open line through the points. */
export function polyline(view: View, points: readonly Point[]): string {
  return moveTo(view, points);
}

/** The floor rectangle from (x, y) to (x + w, y + d) at height z, seen as a rhombus. */
export function plane(view: View, x: number, y: number, w: number, d: number, z: number): string {
  return polygon(view, [
    [x, y, z],
    [x + w, y, z],
    [x + w, y + d, z],
    [x, y + d, z],
  ]);
}

/** The three visible faces of a box standing on height z0: its top, its right face (along y at x + w) and its left face (along x at y + d). */
export function box(view: View, x: number, y: number, w: number, d: number, h: number, z0 = 0): { top: string; right: string; left: string } {
  const z1 = z0 + h;
  return {
    top: plane(view, x, y, w, d, z1),
    right: polygon(view, [
      [x + w, y, z0],
      [x + w, y + d, z0],
      [x + w, y + d, z1],
      [x + w, y, z1],
    ]),
    left: polygon(view, [
      [x, y + d, z0],
      [x + w, y + d, z0],
      [x + w, y + d, z1],
      [x, y + d, z1],
    ]),
  };
}

function circlePoints(cx: number, cy: number, r: number, z: number, from: number, to: number, steps: number): Point[] {
  const points: Point[] = [];
  for (let index = 0; index <= steps; index += 1) {
    const angle = from + ((to - from) * index) / steps;
    points.push([cx + r * Math.cos(angle), cy + r * Math.sin(angle), z]);
  }
  return points;
}

/** A circle lying on the floor at height z, seen as an ellipse. */
export function ring(view: View, cx: number, cy: number, r: number, z: number): string {
  return polygon(view, circlePoints(cx, cy, r, z, 0, Math.PI * 2, 48).slice(0, -1));
}

/** A standing cylinder: its side (the half facing the viewer, between the two outermost verticals) and its top. */
export function cylinder(view: View, cx: number, cy: number, r: number, h: number, z0 = 0): { side: string; top: string } {
  // The outline's extremes on the drawing sit at -45 and 135 degrees; the half through 45 degrees faces the viewer.
  const from = -Math.PI / 4;
  const to = (Math.PI * 3) / 4;
  const bottom = circlePoints(cx, cy, r, z0, from, to, 24);
  const top = circlePoints(cx, cy, r, z0 + h, to, from, 24);
  return { side: polygon(view, [...bottom, ...top]), top: ring(view, cx, cy, r, z0 + h) };
}

/** A straight segment between two grid points. */
export function segment(view: View, from: Point, to: Point): string {
  return polyline(view, [from, to]);
}
