import { useEffect, useMemo, useRef, useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { productAPI, offerAPI } from '@services/api';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@components/ui/dialog';
import { Button } from '@components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@components/ui/tabs';
import { SearchableSelect } from '@components/ui/searchable-select';
import {
  Upload, Key, User, Gift, Link2, Check, Loader2, ListPlus, FileUp,
  ArrowLeft, ArrowRight, ClipboardCheck,
} from 'lucide-react';
import SafeImage from '@components/ui/safe-image';
import ConfirmationModal from '@components/common/ConfirmationModal';
import { AccountEntryForm } from './inventory/AccountEntryForm';
import { KeyEntryForm } from './inventory/KeyEntryForm';
import { ImportPanel } from './inventory/ImportPanel';
import { StagedInventoryList } from './inventory/StagedInventoryList';
import { rowIdentity } from '../utils/inventoryRows';
import { deliveryWords } from '@lib/deliveryType';
import { useDebounce } from '@hooks/useDebounce';

/**
 * Upload inventory for one listing, in three steps: pick the listing, add the
 * items, review and submit.
 *
 * Rows are STAGED first — typed one at a time, or read from an uploaded file —
 * and both land in the same list, where they can be edited or removed. Nothing
 * reaches the server until Submit, which sends the whole list in one request
 * (the API chunks it and reports progress from a background job).
 *
 * The picker lists the seller's OWN listings — never the whole catalog — and
 * searches them on the server, because a page holds at most 50 and a seller may
 * have more. Uploads go to /offer/:id/keys; the product-level upload route it
 * used to fall back to is gone (it was the one place that refused gift codes
 * and activation links outright).
 */

const STEPS = [
  { id: 1, title: 'Listing' },
  { id: 2, title: 'Add items' },
  { id: 3, title: 'Review' },
];

const TYPE_ICONS = {
  ACCOUNT_BASED: User,
  GIFT: Gift,
  ACTIVATION_LINK: Link2,
  LICENSE_KEY: Key,
};

const StepBar = ({ step }) => (
  <ol className="flex items-center gap-2 px-6 pt-1 pb-3">
    {STEPS.map(({ id, title }, index) => {
      const done = step > id;
      const current = step === id;
      return (
        <li key={id} className="flex items-center gap-2 min-w-0">
          <span
            aria-current={current ? 'step' : undefined}
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
              done
                ? 'bg-success/20 text-success'
                : current
                  ? 'bg-accent text-white'
                  : 'bg-white/[0.06] text-fg-subtle'
            }`}
          >
            {done ? <Check className="h-3.5 w-3.5" /> : id}
          </span>
          <span className={`text-xs truncate ${current ? 'text-fg font-medium' : 'text-fg-muted'}`}>{title}</span>
          {index < STEPS.length - 1 && <span className="mx-1 h-px w-6 shrink-0 bg-white/[0.12]" />}
        </li>
      );
    })}
  </ol>
);

const BulkUploadModal = ({ open, onOpenChange }) => {
  const queryClient = useQueryClient();
  const pollCancelRef = useRef(false);
  const rowIdRef = useRef(0);

  const [step, setStep] = useState(1);
  const [listingSearch, setListingSearch] = useState('');
  const [selected, setSelected] = useState(null); // the chosen listing itself
  const [tab, setTab] = useState('add');
  const [rows, setRows] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(null); // { processed, total, inserted }
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  const search = useDebounce(listingSearch.trim(), 300);
  const listingsQuery = useQuery({
    queryKey: ['upload-listings', search],
    queryFn: () =>
      offerAPI.getMyOffers({ limit: 50, search: search || undefined }).then((res) => res.data.data),
    enabled: open,
    placeholderData: keepPreviousData,
  });

  const products = useMemo(() => {
    const list = (listingsQuery.data?.offers ?? []).map((o) => ({
      _id: o._id, // the offer id — what an upload is addressed to
      name: o.productId?.name || 'Product',
      slug: o.productId?.slug,
      images: o.productId?.images || [],
      productType: o.productId?.productType,
      availableKeysCount: o.availableKeysCount || 0,
      totalKeysCount: o.totalKeysCount || 0,
    }));
    // Keep the chosen listing in the list even after a search that excludes it,
    // or the picker would forget what is already selected.
    return selected && !list.some((p) => p._id === selected._id) ? [selected, ...list] : list;
  }, [listingsQuery.data, selected]);

  const selectedProductId = selected?._id || '';
  const selectedProduct = selected;
  const productType = selectedProduct?.productType || null;
  const isAccount = productType === 'ACCOUNT_BASED';
  const words = deliveryWords(productType);
  const TypeIcon = TYPE_ICONS[productType] || Key;
  const countLabel = `${rows.length} ${rows.length === 1 ? words.one : words.many}`;

  const resetAll = () => {
    setStep(1);
    setListingSearch('');
    setSelected(null);
    setTab('add');
    setRows([]);
    setEditingId(null);
    setProcessing(false);
    setProgress(null);
    setConfirmDiscard(false);
    pollCancelRef.current = true;
  };

  useEffect(() => {
    if (!open) resetAll();
    // resetAll only touches state setters and a ref, so it needs no dependency.
  }, [open]);

  // Cancel polling if the component unmounts.
  useEffect(() => () => { pollCancelRef.current = true; }, []);

  // ── staged rows ────────────────────────────────────────────────────────────
  const addRow = (data) => {
    const identity = rowIdentity(data, productType);
    if (rows.some((row) => rowIdentity(row.data, productType) === identity)) {
      toast.warning(`That ${words.one} is already in the list`);
      return;
    }
    rowIdRef.current += 1;
    setRows((prev) => [...prev, { id: `row-${rowIdRef.current}`, data }]);
  };

  const appendRows = (incoming) => {
    const seen = new Set(rows.map((row) => rowIdentity(row.data, productType)));
    const fresh = [];
    let skipped = 0;
    for (const data of incoming) {
      const identity = rowIdentity(data, productType);
      if (seen.has(identity)) { skipped += 1; continue; }
      seen.add(identity);
      rowIdRef.current += 1;
      fresh.push({ id: `row-${rowIdRef.current}`, data });
    }
    if (fresh.length) setRows((prev) => [...prev, ...fresh]);
    toast.success(
      `${fresh.length} ${fresh.length === 1 ? words.one : words.many} added${skipped ? ` · ${skipped} duplicate${skipped === 1 ? '' : 's'} skipped` : ''}`
    );
  };

  const updateRow = (data) => {
    setRows((prev) => prev.map((row) => (row.id === editingId ? { ...row, data } : row)));
    setEditingId(null);
  };

  const editingRow = rows.find((row) => row.id === editingId) || null;

  const startEdit = (row) => {
    setStep(2);
    setTab('add');
    setEditingId(row.id);
  };

  const removeRow = (id) => {
    setRows((prev) => prev.filter((row) => row.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const changeProduct = (nextId) => {
    // A staged list belongs to the listing it was typed for, and the two kinds
    // of row do not even have the same shape.
    if (rows.length && nextId !== selectedProductId) {
      setRows([]);
      setEditingId(null);
      toast.message('Cleared the staged list — it belonged to the previous listing');
    }
    setSelected(products.find((p) => p._id === nextId) || null);
  };

  // ── upload ─────────────────────────────────────────────────────────────────
  const finishSuccess = (uploaded) => {
    toast.success(`${uploaded} ${uploaded === 1 ? words.one : words.many} uploaded successfully`);
    queryClient.invalidateQueries({ queryKey: ['seller-products'] });
    queryClient.invalidateQueries({ queryKey: ['seller-products-for-upload'] });
    queryClient.invalidateQueries({ queryKey: ['product-keys'] });
    queryClient.invalidateQueries({ queryKey: ['my-offers'] });
    queryClient.invalidateQueries({ queryKey: ['license-offers'] });
    queryClient.invalidateQueries({ queryKey: ['offer-keys'] });
    onOpenChange(false);
  };

  // Poll the background upload job until it completes/fails.
  async function pollUploadStatus(productId, jobId) {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const MAX_ATTEMPTS = 600; // ~15 min at 1.5s intervals
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      if (pollCancelRef.current) return;
      await sleep(1500);
      if (pollCancelRef.current) return;

      let job;
      try {
        const res = await productAPI.getUploadKeysStatus(productId, jobId);
        job = res.data.data;
      } catch {
        continue; // transient error — keep polling
      }

      if (job?.progress) setProgress(job.progress);

      if (job?.state === 'completed') {
        setProcessing(false);
        setProgress(null);
        finishSuccess(job.result?.uploaded ?? 0);
        return;
      }
      if (job?.state === 'failed') {
        setProcessing(false);
        setProgress(null);
        toast.error(job.failedReason || `Failed to upload ${words.many}`);
        return;
      }
    }
    setProcessing(false);
    toast.message('Upload is still processing in the background. Check back shortly.');
    onOpenChange(false);
  }

  const uploadMutation = useMutation({
    // `productId` is the OFFER id — that is what the picker holds.
    mutationFn: ({ productId, keys }) => offerAPI.uploadOfferKeys(productId, keys),
    onSuccess: (data, variables) => {
      const result = data.data.data;
      // Background job (202) → poll for progress/completion.
      if (result?.jobId) {
        pollCancelRef.current = false;
        setProgress({ processed: 0, total: result.total || 0, inserted: 0 });
        setProcessing(true);
        pollUploadStatus(variables.productId, result.jobId);
        return;
      }
      finishSuccess(result.uploaded); // inline result (Redis unavailable)
    },
    onError: (err) => toast.error(err.response?.data?.message || `Failed to upload ${words.many}`),
  });

  const submit = () => {
    if (!selectedProductId || !rows.length) return;
    uploadMutation.mutate({ productId: selectedProductId, keys: rows.map((row) => row.data) });
  };

  const busy = uploadMutation.isPending || processing;

  const requestClose = () => {
    if (rows.length && !busy) {
      setConfirmDiscard(true);
      return;
    }
    onOpenChange(false);
  };

  const canLeaveStep1 = Boolean(selectedProductId && productType);

  return (
    <>
      <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : requestClose())}>
        <DialogContent size="lg" className="flex max-h-[90vh] flex-col gap-0 p-0">
          <DialogHeader className="px-6 pt-6 pb-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/15">
                <Upload className="w-5 h-5 text-accent-on-dark" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold">Upload Inventory</DialogTitle>
                <DialogDescription>
                  {step === 1
                    ? 'Choose the listing you want to add stock to.'
                    : step === 2
                      ? `Add ${words.many} one at a time, or upload a file.`
                      : 'Check everything, then submit.'}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <StepBar step={step} />

          {/* The chosen listing stays visible from step 2 on, as one line. */}
          {step > 1 && selectedProduct && (
            <div className="mx-6 mb-3 flex items-center justify-between gap-3 rounded-xl border border-accent/20 bg-accent/[0.04] px-3 py-2">
              <div className="flex min-w-0 items-center gap-2">
                <TypeIcon className="h-4 w-4 shrink-0 text-accent-on-dark" />
                <span className="truncate text-sm font-medium text-fg">{selectedProduct.name}</span>
                <span className="shrink-0 text-xs text-fg-muted">
                  · {words.title} · stock {selectedProduct.availableKeysCount || 0}
                </span>
              </div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 shrink-0 text-fg-muted hover:text-white"
                disabled={busy}
                onClick={() => setStep(1)}
              >
                Change
              </Button>
            </div>
          )}

          <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-4 space-y-5">
            {/* ── 1. which listing ── */}
            {step === 1 && (
              <>
                <SearchableSelect
                  options={products}
                  value={selectedProductId}
                  onValueChange={changeProduct}
                  // The server does the matching, across ALL of this seller's
                  // listings — not just the page already fetched.
                  serverSide
                  onSearchChange={setListingSearch}
                  loading={listingsQuery.isFetching}
                  placeholder="Search and select a listing..."
                  searchPlaceholder="Type to search listings..."
                  emptyMessage={listingsQuery.isFetching ? 'Searching…' : 'No listings found'}
                  label="Listing"
                  description="Search and select the listing you want to upload inventory for"
                  maxHeight="620px"
                  className="w-full"
                  getOptionLabel={(product) => `${product.name} (${deliveryWords(product.productType).title})`}
                  getOptionValue={(product) => product._id}
                  filterFunction={(product, searchQuery) => {
                    const query = searchQuery.toLowerCase();
                    return (
                      product.name?.toLowerCase().includes(query) ||
                      product.slug?.toLowerCase().includes(query) ||
                      product.productType?.toLowerCase().includes(query)
                    );
                  }}
                  renderOption={(product, isSelected) => (
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {product.images?.[0] && (
                          <SafeImage src={product.images[0]} alt={product.name} className="w-8 h-8 object-cover rounded flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-fg truncate">{product.name}</p>
                          <div className="flex items-center gap-2 text-xs text-fg-muted">
                            <span>{deliveryWords(product.productType).title}</span>
                            <span>•</span>
                            <span>Stock: {product.availableKeysCount || 0}</span>
                          </div>
                        </div>
                      </div>
                      {isSelected && <Check className="h-4 w-4 text-accent-on-dark ml-2 shrink-0" />}
                    </div>
                  )}
                />

                {selectedProduct && (
                  <div className="rounded-xl border border-accent/20 bg-accent/[0.04] p-4">
                    <div className="flex items-start gap-3">
                      <div className={`rounded-lg p-2.5 ${isAccount ? 'bg-green-500/20' : 'bg-blue-500/20'}`}>
                        <TypeIcon className={`h-5 w-5 ${isAccount ? 'text-success' : 'text-info'}`} />
                      </div>
                      <div className="flex-1">
                        <p className="mb-2 text-base font-bold text-fg">{selectedProduct.name}</p>
                        <div className="flex flex-wrap gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-fg-muted">Delivered as:</span>
                            <span className="font-medium text-fg">{words.title}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-fg-muted">Current stock:</span>
                            <span className="text-lg font-bold text-fg">{selectedProduct.availableKeysCount || 0}</span>
                          </div>
                          {selectedProduct.totalKeysCount !== undefined && (
                            <div className="flex items-center gap-2">
                              <span className="text-fg-muted">Total:</span>
                              <span className="font-medium text-fg">{selectedProduct.totalKeysCount}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {selectedProductId && !productType && (
                  <div className="rounded border border-yellow-700 bg-yellow-900/20 p-3">
                    <p className="text-xs text-warning">
                      Unable to detect the delivery type. Please ensure the product has a valid type set.
                    </p>
                  </div>
                )}
              </>
            )}

            {/* ── 2. add the items ── */}
            {step === 2 && productType && (
              <>
                <Tabs value={tab} onValueChange={setTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 border border-white/[0.08] bg-secondary">
                    <TabsTrigger value="add" className="text-gray-300 data-[state=active]:bg-accent data-[state=active]:text-white">
                      <ListPlus className="mr-2 h-4 w-4" /> Add {words.many}
                    </TabsTrigger>
                    <TabsTrigger value="import" className="text-gray-300 data-[state=active]:bg-accent data-[state=active]:text-white">
                      <FileUp className="mr-2 h-4 w-4" /> Upload file
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                {tab === 'add' ? (
                  isAccount ? (
                    <AccountEntryForm
                      // Remounts when switching between adding and editing a row,
                      // so the fields load without syncing props into state.
                      key={editingId || 'new-account'}
                      initialValue={editingRow?.data}
                      editing={!!editingRow}
                      onAdd={editingRow ? updateRow : addRow}
                      onCancelEdit={() => setEditingId(null)}
                    />
                  ) : (
                    <KeyEntryForm
                      key={editingId || 'new-key'}
                      productType={productType}
                      initialValue={editingRow?.data || ''}
                      editing={!!editingRow}
                      onAdd={editingRow ? updateRow : addRow}
                      onCancelEdit={() => setEditingId(null)}
                    />
                  )
                ) : (
                  <ImportPanel productType={productType} onAppend={appendRows} />
                )}

                <StagedInventoryList
                  rows={rows}
                  productType={productType}
                  editingId={editingId}
                  onEdit={startEdit}
                  onRemove={removeRow}
                  onClear={() => { setRows([]); setEditingId(null); }}
                />
              </>
            )}

            {/* ── 3. review and submit ── */}
            {step === 3 && productType && (
              <>
                <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] p-4">
                  <ClipboardCheck className="h-5 w-5 shrink-0 text-success" />
                  <div>
                    <p className="text-sm font-semibold text-fg">{countLabel} ready to upload</p>
                    <p className="mt-0.5 text-xs text-fg-muted">
                      Stock goes from {selectedProduct?.availableKeysCount || 0} to{' '}
                      {(selectedProduct?.availableKeysCount || 0) + rows.length}. Anything already uploaded is skipped.
                    </p>
                  </div>
                </div>

                <StagedInventoryList
                  rows={rows}
                  productType={productType}
                  editingId={editingId}
                  onEdit={startEdit}
                  onRemove={removeRow}
                  onClear={() => { setRows([]); setEditingId(null); }}
                />

                {processing && (
                  <div className="rounded-xl border border-accent/20 bg-accent/[0.04] p-4">
                    <div className="flex items-center gap-3">
                      <Loader2 className="h-5 w-5 shrink-0 animate-spin text-accent-on-dark" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-fg">Processing upload in the background…</p>
                        {progress?.total ? (
                          <>
                            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/[0.08]">
                              <div
                                className="h-full bg-accent transition-all"
                                style={{ width: `${Math.min(100, Math.round((progress.processed / progress.total) * 100))}%` }}
                              />
                            </div>
                            <p className="mt-1 text-xs text-fg-muted">
                              {progress.processed} / {progress.total} processed · {progress.inserted} added
                            </p>
                          </>
                        ) : (
                          <p className="mt-1 text-xs text-fg-muted">Starting…</p>
                        )}
                        <p className="mt-1 text-xs text-fg-subtle">You can close this dialog — the upload will continue.</p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer stays put: the way forward is always in the same place. */}
          <div className="flex items-center justify-between gap-4 border-t border-white/[0.06] px-6 py-4">
            <p className="text-xs text-fg-muted">{rows.length > 0 ? `${countLabel} ready` : ''}</p>
            <div className="flex gap-3">
              {step > 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  className="border-white/[0.08] px-5 text-fg-muted hover:bg-white/[0.06] hover:text-white"
                  disabled={busy}
                  onClick={() => setStep(step - 1)}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="border-white/[0.08] px-5 text-fg-muted hover:bg-white/[0.06] hover:text-white"
                  onClick={requestClose}
                >
                  Cancel
                </Button>
              )}

              {step < 3 ? (
                <Button
                  type="button"
                  className="min-w-[140px] bg-accent px-6 font-semibold shadow-lg shadow-accent/25 hover:bg-accent/90 disabled:opacity-40"
                  disabled={step === 1 ? !canLeaveStep1 : rows.length === 0}
                  onClick={() => setStep(step + 1)}
                >
                  {step === 1 ? 'Next' : `Review ${countLabel}`} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={submit}
                  disabled={busy || rows.length === 0}
                  className="min-w-[160px] bg-accent px-6 font-semibold shadow-lg shadow-accent/25 transition-all hover:bg-accent/90 disabled:opacity-40"
                >
                  {busy ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading…</>
                  ) : (
                    <><Upload className="mr-2 h-4 w-4" /> Submit {countLabel}</>
                  )}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmationModal
        open={confirmDiscard}
        onOpenChange={setConfirmDiscard}
        title="Discard what you added?"
        description={`${countLabel} have not been uploaded yet. Closing now loses them.`}
        confirmText="Discard"
        cancelText="Keep editing"
        variant="destructive"
        onConfirm={() => onOpenChange(false)}
      />
    </>
  );
};

export default BulkUploadModal;
