import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { ambianceGridStyle } from '@lib/surface';
import { cn } from '@lib/utils';

const LOGO_URL =
  'https://res.cloudinary.com/dhuhvbzpj/image/upload/f_auto,q_auto,w_220/v1773483947/logo_gos33k.png';

const GlowOrbs = () => (
  <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
    <span className="absolute -top-16 -left-20 size-[380px] rounded-full bg-accent/20 blur-[80px]" />
    <span className="absolute bottom-10 -right-10 size-[260px] rounded-full bg-brand-cyan/10 blur-[80px]" />
    <span className="absolute top-1/2 left-1/2 h-[220px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/[0.07] blur-[80px]" />
  </div>
);

const AuthShell = ({ title, hudTag, width = 'sm', showBackLink = true, children }) => (
  <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-surface-base px-5 py-10">
    <div aria-hidden="true" style={ambianceGridStyle(true)} />
    <GlowOrbs />

    {showBackLink && (
      <Link
        to="/"
        className={cn(
          'fixed top-4 left-4 z-10 inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2',
          'border border-accent/40 bg-surface-1/70 backdrop-blur-sm',
          'text-[13px] font-semibold text-fg-muted shadow-e2',
          'transition-colors hover:border-accent hover:text-fg',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50'
        )}
      >
        <ChevronLeft className="size-4" aria-hidden="true" />
        Back to store
      </Link>
    )}

    <div
      className={cn(
        'relative z-[1] w-full rounded-2xl border border-accent/30 bg-surface-1/85 p-8 sm:p-9',
        'backdrop-blur-[20px] shadow-hud',
        'hud-corners hud-corners-lit',
        width === 'md' ? 'max-w-[460px]' : 'max-w-[440px]'
      )}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-0.5 rounded-t-2xl bg-linear-to-r from-transparent via-accent/25 to-transparent"
      />

      <img
        src={LOGO_URL}
        alt="DGMARQ"
        width={132}
        height={34}
        className="mx-auto mb-3 h-[34px] w-auto object-contain"
      />

      {hudTag && (
        <p className="mb-4 flex items-center justify-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.12em] text-accent-on-dark/70">
          <span
            aria-hidden="true"
            className="size-1.5 shrink-0 rounded-full bg-accent-on-dark shadow-[0_0_6px_var(--accent-on-dark)] motion-safe:animate-pulse"
          />
          {hudTag}
        </p>
      )}

      {title && <p className="mb-7 text-center text-[13px] text-fg-subtle">{title}</p>}

      {children}
    </div>
  </div>
);

export default AuthShell;
