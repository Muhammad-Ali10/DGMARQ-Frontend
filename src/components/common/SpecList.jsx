import { cn } from '@lib/utils';

/**
 * The label/value block every detail page is made of — order summaries, payout
 * breakdowns, product attributes.
 *
 * It exists because that block had been rewritten per page: two near-identical
 * local `Row` helpers (buyer OrderDetail, seller Dashboard) plus ~60 hand-rolled
 * `flex justify-between` pairs across the eight detail screens, each with its
 * own divider colour, label tone and value weight. One definition instead.
 *
 * The look is ProductDetail's spec table (`.fx-pd4`): cyan hairlines between
 * rows, a quiet label, a bold right-aligned value, and a faint cyan wash on
 * hover so the eye can track a row across a wide gap.
 *
 * Two deliberate departures from that stylesheet, both for contrast:
 *   - label colour is --fg-subtle, not its `rgba(123,159,255,.5)`. A 50%-alpha
 *     label drifts with whatever is behind it; --fg-subtle is measured at
 *     5.32–8.58 on every surface, which is what a micro-label needs.
 *   - sizes are text-xs / text-sm, not 11.5px / 12.5px — the type scale exists.
 */
const TONES = {
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
  info: 'text-info',
};

/**
 * @param {string} label
 * @param {React.ReactNode} value - text, a formatted amount, or a StatusBadge
 * @param {string} [hint] - supporting line under the label
 * @param {'success'|'warning'|'danger'|'info'} [tone] - colours the value only
 * @param {boolean} [emphasis] - totals: larger, no longer a quiet label
 */
export const SpecRow = ({ label, value, hint, tone, emphasis, className }) => (
  <div
    className={cn(
      'flex items-start justify-between gap-3 border-b border-brand-cyan/10 py-2.5',
      'transition-colors duration-150 ease-out last:border-0 hover:bg-brand-cyan/5',
      className
    )}
  >
    <div className="min-w-0">
      <dt className={emphasis ? 'text-sm font-semibold text-fg' : 'text-xs text-fg-subtle'}>
        {label}
      </dt>
      {hint && <p className="mt-0.5 text-xs text-fg-subtle">{hint}</p>}
    </div>
    <dd
      className={cn(
        'shrink-0 text-right tabular-nums',
        emphasis ? 'text-base font-semibold' : 'text-sm font-semibold',
        TONES[tone] || 'text-fg'
      )}
    >
      {value}
    </dd>
  </div>
);

/** Wrapper for a run of SpecRows. `dl` because that is what this markup is. */
export const SpecList = ({ children, className }) => (
  <dl className={cn('w-full', className)}>{children}</dl>
);

/**
 * The STACKED form of the same idea: label above, value below, in its own box.
 * Use it where the values are long enough that a right-aligned column would
 * leave a ragged gap — order IDs, names, product titles — and lay several out
 * in a grid. Use SpecRow where they are short and want to line up.
 *
 * It lived in buyer RefundDetail while seller RefundDetail hand-rolled four
 * copies of the same markup; it is here so there is one.
 */
export const Fact = ({ label, children, className }) => (
  <div className={cn('rounded-lg border border-brand-cyan/12 bg-brand-cyan/3 p-3', className)}>
    <dt className="text-xs text-fg-subtle">{label}</dt>
    <dd className="mt-1 text-sm text-fg">{children}</dd>
  </div>
);

export default SpecList;
