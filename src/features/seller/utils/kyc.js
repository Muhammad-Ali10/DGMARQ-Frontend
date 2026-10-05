// Seller KYC helpers shared by onboarding, the seller's own views and admin.
//
// The tax-ID catalogue itself comes from GET /seller/tax-id-types — the backend
// (utils/taxIdTypes.js) is the single source of truth and re-validates every
// submission. These helpers only drive the form and give early feedback.

export const SELLER_TYPE_LABELS = { individual: 'Individual', business: 'Business' };

// Mirrors the backend's normalizeTaxId: spaces, dashes, dots and slashes are
// formatting, not part of the number.
export const normalizeTaxId = (value) =>
  String(value ?? '').toUpperCase().replace(/[\s\-./]/g, '');

// Compiles each served pattern once (react-query `select`).
export const compileTaxIdCatalog = (catalog) => ({
  ...catalog,
  types: Object.fromEntries(
    Object.entries(catalog.types).map(([code, t]) => [code, { ...t, regex: new RegExp(t.pattern) }]),
  ),
});

/** Tax-ID type codes a country offers for a seller type; the first is the default. */
export const taxIdOptions = (catalog, countryCode, sellerType) => {
  if (!catalog || !sellerType) return [];
  return (catalog.countries[countryCode] || catalog.fallback)[sellerType] || [];
};

/** Display label for a stored code; the raw code until the catalogue has loaded. */
export const taxIdLabel = (catalog, code) => catalog?.types[code]?.label || code;
