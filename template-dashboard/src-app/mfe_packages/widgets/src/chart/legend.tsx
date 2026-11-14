import { ChartLegend, ChartLegendContent } from '@gears-frontx/ui-kit';

import type { LegendPosition } from '../types';
import styles from '../widgets.module.css';

// The series palette of every chart that draws with it, in one place (`palette.ts`): this module carries the
// ui-kit chart legend, which a widget drawn without a chart library imports nothing of.
export { PALETTE } from './palette';

// Room between the plot and a legend beside it, so an x tick centred on the plot's edge stays clear of the legend.
const LEGEND_GAP = 16;

export function legendOf(position: LegendPosition | undefined, nameKey?: string) {
  const at = position ?? 'bottom';
  if (at === 'none') return null;
  const side = at === 'left' || at === 'right';
  return (
    <ChartLegend
      layout={side ? 'vertical' : 'horizontal'}
      align={side ? at : 'center'}
      verticalAlign={side ? 'middle' : at}
      // A legend never takes more than half the chart, so the plot or the pie keeps room in a short cell; the rest scrolls.
      wrapperStyle={side ? { maxInlineSize: '50%', maxBlockSize: '100%', overflowY: 'auto', [at === 'right' ? 'paddingInlineStart' : 'paddingInlineEnd']: LEGEND_GAP } : { maxBlockSize: '50%', overflowY: 'auto' }}
      content={<ChartLegendContent nameKey={nameKey} className={side ? `${styles.legend} ${styles.legendSide}` : styles.legend} />}
    />
  );
}
