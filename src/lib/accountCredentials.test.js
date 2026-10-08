import { describe, it, expect } from 'vitest';
import {
  parseAccountLines,
  describeAccountCredentials,
  normalizeAccountCredentials,
  accountRowErrors,
} from './accountCredentials';

const LINE = 'gamerTag,gamerPass,acc@example.com,accPass,host@example.com';

describe("parseAccountLines — the seller's paste", () => {
  it('reads the six-column format', () => {
    const { accounts, errors } = parseAccountLines(`${LINE},EU region`);
    expect(errors).toEqual([]);
    expect(accounts).toHaveLength(1);
    expect(accounts[0]).toMatchObject({
      usernameId: 'gamerTag',
      usernamePassword: 'gamerPass',
      email: 'acc@example.com',
      emailPassword: 'accPass',
      hostEmail: 'host@example.com',
      notes: 'EU region',
    });
  });

  it('accepts a line with no note', () => {
    const { accounts, errors } = parseAccountLines(LINE);
    expect(errors).toEqual([]);
    expect(accounts[0].notes).toBe('');
  });

  it('keeps commas inside the note', () => {
    const { accounts } = parseAccountLines(`${LINE},EU region, do not change the password`);
    expect(accounts[0].notes).toBe('EU region, do not change the password');
  });

  it('accepts the same fields as JSON', () => {
    const json = '{"usernameId":"gamerTag","usernamePassword":"p1","email":"a@b.com","emailPassword":"p2","hostEmail":"h@b.com","notes":"n"}';
    const { accounts, errors } = parseAccountLines(json);
    expect(errors).toEqual([]);
    expect(accounts[0]).toMatchObject({ usernameId: 'gamerTag', hostEmail: 'h@b.com', notes: 'n' });
  });

  it('names the line and the missing field instead of dropping the row', () => {
    const { accounts, errors } = parseAccountLines(
      [LINE, 'gamerTag,gamerPass,acc@example.com', 'gamerTag,gamerPass,not-an-email,p,host@example.com'].join('\n')
    );
    expect(accounts).toHaveLength(1);
    expect(errors[0]).toMatch(/^Line 2:/);
    expect(errors[0]).toMatch(/email password is missing/);
    expect(errors[0]).toMatch(/host email is missing/);
    expect(errors[1]).toMatch(/^Line 3:/);
    expect(errors[1]).toMatch(/is not an email address/);
  });

  it('states the expected order when a CSV row fails', () => {
    const { errors } = parseAccountLines('acc@example.com,accPass,host@example.com,hostPass');
    expect(errors.at(-1)).toBe(
      'Expected order: username/ID, password, email, email password, host email, notes (notes optional).'
    );
  });

  it('does not add the order hint when every row is fine', () => {
    const { errors } = parseAccountLines(LINE);
    expect(errors).toEqual([]);
  });

  it('reports unreadable JSON by line', () => {
    const { errors } = parseAccountLines('{"email":"a@b.com"');
    expect(errors).toEqual(['Line 1: not valid JSON']);
  });

  it('ignores blank lines and surrounding whitespace', () => {
    const { accounts, errors } = parseAccountLines(`\n  ${LINE}  \n\n`);
    expect(errors).toEqual([]);
    expect(accounts).toHaveLength(1);
  });
});

describe('describeAccountCredentials — what every surface renders', () => {
  it('returns the fields in the seller-facing order', () => {
    const rows = describeAccountCredentials({
      usernameId: 'gamerTag', usernamePassword: 'p1',
      email: 'a@b.com', emailPassword: 'p2',
      hostEmail: 'h@b.com', notes: 'n',
    });
    expect(rows.map((row) => row.label)).toEqual([
      'Username / ID', 'Username password', 'Email', 'Email password', 'Host email', 'Notes',
    ]);
  });

  it('marks only the passwords as secret', () => {
    const rows = describeAccountCredentials({ usernameId: 'g', usernamePassword: 'p', email: 'a@b.com' });
    expect(rows.filter((row) => row.secret).map((row) => row.key)).toEqual(['usernamePassword']);
  });

  it('reads the stored JSON string and leaves plain keys alone', () => {
    expect(describeAccountCredentials('{"email":"a@b.com"}')).toHaveLength(1);
    expect(describeAccountCredentials('ABCD-EFGH')).toEqual([]);
    expect(describeAccountCredentials(null)).toEqual([]);
  });

  it('still labels older accounts', () => {
    expect(describeAccountCredentials({ email: 'a@b.com', password: 'pw' }).map((r) => r.label))
      .toEqual(['Email', 'Email password']);
    expect(describeAccountCredentials({ hostEmail: 'h@b.com', hostEmailPassword: 'hp' }).map((r) => r.label))
      .toEqual(['Host email', 'Host email password']);
  });
});

describe('accountRowErrors', () => {
  it('passes a complete row', () => {
    expect(accountRowErrors(normalizeAccountCredentials({
      usernameId: 'g', usernamePassword: 'p1', email: 'a@b.com', emailPassword: 'p2', hostEmail: 'h@b.com',
    }))).toEqual([]);
  });

  it('no longer asks for a host email password', () => {
    const problems = accountRowErrors(normalizeAccountCredentials({
      usernameId: 'g', usernamePassword: 'p1', email: 'a@b.com', emailPassword: 'p2', hostEmail: 'h@b.com',
    }));
    expect(problems.join(' ')).not.toMatch(/host email password/);
  });

  it('names every missing field', () => {
    expect(accountRowErrors(normalizeAccountCredentials({ email: 'a@b.com' })))
      .toEqual(expect.arrayContaining([
        'username / ID is missing',
        'username password is missing',
        'email password is missing',
        'host email is missing',
      ]));
  });
});
