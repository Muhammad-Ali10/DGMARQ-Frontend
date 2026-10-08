import { normalizePlatform } from './platform';

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

export const getRedemption = (platform) => REDEMPTION[normalizePlatform(platform)] || null;
