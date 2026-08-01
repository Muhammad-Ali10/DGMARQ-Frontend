import { Badge } from '@components/ui/badge';
import { getStatusDisplay } from '@lib/statusTaxonomy';
import { cn } from '@lib/utils';

/**
 * The status pill for every shared domain — one vocabulary, one colour mapping,
 * one shape, across admin / seller / user / public. Replaces the four competing
 * status maps that used to live inline in seller/Orders, seller/LicenseKeys,
 * seller/SellerOffers and user/ReturnRefunds.
 *
 * Always renders icon + label, so the colour is reinforcement rather than the
 * carrier of meaning.
 *
 * `announce` adds an aria-live region: use it where a socket-driven refetch can
 * change the status while the user is looking at it, so the change is spoken
 * instead of silently swapping. It also plays a 200ms settle so the change is
 * visible rather than a snap. Off by default — a table of 50 rows must not
 * announce 50 things.
 *
 * @param {"order"|"payment"|"offer"|"licenseKey"} domain - which vocabulary
 * @param {string} status - the raw status value (case-insensitive)
 * @param {boolean} [announce] - wrap in aria-live and animate on change
 */
export const StatusBadge = ({ domain, status, className, announce = false }) => {
  const { label, variant, icon: Icon } = getStatusDisplay(domain, status);

  const badge = (
    <Badge
      variant={variant}
      className={cn(announce && 'animate-status-settle', className)}
      // Re-mounting on status change is what restarts the settle animation.
      key={announce ? String(status) : undefined}
    >
      {Icon && <Icon aria-hidden="true" />}
      {label}
    </Badge>
  );

  if (!announce) return badge;

  return (
    <span role="status" aria-live="polite" aria-atomic="true" className="inline-flex">
      {badge}
    </span>
  );
};

export default StatusBadge;
