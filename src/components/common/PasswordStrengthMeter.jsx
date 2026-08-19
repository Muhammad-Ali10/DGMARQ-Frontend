import { PASSWORD_RULES } from '@lib/passwordPolicy';
import { cn } from '@lib/utils';

// The mockup's four-segment meter. One segment per rule in PASSWORD_RULES, so the
// bar is not a vibe — a full bar means the server will accept the password.
//
// Colour by score, matching the mockup's red -> orange -> blue -> green ramp,
// through tokens. Literal class strings (not composed) so Tailwind's scanner sees
// them.
const FILL_BY_SCORE = [
  '', // score 0 — nothing filled
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
    {/* The bars are decorative; this text is the accessible signal, so it is the
        part that gets announced. */}
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
