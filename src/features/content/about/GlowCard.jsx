/**
 * Glass-style card with subtle border and hover glow (brand primary).
 */
export default function GlowCard({
  children,
  className = '',
  as: Component = 'div',
}) {
  return (
    <Component
      className={`
        relative rounded-lg border border-white/10 bg-white/[0.03] backdrop-blur-sm
        p-6 md:p-8
        transition-all duration-300 ease-out
        hover:border-accent/30 hover:shadow-[0_0_24px_-4px_rgba(14,81,226,0.25)]
        hover:-translate-y-0.5
        ${className}
      `}
    >
      {children}
    </Component>
  );
}
