import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import { renderWithProviders } from '../../../test/render';

vi.mock('@services/api', () => ({
  productAPI: { getProducts: vi.fn(), getUploadKeysStatus: vi.fn() },
  offerAPI: { uploadOfferKeys: vi.fn(), getMyOffers: vi.fn() },
}));

const { offerAPI } = await import('@services/api');
const BulkUploadModal = (await import('./BulkUploadModal')).default;

// Three steps — listing, add, review — and nothing is sent until Submit on the
// last one. Typed rows and rows read from a file join the same list, so these
// pin the payload, the duplicate rule, and the refusal to stage a bad row.

const offer = (productType, name = 'Zero Hour') => ({
  _id: 'offer-1',
  availableKeysCount: 0,
  totalKeysCount: 0,
  productId: { _id: 'prod-1', name, productType, images: [] },
});

const listings = (offers) => ({
  data: { data: { offers, pagination: { page: 1, limit: 50, total: offers.length, pages: 1 } } },
});

const next = () => fireEvent.click(screen.getByRole('button', { name: /^next/i }));

const openWith = async (productType) => {
  offerAPI.getMyOffers.mockResolvedValue(listings([offer(productType)]));
  renderWithProviders(<BulkUploadModal open onOpenChange={() => {}} />);
  fireEvent.click(screen.getByRole('combobox'));
  fireEvent.click(await screen.findByRole('option', { name: /Zero Hour/i }));
  next(); // step 2
};

// Addressed by input id: two of the labels start with "Email", so a text match
// is ambiguous. The ids come from the field keys the form is built from.
const fillAccount = (values) => {
  for (const [key, value] of Object.entries(values)) {
    fireEvent.change(document.getElementById(`account-${key}`), { target: { value } });
  }
};

// Radix tabs activate on mouse DOWN, not click.
const openTab = (name) => {
  const tab = screen.getByRole('tab', { name });
  fireEvent.mouseDown(tab);
  fireEvent.click(tab);
};

const uploadFile = (text, name = 'inventory.csv') => {
  const input = screen.getByLabelText(/choose an inventory file/i);
  fireEvent.change(input, { target: { files: [new File([text], name, { type: 'text/csv' })] } });
};

const review = () => fireEvent.click(screen.getByRole('button', { name: /^review /i }));

const COMPLETE = {
  usernameId: 'gamerTag',
  usernamePassword: 'gamerPass',
  email: 'acc@example.com',
  emailPassword: 'accPass',
  hostEmail: 'host@example.com',
};

describe('Upload inventory — staging accounts', () => {
  beforeEach(() => {
    offerAPI.uploadOfferKeys.mockReset();
    offerAPI.uploadOfferKeys.mockResolvedValue({ data: { data: { uploaded: 1 } } });
  });

  it('adds a typed account, then uploads it from the review step', async () => {
    await openWith('ACCOUNT_BASED');
    fillAccount(COMPLETE);
    fireEvent.click(screen.getByRole('button', { name: /add account/i }));

    expect(await screen.findByText('Ready to upload: 1 account')).toBeInTheDocument();
    expect(screen.getByText('gamerTag')).toBeInTheDocument();

    review();
    fireEvent.click(screen.getByRole('button', { name: /submit 1 account/i }));

    await waitFor(() => expect(offerAPI.uploadOfferKeys).toHaveBeenCalledTimes(1));
    const [offerId, keys] = offerAPI.uploadOfferKeys.mock.calls[0];
    expect(offerId).toBe('offer-1');
    expect(keys).toHaveLength(1);
    expect(keys[0]).toMatchObject(COMPLETE);
  });

  it('refuses an incomplete account and stages nothing', async () => {
    await openWith('ACCOUNT_BASED');
    fillAccount({ ...COMPLETE, hostEmail: '' });
    fireEvent.click(screen.getByRole('button', { name: /add account/i }));

    expect(await screen.findByText(/host email is missing/i)).toBeInTheDocument();
    expect(screen.getByText('Ready to upload: 0 accounts')).toBeInTheDocument();
  });

  it('does not stage the same account twice', async () => {
    await openWith('ACCOUNT_BASED');
    fillAccount(COMPLETE);
    fireEvent.click(screen.getByRole('button', { name: /add account/i }));
    await screen.findByText('Ready to upload: 1 account');

    fillAccount(COMPLETE);
    fireEvent.click(screen.getByRole('button', { name: /add account/i }));

    expect(screen.getByText('Ready to upload: 1 account')).toBeInTheDocument();
  });

  it('removes a staged row', async () => {
    await openWith('ACCOUNT_BASED');
    fillAccount(COMPLETE);
    fireEvent.click(screen.getByRole('button', { name: /add account/i }));
    await screen.findByText('Ready to upload: 1 account');

    fireEvent.click(screen.getByRole('button', { name: /remove gamerTag/i }));
    expect(screen.getByText('Ready to upload: 0 accounts')).toBeInTheDocument();
  });

  it('cannot reach the review step with an empty list', async () => {
    await openWith('ACCOUNT_BASED');
    expect(screen.getByRole('button', { name: /^review /i })).toBeDisabled();
  });
});

