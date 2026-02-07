import { useState, useEffect, useMemo } from 'react';
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
  { value: 'ORIGINAL_PAYMENT', label: 'Refund to PayPal (Manual)', description: 'Admin will send the refund to your PayPal email.' },
];

const PAYPAL_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const RefundRequestModal = ({ open, onOpenChange }) => {
  const queryClient = useQueryClient();
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [refundMethod, setRefundMethod] = useState('WALLET');
  const [customerPayPalEmail, setCustomerPayPalEmail] = useState('');
  const [selectedLicenseKeyIds, setSelectedLicenseKeyIds] = useState([]);
  const [evidenceFiles, setEvidenceFiles] = useState([]);
  const [errors, setErrors] = useState({});

  // Fetch completed orders for dropdown
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

  // Fetch license keys for selected order + product (for multi-quantity / key-level refund)
  const { data: keysData, isLoading: keysLoading } = useQuery({
    queryKey: ['refund-order-item-keys', selectedOrderId, selectedProductId],
    queryFn: () =>
      returnRefundAPI.getOrderItemLicenseKeys(selectedOrderId, selectedProductId).then(res => res.data.data),
    enabled: open && !!selectedOrderId && !!selectedProductId,
  });

  const licenseKeys = useMemo(() => keysData?.keys || [], [keysData]);
  const hasMultipleKeys = licenseKeys.length > 1;

  // Preview URLs for evidence images (revoked on cleanup)
  const evidencePreviewUrls = useMemo(() => {
    if (!evidenceFiles.length) return [];
    const urls = evidenceFiles.map((f) => (f && typeof f === 'object' && f instanceof File ? URL.createObjectURL(f) : null)).filter(Boolean);
    return urls;
  }, [evidenceFiles]);

  useEffect(() => {
    return () => {
      evidencePreviewUrls.forEach((url) => {
        try { URL.revokeObjectURL(url); } catch (_) {}
      });
    };
  }, [evidencePreviewUrls]);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setSelectedOrderId('');
      setSelectedProductId('');
      setRefundReason('');
      setCustomReason('');
      setRefundMethod('WALLET');
      setCustomerPayPalEmail('');
      setSelectedLicenseKeyIds([]);
      setEvidenceFiles([]);
      setErrors({});
    }
  }, [open]);

  // When product changes, reset key selection
  useEffect(() => {
    setSelectedLicenseKeyIds([]);
  }, [selectedOrderId, selectedProductId]);

  const validateForm = () => {
    const newErrors = {};
    if (!selectedOrderId) newErrors.orderId = 'Please select an order';
    if (!selectedProductId) newErrors.productId = 'Please select a product';
    if (!refundReason) newErrors.reason = 'Please select a refund reason';
    else if (refundReason === 'Other' && !customReason.trim()) newErrors.customReason = 'Please provide a reason';
    if (refundMethod === 'ORIGINAL_PAYMENT') {
      if (!customerPayPalEmail.trim()) newErrors.customerPayPalEmail = 'PayPal email is required';
      else if (!PAYPAL_EMAIL_REGEX.test(customerPayPalEmail.trim())) newErrors.customerPayPalEmail = 'Enter a valid PayPal email address';
    }
    if (evidenceFiles.length === 0) newErrors.evidence = 'Please upload at least one evidence image (screenshot or proof)';
    if (hasMultipleKeys && selectedLicenseKeyIds.length === 0) {
      newErrors.licenseKeys = 'Please select at least one license key to refund';
    }
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
          : 'Refund request submitted. Admin will process your PayPal refund.'
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
    if (!validateForm()) return;

    const reason = refundReason === 'Other' ? customReason : refundReason;
    const productIdToSend = String(selectedProductId).trim();
    const orderIdToSend = String(selectedOrderId).trim();

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
    if (refundMethod === 'ORIGINAL_PAYMENT' && customerPayPalEmail.trim()) {
      payload.customerPayPalEmail = customerPayPalEmail.trim();
    }
    const keyIdsToSend = selectedLicenseKeyIds.length > 0
      ? selectedLicenseKeyIds
      : licenseKeys.map((k) => k.keyId || k.licenseKeyId).filter(Boolean);
    if (keyIdsToSend.length > 0) {
      payload.licenseKeyIds = keyIdsToSend;
    }

    createRefundMutation.mutate(payload);
  };

  const toggleKeySelection = (keyId) => {
    setSelectedLicenseKeyIds((prev) =>
      prev.includes(keyId) ? prev.filter((id) => id !== keyId) : [...prev, keyId]
    );
    setErrors((e) => ({ ...e, licenseKeys: undefined }));
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
    selectedOrderId &&
    selectedProductId &&
    refundReason &&
    (refundReason !== 'Other' || customReason.trim()) &&
    (refundMethod !== 'ORIGINAL_PAYMENT' || (customerPayPalEmail.trim() && PAYPAL_EMAIL_REGEX.test(customerPayPalEmail.trim()))) &&
    evidenceFiles.length >= 1 &&
    (!hasMultipleKeys || selectedLicenseKeyIds.length > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg" className="bg-primary border-gray-700">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-white text-2xl font-bold flex items-center gap-2">
                <FileText className="w-6 h-6 text-accent" />
                Request Refund
              </DialogTitle>
              <DialogDescription className="text-gray-400 text-sm mt-2">
                Select an order and product to request a refund. Admin will review your request. Only completed orders are eligible.
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Order Selection */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-accent/20 rounded-lg">
                <ShoppingBag className="w-5 h-5 text-accent" />
              </div>
              <div>
                <Label htmlFor="order" className="text-white text-base font-semibold">
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
                setErrors(prev => ({ ...prev, orderId: undefined }));
              }}
              placeholder="Select an order..."
              searchPlaceholder="Search orders by ID or date..."
              emptyMessage={ordersLoading ? "Loading orders..." : "No completed orders found"}
              loading={ordersLoading}
              className="w-full"
              getOptionLabel={(order) => {
                const date = new Date(order.orderDate).toLocaleDateString();
                return `Order #${order._id.slice(-8)} - ${date} - $${order.orderTotalAmount?.toFixed(2)}`;
              }}
              getOptionValue={(order) => order._id}
              filterFunction={(order, searchQuery) => {
                const query = searchQuery.toLowerCase();
                const orderId = order._id.toLowerCase();
                const date = new Date(order.orderDate).toLocaleDateString().toLowerCase();
                const amount = order.orderTotalAmount?.toFixed(2) || '';
                return orderId.includes(query) || date.includes(query) || amount.includes(query);
              }}
              renderOption={(order, isSelected) => (
                <div className="flex items-center justify-between w-full">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      Order #{order._id.slice(-8)}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                      <span>{new Date(order.orderDate).toLocaleDateString()}</span>
                      <span>•</span>
                      <span className="font-semibold text-white">${order.orderTotalAmount?.toFixed(2)}</span>
                    </div>
                  </div>
                  {isSelected && (
                    <CheckCircle2 className="h-4 w-4 text-accent ml-2 shrink-0" />
                  )}
                </div>
              )}
            />
            {errors.orderId && (
              <p className="text-sm text-red-400 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.orderId}
              </p>
            )}
          </div>

          {/* Product Selection (Dependent on Order) */}
          {selectedOrder && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-accent/20 rounded-lg">
                  <Package className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <Label htmlFor="product" className="text-white text-base font-semibold">
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
                  setErrors(prev => ({ ...prev, productId: undefined }));
                }}
                placeholder="Select a product..."
                searchPlaceholder="Search products..."
                emptyMessage="No products available in this order"
                className="w-full"
                getOptionLabel={(product) => product.productName || 'Product'}
                getOptionValue={(product) => {
                  // Ensure productId is always a string
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
                        <img
                          src={product.productImage}
                          alt={product.productName}
                          className="w-10 h-10 object-cover rounded flex-shrink-0"
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
                          <span className="font-semibold text-white">${product.lineTotal?.toFixed(2)}</span>
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

          {/* License key(s) selection — card-based to avoid confusion */}
          {selectedOrder && selectedProductId && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-accent/20 rounded-lg">
                  <Package className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <Label className="text-white text-base font-semibold">
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
                              : 'border-gray-700 bg-secondary/50 hover:border-gray-600 hover:bg-secondary/70'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleKeySelection(keyId)}
                              className="mt-1 rounded border-gray-600 bg-secondary text-accent focus:ring-accent"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                <span className="font-semibold text-white">License #{licenseNumber}</span>
                                <span className="font-mono text-sm text-gray-300">{key.keyValue || 'XXXX-****'}</span>
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
                      const mask = k?.keyValue || 'XXXX-****';
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

          {/* Refund method */}
          {selectedProductId && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-accent/20 rounded-lg">
                  <Package className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <Label className="text-white text-base font-semibold">Refund method *</Label>
                  <p className="text-xs text-gray-400 mt-0.5">Choose how you want to receive the refund</p>
                </div>
              </div>
              <div className="grid gap-2">
                {REFUND_METHODS.map((m) => (
                  <label
                    key={m.value}
                    className="flex items-start gap-3 p-3 rounded-lg border border-gray-700 bg-secondary/50 hover:bg-secondary/70 cursor-pointer has-[:checked]:border-accent has-[:checked]:ring-1 has-[:checked]:ring-accent"
                  >
                    <input
                      type="radio"
                      name="refundMethod"
                      value={m.value}
                      checked={refundMethod === m.value}
                      onChange={() => {
                        setRefundMethod(m.value);
                        if (m.value === 'WALLET') setCustomerPayPalEmail('');
                        setErrors((e) => ({ ...e, customerPayPalEmail: undefined }));
                      }}
                      className="mt-1 rounded-full border-gray-600 bg-secondary text-accent focus:ring-accent"
                    />
                    <div>
                      <span className="text-sm font-medium text-white">{m.label}</span>
                      <p className="text-xs text-gray-400 mt-0.5">{m.description}</p>
                    </div>
                  </label>
                ))}
              </div>
              {refundMethod === 'ORIGINAL_PAYMENT' && (
                <div className="space-y-2 pl-6">
                  <Label htmlFor="paypal-email" className="text-white text-sm">PayPal email *</Label>
                  <input
                    id="paypal-email"
                    type="email"
                    value={customerPayPalEmail}
                    onChange={(e) => {
                      setCustomerPayPalEmail(e.target.value);
                      setErrors((e) => ({ ...e, customerPayPalEmail: undefined }));
                    }}
                    placeholder="your@email.com"
                    className="w-full px-3 py-2 rounded-md bg-secondary border border-gray-700 text-white placeholder:text-gray-500 focus:border-accent focus:ring-1 focus:ring-accent"
                  />
                  {errors.customerPayPalEmail && (
                    <p className="text-sm text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.customerPayPalEmail}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Evidence upload (mandatory) */}
          {selectedProductId && (
            <div className="space-y-2">
              <Label className="text-white text-base font-semibold">Evidence (required) *</Label>
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
                className="w-full text-sm text-gray-400 file:mr-3 file:py-2 file:px-4 file:rounded file:border-0 file:bg-accent/20 file:text-accent file:font-medium"
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
                        className="block w-full aspect-square rounded-lg border-2 border-gray-600 bg-secondary/50 overflow-hidden shadow-md hover:border-accent focus:outline-none focus:ring-2 focus:ring-accent/50"
                      >
                        <img src={url} alt={`Evidence ${idx + 1}`} className="w-full h-full object-cover" />
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
              <div className="p-2 bg-accent/20 rounded-lg">
                <FileText className="w-5 h-5 text-accent" />
              </div>
              <div>
                <Label htmlFor="reason" className="text-white text-base font-semibold">
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
              <SelectTrigger className="w-full bg-secondary border-gray-700 text-white">
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
                  className="bg-secondary border-gray-700 text-white placeholder:text-gray-500 resize-none focus:border-accent focus:ring-2 focus:ring-accent/20"
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
          <div className="flex items-center justify-between gap-4 pt-6 border-t border-gray-700">
            <div className="text-sm text-gray-400">
              {isFormValid && (
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Ready to submit</span>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white px-6"
                disabled={createRefundMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!isFormValid || createRefundMutation.isPending}
                className="bg-accent hover:bg-accent/90 min-w-[160px] px-6 font-semibold shadow-lg shadow-accent/20 disabled:opacity-50 disabled:cursor-not-allowed"
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
