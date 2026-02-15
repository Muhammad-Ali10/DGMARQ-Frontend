import { useInView } from '../../hooks/useInView';

/**
 * Wraps a section with optional in-view animation and consistent spacing.
 */
export default function SectionWrapper({
  children,
  className = '',
  as: Component = 'section',
  animate = true,
  delay = 0,
}) {
  const { ref, isInView } = useInView({ threshold: 0.08, once: true });

  return (
    <Component
      ref={ref}
      className={`
        w-full py-16 md:py-24 px-4 sm:px-6 lg:px-8
        transition-all duration-700 ease-out
        ${animate ? (isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6') : ''}
        ${className}
      `}
      style={animate && delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Component>
  );
}
