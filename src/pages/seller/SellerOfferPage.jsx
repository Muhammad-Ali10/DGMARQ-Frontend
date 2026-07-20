import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { productAPI, offerAPI } from '@services/api';
import { Button } from '@components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Input } from '@components/ui/input';
import { Label } from '@components/ui/label';
import { Badge } from '@components/ui/badge';
import { Loading, ErrorMessage } from '@components/ui/loading';
import SafeImage from '@components/ui/safe-image';
import OfferRegionSelector from '@features/seller/components/OfferRegionSelector';
import useCurrency from '@hooks/useCurrency';
import { SUPPORTED_CURRENCIES } from '@lib/currencyDisplay';
import {
  getProductName,
  getPlatformName,
  getTypeName,
  getRegionName,
  PRODUCT_IMAGE_PLACEHOLDER,
} from '@features/catalog/utils/productUtils';
import { ArrowLeft, Lock, Package, RefreshCw } from 'lucide-react';
import '../dashboard-fx.css';

// A single read-only "spec" row for the locked product panel.
const Spec = ({ label, value }) =>
  value ? (
    <div className="flex items-start justify-between gap-4 border-b border-gray-800 py-2 last:border-0">
      <span className="text-sm text-gray-400">{label}</span>
      <span className="max-w-[60%] text-right text-sm font-medium text-white">{value}</span>
    </div>
  ) : null;

const nameOf = (v) => (typeof v === 'string' ? v : v?.name || '');
const listNames = (arr) =>
  Array.isArray(arr) ? arr.map(nameOf).filter(Boolean).join(', ') : '';

/**
 * Full-page seller offer form (replaces the old create/edit modals). The left
 * panel shows the master product's information — entirely READ-ONLY, since the
 * catalog is admin-owned — while the right panel holds the only things a seller
 * controls: price, discount, region availability, featured, account info.
 *
 * Routes: /seller/catalog/:productId/list (create) · /seller/offers/:offerId/edit (edit)
 */
const SellerOfferPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { productId: productIdParam, offerId } = useParams();
  const mode = offerId ? 'edit' : 'create';
  const { rates } = useCurrency(); // for the live "≈ USD" preview of the seller's price

  const [form, setForm] = useState({
    price: '',
    priceCurrency: 'USD',
    discount: '',
    regionCodes: [],
    countries: [],
    excludedCountries: [],
    isFeatured: false,
    accountEmail: '',
    accountWebsite: '',
  });
  const [seeded, setSeeded] = useState(false);
  const [activeImg, setActiveImg] = useState(0);

  // Edit mode: load the seller's own offer to seed the form + resolve the product.
  const offerQuery = useQuery({
    queryKey: ['seller-offer', offerId],
    queryFn: () => offerAPI.getOffer(offerId).then((r) => r.data.data),
    enabled: mode === 'edit',
  });
  const offer = offerQuery.data;

  const productId = mode === 'edit' ? offer?.productId?._id || offer?.productId : productIdParam;

  const productQuery = useQuery({
    queryKey: ['product-detail', productId],
    queryFn: () => productAPI.getProductById(productId).then((r) => r.data.data),
    enabled: !!productId,
  });
  const product = productQuery.data;

  // Seed the form once from the loaded offer (edit mode).
  useEffect(() => {
    if (mode === 'edit' && offer && !seeded) {
      setForm({
        // Show the seller their ORIGINAL input currency/amount when present, so
        // an edit round-trips (the USD `offer.price` is the frozen conversion).
        price: offer.sellerInputPrice ?? offer.price ?? '',
        priceCurrency: offer.sellerInputCurrency || 'USD',
        discount: offer.discount ?? '',
        regionCodes: offer.regionCodes || [],
        countries: offer.countries || [],
        excludedCountries: offer.excludedCountries || [],
        isFeatured: !!offer.isFeatured,
        accountEmail: offer.accountEmail || '',
        accountWebsite: offer.accountWebsite || '',
      });
      setSeeded(true);
    }
  }, [mode, offer, seeded]);

  const isAccount = product?.productType === 'ACCOUNT_BASED';
  const images = useMemo(
    () => (Array.isArray(product?.images) && product.images.length ? product.images : [PRODUCT_IMAGE_PLACEHOLDER]),
    [product]
  );

  const saveMutation = useMutation({
    mutationFn: (payload) =>
      mode === 'edit' ? offerAPI.updateOffer(offerId, payload) : offerAPI.createOffer(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-offers'] });
      queryClient.invalidateQueries({ queryKey: ['seller-catalog'] });
      toast.success(mode === 'edit' ? 'Offer updated' : 'Offer submitted for approval');
      navigate('/seller/offers');
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Save failed'),
  });

  const submit = () => {
    if (form.price === '' || Number(form.price) < 0 || Number.isNaN(Number(form.price))) {
      toast.warning('Enter a valid price');
      return;
    }
    const payload = {
      price: Number(form.price),
      priceCurrency: form.priceCurrency,
      discount: Number(form.discount) || 0,
      regionCodes: form.regionCodes,
      countries: form.countries,
      excludedCountries: form.excludedCountries,
      isFeatured: form.isFeatured,
      ...(isAccount
        ? { accountEmail: form.accountEmail || undefined, accountWebsite: form.accountWebsite || undefined }
        : {}),
    };
    if (mode === 'create') payload.productId = productId;
    saveMutation.mutate(payload);
  };

  if (mode === 'edit' && offerQuery.isLoading) return <Loading message="Loading offer…" />;
  if (mode === 'edit' && offerQuery.isError)
    return <ErrorMessage message={offerQuery.error?.response?.data?.message || 'Offer not found'} />;
  if (productQuery.isLoading) return <Loading message="Loading product…" />;
  if (productQuery.isError || !product)
    return <ErrorMessage message={productQuery.error?.response?.data?.message || 'Product not found'} />;

  return (
    <div className="dash-fx space-y-6 px-4 sm:px-0">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" className="border-gray-700" onClick={() => navigate('/seller/offers')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">
            {mode === 'edit' ? 'Edit offer' : 'List your offer'}
          </h1>
          <p className="mt-1 text-sm text-gray-400">{getProductName(product)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* ── Locked product info ─────────────────────────────────────────── */}
        <Card className="dash-card">
          <CardHeader className="dash-card-head flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-white">
              <Package className="h-5 w-5" /> Product details
            </CardTitle>
            <span className="inline-flex items-center gap-1 rounded-full border border-gray-700 bg-secondary/40 px-2.5 py-1 text-xs text-gray-400">
              <Lock className="h-3 w-3" /> Catalog-controlled
            </span>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Image gallery */}
            <div className="space-y-2">
              <SafeImage
                src={images[activeImg]}
                alt={getProductName(product)}
                className="h-56 w-full rounded-lg border border-gray-700 object-contain bg-secondary/30"
                fallbackSrc={PRODUCT_IMAGE_PLACEHOLDER}
              />
              {images.length > 1 && (
                <div className="flex flex-wrap gap-2">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setActiveImg(i)}
                      className={`h-12 w-12 overflow-hidden rounded border ${
                        i === activeImg ? 'border-accent' : 'border-gray-700'
                      }`}
                    >
                      <SafeImage src={img} alt="" className="h-full w-full object-cover" fallbackSrc={PRODUCT_IMAGE_PLACEHOLDER} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="default" className="text-xs">{getTypeName(product)}</Badge>
              {product.isPreorder && <Badge variant="warning" className="text-xs">Pre-order</Badge>}
            </div>

            {/* Specs */}
            <div>
              <Spec label="Platform" value={getPlatformName(product)} />
              <Spec label="Type" value={nameOf(product.type)} />
              <Spec label="Genre" value={nameOf(product.genre) || listNames(product.genres)} />
              <Spec label="Region (catalog)" value={getRegionName(product)} />
              <Spec label="Category" value={nameOf(product.categoryId) || nameOf(product.category)} />
              <Spec label="Sub-category" value={nameOf(product.subCategoryId) || nameOf(product.subCategory)} />
              <Spec label="Publisher" value={listNames(product.publishers)} />
              <Spec label="Device" value={nameOf(product.device) || listNames(product.devices)} />
            </div>

            {product.description && (
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-gray-300">Description</p>
                <div className="max-h-40 overflow-y-auto whitespace-pre-wrap rounded-md border border-gray-800 bg-secondary/20 p-3 text-sm text-gray-300">
                  {String(product.description).replace(/<[^>]*>/g, '').trim() || '—'}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Editable seller fields ──────────────────────────────────────── */}
        <Card className="dash-card">
          <CardHeader className="dash-card-head">
            <CardTitle className="text-lg font-semibold text-white">Your offer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm text-gray-300">Price *</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                    className="border-gray-700 bg-secondary text-white"
                  />
                  <select
                    value={form.priceCurrency}
                    onChange={(e) => setForm((f) => ({ ...f, priceCurrency: e.target.value }))}
                    className="shrink-0 rounded-md border border-gray-700 bg-secondary px-2 text-sm text-white outline-none"
                    aria-label="Price currency"
                  >
                    {SUPPORTED_CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>{c.code}</option>
                    ))}
                  </select>
                </div>
                {form.priceCurrency !== 'USD' && (
                  <p className="text-xs text-gray-400">
                    {rates?.[form.priceCurrency] > 0 && form.price !== '' && !Number.isNaN(Number(form.price))
                      ? `≈ $${(Number(form.price) / rates[form.priceCurrency]).toFixed(2)} USD — stored & charged in USD (frozen at save)`
                      : 'Stored & charged in USD, converted at save.'}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-gray-300">Discount (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={form.discount}
                  onChange={(e) => setForm((f) => ({ ...f, discount: e.target.value }))}
                  className="border-gray-700 bg-secondary text-white"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm text-gray-300">Region availability</Label>
              <OfferRegionSelector
                value={{ regionCodes: form.regionCodes, countries: form.countries, excludedCountries: form.excludedCountries }}
                onChange={(v) => setForm((f) => ({ ...f, ...v }))}
              />
            </div>

            {isAccount && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm text-gray-300">Account Email</Label>
                  <Input
                    value={form.accountEmail}
                    onChange={(e) => setForm((f) => ({ ...f, accountEmail: e.target.value }))}
                    className="border-gray-700 bg-secondary text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm text-gray-300">Website</Label>
                  <Input
                    value={form.accountWebsite}
                    onChange={(e) => setForm((f) => ({ ...f, accountWebsite: e.target.value }))}
                    className="border-gray-700 bg-secondary text-white"
                  />
                </div>
              </div>
            )}

            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input
                type="checkbox"
                aria-label="Feature this offer"
                checked={form.isFeatured}
                onChange={(e) => setForm((f) => ({ ...f, isFeatured: e.target.checked }))}
                className="accent-blue-600"
              />
              Feature this offer (higher commission applies)
            </label>

            <p className="text-xs text-gray-500">
              {mode === 'create'
                ? 'After approval you can add inventory (keys/accounts) from “My Offers”. Stock comes from your uploaded inventory.'
                : 'Manage inventory (keys/accounts) from the License Keys page.'}
            </p>

            <div className="flex justify-end gap-3 pt-1">
              <Button variant="outline" className="border-gray-700" onClick={() => navigate('/seller/offers')}>
                Cancel
              </Button>
              <Button className="bg-accent hover:bg-blue-700" disabled={saveMutation.isPending} onClick={submit}>
                {saveMutation.isPending ? (
                  <><RefreshCw className="mr-2 h-4 w-4 animate-spin" />{mode === 'edit' ? 'Saving…' : 'Submitting…'}</>
                ) : mode === 'edit' ? 'Save changes' : 'Submit for approval'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SellerOfferPage;
