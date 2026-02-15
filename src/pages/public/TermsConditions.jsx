import SectionWrapper from "@/components/marketplace/SectionWrapper";
import GlowCard from "@/components/marketplace/GlowCard";
import { TermsConditionsPageData } from "@/lib/data";

const TermsConditions = () => {
  const { hero, sections, finalCta } = TermsConditionsPageData;

  const renderContent = (item) => {
    if (Array.isArray(item)) {
      return (
        <ul className="list-disc list-inside space-y-1 ml-4 mt-2 text-sm text-gray-400">
          {item.map((sub, j) => (
            <li key={j}>{sub}</li>
          ))}
        </ul>
      );
    }
    return <p className="text-sm text-gray-400">{item}</p>;
  };

  return (
    <main className="flex min-h-screen flex-col text-white">
      {/* Hero */}
      <SectionWrapper id="hero" className="relative overflow-hidden bg-gradient-to-b from-accent/10 via-transparent to-transparent">
        <div className="flex flex-col gap-6 max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white">
            {hero.headline}
          </h1>
          <p className="text-lg sm:text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
            {hero.subtext}
          </p>
          <p className="text-sm text-accent/90">{hero.effectiveDate}</p>
        </div>
      </SectionWrapper>

      {/* Terms Sections */}
      <SectionWrapper id="terms" className="bg-gradient-to-b from-transparent via-accent/5 to-transparent">
        <div className="flex flex-col gap-8 max-w-4xl mx-auto">
          {sections.map((section) => (
            <GlowCard key={section.num}>
              <h2 className="text-lg font-semibold text-white mb-4">
                {section.num}. {section.title}
              </h2>
              <div className="space-y-3">
                {section.content.map((item, i) => (
                  <div key={i}>{renderContent(item)}</div>
                ))}
              </div>
            </GlowCard>
          ))}
        </div>
      </SectionWrapper>

      {/* Final CTA */}
      <SectionWrapper id="final-cta">
        <div className="flex flex-col items-center gap-6 text-center max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            {finalCta.headline}
          </h2>
          <a
            href={finalCta.ctaPrimaryUrl}
            className="inline-flex items-center justify-center rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-white shadow-[0_0_30px_rgba(14,81,226,0.8)] transition-transform hover:-translate-y-0.5"
          >
            {finalCta.ctaPrimary}
          </a>
        </div>
      </SectionWrapper>
    </main>
  );
};

export default TermsConditions;
