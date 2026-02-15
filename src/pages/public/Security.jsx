import { Link } from "react-router-dom";
import SectionWrapper from "@/components/marketplace/SectionWrapper";
import AnimatedHeading from "@/components/marketplace/AnimatedHeading";
import GlowCard from "@/components/marketplace/GlowCard";
import FAQAccordion from "@/components/marketplace/FAQAccordion";
import { SecurityPageData } from "@/lib/data";

const Security = () => {
  const { hero, escrow, fraudDetection, verifiedSeller, paymentInfrastructure, disputeResolution, dataProtection, accountTools, faq, trust, finalCta } = SecurityPageData;

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
              🔒 {hero.ctaPrimary}
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

      {/* Section 1: Escrow */}
      <SectionWrapper id="escrow">
        <div className="flex flex-col gap-8 max-w-5xl mx-auto">
          <AnimatedHeading
            eyebrow="Transaction Protection"
            title="Escrow-Powered Transaction Protection"
            description={escrow.intro}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <GlowCard>
              <h3 className="mb-4 text-base font-semibold text-white">How It Works</h3>
              <ol className="space-y-2 text-sm text-gray-400">
                {escrow.howItWorks.map((step, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="shrink-0 w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center text-accent text-xs font-bold">{i + 1}</span>
                    {step}
                  </li>
                ))}
              </ol>
            </GlowCard>
            <GlowCard>
              <h3 className="mb-4 text-base font-semibold text-white">Protection Benefits</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                {escrow.benefits.map((benefit, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-accent">✓</span> {benefit}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs text-accent/90 italic">{escrow.microcopy}</p>
            </GlowCard>
          </div>
        </div>
      </SectionWrapper>

      {/* Section 2: Fraud Detection */}
      <SectionWrapper id="fraud-detection">
        <div className="flex flex-col gap-8 max-w-5xl mx-auto">
          <AnimatedHeading
            eyebrow="Security"
            title="Advanced Fraud Detection System"
            description={fraudDetection.intro}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {fraudDetection.layers.map((layer, i) => (
              <GlowCard key={i}>
                <span className="text-2xl mb-2 block">🛡</span>
                <p className="text-sm font-medium text-white">{layer}</p>
              </GlowCard>
            ))}
          </div>
          <p className="text-center text-gray-400">{fraudDetection.subtext}</p>
        </div>
      </SectionWrapper>

      {/* Section 3: Verified Seller */}
      <SectionWrapper id="verified-seller">
        <div className="flex flex-col gap-8 max-w-5xl mx-auto">
          <AnimatedHeading
            eyebrow="Trust"
            title="Verified Seller System"
            description={verifiedSeller.intro}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {verifiedSeller.includes.map((item, i) => (
              <GlowCard key={i}>
                <p className="text-sm font-medium text-white">{item}</p>
              </GlowCard>
            ))}
          </div>
          <p className="text-center text-gray-400">{verifiedSeller.subtext}</p>
        </div>
      </SectionWrapper>

      {/* Section 4: Payment Infrastructure */}
      <SectionWrapper id="payment-infrastructure">
        <div className="flex flex-col gap-8 max-w-5xl mx-auto">
          <AnimatedHeading
            eyebrow="Infrastructure"
            title="Secure Payment Infrastructure"
            description={paymentInfrastructure.intro}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {paymentInfrastructure.standards.map((std, i) => (
              <GlowCard key={i}>
                <span className="text-2xl mb-2 block">🔒</span>
                <p className="text-sm font-medium text-white">{std}</p>
              </GlowCard>
            ))}
          </div>
          <p className="text-center text-accent/90 italic">{paymentInfrastructure.microcopy}</p>
        </div>
      </SectionWrapper>

      {/* Section 5: Dispute Resolution */}
      <SectionWrapper id="dispute-resolution">
        <div className="flex flex-col gap-8 max-w-5xl mx-auto">
          <AnimatedHeading
            eyebrow="Resolution"
            title="Dispute Resolution Framework"
            description={disputeResolution.intro}
          />
          <GlowCard className="max-w-2xl mx-auto">
            <h3 className="mb-4 text-base font-semibold text-white">Dispute Process</h3>
            <ol className="space-y-2 text-sm text-gray-400">
              {disputeResolution.process.map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center text-accent text-xs font-bold">{i + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
            <p className="mt-4 text-xs text-gray-400">{disputeResolution.subtext}</p>
          </GlowCard>
        </div>
      </SectionWrapper>

      {/* Section 6: Data Protection */}
      <SectionWrapper id="data-protection">
        <div className="flex flex-col gap-8 max-w-5xl mx-auto">
          <AnimatedHeading
            eyebrow="Privacy"
            title="Data Protection & Privacy Safeguards"
            description={dataProtection.intro}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {dataProtection.items.map((item, i) => (
              <GlowCard key={i}>
                <p className="text-sm font-medium text-white">{item}</p>
              </GlowCard>
            ))}
          </div>
          <p className="text-center text-gray-400">{dataProtection.microcopy}</p>
        </div>
      </SectionWrapper>

      {/* Section 7: Account Tools */}
      <SectionWrapper id="account-tools">
        <div className="flex flex-col gap-8 max-w-5xl mx-auto">
          <AnimatedHeading
            eyebrow="Account"
            title="Account Protection Tools"
            description={accountTools.intro}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {accountTools.items.map((item, i) => (
              <GlowCard key={i}>
                <p className="text-sm font-medium text-white">{item}</p>
              </GlowCard>
            ))}
          </div>
        </div>
      </SectionWrapper>

      {/* FAQ */}
      <SectionWrapper id="faq" className="bg-gradient-to-b from-transparent via-accent/5 to-transparent">
        <div className="flex flex-col gap-8 max-w-3xl mx-auto">
          <AnimatedHeading
            eyebrow="FAQ"
            title="Frequently Asked Questions"
            description="Click on a question to expand the answer."
          />
          <FAQAccordion items={faq} />
        </div>
      </SectionWrapper>

      {/* Trust Section */}
      <SectionWrapper id="trust">
        <div className="flex flex-col gap-8 max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-white text-center">
            Why Trust DGMarq
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {trust.map((item, i) => (
              <GlowCard key={i} className="text-center">
                <span className="text-4xl mb-3 block">{item.icon}</span>
                <p className="text-sm font-semibold text-white">{item.label}</p>
              </GlowCard>
            ))}
          </div>
        </div>
      </SectionWrapper>

      {/* Final CTA */}
      <SectionWrapper id="final-cta">
        <div className="flex flex-col items-center gap-6 text-center max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
            {finalCta.headline}
          </h2>
          <p className="text-gray-400">{finalCta.subtext}</p>
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

export default Security;
