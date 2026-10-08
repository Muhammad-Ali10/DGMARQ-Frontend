import { describe, expect, it } from 'vitest';
import { scorePassword } from './passwordPolicy';

describe('scorePassword', () => {
  it('scores an empty password as nothing met', () => {
    const result = scorePassword('');
    expect(result.score).toBe(0);
    expect(result.label).toBe('');
    expect(result.isValid).toBe(false);
  });

  it('treats a full-strength password as valid', () => {
    const result = scorePassword('Abcdef1!');
    expect(result.score).toBe(4);
    expect(result.label).toBe('Strong');
    expect(result.isValid).toBe(true);
  });

  it('rejects the exact password the old client accepted and the server refused', () => {
    const result = scorePassword('Abc123');
    expect(result.isValid).toBe(false);
    expect(result.met.length).toBe(false);
    expect(result.met.special).toBe(false);
  });

  it('rejects 8+ chars that are missing a special character', () => {
    expect(scorePassword('Abcdefg1').isValid).toBe(false);
  });

  it('rejects 8+ chars that are missing a digit', () => {
    expect(scorePassword('Abcdefg!').isValid).toBe(false);
  });

  it('rejects a password with no uppercase letter', () => {
    expect(scorePassword('abcdefg1!').isValid).toBe(false);
  });

  it('rejects a password with no lowercase letter', () => {
    expect(scorePassword('ABCDEFG1!').isValid).toBe(false);
  });

  it('counts a 7-character password as failing only the length rule', () => {
    const result = scorePassword('Abc12!x');
    expect(result.met.length).toBe(false);
    expect(result.met.case).toBe(true);
    expect(result.met.number).toBe(true);
    expect(result.met.special).toBe(true);
    expect(result.score).toBe(3);
    expect(result.firstUnmet.id).toBe('length');
  });

  it('accepts a space as a special character, matching the server regex', () => {
    expect(scorePassword('Abcdefg1 ').isValid).toBe(true);
  });
});
