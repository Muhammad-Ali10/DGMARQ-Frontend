import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
} from '@components/ui/dialog';
import { Button } from '@components/ui/button';
import { Skeleton } from '@components/ui/skeleton';
import { ErrorState } from '@components/common/ErrorState';
import { EmptyState } from '@components/common/EmptyState';
import { PlatformBadge, isKnownPlatform } from '@components/common/PlatformBadge';
import ConfirmationModal from '@components/common/ConfirmationModal';
import { userAPI, sellerAPI } from '@services/api';
import { getRedemption } from '@lib/redemption';
import { deliveryWords, isActivationLink, isHttpUrl } from '@lib/deliveryType';
import { describeAccountCredentials } from '@lib/accountCredentials';
import { Key, Copy, ShieldAlert, CheckCircle2, Eye, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

/**
 * License keys / account credentials for an order.
 *
 * - Pass `orderId` (+ optional `guestEmail`) to fetch an order's keys.
 * - Pass `licenseDetails` to render pre-loaded keys (My License Keys, after a
 *   per-key reveal).
 *
 * Keys are MASKED until the buyer explicitly asks for them. Gaming keys get
 * screenshotted, streamed and shoulder-surfed; showing them the instant a modal
 * opens is the wrong default.
 *
 * On the warning copy: the brief asked to state that revealing voids refund
 * eligibility. That is NOT true on this platform, so it is not shown. There is
 * no reveal tracking anywhere — `LicenseKey` has no `isRevealed` field — and
 * refund eligibility is gated purely by order status, a prior admin rejection,
 * and a time window. What IS true, and what the confirm dialog says instead, is
 * the live refund window from `GET /payout/settings/public`, plus the fact that
 * redeeming a key on the platform's side is what practically ends a refund.
 */
export default function LicenseKeysModal({
  open,
  onOpenChange,
  orderId,
  guestEmail,
  licenseDetails: licenseDetailsProp,
  loading: externalLoading = false,
  footerNote,
}) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const isStaticMode = licenseDetailsProp != null;

  // The real refund window, so the dialog quotes a number that is actually
  // enforced rather than a hardcoded guess.
  const { data: payoutSettings } = useQuery({
    queryKey: ['public-payout-settings'],
    queryFn: () => sellerAPI.getPublicPayoutSettings().then((res) => res.data.data),
    staleTime: 5 * 60 * 1000,
    enabled: open,
  });
  const refundWindowDays = payoutSettings?.refundWindowDays;

  const load = useCallback(() => {
    if (!orderId) return;
    setLoading(true);
    setError(null);
    const params = guestEmail ? { guestEmail: guestEmail.trim() } : {};
    userAPI
      .getOrderKeys(orderId, params)
      .then((res) => setData(res.data?.data ?? res.data))
      .catch((err) => setError(err))
      .finally(() => setLoading(false));
  }, [orderId, guestEmail]);

  useEffect(() => {
    // Always re-mask when the modal closes: reopening must not leak the key.
    if (!open) {
      setData(null);
      setError(null);
      setRevealed(false);
      return;
    }
    if (isStaticMode) {
      setData({ licenseDetails: licenseDetailsProp });
      setError(null);
      setLoading(false);
      return;
    }
    load();
  }, [open, isStaticMode, licenseDetailsProp, load]);

  const handleCopy = (text, label = 'License key', id) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(
      () => {
        toast.success(`${label} copied to clipboard`);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
      },
      () => toast.error('Could not copy — select the text and copy manually')
    );
  };

  const details = data?.licenseDetails || [];
  const allRefunded = details.length > 0 && details.every((d) => d.refunded);
  const showLoading = loading || externalLoading;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent size="sm">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft">
                <Key aria-hidden="true" className="size-5 text-accent-on-dark" />
              </div>
              <div>
                <DialogTitle>Your keys</DialogTitle>
                <DialogDescription>
                  License keys and account details for this order.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <DialogBody>
            {showLoading ? (
              <div className="space-y-3" aria-label="Loading your keys">
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="h-24 w-full rounded-xl" />
              </div>
            ) : error ? (
              <ErrorState
                compact
                error={error}
                title="Couldn't load your keys"
                onRetry={isStaticMode ? undefined : load}
              />
            ) : allRefunded ? (
              <EmptyState
                icon={ShieldAlert}
                title="This order was refunded"
                description="The keys for this order are no longer accessible."
              />
            ) : details.length === 0 ? (
              <EmptyState
                icon={Key}
                title="No keys yet"
                description={
                  data?.message ||
                  "Your keys appear here the moment the seller's inventory is assigned — usually within seconds of payment."
                }
              />
            ) : (
              <div className="space-y-4">
                <div className="flex items-start gap-3 rounded-xl border border-warning/35 bg-warning-soft p-3.5">
                  <ShieldAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-warning" />
                  <span className="text-xs text-warning">
                    Never share these with anyone. DGMARQ staff will never ask you for a key.
                  </span>
                </div>

                {!revealed && (
                  <div className="rounded-xl border border-border bg-surface-sunken p-4 text-center">
                    <p className="mb-1 text-sm font-medium text-fg">Keys are hidden</p>
                    <p className="mx-auto mb-4 max-w-xs text-xs text-fg-muted">
                      Make sure nobody can see your screen and that you are not streaming or
                      recording.
                    </p>
                    <Button onClick={() => setConfirmOpen(true)}>
                      <Eye aria-hidden="true" />
                      Reveal keys
                    </Button>
                  </div>
                )}

                {details.map((item, idx) => (
                  <KeyGroup
                    key={idx}
                    item={item}
                    idx={idx}
                    revealed={revealed}
                    copiedId={copiedId}
                    onCopy={handleCopy}
                  />
                ))}

                {footerNote && (
                  <p className="pt-1 text-center text-xs text-fg-subtle">{footerNote}</p>
                )}
              </div>
            )}
          </DialogBody>
        </DialogContent>
      </Dialog>

      <ConfirmationModal
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Show your keys in plain text?"
        description={
          refundWindowDays
            ? `Your keys will be displayed on screen. Refunds on this order stay open for ${refundWindowDays} days, but once a key has been redeemed on the platform's side it usually cannot be refunded — so check the game and region are right before you redeem.`
            : "Your keys will be displayed on screen. Once a key has been redeemed on the platform's side it usually cannot be refunded — so check the game and region are right before you redeem."
        }
        confirmText="Show keys"
        cancelText="Keep hidden"
        onConfirm={() => setRevealed(true)}
      />
    </>
  );
}

