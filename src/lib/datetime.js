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

export const formatDate = (value) => {
  const d = toDate(value);
  return d ? absoluteFormatter.format(d) : '—';
};

export const formatDateTime = (value) => {
  const d = toDate(value);
  return d ? absoluteWithTimeFormatter.format(d) : '—';
};

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

export const formatExactTitle = (value) => {
  const d = toDate(value);
  return d ? d.toLocaleString() : '';
};
