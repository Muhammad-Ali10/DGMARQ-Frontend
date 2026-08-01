import { describe, it, expect } from 'vitest';
import { describeError } from './ErrorState';

const withStatus = (status, message) => ({ response: { status, data: message ? { message } : {} } });

describe('describeError', () => {
  // The rule this whole module exists to enforce: never show a bare code.
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

  it('maps auth failures to an expired session', () => {
    expect(describeError(withStatus(401)).title).toMatch(/session/i);
    expect(describeError(withStatus(403)).title).toMatch(/session/i);
  });

  // Retrying a 401 or a 404 cannot help, so no retry button is offered.
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
