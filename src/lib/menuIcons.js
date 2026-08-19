import {
  Calendar,
  Gamepad2,
  Gift,
  MonitorSmartphone,
  Boxes,
  Star,
  Hourglass,
  Tag,
  Zap,
  Trophy,
  ShieldCheck,
  Music,
  Film,
  Cloud,
  Cpu,
  Smartphone,
  KeyRound,
  Users,
  Sparkles,
  Layers,
  Flame,
  CreditCard,
  Headphones,
  Menu,
  Gem,
  Globe,
} from 'lucide-react';

// M15: the fixed icon set an admin can pick from — used by the header menu
// items and the homepage trust tiles.
//
// A closed registry rather than an upload field on purpose — icons ship inside
// the bundle, so a menu item costs zero extra network requests on a component
// that mounts on every page. Adding a choice means adding a line here.
export const MENU_ICONS = {
  calendar: Calendar,
  gamepad: Gamepad2,
  gift: Gift,
  monitor: MonitorSmartphone,
  box: Boxes,
  star: Star,
  hourglass: Hourglass,
  tag: Tag,
  zap: Zap,
  trophy: Trophy,
  shield: ShieldCheck,
  music: Music,
  film: Film,
  cloud: Cloud,
  cpu: Cpu,
  phone: Smartphone,
  key: KeyRound,
  users: Users,
  sparkles: Sparkles,
  layers: Layers,
  flame: Flame,
  card: CreditCard,
  headphones: Headphones,
  menu: Menu,
  gem: Gem,
  globe: Globe,
};

export const MENU_ICON_KEYS = Object.keys(MENU_ICONS);

// Falls back to a neutral glyph so an unknown/blank key never renders a hole in
// the nav bar (e.g. after an icon is retired from the registry above).
export const getMenuIcon = (key) => MENU_ICONS[key] || Boxes;
