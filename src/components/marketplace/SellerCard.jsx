import React from "react";
import { GlowCard } from "./GlowCard";
import { HiShieldCheck, HiUserGroup } from "react-icons/hi2";

export const SellerCard = ({ seller }) => {
  if (!seller) return null;

  return (
    <GlowCard className="flex flex-col justify-between gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-primary">
              <HiUserGroup className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-semibold text-slate-50 sm:text-base">
              {seller.name}
            </h3>
          </div>
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-primary/80">
            {seller.badge}
          </p>
        </div>
        {seller.isVerified && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-300">
            <HiShieldCheck className="h-3 w-3" />
            Verified
          </span>
        )}
      </div>

      <p className="line-clamp-3 text-xs leading-relaxed text-slate-300 sm:text-sm">
        {seller.description}
      </p>

      <div className="flex items-center justify-between gap-3 text-xs text-slate-300">
        <div className="flex flex-col">
          <span className="font-semibold text-slate-50">
            {seller.productsSold.toLocaleString()}
          </span>
          <span className="text-[11px] text-slate-400">Products sold</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="font-semibold text-amber-300">
            {seller.rating.toFixed(1)} ★
          </span>
          <span className="text-[11px] text-slate-400">Rating</span>
        </div>
      </div>

      <div className="pt-1">
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-lg border border-primary/60 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary shadow-[0_0_18px_rgba(14,159,226,0.4)] transition-transform hover:-translate-y-0.5"
        >
          View Store
        </button>
      </div>
    </GlowCard>
  );
};

export default SellerCard;

