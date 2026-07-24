import { cn } from '@lib/utils';
import { TableRow, TableCell } from '@components/ui/table';

/**
 * Centered empty-state placeholder for lists/cards with no data. Renders only
 * the centered content — wrap it in <Card><CardContent> at the call site when
 * the surface needs a card.
 *
 * A bare title (no icon / description / action) renders muted, matching the old
 * one-line "No X found" placeholders. Add an icon, description, or action to get
 * the richer treatment (prominent title + supporting copy + CTA).
 *
 * @param {React.ElementType} [icon] - a lucide icon component
 * @param {string} title
 * @param {string} [description]
 * @param {React.ReactNode} [action] - CTA node, e.g. a <Link><Button/></Link>
 */
export const EmptyState = ({ icon: Icon, title, description, action, className }) => {
  const bare = !Icon && !description && !action;
  return (
    <div className={cn('text-center py-12', className)}>
      {Icon && <Icon className="mx-auto mb-4 h-16 w-16 text-gray-600" />}
      {title && (
        <h3 className={bare ? 'text-gray-400' : 'mb-1 text-lg font-semibold text-white'}>
          {title}
        </h3>
      )}
      {description && <p className="mb-4 text-sm text-gray-400">{description}</p>}
      {action}
    </div>
  );
};

/**
 * Empty-state row for a shadcn <Table> body — a single centered cell spanning
 * every column. Use inside <TableBody> when a query returns no rows.
 *
 * @param {number|string} colSpan - number of columns the table has
 */
export const TableEmptyRow = ({ colSpan, children, className }) => (
  <TableRow>
    <TableCell colSpan={colSpan} className={cn('py-12 text-center text-gray-400', className)}>
      {children}
    </TableCell>
  </TableRow>
);

export default EmptyState;
