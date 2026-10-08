import { describe, expect, it } from 'vitest';
import { describeAuthError, describeLinkResult } from './socialAuth';

const params = (query) => new URLSearchParams(query);

describe('describeLinkResult', () => {
  it('reports a successful link by provider name', () => {
    expect(describeLinkResult(params('linked=google'))).toEqual({ ok: true, message: 'Google account linked' });
  });

  it('explains a provider account that belongs to someone else', () => {
    const result = describeLinkResult(params('link_error=provider_taken&provider=discord'));
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/Discord account is already connected to another/);
  });

  it('falls back to a generic failure and ignores unrelated pages', () => {
    expect(describeLinkResult(params('link_error=link_failed&provider=steam')).message).toBe('We could not link Steam. Please try again.');
    expect(describeLinkResult(params('tab=security'))).toBeNull();
  });
});

describe('describeAuthError', () => {
  it('tells a suspended user why sign-in stopped', () => {
    expect(describeAuthError(params('error=account_suspended&provider=google'))).toMatch(/suspended/);
  });

  it('points an unverified provider email at password sign-in plus linking', () => {
    expect(describeAuthError(params('error=email_unverified&provider=facebook'))).toMatch(/Sign in with your password, then link Facebook/);
  });
});
