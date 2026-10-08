import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../test/render';

vi.mock('@services/api', () => ({
  adminAPI: {
    getAllUsers: vi.fn(),
    banUser: vi.fn(),
  },
}));

const { adminAPI } = await import('@services/api');
const UsersManagement = (await import('./UsersManagement')).default;

const page = (users = [], total = users.length) => ({
  data: { data: { users, pagination: { page: 1, limit: 10, total, pages: Math.max(1, Math.ceil(total / 10)) } } },
});

const lastParams = () => adminAPI.getAllUsers.mock.calls.at(-1)[0];

describe('Admin users — search', () => {
  beforeEach(() => {
    adminAPI.getAllUsers.mockReset();
    adminAPI.getAllUsers.mockResolvedValue(page());
  });

  it('loads without a search term', async () => {
    renderWithProviders(<UsersManagement />);
    await waitFor(() => expect(adminAPI.getAllUsers).toHaveBeenCalled());
    expect(lastParams().search).toBeUndefined();
  });

  it('sends the trimmed term to the server once typing pauses', async () => {
    renderWithProviders(<UsersManagement />);
    const box = await screen.findByRole('textbox', { name: /search users/i });

    fireEvent.change(box, { target: { value: '  ali  ' } });

    await waitFor(() => expect(lastParams().search).toBe('ali'));
    expect(lastParams().page).toBe(1);
  });

  it('says so when nothing matches', async () => {
    renderWithProviders(<UsersManagement />);
    const box = await screen.findByRole('textbox', { name: /search users/i });

    fireEvent.change(box, { target: { value: 'nobody-here' } });

    expect(await screen.findByText('No users match "nobody-here"')).toBeInTheDocument();
  });

  it('keeps the search box mounted while the next results load', async () => {
    renderWithProviders(<UsersManagement />);
    const box = await screen.findByRole('textbox', { name: /search users/i });

    adminAPI.getAllUsers.mockReturnValue(new Promise(() => {}));
    fireEvent.change(box, { target: { value: 'ali' } });

    await waitFor(() => expect(lastParams().search).toBe('ali'));
    expect(screen.getByRole('textbox', { name: /search users/i })).toBe(box);
  });
});
