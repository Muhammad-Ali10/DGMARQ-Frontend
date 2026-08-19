import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Key,
  Heart,
  Headphones,
  Package,
  Wallet,
} from 'lucide-react';
import { cn } from '@lib/utils';

/**
 * Mobile bottom navigation for the dashboards.
 *
 * Deliberately NOT `MobileBottomBar` — that one is the STOREFRONT bar (product
 * search with suggestions, cart, wishlist, account menu). A seller managing
 * inventory has no use for a cart button, and a buyer checking an order does not
 * need product search pinned to the bottom of the screen. Different job,
 * different component; the storefront bar stays on PublicLayout.
 *
 * Five destinations maximum — past that the targets get too narrow to hit.
 * Each is 56px tall, comfortably over the 44px minimum.
 */
const BUYER_ITEMS = [
  { to: '/user/dashboard', label: 'Home', icon: LayoutDashboard },
  { to: '/user/orders', label: 'Orders', icon: ShoppingCart },
  { to: '/user/license-keys', label: 'Keys', icon: Key },
  // The wishlist is a single page at /wishlist (the storefront route the header
  // and mobile bar link to), not a dashboard-only one.
  { to: '/wishlist', label: 'Wishlist', icon: Heart },
  { to: '/user/support', label: 'Support', icon: Headphones },
];

const SELLER_ITEMS = [
  { to: '/seller/dashboard', label: 'Home', icon: LayoutDashboard },
  { to: '/seller/orders', label: 'Orders', icon: ShoppingCart },
  { to: '/seller/license-keys', label: 'Stock', icon: Package },
  { to: '/seller/earnings', label: 'Earnings', icon: Wallet },
  { to: '/seller/support', label: 'Support', icon: Headphones },
];

/**
 * @param {"buyer"|"seller"} role
 */
export const DashboardBottomNav = ({ role }) => {
  const items = role === 'seller' ? SELLER_ITEMS : BUYER_ITEMS;

  return (
    <nav
      aria-label="Dashboard sections"
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface-base/80 backdrop-blur-md lg:hidden',
        // Keeps the bar clear of the iOS home indicator.
        'pb-[env(safe-area-inset-bottom)]'
      )}
    >
      <ul className="grid grid-cols-5">
        {items.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              className={({ isActive }) =>
                cn(
                  'nav-item nav-item--top group/nav flex h-14 flex-col items-center justify-center gap-1',
                  'text-[11px] font-medium',
                  'outline-none transition-[color,background-color,box-shadow] duration-200 ease-out',
                  'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
                  isActive ? 'text-fg' : 'text-fg-subtle hover:text-fg'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    aria-hidden="true"
                    className={cn(
                      'size-5 transition-[color,filter] duration-200 ease-out',
                      isActive
                        ? 'text-accent-on-dark [filter:drop-shadow(0_0_6px_var(--accent))]'
                        : 'text-accent-on-dark/70 group-hover/nav:text-accent-on-dark'
                    )}
                  />
                  {label}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default DashboardBottomNav;
