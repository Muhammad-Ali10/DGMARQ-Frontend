import { Link } from "react-router-dom";
import SectionWrapper from "@/components/marketplace/SectionWrapper";
import AnimatedHeading from "@/components/marketplace/AnimatedHeading";
import GlowCard from "@/components/marketplace/GlowCard";
import FAQAccordion from "@/components/marketplace/FAQAccordion";
import { HowToBuyPageData } from "@/lib/data";

const HowToBuy = () => {
  const {
    hero,
    createAccount,
    browseListings,
    checkout,
    trackOrder,
    reviewDelivery,
    dispute,
    buyerProtection,
    faq,
    finalCta,
  } = HowToBuyPageData;

  return (
    <main className="flex min-h-screen flex-col text-white">
      {/* Hero */}
      <SectionWrapper id="hero" className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-accent/10 via-transparent to-transparent pointer-events-none" />
        <div className="relative flex flex-col gap-8 max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white">
            {hero.headline}
          </h1>
          <p className="text-lg sm:text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
            {hero.subtext}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to={hero.ctaPrimaryUrl}
              className="inline-flex items-center justify-center rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-white shadow-[0_0_30px_rgba(14,81,226,0.8)] transition-transform hover:-translate-y-0.5"
            >
              {hero.ctaPrimary}
            </Link>
            <Link
              to={hero.ctaSecondaryUrl}
              className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-transparent px-6 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 hover:border-accent/50 hover:bg-white/5"
            >
              {hero.ctaSecondary}
            </Link>
          </div>
        </div>
      </SectionWrapper>

      {/* Section 1: Create & Secure Your Account */}
      <SectionWrapper id="create-account">
        <div className="flex flex-col gap-8 max-w-3xl mx-auto">
          <AnimatedHeading
            eyebrow="Account Setup"
            title="Create & Secure Your Account"
            description={createAccount.intro}
          />
          <GlowCard>
            <h3 className="text-base font-semibold text-white mb-4">Steps</h3>
            <ol className="space-y-2 text-sm text-gray-400">
              {createAccount.steps.map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-accent text-xs font-bold">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
            <p className="mt-4 text-xs text-accent/90 italic">{createAccount.microcopy}</p>
          </GlowCard>
        </div>
      </SectionWrapper>

      {/* Section 2: Browse Verified Listings */}
      <SectionWrapper id="browse-listings">
        <div className="flex flex-col gap-8 max-w-5xl mx-auto">
          <AnimatedHeading
            eyebrow="Discovery"
            title="Browse Verified Listings"
            description={browseListings.intro}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <GlowCard>
              <h3 className="text-base font-semibold text-white mb-4">Marketplace Features</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                {browseListings.features.map((item, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-accent">✓</span> {item}
                  </li>
                ))}
              </ul>
            </GlowCard>
            <GlowCard>
              <h3 className="text-base font-semibold text-white mb-4">{browseListings.filtersLabel}</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                {browseListings.filters.map((item, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-accent">•</span> {item}
                  </li>
                ))}
              </ul>
            </GlowCard>
          </div>
        </div>
      </SectionWrapper>

      {/* Section 3: Secure Checkout with Escrow */}
      <SectionWrapper id="checkout">
        <div className="flex flex-col gap-8 max-w-3xl mx-auto">
          <AnimatedHeading
            eyebrow="Payment"
            title="Secure Checkout with Escrow"
            description={checkout.intro}
          />
          <GlowCard>
            <ol className="space-y-2 text-sm text-gray-400">
              {checkout.steps.map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-accent text-xs font-bold">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
            <p className="mt-4 text-xs text-accent/90 italic">{checkout.microcopy}</p>
          </GlowCard>
        </div>
      </SectionWrapper>

      {/* Section 4: Track Your Order */}
      <SectionWrapper id="track-order">
        <div className="flex flex-col gap-8 max-w-3xl mx-auto">
          <AnimatedHeading
            eyebrow="Order Status"
            title="Track Your Order in Real-Time"
            description={trackOrder.intro}
          />
          <GlowCard>
            <ul className="space-y-2 text-sm text-gray-400">
              {trackOrder.items.map((item, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-accent">✓</span> {item}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-gray-400">{trackOrder.microcopy}</p>
          </GlowCard>
        </div>
      </SectionWrapper>

      {/* Section 5: Review & Approve Delivery */}
      <SectionWrapper id="review-delivery">
        <div className="flex flex-col gap-8 max-w-3xl mx-auto">
          <AnimatedHeading
            eyebrow="Delivery"
            title="Review & Approve Delivery"
            description={reviewDelivery.intro}
          />
          <GlowCard>
            <ol className="space-y-2 text-sm text-gray-400">
              {reviewDelivery.steps.map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-accent text-xs font-bold">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
            <p className="mt-4 text-xs text-accent/90 italic">{reviewDelivery.microcopy}</p>
          </GlowCard>
        </div>
      </SectionWrapper>

      {/* Section 6: Open a Dispute */}
      <SectionWrapper id="dispute">
        <div className="flex flex-col gap-8 max-w-3xl mx-auto">
          <AnimatedHeading
            eyebrow="Resolution"
            title="Open a Dispute (If Needed)"
            description={dispute.intro}
          />
          <GlowCard>
            <ol className="space-y-2 text-sm text-gray-400">
              {dispute.steps.map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-accent text-xs font-bold">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
            <p className="mt-4 text-xs text-accent/90 italic">{dispute.microcopy}</p>
          </GlowCard>
        </div>
      </SectionWrapper>

      {/* Section 7: Buyer Protection Summary */}
      <SectionWrapper id="buyer-protection">
        <div className="flex flex-col gap-8 max-w-5xl mx-auto">
          <AnimatedHeading
            eyebrow="Protection"
            title="Buyer Protection Summary"
            description={buyerProtection.title}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {buyerProtection.items.map((item, i) => (
              <GlowCard key={i} className="text-center">
                <span className="text-2xl mb-2 block">🛡</span>
                <p className="text-sm font-medium text-white">{item}</p>
              </GlowCard>
            ))}
          </div>
        </div>
      </SectionWrapper>

      {/* FAQ */}
      <SectionWrapper id="faq" className="bg-gradient-to-b from-transparent via-accent/5 to-transparent">
        <div className="flex flex-col gap-8 max-w-3xl mx-auto">
          <AnimatedHeading eyebrow="FAQ" title="Frequently Asked Questions" description="Click on a question to expand the answer." />
          <FAQAccordion items={faq} />
        </div>
      </SectionWrapper>

      {/* Final CTA */}
      <SectionWrapper id="final-cta">
        <div className="flex flex-col items-center gap-6 text-center max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
            {finalCta.headline}
          </h2>
          <Link
            to={finalCta.ctaPrimaryUrl}
            className="inline-flex items-center justify-center rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-white shadow-[0_0_30px_rgba(14,81,226,0.8)] transition-transform hover:-translate-y-0.5"
          >
            {finalCta.ctaPrimary}
          </Link>
        </div>
      </SectionWrapper>
    </main>
  );
};

export default HowToBuy;
