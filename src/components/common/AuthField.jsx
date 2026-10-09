import { useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@components/ui/input';
import { cn } from '@lib/utils';

const AuthField = ({
  id,
  label,
  labelAside,
  icon: Icon,
  hint,
  state = null,
  type = 'text',
  className,
  wrapperClassName,
  ...inputProps
}) => {
  const generatedId = useId();
  const fieldId = id || generatedId;
  const hintId = `${fieldId}-hint`;
  const isPassword = type === 'password';
  const [revealed, setRevealed] = useState(false);

  return (
    <div
      className={cn(
        'mb-3.5 grid grid-cols-[1fr_auto] items-center gap-x-2 gap-y-1.5',
        wrapperClassName
      )}
    >
      <label
        htmlFor={fieldId}
        className="col-start-1 row-start-1 block text-[11px] font-medium uppercase tracking-[0.05em] text-fg-subtle"
      >
        {label}
      </label>

      <div className="relative col-span-2 row-start-2">
        {Icon && (
          <Icon
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-accent-on-dark/50"
          />
        )}
        <Input
          id={fieldId}
          type={isPassword && revealed ? 'text' : type}
          aria-invalid={state === 'error' || undefined}
          aria-describedby={hint ? hintId : undefined}
          className={cn(
            'h-11 bg-surface-sunken/75',
            Icon && 'pl-10',
            isPassword && 'pr-10',
            state === 'ok' && 'border-success-solid/45',
            className
          )}
          {...inputProps}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setRevealed((v) => !v)}
            aria-label={revealed ? 'Hide password' : 'Show password'}
            aria-pressed={revealed}
            className={cn(
              'absolute top-1/2 right-2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md',
              'text-fg-subtle/70 transition-colors hover:text-accent-on-dark',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50'
            )}
          >
            {revealed ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        )}
      </div>

      {labelAside && (
        <span className="col-start-2 row-start-1 justify-self-end">{labelAside}</span>
      )}

      {hint && (
        <p
          id={hintId}
          aria-live="polite"
          className={cn(
            'col-span-2 row-start-3 text-[11px] leading-relaxed',
            state === 'error' && 'text-danger',
            state === 'ok' && 'text-success-solid',
            !state && 'text-fg-subtle'
          )}
        >
          {hint}
        </p>
      )}
    </div>
  );
};

export default AuthField;
