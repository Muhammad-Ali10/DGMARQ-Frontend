import { KeyRound, UserRound, Gift, Link2, Package } from 'lucide-react';
import { Badge } from '@components/ui/badge';
import { cn } from '@lib/utils';
import { deliveryWords } from '@lib/deliveryType';

const ICONS = {
  LICENSE_KEY: KeyRound,
  ACCOUNT_BASED: UserRound,
  GIFT: Gift,
  ACTIVATION_LINK: Link2,
};

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
