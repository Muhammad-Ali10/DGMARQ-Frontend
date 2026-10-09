import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';

const resetPassword = vi.fn();
vi.mock('@services/api', () => ({ authAPI: { resetPassword: (...args) => resetPassword(...args) } }));

const { default: ResetPassword } = await import('./ResetPassword');

describe('ResetPassword', () => {
  beforeEach(() => resetPassword.mockReset().mockResolvedValue({ data: { success: true } }));

  it('opens the form from the emailed link, which carries only the token', () => {
    renderWithProviders(<ResetPassword />, { route: '/reset-password?token=abc123' });
    expect(document.getElementById('password')).not.toBeNull();
  });

  it('sends the token and the new password', async () => {
    renderWithProviders(<ResetPassword />, { route: '/reset-password?token=abc123' });
    const strong = 'N3w-Strong-Passw0rd!';
    fireEvent.change(document.getElementById('password'), { target: { value: strong } });
    fireEvent.change(document.getElementById('confirmPassword'), { target: { value: strong } });
    fireEvent.submit(document.getElementById('password').closest('form'));
    await waitFor(() => expect(resetPassword).toHaveBeenCalledWith({ token: 'abc123', newPassword: strong }));
  });

  it('shows nothing for a link without a token', () => {
    renderWithProviders(<ResetPassword />, { route: '/reset-password' });
    expect(document.getElementById('password')).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
  });
});
