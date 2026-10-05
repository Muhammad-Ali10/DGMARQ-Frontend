import {
  ACCOUNT_FIELD_LABELS,
  accountRowErrors,
  normalizeAccountCredentials,
  parseAccountLines,
} from '@lib/accountCredentials';
import { deliveryWords, isHttpUrl } from '@lib/deliveryType';

/**
 * One staged row of inventory, whichever kind the product takes.
 *
 * The upload dialog collects rows two ways — typed one at a time, or read from
 * an uploaded file (CSV/TXT/JSON text, or an Excel sheet) — and both land in
 * the same list before anything is sent. These helpers are what keep the paths
 * identical: same validation, same duplicate rule, same summary line.
 *
 * A LICENSE_KEY / GIFT / ACTIVATION_LINK row is a plain string; an
 * ACCOUNT_BASED row is the credential object @lib/accountCredentials defines.
 */

export const KEY_MIN_LENGTH = 5;
export const KEY_MAX_LENGTH = 500;

export const keyRowErrors = (value, productType) => {
  const words = deliveryWords(productType);
  const key = String(value ?? '').trim();
  if (!key) return [`the ${words.one} is empty`];
  if (key.length < KEY_MIN_LENGTH) return [`${words.title} is too short (minimum ${KEY_MIN_LENGTH} characters)`];
  if (key.length > KEY_MAX_LENGTH) return [`${words.title} is too long (maximum ${KEY_MAX_LENGTH} characters)`];
  // The buyer FOLLOWS an activation link, so anything that is not a link is not
  // a delivery — and only http(s) is rendered as one downstream.
  if (productType === 'ACTIVATION_LINK' && !isHttpUrl(key)) {
    return ['the link must start with http:// or https://'];
  }
  return [];
};

/** One value per line. Same shape as parseAccountLines, so callers can share code. */
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

// The sample file the dialog hands out carries a header row, and sellers keep
// their own headers too. Recognised by the first cell alone — a real row's
// first cell is a username, a key or a link, never one of these words.
const HEADER_CELLS = new Set([
  'username', 'username / id', 'username/id', 'user', 'id', 'password',
  'email', 'email password', 'host email', 'notes', 'note',
  'license key', 'key', 'gift code', 'activation link', 'link', 'code', 'item',
]);

const looksLikeHeaderRow = (cells) => {
  const first = String(cells?.[0] ?? '').trim().toLowerCase();
  return first.length > 0 && HEADER_CELLS.has(first);
};

/** Parse file text for either product type, skipping a header line if present. */
export const parseImportedRows = (text, productType) => {
  const lines = String(text ?? '').split('\n');
  const firstFilled = lines.findIndex((line) => line.trim());
  let body = text;
  let offset = 0;

  if (firstFilled !== -1 && looksLikeHeaderRow(lines[firstFilled].split(','))) {
    const remaining = lines.slice();
    remaining.splice(firstFilled, 1);
    body = remaining.join('\n');
    offset = 1; // keep the seller's own line numbers in any error message
  }

  if (productType === 'ACCOUNT_BASED') {
    const { accounts, errors } = parseAccountLines(body, offset);
    return { rows: accounts, errors };
  }
  return parseKeyLines(body, productType, offset);
};

/**
 * A spreadsheet's cells (row-major, as SheetJS hands them over) → staged rows,
 * in the same shape the text path returns. Columns follow the upload order; for
 * key-shaped inventory the first non-empty cell is the value, so a one-column
 * sheet and a sheet with a stray leading column both work.
 */
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

/**
 * What makes a row the same row. An account is identified by its login pair —
 * the same username and email twice in one batch is a mistake, not two units of
 * stock. (The server also refuses exact duplicates, by hash, at insert time.)
 */
export const rowIdentity = (data, productType) =>
  productType === 'ACCOUNT_BASED'
    ? `${String(data?.usernameId ?? '').trim().toLowerCase()}|${String(data?.email ?? '').trim().toLowerCase()}`
    : String(data ?? '').trim();

/** The two lines shown for a staged row in the list. */
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

/** The fields the seller actually types, in order. */
export const ACCOUNT_INPUT_FIELDS = [
  { key: 'usernameId', required: true, placeholder: 'gamerTag' },
  { key: 'usernamePassword', required: true, placeholder: 'password for the username' },
  { key: 'email', required: true, placeholder: 'account@example.com' },
  { key: 'emailPassword', required: true, placeholder: 'password for that email' },
  // Address only — no password is collected for the host mailbox.
  { key: 'hostEmail', required: true, placeholder: 'host@example.com' },
  { key: 'notes', required: false, multiline: true, placeholder: 'EU region · do not change the password (optional)' },
].map((field) => ({ ...field, label: ACCOUNT_FIELD_LABELS[field.key] }));

export const EMPTY_ACCOUNT = Object.fromEntries(ACCOUNT_INPUT_FIELDS.map(({ key }) => [key, '']));

/**
 * The sample CSV the dialog hands out, so a seller starts from the right
 * columns instead of guessing them. The header row is included — every reader
 * above skips it.
 */
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
