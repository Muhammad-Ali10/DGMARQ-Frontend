import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import { useSEO } from "./hooks/useSEO";
import { Loading } from "./components/ui/loading";

// Layouts — loaded eagerly since they wrap all routes
import AdminLayout from "./layouts/AdminLayout";
import SellerLayout from "./layouts/SellerLayout";
import UserLayout from "./layouts/UserLayout";
import PublicLayout from "./layouts/PublicLayout";

// Auth pages — loaded eagerly since they're entry points
import Login from "./pages/public/Login";
import Register from "./pages/public/Register";
import AuthCallback from "./pages/AuthCallback";

// Lazy-loaded public pages
const Home = lazy(() => import("./pages/public/Home"));
const About = lazy(() => import("./pages/public/About"));
const ProductDetail = lazy(() => import("./pages/public/ProductDetail"));
const SearchResults = lazy(() => import("./pages/public/SearchResults"));
const BestSellers = lazy(() => import("./pages/public/BestSellers"));
const Cart = lazy(() => import("./pages/public/Cart"));
const Wishlist = lazy(() => import("./pages/public/Wishlist"));
const Checkout = lazy(() => import("./pages/public/Checkout"));
const DGMarketPlus = lazy(() => import("./pages/public/DGMarketPlus"));
const Marketplace = lazy(() => import("./pages/public/Marketplace"));
const Security = lazy(() => import("./pages/public/Security"));
const ContactUs = lazy(() => import("./pages/public/ContactUs"));
const BuyerSupport = lazy(() => import("./pages/public/BuyerSupport"));
const HowToBuy = lazy(() => import("./pages/public/HowToBuy"));
const PublicSellerSupport = lazy(() => import("./pages/public/SellerSupport"));
const HowToSell = lazy(() => import("./pages/public/HowToSell"));
const TermsConditions = lazy(() => import("./pages/public/TermsConditions"));
const PrivacyPolicy = lazy(() => import("./pages/public/PrivacyPolicy"));
const PublicSellerProfile = lazy(() => import("./pages/public/SellerProfile"));
const Software = lazy(() => import("./pages/public/Software"));
const RandomKeys = lazy(() => import("./pages/public/RandomKeys"));
const SteamGiftCard = lazy(() => import("./pages/public/SteamGiftCard"));
const GiftCards = lazy(() => import("./pages/public/GiftCards"));
const CategoryListing = lazy(() => import("./pages/public/CategoryListing"));
const SubcategoryListing = lazy(() => import("./pages/public/SubcategoryListing"));
const ForgotPassword = lazy(() => import("./pages/public/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/public/ResetPassword"));
const SubscriptionSuccess = lazy(() => import("./pages/public/SubscriptionSuccess"));
const SubscriptionCancel = lazy(() => import("./pages/public/SubscriptionCancel"));

// Lazy-loaded admin pages
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const SellersManagement = lazy(() => import("./pages/admin/SellersManagement"));
const SellerProfileView = lazy(() => import("./pages/admin/SellerProfileView"));
const ProductsManagement = lazy(() => import("./pages/admin/ProductsManagement"));
const ProductDetailView = lazy(() => import("./pages/admin/ProductDetailView"));
const OrdersManagement = lazy(() => import("./pages/admin/OrdersManagement"));
const AdminOrderDetail = lazy(() => import("./pages/admin/AdminOrderDetail"));
const PayoutsManagement = lazy(() => import("./pages/admin/PayoutsManagement"));
const UsersManagement = lazy(() => import("./pages/admin/UsersManagement"));
const SupportManagement = lazy(() => import("./pages/admin/SupportManagement"));
const Analytics = lazy(() => import("./pages/admin/Analytics"));
const Settings = lazy(() => import("./pages/admin/Settings"));
const CategoriesManagement = lazy(() => import("./pages/admin/CategoriesManagement"));
const SubcategoriesManagement = lazy(() => import("./pages/admin/SubcategoriesManagement"));
const PlatformsManagement = lazy(() => import("./pages/admin/PlatformsManagement"));
const DevicesManagement = lazy(() => import("./pages/admin/DevicesManagement"));
const RegionsManagement = lazy(() => import("./pages/admin/RegionsManagement"));
const GenresManagement = lazy(() => import("./pages/admin/GenresManagement"));
const ThemesManagement = lazy(() => import("./pages/admin/ThemesManagement"));
const ModesManagement = lazy(() => import("./pages/admin/ModesManagement"));
const TypesManagement = lazy(() => import("./pages/admin/TypesManagement"));
const FlashDealsManagement = lazy(() => import("./pages/admin/FlashDealsManagement"));
const HomepageSlidersManagement = lazy(() => import("./pages/admin/HomepageSlidersManagement"));
const TrendingCategoriesManagement = lazy(() => import("./pages/admin/TrendingCategoriesManagement"));
const TrendingOffersManagement = lazy(() => import("./pages/admin/TrendingOffersManagement"));
const UpcomingReleasesManagement = lazy(() => import("./pages/admin/UpcomingReleasesManagement"));
const UpcomingGamesManagement = lazy(() => import("./pages/admin/UpcomingGamesManagement"));
const CouponsManagement = lazy(() => import("./pages/admin/CouponsManagement"));
const ReturnRefundManagement = lazy(() => import("./pages/admin/ReturnRefundManagement"));
const SubscriptionsManagement = lazy(() => import("./pages/admin/SubscriptionsManagement"));
const PayoutAccountsManagement = lazy(() => import("./pages/admin/PayoutAccountsManagement"));
const BundleDeals = lazy(() => import("./pages/admin/BundleDeals"));
const AdminNotifications = lazy(() => import("./pages/admin/Notifications"));

