import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import { Button } from './ui/button';
import { userAPI } from '../services/api';
import { Key, Copy, AlertTriangle, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { showApiError } from '../utils/toast';

/**
 * Modal that fetches and displays license keys/account credentials for an order.
 * Works for logged-in users (no extra params) and guest users (pass guestEmail).
 */
export default function LicenseKeysModal({ open, onOpenChange, orderId, guestEmail }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!open || !orderId) {
      setData(null);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    const params = guestEmail ? { guestEmail: guestEmail.trim() } : {};
    userAPI
      .getOrderKeys(orderId, params)
      .then((res) => {
        const payload = res.data?.data ?? res.data;
        setData(payload);
      })
      .catch((err) => {
        setError(err?.response?.data?.message || err?.message || 'Failed to load license keys');
        showApiError(err, 'Failed to load license keys');
      })
      .finally(() => setLoading(false));
  }, [open, orderId, guestEmail]);

  const handleCopy = (text, label = 'License key') => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(
      () => toast.success(`${label} copied to clipboard`),
      () => toast.error('Could not copy')
    );
  };

  const details = data?.licenseDetails || [];
  const allRefunded = details.length > 0 && details.every((d) => d.refunded);
  const emptyKeys = details.length === 0 && !data?.message;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm" className="bg-primary border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Key className="w-5 h-5" />
            License Keys &amp; Account Details
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Your license keys or account credentials for this order. Keep them secure.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {loading && (
            <p className="text-gray-400 text-sm">Loading license details...</p>
          )}

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {!loading && !error && (
            <>
              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-200 text-sm">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Do not share these keys or credentials. They are for your use only.</span>
              </div>

              {data?.message && details.length === 0 && (
                <p className="text-gray-400">{data.message}</p>
              )}

              {emptyKeys && !data?.message && (
                <p className="text-gray-400">License not available yet.</p>
              )}

              {allRefunded && (
                <p className="text-gray-400">This license has been refunded and is no longer accessible.</p>
              )}

              {details.map((item, idx) => (
                <div key={idx} className="rounded-lg border border-gray-700 p-4 space-y-3">
                  <p className="font-medium text-white">{item.productName}</p>
                  {item.refunded ? (
                    <p className="text-gray-400 text-sm">
                      This license has been refunded and is no longer accessible.
                    </p>
                  ) : item.keys && item.keys.length > 0 ? (
                    <div className="space-y-2">
                      {item.keys.map((keyVal, kIdx) => (
                        <div key={kIdx} className="flex items-center gap-2">
                          <code className="flex-1 min-w-0 px-2 py-1.5 rounded bg-secondary text-gray-300 text-sm break-all font-mono">
                            {keyVal}
                          </code>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="shrink-0"
                            onClick={() => handleCopy(keyVal, item.productName)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400 text-sm">License not available yet.</p>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
