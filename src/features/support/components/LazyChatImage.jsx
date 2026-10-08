import { useEffect, useRef, useState } from 'react';
import { ImageIcon } from 'lucide-react';

const LazyChatImage = ({ src, alt = 'Attachment', onOpen, className = '' }) => {
  const isLocal = typeof src === 'string' && src.startsWith('blob:');
  const ref = useRef(null);
  const [inView, setInView] = useState(() => isLocal || typeof IntersectionObserver === 'undefined');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (inView) return undefined;
    const el = ref.current;
    if (!el) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '150px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [inView]);

  return (
    <button
      type="button"
      ref={ref}
      onClick={() => onOpen?.(src)}
      className={`relative block overflow-hidden rounded bg-black/20 ${className}`}
      style={{ minWidth: '8rem', minHeight: '6rem' }}
      title="Click to view full size"
    >
      {!loaded && (
        <span className="absolute inset-0 flex items-center justify-center animate-pulse bg-surface-2/40">
          <ImageIcon className="h-6 w-6 text-fg-muted" />
        </span>
      )}
      {inView && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          className={`max-h-64 w-auto object-contain transition-all duration-300 ${
            loaded ? 'opacity-100 blur-0' : 'opacity-0 blur-md'
          }`}
        />
      )}
    </button>
  );
};

export default LazyChatImage;
