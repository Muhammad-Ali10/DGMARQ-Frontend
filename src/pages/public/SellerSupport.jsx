import { Link } from "react-router-dom";
import SectionWrapper from "@/components/marketplace/SectionWrapper";
import AnimatedHeading from "@/components/marketplace/AnimatedHeading";
import GlowCard from "@/components/marketplace/GlowCard";
import FAQAccordion from "@/components/marketplace/FAQAccordion";
import { SellerSupportPageData } from "@/lib/data";

const SellerSupport = () => {
  const {
    hero,
    gettingVerified,
    listingAssistance,
    payouts,
    disputeHandling,
    performanceMonitoring,
    escalation,
    faq,
    finalCta,
  } = SellerSupportPageData;

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
          <Link
            to={hero.ctaPrimaryUrl}
            className="inline-flex items-center justify-center rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-white shadow-[0_0_30px_rgba(14,81,226,0.8)] transition-transform hover:-translate-y-0.5 w-fit mx-auto"
          >
            {hero.ctaPrimary}
          </Link>
        </div>
      </SectionWrapper>

      {/* Section 1: Getting Verified */}
      <SectionWrapper id="getting-verified">
        <div className="flex flex-col gap-8 max-w-3xl mx-auto">
          <AnimatedHeading
            eyebrow="Verification"
            title="Getting Verified"
            description={gettingVerified.intro}
          />
          <GlowCard>
            <ol className="space-y-2 text-sm text-gray-400">
              {gettingVerified.steps.map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-accent text-xs font-bold">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
            <p className="mt-4 text-xs text-accent/90 italic">{gettingVerified.microcopy}</p>
          </GlowCard>
        </div>
      </SectionWrapper>

      {/* Section 2: Listing Assistance */}
      <SectionWrapper id="listing-assistance">
        <div className="flex flex-col gap-8 max-w-3xl mx-auto">
          <AnimatedHeading
            eyebrow="Listings"
            title="Listing Assistance"
            description={listingAssistance.intro}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {listingAssistance.items.map((item, i) => (
              <GlowCard key={i}>
                <p className="text-sm font-medium text-white">{item}</p>
              </GlowCard>
            ))}
          </div>
        </div>
      </SectionWrapper>

      {/* Section 3: Secure Payments & Payouts */}
      <SectionWrapper id="payouts">
        <div className="flex flex-col gap-8 max-w-3xl mx-auto">
          <AnimatedHeading
            eyebrow="Payments"
            title="Secure Payments & Payouts"
            description={payouts.intro}
          />
          <GlowCard>
            <ol className="space-y-2 text-sm text-gray-400">
              {payouts.steps.map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-accent text-xs font-bold">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
            <p className="mt-4 text-xs text-gray-400">{payouts.microcopy}</p>
          </GlowCard>
        </div>
      </SectionWrapper>

      {/* Section 4: Dispute Handling Support */}
      <SectionWrapper id="dispute-handling">
        <div className="flex flex-col gap-8 max-w-3xl mx-auto">
          <AnimatedHeading
            eyebrow="Disputes"
            title="Dispute Handling Support"
            description={disputeHandling.intro}
          />
          <GlowCard>
            <ol className="space-y-2 text-sm text-gray-400">
              {disputeHandling.steps.map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-accent text-xs font-bold">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
            <p className="mt-4 text-xs text-accent/90 italic">{disputeHandling.microcopy}</p>
          </GlowCard>
        </div>
      </SectionWrapper>

      {/* Section 5: Performance Monitoring */}
      <SectionWrapper id="performance">
        <div className="flex flex-col gap-8 max-w-3xl mx-auto">
          <AnimatedHeading
            eyebrow="Dashboard"
            title="Performance Monitoring"
            description={performanceMonitoring.intro}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {performanceMonitoring.items.map((item, i) => (
              <GlowCard key={i}>
                <p className="text-sm font-medium text-white">{item}</p>
              </GlowCard>
            ))}
          </div>
          <p className="text-center text-xs text-accent/90 italic">{performanceMonitoring.microcopy}</p>
        </div>
      </SectionWrapper>

      {/* Section 6: Escalation Process */}
      <SectionWrapper id="escalation">
        <div className="flex flex-col gap-8 max-w-3xl mx-auto">
          <AnimatedHeading
            eyebrow="Escalation"
            title="Escalation Process"
            description={escalation.intro}
          />
          <GlowCard>
            <ol className="space-y-2 text-sm text-gray-400">
              {escalation.steps.map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-accent text-xs font-bold">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </GlowCard>
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

export default SellerSupport;
