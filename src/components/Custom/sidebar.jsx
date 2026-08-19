import { NavLink, Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { logout } from "@store/slices/authSlice";
import { authAPI } from "@services/api";
import { cn } from "@lib/utils";
import { Button } from "@components/ui/button";
import SafeImage from "@components/ui/safe-image";
// TODO(structure): a shared ui primitive importing a feature hook is a ui→feature
// coupling. Consider lifting the unread-badge wiring up to the sidebar's consumer
// and passing the count in as a prop.
import { useSupportUnread } from "@features/support";
import {
  LayoutDashboard,
  Users,
  Store,
  Package,
  ShoppingCart,
  DollarSign,
  Headphones,
  BarChart3,
  Settings,
  Heart,
  CreditCard,
  MessageSquare,
  FolderTree,
  Layers,
  Monitor,
  Ticket,
  Key,
  Smartphone,
  Globe,
  Music,
  Palette,
  Gamepad2,
  Tag,
  Zap,
  Image,
  Flame,
  RotateCcw,
  Repeat,
  Bell,
  Wallet,
  User,
  Star,
  Boxes,
  LogOut,
  Calendar,
  Clock,
  Library,
  ClipboardList,
  LayoutList,
  ListTree,
} from "lucide-react";

const SidebarLogo = () => {
  return (
    <Link
      to="/"
      className="flex items-center gap-2 border-b border-border/60 px-6 py-4 outline-none transition-opacity duration-150 ease-out hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
    >
      <SafeImage
        src="https://res.cloudinary.com/dhuhvbzpj/image/upload/v1773483947/logo_gos33k.png"
        alt="logo"
        className="w-3/4 h-10"
      />
    </Link>
  );
};

const LogoutButton = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const logoutMutation = useMutation({
    mutationFn: () => authAPI.logout(),
    onSuccess: () => {
      dispatch(logout());
      queryClient.clear();
      navigate("/");
    },
    onError: () => {
      dispatch(logout());
      queryClient.clear();
      navigate("/");
    },
  });

  return (
    <Button
      variant="ghost"
      className="w-full justify-start text-danger hover:bg-danger-soft hover:text-danger"
      onClick={() => logoutMutation.mutate()}
      disabled={logoutMutation.isPending}
    >
      <LogOut className="mr-3 h-5 w-5" />
      {logoutMutation.isPending ? "Logging out..." : "Logout"}
    </Button>
  );
};

const SidebarBadge = ({ count }) =>
  count > 0 ? (
    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-danger-solid px-1 text-[10px] font-semibold text-on-solid">
      {count > 9 ? '9+' : count}
    </span>
  ) : null;

/**
 * Nav item, styled after the public header's command bar (`.fx-cmd-*` in
 * Header.css) so the dashboard reads as the same product.
 *
 * Taken from it: the accent gradient pill fading downward, the inner hairline,
 * the outer glow, the periwinkle icons that gain a drop-shadow, and the
 * blue -> violet edge bar (there a glowing underline, here rotated to a left
 * edge). Those values are matched, not approximated.
 *
 * Deliberately NOT taken:
 *   - the recessed container. That bar's look comes from being a well with
 *     items floating in it; wrapping the sidebar in one would re-block the
 *     backdrop we just made flow through it.
 *   - uppercase labels. Fine for 5 items in a row, but this list is 13-15 items
 *     stacked, and all-caps removes word-shape recognition, which is what makes
 *     a vertical list scannable. Caps stay on the section headers only.
 *   - the sliding hover spotlight. In the header it is the ONLY highlight
 *     (`onMouseEnter={moveSpot}` — it tracks the cursor, it does not show the
 *     current page). A sidebar has to show where you are, and a bar racing up
 *     and down 15 items would compete with that.
 */
