import { useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@components/ui/input';
import { cn } from '@lib/utils';

/* ============================================================================
   The mockup's `.dg-input-wrap` — uppercase micro-label, an accent icon inside
   the field's left edge, an optional eye toggle, and a hint line underneath that
   turns green on valid / red on error.

   Wraps the shadcn `Input` primitive rather than a raw <input>: Input already
   owns the accessible focus ring, the 3:1 border affordance, the iOS 16px
   no-zoom rule and `pointer-coarse:min-h-11`. Re-declaring a bare input here
   would silently drop all four.
   ========================================================================== */

/**
 * @param {React.ElementType} icon      lucide icon rendered inside the left edge
 * @param {'ok'|'error'|null} state     drives the border + hint colour
 * @param {string} hint                 message under the field
 * @param {React.ReactNode} labelAside  right-aligned label slot, e.g. "Forgot?"
 * @param {string} className        goes to the INPUT
 * @param {string} wrapperClassName goes to the outer block — use it to drop the
 *   default bottom margin when the caller owns the spacing (e.g. the signup
 *   password field, which has a strength meter to fit underneath).
 */
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
    // A GRID, not stacked flex rows, so `labelAside` can sit visually up on the
    // label row while coming AFTER the input in the DOM.
    //
    // That is a real keyboard fix, not tidiness. The mockup draws "Forgot
    // password?" inside the label above the field, and rendering it there put the
    // link between the email and password inputs in tab order — so tabbing out of
    // Email landed on the link and Enter navigated away mid-login instead of
    // submitting. Grid placement decouples the visual row from source order, and
    // the source order (label, field, "forgot it?") is the sensible reading order
    // for a screen reader anyway.
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
          // `revealed` only ever applies to a password field, so a text input
          // cannot be flipped into something else by it.
          type={isPassword && revealed ? 'text' : type}
          aria-invalid={state === 'error' || undefined}
          aria-describedby={hint ? hintId : undefined}
          className={cn(
            'h-11 bg-surface-sunken/75',
            Icon && 'pl-10',
            isPassword && 'pr-10',
            // Only the success colour is stated here. The error border comes from
            // Input's own `aria-invalid:border-danger` rule, driven by the
            // aria-invalid above — so the visual and the accessible state cannot
            // disagree with each other.
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

      {/* Last in the DOM (so it tabs after the field) but placed on the label
          row. See the note on the grid above. */}
      {labelAside && (
        <span className="col-start-2 row-start-1 justify-self-end">{labelAside}</span>
      )}

      {hint && (
        <p
          id={hintId}
          // aria-live so a screen reader hears "Passwords do not match" as it
          // becomes true, rather than only on submit.
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
