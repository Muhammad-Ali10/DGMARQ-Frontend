import { Link } from "react-router-dom";
import SectionWrapper from "@/components/marketplace/SectionWrapper";
import AnimatedHeading from "@/components/marketplace/AnimatedHeading";
import GlowCard from "@/components/marketplace/GlowCard";
import FAQAccordion from "@/components/marketplace/FAQAccordion";
import { ContactPageData } from "@/lib/data";

const ContactUs = () => {
  const { hero, channels, buyerAssistance, sellerAssistance, escalation, businessInquiries, transparency, faq, finalCta } = ContactPageData;

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

      {/* Section 1: Contact Channels */}
      <SectionWrapper id="channels">
        <div className="flex flex-col gap-8 max-w-5xl mx-auto">
          <AnimatedHeading
            eyebrow="Get in Touch"
            title="Contact Channels"
            description="Choose the best way to reach our support team."
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {channels.map((channel, i) => (
              <GlowCard key={i}>
                <span className="text-3xl mb-4 block">{channel.icon}</span>
                <h3 className="text-base font-semibold text-white mb-2">{channel.title}</h3>
                <p className="text-sm font-medium text-accent">{channel.detail}</p>
                {channel.sub && (
                  <p className="text-xs text-gray-400 mt-2">{channel.sub}</p>
                )}
              </GlowCard>
            ))}
          </div>
        </div>
      </SectionWrapper>

      {/* Section 2: Buyer & Seller Assistance */}
      <SectionWrapper id="assistance">
        <div className="flex flex-col gap-8 max-w-5xl mx-auto">
          <AnimatedHeading
            eyebrow="Support"
            title="What We Can Help With"
            description="Our team assists with a wide range of marketplace and account concerns."
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <GlowCard>
              <h3 className="text-base font-semibold text-white mb-4">Buyer Assistance</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                {buyerAssistance.map((item, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-accent">✓</span> {item}
                  </li>
                ))}
              </ul>
            </GlowCard>
            <GlowCard>
              <h3 className="text-base font-semibold text-white mb-4">Seller Assistance</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                {sellerAssistance.map((item, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-accent">✓</span> {item}
                  </li>
                ))}
              </ul>
            </GlowCard>
          </div>
        </div>
      </SectionWrapper>

      {/* Section 3: Escalation Process */}
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
                  <span className="shrink-0 w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center text-accent text-xs font-bold">{i + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
          </GlowCard>
        </div>
      </SectionWrapper>

      {/* Section 4: Business & Legal */}
      <SectionWrapper id="business">
        <div className="flex flex-col gap-6 max-w-2xl mx-auto text-center">
          <AnimatedHeading
            eyebrow="Partnerships"
            title={businessInquiries.title}
            description={businessInquiries.subtext}
          />
          <a
            href={`mailto:${businessInquiries.email}`}
            className="inline-flex items-center justify-center rounded-xl border border-accent/50 bg-accent/10 px-6 py-3 text-sm font-semibold text-accent transition-transform hover:-translate-y-0.5 hover:border-accent hover:bg-accent/20"
          >
            {businessInquiries.email}
          </a>
        </div>
      </SectionWrapper>

      {/* Section 5: Transparency Commitment */}
      <SectionWrapper id="transparency">
        <div className="flex flex-col gap-8 max-w-5xl mx-auto">
          <AnimatedHeading
            eyebrow="Our Promise"
            title={transparency.title}
            description={transparency.intro}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {transparency.items.map((item, i) => (
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

export default ContactUs;
