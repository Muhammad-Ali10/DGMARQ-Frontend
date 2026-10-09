import { CalendarClock } from 'lucide-react';
import { Badge } from '@components/ui/badge';
import { cn } from '@lib/utils';

export const isActivePreorder = (product) =>
  Boolean(product?.isPreorder && !product?.preorderReleasedAt);

export const formatReleaseDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? null
    : date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
};

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
