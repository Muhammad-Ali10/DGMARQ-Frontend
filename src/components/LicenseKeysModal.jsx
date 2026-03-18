import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
} from './ui/dialog';
import { Button } from './ui/button';
import { userAPI } from '../services/api';
import { Key, Copy, AlertTriangle, ShieldAlert, Loader2, CheckCircle2 } from 'lucide-react';
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
  const [copiedId, setCopiedId] = useState(null);

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

  const handleCopy = (text, label = 'License key', id) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(
      () => {
        toast.success(`${label} copied to clipboard`);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
      },
      () => toast.error('Could not copy')
    );
  };

  const details = data?.licenseDetails || [];
  const allRefunded = details.length > 0 && details.every((d) => d.refunded);
  const emptyKeys = details.length === 0 && !data?.message;

  const CopyButton = ({ text, label, id }) => (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="shrink-0 border-white/[0.08] text-gray-400 hover:bg-white/[0.08] hover:text-white h-8 w-8 p-0"
      onClick={() => handleCopy(text, label, id)}
    >
      {copiedId === id
        ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
        : <Copy className="w-3.5 h-3.5" />
      }
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/15">
              <Key className="w-5 h-5 text-accent" />
            </div>
            <div>
              <DialogTitle>License Keys & Account Details</DialogTitle>
              <DialogDescription>
                Your license keys or account credentials for this order.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <DialogBody>
          <div className="space-y-4">
            {loading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-accent" />
                <span className="ml-3 text-sm text-gray-400">Loading license details...</span>
              </div>
            )}

            {error && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-red-400" />
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            {!loading && !error && (
              <>
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-500/8 border border-amber-500/15">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                  <span className="text-xs text-amber-200/90">Do not share these keys or credentials. They are for your use only.</span>
                </div>

                {data?.message && details.length === 0 && (
                  <p className="text-gray-400 text-sm text-center py-4">{data.message}</p>
                )}

                {emptyKeys && !data?.message && (
                  <p className="text-gray-400 text-sm text-center py-4">License not available yet.</p>
                )}

                {allRefunded && (
                  <p className="text-gray-400 text-sm text-center py-4">This license has been refunded and is no longer accessible.</p>
                )}

                {details.map((item, idx) => {
                  const isAccount = item.productType === 'ACCOUNT_BASED';
                  return (
                    <div key={idx} className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
                      <div className="px-4 py-3 border-b border-white/[0.04] bg-white/[0.02]">
                        <p className="font-medium text-white text-sm">{item.productName}</p>
                      </div>
                      <div className="p-4">
                        {item.refunded ? (
                          <p className="text-gray-400 text-sm">
                            This license has been refunded and is no longer accessible.
                          </p>
                        ) : item.keys && item.keys.length > 0 ? (
                          <div className="space-y-3">
                            {isAccount
                              ? item.keys.map((keyVal, kIdx) => {
                                  let creds = null;
                                  if (typeof keyVal === 'string' && keyVal.trim().startsWith('{')) {
                                    try {
                                      creds = JSON.parse(keyVal);
                                    } catch {
                                      creds = null;
                                    }
                                  }

                                  if (!creds || typeof creds !== 'object') {
                                    return (
                                      <div key={kIdx} className="flex items-center gap-2">
                                        <code className="flex-1 min-w-0 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-gray-300 text-sm break-all font-mono">
                                          {keyVal}
                                        </code>
                                        <CopyButton text={keyVal} label={item.productName} id={`${idx}-${kIdx}`} />
                                      </div>
                                    );
                                  }

                                  const email = creds.email || creds.emailAddress || null;
                                  const usernameId = creds.usernameId || creds.username || null;
                                  const rawPassword = creds.password || null;
                                  const emailPassword =
                                    creds.emailPassword ||
                                    (email && !usernameId ? rawPassword : null) ||
                                    null;
                                  const usernamePassword =
                                    creds.usernamePassword ||
                                    (usernameId ? rawPassword : null) ||
                                    null;
                                  const hasAnyUsername = !!usernameId || !!usernamePassword;

                                  return (
                                    <div key={kIdx} className="space-y-2.5 rounded-lg bg-white/[0.03] border border-white/[0.05] p-3.5">
                                      {email && (
                                        <CredentialRow label="Email" value={email} onCopy={() => handleCopy(email, 'Email', `email-${idx}-${kIdx}`)} copied={copiedId === `email-${idx}-${kIdx}`} />
                                      )}
                                      {emailPassword && (
                                        <CredentialRow label="Email Password" value={emailPassword} onCopy={() => handleCopy(emailPassword, 'Email Password', `ep-${idx}-${kIdx}`)} copied={copiedId === `ep-${idx}-${kIdx}`} />
                                      )}
                                      {hasAnyUsername && (
                                        <>
                                          {usernameId && (
                                            <CredentialRow label="Username ID" value={usernameId} onCopy={() => handleCopy(usernameId, 'Username ID', `uid-${idx}-${kIdx}`)} copied={copiedId === `uid-${idx}-${kIdx}`} />
                                          )}
                                          {usernamePassword && (
                                            <CredentialRow label="Username Password" value={usernamePassword} onCopy={() => handleCopy(usernamePassword, 'Username Password', `up-${idx}-${kIdx}`)} copied={copiedId === `up-${idx}-${kIdx}`} />
                                          )}
                                        </>
                                      )}
                                      {!email && !emailPassword && !hasAnyUsername && (
                                        <code className="block px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-gray-300 text-sm break-all font-mono">
                                          {JSON.stringify(creds)}
                                        </code>
                                      )}
                                    </div>
                                  );
                                })
                              : item.keys.map((keyVal, kIdx) => (
                                  <div key={kIdx} className="flex items-center gap-2">
                                    <code className="flex-1 min-w-0 px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-gray-200 text-sm break-all font-mono">
                                      {keyVal}
                                    </code>
                                    <CopyButton text={keyVal} label={item.productName} id={`key-${idx}-${kIdx}`} />
                                  </div>
                                ))}
                          </div>
                        ) : (
                          <p className="text-gray-400 text-sm">License not available yet.</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}

function CredentialRow({ label, value, onCopy, copied }) {
  return (
    <div>
      <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <p className="text-white font-mono text-sm flex-1 break-all px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
          {value}
        </p>
        <button
          type="button"
          onClick={onCopy}
          className="shrink-0 flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] text-gray-400 hover:bg-white/[0.08] hover:text-white transition-colors"
        >
          {copied
            ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
            : <Copy className="w-3.5 h-3.5" />
          }
        </button>
      </div>
    </div>
  );
}
