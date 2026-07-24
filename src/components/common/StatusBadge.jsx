import { Badge } from '@components/ui/badge';
import { getStatusDisplay } from '@lib/statusTaxonomy';

/**
 * Renders a status pill for a shared domain using the central taxonomy, so
 * labels and colors stay identical across admin / seller / user / public.
 *
 * @param {"order"|"payment"} domain - which status vocabulary to use
 * @param {string} status - the raw status value (case-insensitive)
 */
export const StatusBadge = ({ domain, status, className }) => {
  const { label, variant } = getStatusDisplay(domain, status);
  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  );
};

export default StatusBadge;
