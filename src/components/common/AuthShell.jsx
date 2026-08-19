import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { ambianceGridStyle } from '@lib/surface';
import { cn } from '@lib/utils';

/* ============================================================================
   The v74 mockup's auth chrome, as ONE component: grid backdrop, three blurred
   glow orbs, the glass card with permanently-lit HUD brackets, the top scan
   hairline, the logo, and the pulsing "secure session" tag.

   Every auth screen (login, signup, forgot, reset) renders inside this, which is
   the whole point — the four pages used to be three different designs, two of
   them on a hardcoded `from-gray-900 via-gray-800` gradient that belonged to no
   palette.

   Values come from the design tokens in index.css, not the mockup's raw hexes.
   The mockup's #050c1a page / rgba(8,18,38,.85) card / #1e78ff accent are the
   same hue family as `--surface-base` (#041536), `--surface-1` (#0B2455) and
   `--accent` (#2563EB) — and the tokens are the ones whose text contrast has
   actually been measured. Reintroducing the literals would fork the palette.

   NOT ported from the mockup: the Orbitron webfont wordmark. The site owns a real
   logo asset and already loads Poppins; pulling a second display face for four
   pages costs a render-blocking font request to render a brand mark we have as an
   image. Same slot, same weight in the composition.
   ========================================================================== */

const LOGO_URL =
  'https://res.cloudinary.com/dhuhvbzpj/image/upload/f_auto,q_auto,w_220/v1773483947/logo_gos33k.png';

// The mockup's three orbs: a large indigo wash top-left, a smaller cyan one
// bottom-right, and a wide dim band through the middle. Pure decoration, so
// aria-hidden and pointer-events-none — they must never eat a click on the card.
const GlowOrbs = () => (
  <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
    <span className="absolute -top-16 -left-20 size-[380px] rounded-full bg-accent/20 blur-[80px]" />
    <span className="absolute bottom-10 -right-10 size-[260px] rounded-full bg-brand-cyan/10 blur-[80px]" />
    <span className="absolute top-1/2 left-1/2 h-[220px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/[0.07] blur-[80px]" />
  </div>
);

/**
 * @param {string}  title       card heading, e.g. 'Sign in to your account to continue'
 * @param {string}  hudTag      the small uppercase status line, e.g. 'Secure Session'
 * @param {'sm'|'md'} width     sm = 440px (login/forgot/reset), md = 460px (signup)
 * @param {boolean} showBackLink  the mockup's "Back to store" chip
 */
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
        // Lit at rest, not on hover: this card is the page, not a hover target.
        'hud-corners hud-corners-lit',
        width === 'md' ? 'max-w-[460px]' : 'max-w-[440px]'
      )}
    >
      {/* The mockup's scan hairline along the top edge. */}
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
