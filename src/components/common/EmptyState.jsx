import { cn } from '@lib/utils';
import { TableRow, TableCell } from '@components/ui/table';

/**
 * Empty state for any list, card or table with no data.
 *
 * The contract: an icon in a tinted plate (the "illustration"), a one-line
 * explanation of why this is empty, and a primary action that resolves it.
 * An empty state should tell the user what to do next, not just report absence.
 *
 * Renders only the centred content — wrap it in <Card><CardContent> at the call
 * site when the surface needs a card.
 *
 * A bare title (no icon / description / action) keeps the quiet one-line
 * treatment, for genuinely incidental cases like an empty sub-list.
 *
 * @param {React.ElementType} [icon] - a lucide icon component
 * @param {string} title
 * @param {string} [description] - one line: why it's empty / what fills it
 * @param {React.ReactNode} [action] - CTA node, e.g. <Button asChild><Link/></Button>
 * @param {"neutral"|"success"} [tone] - `success` for states that are a GOOD
 *        outcome (an empty action queue is a reward, not a void)
 */
export const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  tone = 'neutral',
  className,
}) => {
  const bare = !Icon && !description && !action;

  if (bare) {
    return (
      <div className={cn('py-12 text-center text-sm text-fg-muted', className)}>{title}</div>
    );
  }

  return (
    <div className={cn('flex flex-col items-center py-12 text-center', className)}>
      {Icon && (
        <div
          className={cn(
            'mb-4 flex size-14 items-center justify-center rounded-xl border',
            tone === 'success'
              ? 'border-success/35 bg-success-soft text-success'
              : 'border-brand-cyan/25 bg-brand-cyan/6 text-info'
          )}
        >
          <Icon aria-hidden="true" className="size-7" />
        </div>
      )}
      {title && <h3 className="mb-1 text-base font-semibold text-fg">{title}</h3>}
      {description && <p className="mb-4 max-w-sm text-sm text-fg-muted">{description}</p>}
      {action}
    </div>
  );
};

/**
 * Empty-state row for a real <Table> body — one centred cell spanning every
 * column, so the table keeps its structure instead of collapsing.
 *
 * @param {number|string} colSpan - number of columns the table has
 */
export const TableEmptyRow = ({ colSpan, children, className }) => (
  <TableRow className="hover:bg-transparent">
    <TableCell colSpan={colSpan} className={cn('py-12 text-center text-fg-muted', className)}>
      {children}
    </TableCell>
  </TableRow>
);

export default EmptyState;
