import React from "react";
import { GlowCard } from "./GlowCard";
import { HiOutlineHeart, HiStar, HiUser } from "react-icons/hi2";

export const ProductCard = ({ product, onQuickView, onToggleWishlist }) => {
  if (!product) return null;

  return (
    <GlowCard className="flex flex-col justify-between gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-primary/80">
            {product.category}
          </p>
          <h3 className="text-sm font-semibold text-slate-50 sm:text-base">
            {product.title}
          </h3>
        </div>
        <button
          type="button"
          onClick={() => onToggleWishlist?.(product)}
          className="rounded-full border border-slate-700/80 bg-slate-900/80 p-1.5 text-slate-300 transition-colors hover:border-primary/70 hover:text-primary"
          aria-label="Add to wishlist"
        >
          <HiOutlineHeart className="h-4 w-4" />
        </button>
      </div>

      <p className="line-clamp-3 text-xs leading-relaxed text-slate-300 sm:text-sm">
        {product.shortDescription}
      </p>

      <div className="flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-slate-900/70 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary/90">
            ${product.price.toFixed(2)}
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-300/90">
            <HiStar className="h-3.5 w-3.5" />
            {product.rating.toFixed(1)}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <HiUser className="h-3.5 w-3.5 text-slate-500" />
          <span>{product.seller}</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex flex-wrap items-center gap-1.5">
          {product.badges?.map((badge) => (
            <span
              key={badge}
              className="rounded-full border border-primary/40 bg-primary/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-primary/90"
            >
              {badge}
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onQuickView?.(product)}
            className="rounded-lg border border-slate-600/80 bg-slate-900/80 px-2.5 py-1 text-[11px] font-medium text-slate-200 transition-colors hover:border-primary/70 hover:text-primary"
          >
            Quick View
          </button>
          <button
            type="button"
            className="rounded-lg bg-primary px-3 py-1 text-[11px] font-semibold text-slate-950 shadow-[0_0_20px_rgba(14,159,226,0.65)] transition-transform hover:-translate-y-0.5"
          >
            Add
          </button>
        </div>
      </div>
    </GlowCard>
  );
};

export default ProductCard;

