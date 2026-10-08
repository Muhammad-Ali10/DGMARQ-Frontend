import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useOfferVerdict } from './useOfferVerdict';

vi.mock('./useBuyerCountry', () => ({ default: () => ({ country: 'FR' }) }));

describe('useOfferVerdict', () => {
  it('keeps the same availability when a caller rebuilds an equal offer each render', () => {
    const { result, rerender } = renderHook(({ offer }) => useOfferVerdict(offer), {
      initialProps: { offer: { regionCodes: ['EUROPE'], countries: [], excludedCountries: [] } },
    });
    const first = result.current.availability;

    rerender({ offer: { regionCodes: ['EUROPE'], countries: [], excludedCountries: [] } });

    expect(result.current.availability).toBe(first);
    expect(result.current.availability.allowed.has('FR')).toBe(true);
  });

  it('recomputes when the regions actually change', () => {
    const { result, rerender } = renderHook(({ offer }) => useOfferVerdict(offer), {
      initialProps: { offer: { regionCodes: ['EUROPE'], countries: [], excludedCountries: [] } },
    });
    const first = result.current.availability;

    rerender({ offer: { regionCodes: ['EUROPE'], countries: [], excludedCountries: ['FR'] } });

    expect(result.current.availability).not.toBe(first);
    expect(result.current.availability.excluded.has('FR')).toBe(true);
  });

  it('returns nothing for a missing offer', () => {
    const { result } = renderHook(() => useOfferVerdict(null));
    expect(result.current.availability).toBeNull();
    expect(result.current.verdict).toBeNull();
  });
});
