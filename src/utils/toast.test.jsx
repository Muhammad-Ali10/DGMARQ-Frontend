import { describe, it, expect } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { Toaster } from 'sonner';
import { showApiError } from './toast';

const apiError = (data, status = 400) => ({ response: { status, data } });

describe('showApiError', () => {
  it('shows the first validation message instead of crashing on the error object', async () => {
    render(<Toaster />);
    act(() => {
      showApiError(
        apiError({ message: 'Validation failed', errors: [{ field: 'email', message: 'Please provide a valid email' }] }),
        'Login failed',
        true
      );
    });
    expect(await screen.findByText('Please provide a valid email')).toBeInTheDocument();
  });

  it('renders an object-shaped `error` field as text', async () => {
    render(<Toaster />);
    act(() => {
      showApiError(apiError({ message: 'Upload failed', error: { message: 'File too large' } }), 'x', true);
    });
    expect(await screen.findByText('File too large')).toBeInTheDocument();
  });

  it('does not repeat a forced interceptor toast when the page reports the same error', async () => {
    render(<Toaster />);
    const err = apiError({ message: 'Current password is incorrect' });
    act(() => {
      showApiError(err, undefined, true);
      showApiError(err, 'Failed to update password');
    });
    expect(await screen.findAllByText('Current password is incorrect')).toHaveLength(1);
  });

  it('keeps plain string errors working', async () => {
    render(<Toaster />);
    act(() => {
      showApiError(apiError({ message: 'Nope', errors: ['Quantity must be at least 1'] }), 'x', true);
    });
    expect(await screen.findByText('Quantity must be at least 1')).toBeInTheDocument();
  });
});
