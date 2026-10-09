import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TooltipProvider } from '@components/ui/tooltip';
import OfferRegionSummary from './OfferRegionSummary';

const show = (ui) => {
  render(<TooltipProvider delayDuration={0}>{ui}</TooltipProvider>);
  const trigger = screen.getByRole('button', { name: /show every region and country/i });
  fireEvent.focus(trigger);
  return trigger;
};

describe('OfferRegionSummary', () => {
  it('calls an explicitly global offer "Global"', () => {
    render(<OfferRegionSummary offer={{ regionCodes: ['GLOBAL'] }} />);
    expect(screen.getByText('Global')).toBeInTheDocument();
  });

  it('calls an offer with nothing set "Global" too — it reaches the same buyers', () => {
    render(<OfferRegionSummary offer={{ regionCodes: [], countries: [], excludedCountries: [] }} />);
    expect(screen.getByText('Global')).toBeInTheDocument();
    expect(screen.queryByText(/all regions/i)).not.toBeInTheDocument();
  });

  it('shows every region name, not just the first few', async () => {
    show(
      <OfferRegionSummary
        offer={{ regionCodes: ['EUROPE', 'ASIA', 'NORTH_AMERICA', 'RU_CIS'], countries: [], excludedCountries: [] }}
      />
    );
    expect(await screen.findByText(/Europe, Asia, North America, Russia & CIS/)).toBeInTheDocument();
  });

  it('names the individual countries a seller added, instead of counting them', async () => {
    show(
      <OfferRegionSummary
        offer={{ regionCodes: ['EUROPE'], countries: ['US', 'CA', 'BR'], excludedCountries: [] }}
      />
    );
    const added = await screen.findByText(/United States/);
    expect(added).toHaveTextContent(/Canada/);
    expect(added).toHaveTextContent(/Brazil/);
    expect(screen.queryByText(/\+3 extra/)).not.toBeInTheDocument();
  });

  it('names the excluded countries', async () => {
    show(
      <OfferRegionSummary offer={{ regionCodes: ['EUROPE'], countries: [], excludedCountries: ['RU'] }} />
    );
    expect(await screen.findByText(/Excluded/)).toBeInTheDocument();
    expect(await screen.findByText(/Russia/)).toBeInTheDocument();
  });

  it('flags an offer that excludes everything and includes nothing', () => {
    render(<OfferRegionSummary offer={{ regionCodes: [], countries: [], excludedCountries: ['RU'] }} />);
    expect(screen.getByText(/no region set/i)).toBeInTheDocument();
  });
});
