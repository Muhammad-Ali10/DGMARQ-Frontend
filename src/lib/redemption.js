/**
 * Where and how to redeem a key, per platform.
 *
 * This is static product knowledge, not data — no endpoint returns redemption
 * instructions, and none needs to. It is keyed by `LicenseKey.keyType`, which is
 * the only platform identity this system stores and is already returned by
 * `getMyLicenseKeys` and by `getOrderById` (which populates
 * `items.assignedKeyIds` with `keyType`).
 *
 * Deep links go to each store's official redemption page. They are intentionally
 * the *redeem* page rather than a storefront home, so the buyer lands one step
 * from done.
 */

const REDEMPTION = {
  steam: {
    label: 'Steam',
    url: 'https://store.steampowered.com/account/registerkey',
    steps: [
      'Open the Steam client, or sign in on the Steam website.',
      'Choose Games → Activate a Product on Steam.',
      'Paste your key and confirm. The game appears in your Library.',
    ],
  },
  epic: {
    label: 'Epic Games',
    url: 'https://www.epicgames.com/store/redeem',
    steps: [
      'Sign in to your Epic Games account.',
      'Go to Account → Redeem Code.',
      'Paste your key and confirm to add the game to your Library.',
    ],
  },
  xbox: {
    label: 'Xbox / Microsoft',
    url: 'https://redeem.microsoft.com',
    steps: [
      'Sign in with the Microsoft account you play on.',
      'Enter the 25-character code at redeem.microsoft.com.',
      'Confirm — the content attaches to that account permanently.',
    ],
  },
  playstation: {
    label: 'PlayStation Store',
    url: 'https://store.playstation.com/redeem',
    steps: [
      'Sign in to your PlayStation Network account.',
      'Open the PlayStation Store and choose Redeem Codes.',
      'Enter the 12-character code and confirm.',
    ],
  },
  nintendo: {
    label: 'Nintendo eShop',
    url: 'https://ec.nintendo.com/redeem',
    steps: [
      'Sign in to your Nintendo Account.',
      'Enter the 16-character download code.',
      'Confirm — the download starts on your linked console.',
    ],
  },
  origin: {
    label: 'EA app / Origin',
    url: 'https://www.ea.com/redeem',
    steps: [
      'Sign in to your EA account.',
      'Open the EA app and choose Redeem Code (or use ea.com/redeem).',
      'Paste your key and confirm.',
    ],
  },
  gog: {
    label: 'GOG',
    url: 'https://www.gog.com/redeem',
    steps: [
      'Sign in to your GOG account.',
      'Go to gog.com/redeem.',
      'Paste your code to add the game to your Library.',
    ],
  },
};

/**
 * @param {string} keyType - a LicenseKey.keyType value
 * @returns {{label: string, url: string, steps: string[]} | null} null for
 *          'account' / 'other', where there is no single redemption flow to
 *          send someone to. Callers must handle null rather than guessing.
 */
export const getRedemption = (keyType) =>
  REDEMPTION[String(keyType || '').trim().toLowerCase()] || null;
