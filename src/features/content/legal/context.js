import { createContext } from 'react';

// The anchors the current document renders. A "Section N" reference becomes a
// link only when its target is in this set, so a reference to a clause that is
// not on the page stays plain text instead of a dead link.
export const LegalAnchorsContext = createContext(new Set());
