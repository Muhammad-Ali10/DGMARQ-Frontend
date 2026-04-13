import { useState, useEffect, useMemo, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { returnRefundAPI } from '../services/api';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { SearchableSelect } from './ui/searchable-select';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { X, Loader2, AlertCircle, CheckCircle2, ShoppingBag, Package, FileText } from 'lucide-react';
import SafeImage from './ui/safe-image';

const REFUND_REASONS = [
  'Product not working',
  'Wrong product received',
  'Product damaged',
  'Not as described',
  'Duplicate purchase',
  'Changed my mind',
  'Other',
];

const REFUND_METHODS = [
  { value: 'WALLET', label: 'Refund to Wallet', description: 'Credit will be added to your account for future purchases.' },
  { value: 'ORIGINAL_PAYMENT', label: 'Admin will Refund Through the Original Payment Method', description: 'Refund will be processed to the original payment method.' },
];

const RefundRequestModal = ({ open, onOpenChange }) => {
  const queryClient = useQueryClient();
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [refundMethod, setRefundMethod] = useState('WALLET');
  const [selectedLicenseKeyIds, setSelectedLicenseKeyIds] = useState([]);
  const [evidenceFiles, setEvidenceFiles] = useState([]);
  const [errors, setErrors] = useState({});

  // Refund type: regular vs guest purchase
  const [refundType, setRefundType] = useState('REGULAR'); // 'REGULAR' | 'GUEST'
  const [guestPurchaseEmail, setGuestPurchaseEmail] = useState('');
  const [guestOrderNumber, setGuestOrderNumber] = useState('');
  const [guestOrder, setGuestOrder] = useState(null);
  const [guestSelectedProductId, setGuestSelectedProductId] = useState('');
  const [guestSelectedKeyIds, setGuestSelectedKeyIds] = useState([]);
  const [validatingGuestOrder, setValidatingGuestOrder] = useState(false);

  // Guard to prevent double submissions when the user clicks multiple times
  const submitGuardRef = useRef(false);

  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['completed-orders-for-refund'],
    queryFn: () => returnRefundAPI.getCompletedOrders().then(res => res.data.data),
    enabled: open,
  });

  const orders = useMemo(() => {
    return ordersData?.orders || [];
  }, [ordersData]);

  const selectedOrder = useMemo(() => orders.find(o => o._id === selectedOrderId), [orders, selectedOrderId]);
  const orderProducts = useMemo(() => (selectedOrder?.items || []), [selectedOrder]);
  const { data: keysData, isLoading: keysLoading } = useQuery({
    queryKey: ['refund-order-item-keys', selectedOrderId, selectedProductId],
    queryFn: () =>
      returnRefundAPI.getOrderItemLicenseKeys(selectedOrderId, selectedProductId).then(res => res.data.data),
    enabled: open && !!selectedOrderId && !!selectedProductId,
  });
  const licenseKeys = useMemo(() => keysData?.keys || [], [keysData]);
  const hasMultipleKeys = licenseKeys.length > 1;
  const evidencePreviewUrls = useMemo(() => {
    if (!evidenceFiles.length) return [];
    const urls = evidenceFiles.map((f) => (f && typeof f === 'object' && f instanceof File ? URL.createObjectURL(f) : null)).filter(Boolean);
    return urls;
  }, [evidenceFiles]);

  // Determine which refund methods are allowed based on how the order was paid
  // This applies to both regular orders and guest orders
  const allowedRefundMethods = useMemo(() => {
    // Use the appropriate order based on refund type
    const order = refundType === 'GUEST' ? guestOrder : selectedOrder;
    if (!order) return ['WALLET', 'ORIGINAL_PAYMENT'];

    // These fields should reflect how much of the order was paid by each source.
    // They are coerced to numbers and default to 0 if missing to avoid runtime issues.
    const walletAmount = Number(order.walletAmount ?? 0);
    const cardAmount = Number(order.cardAmount ?? 0);
    const paypalAmount = Number(order.paypalAmount ?? 0);
    const cardOrPaypalAmount = cardAmount + paypalAmount;

    // TC-PAYMENT-REFUND-001: Wallet only purchase -> refund to wallet only
    if (walletAmount > 0 && cardOrPaypalAmount === 0) {
      return ['WALLET'];
    }

    // TC-PAYMENT-REFUND-002: Wallet + Card/PayPal -> refund to wallet only
    if (walletAmount > 0 && cardOrPaypalAmount > 0) {
      return ['WALLET'];
    }

    // TC-PAYMENT-REFUND-003: Card/PayPal only -> allow wallet OR original method
    if (walletAmount === 0 && cardOrPaypalAmount > 0) {
      return ['WALLET', 'ORIGINAL_PAYMENT'];
    }

    // Sensible fallback if structure is different/unexpected
    return ['WALLET'];
  }, [selectedOrder, guestOrder, refundType]);

  useEffect(() => {
    return () => {
      evidencePreviewUrls.forEach((url) => {
        try { URL.revokeObjectURL(url); } catch (_) {}
      });
    };
  }, [evidencePreviewUrls]);

  useEffect(() => {
    if (!open) {
      setSelectedOrderId('');
      setSelectedProductId('');
      setRefundReason('');
      setCustomReason('');
      setRefundMethod('WALLET');
      setSelectedLicenseKeyIds([]);
      setEvidenceFiles([]);
      setErrors({});
      setRefundType('REGULAR');
      setGuestPurchaseEmail('');
      setGuestOrderNumber('');
      setGuestOrder(null);
      setGuestSelectedProductId('');
      setGuestSelectedKeyIds([]);
      setValidatingGuestOrder(false);
    }
  }, [open]);

  useEffect(() => {
    setSelectedLicenseKeyIds([]);
  }, [selectedOrderId, selectedProductId]);

  // Reset refund method to WALLET if current selection is no longer allowed
  useEffect(() => {
    if (!allowedRefundMethods.includes(refundMethod)) {
      setRefundMethod('WALLET');
    }
  }, [allowedRefundMethods, refundMethod]);

  const handleValidateGuestOrder = async () => {
    if (!guestPurchaseEmail.trim() || !guestOrderNumber.trim()) {
      setErrors((prev) => ({
        ...prev,
        guest: 'Purchase email and order number are required',
      }));
      return;
    }

    try {
      setValidatingGuestOrder(true);
      setGuestOrder(null);
      setGuestSelectedProductId('');
      setGuestSelectedKeyIds([]);
      setErrors((prev) => ({ ...prev, guest: undefined }));

      const params = new URLSearchParams({
        purchaseEmail: guestPurchaseEmail.trim(),
        orderId: guestOrderNumber.trim(),
      });

      // expects returnRefundAPI.validateGuestOrder(queryString) -> GET /returnrefund/guest/validate
      const res = await returnRefundAPI.validateGuestOrder(params.toString());
      const data = res.data?.data || res.data;
      setGuestOrder(data);
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Could not validate guest order. Please check email and order number.';
      toast.error(message);
    } finally {
      setValidatingGuestOrder(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (refundType === 'REGULAR') {
      if (!selectedOrderId) newErrors.orderId = 'Please select an order';
      if (!selectedProductId) newErrors.productId = 'Please select a product';
      if (hasMultipleKeys && selectedLicenseKeyIds.length === 0) {
        newErrors.licenseKeys = 'Please select at least one license key to refund';
      }
    } else {
      if (!guestPurchaseEmail.trim()) {
        newErrors.guest = 'Purchase email is required for guest purchase refunds';
      } else if (!guestOrderNumber.trim()) {
        newErrors.guest = 'Order ID is required for guest purchase refunds';
      } else if (!guestOrder) {
        newErrors.guest = 'Please validate your guest order before submitting';
      } else if (!guestSelectedProductId) {
        newErrors.productId = 'Please select a product from the guest order';
      } else if (guestSelectedKeyIds.length === 0) {
        newErrors.licenseKeys = 'Please select at least one key to refund';
      }
    }
    if (!refundReason) newErrors.reason = 'Please select a refund reason';
    else if (refundReason === 'Other' && !customReason.trim()) newErrors.customReason = 'Please provide a reason';
    if (evidenceFiles.length === 0) newErrors.evidence = 'Please upload at least one evidence image (screenshot or proof)';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const createRefundMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await returnRefundAPI.createRefundRequest(payload);
      return res.data;
    },
    onSuccess: (_, variables) => {
      const isWallet = variables.refundMethod === 'WALLET';
      toast.success(
        isWallet
          ? 'Refund request created. Admin will review.'
          : 'Refund request submitted. Admin will process the refund to your original payment method.'
      );
      queryClient.invalidateQueries(['user-refunds']);
      queryClient.invalidateQueries(['completed-orders-for-refund']);
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create refund request');
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prevent double submission if user clicks multiple times before the request completes
    if (submitGuardRef.current) return;

    if (!validateForm()) return;

    const reason = refundReason === 'Other' ? customReason : refundReason;
    const productIdToSend =
      refundType === 'REGULAR'
        ? String(selectedProductId).trim()
        : String(guestSelectedProductId).trim();
    const orderIdToSend =
      refundType === 'REGULAR'
        ? String(selectedOrderId).trim()
        : String(guestOrder?.orderId || '').trim();

    let evidenceUrls = [];
    if (evidenceFiles.length > 0) {
      const formData = new FormData();
      evidenceFiles.forEach((file) => formData.append('evidence', file));
      try {
        const uploadRes = await returnRefundAPI.uploadEvidence(formData);
        evidenceUrls = uploadRes.data?.data?.urls || [];
      } catch (err) {
        toast.error(err.response?.data?.message || 'Evidence upload failed');
        return;
      }
    }
    if (evidenceUrls.length === 0) {
      toast.error('Please upload at least one evidence image.');
      return;
    }
    const payload = {
      orderId: orderIdToSend,
      productId: productIdToSend,
      reason: reason.trim(),
      refundMethod: refundMethod,
      evidenceFiles: evidenceUrls,
    };

    if (refundType === 'REGULAR') {
      const keyIdsToSend = selectedLicenseKeyIds.length > 0
        ? selectedLicenseKeyIds
        : licenseKeys.map((k) => k.keyId || k.licenseKeyId).filter(Boolean);
      if (keyIdsToSend.length > 0) {
        payload.licenseKeyIds = keyIdsToSend;
      }
    } else {
      payload.licenseKeyIds = guestSelectedKeyIds.slice();
      payload.isGuestRefund = true;
      payload.purchaseEmail = guestPurchaseEmail.trim();
      payload.orderNumber = guestOrderNumber.trim();
    }

    try {
      submitGuardRef.current = true;
      await createRefundMutation.mutateAsync(payload);
    } finally {
      submitGuardRef.current = false;
    }
  };

  const toggleKeySelection = (keyId) => {
    setSelectedLicenseKeyIds((prev) =>
      prev.includes(keyId) ? prev.filter((id) => id !== keyId) : [...prev, keyId]
    );
    setErrors((e) => ({ ...e, licenseKeys: undefined }));
  };

  const getMaskedLicenseKey = (key) => {
    if (!key) return 'XXXX-****';

    // Prefer a backend-provided masked/display value if available
    if (key.displayKey && typeof key.displayKey === 'string') {
      return key.displayKey;
    }
    if (key.maskedKey && typeof key.maskedKey === 'string') {
      return key.maskedKey;
    }

    const raw = typeof key.keyValue === 'string' ? key.keyValue : '';
    if (!raw) return 'XXXX-****';

    // Backend may already return a safe, pre-masked value:
    // - license format: XXXX-1234
    // - account format: usernameId | ****1234
    if (/^XXXX-/i.test(raw) || raw.includes('|')) {
      return raw;
    }

    const trimmed = raw.replace(/\s+/g, '');
    const lastFour = trimmed.slice(-4) || '****';
    return `XXXX-${lastFour}`;
  };

  const formatIssuedDate = (issuedAt) => {
    if (!issuedAt) return '—';
    try {
      const d = new Date(issuedAt);
      return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return '—';
    }
  };

  const statusLabel = (status) => {
    const labels = { active: 'Active', refunded: 'Refunded', refund_requested: 'Refund Requested' };
    return labels[status] || status;
  };

  const isFormValid =
    refundReason &&
    (refundReason !== 'Other' || customReason.trim()) &&
    evidenceFiles.length >= 1 &&
    (refundType === 'REGULAR'
      ? selectedOrderId &&
        selectedProductId &&
        (!hasMultipleKeys || selectedLicenseKeyIds.length > 0)
      : guestPurchaseEmail.trim() &&
        guestOrderNumber.trim() &&
        !!guestOrder &&
        !!guestSelectedProductId &&
        guestSelectedKeyIds.length > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/15">
              <FileText className="w-4 h-4 text-accent" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">Request Refund</DialogTitle>
              <DialogDescription>
                Select an order and product to request a refund. Admin will review your request.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-180px)] px-6 py-4 space-y-6">
          {/* Refund Type */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                <FileText className="w-4 h-4 text-accent" />
              </div>
              <div>
                <Label className="text-white text-sm font-semibold">Refund Type *</Label>
                <p className="text-xs text-gray-500 mt-0.5">Regular refund or guest purchase refund.</p>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <label
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer ${
                  refundType === 'REGULAR'
                    ? 'border-accent bg-accent/10'
                    : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]'
                }`}
              >
                <input
                  type="radio"
                  name="refundType"
                  value="REGULAR"
                  checked={refundType === 'REGULAR'}
                  onChange={() => {
                    setRefundType('REGULAR');
                    setGuestOrder(null);
                    setGuestSelectedProductId('');
                    setGuestSelectedKeyIds([]);
                    setErrors((prev) => ({ ...prev, guest: undefined }));
                  }}
                  className="mt-1 rounded-full border-white/10 bg-white/[0.04] text-accent focus:ring-accent"
                />
                <div>
                  <span className="text-sm font-medium text-white">Regular Refund</span>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Refund a purchase made while logged into your account.
                  </p>
                </div>
              </label>
              <label
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer ${
                  refundType === 'GUEST'
                    ? 'border-accent bg-accent/10'
                    : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]'
                }`}
              >
                <input
                  type="radio"
                  name="refundType"
                  value="GUEST"
                  checked={refundType === 'GUEST'}
                  onChange={() => {
                    setRefundType('GUEST');
                    setSelectedOrderId('');
                    setSelectedProductId('');
                    setSelectedLicenseKeyIds([]);
                    setErrors((prev) => ({
                      ...prev,
                      orderId: undefined,
                      productId: undefined,
                      licenseKeys: undefined,
                    }));
                  }}
                  className="mt-1 rounded-full border-white/10 bg-white/[0.04] text-accent focus:ring-accent"
                />
                <div>
                  <span className="text-sm font-medium text-white">Refunding a Guest Purchase</span>
                  <p className="text-xs text-gray-400 mt-0.5">
                    You bought as a guest and now created an account with the same email.
                  </p>
                </div>
              </label>
            </div>
            {errors.guest && (
              <p className="text-sm text-red-400 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.guest}
              </p>
            )}
          </div>

          {/* Guest purchase verification */}
          {refundType === 'GUEST' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                  <ShoppingBag className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <Label className="text-white text-sm font-semibold">
                    Guest Purchase Details *
                  </Label>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Enter the email and order number used when you bought as a guest.
                  </p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs text-gray-300">Purchase Email</Label>
                  <input
                    type="email"
                    className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-sm text-white placeholder:text-gray-500 focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/20 transition-colors"
                    placeholder="email used during purchase"
                    value={guestPurchaseEmail}
                    onChange={(e) => {
                      setGuestPurchaseEmail(e.target.value);
                      setErrors((prev) => ({ ...prev, guest: undefined }));
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-300">Order ID (from your email)</Label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-sm text-white placeholder:text-gray-500 focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/20 transition-colors"
                    placeholder="e.g. #9VEQ1LFP"
                    value={guestOrderNumber}
                    onChange={(e) => {
                      setGuestOrderNumber(e.target.value);
                      setErrors((prev) => ({ ...prev, guest: undefined }));
                    }}
                  />
                </div>
              </div>
              <div className="flex items-center justify-end">
                <Button
                  type="button"
                  size="sm"
                  onClick={handleValidateGuestOrder}
                  disabled={
                    !guestPurchaseEmail.trim() ||
                    !guestOrderNumber.trim() ||
                    validatingGuestOrder
                  }
                  className="bg-accent hover:bg-accent/90 px-4 py-1.5 text-sm font-medium"
                >
                  {validatingGuestOrder ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Validating...
                    </>
                  ) : (
                    'Validate Guest Order'
                  )}
                </Button>
              </div>
              {guestOrder && (
                <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100">
                  Guest order verified. Select the product and key(s) below to continue.
                </div>
              )}
            </div>
          )}

          {/* Order Selection (regular refunds) */}
          {refundType === 'REGULAR' && (
            <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                <ShoppingBag className="w-4 h-4 text-accent" />
              </div>
              <div>
                <Label htmlFor="order" className="text-white text-sm font-semibold">
                  Select Order *
                </Label>
                <p className="text-xs text-gray-400 mt-0.5">
                  Choose the order you want to request a refund for
                </p>
              </div>
            </div>
            <SearchableSelect
              options={orders}
              value={selectedOrderId}
              onValueChange={(value) => {
                setSelectedOrderId(value);
                setSelectedProductId(''); // Reset product when order changes
                // Reset refund method to a safe default; backend still enforces rules.
                setRefundMethod('WALLET');
                setErrors(prev => ({ ...prev, orderId: undefined }));
              }}
              placeholder="Select an order..."
              searchPlaceholder="Search orders by ID or date..."
              emptyMessage={ordersLoading ? "Loading orders..." : "No completed orders found"}
              loading={ordersLoading}
              className="w-full"
              getOptionLabel={(order) => {
                const date = new Date(order.orderDate).toLocaleDateString();
                const displayId = order.orderNumber || (order._id || order.orderId || '').slice(-8).toUpperCase();
                return `Order ID ${displayId} - ${date} - $${order.orderTotalAmount?.toFixed(2)}`;
              }}
              getOptionValue={(order) => order._id}
              filterFunction={(order, searchQuery) => {
                const query = searchQuery.toLowerCase();
                const orderId = order._id.toLowerCase();
                const orderNumber = (order.orderNumber || '').toLowerCase();
                const date = new Date(order.orderDate).toLocaleDateString().toLowerCase();
                const amount = order.orderTotalAmount?.toFixed(2) || '';
                return (
                  orderId.includes(query) ||
                  orderNumber.includes(query) ||
                  date.includes(query) ||
                  amount.includes(query)
                );
              }}
              renderOption={(order, isSelected) => {
                const displayId = order.orderNumber || (order._id || order.orderId || '').slice(-8).toUpperCase();
                return (
                  <div className="flex items-center justify-between w-full">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        Order ID {displayId}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                        <span>{new Date(order.orderDate).toLocaleDateString()}</span>
                        <span>•</span>
                        <span className="font-semibold text-white">
                          ${order.orderTotalAmount?.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="h-4 w-4 text-accent ml-2 shrink-0" />
                    )}
                  </div>
                );
              }}
            />
            {errors.orderId && (
              <p className="text-sm text-red-400 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.orderId}
              </p>
            )}
          </div>
          )}

          {/* Product Selection (Dependent on Order, regular refunds) */}
          {refundType === 'REGULAR' && selectedOrder && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                  <Package className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <Label htmlFor="product" className="text-white text-sm font-semibold">
                    Select Product *
                  </Label>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Choose the product you want to refund from this order
                  </p>
                </div>
              </div>
              <SearchableSelect
                options={orderProducts}
                value={selectedProductId}
                onValueChange={(value) => {
                  setSelectedProductId(value);
                  setErrors((prev) => ({ ...prev, productId: undefined }));
                }}
                placeholder="Select a product..."
                searchPlaceholder="Search products..."
                emptyMessage="No products available in this order"
                className="w-full"
                getOptionLabel={(product) => product.productName || 'Product'}
                getOptionValue={(product) => {
                  const pid = product.productId;
                  return pid ? String(pid) : '';
                }}
                filterFunction={(product, searchQuery) => {
                  const query = searchQuery.toLowerCase();
                  const name = (product.productName || '').toLowerCase();
                  return name.includes(query);
                }}
                renderOption={(product, isSelected) => (
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {product.productImage && (
                        <SafeImage
                          src={product.productImage}
                          alt={product.productName}
                          className="w-10 h-10 object-cover rounded shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {product.productName}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                          <span>Qty: {product.qty}</span>
                          <span>•</span>
                          <span>${product.unitPrice?.toFixed(2)}</span>
                          <span>•</span>
                          <span className="font-semibold text-white">
                            ${product.lineTotal?.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="h-4 w-4 text-accent ml-2 shrink-0" />
                    )}
                  </div>
                )}
              />
              {errors.productId && (
                <p className="text-sm text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.productId}
                </p>
              )}
            </div>
          )}

          {/* Guest: select product and masked keys */}
          {refundType === 'GUEST' && guestOrder && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                  <Package className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <Label className="text-white text-sm font-semibold">
                    Select product and key(s) to refund *
                  </Label>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Only masked keys (last 4 digits) are shown. Select the key(s) that do not work.
                  </p>
                </div>
              </div>
              <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                {guestOrder.items.map((item) => {
                  const isSelectedProduct = guestSelectedProductId === item.productId;
                  return (
                    <div
                      key={item.productId}
                      className={`rounded-lg border p-3 transition-colors ${
                        isSelectedProduct
                          ? 'border-accent bg-accent/10'
                          : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.1] hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {item.productImage && (
                            <SafeImage
                              src={item.productImage}
                              alt={item.productName}
                              className="w-10 h-10 rounded object-cover shrink-0"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">
                              {item.productName}
                            </p>
                            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-gray-400">
                              <span>Qty: {item.qty}</span>
                              <span>•</span>
                              <span>${item.unitPrice?.toFixed(2)}</span>
                              <span>•</span>
                              <span className="font-semibold text-white">
                                ${item.lineTotal?.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button
                          type="button"
                          size="xs"
                          variant={isSelectedProduct ? 'default' : 'outline'}
                          className={
                            isSelectedProduct
                              ? 'bg-accent hover:bg-accent/90'
                              : 'border-gray-600 text-gray-200'
                          }
                          onClick={() => {
                            setGuestSelectedProductId(item.productId);
                            setGuestSelectedKeyIds([]);
                            setErrors((prev) => ({
                              ...prev,
                              productId: undefined,
                              licenseKeys: undefined,
                            }));
                          }}
                        >
                          {isSelectedProduct ? 'Selected' : 'Refund this product'}
                        </Button>
                      </div>

                      {isSelectedProduct && (
                        <div className="mt-3 space-y-2">
                          {item.keys.length === 0 ? (
                            <p className="text-xs text-gray-400">
                              No eligible keys for refund on this product.
                            </p>
                          ) : (
                            <>
                              <p className="text-xs text-gray-300">
                                Select the key(s) that do not work. Only the last 4 digits are shown.
                              </p>
                              <div className="grid gap-2">
                                {item.keys.map((k) => {
                                  const checked = guestSelectedKeyIds.includes(k.licenseKeyId);
                                  return (
                                    <label
                                      key={k.licenseKeyId}
                                      className={`flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-xs ${
                                        checked
                                          ? 'border-accent bg-accent/10'
                                          : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.1] hover:bg-white/[0.04]'
                                      } cursor-pointer`}
                                    >
                                      <div className="flex items-center gap-3">
                                        <input
                                          type="checkbox"
                                          checked={checked}
                                          onChange={(e) => {
                                            setGuestSelectedKeyIds((prev) =>
                                              e.target.checked
                                                ? [...prev, k.licenseKeyId]
                                                : prev.filter((id) => id !== k.licenseKeyId)
                                            );
                                            setErrors((prev) => ({
                                              ...prev,
                                              licenseKeys: undefined,
                                            }));
                                          }}
                                          className="h-4 w-4 rounded border-white/10 bg-white/[0.04] text-accent focus:ring-accent"
                                        />
                                        <div className="flex flex-col">
                                          <span className="font-mono text-xs text-gray-100">
                                            {k.displayKey}
                                          </span>
                                          <span className="text-[11px] text-gray-400">
                                            Issued: {formatIssuedDate(k.issuedAt)}
                                          </span>
                                        </div>
                                      </div>
                                    </label>
                                  );
                                })}
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {errors.licenseKeys && (
                <p className="text-sm text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.licenseKeys}
                </p>
              )}
            </div>
          )}

          {/* License key(s) selection — card-based to avoid confusion (regular refunds) */}
          {refundType === 'REGULAR' && selectedOrder && selectedProductId && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                  <Package className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <Label className="text-white text-sm font-semibold">
                    Select which license(s) to refund *
                  </Label>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {hasMultipleKeys
                      ? 'Click a card to select that license for refund. Only non-refunded licenses are listed.'
                      : 'One license for this product — it will be included in the refund.'}
                  </p>
                </div>
              </div>
              {keysLoading ? (
                <p className="text-sm text-gray-400 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading licenses...
                </p>
              ) : licenseKeys.length > 0 ? (
                <div className="space-y-3">
                  <div className="grid gap-3 max-h-[320px] overflow-y-auto pr-1">
                    {licenseKeys.map((key, index) => {
                      const keyId = key.keyId || key.licenseKeyId;
                      const isSelected = selectedLicenseKeyIds.includes(keyId);
                      const licenseNumber = index + 1;
                      const productTypeLabel = (key.deliveryType || key.productType || 'license').toLowerCase() === 'account' ? 'Account' : 'License';
                      return (
                        <label
                          key={keyId}
                          className={`block cursor-pointer rounded-xl border-2 p-4 transition-all ${
                            isSelected
                              ? 'border-accent bg-accent/10 ring-2 ring-accent/30'
                              : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.1] hover:bg-white/[0.04]'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleKeySelection(keyId)}
                              className="mt-1 rounded border-white/10 bg-white/[0.04] text-accent focus:ring-accent"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                <span className="font-semibold text-white">License #{licenseNumber}</span>
                                <span className="font-mono text-sm text-gray-300">
                                  {getMaskedLicenseKey(key)}
                                </span>
                              </div>
                              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
                                <span>Price: ${(key.price ?? 0).toFixed(2)}</span>
                                <span>Type: {productTypeLabel}</span>
                                <span>Status: {statusLabel(key.status)}</span>
                                <span>Issued: {formatIssuedDate(key.issuedAt)}</span>
                              </div>
                              {isSelected && (
                                <p className="mt-2 text-xs font-medium text-accent">Selected for refund</p>
                              )}
                            </div>
                            {isSelected && <CheckCircle2 className="h-5 w-5 shrink-0 text-accent" />}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                  {selectedLicenseKeyIds.length > 0 && (() => {
                    const selectedList = selectedLicenseKeyIds.map((id) => {
                      const k = licenseKeys.find((key) => (key.keyId || key.licenseKeyId) === id);
                      const num = k ? licenseKeys.indexOf(k) + 1 : 0;
                      const mask = getMaskedLicenseKey(k);
                      return `License #${num} (${mask})`;
                    }).filter(Boolean);
                    const message = selectedList.length === 1
                      ? `You are requesting a refund for ${selectedList[0]}. Other licenses will remain active.`
                      : `You are requesting a refund for ${selectedList.join(', ')}. Other licenses will remain active.`;
                    return (
                      <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-200">
                        {message}
                      </div>
                    );
                  })()}
                  {errors.licenseKeys && (
                    <p className="text-sm text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {errors.licenseKeys}
                    </p>
                  )}
                </div>
              ) : null}
            </div>
          )}

          {/* Refund method - shown for both regular and guest orders */}
          {(selectedProductId || guestSelectedProductId) && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                  <Package className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <Label className="text-white text-sm font-semibold">Refund method *</Label>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {allowedRefundMethods.length === 1 && allowedRefundMethods[0] === 'WALLET'
                      ? 'Orders paid with wallet can only be refunded to wallet'
                      : 'Choose how you want to receive the refund'}
                  </p>
                </div>
              </div>
              <div className="grid gap-2">
                {REFUND_METHODS.filter((m) => allowedRefundMethods.includes(m.value)).map((m) => (
                  <label
                    key={m.value}
                    className="flex items-start gap-3 p-3.5 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] cursor-pointer has-checked:border-accent/50 has-checked:bg-accent/[0.06] transition-all"
                  >
                    <input
                      type="radio"
                      name="refundMethod"
                      value={m.value}
                      checked={refundMethod === m.value}
                      onChange={() => setRefundMethod(m.value)}
                      className="mt-1 rounded-full border-white/10 bg-white/[0.04] text-accent focus:ring-accent"
                    />
                    <div>
                      <span className="text-sm font-medium text-white">{m.label}</span>
                      <p className="text-xs text-gray-400 mt-0.5">{m.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Evidence upload (mandatory) */}
          {(selectedProductId || guestSelectedProductId) && (
            <div className="space-y-2">
              <Label className="text-white text-sm font-semibold">Evidence (required) *</Label>
              <p className="text-xs text-gray-400">Upload at least one image: error screenshots or proof the product is not working</p>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  setEvidenceFiles(files);
                  setErrors((e) => ({ ...e, evidence: undefined }));
                }}
                className="w-full text-sm text-gray-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border file:border-white/[0.08] file:bg-white/[0.04] file:text-accent file:font-medium file:cursor-pointer hover:file:bg-white/[0.08] file:transition-colors"
              />
              {evidenceFiles.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-gray-400">{evidenceFiles.length} image(s) selected — click to preview</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {evidencePreviewUrls.map((url, idx) => (
                      <button
                        key={url}
                        type="button"
                        onClick={() => window.open(url, '_blank', 'noopener')}
                        className="block w-full aspect-square rounded-xl border border-white/[0.08] bg-white/[0.02] overflow-hidden shadow-md hover:border-accent/40 hover:shadow-accent/10 focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all"
                      >
                        <SafeImage src={url} alt={`Evidence ${idx + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {errors.evidence && (
                <p className="text-sm text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.evidence}
                </p>
              )}
            </div>
          )}

          {/* Refund Reason */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                <FileText className="w-4 h-4 text-accent" />
              </div>
              <div>
                <Label htmlFor="reason" className="text-white text-sm font-semibold">
                  Refund Reason *
                </Label>
                <p className="text-xs text-gray-400 mt-0.5">
                  Please provide a reason for your refund request
                </p>
              </div>
            </div>
            <Select
              value={refundReason}
              onValueChange={(value) => {
                setRefundReason(value);
                if (value !== 'Other') {
                  setCustomReason('');
                }
                setErrors(prev => ({ ...prev, reason: undefined, customReason: undefined }));
              }}
            >
              <SelectTrigger className="w-full bg-white/[0.03] border-white/[0.08] text-white">
                <SelectValue placeholder="Select a reason..." />
              </SelectTrigger>
              <SelectContent>
                {REFUND_REASONS.map((reason) => (
                  <SelectItem key={reason} value={reason}>
                    {reason}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.reason && (
              <p className="text-sm text-red-400 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.reason}
              </p>
            )}

            {/* Custom Reason Textarea */}
            {refundReason === 'Other' && (
              <div className="space-y-2">
                <Textarea
                  value={customReason}
                  onChange={(e) => {
                    setCustomReason(e.target.value);
                    setErrors(prev => ({ ...prev, customReason: undefined }));
                  }}
                  placeholder="Please describe your reason for requesting a refund..."
                  rows={4}
                  className="bg-white/[0.03] border-white/[0.08] text-white placeholder:text-gray-500 resize-none focus:border-accent/50 focus:ring-2 focus:ring-accent/20 rounded-xl"
                />
                {errors.customReason && (
                  <p className="text-sm text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.customReason}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-between gap-4 pt-5 border-t border-white/[0.06]">
            <div className="text-sm text-gray-400">
              {isFormValid && (
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-xs font-medium">Ready to submit</span>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="border-white/[0.08] text-gray-300 hover:bg-white/[0.06] hover:text-white px-5"
                disabled={createRefundMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!isFormValid || createRefundMutation.isPending}
                className="bg-accent hover:bg-accent/90 min-w-[160px] px-6 font-semibold shadow-lg shadow-accent/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {createRefundMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Create Refund Request'
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RefundRequestModal;
