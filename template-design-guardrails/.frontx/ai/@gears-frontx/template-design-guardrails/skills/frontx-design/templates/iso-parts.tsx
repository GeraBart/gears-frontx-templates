// The parts an isometric scene is built from: the shape components over the geometry in `iso.ts`, the flat `Face`, and the `FloorGrid`. Copy this file next to `iso.ts`, `iso.module.css` and the scene, and import only the parts the scene uses.

import type { ReactNode } from 'react';
import { box, cylinder, polygon, segment, type Point, type View } from './iso';
import styles from './iso.module.css';

/** The outline tone of a part: the one highlighted element or a plain edge. */
export type Tone = 'hi' | 'edge';

/** The line tone of a `Line`. */
export type LineKind = 'hi' | 'edge' | 'lo' | 'dash';

/** How a `Face` is filled: like a top, like a side, or not at all. */
export type Surface = 'face' | 'side' | 'none';

/** A box: two shaded sides and a top, outlined in the tone. */
export function Box({ view, at, size, z0 = 0, tone = 'edge' }: { view: View; at: [number, number]; size: [number, number, number]; z0?: number; tone?: Tone }) {
  const faces = box(view, at[0], at[1], size[0], size[1], size[2], z0);
  return (
    <g className={tone === 'hi' ? styles.hi : styles.edge}>
      <path className={styles.side} d={faces.right} />
      <path className={styles.side} d={faces.left} />
      <path className={styles.face} d={faces.top} />
    </g>
  );
}

/** A standing cylinder: shaded side and top, outlined in the tone. */
export function Cylinder({ view, at, r, h, z0 = 0, tone = 'edge' }: { view: View; at: [number, number]; r: number; h: number; z0?: number; tone?: Tone }) {
  const shape = cylinder(view, at[0], at[1], r, h, z0);
  return (
    <g className={tone === 'hi' ? styles.hi : styles.edge}>
      <path className={styles.side} d={shape.side} />
      <path className={styles.face} d={shape.top} />
    </g>
  );
}

/** A straight line between two grid points. */
export function Line({ view, from, to, kind = 'edge' }: { view: View; from: Point; to: Point; kind?: LineKind }) {
  const className = kind === 'dash' ? `${styles.edge} ${styles.dash}` : styles[kind];
  return <path className={className} d={segment(view, from, to)} />;
}

/** A flat face: one outlined polygon through the points, filled like a top (a panel, a recess) or like a side (a ramp, a wall), or left hollow. */
export function Face({ view, points, tone = 'edge', surface = 'none' }: { view: View; points: readonly Point[]; tone?: Tone; surface?: Surface }) {
  const className = surface === 'none' ? styles[tone] : `${styles[tone]} ${surface === 'face' ? styles.face : styles.side}`;
  return <path className={className} d={polygon(view, points)} />;
}

/** The floor grid over the rectangle from `from` to `to`, in the lowest tone. About six intervals across the longer side unless `step` sets the gap in grid units. Not counted as a shape. */
export function FloorGrid({ view, from, to, step }: { view: View; from: [number, number]; to: [number, number]; step?: number }) {
  const [x0, y0] = from;
  const [x1, y1] = to;
  const gap = step ?? Math.max(1, Math.max(x1 - x0, y1 - y0) / 6);
  const lines: ReactNode[] = [];
  const cross = (key: string, along: Point, toPoint: Point) => lines.push(<Line key={key} view={view} from={along} to={toPoint} kind="lo" />);
  const stepsX = Math.floor((x1 - x0) / gap + 1e-9);
  const stepsY = Math.floor((y1 - y0) / gap + 1e-9);
  for (let i = 0; i <= stepsX; i += 1) {
    const x = x0 + i * gap;
    cross(`x${i}`, [x, y0, 0], [x, y1, 0]);
  }
  for (let i = 0; i <= stepsY; i += 1) {
    const y = y0 + i * gap;
    cross(`y${i}`, [x0, y, 0], [x1, y, 0]);
  }
  return <>{lines}</>;
}
