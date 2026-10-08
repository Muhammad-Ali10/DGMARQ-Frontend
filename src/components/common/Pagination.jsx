import { Button } from '@components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const pageWindow = (page, totalPages, size = 5) => {
  const count = Math.min(size, totalPages);
  let start;
  if (totalPages <= size) start = 1;
  else if (page <= 3) start = 1;
  else if (page >= totalPages - 2) start = totalPages - (size - 1);
  else start = page - 2;
  return Array.from({ length: count }, (_, i) => start + i);
};

export const Pagination = ({
  page,
  totalPages,
  onPageChange,
  variant = 'default',
  total,
  totalNoun,
  className,
}) => {
  if (!totalPages || totalPages <= 1) return null;

  const go = (p) => onPageChange(Math.min(totalPages, Math.max(1, p)));
  const atStart = page <= 1;
  const atEnd = page >= totalPages;

  if (variant === 'compact') {
    return (
      <div className={className || 'flex items-center justify-center gap-2 mt-8'}>
        <Button variant="outline" size="icon" onClick={() => go(page - 1)} disabled={atStart} aria-label="Previous page">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="px-4 text-sm tabular-nums text-fg">Page {page} of {totalPages}</span>
        <Button variant="outline" size="icon" onClick={() => go(page + 1)} disabled={atEnd} aria-label="Next page">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className={className || 'mt-6 flex flex-col items-center justify-between gap-4 border-t border-brand-cyan/10 pt-4 sm:flex-row'}>
      {total == null ? (
        <span />
      ) : (
        <span className="text-sm tabular-nums text-fg-muted">
          Showing page {page} of {totalPages} ({total} total{totalNoun ? ` ${totalNoun}` : ''})
        </span>
      )}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => go(page - 1)} disabled={atStart}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>
        {variant === 'numbered' ? (
          <div className="flex items-center gap-1">
            {pageWindow(page, totalPages).map((n) => (
              <Button
                key={n}
                variant={page === n ? 'default' : 'outline'}
                size="sm"
                onClick={() => go(n)}
                aria-label={`Go to page ${n}`}
                aria-current={page === n ? 'page' : undefined}
              >
                {n}
              </Button>
            ))}
          </div>
        ) : (
          <span className="px-2 text-sm tabular-nums text-fg-muted">Page {page} of {totalPages}</span>
        )}
        <Button variant="outline" size="sm" onClick={() => go(page + 1)} disabled={atEnd}>
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
};

export default Pagination;
