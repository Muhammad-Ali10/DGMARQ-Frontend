import { describe, it, expect } from 'vitest';
import { describeError } from './ErrorState';

const withStatus = (status, message) => ({ response: { status, data: message ? { message } : {} } });

describe('describeError', () => {
  it('never surfaces a raw status code as the message', () => {
    for (const status of [400, 401, 403, 404, 429, 500, 503]) {
      const { title, description } = describeError(withStatus(status));
      expect(title).not.toMatch(/^\d+$/);
      expect(title.length).toBeGreaterThan(3);
      expect(description.length).toBeGreaterThan(10);
    }
  });

  it('treats a missing response as offline, not as a server fault', () => {
    const d = describeError(new Error('Network Error'));
    expect(d.title).toMatch(/reach/i);
    expect(d.description).toMatch(/offline|connection/i);
    expect(d.canRetry).toBe(true);
  });

  it('maps a 401 to an expired session', () => {
    expect(describeError(withStatus(401)).title).toMatch(/session/i);
  });

  it('maps a 403 to a permission denial and shows the server reason', () => {
    const denied = describeError(withStatus(403, 'Your seller account is on hold'));
    expect(denied.title).toMatch(/access/i);
    expect(denied.title).not.toMatch(/session/i);
    expect(denied.description).toBe('Your seller account is on hold');
    expect(denied.canRetry).toBe(false);
    expect(describeError(withStatus(403)).description.length).toBeGreaterThan(10);
  });

  it('only offers retry where retrying can actually work', () => {
    expect(describeError(withStatus(401)).canRetry).toBe(false);
    expect(describeError(withStatus(404)).canRetry).toBe(false);
    expect(describeError(withStatus(429)).canRetry).toBe(true);
    expect(describeError(withStatus(500)).canRetry).toBe(true);
  });

  it('takes the blame for a 5xx rather than implying user error', () => {
    expect(describeError(withStatus(500)).description).toMatch(/on us|not you/i);
  });

  it('prefers a useful server message on 404 and on unclassified errors', () => {
    expect(describeError(withStatus(404, 'Offer not found')).description).toBe('Offer not found');
    expect(describeError(withStatus(422, 'Price must be positive')).description).toBe(
      'Price must be positive'
    );
  });

  it('falls back to the supplied title when nothing else classifies', () => {
    expect(describeError(withStatus(418), "Couldn't load your orders").title).toBe(
      "Couldn't load your orders"
    );
  });

  it('always returns a renderable shape, even for null', () => {
    const d = describeError(null);
    expect(d.title).toBeTruthy();
    expect(d.description).toBeTruthy();
    expect(d.Icon).toBeTruthy();
  });
});
