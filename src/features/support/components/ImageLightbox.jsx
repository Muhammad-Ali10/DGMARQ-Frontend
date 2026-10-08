import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

const ImageLightbox = ({ src, alt = 'Attachment', onClose }) => {
  useEffect(() => {
    if (!src) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [src, onClose]);

  if (!src) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={alt || 'Image preview'}
    >
      <div
        role="presentation"
        className="absolute inset-0 bg-black/90"
        onClick={onClose}
      />
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 z-10 text-fg/80 transition-colors hover:text-fg"
        aria-label="Close image"
      >
        <X className="h-7 w-7" />
      </button>
      <img
        src={src}
        alt={alt}
        className="relative max-h-[90vh] max-w-[90vw] rounded object-contain shadow-2xl"
      />
    </div>,
    document.body
  );
};

export default ImageLightbox;
