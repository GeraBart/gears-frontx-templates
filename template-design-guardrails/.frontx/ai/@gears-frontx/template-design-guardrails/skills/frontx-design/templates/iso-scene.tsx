import type { ReactNode } from 'react';
import { box, cylinder, segment, type Point, type View } from './iso';
import styles from './iso.module.css';

type Tone = 'hi' | 'edge';
type LineKind = 'hi' | 'edge' | 'lo' | 'dash';

/** A box: two shaded sides and a top, outlined in the tone. */
function Box({ view, at, size, z0 = 0, tone = 'edge' }: { view: View; at: [number, number]; size: [number, number, number]; z0?: number; tone?: Tone }) {
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
function Cylinder({ view, at, r, h, z0 = 0, tone = 'edge' }: { view: View; at: [number, number]; r: number; h: number; z0?: number; tone?: Tone }) {
  const shape = cylinder(view, at[0], at[1], r, h, z0);
  return (
    <g className={tone === 'hi' ? styles.hi : styles.edge}>
      <path className={styles.side} d={shape.side} />
      <path className={styles.face} d={shape.top} />
    </g>
  );
}

/** A straight line between two grid points. */
function Line({ view, from, to, kind = 'edge' }: { view: View; from: Point; to: Point; kind?: LineKind }) {
  const className = kind === 'dash' ? `${styles.edge} ${styles.dash}` : styles[kind];
  return <path className={className} d={segment(view, from, to)} />;
}

/** The floor grid, in the lowest tone. Not counted as a shape. */
function FloorGrid({ view }: { view: View }) {
  const grid: ReactNode[] = [];
  for (let step = -6; step <= 6; step += 2) {
    grid.push(<Line key={`x${step}`} view={view} from={[step, -6, 0]} to={[step, 6, 0]} kind="lo" />);
    grid.push(<Line key={`y${step}`} view={view} from={[-6, step, 0]} to={[6, step, 0]} kind="lo" />);
  }
  return <>{grid}</>;
}

/** One isometric line illustration. With a label it is an image with that name; without one it is decoration. */
export function IsoScene({ label }: { label?: string }) {
  const view: View = { ox: 200, oy: 162, unit: 17 };
  const named = label !== undefined && label.trim() !== '';
  return (
    <svg
      className={styles.figure}
      viewBox="0 0 400 320"
      role={named ? 'img' : undefined}
      aria-label={named ? label : undefined}
      aria-hidden={named ? undefined : true}
      focusable="false"
    >
      <FloorGrid view={view} />
      {/* Placeholder: replace with the scene's shapes; at most 12 shapes; exactly one tone hi. Draw back to front. */}
      <Line view={view} from={[0, 0, 0.35]} to={[3.6, 0.9, 0.2]} kind="dash" />
      <Box view={view} at={[-1.7, -1.7]} size={[3.4, 3.4, 0.75]} tone="hi" />
      <Cylinder view={view} at={[4.3, 0.9]} r={0.7} h={1.4} />
      {/* End of placeholder. */}
    </svg>
  );
}
