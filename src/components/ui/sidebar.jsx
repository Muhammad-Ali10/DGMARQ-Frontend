import React from "react";
import { NavLink, Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { logout } from "../../store/slices/authSlice";
import { authAPI } from "../../services/api";
import { cn } from "../../lib/utils";
import { Button } from "./button";
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
  Percent,
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
  Gift,
  Image,
  TrendingUp,
  Flame,
  Award,
  AlertTriangle,
  RotateCcw,
  Repeat,
  Bell,
  Wallet,
  User,
  Star,
  Boxes,
  Plus,
  LogOut,
  Calendar,
  Clock,
} from "lucide-react";

// Logo Component for Sidebar
const SidebarLogo = () => {
  return (
    <Link
      to="/"
      className="flex items-center gap-2 px-6 py-4 hover:opacity-80 transition-opacity border-b border-border"
    >
      <img
        src="https://res.cloudinary.com/dptwervy7/image/upload/v1754393665/logo_nojqxu.png"
        alt="logo"
        className="w-1/2 h-10"
      />
    </Link>
  );
};

// Logout Button Component
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
    onError: (err) => {
      console.error("Logout failed:", err);
      // Even if backend logout fails, clear frontend state for UX
      dispatch(logout());
      queryClient.clear();
      navigate("/");
    },
  });

  return (
    <Button
      variant="ghost"
      className={cn(
        "w-full justify-start text-gray-300 hover:text-white hover:bg-red-500/20 text-red-400 hover:text-red-300"
      )}
      onClick={() => logoutMutation.mutate()}
      disabled={logoutMutation.isPending}
    >
      <LogOut className="mr-3 h-5 w-5" />
      {logoutMutation.isPending ? "Logging out..." : "Logout"}
    </Button>
  );
};

const SidebarItem = ({ to, icon: Icon, children, onClick }) => {
  if (onClick) {
    return (
      <Button
        variant="ghost"
        className={cn(
          "w-full justify-start text-gray-300 hover:text-white hover:bg-accent/20"
        )}
        onClick={onClick}
      >
        <Icon className="mr-3 h-5 w-5" />
        {children}
      </Button>
    );
  }

  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors duration-200",
          isActive
            ? "bg-accent text-white"
            : "text-gray-300 hover:text-white hover:bg-gray-700"
        )
      }
    >
      {Icon && <Icon className="mr-3 h-5 w-5" />}
      {children}
    </NavLink>
  );
};

export const AdminSidebar = () => {
  return (
    <aside className="w-64 bg-secondary h-full flex flex-col shadow-lg border-r border-border">
      {/* Logo at Top */}
      <SidebarLogo />

      {/* Scrollable Menu */}
      <nav
        className="flex-1 overflow-y-auto px-6 py-4 space-y-2"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "#4B5563 transparent",
        }}
      >
        <SidebarItem to="/admin/dashboard" icon={LayoutDashboard}>
          Dashboard
        </SidebarItem>
        <SidebarItem to="/admin/users" icon={Users}>
          Users
        </SidebarItem>
        <SidebarItem to="/admin/sellers" icon={Store}>
          Sellers
        </SidebarItem>
        <SidebarItem to="/admin/products" icon={Package}>
          Products
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
        <div className="pt-2 border-t border-gray-700">
          <p className="text-xs text-gray-500 uppercase px-4 py-2">
            Category Management
          </p>
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
        </div>
        <div className="pt-2 border-t border-gray-700">
          <p className="text-xs text-gray-500 uppercase px-4 py-2">Marketing</p>
          <SidebarItem to="/admin/flash-deals" icon={Zap}>
            Flash Deals
          </SidebarItem>
          <SidebarItem to="/admin/trending-offers" icon={Flame}>
            Trending Offers
          </SidebarItem>
          <SidebarItem to="/admin/homepage-sliders" icon={Image}>
            Homepage Sliders
          </SidebarItem>
          <SidebarItem to="/admin/trending-categories" icon={TrendingUp}>
            Trending Categories
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
        </div>
        <div className="pt-2 border-t border-gray-700">
          <p className="text-xs text-gray-500 uppercase px-4 py-2">
            Management
          </p>
          <SidebarItem to="/admin/disputes" icon={AlertTriangle}>
            Disputes
          </SidebarItem>
          <SidebarItem to="/admin/return-refund" icon={RotateCcw}>
            Return/Refund
          </SidebarItem>
          <SidebarItem to="/admin/subscriptions" icon={Repeat}>
            Subscriptions
          </SidebarItem>
          <SidebarItem to="/admin/payout-accounts" icon={Wallet}>
            Payout Accounts
          </SidebarItem>
        </div>
        <SidebarItem to="/admin/settings" icon={Settings}>
          Settings
        </SidebarItem>
      </nav>

      {/* Logout Button at Bottom */}
      <div className="flex-shrink-0 p-6 pt-0 border-t border-gray-700">
        <LogoutButton />
      </div>
    </aside>
  );
};

