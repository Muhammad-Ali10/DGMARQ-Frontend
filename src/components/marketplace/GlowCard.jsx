import React from "react";

export const GlowCard = ({
  as: Component = "div",
  className = "",
  children,
  interactive = true,
}) => {
  const interactiveClasses = interactive
    ? "hover:-translate-y-1.5 hover:border-accent/70 hover:shadow-[0_0_40px_rgba(14,81,226,0.35)]"
    : "";

  return (
    <Component
      className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 sm:px-5 sm:py-5 lg:px-6 lg:py-6 backdrop-blur-md transition-transform transition-shadow duration-300 ease-out ${interactiveClasses} ${className}`}
    >
      {/* glow ring */}
      <div className="pointer-events-none absolute -inset-px rounded-2xl bg-[radial-gradient(circle_at_top,_rgba(14,81,226,0.28),_transparent_55%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      {/* inner gradient overlay */}
      <div className="pointer-events-none absolute inset-px rounded-2xl bg-gradient-to-br from-white/3 via-transparent to-accent/10 opacity-60 mix-blend-screen" />

      <div className="relative z-10">{children}</div>
    </Component>
  );
};

export default GlowCard;

