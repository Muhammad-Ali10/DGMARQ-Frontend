import { useEffect, useState } from 'react';
import { useInView } from '../../hooks/useInView';

/**
 * Count-up number triggered when in view (IntersectionObserver).
 */
const DURATION = 1600;
const STEPS = 40;

export default function MetricCounter({ value, suffix = '', label }) {
  const { ref, isInView } = useInView({ threshold: 0.2, once: true });
  const [display, setDisplay] = useState(0);
  const isDecimal = Number(value) !== Math.floor(Number(value));

  useEffect(() => {
    if (!isInView) return;
    const stepDuration = DURATION / STEPS;
    const increment = value / STEPS;
    let step = 0;
    const timer = setInterval(() => {
      step += 1;
      const current = Math.min(increment * step, value);
      setDisplay(isDecimal ? current.toFixed(1) : Math.floor(current));
      if (step >= STEPS) clearInterval(timer);
    }, stepDuration);
    return () => clearInterval(timer);
  }, [isInView, value, isDecimal]);

  return (
    <div ref={ref} className="text-center">
      <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tabular-nums">
        {display}
        {suffix}
      </div>
      <div className="mt-1 text-sm sm:text-base text-gray-400 font-medium">
        {label}
      </div>
    </div>
  );
}
