// Anchor ids are derived from the clause number, never authored by hand, so a
// cross-reference like "Section 9.2" and the heading it points at cannot drift:
// both go through sectionAnchor("9.2") -> "section-9-2".
export const sectionAnchor = (num) => `section-${String(num).replaceAll('.', '-')}`;

/** "1" -> "01" — the two-digit numeral shown on section cards and in the TOC. */
export const padNum = (num) => String(num).padStart(2, '0');

/** Every anchor a document renders: its sections plus their subsections. */
export function collectAnchors(sections) {
  const anchors = new Set();
  for (const section of sections) {
    anchors.add(sectionAnchor(section.num));
    for (const block of section.content) {
      if (block?.type === 'subsection') anchors.add(sectionAnchor(block.num));
    }
  }
  return anchors;
}

const collectText = (node) => {
  if (typeof node === 'string') return node;
  if (Array.isArray(node)) return node.map(collectText).join(' ');
  if (node && typeof node === 'object') return Object.values(node).map(collectText).join(' ');
  return '';
};

/** Minutes at ~220 wpm, the usual figure for careful reading of dense prose. */
export function estimateReadingMinutes(doc) {
  const words = collectText([doc.summary, doc.sections]).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}
