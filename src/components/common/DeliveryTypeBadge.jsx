import { KeyRound, UserRound, Gift, Link2, Package } from 'lucide-react';
import { Badge } from '@components/ui/badge';
import { cn } from '@lib/utils';

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
const TYPES = {
  LICENSE_KEY: { label: 'Key', Icon: KeyRound, hint: 'Delivered as a license key' },
  ACCOUNT_BASED: { label: 'Account', Icon: UserRound, hint: 'Delivered as account credentials' },
  GIFT: { label: 'Gift code', Icon: Gift, hint: 'Delivered as a gift code' },
  ACTIVATION_LINK: { label: 'Link', Icon: Link2, hint: 'Delivered as an activation link' },
};

/**
 * @param {string} productType - one of LICENSE_KEY | ACCOUNT_BASED | GIFT | ACTIVATION_LINK
 */
export const DeliveryTypeBadge = ({ productType, className }) => {
  const entry = TYPES[productType] || {
    label: 'Digital',
    Icon: Package,
    hint: 'Digital delivery',
  };
  const { label, Icon, hint } = entry;

  return (
    <Badge variant="neutral" className={cn('gap-1.5', className)} title={hint}>
      <Icon aria-hidden="true" className="shrink-0" />
      {label}
    </Badge>
  );
};

export default DeliveryTypeBadge;