/** One product's keys, with its platform badge and redemption route. */
function KeyGroup({ item, idx, revealed, copiedId, onCopy }) {
  const isAccount = item.productType === 'ACCOUNT_BASED';
  // getOrderById populates items.assignedKeyIds with keyType; the My License
  // Keys reveal passes it through. Absent on some payloads — hence the guard.
  const keyType = item.keyType;
  const redemption = getRedemption(keyType);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface-sunken">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
        <p className="text-sm font-medium text-fg">{item.productName}</p>
        {isKnownPlatform(keyType) && <PlatformBadge platform={keyType} />}
      </div>

      <div className="space-y-3 p-4">
        {item.refunded ? (
          <p className="text-sm text-fg-muted">
            This item was refunded and its key is no longer accessible.
          </p>
        ) : !item.keys?.length ? (
          <p className="text-sm text-fg-muted">Not available yet.</p>
        ) : (
          item.keys.map((keyVal, kIdx) => (
            <KeyRow
              key={kIdx}
              value={keyVal}
              isAccount={isAccount}
              productType={item.productType}
              revealed={revealed}
              id={`${idx}-${kIdx}`}
              productName={item.productName}
              copiedId={copiedId}
              onCopy={onCopy}
            />
          ))
        )}

        {redemption && !item.refunded && item.keys?.length > 0 && (
          <div className="rounded-lg border border-border bg-surface-1 p-3">
            <p className="mb-2 text-xs font-semibold tracking-wide text-fg-subtle uppercase">
              How to redeem on {redemption.label}
            </p>
            <ol className="mb-3 list-decimal space-y-1 pl-4 text-xs text-fg-muted">
              {redemption.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            <Button asChild variant="outline" size="sm">
              <a href={redemption.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink aria-hidden="true" />
                Redeem on {redemption.label}
              </a>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

/** A single key, or one account-credential block. */
function KeyRow({ value, isAccount, productType, revealed, id, productName, copiedId, onCopy }) {
  // The rows and their order come from @lib/accountCredentials, so the host
  // email and the seller's notes show up here without this component knowing
  // the field names.
  const isCredentialBlob = isAccount && typeof value === 'string' && value.trim().startsWith('{');
  const rows = isCredentialBlob ? describeAccountCredentials(value) : [];

  if (isCredentialBlob) {
    if (rows.length === 0) {
      return (
        <SecretField
          value={value}
          revealed={revealed}
          label="Credentials"
          id={id}
          copiedId={copiedId}
          onCopy={onCopy}
        />
      );
    }

    return (
      <div className="space-y-2.5 rounded-lg border border-border bg-surface-1 p-3.5">
        {rows.map(({ key, label, value: fieldValue }) => (
          <SecretField
            key={key}
            label={label}
            value={fieldValue}
            revealed={revealed}
            id={`${id}-${key}`}
            copiedId={copiedId}
            onCopy={onCopy}
          />
        ))}
      </div>
    );
  }

  return (
    <SecretField
      value={value}
      revealed={revealed}
      label={productName || deliveryWords(productType).title}
      href={isActivationLink(productType) && isHttpUrl(value) ? value : undefined}
      id={`key-${id}`}
      copiedId={copiedId}
      onCopy={onCopy}
    />
  );
}

/** Masked-or-revealed value with a copy control. */
function SecretField({ label, value, revealed, href, id, copiedId, onCopy }) {
  const display = revealed ? value : '•'.repeat(Math.min(String(value ?? '').length || 16, 28));
  const copied = copiedId === id;

  return (
    <div>
      {label && <p className="mb-1 text-[11px] tracking-wider text-fg-subtle uppercase">{label}</p>}
      <div className="flex items-center gap-2">
        {revealed && href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="min-w-0 flex-1 rounded-lg border border-border bg-surface-2 px-3 py-2 font-mono text-sm break-all text-accent-on-dark underline decoration-dotted"
          >
            {display}
          </a>
        ) : (
          <code
            className="min-w-0 flex-1 rounded-lg border border-border bg-surface-2 px-3 py-2 font-mono text-sm break-all text-fg select-all"
            aria-label={revealed ? undefined : 'Hidden until revealed'}
          >
            {display}
          </code>
        )}
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          disabled={!revealed}
          onClick={() => onCopy(value, label || 'License key', id)}
          aria-label={`Copy ${label || 'license key'}`}
        >
          {copied ? (
            <CheckCircle2 aria-hidden="true" className="text-success" />
          ) : (
            <Copy aria-hidden="true" />
          )}
        </Button>
      </div>
    </div>
  );
}
