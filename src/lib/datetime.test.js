import { describe, it, expect } from 'vitest';
import { formatDate, formatDateTime, formatRelativeDate, formatExactTitle } from './datetime';

const NOW = new Date('2026-07-28T12:00:00Z');
const ago = (ms) => new Date(NOW.getTime() - ms);
const ahead = (ms) => new Date(NOW.getTime() + ms);

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

describe('formatRelativeDate', () => {
  it('collapses anything under a minute to "just now"', () => {
    expect(formatRelativeDate(ago(0), NOW)).toBe('just now');
    expect(formatRelativeDate(ago(59_000), NOW)).toBe('just now');
  });

  it('counts minutes, hours and days', () => {
    expect(formatRelativeDate(ago(5 * MINUTE), NOW)).toBe('5m ago');
    expect(formatRelativeDate(ago(2 * HOUR), NOW)).toBe('2h ago');
    expect(formatRelativeDate(ago(3 * DAY), NOW)).toBe('3d ago');
  });

  it('switches to an absolute date at the 7-day cutoff', () => {
    expect(formatRelativeDate(ago(7 * DAY - HOUR), NOW)).toBe('6d ago');
    expect(formatRelativeDate(ago(7 * DAY), NOW)).toBe('Jul 21, 2026');
    expect(formatRelativeDate(ago(400 * DAY), NOW)).toMatch(/2025/);
  });

  it('reads forward for future dates, so it also works for countdowns', () => {
    expect(formatRelativeDate(ahead(3 * DAY), NOW)).toBe('in 3d');
    expect(formatRelativeDate(ahead(2 * HOUR), NOW)).toBe('in 2h');
    expect(formatRelativeDate(ahead(30_000), NOW)).toBe('in a moment');
  });

  it('accepts the ISO strings the API actually returns', () => {
    expect(formatRelativeDate('2026-07-28T10:00:00Z', NOW)).toBe('2h ago');
  });

  it('renders an em dash for missing or unparseable values', () => {
    expect(formatRelativeDate(null, NOW)).toBe('—');
    expect(formatRelativeDate(undefined, NOW)).toBe('—');
    expect(formatRelativeDate('not-a-date', NOW)).toBe('—');
  });
});

describe('formatDate / formatDateTime', () => {
  it('formats absolutely', () => {
    expect(formatDate('2026-03-12T00:00:00Z')).toMatch(/Mar 1[12], 2026/);
    expect(formatDateTime('2026-03-12T16:05:00Z')).toMatch(/Mar 1[12], 2026/);
  });

  it('guards the same nullable inputs', () => {
    expect(formatDate(null)).toBe('—');
    expect(formatDateTime('nonsense')).toBe('—');
  });
});

describe('formatExactTitle', () => {
  it('returns an empty string when absent, so no stray title attribute renders', () => {
    expect(formatExactTitle(null)).toBe('');
    expect(formatExactTitle('bad')).toBe('');
    expect(formatExactTitle('2026-03-12T16:05:00Z')).not.toBe('');
  });
});
