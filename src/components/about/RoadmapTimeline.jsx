import { useInView } from '../../hooks/useInView';
import AnimatedHeading from './AnimatedHeading';

/**
 * Vertical timeline with center line and cards alternating left/right.
 * Futuristic, gaming-inspired: neon glow, gradients, sleek cards with hover/entrance animations.
 * Fully responsive: stacked on mobile, alternating on desktop.
 *
 * Items: { milestone, description, icon? } (milestone = step title, description = step details).
 */
export default function RoadmapTimeline({ items, sectionTitle = 'Roadmap', className = '' }) {
  if (!items?.length) return null;

  return (
    <section className={`w-full ${className}`}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {sectionTitle && (
          <AnimatedHeading className="mb-10 md:mb-14 text-center">
            {sectionTitle}
          </AnimatedHeading>
        )}

        <div className="relative">
          {/* Center vertical line – top to bottom (visible from md) */}
          <div
            className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 hidden md:block"
            aria-hidden
          >
            <div className="absolute inset-0 bg-gradient-to-b from-accent/20 via-accent/60 to-accent/20" />
            <div
              className="absolute inset-0 w-px bg-accent/40"
              style={{ boxShadow: '0 0 16px 2px rgba(14, 81, 226, 0.35)' }}
            />
          </div>

          <ul className="space-y-8 md:space-y-12 list-none p-0 m-0">
            {items.map((item, index) => (
              <TimelineStep
                key={index}
                title={item.milestone}
                description={item.description}
                icon={item.icon}
                index={index}
                isLeft={index % 2 === 0}
              />
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function TimelineStep({ title, description, icon, index, isLeft }) {
  const { ref, isInView } = useInView({ threshold: 0.15, once: true });

  return (
    <li
      ref={ref}
      className={`
        group relative flex flex-col md:flex-row md:items-center gap-4 md:gap-0
        transition-all duration-600 ease-out
        ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}
      `}
      style={{ transitionDelay: `${index * 80}ms` }}
    >
      {/* Spacer – desktop: right when card is left, left when card is right */}
      <div
        className={`hidden md:block w-[calc(50%-28px)] shrink-0 ${isLeft ? 'order-last' : 'order-first'}`}
        aria-hidden
      />

      {/* Center dot – aligned with vertical line */}
      <div
        className="
          absolute left-4 md:left-1/2 top-5 md:top-1/2 w-3 h-3 md:-translate-x-1/2 md:-translate-y-1/2
          rounded-full border-2 border-[#030a14] bg-accent
          shadow-[0_0_16px_4px_rgba(14,81,226,0.5)]
          ring-4 ring-accent/20
          z-10 shrink-0
          transition-transform duration-300 hover:scale-125 group-hover:scale-125
        "
        aria-hidden
      >
        {icon && (
          <span className="absolute inset-0 flex items-center justify-center text-white text-[8px] font-bold">
            {icon}
          </span>
        )}
      </div>

      {/* Card – alternating left/right on desktop */}
      <div
        className={`
          relative w-full md:w-[calc(50%-28px)] rounded-xl
          border border-white/10 bg-white/5 backdrop-blur-md
          pl-10 pr-5 py-5 sm:pl-12 sm:pr-6 sm:py-6 md:p-6
          transition-all duration-300 ease-out
          hover:border-accent/40 hover:shadow-[0_0_28px_-4px_rgba(14,81,226,0.35)]
          hover:-translate-y-0.5
          ${isLeft ? 'md:mr-auto md:pr-8' : 'md:ml-auto md:pl-8'}
        `}
      >
        {/* Neon top edge glow */}
        <div
          className="absolute inset-x-0 top-0 h-px rounded-t-xl bg-gradient-to-r from-transparent via-accent/60 to-transparent opacity-80"
          aria-hidden
        />
        <h3 className="text-lg font-semibold text-white mb-3">{title}</h3>
        <p className="text-gray-400 text-sm sm:text-base leading-relaxed">{description}</p>
      </div>
    </li>
  );
}
