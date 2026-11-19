// One isometric line illustration: copy this file beside `iso.ts`, `iso-parts.tsx` and `iso.module.css`, rename it after the drawing, and replace the placeholder below.

import { Box, Face, FloorGrid } from './iso-parts';
import { fitView } from './iso';
import styles from './iso.module.css';

/** One isometric line illustration. With a label it is an image with that name; without one it is decoration. */
export function IsoScene({ label }: { label?: string }) {
  // The bounds of everything drawn, floor grid included: the lowest x, y, z and the highest x, y, z.
  const view = fitView([-4.8, -1.7, 0], [4.4, 1.7, 0.75]);
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
      <FloorGrid view={view} from={[-4.8, -1.7]} to={[4.4, 1.7]} />
      {/* Placeholder: replace with the scene's shapes; at most 12 shapes; exactly one highlighted; import only the parts you use; set the bounds to what you draw. */}
      <Face view={view} points={[[-4.8, -1.7, 0], [-2.6, -1.7, 0], [-2.6, 0.5, 0], [-4.8, 0.5, 0]]} surface="side" />
      <Box view={view} at={[-1.7, -1.7]} size={[3.4, 3.4, 0.75]} tone="hi" />
      <Box view={view} at={[2.8, -1.2]} size={[1.6, 1.6, 0.5]} />
      {/* End of placeholder. */}
    </svg>
  );
}
