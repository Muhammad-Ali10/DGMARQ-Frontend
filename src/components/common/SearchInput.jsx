import { Search, X } from 'lucide-react';
import { Input } from '@components/ui/input';
import { cn } from '@lib/utils';

export const SearchInput = ({
  value,
  onChange,
  onClear,
  placeholder = 'Search…',
  className,
  inputClassName,
  ...props
}) => {
  const showClear = onClear && value;
  return (
    <div className={cn('relative', className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-muted" />
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn('bg-secondary border-border text-fg pl-9', showClear && 'pr-9', inputClassName)}
        {...props}
      />
      {showClear && (
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear search"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-fg-muted hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

export default SearchInput;
