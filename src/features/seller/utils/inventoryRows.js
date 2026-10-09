import {
  ACCOUNT_FIELD_LABELS,
  accountRowErrors,
  normalizeAccountCredentials,
  parseAccountLines,
} from '@lib/accountCredentials';
import { deliveryWords, isHttpUrl } from '@lib/deliveryType';

export const KEY_MIN_LENGTH = 5;
export const KEY_MAX_LENGTH = 500;

export const keyRowErrors = (value, productType) => {
  const words = deliveryWords(productType);
  const key = String(value ?? '').trim();
  if (!key) return [`the ${words.one} is empty`];
  if (key.length < KEY_MIN_LENGTH) return [`${words.title} is too short (minimum ${KEY_MIN_LENGTH} characters)`];
  if (key.length > KEY_MAX_LENGTH) return [`${words.title} is too long (maximum ${KEY_MAX_LENGTH} characters)`];
  if (productType === 'ACTIVATION_LINK' && !isHttpUrl(key)) {
    return ['the link must start with http:// or https://'];
  }
  return [];
};

export const parseKeyLines = (text, productType, lineOffset = 0) => {
  const keys = [];
  const errors = [];

  String(text ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line, index) => {
      const problems = keyRowErrors(line, productType);
      if (problems.length) {
        errors.push(`Line ${index + 1 + lineOffset}: ${problems.join(', ')}`);
        return;
      }
      keys.push(line);
    });

  return { rows: keys, errors };
};

const HEADER_CELLS = new Set([
  'username', 'username / id', 'username/id', 'user', 'id', 'password',
  'email', 'email password', 'host email', 'notes', 'note',
  'license key', 'key', 'gift code', 'activation link', 'link', 'code', 'item',
]);

const looksLikeHeaderRow = (cells) => {
  const first = String(cells?.[0] ?? '').trim().toLowerCase();
  return first.length > 0 && HEADER_CELLS.has(first);
};

export const parseImportedRows = (text, productType) => {
  const lines = String(text ?? '').split('\n');
  const firstFilled = lines.findIndex((line) => line.trim());
  let body = text;
  let offset = 0;

  if (firstFilled !== -1 && looksLikeHeaderRow(lines[firstFilled].split(','))) {
    const remaining = lines.slice();
    remaining.splice(firstFilled, 1);
    body = remaining.join('\n');
    offset = 1;
  }

  if (productType === 'ACCOUNT_BASED') {
    const { accounts, errors } = parseAccountLines(body, offset);
    return { rows: accounts, errors };
  }
  return parseKeyLines(body, productType, offset);
};

export const parseJsonRows = (text, productType) => {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    if (productType === 'ACCOUNT_BASED') return parseImportedRows(text, productType);
    return {
      rows: [],
      errors: ['The file is not valid JSON. Use a list of values, like ["KEY-1", "KEY-2"].'],
    };
  }

  const words = deliveryWords(productType);
  const rows = [];
  const errors = [];
  (Array.isArray(data) ? data : [data]).forEach((item, index) => {
    const label = `Item ${index + 1}`;
    if (productType === 'ACCOUNT_BASED') {
      const credentials = normalizeAccountCredentials(item);
      const problems = accountRowErrors(credentials);
      if (problems.length) errors.push(`${label}: ${problems.join(', ')}`);
      else rows.push(credentials);
      return;
    }
    if (typeof item !== 'string') {
      errors.push(`${label}: expected a ${words.one} as text`);
      return;
    }
    const value = item.trim();
    const problems = keyRowErrors(value, productType);
    if (problems.length) errors.push(`${label}: ${problems.join(', ')}`);
    else rows.push(value);
  });
  return { rows, errors };
};

export const rowsFromMatrix = (matrix, productType) => {
  const rows = [];
  const errors = [];

  const filled = (Array.isArray(matrix) ? matrix : []).filter(
    (cells) => Array.isArray(cells) && cells.some((cell) => String(cell ?? '').trim())
  );
  const start = filled.length && looksLikeHeaderRow(filled[0]) ? 1 : 0;

  filled.slice(start).forEach((cells, index) => {
    const rowNumber = index + start + 1;
    const values = cells.map((cell) => String(cell ?? '').trim());

    if (productType === 'ACCOUNT_BASED') {
      const [usernameId, usernamePassword, email, emailPassword, hostEmail, ...rest] = values;
      const credentials = normalizeAccountCredentials({
        usernameId,
        usernamePassword,
        email,
        emailPassword,
        hostEmail,
        notes: rest.filter(Boolean).join(', '),
      });
      const problems = accountRowErrors(credentials);
      if (problems.length) {
        errors.push(`Row ${rowNumber}: ${problems.join(', ')}`);
        return;
      }
      rows.push(credentials);
      return;
    }

    const value = values.find(Boolean) || '';
    const problems = keyRowErrors(value, productType);
    if (problems.length) {
      errors.push(`Row ${rowNumber}: ${problems.join(', ')}`);
      return;
    }
    rows.push(value);
  });

  return { rows, errors };
};

export const rowIdentity = (data, productType) =>
  productType === 'ACCOUNT_BASED'
    ? `${String(data?.usernameId ?? '').trim().toLowerCase()}|${String(data?.email ?? '').trim().toLowerCase()}`
    : String(data ?? '').trim();

export const describeRow = (data, productType) => {
  if (productType !== 'ACCOUNT_BASED') {
    return { title: String(data ?? ''), subtitle: '' };
  }
  const credentials = normalizeAccountCredentials(data) || {};
  const parts = [];
  if (credentials.email) parts.push(credentials.email);
  if (credentials.hostEmail) parts.push(`host: ${credentials.hostEmail}`);
  if (credentials.notes) parts.push('has notes');
  return {
    title: credentials.usernameId || credentials.email || 'Account',
    subtitle: parts.join(' · '),
  };
};

export const ACCOUNT_INPUT_FIELDS = [
  { key: 'usernameId', required: true, placeholder: 'gamerTag' },
  { key: 'usernamePassword', required: true, placeholder: 'password for the username' },
  { key: 'email', required: true, placeholder: 'account@example.com' },
  { key: 'emailPassword', required: true, placeholder: 'password for that email' },
  { key: 'hostEmail', required: true, placeholder: 'host@example.com' },
  { key: 'notes', required: false, multiline: true, placeholder: 'EU region · do not change the password (optional)' },
].map((field) => ({ ...field, label: ACCOUNT_FIELD_LABELS[field.key] }));

export const EMPTY_ACCOUNT = Object.fromEntries(ACCOUNT_INPUT_FIELDS.map(({ key }) => [key, '']));

export const sampleFileContent = (productType) => {
  if (productType === 'ACCOUNT_BASED') {
    return [
      'username/ID,password,email,email password,host email,notes',
      'gamerTag,gamerPass123,acc@example.com,accPass123,host@example.com,EU region',
      'proGamer,proPass456,pro@example.com,proPass789,host2@example.com,',
    ].join('\n');
  }
  const examples =
    productType === 'ACTIVATION_LINK'
      ? ['https://example.com/activate/abc123', 'https://example.com/activate/def456']
      : productType === 'GIFT'
        ? ['GIFT-1234-5678', 'GIFT-8765-4321']
        : ['KEY1-ABCD-EFGH-IJKL', 'KEY2-MNOP-QRST-UVWX'];
  return [deliveryWords(productType).title, ...examples].join('\n');
};
