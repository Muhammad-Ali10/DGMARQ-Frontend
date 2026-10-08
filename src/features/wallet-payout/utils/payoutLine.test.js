import { describe, expect, it } from 'vitest';
import { payoutLineState, unavailableLineNote } from './payoutLine';

const NOW = Date.parse('2026-10-07T12:00:00Z');
const past = '2026-10-01T00:00:00Z';
const future = '2026-10-20T00:00:00Z';

describe('payoutLineState', () => {
  it('treats available, frozen and matured pending lines as withdrawable', () => {
    expect(payoutLineState({ status: 'available', netAmount: 10 }, NOW)).toBe('withdrawable');
    expect(payoutLineState({ status: 'frozen', netAmount: 10 }, NOW)).toBe('withdrawable');
    expect(payoutLineState({ status: 'pending', netAmount: 10, holdUntil: past }, NOW)).toBe('withdrawable');
  });

  it('keeps a pending line inside its hold as held', () => {
    expect(payoutLineState({ status: 'pending', netAmount: 10, holdUntil: future }, NOW)).toBe('held');
    expect(payoutLineState({ status: 'pending', netAmount: 10, holdUntil: null }, NOW)).toBe('held');
  });

  it('never offers a cancelled, disputed or paid line', () => {
    expect(payoutLineState({ status: 'blocked', netAmount: 40 }, NOW)).toBe('unavailable');
    expect(payoutLineState({ status: 'hold', netAmount: 40 }, NOW)).toBe('unavailable');
    expect(payoutLineState({ status: 'released', netAmount: 40 }, NOW)).toBe('unavailable');
  });

  it('labels a negative line as a refund deduction', () => {
    expect(payoutLineState({ status: 'blocked', netAmount: -4.5 }, NOW)).toBe('deduction');
  });
});

describe('unavailableLineNote', () => {
  it('explains why a line is not payable', () => {
    expect(unavailableLineNote('blocked')).toMatch(/cancelled/i);
    expect(unavailableLineNote('something-else')).toBe('Not available to withdraw');
  });
});
