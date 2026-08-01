import { useInView } from "@/hooks/useInView";

const baseBg =
  "relative w-full overflow-hidden text-fg border-t border-white/5";

export const SectionWrapper = ({
  id,
  className = "",
  children,
}) => {
  const { ref, isInView } = useInView({ threshold: 0.18, once: true });

  return (
    <section
      id={id}
      ref={ref}
      className={`${baseBg} ${className}`}
    >
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

