import { Skeleton } from '@components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@components/ui/card';
import { TableCell, TableRow } from '@components/ui/table';
import { cn } from '@lib/utils';

export const StatCardSkeleton = ({ className }) => (
  <Card className={cn('hud-corners shadow-hud', className)}>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="size-9 rounded-lg" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-8 w-20" />
      <Skeleton className="mt-2 h-3 w-16" />
    </CardContent>
  </Card>
);

export const StatCardGridSkeleton = ({ count = 4, className }) => (
  <div className={cn('grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4', className)}>
    {Array.from({ length: count }, (_, i) => (
      <StatCardSkeleton key={i} />
    ))}
  </div>
);

export const OrderRowSkeleton = () => (
  <div className="flex items-center gap-4 rounded-xl border border-brand-cyan/12 bg-brand-cyan/3 px-3 py-3">
    <Skeleton className="size-14 shrink-0 rounded-md" />
    <div className="min-w-0 flex-1 space-y-2">
      <Skeleton className="h-4 w-2/5" />
      <div className="flex gap-2">
        <Skeleton className="h-5 w-16 rounded-sm" />
        <Skeleton className="h-5 w-20 rounded-sm" />
      </div>
    </div>
    <div className="flex shrink-0 flex-col items-end gap-2">
      <Skeleton className="h-5 w-16" />
      <Skeleton className="h-5 w-24 rounded-sm" />
    </div>
  </div>
);

export const OrderListSkeleton = ({ rows = 5 }) => (
  <div aria-hidden="true" className="space-y-1.5">
    {Array.from({ length: rows }, (_, i) => (
      <OrderRowSkeleton key={i} />
    ))}
  </div>
);

export const TableRowsSkeleton = ({ rows = 6, cols = 5 }) => (
  <>
    {Array.from({ length: rows }, (_, r) => (
      <TableRow key={r}>
        {Array.from({ length: cols }, (_, c) => (
          <TableCell key={c}>
            <Skeleton className="h-4 w-full max-w-[10rem]" />
          </TableCell>
        ))}
      </TableRow>
    ))}
  </>
);

export const FormSkeleton = ({ fields = 5, withHeader = true, className }) => (
  <div className={cn('space-y-8', className)} aria-busy="true" aria-live="polite">
    <span className="sr-only">Loading…</span>
    {withHeader && (
      <div className="space-y-2" aria-hidden="true">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
    )}
    <Card aria-hidden="true">
      <CardHeader>
        <Skeleton className="h-5 w-40" />
      </CardHeader>
      <CardContent className="space-y-5">
        {Array.from({ length: fields }, (_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-9 w-full rounded-md" />
          </div>
        ))}
        <Skeleton className="h-9 w-32 rounded-md" />
      </CardContent>
    </Card>
  </div>
);

export const CardListSkeleton = ({ rows = 4, className }) => (
  <div className={cn('space-y-3', className)} aria-hidden="true">
    {Array.from({ length: rows }, (_, i) => (
      <Card key={i}>
        <CardContent className="space-y-3 py-4">
          <div className="flex items-center justify-between gap-3">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-5 w-20 rounded-sm" />
          </div>
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-3 w-2/5" />
        </CardContent>
      </Card>
    ))}
  </div>
);
