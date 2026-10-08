import { describe, it, expect } from 'vitest';
import { getStatusDisplay } from './statusTaxonomy';

describe('getStatusDisplay', () => {
  it('resolves each domain', () => {
    expect(getStatusDisplay('order', 'completed').label).toBe('Completed');
    expect(getStatusDisplay('payment', 'paid').label).toBe('Paid');
    expect(getStatusDisplay('offer', 'approved').label).toBe('Live');
    expect(getStatusDisplay('licenseKey', 'Active').label).toBe('Active');
    expect(getStatusDisplay('sellerAccount', 'active').label).toBe('Active');
    expect(getStatusDisplay('payoutAccount', 'verified').label).toBe('Connected');
  });

  it('is case-insensitive', () => {
    expect(getStatusDisplay('order', 'REFUNDED').label).toBe('Refunded');
    expect(getStatusDisplay('order', 'Completed').label).toBe('Completed');
    expect(getStatusDisplay('licenseKey', 'USED').label).toBe('Used');
    expect(getStatusDisplay('order', 'PARTIALLY_REFUNDED').label).toBe('Partially refunded');
  });

  it('covers every backend payment and seller status', () => {
    expect(getStatusDisplay('payment', 'partially_refunded').label).toBe('Partially refunded');
    expect(getStatusDisplay('sellerAccount', 'closed').label).toBe('Closed');
    expect(getStatusDisplay('sellerAccount', 'rejected').label).toBe('Rejected');
  });

  it('always supplies an icon, so colour is never the only signal', () => {
    for (const [domain, status] of [
      ['order', 'completed'],
      ['order', 'cancelled'],
      ['payment', 'failed'],
      ['offer', 'rejected'],
      ['licenseKey', 'refunded'],
      ['payoutAccount', 'blocked'],
    ]) {
      expect(getStatusDisplay(domain, status).icon).toBeTruthy();
    }
  });

  it('maps meaning onto the semantic variants', () => {
    expect(getStatusDisplay('order', 'completed').variant).toBe('success');
    expect(getStatusDisplay('order', 'pending').variant).toBe('warning');
    expect(getStatusDisplay('order', 'processing').variant).toBe('warning');
    expect(getStatusDisplay('order', 'refunded').variant).toBe('destructive');
    expect(getStatusDisplay('payment', 'failed').variant).toBe('destructive');
  });

  it('degrades gracefully for unknown values and domains', () => {
    const unknown = getStatusDisplay('order', 'some_new_status');
    expect(unknown.label).toBe('some_new_status');
    expect(unknown.variant).toBe('secondary');
    expect(unknown.icon).toBeTruthy();

    expect(getStatusDisplay('nope', 'whatever').label).toBe('whatever');
    expect(getStatusDisplay('order', null).label).toBe('Unknown');
    expect(getStatusDisplay('order', undefined).label).toBe('Unknown');
  });

  it('returns a copy, so a caller cannot mutate the shared table', () => {
    const a = getStatusDisplay('order', 'completed');
    a.label = 'MUTATED';
    expect(getStatusDisplay('order', 'completed').label).toBe('Completed');
  });
});
