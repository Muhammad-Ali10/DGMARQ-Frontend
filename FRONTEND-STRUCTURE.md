# DGMARQ Frontend — Folder Structure & Migration Plan

> Goal: move from a **type-first** layout (group by kind: `components/`, `hooks/`,
> `utils/`) to a **feature-first** layout (group by domain). This is the
> de-facto modern React standard ("Bulletproof React"). Migration is
> **incremental + build-verified**, one feature at a time — never a big-bang.

---

## 1) Why change

Current layout groups by *kind*, so a single feature scatters across the tree.
Example — **support chat** lives in 7+ places today:

```
components/support/ (13)   components/chat/ (3)*   components/SupportChatPopup.jsx
components/RefundChat.jsx   hooks/useSupportThread.js   hooks/useSupportUnread.js
hooks/useChatNotifications.js   utils/supportChat.js
```
\* `components/chat/` is actually the **buyer↔seller order chat**, a *different*
feature — must NOT be merged into support.

Other smells:
- **`components/` is a dumping ground** — 20 loose files mix one-offs (`Hero`,
  `FlashDeal`), cross-cutting infra (`ErrorBoundary`, `ProtectedRoute`,
  `SEOProvider`), and feature modals (`PaymentModal`, `WithdrawalRequestModal`).
- **`lib/` vs `utils/` overlap** — both hold helpers (`lib/utils.js` + `utils/*`).
- **Casing inconsistent** — `components/Custom`, `components/ProductListing`
  (PascalCase) vs `about`, `chat`, `support` (lowercase).
- **Path aliases configured but unused** — `vite.config.js` defines `@`,
  `@components`, `@hooks`, … but code uses `../../components/ui/card`. Three
  aliases (`@context`, `@types`, `@constants`) even point to folders that don't
  exist.

---

## 2) Target structure

```
src/
├─ app/                      # App.jsx, router, global providers/setup (from root)
├─ assets/
├─ components/
│   ├─ ui/                   # ✅ design-system primitives (shadcn) — KEEP AS-IS
│   └─ common/               # truly cross-feature: ErrorBoundary, SEOProvider,
│                            #   ConfirmationModal, ProtectedRoute, SafeImage
├─ features/
│   ├─ auth/                 # api · components · hooks · store · utils  (per feature)
│   ├─ catalog/              # ProductCard, listing, category, marketplace/, ProductDetail, Hero, FlashDeal
│   ├─ cart-checkout/        # PaymentModal, guestCart, checkout flow
│   ├─ orders/               # order pages, orderItem util
│   ├─ wallet-payout/        # WithdrawalRequestModal, RefundRequestModal, RefundChat, payout/earnings
│   ├─ support/              # the whole support-ticket module (see §3)
│   ├─ chat/                 # buyer↔seller order chat (components/chat/, Chat.jsx pages)
│   ├─ notifications/        # notifications/, useNotifications, notification* utils, NotificationBell
│   ├─ reviews/
│   ├─ seller/              # seller dashboard: components/seller/, BulkUploadModal, LicenseKeysModal, seller pages
│   ├─ admin/               # admin pages + taxonomy
│   └─ content/             # marketing/about: about/, MicrosoftCard, content.js api
├─ pages/                    # thin route entry-points only (admin/public/seller/user) — compose from features
├─ hooks/                    # ONLY global hooks: useSocket, useInView
├─ lib/                      # third-party wrappers: axios, config   (← merge utils/ here or into features)
├─ store/                    # redux root
└─ layouts/
```

**Per-feature internal shape** (only the parts a feature needs):
```
features/<name>/
├─ api/          # this feature's API calls (split from services/api/*)
├─ components/
├─ hooks/
├─ store/        # redux slice(s) for this feature, if any
├─ utils/
└─ index.js      # public surface: re-export what other features may import
```
Rule of thumb: a file used by **one** feature lives in that feature; used by
**2+** features → `components/common`, `hooks/`, or `lib/`.

---

## 3) Feature inventory (current → target)

