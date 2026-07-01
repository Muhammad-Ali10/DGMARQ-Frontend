import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../test/render';
import ProductCard from './ProductCard';

const product = {
  _id: '507f1f77bcf86cd799439011',
  name: 'Zero Hour',
  slug: 'zero-hour',
  price: 100,
  discountPercentage: 25,
  platform: { name: 'Steam' },
  images: ['cover.jpg'],
};

describe('ProductCard', () => {
  it('renders the name and platform, and links to the product slug', () => {
    renderWithProviders(<ProductCard product={product} />);
    expect(screen.getByText('Zero Hour')).toBeInTheDocument();
    expect(screen.getByText('Steam')).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', '/product/zero-hour');
  });

  it('links by _id when no slug is present', () => {
    renderWithProviders(<ProductCard product={{ ...product, slug: undefined }} />);
    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      '/product/507f1f77bcf86cd799439011',
    );
  });

  it('renders without crashing for a minimal product', () => {
    renderWithProviders(<ProductCard product={{ _id: 'x', name: 'Bare', price: 0 }} />);
    expect(screen.getByText('Bare')).toBeInTheDocument();
  });
});