// Lazy-loaded seller pages
const SellerDashboard = lazy(() => import("./pages/seller/Dashboard"));
const SellerOrders = lazy(() => import("./pages/seller/Orders"));
const SellerOrderDetail = lazy(() => import("./pages/seller/SellerOrderDetail"));
const SellerProducts = lazy(() => import("./pages/seller/Products"));
const SellerEarnings = lazy(() => import("./pages/seller/Earnings"));
const SellerPerformance = lazy(() => import("./pages/seller/Performance"));
const SellerSupport = lazy(() => import("./pages/seller/Support"));
const PayoutAccount = lazy(() => import("./pages/seller/PayoutAccount"));
const SellerChat = lazy(() => import("./pages/seller/Chat"));
const SellerNotifications = lazy(() => import("./pages/seller/Notifications"));
const SellerReturnRefunds = lazy(() => import("./pages/seller/ReturnRefunds"));
const SellerSubscriptions = lazy(() => import("./pages/seller/Subscriptions"));
const SellerLicenseKeys = lazy(() => import("./pages/seller/LicenseKeys"));
const SellerProfile = lazy(() => import("./pages/seller/Profile"));
const SellerAnalytics = lazy(() => import("./pages/seller/Analytics"));
const SellerReviews = lazy(() => import("./pages/seller/Reviews"));
const ProductCreate = lazy(() => import("./pages/seller/ProductCreate"));
const ProductEdit = lazy(() => import("./pages/seller/ProductEdit"));

// Lazy-loaded user pages
const UserDashboard = lazy(() => import("./pages/user/Dashboard"));
const UserOrders = lazy(() => import("./pages/user/Orders"));
const OrderDetail = lazy(() => import("./pages/user/OrderDetail"));
const UserWishlist = lazy(() => import("./pages/user/Wishlist"));
const UserReviews = lazy(() => import("./pages/user/Reviews"));
const UserProfile = lazy(() => import("./pages/user/Profile"));
const UserChat = lazy(() => import("./pages/user/Chat"));
const UserSupport = lazy(() => import("./pages/user/Support"));
const UserCart = lazy(() => import("./pages/user/Cart"));
const UserCheckout = lazy(() => import("./pages/user/Checkout"));
const LicenseKeys = lazy(() => import("./pages/user/LicenseKeys"));
const UserNotifications = lazy(() => import("./pages/user/Notifications"));
const UserSubscriptions = lazy(() => import("./pages/user/Subscriptions"));
const UserReturnRefunds = lazy(() => import("./pages/user/ReturnRefunds"));
const BecomeSeller = lazy(() => import("./pages/user/BecomeSeller"));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <Loading message="Loading..." />
  </div>
);

