import { PROVIDER_LABELS, SOCIAL_PROVIDER_IDS, startSocialAuth } from '@lib/socialAuth';
import { cn } from '@lib/utils';

/* ============================================================================
   The ONE place social sign-in buttons are drawn.

   Before this, `window.location.href = ${API_ORIGIN}/api/v1/user/auth/...` was
   hand-written at seven call sites (Login, Register, SessionMenu,
   MobileBottomBar, Profile x2) — which is exactly why Facebook shipped with a
   working backend route and no button anywhere, and why Steam/Discord/PayPal
   were wearing generic lucide glyphs (Gamepad2 / MessagesSquare / Wallet).
   Adding a sixth provider is now a one-line change to SOCIAL_PROVIDER_IDS.

   WHY INLINE SVG RATHER THAN react-icons: these are brand marks, and the two
   that matter most are multi-colour — Google's mark is four colours and its
   brand guidelines require them, PayPal's is two-tone navy/blue. react-icons
   ships single-colour glyphs, so it physically cannot draw either one correctly.
   Paths are the mockup's, which are the providers' official ones.
   ========================================================================== */

const GoogleMark = (props) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

const FacebookMark = (props) => (
  <svg viewBox="0 0 24 24" fill="#1877F2" aria-hidden="true" {...props}>
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const DiscordMark = (props) => (
  <svg viewBox="0 0 24 24" fill="#5865F2" aria-hidden="true" {...props}>
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
  </svg>
);

const SteamMark = (props) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
    <path fill="rgba(180,200,230,0.85)" d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.029 4.524 4.524s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.606 0 11.979 0zM7.54 18.21l-1.473-.61c.262.543.714.999 1.314 1.25 1.297.539 2.793-.076 3.332-1.375.263-.63.264-1.319.005-1.949s-.75-1.121-1.377-1.383c-.624-.26-1.29-.249-1.878-.03l1.523.63c.956.4 1.409 1.5 1.009 2.455-.397.957-1.497 1.41-2.455 1.012H7.54zm11.415-9.303c0-1.662-1.353-3.015-3.015-3.015-1.665 0-3.015 1.353-3.015 3.015 0 1.665 1.35 3.015 3.015 3.015 1.663 0 3.015-1.35 3.015-3.015zm-5.273-.005c0-1.252 1.013-2.266 2.265-2.266 1.249 0 2.266 1.014 2.266 2.266 0 1.251-1.017 2.265-2.266 2.265-1.253 0-2.265-1.014-2.265-2.265z" />
  </svg>
);

const PayPalMark = (props) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
    <path fill="#003087" d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.59 3.025-2.566 4.643-5.813 4.643h-2.19a.56.56 0 0 0-.553.475L10.9 17.585h1.564a.56.56 0 0 0 .553-.475l.48-3.04c.083-.518.527-.9 1.05-.9h.663c3.26 0 5.818-1.326 6.563-5.158.319-1.625.054-2.96-.551-3.095z" />
    <path fill="#0070BA" d="M21.222 6.917c-.59 3.025-2.566 4.643-5.813 4.643h-2.19a.56.56 0 0 0-.553.475L11.35 18.89a.56.56 0 0 0 .553.644h2.74a.56.56 0 0 0 .552-.475l.228-1.442.446-2.824a.56.56 0 0 1 .553-.475h.663c3.26 0 5.818-1.326 6.563-5.158.32-1.625.054-2.96-.55-3.095-.128-.03-.26-.057-.394-.072a3.35 3.35 0 0 1-.483.924z" />
  </svg>
);

