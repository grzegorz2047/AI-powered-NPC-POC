import { describe, expect, it } from 'vitest';
import { prefersReducedMotion } from './motionPreferences';

describe('prefersReducedMotion', () => {
  it('returns true when the media query matches', () => {
    expect(prefersReducedMotion(() => ({ matches: true }))).toBe(true);
  });

  it('returns false when the media query does not match', () => {
    expect(prefersReducedMotion(() => ({ matches: false }))).toBe(false);
  });
});
