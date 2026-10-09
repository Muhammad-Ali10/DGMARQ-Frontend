import { cn } from '@lib/utils';

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
