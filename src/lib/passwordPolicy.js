/**
 * The password rules, mirroring the server so the two cannot disagree.
 *
 * Source of truth is the backend's `passwordValidation()` in
 * middlewares/validation.middleware.js:
 *   .isLength({ min: 8 })
 *   .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])/)
 *
 * They used to disagree, and the client was the lenient one: Register.jsx checked
 * `password.length < 6` and a regex with no special-character group, so "Abc123"
 * passed every field check, hit the API, and came back a 400. The form was
 * telling users their password was fine when the server would refuse it.
 *
 * FOUR rules, not five, because upper and lower collapse into one "mixed case"
 * requirement — which is both how users read it and, conveniently, exactly the
 * four segments the v74 mockup's strength meter draws.
 */
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

/**
 * @returns {{score: number, label: string, isValid: boolean, met: Record<string, boolean>,
 *            firstUnmet: {id: string, label: string} | undefined}}
 *   `score` is how many of the four rules pass, so `isValid` is score === 4 —
 *   i.e. "Strong" means "the server will accept this", not a vague vibe.
 */
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
