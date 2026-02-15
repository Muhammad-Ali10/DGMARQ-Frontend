import React from "react";
import {
  HiCpuChip,
  HiDevicePhoneMobile,
  HiWrenchScrewdriver,
  HiArrowsRightLeft,
  HiGiftTop,
  HiCommandLine,
} from "react-icons/hi2";
import SectionWrapper from "@/components/marketplace/SectionWrapper";
import AnimatedHeading from "@/components/marketplace/AnimatedHeading";
import GlowCard from "@/components/marketplace/GlowCard";
import GridContainer from "@/components/marketplace/GridContainer";
import MetricCounter from "@/components/marketplace/MetricCounter";
import { useInView } from "@/hooks/useInView";
import { useMarketplaceOverview } from "@/hooks/useMarketplaceOverview";
import {
  MarketplaceHero,
  MarketplaceBenefits,
  MarketplaceChallenges,
  MarketplaceTechnology,
  MarketplaceRoadmap,
  MarketplaceFinalCta,
} from "@/lib/data";

const iconMap = {
  HiCpuChip,
  HiDevicePhoneMobile,
  HiWrenchScrewdriver,
  HiArrowsRightLeft,
  HiGiftTop,
  HiCommandLine,
};

const Marketplace = () => {
  const { categories, promotions, metrics } = useMarketplaceOverview();

  const { ref: roadmapRef, isInView: roadmapInView } = useInView({
    threshold: 0.2,
    once: true,
  });

  return (
    <main className="flex min-h-screen flex-col text-white">
      {/* 1. Hero */}
      <SectionWrapper id="hero" className="relative overflow-hidden bg-gradient-to-b from-accent/5 via-transparent to-transparent" withTopBorder>
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          {/* Title, subcopy, CTAs */}
          <div className="flex flex-1 flex-col justify-center space-y-8">
            <div className="space-y-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-accent/80">
                Multi-vendor digital infrastructure
              </p>
              <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl md:text-[2.7rem] md:leading-tight">
                Discover the{" "}
                <span className="bg-linear-to-r from-accent via-cyan-400 to-sky-300 bg-clip-text text-transparent">
                  Next-Gen Digital
                </span>
                <br className="hidden sm:block" />
                <span className="text-white">Gaming Marketplace</span>
              </h1>
              <p className="max-w-xl text-sm leading-relaxed text-gray-400 sm:text-base">
                {MarketplaceHero.subtext}
              </p>

              <div className="flex flex-wrap gap-2 text-[11px] text-gray-400">
                <span className="rounded-full border border-accent/40 bg-accent/10 px-3 py-1 font-medium">
                  Escrow-protected checkout
                </span>
                <span className="rounded-full border border-white/20 bg-white/5 px-3 py-1 font-medium">
                  Automated key fulfillment
                </span>
                <span className="rounded-full border border-white/20 bg-white/5 px-3 py-1 font-medium">
                  Verified multi-vendor network
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-gray-400">
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-xl bg-accent px-5 py-2.5 text-xs font-semibold text-white shadow-[0_0_30px_rgba(14,81,226,0.8)] transition-transform hover:-translate-y-0.5"
              >
                {MarketplaceHero.ctaPrimary}
              </button>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-transparent px-5 py-2.5 text-xs font-semibold text-white transition-transform hover:-translate-y-0.5 hover:border-accent/50 hover:bg-white/5"
              >
                {MarketplaceHero.ctaSecondary}
              </button>
              <span className="text-[11px] text-gray-400">
                Security, speed, and scale in a single marketplace layer.
              </span>
            </div>
          </div>
        </div>
      </SectionWrapper>

      {/* 2. Categories & Collections */}
      <SectionWrapper id="categories">
        <div className="flex flex-col gap-6">
          <AnimatedHeading
            eyebrow="Categories"
            title="Built for the entire digital gaming stack"
            description="Collections reflect how the marketplace organizes discovery across platforms, genres, and operational tooling."
          />
            <div className="flex flex-col gap-4">
            <div className="flex gap-3 overflow-x-auto pb-2 text-xs sm:hidden">
              {categories.map((category) => {
                const Icon =
                  category.icon && iconMap[category.icon]
                    ? iconMap[category.icon]
                    : null;
                return (
                  <GlowCard
                    key={category.id}
                    className="min-w-[220px] shrink-0"
                  >
                    <div className="flex items-center gap-3">
                      {Icon && (
                        <span className="rounded-xl bg-accent/15 p-2 text-accent">
                          <Icon className="h-4 w-4" />
                        </span>
                      )}
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-white">
                          {category.label}
                        </span>
                        <span className="text-[11px] text-gray-400">
                          {category.productCount.toLocaleString()} products
                        </span>
                      </div>
                    </div>
                    <p className="mt-3 text-xs leading-relaxed text-gray-400">
                      {category.description}
                    </p>
                  </GlowCard>
                );
              })}
            </div>

            <GridContainer
              cols={{ base: 1, sm: 2, md: 3, lg: 3 }}
              className="hidden sm:grid"
            >
              {categories.map((category) => {
                const Icon =
                  category.icon && iconMap[category.icon]
                    ? iconMap[category.icon]
                    : null;
                return (
                  <GlowCard key={category.id}>
                    <div className="flex items-center gap-3">
                      {Icon && (
                        <span className="rounded-xl bg-accent/15 p-2 text-accent">
                          <Icon className="h-4 w-4" />
                        </span>
                      )}
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-white sm:text-sm">
                          {category.label}
                        </span>
                        <span className="text-[11px] text-gray-400">
                          {category.productCount.toLocaleString()} products
                        </span>
                      </div>
                    </div>
                    <p className="mt-3 text-xs leading-relaxed text-gray-400 sm:text-sm">
                      {category.description}
                    </p>
                  </GlowCard>
                );
              })}
            </GridContainer>
          </div>
        </div>
      </SectionWrapper>

      {/* 3. Marketplace Benefits */}
      <SectionWrapper id="benefits">
        <div className="flex flex-col gap-6">
          <AnimatedHeading
            eyebrow="Benefits"
            title="A marketplace tuned for buyers, sellers, and infrastructure"
            description="Each actor participates through the same trust framework, but sees the platform through purpose-built experiences."
          />
          <GridContainer cols={{ base: 1, sm: 1, md: 3, lg: 3 }}>
            {["buyers", "sellers", "platform"].map((key) => {
              const section = MarketplaceBenefits[key];
              return (
                <GlowCard key={key}>
                  <h3 className="mb-3 text-sm font-semibold text-white sm:text-base">
                    {section.title}
                  </h3>
                  <ul className="space-y-2 text-xs leading-relaxed text-gray-400 sm:text-sm">
                    {section.items.map((item) => (
                      <li key={item} className="relative pl-4">
                        <span className="absolute left-0 top-1 h-1 w-1 rounded-full bg-accent/80" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </GlowCard>
              );
            })}
          </GridContainer>
        </div>
      </SectionWrapper>

      {/* 4. Promotions & Deals */}
      <SectionWrapper id="promotions">
        <div className="flex flex-col gap-6">
          <AnimatedHeading
            eyebrow="Promotions"
            title="Live-ready promotions and bundled incentives"
            description="Promotion slots are optimized for time-bound campaigns, FX-sensitive offers, and publisher-grade launch events."
          />
          <div className="grid gap-4 md:grid-cols-3">
            {promotions.map((promo) => (
                <GlowCard key={promo.id}>
                <div className="mb-2 flex items-center justify-between gap-2 text-xs">
                  <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-accent/90">
                    {promo.badge}
                  </span>
                  <span className="text-[11px] text-emerald-300">
                    {promo.discountLabel}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-white sm:text-base">
                  {promo.title}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-gray-400 sm:text-sm">
                  {promo.description}
                </p>
                <div className="mt-4 flex items-center justify-between text-[11px] text-gray-400">
                  <span>Limited-time campaign window</span>
                  <span className="rounded-md border border-white/20 bg-white/5 px-2 py-0.5">
                    Countdown-ready
                  </span>
                </div>
              </GlowCard>
            ))}
          </div>
        </div>
      </SectionWrapper>

      {/* 5. Marketplace Challenges */}
      <SectionWrapper id="challenges">
        <div className="flex flex-col gap-6">
          <AnimatedHeading
            eyebrow="Challenges"
            title="Key challenges in digital marketplaces"
            description="The platform is built around real constraints: time-to-delivery, trust, fraud risk, and the operational reality of independent sellers."
          />
          <GridContainer cols={{ base: 1, sm: 2, md: 2, lg: 4 }}>
            {MarketplaceChallenges.map((challenge) => (
              <GlowCard key={challenge.title}>
                <h3 className="mb-2 text-sm font-semibold text-white sm:text-base">
                  {challenge.title}
                </h3>
                <p className="text-xs leading-relaxed text-gray-400 sm:text-sm">
                  {challenge.description}
                </p>
              </GlowCard>
            ))}
          </GridContainer>
        </div>
      </SectionWrapper>

      {/* 6. Technology & Infrastructure */}
      <SectionWrapper id="technology">
        <div className="flex flex-col gap-6">
          <AnimatedHeading
            eyebrow="Infrastructure"
            title="Technology layers that power the marketplace"
            description="Under the UI sits an infrastructure stack tuned for auditability, resilience, and global reach."
          />
          <GridContainer cols={{ base: 1, sm: 2, md: 3, lg: 3 }}>
            {MarketplaceTechnology.map((tech) => (
              <GlowCard key={tech.id}>
                <h3 className="mb-2 text-sm font-semibold text-white sm:text-base">
                  {tech.title}
                </h3>
                <p className="text-xs leading-relaxed text-gray-400 sm:text-sm">
                  {tech.description}
                </p>
              </GlowCard>
            ))}
          </GridContainer>
        </div>
      </SectionWrapper>

      {/* 7. Market Metrics */}
      <SectionWrapper id="metrics">
        <div className="flex flex-col gap-6">
          <AnimatedHeading
            eyebrow="Metrics"
            title="Operational scale of the marketplace"
            description="These metrics represent the scale the platform is engineered to support, not a marketing slogan."
          />
          <GridContainer cols={{ base: 1, sm: 2, md: 4, lg: 4 }}>
            {metrics.map((metric) => (
              <MetricCounter
                key={metric.id}
                value={metric.value}
                suffix={metric.suffix}
                label={metric.label}
              />
            ))}
          </GridContainer>
        </div>
      </SectionWrapper>

      {/* 8. Roadmap / Future Plans */}
      <SectionWrapper id="roadmap">
        <div ref={roadmapRef} className="flex flex-col gap-6">
          <AnimatedHeading
            eyebrow="Roadmap"
            title="Where the marketplace infrastructure is heading"
            description="Each phase extends the same core ideas: secure transactions, predictable delivery, and global reach."
          />
          <div className="relative mt-6">
            {/* center timeline line */}
            <div className="pointer-events-none absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-linear-to-b from-accent/70 via-accent/20 to-transparent md:block" />
            <div className="space-y-8">
              {MarketplaceRoadmap.map((step, index) => {
                const isLeft = index % 2 === 0;
                const isActive = roadmapInView;

                const card = (
                  <div
                    className={`w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-xs text-gray-400 backdrop-blur-md transition-all duration-700 ${
                      isActive
                        ? "translate-y-0 opacity-100"
                        : "translate-y-4 opacity-0"
                    }`}
                  >
                    <div className="mb-1 flex items-center gap-2">
                      <span className="relative flex h-4 w-4 items-center justify-center">
                        <span className="absolute inline-flex h-4 w-4 rounded-full bg-accent/30 opacity-60" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
                      </span>
                      <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                        Step {index + 1}
                      </span>
                    </div>
                    <h3 className="text-xs font-semibold text-white sm:text-sm">
                      {step.title}
                    </h3>
                    <p className="mt-1 text-[11px] leading-relaxed text-gray-400 sm:text-xs">
                      {step.description}
                    </p>
                  </div>
                );

                return (
                  <div
                    key={step.id}
                    className="relative grid grid-cols-1 gap-4 md:grid-cols-2"
                  >
                    {/* dot on center line */}
                    <div className="pointer-events-none absolute left-1/2 top-1/2 hidden h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-accent/40 bg-accent/40 md:block">
                      <span className="absolute inset-0 rounded-full bg-accent/60 blur-[6px]" />
                    </div>

                    {isLeft ? (
                      <>
                        <div className="flex justify-start md:justify-end">
                          {card}
                        </div>
                        <div className="hidden md:block" />
                      </>
                    ) : (
                      <>
                        <div className="hidden md:block" />
                        <div className="flex justify-start">{card}</div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </SectionWrapper>

      {/* 11. Final CTA */}
      <SectionWrapper id="final-cta">
        <div className="flex flex-col items-start gap-5 text-left md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl space-y-3">
            <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl md:text-4xl">
              {MarketplaceFinalCta.headline}
            </h2>
            <p className="text-sm leading-relaxed text-gray-400 sm:text-base">
              {MarketplaceFinalCta.subtext}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-xl bg-accent px-5 py-2.5 text-xs font-semibold text-white shadow-[0_0_30px_rgba(14,81,226,0.8)] ring-2 ring-accent/40 transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-[0_0_45px_rgba(14,81,226,0.9)]"
            >
              {MarketplaceFinalCta.ctaPrimary}
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-transparent px-5 py-2.5 text-xs font-semibold text-white transition-transform hover:-translate-y-0.5 hover:border-accent/50 hover:bg-white/5"
            >
              {MarketplaceFinalCta.ctaSecondary}
            </button>
          </div>
        </div>
      </SectionWrapper>
    </main>
  );
};

export default Marketplace;
