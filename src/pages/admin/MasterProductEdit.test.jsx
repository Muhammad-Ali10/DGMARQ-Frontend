import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, within, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../test/render';
import MasterProductEdit from './MasterProductEdit';

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

describe('master product SEO meta', () => {
  it('leaves an auto-generated meta title blank so a rename regenerates it', async () => {
    renderPage(product({ metaTitle: 'Zero Hour | Buy cheap on DGMARQ', categoryId: 'cat-1' }));

    const input = await screen.findByPlaceholderText('{Product Name} | Buy cheap on DGMARQ');
    expect(input).toHaveValue('');
    fireEvent.click(screen.getAllByRole('button', { name: /save changes/i })[0]);

    await waitFor(() => expect(api.masterCatalogAPI.updateProduct).toHaveBeenCalled());
    expect(api.masterCatalogAPI.updateProduct.mock.calls[0][1].metaTitle).toBe('');
  });

  it('keeps a custom meta title the admin wrote', async () => {
    renderPage(product({ metaTitle: 'Zero Hour deals', categoryId: 'cat-1' }));

    expect(await screen.findByPlaceholderText('{Product Name} | Buy cheap on DGMARQ')).toHaveValue('Zero Hour deals');
  });
});
