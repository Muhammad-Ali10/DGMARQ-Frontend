import { cn } from '@lib/utils';

const TONES = {
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
  info: 'text-info',
};

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

export const SpecList = ({ children, className }) => (
  <dl className={cn('w-full', className)}>{children}</dl>
);

export const Fact = ({ label, children, className }) => (
  <div className={cn('rounded-lg border border-brand-cyan/12 bg-brand-cyan/3 p-3', className)}>
    <dt className="text-xs text-fg-subtle">{label}</dt>
    <dd className="mt-1 text-sm text-fg">{children}</dd>
  </div>
);

export default SpecList;
