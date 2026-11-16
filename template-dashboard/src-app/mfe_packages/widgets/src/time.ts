const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * A `YYYY-MM-DD` date as its UTC midnight in milliseconds, or null when it is not such a date of the calendar. The one date
 * rule of the widgets: the heatmap calendar, and the bare dates of cartesian points and reference lines on a time axis.
 */
export function dayOf(x: unknown): number | null {
  if (typeof x !== 'string') return null;
  const match = ISO_DATE.exec(x);
  if (!match) return null;
  const time = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  // Date.UTC rolls 2026-02-30 over into March: a date that does not read back as itself is no date.
  return new Date(time).toISOString().slice(0, 10) === x ? time : null;
}

/**
 * An ISO 8601 date-time: a calendar date, a T, a time of day (hour 00 to 23, minute 00 to 59), an optional second
 * (00 to 59) with its fraction and an optional zone. Hour 24 is no time of day here: Date.parse reads T24:00 as the
 * next midnight, which would move the item to another day.
 */
export const ISO_DATE_TIME = /^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):[0-5]\d(:[0-5]\d(\.\d+)?)?(Z|[+-]\d{2}:\d{2})?$/;

/**
 * The one time reader of the widgets: a time string as epoch milliseconds. An ISO 8601 date-time reads as it is,
 * once its date part is a day of the calendar (Date.parse rolls 2026-02-30T10:00:00Z over into March, so the date part
 * goes through the calendar rule of dayOf first), and a bare `YYYY-MM-DD` date reads as its UTC midnight by that
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
