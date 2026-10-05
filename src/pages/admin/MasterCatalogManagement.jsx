import { useState, useEffect } from 'react';
import { extractList } from '@lib/apiList';
import { useNavigate } from 'react-router-dom';
import { keepPreviousData, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  masterCatalogAPI,
  categoryAPI,
  subcategoryAPI,
  platformAPI,
  genreAPI,
  modeAPI,
  deviceAPI,
  themeAPI,
} from '@services/api';
import { Button } from '@components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Input } from '@components/ui/input';
import { Label } from '@components/ui/label';
import { Textarea } from '@components/ui/textarea';
import { Badge } from '@components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@components/ui/dialog';
import { Loading, ErrorMessage } from '@components/ui/loading';
import SafeImage from '@components/ui/safe-image';
import {
  Package, Upload, Plus, Edit, Trash2, Eye, Tag,
  RefreshCw, FileJson,
} from 'lucide-react';
import { SearchInput } from '@components/common/SearchInput';
import { Pagination } from '@components/common/Pagination';

import { PRODUCT_TYPE_OPTIONS } from '@features/catalog/utils/productUtils';
import useCurrency from '@hooks/useCurrency';

// Products are imported in small batches so each request finishes well under the
// server's 15s request timeout — this lets a catalog of any size import without
// ERR_CONNECTION_RESET, and gives a live progress bar. Re-running is safe
// (idempotent dedup by kinguinId). Kept small so even on a high-latency / shared
// DB tier a single batch stays comfortably under the 15s timeout.
const BATCH_SIZE = 50;

// Robustly pull a list out of any of the taxonomy/list response shapes the
// backend uses ({ docs }, { genres }, { categories }, a bare array, …).

const EMPTY_FORM = {
  name: '', categoryId: '', subCategoryId: '', platform: '', genre: '',
  mode: '', device: '', theme: '', productType: 'LICENSE_KEY',
  publishers: '', developers: '', releaseDate: '', activationDetails: '',
  systemRequirements: '', description: '',
  // M21: a product can only become a pre-order here or on the edit screen.
  // The API has accepted both fields all along, but no screen ever sent them —
  // so no pre-order could be created, and the whole release / escrow /
  // auto-refund pipeline behind them was unreachable.
  isPreorder: false, preorderReleaseDate: '',
};

const selectCls = 'w-full bg-secondary border border-gray-700 text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent';

// Module-scoped so it isn't redefined every render (avoids subtree remount).
const TaxSelect = ({ label, value, onChange, options, placeholder }) => (
  <div className="space-y-1.5">
    <Label className="text-gray-300 text-sm">{label}</Label>
    <select value={value} onChange={onChange} className={selectCls}>
      <option value="">{placeholder || 'Select…'}</option>
      {options.map((o) => (
        <option key={o._id} value={o._id}>{o.name}</option>
      ))}
    </select>
  </div>
);

