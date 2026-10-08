import { Badge } from '@components/ui/badge';
import { getStatusDisplay } from '@lib/statusTaxonomy';
import { cn } from '@lib/utils';

export const StatusBadge = ({ domain, status, className, announce = false }) => {
  const { label, variant, icon: Icon } = getStatusDisplay(domain, status);

  const badge = (
    <Badge
      variant={variant}
      className={cn(announce && 'animate-status-settle', className)}
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
