import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../test/render';

vi.mock('@services/api', () => ({
  adminAPI: {
    getPendingSellers: vi.fn(),
    getAllSellers: vi.fn(),
    approveSeller: vi.fn(),
    rejectSeller: vi.fn(),
    blockSeller: vi.fn(),
    holdSeller: vi.fn(),
    liftSellerHold: vi.fn(),
  },
}));

const { adminAPI } = await import('@services/api');
const SellersManagement = (await import('./SellersManagement')).default;

const seller = (n) => ({ _id: `s${n}`, shopName: `Shop ${n}`, status: 'pending', createdAt: '2026-01-01', userId: { email: `s${n}@x.test` } });
const page = (sellers, total) => ({
  data: { data: { sellers, pagination: { page: 1, limit: 10, total, pages: Math.max(1, Math.ceil(total / 10)) } } },
});

const pendingCalls = () => adminAPI.getPendingSellers.mock.calls.map(([params]) => params);
const activeCalls = () => adminAPI.getAllSellers.mock.calls.map(([params]) => params).filter((p) => p.status === 'active');

describe('Admin sellers — paging and search', () => {
  beforeEach(() => {
    adminAPI.getPendingSellers.mockReset();
    adminAPI.getAllSellers.mockReset();
    adminAPI.getPendingSellers.mockImplementation(() => Promise.resolve(page(Array.from({ length: 10 }, (_, i) => seller(i)), 25)));
    adminAPI.getAllSellers.mockImplementation(() => Promise.resolve(page([], 0)));
  });

  it('pages the open tab without refetching the other tabs', async () => {
    renderWithProviders(<SellersManagement />);
    fireEvent.click(await screen.findByRole('button', { name: 'Go to page 3' }));

    await waitFor(() => expect(pendingCalls().at(-1).page).toBe(3));
    expect(activeCalls().every((p) => p.page === 1)).toBe(true);
  });

  it('sends the search term to the server instead of filtering one page', async () => {
    renderWithProviders(<SellersManagement />);
    const box = await screen.findByRole('textbox', { name: /search sellers/i });

    fireEvent.change(box, { target: { value: '  late-seller@x.test ' } });

    await waitFor(() => expect(pendingCalls().at(-1).search).toBe('late-seller@x.test'));
    expect(pendingCalls().at(-1).page).toBe(1);
    expect(activeCalls().at(-1).search).toBe('late-seller@x.test');
  });
});
