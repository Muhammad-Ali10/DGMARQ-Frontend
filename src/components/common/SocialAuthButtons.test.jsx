import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';

const providers = { impl: null };
vi.mock('@services/api', () => ({
  authAPI: { getSocialProviders: vi.fn(() => providers.impl()) },
}));

const { default: SocialAuthButtons } = await import('./SocialAuthButtons');

beforeEach(() => {
  providers.impl = null;
});

describe('SocialAuthButtons', () => {
  it('shows only the providers the server has configured', async () => {
    providers.impl = async () => ({ data: { data: ['google'] } });
    renderWithProviders(<SocialAuthButtons leading={<p>Or continue with</p>} />);
    expect(await screen.findByRole('button', { name: /continue with google/i })).toBeInTheDocument();
    expect(screen.getByText('Or continue with')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /facebook/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /steam/i })).toBeNull();
  });

  it('renders nothing, not even the divider, when no provider is configured', async () => {
    providers.impl = async () => ({ data: { data: [] } });
    const { container } = renderWithProviders(<SocialAuthButtons leading={<p>Or continue with</p>} />);
    await waitFor(() => expect(providers.impl).not.toBeNull());
    await new Promise((r) => setTimeout(r, 20));
    expect(container).toBeEmptyDOMElement();
  });

  it('falls back to every provider if the list cannot be loaded', async () => {
    providers.impl = () => Promise.reject(new Error('offline'));
    renderWithProviders(<SocialAuthButtons layout="list" />);
    expect(await screen.findByRole('button', { name: /facebook/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /google/i })).toBeInTheDocument();
  });
});
