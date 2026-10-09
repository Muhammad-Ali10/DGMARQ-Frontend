import { describe, it, expect } from 'vitest';
import { getRedemption } from './redemption';

const KEY_TYPES = ['steam', 'epic', 'origin', 'xbox', 'playstation', 'nintendo', 'account', 'other'];

describe('getRedemption', () => {
  it('covers every platform keyType the server can store', () => {
    const platforms = KEY_TYPES.filter((t) => !['account', 'other'].includes(t));
    for (const t of platforms) {
      expect(getRedemption(t), `missing redemption for "${t}"`).toBeTruthy();
    }
  });

  it('returns null where there is genuinely no redemption route', () => {
    expect(getRedemption('account')).toBeNull();
    expect(getRedemption('other')).toBeNull();
    expect(getRedemption('')).toBeNull();
    expect(getRedemption(null)).toBeNull();
    expect(getRedemption(undefined)).toBeNull();
    expect(getRedemption('not-a-platform')).toBeNull();
  });

  it('is case-insensitive', () => {
    expect(getRedemption('Steam')).toEqual(getRedemption('steam'));
    expect(getRedemption('  XBOX  ')).toEqual(getRedemption('xbox'));
  });

  it('resolves catalog platform names through their aliases', () => {
    expect(getRedemption('Epic Games')).toEqual(getRedemption('epic'));
    expect(getRedemption('Nintendo Switch')).toEqual(getRedemption('nintendo'));
    expect(getRedemption('EA App')).toEqual(getRedemption('origin'));
  });

  it('every entry has a label, an https url and at least one step', () => {
    for (const t of KEY_TYPES) {
      const r = getRedemption(t);
      if (!r) continue;
      expect(r.label, `${t} label`).toBeTruthy();
      expect(r.url, `${t} url`).toMatch(/^https:\/\//);
      expect(Array.isArray(r.steps) && r.steps.length > 0, `${t} steps`).toBe(true);
    }
  });
});
