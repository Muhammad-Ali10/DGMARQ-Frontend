const TYPES = {
  LICENSE_KEY: { one: 'license key', many: 'license keys', title: 'License key', short: 'Key' },
  ACCOUNT_BASED: { one: 'account', many: 'accounts', title: 'Account', short: 'Account' },
  GIFT: { one: 'gift code', many: 'gift codes', title: 'Gift code', short: 'Gift code' },
  ACTIVATION_LINK: { one: 'activation link', many: 'activation links', title: 'Activation link', short: 'Link' },
};

const FALLBACK = { one: 'item', many: 'items', title: 'Item', short: 'Digital' };

export const deliveryWords = (productType) => TYPES[productType] || FALLBACK;

export const deliveryCount = (productType, count) => {
  const words = deliveryWords(productType);
  return `${count} ${count === 1 ? words.one : words.many}`;
};

export const isHttpUrl = (value) => /^https?:\/\/\S+$/i.test(String(value ?? '').trim());

export const isActivationLink = (productType) => productType === 'ACTIVATION_LINK';
