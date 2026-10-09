const FIELDS = [
  ['usernameId', 'Username / ID'],
  ['usernamePassword', 'Username password'],
  ['email', 'Email'],
  ['emailPassword', 'Email password'],
  ['hostEmail', 'Host email'],
  ['hostEmailPassword', 'Host email password'],
  ['notes', 'Notes'],
];

export const ACCOUNT_FIELD_LABELS = Object.fromEntries(FIELDS);

export const ACCOUNT_CSV_ORDER =
  'username/ID, password, email, email password, host email, notes';

const str = (value) => (typeof value === 'string' ? value.trim() : '');
const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str(value));

export const normalizeAccountCredentials = (raw) => {
  if (!raw || typeof raw !== 'object') return null;

  const email = str(raw.email) || str(raw.emailAddress);
  const usernameId = str(raw.usernameId) || str(raw.username);
  const legacyPassword = str(raw.password);

  const emailPassword = str(raw.emailPassword) || (email && !usernameId ? legacyPassword : '');
  const usernamePassword = str(raw.usernamePassword) || (usernameId ? legacyPassword : '');

  const credentials = {
    usernameId,
    usernamePassword,
    email,
    emailPassword,
    hostEmail: str(raw.hostEmail) || str(raw.emailHost),
    hostEmailPassword: str(raw.hostEmailPassword),
    notes: str(raw.notes) || str(raw.additionalInfo),
  };

  return Object.values(credentials).some(Boolean) ? credentials : null;
};

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
    .map(([key, label]) => ({ key, label, value: credentials[key], secret: key.toLowerCase().includes('password') }));
};

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
    notes: parts.slice(5).join(', '),
  };
};

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

  if (csvFailed) errors.push(`Expected order: ${ACCOUNT_CSV_ORDER} (notes optional).`);

  return { accounts, errors };
};
