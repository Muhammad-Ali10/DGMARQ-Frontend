import { useInView } from '../../hooks/useInView';

/**
 * Heading with thin animated underline (CSS only) and optional fade-up.
 */
export default function AnimatedHeading({
  as: Tag = 'h2',
  children,
  className = '',
  underline = true,
  animate = true,
}) {
  const { ref, isInView } = useInView({ threshold: 0.1, once: true });

  return (
    <Tag
      ref={ref}
      className={`
        text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white tracking-tight
        transition-all duration-600 ease-out
        w-full text-center block
        ${animate ? (isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4') : ''}
        ${underline ? 'pb-3 border-b-2 border-accent/50' : ''}
        ${className}
      `}
    >
      {children}
    </Tag>
  );
}
