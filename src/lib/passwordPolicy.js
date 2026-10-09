export const PASSWORD_RULES = [
  { id: 'length', label: 'At least 8 characters', test: (v) => v.length >= 8 },
  {
    id: 'case',
    label: 'An uppercase and a lowercase letter',
    test: (v) => /[a-z]/.test(v) && /[A-Z]/.test(v),
  },
  { id: 'number', label: 'A number', test: (v) => /\d/.test(v) },
  { id: 'special', label: 'A special character', test: (v) => /[^A-Za-z0-9]/.test(v) },
];

const STRENGTH_LABELS = ['Weak', 'Fair', 'Good', 'Strong'];

export const scorePassword = (value = '') => {
  const met = {};
  let score = 0;
  for (const rule of PASSWORD_RULES) {
    const pass = value ? rule.test(value) : false;
    met[rule.id] = pass;
    if (pass) score += 1;
  }
  return {
    score,
    label: score > 0 ? STRENGTH_LABELS[score - 1] : '',
    isValid: score === PASSWORD_RULES.length,
    met,
    firstUnmet: PASSWORD_RULES.find((r) => !met[r.id]),
  };
};