describe('Upload inventory — importing a file', () => {
  beforeEach(() => {
    offerAPI.uploadOfferKeys.mockReset();
    offerAPI.uploadOfferKeys.mockResolvedValue({ data: { data: { uploaded: 2 } } });
  });

  it('reads a CSV into the same list, then uploads it', async () => {
    await openWith('ACCOUNT_BASED');
    openTab(/upload file/i);

    uploadFile(
      [
        'gamerTag,gamerPass,acc@example.com,accPass,host@example.com,EU region',
        'proGamer,proPass,pro@example.com,proPass2,host2@example.com',
      ].join('\n')
    );

    fireEvent.click(await screen.findByRole('button', { name: /add 2 to list/i }));
    expect(await screen.findByText('Ready to upload: 2 accounts')).toBeInTheDocument();

    review();
    fireEvent.click(screen.getByRole('button', { name: /submit 2 accounts/i }));
    await waitFor(() => expect(offerAPI.uploadOfferKeys).toHaveBeenCalledTimes(1));
    expect(offerAPI.uploadOfferKeys.mock.calls[0][1]).toHaveLength(2);
    expect(offerAPI.uploadOfferKeys.mock.calls[0][1][0].notes).toBe('EU region');
  });

  // The sample file the dialog hands out starts with one, and sellers keep
  // their own — a header row must never be uploaded as an account.
  it('ignores a header row', async () => {
    await openWith('ACCOUNT_BASED');
    openTab(/upload file/i);

    uploadFile(
      [
        'username/ID,password,email,email password,host email,notes',
        'gamerTag,gamerPass,acc@example.com,accPass,host@example.com,EU region',
      ].join('\n')
    );

    fireEvent.click(await screen.findByRole('button', { name: /add 1 to list/i }));
    expect(await screen.findByText('Ready to upload: 1 account')).toBeInTheDocument();
  });

  it('names the bad rows by the file’s own line numbers', async () => {
    await openWith('ACCOUNT_BASED');
    openTab(/upload file/i);

    uploadFile(
      [
        'username/ID,password,email,email password,host email,notes',
        'gamerTag,gamerPass,acc@example.com,accPass,host@example.com',
        'brokenRow,onlyPassword',
      ].join('\n')
    );

    // Line 3 of the file, not line 2 of what is left after the header is dropped.
    expect(await screen.findByText(/Line 3:/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add 1 to list/i })).toBeEnabled();
  });

  it('refuses a file type it cannot read', async () => {
    await openWith('ACCOUNT_BASED');
    openTab(/upload file/i);

    const input = screen.getByLabelText(/choose an inventory file/i);
    fireEvent.change(input, { target: { files: [new File(['x'], 'accounts.pdf', { type: 'application/pdf' })] } });

    expect(screen.queryByRole('button', { name: /add \d+ to list/i })).not.toBeInTheDocument();
  });
});

describe('Upload inventory — license keys', () => {
  beforeEach(() => {
    offerAPI.uploadOfferKeys.mockReset();
    offerAPI.uploadOfferKeys.mockResolvedValue({ data: { data: { uploaded: 1 } } });
  });

  it('stages a typed key and uploads it as a plain string', async () => {
    await openWith('LICENSE_KEY');

    fireEvent.change(screen.getByLabelText(/^license key/i), { target: { value: 'KEY1-ABCD-EFGH' } });
    fireEvent.click(screen.getByRole('button', { name: /add license key/i }));

    expect(await screen.findByText('Ready to upload: 1 license key')).toBeInTheDocument();

    review();
    fireEvent.click(screen.getByRole('button', { name: /submit 1 license key/i }));
    await waitFor(() => expect(offerAPI.uploadOfferKeys).toHaveBeenCalledTimes(1));
    expect(offerAPI.uploadOfferKeys.mock.calls[0][1]).toEqual(['KEY1-ABCD-EFGH']);
  });

  it('refuses a key that is too short', async () => {
    await openWith('LICENSE_KEY');

    fireEvent.change(screen.getByLabelText(/^license key/i), { target: { value: 'ab' } });
    fireEvent.click(screen.getByRole('button', { name: /add license key/i }));

    expect(await screen.findByText(/too short/i)).toBeInTheDocument();
    expect(screen.getByText('Ready to upload: 0 license keys')).toBeInTheDocument();
  });
});