const ITEM_BASE = [
  "nav-item group/nav flex items-center rounded-md px-3 py-2.5 text-sm font-medium",
  "outline-none transition-[color,background-color,box-shadow] duration-200 ease-out",
  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
  "pointer-coarse:min-h-11",
];

// The pill, hairline, glow and left edge bar live in index.css under
// `.nav-item` — see the note there on why they cannot be Tailwind arbitrary
// values. NavLink already sets aria-current="page" on the active route, so the
// stylesheet keys off that: the accessible attribute IS the styling hook, and
// the two can never disagree.
const ITEM_ACTIVE = ["text-fg"];

const ITEM_IDLE = [
  "text-fg-muted hover:bg-surface-2/60 hover:text-fg",
];

const SidebarItem = ({ to, icon: Icon, children, onClick, badge = 0 }) => {
  const icon = Icon && (
    <Icon
      aria-hidden="true"
      className={cn(
        "mr-3 size-5 shrink-0 transition-[color,filter] duration-200 ease-out",
        // Periwinkle at rest, full accent + glow on hover — the header's
        // drop-shadow(0 0 6px) treatment.
        "text-accent-on-dark/70",
        "group-hover/nav:text-accent-on-dark group-hover/nav:[filter:drop-shadow(0_0_6px_var(--accent))]"
      )}
    />
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cn(ITEM_BASE, ITEM_IDLE, "w-full text-left")}>
        {icon}
        {children}
        <SidebarBadge count={badge} />
      </button>
    );
  }

  return (
    <NavLink
      to={to}
      className={({ isActive }) => cn(ITEM_BASE, isActive ? ITEM_ACTIVE : ITEM_IDLE)}
    >
      {({ isActive }) => (
        <>
          {Icon && (
            <Icon
              aria-hidden="true"
              className={cn(
                "mr-3 size-5 shrink-0 transition-[color,filter] duration-200 ease-out",
                isActive
                  ? "text-accent-on-dark [filter:drop-shadow(0_0_6px_var(--accent))]"
                  : "text-accent-on-dark/70 group-hover/nav:text-accent-on-dark group-hover/nav:[filter:drop-shadow(0_0_6px_var(--accent))]"
              )}
            />
          )}
          {children}
          <SidebarBadge count={badge} />
        </>
      )}
    </NavLink>
  );
};

/**
 * Group heading. This is where the header bar's uppercase micro-type belongs —
 * a handful of headings, not every item.
 */
const SidebarSection = ({ label, children }) => (
  <div className="pt-4">
    {/* Hairline that fades at both ends, as between the header's nav items. */}
    <div aria-hidden="true" className="nav-divider mb-2" />
    {label && (
      <p className="px-3 pb-1 text-[11px] font-semibold tracking-[0.07em] text-fg-subtle uppercase">
        {label}
      </p>
    )}
    {children}
  </div>
);

