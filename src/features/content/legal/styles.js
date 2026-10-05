import {
  Archive,
  BadgeCheck,
  CalendarClock,
  Clock3,
  CreditCard,
  Globe,
  Landmark,
  Lock,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  UserCheck,
  Wallet,
} from 'lucide-react';

/**
 * Text-bearing surface for every legal panel (hero, sections, TOC, CTA).
 *
 * 0.9 alpha, not the dashboard glass's 0.45: `--glass-alpha` in index.css is the
 * measured floor for glass that carries body text over an ARBITRARY backdrop,
 * and a public page sits on the photo backdrop with no scrim. These are
 * long-form reading surfaces, so they stay at the floor. The cyan rim and
 * `shadow-hud` bloom are what keep them in the HUD language.
 */
export const PANEL =
  'rounded-2xl border border-brand-cyan/22 bg-linear-180 from-surface-1/90 to-surface-base/90 shadow-hud';

/**
 * A link tile (highlights, related policies). It is a hover TARGET, so it takes
 * the brackets + spotlight pair, per the rule that brackets belong to the thing
 * being pointed at. Background-COLOR only: `hud-spot` paints its wash as a
 * background-IMAGE on hover, which would replace a gradient fill outright.
 */
export const TILE =
  'relative overflow-hidden rounded-2xl border border-brand-cyan/22 bg-surface-1/90 shadow-hud hud-corners hud-spot outline-none focus-visible:ring-2 focus-visible:ring-ring';

/** Body copy: 15/28 keeps long clauses readable without a 16px Poppins line
 *  running past ~85 characters in the article column. */
export const BODY = 'text-[0.9375rem] leading-7 text-fg-muted';

export const LINK =
  'font-medium text-accent-on-dark underline decoration-accent-on-dark/40 underline-offset-4 transition-colors hover:decoration-accent-on-dark focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

/** Icon keys documents may use. Keys (not components) keep the documents plain data. */
export const ICONS = {
  archive: Archive,
  calendar: CalendarClock,
  card: CreditCard,
  check: BadgeCheck,
  clock: Clock3,
  globe: Globe,
  landmark: Landmark,
  lock: Lock,
  mail: Mail,
  pin: MapPin,
  phone: Phone,
  shield: ShieldCheck,
  user: UserCheck,
  wallet: Wallet,
};
