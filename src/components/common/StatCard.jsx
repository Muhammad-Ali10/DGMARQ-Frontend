import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@components/ui/card';
import { cn } from '@lib/utils';

/**
 * Dashboard KPI tile — one component for the two dashboard looks:
 *  - plain (admin / seller): a bare colored icon + optional description.
 *  - boxed + navigable (user): pass `iconBg` to box the icon in a tinted square;
 *    pass `href` to wrap the whole tile in a <Link>, or `onClick` to make it a
 *    clickable card.
 *
 * @param {string} title
 * @param {string|number} value
 * @param {React.ElementType} icon - a lucide icon component
 * @param {string} [color] - icon color class (e.g. "text-blue-500")
 * @param {string} [description] - supporting line under the value
 * @param {string} [iconBg] - tint class for the boxed icon (e.g. "bg-blue-500/10")
 * @param {string} [href] - if set, the tile links here
 * @param {() => void} [onClick] - if set (and no href), the tile is clickable
 */
export const StatCard = ({
  title,
  value,
  icon: Icon,
  color = 'text-white',
  description,
  iconBg,
  href,
  onClick,
  className,
}) => {
  const interactive = href || onClick;
  const card = (
    <Card
      className={cn(
        'bg-primary border-gray-700',
        interactive && 'cursor-pointer transition-all duration-300 hover:border-accent hover:shadow-lg hover:shadow-accent/10',
        className,
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-300">{title}</CardTitle>
        {Icon &&
          (iconBg ? (
            <div className={cn('p-2 rounded-lg', iconBg)}>
              <Icon className={cn('h-5 w-5', color)} />
            </div>
          ) : (
            <Icon className={cn('h-4 w-4', color)} />
          ))}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-white">{value}</div>
        {description && <p className="text-xs text-gray-400 mt-1">{description}</p>}
      </CardContent>
    </Card>
  );

  if (href) return <Link to={href}>{card}</Link>;
  if (onClick) {
    return (
      <div onClick={onClick} className="cursor-pointer">
        {card}
      </div>
    );
  }
  return card;
};

/** Responsive grid wrapper matching the dashboards' 1/2/4-column KPI row. */
export const StatCardGrid = ({ children, className }) => (
  <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4', className)}>
    {children}
  </div>
);

export default StatCard;
