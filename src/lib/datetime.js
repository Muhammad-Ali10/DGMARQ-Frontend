/**
 * Date formatting for list and detail surfaces.
 *
 * Rule (applies everywhere in the dashboards): relative under 7 days, absolute
 * after. "2h ago" is what a seller actually wants when triaging today's orders;
 * "12/03/2025" is what they want when reconciling last quarter. Before this,
 * every surface called `toLocaleDateString()` and showed neither.
 */

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const RELATIVE_CUTOFF = 7 * DAY;

const absoluteFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
});

const absoluteWithTimeFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

const toDate = (value) => {
  if (value == null) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

/** Absolute, no time. e.g. "Mar 12, 2026" */
export const formatDate = (value) => {
  const d = toDate(value);
  return d ? absoluteFormatter.format(d) : '—';
};

/** Absolute, with time. e.g. "Mar 12, 2026, 4:05 PM" */
export const formatDateTime = (value) => {
  const d = toDate(value);
  return d ? absoluteWithTimeFormatter.format(d) : '—';
};

/**
 * Relative under 7 days ("just now", "5m ago", "2h ago", "3d ago"), absolute
 * after. Future dates read forward ("in 3d") so this is also usable for SLA
 * and release countdowns.
 *
 * @param {Date|string|number|null|undefined} value
 * @param {Date} [now] - injectable for tests
 */
export const formatRelativeDate = (value, now = new Date()) => {
  const d = toDate(value);
  if (!d) return '—';

  const diff = now.getTime() - d.getTime();
  const abs = Math.abs(diff);
  if (abs >= RELATIVE_CUTOFF) return absoluteFormatter.format(d);

  const past = diff >= 0;
  const suffix = (s) => (past ? `${s} ago` : `in ${s}`);

  if (abs < MINUTE) return past ? 'just now' : 'in a moment';
  if (abs < HOUR) return suffix(`${Math.floor(abs / MINUTE)}m`);
  if (abs < DAY) return suffix(`${Math.floor(abs / HOUR)}h`);
  return suffix(`${Math.floor(abs / DAY)}d`);
};

/**
 * The full value for a `title`/tooltip next to a relative label, so the exact
 * timestamp is always one hover away and never lost.
 */
export const formatExactTitle = (value) => {
  const d = toDate(value);
  return d ? d.toLocaleString() : '';
};
