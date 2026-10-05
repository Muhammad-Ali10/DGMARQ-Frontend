/**
 * What a product is delivered as (`Product.productType`), in words.
 *
 * Every surface that names a unit of inventory reads from here — the seller's
 * upload dialog and inventory list, the buyer's order page and order-complete
 * screen. Before this, "license key" was hardcoded everywhere, so a seller
 * uploading gift codes was told to enter a "License key" and the buyer's email
 * announced one. The backend keeps a mirror at
 * DGMARQ-Backend/src/utils/deliveryType.js for the delivery email.
 *
 * `one`/`many` are sentence-case fragments ("2 gift codes"); `title` starts a
 * label ("Gift code").
 */

const TYPES = {
  LICENSE_KEY: { one: 'license key', many: 'license keys', title: 'License key', short: 'Key' },
  ACCOUNT_BASED: { one: 'account', many: 'accounts', title: 'Account', short: 'Account' },
  GIFT: { one: 'gift code', many: 'gift codes', title: 'Gift code', short: 'Gift code' },
  ACTIVATION_LINK: { one: 'activation link', many: 'activation links', title: 'Activation link', short: 'Link' },
};

const FALLBACK = { one: 'item', many: 'items', title: 'Item', short: 'Digital' };

export const deliveryWords = (productType) => TYPES[productType] || FALLBACK;

/** "1 gift code" / "3 gift codes" — the count decides the form. */
export const deliveryCount = (productType, count) => {
  const words = deliveryWords(productType);
  return `${count} ${count === 1 ? words.one : words.many}`;
};

/**
 * An activation link is the one delivery type the buyer follows rather than
 * copies, so it is rendered as a link — but only when it really is one. A
 * seller-supplied string is untrusted: anything that is not http(s) stays plain
 * text rather than becoming a javascript: or data: URL.
 */
export const isHttpUrl = (value) => /^https?:\/\/\S+$/i.test(String(value ?? '').trim());

export const isActivationLink = (productType) => productType === 'ACTIVATION_LINK';
