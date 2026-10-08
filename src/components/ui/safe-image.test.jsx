import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SafeImage from './safe-image';

describe('SafeImage', () => {
  it('shows the fallback after an error and recovers when src changes', () => {
    const { rerender } = render(<SafeImage src="https://a.example/old.png" fallbackSrc="/fallback.png" alt="avatar" />);
    const img = screen.getByAltText('avatar');
    fireEvent.error(img);
    expect(screen.getByAltText('avatar').getAttribute('src')).toBe('/fallback.png');

    rerender(<SafeImage src="https://a.example/new.png" fallbackSrc="/fallback.png" alt="avatar" />);
    expect(screen.getByAltText('avatar').getAttribute('src')).toBe('https://a.example/new.png');
  });

  it('stays hidden after an error when hideOnError is set, until src changes', () => {
    const { rerender, container } = render(<SafeImage src="/broken.png" hideOnError alt="x" />);
    fireEvent.error(screen.getByAltText('x'));
    expect(container.querySelector('img')).toBeNull();

    rerender(<SafeImage src="/fixed.png" hideOnError alt="x" />);
    expect(container.querySelector('img')).not.toBeNull();
  });
});
