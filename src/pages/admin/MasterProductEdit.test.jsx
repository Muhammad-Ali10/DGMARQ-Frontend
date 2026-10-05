import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, within, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../test/render';
import MasterProductEdit from './MasterProductEdit';

// CLIENT REQUIREMENT: a master imported without images can be given images by an
// admin, and once saved those images are final for that product.
vi.mock('@services/api', () => ({
  productAPI: { getProductById: vi.fn(), updateProductImages: vi.fn() },
  masterCatalogAPI: { updateProduct: vi.fn() },
  categoryAPI: { getCategories: vi.fn() },
  subCategoryAPI: { getSubCategories: vi.fn() },
  platformAPI: { getPlatforms: vi.fn() },
  genreAPI: { getGenres: vi.fn() },
  modeAPI: { getModes: vi.fn() },
  deviceAPI: { getDevices: vi.fn() },
  themeAPI: { getThemes: vi.fn() },
}));
vi.mock('react-router-dom', async () => ({
  ...(await vi.importActual('react-router-dom')),
  useParams: () => ({ id: 'prod-1' }),
  useNavigate: () => vi.fn(),
}));

const api = await import('@services/api');

const product = (overrides = {}) => ({
  _id: 'prod-1',
  name: 'Zero Hour',
  externalId: 'kg-123',
  images: [],
  publicId: [],
  imagesLocked: false,
  productType: 'LICENSE_KEY',
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
  for (const group of ['categoryAPI', 'subCategoryAPI', 'platformAPI', 'genreAPI', 'modeAPI', 'deviceAPI', 'themeAPI']) {
    for (const fn of Object.values(api[group])) fn.mockResolvedValue({ data: { data: [] } });
  }
  api.masterCatalogAPI.updateProduct.mockResolvedValue({ data: { data: {} } });
  api.productAPI.updateProductImages.mockResolvedValue({ data: { data: {} } });
});

const renderPage = (p) => {
  api.productAPI.getProductById.mockResolvedValue({ data: { data: p } });
  return renderWithProviders(<MasterProductEdit />, { route: '/admin/catalog/prod-1' });
};

describe('master product images', () => {
  it('prompts the admin to upload when the import brought none', async () => {
    renderPage(product());

    expect(await screen.findByText(/imported without images/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^add$/i })).toBeInTheDocument();
  });

  // The whole point of the lock: every offer on this master shows these images.
  it('locks the images once the product has them', async () => {
    renderPage(product({ images: ['https://cdn/one.jpg'], publicId: ['pid-1'], imagesLocked: true }));

    expect(await screen.findByText(/Images are final for this product/i)).toBeInTheDocument();
    expect(screen.queryByTitle('Remove image')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^add$/i })).not.toBeInTheDocument();
  });

  it('reopens editing only through the confirmed replace action', async () => {
    renderPage(product({ images: ['https://cdn/one.jpg'], publicId: ['pid-1'], imagesLocked: true }));

    fireEvent.click(await screen.findByRole('button', { name: /replace images/i }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: /replace images/i }));

    await waitFor(() => expect(screen.getByTitle('Remove image')).toBeInTheDocument());
    expect(screen.getByText(/recorded in the audit log/i)).toBeInTheDocument();
  });

  it('tells the admin that a re-import refreshes imported fields', async () => {
    renderPage(product());
    expect(await screen.findByText(/Re-importing this product refreshes/i)).toBeInTheDocument();
  });
});
