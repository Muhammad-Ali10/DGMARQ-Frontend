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

export const PANEL =
  'rounded-2xl border border-brand-cyan/22 bg-linear-180 from-surface-1/90 to-surface-base/90 shadow-hud';

export const TILE =
  'relative overflow-hidden rounded-2xl border border-brand-cyan/22 bg-surface-1/90 shadow-hud hud-corners hud-spot outline-none focus-visible:ring-2 focus-visible:ring-ring';

export const BODY = 'text-[0.9375rem] leading-7 text-fg-muted';

export const LINK =
  'font-medium text-accent-on-dark underline decoration-accent-on-dark/40 underline-offset-4 transition-colors hover:decoration-accent-on-dark focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

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
