import { PASSWORD_RULES } from '@lib/passwordPolicy';
import { cn } from '@lib/utils';

const FILL_BY_SCORE = [
  '',
  'bg-danger',
  'bg-warning',
  'bg-accent-on-dark',
  'bg-success-solid',
];

const LABEL_BY_SCORE = [
  '',
  'text-danger',
  'text-warning',
  'text-accent-on-dark',
  'text-success-solid',
];

const PasswordStrengthMeter = ({ score, label, className }) => (
  <div className={cn('mt-2 flex items-center gap-1', className)}>
    {PASSWORD_RULES.map((rule, i) => (
      <span
        key={rule.id}
        aria-hidden="true"
        className={cn(
          'h-[3px] flex-1 rounded-full transition-colors duration-300',
          i < score ? FILL_BY_SCORE[score] : 'bg-accent/12'
        )}
      />
    ))}
    <span
      aria-live="polite"
      className={cn(
        'min-w-[38px] text-right text-[11px] tracking-[0.03em]',
        LABEL_BY_SCORE[score]
      )}
    >
      {label}
    </span>
  </div>
);

export default PasswordStrengthMeter;