| Feature | Current files | → Target |
|---|---|---|
| **auth** | `services/api/auth.js`, `store/slices/authSlice.js`, `components/ProtectedRoute.jsx`, login/register pages | `features/auth/{api,store,components,pages}` |
| **catalog** | `services/api/catalog.js`, `components/{ProductCard,ProductVerticalCard,CategoryProduct,CategoryProductSection,CategoryNavigation,Hero,FlashDeal}.jsx`, `components/{marketplace,ProductListing}/`, `pages/public/ProductDetail.jsx`, `utils/productUtils.js` | `features/catalog/*` |
| **cart-checkout** | `components/PaymentModal.jsx`, `utils/guestCart.js`, parts of `services/api/commerce.js`, checkout pages | `features/cart-checkout/*` |
| **orders** | order pages (user/seller), `utils/orderItem.js` | `features/orders/*` |
| **wallet-payout** | `components/{WithdrawalRequestModal,RefundRequestModal,RefundChat}.jsx`, `utils/statusTaxonomy.js`, payout/earnings pages | `features/wallet-payout/*` |
| **support** | `components/support/` (13), `components/SupportChatPopup.jsx`, `components/SupportChatWidget.jsx`, `hooks/{useSupportThread,useSupportUnread}.js`, `utils/supportChat.js`, support pages | `features/support/*` |
| **chat** (buyer↔seller) | `components/chat/` (3), `hooks/useChatNotifications.js`, `pages/{user,seller}/Chat.jsx` | `features/chat/*` |
| **notifications** | `components/notifications/` (3), `hooks/useNotifications.js`, `utils/{notificationActionUrl,notificationQueries,notificationSound}.js`, `services/api/social.js`(?) | `features/notifications/*` |
| **reviews** | review components/pages, parts of `services/api/social.js` | `features/reviews/*` |
| **seller** | `services/api/seller.js`, `components/seller/` (4), `components/{BulkUploadModal,LicenseKeysModal}.jsx`, `pages/seller/*` | `features/seller/*` |
| **admin** | `services/api/admin.js`, `pages/admin/*` (35 + taxonomy) | `features/admin/*` |
| **content** | `services/api/content.js`, `components/about/` (8), `components/MicrosoftCard.jsx` | `features/content/*` |
| **shared/infra** | `components/{ErrorBoundary,SEOProvider,ConfirmationModal,ProtectedRoute}.jsx`, `hooks/{useSocket,useInView}.js`, `lib/{axios,config}.js`, `store/store.js`, `layouts/` | `components/common`, `hooks/`, `lib/`, `store/`, `layouts/` |

> `services/api/*` (admin, analytics, auth, catalog, commerce, content, seller,
> social, user) can stay as a shared `services/` layer **or** be split into each
> `features/<name>/api/`. Splitting is cleaner but touches more imports — do it
> per-feature as that feature migrates.

---

## 4) Migration order (low-risk → high)

Each step ends with `npx vite build` (+ `npx eslint .`) before the next.

1. **Adopt aliases** (biggest win, lowest risk). Codemod relative imports
   (`../../components/...`) → `@components/...` repo-wide. Fix the dangling
   `@context`/`@types`/`@constants` aliases (create dirs or remove). After this,
   moving a folder only changes *its own* paths, not every importer.
   - ✅ `@features` alias added to `vite.config.js`; `jsconfig.json` now mirrors
     all aliases (was only `@/*`) so the editor resolves them too.
   - ✅ Repo-wide `../../` → `@…` codemod DONE — 621 imports across 108 files
     converted; **0** parent-relative (`../../`) imports remain. Intra-feature
     imports were deliberately left relative. Codemod was deterministic (resolve
     each spec → map to alias, skip same-feature targets) and build+eslint-verified.
2. ✅ **`components/common/`** — DONE. Moved `ErrorBoundary`, `SEOProvider`,
   `ProtectedRoute`, `ConfirmationModal` → `components/common/` (imported via
   `@components/common/X`). 12 importers updated (main, App, useSEO, chat/ChatPage,
   + 8 ConfirmationModal consumers). Remaining loose `components/` files are all
   feature-specific (catalog, seller, wallet-payout, support, content) — they
   move with their feature in later steps.
3. ✅ **Pilot feature: `notifications`** — DONE. Moved
   `components/notifications/{NotificationBell,NotificationFilterTabs,NotificationsPage}`,
   `hooks/useNotifications`, `utils/{notificationActionUrl,notificationQueries,notificationSound}`
   → `features/notifications/{components,hooks,utils}` + `index.js` public surface.
   Internal imports use intra-feature relatives (`../utils/…`) + aliases
   (`@components/ui`, `@lib`, `@services`, `@hooks`); the 5 external importers
   (Header, TopBar, admin/seller/user Notifications pages) now import from
   `@features/notifications`. This is the reference pattern for every later
   feature. (`useChatNotifications` stays out — it belongs to the `chat` feature.)
