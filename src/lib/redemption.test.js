import { describe, it, expect } from 'vitest';
import { getRedemption } from './redemption';

// These are the exact values LicenseKey.keyType can hold (see the enum on the
// server model). If that enum grows, this test is where the gap shows up.
const KEY_TYPES = ['steam', 'epic', 'origin', 'xbox', 'playstation', 'nintendo', 'account', 'other'];

describe('getRedemption', () => {
  it('covers every platform keyType the server can store', () => {
    const platforms = KEY_TYPES.filter((t) => !['account', 'other'].includes(t));
    for (const t of platforms) {
      expect(getRedemption(t), `missing redemption for "${t}"`).toBeTruthy();
    }
  });

  // 'account' and 'other' have no single redemption flow to send someone to.
  // Returning null is the contract; callers branch on it rather than guessing.
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
    // Trims too, so it agrees with PlatformBadge.normalize() on the same input.
    expect(getRedemption('  XBOX  ')).toEqual(getRedemption('xbox'));
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
