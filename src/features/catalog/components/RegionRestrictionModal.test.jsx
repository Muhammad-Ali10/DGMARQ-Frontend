import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@hooks/useBuyerCountry', () => ({
  default: () => ({ country: 'TR' }),
}));

const RegionRestrictionModal = (await import('./RegionRestrictionModal')).default;
const { generateProductSEO } = await import('@hooks/useSEO');
const { countryName } = await import('@lib/regionCompat');

describe('RegionRestrictionModal', () => {
  it('does not list an excluded country as allowed on a GLOBAL offer', () => {
    render(
      <RegionRestrictionModal
        open
        onClose={() => {}}
        offer={{ regionCodes: ['GLOBAL'], countries: [], excludedCountries: ['TR'] }}
      />
    );

    expect(screen.getByText(/cannot/i)).toBeInTheDocument();
    const listed = Array.from(document.querySelectorAll('.dg-crow')).map((row) => row.textContent);
    expect(listed.length).toBeGreaterThan(10);
    expect(listed).not.toContain(countryName('TR'));
    expect(listed).toContain('Germany');
  });
});

describe('generateProductSEO', () => {
  it('uses the stored meta title as the full page title', () => {
    const { title } = generateProductSEO({ name: 'Elden Ring', metaTitle: 'Elden Ring | Buy cheap on DGMARQ' });
    expect(title).toBe('Elden Ring | Buy cheap on DGMARQ');
  });
});
