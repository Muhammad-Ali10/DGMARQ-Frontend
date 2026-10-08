export const SELLER_TYPE_LABELS = { individual: 'Individual', business: 'Business' };

export const normalizeTaxId = (value) =>
  String(value ?? '').toUpperCase().replace(/[\s\-./]/g, '');

export const compileTaxIdCatalog = (catalog) => ({
  ...catalog,
  types: Object.fromEntries(
    Object.entries(catalog.types).map(([code, t]) => [code, { ...t, regex: new RegExp(t.pattern) }]),
  ),
});

export const taxIdOptions = (catalog, countryCode, sellerType) => {
  if (!catalog || !sellerType) return [];
  return (catalog.countries[countryCode] || catalog.fallback)[sellerType] || [];
};

export const taxIdLabel = (catalog, code) => catalog?.types[code]?.label || code;
