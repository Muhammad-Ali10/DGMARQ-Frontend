import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Button } from '@components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { deliveryWords } from '@lib/deliveryType';
import { describeRow } from '../../utils/inventoryRows';

const ROW_HEIGHT = 56;
const VIRTUALIZE_FROM = 50;

const StagedRow = ({ row, productType, isEditing, onEdit, onRemove, style }) => {
  const { title, subtitle } = describeRow(row.data, productType);
  return (
    <div
      style={style}
      className={`flex items-center justify-between gap-3 px-3 border-b border-white/[0.06] ${isEditing ? 'bg-accent/[0.08]' : ''}`}
    >
      <div className="min-w-0">
        <p className="text-sm text-fg truncate font-mono">{title}</p>
        {subtitle && <p className="text-xs text-fg-muted truncate">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0 text-fg-muted hover:text-white"
          aria-label={`Edit ${title}`}
          onClick={() => onEdit(row)}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0 text-fg-muted hover:text-danger"
          aria-label={`Remove ${title}`}
          onClick={() => onRemove(row.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export const StagedInventoryList = ({ rows, productType, editingId, onEdit, onRemove, onClear }) => {
  const scrollRef = useRef(null);
  const virtualize = rows.length > VIRTUALIZE_FROM;

  const virtualizer = useVirtualizer({
    count: virtualize ? rows.length : 0,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 10,
  });

  const words = deliveryWords(productType);

  return (
    <div className="rounded-xl border border-white/[0.08] overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-white/[0.03] border-b border-white/[0.08]">
        <p className="text-sm font-semibold text-fg">
          Ready to upload: {rows.length} {rows.length === 1 ? words.one : words.many}
        </p>
        {rows.length > 0 && (
          <Button type="button" size="sm" variant="ghost" className="text-fg-muted hover:text-danger h-8" onClick={onClear}>
            Clear all
          </Button>
        )}
      </div>

      {rows.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-fg-muted">
          Nothing added yet. Fill the form above, or use the Import tab.
        </p>
      ) : (
        <div ref={scrollRef} className="max-h-64 overflow-y-auto">
          {virtualize ? (
            <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
              {virtualizer.getVirtualItems().map((virtualRow) => (
                <StagedRow
                  key={rows[virtualRow.index].id}
                  row={rows[virtualRow.index]}
                  productType={productType}
                  isEditing={editingId === rows[virtualRow.index].id}
                  onEdit={onEdit}
                  onRemove={onRemove}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: ROW_HEIGHT,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                />
              ))}
            </div>
          ) : (
            rows.map((row) => (
              <StagedRow
                key={row.id}
                row={row}
                productType={productType}
                isEditing={editingId === row.id}
                onEdit={onEdit}
                onRemove={onRemove}
                style={{ height: ROW_HEIGHT }}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default StagedInventoryList;
