# DGMARQ-Frontend — Marketplace UI Rules

## ⚠️ REMINDER: Do NOT Change Business Logic
- Cart calculations, price display, discount logic, order flow — don't modify without approval.
- If aligning code to new structure, MOVE the logic as-is. Don't "improve" it during the move.
- Don't change what data gets sent to API or in what format — backend expects current shape.
- Don't change routing paths — bookmarks and shared links depend on them.

## Feature-Based Structure (Align Gradually)
```
DGMARQ-Frontend/
├── src/
│   ├── features/
│   │   ├── auth/
│   │   │   ├── components/        # LoginForm, RegisterForm, SellerRegister
│   │   │   ├── hooks/             # useAuth, useLogin
│   │   │   ├── services/          # authService.js
│   │   │   ├── context/           # AuthContext + AuthProvider
│   │   │   └── index.js           # Barrel export
│   │   ├── products/
│   │   │   ├── components/        # ProductCard, ProductGrid, ProductDetail, ProductFilters
│   │   │   ├── hooks/             # useProducts, useProductSearch, useFilters
│   │   │   ├── services/          # productService.js
│   │   │   └── index.js
│   │   ├── cart/
│   │   │   ├── components/        # CartItem, CartSummary, CartPage
│   │   │   ├── hooks/             # useCart
│   │   │   ├── context/           # CartContext + CartProvider
│   │   │   └── index.js
│   │   ├── orders/
│   │   │   ├── components/        # OrderList, OrderDetail, OrderStatus, Checkout
│   │   │   ├── hooks/             # useOrders, useCheckout
│   │   │   ├── services/          # orderService.js
│   │   │   └── index.js
│   │   ├── seller/
│   │   │   ├── components/        # SellerDashboard, AddProduct, EditProduct, SellerOrders
│   │   │   ├── hooks/             # useSellerProducts, useSellerOrders, useSellerStats
│   │   │   ├── services/          # sellerService.js
│   │   │   └── index.js
│   │   └── reviews/
│   │       ├── components/        # ReviewList, ReviewForm, StarRating
│   │       ├── hooks/             # useReviews
│   │       └── services/          # reviewService.js
│   ├── shared/
│   │   ├── components/            # Button, Modal, Loader, ErrorBoundary, EmptyState, Pagination
│   │   ├── hooks/                 # useDebounce, useMediaQuery, useInfiniteScroll
│   │   ├── utils/                 # formatPrice, formatDate, truncateText
│   │   └── constants/             # ROUTES, ORDER_STATUSES, USER_ROLES
│   ├── layouts/
│   │   ├── MainLayout.jsx         # Navbar + Footer + Outlet (buyer-facing)
│   │   ├── SellerLayout.jsx       # Seller dashboard sidebar + header
│   │   ├── AdminLayout.jsx        # Admin panel layout
│   │   └── AuthLayout.jsx         # Minimal layout for login/register
│   ├── pages/                     # Thin route-level components
│   ├── lib/
│   │   └── axios.js               # Configured instance with interceptors
│   ├── styles/
│   ├── App.jsx
│   └── main.jsx
```
Current structure may be different. Don't restructure everything at once. Move feature by feature.

## Axios Setup (One Configured Instance)
```js
// lib/axios.js
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api/v1',
  withCredentials: true,
  timeout: 15000,
});

// 401 handling — redirect to login globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```
All service files use this instance. Components never import axios directly.

## Marketplace-Specific Frontend Rules

### Product Display
- Always show: image, name, price, seller name, rating
- Price formatting: consistent currency format. Use a shared formatPrice() utility.
- Out-of-stock products: show but disable "Add to Cart" button. Show "Out of Stock" badge.
- Product images: lazy load, show skeleton/placeholder while loading.
- Search: debounce input (300ms). Don't fire API on every keystroke.

### Cart (SENSITIVE — Preserve Current Logic)
- Cart state: use whatever the current approach is (Context, localStorage, etc.). Don't change.
- Price calculations: whatever formula is currently used for subtotal, tax, shipping, total — keep it.
- Quantity updates: validate against stock. Don't allow more than available stock.
- Cart persistence: match current behavior (localStorage, server-side, or session).

### Checkout Flow (DO NOT CHANGE ORDER)
- Whatever the current checkout steps are (address → payment → review → place order), keep them.
- Don't rearrange steps, don't skip steps, don't combine steps.
- Form validation on each step before allowing "Next".
- Show order summary throughout checkout.
- Disable "Place Order" button after click to prevent double submission.

### Seller Dashboard
- Sellers see only their own products and orders.
- Product CRUD forms: keep existing field structure. Don't add/remove fields without approval.
- Order management: show status and allow status updates per existing flow.
- Dashboard stats: keep existing calculations and charts.

### Role-Based UI
- Show/hide UI elements based on user role (buyer sees cart, seller sees dashboard, admin sees admin panel).
- NEVER rely only on frontend hiding for security. Backend must also check.
- But frontend should still hide unauthorized UI for good UX.
- Use ProtectedRoute component for route-level access control.

### Reviews
- Star rating component: keep current star count (usually 5).
- Only show "Write Review" button if buyer has purchased the product.
- Display average rating with review count.

## Component Rules
- Functional components only. One per file. PascalCase naming.
- Props: destructure in parameters. Default values where sensible.
- Component order: hooks → derived state → handlers → early returns → JSX.
- Max ~150 lines. Extract sub-components or custom hooks if longer.
- No prop drilling beyond 2 levels — use Context or composition.

## State Management
- Local UI state → useState
- Complex state → useReducer
- Global shared state (auth, cart) → Context + useReducer
- URL state (search, filters, page) → useSearchParams
- Don't duplicate API data in global state. Fetch in hooks, manage loading/error/data.

## Error & Loading States (Every API Interaction)
```jsx
if (loading) return <Loader />;
if (error) return <ErrorMessage message={error} />;
if (!data || data.length === 0) return <EmptyState message="No products found" />;
return <ProductGrid products={data} />;
```
Every page/component that fetches data must handle: loading, error, empty, and success states.

## Performance
- Route-level code splitting: React.lazy() + Suspense for pages.
- Images: loading="lazy", proper dimensions, WebP preferred.
- Lists: key = database _id, never array index.
- Memoize only when profiler shows need — don't premature optimize.
- Debounce search/filter inputs (300ms).
- Infinite scroll or pagination for product lists — never load all products at once.

## Forms
- Controlled components.
- Validate on blur (field-level) + on submit (full form).
- Disable submit button during API call. Show loading state.
- Field-level errors below input. Form-level errors at top.
- After success: feedback (toast), redirect or reset form.

## What NOT to Do
- Don't change how cart total is calculated
- Don't change checkout step order
- Don't change API endpoint URLs or request/response shapes
- Don't change routing paths (affects bookmarks, SEO, shared links)
- Don't change authentication flow (login, register, token handling)
- Don't add new npm packages without approval
- Don't use inline styles except truly dynamic values
- Don't use document.getElementById — React handles DOM
- Don't use window.location — use React Router's useNavigate
- Don't store tokens in localStorage — match existing approach
