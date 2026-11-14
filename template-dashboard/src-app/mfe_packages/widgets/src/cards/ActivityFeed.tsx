import { useEffect, useRef, useState } from 'react';
import { Button, Text, VisuallyHidden } from '@gears-frontx/ui-kit';
import { intlLocaleOf, type RenderWidgetPayload } from '@gears-frontx/frontx-dashboard-root/contract';
import { CircleAlertIcon, CircleCheckIcon, CircleXIcon, InfoIcon, type LucideIcon } from 'lucide-react';

import { nonFiniteProblemOf } from '../format';
import { SafeLink } from '../links';
import { DEFAULT_WIDGET_TEXTS, WidgetCannotBeShown, WidgetEmpty, type WidgetTexts } from '../states';
import type { ActivityFeedData, ActivityFeedRender, Tone } from '../types';
import { dayOf } from '../heatmap/Heatmap';
import { useDataVersion } from '../grid/useDataVersion';
import styles from '../widgets.module.css';

/*
 * The `activity_feed` widget: one list item per data item, in the delivered order, each with its time, its title
 * (a link when the item carries a target the shared link rule takes) and its optional text. The list scrolls inside
 * its cell; a Show more button reveals the next page of items. No chart library and no data view: the list is the
 * accessible content.
 */

const DAY_MS = 86_400_000;
// An ISO 8601 date-time: a calendar date, a T, a time of day, an optional second with its fraction and an optional zone.
const ISO_DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})?$/;

/**
 * A time as epoch milliseconds: an ISO 8601 date-time as it reads, and a bare `YYYY-MM-DD` date as its UTC midnight
 * by the heatmap calendar's rule (the one date rule of the widgets). Null for anything else, including a date the
 * calendar does not have.
 */
const timeOf = (time: string): number | null => {
  if (ISO_DATE_TIME.test(time)) {
    const parsed = Date.parse(time);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return dayOf(time);
};

/** The relative units, longest first, with the length of each in milliseconds: a mean year and a mean month. */
const UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ['year', 365.25 * DAY_MS],
  ['month', 30.44 * DAY_MS],
  ['week', 7 * DAY_MS],
  ['day', DAY_MS],
  ['hour', 3_600_000],
  ['minute', 60_000],
  ['second', 1_000],
];
const DAY_UNIT = UNITS.findIndex(([unit]) => unit === 'day');

/** A distance rounded half away from zero, so a past and a future time of one length read alike. */
const roundOf = (value: number) => Math.sign(value) * Math.round(Math.abs(value));

/**
 * A distance in milliseconds as a count of one unit: the longest unit the distance fills, no shorter than the unit at
 * `shortest`, rounded; a rounded count that reaches the next longer unit moves up to it, so 60 minutes read as an
 * hour, 7 days as a week and 12 months as a year.
 */
const countOf = (diff: number, shortest: number): [number, Intl.RelativeTimeFormatUnit] => {
  const found = UNITS.findIndex(([, ms], index) => index <= shortest && Math.abs(diff) >= ms);
  const at = found === -1 ? shortest : found;
  const count = roundOf(diff / UNITS[at][1]);
  if (at > 0 && Math.abs(count) * UNITS[at][1] >= UNITS[at - 1][1]) return [roundOf(diff / UNITS[at - 1][1]), UNITS[at - 1][0]];
  return [count, UNITS[at][0]];
};

/**
 * A time as the host locale writes it against the host clock ("3 days ago", "now", "in 2 hours", "yesterday"), by
 * Intl's relative wording. A date-time counts its distance from the clock in the longest unit it fills; the moment
 * itself is "now". A bare date has no time of day: it counts whole calendar days from today's date in the host zone,
 * so the day itself is "today", the one before "yesterday", and longer distances move up to weeks, months and years.
 * The locale property is a free string, so a tag no Intl constructor takes falls back to English, like every
 * formatter of the widgets.
 */
const relativeOf = (time: number, dateTime: boolean, now: number, locale: string): string => {
  const format = new Intl.RelativeTimeFormat(intlLocaleOf(locale), { numeric: 'auto' });
  if (dateTime) return format.format(...countOf(time - now, UNITS.length - 1));
  const clock = new Date(now);
  const today = Date.UTC(clock.getFullYear(), clock.getMonth(), clock.getDate());
  return format.format(...countOf(time - today, DAY_UNIT));
};

/** A time as the host locale writes it: a bare date alone, a date-time with its time of day in the host zone. */
const absoluteOf = (time: number, dateTime: boolean, locale: string): string =>
  new Intl.DateTimeFormat(intlLocaleOf(locale), dateTime ? { dateStyle: 'medium', timeStyle: 'short' } : { dateStyle: 'medium', timeZone: 'UTC' }).format(time);

/** The icon of each tone an item may carry; a neutral item draws no mark, as a grid row of no colour does. */
const FEED_MARKS: Partial<Record<Tone, LucideIcon>> = { success: CircleCheckIcon, warning: CircleAlertIcon, danger: CircleXIcon, info: InfoIcon };