// Brand hover tints, straight from the mockup. These are the ONE place raw colour
// literals are correct in this codebase rather than a theme token: they are other
// companies' brand identities, so they must NOT drift with our palette. Written
// as complete literal class strings because Tailwind's scanner reads source text
// — a composed `hover:border-[${x}]` would compile to nothing.
const PROVIDERS = {
  google: {
    Mark: GoogleMark,
    hover: 'hover:border-[rgba(234,67,53,0.45)] hover:bg-[rgba(234,67,53,0.07)]',
  },
  facebook: {
    Mark: FacebookMark,
    hover: 'hover:border-[rgba(24,119,242,0.45)] hover:bg-[rgba(24,119,242,0.08)]',
  },
  discord: {
    Mark: DiscordMark,
    hover: 'hover:border-[rgba(88,101,242,0.5)] hover:bg-[rgba(88,101,242,0.09)]',
  },
  steam: {
    Mark: SteamMark,
    hover: 'hover:border-[rgba(180,200,230,0.35)] hover:bg-[rgba(180,200,230,0.06)]',
  },
  paypal: {
    Mark: PayPalMark,
    hover: 'hover:border-[rgba(0,112,186,0.45)] hover:bg-[rgba(0,112,186,0.08)]',
  },
};

// The mockup's `.dg-oauth-btn`, in tokens. min-h-11 (44px) rather than the
// mockup's 42px: 44px is the WCAG 2.5.8 / iOS touch-target floor, and these are
// the primary action on a phone.
const BUTTON_BASE = [
  'flex items-center justify-center gap-2 min-h-11 w-full',
  'rounded-lg border border-accent/20 bg-surface-sunken/60',
  'text-[13px] font-medium text-fg-muted',
  'cursor-pointer select-none',
  'transition-[color,border-color,background-color,transform] duration-150 ease-out',
  'hover:-translate-y-px hover:text-fg active:translate-y-0',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
  'disabled:pointer-events-none disabled:opacity-50',
].join(' ');

const ProviderButton = ({ providerId, labelPrefix, className, onNavigate }) => {
  const provider = PROVIDERS[providerId];
  if (!provider) return null;
  const { Mark, hover } = provider;
  const label = PROVIDER_LABELS[providerId];

  return (
    <button
      type="button"
      onClick={() => {
        onNavigate?.(providerId);
        startSocialAuth(providerId);
      }}
      className={cn(BUTTON_BASE, hover, className)}
    >
      <Mark className="size-[18px] shrink-0" />
      <span className="truncate">{labelPrefix ? `${labelPrefix} ${label}` : label}</span>
    </button>
  );
};

/**
 * @param {'grid'|'list'} layout   grid = the mockup's auth pages (2x2 + wide
 *                                 PayPal); list = the Register popup's stack.
 * @param {string} labelPrefix     e.g. 'Sign up with' / 'Continue with'. Omit
 *                                 for the bare brand name the grid uses.
 * @param {(id: string) => void} onNavigate  fires before the redirect — used by
 *                                 the popup to close itself first.
 */
const SocialAuthButtons = ({ layout = 'grid', labelPrefix, onNavigate, className }) => {
  if (layout === 'list') {
    return (
      <div className={cn('flex flex-col gap-2.5', className)}>
        {SOCIAL_PROVIDER_IDS.map((id) => (
          <ProviderButton
            key={id}
            providerId={id}
            labelPrefix={labelPrefix}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    );
  }

  // The mockup pairs the first four in a 2x2 and gives the last one the full
  // width — five in a 2-column grid would otherwise leave a lone orphan cell.
  const paired = SOCIAL_PROVIDER_IDS.slice(0, -1);
  const wide = SOCIAL_PROVIDER_IDS.at(-1);

  return (
    <div className={cn('space-y-2', className)}>
      <div className="grid grid-cols-2 gap-2">
        {paired.map((id) => (
          <ProviderButton
            key={id}
            providerId={id}
            labelPrefix={labelPrefix}
            onNavigate={onNavigate}
          />
        ))}
      </div>
      <ProviderButton
        providerId={wide}
        labelPrefix={labelPrefix || 'Continue with'}
        onNavigate={onNavigate}
      />
    </div>
  );
};

export default SocialAuthButtons;
