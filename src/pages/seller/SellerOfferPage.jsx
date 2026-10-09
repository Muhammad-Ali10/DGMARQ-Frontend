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
import { FormSkeleton } from '@components/common/Skeletons';
import { ErrorState } from '@components/common/ErrorState';
import { SpecRow } from '@components/common/SpecList';
import { PreorderBadge, isActivePreorder, formatReleaseDate } from '@components/common/PreorderBadge';
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
import { ArrowLeft, CalendarClock, Lock, Package, RefreshCw } from 'lucide-react';

const Spec = ({ label, value }) =>
  value ? <SpecRow label={label} value={<span className="max-w-[60%]">{value}</span>} /> : null;

const nameOf = (v) => (typeof v === 'string' ? v : v?.name || '');

const SellerOfferPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { productId: productIdParam, offerId } = useParams();
  const mode = offerId ? 'edit' : 'create';
  const { rates } = useCurrency();

  const [form, setForm] = useState({
    price: '',
    priceCurrency: 'USD',
    discount: '',
    regionCodes: [],
    countries: [],
    excludedCountries: [],
  });
  const [seeded, setSeeded] = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  const [preorderAck, setPreorderAck] = useState(false);

  const offerQuery = useQuery({
    queryKey: ['seller-offer', offerId],
    queryFn: () => offerAPI.getOffer(offerId).then((r) => r.data.data),
    enabled: mode === 'edit',
    refetchOnMount: 'always',
  });
  const offer = offerQuery.data;

  const productId = mode === 'edit' ? offer?.productId?._id || offer?.productId : productIdParam;

  const productQuery = useQuery({
    queryKey: ['product-detail', productId],
    queryFn: () => productAPI.getProductById(productId).then((r) => r.data.data),
    enabled: !!productId,
  });
  const product = productQuery.data;

  useEffect(() => {
    if (mode === 'edit' && offer && offerQuery.isFetchedAfterMount && !seeded) {
      setForm({
        price: offer.sellerInputPrice ?? offer.price ?? '',
        priceCurrency: offer.sellerInputCurrency || 'USD',
        discount: offer.discount ?? '',
        regionCodes: offer.regionCodes || [],
        countries: offer.countries || [],
        excludedCountries: offer.excludedCountries || [],
      });
      setSeeded(true);
    }
  }, [mode, offer, offerQuery.isFetchedAfterMount, seeded]);

  const isPreorder = isActivePreorder(product);
  const releaseDateLabel = formatReleaseDate(product?.preorderReleaseDate);
  const images = useMemo(
    () => (Array.isArray(product?.images) && product.images.length ? product.images : [PRODUCT_IMAGE_PLACEHOLDER]),
    [product]
  );

  const saveMutation = useMutation({
    mutationFn: (payload) =>
      mode === 'edit' ? offerAPI.updateOffer(offerId, payload) : offerAPI.createOffer(payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['my-offers'] });
      queryClient.invalidateQueries({ queryKey: ['seller-catalog'] });
      queryClient.invalidateQueries({ queryKey: ['seller-offers-overview'] });
      queryClient.invalidateQueries({ queryKey: ['seller-offer', offerId] });
      toast.success(res?.data?.message || (mode === 'edit' ? 'Offer updated' : 'Offer submitted for approval'));
      navigate('/seller/offers');
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Save failed'),
  });

  const submit = () => {
    if (form.price === '' || Number(form.price) < 0 || Number.isNaN(Number(form.price))) {
      toast.warning('Enter a valid price');
      return;
    }
    if (mode === 'create' && isPreorder && !preorderAck) {
      toast.warning('Please confirm you understand the pre-order obligations first');
      return;
    }
    const payload = {
      price: Number(form.price),
      priceCurrency: form.priceCurrency,
      discount: Number(form.discount) || 0,
      regionCodes: form.regionCodes,
      countries: form.countries,
      excludedCountries: form.excludedCountries,
    };
    if (mode === 'create') payload.productId = productId;
    saveMutation.mutate(payload);
  };

  if (mode === 'edit' && offerQuery.isError) {
    return (
      <ErrorState
        error={offerQuery.error}
        title="Couldn't load this listing"
        onRetry={() => offerQuery.refetch()}
      />
    );
  }
  if (mode === 'edit' && !seeded) return <FormSkeleton fields={4} />;
  if (productQuery.isLoading) return <FormSkeleton fields={4} />;
  if (productQuery.isError || !product) {
    return (
      <ErrorState
        error={productQuery.error}
        title="Couldn't load this product"
        description="It may have been removed from the catalog since you opened this page."
        onRetry={() => productQuery.refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" className="border-border" onClick={() => navigate('/seller/offers')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-fg sm:text-3xl">
            {mode === 'edit' ? 'Edit offer' : 'List your offer'}
          </h1>
          <p className="mt-1 text-sm text-fg-muted">{getProductName(product)}</p>
        </div>
      </div>

      {isPreorder && (
        <div className="rounded-xl border border-warning/40 bg-warning-soft p-5">
          <div className="flex items-start gap-3">
            <CalendarClock aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-warning" />
            <div className="min-w-0 space-y-3">
              <div>
                <h2 className="text-sm font-semibold text-warning">
                  This is a pre-order{releaseDateLabel ? ` — it releases on ${releaseDateLabel}` : ''}
                </h2>
                <p className="mt-1 text-sm text-fg-muted">
                  Listing it is a commitment to deliver on that date. Read this before you continue.
                </p>
              </div>
              <ul className="space-y-1.5 text-sm text-fg-muted">
                <li>
                  <strong className="text-fg">Buyers pay now, you are paid later.</strong> The money is
                  held — no key is claimed at purchase and no payout is scheduled until delivery.
                </li>
                <li>
                  <strong className="text-fg">Your stock must be ready on release day.</strong> Keys are
                  assigned automatically the moment the product releases.
                </li>
                <li>
                  <strong className="text-fg">Miss it by 24 hours and every buyer is refunded</strong> to
                  their wallet automatically. You are notified, you keep nothing, and the sale is gone.
                </li>
                <li>
                  <strong className="text-fg">Buyers may cancel any time before release</strong> for a full
                  refund, so the order is not final until it ships.
                </li>
              </ul>
              {mode === 'create' && (
                <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-warning/30 bg-surface-sunken/40 p-3">
                  <input
                    type="checkbox"
                    aria-label="I understand the pre-order obligations"
                    checked={preorderAck}
                    onChange={(e) => setPreorderAck(e.target.checked)}
                    className="mt-0.5 size-4 shrink-0 accent-warning"
                  />
                  <span className="text-sm text-fg">
                    I understand I must have stock ready by{' '}
                    {releaseDateLabel || 'the release date'}, and that buyers are auto-refunded if I
                    don&apos;t.
                  </span>
                </label>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card variant="hud">
          <CardHeader className="border-b border-info/15 flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" /> Product details
            </CardTitle>
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary/40 px-2.5 py-1 text-xs text-fg-muted">
              <Lock className="h-3 w-3" /> Catalog-controlled
            </span>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <SafeImage
                src={images[activeImg]}
                alt={getProductName(product)}
                className="h-56 w-full rounded-lg border border-border object-contain bg-secondary/30"
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
                        i === activeImg ? 'border-accent' : 'border-border'
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
              <PreorderBadge product={product} className="text-xs" />
            </div>

            <div>
              <Spec label="Platform" value={getPlatformName(product)} />
              <Spec label="Genre" value={nameOf(product.genre)} />
              <Spec label="Region (catalog)" value={getRegionName(product)} />
              <Spec label="Category" value={nameOf(product.categoryId)} />
              <Spec label="Sub-category" value={nameOf(product.subCategoryId)} />
              <Spec label="Publisher" value={nameOf(product.publishers)} />
              <Spec label="Device" value={nameOf(product.device)} />
            </div>

            {product.description && (
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-fg-muted">Description</p>
                <div className="max-h-40 overflow-y-auto whitespace-pre-wrap rounded-md border border-border bg-secondary/20 p-3 text-sm text-fg-muted">
                  {String(product.description).replace(/<[^>]*>/g, '').trim() || '—'}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card variant="hud">
          <CardHeader className="border-b border-info/15">
            <CardTitle>Your offer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm text-fg-muted">Price *</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                    className="border-border bg-secondary text-fg"
                  />
                  <select
                    value={form.priceCurrency}
                    onChange={(e) => setForm((f) => ({ ...f, priceCurrency: e.target.value }))}
                    className="shrink-0 rounded-md border border-border bg-secondary px-2 text-sm text-fg outline-none"
                    aria-label="Price currency"
                  >
                    {SUPPORTED_CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>{c.code}</option>
                    ))}
                  </select>
                </div>
                {form.priceCurrency !== 'USD' && (
                  <p className="text-xs text-fg-muted">
                    {rates?.[form.priceCurrency] > 0 && form.price !== '' && !Number.isNaN(Number(form.price))
                      ? `≈ $${(Number(form.price) / rates[form.priceCurrency]).toFixed(2)} USD — stored & charged in USD (frozen at save)`
                      : 'Stored & charged in USD, converted at save.'}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-fg-muted">Discount (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={form.discount}
                  onChange={(e) => setForm((f) => ({ ...f, discount: e.target.value }))}
                  className="border-border bg-secondary text-fg"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm text-fg-muted">Region availability</Label>
              <OfferRegionSelector
                value={{ regionCodes: form.regionCodes, countries: form.countries, excludedCountries: form.excludedCountries }}
                onChange={(v) => setForm((f) => ({ ...f, ...v }))}
              />
            </div>

            <p className="text-xs text-fg-subtle">
              {mode === 'create'
                ? 'You can upload inventory (keys/accounts) on the Inventory page straight away. Stock comes from your uploaded inventory, and the listing goes on sale once an admin approves it.'
                : 'Manage inventory (keys/accounts) from the License Keys page.'}
            </p>

            <div className="flex justify-end gap-3 pt-1">
              <Button variant="outline" className="border-border" onClick={() => navigate('/seller/offers')}>
                Cancel
              </Button>
              <Button className="" disabled={saveMutation.isPending} onClick={submit}>
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
