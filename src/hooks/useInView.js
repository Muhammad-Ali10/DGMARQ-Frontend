import { useEffect, useRef, useState } from "react";

/**
 * Simple IntersectionObserver hook.
 * - Returns a ref to attach to the observed element.
 * - `isInView` becomes true once the element enters the viewport (with optional threshold).
 * - `once` controls whether it should stop observing after first intersection.
 */
export function useInView(options = {}) {
  const { root = null, rootMargin = "0px", threshold = 0.2, once = true } =
    options;

  const ref = useRef(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") return;

    let hasIntersected = false;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          setIsInView(true);
          hasIntersected = true;
          if (once) {
            observer.unobserve(entry.target);
          }
        } else if (!once && hasIntersected) {
          setIsInView(false);
        }
      },
      { root, rootMargin, threshold }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [root, rootMargin, threshold, once]);

  return { ref, isInView };
}

