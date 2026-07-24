import { Search, X } from 'lucide-react';
import { Input } from '@components/ui/input';
import { cn } from '@lib/utils';

/**
 * Search field with a leading magnifier icon (and an optional clear button).
 * Standardizes the ~20 hand-rolled `relative` + `<Search/>` + `<Input pl-9…>`
 * blocks. Controlled — pass `value` and an `onChange` that receives the raw
 * string (not the event), so callers can wire `onChange={setSearchInput}`.
 *
 * @param {string} value
 * @param {(next: string) => void} onChange - receives the new string value
 * @param {() => void} [onClear] - when set, shows an X button that calls this
 * @param {string} [placeholder]
 * @param {string} [className] - classes for the wrapper (e.g. width/flex)
 * @param {string} [inputClassName] - extra classes for the <Input>
 */
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
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn('bg-secondary border-gray-700 text-white pl-9', showClear && 'pr-9', inputClassName)}
        {...props}
      />
      {showClear && (
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear search"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

export default SearchInput;
