/**
 * ACCOUNT_BASED inventory — one definition of what a seller uploads and what a
 * buyer receives.
 *
 * A game/service account is not just one login. The buyer needs the account's
 * username and password, the email login that goes with it, and the HOST EMAIL
 * the account is registered to — the address itself, so they know where its
 * verification and recovery mail lands. Notes are the seller's optional
 * instructions (region, "do not change the password", 2FA state…).
 *
 * The seller's line format is:
 *   username/ID, password, email, email password, host email, notes
 *
 * Everything except the notes is required. An earlier draft of this field set
 * asked for a password for the host mailbox too; that is no longer collected,
 * but rows that carry one are still displayed, and so are accounts uploaded
 * before any of these fields existed — their buyers must keep seeing correct
 * labels.
 *
 * Four surfaces render these credentials — the seller's reveal, the buyer's
 * order page, the order-complete screen and the delivery email — so the field
 * order and the labels live here rather than being retyped in each one. The
 * backend mirrors this file (DGMARQ-Backend/src/utils/accountCredentials.js)
 * for the email.
 */

/** Display order. Anything missing is skipped, so old rows simply show less. */
const FIELDS = [
  ['usernameId', 'Username / ID'],
  ['usernamePassword', 'Username password'],
  ['email', 'Email'],
  ['emailPassword', 'Email password'],
  ['hostEmail', 'Host email'],
  // No longer collected — kept so rows uploaded while it was still asked for
  // do not lose a value the buyer paid for.
  ['hostEmailPassword', 'Host email password'],
  ['notes', 'Notes'],
];

export const ACCOUNT_FIELD_LABELS = Object.fromEntries(FIELDS);

/** What the seller types, in order. Notes are last so they may contain commas. */
export const ACCOUNT_CSV_ORDER =
  'username/ID, password, email, email password, host email, notes';

const str = (value) => (typeof value === 'string' ? value.trim() : '');
const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str(value));

/**
 * Canonical credential object from any shape we have ever accepted: the current
 * keys and the oldest single `password`.
 */
export const normalizeAccountCredentials = (raw) => {
  if (!raw || typeof raw !== 'object') return null;

  const email = str(raw.email) || str(raw.emailAddress);
  const usernameId = str(raw.usernameId) || str(raw.username);
  const legacyPassword = str(raw.password);

  // A bare `password` belonged to whichever login was supplied.
  const emailPassword = str(raw.emailPassword) || (email && !usernameId ? legacyPassword : '');
  const usernamePassword = str(raw.usernamePassword) || (usernameId ? legacyPassword : '');

  const credentials = {
    usernameId,
    usernamePassword,
    email,
    emailPassword,
    // `emailHost` / `additionalInfo` were placeholder names on the
    // order-complete screen before this field set existed. Nothing ever wrote
    // them, but accepting them costs a line and cannot surprise anyone later.
    hostEmail: str(raw.hostEmail) || str(raw.emailHost),
    hostEmailPassword: str(raw.hostEmailPassword),
    notes: str(raw.notes) || str(raw.additionalInfo),
  };

  return Object.values(credentials).some(Boolean) ? credentials : null;
};

/**
 * Rows to render, in the fixed order above. Accepts the stored object or the
 * JSON string it is stored as; returns [] for a plain license key.
 */
export const describeAccountCredentials = (value) => {
  let raw = value;
  if (typeof raw === 'string') {
    const text = raw.trim();
    if (!text.startsWith('{')) return [];
    try {
      raw = JSON.parse(text);
    } catch {
      return [];
    }
  }
  const credentials = normalizeAccountCredentials(raw);
  if (!credentials) return [];
  return FIELDS
    .filter(([key]) => credentials[key])
    // `secret` drives the masked reveal boxes on the buyer's screens and the
    // bold styling in the email.
    .map(([key, label]) => ({ key, label, value: credentials[key], secret: key.toLowerCase().includes('password') }));
};

/** Human-readable problems with one parsed row; empty when it is good to go. */
export const accountRowErrors = (credentials) => {
  if (!credentials) return ['could not be read'];
  const problems = [];
  if (!credentials.usernameId) problems.push('username / ID is missing');
  if (!credentials.usernamePassword) problems.push('username password is missing');
  if (!credentials.email) problems.push('email is missing');
  else if (!isEmail(credentials.email)) problems.push(`"${credentials.email}" is not an email address`);
  if (!credentials.emailPassword) problems.push('email password is missing');
  if (!credentials.hostEmail) problems.push('host email is missing');
  else if (!isEmail(credentials.hostEmail)) problems.push(`host email "${credentials.hostEmail}" is not an email address`);
  return problems;
};

const parseCsvLine = (line) => {
  const parts = line.split(',').map((part) => part.trim());
  const [usernameId, usernamePassword, email, emailPassword, hostEmail] = parts;
  return {
    usernameId,
    usernamePassword,
    email,
    emailPassword,
    hostEmail,
    // Everything past the fifth comma is the note, so a note may contain commas.
    notes: parts.slice(5).join(', '),
  };
};

/**
 * Parse a pasted block: one account per line, CSV or JSON.
 * Returns every row it could read plus a per-line problem list, so the seller
 * sees what is wrong BEFORE anything is uploaded.
 */
export const parseAccountLines = (text, lineOffset = 0) => {
  const lines = String(text ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const accounts = [];
  const errors = [];
  let csvFailed = false;

  lines.forEach((line, index) => {
    const lineNumber = index + 1 + lineOffset;
    const isJson = line.startsWith('{');
    let raw;

    if (isJson) {
      try {
        raw = JSON.parse(line);
      } catch {
        errors.push(`Line ${lineNumber}: not valid JSON`);
        return;
      }
    } else {
      raw = parseCsvLine(line);
    }

    const credentials = normalizeAccountCredentials(raw);
    const problems = accountRowErrors(credentials);
    if (problems.length) {
      errors.push(`Line ${lineNumber}: ${problems.join(', ')}`);
      if (!isJson) csvFailed = true;
      return;
    }
    accounts.push(credentials);
  });

  // A column in the wrong place produces a pile of per-field complaints that
  // never say what the right shape is. State it once, at the end.
  if (csvFailed) errors.push(`Expected order: ${ACCOUNT_CSV_ORDER} (notes optional).`);

  return { accounts, errors };
};
