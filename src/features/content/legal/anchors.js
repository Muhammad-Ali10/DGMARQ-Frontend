export const sectionAnchor = (num) => `section-${String(num).replaceAll('.', '-')}`;

export const padNum = (num) => String(num).padStart(2, '0');

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

export function estimateReadingMinutes(doc) {
  const words = collectText([doc.summary, doc.sections]).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}
