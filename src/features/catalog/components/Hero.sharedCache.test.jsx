import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const slide = { _id: 's1', title: 'Summer Sale', image: 'https://res.cloudinary.com/demo/image/upload/a.png', slideIndex: 0, isActive: true };

vi.mock('@services/api', () => ({
  homepageSliderAPI: {
    getHomepageSliders: vi.fn(async () => ({ data: { data: [slide] } })),
    getAllHomepageSliders: vi.fn(async () => ({ data: { data: { sliders: [slide], pagination: { total: 1 } } } })),
  },
  productAPI: { getProducts: vi.fn(async () => ({ data: { data: { products: [] } } })) },
}));
vi.mock('@hooks/useCurrency', () => ({ default: () => ({ formatPrice: (v) => `$${v}` }) }));
if (!globalThis.IntersectionObserver) {
  globalThis.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } };
}
if (!window.matchMedia) {
  window.matchMedia = (query) => ({ matches: false, media: query, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
}

const { default: Hero } = await import('./Hero');
const { default: HomepageSlidersManagement } = await import('@pages/admin/HomepageSlidersManagement');

describe('Hero after an admin opened the slider manager', () => {
  it('still renders the homepage carousel instead of crashing on the admin-shaped cache', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrap = (ui) => (
      <QueryClientProvider client={client}>
        <MemoryRouter>{ui}</MemoryRouter>
      </QueryClientProvider>
    );

    const admin = render(wrap(<HomepageSlidersManagement />));
    await waitFor(() => expect(screen.getAllByText('Summer Sale').length).toBeGreaterThan(0));
    admin.unmount();

    render(wrap(<Hero />));
    await waitFor(() => expect(document.querySelector('img[alt="Summer Sale"]')).toBeTruthy());
  });
});
