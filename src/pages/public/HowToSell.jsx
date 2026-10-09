import { Link } from "react-router-dom";
import SectionWrapper from "@features/content/marketing/SectionWrapper";
import AnimatedHeading from "@features/content/marketing/AnimatedHeading";
import GlowCard from "@features/content/marketing/GlowCard";
import FAQAccordion from "@features/content/marketing/FAQAccordion";
import { HowToSellPageData } from "@/lib/data";
import { useSEO } from "@/hooks/useSEO";

const HowToSell = () => {
  const {
    hero,
    createAccount,
    verification,
    listings,
    acceptOrders,
    deliverGetPaid,
    revisionsDisputes,
    growReputation,
    faq,
    finalCta,
  } = HowToSellPageData;

  useSEO({
    title: "How to Sell | DGMARQ",
    description:
      "Start selling on DGMARQ marketplace today. List your products and reach thousands of buyers.",
    canonical: "/how-to-sell",
  });

  return (
    <main className="flex min-h-screen flex-col text-white">
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

      <SectionWrapper id="create-account">
        <div className="flex flex-col gap-8 max-w-3xl mx-auto">
          <AnimatedHeading
            eyebrow="Getting Started"
            title="Create Your Seller Account"
            description={createAccount.intro}
          />
          <GlowCard>
            <ol className="space-y-2 text-sm text-gray-400">
              {createAccount.steps.map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-accent-on-dark text-xs font-bold">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
            <p className="mt-4 text-xs text-accent-on-dark/90 italic">{createAccount.microcopy}</p>
          </GlowCard>
        </div>
      </SectionWrapper>

      <SectionWrapper id="verification">
        <div className="flex flex-col gap-8 max-w-3xl mx-auto">
          <AnimatedHeading
            eyebrow="Trust"
            title="Complete Seller Verification"
            description={verification.intro}
          />
          <GlowCard>
            <p className="text-sm text-gray-400 mb-4">Verification may include:</p>
            <ul className="space-y-2 text-sm text-gray-400">
              {verification.items.map((item, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-accent-on-dark">✓</span> {item}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-accent-on-dark/90 italic">{verification.microcopy}</p>
          </GlowCard>
        </div>
      </SectionWrapper>

      <SectionWrapper id="listings">
        <div className="flex flex-col gap-8 max-w-5xl mx-auto">
          <AnimatedHeading
            eyebrow="Listings"
            title="Create High-Quality Listings"
            description={listings.intro}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <GlowCard>
              <ul className="space-y-2 text-sm text-gray-400">
                {listings.items.map((item, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-accent-on-dark">✓</span> {item}
                  </li>
                ))}
              </ul>
            </GlowCard>
            <GlowCard>
              <h3 className="text-base font-semibold text-white mb-4">{listings.bestPractices.title}</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                {listings.bestPractices.items.map((item, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-accent-on-dark">•</span> {item}
                  </li>
                ))}
              </ul>
            </GlowCard>
          </div>
        </div>
      </SectionWrapper>

      <SectionWrapper id="accept-orders">
        <div className="flex flex-col gap-8 max-w-3xl mx-auto">
          <AnimatedHeading
            eyebrow="Orders"
            title="Accept Orders Through Escrow"
            description={acceptOrders.intro}
          />
          <GlowCard>
            <ol className="space-y-2 text-sm text-gray-400">
              {acceptOrders.steps.map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-accent-on-dark text-xs font-bold">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
            <p className="mt-4 text-xs text-accent-on-dark/90 italic">{acceptOrders.microcopy}</p>
          </GlowCard>
        </div>
      </SectionWrapper>

      <SectionWrapper id="deliver-get-paid">
        <div className="flex flex-col gap-8 max-w-3xl mx-auto">
          <AnimatedHeading
            eyebrow="Payouts"
            title="Deliver & Get Paid"
            description={deliverGetPaid.intro}
          />
          <GlowCard>
            <ol className="space-y-2 text-sm text-gray-400">
              {deliverGetPaid.steps.map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-accent-on-dark text-xs font-bold">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
            <p className="mt-4 text-xs text-gray-400">{deliverGetPaid.microcopy}</p>
          </GlowCard>
        </div>
      </SectionWrapper>

      <SectionWrapper id="revisions-disputes">
        <div className="flex flex-col gap-8 max-w-3xl mx-auto">
          <AnimatedHeading
            eyebrow="Resolution"
            title="Handle Refund Requests Professionally"
            description={revisionsDisputes.intro}
          />
          <GlowCard>
            <ol className="space-y-2 text-sm text-gray-400">
              {revisionsDisputes.steps.map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-accent-on-dark text-xs font-bold">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
            <p className="mt-4 text-xs text-accent-on-dark/90 italic">{revisionsDisputes.microcopy}</p>
          </GlowCard>
        </div>
      </SectionWrapper>

      <SectionWrapper id="grow-reputation">
        <div className="flex flex-col gap-8 max-w-5xl mx-auto">
          <AnimatedHeading
            eyebrow="Performance"
            title="Grow Your Seller Reputation"
            description={growReputation.intro}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <GlowCard>
              <ul className="space-y-2 text-sm text-gray-400">
                {growReputation.metrics.map((item, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-accent-on-dark">✓</span> {item}
                  </li>
                ))}
              </ul>
            </GlowCard>
            <GlowCard>
              <h3 className="text-base font-semibold text-white mb-4">{growReputation.benefits.title}</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                {growReputation.benefits.items.map((item, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-accent-on-dark">•</span> {item}
                  </li>
                ))}
              </ul>
            </GlowCard>
          </div>
        </div>
      </SectionWrapper>

      <SectionWrapper id="faq" className="bg-gradient-to-b from-transparent via-accent/5 to-transparent">
        <div className="flex flex-col gap-8 max-w-3xl mx-auto">
          <AnimatedHeading eyebrow="FAQ" title="Frequently Asked Questions" description="Click on a question to expand the answer." />
          <FAQAccordion items={faq} />
        </div>
      </SectionWrapper>

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

export default HowToSell;
