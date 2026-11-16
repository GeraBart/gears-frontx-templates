import type { CSSProperties } from 'react';

// The kit chart container stretched over its cell, with no aspect ratio of its own: the cartesian, pie, radar and
// waterfall charts fill the box the cell gives them.
export const FILL = { '--chart-aspect-ratio': 'auto', blockSize: '100%', inlineSize: '100%' } as CSSProperties;

// Tick text in the chart's chrome colour: Recharts paints it #666, which fails contrast on a dark card.
export const TICK = { fill: 'var(--muted-foreground)' };

// About the width of one tick character at the kit chart's tick size, and the height of a tick line with a gap: the
// estimates the cartesian and the radar charts judge their tick labels with.
export const TICK_CHAR_WIDTH = 6.5;
export const TICK_TEXT_HEIGHT = 15;
