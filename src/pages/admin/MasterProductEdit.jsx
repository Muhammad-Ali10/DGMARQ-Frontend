import { useState, useEffect, useRef } from 'react';
import { fetchAllPages } from '@lib/apiList';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  productAPI,
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
import { Loading, ErrorMessage } from '@components/ui/loading';
import SafeImage from '@components/ui/safe-image';
import {
  ArrowLeft, RefreshCw, Save, X, ImagePlus, Package, FileText, Globe, Tags, Lock, Image as ImageIcon,
} from 'lucide-react';

import { ConfirmationModal } from '@components/common/ConfirmationModal';
import { PRODUCT_TYPE_OPTIONS } from '@features/catalog/utils/productUtils';

const inputCls = 'bg-secondary border-gray-700 text-white focus-visible:ring-accent/40';
const selectCls = 'w-full bg-secondary border border-gray-700 text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/50 transition';

const Section = ({ icon: Icon, title, desc, children, className = '' }) => (
  <Card variant="hud" className={className}>
    <CardHeader className="border-b border-gray-700/70 py-4">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-accent/15 text-accent-on-dark shrink-0">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <CardTitle>{title}</CardTitle>
          {desc && <p className="text-xs text-gray-400 mt-0.5">{desc}</p>}
        </div>
      </div>
    </CardHeader>
    <CardContent className="pt-5 space-y-4">{children}</CardContent>
  </Card>
);

const Field = ({ label, required, hint, children }) => (
  <div className="space-y-1.5">
    <Label className="text-gray-300 text-sm font-medium">
      {label}{required && <span className="text-red-400 ml-0.5">*</span>}
    </Label>
    {children}
    {hint && <p className="text-xs text-gray-500">{hint}</p>}
  </div>
);

const TaxSelect = ({ label, value, onChange, options, placeholder, required }) => (
  <Field label={label} required={required}>
    <select value={value} onChange={onChange} className={selectCls}>
      <option value="">{placeholder || 'Select…'}</option>
      {options.map((o) => (
        <option key={o._id} value={o._id}>{o.name}</option>
      ))}
    </select>
  </Field>
);

const autoMetaTitle = (name) => `${String(name ?? '').trim()} | Buy cheap on DGMARQ`.slice(0, 120);
const autoMetaDescription = (description) => String(description ?? '').replace(/\s+/g, ' ').trim().slice(0, 160);
const customOnly = (stored, auto) => (stored && stored !== auto ? stored : '');

const EMPTY_FORM = {
  name: '', categoryId: '', subCategoryId: '', platform: '', genre: '',
  mode: '', device: '', theme: '', productType: 'LICENSE_KEY',
  publishers: '', developers: '', releaseDate: '', activationDetails: '',
  systemRequirements: '', description: '', metaTitle: '', metaDescription: '',
  isPreorder: false, preorderReleaseDate: '',
};

const MasterProductEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(EMPTY_FORM);
  const [newImages, setNewImages] = useState([]);
  const [replacingImages, setReplacingImages] = useState(false);
  const [replaceConfirmOpen, setReplaceConfirmOpen] = useState(false);
  const [removedPublicIds, setRemovedPublicIds] = useState([]);
  const [newImagePreviews, setNewImagePreviews] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const urls = newImages.map((file) => URL.createObjectURL(file));
    setNewImagePreviews(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [newImages]);

  const onPickImages = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length) setNewImages((prev) => [...prev, ...files]);
    e.target.value = '';
  };

  const { data: product, isLoading, isError, error } = useQuery({
    queryKey: ['master-product-edit', id],
    queryFn: () => productAPI.getProductById(id).then((res) => res.data.data),
    enabled: !!id,
  });

  const { data: tax = {} } = useQuery({
    queryKey: ['catalog-taxonomy'],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const [categories, platforms, genres, modes, devices, themes] = await Promise.all([
        fetchAllPages(categoryAPI.getCategories),
        fetchAllPages(platformAPI.getAllPlatforms),
        fetchAllPages(genreAPI.getGenres),
        fetchAllPages(modeAPI.getModes),
        fetchAllPages(deviceAPI.getDevices),
        fetchAllPages(themeAPI.getThemes),
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
    queryKey: ['tax-subcategories', form.categoryId],
    queryFn: () => fetchAllPages((params) => subcategoryAPI.getSubcategoriesByCategoryId(form.categoryId, params)),
    enabled: !!form.categoryId,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!product) return;
    setForm({
      name: product.name || '',
      categoryId: product.categoryId?._id || product.categoryId || product.category?._id || '',
      subCategoryId: product.subCategoryId?._id || product.subCategoryId || product.subCategory?._id || '',
      platform: product.platform?._id || product.platform || '',
      genre: product.genre?._id || product.genre || '',
      mode: product.mode?._id || product.mode || '',
      device: product.device?._id || product.device || '',
      theme: product.theme?._id || product.theme || '',
      productType: product.productType || 'LICENSE_KEY',
      publishers: product.publishers || '',
      developers: product.developers || '',
      releaseDate: product.releaseDate ? String(product.releaseDate).slice(0, 10) : '',
      activationDetails: product.activationDetails || '',
      systemRequirements: product.systemRequirements || '',
      description: product.description || '',
      metaTitle: customOnly(product.metaTitle, autoMetaTitle(product.name)),
      metaDescription: customOnly(product.metaDescription, autoMetaDescription(product.description)),
      isPreorder: !!product.isPreorder,
      preorderReleaseDate: product.preorderReleaseDate
        ? String(product.preorderReleaseDate).slice(0, 10)
        : '',
    });
  }, [product]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      await masterCatalogAPI.updateProduct(id, form);
      if (newImages.length > 0 || removedPublicIds.length > 0) {
        const fd = new FormData();
        newImages.forEach((file) => fd.append('images', file));
        removedPublicIds.forEach((pid) => fd.append('removeImages', pid));
        if (replacingImages) fd.append('confirmReplace', 'true');
        await productAPI.updateProductImages(id, fd);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['master-catalog'] });
      queryClient.invalidateQueries({ queryKey: ['master-product-edit', id] });
      toast.success('Master product updated');
      navigate('/admin/catalog');
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Save failed'),
  });

  const setField = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = () => {
    if (!form.name.trim()) { toast.warning('Product name is required'); return; }
    if (!form.categoryId) { toast.warning('Category is required'); return; }
    if (form.isPreorder && !form.preorderReleaseDate) {
      toast.warning('A pre-order needs a release date — that is what triggers delivery.');
      return;
    }
    saveMutation.mutate();
  };

  if (isLoading) return <Loading message="Loading product..." />;
  if (isError) return <ErrorMessage message={error?.response?.data?.message || 'Error loading product'} />;

  const imagesLocked = !!product?.imagesLocked;
  const imagesEditable = !imagesLocked || replacingImages;

  const visibleCount = (product?.images || []).filter((_, i) => {
    const pid = product?.publicId?.[i];
    return !(pid && removedPublicIds.includes(pid));
  }).length + newImages.length;

  const metaTitlePreview = form.metaTitle || autoMetaTitle(form.name || 'Product');
  const metaDescPreview = form.metaDescription || autoMetaDescription(form.description) || 'Product description for search engines…';

  const SaveButtons = ({ size }) => (
    <>
      <Button variant="outline" className="border-gray-700" size={size} onClick={() => navigate('/admin/catalog')}>Cancel</Button>
      <Button className="bg-accent hover:bg-blue-700 shadow-lg shadow-accent/20" size={size} disabled={saveMutation.isPending} onClick={submit}>
        {saveMutation.isPending ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Saving…</> : <><Save className="w-4 h-4 mr-2" />Save changes</>}
      </Button>
    </>
  );

  return (
    <div className="pb-24">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="outline" size="icon" className="border-gray-700 shrink-0" onClick={() => navigate('/admin/catalog')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wide text-accent-on-dark/80 font-medium">Master Catalog</p>
            <h1 className="text-xl sm:text-2xl font-bold text-white truncate">{form.name || 'Edit Master Product'}</h1>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          <SaveButtons />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6">
          <Section icon={Package} title="Basic information" desc="Shared across every seller offer for this product.">
            {product?.externalId && (
              <p className="rounded-lg border border-white/10 bg-surface-sunken/60 px-3 py-2 text-xs text-fg-muted">
                Imported from the catalog file. Re-importing this product refreshes the fields it
                carries — images and anything the file omits are left alone.
              </p>
            )}
            <Field label="Product name" required>
              <Input value={form.name} onChange={setField('name')} placeholder="e.g. Anno 2070 Ubisoft Connect CD Key" className={inputCls} />
            </Field>
            <Field label="Description">
              <Textarea value={form.description} onChange={setField('description')} className={`${inputCls} min-h-[120px]`} placeholder="What is this product about?" />
            </Field>
          </Section>

          <Section icon={FileText} title="Details" desc="Publisher, developer, release & activation info.">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Publishers"><Input value={form.publishers} onChange={setField('publishers')} className={inputCls} /></Field>
              <Field label="Developers"><Input value={form.developers} onChange={setField('developers')} className={inputCls} /></Field>
              <Field label="Release date"><Input type="date" value={form.releaseDate} onChange={setField('releaseDate')} className={inputCls} /></Field>
            </div>
            <Field label="Activation details">
              <Textarea value={form.activationDetails} onChange={setField('activationDetails')} className={`${inputCls} min-h-[80px]`} />
            </Field>
            <Field label="System requirements">
              <Textarea value={form.systemRequirements} onChange={setField('systemRequirements')} className={`${inputCls} min-h-[80px]`} />
            </Field>

            <div className="rounded-lg border border-amber-500/30 bg-amber-500/6 p-4">
              <div className="flex items-start gap-3">
                <input
                  id="isPreorder"
                  type="checkbox"
                  aria-label="Sell as a pre-order"
                  checked={form.isPreorder}
                  onChange={(e) => setForm((f) => ({ ...f, isPreorder: e.target.checked }))}
                  className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-amber-500"
                />
                <div className="min-w-0">
                  <label htmlFor="isPreorder" className="block cursor-pointer text-sm font-semibold text-amber-200">
                    Sell as a pre-order
                  </label>
                  <p className="mt-1 text-xs text-amber-100/70">
                    Buyers pay now and the money is held — no key is delivered until the
                    release date below. On that date the system delivers automatically and
                    the product becomes a standard listing. If no seller has stock within
                    24 hours of release, every buyer is refunded to their wallet.
                    Turning this off on a live pre-order releases it immediately.
                  </p>
                </div>
              </div>

              {form.isPreorder && (
                <div className="mt-4 max-w-xs">
                  <Field label="Release date" required>
                    <Input
                      type="date"
                      value={form.preorderReleaseDate}
                      onChange={setField('preorderReleaseDate')}
                      className={inputCls}
                    />
                  </Field>
                  <p className="mt-1.5 text-xs text-amber-100/60">
                    This is the date delivery fires on. Without it the pre-order can never
                    release, and buyers&apos; payments would stay held.
                  </p>
                </div>
              )}
            </div>
          </Section>

          <Section icon={Globe} title="Search & SEO" desc="Leave blank to auto-generate from name & description.">
            <div className="rounded-lg border border-gray-700 bg-secondary/40 p-3.5">
              <p className="text-[11px] uppercase tracking-wide text-gray-500 mb-1.5">Search preview</p>
              <p className="text-[#8ab4f8] text-[15px] leading-snug truncate">{metaTitlePreview}</p>
              <p className="text-[#3fa672] text-xs mt-0.5 truncate">dgmarq.com › products › {product?.slug || 'product'}</p>
              <p className="text-gray-400 text-xs mt-1 line-clamp-2">{metaDescPreview}</p>
            </div>
            <Field label="Meta title" hint={`${(form.metaTitle || '').length}/120 characters`}>
              <Input value={form.metaTitle} onChange={setField('metaTitle')} maxLength={120} placeholder="{Product Name} | Buy cheap on DGMARQ" className={inputCls} />
            </Field>
            <Field label="Meta description" hint={`${(form.metaDescription || '').length}/160 characters`}>
              <Textarea value={form.metaDescription} onChange={setField('metaDescription')} maxLength={160} placeholder="Short description for search engines" className={`${inputCls} min-h-[70px]`} />
            </Field>
          </Section>
        </div>

        <div className="space-y-6 lg:sticky lg:top-2">
          <Section icon={ImageIcon} title="Media" desc={`${visibleCount} of 5 images`}>
            {imagesLocked && !replacingImages && (
              <div className="flex items-start gap-2 rounded-lg border border-white/10 bg-surface-sunken/60 px-3 py-2.5 text-xs text-fg-muted">
                <Lock aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-fg-subtle" />
                <div className="min-w-0">
                  <p className="font-medium text-fg">Images are final for this product</p>
                  <p className="mt-0.5">Every offer on this master shows them.</p>
                  <button
                    type="button"
                    onClick={() => setReplaceConfirmOpen(true)}
                    className="mt-1.5 font-medium text-accent-on-dark underline underline-offset-4 hover:text-accent-on-dark/80"
                  >
                    Replace images
                  </button>
                </div>
              </div>
            )}
            {!imagesLocked && (product?.images || []).length === 0 && (
              <div className="flex items-start gap-2 rounded-lg border border-warning/40 bg-warning-soft px-3 py-2.5 text-xs text-fg">
                <ImagePlus aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-warning" />
                <div className="min-w-0">
                  <p className="font-medium">This product was imported without images</p>
                  <p className="mt-0.5 text-fg-muted">
                    Upload up to 5. They become final for this product once you save.
                  </p>
                </div>
              </div>
            )}
            <div className="grid grid-cols-3 gap-3">
              {(product?.images || []).map((img, i) => {
                const pid = product?.publicId?.[i];
                if (pid && removedPublicIds.includes(pid)) return null;
                return (
                  <div key={i} className="relative group aspect-square">
                    <SafeImage src={img} alt={`${product.name} ${i + 1}`} className="w-full h-full object-cover rounded-lg border border-gray-700" />
                    {pid && imagesEditable && (
                      <button type="button" onClick={() => setRemovedPublicIds((prev) => [...prev, pid])} className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-700 text-white rounded-full w-5 h-5 flex items-center justify-center shadow" title="Remove image">
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })}
              {newImages.map((file, i) => (
                <div key={`new-${i}`} className="relative aspect-square">
                  <img src={newImagePreviews[i]} alt={`new ${i + 1}`} className="w-full h-full object-cover rounded-lg border-2 border-accent/70" />
                  <span className="absolute bottom-1 left-1 text-[9px] px-1 rounded bg-accent/80 text-white">new</span>
                  <button type="button" onClick={() => setNewImages((prev) => prev.filter((_, idx) => idx !== i))} className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-700 text-white rounded-full w-5 h-5 flex items-center justify-center shadow" title="Remove">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {imagesEditable && visibleCount < 5 && (
                <button type="button" onClick={() => fileInputRef.current?.click()} className="aspect-square rounded-lg border-2 border-dashed border-gray-600 flex flex-col items-center justify-center text-gray-400 hover:border-accent hover:text-accent-on-dark hover:bg-accent/5 cursor-pointer transition">
                  <ImagePlus className="w-5 h-5" />
                  <span className="text-[10px] mt-1 font-medium">Add</span>
                </button>
              )}
            </div>
            <input ref={fileInputRef} type="file" aria-label="Add product images" accept="image/*" multiple className="hidden" onChange={onPickImages} />
            {imagesEditable && (
              <p className="text-xs text-gray-500">
                Up to 5 images. Changes apply when you save
                {replacingImages ? ' and are recorded in the audit log.' : ', and are final once saved.'}
              </p>
            )}
          </Section>

          <Section icon={Tags} title="Classification">
            <TaxSelect label="Category" required value={form.categoryId} onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value, subCategoryId: '' }))} options={categories} placeholder="Select category" />
            <TaxSelect label="Subcategory" value={form.subCategoryId} onChange={setField('subCategoryId')} options={subcategories} placeholder={form.categoryId ? 'Select subcategory' : 'Pick a category first'} />
            <div className="grid grid-cols-2 gap-3">
              <TaxSelect label="Platform" value={form.platform} onChange={setField('platform')} options={platforms} />
              <TaxSelect label="Genre" value={form.genre} onChange={setField('genre')} options={genres} />
              <TaxSelect label="Mode" value={form.mode} onChange={setField('mode')} options={modes} />
              <TaxSelect label="Device" value={form.device} onChange={setField('device')} options={devices} />
              <TaxSelect label="Theme" value={form.theme} onChange={setField('theme')} options={themes} />
            </div>
            <Field label="Product type">
              <select value={form.productType} onChange={setField('productType')} className={selectCls}>
                {PRODUCT_TYPE_OPTIONS.map((t) => <option key={t._id} value={t._id}>{t.title}</option>)}
              </select>
            </Field>
          </Section>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 lg:left-64 right-0 z-30 bg-primary/90 backdrop-blur border-t border-gray-700 px-4 md:px-8 py-3">
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs text-gray-500 hidden sm:block truncate">Editing <span className="text-gray-300">{form.name || 'master product'}</span></p>
          <div className="flex items-center gap-2 ml-auto">
            <SaveButtons />
          </div>
        </div>
      </div>

      <ConfirmationModal
        open={replaceConfirmOpen}
        onOpenChange={setReplaceConfirmOpen}
        title="Replace catalog images?"
        description="These images appear on every seller's offer for this product. Replacing them is recorded in the audit log."
        confirmText="Replace images"
        variant="destructive"
        onConfirm={() => setReplacingImages(true)}
      />
    </div>
  );
};

export default MasterProductEdit;
