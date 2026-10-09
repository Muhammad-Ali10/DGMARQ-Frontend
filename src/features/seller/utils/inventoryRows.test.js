import { describe, it, expect } from 'vitest';
import {
  keyRowErrors,
  parseImportedRows,
  parseJsonRows,
  rowsFromMatrix,
  rowIdentity,
  sampleFileContent,
} from './inventoryRows';

describe('rowsFromMatrix — an uploaded spreadsheet', () => {
  it('maps account columns in upload order', () => {
    const { rows, errors } = rowsFromMatrix(
      [['gamerTag', 'gamerPass', 'acc@example.com', 'accPass', 'host@example.com', 'EU region']],
      'ACCOUNT_BASED'
    );
    expect(errors).toEqual([]);
    expect(rows[0]).toMatchObject({
      usernameId: 'gamerTag',
      usernamePassword: 'gamerPass',
      email: 'acc@example.com',
      emailPassword: 'accPass',
      hostEmail: 'host@example.com',
      notes: 'EU region',
    });
  });

  it('skips a header row and empty rows', () => {
    const { rows, errors } = rowsFromMatrix(
      [
        ['username/ID', 'password', 'email', 'email password', 'host email', 'notes'],
        ['', '', '', '', '', ''],
        ['gamerTag', 'gamerPass', 'acc@example.com', 'accPass', 'host@example.com', ''],
      ],
      'ACCOUNT_BASED'
    );
    expect(errors).toEqual([]);
    expect(rows).toHaveLength(1);
  });

  it('reports a bad row by its row number', () => {
    const { rows, errors } = rowsFromMatrix(
      [
        ['username/ID', 'password', 'email', 'email password', 'host email'],
        ['gamerTag', 'gamerPass', 'acc@example.com', 'accPass', 'host@example.com'],
        ['brokenRow', 'onlyPassword'],
      ],
      'ACCOUNT_BASED'
    );
    expect(rows).toHaveLength(1);
    expect(errors[0]).toMatch(/^Row 3:/);
  });

  it('takes the first non-empty cell for key-shaped inventory', () => {
    const { rows, errors } = rowsFromMatrix([['GIFT-1234-5678'], ['', 'GIFT-8765-4321']], 'GIFT');
    expect(errors).toEqual([]);
    expect(rows).toEqual(['GIFT-1234-5678', 'GIFT-8765-4321']);
  });

  it('holds activation links to being links', () => {
    const { rows, errors } = rowsFromMatrix(
      [['https://example.com/a'], ['ask the seller']],
      'ACTIVATION_LINK'
    );
    expect(rows).toEqual(['https://example.com/a']);
    expect(errors[0]).toMatch(/Row 2:.*http/);
  });

  it('survives junk instead of a sheet', () => {
    expect(rowsFromMatrix(null, 'GIFT')).toEqual({ rows: [], errors: [] });
    expect(rowsFromMatrix([[]], 'GIFT')).toEqual({ rows: [], errors: [] });
  });
});

describe('parseImportedRows — file text', () => {
  it('skips a header line but keeps the file’s line numbers', () => {
    const { rows, errors } = parseImportedRows(
      ['license key', 'KEY1-ABCD-EFGH', 'ab'].join('\n'),
      'LICENSE_KEY'
    );
    expect(rows).toEqual(['KEY1-ABCD-EFGH']);
    expect(errors[0]).toMatch(/^Line 3:/);
  });

  it('leaves a real first row alone', () => {
    const { rows } = parseImportedRows(['KEY1-ABCD-EFGH', 'KEY2-MNOP-QRST'].join('\n'), 'LICENSE_KEY');
    expect(rows).toHaveLength(2);
  });
});

describe('the sample file', () => {
  it('starts with a header the readers then skip', () => {
    const accountSample = sampleFileContent('ACCOUNT_BASED');
    const { rows, errors } = parseImportedRows(accountSample, 'ACCOUNT_BASED');
    expect(errors).toEqual([]);
    expect(rows).toHaveLength(2);
    expect(accountSample.split('\n')[0]).toContain('username/ID');
  });

  it('gives each key-shaped type its own example', () => {
    expect(sampleFileContent('GIFT').split('\n')[0]).toBe('Gift code');
    expect(sampleFileContent('ACTIVATION_LINK')).toContain('https://');
    const { rows, errors } = parseImportedRows(sampleFileContent('ACTIVATION_LINK'), 'ACTIVATION_LINK');
    expect(errors).toEqual([]);
    expect(rows).toHaveLength(2);
  });
});

describe('row identity and validation', () => {
  it('treats the same login pair as the same account', () => {
    const a = { usernameId: 'GamerTag', email: 'Acc@Example.com' };
    const b = { usernameId: 'gamertag', email: 'acc@example.com' };
    expect(rowIdentity(a, 'ACCOUNT_BASED')).toBe(rowIdentity(b, 'ACCOUNT_BASED'));
  });

  it('names the type in a key error', () => {
    expect(keyRowErrors('ab', 'GIFT')[0]).toMatch(/Gift code is too short/);
    expect(keyRowErrors('', 'ACTIVATION_LINK')[0]).toMatch(/activation link is empty/);
  });
});

describe('parseJsonRows — an uploaded .json file', () => {
  it('reads a pretty-printed array of keys without quotes or commas', () => {
    const prettyFile = ['[', '  "ABCD-EFGH-IJKL",', '  "MNOP-QRST-UVWX"', ']'].join('\n');
    const { rows, errors } = parseJsonRows(prettyFile, 'LICENSE_KEY');
    expect(errors).toEqual([]);
    expect(rows).toEqual(['ABCD-EFGH-IJKL', 'MNOP-QRST-UVWX']);
  });

  it('names the items that are not keys', () => {
    const { rows, errors } = parseJsonRows('["ABCD-EFGH-IJKL", 42, "abc"]', 'LICENSE_KEY');
    expect(rows).toEqual(['ABCD-EFGH-IJKL']);
    expect(errors[0]).toMatch(/^Item 2: expected a/);
    expect(errors[1]).toMatch(/^Item 3: .*too short/);
  });

  it('refuses a key file that is not JSON instead of uploading its lines', () => {
    const { rows, errors } = parseJsonRows(['"ABCD-EFGH-IJKL",', '"MNOP-QRST-UVWX"'].join('\n'), 'LICENSE_KEY');
    expect(rows).toEqual([]);
    expect(errors[0]).toMatch(/not valid JSON/);
  });

  it('reads an array of account objects', () => {
    const account = {
      usernameId: 'gamerTag', usernamePassword: 'p1', email: 'a@example.com',
      emailPassword: 'p2', hostEmail: 'h@example.com',
    };
    const { rows, errors } = parseJsonRows(JSON.stringify([account, account], null, 2), 'ACCOUNT_BASED');
    expect(errors).toEqual([]);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject(account);
  });

  it('still accepts one account object per line', () => {
    const line = JSON.stringify({
      usernameId: 'u', usernamePassword: 'p', email: 'a@example.com', emailPassword: 'q', hostEmail: 'h@example.com',
    });
    const { rows, errors } = parseJsonRows([line, line.replace('"u"', '"v"')].join('\n'), 'ACCOUNT_BASED');
    expect(errors).toEqual([]);
    expect(rows.map((r) => r.usernameId)).toEqual(['u', 'v']);
  });
});
