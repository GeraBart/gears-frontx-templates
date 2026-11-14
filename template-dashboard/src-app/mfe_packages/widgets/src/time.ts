import { dayOf } from './heatmap/Heatmap';

/** An ISO 8601 date-time: a calendar date, a T, a time of day, an optional second with its fraction and an optional zone. */
export const ISO_DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})?$/;

/**
 * The one time reader of the widgets: a time string as epoch milliseconds. An ISO 8601 date-time reads as it is,
 * once its date part is a day of the calendar (Date.parse rolls 2026-02-30T10:00:00Z over into March, so the date part
 * goes through the heatmap calendar's rule first), and a bare `YYYY-MM-DD` date reads as its UTC midnight by that
 * rule. Null for anything else, including a day the calendar does not have, alone or before a time of day.
 */
export function timeOf(time: string): number | null {
  if (ISO_DATE_TIME.test(time)) {
    if (dayOf(time.slice(0, 10)) === null) return null;
    const parsed = Date.parse(time);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return dayOf(time);
}
