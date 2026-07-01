import { Link } from "react-router-dom";
import SectionWrapper from "@features/content/marketing/SectionWrapper";
import AnimatedHeading from "@features/content/marketing/AnimatedHeading";
import GlowCard from "@features/content/marketing/GlowCard";
import FAQAccordion from "@features/content/marketing/FAQAccordion";
import { BuyerSupportPageData } from "@/lib/data";
import { useSEO } from "@/hooks/useSEO";

const BuyerSupport = () => {
  const { hero, sections, faq, finalCta } = BuyerSupportPageData;

  useSEO({
    title: "Buyer Support | DGMARQ",
    description: "Get help with your purchases on DGMARQ. Our buyer support team is here to help.",
    canonical: "/buyer-support",
    useDefaults: false,
  });

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

      {/* Help Topics */}
      <SectionWrapper id="help-topics">
        <div className="flex flex-col gap-12 max-w-6xl mx-auto">
          <AnimatedHeading
            eyebrow="Help Topics"
            title="Browse Help Topics"
            description="Find answers and guidance for buying safely on DGMarq."
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {sections.map((section, i) => (
              <GlowCard key={i}>
                <h3 className="text-base font-semibold text-white mb-4">{section.title}</h3>
                {section.intro && (
                  <p className="text-sm text-gray-400 mb-3">{section.intro}</p>
                )}
                {section.items && (
                  <ul className="space-y-2 text-sm text-gray-400">
                    {section.items.map((item, j) => (
                      <li key={j} className="flex gap-2">
                        <span className="text-accent">✓</span> {item}
                      </li>
                    ))}
                  </ul>
                )}
                {section.process && (
                  <ol className="space-y-2 text-sm text-gray-400">
                    {section.process.map((step, j) => (
                      <li key={j} className="flex gap-3">
                        <span className="shrink-0 w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center text-accent text-xs font-bold">{j + 1}</span>
                        {step}
                      </li>
                    ))}
                  </ol>
                )}
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

export default BuyerSupport;
