import { useEffect, useState } from 'react';
import { sectionAnchor } from './anchors';

const READING_BAND = '-96px 0px -60% 0px';

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
