import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PreorderBadge, isActivePreorder, formatReleaseDate } from './PreorderBadge';

// M21 (req 8): a seller must know a product is a pre-order BEFORE they list it —
// listing one commits them to having stock on release day, with every buyer
// auto-refunded (and no payout) if they miss by 24h.
//
// The trap this component exists to close: `isPreorder` stays TRUE forever
// after a title releases. Release only stamps `preorderReleasedAt` and converts
// the product to an ordinary listing. Every screen that reads the flag on its
// own leaves a PRE-ORDER badge on released titles for the rest of their life —
// which is also how the homepage section kept showing released games.

const upcoming = { isPreorder: true, preorderReleasedAt: null, preorderReleaseDate: '2027-09-12' };
const released = { isPreorder: true, preorderReleasedAt: '2027-09-12', preorderReleaseDate: '2027-09-12' };
const ordinary = { isPreorder: false, preorderReleasedAt: null };

describe('isActivePreorder', () => {
  it('is true only while the title has not released', () => {
    expect(isActivePreorder(upcoming)).toBe(true);
    expect(isActivePreorder(released)).toBe(false);
    expect(isActivePreorder(ordinary)).toBe(false);
  });

  it('survives a missing or unpopulated product', () => {
    expect(isActivePreorder(null)).toBe(false);
    expect(isActivePreorder(undefined)).toBe(false);
    expect(isActivePreorder({})).toBe(false);
  });
});

describe('formatReleaseDate', () => {
  it('returns null rather than "Invalid Date" for junk', () => {
    expect(formatReleaseDate(null)).toBeNull();
    expect(formatReleaseDate('')).toBeNull();
    expect(formatReleaseDate('not-a-date')).toBeNull();
  });

  it('formats a real date', () => {
    expect(formatReleaseDate('2027-09-12')).toMatch(/2027/);
  });
});

describe('<PreorderBadge>', () => {
  it('renders nothing for an ordinary product', () => {
    const { container } = render(<PreorderBadge product={ordinary} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing once the title has released', () => {
    const { container } = render(<PreorderBadge product={released} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the release date, because the date IS the seller obligation', () => {
    render(<PreorderBadge product={upcoming} />);
    expect(screen.getByText(/Pre-order/)).toHaveTextContent(/2027/);
  });

  it('still labels a pre-order that somehow has no date', () => {
    render(<PreorderBadge product={{ isPreorder: true, preorderReleasedAt: null }} />);
    expect(screen.getByText('Pre-order')).toBeInTheDocument();
  });

  it('can be asked for the bare label', () => {
    render(<PreorderBadge product={upcoming} withDate={false} />);
    expect(screen.getByText('Pre-order')).toBeInTheDocument();
  });
});
