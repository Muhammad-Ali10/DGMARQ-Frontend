import { cn } from '@lib/utils';
import { TableRow, TableCell } from '@components/ui/table';

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

export const TableEmptyRow = ({ colSpan, children, className }) => (
  <TableRow className="hover:bg-transparent">
    <TableCell colSpan={colSpan} className={cn('py-12 text-center text-fg-muted', className)}>
      {children}
    </TableCell>
  </TableRow>
);

export default EmptyState;
