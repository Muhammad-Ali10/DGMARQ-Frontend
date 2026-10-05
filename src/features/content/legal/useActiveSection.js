import { useEffect, useState } from 'react';
import { sectionAnchor } from './anchors';

// The reading band: below the sticky header (~96px) down to 40% of the viewport.
// The active section is the first one intersecting it, in document order.
const READING_BAND = '-96px 0px -60% 0px';

/**
 * Scroll-spy for the table of contents. Lives in the TOC, not the page, so a
 * change of active section re-renders the short link list only — never the
 * document itself.
 *
 * @param sections a document's (module-level, so referentially stable) section list
 */
export function useActiveSection(sections) {
  const [activeId, setActiveId] = useState(() => sectionAnchor(sections[0].num));

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return undefined;

    const ids = sections.map((section) => sectionAnchor(section.num));
    const visible = new Set();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        }
        // Between two sections nothing may intersect; keep the last one lit.
        const current = ids.find((id) => visible.has(id));
        if (current) setActiveId(current);
      },
      { rootMargin: READING_BAND },
    );

    for (const id of ids) observer.observe(document.getElementById(id));
    return () => observer.disconnect();
  }, [sections]);

  return activeId;
}
