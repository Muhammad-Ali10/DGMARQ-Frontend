import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { categoryAPI, analyticsAPI } from "@/services/api";
import { MarketplaceCategories, MarketplaceMetrics } from "@/lib/data";

/**
 * Marketplace overview hook
 * Fetches real categories and metrics for the public /marketplace
 * page. Falls back to static lib data if any API is unavailable.
 *
 * AUDIT FIX (PERF-9): this used to fire FIVE requests from a mount-only
 * useEffect and throw two of the responses away.
 *
 *  - productAPI.getProducts({limit:8}) and bestsellerAPI.getBestsellers() were
 *    fetched and then dropped — Marketplace.jsx only ever destructured
 *    { categories, promotions, metrics }. getProducts is the ten-$lookup
 *    aggregation in product.service.js, the most expensive public read we have.
 *  - analyticsAPI.getDashboard() maps to /analytics/dashboard, which is
 *    verifyJWT + authorizeRoles('admin'). For every non-admin visitor that 401
 *    made the axios interceptor (lib/axios.js:77) fire a POST /user/refresh-token
 *    it did not need, and for an anonymous visitor that second failure
 *    dispatched logout(). It is now requested only when the viewer is actually
 *    an admin — the only case where it ever returned data.
 *  - useState + useEffect(..., []) bypassed the global React Query cache, so
 *    every navigation back to /marketplace refetched everything. useQuery with a
 *    5-minute staleTime makes route re-entry free.
 */
const FALLBACK = {
  categories: MarketplaceCategories,
  metrics: MarketplaceMetrics,
};

export function useMarketplaceOverview() {
  const roles = useSelector((state) => state.auth.roles);
  const isAdmin = Array.isArray(roles) && roles.includes("admin");

  const { data, isLoading, error } = useQuery({
    queryKey: ["marketplace-overview", isAdmin],
    staleTime: 300000,
    queryFn: async () => {
      const [categoriesRes, metricsRes] = await Promise.allSettled([
        categoryAPI.getCategories({ limit: 6, status: "active" }),
        isAdmin ? analyticsAPI.getDashboard() : Promise.resolve(null),
      ]);

      const next = {};

      // Categories
      if (categoriesRes.status === "fulfilled" && categoriesRes.value?.data) {
        const raw =
          categoriesRes.value.data.data ||
          categoriesRes.value.data.categories ||
          [];
        if (Array.isArray(raw) && raw.length) {
          next.categories = raw.slice(0, 6).map((c) => ({
            id: c._id || c.id,
            label: c.name || c.label,
            description:
              c.description ||
              "Category optimized for digital product discovery and routing.",
            productCount:
              Number(c.productCount || c.totalProducts || 0) || undefined,
            icon: "HiCpuChip",
          }));
        }
      }

      // Metrics via analytics dashboard (admins only — see the note above)
      if (metricsRes.status === "fulfilled" && metricsRes.value?.data) {
        const d = metricsRes.value.data.data || metricsRes.value.data || {};
        next.metrics = [
          {
            id: "users",
            value: Number(d.totalUsers || d.users || 0) / 1_000_000 || 35,
            suffix: "M+",
            label: "Users",
          },
          {
            id: "sellers",
            value: Number(d.totalSellers || d.sellers || 0) || 2000,
            suffix: "+",
            label: "Active Sellers",
          },
          {
            id: "countries",
            value: Number(d.countries || d.regions || 120) || 120,
            suffix: "+",
            label: "Countries",
          },
          {
            id: "uptime",
            value: Number(d.platformUptime || d.uptime || 99.9) || 99.9,
            suffix: "%",
            label: "Platform Uptime",
          },
        ];
      }

      return next;
    },
  });

  return {
    ...FALLBACK,
    ...(data || {}),
    loading: isLoading,
    error: error?.message || null,
  };
}

export default useMarketplaceOverview;
