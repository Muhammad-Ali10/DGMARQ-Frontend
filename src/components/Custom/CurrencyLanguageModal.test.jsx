import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const setCurrency = vi.fn();
const setCountry = vi.fn();
const setLanguage = vi.fn();
const currencyState = { currency: 'PKR', isExplicit: false };

vi.mock('@hooks/useCurrency', () => ({
  default: () => ({ ...currencyState, setCurrency }),
}));
vi.mock('@hooks/useBuyerCountry', () => ({
  default: () => ({ country: 'PK', setCountry }),
}));
vi.mock('@hooks/useLanguage', () => ({
  LANGUAGES: ['English EU', 'Deutsch'],
  default: () => ({ language: 'English EU', setLanguage }),
}));

const { default: CurrencyLanguageModal } = await import('./CurrencyLanguageModal');

const fetchSpy = vi.spyOn(globalThis, 'fetch');

describe('CurrencyLanguageModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currencyState.currency = 'PKR';
    currencyState.isExplicit = false;
  });

  it('is an accessible dialog with a locally built country list', () => {
    render(<CurrencyLanguageModal open onClose={vi.fn()} />);
    expect(screen.getByRole('dialog', { name: /update your settings/i })).toBeTruthy();
    const region = screen.getByLabelText('Region');
    expect(region.value).toBe('PK');
    expect(region.querySelectorAll('option').length).toBeGreaterThan(150);
    expect(screen.getByRole('option', { name: 'Germany' })).toBeTruthy();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('changing only the region leaves the currency automatic and previews the new one', () => {
    const onClose = vi.fn();
    render(<CurrencyLanguageModal open onClose={onClose} />);
    fireEvent.change(screen.getByLabelText('Region'), { target: { value: 'DE' } });
    expect(screen.getByLabelText('Currency').value).toBe('EUR');
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(setCountry).toHaveBeenCalledWith('DE');
    expect(setCurrency).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('pins the currency only when the user picks one', () => {
    render(<CurrencyLanguageModal open onClose={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Currency'), { target: { value: 'USD' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(setCurrency).toHaveBeenCalledWith('USD');
  });

  it('keeps an explicit currency when the region changes', () => {
    currencyState.currency = 'GBP';
    currencyState.isExplicit = true;
    render(<CurrencyLanguageModal open onClose={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Region'), { target: { value: 'DE' } });
    expect(screen.getByLabelText('Currency').value).toBe('GBP');
  });
});