4. ✅ **`chat`** (buyer↔seller order chat) — DONE. Moved `components/chat/`
   (ChatPage, ChatMessageSkeleton, MessageBubble) + `hooks/useChatNotifications`
   → `features/chat/{components,hooks}` + `index.js`. 2 external importers
   (`pages/{seller,user}/Chat.jsx`) now use `@features/chat`. Confirmed distinct
   from support's same-named `MessageBubble` — no cross-wiring.
   **`support`** still pending — 9+ external importers (`PublicLayout`,
   `SupportManagement`, `seller/Support`, `user/Support`, return-refund pages…),
   do after the smaller features.
5. ✅ **`wallet-payout`** — DONE. Moved `components/{RefundChat,RefundRequestModal,WithdrawalRequestModal}`
   + `utils/statusTaxonomy` → `features/wallet-payout/{components,utils}` + `index.js`.
   9 external importers (return-refund pages, user/Orders, seller/Earnings, order/payout
   detail pages) now use `@features/wallet-payout`.
   ✅ **`content`** — DONE. Moved `components/about/` (7 components + barrel) →
   `features/content/about/` + `features/content/index.js`. Only consumer
   (`pages/public/About.jsx`) now imports `@features/content`; the 4 `useInView`
   imports inside moved files re-aliased to `@hooks/useInView`. NOTE: `MicrosoftCard`
   is a product card (uses `productUtils`) → belongs to **catalog**, NOT content;
   left in place for the catalog slice.
   ✅ **`catalog`** — DONE. Moved 9 components (ProductCard, ProductVerticalCard,
   MicrosoftCard, CategoryProduct, CategoryProductSection, CategoryNavigation, Hero,
   FlashDeal, ProductListingLayout) + `productUtils` → `features/catalog/{components,utils}`
   + `index.js`. ~22 external importers repointed to `@features/catalog`.
   ⚠️ KNOWN COUPLING: `components/ui/safe-image.jsx` imports `PRODUCT_IMAGE_PLACEHOLDER`
   from `@features/catalog` — a shared ui primitive should not depend on a feature.
   TODO: move that placeholder constant to a shared module (TODO left in the file).
   NOTE: `components/marketplace/` (AnimatedHeading, GlowCard, GridContainer,
   MetricCounter, SectionWrapper, FAQAccordion) is NOT catalog — it's marketing/landing
   presentation used by 10 static pages; migrate it into `content` (e.g.
   `features/content/marketing/`) as its own slice.
   ✅ **`marketplace/`→content/marketing** — DONE. Moved `components/marketplace/`
   (AnimatedHeading, FAQAccordion, GlowCard, GridContainer, MetricCounter, SectionWrapper)
   → `features/content/marketing/`. 10 static pages repointed
   `@/components/marketplace/X` → `@features/content/marketing/X` (no barrel — about/ and
   marketing/ share component names, so direct subpath imports avoid the collision).
   No internal edits needed (internal imports were same-dir or `@/hooks` aliases).
   ✅ **`support`** — DONE. Moved 19 files → `features/support/{components(15),hooks(3),utils(1)}`
   + `index.js`: `components/support/*` (13), loose `SupportChatPopup`/`SupportChatWidget`,
   `hooks/{useSupportThread,useSupportUnread,useUserPresence}`, `utils/supportChat`.
   5 external importers repointed (admin/SupportManagement, seller/Support, user/Support,
   PublicLayout, components/ui/sidebar). SupportChatPopup's `./support/X` imports collapsed
   to `./X` (now same dir); `useUserPresence` folded in (only PresenceBar used it).
   ⚠️ KNOWN COUPLING (same class as safe-image): `components/ui/sidebar.jsx` imports
   `useSupportUnread` from `@features/support`. TODO left in the file to lift the badge
   wiring to the sidebar's consumer.
   ✅ **`seller`** — DONE. Moved `components/seller/` (FileDropzone, LocationSelect,
   StepProgress, TaxonomySelect) + `BulkUploadModal` + `LicenseKeysModal` →
   `features/seller/components/` + `index.js`. 5 external importers repointed
   (user/BecomeSeller, seller/LicenseKeys, seller/SellerOrderDetail, user/LicenseKeys,
   user/OrderDetail). FileDropzone/LocationSelect/StepProgress needed no internal edits
   (already used the `@/lib/utils` alias). NOTE: `LicenseKeysModal` is consumed by buyer
   pages too — kept under seller (license keys = seller inventory) for now.
   ✅ **`cart-checkout`** — DONE. Moved `PaymentModal` + `utils/guestCart` →
   `features/cart-checkout/{components,utils}` + `index.js`. 6 guestCart importers +
   1 PaymentModal importer repointed to `@features/cart-checkout` (incl. catalog's
   FlashDeal, which had used `@utils/guestCart`). This removed the last loose
   feature-component from `src/components/` (now only `ui/`, `common/`, `Custom/`).
   Still pending (low value, optional): **`orders`** (only `utils/orderItem` + pages —
   too thin), **`admin`** (35 pages already role-grouped under `pages/admin/`; real
   work is an api split, deferred). See §6.
   (**`reviews`** is too thin to be its own slice — just `pages/{seller,user}/Reviews.jsx`
   + review API spread across `seller.js`/`social.js`/`user.js`; fold its API into
   `social`/`user` later, leave the pages as route entries.)
