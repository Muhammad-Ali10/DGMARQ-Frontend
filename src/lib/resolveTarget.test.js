import { describe, it, expect } from 'vitest';
import { resolveTarget } from './resolveTarget';

const url = (value) => resolveTarget({ type: 'url', value });

describe('resolveTarget url targets', () => {
  it('keeps same-site paths', () => {
    expect(url('/gift-cards')).toBe('/gift-cards');
    expect(url('/search?q=fifa')).toBe('/search?q=fifa');
  });

  it('refuses protocol-relative and backslash hosts that browsers treat as off-site', () => {
    expect(url('//evil.example')).toBeNull();
    expect(url('/\\evil.example')).toBeNull();
  });

  it('refuses absolute and scheme URLs', () => {
    expect(url('https://evil.example')).toBeNull();
    expect(url('javascript:alert(1)')).toBeNull();
  });
});
