import { Link } from "react-router-dom";
import { Sparkles, BadgePercent, ArrowRight } from "lucide-react";

// M15: DGMARQ Plus subscriptions promo — sits near the top of the homepage.
// The actual discount percent is admin-configurable (A1), so the copy stays
// generic rather than hardcoding a number.
const PlusPromoSection = () => (
  <section aria-label="DGMARQ Plus subscription" className="py-4">
    <div className="max-w-7xl mx-auto px-4">
      <div className="relative overflow-hidden rounded-2xl border border-accent/30 bg-gradient-to-r from-[#0a1f47] via-[#0d2a5c] to-[#041536]">
        {/* soft glow accents */}
        <div className="pointer-events-none absolute -top-16 -right-10 h-48 w-48 rounded-full bg-accent/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-1/4 h-40 w-40 rounded-full bg-sky-500/10 blur-3xl" />

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5 sm:p-6">
          <div className="shrink-0 rounded-2xl bg-accent/20 p-3">
            <Sparkles className="h-7 w-7 text-accent-on-dark" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg sm:text-xl font-bold text-fg font-poppins">
              DGMARQ <span className="text-accent-on-dark">Plus</span>
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-fg/70">
              Subscribe once, save on every purchase — automatic member discount
              at checkout, on top of any sale price.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="hidden md:inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent-on-dark">
              <BadgePercent className="h-3.5 w-3.5" />
              Member discount on all orders
            </span>
            <Link
              to="/dgmarq-plus"
              className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-fg transition-colors hover:bg-accent/90"
            >
              Get Plus
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default PlusPromoSection;
