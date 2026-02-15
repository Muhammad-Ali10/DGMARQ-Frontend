import React from "react";
import { useInView } from "@/hooks/useInView";

const baseBg =
  "relative w-full overflow-hidden text-white border-t border-white/5";

export const SectionWrapper = ({
  id,
  className = "",
  children,
  withTopBorder = false,
}) => {
  const { ref, isInView } = useInView({ threshold: 0.18, once: true });

  return (
    <section
      id={id}
      ref={ref}
      className={`${baseBg} ${className}`}
    >
      {/* subtle animated grid background */}
      {/* <div className="pointer-events-none absolute inset-0 opacity-[0.18]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(14,159,226,0.25),_transparent_55%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,_rgba(148,163,184,0.35)_1px,_transparent_1px),_linear-gradient(to_bottom,_rgba(148,163,184,0.25)_1px,_transparent_1px)] bg-[size:80px_80px] mix-blend-screen" />
      </div> */}

      {/* HUD corner accents */}
      {/* <div className="pointer-events-none absolute left-6 top-6 h-8 w-8 border-l border-t border-primary/60" />
      <div className="pointer-events-none absolute right-6 top-6 h-8 w-8 border-r border-t border-primary/40" />
      <div className="pointer-events-none absolute bottom-6 left-6 h-8 w-8 border-b border-l border-primary/40" />
      <div className="pointer-events-none absolute bottom-6 right-6 h-8 w-8 border-b border-r border-primary/60" /> */}

      <div
        className={`relative mx-auto flex max-w-6xl flex-col gap-10 px-4 py-14 sm:px-6 md:px-8 lg:px-12 lg:py-20 ${
          isInView
            ? "translate-y-0 opacity-100 transition-all duration-700 ease-out"
            : "translate-y-6 opacity-0"
        }`}
      >
        {children}
      </div>
    </section>
  );
};

export default SectionWrapper;

