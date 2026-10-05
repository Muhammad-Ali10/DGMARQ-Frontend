import { KeyRound, UserRound, Gift, Link2, Package } from 'lucide-react';
import { Badge } from '@components/ui/badge';
import { cn } from '@lib/utils';
import { deliveryWords } from '@lib/deliveryType';

/**
 * How a purchase is delivered, from `Product.productType` — the field the order
 * endpoints actually populate (`name images slug productType`).
 *
 * This answers "what will I receive?", which is the real buyer question on an
 * order row. It is NOT a platform badge and must not be dressed up as one; see
 * <PlatformBadge> for that distinction.
 *
 * lucide only — brand marks live exclusively in PlatformBadge.
 */
// Wording comes from @lib/deliveryType so the badge, the seller's upload dialog
// and the buyer's delivery all say the same thing; only the icons live here.
const ICONS = {
  LICENSE_KEY: KeyRound,
  ACCOUNT_BASED: UserRound,
  GIFT: Gift,
  ACTIVATION_LINK: Link2,
};

/**
 * @param {string} productType - one of LICENSE_KEY | ACCOUNT_BASED | GIFT | ACTIVATION_LINK
 */
export const DeliveryTypeBadge = ({ productType, className }) => {
  const words = deliveryWords(productType);
  const Icon = ICONS[productType] || Package;
  const label = words.short;
  const hint = `Delivered as ${words.one === 'account' ? 'account credentials' : `a ${words.one}`}`;

  return (
    <Badge variant="neutral" className={cn('gap-1.5', className)} title={hint}>
      <Icon aria-hidden="true" className="shrink-0" />
      {label}
    </Badge>
  );
};

export default DeliveryTypeBadge;
