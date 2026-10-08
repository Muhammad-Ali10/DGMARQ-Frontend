const ALIASES = {
  'epic games': 'epic',
  epicgames: 'epic',
  'nintendo switch': 'nintendo',
  switch: 'nintendo',
  ea: 'origin',
  'ea app': 'origin',
  'ea play': 'origin',
  'playstation network': 'playstation',
  psn: 'playstation',
  'xbox live': 'xbox',
  microsoft: 'xbox',
  'gog.com': 'gog',
  'gog galaxy': 'gog',
};

export const normalizePlatform = (value) => {
  const key = String(value || '').trim().toLowerCase();
  return ALIASES[key] || key;
};
