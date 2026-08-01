import { Skeleton } from '@components/ui/skeleton';

/**
 * Skeleton placeholder for a loading message thread — alternating left/right
 * bubbles so the layout doesn't jump when real messages arrive.
 */
export const MessageListSkeleton = () => {
  const rows = [
    { mine: false, w: 'w-40' },
    { mine: true, w: 'w-28' },
    { mine: false, w: 'w-56' },
    { mine: true, w: 'w-36' },
    { mine: false, w: 'w-24' },
  ];
  return (
    <div className="flex-1 overflow-hidden px-3 py-4 space-y-3">
      {rows.map((r, i) => (
        <div key={i} className={`flex ${r.mine ? 'justify-end' : 'justify-start'}`}>
          <Skeleton className={`h-10 ${r.w} rounded-lg opacity-30`} />
        </div>
      ))}
    </div>
  );
};

/**
 * Skeleton placeholder for the ticket list sidebar.
 */
export const TicketListSkeleton = ({ count = 5 }) => (
  <div className="space-y-2">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="p-3 rounded-lg bg-surface-2/60 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Skeleton className="h-4 w-32 opacity-30" />
          <Skeleton className="h-4 w-14 rounded-full opacity-30" />
        </div>
        <Skeleton className="h-3 w-48 opacity-20" />
      </div>
    ))}
  </div>
);
