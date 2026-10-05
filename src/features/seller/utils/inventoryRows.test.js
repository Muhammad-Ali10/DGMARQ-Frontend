import { describe, it, expect } from 'vitest';
import {
  keyRowErrors,
  parseImportedRows,
  rowsFromMatrix,
  rowIdentity,
  sampleFileContent,
} from './inventoryRows';

// A spreadsheet arrives as rows of cells (SheetJS `header: 1`). It has to end up
// exactly where a CSV of the same data would, header row and all.

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