// Gift codes and activation links used to be rejected outright — the dialog only
// knew two types, and the old product upload route refused anything else.
describe('Upload inventory — gift codes and activation links', () => {
  beforeEach(() => {
    offerAPI.uploadOfferKeys.mockReset();
    offerAPI.uploadOfferKeys.mockResolvedValue({ data: { data: { uploaded: 1 } } });
  });

  it('calls a gift code a gift code, and uploads it', async () => {
    await openWith('GIFT');

    fireEvent.change(screen.getByLabelText(/^gift code/i), { target: { value: 'GIFT-1234-5678' } });
    fireEvent.click(screen.getByRole('button', { name: /add gift code/i }));

    expect(await screen.findByText('Ready to upload: 1 gift code')).toBeInTheDocument();

    review();
    fireEvent.click(screen.getByRole('button', { name: /submit 1 gift code/i }));
    await waitFor(() => expect(offerAPI.uploadOfferKeys).toHaveBeenCalledTimes(1));
    expect(offerAPI.uploadOfferKeys.mock.calls[0][1]).toEqual(['GIFT-1234-5678']);
  });

  it('stages an activation link', async () => {
    await openWith('ACTIVATION_LINK');

    fireEvent.change(screen.getByLabelText(/^activation link/i), {
      target: { value: 'https://example.com/activate/abc123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /add activation link/i }));

    expect(await screen.findByText('Ready to upload: 1 activation link')).toBeInTheDocument();
  });

  // A buyer receives an activation link to FOLLOW. Anything that is not a link
  // is not a delivery, and only http(s) is ever rendered as one.
  it('refuses an activation link that is not a link', async () => {
    await openWith('ACTIVATION_LINK');

    fireEvent.change(screen.getByLabelText(/^activation link/i), { target: { value: 'ask the seller' } });
    fireEvent.click(screen.getByRole('button', { name: /add activation link/i }));

    expect(await screen.findByText(/must start with http:\/\/ or https:\/\//i)).toBeInTheDocument();
    expect(screen.getByText('Ready to upload: 0 activation links')).toBeInTheDocument();
  });

  it('rejects a bad link in an uploaded file and keeps the good one', async () => {
    await openWith('ACTIVATION_LINK');
    openTab(/upload file/i);

    uploadFile(['https://example.com/a', 'not-a-link'].join('\n'), 'links.txt');

    expect(await screen.findByText(/Line 2:/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add 1 to list/i })).toBeEnabled();
  });
});

describe('Upload inventory — finding the listing', () => {
  beforeEach(() => {
    offerAPI.getMyOffers.mockReset();
  });

  it('asks the server for matches instead of filtering the fetched page', async () => {
    offerAPI.getMyOffers.mockResolvedValue(listings([offer('GIFT')]));
    renderWithProviders(<BulkUploadModal open onOpenChange={() => {}} />);
    fireEvent.click(screen.getByRole('combobox'));
    await screen.findByRole('option', { name: /Zero Hour/i });

    // A listing beyond the first page: only the server can find it.
    offerAPI.getMyOffers.mockResolvedValue(listings([offer('GIFT', 'Far Cry 6')]));
    fireEvent.change(screen.getByPlaceholderText(/type to search listings/i), {
      target: { value: 'far cry' },
    });

    await waitFor(() =>
      expect(offerAPI.getMyOffers).toHaveBeenCalledWith(expect.objectContaining({ search: 'far cry' }))
    );
    expect(await screen.findByRole('option', { name: /Far Cry 6/i })).toBeInTheDocument();
  });

  it('keeps the chosen listing after a search that excludes it', async () => {
    offerAPI.getMyOffers.mockResolvedValue(listings([offer('GIFT')]));
    renderWithProviders(<BulkUploadModal open onOpenChange={() => {}} />);
    fireEvent.click(screen.getByRole('combobox'));
    fireEvent.click(await screen.findByRole('option', { name: /Zero Hour/i }));

    offerAPI.getMyOffers.mockResolvedValue(listings([]));
    fireEvent.click(screen.getByRole('combobox'));
    fireEvent.change(screen.getByPlaceholderText(/type to search listings/i), {
      target: { value: 'nothing' },
    });

    await waitFor(() =>
      expect(offerAPI.getMyOffers).toHaveBeenCalledWith(expect.objectContaining({ search: 'nothing' }))
    );
    // Still selected: Next stays available.
    expect(screen.getByRole('button', { name: /^next/i })).toBeEnabled();
  });
});

describe('Upload inventory — guarding what is staged', () => {
  it('asks before closing with rows that were never uploaded', async () => {
    const onOpenChange = vi.fn();
    offerAPI.getMyOffers.mockResolvedValue(listings([offer('ACCOUNT_BASED')]));
    renderWithProviders(<BulkUploadModal open onOpenChange={onOpenChange} />);
    fireEvent.click(screen.getByRole('combobox'));
    fireEvent.click(await screen.findByRole('option', { name: /Zero Hour/i }));
    next();
    fillAccount(COMPLETE);
    fireEvent.click(screen.getByRole('button', { name: /add account/i }));
    await screen.findByText('Ready to upload: 1 account');

    fireEvent.click(screen.getByRole('button', { name: /^close$/i }));

    expect(await screen.findByText(/have not been uploaded yet/i)).toBeInTheDocument();
    expect(onOpenChange).not.toHaveBeenCalledWith(false);

    const dialog = screen.getByRole('dialog', { name: /discard what you added/i });
    fireEvent.click(within(dialog).getByRole('button', { name: /discard/i }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
