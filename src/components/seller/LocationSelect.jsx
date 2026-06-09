import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Search, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * A styled, searchable dropdown that matches the wizard's design. Used for the
 * country / state / city selects which are fed by react-country-state-city's
 * data helpers. Renders our own UI (the library ships its own components but we
 * want full styling control).
 *
 * Props:
 *  - options: Array<{ id, name }>
 *  - value: number|null            selected option id
 *  - onChange: (option) => void    fires with the full { id, name } object
 *  - placeholder, label, error, disabled, loading
 */
const LocationSelect = ({
  options = [],
  value,
  onChange,
  placeholder = 'Select…',
  label,
  error,
  disabled = false,
  loading = false,
  id,
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = options.find((o) => o.id === value);
  const filtered = query
    ? options.filter((o) => o.name.toLowerCase().includes(query.toLowerCase()))
    : options;

  const isDisabled = disabled || loading;

  return (
    <div className="space-y-1.5" ref={wrapRef}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-200">
          {label}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          id={id}
          disabled={isDisabled}
          onClick={() => setOpen((v) => !v)}
          className={cn(
            'flex h-11 w-full items-center justify-between rounded-lg border bg-white/[0.03] px-3.5 text-left text-sm transition-colors outline-none',
            'focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/40',
            error ? 'border-destructive seller-shake' : 'border-gray-600 hover:border-gray-500',
            isDisabled && 'cursor-not-allowed opacity-50',
          )}
        >
          <span className={cn('truncate', selected ? 'text-white' : 'text-gray-500')}>
            {loading ? 'Loading…' : selected ? selected.name : placeholder}
          </span>
          <ChevronDown
            className={cn('h-4 w-4 flex-shrink-0 text-gray-400 transition-transform', open && 'rotate-180')}
          />
        </button>

        {open && !isDisabled && (
          <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-lg border border-gray-600 bg-[#0a1f47] shadow-2xl seller-fade-in">
            <div className="flex items-center gap-2 border-b border-gray-700 px-3">
              <Search className="h-4 w-4 text-gray-400" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search…"
                className="h-10 w-full bg-transparent text-sm text-white placeholder:text-gray-500 outline-none"
              />
            </div>
            <ul className="max-h-60 overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <li className="px-3.5 py-2.5 text-sm text-gray-500">No matches</li>
              ) : (
                filtered.map((o) => (
                  <li key={o.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onChange(o);
                        setOpen(false);
                        setQuery('');
                      }}
                      className={cn(
                        'flex w-full items-center justify-between px-3.5 py-2.5 text-left text-sm transition-colors hover:bg-accent/20',
                        o.id === value ? 'text-accent' : 'text-gray-200',
                      )}
                    >
                      <span className="truncate">{o.name}</span>
                      {o.id === value && <Check className="h-4 w-4 flex-shrink-0" />}
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        )}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
};

export default LocationSelect;
