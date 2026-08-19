import { cn } from '@lib/utils';

// The mockup's `.dg-divider` — a hairline, a small uppercase caption, a hairline.
// Shared because the label differs per page ("Or continue with" on login, "Or
// sign up with" on signup, "OR" in the register popup) while the rule never does.
const AuthDivider = ({ children, className }) => (
  <div className={cn('flex items-center gap-3', className)}>
    <span aria-hidden="true" className="h-px flex-1 bg-accent/15" />
    <span className="text-[11px] uppercase tracking-[0.08em] whitespace-nowrap text-fg-subtle">
      {children}
    </span>
    <span aria-hidden="true" className="h-px flex-1 bg-accent/15" />
  </div>
);

export default AuthDivider;