const MasterCatalogManagement = () => {
  const { format: formatMoney } = useCurrency();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ done: 0, total: 0 });

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [images, setImages] = useState([]);

  const [toDelete, setToDelete] = useState(null);

  // Debounce the search box (avoid firing on every keystroke).
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput.trim()); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  // ── Master catalog list ────────────────────────────────────────────────
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['master-catalog', page, search],
    queryFn: () =>
      masterCatalogAPI
        .listProducts({ page, limit: 10, ...(search ? { search } : {}) })
        .then((res) => res.data.data),
    placeholderData: keepPreviousData,
  });

  const products = data?.docs || [];
  const pagination = {
    page: data?.page || 1,
    totalPages: data?.totalPages || 1,
    totalDocs: data?.totalDocs || 0,
    limit: data?.limit || 10,
  };

  // ── Taxonomy dropdowns (one parallel fetch, only while the form is open) ─
  const { data: tax = {} } = useQuery({
    queryKey: ['catalog-taxonomy'],
    enabled: formOpen,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const [categories, platforms, genres, modes, devices, themes] = await Promise.all([
        categoryAPI.getCategories({ limit: 1000 }).then(extractList),
        platformAPI.getAllPlatforms({ limit: 1000 }).then(extractList),
        genreAPI.getGenres({ limit: 1000 }).then(extractList),
        modeAPI.getModes({ limit: 1000 }).then(extractList),
        deviceAPI.getDevices({ limit: 1000 }).then(extractList),
        themeAPI.getThemes({ limit: 1000 }).then(extractList),
      ]);
      return { categories, platforms, genres, modes, devices, themes };
    },
  });
  const categories = tax.categories || [];
  const platforms = tax.platforms || [];
  const genres = tax.genres || [];
  const modes = tax.modes || [];
  const devices = tax.devices || [];
  const themes = tax.themes || [];

  const { data: subcategories = [] } = useQuery({
    queryKey: ['tax', 'subcategories', form.categoryId],
    queryFn: () => subcategoryAPI.getSubcategoriesByCategoryId(form.categoryId, { limit: 1000 }).then(extractList),
    enabled: formOpen && !!form.categoryId,
    staleTime: 5 * 60 * 1000,
  });

  // ── Mutations ──────────────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: () => {
      if (editingId) {
        // Edit = text fields only (images managed separately).
        const payload = { ...form };
        return masterCatalogAPI.updateProduct(editingId, payload);
      }
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v !== '' && v != null) fd.append(k, v); });
      images.forEach((file) => fd.append('images', file));
      return masterCatalogAPI.createProduct(fd);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['master-catalog'] });
      toast.success(editingId ? 'Master product updated' : 'Master product created');
      closeForm();
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Save failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => masterCatalogAPI.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['master-catalog'] });
      toast.success('Master product deleted');
      setToDelete(null);
      if (products.length === 1 && page > 1) setPage(page - 1);
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Delete failed'),
  });

  // ── Handlers ───────────────────────────────────────────────────────────
  const openCreate = () => { setEditingId(null); setForm(EMPTY_FORM); setImages([]); setFormOpen(true); };

  const closeForm = () => { setFormOpen(false); setEditingId(null); setForm(EMPTY_FORM); setImages([]); };

  const runImport = async () => {
    if (!importFile) { toast.warning('Choose a .json file first'); return; }

    let items;
    try {
      items = JSON.parse(await importFile.text());
    } catch {
      toast.error('Selected file is not valid JSON');
      return;
    }
    if (!Array.isArray(items)) { toast.error('JSON must be an array of products'); return; }
    if (items.length === 0) { toast.warning('File has no products'); return; }

    setImporting(true);
    setImportResult(null);
    setImportProgress({ done: 0, total: items.length });

    const totals = { total: items.length, created: 0, updated: 0, skipped: 0, errors: [] };
    let processed = 0;
    try {
      for (let i = 0; i < items.length; i += BATCH_SIZE) {
        const batch = items.slice(i, i + BATCH_SIZE);
        const file = new File([JSON.stringify(batch)], 'batch.json', { type: 'application/json' });
        const fd = new FormData();
        fd.append('file', file);
        const res = await masterCatalogAPI.importCatalog(fd);
        const s = res.data?.data || {};
        totals.created += s.created || 0;
        totals.updated += s.updated || 0;
        totals.skipped += s.skipped || 0;
        if (Array.isArray(s.errors)) {
          // Re-base each batch-local index onto the whole-file position.
          s.errors.forEach((er) => totals.errors.push({ ...er, index: processed + (er.index ?? 0) }));
        }
        processed += batch.length;
        setImportProgress({ done: processed, total: items.length });
        setImportResult({ ...totals });
      }
      queryClient.invalidateQueries({ queryKey: ['master-catalog'] });
      toast.success(`Import done — ${totals.created} created, ${totals.updated} updated`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Import interrupted. Imported products are saved — re-run to continue.');
      setImportResult({ ...totals });
    } finally {
      setImporting(false);
    }
  };

  const submitForm = () => {
    if (!form.name.trim()) { toast.warning('Product name is required'); return; }
    if (!form.categoryId) { toast.warning('Category is required'); return; }
    // A pre-order with no release date can never release and never auto-refund,
    // so buyers' escrowed payments would sit held indefinitely. The API rejects
    // it too; this just says so before the round trip.
    if (form.isPreorder && !form.preorderReleaseDate) {
      toast.warning('A pre-order needs a release date');
      return;
    }
    saveMutation.mutate();
  };

  const setField = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  if (isLoading && !products.length) return <Loading message="Loading master catalog..." />;
  if (isError) return <ErrorMessage message={error?.response?.data?.message || 'Error loading catalog'} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-info/40 bg-info-soft text-info"><Package className="w-6 h-6" /></div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Master Catalog</h1>
            <p className="text-sm text-gray-400 mt-1">Create, import and manage master products. Sellers list offers against these.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="border-gray-700" onClick={() => { setImportOpen(true); setImportResult(null); setImportFile(null); }}>
            <Upload className="w-4 h-4 mr-2" /> Import JSON
          </Button>
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" /> Add Product
          </Button>
        </div>
      </div>

      <Card variant="hud">
        <CardHeader className="border-b border-info/15">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>
              {pagination.totalDocs} master {pagination.totalDocs === 1 ? 'product' : 'products'}
            </CardTitle>
            <SearchInput
              value={searchInput}
              onChange={setSearchInput}
              placeholder="Search products…"
              className="w-full sm:w-72"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {products.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-8 h-8 text-gray-500 mx-auto mb-3" />
              <p className="text-gray-400 font-medium">No master products yet</p>
              <p className="text-gray-500 text-sm mt-1">Import a JSON catalog or add a product to get started</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table variant="hud">
                  <TableHeader>
                    <TableRow className="border-gray-700 bg-secondary/30 hover:bg-secondary/30">
                      <TableHead className="text-gray-300 font-semibold">Product</TableHead>
                      <TableHead className="text-gray-300 font-semibold">Category</TableHead>
                      <TableHead className="text-gray-300 font-semibold">Platform</TableHead>
                      <TableHead className="text-gray-300 font-semibold">Type</TableHead>
                      <TableHead className="text-gray-300 font-semibold">Offers</TableHead>
                      <TableHead className="text-gray-300 font-semibold">From</TableHead>
                      <TableHead className="text-gray-300 font-semibold text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((p) => (
                      <TableRow key={p._id} className="border-gray-700 hover:bg-secondary/20">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {p.images?.length ? (
                              <SafeImage src={p.images[0]} alt={p.name} className="w-12 h-12 object-cover rounded-lg border border-gray-700" />
                            ) : (
                              <div className="w-12 h-12 bg-secondary/50 rounded-lg border border-gray-700 flex items-center justify-center">
                                <Package className="w-5 h-5 text-gray-500" />
                              </div>
                            )}
                            <div className="font-semibold text-white max-w-xs truncate">{p.name}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-gray-300">
                            <Tag className="w-4 h-4 text-gray-400" />{p.category?.name || p.categoryId?.name || 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-300">{p.platform?.name || '—'}</TableCell>
                        <TableCell><Badge variant="default" className="text-xs">{p.productType || '—'}</Badge></TableCell>
                        <TableCell>
                          <Badge variant={p.inStockOffersCount > 0 ? 'success' : 'default'}>
                            {p.offersCount || 0} {p.inStockOffersCount ? `(${p.inStockOffersCount} in stock)` : ''}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-white font-medium">
                          {p.lowestPrice != null ? formatMoney(p.lowestPrice) : '—'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 justify-end">
                            <Button size="sm" variant="outline" className="border-gray-700" title="View product & seller offers" onClick={() => navigate(`/admin/products/${p._id}`)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" className="border-gray-700" title="Edit" onClick={() => navigate(`/admin/catalog/${p._id}/edit`)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="destructive" className="border-red-800 hover:bg-red-700" title="Delete" onClick={() => setToDelete(p)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <Pagination page={page} totalPages={pagination.totalPages} onPageChange={setPage} />
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Import modal ── */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white text-xl font-semibold flex items-center gap-2">
              <FileJson className="w-5 h-5 text-accent-on-dark" /> Import Catalog (JSON)
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Upload a .json array. Missing categories/genres/etc. are auto-created. Re-importing the same file updates instead of duplicating (dedup by kinguinId).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <Input
              type="file" accept=".json,application/json"
              disabled={importing}
              onChange={(e) => { setImportFile(e.target.files?.[0] || null); setImportResult(null); }}
              className="bg-secondary border-gray-700 text-white file:text-gray-300"
            />
            {importing && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Importing…</span>
                  <span>{importProgress.done} / {importProgress.total}</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent transition-all"
                    style={{ width: `${importProgress.total ? Math.round((importProgress.done / importProgress.total) * 100) : 0}%` }}
                  />
                </div>
              </div>
            )}
            {importResult && (
              <div className="text-sm bg-secondary/50 border border-gray-700 rounded-lg p-3 space-y-1">
                <div className="flex gap-4">
                  <span className="text-green-400">Created: {importResult.created}</span>
                  <span className="text-blue-400">Updated: {importResult.updated}</span>
                  <span className="text-yellow-400">Skipped: {importResult.skipped}</span>
                  <span className="text-gray-400">Total: {importResult.total}</span>
                </div>
                {importResult.errors?.length > 0 && (
                  <div className="mt-2 max-h-32 overflow-y-auto text-xs text-gray-400">
                    {importResult.errors.slice(0, 20).map((er, i) => (
                      <div key={i}>• #{er.index} {er.name || ''} — {er.error}</div>
                    ))}
                    {importResult.errors.length > 20 && <div>…and {importResult.errors.length - 20} more</div>}
                  </div>
                )}
              </div>
            )}
            <div className="flex justify-end gap-3">
              <Button variant="outline" className="border-gray-700" disabled={importing} onClick={() => setImportOpen(false)}>Close</Button>
              <Button className="bg-accent hover:bg-blue-700" disabled={!importFile || importing} onClick={runImport}>
                {importing ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Importing…</> : <><Upload className="w-4 h-4 mr-2" />Import</>}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Create / Edit modal ── */}
      <Dialog open={formOpen} onOpenChange={(o) => (o ? setFormOpen(true) : closeForm())}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white text-xl font-semibold">{editingId ? 'Edit Master Product' : 'Add Master Product'}</DialogTitle>
            <DialogDescription className="text-gray-400">
              Meta title & description are auto-generated from name & description. {editingId ? 'Images are managed separately.' : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className="text-gray-300 text-sm">Product Name *</Label>
              <Input value={form.name} onChange={setField('name')} placeholder="e.g. Anno 2070 Ubisoft Connect CD Key" className="bg-secondary border-gray-700 text-white" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TaxSelect label="Category *" value={form.categoryId} onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value, subCategoryId: '' }))} options={categories} placeholder="Select category" />
              <TaxSelect label="Subcategory" value={form.subCategoryId} onChange={setField('subCategoryId')} options={subcategories} placeholder={form.categoryId ? 'Select subcategory' : 'Pick a category first'} />
              <TaxSelect label="Platform" value={form.platform} onChange={setField('platform')} options={platforms} />
              <TaxSelect label="Genre" value={form.genre} onChange={setField('genre')} options={genres} />
              <TaxSelect label="Mode" value={form.mode} onChange={setField('mode')} options={modes} />
              <TaxSelect label="Device" value={form.device} onChange={setField('device')} options={devices} />
              <TaxSelect label="Theme" value={form.theme} onChange={setField('theme')} options={themes} />
              <div className="space-y-1.5">
                <Label className="text-gray-300 text-sm">Product Type</Label>
                <select value={form.productType} onChange={setField('productType')} className={selectCls}>
                  {PRODUCT_TYPE_OPTIONS.map((t) => <option key={t._id} value={t._id}>{t.title}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-gray-300 text-sm">Release Date</Label>
                <Input type="date" value={form.releaseDate} onChange={setField('releaseDate')} className="bg-secondary border-gray-700 text-white" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-gray-300 text-sm">Publishers</Label>
                <Input value={form.publishers} onChange={setField('publishers')} className="bg-secondary border-gray-700 text-white" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-gray-300 text-sm">Developers</Label>
                <Input value={form.developers} onChange={setField('developers')} className="bg-secondary border-gray-700 text-white" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-gray-300 text-sm">Description</Label>
              <Textarea value={form.description} onChange={setField('description')} className="bg-secondary border-gray-700 text-white min-h-[90px]" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-gray-300 text-sm">Activation Details</Label>
              <Textarea value={form.activationDetails} onChange={setField('activationDetails')} className="bg-secondary border-gray-700 text-white min-h-[70px]" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-gray-300 text-sm">System Requirements</Label>
              <Textarea value={form.systemRequirements} onChange={setField('systemRequirements')} className="bg-secondary border-gray-700 text-white min-h-[70px]" />
            </div>

            {/* M21 — PRE-ORDER. Deliberately separated from the "Release Date"
                field above: that one is catalogue metadata, this one drives
                delivery, escrow and auto-refund. Confusing the two is exactly
                how a product ships without the pipeline behind it. */}
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/6 p-4">
              <div className="flex items-start gap-3">
                <input
                  id="createIsPreorder"
                  type="checkbox"
                  aria-label="Sell as a pre-order"
                  checked={form.isPreorder}
                  onChange={(e) => setForm((f) => ({ ...f, isPreorder: e.target.checked }))}
                  className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-amber-500"
                />
                <div className="min-w-0">
                  <label htmlFor="createIsPreorder" className="block cursor-pointer text-sm font-semibold text-amber-200">
                    Sell as a pre-order
                  </label>
                  <p className="mt-1 text-xs text-amber-100/70">
                    Buyers pay now and the money is held — no key is delivered until the
                    release date below. On that date the system delivers automatically and
                    the product becomes a standard listing. If no seller has stock within
                    24 hours of release, every buyer is refunded to their wallet.
                  </p>
                </div>
              </div>

              {form.isPreorder && (
                <div className="mt-4 max-w-xs space-y-1.5">
                  <Label className="text-gray-300 text-sm">
                    Release date<span className="text-red-400 ml-0.5">*</span>
                  </Label>
                  <Input type="date" value={form.preorderReleaseDate} onChange={setField('preorderReleaseDate')} className="bg-secondary border-gray-700 text-white" />
                  <p className="text-xs text-amber-100/60">
                    This is the date delivery fires on. Without it the pre-order can never
                    release, and buyers&apos; payments would stay held.
                  </p>
                </div>
              )}
            </div>

            {!editingId && (
              <div className="space-y-1.5">
                <Label className="text-gray-300 text-sm">Images</Label>
                <Input type="file" accept="image/*" multiple onChange={(e) => setImages(Array.from(e.target.files || []))} className="bg-secondary border-gray-700 text-white file:text-gray-300" />
                {images.length > 0 && <p className="text-xs text-gray-400">{images.length} image(s) selected</p>}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" className="border-gray-700" onClick={closeForm}>Cancel</Button>
              <Button className="bg-accent hover:bg-blue-700" disabled={saveMutation.isPending} onClick={submitForm}>
                {saveMutation.isPending ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Saving…</> : (editingId ? 'Update' : 'Create')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Delete confirm modal ── */}
      <Dialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white text-xl font-semibold">Delete Master Product</DialogTitle>
            <DialogDescription className="text-gray-400">
              This permanently removes the master product AND every seller offer + inventory under it. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {toDelete && (
            <div className="py-3 px-4 bg-secondary/50 rounded-lg border border-gray-700">
              <p className="text-white font-medium truncate">{toDelete.name}</p>
            </div>
          )}
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" className="border-gray-700" onClick={() => setToDelete(null)}>Cancel</Button>
            <Button variant="destructive" className="hover:bg-red-700" disabled={deleteMutation.isPending} onClick={() => deleteMutation.mutate(toDelete._id)}>
              {deleteMutation.isPending ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Deleting…</> : <><Trash2 className="w-4 h-4 mr-2" />Delete</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MasterCatalogManagement;
