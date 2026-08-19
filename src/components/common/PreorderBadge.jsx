import { CalendarClock } from 'lucide-react';
import { Badge } from '@components/ui/badge';
import { cn } from '@lib/utils';

/**
 * "This is a pre-order, and here is the day it lands."
 *
 * `isPreorder` alone is NOT the question. The flag stays true forever after a
 * title releases — release only stamps `preorderReleasedAt` and converts the
 * product to an ordinary listing. Reading the flag on its own would leave a
 * PRE-ORDER badge on every released title for the rest of its life.
 */
export const isActivePreorder = (product) =>
  Boolean(product?.isPreorder && !product?.preorderReleasedAt);

export const formatReleaseDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? null
    : date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
};

/**
 * @param {object} product - needs isPreorder, preorderReleasedAt, preorderReleaseDate
 * @param {boolean} [withDate] - show the release date alongside the label
 */
export const PreorderBadge = ({ product, withDate = true, className }) => {
  if (!isActivePreorder(product)) return null;
  const released = withDate ? formatReleaseDate(product.preorderReleaseDate) : null;

  return (
    <Badge
      variant="warning"
      className={cn('gap-1.5', className)}
      title="Buyers pay now; the key is delivered on release day."
    >
      <CalendarClock aria-hidden="true" className="shrink-0" />
      {released ? `Pre-order · ${released}` : 'Pre-order'}
    </Badge>
  );
};

export default PreorderBadge;
