import { useEffect, useState } from "react";
import {
  productAPI,
  categoryAPI,
  bestsellerAPI,
  trendingOfferAPI,
  analyticsAPI,
} from "@/services/api";
import {
  MarketplaceFeaturedProducts,
  MarketplaceCategories,
  MarketplaceSellers,
  MarketplacePromotions,
  MarketplaceMetrics,
} from "@/lib/data";

/**
 * Marketplace overview hook
 * Fetches real products, categories, sellers, promotions, and metrics.
 * Falls back to static lib data if any API is unavailable.
 */
export function useMarketplaceOverview() {
  const [state, setState] = useState({
    products: MarketplaceFeaturedProducts,
    categories: MarketplaceCategories,
    sellers: MarketplaceSellers,
    promotions: MarketplacePromotions,
    metrics: MarketplaceMetrics,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [productsRes, categoriesRes, bestsellersRes, offersRes, metricsRes] =
          await Promise.allSettled([
            productAPI.getProducts({ limit: 8, sortBy: "featured" }),
            categoryAPI.getCategories({ limit: 6, status: "active" }),
            bestsellerAPI.getBestsellers({ limit: 6 }),
            trendingOfferAPI.getTrendingOffers(),
            analyticsAPI.getDashboard(),
          ]);

        const next = { ...state };

        // Products
        if (
          productsRes.status === "fulfilled" &&
          productsRes.value?.data
        ) {
          const raw =
            productsRes.value.data.data ||
            productsRes.value.data.products ||
            productsRes.value.data.items ||
            [];
          if (Array.isArray(raw) && raw.length) {
            next.products = raw.slice(0, 8).map((p) => ({
              id: p._id || p.id,
              title: p.name || p.title,
              category:
                p.category?.name ||
                p.categoryName ||
                p.mainCategory ||
                "Product",
              price: Number(p.price || p.basePrice || 0),
              rating: Number(p.avgRating || p.rating || 0),
              ratingCount: Number(p.ratingCount || p.totalReviews || 0),
              seller:
                p.seller?.shopName ||
                p.seller?.name ||
                p.sellerName ||
                "Seller",
              sellerId: p.seller?._id || p.sellerId || "",
              sellerType: p.seller?.type || "verified",
              badges: [],
              shortDescription:
                p.shortDescription ||
                p.subtitle ||
                p.description ||
                "Digital product available through the marketplace infrastructure.",
            }));
          }
        }

        // Categories
        if (
          categoriesRes.status === "fulfilled" &&
          categoriesRes.value?.data
        ) {
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

        // Sellers via bestsellers
        if (
          bestsellersRes.status === "fulfilled" &&
          bestsellersRes.value?.data
        ) {
          const raw =
            bestsellersRes.value.data.data ||
            bestsellersRes.value.data.items ||
            [];
          if (Array.isArray(raw) && raw.length) {
            next.sellers = raw.slice(0, 6).map((entry) => {
              const seller = entry.seller || entry;
              return {
                id: seller._id || seller.id,
                name: seller.shopName || seller.name || "Seller",
                productsSold:
                  Number(
                    seller.totalSold ||
                      entry.totalSold ||
                      entry.totalOrders ||
                      0
                  ) || 0,
                rating:
                  Number(seller.avgRating || seller.rating || 0) || 0,
                isVerified:
                  Boolean(seller.isVerified) ||
                  seller.verificationStatus === "verified",
                badge:
                  seller.badge ||
                  (seller.verificationStatus === "verified"
                    ? "Verified Seller"
                    : "Marketplace Seller"),
                description:
                  seller.description ||
                  "Marketplace seller operating on escrow-protected, analytics-driven infrastructure.",
              };
            });
          }
        }

        // Promotions via trending offers
        if (offersRes.status === "fulfilled" && offersRes.value?.data) {
          const raw =
            offersRes.value.data.data ||
            offersRes.value.data.offers ||
            offersRes.value.data.items ||
            [];
          if (Array.isArray(raw) && raw.length) {
            next.promotions = raw.slice(0, 3).map((offer) => ({
              id: offer._id || offer.id,
              title: offer.title || offer.name || "Marketplace Promotion",
              description:
                offer.description ||
                "Configured promotion powered by real marketplace pricing and availability.",
              badge:
                offer.badge ||
                (offer.type === "flash" ? "Limited Time" : "Active Offer"),
              discountLabel:
                offer.discountLabel ||
                (offer.discountPercentage
                  ? `Save ${offer.discountPercentage}%`
                  : "Dynamic pricing"),
              endsAt: offer.endsAt || offer.expiresAt || null,
            }));
          }
        }

        // Metrics via analytics dashboard
        if (metricsRes.status === "fulfilled" && metricsRes.value?.data) {
          const d =
            metricsRes.value.data.data || metricsRes.value.data || {};
          const mappedMetrics = [
            {
              id: "users",
              value: Number(d.totalUsers || d.users || 0) / 1_000_000 || 35,
              suffix: "M+",
              label: "Users",
            },
            {
              id: "sellers",
              value:
                Number(d.totalSellers || d.sellers || 0) || 2000,
              suffix: "+",
              label: "Active Sellers",
            },
            {
              id: "countries",
              value:
                Number(d.countries || d.regions || 120) || 120,
              suffix: "+",
              label: "Countries",
            },
            {
              id: "uptime",
              value:
                Number(d.platformUptime || d.uptime || 99.9) ||
                99.9,
              suffix: "%",
              label: "Platform Uptime",
            },
          ];
          next.metrics = mappedMetrics;
        }

        if (!cancelled) {
          setState((prev) => ({
            ...prev,
            ...next,
            loading: false,
            error: null,
          }));
        }
      } catch (error) {
        if (!cancelled) {
          setState((prev) => ({
            ...prev,
            loading: false,
            error: error?.message || "Unable to load marketplace data",
          }));
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

export default useMarketplaceOverview;

