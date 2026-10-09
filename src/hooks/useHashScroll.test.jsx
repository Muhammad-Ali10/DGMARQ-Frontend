import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Link, MemoryRouter } from 'react-router-dom';
import { useHashScroll } from './useHashScroll';

const Page = () => {
  useHashScroll();
  return (
    <>
      <Link to="#escrow">Learn how we protect you</Link>
      <section id="escrow">Escrow</section>
    </>
  );
};

describe('useHashScroll', () => {
  it('scrolls to the section an in-page link points at', () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    render(
      <MemoryRouter initialEntries={['/security']}>
        <Page />
      </MemoryRouter>,
    );
    expect(scrollIntoView).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('link', { name: 'Learn how we protect you' }));
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(scrollIntoView.mock.contexts[0]).toBe(screen.getByText('Escrow'));

    fireEvent.click(screen.getByRole('link', { name: 'Learn how we protect you' }));
    expect(scrollIntoView).toHaveBeenCalledTimes(2);
  });
});
