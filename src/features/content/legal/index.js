// Public surface of the legal-documents feature. Import from '@features/content/legal'.
// Each document is its own module, so a page's lazy chunk carries only its own text.
export { default as LegalDocument } from './LegalDocument';
// For admin screens that edit a value one of the documents commits to.
export { default as PolicyFigureNotice } from './PolicyFigureNotice';
export { PUBLISHED_FIGURES, formatFigure, formatLiveValue } from './publishedFigures';
export { DRAFTED_FIGURES, resolveDocument, resolveText } from './figures';
export { feeSchedule } from './documents/feeSchedule';
export { privacyPolicy } from './documents/privacyPolicy';
export { refundPolicy } from './documents/refundPolicy';
export { termsConditions } from './documents/termsConditions';
export { vendorTerms } from './documents/vendorTerms';
