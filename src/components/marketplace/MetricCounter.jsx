import React, { useEffect, useState } from "react";
import { useInView } from "@/hooks/useInView";

export const MetricCounter = ({ value, suffix, label, icon: Icon }) => {
  const { ref, isInView } = useInView({ threshold: 0.4, once: true });
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!isInView) return;

    const duration = 1200;
    const start = performance.now();

    const animate = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(parseFloat((value * eased).toFixed(1)));
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayValue(value);
      }
    };

    const frame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(frame);
  }, [isInView, value]);

  return (
    <div
      ref={ref}
      className="relative flex flex-col items-start gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 sm:px-5 sm:py-5 lg:px-6 lg:py-6 backdrop-blur-md"
    >
      <div className="mb-2 flex items-center gap-2 text-accent/80">
        <span className="h-px flex-1 bg-gradient-to-r from-transparent via-accent/60 to-transparent" />
        {Icon && (
          <span className="rounded-full bg-accent/10 p-1.5 text-accent">
            <Icon className="h-4 w-4" />
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
        <span>{displayValue % 1 === 0 ? displayValue.toFixed(0) : displayValue}</span>
        {suffix && <span className="text-accent/90">{suffix}</span>}
      </div>
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-gray-400">
        {label}
      </p>
    </div>
  );
};

export default MetricCounter;

