# DGMARQ — Frontend Engineering Guide (Dashboards + Public Pages)

## Stack
- Frontend: React 19, Vite, Tailwind CSS v4
- Backend: Node.js / Express 5
- Scope: Admin, Seller, and Customer dashboards; public-facing pages
  (homepage, product/listing pages, etc.); popups/modals used across all of
  the above

### Key libraries already in use — use these, do not introduce alternatives
- **Styling**: Tailwind CSS only. No CSS Modules, styled-components, Emotion,
  or inline style objects except where truly unavoidable (e.g. dynamic values
  from JS). Use `tailwind-merge` for conditional class merging.
- **UI components**: shadcn/ui, built on Radix primitives already installed
  (`@radix-ui/react-dialog`, `-dropdown-menu`, `-select`, `-tabs`, `-toast`,
  `-avatar`, `-label`, `-separator`, `-slot`). Every popup/modal, dropdown,
  select, tab, and avatar should be a shadcn component — do not hand-roll
  custom versions of these or pull in another component library (e.g. MUI,
  Ant Design, Chakra).
- **Data fetching / server state**: `@tanstack/react-query`. Loading, error,
  and empty states should come from query state (`isLoading`, `isError`,
  `data`), not manual `useState` + `useEffect` fetching.
- **Client/global state**: `@reduxjs/toolkit` + `react-redux`. Use for
  genuinely global UI/app state only — not for server data (that's React
  Query's job).
- **Forms**: `react-hook-form` + `@hookform/resolvers` for validation. Do not
  hand-roll form state with `useState` per field.
- **List virtualization**: `@tanstack/react-virtual` — use this for any long
  table/list instead of a new virtualization library.
- **Toasts/notifications**: `sonner`. Do not introduce another toast library.
- **Carousels**: `embla-carousel-react`.
- **Icons**: `react-icons`.
- **Routing**: `react-router-dom` v7.
- **Real-time**: `socket.io-client`.
- **SEO/meta**: `react-helmet-async` (relevant for public pages).

## Current Goal
Improve code quality, reusability, loading UX, and rendering performance across
dashboards AND public pages — without changing business logic or breaking
working features, and without adding new dependencies when an already-installed
library covers the need.

## Workflow (always follow this order)

### 1. Map before editing
Before writing any code, explore and report:
- Folder structure of all three dashboards AND the public-facing pages
- All popup/modal components currently in use — where they're defined, and
  whether the same modal (e.g. confirm dialog, image preview, filter modal)
  is duplicated across dashboards and public pages
- Duplicated UI patterns across Admin/Seller/Customer/Public (tables, cards,
  modals, forms, buttons, filters, pagination) that could become shared
  components
- Components that re-render unnecessarily or lack proper loading/error states,
  including on public pages (product listings, search results, etc.)

Ask up to 5 clarifying questions if the structure is ambiguous. Do not edit
files during this step.

### 2. Propose a plan before implementing
Turn findings into a prioritized plan covering:
1. **Reusable components** — extract shared UI into `/components/ui` (shadcn
   convention) or `/components/shared` with proper composition, not
   copy-pasted variants.
2. **Popups/modals** — standardize on shadcn's `Dialog` (from
   `@radix-ui/react-dialog`) as the base for every popup (confirm, filter,
   image preview, forms). Replace any custom/hand-rolled modal
   implementations with it.
3. **Loading states** — skeleton loaders (not just spinners) for all
   data-fetching views, driven by React Query's `isLoading`/`isFetching`
   state, including on public pages.
4. **Performance** — memoization (`React.memo`, `useMemo`, `useCallback`)
   only where it prevents a measurable re-render; lazy-load routes/heavy
   components with `React.lazy` + `Suspense`; use `@tanstack/react-virtual`
   for long tables/lists; optimize images.
5. **React best practices** — proper `key` usage, custom hooks for repeated
   data-fetching logic, context/hooks over prop drilling where it fits,
   colocated state, consistent naming.
6. **Industry-standard patterns** — container/presentational separation
   where useful, error boundaries, accessible components (labels, aria
   attributes on interactive elements).

Wait for approval before implementing.

### 3. Implement in small phases
- One shared component, one dashboard section, or one public page per phase —
  never everything at once.
- After each phase, state exactly what to manually test (or which existing
  tests to run) before moving to the next phase.

## Constraints (always apply)
- Do not change API contracts or existing business logic.
- Do not add new dependencies — the existing stack (see "Key libraries"
  above) already covers styling, components, forms, data fetching, state,
  virtualization, and toasts. If something genuinely isn't covered, ask
  before installing anything.
- No defensive coding for cases that can't happen — validate only at real
  boundaries (API responses, user input).
- Keep diffs small and reviewable.
- Do not refactor unrelated files "while you're in there" — stay scoped to
  the current phase.