function App() {
  useSEO();
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/auth/callback" element={<AuthCallback />} />

        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/product/:identifier" element={<ProductDetail />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/bestsellers" element={<BestSellers />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/dgmarq-plus" element={<DGMarketPlus />} />
          <Route path="/about-company" element={<About />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/security" element={<Security />} />
          <Route path="/contactus" element={<ContactUs />} />
          <Route path="/buyer-support" element={<BuyerSupport />} />
          <Route path="/how-to-buy" element={<HowToBuy />} />
          <Route path="/seller-support" element={<PublicSellerSupport />} />
          <Route path="/how-to-sell" element={<HowToSell />} />
          <Route path="/terms" element={<TermsConditions />} />
          <Route path="/terms-conditions" element={<TermsConditions />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/seller/:sellerId" element={<PublicSellerProfile />} />
          <Route path="/software" element={<Software />} />
          <Route path="/random-keys" element={<RandomKeys />} />
          <Route path="/steam-gift-card" element={<SteamGiftCard />} />
          <Route path="/steam-gift-cards" element={<SteamGiftCard />} />
          <Route path="/gift-cards" element={<GiftCards />} />
          <Route path="/category/:categoryId" element={<CategoryListing />} />
          <Route path="/category/:categorySlug/:subcategorySlug" element={<SubcategoryListing />} />
          <Route path="/subcategory/:subcategoryId" element={<SubcategoryListing />} />
          <Route path="/subscription/success" element={<SubscriptionSuccess />} />
          <Route path="/subscription/cancel" element={<SubscriptionCancel />} />
        </Route>

        <Route
          path="/admin"
          element={<ProtectedRoute allowedRoles={["admin"]}><AdminLayout /></ProtectedRoute>}
        >
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="sellers" element={<SellersManagement />} />
          <Route path="sellers/:sellerId" element={<SellerProfileView />} />
          <Route path="products" element={<ProductsManagement />} />
          <Route path="products/:productId" element={<ProductDetailView />} />
          <Route path="orders" element={<OrdersManagement />} />
          <Route path="orders/:orderId" element={<AdminOrderDetail />} />
          <Route path="payouts" element={<PayoutsManagement />} />
          <Route path="users" element={<UsersManagement />} />
          <Route path="support" element={<SupportManagement />} />
          <Route path="notifications" element={<AdminNotifications />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="settings" element={<Settings />} />
          <Route path="categories" element={<CategoriesManagement />} />
          <Route path="subcategories" element={<SubcategoriesManagement />} />
          <Route path="platforms" element={<PlatformsManagement />} />
          <Route path="devices" element={<DevicesManagement />} />
          <Route path="regions" element={<RegionsManagement />} />
          <Route path="genres" element={<GenresManagement />} />
          <Route path="themes" element={<ThemesManagement />} />
          <Route path="modes" element={<ModesManagement />} />
          <Route path="types" element={<TypesManagement />} />
          <Route path="flash-deals" element={<FlashDealsManagement />} />
          <Route path="homepage-sliders" element={<HomepageSlidersManagement />} />
          <Route path="trending-categories" element={<TrendingCategoriesManagement />} />
          <Route path="trending-offers" element={<TrendingOffersManagement />} />
          <Route path="upcoming-releases" element={<UpcomingReleasesManagement />} />
          <Route path="upcoming-games" element={<UpcomingGamesManagement />} />
          <Route path="coupons" element={<CouponsManagement />} />
          <Route path="disputes" element={<Navigate to="/admin/return-refund" replace />} />
          <Route path="return-refund" element={<ReturnRefundManagement />} />
          <Route path="subscriptions" element={<SubscriptionsManagement />} />
          <Route path="payout-accounts" element={<PayoutAccountsManagement />} />
          <Route path="bundle-deals" element={<BundleDeals />} />
          <Route path="" element={<Navigate to="/admin/dashboard" replace />} />
        </Route>

        <Route
          path="/seller"
          element={<ProtectedRoute allowedRoles={["seller"]}><SellerLayout /></ProtectedRoute>}
        >
          <Route path="dashboard" element={<SellerDashboard />} />
          <Route path="orders" element={<SellerOrders />} />
          <Route path="orders/:orderId" element={<SellerOrderDetail />} />
          <Route path="products" element={<SellerProducts />} />
          <Route path="earnings" element={<SellerEarnings />} />
          <Route path="payout-account" element={<PayoutAccount />} />
          <Route path="performance" element={<SellerPerformance />} />
          <Route path="support" element={<SellerSupport />} />
          <Route path="chat" element={<SellerChat />} />
          <Route path="notifications" element={<SellerNotifications />} />
          <Route path="disputes" element={<Navigate to="/seller/return-refunds" replace />} />
          <Route path="return-refunds" element={<SellerReturnRefunds />} />
          <Route path="subscriptions" element={<SellerSubscriptions />} />
          <Route path="license-keys" element={<SellerLicenseKeys />} />
          <Route path="profile" element={<SellerProfile />} />
          <Route path="analytics" element={<SellerAnalytics />} />
          <Route path="reviews" element={<SellerReviews />} />
          <Route path="products/create" element={<ProductCreate />} />
          <Route path="products/:id/edit" element={<ProductEdit />} />
          <Route path="" element={<Navigate to="/seller/dashboard" replace />} />
        </Route>

        <Route
          path="/user"
          element={<ProtectedRoute allowedRoles={["customer"]}><UserLayout /></ProtectedRoute>}
        >
          <Route path="dashboard" element={<UserDashboard />} />
          <Route path="orders" element={<UserOrders />} />
          <Route path="orders/:orderId" element={<OrderDetail />} />
          <Route path="wishlist" element={<UserWishlist />} />
          <Route path="reviews" element={<UserReviews />} />
          <Route path="profile" element={<UserProfile />} />
          <Route path="become-seller" element={<BecomeSeller />} />
          <Route path="chat" element={<UserChat />} />
          <Route path="support" element={<UserSupport />} />
          <Route path="cart" element={<UserCart />} />
          <Route path="checkout/:checkoutId" element={<UserCheckout />} />
          <Route path="license-keys" element={<LicenseKeys />} />
          <Route path="notifications" element={<UserNotifications />} />
          <Route path="subscriptions" element={<UserSubscriptions />} />
          <Route path="disputes" element={<Navigate to="/user/return-refunds" replace />} />
          <Route path="return-refunds" element={<UserReturnRefunds />} />
          <Route path="" element={<Navigate to="/user/dashboard" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default App;