export const AdminSidebar = () => {
  return (
    <aside className="flex h-full w-64 flex-col border-r border-border bg-transparent">
      {/* Logo at Top */}
      <SidebarLogo />

      {/* Scrollable Menu */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-4">
        <SidebarItem to="/admin/dashboard" icon={LayoutDashboard}>
          Dashboard
        </SidebarItem>
        <SidebarItem to="/admin/users" icon={Users}>
          Users
        </SidebarItem>
        <SidebarItem to="/admin/sellers" icon={Store}>
          Sellers
        </SidebarItem>
        <SidebarItem to="/admin/catalog" icon={Library}>
          Master Catalog
        </SidebarItem>
        <SidebarItem to="/admin/offers" icon={ClipboardList}>
          Seller Offers
        </SidebarItem>
        <SidebarItem to="/admin/bundle-deals" icon={Boxes}>
          Bundle Deals
        </SidebarItem>
        <SidebarItem to="/admin/orders" icon={ShoppingCart}>
          Orders
        </SidebarItem>
        <SidebarItem to="/admin/payouts" icon={DollarSign}>
          Payouts
        </SidebarItem>
        <SidebarItem to="/admin/support" icon={Headphones}>
          Support
        </SidebarItem>
        <SidebarItem to="/admin/notifications" icon={Bell}>
          Notifications
        </SidebarItem>
        <SidebarItem to="/admin/analytics" icon={BarChart3}>
          Analytics
        </SidebarItem>
        <SidebarSection label="Category Management">
          <SidebarItem to="/admin/categories" icon={FolderTree}>
            Categories
          </SidebarItem>
          <SidebarItem to="/admin/subcategories" icon={Layers}>
            Subcategories
          </SidebarItem>
          <SidebarItem to="/admin/platforms" icon={Monitor}>
            Platforms
          </SidebarItem>
          <SidebarItem to="/admin/devices" icon={Smartphone}>
            Devices
          </SidebarItem>
          <SidebarItem to="/admin/regions" icon={Globe}>
            Regions
          </SidebarItem>
          <SidebarItem to="/admin/genres" icon={Music}>
            Genres
          </SidebarItem>
          <SidebarItem to="/admin/themes" icon={Palette}>
            Themes
          </SidebarItem>
          <SidebarItem to="/admin/modes" icon={Gamepad2}>
            Modes
          </SidebarItem>
          <SidebarItem to="/admin/types" icon={Tag}>
            Types
          </SidebarItem>
        </SidebarSection>
        <SidebarSection label="Marketing">
          <SidebarItem to="/admin/flash-deals" icon={Zap}>
            Flash Deals
          </SidebarItem>
          <SidebarItem to="/admin/trending-offers" icon={Flame}>
            Trending Offers
          </SidebarItem>
          <SidebarItem to="/admin/homepage-sliders" icon={Image}>
            Homepage Sliders
          </SidebarItem>
          <SidebarItem to="/admin/homepage-sections" icon={LayoutList}>
            Homepage Sections
          </SidebarItem>
          <SidebarItem to="/admin/menu" icon={ListTree}>
            Header Menu
          </SidebarItem>
          <SidebarItem to="/admin/upcoming-releases" icon={Calendar}>
            Upcoming Releases
          </SidebarItem>
          <SidebarItem to="/admin/upcoming-games" icon={Clock}>
            Upcoming Games
          </SidebarItem>
          <SidebarItem to="/admin/coupons" icon={Ticket}>
            Coupons
          </SidebarItem>
        </SidebarSection>
        <SidebarSection label="Management">
          <SidebarItem to="/admin/return-refund" icon={RotateCcw}>
            Return/Refund
          </SidebarItem>
          <SidebarItem to="/admin/subscriptions" icon={Repeat}>
            Subscriptions
          </SidebarItem>
          <SidebarItem to="/admin/payout-accounts" icon={Wallet}>
            Payout Accounts
          </SidebarItem>
        </SidebarSection>
        <SidebarItem to="/admin/settings" icon={Settings}>
          Settings
        </SidebarItem>
      </nav>

      {/* Logout Button at Bottom */}
      <div className="shrink-0 border-t border-border p-4">
        <LogoutButton />
      </div>
    </aside>
  );
};

export const SellerSidebar = () => {

  return (
    <aside className="flex h-full w-64 flex-col border-r border-border bg-transparent">
      {/* Logo at Top */}
      <SidebarLogo />

      {/* Scrollable Menu */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-4">
        <SidebarItem to="/seller/dashboard" icon={LayoutDashboard}>
          Dashboard
        </SidebarItem>
        <SidebarItem to="/seller/catalog" icon={Package}>
          Browse Catalog
        </SidebarItem>
        <SidebarItem to="/seller/offers" icon={Store}>
          My Offers
        </SidebarItem>
        <SidebarItem to="/seller/orders" icon={ShoppingCart}>
          Orders
        </SidebarItem>
        <SidebarItem to="/seller/earnings" icon={DollarSign}>
          Earnings
        </SidebarItem>
        <SidebarItem to="/seller/payout-account" icon={CreditCard}>
          Payout Account
        </SidebarItem>
        <SidebarItem to="/seller/performance" icon={BarChart3}>
          Performance
        </SidebarItem>
        <SidebarItem to="/seller/support" icon={Headphones}>
          Support
        </SidebarItem>
        <SidebarItem to="/seller/chat" icon={MessageSquare}>
          Chat
        </SidebarItem>
        <SidebarItem to="/seller/notifications" icon={Bell}>
          Notifications
        </SidebarItem>
        <SidebarItem to="/seller/return-refunds" icon={RotateCcw}>
          Return/Refunds
        </SidebarItem>
        <SidebarItem to="/seller/subscriptions" icon={Repeat}>
          Subscriptions
        </SidebarItem>
        <SidebarItem to="/seller/license-keys" icon={Key}>
          License Keys
        </SidebarItem>
        <SidebarItem to="/seller/analytics" icon={BarChart3}>
          Analytics
        </SidebarItem>
        <SidebarItem to="/seller/reviews" icon={Star}>
          Reviews
        </SidebarItem>
        <SidebarSection>
          <SidebarItem to="/seller/profile" icon={User}>
            Profile
          </SidebarItem>
        </SidebarSection>
      </nav>

      {/* Logout Button at Bottom */}
      <div className="shrink-0 border-t border-border p-4">
        <LogoutButton />
      </div>
    </aside>
  );
};

export const UserSidebar = () => {
  const { roles } = useSelector((state) => state.auth);
  const supportUnread = useSupportUnread();
  const normalizedRoles = roles?.map((r) => r.toLowerCase()) || [];
  const isSeller = normalizedRoles.includes("seller");
  const explicitAccess = typeof window !== 'undefined' && sessionStorage.getItem('allowCustomerAccess') === 'true';
  if (isSeller && !explicitAccess) {
    return null;
  }

  return (
    <aside className="flex h-full w-64 flex-col border-r border-border bg-transparent">
      {/* Logo at Top */}
      <SidebarLogo />

      {/* Scrollable Menu */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-4">
        <SidebarItem to="/user/dashboard" icon={LayoutDashboard}>
          Dashboard
        </SidebarItem>
        <SidebarItem to="/user/orders" icon={ShoppingCart}>
          Orders
        </SidebarItem>
        <SidebarItem to="/wishlist" icon={Heart}>
          Wishlist
        </SidebarItem>
        <SidebarItem to="/user/wallet" icon={Wallet}>
          Wallet
        </SidebarItem>
        <SidebarItem to="/user/reviews" icon={BarChart3}>
          Reviews
        </SidebarItem>
        <SidebarItem to="/user/profile" icon={Users}>
          Profile
        </SidebarItem>
        <SidebarItem to="/user/become-seller" icon={Store}>
          Become a Seller
        </SidebarItem>
        <SidebarItem to="/user/chat" icon={MessageSquare}>
          Chat
        </SidebarItem>
        <SidebarItem to="/user/support" icon={Headphones} badge={supportUnread}>
          Support
        </SidebarItem>
        <SidebarItem to="/cart" icon={ShoppingCart}>
          Cart
        </SidebarItem>
        <SidebarItem to="/user/license-keys" icon={Key}>
          License Keys
        </SidebarItem>
        <SidebarItem to="/user/notifications" icon={Bell}>
          Notifications
        </SidebarItem>
        <SidebarItem to="/user/subscriptions" icon={Repeat}>
          Subscriptions
        </SidebarItem>
        <SidebarItem to="/user/return-refunds" icon={RotateCcw}>
          Return/Refunds
        </SidebarItem>
      </nav>

      {/* Logout Button at Bottom */}
      <div className="shrink-0 border-t border-border p-4">
        <LogoutButton />
      </div>
    </aside>
  );
};
