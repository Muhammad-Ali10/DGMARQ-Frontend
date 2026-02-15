import { Link } from 'react-router-dom';
import { useInView } from '../../hooks/useInView';
import {
  SectionWrapper,
  AnimatedHeading,
  GridContainer,
  GlowCard,
  MetricCounter,
  TechCard,
  RoadmapTimeline,
} from '../../components/about';
import {
  AboutHero,
  AboutEcosystem,
  AboutChallenges,
  AboutTechCards,
  AboutMetrics,
  AboutRoadmapDetailed,
  AboutPhilosophy,
  AboutFinalCta,
} from '../../lib/data';

// HUD-style corner bracket (CSS-only)
function CornerBrackets({ className = '' }) {
  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`} aria-hidden>
      <span className="absolute top-0 left-0 w-8 h-px bg-accent/50" />
      <span className="absolute top-0 left-0 w-px h-8 bg-accent/50" />
      <span className="absolute top-0 right-0 w-8 h-px bg-accent/50" />
      <span className="absolute top-0 right-0 w-px h-8 bg-accent/50" />
      <span className="absolute bottom-0 left-0 w-8 h-px bg-accent/50" />
      <span className="absolute bottom-0 left-0 w-px h-8 bg-accent/50" />
      <span className="absolute bottom-0 right-0 w-8 h-px bg-accent/50" />
      <span className="absolute bottom-0 right-0 w-px h-8 bg-accent/50" />
    </div>
  );
}

export default function About() {
  const { ref: heroRef, isInView: heroInView } = useInView({ threshold: 0.2, once: true });

  return (
    <div className="min-h-screen text-white">
      {/* [1] IMMERSIVE HERO */}
      <section className="relative min-h-[85vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-accent/10 via-transparent to-transparent pointer-events-none" />
        {/* <GridContainer />
        <div className="absolute inset-0 bg-gradient-to-b from-accent/5 via-transparent to-secondary/30" />
        <div className="absolute top-1/2 left-1/2 w-[600px] h-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/5 blur-[120px] pointer-events-none" />
        <CornerBrackets /> */}

        <div
          ref={heroRef}
          className={`relative z-10 max-w-4xl mx-auto text-center transition-all duration-800 ease-out ${
            heroInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white mb-6">
            {AboutHero.headline}
          </h1>
          <p className="text-lg sm:text-xl text-gray-400 max-w-3xl mx-auto mb-10 leading-relaxed">
            {AboutHero.subtext}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to={AboutHero.ctaPrimaryUrl}
              className="px-6 py-3 rounded-lg bg-accent text-white font-medium transition-all duration-300 hover:shadow-[0_0_24px_-2px_rgba(14,81,226,0.5)] hover:opacity-95"
            >
              {AboutHero.ctaPrimary}
            </Link>
            <Link
              to={AboutHero.ctaSecondaryUrl}
              className="px-6 py-3 rounded-lg border border-white/20 text-white font-medium transition-all duration-300 hover:border-accent/50 hover:bg-white/5"
            >
              {AboutHero.ctaSecondary}
            </Link>
          </div>
        </div>
      </section>

      {/* [2] ECOSYSTEM ARCHITECTURE - Premium Visual Flow */}
      <SectionWrapper className="relative overflow-hidden">
        {/* Background accent circles */}
        {/* <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-1/2 right-1/4 translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent/5 rounded-full blur-[100px] pointer-events-none" /> */}
        
        <div className="max-w-7xl mx-auto relative z-10">
          <AnimatedHeading className="mb-20 text-center">
            Ecosystem Architecture
          </AnimatedHeading>

          {/* Visual flow diagram with animated connections */}
          <div className="relative py-12">
              {/* Animated connecting lines - Desktop */}
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-px -translate-y-1/2 z-0">
              {/* Base gradient line */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-accent/20 to-transparent" />
              
              {/* Animated pulse segments */}
              <div 
                className="absolute left-[15%] w-[20%] h-full bg-accent/30 animate-pulse"
                style={{ 
                  boxShadow: '0 0 30px rgba(14,81,226,0.4)',
                  animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                }}
              />
              <div 
                className="absolute right-[15%] w-[20%] h-full bg-accent/30 animate-pulse"
                style={{ 
                  boxShadow: '0 0 30px rgba(14,81,226,0.4)',
                  animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                  animationDelay: '1s'
                }}
              />
              
              {/* Flowing particles */}
              <div className="absolute left-[15%] w-3 h-3 rounded-full bg-accent/70 animate-ping" style={{ animationDuration: '3s', animationDelay: '0s', top: '-4px' }} />
              <div className="absolute right-[15%] w-3 h-3 rounded-full bg-accent/70 animate-ping" style={{ animationDuration: '3s', animationDelay: '1.5s', top: '-4px' }} />
            </div>
            
            {/* CSS animations */}
            <style>{`
              @keyframes dataFlow {
                0% { transform: translateX(0); opacity: 0.3; }
                50% { opacity: 1; }
                100% { transform: translateX(calc(100vw - 30%)); opacity: 0.3; }
              }
            `}</style>

            {/* Grid layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-16 items-center relative z-10">
              {/* Buyers - Premium Card */}
              <EcosystemCard
                title="Buyers"
                items={AboutEcosystem.buyers}
                position="left"
                index={0}
              />

              {/* Center: Platform Engine - Premium Hub */}
              <div className="relative order-first lg:order-none">
                <div className="relative group">
                  {/* Outer glow rings */}
                  <div className="absolute inset-0 bg-accent/20 rounded-full blur-2xl group-hover:blur-3xl transition-all duration-700 animate-pulse" />
                  <div className="absolute inset-0 bg-accent/10 rounded-full blur-xl group-hover:blur-2xl transition-all duration-500" />
                  
                  {/* Main hub card */}
                  <div className="relative rounded-3xl border-2 border-accent/60 bg-gradient-to-br from-accent/20 via-accent/10 to-accent/5 backdrop-blur-xl px-10 py-12 text-center shadow-[0_0_60px_-12px_rgba(14,81,226,0.5)] transition-all duration-500 hover:border-accent/80 hover:shadow-[0_0_80px_-12px_rgba(14,81,226,0.7)] hover:scale-110">
                    {/* Top icon badge */}
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-20 h-20 rounded-full bg-gradient-to-br from-accent/40 to-accent/20 border-4 border-[#030a14] flex items-center justify-center backdrop-blur-md shadow-[0_0_30px_rgba(14,81,226,0.6)] group-hover:scale-110 transition-transform duration-300">
                      <div className="relative">
                        <span className="text-3xl font-bold text-white">←→</span>
                        <div className="absolute inset-0 bg-accent/30 rounded-full blur-md animate-ping" />
                      </div>
                    </div>
                    
                    {/* Connection arrows */}
                    <div className="absolute -left-12 top-1/2 -translate-y-1/2 hidden lg:block">
                      <div className="w-12 h-px bg-gradient-to-r from-transparent to-accent/60 relative">
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-l-[10px] border-l-accent/60 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent animate-pulse" />
                      </div>
                    </div>
                    <div className="absolute -right-12 top-1/2 -translate-y-1/2 hidden lg:block">
                      <div className="w-12 h-px bg-gradient-to-l from-transparent to-accent/60 relative">
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0 h-0 border-r-[10px] border-r-accent/60 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent animate-pulse" style={{ animationDelay: '0.5s' }} />
                      </div>
                    </div>
                    
                    {/* Content */}
                    <h3 className="text-2xl font-bold text-white mt-6 mb-4 bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
                      {AboutEcosystem.centerLabel}
                    </h3>
                    
                    {/* Decorative line */}
                    <div className="w-20 h-1 bg-gradient-to-r from-transparent via-accent/60 to-transparent mx-auto mt-4 rounded-full" />
                    
                    {/* Inner glow effect */}
                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-accent/10 via-transparent to-accent/10 opacity-50 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Sellers - Premium Card */}
              <EcosystemCard
                title="Sellers"
                items={AboutEcosystem.sellers}
                position="right"
                index={1}
              />
            </div>

            {/* Animated arrows - Desktop */}
            <div className="hidden lg:block absolute top-1/2 left-[15%] -translate-y-1/2 z-0">
              <div className="w-0 h-0 border-t-[8px] border-b-[8px] border-l-[12px] border-l-accent/60 border-t-transparent border-b-transparent animate-pulse" />
            </div>
            <div className="hidden lg:block absolute top-1/2 right-[15%] -translate-y-1/2 z-0">
              <div className="w-0 h-0 border-t-[8px] border-b-[8px] border-r-[12px] border-r-accent/60 border-t-transparent border-b-transparent animate-pulse" style={{ animationDelay: '0.5s' }} />
            </div>
          </div>
        </div>

        {/* CSS animations */}
        <style>{`
          @keyframes pulseFlow {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 0.7; }
          }
          @keyframes dataFlow {
            0% { left: 15%; opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { left: calc(85% - 128px); opacity: 0; }
          }
        `}</style>
      </SectionWrapper>

      {/* [3] DIGITAL COMMERCE CHALLENGE - Premium Enhanced Design */}
      <SectionWrapper className="bg-secondary/40 relative overflow-hidden">
        {/* Background accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-accent/5 rounded-full blur-[150px] pointer-events-none" />
        
        <div className="relative max-w-7xl mx-auto">
          <AnimatedHeading className="mb-16 text-center">
            Digital Commerce Challenge
          </AnimatedHeading>
          
          {/* Enhanced challenge cards grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10 mb-16">
            {AboutChallenges.items.map((item, i) => (
              <ChallengeCard key={i} item={item} index={i} />
            ))}
          </div>

          {/* Highlighted solution statement - Enhanced */}
          <div className="relative max-w-5xl mx-auto">
            {/* Multi-layer glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-accent/15 via-accent/25 to-accent/15 rounded-2xl blur-2xl" />
            <div className="absolute inset-0 bg-gradient-to-r from-accent/10 via-accent/20 to-accent/10 rounded-2xl blur-xl" />
            
            {/* Main card */}
            <div className="relative border-2 border-accent/40 rounded-2xl bg-gradient-to-br from-white/10 via-white/5 to-white/3 backdrop-blur-xl p-10 lg:p-12 text-center overflow-hidden">
              {/* Top accent line */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/70 to-transparent" />
              
              {/* Corner accents */}
              <div className="absolute top-0 left-0 w-20 h-20 border-t-2 border-l-2 border-accent/30 rounded-tl-2xl" />
              <div className="absolute top-0 right-0 w-20 h-20 border-t-2 border-r-2 border-accent/30 rounded-tr-2xl" />
              <div className="absolute bottom-0 left-0 w-20 h-20 border-b-2 border-l-2 border-accent/30 rounded-bl-2xl" />
              <div className="absolute bottom-0 right-0 w-20 h-20 border-b-2 border-r-2 border-accent/30 rounded-br-2xl" />
              
              {/* Icon badge */}
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full bg-gradient-to-br from-accent/40 to-accent/20 border-4 border-[#030a14] flex items-center justify-center backdrop-blur-md shadow-[0_0_25px_rgba(14,81,226,0.6)]">
                <span className="text-2xl">⚡</span>
              </div>
              
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-white leading-relaxed mb-4 bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent">
                {AboutChallenges.subtext}
              </p>
              
              {/* Bottom accent line */}
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/70 to-transparent" />
            </div>
          </div>
        </div>
      </SectionWrapper>

      {/* [4] TECHNOLOGY & INFRASTRUCTURE - Staggered Grid */}
      <SectionWrapper>
        <div className="max-w-7xl mx-auto">
          <AnimatedHeading className="mb-16 text-center">
            Technology & Infrastructure
          </AnimatedHeading>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {AboutTechCards.map((card, i) => (
              <div
                key={i}
                className={`transition-all duration-500 ${i % 3 === 1 ? 'lg:mt-8' : ''} ${i % 3 === 2 ? 'lg:mt-4' : ''}`}
              >
                <TechCard
                  title={card.title}
                  description={card.description}
                  icon={card.icon}
                />
              </div>
            ))}
          </div>
        </div>
      </SectionWrapper>

      {/* [5] GROWTH METRICS - Enhanced Visual Display */}
      <SectionWrapper className="bg-secondary/40 relative overflow-hidden">
        {/* Background accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="relative max-w-6xl mx-auto">
          <AnimatedHeading className="mb-16 text-center">
            Growth Metrics
          </AnimatedHeading>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {AboutMetrics.map((m, i) => (
              <div key={i} className="group">
                <div className="relative">
                  <div className="absolute inset-0 bg-accent/10 rounded-2xl blur-lg group-hover:blur-xl transition-all duration-300" />
                  <div className="relative border border-accent/20 rounded-2xl bg-white/5 backdrop-blur-md p-6 text-center transition-all duration-300 hover:border-accent/40 hover:bg-white/10 hover:scale-105">
                    <MetricCounter
                      value={m.value}
                      suffix={m.suffix}
                      label={m.label}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </SectionWrapper>

      {/* [6] ROADMAP TIMELINE */}
      <SectionWrapper>
        <RoadmapTimeline items={AboutRoadmapDetailed} sectionTitle="Roadmap" />
      </SectionWrapper>

      {/* [7] CORE PHILOSOPHY - Enhanced Cards */}
      <SectionWrapper>
        <div className="max-w-7xl mx-auto">
          <AnimatedHeading className="mb-16 text-center">
            Core Philosophy
          </AnimatedHeading>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {AboutPhilosophy.map((item, i) => (
              <PhilosophyCard key={i} item={item} index={i} />
            ))}
          </div>
        </div>
      </SectionWrapper>

      {/* [8] FINAL CTA */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-secondary/50 to-primary" />
        <div className="absolute inset-0 bg-accent/5" />
        <CornerBrackets />
        <div className="relative max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">
            {AboutFinalCta.headline}
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to={AboutFinalCta.ctaPrimaryUrl}
              className="px-6 py-3 rounded-lg bg-accent text-white font-medium transition-all duration-300 hover:shadow-[0_0_28px_-2px_rgba(14,81,226,0.55)]"
            >
              {AboutFinalCta.ctaPrimary}
            </Link>
            <Link
              to={AboutFinalCta.ctaSecondaryUrl}
              className="px-6 py-3 rounded-lg border border-white/20 text-white font-medium transition-all duration-300 hover:border-accent/50 hover:bg-white/5"
            >
              {AboutFinalCta.ctaSecondary}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

// Enhanced Ecosystem Card Component - Premium Design
function EcosystemCard({ title, items, position, index }) {
  const { ref, isInView } = useInView({ threshold: 0.2, once: true });

  return (
    <div
      ref={ref}
      className={`relative flex flex-col ${position === 'left' ? 'items-center lg:items-end text-center lg:text-right' : 'items-center lg:items-start text-center lg:text-left'} transition-all duration-700 ease-out ${
        isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
      style={{ transitionDelay: `${index * 200}ms` }}
    >
      <div className="relative group w-full max-w-md">
        {/* Multi-layer glow effects */}
        <div className="absolute inset-0 bg-accent/15 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500" />
        <div className="absolute inset-0 bg-accent/5 rounded-2xl blur-lg group-hover:blur-xl transition-all duration-300" />
        
        {/* Main card */}
        <div className="relative border-2 border-white/10 rounded-2xl bg-gradient-to-br from-white/8 via-white/5 to-white/3 backdrop-blur-xl p-8 transition-all duration-500 hover:border-accent/40 hover:bg-gradient-to-br hover:from-white/12 hover:via-white/8 hover:to-white/5 hover:scale-105 hover:shadow-[0_0_40px_-8px_rgba(14,81,226,0.4)]">
          {/* Top accent line */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent rounded-t-2xl" />
          
          {/* Title section */}
          <div className="mb-8 pb-4 border-b border-accent/20">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-3 h-3 rounded-full bg-accent shadow-[0_0_12px_rgba(14,81,226,0.8)] animate-pulse ${position === 'left' ? 'order-2' : ''}`} />
              <h3 className="text-2xl font-bold text-white bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                {title}
              </h3>
            </div>
            <div className="h-px w-16 bg-accent/50 rounded-full" style={{ marginLeft: position === 'left' ? 'auto' : '0', marginRight: position === 'left' ? '0' : 'auto' }} />
          </div>
          
          {/* Benefits list */}
          <ul className="space-y-5">
            {items.map((item, i) => (
              <li 
                key={i} 
                className="flex items-start gap-4 transition-all duration-300 hover:text-white group/item"
                style={{ flexDirection: position === 'left' ? 'row-reverse' : 'row' }}
              >
                <div className="relative shrink-0">
                  <div className="absolute inset-0 w-3 h-3 rounded-full bg-accent/30 blur-sm group-hover/item:blur-md transition-all duration-300" />
                  <div className="relative w-3 h-3 rounded-full bg-accent shadow-[0_0_10px_rgba(14,81,226,0.7)] group-hover/item:scale-125 transition-transform duration-300" />
                </div>
                <span className="text-gray-300 text-sm leading-relaxed group-hover/item:text-white transition-colors duration-300">
                  {item}
                </span>
              </li>
            ))}
          </ul>
          
          {/* Bottom glow accent */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent rounded-b-2xl opacity-50" />
        </div>
      </div>
    </div>
  );
}

// Enhanced Challenge Card Component
function ChallengeCard({ item, index }) {
  const { ref, isInView } = useInView({ threshold: 0.15, once: true });

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
      style={{ transitionDelay: `${index * 120}ms` }}
    >
      <div className="relative group h-full">
        {/* Multi-layer glow effects */}
        <div className="absolute inset-0 bg-accent/15 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500" />
        <div className="absolute inset-0 bg-accent/5 rounded-2xl blur-lg group-hover:blur-xl transition-all duration-300" />
        
        {/* Main card */}
        <div className="relative border-2 border-white/10 rounded-2xl bg-gradient-to-br from-white/8 via-white/5 to-white/3 backdrop-blur-xl p-8 lg:p-10 transition-all duration-500 hover:border-accent/40 hover:bg-gradient-to-br hover:from-white/12 hover:via-white/8 hover:to-white/5 hover:scale-105 hover:shadow-[0_0_50px_-10px_rgba(14,81,226,0.4)]">
          {/* Top accent line */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent rounded-t-2xl" />
          
          {/* Number badge - Top Center */}
          <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full bg-gradient-to-br from-accent/30 to-accent/20 border-4 border-[#030a14] flex items-center justify-center backdrop-blur-md shadow-[0_0_25px_rgba(14,81,226,0.6)] group-hover:scale-110 transition-transform duration-300 z-10">
            <span className="text-xl font-bold text-white">{index + 1}</span>
          </div>
          
          {/* Challenge side - Left */}
          <div className="mb-6 pt-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-2 h-2 rounded-full bg-accent shadow-[0_0_12px_rgba(14,81,226,0.8)] animate-pulse" />
              <span className="text-white font-bold text-lg sm:text-xl lg:text-2xl leading-tight">
                {item.left}
              </span>
            </div>
          </div>
          
          {/* Simple divider line */}
          <div className="relative flex items-center justify-center my-6">
            <div className="w-full h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />
          </div>
          
          {/* Solution side - Right */}
          <div>
            <div className="flex items-center gap-3">
              <span className="text-gray-300 font-semibold text-base sm:text-lg lg:text-xl leading-relaxed">
                {item.right}
              </span>
              <div className="w-2 h-2 rounded-full bg-accent/60 shadow-[0_0_10px_rgba(14,81,226,0.6)] animate-pulse" style={{ animationDelay: '0.5s' }} />
            </div>
          </div>
          
          {/* Bottom accent line */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent rounded-b-2xl opacity-50" />
          
          {/* Inner glow */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-accent/5 via-transparent to-accent/5 opacity-50 pointer-events-none" />
        </div>
      </div>
    </div>
  );
}

// Enhanced Philosophy Card Component
function PhilosophyCard({ item, index }) {
  const { ref, isInView } = useInView({ threshold: 0.15, once: true });

  return (
    <div
      ref={ref}
      className={`transition-all duration-600 ease-out ${
        isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      }`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <div className="relative group h-full">
        <div className="absolute inset-0 bg-accent/10 rounded-xl blur-md group-hover:blur-lg transition-all duration-300" />
        <div className="relative border border-white/10 rounded-xl bg-white/5 backdrop-blur-md p-6 transition-all duration-300 hover:border-accent/30 hover:bg-white/10 hover:scale-105">
          {/* Top accent line */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent rounded-t-xl" />
          
          {/* Number badge */}
          <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center text-accent text-xs font-bold backdrop-blur-sm">
            {index + 1}
          </div>
          
          <h3 className="text-lg font-bold text-white mb-3 pr-8">{item.title}</h3>
          <p className="text-gray-400 text-sm leading-relaxed">{item.description}</p>
        </div>
      </div>
    </div>
  );
}