export const SellerSidebar = () => {

  return (
    <aside className="w-64 bg-secondary h-full flex flex-col shadow-lg border-r border-border">
      {/* Logo at Top */}
      <SidebarLogo />

      {/* Scrollable Menu */}
      <nav
        className="flex-1 overflow-y-auto px-6 py-4 space-y-2"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "#4B5563 transparent",
        }}
      >
        <SidebarItem to="/seller/dashboard" icon={LayoutDashboard}>
          Dashboard
        </SidebarItem>
        <SidebarItem to="/seller/products/create" icon={Plus}>
          Add Product
        </SidebarItem>
        <SidebarItem to="/seller/products" icon={Package}>
          My Products
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
        <SidebarItem to="/seller/disputes" icon={AlertTriangle}>
          Disputes
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
        <div className="pt-2 border-t border-gray-700">
          <SidebarItem to="/seller/profile" icon={User}>
            Profile
          </SidebarItem>
        </div>
      </nav>

      {/* Logout Button at Bottom */}
      <div className="flex-shrink-0 p-6 pt-0 border-t border-gray-700">
        <LogoutButton />
      </div>
    </aside>
  );
};

export const UserSidebar = () => {
  const { roles } = useSelector((state) => state.auth);
  // Normalize roles to lowercase for comparison
  const normalizedRoles = roles?.map((r) => r.toLowerCase()) || [];
  const isSeller = normalizedRoles.includes("seller");
  
  // Check if seller has explicit permission to access customer dashboard
  const explicitAccess = typeof window !== 'undefined' && sessionStorage.getItem('allowCustomerAccess') === 'true';

  // Allow sidebar to show if:
  // 1. User is not a seller, OR
  // 2. User is a seller but has explicit access (switched to customer dashboard)
  if (isSeller && !explicitAccess) {
    return null; // Don't render user sidebar for sellers without explicit access
  }

  return (
    <aside className="w-64 bg-secondary h-full flex flex-col shadow-lg border-r border-border">
      {/* Logo at Top */}
      <SidebarLogo />

      {/* Scrollable Menu */}
      <nav
        className="flex-1 overflow-y-auto px-6 py-4 space-y-2"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "#4B5563 transparent",
        }}
      >
        <SidebarItem to="/user/dashboard" icon={LayoutDashboard}>
          Dashboard
        </SidebarItem>
        <SidebarItem to="/user/orders" icon={ShoppingCart}>
          Orders
        </SidebarItem>
        <SidebarItem to="/user/wishlist" icon={Heart}>
          Wishlist
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
        <SidebarItem to="/user/support" icon={Headphones}>
          Support
        </SidebarItem>
        <SidebarItem to="/user/cart" icon={ShoppingCart}>
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
        <SidebarItem to="/user/disputes" icon={AlertTriangle}>
          Disputes
        </SidebarItem>
        <SidebarItem to="/user/return-refunds" icon={RotateCcw}>
          Return/Refunds
        </SidebarItem>
      </nav>

      {/* Logout Button at Bottom */}
      <div className="flex-shrink-0 p-6 pt-0 border-t border-gray-700">
        <LogoutButton />
      </div>
    </aside>
  );
};