// @cpt-algo:cpt-frontx-dashboard-algo-widget-catalog-card-checks:p2
/**
 * The feed's own check of its data: the first item whose time is neither an ISO 8601 date-time nor a `YYYY-MM-DD`
 * date of the calendar, named by its position and never by its content, or null. The schema takes any string as a
 * time, so this is the widget's cross-check of it.
 */
export function checkActivityFeed(data: ActivityFeedData): string | null {
  // @cpt-begin:cpt-frontx-dashboard-algo-widget-catalog-card-checks:p2:inst-wc-card-feed-time
  for (const [index, item] of data.items.entries()) {
    if (timeOf(item.time) === null) return `activity_feed: data.items[${index}] needs an ISO 8601 date-time or a YYYY-MM-DD date as its time`;
  }
  // @cpt-end:cpt-frontx-dashboard-algo-widget-catalog-card-checks:p2:inst-wc-card-feed-time
  return null;
}

/** The `activity_feed` widget: the delivered items as a list, the newest writing its time by the render. */
export function ActivityFeed({
  payload,
  locale = 'en',
  texts = DEFAULT_WIDGET_TEXTS,
  label,
}: {
  payload: RenderWidgetPayload<ActivityFeedRender, ActivityFeedData>;
  locale?: string;
  texts?: WidgetTexts;
  label?: string;
  container?: HTMLElement | ShadowRoot | null;
}) {
  const { render, data } = payload;
  // The hooks run on every render, before any early return: a new payload starts over at the first page, and the
  // version keeps the paging state from one the new data outlives.
  const version = useDataVersion(JSON.stringify(data?.items ?? null));
  const pageSize = render.page_size ?? 10;
  const [paging, setPaging] = useState({ shown: pageSize, version });
  const list = useRef<HTMLUListElement>(null);
  // The index of the first item a Show more revealed, which takes the focus once it stands, so the keyboard stays in
  // the list (the button is gone after the last page) and the revealed items are announced from their first one.
  const revealed = useRef<number | null>(null);
  useEffect(() => {
    if (revealed.current === null) return;
    const row = list.current?.children[revealed.current];
    revealed.current = null;
    if (row instanceof HTMLElement) (row.querySelector<HTMLElement>('a[href]') ?? row).focus();
  });

  if (!data) return <WidgetCannotBeShown texts={texts} problem="activity_feed: no data" />;
  const nonFinite = nonFiniteProblemOf('activity_feed', payload);
  if (nonFinite) return <WidgetCannotBeShown texts={texts} problem={nonFinite} />;
  const problem = checkActivityFeed(data);
  if (problem) return <WidgetCannotBeShown texts={texts} problem={problem} />;
  if (data.items.length === 0) return <WidgetEmpty texts={texts} />;

  const shown = paging.version === version ? paging.shown : pageSize;
  const visible = data.items.slice(0, shown);
  const now = Date.now();
  const relative = render.time_style !== 'absolute';
  const withTone = render.show_tone !== false;
  const showMore = () => {
    revealed.current = shown;
    setPaging({ shown: shown + pageSize, version });
  };

  return (
    <div className={styles.feed}>
      <ul ref={list} className={styles.feedList} aria-label={label ?? texts.feed.name}>
        {visible.map((item, index) => {
          const time = timeOf(item.time) as number;
          const dateTime = ISO_DATE_TIME.test(item.time);
          const Mark = withTone && item.tone ? FEED_MARKS[item.tone] : undefined;
          return (
            <li key={index} className={styles.feedRow} tabIndex={-1}>
              <div className={styles.feedTop}>
                {/* The tone as an icon named in the text beside the title, never colour alone; no tone, no mark. */}
                {Mark && item.tone ? (
                  <>
                    <Mark className={styles[`feedMark-${item.tone}`]} aria-hidden />
                    <VisuallyHidden>{texts.feed.tone[item.tone]}: </VisuallyHidden>
                  </>
                ) : null}
                <span className={styles.feedTitle}>
                  <Text typography="label" render={<span />} className={styles.feedName}>
                    {typeof item.href === 'string' ? <SafeLink text={item.title} href={item.href} texts={texts} /> : item.title}
                  </Text>
                </span>
                {/* The delivered string stays the machine-readable datetime; the shown text is by the render. */}
                <time className={styles.feedTime} dateTime={item.time}>
                  <Text typography="meta" tone="muted" render={<span />}>
                    {relative ? relativeOf(time, dateTime, now, locale) : absoluteOf(time, dateTime, locale)}
                  </Text>
                </time>
              </div>
              {item.text ? (
                <Text typography="body" render={<p />} className={styles.feedText}>
                  {item.text}
                </Text>
              ) : null}
            </li>
          );
        })}
      </ul>
      {shown < data.items.length ? (
        <div className={styles.feedMore}>
          <Button variant="ghost" size="sm" onClick={showMore}>
            {texts.feed.showMore}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
