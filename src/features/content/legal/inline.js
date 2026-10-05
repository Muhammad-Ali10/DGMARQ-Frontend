import { sectionAnchor } from './anchors';

// The only inline markup legal copy needs, so documents stay plain strings:
//   **bold**             -> <strong>   (lead-in labels such as "Account information")
//   [label](https://…)   -> external link
//   name@domain.tld      -> mailto link
//   Section 9 / 9.2      -> in-page link, when that section exists
// Bare domains are deliberately NOT auto-linked: "dgmarq.com" is the brand name
// in running text and appears in almost every sentence.
const INLINE =
  /\*\*(.+?)\*\*|\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)|([\w.%+-]+@[\w-]+(?:\.[\w-]+)*\.[a-z]{2,})|\b(Section (\d+(?:\.\d+)*))/gi;

export function parseInline(text) {
  const tokens = [];
  let last = 0;
  for (const m of text.matchAll(INLINE)) {
    if (m.index > last) tokens.push({ type: 'text', value: text.slice(last, m.index) });
    if (m[1] !== undefined) tokens.push({ type: 'strong', value: m[1] });
    else if (m[2] !== undefined) tokens.push({ type: 'link', value: m[2], href: m[3] });
    else if (m[4] !== undefined) tokens.push({ type: 'email', value: m[4] });
    else tokens.push({ type: 'section', value: m[5], anchor: sectionAnchor(m[6]) });
    last = m.index + m[0].length;
  }
  if (last < text.length) tokens.push({ type: 'text', value: text.slice(last) });
  return tokens;
}