6. **`seller`**, **`admin`** (largest; pages already role-grouped — mostly a move
   + api split).
7. **Cleanup** — merge `utils/` into `lib/` or features; enforce folder casing;
   delete now-empty dirs.

---

## 5) Conventions (going forward)

- **Imports:** always alias (`@features/support/...`, `@components/ui/...`),
  never `../../`. A feature may import from `@components/*`, `@lib/*`, `@hooks/*`,
  and another feature's `index.js` — not its internals.
- **Folder casing:** lowercase-kebab for folders (`wallet-payout`), PascalCase
  for component files (`ProductCard.jsx`).
- **One feature = one folder.** New work goes under `features/<name>/`, not into
  the global `components/`/`hooks/`/`utils/` buckets.
- **`components/ui` is the design system** — primitives only, no feature logic.

---

## 6) Risk notes

- **No-commit rule:** changes accumulate uncommitted, so prefer small,
  build-verified slices the owner can review/commit incrementally — avoid one
  giant uncommitted move.
- **`vite build` is slow on the current machine** (timed out at 4 min once) —
  budget for it per slice; don't batch many features before verifying.
- **`support` vs `chat`** are distinct features — do not merge.
- The buyer↔seller `chat/MessageBubble.jsx` and `support/MessageBubble.jsx` are
  **different components** with the same name — keep them in separate features.

---

## 7) Post-migration follow-ups

- ✅ **Repo-wide alias adoption** — 621 imports / 108 files; `../../` count is 0.
- ✅ **Frontend tests wired** — Vitest reads `vitest.config.js` (NOT `vite.config.js`):
  it carries its own `resolve.alias` (array form, `@` last), `@vitejs/plugin-react`
  plugin (JSX automatic runtime), jsdom env, and `setupFiles: src/test/setup.js`
  (jest-dom matchers via explicit `expect.extend` because `globals:false`). Shared
  helper `src/test/render.jsx` (`renderWithProviders` = Router + react-query). Tests
  co-located next to source. 31 tests so far (productUtils, guestCart, ProductCard).
- ✅ **ui→feature coupling (catalog)** fixed — `PRODUCT_IMAGE_PLACEHOLDER` moved to
  `@lib/placeholders`; `ui/SafeImage` imports it from there; `productUtils` imports
  + re-exports it (local binding is needed by `getProductImage`).
- ✅ **ui→feature couplings (shell components) FIXED.** `sidebar.jsx`
  (Admin/Seller/UserSidebar) and `TopBar.jsx` were app-shell components mislocated
  in `ui/` (they were the WHOLE file — no generic primitive lived there). Moved to
  `components/Custom/` alongside Header/Footer; the 3 dashboard layouts now import
  `@components/Custom/{sidebar,TopBar}`. `components/ui/` is now feature-free.
- ⏭️ **about/ vs marketing/ dedupe — SKIPPED (verified, not laziness).** The same-named components
  (AnimatedHeading, GlowCard, GridContainer, MetricCounter, SectionWrapper) are
  **different implementations** (39–75 diff lines each), not true duplicates. Merging
  would risk visual regressions on either the About page or the marketing pages.
- ⬜ Larger strategic items (own projects): TypeScript/JSDoc, the 123 jsx-a11y
  warnings, CI to run tests+build on push, per-feature `services/api` split.
